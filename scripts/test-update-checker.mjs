import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { loadTypeScript } from './helpers/load-typescript.mjs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { normalizeUpdaterPublicKey } from './updater-public-key.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const updates=loadTypeScript(resolve(root,'src/update-version.ts'));
const updatePolicy=loadTypeScript(resolve(root,'src/update-policy.ts'));


test('updater public key normalizer accepts canonical and common stored formats',()=>{
  const keyLine='RWTQi2D4kPJE4D8JgpqNOiyzGfQYCoRxHiY0VYmWCLhLzU9+YXiOFjxA';
  const keyFile='untrusted comment: minisign public key: E044F290F8608BD0\n'+keyLine+'\n';
  const canonical=Buffer.from(keyFile,'utf8').toString('base64');
  const synthesized=Buffer.from('untrusted comment: minisign public key\n'+keyLine+'\n','utf8').toString('base64');

  assert.equal(normalizeUpdaterPublicKey(canonical),canonical);
  assert.equal(normalizeUpdaterPublicKey(keyFile),canonical);
  assert.equal(normalizeUpdaterPublicKey(keyLine),synthesized);
  assert.equal(normalizeUpdaterPublicKey(Buffer.from(keyLine,'utf8').toString('base64')),synthesized);
  assert.throws(()=>normalizeUpdaterPublicKey('not-a-public-key'),/TAURI_UPDATER_PUBKEY must be/);
});

test('semantic version comparison handles normal release versions',()=>{
  assert.equal(updates.compareVersions('0.5.0','0.5.0'),0);
  assert.equal(updates.compareVersions('0.5.0','0.5.1'),-1);
  assert.equal(updates.compareVersions('0.10.0','0.9.9'),1);
  assert.equal(updates.compareVersions('v1.2.0','1.2'),0);
});


test('automatic update checks are periodic while update prompts are rate-limited per version',()=>{
  const now=1_800_000_000_000;
  assert.equal(updatePolicy.shouldRunAutomaticUpdateCheck(0,now),true);
  assert.equal(updatePolicy.shouldRunAutomaticUpdateCheck(now-60*60*1000,now),false);
  assert.equal(updatePolicy.shouldRunAutomaticUpdateCheck(now-updatePolicy.AUTO_UPDATE_CHECK_INTERVAL_MS,now),true);

  assert.equal(updatePolicy.shouldPromptAutomaticUpdate('0.6.1',null,now),true);
  const record=updatePolicy.automaticUpdatePromptRecord('0.6.1',now);
  assert.equal(updatePolicy.shouldPromptAutomaticUpdate('0.6.1',record,now+23*60*60*1000),false);
  assert.equal(updatePolicy.shouldPromptAutomaticUpdate('0.6.1',record,now+updatePolicy.AUTO_UPDATE_PROMPT_COOLDOWN_MS),true);
  assert.equal(updatePolicy.shouldPromptAutomaticUpdate('0.6.2',record,now+1000),true);
  assert.equal(updatePolicy.shouldPromptAutomaticUpdate('0.6.1','not-json',now+1000),true);
});

