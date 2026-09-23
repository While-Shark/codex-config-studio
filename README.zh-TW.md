<div align="center">

<img src="./src-tauri/icons/icon.svg" width="96" alt="Codex Config Studio">

# Codex Config Studio

**跨平台 Codex 設定管理器：一鍵切換 Astra / Sol / Terra / Luna 方案。**

全域設定 · 專案設定 · Reasoning · 子 Agent · 安全備份

[![Build Desktop](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml/badge.svg)](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml)
[![Release](https://img.shields.io/github/v/release/While-Shark/codex-config-studio?include_prereleases)](https://github.com/While-Shark/codex-config-studio/releases)
![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-blue)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB)
![Languages](https://img.shields.io/badge/languages-5-purple)

[简体中文](./README.md) · **繁體中文** · [English](./README.en.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md)

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
| ⚡ 一鍵切換方案 | Token 節省、經濟、日常、均衡、Astra 總指揮、最高品質 |
| 🧠 Reasoning | 分別調整主模型、Plan Mode、子 Agent 思考等級 |
| 🤖 子 Agent | 開關、預設模型、Reasoning、最大並行 |
| 🧬 欄位繼承 | 專案欄位可逐項取消覆寫並繼承下層設定 |
| 🛡️ 安全備份 | 首次修改保存原始副本，每次寫入前保存歷史備份 |
| ↩️ 原始還原 | 可恢復至本應用第一次接管前的設定 |
| 🌐 多語言 | 簡中、繁中、英語、日語、韓語 |
| 📦 多端建置 | Windows / Linux / macOS |

## 內建方案

| 方案 | 主模型 | 適用情境 |
| --- | --- | --- |
| Token 節省 | GPT-6 Luna / low | 小修改、批次替換、明確任務 |
| 經濟 | GPT-6 Luna / medium | CRUD、前端修改、一般 API |
| 日常 | GPT-6 Luna + GPT-6 Luna | 多數日常開發 |
| 均衡 | GPT-6 Sol + GPT-6 Luna | 跨檔案功能、重構、聯調 |
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

> macOS CI 目前未設定 Apple Developer 簽名與 notarization；測試建置可正常產生，正式公開發佈建議加入簽名與公證。

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

**GPT-6 / v0.4.0**

目前推薦使用 GPT-6。舊方案已完整保留在歷史版本中；瀏覽版本不會修改設定。

歷史快照保留原有模型、思考等級與子 Agent 參數，不隨新版推薦變動。

> 這是歷史方案，包含舊模型與固定思考等級。舊模型的可用性與費用以帳號或服務商為準；固定等級可能影響 Codex 內的手動調整。 確認後只載入預覽，不會立即寫入設定。

---

<div align="center">

[Releases](https://github.com/While-Shark/codex-config-studio/releases) · [Release Notes](./RELEASE_NOTES.md)

</div>
