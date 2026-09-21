import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=mkdtempSync(join(tmpdir(),'studio-history-test-'));
after(()=>rmSync(output,{recursive:true,force:true}));
execFileSync(process.execPath,[require.resolve('typescript/lib/tsc.js'),join(root,'src/history-tab.ts'),
  '--strict','--target','ES2022','--module','ES2022','--skipLibCheck','--outDir',output],{stdio:'pipe'});
writeFileSync(join(output,'package.json'),'{"type":"module"}');
const {historyText,filterHistoryEntries,renderHistoryEntries}=await import(pathToFileURL(join(output,'history-tab.js')));
const entries=[
  {id:'1-a-0',timestampMs:100,scopeKind:'project',projectPath:'/projects/alpha',configPath:'/projects/alpha/.codex/config.toml',action:'apply',source:'manual',values:{model:'custom-model',modelReasoningEffort:'xhigh'}},
  {id:'2-b-1',timestampMs:200,scopeKind:'project',projectPath:'/projects/beta',configPath:'/projects/beta/.codex/config.toml',action:'apply',source:'manual',values:{model:'second-model',modelReasoningEffort:'high'}},
];
const labels={restore:'Restore',global:'Global',project:'Project'};
const format={projectName:path=>path??'Global',time:ms=>String(ms),source:value=>value};
const render=(list=entries,disabled=false)=>renderHistoryEntries(list,historyText('en'),labels,format,disabled);
test('history searches projects, paths, and models without changing order or data',()=>{
  assert.deepEqual(filterHistoryEntries(entries,'ALPHA'),[entries[0]]);
  assert.deepEqual(filterHistoryEntries(entries,'second-model'),[entries[1]]);
  assert.deepEqual(filterHistoryEntries(entries,'  '),entries);
  assert.equal(filterHistoryEntries(entries,'not-found').length,0);
  assert.equal(entries.length,2);
});
test('history renders restore and delete for every stored entry, not only ten',()=>{
  const list=Array.from({length:30},(_,i)=>({...entries[0],id:String(i)}));
  const html=render(list);
  assert.equal((html.match(/data-history-entry=/g)??[]).length,30);
  assert.equal((html.match(/data-history-id=/g)??[]).length,30);
  assert.equal((html.match(/data-delete-history-id=/g)??[]).length,30);
});
test('stored paths, model IDs and history IDs cannot inject HTML',()=>{
  const value='<img src=x onerror="alert(1)">';
  const html=render([{...entries[0],id:value,projectPath:value,configPath:value,values:{model:value,modelReasoningEffort:null}}]);
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;img'));
  assert.ok(html.includes('&quot;'));
});
test('all history mutation buttons stay disabled during a pending write',()=>{
  assert.equal((render(entries,true).match(/ disabled/g)??[]).length,4);
  assert.equal((render(entries,false).match(/ disabled/g)??[]).length,0);
});
test('global history and null models are valid entries',()=>{
  const html=render([{...entries[0],scopeKind:'global',projectPath:null,values:{model:null,modelReasoningEffort:null}}]);
  assert.ok(html.includes('Global'));
  assert.ok(!html.includes('null'));
});
test('all five locales have complete nonempty history labels',()=>{
  const keys=Object.keys(historyText('en')).sort();
  for(const locale of ['zh-CN','zh-TW','en','ja','ko']){
    const copy=historyText(locale);
    assert.deepEqual(Object.keys(copy).sort(),keys);
    assert.ok(Object.values(copy).every(value=>value.length>0));
  }
  assert.deepEqual(historyText('unsupported'),historyText('en'));
});