test('startup waits for updater readiness before proactive automatic update checking',()=>{
  const source=readFileSync(resolve(root,'src/main.ts'),'utf8');
  const updaterReady=source.indexOf('signedUpdaterReady=await signedUpdaterEnabled()');
  const startupCheck=source.indexOf("await runUpdateCheck('automatic')");
  assert.ok(updaterReady>=0&&startupCheck>updaterReady,'signed updater readiness must resolve before the automatic startup check');
  assert.match(source,/setInterval\(\(\)=>\{void runUpdateCheck\('automatic'\);\},AUTO_UPDATE_CHECK_INTERVAL_MS\)/);
  assert.match(source,/visibilityState==='visible'&&shouldRunAutomaticUpdateCheck/);
  assert.match(source,/runUpdateCheck\('manual'\)/);
  assert.match(source,/shouldPromptAutomaticUpdate\(next\.latestVersion/);
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


test('signed updater stays behind compile-time public key and fixed latest manifest',()=>{
  const rust=readFileSync(resolve(root,'src-tauri/src/updater.rs'),'utf8');
  const config=JSON.parse(readFileSync(resolve(root,'src-tauri/tauri.conf.json'),'utf8'));
  assert.match(rust,/option_env!\("CODEX_UPDATER_PUBKEY"\)/);
  assert.match(rust,/download_and_install/);
  assert.match(rust,/app\.restart\(\)/);
  assert.equal(config.plugins.updater.pubkey,'');
  assert.equal(config.plugins.updater.requireSignedVersion,true);
  assert.deepEqual(config.plugins.updater.endpoints,[
    'https://github.com/While-Shark/codex-config-studio/releases/latest/download/latest.json'
  ]);
});

test('release workflow requires updater secrets and publishes manifest plus signatures',()=>{
  const workflow=readFileSync(resolve(root,'.github/workflows/release.yml'),'utf8');
  assert.match(workflow,/TAURI_SIGNING_PRIVATE_KEY/);
  assert.match(workflow,/TAURI_UPDATER_PUBKEY/);
  assert.match(workflow,/prepare-updater-build\.mjs/);
  assert.match(workflow,/build-updater-manifest\.mjs/);
  assert.match(workflow,/\.app\.tar\.gz\.sig/);
  assert.match(workflow,/\.AppImage\.sig/);
  assert.match(workflow,/\.deb\.sig/);
  assert.match(workflow,/setup\.exe\.sig/);
});


test('updater manifest maps installer-specific targets to matching packages',()=>{
  const source=readFileSync(resolve(root,'scripts/build-updater-manifest.mjs'),'utf8');
  assert.match(source,/windows-x86_64-nsis/);
  assert.match(source,/linux-x86_64-appimage/);
  assert.match(source,/linux-x86_64-deb/);
  assert.match(source,/darwin-x86_64-app/);
  assert.match(source,/darwin-aarch64-app/);
  assert.match(source,/\.deb\.sig/);
});


test('updater manifest generator emits matching signed package URLs',()=>{
  const dir=mkdtempSync(join(tmpdir(),'ccs-updater-'));
  try{
    for(const name of [
      'Codex_1.2.3_x64-setup.exe',
      'Codex_1.2.3_x64-setup.exe.sig',
      'Codex_1.2.3_amd64.AppImage',
      'Codex_1.2.3_amd64.AppImage.sig',
      'Codex_1.2.3_amd64.deb',
      'Codex_1.2.3_amd64.deb.sig',
      'Codex_1.2.3_universal.dmg',
      'Codex.app.tar.gz',
      'Codex.app.tar.gz.sig',
    ])writeFileSync(join(dir,name),name.endsWith('.sig')?'trusted-signature\n':'artifact\n');
    const run=spawnSync(process.execPath,[
      resolve(root,'scripts/build-updater-manifest.mjs'),dir,'1.2.3','v1.2.3','While-Shark/codex-config-studio'
    ],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    const manifest=JSON.parse(readFileSync(join(dir,'latest.json'),'utf8'));
    assert.equal(manifest.version,'1.2.3');
    assert.match(manifest.platforms['windows-x86_64-nsis'].url,/-setup\.exe$/);
    assert.match(manifest.platforms['linux-x86_64-appimage'].url,/\.AppImage$/);
    assert.match(manifest.platforms['linux-x86_64-deb'].url,/\.deb$/);
    assert.match(manifest.platforms['darwin-aarch64-app'].url,/\.app\.tar\.gz$/);
    assert.equal(manifest.platforms['linux-x86_64-deb'].signature,'trusted-signature');
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('distributed Nightly embeds only a verification key while PR builds stay unsigned',()=>{
  const dir=mkdtempSync(join(tmpdir(),'ccs-update-client-'));
  try{
    const keyFile='untrusted comment: minisign public key\nRWTQi2D4kPJE4D8JgpqNOiyzGfQYCoRxHiY0VYmWCLhLzU9+YXiOFjxA\n';
    const env=join(dir,'github-env'),config=join(dir,'client.json');
    const run=spawnSync(process.execPath,[resolve(root,'scripts/prepare-updater-client.mjs')],{encoding:'utf8',env:{...process.env,CODEX_UPDATER_PUBKEY:keyFile,GITHUB_ENV:env,CODEX_TAURI_CLIENT_CONFIG_PATH:config,TAURI_SIGNING_PRIVATE_KEY:''}});
    assert.equal(run.status,0,run.stderr);
    const overlay=JSON.parse(readFileSync(config,'utf8'));
    assert.equal(overlay.bundle.createUpdaterArtifacts,false);
    assert.equal(overlay.plugins.updater.pubkey,normalizeUpdaterPublicKey(keyFile));
    assert.match(readFileSync(env,'utf8'),/CODEX_UPDATER_PUBKEY=/);
    assert.doesNotMatch(readFileSync(env,'utf8'),/TAURI_SIGNING_PRIVATE_KEY/);
    const workflow=readFileSync(resolve(root,'.github/workflows/build-windows.yml'),'utf8');
    assert.match(workflow,/if: github.event_name != 'pull_request'\n\s+env:\n\s+CODEX_UPDATER_PUBKEY/);
    assert.match(workflow,/github.event_name != 'pull_request' && '--config src-tauri\/tauri.updater-client.conf.json'/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});

const require=createRequire(import.meta.url),ts=require('typescript');
function clientFixture(overrides={}){
  const module={exports:{}};
  const ctx={module,exports:module.exports,setTimeout,clearTimeout,AbortController,console,
    require:name=>name.includes('/app')?{getVersion:async()=> '0.6.3'}:name.includes('/core')?{
      Channel:class {onmessage=()=>{};},
      invoke:overrides.invoke??(async()=>({enabled:true})),
    }:updates,
  };
  const compiled=ts.transpileModule(readFileSync(resolve(root,'src/update-checker.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  runInNewContext(compiled,ctx);return module.exports;
}
test('install client streams progress from a command channel and all five locales describe stages',async()=>{
  const progress=[];
  const client=clientFixture({invoke:async(command,{onEvent})=>{
    assert.equal(command,'install_signed_update');
    onEvent.onmessage({stage:'downloading',downloaded:50,total:100});
    onEvent.onmessage({stage:'installing',downloaded:0,total:null});
  }});
  await client.installSignedUpdate(item=>progress.push(item));assert.equal(progress.length,2);
  for(const locale of ['en','zh-CN','zh-TW','ja','ko']){
    const copy=client.updateText(locale);assert.ok(Object.values(copy).every(value=>typeof value==='string'&&value.length));
    assert.match(client.updateProgressLabel(progress[0],copy),/50%/);
    assert.equal(client.updateProgressLabel(progress[1],copy),copy.installing);
    assert.equal(client.updateProgressLabel({stage:'downloading',downloaded:50,total:null},copy),copy.downloading);
    assert.match(client.updateProgressLabel({stage:'downloading',downloaded:150,total:100},copy),/100%/);
  }
});
const mainSource=readFileSync(resolve(root,'src/main.ts'),'utf8');
const mainAst=ts.createSourceFile('main.ts',mainSource,ts.ScriptTarget.Latest,true);
const presentSource=mainAst.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='presentAvailableUpdate').getText(mainAst);
const presentJs=ts.transpileModule(presentSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function installFixture(overrides={}){
  const calls=[],client=clientFixture();
  const ctx={busy:false,confirmResolver:null,updateInstallLabel:null,signedUpdaterReady:null,
    getLocale:()=> 'en',updateText:client.updateText,updateProgressLabel:client.updateProgressLabel,
    signedUpdaterEnabled:async()=>true,getChanges:()=>[],askConfirm:async spec=>{calls.push(['confirm',spec]);return true;},
    installSignedUpdate:async cb=>{calls.push(['install']);cb({stage:'downloading',downloaded:5,total:10});},
    openStableReleasePage:async()=>{calls.push(['browser']);},toast:(...args)=>calls.push(['toast',...args]),
    renderUpdateStatus:()=>{},...overrides};
  ctx.setBusy=value=>{ctx.busy=value;calls.push(['busy',value]);};
  const run=()=>runInNewContext(presentJs+'\npresentAvailableUpdate({status:"available",currentVersion:"0.6.3",latestVersion:"0.6.4",notes:"notes"});',ctx);
  return {ctx,calls,run};
}
test('ready builds install in-app and lock writes without opening the browser',async()=>{
  const f=installFixture();await f.run();
  assert.equal(f.calls.find(c=>c[0]==='confirm')[1].confirmText,'Install and restart');
  assert.deepEqual(f.calls.filter(c=>['install','busy','browser'].includes(c[0])),[['busy',true],['install'],['busy',false]]);
  assert.equal(f.ctx.updateInstallLabel,null);
});
test('failed installation stays in-app, unlocks controls and explains retry',async()=>{
  const f=installFixture({installSignedUpdate:async()=>{throw Error('signature mismatch');}});await f.run();
  assert.equal(f.ctx.busy,false);assert.equal(f.ctx.updateInstallLabel,null);
  assert.ok(f.calls.some(c=>c[0]==='toast'&&c[1].includes('retry')&&c[2]===true));
  assert.ok(!f.calls.some(c=>c[0]==='browser'));
});
test('pending configuration and cancelled confirmation do not install or restart',async()=>{
  for(const state of [{getChanges:()=>[{field:'model'}]},{askConfirm:async()=>false}]){
    const f=installFixture(state);await f.run();assert.ok(!f.calls.some(c=>c[0]==='install'));assert.equal(f.ctx.busy,false);
  }
});
test('legacy builds explain one-time manual bootstrap and only open the release page',async()=>{
  const f=installFixture({signedUpdaterEnabled:async()=>false});await f.run();
  const spec=f.calls.find(c=>c[0]==='confirm')[1];assert.match(spec.message,/one-time manual/);
  assert.equal(spec.confirmText,'Open release');assert.ok(f.calls.some(c=>c[0]==='browser'));assert.ok(!f.calls.some(c=>c[0]==='install'));
});
test('another update prompt cannot start while installation or a write is active',async()=>{
  for(const state of [{busy:true},{updateInstallLabel:'Downloading update…'}]){
    const f=installFixture(state);await f.run();assert.equal(f.calls.length,0);
  }
});
