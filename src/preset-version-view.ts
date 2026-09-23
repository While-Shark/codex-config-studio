import {
  archivedPresetDescription, presetVersion, presetVersions, versionPresets,
  type PresetDefinition, type PresetReference,
} from './preset-versions.js';
import { presetVersionText } from './i18n/preset-versions.js';

type PresetText = (id: string, part: 'name' | 'badge' | 'description' | 'usage') => string;
export type PresetWorkspaceOptions = {
  current: readonly PresetDefinition[];
  viewedVersion: string;
  selectedVersion: string;
  selectedPreset: string;
  locale: string;
  busy: boolean;
  heading: { eyebrow: string; title: string; hint: string };
  text: PresetText;
  onVersion: (id: string) => void;
  onChoose: (reference: PresetReference) => void;
};
function esc(value: string): string {
  return value.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]!);
}
export function renderPresetWorkspace(host: HTMLElement, options: PresetWorkspaceOptions): void {
  const { current, viewedVersion, selectedVersion, selectedPreset, locale, busy, heading, text } = options;
  const copy = presetVersionText(locale);
  const version = presetVersion(viewedVersion);
  if (!version) throw new Error('Unknown preset version');
  const presets = versionPresets(current, viewedVersion);
  host.innerHTML = `<section class="card pane-card">
    <div class="section-heading"><div><span class="eyebrow">${esc(heading.eyebrow)}</span>
      <h2>${esc(heading.title)}</h2><p>${esc(heading.hint)}</p></div></div>
    <div class="preset-version-toolbar"><label for="presetVersion">${esc(copy.version)}</label>
      <select id="presetVersion" ${busy ? 'disabled' : ''}>
        ${presetVersions.map(item => `<option value="${esc(item.id)}"${item.id === viewedVersion ? ' selected' : ''}>${esc(`${item.label} · ${item.archived ? copy.archived : copy.current} · ${item.date}`)}</option>`).join('')}
      </select>
    </div>
    <div class="preset-version-notice ${version.archived ? 'archived' : ''}" role="note">
      <strong>${esc(version.family)}</strong><span>${esc(version.archived ? copy.archiveHelp : copy.currentHelp)}</span>
      ${version.archived ? `<span>${esc(copy.warning)}</span>` : ''}
    </div>
    <div class="preset-grid">${presets.map(preset => {
      const selected = selectedVersion === viewedVersion && selectedPreset === preset.id;
      const description = archivedPresetDescription(viewedVersion, locale, preset.id) ?? text(preset.id, 'description');
      return `<button type="button" class="preset-card ${selected ? 'selected' : ''}" data-preset="${esc(preset.id)}" data-write-action ${busy ? 'disabled' : ''}>
        <div class="preset-top"><strong>${esc(text(preset.id, 'name'))}</strong><span>${esc(version.archived ? copy.archived : text(preset.id, 'badge'))}</span></div>
        <p>${esc(description)}</p><small>${esc(text(preset.id, 'usage'))}</small>
        <small class="preset-model-ids">${esc(preset.values.model ?? '—')}${preset.values.defaultSubagentModel ? ` / ${esc(preset.values.defaultSubagentModel)}` : ''}</small>
      </button>`;
    }).join('')}</div>
  </section>`;
  host.querySelector<HTMLSelectElement>('#presetVersion')!.addEventListener('change', event => {
    const id = (event.currentTarget as HTMLSelectElement).value;
    if (!busy && presetVersion(id)) options.onVersion(id);
  });
  host.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(button => {
    button.addEventListener('click', () => {
      if (!busy) options.onChoose({ versionId: viewedVersion, presetId: button.dataset.preset! });
    });
  });
}

export function presetReferenceLabel(reference: PresetReference, locale: string, text: PresetText): string {
  const version = presetVersion(reference.versionId);
  const copy = presetVersionText(locale);
  return `${version?.archived ? copy.archivedSource : copy.source} · ${version?.label ?? reference.versionId} · ${text(reference.presetId, 'name')}`;
}
