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
        supported_reasoning_levels: [{ effort: 'high' }, { effort: 'xhigh' }],
      },
      {
        slug: 'gpt-next-a',
        display_name: 'GPT Next A',
        visibility: 'list',
        priority: 2,
        supported_reasoning_levels: [{ effort: 'low' }, { effort: 'high' }, { effort: 'high' }],
      },
      { slug: '', visibility: 'list', priority: 1 },
    ],
  });

  assert.deepEqual(entries.map(entry => entry.id), ['gpt-next-a', 'gpt-next-b']);
  assert.deepEqual(entries[0].reasoningLevels, ['low', 'high']);
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
