export type OfficialModelCatalogEntry = {
  id: string;
  displayName: string;
  reasoningLevels: string[];
  defaultReasoningLevel: string | null;
  priority: number;
  minimalClientVersion: string | null;
};

export type OfficialModelCatalogState = {
  status: 'fresh' | 'stale' | 'unavailable';
  sourceUrl: string;
  fetchedAt: number | null;
  error: string | null;
};

export type OfficialModelCatalogResult = {
  entries: OfficialModelCatalogEntry[];
  state: OfficialModelCatalogState;
};

type CachedModelCatalog = {
  entries: OfficialModelCatalogEntry[];
  fetchedAt: number;
  sourceUrl: string;
};

const SOURCE_URL = 'https://raw.githubusercontent.com/openai/codex/main/codex-rs/models-manager/models.json';
const CACHE_KEY = 'codex-config-studio.official-model-catalog.v1';
const FRESH_MS = 24 * 60 * 60 * 1000;
const MAX_RESPONSE_BYTES = 1_500_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function parseReasoningLevels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const levels: string[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.effort !== 'string') continue;
    const effort = item.effort.trim();
    if (effort && !levels.includes(effort)) levels.push(effort);
  }
  return levels;
}

export function parseOfficialModelCatalog(value: unknown): OfficialModelCatalogEntry[] {
  if (!isRecord(value) || !Array.isArray(value.models)) return [];
  const byId = new Map<string, OfficialModelCatalogEntry>();

  for (const raw of value.models) {
    if (!isRecord(raw) || raw.visibility !== 'list' || typeof raw.slug !== 'string') continue;
    const id = raw.slug.trim();
    if (!id) continue;
    const priority = typeof raw.priority === 'number' && Number.isFinite(raw.priority)
      ? raw.priority
      : Number.MAX_SAFE_INTEGER;
    const entry: OfficialModelCatalogEntry = {
      id,
      displayName: typeof raw.display_name === 'string' && raw.display_name.trim()
        ? raw.display_name.trim()
        : id,
      reasoningLevels: parseReasoningLevels(raw.supported_reasoning_levels),
      defaultReasoningLevel: typeof raw.default_reasoning_level === 'string' && raw.default_reasoning_level.trim()
        ? raw.default_reasoning_level.trim()
        : null,
      priority,
      minimalClientVersion: typeof raw.minimal_client_version === 'string' && raw.minimal_client_version.trim()
        ? raw.minimal_client_version.trim()
        : null,
    };
    const existing = byId.get(id);
    if (!existing || entry.priority < existing.priority) byId.set(id, entry);
  }

  return [...byId.values()].sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
}

function validCachedEntry(value: unknown): value is OfficialModelCatalogEntry {
  return isRecord(value)
    && typeof value.id === 'string'
    && value.id.trim().length > 0
    && typeof value.displayName === 'string'
    && Array.isArray(value.reasoningLevels)
    && value.reasoningLevels.every(level => typeof level === 'string')
    && (value.defaultReasoningLevel === undefined || value.defaultReasoningLevel === null || typeof value.defaultReasoningLevel === 'string')
    && typeof value.priority === 'number'
    && Number.isFinite(value.priority)
    && (value.minimalClientVersion === null || typeof value.minimalClientVersion === 'string');
}

export function readCachedOfficialModelCatalog(): CachedModelCatalog | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedModelCatalog>;
    if (
      typeof parsed.fetchedAt !== 'number'
      || !Number.isFinite(parsed.fetchedAt)
      || parsed.sourceUrl !== SOURCE_URL
      || !Array.isArray(parsed.entries)
      || !parsed.entries.every(validCachedEntry)
      || parsed.entries.length === 0
    ) return null;
    return {
      entries: parsed.entries.map(entry => ({
        ...entry,
        defaultReasoningLevel: entry.defaultReasoningLevel ?? null,
      })),
      fetchedAt: parsed.fetchedAt,
      sourceUrl: SOURCE_URL,
    };
  } catch {
    return null;
  }
}

function writeCache(value: CachedModelCatalog): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    // The live catalog is still usable for this session when storage is unavailable.
  }
}

