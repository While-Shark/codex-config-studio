import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
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
type Preset = { id: string; name: string; badge: string; description: string; usage: string; values: ManagedConfig };
type Field = keyof ManagedConfig;

const fields: Field[] = ['model','modelReasoningEffort','planModeReasoningEffort','agentsEnabled','defaultSubagentModel','defaultSubagentReasoningEffort','maxConcurrentThreadsPerSession'];
const models = ['gpt-6-astra','gpt-5.6-sol','gpt-5.6-terra','gpt-5.6-luna'];
const efforts = ['low','medium','high','xhigh','ultra','persistent','max'];
const presets: Preset[] = [
  { id:'token-save', name:'极省 Token', badge:'最低消耗', description:'Luna + low，不启用子 Agent。', usage:'小修改、明确任务、批量替换。', values:{model:'gpt-5.6-luna',modelReasoningEffort:'low',planModeReasoningEffort:'medium',agentsEnabled:false,defaultSubagentModel:null,defaultSubagentReasoningEffort:null,maxConcurrentThreadsPerSession:null}},
  { id:'economy', name:'经济', badge:'便宜稳定', description:'Luna + medium，减少返工。', usage:'普通 CRUD、前端改动、明确接口开发。', values:{model:'gpt-5.6-luna',modelReasoningEffort:'medium',planModeReasoningEffort:'high',agentsEnabled:false,defaultSubagentModel:null,defaultSubagentReasoningEffort:null,maxConcurrentThreadsPerSession:null}},
  { id:'daily', name:'默认 / 日常', badge:'推荐', description:'Terra 主力 + Luna 子 Agent。', usage:'大多数日常项目开发。', values:{model:'gpt-5.6-terra',modelReasoningEffort:'medium',planModeReasoningEffort:'high',agentsEnabled:true,defaultSubagentModel:'gpt-5.6-luna',defaultSubagentReasoningEffort:'medium',maxConcurrentThreadsPerSession:2}},
  { id:'balanced', name:'均衡', badge:'复杂开发', description:'Sol 主导 + Luna 执行。', usage:'跨文件功能、常规重构、联调。', values:{model:'gpt-5.6-sol',modelReasoningEffort:'medium',planModeReasoningEffort:'high',agentsEnabled:true,defaultSubagentModel:'gpt-5.6-luna',defaultSubagentReasoningEffort:'medium',maxConcurrentThreadsPerSession:2}},
  { id:'astra', name:'Astra 总指挥', badge:'高质量', description:'Astra 规划/Review，Luna 执行。', usage:'大功能、架构调整、复杂项目。', values:{model:'gpt-6-astra',modelReasoningEffort:'medium',planModeReasoningEffort:'high',agentsEnabled:true,defaultSubagentModel:'gpt-5.6-luna',defaultSubagentReasoningEffort:'medium',maxConcurrentThreadsPerSession:2}},
  { id:'max', name:'极致', badge:'疑难任务', description:'Astra xhigh + 高强度 Luna。', usage:'疑难 Bug、大重构、上线前 Review。', values:{model:'gpt-6-astra',modelReasoningEffort:'xhigh',planModeReasoningEffort:'xhigh',agentsEnabled:true,defaultSubagentModel:'gpt-5.6-luna',defaultSubagentReasoningEffort:'high',maxConcurrentThreadsPerSession:3}},
];

let scope: ScopeKind = 'global';
let projectPath = '';
let activePreset = 'daily';
let values = structuredClone(presets[2].values);
let overrides = new Set<Field>(fields);

