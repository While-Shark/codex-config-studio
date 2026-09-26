export type SchemaState = {
  status: 'fresh' | 'stale' | 'unavailable';
  sourceUrl: string | null;
  sourceTrust: 'authoritative' | 'fallback' | null;
  fetchedAt: number | null;
  error: string | null;
  canWarnUnknown: boolean;
};
export type SchemaChange = { kind:'added'|'removed'|'changed'; path:string };
export type SchemaChangeReport = { fromFetchedAt:number|null; toFetchedAt:number; changes:SchemaChange[] };
export type HealthCopy = {
  title: string; healthy: string; loading: string; unavailable: string; stale: string; fresh: string;
  projectValid: string; globalValid: string; missing: string; invalidToml: string; managed: string;
  issues: string; viewProblems: string; refreshRules: string; rulesUpdated: string; rulesCached: string;
  unknown: string; recommendation: string; remove: string; removeTitle: string; removeBody: string;
  confirmRemove: string; sessionNote: string; preserved: string; refreshFailed: string;
  codexVersion: string; codexMissing: string; ruleChanges: string; noRuleChanges: string;
  fieldsAdded: string; fieldsRemoved: string; fieldsChanged: string;
};

const healthCopies: Record<string, HealthCopy> = {
  en:{title:'Configuration health',healthy:'Configuration looks healthy',loading:'Checking configuration…',unavailable:'Official rules unavailable',stale:'Cached rules are stale',fresh:'Official rules are current',projectValid:'Project configuration is valid',globalValid:'Global configuration is valid',missing:'Configuration file does not exist yet',invalidToml:'TOML syntax error',managed:'managed fields detected',issues:'issues found',viewProblems:'View problems',refreshRules:'Update official rules',rulesUpdated:'Official rules updated',rulesCached:'Using cached official rules',unknown:'Unknown configuration field',recommendation:'Suggestion: verify against current Codex docs, then remove only if it is obsolete.',remove:'Remove field',removeTitle:'Remove this configuration field?',removeBody:'This edits the selected config.toml. A backup will be created first. Other fields are preserved.',confirmRemove:'Confirm removal',sessionNote:'Session flags are owned by the Codex runtime and are not modified by Studio.',preserved:'Unknown and future fields are preserved during normal Studio writes.',refreshFailed:'Could not refresh; cached rules remain in use.',codexVersion:'Codex CLI',codexMissing:'Codex CLI not detected',ruleChanges:'Official rule changes',noRuleChanges:'No official field changes detected',fieldsAdded:'added',fieldsRemoved:'removed',fieldsChanged:'changed'},
  'zh-CN':{title:'配置健康状态',healthy:'配置状态良好',loading:'正在检查配置…',unavailable:'暂时无法获取官方规则',stale:'正在使用较旧的缓存规则',fresh:'官方规则已是最新',projectValid:'项目配置有效',globalValid:'全局配置有效',missing:'配置文件尚未创建',invalidToml:'TOML 语法错误',managed:'个受管字段已识别',issues:'个问题',viewProblems:'查看问题',refreshRules:'更新官方规则',rulesUpdated:'官方规则已更新',rulesCached:'正在使用官方规则缓存',unknown:'未知配置字段',recommendation:'建议：先核对当前 Codex 官方配置，再确认是否删除。',remove:'删除此字段',removeTitle:'删除这个配置字段？',removeBody:'这会修改对应的 config.toml，并先创建备份；其他字段保持不变。',confirmRemove:'确认删除',sessionNote:'会话参数由 Codex 运行时管理，Studio 不会自动修改。',preserved:'Studio 正常写入时会保留未知字段和未来新增字段。',refreshFailed:'更新失败，继续使用现有缓存规则。',codexVersion:'Codex CLI',codexMissing:'未检测到 Codex CLI',ruleChanges:'官方配置变化',noRuleChanges:'未检测到官方字段变化',fieldsAdded:'新增',fieldsRemoved:'删除',fieldsChanged:'变更'},
  'zh-TW':{title:'設定健康狀態',healthy:'設定狀態良好',loading:'正在檢查設定…',unavailable:'暫時無法取得官方規則',stale:'正在使用較舊的快取規則',fresh:'官方規則已是最新',projectValid:'專案設定有效',globalValid:'全域設定有效',missing:'設定檔尚未建立',invalidToml:'TOML 語法錯誤',managed:'個受管欄位已識別',issues:'個問題',viewProblems:'查看問題',refreshRules:'更新官方規則',rulesUpdated:'官方規則已更新',rulesCached:'正在使用官方規則快取',unknown:'未知設定欄位',recommendation:'建議：先核對目前 Codex 官方設定，再確認是否刪除。',remove:'刪除此欄位',removeTitle:'刪除這個設定欄位？',removeBody:'這會修改對應的 config.toml，並先建立備份；其他欄位保持不變。',confirmRemove:'確認刪除',sessionNote:'工作階段參數由 Codex 執行階段管理，Studio 不會自動修改。',preserved:'Studio 正常寫入時會保留未知欄位與未來新增欄位。',refreshFailed:'更新失敗，繼續使用現有快取規則。',codexVersion:'Codex CLI',codexMissing:'未偵測到 Codex CLI',ruleChanges:'官方設定變化',noRuleChanges:'未偵測到官方欄位變化',fieldsAdded:'新增',fieldsRemoved:'刪除',fieldsChanged:'變更'},
  ja:{title:'設定の健全性',healthy:'設定は正常です',loading:'設定を確認中…',unavailable:'公式ルールを取得できません',stale:'古いキャッシュルールを使用中',fresh:'公式ルールは最新です',projectValid:'プロジェクト設定は有効です',globalValid:'グローバル設定は有効です',missing:'設定ファイルはまだありません',invalidToml:'TOML 構文エラー',managed:'個の管理対象フィールドを検出',issues:'件の問題',viewProblems:'問題を見る',refreshRules:'公式ルールを更新',rulesUpdated:'公式ルールを更新しました',rulesCached:'公式ルールのキャッシュを使用中',unknown:'不明な設定フィールド',recommendation:'推奨：現在の Codex 公式設定を確認してから削除してください。',remove:'フィールドを削除',removeTitle:'この設定フィールドを削除しますか？',removeBody:'対象の config.toml を変更します。先にバックアップを作成し、他のフィールドは保持します。',confirmRemove:'削除を確認',sessionNote:'セッションフラグは Codex ランタイムが管理し、Studio は自動変更しません。',preserved:'通常の Studio 書き込みでは未知・将来のフィールドを保持します。',refreshFailed:'更新に失敗しました。既存キャッシュを使用します。',codexVersion:'Codex CLI',codexMissing:'Codex CLI を検出できません',ruleChanges:'公式設定の変更',noRuleChanges:'公式フィールドの変更はありません',fieldsAdded:'追加',fieldsRemoved:'削除',fieldsChanged:'変更'},
  ko:{title:'설정 상태 검사',healthy:'설정 상태가 정상입니다',loading:'설정을 확인하는 중…',unavailable:'공식 규칙을 가져올 수 없습니다',stale:'오래된 캐시 규칙 사용 중',fresh:'공식 규칙이 최신입니다',projectValid:'프로젝트 설정이 유효합니다',globalValid:'전역 설정이 유효합니다',missing:'설정 파일이 아직 없습니다',invalidToml:'TOML 문법 오류',managed:'개의 관리 필드를 확인함',issues:'개의 문제',viewProblems:'문제 보기',refreshRules:'공식 규칙 업데이트',rulesUpdated:'공식 규칙을 업데이트했습니다',rulesCached:'공식 규칙 캐시 사용 중',unknown:'알 수 없는 설정 필드',recommendation:'권장: 현재 Codex 공식 설정을 확인한 뒤 삭제 여부를 결정하세요.',remove:'필드 삭제',removeTitle:'이 설정 필드를 삭제할까요?',removeBody:'해당 config.toml을 수정하며 먼저 백업을 만듭니다. 다른 필드는 유지됩니다.',confirmRemove:'삭제 확인',sessionNote:'세션 플래그는 Codex 런타임이 관리하며 Studio가 자동 수정하지 않습니다.',preserved:'Studio의 일반 쓰기 작업은 알 수 없는 필드와 향후 추가 필드를 보존합니다.',refreshFailed:'업데이트에 실패했습니다. 기존 캐시를 계속 사용합니다.',codexVersion:'Codex CLI',codexMissing:'Codex CLI를 찾을 수 없음',ruleChanges:'공식 설정 변경',noRuleChanges:'공식 필드 변경 없음',fieldsAdded:'추가',fieldsRemoved:'삭제',fieldsChanged:'변경'}
};
export function healthText(locale: string): HealthCopy { return healthCopies[locale] ?? healthCopies.en; }

