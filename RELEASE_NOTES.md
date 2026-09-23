# Codex Config Studio — Release Highlights

## 简体中文

- **工作台 UI/UX 重构**：简洁双栏布局、固定应用区、分组高级设置、项目/方案历史子页与只读预览；加入草稿放弃确认、弹窗焦点管理和键盘导航。五语言、深浅主题、完整预览、继承配置和历史方案提示均保留。写入较慢时不再提前解锁，避免重复提交。
- **方案版本 · v0.4.0**: 历史快照保留原有模型、思考等级和子 Agent 参数，不随新版推荐变动。 确认后只载入预览，不会立即写入配置。
- **GPT-6 快捷方案**：内置方案与新用户任务推荐改用 GPT-6 Luna / Sol / Astra；日常开发使用 GPT-6 Luna。思考等级和并发数不变，不自动覆盖已有项目配置、历史或已保存的任务偏好。Release 标题仅显示版本标签，开发版显示 `nightly`。
- **GPT-6 模型列表更新**：主模型、默认子 Agent 和当前任务的共用列表新增 `gpt-6-sol`、`gpt-6-luna`，与 `gpt-6-astra` 一起置顶；保留 GPT-5.6 系列并补充 `gpt-5.5`。本次只扩充可选模型，不自动替换现有方案、已保存的模型或思考等级，“未设置／继承”和自定义模型入口保持不变。
- **历史记录标签页**：项目配置历史移入独立标签页，支持按项目、路径或模型搜索、恢复和逐条删除。删除需二次确认，不修改项目配置或备份。README 移除了面向维护者的自动发布说明。
- 🧭 **左右双栏工作区**：左侧专注配置选择，右侧固定作用域、差异预览、二次确认与应用操作，显著缩短页面。
- 🎨 **主题与历史**：新增深/浅/系统主题、5 套强调色，以及跨 A/B/C 项目的配置历史与恢复。
- 🧯 **修复应用卡死/崩溃**：写入移到后台阻塞线程，增加防重复提交、超时解锁、串行写锁与安全临时文件写入。
- 🎯 **当前任务快速切换**：新增小修复 / 日常开发 / 复杂问题 / 架构设计 4 类任务模式。每类都可手动选择模型与 Reasoning、支持自定义模型 ID、本机记忆偏好，并可一键恢复进入任务模式前的模型设置。
- 🌐 **多语言界面**：新增简体中文、繁體中文、English、日本語、한국어；首次启动自动跟随系统/浏览器语言，也可在界面中手动切换并记住选择。
- 🚀 **一键正式发布**：Release 工作流可自动计算版本号、更新 Tauri / npm / Cargo 版本、构建三端、创建 Tag，并把安装包上传到 GitHub Release。
- 📦 **完整三端产物**：Windows 提供 NSIS `.exe`，Linux 提供 `.AppImage` 与 `.deb`，macOS 提供 Universal `.dmg`。
- ⚡ **CI 构建优化**：加入 `package-lock.json` / `Cargo.lock`、npm cache、Rust cache、Linux Tauri bundler cache、前端预检与过期构建自动取消。
- 🛡️ **配置安全**：继续支持全局/项目级 Codex 配置、逐项继承、安全备份、历史备份与原始配置恢复。

## 繁體中文

