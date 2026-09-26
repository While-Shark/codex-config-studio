import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const [dirArg, versionArg, tagArg, repoArg='While-Shark/codex-config-studio'] = process.argv.slice(2);
if(!dirArg||!versionArg||!tagArg)throw new Error('Usage: node scripts/build-updater-manifest.mjs <dir> <version> <tag> [repo]');

const dir=resolve(dirArg);
const files=readdirSync(dir);
const pick=(suffix)=>{
  const matches=files.filter(name=>name.endsWith(suffix));
  if(matches.length!==1)throw new Error(`Expected exactly one *${suffix}, found ${matches.length}: ${matches.join(', ')}`);
  return matches[0];
};
const asset=(sigName)=>{
  const file=sigName.slice(0,-4);
  const signature=readFileSync(resolve(dir,sigName),'utf8').trim();
  if(!signature)throw new Error(`Empty signature: ${sigName}`);
  const url=`https://github.com/${repoArg}/releases/download/${encodeURIComponent(tagArg)}/${encodeURIComponent(file)}`;
  return {signature,url};
};

const windows=asset(pick('-setup.exe.sig'));
const linux=asset(pick('.AppImage.sig'));
const mac=asset(pick('.app.tar.gz.sig'));

const manifest={
  version:versionArg.replace(/^v/i,''),
  notes:`Codex Config Studio ${tagArg}`,
  pub_date:new Date().toISOString(),
  platforms:{
    'windows-x86_64':windows,
    'linux-x86_64':linux,
    'darwin-x86_64':mac,
    'darwin-aarch64':mac,
  },
};

writeFileSync(resolve(dir,'latest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Generated updater manifest for',Object.keys(manifest.platforms).join(', '));
