import { readFileSync, writeFileSync } from 'node:fs';

const bump = process.argv[2] ?? 'patch';
if (!['patch', 'minor', 'major'].includes(bump)) {
  throw new Error(`Unsupported bump type: ${bump}`);
}

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

const packageJson = readJson('package.json');
const match = String(packageJson.version).match(/^(\d+)\.(\d+)\.(\d+)$/);
if (!match) throw new Error(`package.json version is not semantic: ${packageJson.version}`);
let [, majorText, minorText, patchText] = match;
let major = Number(majorText);
let minor = Number(minorText);
let patch = Number(patchText);
if (bump === 'major') {
  major += 1; minor = 0; patch = 0;
} else if (bump === 'minor') {
  minor += 1; patch = 0;
} else {
  patch += 1;
}
const version = `${major}.${minor}.${patch}`;

packageJson.version = version;
writeJson('package.json', packageJson);

const packageLock = readJson('package-lock.json');
packageLock.version = version;
if (packageLock.packages?.['']) packageLock.packages[''].version = version;
writeJson('package-lock.json', packageLock);

const tauriConfig = readJson('src-tauri/tauri.conf.json');
tauriConfig.version = version;
writeJson('src-tauri/tauri.conf.json', tauriConfig);

const cargoTomlPath = 'src-tauri/Cargo.toml';
let cargoToml = readFileSync(cargoTomlPath, 'utf8');
cargoToml = cargoToml.replace(/(\[package\][\s\S]*?\nversion\s*=\s*")[^"]+("\s*\n)/, `$1${version}$2`);
writeFileSync(cargoTomlPath, cargoToml);

const cargoLockPath = 'src-tauri/Cargo.lock';
let cargoLock = readFileSync(cargoLockPath, 'utf8');
const lockPattern = /(\[\[package\]\]\nname = "codex-config-studio"\nversion = ")[^"]+("\n)/;
if (!lockPattern.test(cargoLock)) throw new Error('Could not find codex-config-studio in Cargo.lock');
cargoLock = cargoLock.replace(lockPattern, `$1${version}$2`);
writeFileSync(cargoLockPath, cargoLock);

process.stdout.write(version);
