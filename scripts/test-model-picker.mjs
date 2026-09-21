import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = mkdtempSync(join(tmpdir(), 'studio-model-picker-'));
after(() => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/lib/tsc.js'),
  join(root, 'src/model-picker.ts'), '--strict', '--target', 'ES2022', '--module', 'ES2022',
  '--skipLibCheck', '--outDir', output], { stdio: 'pipe' });
writeFileSync(join(output, 'package.json'), '{"type":"module"}');
const { renderModelPicker, bindModelPickers, validateModelPickers } = await import(pathToFileURL(join(output, 'model-picker.js')));
const models = ['gpt-6-astra', 'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna'];
const copy = { inherit: 'Unset / inherit', custom: 'Custom model...', placeholder: 'Model ID', required: 'Choose or enter a model' };
const render = (value, field = 'model', catalog = models) => renderModelPicker(field, value, catalog, 'Model', copy);
const options = html => [...html.matchAll(/<option value="([^"]*)"( selected)?>(.*?)<\/option>/g)]
  .map(match => ({ value: match[1], selected: Boolean(match[2]), label: match[3] }));

function fieldFixture(field = 'model', initial = models[2]) {
  const value = { value: initial ?? '', events: [], dispatchEvent(event) { this.events.push(event.type); } };
  const select = { value: initial ? 'id:' + initial : '', listeners: {}, addEventListener(type, fn) { this.listeners[type] = fn; } };
  const wrap = { hidden: true };
  const custom = { value: '', disabled: false, required: false, message: '', focused: 0, reported: 0,
    dataset: { requiredMessage: copy.required }, attributes: {}, listeners: {},
    addEventListener(type, fn) { this.listeners[type] = fn; },
    setCustomValidity(message) { this.message = message; },
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    reportValidity() { this.reported++; return !this.message; }, focus() { this.focused++; },
  };
  const wrapper = { dataset: { modelPicker: field }, querySelector(selector) {
    return selector === `#${field}` ? value : selector === 'select' ? select
      : selector === '.model-picker-custom' ? wrap : custom;
  } };
  const root = { querySelectorAll: () => [wrapper] };
  bindModelPickers(root);
  return { value, select, wrap, custom, wrapper, root,
    choose(next) { select.value = next; select.listeners.change(); },
    type(next) { custom.value = next; custom.listeners.input(); },
  };
}

test('every current built-in still shows the entire catalog in both selectors', () => {
  for (const field of ['model', 'defaultSubagentModel']) for (const model of models) {
    const items = options(render(model, field));
    assert.deepEqual(items.slice(1, -1).map(item => item.label), models);
    assert.deepEqual(items.filter(item => item.selected).map(item => item.label), [model]);
    assert.equal(items.length, models.length + 2);
    assert.ok(!render(model, field).includes('<datalist'));
  }
});

test('inherit remains explicitly selected rather than silently choosing Astra', () => {
  const items = options(render(null));
  assert.deepEqual(items.filter(item => item.selected).map(item => item.value), ['']);
});

test('a saved custom model remains selected without dropping the built-in list', () => {
  const items = options(render('my-provider/model-v9'));
  assert.deepEqual(items.filter(item => item.selected).map(item => item.label), ['my-provider/model-v9']);
  for (const model of models) assert.ok(items.some(item => item.label === model));
});

test('catalog values are trimmed and deduplicated without being mutated', () => {
  const catalog = [' x ', '', 'x', 'y'];
  const items = options(render('x', 'model', catalog));
  assert.deepEqual(items.slice(1, -1).map(item => item.label), ['x', 'y']);
  assert.deepEqual(catalog, [' x ', '', 'x', 'y']);
});

test('custom IDs cannot collide with menu control values', () => {
  for (const id of ['custom:', 'id:x', '__custom__']) {
    const selected = options(render(id)).find(item => item.selected);
    assert.equal(selected.value, 'id:' + id);
    assert.notEqual(selected.value, 'custom:');
  }
});

test('model IDs and translated labels are escaped rather than injected as HTML', () => {
  const malicious = '<img src=x onerror="alert(1)">&\'';
  const html = renderModelPicker('model', malicious, models, malicious, Object.fromEntries(Object.keys(copy).map(key => [key, malicious])));
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;img'));
  assert.ok(html.includes('&quot;'));
});

test('main and sub-agent controls have distinct input and label IDs', () => {
  const html = render(models[0]) + render(models[3], 'defaultSubagentModel');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.ok(html.includes('for="modelCustom"'));
  assert.ok(html.includes('for="defaultSubagentModelCustom"'));
});

test('choosing each model publishes its raw ID through the original form input', () => {
  const f = fieldFixture();
  for (const model of models) {
    f.choose('id:' + model);
    assert.equal(f.value.value, model);
    assert.equal(f.wrap.hidden, true);
    assert.equal(f.custom.disabled, true);
  }
  assert.equal(f.value.events.length, models.length);
});

test('choosing inherit clears only the intended model value', () => {
  const f = fieldFixture();
  f.choose('');
  assert.equal(f.value.value, '');
  assert.deepEqual(f.value.events, ['input']);
});

test('opening an empty custom editor preserves the previous selection', () => {
  const f = fieldFixture();
  f.choose('custom:');
  assert.equal(f.value.value, models[2]);
  assert.equal(f.value.events.length, 0);
  assert.equal(f.wrap.hidden, false);
  assert.equal(f.custom.disabled, false);
  assert.equal(f.custom.required, true);
  assert.equal(f.custom.focused, 1);
});

