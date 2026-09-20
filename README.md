# Codex Config Studio

一个面向 Codex Desktop / CLI 的 Tauri v2 配置管理器，用来在多套模型方案之间快速切换，并安全管理全局与项目级 `.codex/config.toml`。

## 功能

- 全局配置：`~/.codex/config.toml`
- 项目配置：`<project>/.codex/config.toml`
- 内置 6 套方案：极省 Token、经济、默认/日常、均衡、Astra 总指挥、极致
- 可单独修改：
  - `model`
  - `model_reasoning_effort`
  - `plan_mode_reasoning_effort`
  - `agents.enabled`
  - `agents.default_subagent_model`
  - `agents.default_subagent_reasoning_effort`
  - `agents.max_concurrent_threads_per_session`
- 项目级每个字段可单独取消“项目覆盖”，从而继承下层配置
- 恢复当前方案默认值
- 清除本工具管理的配置键
- 第一次写入时保存原始配置；每次写入前再保存历史备份
- 可恢复到本应用第一次接管之前的原始状态
- 不修改插件、MCP、hooks、marketplaces、项目 trust 等无关配置

## Codex 配置优先级

Codex 的优先级从高到低为：

1. CLI flags / `--config`
2. 项目 `.codex/config.toml`
3. `--profile` 对应的配置文件
4. 全局 `~/.codex/config.toml`
5. 云端/系统/内置默认

因此项目级字段取消覆盖后，并不一定直接回到全局值；如果使用了 Profile，它会先继承 Profile。

> Codex 只会加载“受信任项目”的项目级 `.codex/config.toml`。本应用不会自动修改项目 trust。

## 备份位置

为了避免把备份文件写进项目仓库，所有备份统一保存在用户级目录：

```text
~/.codex/
  .config-studio-backups/
    <scope-hash>/
      config.original.toml
      config.original.absent
      history/
        config.<timestamp>.toml
```

项目目录里只会创建/修改真正的 `<project>/.codex/config.toml`。

## Windows 本地运行

前置环境：

- Node.js LTS
- Rust stable（rustup）
- Microsoft Edge WebView2 Runtime
- Windows C++ Build Tools（Tauri/Rust 构建需要）

先确认 Rust/Cargo 可用：

```powershell
winget install --id Rustlang.Rustup
# 安装后重新打开 PowerShell
rustup default stable-msvc
rustc --version
cargo --version
```

然后启动开发模式：

```powershell
./run-dev.ps1
```

或者：

```powershell
npm install
npm run tauri:dev
```

## 构建 Windows 安装包

```powershell
./build-windows.ps1
```

NSIS 安装包会输出到：

```text
src-tauri\target\release\bundle\nsis\
```

也可以把项目推到 GitHub，然后手动运行 Actions 中的 `build-windows`。它会在 `windows-latest` 构建并上传安装包 Artifact。

## 安全设计

前端没有通用文件系统权限。选择项目目录仅使用 Tauri Dialog 插件；真正的配置读取和写入通过有限的 Rust command 完成。Rust 端只根据“全局用户目录”或用户主动选择的“项目根目录”解析配置路径，并仅修改本工具管理的模型/Agent 键。
