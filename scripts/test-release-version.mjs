import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { assertReleaseVersionsAligned, releaseVersionSnapshot } from './check-release-version.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const temp=mkdtempSync(join(tmpdir(),'studio-release-version-'));
after(()=>rmSync(temp,{recursive:true,force:true}));

test('repository release version sources are aligned',()=>{
  const result=assertReleaseVersionsAligned(root);
  assert.match(result.version,/^\d+\.\d+\.\d+$/);
  assert.equal(new Set(Object.values(result.sources)).size,1);
});

test('preflight rejects a single drifted version source with useful diagnostics',()=>{
  mkdirSync(join(temp,'src-tauri'),{recursive:true});
  for(const path of ['package.json','package-lock.json'])cpSync(join(root,path),join(temp,path));
  for(const path of ['Cargo.toml','Cargo.lock','tauri.conf.json'])cpSync(join(root,'src-tauri',path),join(temp,'src-tauri',path));
  const tauriPath=join(temp,'src-tauri/tauri.conf.json');
  const tauri=JSON.parse(readFileSync(tauriPath,'utf8'));
  tauri.version='9.9.9';
  writeFileSync(tauriPath,JSON.stringify(tauri,null,2)+'\n');
  assert.throws(()=>assertReleaseVersionsAligned(temp),error=>{
    assert.match(String(error),/Release version sources are inconsistent/);
    assert.match(String(error),/tauri=9\.9\.9/);
    return true;
  });
});

test('version snapshot names every release source explicitly',()=>{
  assert.deepEqual(Object.keys(releaseVersionSnapshot(root)),[
    'packageJson','packageLock','packageLockRoot','tauri','cargoToml','cargoLock'
  ]);
});
