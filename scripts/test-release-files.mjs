import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyReleaseFiles } from '../scripts/verify-release-files.mjs';

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
