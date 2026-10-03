<div align="center">

<img src="./src-tauri/icons/icon.svg" width="96" alt="Codex Config Studio">

# Codex Config Studio

**更安全、更直观的 Codex 桌面配置控制台。**

无需手改 `.codex/config.toml`，即可切换模型与 Reasoning 方案、管理全局/项目配置、核验 Model Integrity、查看本地用量，并通过签名更新安全升级。

[![Release](https://img.shields.io/github/v/release/While-Shark/codex-config-studio)](https://github.com/While-Shark/codex-config-studio/releases/latest)
[![Build Desktop](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml/badge.svg)](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml)
![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-blue)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB)

**简体中文** · [繁體中文](./README.zh-TW.md) · [English](./README.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md)

[下载](#下载) · [功能重点](#功能重点) · [内置方案](#内置方案) · [安全设计](#安全设计) · [开发](#开发)

</div>

---

## 为什么需要 Codex Config Studio？

Codex 很强，但真实项目里的配置很快就会超过几行：不同项目需要不同模型、Reasoning、子 Agent、安全检查和更新策略。

**Codex Config Studio 把这些配置变成可视化、可回退、面向项目的工作流。**

## 功能重点

| | 功能 | 能带来什么 |
| --- | --- | --- |
| ⚡ | **方案 & 当前任务** | 一键切换极省 Token、日常、均衡、Astra 总指挥、极致，或按任务临时切换模型与 Reasoning。 |
| 🌍 | **全局 + 项目作用域** | 同时管理 `~/.codex/config.toml` 和项目级 `.codex/config.toml`，支持字段级继承。 |
| 🩺 | **Config Health** | 使用近期权威 Codex schema 检查配置，默认保留未知和未来字段。 |
| 🔒 | **Model Integrity** | 锁定目标模型/Reasoning，检测配置漂移，并与本机可观测的 Codex rollout 证据核对。 |
| 📊 | **用量分析** | 查看 7 天 / 30 天 / 全部时间 Token、模型趋势、子 Agent 活动、reroute、项目活跃度和参考成本。 |
| 🛡️ | **安全编辑与恢复** | 写入前备份、保留历史、预览差异，并可恢复到 Studio 第一次接管前的原始配置。 |
| 🔄 | **签名更新** | 自动检查稳定版，用户确认后在应用内验证签名并安装更新。 |
| 🌐 | **跨平台 + 多语言** | Windows、Linux、macOS；支持英语、简中、繁中、日语、韩语。 |

## 内置方案

| 方案 | 模型组合 | 适合场景 |
| --- | --- | --- |
| **极省 Token** | GPT-6 Luna low · Plan low | 小修改、批量替换、明确任务 |
| **经济** | GPT-6 Luna medium · Plan medium | CRUD、前端修改、常规 API |
| **日常** | GPT-6 Luna medium + Luna medium 子 Agent | 日常开发 |
| **均衡** | GPT-6.1 Sol medium + Luna medium 子 Agent | 跨文件功能、重构、联调 |
| **Astra 总指挥** | GPT-6 Astra high/xhigh + GPT-6.1 Sol medium 子 Agent | 架构、任务拆解、复杂执行、Review |
| **极致** | GPT-6 Astra xhigh + GPT-6.1 Sol high 子 Agent | 疑难 Bug、大重构、发布前 Review |

这些方案只是起点，不会锁死。你可以在 UI 中继续修改模型、Reasoning、子 Agent 和并发数。

当前方案版本：**GPT-6.1 · 2026-10-03**。v0.6.1 的 GPT-6.1 方案、GPT-6 v0.5.0 方案和旧版 v0.4.0 方案都会作为只读历史快照继续保留。

## Config Health & Model Integrity

### Config Health

- 使用近期权威 Codex 配置 schema。
- 普通写入默认保留未知字段和未来新增字段。
- 清理未知字段前必须明确确认。
- 当模型元数据提供最低客户端版本时，可检查本机 Codex CLI 兼容性。
- 缓存可信 schema / 模型元数据，离线时仍可使用最近可信数据。

### Model Integrity

- 为作用域锁定有效的 `model` 和 `model_reasoning_effort`。
- 检测 Studio 可见的配置漂移。
- 读取本机 Codex rollout 证据，展示近期实际模型/Reasoning 与可观测 reroute。
- 不会把未记录或不可观测的服务端内部路由描述成本机可验证事实。

## 用量分析

用量看板以**只读**方式读取本机 Codex rollout JSONL，可展示：

- 7 天 / 30 天 / 全部时间 Token 用量；
- 模型和 Reasoning 趋势；
- 主会话与子 Agent 用量；
- 可观测 reroute 历史；
- 近期项目活跃度；
- 可解释的 Token 突增提示；
- 版本化参考成本。

参考成本基于带日期的价格快照和本机可观测元数据，**不是官方账单数据**。

## 下载

下载最新正式版：

**[GitHub Releases →](https://github.com/While-Shark/codex-config-studio/releases/latest)**

| 平台 | 安装包 |
| --- | --- |
| Windows x64 | NSIS `.exe` |
| Linux x64 | `.AppImage` + `.deb` |
| macOS Universal | `.dmg`，支持 Apple Silicon + Intel |

正式 Release 包含 updater 签名、SHA-256 校验和与 GitHub build provenance。

## 签名自动更新

正式构建会：

1. 自动检查最新**稳定版**；
2. 主动提示新版本；
3. 验证签名 updater 包；
4. 仅在用户确认后安装；
5. 安装完成后重启进入新版本。

应用长时间运行时会周期复查；自动检查失败不会打扰使用，未签名/dev 构建会安全回退到 GitHub Release 页面。

## 安全设计

Codex Config Studio 对配置写入保持保守策略。

- 只修改 Studio 管理的模型 / Agent 配置键。
- 未知和未来字段默认保留。
- 不修改 project trust、plugins、MCP、hooks、marketplaces。
- 写入使用备份、历史记录、串行原生写锁和安全临时文件替换。
- 项目备份保存在 `~/.codex/.config-studio-backups/`。
- 前端不开放通用文件系统或 Shell 权限。

## 配置优先级

从高到低：

1. CLI flags / `--config`
2. 项目 `.codex/config.toml`
3. `--profile`
4. 全局 `~/.codex/config.toml`
5. 系统 / 内置默认

> Codex 只会加载受信任项目中的项目级配置。Codex Config Studio 不会自动修改 project trust。

## 开发

### Windows

```powershell
./run-dev.ps1
```

### Linux / macOS

```bash
bash ./run-dev.sh
```

或使用标准 Tauri 流程：

```bash
npm ci
npm run tauri:dev
```

本地打包：

```text
Windows:       ./build-windows.ps1
Linux/macOS:   bash ./build-unix.sh
```

---

<div align="center">

**让 Codex 配置更强大，但不脆弱。**

[最新版本](https://github.com/While-Shark/codex-config-studio/releases/latest) · [Release Notes](./RELEASE_NOTES.md)

</div>
