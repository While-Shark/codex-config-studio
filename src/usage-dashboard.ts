export type UsageTokens = {
  inputTokens: number;
  cachedInputTokens: number;
  cacheWriteInputTokens: number;
  outputTokens: number;
  reasoningOutputTokens: number;
  totalTokens: number;
};

export type ModelUsage = {
  model: string;
  reasoning: string | null;
  responses: number;
  usage: UsageTokens;
};

export type ModelReroute = {
  timestamp: string;
  fromModel: string;
  toModel: string;
  reason: string;
};

export type ObservableReroute = ModelReroute & {
  threadId: string;
  isSubagent: boolean;
  agentRole: string | null;
};

export type DailyUsage = {
  day: string;
  responses: number;
  usage: UsageTokens;
  estimated: boolean;
};

export type DailyModelUsage = {
  day: string;
  model: string;
  reasoning: string | null;
  responses: number;
  usage: UsageTokens;
  estimated: boolean;
};

export type ModelTrendDay = {
  day: string;
  totalTokens: number;
  estimated: boolean;
  rows: Array<DailyModelUsage & { share: number }>;
};

export type AgentRoleUsage = {
  role: string;
  sessions: number;
  turns: number;
  responses: number;
  usage: UsageTokens;
  share: number;
};

export type UsageSession = {
  threadId: string;
  sessionId: string;
  cwd: string;
  startedAt: string;
  updatedAt: string;
  parentThreadId: string | null;
  agentRole: string | null;
  agentPath: string | null;
  isSubagent: boolean;
  turns: number;
  responses: number;
  usageSource: 'response_records' | 'legacy_session_total' | 'none' | string;
  usage: UsageTokens;
  models: ModelUsage[];
  dailyUsage: DailyUsage[];
  dailyModelUsage: DailyModelUsage[];
  reroutes: ModelReroute[];
};

export type UsageReport = {
  source: string;
  sessions: UsageSession[];
  filesScanned: number;
  filesMatched: number;
  parseErrors: number;
  skippedLargeFiles: number;
  truncated: boolean;
};

export type UsagePeriod = '7d' | '30d' | 'all';

export type UsageSummary = {
  usage: UsageTokens;
  sessions: number;
  turns: number;
  responses: number;
  rootUsage: number;
  subagentUsage: number;
  rootSessions: number;
  subagentSessions: number;
  reroutes: number;
  exactSessions: number;
  legacySessions: number;
  modelRows: Array<ModelUsage & { share: number }>;
  dailyTrend: Array<DailyUsage & { share: number }>;
  modelTrend: ModelTrendDay[];
  agentRoles: AgentRoleUsage[];
  rerouteEvents: ObservableReroute[];
};

export type UsageCopy = {
  tab: string;
  title: string;
  subtitle: string;
  selectProject: string;
  loading: string;
  empty: string;
  refresh: string;
  sevenDays: string;
  thirtyDays: string;
  allTime: string;
  totalTokens: string;
  sessions: string;
  turns: string;
  responses: string;
  cached: string;
  reasoning: string;
  input: string;
  output: string;
  modelUsage: string;
  agentUsage: string;
  rootAgent: string;
  subagents: string;
  reroutes: string;
  latestSessions: string;
  model: string;
  usage: string;
  share: string;
  source: string;
  exact: string;
  legacy: string;
  files: string;
  dataNote: string;
  truncated: string;
  parseWarning: string;
  unknownModel: string;
  noUsage: string;
  dailyTrend: string;
  trendHint: string;
  estimatedDay: string;
  modelTrend: string;
  modelTrendHint: string;
  agentAnalysis: string;
  agentAnalysisHint: string;
  avgPerSession: string;
  role: string;
  uncategorizedAgent: string;
  rerouteTimeline: string;
  rerouteTimelineHint: string;
  noReroutes: string;
  referenceCost: string;
  referenceCostHint: string;
  priceCoverage: string;
  pricingSnapshot: string;
  unpricedModels: string;
  pricingStale: string;
};