type SchemaTrust='authoritative'|'fallback';
type SchemaSource={url:string;trust:SchemaTrust};
type CachedSchema = { schema: unknown; fetchedAt: number; sourceUrl: string; sourceTrust?: SchemaTrust };
const CACHE_KEY='codex-config-studio.official-config-schema.v1';
const PREVIOUS_AUTHORITY_KEY='codex-config-studio.official-config-schema.previous.v1';
const CHANGE_REPORT_KEY='codex-config-studio.official-config-schema.changes.v1';
const FRESH_MS=7*24*60*60*1000;
const WARN_MAX_AGE_MS=30*24*60*60*1000;
// The generated schema committed in openai/codex is derived directly from ConfigToml
// and is the authority for unknown-field diagnostics. The developers site mirror is
// only a fallback because it can temporarily lag the generated schema.
const SCHEMA_SOURCES:readonly SchemaSource[]=[
  {url:'https://raw.githubusercontent.com/openai/codex/main/codex-rs/core/config.schema.json',trust:'authoritative'},
  {url:'https://developers.openai.com/codex/config-schema.json',trust:'fallback'},
];

function isRecord(value: unknown): value is Record<string, unknown> { return !!value&&typeof value==='object'&&!Array.isArray(value); }
function isSchemaDocument(value: unknown): value is Record<string, unknown> { return isRecord(value)&&isRecord(value.properties)&&isRecord(value.definitions); }
function trustForUrl(url:string):SchemaTrust {
  return url.includes('raw.githubusercontent.com/openai/codex/')?'authoritative':'fallback';
}
function readCache(): CachedSchema|null {
  try{
    const raw=localStorage.getItem(CACHE_KEY);
    if(!raw)return null;
    const parsed=JSON.parse(raw) as CachedSchema;
    if(!parsed||typeof parsed.fetchedAt!=='number'||typeof parsed.sourceUrl!=='string'||!isSchemaDocument(parsed.schema))return null;
    return {...parsed,sourceTrust:parsed.sourceTrust??trustForUrl(parsed.sourceUrl)};
  }catch{return null;}
}
function writeCache(value:CachedSchema):void { try{localStorage.setItem(CACHE_KEY,JSON.stringify(value));}catch{/* optional */} }
function readStoredSchema(key:string):CachedSchema|null {
  try{const raw=localStorage.getItem(key);if(!raw)return null;const parsed=JSON.parse(raw) as CachedSchema;return parsed&&typeof parsed.fetchedAt==='number'&&typeof parsed.sourceUrl==='string'&&isSchemaDocument(parsed.schema)?parsed:null;}catch{return null;}
}
function schemaFingerprint(value:unknown):string {
  if(Array.isArray(value))return '['+value.map(schemaFingerprint).join(',')+']';
  if(!isRecord(value))return JSON.stringify(value)??String(value);
  return '{'+Object.keys(value).sort().filter(key=>!['description','markdownDescription','title','$schema'].includes(key)).map(key=>JSON.stringify(key)+':'+schemaFingerprint(value[key])).join(',')+'}';
}
function collectDeclaredFields(root:Record<string,unknown>):Map<string,string> {
  const output=new Map<string,string>(),seen=new Set<unknown>();
  const visit=(node:unknown,prefix:string)=>{
    const resolved=dereference(root,node);
    if(!isRecord(resolved)||seen.has(resolved))return;
    seen.add(resolved);
    const properties=isRecord(resolved.properties)?resolved.properties:null;
    if(properties)for(const [key,child] of Object.entries(properties)){
      const path=prefix?prefix+'.'+key:key;
      output.set(path,schemaFingerprint(dereference(root,child)));
      visit(child,path);
    }
    seen.delete(resolved);
  };
  visit(root,'');
  return output;
}
export function compareSchemas(previous:unknown,current:unknown):SchemaChange[] {
  if(!isSchemaDocument(previous)||!isSchemaDocument(current))return [];
  const before=collectDeclaredFields(previous),after=collectDeclaredFields(current),changes:SchemaChange[]=[];
  for(const [path,fingerprint] of after){
    if(!before.has(path))changes.push({kind:'added',path});
    else if(before.get(path)!==fingerprint)changes.push({kind:'changed',path});
  }
  for(const path of before.keys())if(!after.has(path))changes.push({kind:'removed',path});
  return changes.sort((a,b)=>a.path.localeCompare(b.path)||a.kind.localeCompare(b.kind));
}
function storeAuthoritativeChanges(next:CachedSchema):void {
  try{
    const previous=readCache();
    const baseline=previous?.sourceTrust==='authoritative'?previous:readStoredSchema(PREVIOUS_AUTHORITY_KEY);
    if(baseline&&baseline.fetchedAt!==next.fetchedAt){
      const report:SchemaChangeReport={fromFetchedAt:baseline.fetchedAt,toFetchedAt:next.fetchedAt,changes:compareSchemas(baseline.schema,next.schema)};
      localStorage.setItem(CHANGE_REPORT_KEY,JSON.stringify(report));
      localStorage.setItem(PREVIOUS_AUTHORITY_KEY,JSON.stringify(baseline));
    }
  }catch{/* optional telemetry cache */}
}
export function readSchemaChangeReport():SchemaChangeReport|null {
  try{const raw=localStorage.getItem(CHANGE_REPORT_KEY);if(!raw)return null;const parsed=JSON.parse(raw) as SchemaChangeReport;return parsed&&typeof parsed.toFetchedAt==='number'&&Array.isArray(parsed.changes)?parsed:null;}catch{return null;}
}
function cacheCanWarnUnknown(cached:CachedSchema,age:number):boolean {
  return (cached.sourceTrust??trustForUrl(cached.sourceUrl))==='authoritative'&&age<=WARN_MAX_AGE_MS;
}
async function fetchJson(url:string):Promise<unknown>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
  try{const response=await fetch(url,{cache:'no-store',signal:controller.signal,redirect:'follow'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const text=await response.text();if(text.length>2_000_000)throw new Error('schema too large');return JSON.parse(text);}finally{clearTimeout(timer);}
}
export async function loadOfficialSchema(force=false):Promise<{schema:unknown|null;state:SchemaState}>{
  const cached=readCache(),age=cached?Date.now()-cached.fetchedAt:Number.POSITIVE_INFINITY;
  if(!force&&cached&&age<=FRESH_MS){
    const sourceTrust=cached.sourceTrust??trustForUrl(cached.sourceUrl);
    return{schema:cached.schema,state:{status:'fresh',sourceUrl:cached.sourceUrl,sourceTrust,fetchedAt:cached.fetchedAt,error:null,canWarnUnknown:cacheCanWarnUnknown(cached,age)}};
  }
  let lastError='';
  for(const source of SCHEMA_SOURCES){
    try{
      const schema=await fetchJson(source.url);
      if(!isSchemaDocument(schema))throw new Error('invalid schema document');
      const fetchedAt=Date.now();
      const next={schema,fetchedAt,sourceUrl:source.url,sourceTrust:source.trust} satisfies CachedSchema;
      if(source.trust==='authoritative')storeAuthoritativeChanges(next);
      writeCache(next);
      return{schema,state:{status:'fresh',sourceUrl:source.url,sourceTrust:source.trust,fetchedAt,error:null,canWarnUnknown:source.trust==='authoritative'}};
    }catch(error){lastError=String(error);}
  }
  if(cached){
    const cachedAge=Date.now()-cached.fetchedAt;
    const sourceTrust=cached.sourceTrust??trustForUrl(cached.sourceUrl);
    return{schema:cached.schema,state:{status:'stale',sourceUrl:cached.sourceUrl,sourceTrust,fetchedAt:cached.fetchedAt,error:lastError||'refresh failed',canWarnUnknown:cacheCanWarnUnknown(cached,cachedAge)}};
  }
  return{schema:null,state:{status:'unavailable',sourceUrl:null,sourceTrust:null,fetchedAt:null,error:lastError||'schema unavailable',canWarnUnknown:false}};
}

function decodePointer(value:string):string{return value.replace(/~1/g,'/').replace(/~0/g,'~');}
function dereference(root:Record<string,unknown>,node:unknown,seen=new Set<string>()):unknown{
  let current=node;
  while(isRecord(current)&&typeof current.$ref==='string'&&current.$ref.startsWith('#/')){const ref=current.$ref;if(seen.has(ref))return current;seen.add(ref);let next:unknown=root;for(const raw of ref.slice(2).split('/')){if(!isRecord(next))return current;next=next[decodePointer(raw)];}current=next;}
  return current;
}
type ChildResolution={allowed:boolean;open:boolean;nodes:unknown[]};
function resolveChild(root:Record<string,unknown>,node:unknown,key:string):ChildResolution{
  const resolved=dereference(root,node);if(!isRecord(resolved))return{allowed:true,open:true,nodes:[]};
  if(resolved.type==='array'&&resolved.items!==undefined)return resolveChild(root,resolved.items,key);
  for(const union of ['allOf','anyOf','oneOf'] as const){const variants=resolved[union];if(Array.isArray(variants)){const results=variants.map(item=>resolveChild(root,item,key)).filter(item=>item.allowed);if(results.length)return{allowed:true,open:results.some(item=>item.open),nodes:results.flatMap(item=>item.nodes)};if(union!=='allOf')return{allowed:false,open:false,nodes:[]};}}
  const properties=isRecord(resolved.properties)?resolved.properties:null;if(properties&&Object.prototype.hasOwnProperty.call(properties,key))return{allowed:true,open:false,nodes:[properties[key]]};
  const patterns=isRecord(resolved.patternProperties)?resolved.patternProperties:null;if(patterns){const matches:unknown[]=[];for(const [pattern,child] of Object.entries(patterns)){try{if(new RegExp(pattern).test(key))matches.push(child);}catch{/* malformed schema regex */}}if(matches.length)return{allowed:true,open:false,nodes:matches};}
  if(resolved.additionalProperties===false)return{allowed:false,open:false,nodes:[]};
  if(isRecord(resolved.additionalProperties))return{allowed:true,open:false,nodes:[resolved.additionalProperties]};
  return{allowed:true,open:true,nodes:[]};
}
export function schemaAllowsPath(schema:unknown,keyPath:string[]):boolean{
  if(!isSchemaDocument(schema))return true;let states:unknown[]=[schema];
  for(const key of keyPath){const next:unknown[]=[];let open=false,allowed=false;for(const state of states){const result=resolveChild(schema,state,key);if(!result.allowed)continue;allowed=true;if(result.open)open=true;next.push(...result.nodes);}if(!allowed)return false;if(open&&next.length===0)return true;states=next.length?next:states;}
  return true;
}
