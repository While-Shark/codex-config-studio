import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = mkdtempSync(join(tmpdir(), 'studio-model-catalog-'));
after(() => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/lib/tsc.js'),
  join(root, 'src/task-modes.ts'), join(root, 'src/model-picker.ts'),
  '--strict', '--target', 'ES2022', '--module', 'ES2022', '--skipLibCheck',
  '--outDir', output], { stdio: 'pipe' });
writeFileSync(join(output, 'package.json'), '{"type":"module"}');
const { commonTaskModels, defaultTaskPreferences, taskModeIds, loadTaskPreferences,
  saveTaskPreference, loadActiveTaskMode } = await import(pathToFileURL(join(output, 'task-modes.js')));
const { renderModelPicker } = await import(pathToFileURL(join(output, 'model-picker.js')));

const expected = ['gpt-6-sol', 'gpt-6-astra', 'gpt-6-luna',
  'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.5'];
const copy = { inherit: 'Unset / inherit', custom: 'Custom model...',
  placeholder: 'Model ID', required: 'Choose or enter a model' };
const options = html => [...html.matchAll(/<option value="([^"]*)"( selected)?>(.*?)<\/option>/g)]
  .map(match => ({ value: match[1], selected: Boolean(match[2]), label: match[3] }));
const prefKey = 'codex-config-studio.task-preferences.v1';
const activeKey = 'codex-config-studio.task-mode.active.v1';
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
});
function storage(saved, active = 'daily') {
  const data = new Map([[prefKey, JSON.stringify(saved)], [activeKey, active]]);
  const writes = [];
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => data.get(key) ?? null,
    setItem(key, value) { data.set(key, value); writes.push(key); },
  } });
  return { data, writes };
}

test('shared catalog lists the new family first and retains all screenshot legacy models', () => {
  assert.deepEqual([...commonTaskModels], expected);
  assert.equal(new Set(commonTaskModels).size, commonTaskModels.length);
  assert.ok(!commonTaskModels.includes('gpt-6-terra'));
});

test('both advanced selectors show the real seven-model catalog for every selected model', () => {
  for (const field of ['model', 'defaultSubagentModel']) for (const model of expected) {
    const items = options(renderModelPicker(field, model, commonTaskModels, field, copy));
    assert.deepEqual(items.slice(1, -1).map(item => item.label), expected);
    assert.deepEqual(items.filter(item => item.selected).map(item => item.value), ['id:' + model]);
    assert.equal(items.length, expected.length + 2);
  }
});

test('inherit remains selected rather than being replaced by the first new model', () => {
  for (const field of ['model', 'defaultSubagentModel']) {
    const items = options(renderModelPicker(field, null, commonTaskModels, field, copy));
    assert.deepEqual(items.filter(item => item.selected).map(item => item.value), ['']);
  }
});

test('a newly catalogued custom GPT-6 ID is preserved and not duplicated', () => {
  for (const model of ['gpt-6-sol', 'gpt-6-luna']) {
    const items = options(renderModelPicker('model', model, commonTaskModels, 'Model', copy));
    assert.equal(items.filter(item => item.value === 'id:' + model).length, 1);
    assert.equal(items.find(item => item.selected).value, 'id:' + model);
  }
});

test('provider-specific model IDs remain selected with all new models still available', () => {
  const items = options(renderModelPicker('model', 'provider/my-model', commonTaskModels, 'Model', copy));
  assert.deepEqual(items.filter(item => item.selected).map(item => item.value), ['id:provider/my-model']);
  for (const model of expected) assert.ok(items.some(item => item.value === 'id:' + model));
});

test('loading saved tasks never migrates old models, custom IDs or reasoning levels', () => {
  const saved = {
    'quick-fix': { model: 'gpt-5.6-luna', reasoning: 'xhigh' },
    daily: { model: 'gpt-6-luna', reasoning: 'xhigh' },
    complex: { model: 'provider/custom-model', reasoning: 'max' },
    architecture: { model: 'gpt-6-astra', reasoning: 'high' },
  };
  const { writes } = storage(saved, 'complex');
  assert.deepEqual(loadTaskPreferences(), saved);
  assert.equal(loadActiveTaskMode(), 'complex');
  assert.deepEqual(writes, []);
});

test('each task can save and reload either new model without changing other task settings', () => {
  for (const id of taskModeIds) for (const model of ['gpt-6-sol', 'gpt-6-luna']) {
    const before = structuredClone(defaultTaskPreferences);
    storage(before);
    saveTaskPreference(id, { model, reasoning: 'xhigh' });
    const after = loadTaskPreferences();
    assert.deepEqual(after[id], { model, reasoning: 'xhigh' });
    for (const other of taskModeIds.filter(key => key !== id)) assert.deepEqual(after[other], before[other]);
  }
});

test('expanding model choices leaves all existing task recommendations unchanged', () => {
  assert.deepEqual(defaultTaskPreferences, {
    'quick-fix': { model: 'gpt-5.6-luna', reasoning: 'low' },
    daily: { model: 'gpt-5.6-terra', reasoning: 'medium' },
    complex: { model: 'gpt-5.6-sol', reasoning: 'high' },
    architecture: { model: 'gpt-6-astra', reasoning: 'high' },
  });
});

test('blocked storage still allows catalog access and session use without throwing', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem() { throw new Error('Storage blocked'); },
    setItem() { throw new Error('Storage blocked'); },
  } });
  assert.deepEqual(loadTaskPreferences(), defaultTaskPreferences);
  assert.doesNotThrow(() => saveTaskPreference('daily', { model: 'gpt-6-luna', reasoning: 'xhigh' }));
  assert.deepEqual([...commonTaskModels], expected);
});
