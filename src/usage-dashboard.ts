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

export type ServiceTierUsage = {
  serviceTier: string | null;
  responses: number;
  usage: UsageTokens;
};

export type ModelTierUsage = {
  model: string;
  reasoning: string | null;
  serviceTier: string | null;
  responses: number;
  usage: UsageTokens;
};

export type ServiceTierSummary = ServiceTierUsage & {
  share: number;
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

export type UsageAnomaly = {
  day: string;
  totalTokens: number;
  baselineTokens: number;
  ratio: number;
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
  lastModel: string | null;
  lastReasoning: string | null;
  serviceTierObserved: boolean;
  lastServiceTier: string | null;
  usageSource: 'response_records' | 'legacy_session_total' | 'none' | string;
  usage: UsageTokens;
  models: ModelUsage[];
  serviceTiers: ServiceTierUsage[];
  modelTiers: ModelTierUsage[];
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
  serviceTierRows: ServiceTierSummary[];
  modelTierRows: ModelTierUsage[];
  serviceTierCoveredTokens: number;
  serviceTierCoverage: number;
  fastTierTokens: number;
  anomalies: UsageAnomaly[];
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
  fastSurcharge: string;
  tierCostCoverage: string;
  unadjustedFastModels: string;
  anomalies: string;
  anomalyHint: string;
  noAnomalies: string;
  anomalyBaseline: string;
  serviceTier: string;
  serviceTierHint: string;
  serviceTierCoverage: string;
  serviceTierDefault: string;
  serviceTierFast: string;
  serviceTierUnobserved: string;
};

const copies: Record<string, UsageCopy> = {
  en: {
    tab:'Usage',title:'Project usage',subtitle:'Read-only token and model statistics from local Codex rollout history.',
    selectProject:'Select a project to view its usage.',loading:'Reading local Codex history…',empty:'No matching usage records were found.',refresh:'Refresh',
    sevenDays:'7 days',thirtyDays:'30 days',allTime:'All time',totalTokens:'Total tokens',sessions:'Sessions',turns:'Turns',responses:'Responses',
    cached:'Cached input',reasoning:'Reasoning',input:'Input',output:'Output',modelUsage:'Model usage',agentUsage:'Agent split',rootAgent:'Root agent',subagents:'Sub-agents',
    reroutes:'Observed reroutes',latestSessions:'Recent sessions',model:'Model',usage:'Tokens',share:'Share',source:'Data quality',exact:'Exact response records',
    legacy:'Legacy session totals',files:'rollout files scanned',dataNote:'Usage is best-effort local telemetry, not billing. Exact response records are preferred; older sessions may only expose cumulative totals.',anomalies:'Usage anomalies',anomalyHint:'Flags exact daily token use at least 2.5× the median of at least 3 prior exact active days, with a baseline of at least 10K tokens. This is a usage heuristic, not a quality or billing alert.',noAnomalies:'No token spikes matched this heuristic.',anomalyBaseline:'Baseline',
    truncated:'The scan hit its safety limit; older sessions may be omitted.',parseWarning:'Some rollout records could not be parsed.',unknownModel:'Unknown model',noUsage:'No token usage',dailyTrend:'Daily trend',trendHint:'Daily totals use exact response timestamps when available.',estimatedDay:'Estimated from legacy session total',modelTrend:'Model trend',modelTrendHint:'Shows which model consumed tokens each day; legacy-only days are estimates.',agentAnalysis:'Agent analysis',agentAnalysisHint:'Objective usage metrics for root and sub-agent sessions. No quality score is inferred.',avgPerSession:'Avg / session',role:'Role',uncategorizedAgent:'Sub-agent (unclassified)',rerouteTimeline:'Observed reroutes',rerouteTimelineHint:'Only reroutes explicitly recorded by Codex are shown. Absence of an event does not prove server-side routing never changed.',noReroutes:'No observable reroute events in this period.',referenceCost:'Reference cost',referenceCostHint:'Reference estimate using a versioned OpenAI Codex token-rate snapshot. Observed Fast/priority responses use the documented model-specific Fast multiplier. Missing tier evidence keeps the result a lower-bound estimate; long-context and regional-processing multipliers are not inferred. It is not your invoice or plan credit usage.',priceCoverage:'Pricing coverage',pricingSnapshot:'Price snapshot',unpricedModels:'Models without a reference rate',pricingStale:'This pricing snapshot is over 30 days old. Treat the estimate as stale until rates are refreshed.',fastSurcharge:'Observed Fast surcharge',tierCostCoverage:'Tier evidence for priced tokens',unadjustedFastModels:'Fast models without a multiplier',serviceTier:'Service tier telemetry',serviceTierHint:'Attributes exact responses only after a durable Codex thread-settings event. Missing tier means the observed default tier; unobserved history is excluded. Fast is recorded by current Codex as priority.',serviceTierCoverage:'Tier token coverage',serviceTierDefault:'Default',serviceTierFast:'Fast',serviceTierUnobserved:'Unobserved',
  },
  'zh-CN': {
    tab:'用量',title:'项目用量',subtitle:'只读分析本机 Codex rollout 历史中的 Token、模型与 Agent 使用情况。',
    selectProject:'请选择一个项目后查看用量。',loading:'正在读取本机 Codex 历史…',empty:'没有找到该项目的用量记录。',refresh:'刷新',
    sevenDays:'7 天',thirtyDays:'30 天',allTime:'全部',totalTokens:'总 Token',sessions:'会话',turns:'轮次',responses:'模型响应',
    cached:'缓存输入',reasoning:'Reasoning',input:'输入',output:'输出',modelUsage:'模型用量',agentUsage:'Agent 分布',rootAgent:'主 Agent',subagents:'子 Agent',
    reroutes:'可观测模型路由',latestSessions:'最近会话',model:'模型',usage:'Token',share:'占比',source:'数据质量',exact:'精确响应记录',
    legacy:'旧版会话累计值',files:'个 rollout 文件已扫描',dataNote:'这里是本机 best-effort 用量统计，不等同于账单。优先使用逐响应精确记录；旧会话可能只有累计值。',anomalies:'用量异常',anomalyHint:'仅在精确每日 Token 达到此前至少 3 个精确活跃日中位数的 2.5 倍以上、且基线不少于 10K Token 时提示。它只是用量启发式，不评价质量，也不是账单告警。',noAnomalies:'当前没有符合该规则的 Token 突增。',anomalyBaseline:'基线',
    truncated:'扫描已达到安全上限，较旧会话可能未纳入。',parseWarning:'部分 rollout 记录无法解析。',unknownModel:'未知模型',noUsage:'暂无 Token 用量',dailyTrend:'每日趋势',trendHint:'有逐响应记录时按真实响应时间统计每日 Token。',estimatedDay:'根据旧版会话累计值估算',modelTrend:'模型趋势',modelTrendHint:'按天显示各模型 Token 消耗；只有旧版累计数据的日期会标记为估算。',agentAnalysis:'Agent 分析',agentAnalysisHint:'展示主 Agent 与子 Agent 的客观用量指标，不根据 Token 消耗推断质量高低。',avgPerSession:'平均 / 会话',role:'角色',uncategorizedAgent:'子 Agent（未分类）',rerouteTimeline:'可观测模型路由',rerouteTimelineHint:'这里只显示 Codex 明确记录的 reroute 事件；没有事件不代表服务端内部路由一定没有变化。',noReroutes:'当前时间范围内没有可观测 reroute 事件。',referenceCost:'参考成本',referenceCostHint:'使用版本化的 OpenAI Codex Token 费率快照进行参考估算。已观测到的 Fast/priority 响应会按对应模型的官方 Fast 倍率计算；缺少 tier 证据时结果按下界显示。长上下文与区域处理倍率暂不推测。该数值不代表实际账单或套餐 Credits 消耗。',priceCoverage:'价格覆盖率',pricingSnapshot:'价格快照',unpricedModels:'暂无参考价格的模型',pricingStale:'该价格快照已超过 30 天，请在更新费率前将成本结果视为过期参考。',fastSurcharge:'已观测 Fast 附加成本',tierCostCoverage:'已定价 Token 的 Tier 证据覆盖率',unadjustedFastModels:'暂无 Fast 倍率的模型',serviceTier:'Service Tier 遥测',serviceTierHint:'仅在 Codex 已持久化 thread settings 之后，把精确响应归属到当时的 service tier。已观测但未写 tier 表示默认层级；未观测的旧历史不会猜测。当前 Codex 会把 Fast 记录为 priority。',serviceTierCoverage:'Tier Token 覆盖率',serviceTierDefault:'默认',serviceTierFast:'Fast',serviceTierUnobserved:'未观测',
  },
  'zh-TW': {
    tab:'用量',title:'專案用量',subtitle:'唯讀分析本機 Codex rollout 歷史中的 Token、模型與 Agent 使用情況。',
    selectProject:'請先選擇專案再查看用量。',loading:'正在讀取本機 Codex 歷史…',empty:'找不到此專案的用量記錄。',refresh:'重新整理',
    sevenDays:'7 天',thirtyDays:'30 天',allTime:'全部',totalTokens:'總 Token',sessions:'工作階段',turns:'輪次',responses:'模型回應',
    cached:'快取輸入',reasoning:'Reasoning',input:'輸入',output:'輸出',modelUsage:'模型用量',agentUsage:'Agent 分布',rootAgent:'主 Agent',subagents:'子 Agent',
    reroutes:'可觀測模型路由',latestSessions:'最近工作階段',model:'模型',usage:'Token',share:'占比',source:'資料品質',exact:'精確回應記錄',
    legacy:'舊版工作階段累計值',files:'個 rollout 檔案已掃描',dataNote:'這是本機 best-effort 用量統計，不等同帳單。優先使用逐回應精確記錄；舊工作階段可能只有累計值。',anomalies:'用量異常',anomalyHint:'僅在精確每日 Token 達到先前至少 3 個精確活躍日中位數的 2.5 倍以上、且基線不少於 10K Token 時提示。這只是用量啟發式，不評價品質，也不是帳單警報。',noAnomalies:'目前沒有符合此規則的 Token 突增。',anomalyBaseline:'基線',
    truncated:'掃描已達安全上限，較舊工作階段可能未納入。',parseWarning:'部分 rollout 記錄無法解析。',unknownModel:'未知模型',noUsage:'暫無 Token 用量',dailyTrend:'每日趨勢',trendHint:'有逐回應記錄時依真實回應時間統計每日 Token。',estimatedDay:'依舊版工作階段累計值估算',modelTrend:'模型趨勢',modelTrendHint:'按日顯示各模型 Token 消耗；只有舊版累計資料的日期會標記為估算。',agentAnalysis:'Agent 分析',agentAnalysisHint:'呈現主 Agent 與子 Agent 的客觀用量指標，不依 Token 消耗推斷品質高低。',avgPerSession:'平均 / 工作階段',role:'角色',uncategorizedAgent:'子 Agent（未分類）',rerouteTimeline:'可觀測模型路由',rerouteTimelineHint:'只顯示 Codex 明確記錄的 reroute 事件；沒有事件不代表服務端內部路由一定沒有變化。',noReroutes:'目前時間範圍內沒有可觀測 reroute 事件。',referenceCost:'參考成本',referenceCostHint:'使用版本化的 OpenAI Codex Token 費率快照進行參考估算。已觀測的 Fast/priority 回應會依對應模型的官方 Fast 倍率計算；缺少 tier 證據時結果以最低參考值顯示。長上下文與區域處理倍率暫不推測。此數值不代表實際帳單或方案 Credits 消耗。',priceCoverage:'價格覆蓋率',pricingSnapshot:'價格快照',unpricedModels:'暫無參考價格的模型',pricingStale:'此價格快照已超過 30 天，更新費率前請將成本結果視為過期參考。',fastSurcharge:'已觀測 Fast 附加成本',tierCostCoverage:'已定價 Token 的 Tier 證據覆蓋率',unadjustedFastModels:'暫無 Fast 倍率的模型',serviceTier:'Service Tier 遙測',serviceTierHint:'僅在 Codex 已持久化 thread settings 後，將精確回應歸屬到當時的 service tier。已觀測但未寫 tier 代表預設層級；未觀測的舊歷史不會猜測。目前 Codex 會將 Fast 記錄為 priority。',serviceTierCoverage:'Tier Token 覆蓋率',serviceTierDefault:'預設',serviceTierFast:'Fast',serviceTierUnobserved:'未觀測',
  },
  ja: {
    tab:'使用量',title:'プロジェクト使用量',subtitle:'ローカル Codex rollout 履歴から Token・モデル・Agent 使用量を読み取り専用で集計します。',
    selectProject:'使用量を見るプロジェクトを選択してください。',loading:'ローカル Codex 履歴を読み込み中…',empty:'一致する使用量記録がありません。',refresh:'更新',
    sevenDays:'7日',thirtyDays:'30日',allTime:'全期間',totalTokens:'総 Token',sessions:'セッション',turns:'ターン',responses:'モデル応答',
    cached:'キャッシュ入力',reasoning:'Reasoning',input:'入力',output:'出力',modelUsage:'モデル使用量',agentUsage:'Agent 内訳',rootAgent:'Root Agent',subagents:'Sub-Agent',
    reroutes:'観測された reroute',latestSessions:'最近のセッション',model:'モデル',usage:'Token',share:'割合',source:'データ品質',exact:'正確な応答記録',
    legacy:'旧形式の累積値',files:' rollout ファイルを走査',dataNote:'ローカルの best-effort 統計で、請求額ではありません。逐次応答記録を優先し、古いセッションは累積値のみの場合があります。',anomalies:'使用量の異常',anomalyHint:'正確な日次 Token が、少なくとも過去 3 つの正確なアクティブ日の中央値の 2.5 倍以上で、基準値が 10K Token 以上の場合だけ表示します。品質評価や請求アラートではありません。',noAnomalies:'このルールに一致する Token 急増はありません。',anomalyBaseline:'基準値',
    truncated:'安全上限に達したため、古いセッションが省略されている可能性があります。',parseWarning:'一部の rollout 記録を解析できませんでした。',unknownModel:'不明なモデル',noUsage:'Token 使用量なし',dailyTrend:'日別トレンド',trendHint:'応答単位の記録がある場合は実際の応答時刻で日別集計します。',estimatedDay:'旧形式のセッション累積値から推定',modelTrend:'モデル推移',modelTrendHint:'日ごとのモデル別 Token 消費を表示します。旧形式のみの日は推定値です。',agentAnalysis:'Agent 分析',agentAnalysisHint:'Root / Sub-Agent の客観的な使用量指標です。Token 消費から品質スコアは推定しません。',avgPerSession:'平均 / セッション',role:'ロール',uncategorizedAgent:'Sub-Agent（未分類）',rerouteTimeline:'観測された reroute',rerouteTimelineHint:'Codex が明示的に記録した reroute のみ表示します。イベントがないことはサーバー内部ルーティングの不変を証明しません。',noReroutes:'この期間に観測可能な reroute はありません。',referenceCost:'参考コスト',referenceCostHint:'バージョン管理された OpenAI Codex Token レートの参考値です。観測できた Fast/priority 応答にはモデル別の公式 Fast 倍率を適用します。tier 証拠が不足する場合は下限の参考値として表示し、長文脈・地域処理の倍率は推測しません。実際の請求やプランのクレジット消費ではありません。',priceCoverage:'価格カバレッジ',pricingSnapshot:'価格スナップショット',unpricedModels:'参考価格のないモデル',pricingStale:'この価格スナップショットは30日以上前のものです。料金を更新するまで参考値は古い可能性があります。',fastSurcharge:'観測済み Fast 追加コスト',tierCostCoverage:'価格対象 Token の Tier 証拠率',unadjustedFastModels:'Fast 倍率のないモデル',serviceTier:'Service Tier テレメトリ',serviceTierHint:'Codex が永続化した thread settings の後にある正確な応答だけを、その時点の service tier に帰属します。観測済みで tier がない場合は既定 tier、未観測の古い履歴は推測しません。現在の Codex は Fast を priority として記録します。',serviceTierCoverage:'Tier Token カバレッジ',serviceTierDefault:'既定',serviceTierFast:'Fast',serviceTierUnobserved:'未観測',
  },
  ko: {
    tab:'사용량',title:'프로젝트 사용량',subtitle:'로컬 Codex rollout 기록에서 Token, 모델, Agent 사용량을 읽기 전용으로 집계합니다.',
    selectProject:'사용량을 볼 프로젝트를 선택하세요.',loading:'로컬 Codex 기록을 읽는 중…',empty:'일치하는 사용량 기록이 없습니다.',refresh:'새로고침',
    sevenDays:'7일',thirtyDays:'30일',allTime:'전체',totalTokens:'총 Token',sessions:'세션',turns:'턴',responses:'모델 응답',
    cached:'캐시 입력',reasoning:'Reasoning',input:'입력',output:'출력',modelUsage:'모델 사용량',agentUsage:'Agent 분포',rootAgent:'루트 Agent',subagents:'서브 Agent',
    reroutes:'관찰된 reroute',latestSessions:'최근 세션',model:'모델',usage:'Token',share:'비중',source:'데이터 품질',exact:'정확한 응답 기록',
    legacy:'이전 형식 누적값',files:'개 rollout 파일 스캔',dataNote:'로컬 best-effort 통계이며 청구 금액이 아닙니다. 응답별 정확한 기록을 우선하고, 오래된 세션은 누적값만 있을 수 있습니다.',anomalies:'사용량 이상',anomalyHint:'정확한 일별 Token이 이전 최소 3개의 정확한 활성일 중앙값의 2.5배 이상이고 기준값이 10K Token 이상일 때만 표시합니다. 품질 평가나 청구 경고가 아닌 사용량 휴리스틱입니다.',noAnomalies:'이 규칙에 해당하는 Token 급증이 없습니다.',anomalyBaseline:'기준값',
    truncated:'안전 한도에 도달해 오래된 세션이 누락될 수 있습니다.',parseWarning:'일부 rollout 기록을 파싱하지 못했습니다.',unknownModel:'알 수 없는 모델',noUsage:'Token 사용량 없음',dailyTrend:'일별 추이',trendHint:'응답별 기록이 있으면 실제 응답 시각을 기준으로 일별 집계합니다.',estimatedDay:'이전 세션 누적값에서 추정',modelTrend:'모델 추이',modelTrendHint:'날짜별 모델 Token 사용량을 표시합니다. 이전 형식만 있는 날짜는 추정값입니다.',agentAnalysis:'Agent 분석',agentAnalysisHint:'루트/서브 Agent의 객관적 사용량 지표입니다. Token 사용량으로 품질 점수를 추정하지 않습니다.',avgPerSession:'평균 / 세션',role:'역할',uncategorizedAgent:'서브 Agent(미분류)',rerouteTimeline:'관찰된 reroute',rerouteTimelineHint:'Codex가 명시적으로 기록한 reroute만 표시합니다. 이벤트가 없다고 서버 내부 라우팅이 변하지 않았다는 뜻은 아닙니다.',noReroutes:'이 기간에 관찰 가능한 reroute 이벤트가 없습니다.',referenceCost:'참고 비용',referenceCostHint:'버전이 고정된 OpenAI Codex Token 요금 스냅샷 기반 참고값입니다. 관찰된 Fast/priority 응답에는 모델별 공식 Fast 배율을 적용합니다. tier 증거가 부족하면 하한 참고값으로 표시하며 장문맥/지역 처리 배율은 추측하지 않습니다. 실제 청구서나 플랜 크레딧 사용량이 아닙니다.',priceCoverage:'가격 적용 범위',pricingSnapshot:'가격 스냅샷',unpricedModels:'참고 요금이 없는 모델',pricingStale:'이 가격 스냅샷은 30일이 지났습니다. 요금을 갱신하기 전까지 비용 추정치를 오래된 참고값으로 취급하세요.',fastSurcharge:'관찰된 Fast 추가 비용',tierCostCoverage:'가격 적용 Token의 Tier 증거 범위',unadjustedFastModels:'Fast 배율이 없는 모델',serviceTier:'Service Tier 텔레메트리',serviceTierHint:'Codex가 영구 저장한 thread settings 이후의 정확한 응답만 당시 service tier에 귀속합니다. 관찰됐지만 tier가 없으면 기본 tier이며, 관찰되지 않은 이전 기록은 추측하지 않습니다. 현재 Codex는 Fast를 priority로 기록합니다.',serviceTierCoverage:'Tier Token 적용 범위',serviceTierDefault:'기본',serviceTierFast:'Fast',serviceTierUnobserved:'미관찰',
  },
};

export function usageText(locale: string): UsageCopy {
  return copies[locale] ?? copies.en;
}

export function isFastServiceTier(value: string | null | undefined): boolean {
  const normalized=(value??'').trim().toLowerCase();
  return normalized==='priority'||normalized==='fast';
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
  const serviceTierMap=new Map<string,ServiceTierUsage>();
  const modelTierMap=new Map<string,ModelTierUsage>();
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
    for(const row of session.serviceTiers??[]){
      const key=row.serviceTier??'__default__';
      let item=serviceTierMap.get(key);
      if(!item){item={serviceTier:row.serviceTier,responses:0,usage:zeroTokens()};serviceTierMap.set(key,item);}
      item.responses+=row.responses;addTokens(item.usage,row.usage);
    }
    for(const row of session.modelTiers??[]){
      const key=[row.model,row.reasoning??'',row.serviceTier??'__default__'].join('\u0000');
      let item=modelTierMap.get(key);
      if(!item){
        item={model:row.model,reasoning:row.reasoning,serviceTier:row.serviceTier,responses:0,usage:zeroTokens()};
        modelTierMap.set(key,item);
      }
      item.responses+=row.responses;addTokens(item.usage,row.usage);
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
  const serviceTierCoveredTokens=[...serviceTierMap.values()].reduce((sum,row)=>sum+row.usage.totalTokens,0);
  const serviceTierRows=[...serviceTierMap.values()]
    .sort((a,b)=>b.usage.totalTokens-a.usage.totalTokens||(a.serviceTier??'').localeCompare(b.serviceTier??''))
    .map(row=>({...row,share:serviceTierCoveredTokens>0?row.usage.totalTokens/serviceTierCoveredTokens:0}));
  const modelTierRows=[...modelTierMap.values()]
    .sort((a,b)=>b.usage.totalTokens-a.usage.totalTokens||a.model.localeCompare(b.model)||(a.serviceTier??'').localeCompare(b.serviceTier??''));
  const serviceTierCoverage=usage.totalTokens>0?serviceTierCoveredTokens/usage.totalTokens:0;
  const fastTierTokens=serviceTierRows
    .filter(row=>isFastServiceTier(row.serviceTier))
    .reduce((sum,row)=>sum+row.usage.totalTokens,0);
  const anomalies=detectUsageAnomalies(dailyTrend);
  return {usage,sessions:report.sessions.length,turns,responses,rootUsage,subagentUsage,rootSessions,subagentSessions,reroutes,exactSessions,legacySessions,modelRows,dailyTrend,modelTrend,agentRoles,rerouteEvents,serviceTierRows,modelTierRows,serviceTierCoveredTokens,serviceTierCoverage,fastTierTokens,anomalies};
}

export function detectUsageAnomalies(days: readonly DailyUsage[], baselineDays=7): UsageAnomaly[] {
  const exact=[...days]
    .filter(day=>!day.estimated&&day.usage.totalTokens>0)
    .sort((a,b)=>a.day.localeCompare(b.day));
  const anomalies:UsageAnomaly[]=[];
  for(let index=0;index<exact.length;index++){
    const current=exact[index];
    const history=exact.slice(Math.max(0,index-Math.max(3,baselineDays)),index);
    if(history.length<3)continue;
    const values=history.map(day=>day.usage.totalTokens).sort((a,b)=>a-b);
    const middle=Math.floor(values.length/2);
    const baseline=values.length%2?values[middle]:(values[middle-1]+values[middle])/2;
    if(baseline<10_000)continue;
    const ratio=current.usage.totalTokens/baseline;
    if(ratio>=2.5)anomalies.push({day:current.day,totalTokens:current.usage.totalTokens,baselineTokens:baseline,ratio});
  }
  return anomalies.sort((a,b)=>b.day.localeCompare(a.day));
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
