import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertReleaseVersionsAligned } from './check-release-version.mjs';

function read(path){ return readFileSync(resolve(path),'utf8').replace(/\r\n/g,'\n'); }
function check(name,ok,detail){ return {name,status:ok?'ok':'fail',detail}; }

export function releaseReadiness(root=process.cwd()){
  const version=assertReleaseVersionsAligned(root).version;
  const workflow=read(resolve(root,'.github/workflows/release.yml'));
  const notes=read(resolve(root,'RELEASE_NOTES.md'));
  const checklist=read(resolve(root,'docs/RELEASE_CHECKLIST.md'));
  const updater=read(resolve(root,'src-tauri/src/updater.rs'));
  const tauri=JSON.parse(read(resolve(root,'src-tauri/tauri.conf.json')));
  const parts=version.split('.').map(Number);
  const nextMinor=String(parts[0])+'.'+String(parts[1]+1)+'.0';

  const checks=[
    check('version sources aligned',true,'v'+version),
    check('release workflow secret preflight',
      workflow.includes('Verify required updater signing secrets before release mutation')
        && workflow.includes('TAURI_SIGNING_PRIVATE_KEY')
        && workflow.includes('TAURI_UPDATER_PUBKEY'),
      'Updater signing inputs are validated before release mutation'),
    check('formal updater artifacts',
      workflow.includes('Enable signed updater artifacts')
        && workflow.includes('prepare-updater-build.mjs')
        && workflow.includes('build-updater-manifest.mjs'),
      'Formal release enables signed updater artifacts and publishes latest.json'),
    check('local updater disabled by default',
      tauri.plugins?.updater?.pubkey==='' && updater.includes('option_env!("TAURI_UPDATER_PUBKEY")'),
      'Nightly/local builds keep updater trust disabled unless the release environment injects the public key'),
    check('v0.6.0 notes cover current features',
      ['GPT-6.1 Sol','Environment status center','Rule-level schema diff explanations','Agent efficiency metrics','Project-level agent summary'].every(token=>notes.includes(token))
        || ['GPT-6.1 Sol','环境状态中心','Schema 规则级差异解释','Agent 效率指标','项目级 Agent 摘要'].every(token=>notes.includes(token)),
      'Release notes include the latest model, config-health, and usage capabilities'),
    check('release checklist documents updater bootstrap',
      checklist.includes('v0.5.0 has no updater runtime')
        && checklist.includes('v0.6.0 -> later signed release'),
      'Checklist preserves the one-time manual v0.5.0 to v0.6.0 bootstrap rule'),
  ];
  return{
    version,
    nextMinor,
    checks,
    external:[
      {name:'TAURI_SIGNING_PRIVATE_KEY',status:'manual',detail:'GitHub Secrets API is intentionally not readable by this check.'},
      {name:'TAURI_UPDATER_PUBKEY',status:'manual',detail:'Confirm the matching updater public key exists in repository secrets.'},
      {name:'TAURI_SIGNING_PRIVATE_KEY_PASSWORD',status:'optional',detail:'Required only when the updater private key is password protected.'},
    ],
    readyForDispatch:checks.every(item=>item.status==='ok'),
  };
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const result=releaseReadiness();
  for(const item of result.checks)console.log((item.status==='ok'?'✓':'✗')+' '+item.name+': '+item.detail);
  for(const item of result.external)console.log('? '+item.name+': '+item.detail);
  console.log(result.readyForDispatch
    ? 'Code-side release readiness is green. Current v'+result.version+'; minor dispatch resolves to v'+result.nextMinor+'.'
    : 'Code-side release readiness failed.');
  if(!result.readyForDispatch)process.exitCode=1;
}
