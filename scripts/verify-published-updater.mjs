import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Check exact filenames, platform signatures and URLs without network access. */
export function validateManifestAssets(manifest, files, tag, repository) {
  assert.ok(manifest && typeof manifest === 'object' && manifest.platforms, 'Missing updater platforms');
  const names = new Set(files);
  const prefix = 'https://github.com/' + repository + '/releases/download/' + encodeURIComponent(tag) + '/';
  const entries = Object.entries(manifest.platforms);
  assert.ok(entries.length >= 9, 'Incomplete updater platform matrix');
  const urls = new Set();
  for (const [platform, asset] of entries) {
    assert.ok(typeof asset.signature === 'string' && asset.signature.trim(), 'Missing updater signature for ' + platform);
    assert.ok(typeof asset.url === 'string' && asset.url.startsWith(prefix), 'Wrong updater release URL for ' + platform);
    const encodedName = asset.url.slice(prefix.length);
    const filename = decodeURIComponent(encodedName);
    assert.equal(encodedName, encodeURIComponent(filename), 'Non-canonical URL encoding for ' + platform);
    assert.ok(/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(filename), 'Unsafe GitHub asset name for ' + platform);
    assert.ok(names.has(filename), 'Updater URL references a file not uploaded to GitHub: ' + filename);
    assert.ok(names.has(filename + '.sig'), 'Missing matching updater signature file: ' + filename);
    urls.add(asset.url);
  }
  assert.equal(urls.size, 4, 'Expected distinct Windows, Linux AppImage/deb, and macOS updater payloads');
  return [...urls];
}

async function withRetry(label, task, attempts = 10) {
  let error;
  for (let i = 0; i < attempts; i++) {
    try { return await task(); }
    catch (caught) {
      error = caught;
      if (i + 1 < attempts) await new Promise(resolve => setTimeout(resolve, 4000));
    }
  }
  throw new Error(label + ' was not reachable after ' + attempts + ' attempts: ' + String(error));
}

async function fetchPublishedManifest(url, expectedVersion) {
  return withRetry(url, async () => {
    const response = await fetch(url, { headers: { 'User-Agent': 'codex-config-studio-release-check', 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const manifest = await response.json();
    if (manifest.version !== expectedVersion) throw new Error('Expected version ' + expectedVersion + ', found ' + manifest.version);
    return manifest;
  });
}

async function assertDownloadable(url) {
  await withRetry(url, async () => {
    const response = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': 'codex-config-studio-release-check' }, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error('HTTP ' + response.status);
  });
}

export async function verifyPublishedUpdater(dirArg, tag, repository = 'While-Shark/codex-config-studio') {
  if (!dirArg || !/^v\d+\.\d+\.\d+$/.test(tag)) {
    throw new Error('Usage: node scripts/verify-published-updater.mjs <dir> <vX.Y.Z> [repository]');
  }
  const dir = resolve(dirArg);
  const expected = JSON.parse(readFileSync(resolve(dir, 'latest.json'), 'utf8'));
  const files = readdirSync(dir);
  const payloadUrls = validateManifestAssets(expected, files, tag, repository);
  const releaseUrl = 'https://github.com/' + repository + '/releases/download/' + encodeURIComponent(tag) + '/latest.json';
  const updaterUrl = 'https://github.com/' + repository + '/releases/latest/download/latest.json';
  const releaseManifest = await fetchPublishedManifest(releaseUrl, expected.version);
  assert.deepEqual(releaseManifest.platforms, expected.platforms, 'Published updater manifest differs from signed artifact matrix');
  const latestManifest = await fetchPublishedManifest(updaterUrl, expected.version);
  assert.deepEqual(latestManifest.platforms, expected.platforms, 'The actual updater endpoint does not serve the newly published Release');
  for (const url of payloadUrls) {
    await assertDownloadable(url);
    console.log('Verified downloadable updater asset: ' + url);
  }
  console.log('Published latest.json and all platform URLs verified for ' + tag);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [, , dir, tag, repository] = process.argv;
  await verifyPublishedUpdater(dir, tag, repository);
}