const copies: Record<string, UsageCopy> = {
  en: {
    tab:'Usage',title:'Project usage',subtitle:'Read-only token and model statistics from local Codex rollout history.',
    selectProject:'Select a project to view its usage.',loading:'Reading local Codex history…',empty:'No matching usage records were found.',refresh:'Refresh',
    sevenDays:'7 days',thirtyDays:'30 days',allTime:'All time',totalTokens:'Total tokens',sessions:'Sessions',turns:'Turns',responses:'Responses',
    cached:'Cached input',reasoning:'Reasoning',input:'Input',output:'Output',modelUsage:'Model usage',agentUsage:'Agent split',rootAgent:'Root agent',subagents:'Sub-agents',
    reroutes:'Observed reroutes',latestSessions:'Recent sessions',model:'Model',usage:'Tokens',share:'Share',source:'Data quality',exact:'Exact response records',
    legacy:'Legacy session totals',files:'rollout files scanned',dataNote:'Usage is best-effort local telemetry, not billing. Exact response records are preferred; older sessions may only expose cumulative totals.',
    truncated:'The scan hit its safety limit; older sessions may be omitted.',parseWarning:'Some rollout records could not be parsed.',unknownModel:'Unknown model',noUsage:'No token usage',dailyTrend:'Daily trend',trendHint:'Daily totals use exact response timestamps when available.',estimatedDay:'Estimated from legacy session total',modelTrend:'Model trend',modelTrendHint:'Shows which model consumed tokens each day; legacy-only days are estimates.',agentAnalysis:'Agent analysis',agentAnalysisHint:'Objective usage metrics for root and sub-agent sessions. No quality score is inferred.',avgPerSession:'Avg / session',role:'Role',uncategorizedAgent:'Sub-agent (unclassified)',rerouteTimeline:'Observed reroutes',rerouteTimelineHint:'Only reroutes explicitly recorded by Codex are shown. Absence of an event does not prove server-side routing never changed.',noReroutes:'No observable reroute events in this period.',referenceCost:'Reference cost',referenceCostHint:'Reference estimate using a versioned OpenAI Codex token-rate snapshot. It is not your invoice, plan credit usage, or a guarantee of current pricing.',priceCoverage:'Pricing coverage',pricingSnapshot:'Price snapshot',unpricedModels:'Models without a reference rate',pricingStale:'This pricing snapshot is over 30 days old. Treat the estimate as stale until rates are refreshed.',
  },
  'zh-CN': {
    tab:'用量',title:'项目用量',subtitle:'只读分析本机 Codex rollout 历史中的 Token、模型与 Agent 使用情况。',
    selectProject:'请选择一个项目后查看用量。',loading:'正在读取本机 Codex 历史…',empty:'没有找到该项目的用量记录。',refresh:'刷新',
    sevenDays:'7 天',thirtyDays:'30 天',allTime:'全部',totalTokens:'总 Token',sessions:'会话',turns:'轮次',responses:'模型响应',
    cached:'缓存输入',reasoning:'Reasoning',input:'输入',output:'输出',modelUsage:'模型用量',agentUsage:'Agent 分布',rootAgent:'主 Agent',subagents:'子 Agent',
    reroutes:'可观测模型路由',latestSessions:'最近会话',model:'模型',usage:'Token',share:'占比',source:'数据质量',exact:'精确响应记录',
    legacy:'旧版会话累计值',files:'个 rollout 文件已扫描',dataNote:'这里是本机 best-effort 用量统计，不等同于账单。优先使用逐响应精确记录；旧会话可能只有累计值。',
    truncated:'扫描已达到安全上限，较旧会话可能未纳入。',parseWarning:'部分 rollout 记录无法解析。',unknownModel:'未知模型',noUsage:'暂无 Token 用量',dailyTrend:'每日趋势',trendHint:'有逐响应记录时按真实响应时间统计每日 Token。',estimatedDay:'根据旧版会话累计值估算',modelTrend:'模型趋势',modelTrendHint:'按天显示各模型 Token 消耗；只有旧版累计数据的日期会标记为估算。',agentAnalysis:'Agent 分析',agentAnalysisHint:'展示主 Agent 与子 Agent 的客观用量指标，不根据 Token 消耗推断质量高低。',avgPerSession:'平均 / 会话',role:'角色',uncategorizedAgent:'子 Agent（未分类）',rerouteTimeline:'可观测模型路由',rerouteTimelineHint:'这里只显示 Codex 明确记录的 reroute 事件；没有事件不代表服务端内部路由一定没有变化。',noReroutes:'当前时间范围内没有可观测 reroute 事件。',referenceCost:'参考成本',referenceCostHint:'使用版本化的 OpenAI Codex Token 费率快照进行参考估算，不代表你的实际账单、套餐 Credits 消耗或当前价格承诺。',priceCoverage:'价格覆盖率',pricingSnapshot:'价格快照',unpricedModels:'暂无参考价格的模型',pricingStale:'该价格快照已超过 30 天，请在更新费率前将成本结果视为过期参考。',
  },
  'zh-TW': {
    tab:'用量',title:'專案用量',subtitle:'唯讀分析本機 Codex rollout 歷史中的 Token、模型與 Agent 使用情況。',
    selectProject:'請先選擇專案再查看用量。',loading:'正在讀取本機 Codex 歷史…',empty:'找不到此專案的用量記錄。',refresh:'重新整理',
    sevenDays:'7 天',thirtyDays:'30 天',allTime:'全部',totalTokens:'總 Token',sessions:'工作階段',turns:'輪次',responses:'模型回應',
    cached:'快取輸入',reasoning:'Reasoning',input:'輸入',output:'輸出',modelUsage:'模型用量',agentUsage:'Agent 分布',rootAgent:'主 Agent',subagents:'子 Agent',
    reroutes:'可觀測模型路由',latestSessions:'最近工作階段',model:'模型',usage:'Token',share:'占比',source:'資料品質',exact:'精確回應記錄',
    legacy:'舊版工作階段累計值',files:'個 rollout 檔案已掃描',dataNote:'這是本機 best-effort 用量統計，不等同帳單。優先使用逐回應精確記錄；舊工作階段可能只有累計值。',
    truncated:'掃描已達安全上限，較舊工作階段可能未納入。',parseWarning:'部分 rollout 記錄無法解析。',unknownModel:'未知模型',noUsage:'暫無 Token 用量',dailyTrend:'每日趨勢',trendHint:'有逐回應記錄時依真實回應時間統計每日 Token。',estimatedDay:'依舊版工作階段累計值估算',modelTrend:'模型趨勢',modelTrendHint:'按日顯示各模型 Token 消耗；只有舊版累計資料的日期會標記為估算。',agentAnalysis:'Agent 分析',agentAnalysisHint:'呈現主 Agent 與子 Agent 的客觀用量指標，不依 Token 消耗推斷品質高低。',avgPerSession:'平均 / 工作階段',role:'角色',uncategorizedAgent:'子 Agent（未分類）',rerouteTimeline:'可觀測模型路由',rerouteTimelineHint:'只顯示 Codex 明確記錄的 reroute 事件；沒有事件不代表服務端內部路由一定沒有變化。',noReroutes:'目前時間範圍內沒有可觀測 reroute 事件。',referenceCost:'參考成本',referenceCostHint:'使用版本化的 OpenAI Codex Token 費率快照進行參考估算，不代表實際帳單、方案 Credits 消耗或目前價格承諾。',priceCoverage:'價格覆蓋率',pricingSnapshot:'價格快照',unpricedModels:'暫無參考價格的模型',pricingStale:'此價格快照已超過 30 天，更新費率前請將成本結果視為過期參考。',
  },
  ja: {
    tab:'使用量',title:'プロジェクト使用量',subtitle:'ローカル Codex rollout 履歴から Token・モデル・Agent 使用量を読み取り専用で集計します。',
    selectProject:'使用量を見るプロジェクトを選択してください。',loading:'ローカル Codex 履歴を読み込み中…',empty:'一致する使用量記録がありません。',refresh:'更新',
    sevenDays:'7日',thirtyDays:'30日',allTime:'全期間',totalTokens:'総 Token',sessions:'セッション',turns:'ターン',responses:'モデル応答',
    cached:'キャッシュ入力',reasoning:'Reasoning',input:'入力',output:'出力',modelUsage:'モデル使用量',agentUsage:'Agent 内訳',rootAgent:'Root Agent',subagents:'Sub-Agent',
    reroutes:'観測された reroute',latestSessions:'最近のセッション',model:'モデル',usage:'Token',share:'割合',source:'データ品質',exact:'正確な応答記録',
    legacy:'旧形式の累積値',files:' rollout ファイルを走査',dataNote:'ローカルの best-effort 統計で、請求額ではありません。逐次応答記録を優先し、古いセッションは累積値のみの場合があります。',
    truncated:'安全上限に達したため、古いセッションが省略されている可能性があります。',parseWarning:'一部の rollout 記録を解析できませんでした。',unknownModel:'不明なモデル',noUsage:'Token 使用量なし',dailyTrend:'日別トレンド',trendHint:'応答単位の記録がある場合は実際の応答時刻で日別集計します。',estimatedDay:'旧形式のセッション累積値から推定',modelTrend:'モデル推移',modelTrendHint:'日ごとのモデル別 Token 消費を表示します。旧形式のみの日は推定値です。',agentAnalysis:'Agent 分析',agentAnalysisHint:'Root / Sub-Agent の客観的な使用量指標です。Token 消費から品質スコアは推定しません。',avgPerSession:'平均 / セッション',role:'ロール',uncategorizedAgent:'Sub-Agent（未分類）',rerouteTimeline:'観測された reroute',rerouteTimelineHint:'Codex が明示的に記録した reroute のみ表示します。イベントがないことはサーバー内部ルーティングの不変を証明しません。',noReroutes:'この期間に観測可能な reroute はありません。',referenceCost:'参考コスト',referenceCostHint:'バージョン管理された OpenAI Codex Token レートのスナップショットによる参考値です。実際の請求、プランのクレジット消費、現在価格の保証ではありません。',priceCoverage:'価格カバレッジ',pricingSnapshot:'価格スナップショット',unpricedModels:'参考価格のないモデル',pricingStale:'この価格スナップショットは30日以上前のものです。料金を更新するまで参考値は古い可能性があります。',
  },
  ko: {
    tab:'사용량',title:'프로젝트 사용량',subtitle:'로컬 Codex rollout 기록에서 Token, 모델, Agent 사용량을 읽기 전용으로 집계합니다.',
    selectProject:'사용량을 볼 프로젝트를 선택하세요.',loading:'로컬 Codex 기록을 읽는 중…',empty:'일치하는 사용량 기록이 없습니다.',refresh:'새로고침',
    sevenDays:'7일',thirtyDays:'30일',allTime:'전체',totalTokens:'총 Token',sessions:'세션',turns:'턴',responses:'모델 응답',
    cached:'캐시 입력',reasoning:'Reasoning',input:'입력',output:'출력',modelUsage:'모델 사용량',agentUsage:'Agent 분포',rootAgent:'루트 Agent',subagents:'서브 Agent',
    reroutes:'관찰된 reroute',latestSessions:'최근 세션',model:'모델',usage:'Token',share:'비중',source:'데이터 품질',exact:'정확한 응답 기록',
    legacy:'이전 형식 누적값',files:'개 rollout 파일 스캔',dataNote:'로컬 best-effort 통계이며 청구 금액이 아닙니다. 응답별 정확한 기록을 우선하고, 오래된 세션은 누적값만 있을 수 있습니다.',
    truncated:'안전 한도에 도달해 오래된 세션이 누락될 수 있습니다.',parseWarning:'일부 rollout 기록을 파싱하지 못했습니다.',unknownModel:'알 수 없는 모델',noUsage:'Token 사용량 없음',dailyTrend:'일별 추이',trendHint:'응답별 기록이 있으면 실제 응답 시각을 기준으로 일별 집계합니다.',estimatedDay:'이전 세션 누적값에서 추정',modelTrend:'모델 추이',modelTrendHint:'날짜별 모델 Token 사용량을 표시합니다. 이전 형식만 있는 날짜는 추정값입니다.',agentAnalysis:'Agent 분석',agentAnalysisHint:'루트/서브 Agent의 객관적 사용량 지표입니다. Token 사용량으로 품질 점수를 추정하지 않습니다.',avgPerSession:'평균 / 세션',role:'역할',uncategorizedAgent:'서브 Agent(미분류)',rerouteTimeline:'관찰된 reroute',rerouteTimelineHint:'Codex가 명시적으로 기록한 reroute만 표시합니다. 이벤트가 없다고 서버 내부 라우팅이 변하지 않았다는 뜻은 아닙니다.',noReroutes:'이 기간에 관찰 가능한 reroute 이벤트가 없습니다.',referenceCost:'참고 비용',referenceCostHint:'버전이 고정된 OpenAI Codex Token 요금 스냅샷을 사용한 참고 추정치입니다. 실제 청구서, 플랜 크레딧 사용량 또는 현재 가격 보장이 아닙니다.',priceCoverage:'가격 적용 범위',pricingSnapshot:'가격 스냅샷',unpricedModels:'참고 요금이 없는 모델',pricingStale:'이 가격 스냅샷은 30일이 지났습니다. 요금을 갱신하기 전까지 비용 추정치를 오래된 참고값으로 취급하세요.',
  },
};

