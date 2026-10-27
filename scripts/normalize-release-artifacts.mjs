import { readdirSync, renameSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** GitHub may rewrite unsafe Release asset names (notably spaces) during upload. */
export function canonicalReleaseAssetName(name) {
  if (!name || name === '.' || name === '..' || name.startsWith('.') || /[/\\]/.test(name)) {
    throw new Error('Invalid Release asset filename: ' + name);
  }
  const canonical = name.replace(/[^A-Za-z0-9._-]+/g, '.');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(canonical)) {
    throw new Error('Cannot normalize Release asset filename: ' + name);
  }
  return canonical;
}

/** Normalize the *actual uploaded files* before computing URLs, hashes or attestations. */
export function normalizeReleaseArtifacts(dirArg) {
  if (!dirArg) throw new Error('Usage: node scripts/normalize-release-artifacts.mjs <release-files-dir>');
  const dir = resolve(dirArg);
  const names = readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile()).map(entry => entry.name);
  const plan = names.map(name => ({ from: name, to: canonicalReleaseAssetName(name) }));
  const destinationNames = new Set();
  for (const entry of plan) {
    if (destinationNames.has(entry.to)) {
      throw new Error('Release asset filename collision after normalization: ' + entry.to);
    }
    destinationNames.add(entry.to);
  }
  for (const entry of plan) {
    if (entry.from !== entry.to) renameSync(join(dir, entry.from), join(dir, entry.to));
  }
  return plan.filter(entry => entry.from !== entry.to);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  for (const entry of normalizeReleaseArtifacts(process.argv[2])) {
    console.log('Canonicalized Release asset: ' + entry.from + ' -> ' + entry.to);
  }
}
