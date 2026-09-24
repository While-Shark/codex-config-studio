import { invoke } from '@tauri-apps/api/core';

export type ScopeKind = 'global' | 'project';
export type ConfigInspection = {
  scopeKind: ScopeKind;
  projectPath: string | null;
  path: string;
  exists: boolean;
  validToml: boolean;
  keyPaths: string[][];
  managedFieldCount: number;
  parseError: string | null;
};
export type HealthIssue = {
  scopeKind: ScopeKind;
  configPath: string;
  keyPath: string[];
  keyLabel: string;
  severity: 'warning' | 'info';
  removable: boolean;
  reason: 'unknown';
};
export type SchemaState = {
  status: 'fresh' | 'stale' | 'unavailable';
  sourceUrl: string | null;
  fetchedAt: number | null;
  error: string | null;
  canWarnUnknown: boolean;
};
export type ConfigHealthState = {
  global: ConfigInspection | null;
  project: ConfigInspection | null;
  issues: HealthIssue[];
  schema: SchemaState;
};

type CachedSchema = { schema: unknown; fetchedAt: number; sourceUrl: string };

const CACHE_KEY = 'codex-config-studio.official-config-schema.v1';
const FRESH_MS = 7 * 24 * 60 * 60 * 1000;
const WARN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const SCHEMA_URLS = [
  'https://developers.openai.com/codex/config-schema.json',
  'https://raw.githubusercontent.com/openai/codex/main/codex-rs/core/config.schema.json',
] as const;

