import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { getLocale, localeOptions, setLocale, t, type Locale } from './i18n';
import {
  commonTaskModels,
  loadActiveTaskMode,
  loadTaskPreferences,
  reasoningLevels,
  resetTaskPreference,
  saveActiveTaskMode,
  saveTaskPreference,
  taskModeIds,
  type TaskModeId,
  type TaskPreference,
} from './task-modes';
import { createPreviewRows, renderPreviewRows } from './config-preview';
import { previewText } from './i18n/preview';
import './styles.css';
import './config-preview.css';
import { historyText, filterHistoryEntries, renderHistoryEntries } from './history-tab';
import './history-tab.css';
import { renderModelPicker, bindModelPickers, validateModelPickers } from './model-picker';
import './model-picker.css';
import { CURRENT_PRESET_VERSION, presetVersion, presetByReference, matchPresetVersion, presetSource, parsePresetSource, type PresetReference } from './preset-versions';
import { renderPresetWorkspace, presetReferenceLabel } from './preset-version-view';
import { presetVersionText } from './i18n/preset-versions';
import './preset-versions.css';
import { renderShell } from './ui/shell';
import { workspaceText } from './i18n/workspace';
import { advancedLayout } from './ui/advanced-layout';
import { icon } from './ui/icons';
import { bindTabs, bindModalKeyboard, setModalActive, closePopovers } from './ui/interactions';
import { inspectHealth, type ConfigHealthState, type HealthIssue } from './config-health';
import { healthText } from './config-schema';
import {
  integrityScopeKey,
  integrityText,
  loadIntegrityLock,
  removeIntegrityLock,
  resolveIntegrityTarget,
  sameIntegrityTarget,
  saveIntegrityLock,
  type IntegrityTarget,
} from './model-integrity';
import { periodSinceDay, periodSinceMs, type UsagePeriod, type UsageReport } from './usage-dashboard';
import { renderUsageView } from './usage-view';
import { recentProjectsFromHistory, type ProjectsUsageOverviewReport, type RecentProject } from './project-overview';
import { renderProjectOverviewView } from './project-overview-view';
import { checkStableUpdate, installSignedUpdate, openStableReleasePage, signedUpdaterEnabled, updateText, type UpdateState } from './update-checker';

type ScopeKind = 'global' | 'project';
type WorkspaceTab = 'overview' | 'presets' | 'task' | 'advanced' | 'usage' | 'history';
type ThemeMode = 'system' | 'dark' | 'light';
type Accent = 'violet' | 'blue' | 'emerald' | 'amber' | 'rose';
type ManagedConfig = {
  model: string | null;
  modelReasoningEffort: string | null;
  planModeReasoningEffort: string | null;
  agentsEnabled: boolean | null;
  defaultSubagentModel: string | null;
  defaultSubagentReasoningEffort: string | null;
  maxConcurrentThreadsPerSession: number | null;
};
type ConfigSnapshot = { path: string; exists: boolean; values: ManagedConfig; originalBackupExists: boolean };
type Preset = { id: string; values: ManagedConfig };
type Field = keyof ManagedConfig;
type HistoryEntry = {
  id: string;
  timestampMs: number;
  action: string;
  source: string | null;
  scopeKind: ScopeKind;
  projectPath: string | null;
  configPath: string;
  values: ManagedConfig;
};
type HistoryRestoreResult = { scope: { kind: ScopeKind; projectPath: string | null }; snapshot: ConfigSnapshot };
type ConfirmSpec = {
  title: string;
  message: string;
  detail?: string;
  confirmText: string;
  danger?: boolean;
  readOnly?: boolean;
  changes?: Array<{ label: string; from: string; to: string }>;
};

type StatusKey = 'status.unread' | 'status.selectProject' | 'status.reading' | 'status.read' | 'status.missing' | 'status.readFailed';

const fields: Field[] = ['model','modelReasoningEffort','planModeReasoningEffort','agentsEnabled','defaultSubagentModel','defaultSubagentReasoningEffort','maxConcurrentThreadsPerSession'];
const efforts = ['low','medium','high','xhigh','ultra','persistent','max'];
const presets: Preset[] = [
  { id:'token-save', values:{model:'gpt-6-luna',modelReasoningEffort:'low',planModeReasoningEffort:'medium',agentsEnabled:false,defaultSubagentModel:null,defaultSubagentReasoningEffort:null,maxConcurrentThreadsPerSession:null}},
  { id:'economy', values:{model:'gpt-6-luna',modelReasoningEffort:'medium',planModeReasoningEffort:'high',agentsEnabled:false,defaultSubagentModel:null,defaultSubagentReasoningEffort:null,maxConcurrentThreadsPerSession:null}},
  { id:'daily', values:{model:'gpt-6-luna',modelReasoningEffort:'medium',planModeReasoningEffort:'high',agentsEnabled:true,defaultSubagentModel:'gpt-6-luna',defaultSubagentReasoningEffort:'medium',maxConcurrentThreadsPerSession:2}},
  { id:'balanced', values:{model:'gpt-6-sol',modelReasoningEffort:'medium',planModeReasoningEffort:'high',agentsEnabled:true,defaultSubagentModel:'gpt-6-luna',defaultSubagentReasoningEffort:'medium',maxConcurrentThreadsPerSession:2}},
  { id:'astra', values:{model:'gpt-6-astra',modelReasoningEffort:'medium',planModeReasoningEffort:'high',agentsEnabled:true,defaultSubagentModel:'gpt-6-luna',defaultSubagentReasoningEffort:'medium',maxConcurrentThreadsPerSession:2}},
  { id:'max', values:{model:'gpt-6-astra',modelReasoningEffort:'xhigh',planModeReasoningEffort:'xhigh',agentsEnabled:true,defaultSubagentModel:'gpt-6-luna',defaultSubagentReasoningEffort:'high',maxConcurrentThreadsPerSession:3}},
];

let scope: ScopeKind = 'global';
let projectPath = '';
let activeTab: WorkspaceTab = 'presets';
let activePreset = 'daily';
let activePresetVersion = CURRENT_PRESET_VERSION;
let viewedPresetVersion = CURRENT_PRESET_VERSION;
let draftPresetSource: PresetReference | null = null;
let values = structuredClone(presets[2].values);
let lastSnapshot: ConfigSnapshot | null = null;
let globalSnapshot: ConfigSnapshot | null = null;
let globalIntegrityLoading = false;
let currentStatus: { key: StatusKey; ok: boolean } = { key: 'status.unread', ok: false };
let activeTaskMode: TaskModeId = loadActiveTaskMode();
let taskPreferences = loadTaskPreferences();
let historyEntries: HistoryEntry[] = [];
let historySearch = '';
let historyView: 'projects' | 'presets' = 'projects';
let usagePeriod: UsagePeriod = '30d';
let usageReport: UsageReport | null = null;
let usageLoading = false;
let usageLoadError = '';
let usageRequestId = 0;
let overviewRecent: RecentProject[] = [];
let overviewReport: ProjectsUsageOverviewReport | null = null;
let overviewLoading = false;
let overviewLoadError = '';
let overviewRequestId = 0;
let configReadId = 0;
let historyLoading = false;
let historyLoadError = false;
let historyReadId = 0;
let busy = false;
let configHealthState: ConfigHealthState | null = null;
let configHealthLoading = false;
let configHealthRequestId = 0;
let updateState: UpdateState = {status:'idle'};
let updateRequestId = 0;
let signedUpdaterReady = false;
let confirmResolver: ((value: boolean) => void) | null = null;
let themeMode = (safeGet('codex-config-studio.theme.mode') as ThemeMode | null) ?? 'system';
let accent = (safeGet('codex-config-studio.theme.accent') as Accent | null) ?? 'violet';

