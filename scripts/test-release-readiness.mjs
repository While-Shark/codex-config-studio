import assert from 'node:assert/strict';
import { test } from 'node:test';
import { releaseReadiness } from './release-readiness.mjs';

test('release readiness keeps code-side checks green and secrets explicit',()=>{
  const result=releaseReadiness();
  assert.match(result.version,/^\d+\.\d+\.\d+$/);
  const [major,minor]=result.version.split('.').map(Number);
  assert.equal(result.nextMinor,String(major)+'.'+String(minor+1)+'.0');
  assert.equal(result.readyForDispatch,true,JSON.stringify(result.checks,null,2));
  assert.ok(result.checks.length>=6);
  assert.ok(result.checks.every(item=>item.status==='ok'));
  assert.deepEqual(result.external.map(item=>item.name),[
    'TAURI_SIGNING_PRIVATE_KEY',
    'TAURI_UPDATER_PUBKEY',
    'TAURI_SIGNING_PRIVATE_KEY_PASSWORD',
  ]);
  assert.equal(result.external[2].status,'optional');
});
