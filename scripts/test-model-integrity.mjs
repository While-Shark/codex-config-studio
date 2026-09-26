import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadTypeScript } from './helpers/load-typescript.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const integrity=loadTypeScript(resolve(root,'src/model-integrity.ts'));

test('global integrity target uses the global managed values',()=>{
  assert.deepEqual(
    JSON.parse(JSON.stringify(integrity.resolveIntegrityTarget({model:'gpt-6-luna',modelReasoningEffort:'xhigh'},'global',null))),
    {model:'gpt-6-luna',reasoning:'xhigh'},
  );
});

test('project target resolves inheritance field by field',()=>{
  assert.deepEqual(
    JSON.parse(JSON.stringify(integrity.resolveIntegrityTarget(
      {model:'gpt-6-sol',modelReasoningEffort:'high'},
      'project',
      {model:null,modelReasoningEffort:'xhigh'},
    ))),
    {model:'gpt-6-sol',reasoning:'xhigh'},
  );
});

test('target comparison detects model and reasoning drift',()=>{
  const locked={model:'gpt-6-luna',reasoning:'xhigh'};
  assert.equal(integrity.sameIntegrityTarget(locked,{model:'gpt-6-luna',reasoning:'xhigh'}),true);
  assert.equal(integrity.sameIntegrityTarget(locked,{model:'gpt-6-sol',reasoning:'xhigh'}),false);
  assert.equal(integrity.sameIntegrityTarget(locked,{model:'gpt-6-luna',reasoning:'high'}),false);
});

test('scope keys keep projects separate and trim trailing separators',()=>{
  assert.equal(integrity.integrityScopeKey('global','C:\\work\\demo'),'global');
  assert.equal(integrity.integrityScopeKey('project','C:\\work\\demo\\'),'project:C:\\work\\demo');
  assert.equal(integrity.integrityScopeKey('project','/srv/demo/'),'project:/srv/demo');
});

test('integrity copy is complete in five languages',()=>{
  const keys=Object.keys(integrity.integrityText('en'));
  for(const locale of ['zh-CN','zh-TW','en','ja','ko']){
    const copy=integrity.integrityText(locale);
    assert.deepEqual(Object.keys(copy),keys);
    assert.ok(Object.values(copy).every(value=>typeof value==='string'&&value.trim()));
  }
});
