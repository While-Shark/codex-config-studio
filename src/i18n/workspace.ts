export type WorkspaceCopy = {
  title: string;
  subtitle: string;
  guide: string;
  appearance: string;
  preview: string;
  selected: string;
  primary: string;
  agents: string;
  inheritTitle: string;
  inheritHelp: string;
  safety: string;
  dirty: string;
  saved: string;
  more: string;
  autoCreate: string;
  projectHistory: string;
  presetHistory: string;
  discardTitle: string;
  discardBody: string;
  discard: string;
  continueEditing: string;
  invalidConcurrency: string;
  waiting: string;
  success: string;
  keepDraft: string;
  historyPreview: string;
  close: string;
  noWrite: string;
  scopeChanged: string;
};

const copies: Record<string, WorkspaceCopy> = {
  "en": {
    "title": "Configuration workspace",
    "subtitle": "Choose a setup. Review before applying.",
    "guide": "Quick guide",
    "appearance": "Appearance",
    "preview": "Select & preview",
    "selected": "Selected",
    "primary": "Main model",
    "agents": "Sub-agents",
    "inheritTitle": "Unset / inherit",
    "inheritHelp": "Removes this field from the selected configuration layer. Other layers may still supply it. Fixed reasoning may override manual changes in Codex.",
    "safety": "Backups and confirmation are always on.",
    "dirty": "Unapplied changes",
    "saved": "Up to date",
    "more": "More actions",
    "autoCreate": "This file will be created when you apply.",
    "projectHistory": "Project history",
    "presetHistory": "Profile archive",
    "discardTitle": "Discard unapplied changes?",
    "discardBody": "Changing the target or reloading will replace your current draft. No changes have been written yet.",
    "discard": "Discard and continue",
    "continueEditing": "Keep editing",
    "invalidConcurrency": "Concurrency must be a whole number between 1 and 16.",
    "waiting": "Still writing. Please wait; do not submit again.",
    "success": "Configuration written. History is available in the History tab.",
    "keepDraft": "Cancel keeps your draft.",
    "historyPreview": "Preview configuration",
    "close": "Close",
    "noWrite": "Preview only. Nothing has been written.",
    "scopeChanged": "The target or configuration changed. Review again before applying."
  },
  "zh-CN": {
    "title": "配置工作台",
    "subtitle": "选好配置，再确认写入。",
    "guide": "使用指南",
    "appearance": "外观设置",
    "preview": "选择并预览",
    "selected": "已选中",
    "primary": "基础模型",
    "agents": "子 Agent 策略",
    "inheritTitle": "未设置 / 继承",
    "inheritHelp": "从当前作用域移除该配置项，其他层级仍可能提供值。固定思考等级可能影响 Codex 内的手动调整。",
    "safety": "自动备份与二次确认始终开启。",
    "dirty": "有未应用的更改",
    "saved": "配置已同步",
    "more": "更多操作",
    "autoCreate": "应用时将自动创建此配置文件。",
    "projectHistory": "项目历史",
    "presetHistory": "方案历史",
    "discardTitle": "放弃未应用的更改？",
    "discardBody": "切换目标或重新读取将替换当前草稿。这些修改尚未写入文件。",
    "discard": "放弃并继续",
    "continueEditing": "继续编辑",
    "invalidConcurrency": "最大并发必须是 1–16 之间的整数。",
    "waiting": "仍在写入，请稍候，不要重复提交。",
    "success": "配置已写入，可在历史记录中查看。",
    "keepDraft": "取消会保留当前草稿。",
    "historyPreview": "预览配置",
    "close": "关闭",
    "noWrite": "仅预览，尚未写入配置。",
    "scopeChanged": "目标或配置已变化，请重新检查后应用。"
  },
  "zh-TW": {
    "title": "設定工作台",
    "subtitle": "選好設定，再確認寫入。",
    "guide": "使用指南",
    "appearance": "外觀設定",
    "preview": "選擇並預覽",
    "selected": "已選取",
    "primary": "基礎模型",
    "agents": "子 Agent 策略",
    "inheritTitle": "未設定 / 繼承",
    "inheritHelp": "從目前範圍移除此設定項，其他層級仍可能提供值。固定思考等級可能影響 Codex 內的手動調整。",
    "safety": "自動備份與再次確認始終開啟。",
    "dirty": "有未套用的變更",
    "saved": "設定已同步",
    "more": "更多操作",
    "autoCreate": "套用時將自動建立此設定檔。",
    "projectHistory": "專案歷史",
    "presetHistory": "方案歷史",
    "discardTitle": "放棄未套用的變更？",
    "discardBody": "切換目標或重新讀取將取代目前草稿。變更尚未寫入檔案。",
    "discard": "放棄並繼續",
    "continueEditing": "繼續編輯",
    "invalidConcurrency": "最大並行數必須是 1–16 之間的整數。",
    "waiting": "仍在寫入，請稍候，不要重複提交。",
    "success": "設定已寫入，可在歷史記錄中查看。",
    "keepDraft": "取消會保留草稿。",
    "historyPreview": "預覽設定",
    "close": "關閉",
    "noWrite": "僅預覽，尚未寫入設定。",
    "scopeChanged": "目標或設定已變更，請重新確認。"
  },
  "ja": {
    "title": "設定ワークスペース",
    "subtitle": "設定を選び、確認してから適用。",
    "guide": "使い方",
    "appearance": "外観",
    "preview": "選択してプレビュー",
    "selected": "選択中",
    "primary": "基本モデル",
    "agents": "サブ Agent",
    "inheritTitle": "未設定 / 継承",
    "inheritHelp": "現在の範囲から項目を削除します。別の層の値は有効です。固定の思考レベルは Codex での手動変更に影響する場合があります。",
    "safety": "バックアップと確認は常に有効です。",
    "dirty": "未適用の変更",
    "saved": "設定は同期済み",
    "more": "その他の操作",
    "autoCreate": "適用時に設定ファイルを作成します。",
    "projectHistory": "プロジェクト履歴",
    "presetHistory": "プロファイル履歴",
    "discardTitle": "未適用の変更を破棄しますか？",
    "discardBody": "対象の変更または再読み込みで草稿が置き換わります。ファイルにはまだ書き込まれていません。",
    "discard": "破棄して続行",
    "continueEditing": "編集を続ける",
    "invalidConcurrency": "並列数は 1〜16 の整数にしてください。",
    "waiting": "書き込み中です。再送せずお待ちください。",
    "success": "設定を書き込みました。履歴タブで確認できます。",
    "keepDraft": "キャンセルで草稿を保持。",
    "historyPreview": "設定をプレビュー",
    "close": "閉じる",
    "noWrite": "プレビューのみ。書き込みません。",
    "scopeChanged": "対象または設定が変わりました。再確認してください。"
  },
  "ko": {
    "title": "설정 작업 공간",
    "subtitle": "설정을 선택하고 확인 후 적용하세요.",
    "guide": "사용 안내",
    "appearance": "테마 설정",
    "preview": "선택 및 미리보기",
    "selected": "선택됨",
    "primary": "기본 모델",
    "agents": "서브 Agent",
    "inheritTitle": "미설정 / 상속",
    "inheritHelp": "현재 범위에서 항목을 제거합니다. 다른 계층의 값은 유효합니다. 고정 사고 수준은 Codex에서 수동 변경에 영향을 줄 수 있습니다.",
    "safety": "백업과 재확인은 항상 사용됩니다.",
    "dirty": "적용하지 않은 변경",
    "saved": "설정 동기화됨",
    "more": "더 많은 작업",
    "autoCreate": "적용 시 설정 파일을 생성합니다.",
    "projectHistory": "프로젝트 기록",
    "presetHistory": "프로필 기록",
    "discardTitle": "미적용 변경을 버릴까요?",
    "discardBody": "대상을 변경하거나 다시 불러오면 초안이 교체됩니다. 아직 파일에 쓰지 않았습니다.",
    "discard": "버리고 계속",
    "continueEditing": "계속 편집",
    "invalidConcurrency": "동시 수는 1–16 사이의 정수여야 합니다.",
    "waiting": "쓰는 중입니다. 재전송하지 말고 기다려 주세요.",
    "success": "설정을 저장했습니다. 기록 탭에서 확인하세요.",
    "keepDraft": "취소하면 초안을 유지합니다.",
    "historyPreview": "설정 미리보기",
    "close": "닫기",
    "noWrite": "미리보기만 합니다. 파일에 쓰지 않습니다.",
    "scopeChanged": "대상 또는 설정이 변경되었습니다. 다시 확인하세요."
  }
};

export function workspaceText(locale: string): WorkspaceCopy { return copies[locale] ?? copies.en; }