- **工作台 UI/UX 重構**：簡潔雙欄佈局、固定套用區、分組進階設定、專案/方案歷史分頁與唯讀預覽；新增放棄草稿確認、對話框焦點管理與鍵盤導覽。保留五語言、深淺主題、繼承設定與舊方案提示。寫入完成前不會提前解鎖。
- **方案版本 · v0.4.0**: 歷史快照保留原有模型、思考等級與子 Agent 參數，不隨新版推薦變動。 確認後只載入預覽，不會立即寫入設定。
- **GPT-6 快捷方案**：內建方案與新使用者任務推薦改用 GPT-6 Luna / Sol / Astra；日常開發使用 GPT-6 Luna。思考等級與並行數不變，不自動覆寫既有專案設定、歷史或已儲存的任務偏好。Release 標題只顯示版本標籤，開發版顯示 `nightly`。
- **GPT-6 模型清單更新**：主模型、預設子 Agent 與目前任務共用清單新增 `gpt-6-sol`、`gpt-6-luna`，與 `gpt-6-astra` 一起置頂；保留 GPT-5.6 系列並補上 `gpt-5.5`。本次只擴充可選模型，不自動替換既有方案、已儲存的模型或思考等級，「未設定／繼承」與自訂模型入口保持不變。
- **歷史記錄分頁**：專案設定歷史移至獨立分頁，可依專案、路徑或模型搜尋、還原及逐筆刪除。刪除需再次確認，不修改專案設定或備份。README 移除了維護者用的自動發佈說明。
- 🎯 **目前任務快速切換**：新增小修復 / 日常開發 / 複雜問題 / 架構設計 4 類任務模式。每類都可手動選擇模型與 Reasoning、支援自訂模型 ID、本機記憶偏好，並可一鍵恢復進入任務模式前的模型設定。
- 🌐 **多語言介面**：新增简体中文、繁體中文、English、日本語、한국어；首次啟動會自動依系統/瀏覽器語言選擇，也可手動切換並記住選擇。
- 🚀 **一鍵正式發佈**：Release 工作流程可自動計算版本號、更新 Tauri / npm / Cargo 版本、建置三端、建立 Tag，並將安裝檔上傳到 GitHub Release。
- 📦 **完整三端產物**：Windows 提供 NSIS `.exe`，Linux 提供 `.AppImage` 與 `.deb`，macOS 提供 Universal `.dmg`。
- ⚡ **CI 建置優化**：加入 `package-lock.json` / `Cargo.lock`、npm cache、Rust cache、Linux Tauri bundler cache、前端預檢與自動取消過期建置。
- 🛡️ **設定安全**：持續支援全域/專案級 Codex 設定、逐項繼承、安全備份、歷史備份與原始設定還原。

## English

- **Workspace UI/UX redesign**: Clean split layout, pinned apply controls, grouped advanced settings, project/profile history views and read-only previews. Added unsaved-draft confirmation, accessible modal focus handling and keyboard tabs. Preserved five languages, themes, complete configuration previews, inheritance and archived-profile warnings. Slow writes keep their lock until the native operation actually finishes.
- **Profile version · v0.4.0**: Archived snapshots retain their original models, reasoning levels and sub-agent settings; new recommendations never rewrite them. Confirming only loads a preview; it does not write configuration.
- **GPT-6 presets**: Built-in profiles and fresh task recommendations now use GPT-6 Luna / Sol / Astra; Daily uses GPT-6 Luna. Reasoning and concurrency are unchanged. Existing project files, history and saved task preferences are not migrated. Release titles show only the version tag; development builds use `nightly`.
- **GPT-6 model catalog update**: Added `gpt-6-sol` and `gpt-6-luna` to the shared main-model, default sub-agent and current-task selectors, alongside `gpt-6-astra` at the top. Retained the GPT-5.6 family and added `gpt-5.5`. This only expands the choices; existing presets, saved models, reasoning levels, unset/inherit and custom model IDs remain unchanged.
- **History tab**: Project configuration history now has a dedicated tab with project/path/model search, restore, and per-entry deletion. Deletion requires confirmation and preserves configuration and backups. Maintainer release instructions were removed from the READMEs.
- 🧭 **Two-column workspace**: Configuration stays on the left while scope, diff review, confirmation, apply actions, and history stay visible on the right.
- 🎨 **Themes and history**: Added system/dark/light themes, five accent colors, and cross-project A/B/C configuration history with restore.
- 🧯 **Apply freeze/crash hardening**: Writes now run off the UI thread with duplicate-submit protection, timeout recovery, a serialized write lock, and safer temporary-file writes.
- 🎯 **Current Task quick switching**: Added Quick Fix / Daily Development / Complex Problem / Architecture modes. Every mode supports manual model + reasoning selection, custom model IDs, locally remembered preferences, and one-click restoration of the pre-task model baseline.
- 🌐 **Multilingual UI**: Added Simplified Chinese, Traditional Chinese, English, Japanese, and Korean. The app follows the system/browser language on first launch and remembers manual language changes.
- 🚀 **One-click formal releases**: The Release workflow can calculate the next version, update Tauri/npm/Cargo versions, build all desktop targets, create the Git tag, and upload installers to GitHub Releases automatically.
- 📦 **Complete cross-platform artifacts**: Windows NSIS `.exe`, Linux `.AppImage` + `.deb`, and macOS Universal `.dmg`.
- ⚡ **Faster CI**: Added npm/Cargo lockfiles, npm cache, Rust cache, Linux Tauri bundler cache, frontend preflight checks, and automatic cancellation of obsolete builds.
- 🛡️ **Safe configuration management**: Global/project Codex scopes, per-field inheritance, original backups, history backups, and restore support remain included.

