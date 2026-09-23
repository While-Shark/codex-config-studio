import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
const require=createRequire(import.meta.url), ts=require('typescript');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
const output=mkdtempSync(join(tmpdir(),'studio-preset-versions-'));
after(()=>rmSync(output,{recursive:true,force:true}));
execFileSync(process.execPath,[require.resolve('typescript/lib/tsc.js'),
  join(root,'src/preset-versions.ts'),join(root,'src/preset-version-view.ts'),join(root,'src/i18n/preset-versions.ts'),
  '--strict','--target','ES2022','--module','ES2022','--skipLibCheck','--rootDir',join(root,'src'),'--outDir',output],{stdio:'pipe'});
writeFileSync(join(output,'package.json'),'{"type":"module"}');
const versionApi=await import(pathToFileURL(join(output,'preset-versions.js')));
const viewApi=await import(pathToFileURL(join(output,'preset-version-view.js')));
const {presetVersionText}=await import(pathToFileURL(join(output,'i18n/preset-versions.js')));
const {legacyPresetSnapshot}=await import(pathToFileURL(join(output,'presets/legacy-v0.4.0.js')));
const {CURRENT_PRESET_VERSION:current,LEGACY_PRESET_VERSION:legacy,versionPresets,presetVersion,matchPresetVersion,presetByReference,presetSource,parsePresetSource}=versionApi;
const source=read('src/main.ts');
const ast=ts.createSourceFile('main.ts',source,ts.ScriptTarget.Latest,true);
const js=text=>ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
function appFunction(name){const node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);assert.ok(node,name);return js(node.getText(ast));}
const declaration=ast.statements.filter(ts.isVariableStatement).flatMap(n=>[...n.declarationList.declarations]).find(n=>n.name.getText(ast)==='presets');
assert.ok(declaration);
const presets=plain(runInNewContext(js(`const presets=${declaration.initializer.getText(ast)};presets;`)));
const fields=['model','modelReasoningEffort','planModeReasoningEffort','agentsEnabled','defaultSubagentModel','defaultSubagentReasoningEffort','maxConcurrentThreadsPerSession'];
const currentExpected=[
  ['token-save','gpt-6-luna','low','medium',false,null,null,null],
  ['economy','gpt-6-luna','medium','high',false,null,null,null],
  ['daily','gpt-6-luna','medium','high',true,'gpt-6-luna','medium',2],
  ['balanced','gpt-6-sol','medium','high',true,'gpt-6-luna','medium',2],
  ['astra','gpt-6-astra','medium','high',true,'gpt-6-luna','medium',2],
  ['max','gpt-6-astra','xhigh','xhigh',true,'gpt-6-luna','high',3],
];
const oldExpected=[
  ['token-save','gpt-5.6-luna','low','medium',false,null,null,null],
  ['economy','gpt-5.6-luna','medium','high',false,null,null,null],
  ['daily','gpt-5.6-terra','medium','high',true,'gpt-5.6-luna','medium',2],
  ['balanced','gpt-5.6-sol','medium','high',true,'gpt-5.6-luna','medium',2],
  ['astra','gpt-6-astra','medium','high',true,'gpt-5.6-luna','medium',2],
  ['max','gpt-6-astra','xhigh','xhigh',true,'gpt-5.6-luna','high',3],
];
const rows=items=>items.map(p=>[p.id,...fields.map(field=>p.values[field])]);
const oldDaily=legacyPresetSnapshot.presets.find(p=>p.id==='daily').values;
function context(extra={}){
  const confirms=[],writes=[],messages=[];
  const draft=structuredClone(presets[2].values);
  const ctx={...versionApi,...viewApi,presetVersionText,presets:structuredClone(presets),fields,
    busy:false,confirmResolver:null,values:draft,lastSnapshot:{exists:true,path:'/projects/a/.codex/config.toml',values:structuredClone(oldDaily)},
    activeTab:'presets',activePreset:'',activePresetVersion:current,viewedPresetVersion:current,draftPresetSource:null,
    requestScope:()=>({kind:'project',projectPath:'/projects/a'}),getLocale:()=> 'en',t:key=>key,presetText:(id,part)=>`${id}.${part}`,
    fieldLabel:field=>field,displayValue:(_field,value)=>value===null?'inherit':String(value),clone:structuredClone,
    renderWorkspace(){},renderRightRail(){},setStatus(){},setBusy(value){ctx.busy=value;},
    loadHistoryAfterWrite:async()=>{},toast:message=>messages.push(message),document:{},validateModelPickers:()=>true,
    getChanges:()=>fields.filter(f=>ctx.values[f]!==ctx.lastSnapshot.values[f]).map(field=>({field,from:String(ctx.lastSnapshot.values[field]),to:String(ctx.values[field])})),
    askConfirm:async spec=>{confirms.push(spec);return true;},
    safeInvoke:async(command,args)=>{writes.push({command,args:structuredClone(args)});return {...ctx.lastSnapshot,values:structuredClone(args.values)};},
    ...extra,
  };
  return {ctx,confirms,writes,messages,run:(name,arg)=>{ctx.argument=arg;return runInNewContext(appFunction(name)+`\n${name}(argument);`,ctx);}};
}

