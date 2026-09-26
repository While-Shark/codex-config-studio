import { getVersion } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';

export type UpdateState =
  | { status:'idle'|'checking' }
  | { status:'current'; currentVersion:string; latestVersion:string }
  | { status:'available'; currentVersion:string; latestVersion:string; publishedAt:string|null; notes:string }
  | { status:'error'; message:string };

export type UpdateCopy = {
  check:string; checking:string; current:string; available:string; openRelease:string; failed:string;
  currentVersion:string; latestVersion:string;
};

const copies:Record<string,UpdateCopy>={
  en:{check:'Check updates',checking:'Checking…',current:'Up to date',available:'Update available',openRelease:'Open release',failed:'Update check failed',currentVersion:'Current',latestVersion:'Latest'},
  'zh-CN':{check:'检查更新',checking:'正在检查…',current:'已是最新版本',available:'发现新版本',openRelease:'打开正式版页面',failed:'检查更新失败',currentVersion:'当前版本',latestVersion:'最新版本'},
  'zh-TW':{check:'檢查更新',checking:'正在檢查…',current:'已是最新版本',available:'發現新版本',openRelease:'開啟正式版頁面',failed:'檢查更新失敗',currentVersion:'目前版本',latestVersion:'最新版本'},
  ja:{check:'更新を確認',checking:'確認中…',current:'最新版です',available:'更新があります',openRelease:'リリースを開く',failed:'更新確認に失敗しました',currentVersion:'現在',latestVersion:'最新'},
  ko:{check:'업데이트 확인',checking:'확인 중…',current:'최신 버전',available:'업데이트 있음',openRelease:'릴리스 열기',failed:'업데이트 확인 실패',currentVersion:'현재',latestVersion:'최신'},
};
export function updateText(locale:string):UpdateCopy{return copies[locale]??copies.en;}

type GithubRelease={tag_name?:unknown;name?:unknown;body?:unknown;published_at?:unknown;draft?:unknown;prerelease?:unknown};

function parseSemver(value:string):number[]|null{
  const clean=value.trim().replace(/^v/i,'').split('-')[0];
  const parts=clean.split('.');
  if(parts.length<2||parts.length>4||parts.some(part=>!/^\d+$/.test(part)))return null;
  return parts.map(Number);
}
export function compareVersions(left:string,right:string):number{
  const a=parseSemver(left),b=parseSemver(right);
  if(!a||!b)return left.localeCompare(right,undefined,{numeric:true,sensitivity:'base'});
  for(let i=0;i<Math.max(a.length,b.length);i++){
    const diff=(a[i]??0)-(b[i]??0);
    if(diff!==0)return diff<0?-1:1;
  }
  return 0;
}

export async function checkStableUpdate():Promise<UpdateState>{
  try{
    const currentVersion=await getVersion();
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    let response:Response;
    try{
      response=await fetch('https://api.github.com/repos/While-Shark/codex-config-studio/releases/latest',{
        cache:'no-store',
        signal:controller.signal,
        headers:{Accept:'application/vnd.github+json'},
      });
    }finally{clearTimeout(timer);}
    if(!response.ok)throw new Error(`GitHub HTTP ${response.status}`);
    const release=await response.json() as GithubRelease;
    if(release.draft===true||release.prerelease===true)throw new Error('latest release is not stable');
    const tag=typeof release.tag_name==='string'?release.tag_name:'';
    const latestVersion=tag.replace(/^v/i,'');
    if(!latestVersion)throw new Error('release version missing');
    if(compareVersions(currentVersion,latestVersion)>=0)return{status:'current',currentVersion,latestVersion};
    return{
      status:'available',
      currentVersion,
      latestVersion,
      publishedAt:typeof release.published_at==='string'?release.published_at:null,
      notes:typeof release.body==='string'?release.body.slice(0,4000):'',
    };
  }catch(error){
    return{status:'error',message:String(error)};
  }
}

export async function openStableReleasePage():Promise<void>{
  await invoke('open_stable_release_page',{});
}
