<div align="center">

<img src="./src-tauri/icons/icon.svg" width="96" alt="Codex Config Studio">

# Codex Config Studio

**Astra / Sol / Terra / Luna をワンクリックで切り替えるクロスプラットフォーム Codex 設定マネージャー。**

グローバル設定 · プロジェクト設定 · Reasoning · サブ Agent · 安全バックアップ

[![Build Desktop](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml/badge.svg)](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml)
[![Release](https://img.shields.io/github/v/release/While-Shark/codex-config-studio?include_prereleases)](https://github.com/While-Shark/codex-config-studio/releases)
![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-blue)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB)
![Languages](https://img.shields.io/badge/languages-5-purple)

[简体中文](./README.md) · [繁體中文](./README.zh-TW.md) · [English](./README.en.md) · **日本語** · [한국어](./README.ko.md)

[概要](#概要) · [機能](#機能) · [プロファイル](#内蔵プロファイル) · [ダウンロード](#ダウンロード) · [開発](#ローカル開発) · [セキュリティ](#セキュリティ)

</div>

---

## 概要

Codex Config Studio は **Tauri v2** ベースのデスクトップ設定マネージャーです。Codex Desktop / CLI のグローバル設定とプロジェクト単位の `.codex/config.toml` を安全に管理します。

Astra、Sol、Terra、Luna を頻繁に切り替える人や、計画モデル、実行モデル、Reasoning、サブ Agent、並列数を視覚的に管理したい人向けです。

## 機能

| 機能 | 内容 |
| --- | --- |
| 🌍 グローバル設定 | `~/.codex/config.toml` を管理 |
| 📁 プロジェクト設定 | `<project>/.codex/config.toml` を管理 |
| ⚡ ワンクリックプロファイル | Token 節約、Economy、Daily、Balanced、Astra Director、Max Quality |
| 🧠 Reasoning | メイン、Plan Mode、サブ Agent の思考レベルを個別設定 |
| 🤖 サブ Agent | 有効/無効、既定モデル、Reasoning、最大並列数 |
| 🧬 フィールド継承 | プロジェクト設定を項目ごとに下位設定へ継承可能 |
| 🛡️ 安全バックアップ | 初回変更時の原本 + 毎回の履歴バックアップ |
| ↩️ 復元 | アプリが初めて変更する前の設定へ復元 |
| 🌐 多言語 | 中国語簡体字/繁体字、英語、日本語、韓国語 |
| 📦 マルチプラットフォーム | Windows / Linux / macOS |

## 内蔵プロファイル

| プロファイル | メインモデル | 用途 |
| --- | --- | --- |
| Token 節約 | Luna / low | 小さな修正、明確な作業、一括置換 |
| Economy | Luna / medium | CRUD、フロント修正、通常 API |
| Daily | Terra + Luna | 日常開発の大半 |
| Balanced | Sol + Luna | 複数ファイル機能、リファクタ、連携 |
| Astra Director | Astra + Luna | Astra が計画/Review、Luna が実行 |
| Max Quality | Astra xhigh + Luna high | 難しい Bug、大規模リファクタ、リリース前 Review |

各プロファイルは UI でさらに自由に変更できます。

## ダウンロード

**[GitHub Releases](https://github.com/While-Shark/codex-config-studio/releases)** からダウンロードできます。

| プラットフォーム | 成果物 |
| --- | --- |
| Windows x64 | NSIS `.exe` |
| Linux x64 | `.AppImage` + `.deb` |
| macOS Universal | `.dmg`、Apple Silicon / Intel 対応 |

> macOS CI は現在未署名・未 notarization です。テスト用途には利用できますが、一般公開には Apple の署名と公証を推奨します。

## ローカル開発

Windows:

```powershell
./run-dev.ps1
```

Linux / macOS:

```bash
bash ./run-dev.sh
```

## Codex 設定の優先順位

1. CLI flags / `--config`
2. プロジェクト `.codex/config.toml`
3. `--profile`
4. グローバル `~/.codex/config.toml`
5. システム / 組み込み既定値

## セキュリティ

- フロントエンドに汎用ファイルシステム / Shell 権限を公開しません
- 設定 I/O は限定された Rust commands で処理します
- 本アプリが管理するモデル / Agent キーだけを変更します
- plugins、MCP、hooks、marketplaces、project trust は変更しません
- バックアップは `~/.codex/.config-studio-backups/` に保存します

---

<div align="center">

[Releases](https://github.com/While-Shark/codex-config-studio/releases) · [Release Notes](./RELEASE_NOTES.md)

</div>
