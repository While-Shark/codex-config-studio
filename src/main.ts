import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { getLocale, localeOptions, setLocale, t, type Locale } from './i18n';
import './styles.css';

type ScopeKind = 'global' | 'project';
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
let activePreset = 'daily';
let values = structuredClone(presets[2].values);
let overrides = new Set<Field>(fields);
let lastSnapshot: ConfigSnapshot | null = null;
let currentStatus: { key: StatusKey; ok: boolean } = { key: 'status.unread', ok: false };

const $ = <T extends Element>(s:string) => document.querySelector<T>(s)!;
const esc = (v:string) => v.replace(/[&<>"']/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!));
const app = $('#app');

function presetText(id:string, part:'name'|'badge'|'description'|'usage'): string {
  return t(`preset.${id}.${part}` as Parameters<typeof t>[0]);
}

function field(id:Field,title:string,help:string,control:string){
  return `<label class="field"><div class="field-copy"><span>${title}</span><small>${help}</small></div><div class="field-control"><label class="override-toggle hidden" data-wrap="${id}"><input type="checkbox" data-override="${id}" checked><span>${t('option.projectOverride')}</span></label>${control}</div></label>`;
}
function inputList(id:string,list:string){return `<input id="${id}" list="${list}" placeholder="${t('option.inherit')}">`;}

function renderApp(): void {
  app.innerHTML = `
<div class="shell">
<header class="topbar"><div class="brand"><div class="logo">C</div><div><h1>Codex Config Studio</h1><p>${t('app.subtitle')}</p></div></div><div class="top-actions"><label class="language-picker"><span>${t('language.label')}</span><select id="languageSelect">${localeOptions.map(x=>`<option value="${x.value}" ${x.value===getLocale()?'selected':''}>${x.label}</option>`).join('')}</select></label><span id="saveState" class="status-pill"><i></i></span><button id="reloadBtn" class="button ghost">${t('action.reload')}</button></div></header>
<main class="content">
<section class="scope-panel card"><div class="section-heading"><div><span class="eyebrow">${t('section.scope.eyebrow')}</span><h2>${t('section.scope.title')}</h2></div><div class="segmented"><button class="scope-tab active" data-scope="global">${t('scope.global')}</button><button class="scope-tab" data-scope="project">${t('scope.project')}</button></div></div><div class="scope-body"><div><div class="scope-title" id="scopeTitle">${t('scope.globalConfig')}</div><div class="path" id="configPath">~/.codex/config.toml</div></div><div id="projectPicker" class="project-picker hidden"><input id="projectPath" placeholder="${t('scope.projectPlaceholder')}" value="${esc(projectPath)}"><button id="chooseProject" class="button secondary">${t('scope.chooseFolder')}</button></div></div><div id="projectNotice" class="notice hidden">${t('scope.notice')}</div></section>
<section class="presets-section"><div class="section-heading compact"><div><span class="eyebrow">${t('section.preset.eyebrow')}</span><h2>${t('section.preset.title')}</h2></div><span class="muted">${t('section.preset.hint')}</span></div><div id="presetGrid" class="preset-grid"></div></section>
<section class="editor-grid"><div class="card config-card"><div class="section-heading compact"><div><span class="eyebrow">${t('section.custom.eyebrow')}</span><h2>${t('section.custom.title')}</h2></div><button id="resetPresetBtn" class="text-button">${t('action.resetPreset')}</button></div><div class="form-grid">
${field('model',t('field.model'),t('field.model.help'),`<input id="model" list="modelList"><datalist id="modelList">${models.map(x=>`<option value="${x}">`).join('')}</datalist>`)}
${field('modelReasoningEffort',t('field.reasoning'),t('field.reasoning.help'),inputList('modelReasoningEffort','effortList'))}
${field('planModeReasoningEffort',t('field.planReasoning'),t('field.planReasoning.help'),inputList('planModeReasoningEffort','effortList'))}
${field('agentsEnabled',t('field.agents'),t('field.agents.help'),`<select id="agentsEnabled"><option value="">${t('option.inherit')}</option><option value="true">${t('option.enabled')}</option><option value="false">${t('option.disabled')}</option></select>`)}
${field('defaultSubagentModel',t('field.subagentModel'),t('field.subagentModel.help'),`<input id="defaultSubagentModel" list="modelList" placeholder="${t('option.inherit')}">`)}
${field('defaultSubagentReasoningEffort',t('field.subagentReasoning'),t('field.subagentReasoning.help'),inputList('defaultSubagentReasoningEffort','effortList'))}
${field('maxConcurrentThreadsPerSession',t('field.maxConcurrent'),t('field.maxConcurrent.help'),`<input id="maxConcurrentThreadsPerSession" type="number" min="1" max="16" placeholder="${t('option.inherit')}">`)}
</div></div>
<aside class="card summary-card"><div class="section-heading compact"><div><span class="eyebrow">${t('section.preview.eyebrow')}</span><h2>${t('section.preview.title')}</h2></div></div><div id="preview" class="preview"></div><div class="divider"></div><div class="backup-info"><div><strong>${t('backup.title')}</strong><span>${t('backup.description')}</span></div><span id="backupBadge" class="mini-badge">${t('backup.missing')}</span></div><div class="action-stack"><button id="applyBtn" class="button primary wide">${t('action.apply')}</button><button id="clearBtn" class="button secondary wide">${t('action.clear')}</button><button id="restoreBtn" class="button danger-ghost wide">${t('action.restore')}</button></div></aside></section>
</main><datalist id="effortList">${efforts.map(x=>`<option value="${x}">`).join('')}</datalist><div id="toast" class="toast"></div></div>`;
  bindEvents();
  renderPresets();
  sync();
  setStatus(currentStatus.key, currentStatus.ok);
  if (lastSnapshot) $('#backupBadge').textContent = lastSnapshot.originalBackupExists ? t('backup.exists') : t('backup.missing');
}

function requestScope(){return {kind:scope,projectPath:scope==='project'?(projectPath||null):null};}
function projectConfigDisplayPath(){
  if(!projectPath) return t('scope.selectProject');
  const clean=projectPath.replace(/[\\/]+$/,'');
  const sep=clean.includes('\\')?'\\':'/';
  return `${clean}${sep}.codex${sep}config.toml`;
}
function setStatus(key:StatusKey,ok=true){
  currentStatus={key,ok};
  const e=$<HTMLSpanElement>('#saveState');
  e.className=`status-pill ${ok?'ok':'warn'}`;
  e.innerHTML=`<i></i>${t(key)}`;
}
function toast(text:string,error=false){const e=$<HTMLDivElement>('#toast');e.textContent=text;e.className=`toast show ${error?'error':''}`;setTimeout(()=>e.className='toast',2400);}
function renderPresets(){
  const g=$<HTMLDivElement>('#presetGrid');
  g.innerHTML=presets.map(p=>`<button class="preset-card ${activePreset===p.id?'selected':''}" data-preset="${p.id}"><div class="preset-top"><strong>${presetText(p.id,'name')}</strong><span>${presetText(p.id,'badge')}</span></div><p>${presetText(p.id,'description')}</p><small>${presetText(p.id,'usage')}</small></button>`).join('');
  g.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(b=>b.onclick=()=>{const p=presets.find(x=>x.id===b.dataset.preset)!;activePreset=p.id;values=structuredClone(p.values);overrides=new Set(scope==='project'?fields.filter(f=>p.values[f]!==null):fields);sync();renderPresets();});
}
function sync(){
  fields.forEach(f=>{const input=$<HTMLInputElement|HTMLSelectElement>(`#${f}`);const enabled=scope!=='project'||overrides.has(f);input.disabled=!enabled;const v=values[f];input.value=v===null?'':String(v);const toggle=document.querySelector<HTMLInputElement>(`[data-override="${f}"]`);if(toggle)toggle.checked=enabled;});
  renderPreview();
  $('.scope-tab[data-scope="global"]').classList.toggle('active',scope==='global');
  $('.scope-tab[data-scope="project"]').classList.toggle('active',scope==='project');
  $('#projectPicker').classList.toggle('hidden',scope!=='project');
  $('#projectNotice').classList.toggle('hidden',scope!=='project');
  $('#scopeTitle').textContent=scope==='global'?t('scope.globalConfig'):t('scope.projectConfig');
  $('#configPath').textContent=scope==='global'?'~/.codex/config.toml':projectConfigDisplayPath();
  document.querySelectorAll<HTMLElement>('[data-wrap]').forEach(x=>x.classList.toggle('hidden',scope!=='project'));
}
function readForm(){
  const val=(f:Field)=>$<HTMLInputElement|HTMLSelectElement>(`#${f}`).value;
  values={model:val('model').trim()||null,modelReasoningEffort:val('modelReasoningEffort')||null,planModeReasoningEffort:val('planModeReasoningEffort')||null,agentsEnabled:val('agentsEnabled')===''?null:val('agentsEnabled')==='true',defaultSubagentModel:val('defaultSubagentModel').trim()||null,defaultSubagentReasoningEffort:val('defaultSubagentReasoningEffort')||null,maxConcurrentThreadsPerSession:val('maxConcurrentThreadsPerSession')===''?null:Number(val('maxConcurrentThreadsPerSession'))};
  if(scope==='project')fields.forEach(f=>{if(!overrides.has(f))values[f]=null as never;});
}
function renderPreview(){
  const labels:Record<Field,string>={model:t('preview.model'),modelReasoningEffort:t('preview.reasoning'),planModeReasoningEffort:t('preview.planReasoning'),agentsEnabled:t('preview.agents'),defaultSubagentModel:t('preview.subagentModel'),defaultSubagentReasoningEffort:t('preview.subagentReasoning'),maxConcurrentThreadsPerSession:t('preview.maxConcurrent')};
  $('#preview').innerHTML=fields.map(f=>{if(scope==='project'&&!overrides.has(f))return `<div class="preview-row"><span>${labels[f]}</span><strong class="inherit">${t('preview.inherit')}</strong></div>`;let v:unknown=values[f]??'—';if(typeof v==='boolean')v=v?t('option.enabled'):t('option.disabled');return `<div class="preview-row"><span>${labels[f]}</span><strong>${esc(String(v))}</strong></div>`;}).join('');
}
function applySnapshot(s:ConfigSnapshot){
  lastSnapshot=s;
  values=structuredClone(s.values);
  overrides=new Set(scope==='project'?fields.filter(f=>s.values[f]!==null):fields);
  const match=presets.find(p=>fields.every(f=>p.values[f]===s.values[f]));
  activePreset=match?.id??'';
  $('#configPath').textContent=s.path;
  $('#backupBadge').textContent=s.originalBackupExists?t('backup.exists'):t('backup.missing');
  setStatus(s.exists?'status.read':'status.missing',true);
  renderPresets();
  sync();
}
async function load(){
  if(scope==='project'&&!projectPath){setStatus('status.selectProject',false);return;}
  try{setStatus('status.reading',true);applySnapshot(await invoke<ConfigSnapshot>('read_config',{scope:requestScope()}));}
  catch(e){setStatus('status.readFailed',false);toast(String(e),true);}
}
async function apply(){
  readForm();
  const n=values.maxConcurrentThreadsPerSession;
  if(n!==null&&(n<1||n>16)){toast(t('toast.concurrentRange'),true);return;}
  try{applySnapshot(await invoke<ConfigSnapshot>('apply_config',{scope:requestScope(),values}));toast(t('toast.applied'));}
  catch(e){toast(String(e),true);}
}
async function clearManaged(){
  if(!confirm(scope==='project'?t('confirm.clearProject'):t('confirm.clearGlobal')))return;
  try{applySnapshot(await invoke<ConfigSnapshot>('clear_managed_config',{scope:requestScope()}));toast(t('toast.cleared'));}
  catch(e){toast(String(e),true);}
}
async function restore(){
  if(!confirm(t('confirm.restore')))return;
  try{applySnapshot(await invoke<ConfigSnapshot>('restore_original',{scope:requestScope()}));toast(t('toast.restored'));}
  catch(e){toast(String(e),true);}
}

function bindEvents(): void {
  $<HTMLSelectElement>('#languageSelect').addEventListener('change',e=>{
    readForm();
    setLocale((e.currentTarget as HTMLSelectElement).value as Locale);
    document.documentElement.lang=getLocale();
    renderApp();
  });
  document.querySelectorAll<HTMLButtonElement>('.scope-tab').forEach(b=>b.onclick=async()=>{scope=b.dataset.scope as ScopeKind;sync();if(scope==='global'||projectPath)await load();});
  $('#chooseProject').addEventListener('click',async()=>{const p=await open({directory:true,multiple:false,title:t('scope.dialogTitle')});if(typeof p==='string'){projectPath=p;$<HTMLInputElement>('#projectPath').value=p;sync();await load();}});
  $<HTMLInputElement>('#projectPath').onchange=async e=>{projectPath=(e.currentTarget as HTMLInputElement).value.trim();sync();if(projectPath)await load();};
  fields.forEach(f=>{$<HTMLInputElement|HTMLSelectElement>(`#${f}`).addEventListener('input',()=>{readForm();renderPreview();});document.querySelector<HTMLInputElement>(`[data-override="${f}"]`)?.addEventListener('change',e=>{const toggle=e.currentTarget as HTMLInputElement;toggle.checked?overrides.add(f):overrides.delete(f);sync();});});
  $('#resetPresetBtn').addEventListener('click',()=>{const p=presets.find(x=>x.id===activePreset)??presets[2];activePreset=p.id;values=structuredClone(p.values);overrides=new Set(scope==='project'?fields.filter(f=>p.values[f]!==null):fields);sync();toast(t('toast.resetPreset',{name:presetText(p.id,'name')}));});
  $('#reloadBtn').addEventListener('click',load);
  $('#applyBtn').addEventListener('click',apply);
  $('#clearBtn').addEventListener('click',clearManaged);
  $('#restoreBtn').addEventListener('click',restore);
}

document.documentElement.lang=getLocale();
renderApp();
load();
