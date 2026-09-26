import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadTypeScript } from './helpers/load-typescript.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const usage=loadTypeScript(resolve(root,'src/usage-dashboard.ts'));

test('usage summary aggregates sessions, agents and models without losing token categories',()=>{
  const report={source:'x',filesScanned:2,filesMatched:2,parseErrors:0,skippedLargeFiles:0,truncated:false,sessions:[
    {threadId:'a',sessionId:'a',cwd:'/p',startedAt:'',updatedAt:'',parentThreadId:null,agentRole:null,agentPath:null,isSubagent:false,turns:2,responses:2,usageSource:'response_records',usage:{inputTokens:100,cachedInputTokens:40,cacheWriteInputTokens:0,outputTokens:20,reasoningOutputTokens:5,totalTokens:120},models:[{model:'luna',reasoning:'xhigh',responses:2,usage:{inputTokens:100,cachedInputTokens:40,cacheWriteInputTokens:0,outputTokens:20,reasoningOutputTokens:5,totalTokens:120}}],dailyUsage:[{day:'2026-09-25',responses:2,usage:{inputTokens:100,cachedInputTokens:40,cacheWriteInputTokens:0,outputTokens:20,reasoningOutputTokens:5,totalTokens:120},estimated:false}],dailyModelUsage:[{day:'2026-09-25',model:'luna',reasoning:'xhigh',responses:2,usage:{inputTokens:100,cachedInputTokens:40,cacheWriteInputTokens:0,outputTokens:20,reasoningOutputTokens:5,totalTokens:120},estimated:false}],reroutes:[]},
    {threadId:'b',sessionId:'a',cwd:'/p',startedAt:'',updatedAt:'',parentThreadId:'a',agentRole:'worker',agentPath:'1',isSubagent:true,turns:1,responses:1,usageSource:'response_records',usage:{inputTokens:50,cachedInputTokens:10,cacheWriteInputTokens:0,outputTokens:15,reasoningOutputTokens:3,totalTokens:65},models:[{model:'luna',reasoning:'xhigh',responses:1,usage:{inputTokens:50,cachedInputTokens:10,cacheWriteInputTokens:0,outputTokens:15,reasoningOutputTokens:3,totalTokens:65}}],dailyUsage:[{day:'2026-09-26',responses:1,usage:{inputTokens:50,cachedInputTokens:10,cacheWriteInputTokens:0,outputTokens:15,reasoningOutputTokens:3,totalTokens:65},estimated:false}],dailyModelUsage:[{day:'2026-09-26',model:'luna',reasoning:'xhigh',responses:1,usage:{inputTokens:50,cachedInputTokens:10,cacheWriteInputTokens:0,outputTokens:15,reasoningOutputTokens:3,totalTokens:65},estimated:false}],reroutes:[{}]}
  ]};
  const summary=JSON.parse(JSON.stringify(usage.summarizeUsage(report)));
  assert.equal(summary.usage.totalTokens,185);assert.equal(summary.usage.cachedInputTokens,50);
  assert.equal(summary.rootUsage,120);assert.equal(summary.subagentUsage,65);assert.equal(summary.rootSessions,1);assert.equal(summary.subagentSessions,1);assert.equal(summary.reroutes,1);
  assert.equal(summary.modelRows.length,1);assert.equal(summary.modelRows[0].usage.totalTokens,185);
  assert.equal(summary.dailyTrend.length,2);assert.equal(summary.dailyTrend[0].day,'2026-09-25');
  assert.equal(summary.dailyTrend[1].share,65/120);
  assert.equal(summary.modelTrend.length,2);assert.equal(summary.modelTrend[0].rows[0].model,'luna');
  assert.equal(summary.modelTrend[0].rows[0].share,1);
  assert.equal(summary.agentRoles.length,1);assert.equal(summary.agentRoles[0].role,'worker');
  assert.equal(summary.agentRoles[0].usage.totalTokens,65);assert.equal(summary.agentRoles[0].share,1);
});

