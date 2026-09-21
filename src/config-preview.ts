import type { PreviewCopy } from './i18n/preview';

export type PreviewValue = string | number | boolean | null;
export type PreviewRow = {
  field: string;
  label: string;
  from: string | null;
  to: string;
  status: 'changed' | 'unchanged' | 'unread';
};

/** Keep every managed field visible; comparison must use raw, not formatted, values. */
export function createPreviewRows<K extends string>(
  fields: readonly K[],
  current: Readonly<Record<K, PreviewValue>> | null,
  pending: Readonly<Record<K, PreviewValue>>,
  label: (field: K) => string,
  format: (field: K, value: PreviewValue) => string,
): PreviewRow[] {
  return fields.map(field => ({
    field,
    label: label(field),
    from: current === null ? null : format(field, current[field]),
    to: format(field, pending[field]),
    status: current === null ? 'unread' : current[field] === pending[field] ? 'unchanged' : 'changed',
  }));
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

/** Render only text, never HTML supplied by custom model IDs or configuration files. */
export function renderPreviewRows(rows: readonly PreviewRow[], copy: PreviewCopy): string {
  return rows.map(row => {
    const state = copy[row.status];
    const previous = row.status === 'changed'
      ? `<del title="${escapeHtml(copy.before)}">${escapeHtml(row.from ?? '')}</del><span class="config-preview-arrow" aria-hidden="true">&rarr;</span>`
      : '';
    return `<div class="config-preview-row ${row.status}" data-config-field="${escapeHtml(row.field)}">
      <div class="config-preview-heading"><span>${escapeHtml(row.label)}</span><small class="config-preview-state">${escapeHtml(state)}</small></div>
      <div class="config-preview-values">${previous}<strong title="${escapeHtml(copy.after)}">${escapeHtml(row.to)}</strong></div>
    </div>`;
  }).join('');
}
