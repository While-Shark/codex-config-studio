import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadTypeScript } from './helpers/load-typescript.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const usage=loadTypeScript(resolve(root,'src/usage-dashboard.ts'));

test('usage summary aggregates sessions, agents and models without losing token categories',()=>{
  const report={source:'x',filesScanned:2,filesMatched:2,parseErrors:0,skippedLargeFiles:0,truncated:false,sessions:[
    {threadId:'a',sessionId:'a',cwd:'/p',startedAt:'',updatedAt:'',parentThreadId:null,agentRole:null,agentPath:null,isSubagent:false,turns:2,responses:2,usageSource:'response_records',usage:{inputTokens:100,cachedInputTokens:40,cacheWriteInputTokens:0,outputTokens:20,reasoningOutputTokens:5,totalTokens:120},models:[{model:'luna',reasoning:'xhigh',responses:2,usage:{inputTokens:100,cachedInputTokens:40,cacheWriteInputTokens:0,outputTokens:20,reasoningOutputTokens:5,totalTokens:120}}],reroutes:[]},
    {threadId:'b',sessionId:'a',cwd:'/p',startedAt:'',updatedAt:'',parentThreadId:'a',agentRole:'worker',agentPath:'1',isSubagent:true,turns:1,responses:1,usageSource:'response_records',usage:{inputTokens:50,cachedInputTokens:10,cacheWriteInputTokens:0,outputTokens:15,reasoningOutputTokens:3,totalTokens:65},models:[{model:'luna',reasoning:'xhigh',responses:1,usage:{inputTokens:50,cachedInputTokens:10,cacheWriteInputTokens:0,outputTokens:15,reasoningOutputTokens:3,totalTokens:65}}],reroutes:[{}]}
  ]};
  const summary=JSON.parse(JSON.stringify(usage.summarizeUsage(report)));
  assert.equal(summary.usage.totalTokens,185);assert.equal(summary.usage.cachedInputTokens,50);
  assert.equal(summary.rootUsage,120);assert.equal(summary.subagentUsage,65);assert.equal(summary.reroutes,1);
  assert.equal(summary.modelRows.length,1);assert.equal(summary.modelRows[0].usage.totalTokens,185);
});

test('period windows and token formatting are deterministic',()=>{
  const now=1_000_000_000_000;
  assert.equal(usage.periodSinceMs('7d',now),now-7*24*60*60*1000);
  assert.equal(usage.periodSinceMs('all',now),null);
  assert.equal(usage.formatTokens(1234),'1.23K');
  assert.equal(usage.formatTokens(12_340_000),'12.3M');
});

test('usage copy is complete in five languages',()=>{
  const keys=Object.keys(usage.usageText('en'));
  for(const locale of ['zh-CN','zh-TW','en','ja','ko']){
    const copy=usage.usageText(locale);assert.deepEqual(Object.keys(copy),keys);
    assert.ok(Object.values(copy).every(value=>typeof value==='string'&&value.trim()));
  }
});
