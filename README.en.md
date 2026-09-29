<div align="center">

<img src="./src-tauri/icons/icon.svg" width="96" alt="Codex Config Studio">

# Codex Config Studio

**A cross-platform Codex configuration manager for switching Astra / Sol / Terra / Luna profiles with one click.**

Global/project config · Config Health · Model Integrity · Usage insights · Reasoning · Sub-agents · Safe updates

[![Build Desktop](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml/badge.svg)](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml)
[![Release](https://img.shields.io/github/v/release/While-Shark/codex-config-studio?include_prereleases)](https://github.com/While-Shark/codex-config-studio/releases)
![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-blue)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB)
![Languages](https://img.shields.io/badge/languages-5-purple)

[简体中文](./README.md) · [繁體中文](./README.zh-TW.md) · **English** · [日本語](./README.ja.md) · [한국어](./README.ko.md)

[Overview](#overview) · [Features](#features) · [Profiles](#built-in-profiles) · [Download](#download) · [Development](#local-development) · [Security](#security)

</div>

> **Workspace UI/UX redesign**: Clean split layout, pinned apply controls, grouped advanced settings, project/profile history views and read-only previews. Added unsaved-draft confirmation, accessible modal focus handling and keyboard tabs. Preserved five languages, themes, complete configuration previews, inheritance and archived-profile warnings. Slow writes keep their lock until the native operation actually finishes.

---

## Overview

Codex Config Studio is a **Tauri v2** desktop app for safely managing Codex Desktop / CLI global and project-level `.codex/config.toml` files.

It is designed for people who frequently switch between Astra, Sol, Terra, and Luna, or want a visual way to manage planning/execution models, reasoning effort, sub-agents, and concurrency.

## Features

| Capability | Description |
| --- | --- |
| 🌍 Global scope | Manage `~/.codex/config.toml` |
| 📁 Project scope | Manage `<project>/.codex/config.toml` |
| 🎯 Current Task switching | Quick Fix / Daily Development / Complex Problem / Architecture, each with editable model and reasoning preferences |
| ⚡ One-click profiles | Token Saver, Economy, Daily, Balanced, Astra Director, Max Quality |
| 🧠 Reasoning | Tune main, Plan Mode, and sub-agent reasoning independently |
| 🤖 Sub-agents | Enable/disable, default model, reasoning and max concurrency |
| 🧬 Per-field inheritance | Project fields can individually inherit lower-level settings |
| 🛡️ Safe backups | Original backup on first write plus history backups before every write |
| ↩️ Restore | Restore the configuration from before this app first touched it |
| 🩺 Config Health | Validate against a recent authoritative Codex schema; preserve unknown/future fields by default and require confirmation + backup before cleanup |
| 🔒 Model Integrity | Lock the effective model/reasoning target, detect config drift, and compare against observable local Codex rollout evidence |
| 📊 Usage & reference cost | 7-day / 30-day / all-time usage, model trends, agent analysis, reroute timeline, and versioned reference-cost estimates |
| 🗂️ Recent-project overview | Summarize recent project activity, tokens, sessions, leading model, and observable reroutes from Config Studio history |
| 🔄 Safe updates | Stable-release checks plus signed in-app updates for formal builds; unsigned builds fall back safely to the Release page |
| 🌐 Multilingual | Simplified Chinese, Traditional Chinese, English, Japanese, Korean |
| 📦 Cross-platform builds | Windows / Linux / macOS |

## Config Health, Model Integrity, and usage insights

### Config Health

Config Health prefers the **authoritative generated Codex configuration schema from the OpenAI Codex repository** and caches the latest trusted copy locally. Offline/fallback or over-age data can still be shown for context, but it is **not used to produce unknown-field deletion warnings**.

- Normal writes only touch Studio-managed keys; unknown and future fields are preserved.
- Removing an unknown field requires explicit confirmation and creates a backup/history entry first.
- The app can show the detected local Codex CLI version and compare consecutive authoritative schemas for added, removed, or structurally changed fields.
- Documentation-only schema edits are ignored by the change summary.

### Model Integrity

Model Integrity can lock the effective `model` and `model_reasoning_effort` for a scope, detect Studio-visible drift, and compare the lock against runtime evidence already recorded in local Codex rollout files. It shows the latest observed model/reasoning, observable reroutes, a five-entry recent evidence history, and a read-only refresh action.

> This verifies **Studio-visible configuration plus locally recorded rollout evidence**. CLI-only temporary overrides, behavior not recorded locally, and unobservable server-side routing remain outside the local guarantee.

### Project usage and reference cost

The project usage dashboard reads local Codex rollout JSONL in read-only mode and supports 7-day, 30-day, and all-time views. It includes model/reasoning breakdowns, root vs sub-agent usage, daily/model trends, agent analysis, an observable reroute timeline, a recent-project overview, and explainable token-spike hints based only on exact historical daily usage.

Reference cost uses a **dated, versioned pricing snapshot**. Unknown models are excluded rather than assigned invented prices, and stale snapshots are flagged. All usage and cost values are **best-effort local telemetry, not billing data**.

## Built-in profiles

| Profile | Main model | Typical use |
| --- | --- | --- |
| Token Saver | GPT-6 Luna / low | Small edits, bulk replacements, explicit tasks |
| Economy | GPT-6 Luna / medium | CRUD, frontend changes, routine API work |
| Daily | GPT-6 Luna + GPT-6 Luna | Most day-to-day development |
| Balanced | GPT-6 Sol + GPT-6 Luna | Cross-file work, refactors, integration |
| Astra Director | GPT-6 Astra + GPT-6 Luna | Astra plans/reviews, Luna executes |
| Max Quality | GPT-6 Astra xhigh + GPT-6 Luna high | Hard bugs, major refactors, pre-release review |

Every preset remains fully editable in the UI.

## Languages

Built in:

- 简体中文
- 繁體中文
- English
- 日本語
- 한국어

The first launch follows the system/browser language. A manual selection can be made from the top bar and is remembered locally.

## Download

Download installers from **[GitHub Releases](https://github.com/While-Shark/codex-config-studio/releases)**.

| Platform | Artifact |
| --- | --- |
| Windows x64 | NSIS `.exe` |
| Linux x64 | `.AppImage` + `.deb` |
| macOS Universal | `.dmg`, supports Apple Silicon and Intel |

> macOS CI builds are currently unsigned and not notarized. They are suitable for testing; public distribution should add Apple signing and notarization.

## Local development

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

## Local build

Windows:

```powershell
./build-windows.ps1
```

Linux / macOS:

```bash
bash ./build-unix.sh
```

## Codex configuration precedence

Highest to lowest:

1. CLI flags / `--config`
2. Project `.codex/config.toml`
3. `--profile` configuration
4. Global `~/.codex/config.toml`
5. System / built-in defaults

> Codex only loads project-level `.codex/config.toml` from trusted projects. This app does not modify project trust automatically.

## Security

Codex Config Studio does not expose broad filesystem or shell access to the frontend.

- Project folders are selected through Tauri Dialog
- Configuration I/O is handled by narrow Rust commands
- Only model / Agent keys managed by this app are changed
- Plugins, MCP, hooks, marketplaces, and project trust are left untouched
- Project backups live under user-level `~/.codex/.config-studio-backups/`

## Profile version

**GPT-6 / v0.4.0**

Current recommendations use GPT-6. Complete older profiles remain in the archive. Browsing versions does not change configuration.

Archived snapshots retain their original models, reasoning levels and sub-agent settings; new recommendations never rewrite them.

> This archived profile uses older models and fixed reasoning levels. Availability and pricing depend on your account or provider. Fixed levels may affect manual adjustments in Codex. Confirming only loads a preview; it does not write configuration.

---

<div align="center">

[Releases](https://github.com/While-Shark/codex-config-studio/releases) · [Release Notes](./RELEASE_NOTES.md)

</div>