test('period windows and token formatting are deterministic',()=>{
  const now=1_000_000_000_000;
  assert.equal(usage.periodSinceMs('7d',now),now-7*24*60*60*1000);
  assert.equal(usage.periodSinceMs('all',now),null);
  assert.equal(usage.periodSinceDay('7d',Date.UTC(2026,8,26,12)), '2026-09-19');
  assert.equal(usage.periodSinceDay('all',now),null);
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

test('daily trend merges same-day session usage and preserves legacy estimate flags',()=>{
  const tokens=(total)=>({inputTokens:total,cachedInputTokens:0,cacheWriteInputTokens:0,outputTokens:0,reasoningOutputTokens:0,totalTokens:total});
  const report={source:'x',filesScanned:2,filesMatched:2,parseErrors:0,skippedLargeFiles:0,truncated:false,sessions:[
    {threadId:'a',sessionId:'a',cwd:'/p',startedAt:'',updatedAt:'',parentThreadId:null,agentRole:null,agentPath:null,isSubagent:false,turns:1,responses:1,usageSource:'response_records',usage:tokens(80),models:[],dailyUsage:[{day:'2026-09-26',responses:1,usage:tokens(80),estimated:false}],dailyModelUsage:[{day:'2026-09-26',model:'luna',reasoning:'xhigh',responses:1,usage:tokens(80),estimated:false}],reroutes:[]},
    {threadId:'b',sessionId:'b',cwd:'/p',startedAt:'',updatedAt:'',parentThreadId:null,agentRole:null,agentPath:null,isSubagent:false,turns:1,responses:0,usageSource:'legacy_session_total',usage:tokens(20),models:[],dailyUsage:[{day:'2026-09-26',responses:0,usage:tokens(20),estimated:true}],dailyModelUsage:[{day:'2026-09-26',model:'sol',reasoning:'high',responses:0,usage:tokens(20),estimated:true}],reroutes:[]}
  ]};
  const trend=JSON.parse(JSON.stringify(usage.summarizeUsage(report).dailyTrend));
  assert.equal(trend.length,1);assert.equal(trend[0].usage.totalTokens,100);
  assert.equal(trend[0].responses,1);assert.equal(trend[0].estimated,true);assert.equal(trend[0].share,1);
});

test('model trend keeps daily model shares separate and carries estimate flags',()=>{
  const tokens=(total)=>({inputTokens:total,cachedInputTokens:0,cacheWriteInputTokens:0,outputTokens:0,reasoningOutputTokens:0,totalTokens:total});
  const report={source:'x',filesScanned:1,filesMatched:1,parseErrors:0,skippedLargeFiles:0,truncated:false,sessions:[
    {threadId:'a',sessionId:'a',cwd:'/p',startedAt:'',updatedAt:'',parentThreadId:null,agentRole:null,agentPath:null,isSubagent:false,turns:2,responses:2,usageSource:'response_records',usage:tokens(100),models:[],dailyUsage:[{day:'2026-09-26',responses:2,usage:tokens(100),estimated:false}],dailyModelUsage:[
      {day:'2026-09-26',model:'luna',reasoning:'xhigh',responses:1,usage:tokens(70),estimated:false},
      {day:'2026-09-26',model:'sol',reasoning:'high',responses:1,usage:tokens(30),estimated:true}
    ],reroutes:[]}
  ]};
  const trend=JSON.parse(JSON.stringify(usage.summarizeUsage(report).modelTrend));
  assert.equal(trend.length,1);assert.equal(trend[0].totalTokens,100);assert.equal(trend[0].estimated,true);
  assert.equal(trend[0].rows[0].model,'luna');assert.equal(trend[0].rows[0].share,0.7);
  assert.equal(trend[0].rows[1].model,'sol');assert.equal(trend[0].rows[1].share,0.3);
});

test('agent role analysis groups sub-agent sessions without treating root sessions as a role',()=>{
  const tokens=(total)=>({inputTokens:total,cachedInputTokens:0,cacheWriteInputTokens:0,outputTokens:0,reasoningOutputTokens:0,totalTokens:total});
  const mk=(id,role,total)=>({threadId:id,sessionId:id,cwd:'/p',startedAt:'',updatedAt:'',parentThreadId:role?'root':null,agentRole:role,agentPath:role?id:null,isSubagent:!!role,turns:1,responses:1,usageSource:'response_records',usage:tokens(total),models:[],dailyUsage:[],dailyModelUsage:[],reroutes:[]});
  const report={source:'x',filesScanned:4,filesMatched:4,parseErrors:0,skippedLargeFiles:0,truncated:false,sessions:[
    mk('root',null,100),mk('a','worker',70),mk('b','worker',30),mk('c','reviewer',20)
  ]};
  const summary=JSON.parse(JSON.stringify(usage.summarizeUsage(report)));
  assert.equal(summary.rootSessions,1);assert.equal(summary.subagentSessions,3);
  assert.equal(summary.rootUsage,100);assert.equal(summary.subagentUsage,120);
  assert.equal(summary.agentRoles.length,2);
  assert.equal(summary.agentRoles[0].role,'worker');assert.equal(summary.agentRoles[0].sessions,2);
  assert.equal(summary.agentRoles[0].usage.totalTokens,100);assert.equal(summary.agentRoles[0].share,100/120);
  assert.equal(summary.agentRoles[1].role,'reviewer');assert.equal(summary.agentRoles[1].usage.totalTokens,20);
});
