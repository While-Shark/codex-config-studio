import { icon, escapeHtml as esc } from './icons';
import type { WorkspaceCopy } from '../i18n/workspace';
/** The two groups share the exact original form controls and IPC fields. */
export function advancedLayout(basic: string, agents: string, copy: WorkspaceCopy): string {
  return `<div class="settings-groups">
    <section class="settings-group"><h3>${icon('sliders')}${esc(copy.primary)}</h3><div class="form-grid">${basic}</div>
      <details class="inherit-guide"><summary>${icon('info')}${esc(copy.inheritTitle)}</summary><p>${esc(copy.inheritHelp)}</p></details>
    </section>
    <section class="settings-group"><h3>${icon('bot')}${esc(copy.agents)}</h3><div class="form-grid">${agents}</div></section>
    <div class="readonly-safety">${icon('shield')}<span>${esc(copy.safety)}</span></div>
  </div>`;
}
