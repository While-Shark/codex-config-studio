<div align="center">

<img src="./src-tauri/icons/icon.svg" width="96" alt="Codex Config Studio">

# Codex Config Studio

**跨平台 Codex 配置管理器：一键切换 Astra / Sol / Terra / Luna 方案。**

全局配置 · 项目配置 · Reasoning · 子 Agent · 安全备份 · 自动发布

[![Build Desktop](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml/badge.svg)](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml)
[![Release](https://img.shields.io/github/v/release/While-Shark/codex-config-studio?include_prereleases)](https://github.com/While-Shark/codex-config-studio/releases)
![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-blue)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB)
![Languages](https://img.shields.io/badge/languages-5-purple)

**简体中文** · [繁體中文](./README.zh-TW.md) · [English](./README.en.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md)

[简介](#简介) · [功能](#功能) · [方案](#内置方案) · [下载](#下载) · [开发](#本地开发) · [自动发布](#自动发布) · [安全](#安全设计)

</div>

---

## 简介

Codex Config Studio 是一个基于 **Tauri v2** 的桌面配置管理器，用来安全管理 Codex Desktop / CLI 的全局与项目级 `.codex/config.toml`。

它适合经常在 Astra、Sol、Terra、Luna 之间切换，或者希望把“规划模型 / 执行模型 / Reasoning / 子 Agent 并发”等配置做成可视化方案的人。

## 功能

| 能力 | 说明 |
| --- | --- |
| 🌍 全局配置 | 管理 `~/.codex/config.toml` |
| 📁 项目配置 | 管理 `<project>/.codex/config.toml` |
| ⚡ 一键切换方案 | 极省 Token、经济、日常、均衡、Astra 总指挥、极致 |
| 🧠 Reasoning | 独立调整主模型、Plan Mode、子 Agent 思考等级 |
| 🤖 子 Agent | 开关、默认模型、Reasoning、最大并发 |
| 🧬 字段继承 | 项目级字段可逐项取消覆盖，继续继承下层配置 |
| 🛡️ 安全备份 | 首次修改保存原始副本，每次写入前保留历史备份 |
| ↩️ 原始恢复 | 可恢复到本应用第一次接管之前的配置 |
| 🌐 多语言 | 简中、繁中、英语、日语、韩语；自动识别并记忆选择 |
| 📦 多端构建 | Windows / Linux / macOS 自动构建 |
| 🚀 自动发布 | 自动版本号、Tag、Release 描述、安装包与 SHA256 |

## 内置方案

| 方案 | 主模型 | 默认定位 |
| --- | --- | --- |
| 极省 Token | Luna / low | 小修改、批量替换、明确任务 |
| 经济 | Luna / medium | CRUD、前端修改、常规接口 |
| 日常 | Terra + Luna | 大多数日常开发 |
| 均衡 | Sol + Luna | 跨文件功能、重构、联调 |
| Astra 总指挥 | Astra + Luna | Astra 规划/Review，Luna 执行 |
| 极致 | Astra xhigh + Luna high | 疑难 Bug、大重构、上线前 Review |

所有方案都可以在界面里继续单独修改，不会被预设锁死。

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

## CI / Nightly

每次 push 到 `master` 后，GitHub Actions 会自动：

1. 运行 TypeScript + Vite 前端预检
2. 并行构建 Windows / Linux / macOS
3. 使用 npm / Rust / Linux Tauri bundler 缓存
4. 上传 Actions Artifact
5. 更新 `nightly` 预发布 Release

仅修改 README / docs / screenshots 时不会启动三端构建。

## 自动发布

打开：

```text
GitHub → Actions → release-desktop → Run workflow
```

选择版本升级方式：

| 选项 | 示例 |
| --- | --- |
| `patch` | 0.1.0 → 0.1.1 |
| `minor` | 0.1.0 → 0.2.0 |
| `major` | 0.1.0 → 1.0.0 |

正式发布流水线会自动：

1. 同步 npm / Cargo / Tauri 版本号
2. 执行前端编译与 Cargo metadata 检查
3. 提交 release version commit
4. 三端并行构建
5. **全部构建成功后**创建 `vX.Y.Z` Tag
6. 生成 `SHA256SUMS.txt`
7. 使用 [RELEASE_NOTES.md](./RELEASE_NOTES.md) 生成五国语言 Release 描述
8. 上传 `.exe`、`.AppImage`、`.deb`、`.dmg` 与校验文件

手工 push `v*` Tag 也会触发正式发布流水线，但 Tag 版本必须与项目版本一致。

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

---

<div align="center">

[Releases](https://github.com/While-Shark/codex-config-studio/releases) · [Actions](https://github.com/While-Shark/codex-config-studio/actions) · [Release Notes](./RELEASE_NOTES.md)

</div>
