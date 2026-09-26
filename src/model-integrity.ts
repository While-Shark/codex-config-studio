export type IntegrityValues = {
  model: string | null;
  modelReasoningEffort: string | null;
};

export type IntegrityTarget = {
  model: string | null;
  reasoning: string | null;
};

export type IntegrityLock = IntegrityTarget & {
  updatedAt: number;
};

export type IntegrityCopy = {
  title: string;
  locked: string;
  unlocked: string;
  lockCurrent: string;
  unlock: string;
  target: string;
  effective: string;
  runtime: string;
  runtimeUnknown: string;
  healthy: string;
  drift: string;
  pendingChange: string;
  restoreTarget: string;
  noModel: string;
  enabled: string;
  disabled: string;
  changeTitle: string;
  changeBody: string;
  changeConfirm: string;
  scopeNote: string;
};

const copies: Record<string, IntegrityCopy> = {
  en: {
    title: 'Model Integrity',
    locked: 'Strict lock',
    unlocked: 'Not locked',
    lockCurrent: 'Lock current',
    unlock: 'Unlock',
    target: 'Locked target',
    effective: 'Effective config',
    runtime: 'Runtime session',
    runtimeUnknown: 'Not verified (config level only)',
    healthy: 'No observable config drift',
    drift: 'Configuration drift detected',
    pendingChange: 'Pending model change will update the lock after confirmation.',
    restoreTarget: 'Restore locked target',
    noModel: 'No effective model is available to lock.',
    enabled: 'Model lock enabled',
    disabled: 'Model lock disabled',
    changeTitle: 'Change the locked model?',
    changeBody: 'Strict lock is active. Applying this draft changes the locked model or reasoning level. Confirm to update the lock target after the configuration is written.',
    changeConfirm: 'Apply and update lock',
    scopeNote: 'Checks Studio-visible configuration layers. CLI flags, an already-running session, and server-side routing are outside this local check.',
  },
  'zh-CN': {
    title: '模型完整性',
    locked: '严格锁定',
    unlocked: '未锁定',
    lockCurrent: '锁定当前模型',
    unlock: '解除锁定',
    target: '锁定目标',
    effective: '当前有效配置',
    runtime: '运行中会话',
    runtimeUnknown: '暂未验证（当前仅检查配置层）',
    healthy: '未发现可观测的配置降级',
    drift: '检测到模型配置偏移',
    pendingChange: '待应用的模型变更会在确认后同步更新锁定目标。',
    restoreTarget: '恢复锁定目标',
    noModel: '当前没有可锁定的有效模型。',
    enabled: '已开启模型严格锁定',
    disabled: '已解除模型严格锁定',
    changeTitle: '修改已锁定的模型？',
    changeBody: '严格锁定已开启。当前草稿会改变锁定的模型或思考等级。确认后会先写入配置，再同步更新锁定目标。',
    changeConfirm: '应用并更新锁定',
    scopeNote: '这里只检查 Studio 可见的配置层；CLI 参数、已运行会话以及服务端内部路由不在本地校验范围内。',
  },
  'zh-TW': {
    title: '模型完整性',
    locked: '嚴格鎖定',
    unlocked: '未鎖定',
    lockCurrent: '鎖定目前模型',
    unlock: '解除鎖定',
    target: '鎖定目標',
    effective: '目前有效設定',
    runtime: '執行中工作階段',
    runtimeUnknown: '尚未驗證（目前僅檢查設定層）',
    healthy: '未發現可觀測的設定降級',
    drift: '偵測到模型設定偏移',
    pendingChange: '待套用的模型變更會在確認後同步更新鎖定目標。',
    restoreTarget: '恢復鎖定目標',
    noModel: '目前沒有可鎖定的有效模型。',
    enabled: '已開啟模型嚴格鎖定',
    disabled: '已解除模型嚴格鎖定',
    changeTitle: '修改已鎖定的模型？',
    changeBody: '嚴格鎖定已開啟。目前草稿會改變鎖定的模型或思考等級。確認後會先寫入設定，再同步更新鎖定目標。',
    changeConfirm: '套用並更新鎖定',
    scopeNote: '這裡只檢查 Studio 可見的設定層；CLI 參數、已執行工作階段與服務端內部路由不在本地校驗範圍內。',
  },
  ja: {
    title: 'Model Integrity',
    locked: '厳格ロック',
    unlocked: '未ロック',
    lockCurrent: '現在のモデルをロック',
    unlock: 'ロック解除',
    target: 'ロック対象',
    effective: '有効な設定',
    runtime: '実行中セッション',
    runtimeUnknown: '未検証（現在は設定レイヤーのみ）',
    healthy: '観測可能な設定ドリフトはありません',
    drift: 'モデル設定のドリフトを検出しました',
    pendingChange: '保留中のモデル変更は確認後にロック対象へ反映されます。',
    restoreTarget: 'ロック対象へ戻す',
    noModel: 'ロックできる有効なモデルがありません。',
    enabled: 'モデルロックを有効にしました',
    disabled: 'モデルロックを解除しました',
    changeTitle: 'ロック中のモデルを変更しますか？',
    changeBody: '厳格ロックが有効です。この下書きはロック中のモデルまたは推論レベルを変更します。確認すると設定を書き込み、その後ロック対象も更新します。',
    changeConfirm: '適用してロック更新',
    scopeNote: 'Studio から見える設定レイヤーのみ確認します。CLI フラグ、既存セッション、サーバー内部ルーティングはこのローカル確認の対象外です。',
  },
  ko: {
    title: 'Model Integrity',
    locked: '엄격 잠금',
    unlocked: '잠금 안 됨',
    lockCurrent: '현재 모델 잠금',
    unlock: '잠금 해제',
    target: '잠금 대상',
    effective: '현재 유효 설정',
    runtime: '실행 중 세션',
    runtimeUnknown: '검증되지 않음(현재는 설정 계층만 확인)',
    healthy: '관찰 가능한 설정 드리프트가 없습니다',
    drift: '모델 설정 드리프트를 감지했습니다',
    pendingChange: '대기 중인 모델 변경은 확인 후 잠금 대상에도 반영됩니다.',
    restoreTarget: '잠금 대상 복원',
    noModel: '잠글 수 있는 유효 모델이 없습니다.',
    enabled: '모델 잠금을 활성화했습니다',
    disabled: '모델 잠금을 해제했습니다',
    changeTitle: '잠긴 모델을 변경할까요?',
    changeBody: '엄격 잠금이 활성화되어 있습니다. 이 초안은 잠긴 모델 또는 추론 수준을 변경합니다. 확인하면 설정을 쓴 뒤 잠금 대상도 갱신합니다.',
    changeConfirm: '적용 후 잠금 갱신',
    scopeNote: 'Studio에서 보이는 설정 계층만 확인합니다. CLI 플래그, 이미 실행 중인 세션, 서버 내부 라우팅은 이 로컬 검사 범위 밖입니다.',
  },
};

