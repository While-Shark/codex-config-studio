import { appendFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { normalizeUpdaterPublicKey } from './updater-public-key.mjs';

const pubkeyInput=process.env.CODEX_UPDATER_PUBKEY?.trim();
const privateKey=process.env.TAURI_SIGNING_PRIVATE_KEY?.trim();
const githubEnv=process.env.GITHUB_ENV?.trim();
const releaseConfigPath=resolve(
  process.env.CODEX_TAURI_RELEASE_CONFIG_PATH?.trim() || 'src-tauri/tauri.release.conf.json',
);

if(!pubkeyInput)throw new Error('CODEX_UPDATER_PUBKEY is required for signed release builds');
if(!privateKey)throw new Error('TAURI_SIGNING_PRIVATE_KEY is required for signed release builds');
if(!githubEnv)throw new Error('GITHUB_ENV is required to prepare signed release builds');

const pubkey=normalizeUpdaterPublicKey(pubkeyInput);

let existingTauriConfig={};
const existingTauriConfigInput=process.env.TAURI_CONFIG?.trim();
if(existingTauriConfigInput){
  try{
    existingTauriConfig=JSON.parse(existingTauriConfigInput);
  }catch(error){
    throw new Error(`TAURI_CONFIG must contain valid JSON before updater preparation: ${error instanceof Error?error.message:String(error)}`);
  }
}

const existingPlugins=existingTauriConfig.plugins??{};
const existingUpdater=existingPlugins.updater??{};
const tauriConfig={
  ...existingTauriConfig,
  bundle:{
    ...(existingTauriConfig.bundle??{}),
    createUpdaterArtifacts:true,
  },
  plugins:{
    ...existingPlugins,
    updater:{
      ...existingUpdater,
      pubkey,
    },
  },
};

writeFileSync(releaseConfigPath,JSON.stringify(tauriConfig,null,2)+'\n');

appendFileSync(
  githubEnv,
  `CODEX_UPDATER_PUBKEY=${pubkey}\nTAURI_CONFIG=\n`,
);

console.log(`Signed updater artifacts enabled through --config ${releaseConfigPath} with normalized public-key material.`);
