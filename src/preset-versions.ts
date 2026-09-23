import { legacyPresetSnapshot } from './presets/legacy-v0.4.0.js';

export type PresetValues = {
  model: string | null;
  modelReasoningEffort: string | null;
  planModeReasoningEffort: string | null;
  agentsEnabled: boolean | null;
  defaultSubagentModel: string | null;
  defaultSubagentReasoningEffort: string | null;
  maxConcurrentThreadsPerSession: number | null;
};
export type PresetDefinition = { id: string; values: PresetValues };
export type PresetReference = { versionId: string; presetId: string };
export type PresetVersion = {
  id: string; label: string; date: string; archived: boolean; family: string;
};
export const CURRENT_PRESET_VERSION = 'gpt6-2026-09-23';
export const LEGACY_PRESET_VERSION = 'legacy-v0.4.0';

/** Append new revisions; never edit the snapshots already shipped to users. */
export const presetVersions: readonly Readonly<PresetVersion>[] = Object.freeze([
  Object.freeze({ id: CURRENT_PRESET_VERSION, label: 'GPT-6', date: '2026-09-23', archived: false, family: 'GPT-6 Luna / Sol / Astra' }),
  Object.freeze({ id: LEGACY_PRESET_VERSION, label: 'v0.4.0', date: '2026-09-21', archived: true, family: 'GPT-5.6 Luna / Terra / Sol · GPT-6 Astra' }),
]);

export function presetVersion(id: string): Readonly<PresetVersion> | undefined {
  return presetVersions.find(version => version.id === id);
}
export function versionPresets(current: readonly PresetDefinition[], versionId: string): readonly PresetDefinition[] {
  if (versionId === CURRENT_PRESET_VERSION) return current;
  if (versionId === LEGACY_PRESET_VERSION) return legacyPresetSnapshot.presets;
  throw new Error(`Unknown preset version: ${versionId}`);
}
export function presetByReference(current: readonly PresetDefinition[], reference: PresetReference): PresetDefinition | undefined {
  if (!presetVersion(reference.versionId)) return undefined;
  return versionPresets(current, reference.versionId).find(preset => preset.id === reference.presetId);
}
export function matchPresetVersion(current: readonly PresetDefinition[], values: PresetValues): PresetReference | null {
  for (const version of presetVersions) {
    const match = versionPresets(current, version.id).find(preset =>
      (Object.keys(preset.values) as (keyof PresetValues)[]).every(field => preset.values[field] === values[field]));
    if (match) return { versionId: version.id, presetId: match.id };
  }
  return null;
}

/** Archived descriptions must not change when translations of the current presets change. */
export function archivedPresetDescription(versionId: string, locale: string, presetId: string): string | undefined {
  if (versionId !== LEGACY_PRESET_VERSION) return undefined;
  const descriptions = legacyPresetSnapshot.descriptions as Record<string, Record<string, string>>;
  return (descriptions[locale] ?? descriptions.en)?.[presetId];
}
export function presetSource(reference: PresetReference | null): string {
  return reference ? `preset/${reference.versionId}/${reference.presetId}` : 'manual';
}
export function parsePresetSource(source: string, current: readonly PresetDefinition[]): PresetReference | null {
  const match = /^preset\/([^/]+)\/([^/]+)$/.exec(source);
  if (!match) return null;
  const reference = { versionId: match[1], presetId: match[2] };
  return presetByReference(current, reference) ? reference : null;
}
