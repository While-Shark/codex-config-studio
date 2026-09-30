import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function packageVersionFromCargo(path) {
  const text = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  const match = text.match(/\[package\][\s\S]*?\nversion\s*=\s*"([^"]+)"/);
  if (!match) throw new Error(`Could not read package version from ${path}`);
  return match[1];
}

function packageVersionFromCargoLock(path) {
  const text = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  const match = text.match(/\[\[package\]\]\nname = "codex-config-studio"\nversion = "([^"]+)"/);
  if (!match) throw new Error(`Could not read codex-config-studio version from ${path}`);
  return match[1];
}

export function releaseVersionSnapshot(root = process.cwd()) {
  const packageJson = readJson(resolve(root, 'package.json'));
  const packageLock = readJson(resolve(root, 'package-lock.json'));
  const tauri = readJson(resolve(root, 'src-tauri/tauri.conf.json'));
  return {
    packageJson: String(packageJson.version ?? ''),
    packageLock: String(packageLock.version ?? ''),
    packageLockRoot: String(packageLock.packages?.['']?.version ?? ''),
    tauri: String(tauri.version ?? ''),
    cargoToml: packageVersionFromCargo(resolve(root, 'src-tauri/Cargo.toml')),
    cargoLock: packageVersionFromCargoLock(resolve(root, 'src-tauri/Cargo.lock')),
  };
}

export function assertReleaseVersionsAligned(root = process.cwd()) {
  const versions = releaseVersionSnapshot(root);
  const values = Object.values(versions);
  const expected = versions.packageJson;
  const mismatches = Object.entries(versions).filter(([, value]) => value !== expected);
  if (!expected || mismatches.length) {
    const detail = Object.entries(versions).map(([name, value]) => `${name}=${value || '<missing>'}`).join(', ');
    throw new Error(`Release version sources are inconsistent: ${detail}`);
  }
  if (!/^\d+\.\d+\.\d+$/.test(expected)) {
    throw new Error(`Release version is not semantic: ${expected}`);
  }
  return { version: expected, sources: versions };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = assertReleaseVersionsAligned();
  console.log(`Release version sources aligned at v${result.version}`);
}
