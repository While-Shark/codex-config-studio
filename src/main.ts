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

type ScopeKind = 'global' | 'project';
type WorkspaceTab = 'presets' | 'task' | 'advanced' | 'history';
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
  changes?: Array<{ label: string; from: string; to: string }>;
};

type StatusKey = 'status.unread' | 'status.selectProject' | 'status.reading' | 'status.read' | 'status.missing' | 'status.readFailed';

const fields: Field[] = ['model','modelReasoningEffort','planModeReasoningEffort','agentsEnabled','defaultSubagentModel','defaultSubagentReasoningEffort','maxConcurrentThreadsPerSession'];
const models = ['gpt-6-astra','gpt-5.6-sol','gpt-5.6-terra','gpt-5.6-luna'];
const efforts = ['low','medium','high','xhigh','ultra','persistent','max'];
const presets: Preset[] = [
  { id:'token-save', values:{model:'gpt-5.6-luna',modelReasoningEffort:'low',planModeReasoningEffort:'medium',agentsEnabled:false,defaultSubagentModel:null,defaultSubagentReasoningEffort:null,maxConcurrentThreadsPerSession:null}},
  { id:'economy', values:{model:'gpt-5.6-luna',modelReasoningEffort:'medium',planModeReasoningEffort:'high',agentsEnabled:false,defaultSubagentModel:null,defaultSubagentReasoningEffort:null,maxConcurrentThreadsPerSession:null}},
  { id:'daily', values:{model:'gpt-5.6-terra',modelReasoningEffort:'medium',planModeReasoningEffort:'high',agentsEnabled:true,defaultSubagentModel:'gpt-5.6-luna',defaultSubagentReasoningEffort:'medium',maxConcurrentThreadsPerSession:2}},
  { id:'balanced', values:{model:'gpt-5.6-sol',modelReasoningEffort:'medium',planModeReasoningEffort:'high',agentsEnabled:true,defaultSubagentModel:'gpt-5.6-luna',defaultSubagentReasoningEffort:'medium',maxConcurrentThreadsPerSession:2}},
  { id:'astra', values:{model:'gpt-6-astra',modelReasoningEffort:'medium',planModeReasoningEffort:'high',agentsEnabled:true,defaultSubagentModel:'gpt-5.6-luna',defaultSubagentReasoningEffort:'medium',maxConcurrentThreadsPerSession:2}},
  { id:'max', values:{model:'gpt-6-astra',modelReasoningEffort:'xhigh',planModeReasoningEffort:'xhigh',agentsEnabled:true,defaultSubagentModel:'gpt-5.6-luna',defaultSubagentReasoningEffort:'high',maxConcurrentThreadsPerSession:3}},
];

let scope: ScopeKind = 'global';
let projectPath = '';
let activeTab: WorkspaceTab = 'presets';
let activePreset = 'daily';
let values = structuredClone(presets[2].values);
let lastSnapshot: ConfigSnapshot | null = null;
let currentStatus: { key: StatusKey; ok: boolean } = { key: 'status.unread', ok: false };
let activeTaskMode: TaskModeId = loadActiveTaskMode();
let taskPreferences = loadTaskPreferences();
let historyEntries: HistoryEntry[] = [];
let historySearch = '';
let historyLoading = false;
let historyLoadError = false;
let historyReadId = 0;
let busy = false;
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
  const timeout = new Promise<T>((_,reject)=>setTimeout(()=>reject(new Error(t('error.operationTimeout'))),timeoutMs));
  return Promise.race([invoke<T>(command,args),timeout]);
}
function setBusy(next:boolean):void {
  busy=next;
  document.querySelectorAll<HTMLButtonElement>('[data-write-action]').forEach(btn=>btn.disabled=next);
  const indicator=document.querySelector<HTMLElement>('#busyIndicator');
  if(indicator){indicator.classList.toggle('hidden',!next);indicator.textContent=next?t('status.applying'):'';}
  renderChanges();renderHistory();
}
function toast(text:string,error=false):void {
  const e=$<HTMLDivElement>('#toast');
  e.textContent=text;e.className=`toast show ${error?'error':''}`;
  setTimeout(()=>{ if(e.textContent===text)e.className='toast'; },2800);
}
function setStatus(key:StatusKey,ok=true):void { currentStatus={key,ok}; renderStatus(); }
function renderStatus():void {
  const e=document.querySelector<HTMLElement>('#saveState'); if(!e)return;
  e.className=`status-pill ${currentStatus.ok?'ok':'warn'}`;e.innerHTML=`<i></i>${t(currentStatus.key)}`;
}