export function integrityText(locale: string): IntegrityCopy {
  return copies[locale] ?? copies.en;
}

export function integrityScopeKey(kind: 'global' | 'project', projectPath: string): string {
  if (kind === 'global') return 'global';
  const clean = projectPath.trim().replace(/[\\/]+$/, '');
  return clean ? `project:${clean}` : 'project:';
}

export function resolveIntegrityTarget(
  globalValues: IntegrityValues | null,
  scopeKind: 'global' | 'project',
  scopeValues: IntegrityValues | null,
): IntegrityTarget | null {
  if (scopeKind === 'global') {
    if (!globalValues) return null;
    return { model: globalValues.model, reasoning: globalValues.modelReasoningEffort };
  }
  if (!scopeValues) return null;
  if (scopeValues.model !== null && scopeValues.modelReasoningEffort !== null) {
    return { model: scopeValues.model, reasoning: scopeValues.modelReasoningEffort };
  }
  if (!globalValues) return null;
  return {
    model: scopeValues.model ?? globalValues.model,
    reasoning: scopeValues.modelReasoningEffort ?? globalValues.modelReasoningEffort,
  };
}

export function sameIntegrityTarget(a: IntegrityTarget | null, b: IntegrityTarget | null): boolean {
  return !!a && !!b && a.model === b.model && a.reasoning === b.reasoning;
}

const STORAGE_KEY = 'codex-config-studio.model-integrity.v1';

function readLocks(): Record<string, IntegrityLock> {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, IntegrityLock>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocks(locks: Record<string, IntegrityLock>): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(locks)); } catch { /* optional local preference */ }
}

export function loadIntegrityLock(scopeKey: string): IntegrityLock | null {
  const lock = readLocks()[scopeKey];
  if (!lock || typeof lock.updatedAt !== 'number') return null;
  return {
    model: typeof lock.model === 'string' ? lock.model : null,
    reasoning: typeof lock.reasoning === 'string' ? lock.reasoning : null,
    updatedAt: lock.updatedAt,
  };
}

export function saveIntegrityLock(scopeKey: string, target: IntegrityTarget): IntegrityLock {
  const locks = readLocks();
  const lock: IntegrityLock = { ...target, updatedAt: Date.now() };
  locks[scopeKey] = lock;
  writeLocks(locks);
  return lock;
}

export function removeIntegrityLock(scopeKey: string): void {
  const locks = readLocks();
  delete locks[scopeKey];
  writeLocks(locks);
}