## 日本語

- **UI/UX を刷新**：二列レイアウト、固定適用ボタン、設定のグループ化、プロジェクト/プロファイル履歴と読み取り専用プレビュー。草稿破棄の確認、フォーカス管理、キーボード操作を追加。多言語、テーマ、継承と履歴警告を維持し、書き込み完了前のロック解除を防止。
- **プロファイルの版 · v0.4.0**: 履歴には元のモデル、思考レベル、サブ Agent 設定を保存し、新しい推奨値で上書きしません。 確認後はプレビューのみで、設定は書き込みません。
- **GPT-6 プロファイル**：内蔵設定と新規タスクの推奨値を GPT-6 Luna / Sol / Astra へ更新し、日常開発は GPT-6 Luna を使用します。思考レベルと並列数は変更せず、既存の設定・履歴・保存済み選択を上書きしません。Release タイトルはバージョンタグのみ、開発版は `nightly` と表示します。
- **GPT-6 モデル一覧を更新**：メインモデル、既定のサブ Agent、現在のタスクで共有する一覧に `gpt-6-sol` と `gpt-6-luna` を追加し、`gpt-6-astra` とともに先頭へ配置しました。GPT-5.6 系列は保持し、`gpt-5.5` も追加しました。選択肢のみの追加で、既存プロファイル、保存済みモデル、思考レベル、未設定／継承、カスタムモデル ID は変更しません。
- **履歴タブ**：プロジェクト設定の履歴を専用タブに移動し、プロジェクト・パス・モデルの検索、復元、個別削除に対応しました。削除には確認が必要で、設定とバックアップは保持します。README から管理者向けリリース手順を削除しました。
- 🎯 **現在のタスク切り替え**：小さな修正 / 日常開発 / 複雑な問題 / アーキテクチャの 4 モードを追加。モデルと思考レベルを手動選択でき、カスタムモデル ID、ローカル設定保存、タスク開始前へのワンクリック復元に対応しました。
- 🌐 **多言語 UI**：簡体字中国語、繁体字中国語、英語、日本語、韓国語を追加。初回起動時はシステム/ブラウザー言語に自動追従し、手動変更も保存されます。
- 🚀 **ワンクリック正式リリース**：Release ワークフローが次のバージョン計算、Tauri/npm/Cargo のバージョン更新、3 プラットフォームのビルド、Tag 作成、GitHub Release への成果物アップロードまで自動化します。
- 📦 **クロスプラットフォーム成果物**：Windows は NSIS `.exe`、Linux は `.AppImage` + `.deb`、macOS は Universal `.dmg` を提供します。
- ⚡ **CI 高速化**：npm/Cargo lockfile、npm cache、Rust cache、Linux Tauri bundler cache、フロントエンド事前チェック、古いビルドの自動キャンセルを追加しました。
- 🛡️ **安全な設定管理**：グローバル/プロジェクト設定、項目単位の継承、元設定バックアップ、履歴バックアップ、復元機能を引き続き提供します。