function renderApp():void {
  app.innerHTML=`
<div class="app-shell">
<header class="topbar">
  <div class="brand"><div class="logo">C</div><div><h1>Codex Config Studio</h1><p>${t('app.subtitle')}</p></div></div>
  <div class="top-actions">
    <label class="compact-select"><span>${t('language.label')}</span><select id="languageSelect">${localeOptions.map(x=>`<option value="${x.value}" ${x.value===getLocale()?'selected':''}>${x.label}</option>`).join('')}</select></label>
    <label class="compact-select"><span>${t('theme.mode')}</span><select id="themeMode"><option value="system">${t('theme.system')}</option><option value="dark">${t('theme.dark')}</option><option value="light">${t('theme.light')}</option></select></label>
    <div class="accent-picker" aria-label="${t('theme.accent')}">${(['violet','blue','emerald','amber','rose'] as Accent[]).map(a=>`<button class="accent-dot ${accent===a?'active':''}" data-accent="${a}" aria-label="${a}"></button>`).join('')}</div>
    <span id="saveState" class="status-pill"><i></i></span>
  </div>
</header>
<main class="workspace">
  <section class="left-pane">
    <div class="intro-card card"><div><span class="eyebrow">${t('guide.eyebrow')}</span><h2>${t('guide.title')}</h2><p>${t('guide.description')}</p></div><div class="guide-steps"><span>1 ${t('guide.scope')}</span><span>2 ${t('guide.choose')}</span><span>3 ${t('guide.review')}</span><span>4 ${t('guide.apply')}</span></div></div>
    <div class="tabs card"><button data-tab="presets">${t('tab.presets')}</button><button data-tab="task">${t('tab.task')}</button><button data-tab="advanced">${t('tab.advanced')}</button><button data-tab="history">${historyText(getLocale()).tab}</button></div>
    <section id="leftContent" class="left-content"></section>
  </section>
  <aside class="right-pane">
    <section class="card scope-card">
      <div class="rail-title"><div><span class="eyebrow">${t('rail.scope.eyebrow')}</span><h3>${t('rail.scope.title')}</h3></div><span id="busyIndicator" class="busy-indicator hidden"></span></div>
      <div class="segmented"><button class="scope-tab" data-scope="global">${t('scope.global')}</button><button class="scope-tab" data-scope="project">${t('scope.project')}</button></div>
      <div id="projectPicker" class="project-picker hidden"><input id="projectPath" placeholder="${t('scope.projectPlaceholder')}" value="${esc(projectPath)}"><button id="chooseProject" class="button secondary">${t('scope.chooseFolder')}</button></div>
      <div class="path-block"><span id="scopeLabel">${scope==='global'?t('scope.globalConfig'):t('scope.projectConfig')}</span><code id="configPath">${scope==='global'?'~/.codex/config.toml':esc(projectConfigDisplayPath())}</code></div>
      <div id="scopeNotice" class="notice">${scope==='project'?t('scope.notice'):t('guide.globalNotice')}</div>
    </section>
    <section class="card review-card">
      <div class="rail-title"><div><span class="eyebrow">${t('rail.review.eyebrow')}</span><h3>${previewText(getLocale()).title}</h3></div><span id="changeCount" class="count-badge">0</span></div>
      <p id="previewSummary" class="rail-help" aria-live="polite"></p>
      <div id="changeList" class="change-list"></div>
      <div class="safety-note"><strong>${t('rail.safety.title')}</strong><span>${t('rail.safety.body')}</span></div>
      <button id="applyBtn" data-write-action class="button primary wide">${t('action.apply')}</button>
      <div class="rail-secondary"><button id="reloadBtn" class="button secondary">${t('action.reload')}</button><button id="clearBtn" data-write-action class="button secondary">${t('action.clear')}</button><button id="restoreBtn" data-write-action class="button danger-ghost">${t('action.restore')}</button></div>
    </section>
  </aside>
</main>
<div id="confirmModal" class="modal-backdrop hidden"><div class="modal"><div class="modal-head"><span class="eyebrow">${t('confirm.eyebrow')}</span><h3 id="confirmTitle"></h3></div><p id="confirmMessage"></p><div id="confirmDetail" class="modal-detail hidden"></div><div id="confirmChanges" class="modal-changes"></div><label class="confirm-check"><input id="confirmCheckbox" type="checkbox"><span>${t('confirm.checkbox')}</span></label><div class="modal-actions"><button id="confirmCancel" class="button secondary">${t('confirm.cancel')}</button><button id="confirmOk" class="button primary" disabled></button></div></div></div>
<div id="toast" class="toast"></div>
</div>`;
  bindStaticEvents();
  renderWorkspace();
  renderRightRail();
  renderStatus();
  applyTheme();
}