export function usageText(locale: string): UsageCopy {
  return copies[locale] ?? copies.en;
}

function zeroTokens(): UsageTokens {
  return {inputTokens:0,cachedInputTokens:0,cacheWriteInputTokens:0,outputTokens:0,reasoningOutputTokens:0,totalTokens:0};
}
function addTokens(target: UsageTokens, value: UsageTokens): void {
  target.inputTokens += value.inputTokens || 0;
  target.cachedInputTokens += value.cachedInputTokens || 0;
  target.cacheWriteInputTokens += value.cacheWriteInputTokens || 0;
  target.outputTokens += value.outputTokens || 0;
  target.reasoningOutputTokens += value.reasoningOutputTokens || 0;
  target.totalTokens += value.totalTokens || 0;
}

export function summarizeUsage(report: UsageReport): UsageSummary {
  const usage=zeroTokens();
  const modelMap=new Map<string,ModelUsage>();
  const dayMap=new Map<string,DailyUsage>();
  const modelDayMap=new Map<string,DailyModelUsage>();
  const roleMap=new Map<string,{sessions:number;turns:number;responses:number;usage:UsageTokens}>();
  const rerouteEvents:ObservableReroute[]=[];
  let turns=0,responses=0,rootUsage=0,subagentUsage=0,rootSessions=0,subagentSessions=0,reroutes=0,exactSessions=0,legacySessions=0;
  for(const session of report.sessions){
    addTokens(usage,session.usage);turns+=session.turns;responses+=session.responses;reroutes+=session.reroutes.length;
    if(session.isSubagent){
      subagentUsage+=session.usage.totalTokens;subagentSessions++;
      const role=session.agentRole?.trim()||'__unclassified__';
      let item=roleMap.get(role);
      if(!item){item={sessions:0,turns:0,responses:0,usage:zeroTokens()};roleMap.set(role,item);}
      item.sessions++;item.turns+=session.turns;item.responses+=session.responses;addTokens(item.usage,session.usage);
    }else{
      rootUsage+=session.usage.totalTokens;rootSessions++;
    }
    if(session.usageSource==='response_records')exactSessions++;else if(session.usageSource==='legacy_session_total')legacySessions++;
    for(const event of session.reroutes??[]){
      rerouteEvents.push({...event,threadId:session.threadId,isSubagent:session.isSubagent,agentRole:session.agentRole});
    }
    for(const day of session.dailyUsage??[]){
      let item=dayMap.get(day.day);
      if(!item){item={day:day.day,responses:0,usage:zeroTokens(),estimated:false};dayMap.set(day.day,item);}
      item.responses+=day.responses;item.estimated=item.estimated||day.estimated;addTokens(item.usage,day.usage);
    }
    for(const row of session.dailyModelUsage??[]){
      const key=[row.day,row.model,row.reasoning??''].join('\u0000');
      let item=modelDayMap.get(key);
      if(!item){item={day:row.day,model:row.model,reasoning:row.reasoning,responses:0,usage:zeroTokens(),estimated:false};modelDayMap.set(key,item);}
      item.responses+=row.responses;item.estimated=item.estimated||row.estimated;addTokens(item.usage,row.usage);
    }
    for(const row of session.models){
      const key=`${row.model}\u0000${row.reasoning??''}`;
      let item=modelMap.get(key);
      if(!item){item={model:row.model,reasoning:row.reasoning,responses:0,usage:zeroTokens()};modelMap.set(key,item);}
      item.responses+=row.responses;addTokens(item.usage,row.usage);
    }
  }
  const modelRows=[...modelMap.values()].sort((a,b)=>b.usage.totalTokens-a.usage.totalTokens||a.model.localeCompare(b.model))
    .map(row=>({...row,share:usage.totalTokens>0?row.usage.totalTokens/usage.totalTokens:0}));
  const maxDaily=Math.max(0,...[...dayMap.values()].map(day=>day.usage.totalTokens));
  const dailyTrend=[...dayMap.values()].sort((a,b)=>a.day.localeCompare(b.day))
    .map(day=>({...day,share:maxDaily>0?day.usage.totalTokens/maxDaily:0}));
  const trendDays=new Map<string,DailyModelUsage[]>();
  for(const row of modelDayMap.values()){
    const rows=trendDays.get(row.day)??[];
    rows.push(row);trendDays.set(row.day,rows);
  }
  const modelTrend=[...trendDays.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([day,rows])=>{
    const totalTokens=rows.reduce((sum,row)=>sum+row.usage.totalTokens,0);
    const estimated=rows.some(row=>row.estimated);
    return {
      day,totalTokens,estimated,
      rows:rows.sort((a,b)=>b.usage.totalTokens-a.usage.totalTokens||a.model.localeCompare(b.model))
        .map(row=>({...row,share:totalTokens>0?row.usage.totalTokens/totalTokens:0})),
    };
  });
  const agentRoles=[...roleMap.entries()].map(([role,item])=>({
    role,sessions:item.sessions,turns:item.turns,responses:item.responses,usage:item.usage,
    share:subagentUsage>0?item.usage.totalTokens/subagentUsage:0,
  })).sort((a,b)=>b.usage.totalTokens-a.usage.totalTokens||a.role.localeCompare(b.role));
  rerouteEvents.sort((a,b)=>b.timestamp.localeCompare(a.timestamp));
  return {usage,sessions:report.sessions.length,turns,responses,rootUsage,subagentUsage,rootSessions,subagentSessions,reroutes,exactSessions,legacySessions,modelRows,dailyTrend,modelTrend,agentRoles,rerouteEvents};
}

export function periodSinceMs(period: UsagePeriod, now=Date.now()): number | null {
  if(period==='all')return null;
  return now-(period==='7d'?7:30)*24*60*60*1000;
}

export function periodSinceDay(period: UsagePeriod, now=Date.now()): string | null {
  const since=periodSinceMs(period,now);
  return since===null?null:new Date(since).toISOString().slice(0,10);
}

export function formatTokens(value:number):string {
  if(value>=1_000_000_000)return `${(value/1_000_000_000).toFixed(value>=10_000_000_000?1:2)}B`;
  if(value>=1_000_000)return `${(value/1_000_000).toFixed(value>=10_000_000?1:2)}M`;
  if(value>=1_000)return `${(value/1_000).toFixed(value>=10_000?1:2)}K`;
  return String(Math.max(0,Math.round(value)));
}
