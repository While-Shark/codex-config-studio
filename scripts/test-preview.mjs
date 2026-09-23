import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = mkdtempSync(join(tmpdir(), 'studio-preview-test-'));
after(() => rmSync(output, { recursive: true, force: true }));
// Strictly compile the actual preview modules, not a JavaScript copy of their logic.
execFileSync(process.execPath, [require.resolve('typescript/lib/tsc.js'),
  join(root, 'src/config-preview.ts'), join(root, 'src/i18n/preview.ts'),
  '--strict', '--target', 'ES2022', '--module', 'ES2022', '--skipLibCheck',
  '--rootDir', join(root, 'src'), '--outDir', output], { stdio: 'pipe' });
writeFileSync(join(output, 'package.json'), '{"type":"module"}');
const { createPreviewRows, renderPreviewRows } = await import(pathToFileURL(join(output, 'config-preview.js')));
const { previewText } = await import(pathToFileURL(join(output, 'i18n/preview.js')));
const source = readFileSync(join(root, 'src/main.ts'), 'utf8');
const ast = ts.createSourceFile('main.ts', source, ts.ScriptTarget.Latest, true);
const compile = text => ts.transpileModule(text, { compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022,
} }).outputText;
function functionSource(name) {
  const node = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert.ok(node, `Missing application function ${name}`);
  return node.getText(ast);
}
function declarationSource(name) {
  const node = ast.statements.find(node => ts.isVariableStatement(node) &&
    node.declarationList.declarations.some(declaration => declaration.name.getText(ast) === name));
  assert.ok(node, `Missing application declaration ${name}`);
  return node.getText(ast);
}
// Use real preset values so changes to the app's field list are covered automatically.
const fixture = runInNewContext(compile(`${declarationSource('fields')}\n${declarationSource('presets')}\nJSON.stringify({fields,presets});`));
const { fields, presets } = JSON.parse(fixture);
const daily = presets.find(preset => preset.id === 'daily').values;
const astra = presets.find(preset => preset.id === 'astra').values;
const format = (_field, value) => value === null ? 'inherit' : String(value);
const label = field => field;
const rows = (current, pending = daily) => createPreviewRows(fields, current, pending, label, format);
const countRows = html => (html.match(/data-config-field=/g) ?? []).length;

function runApplicationPreview(current, pending = daily, options = {}) {
  const nodes = Object.fromEntries(['#changeCount', '#changeList', '#applyBtn', '#previewSummary'].map(id =>
    [id, { textContent: '', innerHTML: '', disabled: false, title: '' }]));
  const context = {
    document: { querySelector: selector => nodes[selector] ?? null },
    fields, values: structuredClone(pending),
    lastSnapshot: current === null ? null : { exists: true, values: structuredClone(current) },
    currentStatus: { key: options.status ?? 'status.read', ok: true },
    busy: options.busy ?? false,
    hasScope: () => options.hasScope ?? true,
    getLocale: () => options.locale ?? 'en',
    t: key => key,
    fieldLabel: label, displayValue: format,
    esc: value => value.replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]),
    createPreviewRows, renderPreviewRows, previewText,
  };
  const js = compile(['sameValue', 'getChanges', 'renderChanges'].map(functionSource).join('\n'));
  runInNewContext(`${js}\nrenderChanges();`, context);
  return { nodes, context, js };
}

test('same preset keeps every managed field and marks each unchanged', () => {
  const result = rows(daily);
  assert.equal(result.length, fields.length);
  assert.ok(result.every(row => row.status === 'unchanged'));
  const html = renderPreviewRows(result, previewText('en'));
  assert.equal(countRows(html), fields.length);
  assert.equal((html.match(/Unchanged/g) ?? []).length, fields.length);
  assert.ok(!html.includes('<del'));
});

test('one changed model does not hide the six unchanged settings', () => {
  const result = rows(daily, astra);
  assert.equal(result.length, fields.length);
  assert.deepEqual(result.filter(row => row.status === 'changed').map(row => row.field), ['model']);
  const html = renderPreviewRows(result, previewText('en'));
  assert.equal(countRows(html), fields.length);
  assert.equal((html.match(/<del/g) ?? []).length, 1);
  assert.ok(html.includes(daily.model));
  assert.ok(html.includes(astra.model));
});

