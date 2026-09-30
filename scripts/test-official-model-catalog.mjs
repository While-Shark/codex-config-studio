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
const output = mkdtempSync(join(tmpdir(), 'studio-official-models-'));
after(() => rmSync(output, { recursive: true, force: true }));

execFileSync(process.execPath, [
  require.resolve('typescript/lib/tsc.js'),
  join(root, 'src/model-catalog.ts'),
  '--strict', '--target', 'ES2022', '--module', 'ES2022', '--skipLibCheck',
  '--outDir', output,
], { stdio: 'pipe' });
writeFileSync(join(output, 'package.json'), '{"type":"module"}');

const catalog = await import(pathToFileURL(join(output, 'model-catalog.js')));
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const originalFetch = globalThis.fetch;

function installStorage(initial = new Map()) {
  const data = new Map(initial);
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: key => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
    },
  });
  return data;
}

afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
  globalThis.fetch = originalFetch;
});

test('official catalog keeps only visible list models and sorts by priority', () => {
  const entries = catalog.parseOfficialModelCatalog({
    models: [
      { slug: 'hidden-model', visibility: 'hide', priority: 0 },
      {
        slug: 'gpt-next-b',
        display_name: 'GPT Next B',
        visibility: 'list',
        priority: 20,
        minimal_client_version: '0.200.0',
        default_reasoning_level: 'high',
        supported_reasoning_levels: [{ effort: 'high' }, { effort: 'xhigh' }],
      },
      {
        slug: 'gpt-next-a',
        display_name: 'GPT Next A',
        visibility: 'list',
        priority: 2,
        default_reasoning_level: 'low',
        supported_reasoning_levels: [{ effort: 'low' }, { effort: 'high' }, { effort: 'high' }],
      },
      { slug: '', visibility: 'list', priority: 1 },
    ],
  });

  assert.deepEqual(entries.map(entry => entry.id), ['gpt-next-a', 'gpt-next-b']);
  assert.deepEqual(entries[0].reasoningLevels, ['low', 'high']);
  assert.equal(entries[0].defaultReasoningLevel, 'low');
  assert.equal(entries[1].defaultReasoningLevel, 'high');
  assert.equal(entries[1].minimalClientVersion, '0.200.0');
});

test('reasoning choices follow official model capabilities with safe fallbacks', () => {
  const entries = [
    { id: 'gpt-a', displayName: 'A', reasoningLevels: ['low','high','xhigh'], priority: 1, minimalClientVersion: '1.0.0' },
    { id: 'gpt-empty', displayName: 'Empty', reasoningLevels: [], priority: 2, minimalClientVersion: null },
  ];
  const fallback = ['low','medium','high','xhigh','persistent'];

  assert.deepEqual(catalog.reasoningLevelsForModel('gpt-a', entries, fallback), ['low','high','xhigh']);
  assert.deepEqual(catalog.reasoningLevelsForModel('gpt-empty', entries, fallback), fallback);
  assert.deepEqual(catalog.reasoningLevelsForModel('provider/custom', entries, fallback), fallback);
  assert.deepEqual(catalog.reasoningLevelsForModel(null, entries, fallback), fallback);
  assert.deepEqual(fallback, ['low','medium','high','xhigh','persistent']);
});

test('Codex client version comparison handles stable, prerelease and malformed values', () => {
  assert.equal(catalog.compareCodexVersions('0.153.0','0.153.0'),0);
  assert.equal(catalog.compareCodexVersions('0.152.9','0.153.0'),-1);
  assert.equal(catalog.compareCodexVersions('0.154','0.153.0'),1);
  assert.equal(catalog.compareCodexVersions('v1.2.3-beta.1','1.2.3'),-1);
  assert.equal(catalog.compareCodexVersions('1.2.3','1.2.3-beta.9'),1);
  assert.equal(catalog.compareCodexVersions('not-a-version','0.153.0'),null);
});

test('model client compatibility warns only when official minimum metadata is actionable', () => {
  const entries=[
    {id:'gpt-6.1-sol',displayName:'GPT-6.1 Sol',reasoningLevels:['low','medium'],defaultReasoningLevel:'low',priority:1,minimalClientVersion:'0.153.0'},
    {id:'provider/custom',displayName:'Custom',reasoningLevels:[],defaultReasoningLevel:null,priority:2,minimalClientVersion:null},
  ];
  assert.equal(catalog.modelClientCompatibility('gpt-6.1-sol','0.152.9',entries).status,'too-old');
  assert.equal(catalog.modelClientCompatibility('gpt-6.1-sol','0.153.0',entries).status,'compatible');
  assert.equal(catalog.modelClientCompatibility('gpt-6.1-sol','development-build',entries).status,'unknown');
  assert.equal(catalog.modelClientCompatibility('provider/custom','0.100.0',entries),null);
  assert.equal(catalog.modelClientCompatibility('missing','0.100.0',entries),null);
  assert.equal(catalog.modelClientCompatibility('gpt-6.1-sol',null,entries),null);
});