## 한국어

- **UI/UX 개선**: 두 열 레이아웃, 고정 적용 영역, 설정 그룹, 프로젝트/프로필 기록 및 읽기 전용 미리보기. 초안 폐기 확인, 포커스 관리 및 키보드 탭 조작을 추가했습니다. 다국어, 테마, 상속, 보관 프로필 경고를 유지하며 쓰기 완료 전 잠금을 해제하지 않습니다.
- **프로필 버전 · v0.4.0**: 보관된 스냅샷은 원래 모델, 사고 수준 및 서브 Agent 설정을 유지하며 새 추천값으로 덮어쓰지 않습니다. 확인하면 미리보기만 불러오며 설정 파일에 쓰지 않습니다.
- **GPT-6 프로필**: 기본 프로필과 새 작업 추천을 GPT-6 Luna / Sol / Astra로 변경하고 일상 개발은 GPT-6 Luna를 사용합니다. 사고 수준과 동시 실행 수는 유지하며 기존 설정, 기록, 저장된 선호를 덮어쓰지 않습니다. Release 제목은 버전 태그만 표시하고 개발판은 `nightly`로 표시합니다.
- **GPT-6 모델 목록 업데이트**: 메인 모델, 기본 서브 Agent, 현재 작업에서 공유하는 목록에 `gpt-6-sol`과 `gpt-6-luna`를 추가하고 `gpt-6-astra`와 함께 상단에 배치했습니다. GPT-5.6 계열을 유지하고 `gpt-5.5`도 추가했습니다. 선택지만 확장하며 기존 프로필, 저장된 모델, 사고 수준, 미설정/상속 및 사용자 지정 모델 ID는 변경하지 않습니다.
- **기록 탭**: 프로젝트 설정 기록을 별도 탭으로 이동하고 프로젝트/경로/모델 검색, 복원 및 개별 삭제를 추가했습니다. 삭제 전 확인이 필요하며 설정과 백업은 유지됩니다. README에서 관리자용 릴리스 안내를 제거했습니다.
- 🎯 **현재 작업 빠른 전환**: 작은 수정 / 일상 개발 / 복잡한 문제 / 아키텍처 4개 모드를 추가했습니다. 모델과 사고 수준을 직접 선택하고 사용자 지정 모델 ID, 로컬 선호 저장, 작업 모드 이전 설정 복원을 지원합니다.
- 🌐 **다국어 UI**: 중국어 간체, 중국어 번체, 영어, 일본어, 한국어를 추가했습니다. 첫 실행 시 시스템/브라우저 언어를 자동 감지하며, 수동으로 선택한 언어도 저장됩니다.
- 🚀 **원클릭 정식 릴리스**: Release 워크플로가 다음 버전 계산, Tauri/npm/Cargo 버전 갱신, 3개 플랫폼 빌드, Tag 생성, GitHub Release에 설치 파일 업로드까지 자동으로 처리합니다.
- 📦 **완전한 멀티플랫폼 산출물**: Windows NSIS `.exe`, Linux `.AppImage` + `.deb`, macOS Universal `.dmg`를 제공합니다.
- ⚡ **CI 빌드 최적화**: npm/Cargo lockfile, npm cache, Rust cache, Linux Tauri bundler cache, 프론트엔드 사전 검사, 오래된 빌드 자동 취소를 추가했습니다.
- 🛡️ **안전한 설정 관리**: 전역/프로젝트 Codex 설정, 필드별 상속, 원본 백업, 히스토리 백업, 원본 복원 기능을 계속 제공합니다.
