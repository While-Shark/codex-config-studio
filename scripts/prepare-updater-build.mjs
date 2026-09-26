import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const configPath=resolve('src-tauri/tauri.conf.json');
const config=JSON.parse(readFileSync(configPath,'utf8'));
const pubkey=process.env.TAURI_UPDATER_PUBKEY?.trim();
const privateKey=process.env.TAURI_SIGNING_PRIVATE_KEY?.trim();

if(!pubkey)throw new Error('TAURI_UPDATER_PUBKEY is required for signed release builds');
if(!privateKey)throw new Error('TAURI_SIGNING_PRIVATE_KEY is required for signed release builds');

config.bundle={...(config.bundle??{}),createUpdaterArtifacts:true};
writeFileSync(configPath,JSON.stringify(config,null,2)+'\n');
console.log('Signed updater artifacts enabled for this release build.');
