import type { CodexRuntimeInfo } from './config-health';
import type { SchemaState } from './config-schema';
import type { OfficialModelCatalogState } from './model-catalog';

export type EnvironmentStatusCopy = {
  title: string;
  codex: string;
  schema: string;
  modelCatalog: string;
  updater: string;
  ready: string;
  notEnabled: string;
  checking: string;
  fresh: string;
  stale: string;
  unavailable: string;
  notDetected: string;
  lastUpdated: string;
  catalogChanges: string;
  noCatalogChanges: string;
  addedModel: string;
  removedModel: string;
};

const copies: Record<string, EnvironmentStatusCopy> = {
  en: {
    title:'Environment status',codex:'Codex CLI',schema:'Config schema',modelCatalog:'Official model catalog',updater:'Signed updater',
    ready:'Ready',notEnabled:'Not enabled in this build',checking:'Checking…',fresh:'Current',stale:'Cached / stale',unavailable:'Unavailable',
    notDetected:'Not detected',lastUpdated:'Updated',catalogChanges:'Official model changes',noCatalogChanges:'No model capability changes detected',addedModel:'Added',removedModel:'Removed',
  },
  'zh-CN': {
    title:'环境状态',codex:'Codex CLI',schema:'配置 Schema',modelCatalog:'官方模型目录',updater:'签名更新器',
    ready:'已就绪',notEnabled:'当前构建未启用',checking:'检查中…',fresh:'最新',stale:'缓存 / 较旧',unavailable:'不可用',
    notDetected:'未检测到',lastUpdated:'更新时间',catalogChanges:'官方模型变化',noCatalogChanges:'未检测到模型能力变化',addedModel:'新增',removedModel:'移除',
  },
  'zh-TW': {
    title:'環境狀態',codex:'Codex CLI',schema:'設定 Schema',modelCatalog:'官方模型目錄',updater:'簽名更新器',
    ready:'已就緒',notEnabled:'目前建置未啟用',checking:'檢查中…',fresh:'最新',stale:'快取 / 較舊',unavailable:'無法使用',
    notDetected:'未偵測到',lastUpdated:'更新時間',catalogChanges:'官方模型變化',noCatalogChanges:'未偵測到模型能力變化',addedModel:'新增',removedModel:'移除',
  },
  ja: {
    title:'環境ステータス',codex:'Codex CLI',schema:'設定 Schema',modelCatalog:'公式モデルカタログ',updater:'署名付きアップデーター',
    ready:'準備完了',notEnabled:'このビルドでは未有効',checking:'確認中…',fresh:'最新',stale:'キャッシュ / 古い',unavailable:'利用不可',
    notDetected:'未検出',lastUpdated:'更新',catalogChanges:'公式モデル変更',noCatalogChanges:'モデル能力の変更はありません',addedModel:'追加',removedModel:'削除',
  },
  ko: {
    title:'환경 상태',codex:'Codex CLI',schema:'설정 Schema',modelCatalog:'공식 모델 카탈로그',updater:'서명 업데이트',
    ready:'준비됨',notEnabled:'현재 빌드에서 비활성화됨',checking:'확인 중…',fresh:'최신',stale:'캐시 / 오래됨',unavailable:'사용 불가',
    notDetected:'감지되지 않음',lastUpdated:'업데이트',catalogChanges:'공식 모델 변경',noCatalogChanges:'모델 기능 변경 없음',addedModel:'추가',removedModel:'제거',
  },
};

export type EnvironmentStatusRow = {
  id: 'codex' | 'schema' | 'model-catalog' | 'updater';
  label: string;
  value: string;
  detail: string | null;
  status: 'ok' | 'warn' | 'unknown';
};

export type EnvironmentStatusInput = {
  locale: string;
  runtime: CodexRuntimeInfo | null;
  schema: SchemaState | null;
  modelCatalog: OfficialModelCatalogState | null;
  signedUpdaterReady: boolean | null;
};

function formatTimestamp(value:number|null|undefined,locale:string):string|null {
  if(!value)return null;
  try {
    return new Intl.DateTimeFormat(locale,{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value));
  } catch {
    return new Date(value).toLocaleString();
  }
}

function remoteStatus(
  label:string,
  id:'schema'|'model-catalog',
  state:SchemaState|OfficialModelCatalogState|null,
  locale:string,
  copy:EnvironmentStatusCopy,
):EnvironmentStatusRow {
  if(!state)return{id,label,value:copy.checking,detail:null,status:'unknown'};
  const detail=formatTimestamp(state.fetchedAt,locale);
  if(state.status==='fresh')return{id,label,value:copy.fresh,detail:detail?copy.lastUpdated+' '+detail:null,status:'ok'};
  if(state.status==='stale')return{id,label,value:copy.stale,detail:detail?copy.lastUpdated+' '+detail:null,status:'warn'};
  return{id,label,value:copy.unavailable,detail:state.error||null,status:'unknown'};
}

export function environmentText(locale:string):EnvironmentStatusCopy {
  return copies[locale]??copies.en;
}

export function environmentStatusRows(input:EnvironmentStatusInput):EnvironmentStatusRow[] {
  const copy=environmentText(input.locale);
  const runtime=input.runtime;
  const codex:EnvironmentStatusRow=runtime?.installed
    ? {id:'codex',label:copy.codex,value:runtime.version??runtime.rawVersion??copy.ready,detail:runtime.launcher,status:'ok'}
    : {id:'codex',label:copy.codex,value:copy.notDetected,detail:runtime?.error??null,status:'warn'};

  const updater:EnvironmentStatusRow=input.signedUpdaterReady===null
    ? {id:'updater',label:copy.updater,value:copy.checking,detail:null,status:'unknown'}
    : input.signedUpdaterReady
      ? {id:'updater',label:copy.updater,value:copy.ready,detail:null,status:'ok'}
      : {id:'updater',label:copy.updater,value:copy.notEnabled,detail:null,status:'unknown'};

  return[
    codex,
    remoteStatus(copy.schema,'schema',input.schema,input.locale,copy),
    remoteStatus(copy.modelCatalog,'model-catalog',input.modelCatalog,input.locale,copy),
    updater,
  ];
}
