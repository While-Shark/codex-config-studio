<div align="center">

<img src="./src-tauri/icons/icon.svg" width="96" alt="Codex Config Studio">

# Codex Config Studio

**Codex 設定を、より安全かつ直感的に管理するデスクトップコントロールパネル。**

`.codex/config.toml` を手編集せずに、モデル/Reasoning プロファイルの切り替え、グローバル/プロジェクト設定、Model Integrity の確認、ローカル使用量の分析、署名付き更新まで行えます。

[![Release](https://img.shields.io/github/v/release/While-Shark/codex-config-studio)](https://github.com/While-Shark/codex-config-studio/releases/latest)
[![Build Desktop](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml/badge.svg)](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml)
![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-blue)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB)

[简体中文](./README.zh-CN.md) · [繁體中文](./README.zh-TW.md) · [English](./README.md) · **日本語** · [한국어](./README.ko.md)

[ダウンロード](#ダウンロード) · [主な機能](#主な機能) · [内蔵プロファイル](#内蔵プロファイル) · [安全設計](#安全設計) · [開発](#開発)

</div>

---

## なぜ Codex Config Studio？

Codex は強力ですが、実際のプロジェクトでは設定がすぐに複雑になります。プロジェクトごとに異なるモデル、Reasoning、サブ Agent、安全チェック、更新ポリシーが必要になります。

**Codex Config Studio は、それらを可視化し、元に戻せて、プロジェクト単位で管理できるワークフローに変えます。**

## 主な機能

| | 機能 | できること |
| --- | --- | --- |
| ⚡ | **プロファイル & Current Task** | Token Saver、Daily、Balanced、Astra Director、Max Quality、またはタスク別のモデル/Reasoning をワンクリックで切り替え。 |
| 🌍 | **グローバル + プロジェクト範囲** | `~/.codex/config.toml` とプロジェクトごとの `.codex/config.toml` をフィールド単位の継承付きで管理。 |
| 🩺 | **Config Health** | 最近の信頼できる Codex schema で設定を確認し、未知/将来フィールドは既定で保持。 |
| 🔒 | **Model Integrity** | 意図したモデル/Reasoning をロックし、設定ドリフトとローカルで観測可能な Codex rollout 証拠を照合。 |
| 📊 | **使用量分析** | 7 日 / 30 日 / 全期間の Token、モデル傾向、サブ Agent、reroute、プロジェクト活動、参考コストを確認。 |
| 🛡️ | **安全な編集と復元** | 書き込み前のバックアップ、履歴、差分プレビュー、Studio 導入前の元設定への復元。 |
| 🔄 | **署名付き更新** | 安定版を自動確認し、ユーザー確認後に署名を検証してアプリ内更新。 |
| 🌐 | **クロスプラットフォーム + 多言語** | Windows、Linux、macOS。英語、簡体字中国語、繁体字中国語、日本語、韓国語。 |

## 内蔵プロファイル

| プロファイル | メインモデル | 主な用途 |
| --- | --- | --- |
| **Token Saver** | GPT-6 Luna / low | 小さな修正、一括置換、明確なタスク |
| **Economy** | GPT-6 Luna / medium | CRUD、フロントエンド、通常の API 作業 |
| **Daily** | GPT-6 Luna | 日常開発 |
| **Balanced** | GPT-6.1 Sol + GPT-6 Luna | 複数ファイルの機能、リファクタ、連携 |
| **Astra Director** | GPT-6 Astra + GPT-6 Luna | Astra が計画/Review、Luna が実行 |
| **Max Quality** | GPT-6 Astra xhigh + GPT-6 Luna high | 難しい Bug、大規模リファクタ、リリース前 Review |

プロファイルは出発点であり固定ではありません。UI からモデル、Reasoning、サブ Agent、並列数を自由に変更できます。

## Config Health & Model Integrity

### Config Health

- 最近の信頼できる Codex 設定 schema を使用。
- 通常の書き込みでは未知/将来フィールドを保持。
- 未知フィールドの整理には明示確認が必要。
- モデル情報に最低クライアント版がある場合、ローカル Codex CLI の互換性を確認。
- 信頼済み schema / モデル情報をキャッシュし、オフライン時にも利用可能。

### Model Integrity

- スコープごとに有効な `model` と `model_reasoning_effort` をロック。
- Studio から見える設定ドリフトを検出。
- ローカル Codex rollout 証拠から、最近観測されたモデル/Reasoning と reroute を表示。
- 記録されていない、または観測不能なサーバー内部ルーティングをローカルで検証できるものとして扱いません。

## 使用量分析

ダッシュボードはローカル Codex rollout JSONL を**読み取り専用**で解析し、以下を表示できます。

- 7 日 / 30 日 / 全期間の Token 使用量
- モデルと Reasoning の傾向
- ルートセッションとサブ Agent の使用量
- 観測可能な reroute 履歴
- 最近のプロジェクト活動
- 説明可能な Token 急増ヒント
- 版管理された参考コスト

参考コストは日付付き価格スナップショットとローカルで観測可能な情報に基づく推定値であり、**公式請求データではありません**。

## ダウンロード

最新の正式版：

**[GitHub Releases →](https://github.com/While-Shark/codex-config-studio/releases/latest)**

| プラットフォーム | パッケージ |
| --- | --- |
| Windows x64 | NSIS `.exe` |
| Linux x64 | `.AppImage` + `.deb` |
| macOS Universal | Apple Silicon + Intel 対応 `.dmg` |

正式 Release には updater 署名、SHA-256 チェックサム、GitHub build provenance が含まれます。

## 署名付き自動更新

正式ビルドは：

1. 最新の**安定版**を自動確認
2. 新版を能動的に通知
3. 署名付き updater パッケージを検証
4. ユーザー確認後にのみインストール
5. 更新後に新しい版で再起動

長時間起動中も定期確認します。自動確認の失敗は作業を妨げず、未署名/dev ビルドは GitHub Release ページへ安全にフォールバックします。

## 安全設計

Codex Config Studio は設定変更に対して保守的に動作します。

- Studio が管理するモデル / Agent キーだけを変更。
- 未知/将来フィールドは既定で保持。
- project trust、plugins、MCP、hooks、marketplaces は変更しません。
- 書き込みにはバックアップ、履歴、直列化したネイティブ書き込み、セーフな一時ファイル置換を使用。
- プロジェクトバックアップは `~/.codex/.config-studio-backups/` に保存。
- フロントエンドに汎用ファイルシステムや Shell 権限を与えません。

## 設定の優先順位

高い順：

1. CLI flags / `--config`
2. プロジェクト `.codex/config.toml`
3. `--profile`
4. グローバル `~/.codex/config.toml`
5. システム / 組み込み既定値

> Codex は信頼済みプロジェクトのプロジェクト設定だけを読み込みます。Codex Config Studio は project trust を自動変更しません。

## 開発

### Windows

```powershell
./run-dev.ps1
```

### Linux / macOS

```bash
bash ./run-dev.sh
```

標準 Tauri フロー：

```bash
npm ci
npm run tauri:dev
```

ローカルパッケージング：

```text
Windows:       ./build-windows.ps1
Linux/macOS:   bash ./build-unix.sh
```

---

<div align="center">

**Codex の設定を、強力に。壊れやすくしない。**

[最新リリース](https://github.com/While-Shark/codex-config-studio/releases/latest) · [Release Notes](./RELEASE_NOTES.md)

</div>