function renderWorkspace():void {
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(btn=>btn.classList.toggle('active',btn.dataset.tab===activeTab));
  const host=$<HTMLElement>('#leftContent');
  if(activeTab==='presets') renderPresets(host);
  else if(activeTab==='task') renderTask(host);
  else if(activeTab==='history') renderHistoryPage(host);
  else renderAdvanced(host);
}
function renderPresets(host:HTMLElement):void {
  host.innerHTML=`<section class="card pane-card"><div class="section-heading"><div><span class="eyebrow">${t('section.preset.eyebrow')}</span><h2>${t('section.preset.title')}</h2><p>${t('section.preset.hint')}</p></div></div><div class="preset-grid">${presets.map(p=>`<button class="preset-card ${activePreset===p.id?'selected':''}" data-preset="${p.id}"><div class="preset-top"><strong>${presetText(p.id,'name')}</strong><span>${presetText(p.id,'badge')}</span></div><p>${presetText(p.id,'description')}</p><small>${presetText(p.id,'usage')}</small></button>`).join('')}</div></section>`;
  host.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(btn=>btn.onclick=()=>{const p=presets.find(x=>x.id===btn.dataset.preset)!;activePreset=p.id;values=clone(p.values);renderWorkspace();renderRightRail();});
}
function renderTask(host:HTMLElement):void {
  const pref=taskPreferences[activeTaskMode];
  const isCommon=commonTaskModels.includes(pref.model as (typeof commonTaskModels)[number]);
  host.innerHTML=`<section class="card pane-card"><div class="section-heading"><div><span class="eyebrow">${t('section.task.eyebrow')}</span><h2>${t('section.task.title')}</h2><p>${t('section.task.hint')}</p></div></div><div class="task-grid">${taskModeIds.map(id=>{const p=taskPreferences[id];return `<button class="task-card ${activeTaskMode===id?'selected':''}" data-task-mode="${id}"><strong>${taskText(id,'name')}</strong><p>${taskText(id,'description')}</p><small>${esc(p.model)} · ${esc(p.reasoning)}</small></button>`;}).join('')}</div><div class="task-editor"><label><span>${t('task.model')}</span><select id="taskModel">${commonTaskModels.map(m=>`<option value="${m}" ${pref.model===m?'selected':''}>${m}</option>`).join('')}<option value="__custom__" ${!isCommon?'selected':''}>${t('task.customModel')}</option></select></label><label id="customModelWrap" class="${isCommon?'hidden':''}"><span>${t('task.customModel')}</span><input id="taskCustomModel" value="${isCommon?'':esc(pref.model)}" placeholder="${t('task.customPlaceholder')}"></label><label><span>${t('task.reasoning')}</span><select id="taskReasoning">${reasoningLevels.map(r=>`<option value="${r}" ${pref.reasoning===r?'selected':''}>${r}</option>`).join('')}</select></label></div><div class="inline-actions"><button id="useTask" class="button primary">${t('task.useAsPending')}</button><button id="resetTask" class="button secondary">${t('task.reset')}</button></div><div class="tip-box"><strong>${t('task.tipTitle')}</strong><span>${t('task.remember')}</span><span>${t('task.modelSupport')}</span><span>${t('task.note')}</span></div></section>`;
  host.querySelectorAll<HTMLButtonElement>('[data-task-mode]').forEach(btn=>btn.onclick=()=>{activeTaskMode=btn.dataset.taskMode as TaskModeId;saveActiveTaskMode(activeTaskMode);renderTask(host);});
  $<HTMLSelectElement>('#taskModel').onchange=()=>{const v=$<HTMLSelectElement>('#taskModel').value;$<HTMLElement>('#customModelWrap').classList.toggle('hidden',v!=='__custom__');};
  $('#useTask').addEventListener('click',()=>{const modelSel=$<HTMLSelectElement>('#taskModel').value;const custom=$<HTMLInputElement>('#taskCustomModel')?.value.trim()??'';const model=modelSel==='__custom__'?custom:modelSel;const reasoning=$<HTMLSelectElement>('#taskReasoning').value;if(!model){toast(t('toast.taskModelRequired'),true);return;}const next:TaskPreference={model,reasoning};taskPreferences[activeTaskMode]=next;saveTaskPreference(activeTaskMode,next);values.model=model;values.modelReasoningEffort=reasoning;activePreset='';renderTask(host);renderRightRail();toast(t('toast.taskPrepared',{name:taskText(activeTaskMode,'name')}));});
  $('#resetTask').addEventListener('click',()=>{taskPreferences[activeTaskMode]=resetTaskPreference(activeTaskMode);renderTask(host);toast(t('toast.taskReset',{name:taskText(activeTaskMode,'name')}));});
}
function renderAdvanced(host:HTMLElement):void {
  host.innerHTML=`<section class="card pane-card"><div class="section-heading"><div><span class="eyebrow">${t('section.custom.eyebrow')}</span><h2>${t('section.custom.title')}</h2><p>${t('advanced.help')}</p></div><button id="resetPresetBtn" class="text-button">${t('action.resetPreset')}</button></div><div class="form-grid">${advancedField('model',t('field.model'),t('field.model.help'),`<input id="model" list="modelList" value="${esc(values.model??'')}"><datalist id="modelList">${models.map(m=>`<option value="${m}"></option>`).join('')}</datalist>`)}${advancedField('modelReasoningEffort',t('field.reasoning'),t('field.reasoning.help'),selectHtml('modelReasoningEffort',values.modelReasoningEffort,efforts,true))}${advancedField('planModeReasoningEffort',t('field.planReasoning'),t('field.planReasoning.help'),selectHtml('planModeReasoningEffort',values.planModeReasoningEffort,efforts,true))}${advancedField('agentsEnabled',t('field.agents'),t('field.agents.help'),`<select id="agentsEnabled"><option value="">${t('option.inherit')}</option><option value="true" ${values.agentsEnabled===true?'selected':''}>${t('option.enabled')}</option><option value="false" ${values.agentsEnabled===false?'selected':''}>${t('option.disabled')}</option></select>`)}${advancedField('defaultSubagentModel',t('field.subagentModel'),t('field.subagentModel.help'),`<input id="defaultSubagentModel" list="modelList" value="${esc(values.defaultSubagentModel??'')}" placeholder="${t('option.inherit')}">`)}${advancedField('defaultSubagentReasoningEffort',t('field.subagentReasoning'),t('field.subagentReasoning.help'),selectHtml('defaultSubagentReasoningEffort',values.defaultSubagentReasoningEffort,efforts,true))}${advancedField('maxConcurrentThreadsPerSession',t('field.maxConcurrent'),t('field.maxConcurrent.help'),`<input id="maxConcurrentThreadsPerSession" type="number" min="1" max="16" value="${values.maxConcurrentThreadsPerSession??''}" placeholder="${t('option.inherit')}">`)}</div></section>`;
  fields.forEach(field=>{const el=document.querySelector<HTMLInputElement|HTMLSelectElement>(`#${field}`);if(el)el.addEventListener('input',()=>{readAdvanced();activePreset='';renderRightRail();});});
  $('#resetPresetBtn').addEventListener('click',()=>{const p=presets.find(x=>x.id===activePreset)??presets[2];values=clone(p.values);renderAdvanced(host);renderRightRail();toast(t('toast.resetPreset',{name:presetText(p.id,'name')}));});
}
function advancedField(id:Field,title:string,help:string,control:string):string { return `<label class="field"><div><strong>${title}</strong><small>${help}</small></div><div>${control}</div></label>`; }
function selectHtml(id:string,value:string|null,options:string[],inherit=false):string { return `<select id="${id}">${inherit?`<option value="">${t('option.inherit')}</option>`:''}${options.map(o=>`<option value="${o}" ${value===o?'selected':''}>${o}</option>`).join('')}</select>`; }
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
  renderChanges();renderHistory();
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