const $ = <T extends Element>(s:string) => document.querySelector<T>(s)!;
const esc = (v:string) => v.replace(/[&<>"']/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!));
const app = $('#app');
app.innerHTML = `
<div class="shell">
<header class="topbar"><div class="brand"><div class="logo">C</div><div><h1>Codex Config Studio</h1><p>全局与项目级模型方案管理器</p></div></div><div class="top-actions"><span id="saveState" class="status-pill"><i></i> 未读取</span><button id="reloadBtn" class="button ghost">重新读取</button></div></header>
<main class="content">
<section class="scope-panel card"><div class="section-heading"><div><span class="eyebrow">01 / 作用域</span><h2>这次配置应用在哪里？</h2></div><div class="segmented"><button class="scope-tab active" data-scope="global">全局</button><button class="scope-tab" data-scope="project">项目</button></div></div><div class="scope-body"><div><div class="scope-title" id="scopeTitle">全局配置</div><div class="path" id="configPath">~/.codex/config.toml</div></div><div id="projectPicker" class="project-picker hidden"><input id="projectPath" placeholder="选择项目根目录"><button id="chooseProject" class="button secondary">选择目录</button></div></div><div id="projectNotice" class="notice hidden">项目配置优先于 Profile 和全局配置，但 Codex 只会加载受信任项目的 <code>.codex/config.toml</code>。</div></section>
<section class="presets-section"><div class="section-heading compact"><div><span class="eyebrow">02 / 方案</span><h2>选择工作模式</h2></div><span class="muted">选完仍可在下方自由修改</span></div><div id="presetGrid" class="preset-grid"></div></section>
<section class="editor-grid"><div class="card config-card"><div class="section-heading compact"><div><span class="eyebrow">03 / 自定义</span><h2>配置细节</h2></div><button id="resetPresetBtn" class="text-button">恢复方案默认值</button></div><div class="form-grid">
${field('model','主模型','当前会话默认模型',`<input id="model" list="modelList"><datalist id="modelList">${models.map(x=>`<option value="${x}">`).join('')}</datalist>`)}
${field('modelReasoningEffort','主模型思考等级','普通执行时的 reasoning effort',inputList('modelReasoningEffort','effortList'))}
${field('planModeReasoningEffort','Plan Mode 思考等级','规划阶段可以单独提高推理强度',inputList('planModeReasoningEffort','effortList'))}
${field('agentsEnabled','子 Agent','是否允许主 Agent 委派子任务',`<select id="agentsEnabled"><option value="">未设置 / 继承</option><option value="true">启用</option><option value="false">关闭</option></select>`)}
${field('defaultSubagentModel','默认子 Agent 模型','执行型任务默认交给哪个模型',`<input id="defaultSubagentModel" list="modelList">`)}
${field('defaultSubagentReasoningEffort','子 Agent 思考等级','执行工作通常 medium 足够',inputList('defaultSubagentReasoningEffort','effortList'))}
${field('maxConcurrentThreadsPerSession','最大并发子 Agent','建议 1–3，过高会重复读取上下文',`<input id="maxConcurrentThreadsPerSession" type="number" min="1" max="16">`)}
</div></div>
<aside class="card summary-card"><div class="section-heading compact"><div><span class="eyebrow">04 / 写入预览</span><h2>即将应用</h2></div></div><div id="preview" class="preview"></div><div class="divider"></div><div class="backup-info"><div><strong>安全备份</strong><span>首次修改保存原始副本，每次写入额外留历史备份。</span></div><span id="backupBadge" class="mini-badge">未建立</span></div><div class="action-stack"><button id="applyBtn" class="button primary wide">应用到当前作用域</button><button id="clearBtn" class="button secondary wide">清除本工具管理项</button><button id="restoreBtn" class="button danger-ghost wide">恢复首次接管前的原始配置</button></div></aside></section>
</main><datalist id="effortList">${efforts.map(x=>`<option value="${x}">`).join('')}</datalist><div id="toast" class="toast"></div></div>`;

function field(id:Field,title:string,help:string,control:string){return `<label class="field"><div class="field-copy"><span>${title}</span><small>${help}</small></div><div class="field-control"><label class="override-toggle hidden" data-wrap="${id}"><input type="checkbox" data-override="${id}" checked><span>项目覆盖</span></label>${control}</div></label>`}
function inputList(id:string,list:string){return `<input id="${id}" list="${list}" placeholder="未设置 / 继承">`}
function requestScope(){return {kind:scope,projectPath:scope==='project'?(projectPath||null):null}}
function projectConfigDisplayPath(){
  if(!projectPath) return '请选择项目目录';
  const clean=projectPath.replace(/[\\/]+$/,'');
  const sep=clean.includes('\\')?'\\':'/';
  return `${clean}${sep}.codex${sep}config.toml`;
}
function status(text:string,ok=true){const e=$<HTMLSpanElement>('#saveState');e.className=`status-pill ${ok?'ok':'warn'}`;e.innerHTML=`<i></i>${text}`}
function toast(text:string,error=false){const e=$<HTMLDivElement>('#toast');e.textContent=text;e.className=`toast show ${error?'error':''}`;setTimeout(()=>e.className='toast',2400)}
function renderPresets(){const g=$<HTMLDivElement>('#presetGrid');g.innerHTML=presets.map(p=>`<button class="preset-card ${activePreset===p.id?'selected':''}" data-preset="${p.id}"><div class="preset-top"><strong>${p.name}</strong><span>${p.badge}</span></div><p>${p.description}</p><small>${p.usage}</small></button>`).join('');g.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(b=>b.onclick=()=>{const p=presets.find(x=>x.id===b.dataset.preset)!;activePreset=p.id;values=structuredClone(p.values);overrides=new Set(scope==='project'?fields.filter(f=>p.values[f]!==null):fields);sync();renderPresets()})}
function sync(){fields.forEach(f=>{const input=$<HTMLInputElement|HTMLSelectElement>(`#${f}`);const enabled=scope!=='project'||overrides.has(f);input.disabled=!enabled;const v=values[f];input.value=v===null?'':String(v);const t=document.querySelector<HTMLInputElement>(`[data-override="${f}"]`);if(t)t.checked=enabled});renderPreview();$('.scope-tab[data-scope="global"]').classList.toggle('active',scope==='global');$('.scope-tab[data-scope="project"]').classList.toggle('active',scope==='project');$('#projectPicker').classList.toggle('hidden',scope!=='project');$('#projectNotice').classList.toggle('hidden',scope!=='project');$('#scopeTitle').textContent=scope==='global'?'全局配置':'项目配置';$('#configPath').textContent=scope==='global'?'~/.codex/config.toml':projectConfigDisplayPath();document.querySelectorAll<HTMLElement>('[data-wrap]').forEach(x=>x.classList.toggle('hidden',scope!=='project'))}
function readForm(){const val=(f:Field)=>$<HTMLInputElement|HTMLSelectElement>(`#${f}`).value;values={model:val('model').trim()||null,modelReasoningEffort:val('modelReasoningEffort')||null,planModeReasoningEffort:val('planModeReasoningEffort')||null,agentsEnabled:val('agentsEnabled')===''?null:val('agentsEnabled')==='true',defaultSubagentModel:val('defaultSubagentModel').trim()||null,defaultSubagentReasoningEffort:val('defaultSubagentReasoningEffort')||null,maxConcurrentThreadsPerSession:val('maxConcurrentThreadsPerSession')===''?null:Number(val('maxConcurrentThreadsPerSession'))};if(scope==='project')fields.forEach(f=>{if(!overrides.has(f))values[f]=null as never})}
function renderPreview(){const labels:Record<Field,string>={model:'主模型',modelReasoningEffort:'思考等级',planModeReasoningEffort:'Plan Mode',agentsEnabled:'子 Agent',defaultSubagentModel:'子 Agent 模型',defaultSubagentReasoningEffort:'子 Agent 思考',maxConcurrentThreadsPerSession:'最大并发'};$('#preview').innerHTML=fields.map(f=>{if(scope==='project'&&!overrides.has(f))return `<div class="preview-row"><span>${labels[f]}</span><strong class="inherit">继承下层</strong></div>`;let v:any=values[f]??'—';if(typeof v==='boolean')v=v?'启用':'关闭';return `<div class="preview-row"><span>${labels[f]}</span><strong>${esc(String(v))}</strong></div>`}).join('')}
function applySnapshot(s:ConfigSnapshot){values=structuredClone(s.values);overrides=new Set(scope==='project'?fields.filter(f=>s.values[f]!==null):fields);const match=presets.find(p=>fields.every(f=>p.values[f]===s.values[f]));activePreset=match?.id??'';$('#configPath').textContent=s.path;$('#backupBadge').textContent=s.originalBackupExists?'已建立':'未建立';status(s.exists?'已读取配置':'配置尚不存在');renderPresets();sync()}
async function load(){if(scope==='project'&&!projectPath){status('请选择项目目录',false);return}try{status('正在读取…');applySnapshot(await invoke<ConfigSnapshot>('read_config',{scope:requestScope()}))}catch(e){status('读取失败',false);toast(String(e),true)}}
async function apply(){readForm();const n=values.maxConcurrentThreadsPerSession;if(n!==null&&(n<1||n>16)){toast('最大并发必须在 1–16 之间',true);return}try{applySnapshot(await invoke<ConfigSnapshot>('apply_config',{scope:requestScope(),values}));toast('配置已应用')}catch(e){toast(String(e),true)}}
async function clearManaged(){if(!confirm(scope==='project'?'将清除项目覆盖并继承下层配置，继续吗？':'将删除本工具管理的模型/Agent 键，继续吗？'))return;try{applySnapshot(await invoke<ConfigSnapshot>('clear_managed_config',{scope:requestScope()}));toast('已清除管理项')}catch(e){toast(String(e),true)}}
async function restore(){if(!confirm('恢复首次被本应用修改前的原始配置？当前文件会先进入历史备份。'))return;try{applySnapshot(await invoke<ConfigSnapshot>('restore_original',{scope:requestScope()}));toast('已恢复原始配置')}catch(e){toast(String(e),true)}}

document.querySelectorAll<HTMLButtonElement>('.scope-tab').forEach(b=>b.onclick=async()=>{scope=b.dataset.scope as ScopeKind;sync();if(scope==='global'||projectPath)await load()});
$('#chooseProject').addEventListener('click',async()=>{const p=await open({directory:true,multiple:false,title:'选择 Codex 项目根目录'});if(typeof p==='string'){projectPath=p;$<HTMLInputElement>('#projectPath').value=p;sync();await load()}});
$<HTMLInputElement>('#projectPath').onchange=async e=>{projectPath=(e.currentTarget as HTMLInputElement).value.trim();sync();if(projectPath)await load()};
fields.forEach(f=>{$<HTMLInputElement|HTMLSelectElement>(`#${f}`).addEventListener('input',()=>{readForm();renderPreview()});document.querySelector<HTMLInputElement>(`[data-override="${f}"]`)?.addEventListener('change',e=>{const t=e.currentTarget as HTMLInputElement;t.checked?overrides.add(f):overrides.delete(f);sync()})});
$('#resetPresetBtn').addEventListener('click',()=>{const p=presets.find(x=>x.id===activePreset)??presets[2];activePreset=p.id;values=structuredClone(p.values);overrides=new Set(scope==='project'?fields.filter(f=>p.values[f]!==null):fields);sync();toast(`已恢复“${p.name}”默认值，尚未写入`)});
$('#reloadBtn').addEventListener('click',load);$('#applyBtn').addEventListener('click',apply);$('#clearBtn').addEventListener('click',clearManaged);$('#restoreBtn').addEventListener('click',restore);
renderPresets();sync();load();
