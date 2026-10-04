import { getVersion } from '@tauri-apps/api/app';
import { Channel, invoke } from '@tauri-apps/api/core';
import { compareVersions } from './update-version';

export type UpdateState =
  | { status:'idle'|'checking' }
  | { status:'current'; currentVersion:string; latestVersion:string }
  | { status:'available'; currentVersion:string; latestVersion:string; publishedAt:string|null; notes:string }
  | { status:'error'; message:string };

export type UpdateCopy = {
  check:string; checking:string; current:string; available:string; openRelease:string; install:string; installing:string; failed:string;
  currentVersion:string; latestVersion:string; downloading:string; installFailed:string; pendingDraft:string; manualBootstrap:string;
};

const copies:Record<string,UpdateCopy>={
  en:{downloading:"Downloading update…",installFailed:"Update failed. You can retry from Check updates.",pendingDraft:"Apply or discard pending configuration changes before installing the update.",manualBootstrap:"This build needs a one-time manual upgrade to enable in-app updates.",check:'Check updates',checking:'Checking…',current:'Up to date',available:'Update available',openRelease:'Open release',install:'Install and restart',installing:'Installing update…',failed:'Update check failed',currentVersion:'Current',latestVersion:'Latest'},
  'zh-CN':{downloading:"正在下载更新…",installFailed:"更新失败，可点击检查更新重试。",pendingDraft:"请先应用或放弃待应用的配置，再安装更新。",manualBootstrap:"此安装包需要手动升级一次，后续即可在应用内更新。",check:'检查更新',checking:'正在检查…',current:'已是最新版本',available:'发现新版本',openRelease:'打开正式版页面',install:'安装并重启',installing:'正在安装更新…',failed:'检查更新失败',currentVersion:'当前版本',latestVersion:'最新版本'},
  'zh-TW':{downloading:"正在下載更新…",installFailed:"更新失敗，可點擊檢查更新重試。",pendingDraft:"請先套用或捨棄待套用的設定，再安裝更新。",manualBootstrap:"此安裝包需要手動升級一次，之後即可在應用程式內更新。",check:'檢查更新',checking:'正在檢查…',current:'已是最新版本',available:'發現新版本',openRelease:'開啟正式版頁面',install:'安裝並重新啟動',installing:'正在安裝更新…',failed:'檢查更新失敗',currentVersion:'目前版本',latestVersion:'最新版本'},
  ja:{downloading:"更新をダウンロード中…",installFailed:"更新に失敗しました。更新の確認から再試行できます。",pendingDraft:"更新前に未適用の設定を適用または破棄してください。",manualBootstrap:"アプリ内更新を有効にするには、一度手動でアップグレードしてください。",check:'更新を確認',checking:'確認中…',current:'最新版です',available:'更新があります',openRelease:'リリースを開く',install:'インストールして再起動',installing:'更新をインストール中…',failed:'更新確認に失敗しました',currentVersion:'現在',latestVersion:'最新'},
  ko:{downloading:"업데이트 다운로드 중…",installFailed:"업데이트에 실패했습니다. 업데이트 확인에서 다시 시도할 수 있습니다.",pendingDraft:"업데이트를 설치하기 전에 변경한 설정을 적용하거나 취소하세요.",manualBootstrap:"앱 내 업데이트를 활성화하려면 한 번 수동으로 업그레이드해야 합니다.",check:'업데이트 확인',checking:'확인 중…',current:'최신 버전',available:'업데이트 있음',openRelease:'릴리스 열기',install:'설치 후 다시 시작',installing:'업데이트 설치 중…',failed:'업데이트 확인 실패',currentVersion:'현재',latestVersion:'최신'},
};
export function updateText(locale:string):UpdateCopy{return copies[locale]??copies.en;}

type GithubRelease={tag_name?:unknown;name?:unknown;body?:unknown;published_at?:unknown;draft?:unknown;prerelease?:unknown};

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


export async function signedUpdaterEnabled():Promise<boolean>{
  try{
    const info=await invoke<{enabled:boolean}>('signed_updater_info',{});
    return info.enabled===true;
  }catch{return false;}
}

export type UpdateProgress = {stage:'checking'|'downloading'|'installing'; downloaded:number; total:number|null};
export function updateProgressLabel(progress:UpdateProgress,copy:UpdateCopy):string {
  if(progress.stage==='checking')return copy.checking;
  if(progress.stage==='installing')return copy.installing;
  const percent=progress.total && progress.total>0
    ? Math.min(100,Math.max(0,Math.floor(progress.downloaded/progress.total*100))) : null;
  return percent===null?copy.downloading:`${copy.downloading} ${percent}%`;
}
export async function installSignedUpdate(onProgress:(progress:UpdateProgress)=>void):Promise<void>{
  const onEvent=new Channel<UpdateProgress>();
  onEvent.onmessage=onProgress;
  await invoke('install_signed_update',{onEvent});
}
