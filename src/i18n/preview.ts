/** Feature-scoped translations for the complete configuration preview. */
export type PreviewCopy = {
  title: string;
  changed: string;
  unchanged: string;
  unread: string;
  summary: string;
  pending: string;
  before: string;
  after: string;
};

const copies: Record<string, PreviewCopy> = {
  "zh-CN": {
    "title": "配置预览",
    "changed": "将变更",
    "unchanged": "未变更",
    "unread": "尚未比较",
    "summary": "全部 {total} 项配置 · {changed} 项变更",
    "pending": "全部 {total} 项配置 · 待读取当前配置",
    "before": "当前文件中的值",
    "after": "待应用值"
  },
  "zh-TW": {
    "title": "設定預覽",
    "changed": "將變更",
    "unchanged": "未變更",
    "unread": "尚未比較",
    "summary": "全部 {total} 項設定 · {changed} 項變更",
    "pending": "全部 {total} 項設定 · 待讀取目前設定",
    "before": "目前檔案中的值",
    "after": "待套用值"
  },
  "en": {
    "title": "Configuration preview",
    "changed": "Will change",
    "unchanged": "Unchanged",
    "unread": "Not compared",
    "summary": "All {total} settings · {changed} changes",
    "pending": "All {total} settings · waiting for current configuration",
    "before": "Value in current file",
    "after": "Pending value"
  },
  "ja": {
    "title": "設定プレビュー",
    "changed": "変更予定",
    "unchanged": "変更なし",
    "unread": "未比較",
    "summary": "全 {total} 項目 · {changed} 項目を変更",
    "pending": "全 {total} 項目 · 現在の設定を読み込み待ち",
    "before": "現在のファイルの値",
    "after": "適用予定の値"
  },
  "ko": {
    "title": "설정 미리보기",
    "changed": "변경 예정",
    "unchanged": "변경 없음",
    "unread": "비교 전",
    "summary": "전체 {total}개 설정 · {changed}개 변경",
    "pending": "전체 {total}개 설정 · 현재 설정 읽기 대기",
    "before": "현재 파일의 값",
    "after": "적용할 값"
  }
};

export function previewText(locale: string): PreviewCopy {
  return copies[locale] ?? copies.en;
}
