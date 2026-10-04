import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadTypeScript } from './helpers/load-typescript.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const env=loadTypeScript(resolve(root,'src/environment-status.ts'));

test('environment status copy is complete in five languages',()=>{
  const keys=Object.keys(env.environmentText('en'));
  for(const locale of ['zh-CN','zh-TW','en','ja','ko']){
    const copy=env.environmentText(locale);
    assert.deepEqual(Object.keys(copy),keys);
    assert.ok(Object.values(copy).every(value=>typeof value==='string'&&value.trim()));
  }
});

test('environment rows distinguish healthy stale and build-local states',()=>{
  const rows=JSON.parse(JSON.stringify(env.environmentStatusRows({
    locale:'en',
    runtime:{installed:true,version:'1.2.3',rawVersion:'codex 1.2.3',launcher:'codex',error:null},
    schema:{status:'fresh',sourceUrl:'https://example/schema',sourceTrust:'authoritative',fetchedAt:1,error:null,canWarnUnknown:true},
    modelCatalog:{status:'stale',sourceUrl:'https://example/models',fetchedAt:2,error:'offline'},
    signedUpdaterReady:false,
  })));
  assert.equal(rows[0].id,'codex');
  assert.equal(rows[0].status,'ok');
  assert.equal(rows[1].status,'ok');
  assert.equal(rows[2].status,'warn');
  assert.equal(rows[3].status,'unknown');
  assert.match(rows[3].value,/Not enabled/);
});

test('missing runtime and unavailable remote metadata remain advisory',()=>{
  const rows=JSON.parse(JSON.stringify(env.environmentStatusRows({
    locale:'zh-CN',
    runtime:{installed:false,version:null,rawVersion:null,launcher:null,error:'not found'},
    schema:{status:'unavailable',sourceUrl:null,sourceTrust:null,fetchedAt:null,error:'offline',canWarnUnknown:false},
    modelCatalog:null,
    signedUpdaterReady:null,
  })));
  assert.equal(rows[0].status,'warn');
  assert.equal(rows[1].status,'unknown');
  assert.equal(rows[2].status,'unknown');
  assert.equal(rows[3].status,'unknown');
});

test('Windows runtime probes and release-page launcher suppress console allocation',()=>{
  const source=readFileSync(resolve(root,'src-tauri/src/lib.rs'),'utf8');
  const helper=source.slice(source.indexOf('fn background_command('),source.indexOf('fn detect_codex_runtime('));
  assert.match(helper, /#\[cfg\(windows\)\]/);
  assert.match(helper, /use std::os::windows::process::CommandExt/);
  assert.match(helper, /CREATE_NO_WINDOW: u32 = 0x0800_0000/);
  assert.match(helper, /command\.creation_flags\(CREATE_NO_WINDOW\)/);
  const detection=source.slice(source.indexOf('fn detect_codex_runtime('),source.indexOf('fn recoverable_file_lock('));
  assert.match(detection, /background_command\("codex"\)\.arg\("--version"\)\.output\(\)/);
  assert.match(detection, /background_command\("cmd"\)/);
  assert.match(detection, /\.args\(\["\/D", "\/C", "codex", "--version"\]\)/);
  const release=source.slice(source.indexOf('fn open_fixed_release_page('),source.indexOf('async fn open_stable_release_page('));
  assert.match(release, /background_command\("cmd"\)/);
  assert.doesNotMatch(source, /Command::new\("(?:codex|cmd)"\)/);
});
