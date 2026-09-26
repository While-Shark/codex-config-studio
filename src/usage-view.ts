import { icon } from './ui/icons';
import { formatTokens, summarizeUsage, usageText, type UsagePeriod, type UsageReport } from './usage-dashboard';

export type UsageViewOptions = {
  locale: string;
  scope: 'global' | 'project';
  projectPath: string;
  period: UsagePeriod;
  report: UsageReport | null;
  loading: boolean;
  error: string;
  onPeriod: (period: UsagePeriod) => void;
  onRefresh: () => void;
};

const esc = (value: string) => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

function percent(value: number, total: number): string {
  return total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
}

function dateLabel(value: string, locale: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat(locale, {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function toolbar(copy: ReturnType<typeof usageText>, period: UsagePeriod): string {
  const items: Array<[UsagePeriod,string]> = [['7d',copy.sevenDays],['30d',copy.thirtyDays],['all',copy.allTime]];
  return '<div class="usage-toolbar"><div class="usage-periods" role="group">' +
    items.map(([id,label]) => '<button data-usage-period="' + id + '" class="' + (period===id?'active':'') + '" aria-pressed="' + String(period===id) + '">' + esc(label) + '</button>').join('') +
    '</div><button id="refreshUsage" class="button secondary">' + esc(copy.refresh) + '</button></div>';
}

export function renderUsageView(host: HTMLElement, options: UsageViewOptions): void {
  const copy = usageText(options.locale);
  const head = '<div class="section-heading"><div><h2>' + esc(copy.title) + '</h2><p>' + esc(copy.subtitle) + '</p></div></div>' + toolbar(copy, options.period);

  if (options.scope !== 'project' || !options.projectPath) {
    host.innerHTML = '<section class="usage-workspace">' + head + '<div class="empty-state">' + esc(copy.selectProject) + '</div></section>';
    bind(host, options);
    return;
  }
  if (options.loading) {
    host.innerHTML = '<section class="usage-workspace">' + head + '<div class="empty-state">' + esc(copy.loading) + '</div></section>';
    bind(host, options);
    return;
  }
  if (options.error) {
    host.innerHTML = '<section class="usage-workspace">' + head + '<div class="usage-warning">' + esc(options.error) + '</div></section>';
    bind(host, options);
    return;
  }
  if (!options.report || options.report.sessions.length === 0) {
    host.innerHTML = '<section class="usage-workspace">' + head + '<div class="empty-state">' + esc(copy.empty) + '</div><p class="readonly-safety">' + icon('info') + '<span>' + esc(copy.dataNote) + '</span></p></section>';
    bind(host, options);
    return;
  }

  const report = options.report;
  const summary = summarizeUsage(report);
  const metrics = [
    [copy.totalTokens, formatTokens(summary.usage.totalTokens), copy.input + ' ' + formatTokens(summary.usage.inputTokens) + ' · ' + copy.output + ' ' + formatTokens(summary.usage.outputTokens)],
    [copy.sessions, String(summary.sessions), copy.turns + ' ' + summary.turns + ' · ' + copy.responses + ' ' + summary.responses],
    [copy.cached, formatTokens(summary.usage.cachedInputTokens), percent(summary.usage.cachedInputTokens, summary.usage.inputTokens)],
    [copy.reasoning, formatTokens(summary.usage.reasoningOutputTokens), copy.reroutes + ' ' + summary.reroutes],
  ];
  const metricHtml = metrics.map(row =>
    '<div class="usage-metric"><span>' + esc(row[0]) + '</span><strong>' + esc(row[1]) + '</strong><small>' + esc(row[2]) + '</small></div>'
  ).join('');

  const modelHtml = summary.modelRows.length
    ? summary.modelRows.map(row => {
        const width = Math.max(1, Math.min(100, row.share * 100));
        return '<div class="usage-model-row"><div class="usage-model-name"><strong>' + esc(row.model || copy.unknownModel) + '</strong><small>' +
          esc(row.reasoning ?? '—') + ' · ' + row.responses + ' ' + esc(copy.responses) +
          '</small><div class="usage-bar"><i style="width:' + width + '%"></i></div></div><div class="usage-model-tokens">' +
          esc(formatTokens(row.usage.totalTokens)) + '</div><div class="usage-model-share">' + (row.share * 100).toFixed(1) + '%</div></div>';
      }).join('')
    : '<div class="empty-state">' + esc(copy.noUsage) + '</div>';

  const agentTotal = summary.rootUsage + summary.subagentUsage;
  const rootShare = agentTotal > 0 ? summary.rootUsage / agentTotal : 0;
  const subShare = agentTotal > 0 ? summary.subagentUsage / agentTotal : 0;

  const trendHtml = summary.dailyTrend.length
    ? '<div class="usage-trend" role="list">' + summary.dailyTrend.map(day => {
        const width = Math.max(1, Math.min(100, day.share * 100));
        return '<div class="usage-trend-row" role="listitem"><div class="usage-trend-label"><span>' + esc(day.day) + '</span>' +
          (day.estimated ? '<small title="' + esc(copy.estimatedDay) + '">~</small>' : '') +
          '</div><div class="usage-trend-bar"><i style="width:' + width + '%"></i></div><strong>' +
          esc(formatTokens(day.usage.totalTokens)) + '</strong></div>';
      }).join('') + '</div><p class="usage-panel-note">' + esc(copy.trendHint) + '</p>'
    : '<div class="empty-state">' + esc(copy.noUsage) + '</div>';

  const agentHtml =
    '<div class="usage-agent-split">' +
      '<div class="usage-agent-row"><div><span>' + esc(copy.rootAgent) + '</span><strong>' + esc(formatTokens(summary.rootUsage)) + ' · ' + (rootShare*100).toFixed(1) + '%</strong></div><div class="usage-bar"><i style="width:' + (summary.rootUsage?Math.max(1,rootShare*100):0) + '%"></i></div></div>' +
      '<div class="usage-agent-row"><div><span>' + esc(copy.subagents) + '</span><strong>' + esc(formatTokens(summary.subagentUsage)) + ' · ' + (subShare*100).toFixed(1) + '%</strong></div><div class="usage-bar"><i style="width:' + (summary.subagentUsage?Math.max(1,subShare*100):0) + '%"></i></div></div>' +
      '<div class="usage-quality"><span>' + esc(copy.exact) + ': ' + summary.exactSessions + '</span><span>' + esc(copy.legacy) + ': ' + summary.legacySessions + '</span><span>' + report.filesScanned + ' ' + esc(copy.files) + '</span></div>' +
    '</div>';

  const sessionHtml = report.sessions.slice(0,12).map(session => {
    const models = session.models.slice(0,2).map(row => row.model + (row.reasoning ? ' · ' + row.reasoning : '')).join(' / ') || copy.unknownModel;
    const agent = session.isSubagent ? (session.agentRole || copy.subagents) : copy.rootAgent;
    return '<div class="usage-session"><div><strong>' + esc(models) + '</strong><p>' + esc(agent) + ' · ' + session.turns + ' ' + esc(copy.turns) + ' · ' + esc(dateLabel(session.updatedAt, options.locale)) + '</p><p>' + esc(session.cwd) + '</p></div><span>' + esc(formatTokens(session.usage.totalTokens)) + '</span></div>';
  }).join('');

  const warnings: string[] = [];
  if (report.truncated) warnings.push(copy.truncated);
  if (report.parseErrors) warnings.push(copy.parseWarning + ' ' + report.parseErrors);

  host.innerHTML = '<section class="usage-workspace">' + head +
    warnings.map(value => '<div class="usage-warning">' + esc(value) + '</div>').join('') +
    '<div class="usage-metrics">' + metricHtml + '</div>' +
    '<section class="usage-panel"><h3>' + esc(copy.dailyTrend) + '</h3>' + trendHtml + '</section>' +
    '<div class="usage-panels"><section class="usage-panel"><h3>' + esc(copy.modelUsage) + '</h3><div class="usage-model-list">' + modelHtml + '</div></section>' +
    '<section class="usage-panel"><h3>' + esc(copy.agentUsage) + '</h3>' + agentHtml + '</section></div>' +
    '<section class="usage-panel"><h3>' + esc(copy.latestSessions) + '</h3><div class="usage-session-list">' + sessionHtml + '</div></section>' +
    '<p class="readonly-safety">' + icon('info') + '<span>' + esc(copy.dataNote) + '</span></p></section>';
  bind(host, options);
}

function bind(host: HTMLElement, options: UsageViewOptions): void {
  host.querySelectorAll<HTMLButtonElement>('[data-usage-period]').forEach(button => button.addEventListener('click', () => {
    const period = button.dataset.usagePeriod as UsagePeriod;
    if (period !== options.period) options.onPeriod(period);
  }));
  host.querySelector<HTMLButtonElement>('#refreshUsage')?.addEventListener('click', options.onRefresh);
}