async function fetchCatalog(): Promise<OfficialModelCatalogEntry[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(SOURCE_URL, {
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (text.length > MAX_RESPONSE_BYTES) throw new Error('model catalog too large');
    const entries = parseOfficialModelCatalog(JSON.parse(text));
    if (entries.length === 0) throw new Error('official model catalog contained no visible models');
    return entries;
  } finally {
    clearTimeout(timer);
  }
}

export function mergeModelCatalogIds(
  fallbackModels: readonly string[],
  officialEntries: readonly OfficialModelCatalogEntry[],
): string[] {
  const result: string[] = [];
  for (const entry of officialEntries) {
    const id = entry.id.trim();
    if (id && !result.includes(id)) result.push(id);
  }
  for (const fallback of fallbackModels) {
    const id = fallback.trim();
    if (id && !result.includes(id)) result.push(id);
  }
  return result;
}

export function reasoningLevelsForModel(
  model: string | null | undefined,
  officialEntries: readonly OfficialModelCatalogEntry[],
  fallbackLevels: readonly string[],
): string[] {
  const id=model?.trim();
  if(!id)return [...fallbackLevels];
  const entry=officialEntries.find(item=>item.id===id);
  if(!entry||entry.reasoningLevels.length===0)return [...fallbackLevels];
  return [...entry.reasoningLevels];
}

type ComparableVersion = {
  core: number[];
  prerelease: Array<number | string> | null;
};

function parseComparableVersion(value: string): ComparableVersion | null {
  const match=value.trim().replace(/^v/i,'').match(/^(\d+(?:\.\d+)*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/);
  if(!match)return null;
  const core=match[1].split('.').map(part=>Number(part));
  if(core.some(part=>!Number.isSafeInteger(part)||part<0))return null;
  const prerelease=match[2]
    ? match[2].split('.').map(part=>/^\d+$/.test(part)?Number(part):part.toLowerCase())
    : null;
  return{core,prerelease};
}

function comparePrerelease(left:Array<number|string>|null,right:Array<number|string>|null):number {
  if(left===null&&right===null)return 0;
  if(left===null)return 1;
  if(right===null)return -1;
  const length=Math.max(left.length,right.length);
  for(let i=0;i<length;i++){
    const a=left[i],b=right[i];
    if(a===undefined)return -1;
    if(b===undefined)return 1;
    if(a===b)continue;
    if(typeof a==='number'&&typeof b==='number')return a<b?-1:1;
    if(typeof a==='number')return -1;
    if(typeof b==='number')return 1;
    return a<b?-1:1;
  }
  return 0;
}

/** Compare Codex CLI versions without guessing when the runtime string is not semver-like. */
export function compareCodexVersions(left:string|null|undefined,right:string|null|undefined):number|null {
  if(!left||!right)return null;
  const a=parseComparableVersion(left),b=parseComparableVersion(right);
  if(!a||!b)return null;
  const length=Math.max(a.core.length,b.core.length);
  for(let i=0;i<length;i++){
    const av=a.core[i]??0,bv=b.core[i]??0;
    if(av!==bv)return av<bv?-1:1;
  }
  return comparePrerelease(a.prerelease,b.prerelease);
}

export type ModelClientCompatibility = {
  model: string;
  installedVersion: string;
  minimalClientVersion: string;
  status: 'compatible' | 'too-old' | 'unknown';
};

export function modelClientCompatibility(
  model:string|null|undefined,
  installedVersion:string|null|undefined,
  officialEntries:readonly OfficialModelCatalogEntry[],
):ModelClientCompatibility|null {
  const id=model?.trim();
  if(!id||!installedVersion)return null;
  const entry=officialEntries.find(item=>item.id===id);
  const minimum=entry?.minimalClientVersion?.trim();
  if(!minimum)return null;
  const comparison=compareCodexVersions(installedVersion,minimum);
  return{
    model:id,
    installedVersion,
    minimalClientVersion:minimum,
    status:comparison===null?'unknown':comparison<0?'too-old':'compatible',
  };
}

export function reconcileReasoningLevelForModel(
  model: string | null | undefined,
  current: string | null,
  officialEntries: readonly OfficialModelCatalogEntry[],
  preserveUnset = false,
): string | null {
  if (current === null && preserveUnset) return null;
  const id = model?.trim();
  if (!id) return current;
  const entry = officialEntries.find(item => item.id === id);
  if (!entry || entry.reasoningLevels.length === 0) return current;
  if (current && entry.reasoningLevels.includes(current)) return current;
  if (entry.defaultReasoningLevel && entry.reasoningLevels.includes(entry.defaultReasoningLevel)) {
    return entry.defaultReasoningLevel;
  }
  return entry.reasoningLevels[0] ?? current;
}

export async function loadOfficialModelCatalog(force = false): Promise<OfficialModelCatalogResult> {
  const cached = readCachedOfficialModelCatalog();
  const age = cached ? Date.now() - cached.fetchedAt : Number.POSITIVE_INFINITY;
  if (!force && cached && age <= FRESH_MS) {
    return {
      entries: cached.entries,
      state: {
        status: 'fresh',
        sourceUrl: SOURCE_URL,
        fetchedAt: cached.fetchedAt,
        error: null,
      },
    };
  }

  try {
    const entries = await fetchCatalog();
    const fetchedAt = Date.now();
    writeCache({ entries, fetchedAt, sourceUrl: SOURCE_URL });
    return {
      entries,
      state: {
        status: 'fresh',
        sourceUrl: SOURCE_URL,
        fetchedAt,
        error: null,
      },
    };
  } catch (error) {
    if (cached) {
      return {
        entries: cached.entries,
        state: {
          status: 'stale',
          sourceUrl: SOURCE_URL,
          fetchedAt: cached.fetchedAt,
          error: String(error),
        },
      };
    }
    return {
      entries: [],
      state: {
        status: 'unavailable',
        sourceUrl: SOURCE_URL,
        fetchedAt: null,
        error: String(error),
      },
    };
  }
}

export const OFFICIAL_MODEL_CATALOG_SOURCE = SOURCE_URL;