test('typing a custom ID updates the preview value without rebuilding the selector', () => {
  const f = fieldFixture();
  f.choose('custom:'); f.type('  new/model  ');
  assert.equal(f.value.value, 'new/model');
  assert.equal(f.select.value, 'custom:');
  assert.equal(f.custom.value, '  new/model  ');
  assert.equal(validateModelPickers(f.root), true);
});

test('empty custom input blocks apply instead of deleting or reusing a model silently', () => {
  const f = fieldFixture();
  f.choose('custom:'); f.type('new/model'); f.type('  ');
  assert.equal(f.value.value, 'new/model');
  assert.equal(validateModelPickers(f.root), false);
  assert.equal(f.custom.reported, 1);
  assert.equal(f.custom.message, copy.required);
});

test('returning to a built-in clears custom validation and preserves the custom draft', () => {
  const f = fieldFixture();
  f.choose('custom:'); f.type('draft/model'); f.choose('id:' + models[3]);
  assert.equal(f.custom.message, '');
  assert.equal(validateModelPickers(f.root), true);
  f.choose('custom:');
  assert.equal(f.custom.value, 'draft/model');
  assert.equal(f.value.value, 'draft/model');
});

test('the main and sub-agent selector states remain independent', () => {
  const main = fieldFixture('model', models[2]);
  const sub = fieldFixture('defaultSubagentModel', models[3]);
  main.choose('custom:'); main.type('private/model');
  sub.choose('id:' + models[1]);
  assert.equal(main.value.value, 'private/model');
  assert.equal(sub.value.value, models[1]);
});

test('every invalid custom editor is validated even when the other picker is valid', () => {
  const main = fieldFixture(); const sub = fieldFixture('defaultSubagentModel');
  sub.choose('custom:');
  assert.equal(validateModelPickers({ querySelectorAll: () => [main.wrapper, sub.wrapper] }), false);
  assert.equal(sub.custom.reported, 1);
});

test('no model controls outside the advanced tab means no extra apply restriction', () => {
  assert.equal(validateModelPickers({ querySelectorAll: () => [] }), true);
});

// Exercise the application's actual advanced-form integration as well as the isolated widget.
const ts = require('typescript');
const appSource = readFileSync(join(root, 'src/main.ts'), 'utf8');
const ast = ts.createSourceFile('main.ts', appSource, ts.ScriptTarget.Latest, true);
const { runInNewContext } = await import('node:vm');
function appFunction(name) {
  const declaration = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert.ok(declaration, `Missing application function ${name}`);
  return ts.transpileModule(declaration.getText(ast), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022,
  } }).outputText;
}
const fields = ['model', 'modelReasoningEffort', 'planModeReasoningEffort', 'agentsEnabled',
  'defaultSubagentModel', 'defaultSubagentReasoningEffort', 'maxConcurrentThreadsPerSession'];
const pending = { model: models[2], modelReasoningEffort: null, planModeReasoningEffort: 'high',
  agentsEnabled: true, defaultSubagentModel: models[3], defaultSubagentReasoningEffort: 'medium',
  maxConcurrentThreadsPerSession: 2 };

test('actual advanced renderer uses complete selectors for main and sub-agent models', () => {
  let bound = 0;
  const element = { addEventListener() {} };
  const host = { innerHTML: '' };
  const context = { host, values: structuredClone(pending), fields, commonTaskModels: models,
    efforts: ['low', 'medium', 'high', 'xhigh'], t: key => key,
    esc: value => String(value).replaceAll('"', '&quot;'),
    renderModelPicker, bindModelPickers: target => { assert.equal(target, host); bound++; },
    document: { querySelector: () => element }, $: () => element,
  };
  const code = ['advancedField', 'selectHtml', 'renderAdvanced'].map(appFunction).join('\n');
  runInNewContext(code + '\nrenderAdvanced(host);', context);
  assert.equal(bound, 1);
  assert.ok(!host.innerHTML.includes('<datalist'));
  for (const field of ['model', 'defaultSubagentModel']) {
    const select = host.innerHTML.match(new RegExp(`<select id="${field}Select"[^>]*>([\\s\\S]*?)</select>`));
    assert.ok(select, `Missing full selector for ${field}`);
    for (const model of models) assert.ok(select[1].includes(model));
    assert.ok(host.innerHTML.includes(`for="${field}Select"`));
  }
});

test('actual form reading does not reset reasoning inheritance or unrelated agent settings', () => {
  const form = { ...pending, model: 'new/custom-model' };
  const context = { values: {}, document: { querySelector: selector => ({
    value: form[selector.slice(1)] === null ? '' : String(form[selector.slice(1)]),
  }) } };
  runInNewContext(appFunction('readAdvanced') + '\nreadAdvanced();', context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.values)), form);
});

test('actual apply path rejects an unfinished custom model before confirmation or native writes', async () => {
  let confirms = 0; let writes = 0;
  const context = { busy: false, lastSnapshot: { values: pending }, values: pending,
    getChanges: () => [{ field: 'model', from: 'old', to: 'new' }], document: {},
    validateModelPickers: () => false,
    askConfirm: () => { confirms++; throw new Error('Unexpected confirmation'); },
    safeInvoke: () => { writes++; throw new Error('Unexpected write'); },
  };
  await runInNewContext(appFunction('applyChanges') + '\napplyChanges();', context);
  assert.equal(confirms, 0); assert.equal(writes, 0);
});