function renderHistoryPage(host:HTMLElement):void {
  const copy=historyText(getLocale());
  host.innerHTML=`<section class="card pane-card history-workspace">
    <div class="section-heading"><div><h2>${t('history.title')}</h2><p>${t('history.help')}</p></div><button id="refreshHistory" class="button secondary">${t('history.refresh')}</button></div>
    <div class="history-toolbar"><input id="historySearch" type="search" value="${esc(historySearch)}" placeholder="${esc(copy.search)}" aria-label="${esc(copy.search)}"><span id="historyCount" class="history-result-count"></span></div>
    <p id="historyLoadState" class="history-load-state" role="status"></p>
    <div id="historyList" class="history-list"></div>
  </section>`;
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
  host.querySelectorAll<HTMLButtonElement>('[data-history-id]').forEach(btn=>btn.onclick=()=>restoreHistory(btn.dataset.historyId!));
  host.querySelectorAll<HTMLButtonElement>('[data-delete-history-id]').forEach(btn=>btn.onclick=()=>deleteHistory(btn.dataset.deleteHistoryId!));
}
async function loadConfig():Promise<void> {
  if(scope==='project'&&!projectPath){lastSnapshot=null;setStatus('status.selectProject',false);renderRightRail();return;}
  try{setStatus('status.reading',true);const snap=await safeInvoke<ConfigSnapshot>('read_config',{scope:requestScope()});applySnapshot(snap);setStatus(snap.exists?'status.read':'status.missing',true);}catch(e){lastSnapshot=null;setStatus('status.readFailed',false);toast(String(e),true);}finally{renderRightRail();}
}
function applySnapshot(snapshot:ConfigSnapshot):void { lastSnapshot=snapshot;values=clone(snapshot.values);const match=presets.find(p=>fields.every(f=>p.values[f]===snapshot.values[f]));activePreset=match?.id??'';if(activeTab==='advanced')renderWorkspace(); }

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
  if(busy||!lastSnapshot)return;
  const n=values.maxConcurrentThreadsPerSession;if(n!==null&&(n<1||n>16)){toast(t('toast.concurrentRange'),true);return;}
  const changes=getChanges();if(changes.length===0)return;
  const ok=await askConfirm({title:t('confirm.apply.title'),message:t('confirm.apply.message'),detail:lastSnapshot.exists?lastSnapshot.path:`${t('status.missing')}\n${lastSnapshot.path}`,confirmText:t('action.apply'),changes:changes.map(c=>({label:fieldLabel(c.field),from:c.from,to:c.to}))});if(!ok)return;
  setBusy(true);
  try{const snap=await safeInvoke<ConfigSnapshot>('apply_config',{scope:requestScope(),values,source:'manual'});applySnapshot(snap);setStatus('status.read',true);await loadHistoryAfterWrite();toast(t('toast.applied'));}
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
  if(confirmResolver)confirmResolver(false);
  const modal=$<HTMLElement>('#confirmModal');modal.classList.remove('hidden');
  $('#confirmTitle').textContent=spec.title;$('#confirmMessage').textContent=spec.message;
  const detail=$<HTMLElement>('#confirmDetail');detail.textContent=spec.detail??'';detail.classList.toggle('hidden',!spec.detail);
  const changes=$<HTMLElement>('#confirmChanges');changes.innerHTML=(spec.changes??[]).map(c=>`<div class="confirm-change"><span>${esc(c.label)}</span><del>${esc(c.from)}</del><strong>${esc(c.to)}</strong></div>`).join('');
  const check=$<HTMLInputElement>('#confirmCheckbox');check.checked=false;
  const ok=$<HTMLButtonElement>('#confirmOk');ok.textContent=spec.confirmText;ok.disabled=true;ok.className=`button ${spec.danger?'danger':'primary'}`;
  return new Promise(resolve=>{confirmResolver=resolve;});
}
function finishConfirm(value:boolean):void { const modal=document.querySelector<HTMLElement>('#confirmModal');modal?.classList.add('hidden');const r=confirmResolver;confirmResolver=null;r?.(value); }