test('a new empty configuration shows all fields as changes', () => {
  const empty = Object.fromEntries(fields.map(field => [field, null]));
  assert.ok(rows(empty).every(row => row.status === 'changed'));
});

test('unread configuration is not incorrectly labelled unchanged', () => {
  const result = rows(null);
  assert.equal(result.length, fields.length);
  assert.ok(result.every(row => row.status === 'unread' && row.from === null));
});

test('null inheritance and disabled false remain distinguishable', () => {
  const current = { ...daily, agentsEnabled: null, defaultSubagentModel: null };
  const pending = { ...current, agentsEnabled: false };
  const result = rows(current, pending);
  assert.equal(result.find(row => row.field === 'agentsEnabled').status, 'changed');
  assert.equal(result.find(row => row.field === 'defaultSubagentModel').to, 'inherit');
  assert.equal(result.find(row => row.field === 'defaultSubagentModel').status, 'unchanged');
});

test('comparisons use raw values even when formatted text is identical', () => {
  const result = createPreviewRows(['model'], { model: null }, { model: 'inherit' }, label, format);
  assert.equal(result[0].status, 'changed');
});

test('custom model IDs and labels cannot inject HTML', () => {
  const value = '<img src=x onerror="alert(1)">&\'';
  const result = createPreviewRows(['model'], { model: value }, { model: value }, () => '<script>', format);
  const html = renderPreviewRows(result, previewText('en'));
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;img'));
  assert.ok(html.includes('&quot;'));
});

test('all five supported languages include complete preview labels', () => {
  const keys = Object.keys(previewText('en')).sort();
  for (const locale of ['zh-CN', 'zh-TW', 'en', 'ja', 'ko']) {
    const copy = previewText(locale);
    assert.deepEqual(Object.keys(copy).sort(), keys);
    assert.ok(Object.values(copy).every(value => typeof value === 'string' && value.length > 0));
    assert.ok(renderPreviewRows(rows(daily), copy).includes(copy.unchanged));
    assert.ok(copy.summary.includes('{total}') && copy.summary.includes('{changed}'));
  }
});

test('preview generation does not mutate configurations', () => {
  const before = JSON.stringify(daily);
  const after = JSON.stringify(astra);
  renderPreviewRows(rows(daily, astra), previewText('en'));
  assert.equal(JSON.stringify(daily), before);
  assert.equal(JSON.stringify(astra), after);
});

test('actual app renderer keeps all settings after choosing the same preset', () => {
  const { nodes } = runApplicationPreview(daily);
  assert.equal(countRows(nodes['#changeList'].innerHTML), fields.length);
  assert.equal(nodes['#changeCount'].textContent, '0');
  assert.equal(nodes['#applyBtn'].disabled, true);
});

test('actual app renderer shows seven settings but counts one real change', () => {
  const { nodes } = runApplicationPreview(daily, astra);
  assert.equal(countRows(nodes['#changeList'].innerHTML), fields.length);
  assert.equal(nodes['#changeCount'].textContent, '1');
  assert.equal(nodes['#applyBtn'].disabled, false);
});

test('actual app renderer disables writes while no comparison is available', () => {
  for (const status of ['status.unread', 'status.reading', 'status.readFailed']) {
    const { nodes } = runApplicationPreview(null, astra, { status });
    assert.equal(countRows(nodes['#changeList'].innerHTML), fields.length);
    assert.equal(nodes['#applyBtn'].disabled, true);
    assert.ok(nodes['#changeList'].innerHTML.includes('Not compared'));
  }
});

test('actual app renderer does not enable apply while busy or without a scope', () => {
  for (const options of [{ busy: true }, { hasScope: false }]) {
    const { nodes } = runApplicationPreview(daily, astra, options);
    assert.equal(nodes['#applyBtn'].disabled, true);
  }
});

test('unchanged preview never writes files or creates duplicate history', async () => {
  const { context, js } = runApplicationPreview(daily);
  let writes = 0;
  let confirms = 0;
  context.confirmResolver = null;
  context.safeInvoke = async () => { writes += 1; throw new Error('Unexpected write'); };
  context.askConfirm = async () => { confirms += 1; return true; };
  const apply = compile(functionSource('applyChanges'));
  await runInNewContext(`${js}\n${apply}\napplyChanges();`, context);
  assert.equal(writes, 0);
  assert.equal(confirms, 0);
});
