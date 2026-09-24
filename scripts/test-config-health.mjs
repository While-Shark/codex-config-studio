import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadTypeScript } from './helpers/load-typescript.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const health=loadTypeScript(resolve(root,'src/config-schema.ts'),{
  localStorage:{getItem(){return null;},setItem(){}},
  fetch:async()=>{throw new Error('network disabled in unit test');},
  AbortController:globalThis.AbortController,
  setTimeout,clearTimeout,
});

const schema={
  properties:{
    model:{type:'string'},
    features:{$ref:'#/definitions/Features'},
    agents:{$ref:'#/definitions/Agents'},
    mcp_servers:{type:'object',additionalProperties:{$ref:'#/definitions/Mcp'}},
  },
  definitions:{
    Features:{type:'object',additionalProperties:false,properties:{multi_agent:{type:'boolean'}}},
    Agents:{type:'object',additionalProperties:false,properties:{enabled:{type:'boolean'}}},
    Mcp:{type:'object',additionalProperties:false,properties:{command:{type:'string'},args:{type:'array'}}},
  },
};

test('strict official tables reject unknown fields',()=>{
  assert.equal(health.schemaAllowsPath(schema,['features','multi_agent']),true);
  assert.equal(health.schemaAllowsPath(schema,['features','respect_system_proxies']),false);
  assert.equal(health.schemaAllowsPath(schema,['agents','enabled']),true);
  assert.equal(health.schemaAllowsPath(schema,['agents','mystery']),false);
});

test('dynamic table names remain valid while their nested schema is checked',()=>{
  assert.equal(health.schemaAllowsPath(schema,['mcp_servers','my-server']),true);
  assert.equal(health.schemaAllowsPath(schema,['mcp_servers','my-server','command']),true);
  assert.equal(health.schemaAllowsPath(schema,['mcp_servers','my-server','unknown']),false);
});

test('unknown open schema branches fail open rather than creating false positives',()=>{
  const open={properties:{custom:{type:'object'}} ,definitions:{}};
  assert.equal(health.schemaAllowsPath(open,['custom','future_field']),true);
});

test('health copy is complete in five languages',()=>{
  const keys=Object.keys(health.healthText('en'));
  for(const locale of ['zh-CN','zh-TW','en','ja','ko']){
    const copy=health.healthText(locale);
    assert.deepEqual(Object.keys(copy),keys);
    assert.ok(Object.values(copy).every(value=>typeof value==='string'&&value.trim()));
  }
});
