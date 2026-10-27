import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyReleaseFiles } from '../scripts/verify-release-files.mjs';
import { canonicalReleaseAssetName, normalizeReleaseArtifacts } from '../scripts/normalize-release-artifacts.mjs';
import { validateManifestAssets } from '../scripts/verify-published-updater.mjs';

const names = [
  'Codex.Config.Studio_0.6.0_x64-setup.exe',
  'Codex.Config.Studio_0.6.0_x64-setup.exe.sig',
  'Codex.Config.Studio_0.6.0_amd64.AppImage',
  'Codex.Config.Studio_0.6.0_amd64.AppImage.sig',
  'Codex.Config.Studio_0.6.0_amd64.deb',
  'Codex.Config.Studio_0.6.0_amd64.deb.sig',
  'Codex.Config.Studio_0.6.0_universal.dmg',
  'Codex.Config.Studio_0.6.0_universal.app.tar.gz',
  'Codex.Config.Studio_0.6.0_universal.app.tar.gz.sig',
];

function fixture(files = names) {
  const dir = mkdtempSync(join(tmpdir(), 'codex-release-files-'));
  for (const name of files) writeFileSync(join(dir, name), 'artifact');
  return dir;
}

test('release artifact verifier accepts one complete cross-platform set', () => {
  const dir = fixture();
  try {
    const result = verifyReleaseFiles(dir);
    assert.equal(result['Windows NSIS installer'], names[0]);
    assert.equal(result['Linux AppImage'], names[2]);
    assert.equal(result['Linux deb package'], names[4]);
    assert.equal(result['macOS DMG'], names[6]);
    assert.equal(result['macOS updater archive'], names[7]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('release artifact verifier rejects missing or duplicate required payloads', () => {
  const missing = fixture(names.filter(name => !name.endsWith('.AppImage')));
  try {
    assert.throws(() => verifyReleaseFiles(missing), /Expected exactly one Linux AppImage/);
  } finally {
    rmSync(missing, { recursive: true, force: true });
  }

  const duplicate = fixture([...names, 'duplicate_amd64.deb']);
  try {
    assert.throws(() => verifyReleaseFiles(duplicate), /Expected exactly one Linux deb package/);
  } finally {
    rmSync(duplicate, { recursive: true, force: true });
  }
});

test('release artifact verifier rejects a signature whose payload filename does not match', () => {
  const files = names.map(name =>
    name === 'Codex.Config.Studio_0.6.0_x64-setup.exe.sig'
      ? 'Different.Product_0.6.0_x64-setup.exe.sig'
      : name
  );
  const dir = fixture(files);
  try {
    assert.throws(() => verifyReleaseFiles(dir), /Updater signature has no matching payload/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('release artifact verifier rejects zero-byte release files', () => {
  const dir = fixture();
  try {
    writeFileSync(join(dir, names[6]), '');
    assert.throws(() => verifyReleaseFiles(dir), /Release artifact is empty/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('GitHub-safe names are deterministic, idempotent and preserve matching signatures', () => {
  const originals = names.map(name => name.replace('Codex.Config.Studio', 'Codex Config Studio').replace('0.6.0', '0.6.6'));
  const expected = names.map(name => name.replace('0.6.0', '0.6.6')).sort();
  const dir = fixture(originals);
  try {
    assert.throws(() => verifyReleaseFiles(dir), /Non-canonical Release asset filename/);
    const changed = normalizeReleaseArtifacts(dir);
    assert.equal(changed.length, originals.length);
    assert.deepEqual(readdirSync(dir).sort(), expected);
    assert.deepEqual(normalizeReleaseArtifacts(dir), []);
    assert.ok(verifyReleaseFiles(dir)['Windows updater signature'].endsWith('.sig'));
    execFileSync(process.execPath, [resolve('scripts/build-updater-manifest.mjs'), dir, '0.6.6', 'v0.6.6', 'While-Shark/codex-config-studio']);
    const manifest = JSON.parse(readFileSync(join(dir, 'latest.json'), 'utf8'));
    const urls = validateManifestAssets(manifest, readdirSync(dir), 'v0.6.6', 'While-Shark/codex-config-studio');
    assert.equal(manifest.version, '0.6.6');
    assert.equal(urls.length, 4);
    assert.equal(manifest.platforms['windows-x86_64-nsis'].url,
      'https://github.com/While-Shark/codex-config-studio/releases/download/v0.6.6/Codex.Config.Studio_0.6.6_x64-setup.exe');
    assert.equal(manifest.platforms['darwin-aarch64-app'].url,
      'https://github.com/While-Shark/codex-config-studio/releases/download/v0.6.6/Codex.Config.Studio_0.6.6_universal.app.tar.gz');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('normalization rejects collisions before mutating any asset names', () => {
  const dir = fixture(['Codex Config Studio.exe', 'Codex.Config.Studio.exe']);
  try {
    assert.throws(() => normalizeReleaseArtifacts(dir), /filename collision/);
    assert.deepEqual(readdirSync(dir).sort(), ['Codex Config Studio.exe', 'Codex.Config.Studio.exe']);
    assert.equal(canonicalReleaseAssetName('Codex Config Studio.exe'), 'Codex.Config.Studio.exe');
    assert.throws(() => canonicalReleaseAssetName('../bad'), /Invalid Release asset filename/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('manifest validation rejects stale, mismatched or unsanitized download URLs', () => {
  const manifest = { platforms: Object.fromEntries(
    ['windows-x86_64-nsis', 'windows-x86_64', 'linux-x86_64-appimage', 'linux-x86_64-deb', 'linux-x86_64', 'darwin-x86_64-app', 'darwin-aarch64-app', 'darwin-x86_64', 'darwin-aarch64']
      .map(name => [name, { signature: 'test-signature',
        url: 'https://github.com/While-Shark/codex-config-studio/releases/download/v0.6.6/Codex%20Config%20Studio_0.6.6_x64-setup.exe' }])) };
  assert.throws(() => validateManifestAssets(manifest, names, 'v0.6.6', 'While-Shark/codex-config-studio'), /Unsafe GitHub asset name/);
});
