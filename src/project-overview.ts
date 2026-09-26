import { formatTokens, type ModelUsage, type UsageTokens } from './usage-dashboard';

export type ProjectUsageOverview = {
  projectPath: string;
  available: boolean;
  sessions: number;
  turns: number;
  responses: number;
  usage: UsageTokens;
  models: ModelUsage[];
  reroutes: number;
};

export type ProjectsUsageOverviewReport = {
  source: string;
  projects: ProjectUsageOverview[];
  filesScanned: number;
  parseErrors: number;
  skippedLargeFiles: number;
  truncated: boolean;
};

export type ProjectHistoryLike = {
  timestampMs: number;
  scopeKind: 'global' | 'project';
  projectPath: string | null;
  values: { model: string | null; modelReasoningEffort: string | null };
};

export type RecentProject = {
  path: string;
  lastTimestampMs: number;
  model: string | null;
  reasoning: string | null;
};

export type OverviewSummary = {
  projects: number;
  activeProjects: number;
  sessions: number;
  reroutes: number;
  totalTokens: number;
};

export type OverviewCopy = {
  tab: string;
  title: string;
  subtitle: string;
  loading: string;
  empty: string;
  refresh: string;
  sevenDayUsage: string;
  recentProjects: string;
  projects: string;
  activeProjects: string;
  sessions: string;
  reroutes: string;
  totalTokens: string;
  lastConfig: string;
  topModel: string;
  unavailable: string;
  openUsage: string;
  files: string;
  scanWarning: string;
  parseWarning: string;
  historyHint: string;
};

const copies: Record<string, OverviewCopy> = {
  en: {
    tab:'Overview',title:'Project overview',subtitle:'Recent Codex projects with a single-scan 7-day usage summary.',
    loading:'Reading recent projects and local Codex usage…',empty:'No project history is available yet.',refresh:'Refresh',
    sevenDayUsage:'Last 7 days',recentProjects:'Recent projects',projects:'Known projects',activeProjects:'With usage',sessions:'Sessions',
    reroutes:'Observed reroutes',totalTokens:'Total tokens',lastConfig:'Last recorded config',topModel:'Top model',unavailable:'Project path unavailable',
    openUsage:'Open usage',files:'rollout files scanned',scanWarning:'The rollout scan hit its safety limit; older data may be omitted.',
    parseWarning:'Some rollout records could not be parsed.',historyHint:'Projects are discovered from Config Studio history. Usage is read-only local Codex telemetry.',
  },
  'zh-CN': {
    tab:'总览',title:'项目总览',subtitle:'基于最近项目历史，一次扫描汇总最近 7 天 Codex 用量。',
    loading:'正在读取最近项目和本机 Codex 用量…',empty:'还没有可用于总览的项目历史。',refresh:'刷新',
    sevenDayUsage:'最近 7 天',recentProjects:'最近项目',projects:'已记录项目',activeProjects:'有用量项目',sessions:'会话',
    reroutes:'可观测路由',totalTokens:'总 Token',lastConfig:'最近记录配置',topModel:'主要模型',unavailable:'项目路径当前不可用',
    openUsage:'打开用量',files:'个 rollout 文件已扫描',scanWarning:'rollout 扫描达到安全上限，较旧数据可能未纳入。',
    parseWarning:'部分 rollout 记录无法解析。',historyHint:'项目来源于 Config Studio 历史记录；用量来自本机 Codex 只读遥测。',
  },
  'zh-TW': {
    tab:'總覽',title:'專案總覽',subtitle:'依最近專案歷史，一次掃描彙總最近 7 天 Codex 用量。',
    loading:'正在讀取最近專案和本機 Codex 用量…',empty:'目前沒有可用於總覽的專案歷史。',refresh:'重新整理',
    sevenDayUsage:'最近 7 天',recentProjects:'最近專案',projects:'已記錄專案',activeProjects:'有用量專案',sessions:'工作階段',
    reroutes:'可觀測路由',totalTokens:'總 Token',lastConfig:'最近記錄設定',topModel:'主要模型',unavailable:'專案路徑目前不可用',
    openUsage:'開啟用量',files:'個 rollout 檔案已掃描',scanWarning:'rollout 掃描達到安全上限，較舊資料可能未納入。',
    parseWarning:'部分 rollout 記錄無法解析。',historyHint:'專案來自 Config Studio 歷史記錄；用量來自本機 Codex 唯讀遙測。',
  },
  ja: {
    tab:'概要',title:'プロジェクト概要',subtitle:'最近のプロジェクト履歴を基に、直近7日間の Codex 使用量を1回の走査で集計します。',
    loading:'最近のプロジェクトとローカル Codex 使用量を読み込み中…',empty:'概要に表示できるプロジェクト履歴がまだありません。',refresh:'更新',
    sevenDayUsage:'直近7日',recentProjects:'最近のプロジェクト',projects:'記録済みプロジェクト',activeProjects:'使用量あり',sessions:'セッション',
    reroutes:'観測 reroute',totalTokens:'総 Token',lastConfig:'最後に記録した設定',topModel:'主要モデル',unavailable:'プロジェクトパスを利用できません',
    openUsage:'使用量を開く',files:' rollout ファイルを走査',scanWarning:'走査が安全上限に達したため、古いデータが省略されている可能性があります。',
    parseWarning:'一部の rollout 記録を解析できませんでした。',historyHint:'プロジェクトは Config Studio の履歴から検出し、使用量はローカル Codex の読み取り専用テレメトリです。',
  },
  ko: {
    tab:'개요',title:'프로젝트 개요',subtitle:'최근 프로젝트 기록을 기준으로 최근 7일 Codex 사용량을 한 번의 스캔으로 집계합니다.',
    loading:'최근 프로젝트와 로컬 Codex 사용량을 읽는 중…',empty:'개요에 표시할 프로젝트 기록이 아직 없습니다.',refresh:'새로고침',
    sevenDayUsage:'최근 7일',recentProjects:'최근 프로젝트',projects:'기록된 프로젝트',activeProjects:'사용량 있음',sessions:'세션',
    reroutes:'관찰된 reroute',totalTokens:'총 Token',lastConfig:'최근 기록 설정',topModel:'주요 모델',unavailable:'프로젝트 경로를 사용할 수 없음',
    openUsage:'사용량 열기',files:'개 rollout 파일 스캔',scanWarning:'rollout 스캔이 안전 한도에 도달해 오래된 데이터가 누락될 수 있습니다.',
    parseWarning:'일부 rollout 기록을 파싱하지 못했습니다.',historyHint:'프로젝트는 Config Studio 기록에서 찾고 사용량은 로컬 Codex 읽기 전용 텔레메트리에서 가져옵니다.',
  },
};

