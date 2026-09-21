# Codex Config Studio

跨平台 Tauri v2 Codex 配置管理器，用于在多套模型方案之间快速切换，并安全管理全局与项目级 `.codex/config.toml`。

## 主要功能

- 全局配置：`~/.codex/config.toml`
- 项目配置：`<project>/.codex/config.toml`
- 内置 6 套方案：极省 Token、经济、日常、均衡、Astra 总指挥、极致
- 可单独修改主模型、Reasoning、Plan Mode、子 Agent 模型/Reasoning、最大并发
- 项目级字段可逐项取消覆盖并继承下层配置
- 首次接管前原始备份 + 每次写入前历史备份
- 支持恢复原始配置
- 不修改插件、MCP、hooks、marketplaces、项目 trust 等无关配置

## 多语言

当前内置：

- 简体中文
- 繁體中文
- English
- 日本語
- 한국어

首次启动会根据系统/浏览器语言自动选择，界面顶部也可以手动切换；手动选择会保存在本机。

## 支持平台

| 平台 | 构建产物 |
| --- | --- |
| Windows x64 | NSIS `.exe` |
| Linux x64 | `.AppImage` + `.deb` |
| macOS Universal | `.dmg`，同时支持 Apple Silicon 与 Intel |

> macOS CI 当前未配置 Apple Developer 签名与 notarization；构建可用于测试，正式公开分发建议配置签名和公证。

## 本地运行

Windows：

```powershell
./run-dev.ps1
```

Linux / macOS：

```bash
bash ./run-dev.sh
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

每次 push 到 `master`：

1. 前端 TypeScript + Vite 预检
2. Windows / Linux / macOS 并行构建
3. 上传 Actions Artifact
4. 自动更新 `nightly` 预发布 Release

CI 使用 npm cache、Rust cache、Linux Tauri bundler cache，并提交 `package-lock.json` / `Cargo.lock` 以提高可复现性。

## 一键正式发布

打开：

```text
GitHub → Actions → release-desktop → Run workflow
```

只需要选择版本升级方式：

- `patch`：0.1.0 → 0.1.1
- `minor`：0.1.0 → 0.2.0
- `major`：0.1.0 → 1.0.0

正式发布流水线会自动：

1. 更新 `package.json`、`package-lock.json`、`Cargo.toml`、`Cargo.lock`、`tauri.conf.json` 的版本
2. 运行前端编译预检和 Cargo metadata 检查
3. 提交 release version commit
4. 三端并行构建
5. 构建全部成功后再自动创建 `vX.Y.Z` Tag
6. 自动生成 SHA256 校验文件
7. 使用 `RELEASE_NOTES.md` 生成多语言 Release 描述
8. 自动把 `.exe`、`.AppImage`、`.deb`、`.dmg`、`SHA256SUMS.txt` 上传到 GitHub Release

如果你仍然手动 push `v*` Tag，`release-desktop` 也会自动接管该 Tag，完成三端构建和 Release 产物上传；Tag 版本必须与项目版本一致。

## Release 描述

正式 Release 的多语言说明维护在：

```text
RELEASE_NOTES.md
```

发布时还会自动附加从上一个版本到当前版本的 Git commit 列表。

## Codex 配置优先级

从高到低：

1. CLI flags / `--config`
2. 项目 `.codex/config.toml`
3. `--profile` 配置
4. 全局 `~/.codex/config.toml`
5. 系统/内置默认

Codex 只会加载受信任项目中的项目级 `.codex/config.toml`，本应用不会自动修改项目 trust。
