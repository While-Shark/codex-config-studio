/** Keyboard support for the actual tab buttons. No file or command access. */
export function bindTabs(root: ParentNode, activate: (id: string) => void | boolean): void {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-tab]')];
  buttons.forEach((button, index) => {
    button.addEventListener('keydown', event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % buttons.length
        : event.key === 'ArrowLeft' ? (index - 1 + buttons.length) % buttons.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : -1;
      if (next < 0 || buttons[next].disabled) return;
      event.preventDefault();
      if (activate(buttons[next].dataset.tab!) === false) return;
      buttons[next].focus();
    });
  });
}
let returnFocus: HTMLElement | null = null;
let returnFocusId = '';
export function setModalActive(active: boolean): void {
  const dialog = document.querySelector<HTMLElement>('#confirmModal .modal');
  if (active) {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    returnFocusId = returnFocus?.id ?? '';
  }
  document.querySelectorAll<HTMLElement>('#appHeader, #appWorkspace').forEach(node => node.inert = active);
  if (active) document.querySelector<HTMLButtonElement>('#confirmCancel')?.focus();
  else {
    const target = returnFocus?.isConnected ? returnFocus : document.getElementById(returnFocusId)
      ?? document.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    target?.focus(); returnFocus = null; returnFocusId = '';
  }
  if (active && !dialog?.contains(document.activeElement)) dialog?.focus();
}
export function bindModalKeyboard(close: () => void): void {
  const modal = document.querySelector<HTMLElement>('#confirmModal');
  modal?.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (event.key !== 'Tab') return;
    const items = [...modal.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]')]
      .filter(node => !node.closest('[hidden], .hidden') && node.getClientRects().length > 0);
    if (!items.length) { event.preventDefault(); return; }
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
}
export function closePopovers(target: EventTarget | null): void {
  document.querySelectorAll<HTMLDetailsElement>('.popover[open]').forEach(details => {
    if (!(target instanceof Node) || !details.contains(target)) details.open = false;
  });
}

// Keep the selected rail panel when locale or theme rebuilds the shell.
let activeRailTab = 'preview';
export function bindRailTabs(root: ParentNode): void {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-rail-tab]')];
  const activate = (id: string): void => {
    activeRailTab = id;
    buttons.forEach(button => {
      const selected = button.dataset.railTab === id;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      const panel = root.querySelector<HTMLElement>(`#${button.getAttribute('aria-controls')}`);
      if (panel) panel.hidden = !selected;
    });
  };
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => activate(button.dataset.railTab!));
    button.addEventListener('keydown', event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % buttons.length
        : event.key === 'ArrowLeft' ? (index - 1 + buttons.length) % buttons.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : -1;
      if (next < 0) return;
      event.preventDefault();
      activate(buttons[next].dataset.railTab!);
      buttons[next].focus();
    });
  });
  activate(activeRailTab);
}