test('reasoning reconciliation uses the official default only for incompatible explicit model changes', () => {
  const entries = [
    { id: 'gpt-a', displayName: 'A', reasoningLevels: ['low','high','xhigh'], defaultReasoningLevel: 'high', priority: 1, minimalClientVersion: null },
    { id: 'gpt-b', displayName: 'B', reasoningLevels: ['low','high'], defaultReasoningLevel: 'missing', priority: 2, minimalClientVersion: null },
  ];

  assert.equal(catalog.reconcileReasoningLevelForModel('gpt-a', 'xhigh', entries), 'xhigh');
  assert.equal(catalog.reconcileReasoningLevelForModel('gpt-a', 'medium', entries), 'high');
  assert.equal(catalog.reconcileReasoningLevelForModel('gpt-b', 'xhigh', entries), 'low');
  assert.equal(catalog.reconcileReasoningLevelForModel('provider/custom', 'xhigh', entries), 'xhigh');
  assert.equal(catalog.reconcileReasoningLevelForModel('gpt-a', null, entries, true), null);
  assert.equal(catalog.reconcileReasoningLevelForModel('gpt-a', null, entries, false), 'high');
});

test('official models lead the selector while built-in legacy models remain as fallback', () => {
  const merged = catalog.mergeModelCatalogIds(
    ['gpt-6-sol', 'gpt-5.6-terra', 'provider/custom'],
    [
      { id: 'gpt-7-sol', displayName: 'GPT-7 Sol', reasoningLevels: [], priority: 1, minimalClientVersion: null },
      { id: 'gpt-6-sol', displayName: 'GPT-6 Sol', reasoningLevels: [], priority: 2, minimalClientVersion: null },
    ],
  );

  assert.deepEqual(merged, ['gpt-7-sol', 'gpt-6-sol', 'gpt-5.6-terra', 'provider/custom']);
});

test('fresh cached official catalog avoids a network request', async () => {
  const key = 'codex-config-studio.official-model-catalog.v1';
  installStorage(new Map([[key, JSON.stringify({
    entries: [{ id: 'gpt-cached', displayName: 'Cached', reasoningLevels: ['high'], priority: 1, minimalClientVersion: null }],
    fetchedAt: Date.now(),
    sourceUrl: catalog.OFFICIAL_MODEL_CATALOG_SOURCE,
  })]]));

  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    throw new Error('should not fetch');
  };

  const result = await catalog.loadOfficialModelCatalog();
  assert.equal(result.state.status, 'fresh');
  assert.deepEqual(result.entries.map(entry => entry.id), ['gpt-cached']);
  assert.equal(result.entries[0].defaultReasoningLevel, null);
  assert.equal(calls, 0);
});

test('stale cache remains usable when the official source cannot be refreshed', async () => {
  const key = 'codex-config-studio.official-model-catalog.v1';
  installStorage(new Map([[key, JSON.stringify({
    entries: [{ id: 'gpt-stale', displayName: 'Stale', reasoningLevels: [], priority: 1, minimalClientVersion: null }],
    fetchedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    sourceUrl: catalog.OFFICIAL_MODEL_CATALOG_SOURCE,
  })]]));

  globalThis.fetch = async () => { throw new Error('offline'); };

  const result = await catalog.loadOfficialModelCatalog();
  assert.equal(result.state.status, 'stale');
  assert.deepEqual(result.entries.map(entry => entry.id), ['gpt-stale']);
  assert.match(result.state.error, /offline/);
});

test('invalid remote documents never replace the safe built-in fallback path', async () => {
  installStorage();
  globalThis.fetch = async () => new Response(JSON.stringify({
    models: [{ slug: 'private-only', visibility: 'hide', priority: 1 }],
  }), { status: 200 });

  const result = await catalog.loadOfficialModelCatalog(true);
  assert.equal(result.state.status, 'unavailable');
  assert.deepEqual(result.entries, []);
  assert.match(result.state.error, /no visible models/);
});
