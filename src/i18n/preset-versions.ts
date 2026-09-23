export type PresetVersionCopy = {
  version: string; current: string; archived: string; currentHelp: string;
  archiveHelp: string; warning: string; previewOnly: string; confirmTitle: string; loadPreview: string;
  loaded: string; source: string; archivedSource: string; changedScope: string;
};
const copy: Record<string, PresetVersionCopy> = {
  'zh-CN': {
    version: '方案版本', current: '当前推荐', archived: '历史备份',
    currentHelp: '当前推荐使用 GPT-6。旧方案已完整保存在历史版本中；浏览版本不会修改配置。',
    archiveHelp: '历史快照保留原有模型、思考等级和子 Agent 参数，不随新版推荐变动。',
    warning: '这是历史方案，包含旧模型和固定思考等级。旧模型的可用性与费用以你的账号或服务商为准；固定等级可能影响 Codex 内的手动调整。',
    previewOnly: '确认后只载入预览，不会立即写入配置。',
    confirmTitle: '载入历史快捷方案？', loadPreview: '确认并载入预览',
    loaded: '已载入历史方案，请在右侧检查后再应用。',
    source: '方案来源', archivedSource: '基于历史方案',
    changedScope: '配置或作用域已变化，本次选择已取消，请重新确认。',
  },
  'zh-TW': {
    version: '方案版本', current: '目前推薦', archived: '歷史備份',
    currentHelp: '目前推薦使用 GPT-6。舊方案已完整保留在歷史版本中；瀏覽版本不會修改設定。',
    archiveHelp: '歷史快照保留原有模型、思考等級與子 Agent 參數，不隨新版推薦變動。',
    warning: '這是歷史方案，包含舊模型與固定思考等級。舊模型的可用性與費用以帳號或服務商為準；固定等級可能影響 Codex 內的手動調整。',
    previewOnly: '確認後只載入預覽，不會立即寫入設定。',
    confirmTitle: '載入歷史快捷方案？', loadPreview: '確認並載入預覽',
    loaded: '已載入歷史方案，請在右側檢查後再套用。',
    source: '方案來源', archivedSource: '以歷史方案為基礎',
    changedScope: '設定或範圍已變更，已取消本次選擇，請重新確認。',
  },
  en: {
    version: 'Profile version', current: 'Current', archived: 'Archived',
    currentHelp: 'Current recommendations use GPT-6. Complete older profiles remain in the archive. Browsing versions does not change configuration.',
    archiveHelp: 'Archived snapshots retain their original models, reasoning levels and sub-agent settings; new recommendations never rewrite them.',
    warning: 'This archived profile uses older models and fixed reasoning levels. Availability and pricing depend on your account or provider. Fixed levels may affect manual adjustments in Codex.',
    previewOnly: 'Confirming only loads a preview; it does not write configuration.',
    confirmTitle: 'Load an archived profile?', loadPreview: 'Confirm and load preview',
    loaded: 'Archived profile loaded. Review it on the right before applying.',
    source: 'Profile source', archivedSource: 'Based on archived profile',
    changedScope: 'The configuration or scope changed. Selection was cancelled; please review again.',
  },
  ja: {
    version: 'プロファイルの版', current: '現在の推奨', archived: '履歴バックアップ',
    currentHelp: '現在の推奨は GPT-6 を使用します。以前の設定は履歴に完全保存されています。閲覧だけでは設定を変更しません。',
    archiveHelp: '履歴には元のモデル、思考レベル、サブ Agent 設定を保存し、新しい推奨値で上書きしません。',
    warning: 'これは古いモデルと固定の思考レベルを含む履歴プロファイルです。利用可否と料金はアカウントや提供元により異なります。固定レベルは Codex 内の手動調整に影響する場合があります。',
    previewOnly: '確認後はプレビューのみで、設定は書き込みません。',
    confirmTitle: '履歴プロファイルを読み込みますか？', loadPreview: '確認してプレビューに読み込む',
    loaded: '履歴プロファイルを読み込みました。右側で確認してから適用してください。',
    source: 'プロファイルの出典', archivedSource: '履歴プロファイルに基づく設定',
    changedScope: '設定または範囲が変更されたため、選択を取り消しました。もう一度確認してください。',
  },
  ko: {
    version: '프로필 버전', current: '현재 추천', archived: '이전 버전 백업',
    currentHelp: '현재 추천은 GPT-6를 사용합니다. 이전 프로필은 기록에 완전히 보존됩니다. 버전을 살펴보는 것만으로 설정이 변경되지는 않습니다.',
    archiveHelp: '보관된 스냅샷은 원래 모델, 사고 수준 및 서브 Agent 설정을 유지하며 새 추천값으로 덮어쓰지 않습니다.',
    warning: '이전 모델과 고정 사고 수준이 포함된 보관 프로필입니다. 사용 가능 여부와 비용은 계정 또는 서비스 제공업체에 따라 다릅니다. 고정 수준은 Codex에서 수동 조정에 영향을 줄 수 있습니다.',
    previewOnly: '확인하면 미리보기만 불러오며 설정 파일에 쓰지 않습니다.',
    confirmTitle: '이전 프로필을 불러올까요?', loadPreview: '확인하고 미리보기 불러오기',
    loaded: '이전 프로필을 불러왔습니다. 오른쪽에서 검토 후 적용하세요.',
    source: '프로필 출처', archivedSource: '이전 프로필 기반',
    changedScope: '설정 또는 범위가 변경되어 선택을 취소했습니다. 다시 확인하세요.',
  },
};
export function presetVersionText(locale: string): PresetVersionCopy {
  return copy[locale] ?? copy.en;
}
