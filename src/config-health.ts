import { invoke } from '@tauri-apps/api/core';
import { loadOfficialSchema, readSchemaChangeReport, schemaAllowsPath, type SchemaChangeReport, type SchemaState } from './config-schema';

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
export type CodexRuntimeInfo = {
  installed: boolean;
  version: string | null;
  rawVersion: string | null;
  launcher: string | null;
  error: string | null;
};
export type ConfigHealthState = {
  global: ConfigInspection | null;
  project: ConfigInspection | null;
  issues: HealthIssue[];
  schema: SchemaState;
  schemaChanges: SchemaChangeReport | null;
  runtime: CodexRuntimeInfo | null;
};

function issuesForInspection(inspection: ConfigInspection | null, schema: unknown, canWarnUnknown: boolean): HealthIssue[] {
  if (!inspection || !inspection.exists || !inspection.validToml || !schema || !canWarnUnknown) return [];
  const issues: HealthIssue[] = [];
  for (const keyPath of inspection.keyPaths) {
    if (schemaAllowsPath(schema, keyPath)) continue;
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
  const runtimePromise = invoke<CodexRuntimeInfo>('get_codex_runtime_info', {}).catch(() => null);
  const [{ schema, state }, global, project, runtime] = await Promise.all([schemaPromise, globalPromise, projectPromise, runtimePromise]);
  return {
    global,
    project,
    schema: state,
    schemaChanges: readSchemaChangeReport(),
    runtime,
    issues: [
      ...issuesForInspection(global, schema, state.canWarnUnknown),
      ...issuesForInspection(project, schema, state.canWarnUnknown),
    ],
  };
}
