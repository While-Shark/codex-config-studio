export const AUTO_UPDATE_CHECK_INTERVAL_MS=6*60*60*1000;
export const AUTO_UPDATE_PROMPT_COOLDOWN_MS=24*60*60*1000;

type PromptRecord={version:string;promptedAt:number};

function readPromptRecord(serialized:string|null):PromptRecord|null{
  if(!serialized)return null;
  try{
    const value=JSON.parse(serialized) as Partial<PromptRecord>;
    if(typeof value.version!=='string'||!value.version.trim())return null;
    if(typeof value.promptedAt!=='number'||!Number.isFinite(value.promptedAt)||value.promptedAt<0)return null;
    return{version:value.version,promptedAt:value.promptedAt};
  }catch{return null;}
}

export function shouldRunAutomaticUpdateCheck(lastCheckedAt:number,now:number):boolean{
  if(!Number.isFinite(lastCheckedAt)||lastCheckedAt<=0)return true;
  return now-lastCheckedAt>=AUTO_UPDATE_CHECK_INTERVAL_MS;
}

export function shouldPromptAutomaticUpdate(version:string,serialized:string|null,now:number):boolean{
  const normalized=version.trim();
  if(!normalized)return false;
  const record=readPromptRecord(serialized);
  if(!record||record.version!==normalized)return true;
  return now-record.promptedAt>=AUTO_UPDATE_PROMPT_COOLDOWN_MS;
}

export function automaticUpdatePromptRecord(version:string,now:number):string{
  return JSON.stringify({version:version.trim(),promptedAt:now});
}
