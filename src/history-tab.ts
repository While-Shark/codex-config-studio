import { workspaceText } from './i18n/workspace.js';
export type HistoryCopy = {
  tab: string; search: string; noMatches: string; remove: string;
  confirmTitle: string; confirmBody: string; deleted: string; loadFailed: string;
};
const copies: Record<string, HistoryCopy> = {
  'zh-CN': {
    tab: '历史记录', search: '搜索项目、路径或模型', noMatches: '没有匹配的历史记录', remove: '删除记录',
    confirmTitle: '删除这条历史记录？',
    confirmBody: '只删除此历史条目，不会修改项目配置或任何备份。删除后不能再从历史列表恢复此记录。',
    deleted: '历史记录已删除', loadFailed: '历史记录加载失败，请刷新重试。',
  },
  'zh-TW': {
    tab: '歷史記錄', search: '搜尋專案、路徑或模型', noMatches: '沒有符合的歷史記錄', remove: '刪除記錄',
    confirmTitle: '刪除這筆歷史記錄？',
    confirmBody: '只刪除此歷史項目，不會修改專案設定或任何備份。刪除後無法再從歷史清單還原此記錄。',
    deleted: '歷史記錄已刪除', loadFailed: '歷史記錄載入失敗，請重新整理。',
  },
  en: {
    tab: 'History', search: 'Search project, path, or model', noMatches: 'No matching history entries',
    remove: 'Delete record', confirmTitle: 'Delete this history entry?',
    confirmBody: 'Only this history entry will be deleted. Project configuration and all backup files are kept. This entry will no longer be available for restoration from the history list.',
    deleted: 'History entry deleted', loadFailed: 'Could not load history. Refresh to try again.',
  },
  ja: {
    tab: '履歴', search: 'プロジェクト・パス・モデルを検索', noMatches: '一致する履歴はありません', remove: '履歴を削除',
    confirmTitle: 'この履歴を削除しますか？',
    confirmBody: 'この履歴だけを削除します。プロジェクト設定とバックアップは変更しません。削除後は履歴一覧から復元できません。',
    deleted: '履歴を削除しました', loadFailed: '履歴を読み込めません。再読み込みしてください。',
  },
  ko: {
    tab: '기록', search: '프로젝트, 경로, 모델 검색', noMatches: '일치하는 기록이 없습니다', remove: '기록 삭제',
    confirmTitle: '이 기록을 삭제할까요?',
    confirmBody: '이 기록만 삭제합니다. 프로젝트 설정과 백업 파일은 변경하지 않습니다. 삭제 후에는 기록 목록에서 복원할 수 없습니다.',
    deleted: '기록을 삭제했습니다', loadFailed: '기록을 불러오지 못했습니다. 새로고침해 주세요.',
  },
};
export function historyText(locale: string): HistoryCopy { return copies[locale] ?? copies.en; }
export type HistoryListEntry = {
  id: string; timestampMs: number; scopeKind: 'global' | 'project'; projectPath: string | null;
  configPath: string; action: string; source: string | null;
  values: { model: string | null; modelReasoningEffort: string | null };
};
export function filterHistoryEntries<T extends HistoryListEntry>(entries: readonly T[], query: string): T[] {
  const needle = query.trim().toLocaleLowerCase();
  return entries.filter(entry => !needle || [entry.projectPath, entry.configPath, entry.values.model,
    entry.values.modelReasoningEffort].some(value => value?.toLocaleLowerCase().includes(needle)));
}
export function escapeHistoryText(value: string): string {
  return value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]!);
}
export function renderHistoryEntries(
  entries: readonly HistoryListEntry[],
  copy: HistoryCopy,
  labels: { restore: string; global: string; project: string },
  format: { projectName: (path: string | null) => string; time: (ms: number) => string; source: (source: string) => string },
  disabled = false,
): string {
  const esc = escapeHistoryText;
  const locale=Object.keys(copies).find(key=>copies[key]===copy) ?? 'en';
  const ui=workspaceText(locale);
  return entries.map(entry => `<article class="history-item" data-history-entry="${esc(entry.id)}">
    <div class="history-main"><div><strong>${esc(format.projectName(entry.projectPath))}</strong>
    <span>${esc(format.time(entry.timestampMs))} &middot; ${esc(format.source(entry.source ?? entry.action))}</span></div>
    <span class="history-scope">${esc(entry.scopeKind === 'global' ? labels.global : labels.project)}</span></div>
    <p class="history-model">${esc(entry.values.model ?? '\u2014')} &middot; ${esc(entry.values.modelReasoningEffort ?? '\u2014')}</p>
    <div class="history-path" title="${esc(entry.configPath)}">${esc(entry.configPath)}</div>
    <div class="history-actions"><button class="button secondary" data-preview-history-id="${esc(entry.id)}" ${disabled ? 'disabled' : ''}>${esc(ui.historyPreview)}</button><button class="button secondary" data-write-action data-history-id="${esc(entry.id)}" ${disabled ? 'disabled' : ''}>${esc(labels.restore)}</button>
    <button class="button danger-ghost" data-write-action data-delete-history-id="${esc(entry.id)}" ${disabled ? 'disabled' : ''}>${esc(copy.remove)}</button></div>
  </article>`).join('');
}