export function overviewText(locale:string):OverviewCopy { return copies[locale] ?? copies.en; }

export function recentProjectsFromHistory(entries: readonly ProjectHistoryLike[], limit=12): RecentProject[] {
  const map=new Map<string,RecentProject>();
  for(const entry of entries){
    if(entry.scopeKind!=='project'||!entry.projectPath)continue;
    const path=entry.projectPath.trim().replace(/[\\/]+$/,'');
    if(!path)continue;
    const key=path.replace(/\\/g,'/').toLocaleLowerCase();
    const existing=map.get(key);
    if(!existing||entry.timestampMs>existing.lastTimestampMs){
      map.set(key,{path,lastTimestampMs:entry.timestampMs,model:entry.values.model,reasoning:entry.values.modelReasoningEffort});
    }
  }
  return [...map.values()].sort((a,b)=>b.lastTimestampMs-a.lastTimestampMs).slice(0,Math.max(1,limit));
}

export function summarizeProjectOverview(report:ProjectsUsageOverviewReport):OverviewSummary {
  return report.projects.reduce<OverviewSummary>((sum,project)=>{
    sum.projects++;
    if(project.usage.totalTokens>0||project.sessions>0)sum.activeProjects++;
    sum.sessions+=project.sessions;
    sum.reroutes+=project.reroutes;
    sum.totalTokens+=project.usage.totalTokens;
    return sum;
  },{projects:0,activeProjects:0,sessions:0,reroutes:0,totalTokens:0});
}

export function topModelLabel(project:ProjectUsageOverview):string {
  const row=project.models[0];
  if(!row)return '—';
  return row.model+(row.reasoning?' · '+row.reasoning:'');
}

export function projectNameFromPath(path:string):string {
  const clean=path.replace(/[\\/]+$/,'');
  return clean.split(/[\\/]/).filter(Boolean).pop()||path;
}

export { formatTokens };
