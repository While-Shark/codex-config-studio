import { appendFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { normalizeUpdaterPublicKey } from './updater-public-key.mjs';

// Nightly packages can verify official updates without access to the signing key.
const input=process.env.CODEX_UPDATER_PUBKEY?.trim();
const envPath=process.env.GITHUB_ENV?.trim();
if(!input)throw new Error('CODEX_UPDATER_PUBKEY is required for distributed updater clients');
if(!envPath)throw new Error('GITHUB_ENV is required to prepare updater clients');
const pubkey=normalizeUpdaterPublicKey(input);
const output=resolve(process.env.CODEX_TAURI_CLIENT_CONFIG_PATH?.trim()||'src-tauri/tauri.updater-client.conf.json');
writeFileSync(output,JSON.stringify({bundle:{createUpdaterArtifacts:false},plugins:{updater:{pubkey}}},null,2)+'\n');
appendFileSync(envPath,`CODEX_UPDATER_PUBKEY=${pubkey}\nTAURI_CONFIG={}\n`);
console.log('Stable signed-update verification enabled for the distributed client.');
