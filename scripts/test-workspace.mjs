import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { runInNewContext } from 'node:vm';
import { loadTypeScript } from './helpers/load-typescript.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url),ts=require('typescript');
const source=readFileSync(resolve(root,'src/main.ts'),'utf8');
const ast=ts.createSourceFile('main.ts',source,ts.ScriptTarget.Latest,true);
const ui=loadTypeScript(resolve(root,'src/i18n/workspace.ts'));
const shell=loadTypeScript(resolve(root,'src/ui/shell.ts'));
const fn=name=>{
  const node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);
  assert.ok(node,`missing ${name}`);
  return ts.transpileModule(node.getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
};
const plain=x=>JSON.parse(JSON.stringify(x));
function execute(names, context, expression) { return runInNewContext(names.map(fn).join('\n')+'\n'+expression,context); }
const settings={model:'gpt-6-luna',modelReasoningEffort:null,planModeReasoningEffort:'high',agentsEnabled:true,defaultSubagentModel:'gpt-6-luna',defaultSubagentReasoningEffort:'medium',maxConcurrentThreadsPerSession:2};
function scopeFixture(extra={}) {
  const calls=[],input={value:'/new'};
  const ctx={scope:'project',projectPath:'/a',busy:false,confirmResolver:null,configReadId:0,lastSnapshot:{values:settings,path:'/a/.codex/config.toml'},draftPresetSource:null,
    getChanges:()=>[{field:'model'}],workspaceText:ui.workspaceText,getLocale:()=> 'en',
    askConfirm:async spec=>{calls.push(['confirm',spec]);return false;},
    loadConfig:async()=>calls.push(['load']),loadConfigHealth:async()=>{},document:{querySelector:()=>input},...extra};
  return {ctx,calls,input};
}
test('shell has exactly five accessible tabs, one apply action and an isolated dock',()=>{
  const html=shell.renderShell({projectPath:'/test',accent:'violet'});
  assert.equal((html.match(/role="tab"/g)||[]).length,5);
  assert.equal((html.match(/id="applyBtn"/g)||[]).length,1);
  assert.ok(html.includes('role="tabpanel"'));assert.ok(html.includes('class="apply-dock"'));
  assert.ok(!html.slice(html.indexOf('<aside'),html.indexOf('</aside>')).includes('historyList'));
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size);
});
test('shell escapes project paths and exposes a correctly labelled modal',()=>{
  const html=shell.renderShell({projectPath:'"><img src=x onerror=alert(1)>',accent:'violet'});
  assert.ok(!html.includes('<img'));assert.ok(html.includes('&lt;img'));
  assert.ok(html.includes('aria-modal="true"'));assert.ok(html.includes('aria-labelledby="confirmTitle"'));
  assert.ok(html.includes('id="confirmClose"'));assert.ok(html.includes('id="confirmCheckbox"'));
});
test('workspace text is complete in five languages without empty translations',()=>{
  const keys=Object.keys(ui.workspaceText('en'));
  for(const locale of ['zh-CN','zh-TW','en','ja','ko']){
    const copy=ui.workspaceText(locale);assert.deepEqual(Object.keys(copy),keys);
    assert.ok(Object.values(copy).every(x=>typeof x==='string'&&x.trim()));
  }
  assert.equal(ui.workspaceText('unknown'),ui.workspaceText('en'));
});
test('cancelled target switch keeps the project, draft and input intact',async()=>{
  const f=scopeFixture();await execute(['approveDraftDiscard','changeScope'],f.ctx,"changeScope('project','/b')");
  assert.equal(f.ctx.projectPath,'/a');assert.equal(f.input.value,'/a');assert.equal(f.calls.length,1);
});
test('confirmed target switch loads exactly once and does not write configuration',async()=>{
  const f=scopeFixture({askConfirm:async()=>true});await execute(['approveDraftDiscard','changeScope'],f.ctx,"changeScope('project','/b')");
  assert.equal(f.ctx.projectPath,'/b');assert.deepEqual(f.calls,[['load']]);
});
test('clean target switch does not interrupt the user with a confirmation',async()=>{
  const f=scopeFixture({getChanges:()=>[]});await execute(['approveDraftDiscard','changeScope'],f.ctx,"changeScope('global')");
  assert.equal(f.ctx.scope,'global');assert.deepEqual(f.calls,[['load']]);
});
test('same target is a no-op and busy or modal state cannot change destination',async()=>{
  for(const state of [{},{busy:true},{confirmResolver:()=>{}}]){
    const f=scopeFixture(state);await execute(['approveDraftDiscard','changeScope'],f.ctx,"changeScope('project','/a')");assert.equal(f.calls.length,0);
  }
  for(const state of [{busy:true},{confirmResolver:()=>{}}]){
    const f=scopeFixture(state);await execute(['approveDraftDiscard','changeScope'],f.ctx,"changeScope('project','/b')");assert.equal(f.ctx.projectPath,'/a');assert.equal(f.calls.length,0);
  }
});
test('reload cancellation does not discard an unapplied configuration',async()=>{
  const f=scopeFixture();await execute(['approveDraftDiscard','reloadConfig'],f.ctx,'reloadConfig()');assert.equal(f.calls.length,1);assert.equal(f.calls[0][0],'confirm');
});
test('out-of-order reads cannot replace a newer project snapshot',async()=>{
  let finishA,finishB;const applied=[];
  const f=scopeFixture({document:{querySelector:()=>null},safeInvoke:()=>new Promise(r=>{if(!finishA)finishA=r;else finishB=r;}),setStatus(){},renderRightRail(){},applySnapshot:s=>applied.push(s)});
  f.ctx.requestScope=()=>({kind:f.ctx.scope,projectPath:f.ctx.projectPath});
  const first=execute(['loadConfig'],f.ctx,'loadConfig()');f.ctx.projectPath='/b';
  const second=execute(['loadConfig'],f.ctx,'loadConfig()');
  finishB({exists:true,path:'/b',values:settings});await second;
  finishA({exists:true,path:'/a',values:settings});await first;
  assert.deepEqual(applied.map(x=>x.path),['/b']);
});
test('unknown reasoning remains selectable; null remains inherit',()=>{
  const ctx={t:x=>x,esc:x=>x};
  const custom=execute(['selectHtml'],ctx,"selectHtml('reason','provider-level',['low','high'],true)");
  assert.ok(custom.includes('value="provider-level" selected'));
  const inherit=execute(['selectHtml'],ctx,"selectHtml('reason',null,['low','high'],true)");assert.ok(inherit.includes('value="" selected'));
});
test('fractional, nonfinite, and out-of-range concurrency never reach confirm or IPC',async()=>{
  for(const value of [0,17,1.5,NaN,Infinity]){
    const messages=[];
    const ctx={busy:false,confirmResolver:null,lastSnapshot:{values:settings},values:{...settings,maxConcurrentThreadsPerSession:value},toast:x=>messages.push(x),workspaceText:ui.workspaceText,getLocale:()=> 'en',askConfirm:()=>assert.fail('confirm'),safeInvoke:()=>assert.fail('write')};
    await execute(['applyChanges'],ctx,'applyChanges()');assert.equal(messages.length,1);
  }
});
test('history preview shows all fields without changing draft, scope or native files',async()=>{
  const calls=[];const entry={id:'history-1',timestampMs:1,configPath:'/b/.codex/config.toml',values:settings};
  const ctx={busy:false,confirmResolver:null,historyEntries:[entry],values:{model:'draft'},scope:'project',projectPath:'/a',workspaceText:ui.workspaceText,getLocale:()=> 'en',fields:Object.keys(settings),fieldLabel:x=>x,t:x=>x,formatTime:()=> 'time',askConfirm:async spec=>calls.push(spec)};
  await execute(['previewHistory'],ctx,"previewHistory('history-1')");
  assert.equal(ctx.projectPath,'/a');assert.equal(ctx.values.model,'draft');assert.equal(calls.length,1);assert.equal(calls[0].readOnly,true);
  for(const field of Object.keys(settings))assert.ok(calls[0].detail.includes(field+':'));
});
test('a delayed mutation warns but keeps awaiting the same write instead of unlocking',async()=>{
  let finish,timer,cleared=0;const notices=[];
  const ctx={invoke:()=>new Promise(r=>finish=r),setTimeout:callback=>{timer=callback;return 1;},clearTimeout:()=>cleared++,toast:x=>notices.push(x),workspaceText:ui.workspaceText,getLocale:()=> 'en',t:x=>x};
  let settled=false;const pending=execute(['safeInvoke'],ctx,"safeInvoke('apply_config',{})").then(()=>settled=true);
  timer();await Promise.resolve();assert.equal(settled,false);assert.equal(notices.length,1);
  finish({});await pending;assert.equal(settled,true);assert.equal(cleared,1);
});
test('read timeouts clear their timer and never become lingering write operations',async()=>{
  let timer,cleared=0;
  const ctx={invoke:()=>new Promise(()=>{}),setTimeout:callback=>{timer=callback;return 1;},clearTimeout:()=>cleared++,t:x=>x};
  const pending=execute(['safeInvoke'],ctx,"safeInvoke('read_config',{})");timer();await assert.rejects(pending);assert.equal(cleared,1);
});
test('tab arrow, Home and End navigation activate real adjacent controls',()=>{
  const buttons=Array.from({length:4},(_,i)=>({dataset:{tab:String(i)},disabled:false,handlers:{},addEventListener(k,f){this.handlers[k]=f;},focus(){this.focused=true;}}));
  const {bindTabs}=loadTypeScript(resolve(root,'src/ui/interactions.ts'));
  const selected=[];bindTabs({querySelectorAll:()=>buttons},x=>selected.push(x));
  buttons[0].handlers.keydown({key:'ArrowLeft',preventDefault(){}});assert.equal(selected.pop(),'3');
  buttons[0].handlers.keydown({key:'End',preventDefault(){}});assert.equal(selected.pop(),'3');
  buttons[3].handlers.keydown({key:'Home',preventDefault(){}});assert.equal(selected.pop(),'0');
});