test('all current quick profiles use GPT-6; reasoning and flags remain exact',()=>assert.deepEqual(rows(presets),currentExpected));
test('archive keeps the exact six v0.4.0 profiles including Terra and legacy workers',()=>{
  assert.deepEqual(rows(legacyPresetSnapshot.presets),oldExpected);
  assert.equal(legacyPresetSnapshot.sourceTag,'v0.4.0');
  assert.equal(legacyPresetSnapshot.sourceCommit,'c9cf5fe3d3b0f467c1c858321f03e429b065398f');
});
test('archived data and descriptions are deeply frozen and independent of drafts',()=>{
  const before=JSON.stringify(legacyPresetSnapshot);
  assert.throws(()=>{legacyPresetSnapshot.presets[2].values.model='oops';},TypeError);
  assert.throws(()=>{legacyPresetSnapshot.descriptions.en.daily='oops';},TypeError);
  const draft=structuredClone(oldDaily);draft.model='custom/model';
  assert.equal(JSON.stringify(legacyPresetSnapshot),before);
});
test('versions are unambiguous; unknown revisions cannot silently load a default',()=>{
  assert.equal(new Set(versionApi.presetVersions.map(v=>v.id)).size,2);
  assert.equal(versionPresets(presets,current),presets);
  assert.equal(versionPresets(presets,legacy),legacyPresetSnapshot.presets);
  assert.throws(()=>versionPresets(presets,'invalid'));
  assert.equal(presetByReference(presets,{versionId:'invalid',presetId:'daily'}),undefined);
});
test('each revision can be identified without migrating loaded configuration',()=>{
  for(const version of [current,legacy])for(const p of versionPresets(presets,version)){
    const before=JSON.stringify(p.values);
    assert.deepEqual(matchPresetVersion(presets,p.values),{versionId:version,presetId:p.id});
    assert.equal(JSON.stringify(p.values),before);
  }
});
test('current translations reflect new models while archived translations keep Terra',()=>{
  for(const locale of ['zh-CN','zh-TW','en','ja','ko']){
    assert.ok(legacyPresetSnapshot.descriptions[locale].daily.includes('Terra'));
    for(const p of presets){
      const match=read(`src/i18n/${locale}.ts`).match(new RegExp(`'preset\\.${p.id}\\.description': '([^']+)'`));
      assert.ok(match);
      assert.ok(match[1].includes('GPT-6'));
      assert.ok(!match[1].includes('Terra'));
    }
    const labels=presetVersionText(locale);
    assert.deepEqual(Object.keys(labels).sort(),Object.keys(presetVersionText('en')).sort());
    assert.ok(Object.values(labels).every(value=>value.trim()));
    assert.ok(!labels.warning.includes(labels.previewOnly));
  }
});
test('README current profile tables use new models and include archive guidance',()=>{
  for(const path of ['README.md','README.en.md','README.zh-TW.md','README.ja.md','README.ko.md']){
    const text=read(path);
    const cells=text.split('\n').filter(line=>line.startsWith('|')).map(line=>line.split('|')[2]??'');
    const models=cells.filter(cell=>/^\s*(GPT-[\d.]+ )?(Luna|Sol|Astra|Terra)\b/.test(cell));
    assert.ok(models.length>=6,path);
    assert.ok(models.every(cell=>cell.includes('GPT-6')&&!cell.includes('Terra')),path);
    assert.ok(text.includes('v0.4.0'),path);
    assert.ok(!text.includes('release-desktop'),path);
    assert.ok(text.includes('/releases'),path);
  }
});
test('version browsing leaves the current draft, selection and project snapshot untouched',()=>{
  let options;
  const f=context({renderPresetWorkspace:(_host,input)=>{options=input;}});
  const before=JSON.stringify({values:f.ctx.values,snapshot:f.ctx.lastSnapshot});
  f.run('renderPresets',{});options.onVersion(legacy);
  assert.equal(f.ctx.viewedPresetVersion,legacy);
  assert.equal(JSON.stringify({values:f.ctx.values,snapshot:f.ctx.lastSnapshot}),before);
  assert.equal(f.ctx.draftPresetSource,null);assert.equal(f.writes.length,0);assert.equal(f.confirms.length,0);
});
test('loading an archive shows warnings and exact fields, then stages only an independent preview',async()=>{
  const f=context(),before=JSON.stringify(f.ctx.lastSnapshot);
  await f.run('choosePreset',{versionId:legacy,presetId:'daily'});
  assert.equal(f.confirms.length,1);assert.equal(f.writes.length,0);
  assert.ok(f.confirms[0].message.includes(presetVersionText('en').warning));
  assert.ok(f.confirms[0].message.includes(presetVersionText('en').previewOnly));
  for(const field of fields)assert.ok(f.confirms[0].detail.includes(field+':'));
  assert.ok(f.confirms[0].detail.includes('gpt-5.6-terra'));
  assert.deepEqual(plain(f.ctx.values),oldDaily);
  assert.equal(JSON.stringify(f.ctx.lastSnapshot),before);
  f.ctx.values.model='custom/draft';assert.equal(oldDaily.model,'gpt-5.6-terra');
});
test('cancelling the archive warning preserves the draft and source',async()=>{
  const f=context({askConfirm:async()=>false});
  const before=f.ctx.values;
  await f.run('choosePreset',{versionId:legacy,presetId:'daily'});
  assert.equal(f.ctx.values,before);assert.equal(f.ctx.draftPresetSource,null);assert.equal(f.writes.length,0);
});
test('busy or open-confirmation states reject extra archive actions',async()=>{
  for(const extra of [{busy:true},{confirmResolver:()=>{}}]){
    const f=context(extra),before=f.ctx.values;
    await f.run('choosePreset',{versionId:legacy,presetId:'daily'});
    assert.equal(f.ctx.values,before);assert.equal(f.confirms.length,0);
  }
});
test('stale archive confirmation cannot overwrite a newly loaded project draft',async()=>{
  let resolve;
  const f=context({askConfirm:()=>new Promise(r=>resolve=r)});
  const operation=f.run('choosePreset',{versionId:legacy,presetId:'daily'});
  const other={...f.ctx.values,model:'project-b-model'};f.ctx.values=other;
  resolve(true);await operation;
  assert.equal(f.ctx.values,other);assert.equal(f.ctx.draftPresetSource,null);
  assert.ok(f.messages.includes(presetVersionText('en').changedScope));
});
test('current profiles stage GPT-6 without archive warnings or immediate file writes',async()=>{
  const f=context();await f.run('choosePreset',{versionId:current,presetId:'balanced'});
  assert.equal(f.ctx.values.model,'gpt-6-sol');assert.equal(f.confirms.length,0);assert.equal(f.writes.length,0);
});
test('reset after customizing an archived profile returns to that archive, not current defaults',()=>{
  const reference={versionId:legacy,presetId:'daily'};let chosen;
  const f=context({draftPresetSource:reference,activePreset:'',choosePreset:r=>{chosen=r;}});
  f.run('resetSelectedPreset');assert.deepEqual(plain(chosen),reference);
});
test('loading a saved old project detects its revision without upgrading or forcing reasoning',()=>{
  for(const effort of [oldDaily.modelReasoningEffort,null]){
    const value={...oldDaily,modelReasoningEffort:effort};
    const f=context();f.run('applySnapshot',{exists:true,path:'/a/.codex/config.toml',values:value});
    assert.deepEqual(plain(f.ctx.values),value);assert.equal(f.ctx.draftPresetSource,null);
    assert.equal(f.writes.length,0);
    if(effort!==null){assert.equal(f.ctx.activePresetVersion,legacy);assert.equal(f.ctx.activePreset,'daily');}
  }
});
test('applying an archive confirms again and records version provenance via existing narrow command',async()=>{
  const f=context({values:structuredClone(oldDaily),lastSnapshot:{exists:true,path:'/a/.codex/config.toml',values:structuredClone(presets[2].values)},draftPresetSource:{versionId:legacy,presetId:'daily'},applySnapshot(){}});
  await f.run('applyChanges');
  assert.equal(f.confirms.length,1);assert.equal(f.writes.length,1);
  assert.ok(f.confirms[0].message.includes(presetVersionText('en').warning));
  assert.ok(!f.confirms[0].message.includes(presetVersionText('en').previewOnly));
  assert.equal(f.writes[0].command,'apply_config');
  assert.equal(f.writes[0].args.source,`preset/${legacy}/daily`);
  assert.deepEqual(f.writes[0].args.values,oldDaily);assert.equal(f.ctx.busy,false);
});
test('cancelling actual application of an archive never calls native write',async()=>{
  const f=context({values:structuredClone(oldDaily),lastSnapshot:{values:structuredClone(presets[2].values)},draftPresetSource:{versionId:legacy,presetId:'daily'},askConfirm:async()=>false});
  await f.run('applyChanges');assert.equal(f.writes.length,0);
});
test('scope change during final confirmation cancels the write',async()=>{
  let resolve;
  const f=context({askConfirm:()=>new Promise(r=>resolve=r)});
  const action=f.run('applyChanges');
  f.ctx.requestScope=()=>({kind:'project',projectPath:'/projects/b'});resolve(true);await action;
  assert.equal(f.writes.length,0);assert.ok(f.messages.includes(presetVersionText('en').changedScope));
});
test('project-history provenance round-trips and does not reinterpret arbitrary stored sources',()=>{
  for(const versionId of [current,legacy])for(const p of versionPresets(presets,versionId)){
    const ref={versionId,presetId:p.id};assert.deepEqual(parsePresetSource(presetSource(ref),presets),ref);
  }
  assert.equal(presetSource(null),'manual');
  for(const value of ['manual','history_restore','preset/unknown/daily','preset/'+legacy+'/absent','preset/a/b/c'])assert.equal(parsePresetSource(value,presets),null);
});
test('UI renders both revisions, the captured old description and only version-specific selection',()=>{
  let versionListener;const buttons=[];
  const host={innerHTML:'',querySelector:()=>({addEventListener(_type,fn){versionListener=fn;}}),querySelectorAll:()=>buttons};
  let picked;
  viewApi.renderPresetWorkspace(host,{current:presets,viewedVersion:legacy,selectedVersion:current,selectedPreset:'daily',locale:'en',busy:false,heading:{eyebrow:'profiles',title:'Profiles',hint:'Choose'},text:(id,part)=>`${id}.${part}`,onVersion:id=>picked=id,onChoose(){}});
  assert.ok(host.innerHTML.includes('v0.4.0'));assert.ok(host.innerHTML.includes('2026-09-21'));
  assert.ok(host.innerHTML.includes('Terra'));assert.ok(host.innerHTML.includes(presetVersionText('en').warning));
  assert.equal((host.innerHTML.match(/data-preset=/g)??[]).length,6);
  assert.ok(!host.innerHTML.includes('preset-card selected'));
  versionListener({currentTarget:{value:current}});assert.equal(picked,current);
});
test('task reset upgrades only the requested recommendation without rewriting saved preferences',()=>{
  const saved={'quick-fix':{model:'gpt-5.6-luna',reasoning:'xhigh'},daily:{model:'gpt-5.6-terra',reasoning:'xhigh'},complex:{model:'private/custom',reasoning:'max'},architecture:{model:'gpt-6-astra',reasoning:'high'}};
  const store=new Map([['codex-config-studio.task-preferences.v1',JSON.stringify(saved)]]),writes=[];
  const ctx={exports:{},localStorage:{getItem:key=>store.get(key)??null,setItem(key,value){writes.push(key);store.set(key,value);}}};
  runInNewContext(js(read('src/task-modes.ts')),ctx);assert.deepEqual(plain(ctx.exports.loadTaskPreferences()),saved);assert.equal(writes.length,0);
  ctx.exports.resetTaskPreference('daily');assert.deepEqual(plain(ctx.exports.loadTaskPreferences()),{...saved,daily:{model:'gpt-6-luna',reasoning:'medium'}});assert.equal(writes.length,1);
});
test('future release titles stay short and assets plus multilingual notes stay configured',()=>{
  const release=read('.github/workflows/release.yml'),nightly=read('.github/workflows/build-windows.yml');
  assert.equal(release.split('--title "$tag"').length-1,2);assert.equal(release.split('--notes-file release-body.md').length-1,2);
  assert.ok(release.includes('gh release upload "$tag" release-files/*'));assert.ok(release.includes('--verify-tag'));
  assert.ok(nightly.includes('--title "nightly"'));assert.ok(!release.includes('--title "Codex Config Studio'));
});
