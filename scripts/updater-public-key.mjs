const COMMENT_PREFIX='untrusted comment:';

function normalizeLines(value){
  return value.trim().replace(/\r\n/g,'\n');
}

function looksLikeKeyLine(value){
  return /^RW[A-Za-z0-9+/=]+$/.test(value) && value.length>=40;
}

function canonicalFile(value){
  const normalized=normalizeLines(value);
  const lines=normalized.split('\n').map(line=>line.trim()).filter(Boolean);

  if(lines[0]?.startsWith(COMMENT_PREFIX) && looksLikeKeyLine(lines[1]??'')){
    return lines[0]+'\n'+lines[1]+'\n';
  }

  if(lines.length===1 && looksLikeKeyLine(lines[0])){
    return 'untrusted comment: minisign public key\n'+lines[0]+'\n';
  }

  return null;
}

export function normalizeUpdaterPublicKey(value){
  const raw=value?.trim();
  if(!raw)throw new Error('Updater public key is empty');

  const direct=canonicalFile(raw);
  if(direct)return Buffer.from(direct,'utf8').toString('base64');

  const compact=raw.replace(/\s+/g,'');
  let decoded='';
  try{
    decoded=Buffer.from(compact,'base64').toString('utf8');
  }catch{
    // The format check below provides a stable release-facing error.
  }

  const materialized=canonicalFile(decoded);
  if(!materialized){
    throw new Error(
      'TAURI_UPDATER_PUBKEY must be a Tauri/minisign public key, either as the two-line key, the RW... key line, or Base64 wrapping either form',
    );
  }

  return Buffer.from(materialized,'utf8').toString('base64');
}
