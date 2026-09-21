export type ModelField = 'model' | 'defaultSubagentModel';
export type ModelPickerCopy = {
  inherit: string;
  custom: string;
  placeholder: string;
  required: string;
};

const CUSTOM = 'custom:';
const PREFIX = 'id:';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

/** A real select always exposes the entire catalog, independent of the current value. */
export function renderModelPicker(
  field: ModelField,
  current: string | null,
  models: readonly string[],
  label: string,
  copy: ModelPickerCopy,
): string {
  const value = current?.trim() ?? '';
  const catalog = [...new Set(models.map(model => model.trim()).filter(Boolean))];
  // Do not replace a model loaded from a custom provider with the first built-in model.
  if (value && !catalog.includes(value)) catalog.push(value);
  const selected = value ? PREFIX + value : '';
  return `<div class="model-picker" data-model-picker="${field}">
    <input type="hidden" id="${field}" value="${escapeHtml(value)}">
    <select id="${field}Select" aria-label="${escapeHtml(label)}">
      <option value=""${selected === '' ? ' selected' : ''}>${escapeHtml(copy.inherit)}</option>
      ${catalog.map(model => `<option value="${escapeHtml(PREFIX + model)}"${selected === PREFIX + model ? ' selected' : ''}>${escapeHtml(model)}</option>`).join('')}
      <option value="${CUSTOM}">${escapeHtml(copy.custom)}</option>
    </select>
    <div class="model-picker-custom" hidden>
      <label for="${field}Custom">${escapeHtml(copy.custom)}</label>
      <input id="${field}Custom" type="text" autocomplete="off" spellcheck="false"
        aria-label="${escapeHtml(label + ' / ' + copy.custom)}"
        placeholder="${escapeHtml(copy.placeholder)}" data-required-message="${escapeHtml(copy.required)}">
    </div>
  </div>`;
}

/** Keep the existing typed form value as the only source consumed by readAdvanced(). */
export function bindModelPickers(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-model-picker]').forEach(wrapper => {
    const field = wrapper.dataset.modelPicker;
    const value = wrapper.querySelector<HTMLInputElement>(`#${field}`)!;
    const select = wrapper.querySelector<HTMLSelectElement>('select')!;
    const customWrap = wrapper.querySelector<HTMLElement>('.model-picker-custom')!;
    const custom = wrapper.querySelector<HTMLInputElement>('input[type="text"]')!;
    let draft = '';
    const publish = (next: string) => {
      value.value = next;
      value.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const setValidity = () => {
      const invalid = select.value === CUSTOM && !custom.value.trim();
      custom.setCustomValidity(invalid ? custom.dataset.requiredMessage ?? '' : '');
      custom.setAttribute('aria-invalid', String(invalid));
      return !invalid;
    };
    select.addEventListener('change', () => {
      const editing = select.value === CUSTOM;
      customWrap.hidden = !editing;
      custom.disabled = !editing;
      custom.required = editing;
      if (editing) {
        custom.value = draft;
        setValidity();
        // Opening the custom editor must not clear an existing configuration value.
        if (custom.value.trim()) publish(custom.value.trim());
        custom.focus();
      } else {
        custom.setCustomValidity('');
        custom.removeAttribute('aria-invalid');
        publish(select.value.startsWith(PREFIX) ? select.value.slice(PREFIX.length) : '');
      }
    });
    custom.disabled = true;
    custom.addEventListener('input', () => {
      draft = custom.value;
      if (setValidity()) publish(custom.value.trim());
    });
  });
}

/** Never silently apply an old model while the user is entering an empty custom ID. */
export function validateModelPickers(root: ParentNode): boolean {
  for (const wrapper of root.querySelectorAll<HTMLElement>('[data-model-picker]')) {
    const select = wrapper.querySelector<HTMLSelectElement>('select')!;
    const custom = wrapper.querySelector<HTMLInputElement>('input[type="text"]')!;
    if (select.value === CUSTOM && !custom.value.trim()) {
      custom.required = true;
      custom.setCustomValidity(custom.dataset.requiredMessage ?? '');
      custom.setAttribute('aria-invalid', 'true');
      custom.reportValidity();
      custom.focus();
      return false;
    }
  }
  return true;
}
