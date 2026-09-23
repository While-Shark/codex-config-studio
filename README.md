<div align="center">

<img src="./src-tauri/icons/icon.svg" width="96" alt="Codex Config Studio">

# Codex Config Studio

**跨平台 Codex 配置管理器：一键切换 Astra / Sol / Terra / Luna 方案。**

全局配置 · 项目配置 · Reasoning · 子 Agent · 安全备份

[![Build Desktop](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml/badge.svg)](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml)
[![Release](https://img.shields.io/github/v/release/While-Shark/codex-config-studio?include_prereleases)](https://github.com/While-Shark/codex-config-studio/releases)
![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-blue)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB)
![Languages](https://img.shields.io/badge/languages-5-purple)

**简体中文** · [繁體中文](./README.zh-TW.md) · [English](./README.en.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md)

[简介](#简介) · [功能](#功能) · [方案](#内置方案) · [下载](#下载) · [开发](#本地开发) · [安全](#安全设计)

</div>

> **工作台 UI/UX 重构**：简洁双栏布局、固定应用区、分组高级设置、项目/方案历史子页与只读预览；加入草稿放弃确认、弹窗焦点管理和键盘导航。五语言、深浅主题、完整预览、继承配置和历史方案提示均保留。写入较慢时不再提前解锁，避免重复提交。

---

## 简介

Codex Config Studio 是一个基于 **Tauri v2** 的桌面配置管理器，用来安全管理 Codex Desktop / CLI 的全局与项目级 `.codex/config.toml`。

它适合经常在 Astra、Sol、Terra、Luna 之间切换，或者希望把“规划模型 / 执行模型 / Reasoning / 子 Agent 并发”等配置做成可视化方案的人。

## 功能

| 能力 | 说明 |
| --- | --- |
| 🌍 全局配置 | 管理 `~/.codex/config.toml` |
| 📁 项目配置 | 管理 `<project>/.codex/config.toml` |
| 🎯 当前任务快速切换 | 小修复 / 日常开发 / 复杂问题 / 架构设计；每类可独立选择模型与 Reasoning 并记住偏好 |
| ⚡ 一键切换方案 | 极省 Token、经济、日常、均衡、Astra 总指挥、极致 |
| 🧠 Reasoning | 独立调整主模型、Plan Mode、子 Agent 思考等级 |
| 🤖 子 Agent | 开关、默认模型、Reasoning、最大并发 |
| 🧬 字段继承 | 项目级字段可逐项取消覆盖，继续继承下层配置 |
| 🛡️ 安全备份 | 首次修改保存原始副本，每次写入前保留历史备份 |
| ↩️ 原始恢复 | 可恢复到本应用第一次接管之前的配置 |
| 🎨 主题与配色 | 深色 / 浅色 / 跟随系统，5 套主题色并本机记忆 |
| 🕘 项目历史 | 独立历史标签页，支持搜索、恢复和删除；删除需二次确认，不影响项目配置或备份 |
| 🌐 多语言 | 简中、繁中、英语、日语、韩语；自动识别并记忆选择 |
| 📦 多端构建 | Windows / Linux / macOS 自动构建 |

## 内置方案

| 方案 | 主模型 | 默认定位 |
| --- | --- | --- |
| 极省 Token | GPT-6 Luna / low | 小修改、批量替换、明确任务 |
| 经济 | GPT-6 Luna / medium | CRUD、前端修改、常规接口 |
| 日常 | GPT-6 Luna + GPT-6 Luna | 大多数日常开发 |
| 均衡 | GPT-6 Sol + GPT-6 Luna | 跨文件功能、重构、联调 |
| Astra 总指挥 | GPT-6 Astra + GPT-6 Luna | Astra 规划/Review，Luna 执行 |
| 极致 | GPT-6 Astra xhigh + GPT-6 Luna high | 疑难 Bug、大重构、上线前 Review |

所有方案都可以在界面里继续单独修改，不会被预设锁死。

## 当前任务快速切换

默认方案负责当前全局/项目的长期配置；“当前任务”用于临时覆盖主模型和 `model_reasoning_effort`。

内置 4 类任务推荐：

| 当前任务 | 初始推荐 |
| --- | --- |
| 小修复 | GPT-6 Luna / low |
| 日常开发 | GPT-6 Luna / medium |
| 复杂问题 | GPT-6 Sol / high |
| 架构设计 | GPT-6 Astra / high |

这些只是开源默认值，**不会锁死**。每一类都可以从下拉框改成 Astra / Sol / Terra / Luna，也支持任意自定义模型 ID；Reasoning 可选择 `low / medium / high / xhigh / ultra / persistent / max`。

例如可以把“日常开发”长期改成 `Luna + xhigh`，应用会在本机记住这个偏好，但不会改变其他用户的默认设置。

第一次应用当前任务覆盖时会保存该作用域的模型基线，之后可以一键“恢复进入任务模式前”。任务覆盖只修改：

```text
model
model_reasoning_effort
```

Plan Mode、子 Agent、MCP、hooks 及其他配置保持不变。

> 当前功能是 **config.toml 级快速切换**，不会强行修改已经运行中的 Codex 会话。已经打开的交互会话如需立即换模型，应使用该会话自身提供的模型切换功能。

## 新版工作区

主界面改为左右两栏：左侧负责方案 / 当前任务 / 高级配置 / 历史记录，右侧固定显示作用域、待应用差异、二次确认入口。选择配置不会立即写文件，更适合第一次使用 Codex 配置的小白用户。

所有写入现在都有前端防重复提交、超时解锁、后端串行写锁和临时文件安全写入；历史记录保存在 `~/.codex/.config-studio/history.json`。

## 多语言

应用内置：

- 简体中文
- 繁體中文
- English
- 日本語
- 한국어

首次启动会根据系统/浏览器语言自动选择，顶部也可以手动切换；手动选择会保存在本机。

## 下载

前往 **[GitHub Releases](https://github.com/While-Shark/codex-config-studio/releases)** 下载。

| 平台 | 构建产物 |
| --- | --- |
| Windows x64 | NSIS `.exe` |
| Linux x64 | `.AppImage` + `.deb` |
| macOS Universal | `.dmg`，同时支持 Apple Silicon 与 Intel |

> macOS CI 当前未配置 Apple Developer 签名与 notarization；测试构建可以正常生成，但正式公开分发建议配置签名和公证。

## 本地开发

### Windows

```powershell
./run-dev.ps1
```

### Linux / macOS

```bash
bash ./run-dev.sh
```

也可以使用标准 Tauri 命令：

```bash
npm ci
npm run tauri:dev
```

## 本地构建

Windows：

```powershell
./build-windows.ps1
```

Linux / macOS：

```bash
bash ./build-unix.sh
```

## Codex 配置优先级

从高到低：

1. CLI flags / `--config`
2. 项目 `.codex/config.toml`
3. `--profile` 配置
4. 全局 `~/.codex/config.toml`
5. 系统 / 内置默认

> Codex 只会加载受信任项目中的项目级 `.codex/config.toml`。本应用不会自动修改项目 trust。

## 安全设计

Codex Config Studio 不向前端开放通用文件系统或 Shell 权限。

- 项目目录通过 Tauri Dialog 选择
- 配置读写由有限的 Rust commands 完成
- 只修改本工具管理的模型 / Agent 配置键
- 不修改 plugins、MCP、hooks、marketplaces、项目 trust 等其他配置
- 项目备份统一存放在用户级 `~/.codex/.config-studio-backups/`，避免污染项目仓库

## 方案版本

**GPT-6 / v0.4.0**

当前推荐使用 GPT-6。旧方案已完整保存在历史版本中；浏览版本不会修改配置。

历史快照保留原有模型、思考等级和子 Agent 参数，不随新版推荐变动。

> 这是历史方案，包含旧模型和固定思考等级。旧模型的可用性与费用以你的账号或服务商为准；固定等级可能影响 Codex 内的手动调整。 确认后只载入预览，不会立即写入配置。

---

<div align="center">

[Releases](https://github.com/While-Shark/codex-config-studio/releases) · [Release Notes](./RELEASE_NOTES.md)

</div>