function bindStaticEvents():void {
  $<HTMLSelectElement>('#languageSelect').onchange=e=>{setLocale((e.currentTarget as HTMLSelectElement).value as Locale);document.documentElement.lang=getLocale();renderApp();};
  $<HTMLSelectElement>('#themeMode').value=themeMode;
  $<HTMLSelectElement>('#themeMode').onchange=e=>{themeMode=(e.currentTarget as HTMLSelectElement).value as ThemeMode;safeSet('codex-config-studio.theme.mode',themeMode);applyTheme();};
  document.querySelectorAll<HTMLButtonElement>('[data-accent]').forEach(btn=>btn.onclick=()=>{accent=btn.dataset.accent as Accent;safeSet('codex-config-studio.theme.accent',accent);applyTheme();document.querySelectorAll('[data-accent]').forEach(x=>x.classList.toggle('active',(x as HTMLElement).dataset.accent===accent));});
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(btn=>btn.onclick=()=>{activeTab=btn.dataset.tab as WorkspaceTab;renderWorkspace();if(activeTab==='history')void loadHistory();});
  document.querySelectorAll<HTMLButtonElement>('.scope-tab').forEach(btn=>btn.onclick=async()=>{scope=btn.dataset.scope as ScopeKind;renderRightRail();await loadConfig();});
  $('#chooseProject').addEventListener('click',async()=>{const p=await open({directory:true,multiple:false,title:t('scope.dialogTitle')});if(typeof p==='string'){projectPath=p;$<HTMLInputElement>('#projectPath').value=p;await loadConfig();}});
  $<HTMLInputElement>('#projectPath').onchange=async e=>{projectPath=(e.currentTarget as HTMLInputElement).value.trim();await loadConfig();};
  $('#reloadBtn').addEventListener('click',loadConfig);$('#applyBtn').addEventListener('click',applyChanges);$('#clearBtn').addEventListener('click',clearManaged);$('#restoreBtn').addEventListener('click',restoreOriginal);
  $<HTMLInputElement>('#confirmCheckbox').onchange=e=>$<HTMLButtonElement>('#confirmOk').disabled=!(e.currentTarget as HTMLInputElement).checked;
  $('#confirmCancel').addEventListener('click',()=>finishConfirm(false));$('#confirmOk').addEventListener('click',()=>finishConfirm(true));
  $('#confirmModal').addEventListener('click',e=>{if(e.target===e.currentTarget)finishConfirm(false);});
}

window.addEventListener('unhandledrejection',e=>{console.error(e.reason);toast(t('error.unexpected',{error:String(e.reason)}),true);});
window.addEventListener('error',e=>{console.error(e.error);toast(t('error.unexpected',{error:String(e.message)}),true);});
matchMedia('(prefers-color-scheme: light)').addEventListener('change',()=>{if(themeMode==='system')applyTheme();});

document.documentElement.lang=getLocale();
applyTheme();
renderApp();
Promise.all([loadConfig(),loadHistory()]);