const app = document.querySelector<HTMLDivElement>('#app')!;
const $ = <T extends Element>(s:string) => document.querySelector<T>(s)!;
const esc = (v:string) => v.replace(/[&<>"']/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!));
const clone = <T>(value:T):T => structuredClone(value);

function safeGet(key:string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function safeSet(key:string,value:string): void { try { localStorage.setItem(key,value); } catch { /* no-op */ } }
function applyTheme(): void {
  const resolved = themeMode === 'system' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : themeMode;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.accent = accent;
}
function presetText(id:string,part:'name'|'badge'|'description'|'usage'):string { return t(`preset.${id}.${part}` as Parameters<typeof t>[0]); }
function taskText(id:TaskModeId,part:'name'|'description'):string { return t(`task.${id}.${part}` as Parameters<typeof t>[0]); }
function fieldLabel(field:Field):string {
  const map:Record<Field,string> = {
    model:t('field.model'),modelReasoningEffort:t('field.reasoning'),planModeReasoningEffort:t('field.planReasoning'),agentsEnabled:t('field.agents'),defaultSubagentModel:t('field.subagentModel'),defaultSubagentReasoningEffort:t('field.subagentReasoning'),maxConcurrentThreadsPerSession:t('field.maxConcurrent')
  };
  return map[field];
}
function displayValue(field:Field,value:ManagedConfig[Field]):string {
  if(value===null) return scope==='project'?t('preview.inherit'):'—';
  if(field==='agentsEnabled') return value?t('option.enabled'):t('option.disabled');
  return String(value);
}
function normalizeSource(source:string):string {
  const reference = parsePresetSource(source, presets);
  if (reference) return presetReferenceLabel(reference, getLocale(), presetText);
  const map:Record<string,string> = {manual:t('history.source.manual'),task:t('history.source.task'),clear:t('history.source.clear'),restore_original:t('history.source.restoreOriginal'),history_restore:t('history.source.historyRestore')};
  return map[source] ?? source;
}
function projectName(path:string|null):string {
  if(!path) return t('scope.globalConfig');
  const clean=path.replace(/[\\/]+$/,'');
  return clean.split(/[\\/]/).filter(Boolean).pop() || path;
}
function formatTime(ms:number):string { try { return new Intl.DateTimeFormat(getLocale(),{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(ms)); } catch { return new Date(ms).toLocaleString(); } }
function sameValue(a:unknown,b:unknown):boolean { return a===b; }
function getChanges():Array<{field:Field;from:string;to:string}> {
  if(!lastSnapshot) return [];
  return fields.filter(f=>!sameValue(lastSnapshot!.values[f],values[f])).map(field=>({field,from:displayValue(field,lastSnapshot!.values[field]),to:displayValue(field,values[field])}));
}
function hasScope():boolean { return scope==='global' || !!projectPath; }
function requestScope(){ return {kind:scope,projectPath:scope==='project'?(projectPath||null):null}; }
function projectConfigDisplayPath():string {
  if(!projectPath) return t('scope.selectProject');
  const clean=projectPath.replace(/[\\/]+$/,'');
  const sep=clean.includes('\\')?'\\':'/';
  return `${clean}${sep}.codex${sep}config.toml`;
}

async function safeInvoke<T>(command:string,args:Record<string,unknown>,timeoutMs=12000):Promise<T> {
  const writing=['apply_config','clear_managed_config','restore_original','restore_history_entry'].includes(command);
  let timer:ReturnType<typeof setTimeout>;
  if(writing){
    timer=setTimeout(()=>toast(workspaceText(getLocale()).waiting),timeoutMs);
    try{return await invoke<T>(command,args);}finally{clearTimeout(timer);}
  }
  const timeout=new Promise<T>((_,reject)=>{timer=setTimeout(()=>reject(new Error(t('error.operationTimeout'))),timeoutMs);});
  try{return await Promise.race([invoke<T>(command,args),timeout]);}finally{clearTimeout(timer!);}
}
function setBusy(next:boolean):void {
  busy=next;
  document.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLButtonElement>('[data-tab], .scope-tab, #projectPath, #chooseProject, #reloadBtn, #languageSelect').forEach(node=>node.disabled=next);
  const editor=document.querySelector<HTMLElement>('#leftContent');if(editor)editor.inert=next;
  document.querySelectorAll<HTMLButtonElement>('[data-write-action]').forEach(btn=>btn.disabled=next);
  const indicator=document.querySelector<HTMLElement>('#busyIndicator');
  if(indicator){indicator.classList.toggle('hidden',!next);indicator.textContent=next?t('status.applying'):'';}
  renderChanges();renderHistory();
}
function toast(text:string,error=false):void {
  const e=$<HTMLDivElement>('#toast');
  const result=document.querySelector<HTMLElement>('#applyResult');
  if(result&&(error||[t('toast.applied'),t('toast.restored'),t('toast.cleared'),t('toast.historyRestored')].includes(text))){result.textContent=text;result.className=`apply-result ${error?'error':''}`;}
  e.textContent=text;e.className=`toast show ${error?'error':''}`;
  setTimeout(()=>{ if(e.textContent===text)e.className='toast'; },2800);
}
function setStatus(key:StatusKey,ok=true):void { currentStatus={key,ok}; renderStatus(); }
function renderUpdateStatus():void {
  const button=document.querySelector<HTMLButtonElement>('#updateCheckBtn');if(!button)return;
  const copy=updateText(getLocale());
  const label=button.querySelector('span');
  button.classList.remove('available','ok','error');
  button.disabled=updateState.status==='checking';
  if(updateState.status==='checking'){if(label)label.textContent=copy.checking;return;}
  if(updateState.status==='available'){
    button.classList.add('available');
    if(label)label.textContent=`${copy.available} · v${updateState.latestVersion}`;
    button.title=`${copy.currentVersion}: ${updateState.currentVersion} · ${copy.latestVersion}: ${updateState.latestVersion}`;
    return;
  }
  if(updateState.status==='current'){button.classList.add('ok');if(label)label.textContent=copy.current;button.title=`v${updateState.currentVersion}`;return;}
  if(updateState.status==='error'){button.classList.add('error');if(label)label.textContent=copy.check;button.title=`${copy.failed}: ${updateState.message}`;return;}
  if(label)label.textContent=copy.check;button.title='';
}
async function runUpdateCheck(silent=false):Promise<void> {
  if(updateState.status==='checking')return;
  const request=++updateRequestId;
  updateState={status:'checking'};renderUpdateStatus();
  const next=await checkStableUpdate();
  if(request!==updateRequestId)return;
  updateState=next;renderUpdateStatus();
  if(next.status==='available'&&!silent){
    const copy=updateText(getLocale());
    const proceed=await askConfirm({
      title:copy.available,
      message:`${copy.currentVersion}: ${next.currentVersion}\n${copy.latestVersion}: ${next.latestVersion}`,
      detail:next.notes||undefined,
      confirmText:signedUpdaterReady?copy.install:copy.openRelease,
      readOnly:true,
    });
    if(proceed){
      if(signedUpdaterReady){
        toast(copy.installing);
        try{await installSignedUpdate();}
        catch(error){
          toast(String(error),true);
          try{await openStableReleasePage();}catch(openError){console.warn('open stable release fallback',openError);}
        }
      }else{
        try{await openStableReleasePage();}catch(error){toast(String(error),true);}
      }
    }
  }else if(next.status==='current'&&!silent)toast(updateText(getLocale()).current);
  else if(next.status==='error'&&!silent)toast(`${updateText(getLocale()).failed}: ${next.message}`,true);
}

function renderStatus():void {
  const e=document.querySelector<HTMLElement>('#saveState');if(!e)return;
  const dirty=getChanges().length>0,copy=workspaceText(getLocale());
  const text=busy?t('status.applying'):currentStatus.key==='status.read'&&dirty?copy.dirty:t(currentStatus.key);
  e.className=`status-pill ${dirty?'dirty':currentStatus.ok?'ok':'warn'}`;
  e.innerHTML=`<i></i>${esc(text)}`;
}

function renderApp():void {
  app.innerHTML=renderShell({projectPath,accent});
  bindStaticEvents();
  renderWorkspace();
  renderRightRail();
  renderStatus();
  renderUpdateStatus();
  applyTheme();
}

function renderWorkspace():void {
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(btn=>{
    const selected=btn.dataset.tab===activeTab;
    btn.classList.toggle('active',selected);btn.setAttribute('aria-selected',String(selected));btn.tabIndex=selected?0:-1;
  });
  document.querySelector('#leftContent')?.setAttribute('aria-labelledby',`tab-${activeTab}`);
  const host=$<HTMLElement>('#leftContent');
  if(activeTab==='overview') renderOverviewPage(host);
  else if(activeTab==='presets') renderPresets(host);
  else if(activeTab==='task') renderTask(host);
  else if(activeTab==='usage') renderUsagePage(host);
  else if(activeTab==='history') renderHistoryPage(host);
  else renderAdvanced(host);
}
function renderOverviewPage(host:HTMLElement):void {
  renderProjectOverviewView(host,{
    locale:getLocale(),
    recent:overviewRecent,
    report:overviewReport,
    loading:overviewLoading,
    error:overviewLoadError,
    onRefresh:()=>{void loadProjectOverview();},
    onOpenProject:path=>{void openOverviewProject(path);},
  });
}
async function openOverviewProject(path:string):Promise<void> {
  if(busy||confirmResolver)return;
  await changeScope('project',path);
  if(scope!=='project'||projectPath!==path)return;
  activeTab='usage';renderWorkspace();void loadProjectUsage();
}
async function loadProjectOverview():Promise<void> {
  if(activeTab!=='overview'||overviewLoading||busy)return;
  const request=++overviewRequestId;
  overviewLoading=true;overviewLoadError='';renderWorkspace();
  try{
    const entries=await safeInvoke<HistoryEntry[]>('list_history',{limit:300},6000);
    if(request!==overviewRequestId)return;
    historyEntries=entries;
    overviewRecent=recentProjectsFromHistory(entries,12);
    if(overviewRecent.length===0){overviewReport=null;return;}
    const report=await safeInvoke<ProjectsUsageOverviewReport>('get_projects_usage_overview',{
      projectPaths:overviewRecent.map(project=>project.path),
      sinceMs:periodSinceMs('7d'),
      sinceDay:periodSinceDay('7d'),
      maxFiles:8000,
    },30000);
    if(request!==overviewRequestId)return;
    overviewReport=report;
  }catch(error){
    if(request!==overviewRequestId)return;
    overviewReport=null;overviewLoadError=String(error);
  }finally{
    if(request===overviewRequestId){overviewLoading=false;renderWorkspace();}
  }
}

function renderPresets(host:HTMLElement):void {
  renderPresetWorkspace(host, {
    current: presets, viewedVersion: viewedPresetVersion, selectedVersion: activePresetVersion,
    selectedPreset: activePreset, locale: getLocale(), busy,
    heading: { eyebrow: t('section.preset.eyebrow'), title: t('section.preset.title'), hint: t('section.preset.hint') },
    text: presetText,
    onVersion: id => { if(!busy && !confirmResolver){viewedPresetVersion=id;renderWorkspace();} },
    onChoose: reference => { void choosePreset(reference); },
  });
}
async function choosePreset(reference:PresetReference):Promise<void> {
  if(busy || confirmResolver)return;
  const preset=presetByReference(presets,reference);
  const version=presetVersion(reference.versionId);
  if(!preset || !version)return;
  const before=values;
  const destination=JSON.stringify(requestScope());
  if(version.archived){
    const copy=presetVersionText(getLocale());
    const detail=[presetReferenceLabel(reference,getLocale(),presetText),version.date,
      ...fields.map(field=>fieldLabel(field)+': '+displayValue(field,preset.values[field]))].join('\n');
    const accepted=await askConfirm({title:copy.confirmTitle,message:copy.warning+'\n\n'+copy.previewOnly,detail,confirmText:copy.loadPreview});
    if(!accepted || busy)return;
    if(values!==before || destination!==JSON.stringify(requestScope())){toast(copy.changedScope,true);return;}
  }
  activePreset=preset.id;activePresetVersion=version.id;viewedPresetVersion=version.id;
  draftPresetSource={...reference};values=clone(preset.values);
  renderWorkspace();renderRightRail();
  if(version.archived)toast(presetVersionText(getLocale()).loaded);
}
function renderPresetOrigin():void {
  const element=document.querySelector<HTMLElement>('#presetOrigin');if(!element)return;
  element.classList.toggle('hidden',!draftPresetSource);
  const archived=draftPresetSource!==null && presetVersion(draftPresetSource.versionId)?.archived===true;
  element.classList.toggle('archived',archived);
  element.textContent=draftPresetSource?presetReferenceLabel(draftPresetSource,getLocale(),presetText)+(archived?'\n'+presetVersionText(getLocale()).warning:''):'';
}
function resetSelectedPreset():void {
  const reference=draftPresetSource ?? {versionId:activePresetVersion,presetId:activePreset||'daily'};
  void choosePreset(reference);
}
function renderTask(host:HTMLElement):void {
  const pref=taskPreferences[activeTaskMode];
  const isCommon=commonTaskModels.includes(pref.model as (typeof commonTaskModels)[number]);
  host.innerHTML=`<section class="card pane-card"><div class="section-heading"><div><span class="eyebrow">${t('section.task.eyebrow')}</span><h2>${t('section.task.title')}</h2><p>${t('section.task.hint')}</p></div></div><div class="task-grid">${taskModeIds.map(id=>{const p=taskPreferences[id];return `<button class="task-card ${activeTaskMode===id?'selected':''}" data-task-mode="${id}"><strong>${taskText(id,'name')}</strong><p>${taskText(id,'description')}</p><small>${esc(p.model)} · ${esc(p.reasoning)}</small></button>`;}).join('')}</div><div class="task-editor"><label><span>${t('task.model')}</span><select id="taskModel">${commonTaskModels.map(m=>`<option value="${m}" ${pref.model===m?'selected':''}>${m}</option>`).join('')}<option value="__custom__" ${!isCommon?'selected':''}>${t('task.customModel')}</option></select></label><label id="customModelWrap" class="${isCommon?'hidden':''}"><span>${t('task.customModel')}</span><input id="taskCustomModel" value="${isCommon?'':esc(pref.model)}" placeholder="${t('task.customPlaceholder')}"></label><label><span>${t('task.reasoning')}</span>${selectHtml('taskReasoning',pref.reasoning,reasoningLevels)}</label></div><div class="inline-actions"><button id="useTask" class="button primary">${t('task.useAsPending')}</button><button id="resetTask" class="button secondary">${t('task.reset')}</button></div><div class="tip-box"><strong>${t('task.tipTitle')}</strong><span>${t('task.remember')}</span><span>${t('task.modelSupport')}</span><span>${t('task.note')}</span></div></section>`;
  host.querySelectorAll<HTMLButtonElement>('[data-task-mode]').forEach(btn=>btn.onclick=()=>{activeTaskMode=btn.dataset.taskMode as TaskModeId;saveActiveTaskMode(activeTaskMode);renderTask(host);});
  $<HTMLSelectElement>('#taskModel').onchange=()=>{const v=$<HTMLSelectElement>('#taskModel').value;$<HTMLElement>('#customModelWrap').classList.toggle('hidden',v!=='__custom__');};
  $('#useTask').addEventListener('click',()=>{const modelSel=$<HTMLSelectElement>('#taskModel').value;const custom=$<HTMLInputElement>('#taskCustomModel')?.value.trim()??'';const model=modelSel==='__custom__'?custom:modelSel;const reasoning=$<HTMLSelectElement>('#taskReasoning').value;if(!model){toast(t('toast.taskModelRequired'),true);return;}const next:TaskPreference={model,reasoning};taskPreferences[activeTaskMode]=next;saveTaskPreference(activeTaskMode,next);draftPresetSource=null;values.model=model;values.modelReasoningEffort=reasoning;activePreset='';renderTask(host);renderRightRail();toast(t('toast.taskPrepared',{name:taskText(activeTaskMode,'name')}));});
  $('#resetTask').addEventListener('click',()=>{taskPreferences[activeTaskMode]=resetTaskPreference(activeTaskMode);renderTask(host);toast(t('toast.taskReset',{name:taskText(activeTaskMode,'name')}));});
}
function renderUsagePage(host:HTMLElement):void {
  renderUsageView(host,{
    locale:getLocale(),
    scope,
    projectPath,
    period:usagePeriod,
    report:usageReport,
    loading:usageLoading,
    error:usageLoadError,
    onPeriod:period=>{usagePeriod=period;usageReport=null;void loadProjectUsage();},
    onRefresh:()=>{void loadProjectUsage();},
  });
}
async function loadProjectUsage():Promise<void> {
  if(activeTab!=='usage')return;
  const request=++usageRequestId;
  usageLoadError='';
  if(scope!=='project'||!projectPath){usageReport=null;usageLoading=false;renderWorkspace();return;}
  usageLoading=true;renderWorkspace();
  try{
    const report=await safeInvoke<UsageReport>('get_project_usage',{projectPath,sinceMs:periodSinceMs(usagePeriod),sinceDay:periodSinceDay(usagePeriod),maxFiles:8000},30000);
    if(request!==usageRequestId)return;
    usageReport=report;
  }catch(error){
    if(request!==usageRequestId)return;
    usageReport=null;usageLoadError=String(error);
  }finally{
    if(request===usageRequestId){usageLoading=false;renderWorkspace();}
  }
}

function renderAdvanced(host:HTMLElement):void {
  host.innerHTML=`<section class="card pane-card"><div class="section-heading"><div><span class="eyebrow">${t('section.custom.eyebrow')}</span><h2>${t('section.custom.title')}</h2><p>${t('advanced.help')}</p></div><button id="resetPresetBtn" class="text-button">${t('action.resetPreset')}</button></div>${advancedLayout(`${advancedField('model',t('field.model'),t('field.model.help'),renderModelPicker('model',values.model,commonTaskModels,t('field.model'),{inherit:t('option.inherit'),custom:t('task.customModel'),placeholder:t('task.customPlaceholder'),required:t('toast.taskModelRequired')}))}${advancedField('modelReasoningEffort',t('field.reasoning'),t('field.reasoning.help'),selectHtml('modelReasoningEffort',values.modelReasoningEffort,efforts,true))}${advancedField('planModeReasoningEffort',t('field.planReasoning'),t('field.planReasoning.help'),selectHtml('planModeReasoningEffort',values.planModeReasoningEffort,efforts,true))}`,`${advancedField('agentsEnabled',t('field.agents'),t('field.agents.help'),`<select id="agentsEnabled"><option value="">${t('option.inherit')}</option><option value="true" ${values.agentsEnabled===true?'selected':''}>${t('option.enabled')}</option><option value="false" ${values.agentsEnabled===false?'selected':''}>${t('option.disabled')}</option></select>`)}${advancedField('defaultSubagentModel',t('field.subagentModel'),t('field.subagentModel.help'),renderModelPicker('defaultSubagentModel',values.defaultSubagentModel,commonTaskModels,t('field.subagentModel'),{inherit:t('option.inherit'),custom:t('task.customModel'),placeholder:t('task.customPlaceholder'),required:t('toast.taskModelRequired')}))}${advancedField('defaultSubagentReasoningEffort',t('field.subagentReasoning'),t('field.subagentReasoning.help'),selectHtml('defaultSubagentReasoningEffort',values.defaultSubagentReasoningEffort,efforts,true))}${advancedField('maxConcurrentThreadsPerSession',t('field.maxConcurrent'),t('field.maxConcurrent.help'),`<input id="maxConcurrentThreadsPerSession" type="number" min="1" max="16" value="${values.maxConcurrentThreadsPerSession??''}" placeholder="${t('option.inherit')}">`)}`,workspaceText(getLocale()))}</section>`;
  bindModelPickers(host);
  fields.forEach(field=>{const el=document.querySelector<HTMLInputElement|HTMLSelectElement>(`#${field}`);if(el)el.addEventListener('input',()=>{readAdvanced();activePreset='';renderRightRail();});});
  $('#resetPresetBtn').addEventListener('click',resetSelectedPreset);
}
function advancedField(id:Field,title:string,help:string,control:string):string { const target=(id==='model'||id==='defaultSubagentModel')?`${id}Select`:id; return `<div class="field"><div><label class="field-label" for="${target}"><strong>${title}</strong></label><small>${help}</small></div><div>${control}</div></div>`; }
function selectHtml(id:string,value:string|null,options:readonly string[],inherit=false):string {
  const all=value && !options.includes(value)?[value,...options]:options;
  return `<select id="${id}">${inherit?`<option value="" ${value===null?'selected':''}>${t('option.inherit')}</option>`:''}${all.map(o=>`<option value="${esc(o)}" ${value===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
}
function readAdvanced():void {
  const v=(id:Field)=>document.querySelector<HTMLInputElement|HTMLSelectElement>(`#${id}`)?.value??'';
  values={model:v('model').trim()||null,modelReasoningEffort:v('modelReasoningEffort')||null,planModeReasoningEffort:v('planModeReasoningEffort')||null,agentsEnabled:v('agentsEnabled')===''?null:v('agentsEnabled')==='true',defaultSubagentModel:v('defaultSubagentModel').trim()||null,defaultSubagentReasoningEffort:v('defaultSubagentReasoningEffort')||null,maxConcurrentThreadsPerSession:v('maxConcurrentThreadsPerSession')===''?null:Number(v('maxConcurrentThreadsPerSession'))};
}

function renderRightRail():void {
  document.querySelectorAll<HTMLButtonElement>('.scope-tab').forEach(btn=>btn.classList.toggle('active',btn.dataset.scope===scope));
  const picker=document.querySelector<HTMLElement>('#projectPicker'); if(picker)picker.classList.toggle('hidden',scope!=='project');
  const label=document.querySelector<HTMLElement>('#scopeLabel'); if(label)label.textContent=scope==='global'?t('scope.globalConfig'):t('scope.projectConfig');
  const path=document.querySelector<HTMLElement>('#configPath'); if(path)path.textContent=scope==='global'?'~/.codex/config.toml':projectConfigDisplayPath();
  const notice=document.querySelector<HTMLElement>('#scopeNotice'); if(notice)notice.textContent=scope==='project'?t('scope.notice'):t('guide.globalNotice');
  const create=document.querySelector<HTMLElement>('#createNotice');if(create)create.classList.toggle('hidden',lastSnapshot===null||lastSnapshot.exists);
  const input=document.querySelector<HTMLInputElement>('#projectPath');if(input&&document.activeElement!==input)input.value=projectPath;
  const restore=document.querySelector<HTMLButtonElement>('#restoreBtn');if(restore)restore.disabled=busy||!lastSnapshot?.originalBackupExists;
  const clear=document.querySelector<HTMLButtonElement>('#clearBtn');if(clear)clear.disabled=busy||!lastSnapshot;
  const editor=document.querySelector<HTMLElement>('#leftContent');if(editor)editor.inert=busy||currentStatus.key==='status.reading';
  renderConfigHealth();renderModelIntegrity();renderChanges();renderHistory();renderPresetOrigin();renderStatus();
}
function renderChanges():void {
  const copy=previewText(getLocale());
  const canCompare=lastSnapshot!==null&&hasScope();
  const rows=createPreviewRows(fields,canCompare?lastSnapshot!.values:null,values,fieldLabel,displayValue);
  const changedCount=rows.filter(row=>row.status==='changed').length;
  const summaryText=(canCompare?copy.summary:copy.pending)
    .replace('{total}',String(rows.length)).replace('{changed}',String(changedCount));
  const count=document.querySelector<HTMLElement>('#changeCount');
  if(count){count.textContent=canCompare?String(changedCount):'—';count.title=summaryText;}
  const summary=document.querySelector<HTMLElement>('#previewSummary');
  if(summary)summary.textContent=summaryText;
  const apply=document.querySelector<HTMLButtonElement>('#applyBtn');
  if(apply)apply.disabled=busy||!canCompare||changedCount===0;
  const list=document.querySelector<HTMLElement>('#changeList'); if(!list)return;
  let notice='';
  if(!canCompare){
    const message=!hasScope()?t('status.selectProject')
      :currentStatus.key==='status.readFailed'?t('status.readFailed'):t('rail.review.loading');
    notice=`<p class="rail-help preview-notice">${esc(message)}</p>`;
  }else if(changedCount===0){
    notice=`<p class="rail-help preview-notice">${esc(t('rail.review.noChanges'))}</p>`;
  }
  // Show every field here; getChanges() remains the source of the confirmation diff.
  list.innerHTML=notice+renderPreviewRows(rows,copy);
}

function currentIntegrityKey():string {
  return integrityScopeKey(scope, projectPath);
}
function effectiveIntegrityTarget(snapshotValues:ManagedConfig|null=lastSnapshot?.values??null):IntegrityTarget|null {
  if(scope==='global') return resolveIntegrityTarget(snapshotValues,'global',null);
  return resolveIntegrityTarget(globalSnapshot?.values??null,'project',snapshotValues);
}
function draftIntegrityTarget(draft:ManagedConfig=values):IntegrityTarget|null {
  if(scope==='global') return resolveIntegrityTarget(draft,'global',null);
  return resolveIntegrityTarget(globalSnapshot?.values??null,'project',draft);
}
function integrityTargetLabel(target:IntegrityTarget|null):string {
  if(!target) return '—';
  return `${target.model??'—'} · ${target.reasoning??'—'}`;
}
async function loadGlobalIntegritySnapshot():Promise<void> {
  if(scope!=='project'||globalIntegrityLoading)return;
  globalIntegrityLoading=true;
  try{
    const snapshot=await safeInvoke<ConfigSnapshot>('read_config',{scope:{kind:'global',projectPath:null}},6000);
    if(scope==='project'){globalSnapshot=snapshot;renderModelIntegrity();}
  }catch(error){console.warn('model integrity global config',error);}
  finally{globalIntegrityLoading=false;}
}
function renderModelIntegrity():void {
  const host=document.querySelector<HTMLElement>('#integrityCard');if(!host)return;
  const copy=integrityText(getLocale());
  if(!hasScope()||!lastSnapshot){
    host.innerHTML=`<div class="rail-title"><h3>${icon('shield')}${esc(copy.title)}</h3><span class="integrity-badge">${esc(copy.unlocked)}</span></div><p class="rail-help">${esc(copy.scopeNote)}</p>`;
    return;
  }
  if(scope==='project'&&!globalSnapshot&&!globalIntegrityLoading)void loadGlobalIntegritySnapshot();
  const key=currentIntegrityKey();
  const lock=loadIntegrityLock(key);
  const effective=effectiveIntegrityTarget();
  const draft=draftIntegrityTarget();
  const drift=!!lock&&!sameIntegrityTarget(lock,effective);
  const draftChangesLock=!!lock&&!!draft&&!sameIntegrityTarget(lock,draft);
  host.innerHTML=`<div class="rail-title"><h3>${icon('shield')}${esc(copy.title)}</h3><span class="integrity-badge ${lock?'locked':''}">${esc(lock?copy.locked:copy.unlocked)}</span></div>
    <div class="integrity-grid">
      ${lock?`<div class="integrity-row"><span>${esc(copy.target)}</span><code>${esc(integrityTargetLabel(lock))}</code></div>`:''}
      <div class="integrity-row"><span>${esc(copy.effective)}</span><code>${esc(integrityTargetLabel(effective))}</code></div>
      <div class="integrity-row"><span>${esc(copy.runtime)}</span><code>${esc(copy.runtimeUnknown)}</code></div>
    </div>
    ${lock?`<p class="integrity-state ${drift?'warn':'ok'}">${drift?'⚠':'✓'} ${esc(drift?copy.drift:copy.healthy)}</p>`:''}
    ${draftChangesLock?`<p class="rail-help">${esc(copy.pendingChange)}</p>`:''}
    <div class="integrity-actions">
      ${lock?`<button id="restoreIntegrityTarget" class="text-button" ${drift?'':'disabled'}>${esc(copy.restoreTarget)}</button><button id="unlockIntegrity" class="text-button danger-text">${esc(copy.unlock)}</button>`:`<button id="lockIntegrity" class="text-button" ${effective?.model?'':'disabled'}>${esc(copy.lockCurrent)}</button>`}
    </div>
    <p class="rail-help">${esc(copy.scopeNote)}</p>`;
  document.querySelector<HTMLButtonElement>('#lockIntegrity')?.addEventListener('click',()=>{
    const target=effectiveIntegrityTarget();
    if(!target?.model){toast(copy.noModel,true);return;}
    saveIntegrityLock(key,target);toast(copy.enabled);renderModelIntegrity();
  });
  document.querySelector<HTMLButtonElement>('#unlockIntegrity')?.addEventListener('click',()=>{
    removeIntegrityLock(key);toast(copy.disabled);renderModelIntegrity();
  });
  document.querySelector<HTMLButtonElement>('#restoreIntegrityTarget')?.addEventListener('click',()=>{
    const target=loadIntegrityLock(key);if(!target)return;
    values.model=target.model;values.modelReasoningEffort=target.reasoning;
    draftPresetSource=null;activePreset='';
    renderWorkspace();renderRightRail();
  });
}

function healthScopeLabel(kind:'global'|'project'):string {
  return kind==='global'?t('scope.globalConfig'):t('scope.projectConfig');
}
function healthStatusLine(inspection:ConfigHealthState['global'], kind:'global'|'project'):string {
  const copy=healthText(getLocale());
  if(!inspection) return '';
  if(!inspection.exists) return copy.missing;
  if(!inspection.validToml) return `${copy.invalidToml}: ${inspection.parseError??''}`;
  return `${kind==='global'?copy.globalValid:copy.projectValid} · ${inspection.managedFieldCount} ${copy.managed}`;
}
function renderConfigHealth():void {
  const host=document.querySelector<HTMLElement>('#healthCard');if(!host)return;
  const copy=healthText(getLocale());
  if(configHealthLoading){
    host.innerHTML=`<div class="rail-title"><h3>${icon('shield')}${copy.title}</h3></div><p class="rail-help">${esc(copy.loading)}</p>`;
    return;
  }
  if(!configHealthState){
    host.innerHTML=`<div class="rail-title"><h3>${icon('shield')}${copy.title}</h3></div><p class="rail-help">${esc(copy.unavailable)}</p><button id="refreshHealthRules" class="text-button">${copy.refreshRules}</button>`;
    bindHealthActions();
    return;
  }
  const state=configHealthState;
  const schemaText=state.schema.status==='fresh'?copy.fresh:state.schema.status==='stale'?copy.stale:copy.unavailable;
  const issueCount=state.issues.length;
  const runtimeText=state.runtime?.installed
    ? `${copy.codexVersion}: ${state.runtime.version??state.runtime.rawVersion??'—'}`
    : copy.codexMissing;
  const changes=state.schemaChanges?.changes??[];
  const added=changes.filter(change=>change.kind==='added').length;
  const removed=changes.filter(change=>change.kind==='removed').length;
  const changed=changes.filter(change=>change.kind==='changed').length;
  const changeSummary=changes.length
    ? `${copy.ruleChanges}: +${added} ${copy.fieldsAdded} · -${removed} ${copy.fieldsRemoved} · ~${changed} ${copy.fieldsChanged}`
    : copy.noRuleChanges;
  const changeDetails=changes.slice(0,12).map(change=>`<li><span class="schema-change-kind ${change.kind}">${change.kind==='added'?'+':change.kind==='removed'?'-':'~'}</span><code>${esc(change.path)}</code></li>`).join('');
  const issueDetails=state.issues.map((issue,index)=>`<div class="health-issue">
    <div><strong>${esc(copy.unknown)}</strong><span>${esc(healthScopeLabel(issue.scopeKind))}</span></div>
    <code>${esc(issue.keyLabel)}</code>
    <small>${esc(issue.configPath)}</small>
    <p>${esc(copy.recommendation)}</p>
    ${issue.removable?`<button class="text-button danger-text" data-health-remove="${index}">${copy.remove}</button>`:''}
  </div>`).join('');
  const rows=[state.global?healthStatusLine(state.global,'global'):'',state.project?healthStatusLine(state.project,'project'):''].filter(Boolean);
  host.innerHTML=`<div class="rail-title"><h3>${icon('shield')}${copy.title}</h3><span class="health-status-dot ${issueCount?'warn':'ok'}"></span></div>
    <div class="health-summary">${rows.map(row=>`<p>${esc(row)}</p>`).join('')}<p class="${issueCount?'warning-text':'ok-text'}">${issueCount?`⚠ ${issueCount} ${copy.issues}`:`✓ ${copy.healthy}`}</p></div>
    <div class="health-runtime"><span>${esc(runtimeText)}</span></div>
    <details class="health-details" ${issueCount?'':'hidden'}><summary>${copy.viewProblems}</summary>${issueDetails}</details>
    <details class="health-details schema-change-details" ${changes.length?'':'hidden'}><summary>${esc(changeSummary)}</summary><ul>${changeDetails}</ul>${changes.length>12?`<small>+${changes.length-12}</small>`:''}</details>
    ${changes.length?'' : `<p class="health-change-empty">${esc(changeSummary)}</p>`}
    <div class="health-schema"><span>${esc(schemaText)}</span><button id="refreshHealthRules" class="text-button">${copy.refreshRules}</button></div>
    <p class="rail-help">${esc(copy.preserved)}</p><p class="rail-help">${esc(copy.sessionNote)}</p>`;
  bindHealthActions();
}
function bindHealthActions():void {
  document.querySelector<HTMLButtonElement>('#refreshHealthRules')?.addEventListener('click',()=>{void loadConfigHealth(true);});
  document.querySelectorAll<HTMLButtonElement>('[data-health-remove]').forEach(button=>button.addEventListener('click',()=>{
    const index=Number(button.dataset.healthRemove);
    const issue=configHealthState?.issues[index];
    if(issue)void removeHealthIssue(issue);
  }));
}
async function loadConfigHealth(forceSchema=false):Promise<void> {
  const request=++configHealthRequestId;
  configHealthLoading=true;renderConfigHealth();
  try{
    const state=await inspectHealth(projectPath,forceSchema);
    if(request!==configHealthRequestId)return;
    configHealthState=state;
    if(forceSchema)toast(healthText(getLocale()).rulesUpdated);
  }catch(error){
    if(request!==configHealthRequestId)return;
    console.warn('config health',error);
    if(forceSchema)toast(healthText(getLocale()).refreshFailed,true);
  }finally{
    if(request===configHealthRequestId){configHealthLoading=false;renderConfigHealth();}
  }
}
async function removeHealthIssue(issue:HealthIssue):Promise<void> {
  if(busy||confirmResolver)return;
  const copy=healthText(getLocale());

  // Destructive cleanup never trusts a cached schema. Refresh official rules first
  // and make sure the same key is still unknown before asking for confirmation.
  configHealthLoading=true;renderConfigHealth();
  let refreshed:ConfigHealthState;
  try{
    refreshed=await inspectHealth(projectPath,true);
    configHealthState=refreshed;
  }catch(error){
    configHealthLoading=false;renderConfigHealth();
    toast(copy.refreshFailed,true);
    return;
  }
  configHealthLoading=false;renderConfigHealth();
  if(!refreshed.schema.canWarnUnknown || !refreshed.issues.some(candidate =>
    candidate.scopeKind===issue.scopeKind
      && candidate.configPath===issue.configPath
      && candidate.keyLabel===issue.keyLabel
  )){
    toast(copy.rulesUpdated);
    return;
  }

  const accepted=await askConfirm({
    title:copy.removeTitle,
    message:copy.removeBody,
    detail:`${issue.configPath}\n${issue.keyLabel}\n\n${copy.recommendation}`,
    confirmText:copy.confirmRemove,
    danger:true,
  });
  if(!accepted||busy)return;
  setBusy(true);
  try{
    const target={kind:issue.scopeKind,projectPath:issue.scopeKind==='project'?projectPath:null};
    await safeInvoke<ConfigSnapshot>('remove_config_key',{scope:target,keyPath:issue.keyPath});
    if(issue.scopeKind===scope)await loadConfig();
    else await loadConfigHealth(false);
    toast(copy.healthy);
  }catch(error){toast(String(error),true);}
  finally{setBusy(false);renderRightRail();}
}

function renderHistoryPage(host:HTMLElement):void {
  const ui=workspaceText(getLocale());
  const navigation=`<div class="history-subtabs"><button data-history-view="projects" aria-pressed="${historyView==='projects'}" class="${historyView==='projects'?'active':''}">${ui.projectHistory}</button><button data-history-view="presets" aria-pressed="${historyView==='presets'}" class="${historyView==='presets'?'active':''}">${ui.presetHistory}</button></div>`;
  const bind=()=>host.querySelectorAll<HTMLButtonElement>('[data-history-view]').forEach(button=>button.onclick=()=>{
    historyView=button.dataset.historyView as 'projects'|'presets';
    if(historyView==='presets')viewedPresetVersion='legacy-v0.4.0';
    renderHistoryPage(host);
  });
  if(historyView==='presets'){
    host.innerHTML=navigation+'<div id="historyArchive"></div>';
    renderPresets(host.querySelector<HTMLElement>('#historyArchive')!);bind();return;
  }
  const copy=historyText(getLocale());
  host.innerHTML=navigation+`<section class="card pane-card history-workspace">
    <div class="section-heading"><div><h2>${t('history.title')}</h2><p>${t('history.help')}</p></div><button id="refreshHistory" class="button secondary">${t('history.refresh')}</button></div>
    <div class="history-toolbar"><input id="historySearch" type="search" value="${esc(historySearch)}" placeholder="${esc(copy.search)}" aria-label="${esc(copy.search)}"><span id="historyCount" class="history-result-count"></span></div>
    <p id="historyLoadState" class="history-load-state" role="status"></p>
    <div id="historyList" class="history-list"></div>
  </section>`;
  bind();
  $('#refreshHistory').addEventListener('click',()=>{ if(!busy)void loadHistory(); });
  $<HTMLInputElement>('#historySearch').addEventListener('input',e=>{historySearch=(e.currentTarget as HTMLInputElement).value;renderHistory();});
  renderHistory();
}
function renderHistory():void {
  const host=document.querySelector<HTMLElement>('#historyList');if(!host)return;
  const copy=historyText(getLocale());
  const entries=filterHistoryEntries(historyEntries,historySearch);
  const count=document.querySelector<HTMLElement>('#historyCount');if(count)count.textContent=`${entries.length} / ${historyEntries.length}`;
  const notice=document.querySelector<HTMLElement>('#historyLoadState');
  if(notice){notice.textContent=historyLoadError?copy.loadFailed:historyLoading?t('status.reading'):'';notice.classList.toggle('error',historyLoadError);}
  const refresh=document.querySelector<HTMLButtonElement>('#refreshHistory');if(refresh)refresh.disabled=busy||historyLoading;
  if(entries.length===0){
    host.innerHTML=historyLoading||historyLoadError?'':`<div class="empty-state">${esc(historySearch.trim()?copy.noMatches:t('history.empty'))}</div>`;
    return;
  }
  host.innerHTML=renderHistoryEntries(entries,copy,{restore:t('history.restore'),global:t('scope.global'),project:t('scope.project')},{projectName,time:formatTime,source:normalizeSource},busy||historyLoading||historyLoadError);
  host.querySelectorAll<HTMLButtonElement>('[data-preview-history-id]').forEach(btn=>btn.onclick=()=>previewHistory(btn.dataset.previewHistoryId!));
  host.querySelectorAll<HTMLButtonElement>('[data-history-id]').forEach(btn=>btn.onclick=()=>restoreHistory(btn.dataset.historyId!));
  host.querySelectorAll<HTMLButtonElement>('[data-delete-history-id]').forEach(btn=>btn.onclick=()=>deleteHistory(btn.dataset.deleteHistoryId!));
}
async function previewHistory(id:string):Promise<void> {
  if(busy||confirmResolver)return;
  const entry=historyEntries.find(item=>item.id===id);if(!entry)return;
  const copy=workspaceText(getLocale());
  await askConfirm({title:copy.historyPreview,message:copy.noWrite,readOnly:true,confirmText:copy.close,
    detail:[entry.configPath,formatTime(entry.timestampMs),...fields.map(field=>fieldLabel(field)+': '+(entry.values[field]===null?t('option.inherit'):String(entry.values[field])))].join('\n')});
}
async function approveDraftDiscard():Promise<boolean> {
  if(busy||confirmResolver)return false;
  if(getChanges().length===0)return true;
  const copy=workspaceText(getLocale());
  return askConfirm({title:copy.discardTitle,message:copy.discardBody,detail:lastSnapshot?.path,confirmText:copy.discard,danger:true});
}
async function changeScope(kind:ScopeKind,path=projectPath):Promise<void> {
  if(busy||confirmResolver)return;
  if(kind===scope && path===projectPath)return;
  if(!await approveDraftDiscard()){
    const input=document.querySelector<HTMLInputElement>('#projectPath');if(input)input.value=projectPath;
    return;
  }
  scope=kind;projectPath=path;usageReport=null;usageLoadError='';++usageRequestId;await loadConfig();
  if(activeTab==='usage')void loadProjectUsage();
}
async function reloadConfig():Promise<void> {
  if(await approveDraftDiscard())await loadConfig();
}
async function loadConfig():Promise<void> {
  if(busy)return;
  const request=++configReadId,target=JSON.stringify(requestScope());
  draftPresetSource=null;lastSnapshot=null;
  const result=document.querySelector<HTMLElement>('#applyResult');result?.classList.add('hidden');
  if(scope==='project'&&!projectPath){setStatus('status.selectProject',false);renderRightRail();void loadConfigHealth(false);return;}
  setStatus('status.reading',true);renderRightRail();
  try{
    const snap=await safeInvoke<ConfigSnapshot>('read_config',{scope:requestScope()});
    if(request!==configReadId||target!==JSON.stringify(requestScope()))return;
    if(scope==='project')globalSnapshot=null;
    applySnapshot(snap);setStatus(snap.exists?'status.read':'status.missing',true);
  }catch(e){if(request===configReadId){lastSnapshot=null;if(scope==='project')globalSnapshot=null;setStatus('status.readFailed',false);toast(String(e),true);}}
  finally{if(request===configReadId){renderRightRail();void loadConfigHealth(false);}}
}
function applySnapshot(snapshot:ConfigSnapshot):void {
  lastSnapshot=snapshot;if(scope==='global')globalSnapshot=snapshot;values=clone(snapshot.values);draftPresetSource=null;
  const match=matchPresetVersion(presets,snapshot.values);
  activePreset=match?.presetId??'';activePresetVersion=match?.versionId??CURRENT_PRESET_VERSION;
  if(match)viewedPresetVersion=match.versionId;
  if(activeTab==='advanced'||activeTab==='presets')renderWorkspace();
}

async function loadHistoryAfterWrite():Promise<void> {
  const request=++historyReadId;
  historyLoading=true;historyLoadError=false;renderHistory();
  try{const entries=await safeInvoke<HistoryEntry[]>('list_history',{limit:300},6000);if(request===historyReadId)historyEntries=entries;}
  catch(e){if(request===historyReadId){console.warn('history',e);historyLoadError=true;}}
  finally{if(request===historyReadId){historyLoading=false;renderHistory();}}
}
async function loadHistory():Promise<void> {
  if(historyLoading||busy)return;
  const request=++historyReadId;
  historyLoading=true;historyLoadError=false;renderHistory();
  try{
    const entries=await safeInvoke<HistoryEntry[]>('list_history',{limit:300},6000);
    if(request===historyReadId)historyEntries=entries;
  }catch(e){if(request===historyReadId){console.warn('history',e);historyLoadError=true;}}
  finally{if(request===historyReadId){historyLoading=false;renderHistory();}}
}

async function deleteHistory(id:string):Promise<void> {
  if(busy||confirmResolver||historyLoading||historyLoadError)return;
  const entry=historyEntries.find(item=>item.id===id);if(!entry)return;
  const copy=historyText(getLocale());
  const detail=[entry.scopeKind==='global'?t('scope.globalConfig'):t('scope.projectConfig'),projectName(entry.projectPath),formatTime(entry.timestampMs),entry.configPath,`${entry.values.model??'\u2014'} / ${entry.values.modelReasoningEffort??'\u2014'}`].join('\n');
  const ok=await askConfirm({title:copy.confirmTitle,message:copy.confirmBody,detail,confirmText:copy.remove,danger:true});
  if(!ok||busy)return;
  setBusy(true);++historyReadId;renderHistory();
  try{
    // Await the native result. A timeout would not cancel the file operation.
    // This narrow command accepts only a record ID, never a path to delete.
    historyEntries=await invoke<HistoryEntry[]>('delete_history_entry',{id:entry.id});
    historyLoadError=false;
    toast(copy.deleted);
  }catch(e){toast(`${copy.remove}: ${String(e)}`,true);}
  finally{setBusy(false);renderRightRail();}
}
async function applyChanges():Promise<void> {
  if(busy||confirmResolver||!lastSnapshot)return;
  const n=values.maxConcurrentThreadsPerSession;if(n!==null&&(!Number.isInteger(n)||n<1||n>16)){toast(workspaceText(getLocale()).invalidConcurrency,true);return;}
  const changes=getChanges();if(changes.length===0)return;
  if(!validateModelPickers(document))return;
  const reference=draftPresetSource?{...draftPresetSource}:null;
  const pending=clone(values), originalDraft=values, target=requestScope(), snapshot=lastSnapshot;
  const archived=reference!==null && presetVersion(reference.versionId)?.archived===true;
  const copy=presetVersionText(getLocale());
  const integrityCopy=integrityText(getLocale());
  const lockKey=currentIntegrityKey();
  const lock=loadIntegrityLock(lockKey);
  const pendingTarget=draftIntegrityTarget(pending);
  const changesLockedTarget=!!lock&&!!pendingTarget&&!sameIntegrityTarget(lock,pendingTarget);
  const detail=(snapshot.exists?snapshot.path:t('status.missing')+'\n'+snapshot.path)+(reference?'\n'+presetReferenceLabel(reference,getLocale(),presetText):'');
  const ok=await askConfirm({
    title:changesLockedTarget?integrityCopy.changeTitle:t('confirm.apply.title'),
    message:(changesLockedTarget?integrityCopy.changeBody:t('confirm.apply.message'))+(archived?'\n\n'+copy.warning:''),
    detail,
    confirmText:changesLockedTarget?integrityCopy.changeConfirm:t('action.apply'),
    changes:changes.map(c=>({label:fieldLabel(c.field),from:c.from,to:c.to}))
  });
  if(!ok||busy)return;
  if(values!==originalDraft || lastSnapshot!==snapshot || JSON.stringify(target)!==JSON.stringify(requestScope())){toast(copy.changedScope,true);return;}
  setBusy(true);
  try{
    const snap=await safeInvoke<ConfigSnapshot>('apply_config',{scope:target,values:pending,source:presetSource(reference)});
    applySnapshot(snap);
    if(changesLockedTarget){
      const appliedTarget=effectiveIntegrityTarget(snap.values);
      if(appliedTarget)saveIntegrityLock(lockKey,appliedTarget);
    }
    setStatus('status.read',true);await loadHistoryAfterWrite();toast(t('toast.applied'));
  }
  catch(e){toast(t('error.applyFailed',{error:String(e)}),true);}
  finally{setBusy(false);renderWorkspace();renderRightRail();}
}
async function clearManaged():Promise<void> {
  if(busy||!hasScope())return;const ok=await askConfirm({title:t('confirm.clear.title'),message:t('confirm.clear.message'),detail:scope==='global'?'~/.codex/config.toml':projectConfigDisplayPath(),confirmText:t('action.clear'),danger:true});if(!ok)return;
  setBusy(true);try{const snap=await safeInvoke<ConfigSnapshot>('clear_managed_config',{scope:requestScope()});applySnapshot(snap);await loadHistoryAfterWrite();toast(t('toast.cleared'));}catch(e){toast(String(e),true);}finally{setBusy(false);renderWorkspace();renderRightRail();}
}
async function restoreOriginal():Promise<void> {
  if(busy||!hasScope())return;const ok=await askConfirm({title:t('confirm.restore.title'),message:t('confirm.restore.message'),detail:t('confirm.restore.detail'),confirmText:t('action.restore'),danger:true});if(!ok)return;
  setBusy(true);try{const snap=await safeInvoke<ConfigSnapshot>('restore_original',{scope:requestScope()});applySnapshot(snap);await loadHistoryAfterWrite();toast(t('toast.restored'));}catch(e){toast(String(e),true);}finally{setBusy(false);renderWorkspace();renderRightRail();}
}
async function restoreHistory(id:string):Promise<void> {
  const entry=historyEntries.find(x=>x.id===id);if(!entry||busy)return;
  const ok=await askConfirm({title:t('confirm.history.title'),message:t('confirm.history.message',{name:projectName(entry.projectPath)}),detail:entry.configPath,confirmText:t('history.restore'),danger:true,changes:[{label:t('preview.model'),from:lastSnapshot?.values.model??'—',to:entry.values.model??'—'},{label:t('preview.reasoning'),from:lastSnapshot?.values.modelReasoningEffort??'—',to:entry.values.modelReasoningEffort??'—'}]});if(!ok)return;
  setBusy(true);try{const result=await safeInvoke<HistoryRestoreResult>('restore_history_entry',{id});scope=result.scope.kind;projectPath=result.scope.projectPath??'';applySnapshot(result.snapshot);await loadHistoryAfterWrite();toast(t('toast.historyRestored'));renderApp();}catch(e){toast(String(e),true);}finally{setBusy(false);}
}

function askConfirm(spec:ConfirmSpec):Promise<boolean> {
  if(confirmResolver)return Promise.resolve(false);
  const modal=$<HTMLElement>('#confirmModal');modal.classList.remove('hidden');
  $('#confirmTitle').textContent=spec.title;$('#confirmMessage').textContent=spec.message;
  const detail=$<HTMLElement>('#confirmDetail');detail.textContent=spec.detail??'';detail.classList.toggle('hidden',!spec.detail);
  const changes=$<HTMLElement>('#confirmChanges');changes.innerHTML=(spec.changes??[]).map(c=>`<div class="confirm-change"><span>${esc(c.label)}</span><del>${esc(c.from)}</del><strong>${esc(c.to)}</strong></div>`).join('');
  const check=$<HTMLInputElement>('#confirmCheckbox');check.checked=false;check.closest('.confirm-check')?.classList.toggle('hidden',!!spec.readOnly);
  const ok=$<HTMLButtonElement>('#confirmOk');ok.textContent=spec.confirmText;ok.disabled=!spec.readOnly;ok.className=`button ${spec.danger?'danger':'primary'}`;
  setModalActive(true);
  return new Promise(resolve=>{confirmResolver=resolve;});
}
function finishConfirm(value:boolean):void { const modal=document.querySelector<HTMLElement>('#confirmModal');modal?.classList.add('hidden');const r=confirmResolver;confirmResolver=null;setModalActive(false);r?.(value); }

function bindStaticEvents():void {
  document.querySelector<HTMLButtonElement>('#updateCheckBtn')?.addEventListener('click',()=>{void runUpdateCheck(false);});
  $<HTMLSelectElement>('#languageSelect').onchange=e=>{if(busy||confirmResolver||!validateModelPickers(document)){(e.currentTarget as HTMLSelectElement).value=getLocale();return;}setLocale((e.currentTarget as HTMLSelectElement).value as Locale);document.documentElement.lang=getLocale();renderApp();};
  $<HTMLSelectElement>('#themeMode').value=themeMode;
  $<HTMLSelectElement>('#themeMode').onchange=e=>{themeMode=(e.currentTarget as HTMLSelectElement).value as ThemeMode;safeSet('codex-config-studio.theme.mode',themeMode);applyTheme();};
  document.querySelectorAll<HTMLButtonElement>('[data-accent]').forEach(btn=>btn.onclick=()=>{accent=btn.dataset.accent as Accent;safeSet('codex-config-studio.theme.accent',accent);applyTheme();document.querySelectorAll('[data-accent]').forEach(x=>{x.classList.toggle('active',(x as HTMLElement).dataset.accent===accent);x.setAttribute('aria-pressed',String((x as HTMLElement).dataset.accent===accent));});});
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(btn=>btn.onclick=()=>{if(busy||confirmResolver||!validateModelPickers(document))return;activeTab=btn.dataset.tab as WorkspaceTab;renderWorkspace();if(activeTab==='overview')void loadProjectOverview();if(activeTab==='history')void loadHistory();if(activeTab==='usage')void loadProjectUsage();});
  document.querySelectorAll<HTMLButtonElement>('.scope-tab').forEach(btn=>btn.onclick=()=>void changeScope(btn.dataset.scope as ScopeKind));
  $('#chooseProject').addEventListener('click',async()=>{if(busy||confirmResolver)return;try{const p=await open({directory:true,multiple:false,title:t('scope.dialogTitle')});if(typeof p==='string')await changeScope('project',p);}catch(e){toast(String(e),true);}});
  $<HTMLInputElement>('#projectPath').onchange=e=>{const path=(e.currentTarget as HTMLInputElement).value.trim();void changeScope('project',path);};
  $('#reloadBtn').addEventListener('click',reloadConfig);$('#applyBtn').addEventListener('click',applyChanges);$('#clearBtn').addEventListener('click',clearManaged);$('#restoreBtn').addEventListener('click',restoreOriginal);
  $<HTMLInputElement>('#confirmCheckbox').onchange=e=>$<HTMLButtonElement>('#confirmOk').disabled=!(e.currentTarget as HTMLInputElement).checked;
  $('#confirmCancel').addEventListener('click',()=>finishConfirm(false));$('#confirmOk').addEventListener('click',()=>{if(!$<HTMLButtonElement>('#confirmOk').disabled)finishConfirm(true);});
  $('#confirmClose').addEventListener('click',()=>finishConfirm(false));
  bindModalKeyboard(()=>finishConfirm(false));
  bindTabs(document,id=>{if(busy||confirmResolver||!validateModelPickers(document))return false;activeTab=id as WorkspaceTab;renderWorkspace();if(activeTab==='overview')void loadProjectOverview();if(activeTab==='history')void loadHistory();if(activeTab==='usage')void loadProjectUsage();});
  $('#confirmModal').addEventListener('click',e=>{if(e.target===e.currentTarget)finishConfirm(false);});
}

document.addEventListener('click',e=>closePopovers(e.target));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!confirmResolver)closePopovers(null);});

window.addEventListener('unhandledrejection',e=>{console.error(e.reason);toast(t('error.unexpected',{error:String(e.reason)}),true);});
window.addEventListener('error',e=>{console.error(e.error);toast(t('error.unexpected',{error:String(e.message)}),true);});
matchMedia('(prefers-color-scheme: light)').addEventListener('change',()=>{if(themeMode==='system')applyTheme();});

document.documentElement.lang=getLocale();
applyTheme();
renderApp();
Promise.all([loadConfig(),loadHistory(),signedUpdaterEnabled().then(enabled=>{signedUpdaterReady=enabled;}),runUpdateCheck(true)]);