function readCache(): CachedSchema | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSchema;
    if (!parsed || typeof parsed.fetchedAt !== 'number' || typeof parsed.sourceUrl !== 'string') return null;
    if (!isSchemaDocument(parsed.schema)) return null;
    return parsed;
  } catch {
    return null;
  }
}
function writeCache(value: CachedSchema): void {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(value)); } catch { /* cache is optional */ }
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function isSchemaDocument(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && isRecord(value.properties) && isRecord(value.definitions);
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal, redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (text.length > 2_000_000) throw new Error('schema too large');
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

export async function loadOfficialSchema(force = false): Promise<{ schema: unknown | null; state: SchemaState }> {
  const cached = readCache();
  const age = cached ? Date.now() - cached.fetchedAt : Number.POSITIVE_INFINITY;
  if (!force && cached && age <= FRESH_MS) {
    return {
      schema: cached.schema,
      state: { status: 'fresh', sourceUrl: cached.sourceUrl, fetchedAt: cached.fetchedAt, error: null, canWarnUnknown: true },
    };
  }

  let lastError = '';
  for (const url of SCHEMA_URLS) {
    try {
      const schema = await fetchJson(url);
      if (!isSchemaDocument(schema)) throw new Error('invalid schema document');
      const fetchedAt = Date.now();
      writeCache({ schema, fetchedAt, sourceUrl: url });
      return {
        schema,
        state: { status: 'fresh', sourceUrl: url, fetchedAt, error: null, canWarnUnknown: true },
      };
    } catch (error) {
      lastError = String(error);
    }
  }

  if (cached) {
    const cachedAge = Date.now() - cached.fetchedAt;
    return {
      schema: cached.schema,
      state: {
        status: 'stale',
        sourceUrl: cached.sourceUrl,
        fetchedAt: cached.fetchedAt,
        error: lastError || 'refresh failed',
        canWarnUnknown: cachedAge <= WARN_MAX_AGE_MS,
      },
    };
  }
  return {
    schema: null,
    state: { status: 'unavailable', sourceUrl: null, fetchedAt: null, error: lastError || 'schema unavailable', canWarnUnknown: false },
  };
}

function decodePointer(value: string): string {
  return value.replace(/~1/g, '/').replace(/~0/g, '~');
}
function dereference(root: Record<string, unknown>, node: unknown, seen = new Set<string>()): unknown {
  let current = node;
  while (isRecord(current) && typeof current.$ref === 'string' && current.$ref.startsWith('#/')) {
    const ref = current.$ref;
    if (seen.has(ref)) return current;
    seen.add(ref);
    let next: unknown = root;
    for (const raw of ref.slice(2).split('/')) {
      if (!isRecord(next)) return current;
      next = next[decodePointer(raw)];
    }
    current = next;
  }
  return current;
}
type ChildResolution = { allowed: boolean; open: boolean; nodes: unknown[] };

function resolveChild(root: Record<string, unknown>, node: unknown, key: string): ChildResolution {
  const resolved = dereference(root, node);
  if (!isRecord(resolved)) return { allowed: true, open: true, nodes: [] };

  if (resolved.type === 'array' && resolved.items !== undefined) {
    return resolveChild(root, resolved.items, key);
  }

  const unions = ['allOf', 'anyOf', 'oneOf'] as const;
  for (const union of unions) {
    const variants = resolved[union];
    if (Array.isArray(variants)) {
      const results = variants.map(item => resolveChild(root, item, key)).filter(item => item.allowed);
      if (results.length) {
        return {
          allowed: true,
          open: results.some(item => item.open),
          nodes: results.flatMap(item => item.nodes),
        };
      }
      if (union !== 'allOf') return { allowed: false, open: false, nodes: [] };
    }
  }

  const properties = isRecord(resolved.properties) ? resolved.properties : null;
  if (properties && Object.prototype.hasOwnProperty.call(properties, key)) {
    return { allowed: true, open: false, nodes: [properties[key]] };
  }

  const patterns = isRecord(resolved.patternProperties) ? resolved.patternProperties : null;
  if (patterns) {
    const matches: unknown[] = [];
    for (const [pattern, child] of Object.entries(patterns)) {
      try { if (new RegExp(pattern).test(key)) matches.push(child); } catch { /* ignore malformed schema regex */ }
    }
    if (matches.length) return { allowed: true, open: false, nodes: matches };
  }

  if (resolved.additionalProperties === false) return { allowed: false, open: false, nodes: [] };
  if (isRecord(resolved.additionalProperties)) {
    return { allowed: true, open: false, nodes: [resolved.additionalProperties] };
  }
  return { allowed: true, open: true, nodes: [] };
}

export function schemaAllowsPath(schema: unknown, keyPath: string[]): boolean {
  if (!isSchemaDocument(schema)) return true;
  let states: unknown[] = [schema];
  for (const key of keyPath) {
    const next: unknown[] = [];
    let open = false;
    let allowed = false;
    for (const state of states) {
      const result = resolveChild(schema, state, key);
      if (!result.allowed) continue;
      allowed = true;
      if (result.open) open = true;
      next.push(...result.nodes);
    }
    if (!allowed) return false;
    if (open && next.length === 0) return true;
    states = next.length ? next : states;
  }
  return true;
}

function issuesForInspection(inspection: ConfigInspection | null, schema: unknown, canWarnUnknown: boolean): HealthIssue[] {
  if (!inspection || !inspection.exists || !inspection.validToml || !schema || !canWarnUnknown) return [];
  const issues: HealthIssue[] = [];
  for (const keyPath of inspection.keyPaths) {
    if (schemaAllowsPath(schema, keyPath)) continue;
    // Only report the most specific unknown key. If a parent is already unknown,
    // its descendants are implementation details and would create duplicate warnings.
    if (issues.some(issue => keyPath.length > issue.keyPath.length && issue.keyPath.every((part, i) => keyPath[i] === part))) continue;
    issues.push({
      scopeKind: inspection.scopeKind,
      configPath: inspection.path,
      keyPath,
      keyLabel: keyPath.join('.'),
      severity: 'warning',
      removable: true,
      reason: 'unknown',
    });
  }
  return issues;
}

export async function inspectHealth(projectPath: string, forceSchema = false): Promise<ConfigHealthState> {
  const schemaPromise = loadOfficialSchema(forceSchema);
  const globalPromise = invoke<ConfigInspection>('inspect_config', { scope: { kind: 'global', projectPath: null } });
  const projectPromise = projectPath
    ? invoke<ConfigInspection>('inspect_config', { scope: { kind: 'project', projectPath } })
    : Promise.resolve<ConfigInspection | null>(null);
  const [{ schema, state }, global, project] = await Promise.all([schemaPromise, globalPromise, projectPromise]);
  return {
    global,
    project,
    schema: state,
    issues: [
      ...issuesForInspection(global, schema, state.canWarnUnknown),
      ...issuesForInspection(project, schema, state.canWarnUnknown),
    ],
  };
}
