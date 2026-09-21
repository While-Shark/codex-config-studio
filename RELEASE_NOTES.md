# Codex Config Studio — Release Highlights

## 简体中文

- 🎯 **当前任务快速切换**：新增小修复 / 日常开发 / 复杂问题 / 架构设计 4 类任务模式。每类都可手动选择模型与 Reasoning、支持自定义模型 ID、本机记忆偏好，并可一键恢复进入任务模式前的模型设置。
- 🌐 **多语言界面**：新增简体中文、繁體中文、English、日本語、한국어；首次启动自动跟随系统/浏览器语言，也可在界面中手动切换并记住选择。
- 🚀 **一键正式发布**：Release 工作流可自动计算版本号、更新 Tauri / npm / Cargo 版本、构建三端、创建 Tag，并把安装包上传到 GitHub Release。
- 📦 **完整三端产物**：Windows 提供 NSIS `.exe`，Linux 提供 `.AppImage` 与 `.deb`，macOS 提供 Universal `.dmg`。
- ⚡ **CI 构建优化**：加入 `package-lock.json` / `Cargo.lock`、npm cache、Rust cache、Linux Tauri bundler cache、前端预检与过期构建自动取消。
- 🛡️ **配置安全**：继续支持全局/项目级 Codex 配置、逐项继承、安全备份、历史备份与原始配置恢复。

## 繁體中文

- 🎯 **目前任務快速切換**：新增小修復 / 日常開發 / 複雜問題 / 架構設計 4 類任務模式。每類都可手動選擇模型與 Reasoning、支援自訂模型 ID、本機記憶偏好，並可一鍵恢復進入任務模式前的模型設定。
- 🌐 **多語言介面**：新增简体中文、繁體中文、English、日本語、한국어；首次啟動會自動依系統/瀏覽器語言選擇，也可手動切換並記住選擇。
- 🚀 **一鍵正式發佈**：Release 工作流程可自動計算版本號、更新 Tauri / npm / Cargo 版本、建置三端、建立 Tag，並將安裝檔上傳到 GitHub Release。
- 📦 **完整三端產物**：Windows 提供 NSIS `.exe`，Linux 提供 `.AppImage` 與 `.deb`，macOS 提供 Universal `.dmg`。
- ⚡ **CI 建置優化**：加入 `package-lock.json` / `Cargo.lock`、npm cache、Rust cache、Linux Tauri bundler cache、前端預檢與自動取消過期建置。
- 🛡️ **設定安全**：持續支援全域/專案級 Codex 設定、逐項繼承、安全備份、歷史備份與原始設定還原。

## English

- 🎯 **Current Task quick switching**: Added Quick Fix / Daily Development / Complex Problem / Architecture modes. Every mode supports manual model + reasoning selection, custom model IDs, locally remembered preferences, and one-click restoration of the pre-task model baseline.
- 🌐 **Multilingual UI**: Added Simplified Chinese, Traditional Chinese, English, Japanese, and Korean. The app follows the system/browser language on first launch and remembers manual language changes.
- 🚀 **One-click formal releases**: The Release workflow can calculate the next version, update Tauri/npm/Cargo versions, build all desktop targets, create the Git tag, and upload installers to GitHub Releases automatically.
- 📦 **Complete cross-platform artifacts**: Windows NSIS `.exe`, Linux `.AppImage` + `.deb`, and macOS Universal `.dmg`.
- ⚡ **Faster CI**: Added npm/Cargo lockfiles, npm cache, Rust cache, Linux Tauri bundler cache, frontend preflight checks, and automatic cancellation of obsolete builds.
- 🛡️ **Safe configuration management**: Global/project Codex scopes, per-field inheritance, original backups, history backups, and restore support remain included.

## 日本語

- 🎯 **現在のタスク切り替え**：小さな修正 / 日常開発 / 複雑な問題 / アーキテクチャの 4 モードを追加。モデルと思考レベルを手動選択でき、カスタムモデル ID、ローカル設定保存、タスク開始前へのワンクリック復元に対応しました。
- 🌐 **多言語 UI**：簡体字中国語、繁体字中国語、英語、日本語、韓国語を追加。初回起動時はシステム/ブラウザー言語に自動追従し、手動変更も保存されます。
- 🚀 **ワンクリック正式リリース**：Release ワークフローが次のバージョン計算、Tauri/npm/Cargo のバージョン更新、3 プラットフォームのビルド、Tag 作成、GitHub Release への成果物アップロードまで自動化します。
- 📦 **クロスプラットフォーム成果物**：Windows は NSIS `.exe`、Linux は `.AppImage` + `.deb`、macOS は Universal `.dmg` を提供します。
- ⚡ **CI 高速化**：npm/Cargo lockfile、npm cache、Rust cache、Linux Tauri bundler cache、フロントエンド事前チェック、古いビルドの自動キャンセルを追加しました。
- 🛡️ **安全な設定管理**：グローバル/プロジェクト設定、項目単位の継承、元設定バックアップ、履歴バックアップ、復元機能を引き続き提供します。

## 한국어

- 🎯 **현재 작업 빠른 전환**: 작은 수정 / 일상 개발 / 복잡한 문제 / 아키텍처 4개 모드를 추가했습니다. 모델과 사고 수준을 직접 선택하고 사용자 지정 모델 ID, 로컬 선호 저장, 작업 모드 이전 설정 복원을 지원합니다.
- 🌐 **다국어 UI**: 중국어 간체, 중국어 번체, 영어, 일본어, 한국어를 추가했습니다. 첫 실행 시 시스템/브라우저 언어를 자동 감지하며, 수동으로 선택한 언어도 저장됩니다.
- 🚀 **원클릭 정식 릴리스**: Release 워크플로가 다음 버전 계산, Tauri/npm/Cargo 버전 갱신, 3개 플랫폼 빌드, Tag 생성, GitHub Release에 설치 파일 업로드까지 자동으로 처리합니다.
- 📦 **완전한 멀티플랫폼 산출물**: Windows NSIS `.exe`, Linux `.AppImage` + `.deb`, macOS Universal `.dmg`를 제공합니다.
- ⚡ **CI 빌드 최적화**: npm/Cargo lockfile, npm cache, Rust cache, Linux Tauri bundler cache, 프론트엔드 사전 검사, 오래된 빌드 자동 취소를 추가했습니다.
- 🛡️ **안전한 설정 관리**: 전역/프로젝트 Codex 설정, 필드별 상속, 원본 백업, 히스토리 백업, 원본 복원 기능을 계속 제공합니다.
