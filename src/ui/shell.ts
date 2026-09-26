import { getLocale, localeOptions, t } from '../i18n';
import { workspaceText } from '../i18n/workspace';
import { historyText } from '../history-tab';
import { previewText } from '../i18n/preview';
import { escapeHtml as esc, icon } from './icons';

export type ShellOptions = { projectPath: string; accent: string };
/** Presentation only: configuration commands stay in the application controller. */
export function renderShell({ projectPath, accent }: ShellOptions): string {
  const copy = workspaceText(getLocale());
  const tabs = [
    ['presets', 'grid', t('tab.presets')], ['task', 'bolt', t('tab.task')],
    ['advanced', 'sliders', t('tab.advanced')], ['history', 'history', historyText(getLocale()).tab],
  ] as const;
  return `<div class="app-shell">
    <header class="topbar" id="appHeader">
      <div class="brand"><div class="logo">${icon('studio')}</div><div><h1>Codex Config Studio</h1><p>${t('app.subtitle')}</p></div></div>
      <div class="top-actions">
        <span id="saveState" class="status-pill" role="status"></span>
        <label class="compact-select language-select">${icon('globe')}<span class="sr-only">${t('language.label')}</span><select id="languageSelect">${localeOptions.map(x => `<option value="${x.value}" ${x.value === getLocale() ? 'selected' : ''}>${x.label}</option>`).join('')}</select></label>
        <details class="popover appearance-panel"><summary title="${esc(copy.appearance)}" aria-label="${esc(copy.appearance)}">${icon('sliders')}</summary><div class="popover-content"><h3>${copy.appearance}</h3>
          <label class="compact-select"><span>${t('theme.mode')}</span><select id="themeMode"><option value="system">${t('theme.system')}</option><option value="light">${t('theme.light')}</option><option value="dark">${t('theme.dark')}</option></select></label>
          <span class="control-label">${t('theme.accent')}</span><div class="accent-picker">${['violet','blue','emerald','amber','rose'].map(a => `<button class="accent-dot ${accent === a ? 'active' : ''}" data-accent="${a}" aria-label="${a}" aria-pressed="${accent === a}"></button>`).join('')}</div>
        </div></details>
      </div>
    </header>
    <main class="workspace" id="appWorkspace">
      <section class="left-pane">
        <div class="workspace-heading"><div><span class="eyebrow">CODEX / STUDIO</span><h2>${copy.title}</h2><p>${copy.subtitle}</p></div>
          <details class="guide"><summary>${icon('info')}${copy.guide}</summary><div class="guide-content"><strong>${t('guide.title')}</strong><p>${t('guide.description')}</p><ol><li>${t('guide.scope')}</li><li>${t('guide.choose')}</li><li>${t('guide.review')}</li><li>${t('guide.apply')}</li></ol><p>${copy.noWrite}</p></div></details>
        </div>
        <div class="tabs" role="tablist" aria-label="${esc(copy.title)}">${tabs.map(([tab, glyph, label]) => `<button id="tab-${tab}" type="button" role="tab" aria-controls="leftContent" aria-selected="false" tabindex="-1" data-tab="${tab}">${icon(glyph)}<span>${label}</span></button>`).join('')}</div>
        <section id="leftContent" class="left-content" role="tabpanel" tabindex="0"></section>
        <div class="workspace-footnote">${icon('shield')}<span>${copy.safety}</span></div>
      </section>
      <aside class="right-pane" aria-label="${esc(t('rail.review.title'))}">
        <section class="scope-card">
          <div class="rail-title"><h3>${icon('folder')}${t('rail.scope.title')}</h3><span id="busyIndicator" class="busy-indicator hidden"></span></div>
          <div class="segmented" aria-label="${esc(t('section.scope.eyebrow'))}"><button class="scope-tab" data-scope="global">${icon('globe')}${t('scope.global')}</button><button class="scope-tab" data-scope="project">${icon('folder')}${t('scope.project')}</button></div>
          <div id="projectPicker" class="project-picker hidden"><input id="projectPath" aria-label="${esc(t('scope.projectPlaceholder'))}" placeholder="${esc(t('scope.projectPlaceholder'))}" value="${esc(projectPath)}"><button id="chooseProject" class="button secondary" aria-label="${esc(t('scope.chooseFolder'))}" title="${esc(t('scope.chooseFolder'))}">${icon('folder')}</button></div>
          <details class="scope-details"><summary><span id="scopeLabel"></span>${icon('chevron')}</summary><div class="path-block"><code id="configPath"></code></div><p id="scopeNotice" class="rail-help"></p></details>
          <p id="createNotice" class="create-notice hidden">${copy.autoCreate}</p>
        </section>
        <section id="healthCard" class="health-card" aria-live="polite"></section>
        <section id="integrityCard" class="integrity-card" aria-live="polite"></section>
        <section class="review-card">
          <div class="rail-title"><h3>${previewText(getLocale()).title}</h3><span id="changeCount" class="count-badge">0</span></div>
          <p id="previewSummary" class="rail-help" aria-live="polite"></p>
          <p id="presetOrigin" class="preset-origin hidden" role="status"></p>
          <div id="changeList" class="change-list"></div>
        </section>
        <footer class="apply-dock">
          <div id="applyResult" class="apply-result hidden" role="status"></div>
          <details class="safety-details"><summary>${icon('shield')}<span>${t('rail.safety.title')}</span>${icon('chevron')}</summary><p>${t('rail.safety.body')}</p><p>${copy.inheritHelp}</p></details>
          <button id="applyBtn" data-write-action class="button primary wide"><span>${t('action.apply')}</span>${icon('arrow')}</button>
          <div class="rail-secondary"><button id="reloadBtn" class="text-button">${icon('history')}${t('action.reload')}</button>
            <details class="popover operations-panel"><summary>${icon('more')}${copy.more}</summary><div class="popover-content">
              <button id="clearBtn" data-write-action class="button danger-ghost">${t('action.clear')}</button>
              <button id="restoreBtn" data-write-action class="button danger-ghost">${t('action.restore')}</button>
            </div></details>
          </div>
        </footer>
      </aside>
    </main>
    <div id="confirmModal" class="modal-backdrop hidden"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirmTitle" aria-describedby="confirmMessage" tabindex="-1"><div class="modal-head"><div><span class="eyebrow">${t('confirm.eyebrow')}</span><h3 id="confirmTitle"></h3></div><button id="confirmClose" class="icon-button" aria-label="${esc(copy.close)}">${icon('close')}</button></div><p id="confirmMessage"></p><div id="confirmDetail" class="modal-detail hidden"></div><div id="confirmChanges" class="modal-changes"></div><label class="confirm-check"><input id="confirmCheckbox" type="checkbox"><span>${t('confirm.checkbox')}</span></label><p class="modal-hint">${copy.keepDraft}</p><div class="modal-actions"><button id="confirmCancel" class="button secondary">${t('confirm.cancel')}</button><button id="confirmOk" class="button primary" disabled></button></div></div></div>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>
  </div>`;
}
