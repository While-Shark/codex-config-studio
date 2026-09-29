import { readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const RELEASE_ARTIFACT_RULES = [
  { label: 'Windows NSIS installer', suffix: '-setup.exe' },
  { label: 'Windows updater signature', suffix: '-setup.exe.sig' },
  { label: 'Linux AppImage', suffix: '.AppImage' },
  { label: 'Linux AppImage updater signature', suffix: '.AppImage.sig' },
  { label: 'Linux deb package', suffix: '.deb' },
  { label: 'Linux deb updater signature', suffix: '.deb.sig' },
  { label: 'macOS DMG', suffix: '.dmg' },
  { label: 'macOS updater archive', suffix: '.app.tar.gz' },
  { label: 'macOS updater signature', suffix: '.app.tar.gz.sig' },
];

export function verifyReleaseFiles(dirArg) {
  if (!dirArg) throw new Error('Usage: node scripts/verify-release-files.mjs <release-files-dir>');
  const dir = resolve(dirArg);
  const files = readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
    .sort();

  const selected = new Map();
  for (const rule of RELEASE_ARTIFACT_RULES) {
    const matches = files.filter(name => name.endsWith(rule.suffix));
    if (matches.length !== 1) {
      throw new Error(`Expected exactly one ${rule.label} (*${rule.suffix}), found ${matches.length}: ${matches.join(', ') || 'none'}`);
    }
    const name = matches[0];
    const size = statSync(resolve(dir, name)).size;
    if (size <= 0) throw new Error(`Release artifact is empty: ${name}`);
    selected.set(rule.suffix, name);
  }

  for (const signatureSuffix of ['-setup.exe.sig', '.AppImage.sig', '.deb.sig', '.app.tar.gz.sig']) {
    const signature = selected.get(signatureSuffix);
    const payload = signature?.slice(0, -4);
    if (!signature || !payload || !files.includes(payload)) {
      throw new Error(`Updater signature has no matching payload: ${signature ?? signatureSuffix}`);
    }
  }

  return Object.fromEntries(RELEASE_ARTIFACT_RULES.map(rule => [rule.label, selected.get(rule.suffix)]));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const summary = verifyReleaseFiles(process.argv[2]);
  console.log('Verified release artifact set:');
  for (const [label, name] of Object.entries(summary)) console.log(`- ${label}: ${name}`);
}
