import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadTypeScript } from './helpers/load-typescript.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const overview=loadTypeScript(resolve(root,'src/project-overview.ts'));

test('recent projects are deduplicated by normalized path and keep the newest config snapshot',()=>{
  const entries=[
    {timestampMs:10,scopeKind:'project',projectPath:'/work/demo/',values:{model:'old',modelReasoningEffort:'low'}},
    {timestampMs:30,scopeKind:'project',projectPath:'/work/other',values:{model:'sol',modelReasoningEffort:'high'}},
    {timestampMs:20,scopeKind:'project',projectPath:'/work/demo',values:{model:'luna',modelReasoningEffort:'xhigh'}},
    {timestampMs:40,scopeKind:'global',projectPath:null,values:{model:'astra',modelReasoningEffort:'high'}},
  ];
  const projects=JSON.parse(JSON.stringify(overview.recentProjectsFromHistory(entries,12)));
  assert.equal(projects.length,2);
  assert.equal(projects[0].path,'/work/other');
  assert.equal(projects[1].path,'/work/demo');
  assert.equal(projects[1].model,'luna');
  assert.equal(projects[1].reasoning,'xhigh');
});

test('overview summary aggregates project usage without treating unavailable paths as usage',()=>{
  const tokens=(total)=>({inputTokens:total,cachedInputTokens:0,cacheWriteInputTokens:0,outputTokens:0,reasoningOutputTokens:0,totalTokens:total});
  const report={source:'x',filesScanned:3,parseErrors:0,skippedLargeFiles:0,truncated:false,projects:[
    {projectPath:'/a',available:true,sessions:2,turns:3,responses:4,usage:tokens(120),models:[],reroutes:1},
    {projectPath:'/b',available:true,sessions:0,turns:0,responses:0,usage:tokens(0),models:[],reroutes:0},
    {projectPath:'/missing',available:false,sessions:0,turns:0,responses:0,usage:tokens(0),models:[],reroutes:0},
  ]};
  const summary=JSON.parse(JSON.stringify(overview.summarizeProjectOverview(report)));
  assert.deepEqual(summary,{projects:3,activeProjects:1,sessions:2,reroutes:1,totalTokens:120});
});

test('top model label uses the leading backend model row and optional reasoning',()=>{
  const project={models:[{model:'gpt-6-luna',reasoning:'xhigh',responses:2,usage:{totalTokens:10}}]};
  assert.equal(overview.topModelLabel(project),'gpt-6-luna · xhigh');
  assert.equal(overview.topModelLabel({models:[]}),'—');
});

test('overview copy is complete in five languages',()=>{
  const keys=Object.keys(overview.overviewText('en'));
  for(const locale of ['zh-CN','zh-TW','en','ja','ko']){
    const copy=overview.overviewText(locale);
    assert.deepEqual(Object.keys(copy),keys);
    assert.ok(Object.values(copy).every(value=>typeof value==='string'&&value.trim()));
  }
});
