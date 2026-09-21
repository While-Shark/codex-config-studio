<div align="center">

<img src="./src-tauri/icons/icon.svg" width="96" alt="Codex Config Studio">

# Codex Config Studio

**A cross-platform Codex configuration manager for switching Astra / Sol / Terra / Luna profiles with one click.**

Global scope · Project scope · Reasoning · Sub-agents · Safe backups

[![Build Desktop](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml/badge.svg)](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml)
[![Release](https://img.shields.io/github/v/release/While-Shark/codex-config-studio?include_prereleases)](https://github.com/While-Shark/codex-config-studio/releases)
![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-blue)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB)
![Languages](https://img.shields.io/badge/languages-5-purple)

[简体中文](./README.md) · [繁體中文](./README.zh-TW.md) · **English** · [日本語](./README.ja.md) · [한국어](./README.ko.md)

[Overview](#overview) · [Features](#features) · [Profiles](#built-in-profiles) · [Download](#download) · [Development](#local-development) · [Security](#security)

</div>

---

## Overview

Codex Config Studio is a **Tauri v2** desktop app for safely managing Codex Desktop / CLI global and project-level `.codex/config.toml` files.

It is designed for people who frequently switch between Astra, Sol, Terra, and Luna, or want a visual way to manage planning/execution models, reasoning effort, sub-agents, and concurrency.

## Features

| Capability | Description |
| --- | --- |
| 🌍 Global scope | Manage `~/.codex/config.toml` |
| 📁 Project scope | Manage `<project>/.codex/config.toml` |
| ⚡ One-click profiles | Token Saver, Economy, Daily, Balanced, Astra Director, Max Quality |
| 🧠 Reasoning | Tune main, Plan Mode, and sub-agent reasoning independently |
| 🤖 Sub-agents | Enable/disable, default model, reasoning and max concurrency |
| 🧬 Per-field inheritance | Project fields can individually inherit lower-level settings |
| 🛡️ Safe backups | Original backup on first write plus history backups before every write |
| ↩️ Restore | Restore the configuration from before this app first touched it |
| 🌐 Multilingual | Simplified Chinese, Traditional Chinese, English, Japanese, Korean |
| 📦 Cross-platform builds | Windows / Linux / macOS |

## Built-in profiles

| Profile | Main model | Typical use |
| --- | --- | --- |
| Token Saver | Luna / low | Small edits, bulk replacements, explicit tasks |
| Economy | Luna / medium | CRUD, frontend changes, routine API work |
| Daily | Terra + Luna | Most day-to-day development |
| Balanced | Sol + Luna | Cross-file work, refactors, integration |
| Astra Director | Astra + Luna | Astra plans/reviews, Luna executes |
| Max Quality | Astra xhigh + Luna high | Hard bugs, major refactors, pre-release review |

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

---

<div align="center">

[Releases](https://github.com/While-Shark/codex-config-studio/releases) · [Release Notes](./RELEASE_NOTES.md)

</div>
