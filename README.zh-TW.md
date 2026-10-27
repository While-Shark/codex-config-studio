<div align="center">

<img src="./src-tauri/icons/icon.svg" width="96" alt="Codex Config Studio">

# Codex Config Studio

**更安全、更直覺的 Codex 桌面設定控制台。**

不必手動編輯 `.codex/config.toml`，即可切換模型與 Reasoning 方案、管理全域/專案設定、核驗 Model Integrity、查看本機用量，並透過簽名更新安全升級。

[![Release](https://img.shields.io/github/v/release/While-Shark/codex-config-studio)](https://github.com/While-Shark/codex-config-studio/releases/latest)
[![Build Desktop](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml/badge.svg)](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml)
![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-blue)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB)

[简体中文](./README.zh-CN.md) · **繁體中文** · [English](./README.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md)

[下載](#下載) · [功能重點](#功能重點) · [內建方案](#內建方案) · [安全設計](#安全設計) · [開發](#開發)

</div>

---

## 為什麼需要 Codex Config Studio？

Codex 很強，但真實專案中的設定很快就會超過幾行：不同專案需要不同模型、Reasoning、子 Agent、安全檢查與更新策略。

**Codex Config Studio 把這些設定變成可視化、可回復、以專案為中心的工作流程。**

## 功能重點

| Profile | Main model | Main reasoning | Plan reasoning | Sub-agent model | Agent reasoning | Concurrency | Purpose |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ⚡ | `gpt-6-luna` | `low` | `low` | — | — | — | Small edits |
| 🌍 | `gpt-6-luna` | `medium` | `medium` | — | — | — | Routine CRUD |
| 🩺 | `gpt-6.1-terra` | `medium` | `high` | `gpt-6.1-terra` | `medium` | 2 | Daily development |
| 🔒 | `gpt-6.1-sol` | `medium` | `high` | `gpt-6.1-terra` | `medium` | 2 | Cross-file work |
| 📊 | `gpt-6-astra` | `high` | `xhigh` | `gpt-6.1-sol` | `medium` | 2 | Architecture/review |
| 🛡️ | `gpt-6-astra` | `xhigh` | `xhigh` | `gpt-6.1-sol` | `high` | 3 | Hardest problems |
| 🔄 | **簽名更新** | 自動檢查穩定版，使用者確認後在應用內驗證簽名並安裝更新。 |
| 🌐 | **跨平台 + 多語言** | Windows、Linux、macOS；支援英文、簡中、繁中、日文、韓文。 |

## 內建方案

| 方案 | 模型組合 | 適合情境 |
| --- | --- | --- |
| **Token Saver** | GPT-6 Luna low · Plan low | 小修改、批次替換、明確任務 |
| **Economy** | GPT-6 Luna medium · Plan medium | CRUD、前端修改、一般 API |
| **Daily** | GPT-6 Luna medium + Luna medium 子 Agent | 日常開發 |
| **Balanced** | GPT-6.1 Sol medium + Luna medium 子 Agent | 跨檔案功能、重構、整合 |
| **Astra Director** | GPT-6 Astra high/xhigh + GPT-6.1 Sol medium 子 Agent | 架構、任務拆解、複雜執行、Review |
| **Max Quality** | GPT-6 Astra xhigh + GPT-6.1 Sol high 子 Agent | 疑難 Bug、大型重構、發佈前 Review |

這些方案只是起點，不會鎖死。你可以在 UI 中繼續修改模型、Reasoning、子 Agent 與並行數。

目前方案版本：**GPT-6.1 Terra · 2026-10-27**。v0.6.4, v0.6.1 的 GPT-6.1 方案、GPT-6 v0.5.0 方案與舊版 v0.4.0 方案會繼續作為唯讀歷史快照保留。

## Config Health & Model Integrity

### Config Health

- 使用近期權威 Codex 設定 schema。
- 一般寫入預設保留未知欄位與未來新增欄位。
- 清理未知欄位前必須明確確認。
- 當模型中繼資料提供最低客戶端版本時，可檢查本機 Codex CLI 相容性。
- 快取可信 schema / 模型中繼資料，離線時仍可使用最近可信資料。

### Model Integrity

- 為範圍鎖定有效的 `model` 與 `model_reasoning_effort`。
- 偵測 Studio 可見的設定漂移。
- 讀取本機 Codex rollout 證據，顯示近期實際模型/Reasoning 與可觀測 reroute。
- 不會把未記錄或不可觀測的伺服器內部路由描述成本機可驗證事實。

## 用量分析

用量儀表板以**唯讀**方式讀取本機 Codex rollout JSONL，可顯示：

- 7 天 / 30 天 / 全期間 Token 用量；
- 模型與 Reasoning 趨勢；
- 主工作階段與子 Agent 用量；
- 可觀測 reroute 歷史；
- 最近專案活動；
- 可解釋的 Token 突增提示；
- 版本化參考成本。

參考成本以帶日期的價格快照與本機可觀測中繼資料計算，**不是官方帳單資料**。

## 下載

下載最新正式版：

**[GitHub Releases →](https://github.com/While-Shark/codex-config-studio/releases/latest)**

| 平台 | 安裝包 |
| --- | --- |
| Windows x64 | NSIS `.exe` |
| Linux x64 | `.AppImage` + `.deb` |
| macOS Universal | `.dmg`，支援 Apple Silicon + Intel |

正式 Release 包含 updater 簽名、SHA-256 校驗和與 GitHub build provenance。

## 簽名自動更新

正式建置會：

1. 自動檢查最新**穩定版**；
2. 主動提示新版本；
3. 驗證簽名 updater 套件；
4. 僅在使用者確認後安裝；
5. 安裝完成後重新啟動進入新版本。

應用長時間執行時會定期複查；自動檢查失敗不會打擾使用，未簽名/dev 建置會安全回退到 GitHub Release 頁面。

## 安全設計

Codex Config Studio 對設定寫入採取保守策略。

- 只修改 Studio 管理的模型 / Agent 設定鍵。
- 未知與未來欄位預設保留。
- 不修改 project trust、plugins、MCP、hooks、marketplaces。
- 寫入使用備份、歷史紀錄、序列化原生寫鎖與安全暫存檔替換。
- 專案備份保存在 `~/.codex/.config-studio-backups/`。
- 前端不開放通用檔案系統或 Shell 權限。

## 設定優先級

由高到低：

1. CLI flags / `--config`
2. 專案 `.codex/config.toml`
3. `--profile`
4. 全域 `~/.codex/config.toml`
5. 系統 / 內建預設

> Codex 只會載入受信任專案中的專案級設定。Codex Config Studio 不會自動修改 project trust。

## 開發

### Windows

```powershell
./run-dev.ps1
```

### Linux / macOS

```bash
bash ./run-dev.sh
```

或使用標準 Tauri 流程：

```bash
npm ci
npm run tauri:dev
```

本機打包：

```text
Windows:       ./build-windows.ps1
Linux/macOS:   bash ./build-unix.sh
```

---

<div align="center">

**讓 Codex 設定更強大，但不脆弱。**

[最新版本](https://github.com/While-Shark/codex-config-studio/releases/latest) · [Release Notes](./RELEASE_NOTES.md)

</div>
