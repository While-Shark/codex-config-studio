<div align="center">

<img src="./src-tauri/icons/icon.svg" width="96" alt="Codex Config Studio">

# Codex Config Studio

**A safer desktop control panel for Codex configuration.**

Switch models and reasoning profiles, manage global/project config, verify model integrity, inspect local usage, and install signed updates — without hand-editing `.codex/config.toml`.

[![Release](https://img.shields.io/github/v/release/While-Shark/codex-config-studio)](https://github.com/While-Shark/codex-config-studio/releases/latest)
[![Build Desktop](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml/badge.svg)](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml)
![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-blue)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB)

[简体中文](./README.zh-CN.md) · [繁體中文](./README.zh-TW.md) · **English** · [日本語](./README.ja.md) · [한국어](./README.ko.md)

[Download](#download) · [Highlights](#highlights) · [Profiles](#built-in-profiles) · [Safety](#safety) · [Development](#development)

</div>

---

## Why Codex Config Studio?

Codex is powerful, but real-world setups quickly grow beyond a few config lines: different projects need different models, reasoning levels, sub-agents, safety checks, and update policies.

**Codex Config Studio turns that configuration into a visual, reversible, project-aware workflow.**

## Highlights

| | Feature | What it gives you |
| --- | --- | --- |
| ⚡ | **Profiles & Current Task** | Switch between Token Saver, Daily, Balanced, Astra Director, Max Quality, or task-specific model/reasoning combinations in one click. |
| 🌍 | **Global + project scopes** | Manage both `~/.codex/config.toml` and per-project `.codex/config.toml` with field-level inheritance. |
| 🩺 | **Config Health** | Check config against a recent authoritative Codex schema while preserving unknown and future fields by default. |
| 🔒 | **Model Integrity** | Lock the intended model/reasoning pair, detect config drift, and compare it with observable local Codex rollout evidence. |
| 📊 | **Usage insights** | Explore 7-day / 30-day / all-time token usage, model trends, sub-agent activity, reroutes, project activity, and reference cost estimates. |
| 🛡️ | **Safe editing & restore** | Back up before writes, keep history, preview changes, and restore the original config from before Studio first touched it. |
| 🔄 | **Signed updates** | Automatically check stable releases and install signed updates in-app after user confirmation. |
| 🌐 | **Cross-platform & multilingual** | Windows, Linux, macOS; English, Simplified Chinese, Traditional Chinese, Japanese, and Korean. |

## Built-in profiles

| Profile | Main model | Best for |
| --- | --- | --- |
| **Token Saver** | GPT-6 Luna / low | Small edits, bulk replacements, explicit tasks |
| **Economy** | GPT-6 Luna / medium | CRUD, frontend changes, routine API work |
| **Daily** | GPT-6 Luna | Day-to-day development |
| **Balanced** | GPT-6.1 Sol + GPT-6 Luna | Cross-file work, refactors, integration |
| **Astra Director** | GPT-6 Astra + GPT-6 Luna | Astra plans/reviews, Luna executes |
| **Max Quality** | GPT-6 Astra xhigh + GPT-6 Luna high | Hard bugs, major refactors, pre-release review |

Profiles are starting points, not hard-coded modes. You can change models, reasoning effort, sub-agent settings, and concurrency in the UI.

## Config Health & Model Integrity

### Config Health

- Uses a recent authoritative Codex configuration schema.
- Preserves unknown and future fields during normal writes.
- Requires explicit confirmation before unknown-field cleanup.
- Detects local Codex CLI version compatibility when model metadata provides a minimum client version.
- Caches trusted schema/model metadata for offline use.

### Model Integrity

- Locks the effective `model` and `model_reasoning_effort` for a scope.
- Detects Studio-visible configuration drift.
- Reads local Codex rollout evidence to show recently observed model/reasoning and observable reroutes.
- Never claims visibility into unrecorded or opaque server-side routing.

## Usage insights

The dashboard reads local Codex rollout JSONL in **read-only** mode and can show:

- token usage over 7 days / 30 days / all time;
- model and reasoning trends;
- root session vs sub-agent usage;
- observable reroute history;
- recent-project activity;
- explainable token-spike hints;
- versioned reference-cost estimates.

Reference cost is an estimate based on dated pricing snapshots and locally observable metadata — **not official billing data**.

## Download

Download the latest release:

**[GitHub Releases →](https://github.com/While-Shark/codex-config-studio/releases/latest)**

| Platform | Package |
| --- | --- |
| Windows x64 | NSIS `.exe` |
| Linux x64 | `.AppImage` + `.deb` |
| macOS Universal | `.dmg` for Apple Silicon + Intel |

Formal releases include updater signatures, SHA-256 checksums, and GitHub build provenance.

## Signed automatic updates

Formal builds:

1. check the latest **stable** release automatically;
2. surface a newer version proactively;
3. verify the signed updater package;
4. install only after user confirmation;
5. restart into the new version.

Long-running sessions recheck periodically. Automatic check failures stay non-intrusive, and unsigned/dev builds fall back safely to the Release page.

## Safety

Codex Config Studio is intentionally conservative around configuration changes.

- Only Studio-managed model / Agent keys are modified.
- Unknown and future config fields are preserved by default.
- Project trust, plugins, MCP, hooks, and marketplaces are not changed.
- Writes use backups, history, serialized native writes, and safe temporary-file replacement.
- Project backups live under `~/.codex/.config-studio-backups/`.
- The frontend is not given broad filesystem or shell access.

## Configuration precedence

Highest to lowest:

1. CLI flags / `--config`
2. Project `.codex/config.toml`
3. `--profile`
4. Global `~/.codex/config.toml`
5. System / built-in defaults

> Project-level Codex configuration is only loaded for trusted projects. Codex Config Studio does not change project trust automatically.

## Development

### Windows

```powershell
./run-dev.ps1
```

### Linux / macOS

```bash
bash ./run-dev.sh
```

Or use the standard Tauri workflow:

```bash
npm ci
npm run tauri:dev
```

Local packaging helpers:

```text
Windows:       ./build-windows.ps1
Linux/macOS:   bash ./build-unix.sh
```

---

<div align="center">

**Codex configuration should be powerful without being fragile.**

[Latest Release](https://github.com/While-Shark/codex-config-studio/releases/latest) · [Release Notes](./RELEASE_NOTES.md)

</div>