// The optional module-only mode is used in offline environments without a checkout.
// CI and npm run build always run integration tests against the real main.ts.
if(process.env.STUDIO_HISTORY_MODULE_ONLY!=='1'){
  const source=readFileSync(join(root,'src/main.ts'),'utf8');
  const ast=ts.createSourceFile('main.ts',source,ts.ScriptTarget.Latest,true);
  const functionSource=name=>{
    const node=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text===name);
    assert.ok(node,`Missing application function ${name}`);return node.getText(ast);
  };
  const compile=text=>ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
  function deletionContext(overrides={}){
    const calls=[];
    const ctx={
      historyEntries:structuredClone(entries),historyLoading:false,historyLoadError:false,historyReadId:0,
      busy:false,confirmResolver:null,scope:'project',projectPath:'/projects/beta',values:{model:'pending-custom'},
      getLocale:()=> 'en',historyText,t:key=>key,projectName:format.projectName,formatTime:format.time,
      askConfirm:async spec=>{calls.push(['confirm',spec]);return true;},
      invoke:async(command,args)=>{calls.push(['invoke',command,args]);return [entries[1]];},
      toast:(text,error)=>calls.push(['toast',text,error]),renderHistory:()=>{},renderRightRail:()=>{},
      ...overrides,
    };
    ctx.setBusy=value=>{ctx.busy=value;calls.push(['busy',value]);};
    const run=()=>runInNewContext(compile(functionSource('deleteHistory'))+'\ndeleteHistory("1-a-0");',ctx);
    return {ctx,calls,run};
  }
  test('busy-state release refreshes the history controls and no-op apply protection',()=>{
    const calls=[];
    const context={busy:true,historyLoading:false,document:{querySelectorAll:()=>[],querySelector:()=>null},
      renderChanges:()=>calls.push('preview'),renderHistory:()=>calls.push('history')};
    runInNewContext(compile(functionSource('setBusy'))+'\nsetBusy(false);',context);
    assert.equal(context.busy,false);assert.deepEqual(calls,['preview','history']);
  });
  test('history tab is left-only with no stale right-rail refresh binding',()=>{
    const app=functionSource('renderApp');const binding=functionSource('bindStaticEvents');
    assert.ok(app.includes('data-tab="history"'));
    assert.ok(!app.match(/<aside[\s\S]*history-card/));
    assert.ok(!binding.includes("$('#refreshHistory').addEventListener"));
    assert.ok(functionSource('renderWorkspace').includes("activeTab==='history'"));
    assert.ok(functionSource('renderHistoryPage').includes('historySearch'));
  });
  test('confirmed deletion calls only the narrow ID command and preserves scope and draft',async()=>{
    const {ctx,calls,run}=deletionContext();await run();
    assert.deepEqual(calls.filter(call=>call[0]==='invoke').map(call=>call[1]),['delete_history_entry']);
    const args=calls.find(call=>call[0]==='invoke')[2];assert.deepEqual(JSON.parse(JSON.stringify(args)),{id:'1-a-0'});
    const confirm=calls.find(call=>call[0]==='confirm')[1];assert.equal(confirm.danger,true);
    assert.ok(confirm.detail.includes('/projects/alpha/.codex/config.toml'));
    assert.ok(confirm.message.includes('backup'));
    assert.equal(ctx.projectPath,'/projects/beta');assert.equal(ctx.values.model,'pending-custom');
    assert.equal(ctx.historyEntries.length,1);assert.equal(ctx.busy,false);
  });
  test('cancelled deletion never calls native code and preserves the list',async()=>{
    const {ctx,calls,run}=deletionContext({askConfirm:async()=>false});await run();
    assert.equal(calls.filter(call=>call[0]==='invoke').length,0);assert.equal(ctx.historyEntries.length,2);
  });
  test('deletion errors keep original history and unlock controls',async()=>{
    const {ctx,calls,run}=deletionContext({invoke:async()=>{throw new Error('read-only');}});await run();
    assert.equal(ctx.historyEntries.length,2);assert.equal(ctx.busy,false);
    assert.ok(calls.some(call=>call[0]==='toast'&&call[2]===true));
  });
  test('busy, loading, read failure and an existing confirmation block deletion',async()=>{
    for(const state of [{busy:true},{historyLoading:true},{historyLoadError:true},{confirmResolver:()=>{}}]){
      const {calls,run}=deletionContext(state);await run();assert.equal(calls.length,0);
    }
  });
  test('a second delete click cannot create another write while the first is pending',async()=>{
    let finish;const wait=new Promise(resolve=>{finish=resolve;});
    const {ctx,calls,run}=deletionContext({invoke:async()=>{await wait;return [entries[1]];}});
    const first=run();await new Promise(resolve=>setImmediate(resolve));assert.equal(ctx.busy,true);
    await run();assert.equal(calls.filter(call=>call[0]==='confirm').length,1);
    finish();await first;assert.equal(ctx.busy,false);
  });
  test('history refresh reads all 300 records and reports errors instead of an empty history',async()=>{
    const ctx={historyEntries:structuredClone(entries),historyLoading:false,historyLoadError:false,historyReadId:0,busy:false,renderHistory:()=>{},console:{warn:()=>{}},safeInvoke:async(cmd,args)=>{assert.equal(cmd,'list_history');assert.equal(args.limit,300);throw new Error('offline');}};
    await runInNewContext(compile(functionSource('loadHistory'))+'\nloadHistory();',ctx);
    assert.equal(ctx.historyLoadError,true);assert.equal(ctx.historyLoading,false);assert.equal(ctx.historyEntries.length,2);
  });
  test('a stale history read cannot repopulate records after deletion',async()=>{
    let finish;const wait=new Promise(resolve=>{finish=resolve;});
    const ctx={historyEntries:structuredClone(entries),historyLoading:false,historyLoadError:false,historyReadId:0,busy:false,renderHistory:()=>{},console,safeInvoke:()=>wait};
    const read=runInNewContext(compile(functionSource('loadHistory'))+'\nloadHistory();',ctx);
    ctx.historyReadId+=1;ctx.historyEntries=[entries[1]];ctx.historyLoading=false;
    finish(entries);await read;assert.equal(ctx.historyEntries.length,1);
  });
  test('all READMEs keep download links but no maintainer release instructions',()=>{
    for(const name of ['README.md','README.en.md','README.zh-TW.md','README.ja.md','README.ko.md']){
      const text=readFileSync(join(root,name),'utf8');
      assert.ok(text.includes('/codex-config-studio/releases'),name);
      assert.ok(!text.includes('release-desktop'),name);
      assert.ok(!text.includes('Run workflow'),name);
      assert.ok(!text.includes('## CI / Nightly'),name);
    }
  });
}
