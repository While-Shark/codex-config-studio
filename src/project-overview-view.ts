import { icon } from './ui/icons';
import {
  formatTokens,
  overviewText,
  projectNameFromPath,
  summarizeProjectOverview,
  topModelLabel,
  type ProjectsUsageOverviewReport,
  type RecentProject,
} from './project-overview';

export type ProjectOverviewViewOptions = {
  locale: string;
  recent: RecentProject[];
  report: ProjectsUsageOverviewReport | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onOpenProject: (path:string) => void;
};

const esc=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const key=(value:string)=>value.trim().replace(/[\\/]+$/,'').replace(/\\/g,'/').toLocaleLowerCase();

function formatDate(ms:number,locale:string):string {
  try{return new Intl.DateTimeFormat(locale,{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(ms));}
  catch{return new Date(ms).toLocaleString();}
}

export function renderProjectOverviewView(host:HTMLElement,options:ProjectOverviewViewOptions):void {
  const copy=overviewText(options.locale);
  const head='<div class="section-heading"><div><h2>'+esc(copy.title)+'</h2><p>'+esc(copy.subtitle)+'</p></div><button id="refreshOverview" class="button secondary">'+esc(copy.refresh)+'</button></div>';

  if(options.loading){
    host.innerHTML='<section class="overview-workspace">'+head+'<div class="empty-state">'+esc(copy.loading)+'</div></section>';
    bind(host,options);return;
  }
  if(options.error){
    host.innerHTML='<section class="overview-workspace">'+head+'<div class="usage-warning">'+esc(options.error)+'</div></section>';
    bind(host,options);return;
  }
  if(options.recent.length===0){
    host.innerHTML='<section class="overview-workspace">'+head+'<div class="empty-state">'+esc(copy.empty)+'</div><p class="readonly-safety">'+icon('info')+'<span>'+esc(copy.historyHint)+'</span></p></section>';
    bind(host,options);return;
  }

  const byPath=new Map((options.report?.projects??[]).map(project=>[key(project.projectPath),project]));
  const summary=options.report?summarizeProjectOverview(options.report):{projects:options.recent.length,activeProjects:0,sessions:0,reroutes:0,totalTokens:0};
  const metrics=[
    [copy.projects,String(summary.projects),copy.recentProjects],
    [copy.activeProjects,String(summary.activeProjects),copy.sevenDayUsage],
    [copy.totalTokens,formatTokens(summary.totalTokens),copy.sevenDayUsage],
    [copy.sessions,String(summary.sessions),copy.reroutes+' '+summary.reroutes],
  ];
  const cards=options.recent.map(recent=>{
    const project=byPath.get(key(recent.path));
    const available=project?.available??false;
    const usage=project?.usage.totalTokens??0;
    const sessions=project?.sessions??0;
    const reroutes=project?.reroutes??0;
    return '<article class="overview-project '+(!available?'unavailable':'')+'">'+
      '<div class="overview-project-head"><div><strong>'+esc(projectNameFromPath(recent.path))+'</strong><small>'+esc(recent.path)+'</small></div>'+
      (!available?'<span class="overview-badge warn">'+esc(copy.unavailable)+'</span>':'<span class="overview-badge">'+esc(copy.sevenDayUsage)+'</span>')+'</div>'+
      '<div class="overview-project-metrics"><div><span>'+esc(copy.totalTokens)+'</span><strong>'+esc(formatTokens(usage))+'</strong></div>'+
      '<div><span>'+esc(copy.sessions)+'</span><strong>'+sessions+'</strong></div>'+
      '<div><span>'+esc(copy.reroutes)+'</span><strong>'+reroutes+'</strong></div></div>'+
      '<div class="overview-project-detail"><p><span>'+esc(copy.topModel)+'</span><code>'+esc(project?topModelLabel(project):'—')+'</code></p>'+
      '<p><span>'+esc(copy.lastConfig)+'</span><code>'+esc((recent.model??'—')+(recent.reasoning?' · '+recent.reasoning:''))+'</code></p>'+
      '<small>'+esc(formatDate(recent.lastTimestampMs,options.locale))+'</small></div>'+
      '<button class="button secondary overview-open" data-open-project="'+esc(recent.path)+'" '+(!available?'disabled':'')+'>'+esc(copy.openUsage)+'</button>'+
    '</article>';
  }).join('');

  const warnings:string[]=[];
  if(options.report?.truncated)warnings.push(copy.scanWarning);
  if(options.report?.parseErrors)warnings.push(copy.parseWarning+' '+options.report.parseErrors);

  host.innerHTML='<section class="overview-workspace">'+head+
    warnings.map(w=>'<div class="usage-warning">'+esc(w)+'</div>').join('')+
    '<div class="overview-metrics">'+metrics.map(([label,value,note])=>'<div class="usage-metric"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><small>'+esc(note)+'</small></div>').join('')+'</div>'+
    '<section class="overview-section"><div class="overview-section-head"><h3>'+esc(copy.recentProjects)+'</h3>'+(options.report?'<span>'+options.report.filesScanned+' '+esc(copy.files)+'</span>':'')+'</div>'+
    '<div class="overview-grid">'+cards+'</div></section>'+
    '<p class="readonly-safety">'+icon('info')+'<span>'+esc(copy.historyHint)+'</span></p></section>';
  bind(host,options);
}

function bind(host:HTMLElement,options:ProjectOverviewViewOptions):void {
  host.querySelector<HTMLButtonElement>('#refreshOverview')?.addEventListener('click',options.onRefresh);
  host.querySelectorAll<HTMLButtonElement>('[data-open-project]').forEach(button=>button.addEventListener('click',()=>{
    const path=button.dataset.openProject;if(path)options.onOpenProject(path);
  }));
}
