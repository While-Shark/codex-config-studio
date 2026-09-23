export type TaskModeId = 'quick-fix' | 'daily' | 'complex' | 'architecture';
export type TaskPreference = { model: string; reasoning: string };

// Shared by the main-model, sub-agent and current-task selectors.
// Latest family first; keep legacy IDs available without migrating saved preferences.
// IDs: https://openai.com/index/introducing-gpt-6-sol-and-luna/
export const commonTaskModels = [
  'gpt-6-sol',
  'gpt-6-astra',
  'gpt-6-luna',
  'gpt-5.6-sol',
  'gpt-5.6-terra',
  'gpt-5.6-luna',
  'gpt-5.5',
] as const;
export const reasoningLevels = ['low', 'medium', 'high', 'xhigh', 'ultra', 'persistent', 'max'] as const;
export const taskModeIds: TaskModeId[] = ['quick-fix', 'daily', 'complex', 'architecture'];

export const defaultTaskPreferences: Record<TaskModeId, TaskPreference> = {
  'quick-fix': { model: 'gpt-6-luna', reasoning: 'low' },
  daily: { model: 'gpt-6-luna', reasoning: 'medium' },
  complex: { model: 'gpt-6-sol', reasoning: 'high' },
  architecture: { model: 'gpt-6-astra', reasoning: 'high' },
};

const prefKey = 'codex-config-studio.task-preferences.v1';
const activeKey = 'codex-config-studio.task-mode.active.v1';

function cloneDefaults(): Record<TaskModeId, TaskPreference> {
  return Object.fromEntries(taskModeIds.map(id => [id, { ...defaultTaskPreferences[id] }])) as Record<TaskModeId, TaskPreference>;
}

export function loadTaskPreferences(): Record<TaskModeId, TaskPreference> {
  const defaults = cloneDefaults();
  try {
    const raw = localStorage.getItem(prefKey);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<Record<TaskModeId, Partial<TaskPreference>>>;
    for (const id of taskModeIds) {
      const saved = parsed[id];
      if (saved?.model && typeof saved.model === 'string') defaults[id].model = saved.model;
      if (saved?.reasoning && typeof saved.reasoning === 'string') defaults[id].reasoning = saved.reasoning;
    }
  } catch { return defaults; }
  return defaults;
}

export function saveTaskPreference(id: TaskModeId, preference: TaskPreference): void {
  const all = loadTaskPreferences();
  all[id] = { ...preference };
  try { localStorage.setItem(prefKey, JSON.stringify(all)); } catch { /* session still works */ }
}
export function resetTaskPreference(id: TaskModeId): TaskPreference {
  const next = { ...defaultTaskPreferences[id] };
  saveTaskPreference(id, next);
  return next;
}
export function loadActiveTaskMode(): TaskModeId {
  try {
    const value = localStorage.getItem(activeKey) as TaskModeId | null;
    if (value && taskModeIds.includes(value)) return value;
  } catch { /* use default */ }
  return 'daily';
}
export function saveActiveTaskMode(id: TaskModeId): void {
  try { localStorage.setItem(activeKey, id); } catch { /* session still works */ }
}
