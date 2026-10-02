<div align="center">

<img src="./src-tauri/icons/icon.svg" width="96" alt="Codex Config Studio">

# Codex Config Studio

**跨平台 Codex 設定管理器：一鍵切換 Astra / Sol / Terra / Luna 方案。**

全域/專案設定 · 設定健康 · Model Integrity · 用量分析 · Reasoning · 子 Agent · 安全更新

[![Build Desktop](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml/badge.svg)](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml)
[![Release](https://img.shields.io/github/v/release/While-Shark/codex-config-studio?include_prereleases)](https://github.com/While-Shark/codex-config-studio/releases)
![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-blue)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB)
![Languages](https://img.shields.io/badge/languages-5-purple)

[简体中文](./README.zh-CN.md) · **繁體中文** · [English](./README.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md)

[簡介](#簡介) · [功能](#功能) · [方案](#內建方案) · [下載](#下載) · [開發](#本機開發) · [安全](#安全設計)

</div>

> **工作台 UI/UX 重構**：簡潔雙欄佈局、固定套用區、分組進階設定、專案/方案歷史分頁與唯讀預覽；新增放棄草稿確認、對話框焦點管理與鍵盤導覽。保留五語言、深淺主題、繼承設定與舊方案提示。寫入完成前不會提前解鎖。

---

## 簡介

Codex Config Studio 是基於 **Tauri v2** 的桌面設定管理器，用於安全管理 Codex Desktop / CLI 的全域與專案級 `.codex/config.toml`。

它適合經常在 Astra、Sol、Terra、Luna 之間切換，或希望把規劃模型、執行模型、Reasoning、子 Agent 與並行數做成可視化方案的人。

## 功能

| 能力 | 說明 |
| --- | --- |
| 🌍 全域設定 | 管理 `~/.codex/config.toml` |
| 📁 專案設定 | 管理 `<project>/.codex/config.toml` |
| 🎯 目前任務快速切換 | 小修復 / 日常開發 / 複雜問題 / 架構設計；每類都可自訂模型與 Reasoning 並記住偏好 |
| ⚡ 一鍵切換方案 | Token 節省、經濟、日常、均衡、Astra 總指揮、最高品質 |
| 🧠 Reasoning | 分別調整主模型、Plan Mode、子 Agent 思考等級 |
| 🤖 子 Agent | 開關、預設模型、Reasoning、最大並行 |
| 🧬 欄位繼承 | 專案欄位可逐項取消覆寫並繼承下層設定 |
| 🛡️ 安全備份 | 首次修改保存原始副本，每次寫入前保存歷史備份 |
| ↩️ 原始還原 | 可恢復至本應用第一次接管前的設定 |
| 🩺 設定健康 | 使用近期權威 Codex schema 驗證設定；未知/未來欄位預設保留，清理前必須確認並備份 |
| 🔒 Model Integrity | 鎖定有效模型/Reasoning、偵測設定偏移，並核對本機 Codex rollout 中可觀測的執行階段證據 |
| 📊 用量與參考成本 | 7 天 / 30 天 / 全期間用量、模型趨勢、Agent 分析、reroute 時間線與版本化參考成本 |
| 🗂️ 近期專案總覽 | 依 Config Studio 歷史彙總最近專案活動、Token、工作階段、主要模型與 reroute |
| 🔄 安全更新 | 穩定版檢查；正式簽名建置支援應用內驗證並安裝更新，未簽名建置安全回退到 Release 頁面 |
| 🌐 多語言 | 簡中、繁中、英語、日語、韓語 |
| 📦 多端建置 | Windows / Linux / macOS |

## 設定健康、Model Integrity 與用量分析

### 設定健康

設定健康中心優先使用 **OpenAI Codex 儲存庫中產生的權威設定 schema**，並在本機快取最近一次可信版本。離線、回退來源或快取過舊時仍可顯示資訊，但**不會據此產生未知欄位刪除警告**。

- 一般寫入只修改 Studio 管理的鍵，未知欄位與未來新增欄位會原樣保留。
- 移除未知欄位必須明確確認，並先建立備份與歷史記錄。
- 可顯示本機 Codex CLI 版本，並比較連續兩份權威 schema 的新增、移除與結構變更欄位。
- 官方模型目錄若宣告 `minimal_client_version`，會把目前主模型/子 Agent 與本機 Codex 版本做唯讀相容性檢查；版本過舊時只提示升級，不會隱藏模型、阻止儲存或自動修改設定。
- 僅文件描述變更不會被誤報為設定結構變更。

### Model Integrity

Model Integrity 可為目前作用域鎖定有效的 `model` 與 `model_reasoning_effort`，偵測 Studio 可見設定偏移，並與本機 Codex rollout 已記錄的執行階段證據比對。介面會顯示最近觀測到的模型/Reasoning、可觀測 reroute 次數、最近 5 筆證據，並提供唯讀手動重新整理。

> 這項機制驗證 **Studio 可見設定 + 本機已記錄 rollout 證據**。僅 CLI 臨時覆寫、未被本機記錄的行為，以及不可觀測的服務端內部路由仍不在本機保證範圍內。

### 專案用量與參考成本

專案用量儀表板以唯讀方式彙總本機 Codex rollout JSONL，支援 7 天 / 30 天 / 全期間，並提供模型/Reasoning、主工作階段/子 Agent、每日趨勢、模型趨勢、Agent 使用、可觀測 reroute 時間線、近期專案總覽，以及只依精確歷史每日用量判斷的可解釋 Token 突增提示。

參考成本使用**帶日期與版本的價格快照**。當本機 rollout 已持久化 service tier 時，會依「模型 × tier」歸屬精確回應；目前 Codex 的 `priority` 會識別為 Fast，且只有官方明確提供模型倍率時才計入 Fast 附加成本。缺少 tier 證據、出現 Flex/未知 tier、或沒有明確 Fast 倍率時會標記為近似值；長上下文與區域處理倍率不會猜測。未知模型同樣不會猜價格。所有用量與成本都是 **best-effort 本機遙測，不是正式帳單資料**。

模型候選會從 OpenAI Codex 官方 `models.json` 自動更新並在本機快取 24 小時；離線或官方來源暫時不可用時，繼續使用最近快取與內建相容清單。更新只調整可選模型，不會自動遷移既有設定、任務偏好、歷史、Preset 或自訂模型 ID。

## 內建方案

| 方案 | 主模型 | 適用情境 |
| --- | --- | --- |
| Token 節省 | GPT-6 Luna / low | 小修改、批次替換、明確任務 |
| 經濟 | GPT-6 Luna / medium | CRUD、前端修改、一般 API |
| 日常 | GPT-6 Luna + GPT-6 Luna | 多數日常開發 |
| 均衡 | GPT-6.1 Sol + GPT-6 Luna | 跨檔案功能、重構、聯調 |
| Astra 總指揮 | GPT-6 Astra + GPT-6 Luna | Astra 規劃/Review，Luna 執行 |
| 最高品質 | GPT-6 Astra xhigh + GPT-6 Luna high | 疑難 Bug、大型重構、上線前 Review |

所有方案都可以在介面裡繼續單獨修改。

## 多語言

Built in:

- 简体中文
- 繁體中文
- English
- 日本語
- 한국어

首次啟動會依系統/瀏覽器語言自動選擇；也可在頂部手動切換，選擇會儲存在本機。

## 下載

前往 **[GitHub Releases](https://github.com/While-Shark/codex-config-studio/releases)** 下載。

| 平台 | 產物 |
| --- | --- |
| Windows x64 | NSIS `.exe` |
| Linux x64 | `.AppImage` + `.deb` |
| macOS Universal | `.dmg`，同時支援 Apple Silicon 與 Intel |

> 正式 Release 工作流程已支援選用的 Windows Authenticode 與 macOS Developer ID + notarization；是否啟用取決於儲存庫簽名設定。所有正式 Release 檔案也會建立 GitHub build provenance，可用 `gh attestation verify <檔案> --repo While-Shark/codex-config-studio` 驗證來源。

## 本機開發

Windows:

```powershell
./run-dev.ps1
```

Linux / macOS:

```bash
bash ./run-dev.sh
```

Or use standard Tauri commands:

```bash
npm ci
npm run tauri:dev
```

## 本機建置

Windows:

```powershell
./build-windows.ps1
```

Linux / macOS:

```bash
bash ./build-unix.sh
```

## Codex 設定優先順序

由高到低：

1. CLI flags / `--config`
2. 專案 `.codex/config.toml`
3. `--profile` 設定
4. 全域 `~/.codex/config.toml`
5. 系統 / 內建預設

> Codex 只會載入受信任專案中的專案級 `.codex/config.toml`，本應用不會自動修改 project trust。

## 安全設計

Codex Config Studio 不向前端開放通用檔案系統或 Shell 權限。

- 專案目錄透過 Tauri Dialog 選擇
- 設定讀寫由有限的 Rust commands 完成
- 只修改本工具管理的模型 / Agent 設定鍵
- plugins、MCP、hooks、marketplaces、project trust 保持不變
- 專案備份放在使用者級 `~/.codex/.config-studio-backups/`

## 方案版本

**GPT-6.1 / GPT-6 (v0.5.0) / v0.4.0**

目前在均衡/複雜任務中推薦使用 GPT-6.1 Sol；GPT-6（v0.5.0）與更早的 v0.4.0 方案都會以不可變歷史快照保留，瀏覽版本不會修改設定。

歷史快照保留原有模型、思考等級與子 Agent 參數，不隨新版推薦變動。

> 這是歷史方案，包含舊模型與固定思考等級。舊模型的可用性與費用以帳號或服務商為準；固定等級可能影響 Codex 內的手動調整。 確認後只載入預覽，不會立即寫入設定。

---

<div align="center">

[Releases](https://github.com/While-Shark/codex-config-studio/releases) · [Release Notes](./RELEASE_NOTES.md)

</div>
