import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadTypeScript } from './helpers/load-typescript.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const usage=loadTypeScript(resolve(root,'src/usage-dashboard.ts'));
const pricing=loadTypeScript(resolve(root,'src/pricing-catalog.ts'));

test('usage summary aggregates sessions, agents and models without losing token categories',()=>{
  const report={source:'x',filesScanned:2,filesMatched:2,parseErrors:0,skippedLargeFiles:0,truncated:false,sessions:[
    {threadId:'a',sessionId:'a',cwd:'/p',startedAt:'',updatedAt:'',parentThreadId:null,agentRole:null,agentPath:null,isSubagent:false,turns:2,responses:2,usageSource:'response_records',usage:{inputTokens:100,cachedInputTokens:40,cacheWriteInputTokens:0,outputTokens:20,reasoningOutputTokens:5,totalTokens:120},models:[{model:'luna',reasoning:'xhigh',responses:2,usage:{inputTokens:100,cachedInputTokens:40,cacheWriteInputTokens:0,outputTokens:20,reasoningOutputTokens:5,totalTokens:120}}],dailyUsage:[{day:'2026-09-25',responses:2,usage:{inputTokens:100,cachedInputTokens:40,cacheWriteInputTokens:0,outputTokens:20,reasoningOutputTokens:5,totalTokens:120},estimated:false}],dailyModelUsage:[{day:'2026-09-25',model:'luna',reasoning:'xhigh',responses:2,usage:{inputTokens:100,cachedInputTokens:40,cacheWriteInputTokens:0,outputTokens:20,reasoningOutputTokens:5,totalTokens:120},estimated:false}],reroutes:[]},
    {threadId:'b',sessionId:'a',cwd:'/p',startedAt:'',updatedAt:'',parentThreadId:'a',agentRole:'worker',agentPath:'1',isSubagent:true,turns:1,responses:1,usageSource:'response_records',usage:{inputTokens:50,cachedInputTokens:10,cacheWriteInputTokens:0,outputTokens:15,reasoningOutputTokens:3,totalTokens:65},models:[{model:'luna',reasoning:'xhigh',responses:1,usage:{inputTokens:50,cachedInputTokens:10,cacheWriteInputTokens:0,outputTokens:15,reasoningOutputTokens:3,totalTokens:65}}],dailyUsage:[{day:'2026-09-26',responses:1,usage:{inputTokens:50,cachedInputTokens:10,cacheWriteInputTokens:0,outputTokens:15,reasoningOutputTokens:3,totalTokens:65},estimated:false}],dailyModelUsage:[{day:'2026-09-26',model:'luna',reasoning:'xhigh',responses:1,usage:{inputTokens:50,cachedInputTokens:10,cacheWriteInputTokens:0,outputTokens:15,reasoningOutputTokens:3,totalTokens:65},estimated:false}],reroutes:[{timestamp:'2026-09-26T01:00:00Z',fromModel:'luna',toModel:'sol',reason:'high_risk_cyber_activity'}]}
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
  assert.equal(summary.rerouteEvents.length,1);assert.equal(summary.rerouteEvents[0].fromModel,'luna');
  assert.equal(summary.rerouteEvents[0].agentRole,'worker');assert.equal(summary.rerouteEvents[0].isSubagent,true);
});

test('service tier summary only counts exact usage with durable tier evidence',()=>{
  const tokens=(total)=>({inputTokens:total,cachedInputTokens:0,cacheWriteInputTokens:0,outputTokens:0,reasoningOutputTokens:0,totalTokens:total});
  const base={cwd:'/p',startedAt:'',updatedAt:'',parentThreadId:null,agentRole:null,agentPath:null,isSubagent:false,turns:1,models:[],dailyUsage:[],dailyModelUsage:[],reroutes:[]};
  const report={source:'x',filesScanned:3,filesMatched:3,parseErrors:0,skippedLargeFiles:0,truncated:false,sessions:[
    {...base,threadId:'fast',sessionId:'fast',responses:2,lastModel:'gpt-6-luna',lastReasoning:'high',serviceTierObserved:true,lastServiceTier:'priority',usageSource:'response_records',usage:tokens(200),serviceTiers:[{serviceTier:'priority',responses:2,usage:tokens(200)}],modelTiers:[{model:'gpt-6-luna',reasoning:'high',serviceTier:'priority',responses:2,usage:tokens(200)}]},
    {...base,threadId:'default',sessionId:'default',responses:1,lastModel:'gpt-6-luna',lastReasoning:'high',serviceTierObserved:true,lastServiceTier:null,usageSource:'response_records',usage:tokens(100),serviceTiers:[{serviceTier:null,responses:1,usage:tokens(100)}],modelTiers:[{model:'gpt-6-luna',reasoning:'high',serviceTier:null,responses:1,usage:tokens(100)}]},
    {...base,threadId:'old',sessionId:'old',responses:1,lastModel:'gpt-6-luna',lastReasoning:'high',serviceTierObserved:false,lastServiceTier:null,usageSource:'response_records',usage:tokens(100),serviceTiers:[],modelTiers:[]},
  ]};
  const summary=JSON.parse(JSON.stringify(usage.summarizeUsage(report)));
  assert.equal(summary.usage.totalTokens,400);
  assert.equal(summary.serviceTierCoveredTokens,300);
  assert.equal(summary.serviceTierCoverage,0.75);
  assert.equal(summary.fastTierTokens,200);
  assert.equal(usage.isFastServiceTier('priority'),true);
  assert.equal(usage.isFastServiceTier('fast'),true);
  assert.equal(usage.isFastServiceTier('flex'),false);
  assert.equal(summary.serviceTierRows.length,2);
  assert.equal(summary.serviceTierRows[0].serviceTier,'priority');
  assert.equal(summary.serviceTierRows[0].share,2/3);
  assert.equal(summary.serviceTierRows[1].serviceTier,null);
  assert.equal(summary.serviceTierRows[1].share,1/3);
  assert.equal(summary.modelTierRows.length,2);
  assert.equal(summary.modelTierRows[0].model,'gpt-6-luna');
  assert.equal(summary.modelTierRows[0].serviceTier,'priority');
  assert.equal(summary.modelTierRows[0].usage.totalTokens,200);
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

test('usage anomaly detection requires exact history and ignores estimates or tiny baselines',()=>{
  const tokens=(total)=>({inputTokens:total,cachedInputTokens:0,cacheWriteInputTokens:0,outputTokens:0,reasoningOutputTokens:0,totalTokens:total});
  const exact=(day,total)=>({day,responses:1,usage:tokens(total),estimated:false});
  const days=[
    exact('2026-09-20',20_000),
    exact('2026-09-21',22_000),
    exact('2026-09-22',18_000),
    exact('2026-09-23',21_000),
    exact('2026-09-24',55_000),
    {day:'2026-09-25',responses:0,usage:tokens(200_000),estimated:true},
  ];
  const anomalies=JSON.parse(JSON.stringify(usage.detectUsageAnomalies(days)));
  assert.equal(anomalies.length,1);
  assert.equal(anomalies[0].day,'2026-09-24');
  assert.equal(anomalies[0].baselineTokens,20_500);
  assert.equal(Number(anomalies[0].ratio.toFixed(3)),Number((55_000/20_500).toFixed(3)));

  assert.deepEqual(JSON.parse(JSON.stringify(usage.detectUsageAnomalies([
    exact('2026-09-20',1_000),exact('2026-09-21',1_100),exact('2026-09-22',900),exact('2026-09-23',10_000),
  ]))),[]);
  assert.deepEqual(JSON.parse(JSON.stringify(usage.detectUsageAnomalies([
    exact('2026-09-20',20_000),exact('2026-09-21',21_000),exact('2026-09-22',60_000),
  ]))),[]);
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

test('observable reroute timeline is sorted newest first and keeps session context',()=>{
  const tokens=(total)=>({inputTokens:total,cachedInputTokens:0,cacheWriteInputTokens:0,outputTokens:0,reasoningOutputTokens:0,totalTokens:total});
  const session=(id,isSubagent,role,stamp)=>({threadId:id,sessionId:id,cwd:'/p',startedAt:'',updatedAt:'',parentThreadId:isSubagent?'root':null,agentRole:role,agentPath:null,isSubagent,turns:1,responses:1,usageSource:'response_records',usage:tokens(10),models:[],dailyUsage:[],dailyModelUsage:[],reroutes:[{timestamp:stamp,fromModel:'a',toModel:'b',reason:'test'}]});
  const report={source:'x',filesScanned:2,filesMatched:2,parseErrors:0,skippedLargeFiles:0,truncated:false,sessions:[
    session('root',false,null,'2026-09-25T10:00:00Z'),
    session('child',true,'worker','2026-09-26T10:00:00Z')
  ]};
  const events=JSON.parse(JSON.stringify(usage.summarizeUsage(report).rerouteEvents));
  assert.equal(events.length,2);assert.equal(events[0].threadId,'child');assert.equal(events[0].agentRole,'worker');
  assert.equal(events[1].threadId,'root');assert.equal(events[1].isSubagent,false);
});

test('reference cost avoids double charging cached input and includes reasoning inside output',()=>{
  const row={model:'gpt-6-luna',reasoning:'xhigh',responses:1,usage:{
    inputTokens:1000000,cachedInputTokens:400000,cacheWriteInputTokens:0,
    outputTokens:200000,reasoningOutputTokens:50000,totalTokens:1200000
  }};
  const cost=pricing.estimateModelCost(row);
  // 600k ordinary input * $0.10 + 400k cached * $0.01 + 200k output * $0.50
  assert.equal(Number(cost.toFixed(6)),0.164);
});

test('tier-aware cost applies model-specific Fast multipliers only to observed priority usage',()=>{
  const tokens=(input,output=0)=>({inputTokens:input,cachedInputTokens:0,cacheWriteInputTokens:0,outputTokens:output,reasoningOutputTokens:0,totalTokens:input+output});
  const modelRows=[
    {model:'gpt-6-luna',reasoning:'high',responses:2,usage:tokens(2_000_000)},
    {model:'gpt-5.4',reasoning:'high',responses:1,usage:tokens(1_000_000)},
  ];
  const tierRows=[
    {model:'gpt-6-luna',reasoning:'high',serviceTier:'priority',responses:1,usage:tokens(1_000_000)},
    {model:'gpt-6-luna',reasoning:'high',serviceTier:null,responses:1,usage:tokens(1_000_000)},
    {model:'gpt-5.4',reasoning:'high',serviceTier:'priority',responses:1,usage:tokens(1_000_000)},
  ];
  const result=pricing.estimateTierAwareUsageCost(modelRows,tierRows,3_000_000);
  // Base: Luna $0.20 + GPT-5.4 $2.50. Fast surcharge: Luna $0.15 + GPT-5.4 $2.50.
  assert.equal(Number(result.baseUsd.toFixed(6)),2.7);
  assert.equal(Number(result.fastSurchargeUsd.toFixed(6)),2.65);
  assert.equal(Number(result.usd.toFixed(6)),5.35);
  assert.equal(result.tierCoverage,1);
  assert.equal(result.fastAdjustedTokens,2_000_000);
  assert.equal(result.isLowerBound,false);
});

test('tier-aware cost keeps unknown tier history as a lower bound instead of assuming standard',()=>{
  const tokens=(total)=>({inputTokens:total,cachedInputTokens:0,cacheWriteInputTokens:0,outputTokens:0,reasoningOutputTokens:0,totalTokens:total});
  const result=pricing.estimateTierAwareUsageCost(
    [{model:'gpt-6-sol',reasoning:'high',responses:1,usage:tokens(1_000_000)}],
    [],
    1_000_000,
  );
  assert.equal(result.baseUsd,2);
  assert.equal(result.fastSurchargeUsd,0);
  assert.equal(result.tierCoverage,0);
  assert.equal(result.isLowerBound,true);
});

test('priced Fast model without a documented multiplier is surfaced without inventing one',()=>{
  const tokens=(total)=>({inputTokens:total,cachedInputTokens:0,cacheWriteInputTokens:0,outputTokens:0,reasoningOutputTokens:0,totalTokens:total});
  const row={model:'gpt-5.4-mini',reasoning:'high',responses:1,usage:tokens(1_000_000)};
  const result=pricing.estimateTierAwareUsageCost(
    [row],
    [{...row,serviceTier:'priority'}],
    1_000_000,
  );
  assert.equal(result.baseUsd,0.75);
  assert.equal(result.fastSurchargeUsd,0);
  assert.deepEqual(JSON.parse(JSON.stringify(result.unadjustedFastModels)),['gpt-5.4-mini']);
  assert.equal(result.isLowerBound,true);
});

test('reference cost reports pricing coverage and unknown models without inventing rates',()=>{
  const tokens=(total)=>({inputTokens:total,cachedInputTokens:0,cacheWriteInputTokens:0,outputTokens:0,reasoningOutputTokens:0,totalTokens:total});
  const rows=[
    {model:'gpt-6-sol',reasoning:'high',responses:1,usage:tokens(100)},
    {model:'custom-local-model',reasoning:null,responses:1,usage:tokens(300)}
  ];
  const result=JSON.parse(JSON.stringify(pricing.estimateUsageCost(rows,400)));
  assert.equal(result.coveredTokens,100);assert.equal(result.totalTokens,400);assert.equal(result.coverage,0.25);
  assert.deepEqual(result.unpricedModels,['custom-local-model']);
});

test('verified reference catalog exposes only documented Fast multipliers',()=>{
  assert.equal(pricing.fastMultiplierForModel('gpt-6-astra'),2.5);
  assert.equal(pricing.fastMultiplierForModel('gpt-6-sol'),2.5);
  assert.equal(pricing.fastMultiplierForModel('gpt-6-luna'),2.5);
  assert.equal(pricing.fastMultiplierForModel('gpt-5.6-terra'),2.5);
  assert.equal(pricing.fastMultiplierForModel('gpt-5.5'),2.5);
  assert.equal(pricing.fastMultiplierForModel('gpt-5.4'),2);
  assert.equal(pricing.fastMultiplierForModel('gpt-5.4-mini'),null);
  assert.equal(pricing.fastMultiplierForModel('gpt-5.2'),null);
  assert.deepEqual(JSON.parse(JSON.stringify(pricing.CODEX_USD_REFERENCE_CATALOG.rates['gpt-5.4-mini'])),{input:0.75,cachedInput:0.075,output:4.5});
  assert.deepEqual(JSON.parse(JSON.stringify(pricing.CODEX_USD_REFERENCE_CATALOG.rates['gpt-5.2'])),{input:1.75,cachedInput:0.175,output:14});
  assert.deepEqual(JSON.parse(JSON.stringify(pricing.CODEX_USD_REFERENCE_CATALOG.rates['gpt-daybreak-red-latest'])),{input:12.5,cachedInput:1.25,output:75});
});

test('reference pricing snapshot is versioned and staleness is deterministic',()=>{
  assert.equal(pricing.CODEX_USD_REFERENCE_CATALOG.snapshotDate,'2026-09-29');
  assert.equal(pricing.pricingSnapshotAgeDays(pricing.CODEX_USD_REFERENCE_CATALOG,Date.UTC(2026,8,29,12)),0);
  assert.equal(pricing.pricingSnapshotAgeDays(pricing.CODEX_USD_REFERENCE_CATALOG,Date.UTC(2026,9,31,12)),32);
  assert.equal(pricing.formatUsd(0.12345),'$0.1235');
});
