import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadTypeScript } from './helpers/load-typescript.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const updates=loadTypeScript(resolve(root,'src/update-checker.ts'));

test('semantic version comparison handles normal release versions',()=>{
  assert.equal(updates.compareVersions('0.5.0','0.5.0'),0);
  assert.equal(updates.compareVersions('0.5.0','0.5.1'),-1);
  assert.equal(updates.compareVersions('0.10.0','0.9.9'),1);
  assert.equal(updates.compareVersions('v1.2.0','1.2'),0);
});

test('update checker only targets the stable latest release endpoint',()=>{
  const source=readFileSync(resolve(root,'src/update-checker.ts'),'utf8');
  assert.match(source,/releases\/latest/);
  assert.doesNotMatch(source,/releases\/tags\/nightly/);
  assert.match(source,/release\.prerelease===true/);
  assert.match(source,/release\.draft===true/);
});

test('release opener is a fixed native command without URL input',()=>{
  const source=readFileSync(resolve(root,'src-tauri/src/lib.rs'),'utf8');
  assert.match(source,/async fn open_stable_release_page\(\)/);
  assert.match(source,/https:\/\/github\.com\/While-Shark\/codex-config-studio\/releases\/latest/);
  assert.doesNotMatch(source,/open_stable_release_page\([^)]*String/);
});
