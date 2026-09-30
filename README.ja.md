<div align="center">

<img src="./src-tauri/icons/icon.svg" width="96" alt="Codex Config Studio">

# Codex Config Studio

**Astra / Sol / Terra / Luna をワンクリックで切り替えるクロスプラットフォーム Codex 設定マネージャー。**

グローバル/プロジェクト設定 · Config Health · Model Integrity · 使用量分析 · Reasoning · サブ Agent · 安全更新

[![Build Desktop](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml/badge.svg)](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml)
[![Release](https://img.shields.io/github/v/release/While-Shark/codex-config-studio?include_prereleases)](https://github.com/While-Shark/codex-config-studio/releases)
![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-blue)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB)
![Languages](https://img.shields.io/badge/languages-5-purple)

[简体中文](./README.md) · [繁體中文](./README.zh-TW.md) · [English](./README.en.md) · **日本語** · [한국어](./README.ko.md)

[概要](#概要) · [機能](#機能) · [プロファイル](#内蔵プロファイル) · [ダウンロード](#ダウンロード) · [開発](#ローカル開発) · [セキュリティ](#セキュリティ)

</div>

> **UI/UX を刷新**：二列レイアウト、固定適用ボタン、設定のグループ化、プロジェクト/プロファイル履歴と読み取り専用プレビュー。草稿破棄の確認、フォーカス管理、キーボード操作を追加。多言語、テーマ、継承と履歴警告を維持し、書き込み完了前のロック解除を防止。

---

## 概要

Codex Config Studio は **Tauri v2** ベースのデスクトップ設定マネージャーです。Codex Desktop / CLI のグローバル設定とプロジェクト単位の `.codex/config.toml` を安全に管理します。

Astra、Sol、Terra、Luna を頻繁に切り替える人や、計画モデル、実行モデル、Reasoning、サブ Agent、並列数を視覚的に管理したい人向けです。

## 機能

| 機能 | 内容 |
| --- | --- |
| 🌍 グローバル設定 | `~/.codex/config.toml` を管理 |
| 📁 プロジェクト設定 | `<project>/.codex/config.toml` を管理 |
| 🎯 現在のタスク切り替え | 小さな修正 / 日常開発 / 複雑な問題 / アーキテクチャ。各モードでモデルと Reasoning を編集・保存可能 |
| ⚡ ワンクリックプロファイル | Token 節約、Economy、Daily、Balanced、Astra Director、Max Quality |
| 🧠 Reasoning | メイン、Plan Mode、サブ Agent の思考レベルを個別設定 |
| 🤖 サブ Agent | 有効/無効、既定モデル、Reasoning、最大並列数 |
| 🧬 フィールド継承 | プロジェクト設定を項目ごとに下位設定へ継承可能 |
| 🛡️ 安全バックアップ | 初回変更時の原本 + 毎回の履歴バックアップ |
| ↩️ 復元 | アプリが初めて変更する前の設定へ復元 |
| 🩺 Config Health | 最近の信頼できる Codex schema で検証。未知/将来フィールドは既定で保持し、削除には確認とバックアップが必要 |
| 🔒 Model Integrity | 有効なモデル/Reasoning をロックし、設定ドリフトとローカル Codex rollout の観測可能な実行時証拠を照合 |
| 📊 使用量と参考コスト | 7 日 / 30 日 / 全期間、モデル傾向、Agent 分析、reroute タイムライン、版管理された参考コスト |
| 🗂️ 最近のプロジェクト | Config Studio 履歴から最近の活動、Token、セッション、主要モデル、reroute を集計 |
| 🔄 安全な更新 | 安定版チェックと正式署名ビルドのアプリ内更新。未署名ビルドは Release ページへ安全にフォールバック |
| 🌐 多言語 | 中国語簡体字/繁体字、英語、日本語、韓国語 |
| 📦 マルチプラットフォーム | Windows / Linux / macOS |

## Config Health、Model Integrity、使用量分析

### Config Health

Config Health は **OpenAI Codex リポジトリで生成された公式 schema** を優先し、最後に信頼できた版をローカルへ保存します。オフライン、フォールバック元、古すぎるキャッシュは参考表示できますが、**未知フィールドの削除警告には使用しません**。

- 通常の書き込みは Studio 管理キーだけを変更し、未知/将来フィールドを保持します。
- 未知フィールドの削除には明示確認が必要で、先にバックアップと履歴を作成します。
- ローカル Codex CLI の版を表示し、連続する公式 schema 間で追加・削除・構造変更フィールドを比較できます。
- 公式モデルカタログに `minimal_client_version` がある場合、現在のメイン/サブ Agent とローカル Codex の版を読み取り専用で比較します。古いクライアントには警告だけを表示し、モデルを隠したり、保存を止めたり、設定を自動変更したりしません。
- 説明文だけの変更は構造変更として扱いません。

### Model Integrity

Model Integrity はスコープの有効な `model` と `model_reasoning_effort` をロックし、Studio から見える設定ドリフトを検出します。さらにローカル Codex rollout に記録済みの実行時証拠と照合し、最新モデル/Reasoning、観測可能な reroute、最近 5 件の履歴を表示し、読み取り専用で再取得できます。

> 検証対象は **Studio から見える設定 + ローカルに記録済みの rollout 証拠** です。CLI の一時上書き、ローカルに記録されない挙動、観測不能なサーバー内部ルーティングは保証対象外です。

### プロジェクト使用量と参考コスト

使用量ダッシュボードはローカル Codex rollout JSONL を読み取り専用で集計し、7 日 / 30 日 / 全期間に対応します。モデル/Reasoning、ルート/サブ Agent、日次・モデル別傾向、Agent 分析、観測可能な reroute タイムライン、最近のプロジェクト概要に加え、正確な過去の日次使用量だけを基準にした説明可能な Token 急増ヒントを表示します。

参考コストは**日付と版を持つ価格スナップショット**を使用します。ローカル rollout に永続化された service tier 証拠がある場合、正確な応答を「モデル × tier」で帰属し、現在の Codex の `priority` を Fast として扱います。公式レートカードにモデル別倍率がある場合だけ Fast 追加コストを反映します。tier 証拠不足、Flex/未知 tier、Fast 倍率不明の場合は概算として表示し、長文脈・地域処理倍率は推測しません。未知モデルの価格も推測しません。使用量とコストはすべて **best-effort のローカルテレメトリであり、請求データではありません**。

モデル候補は OpenAI Codex 公式 `models.json` から自動更新し、ローカルに 24 時間キャッシュします。オフライン時や公式ソースの取得に失敗した場合は、最新キャッシュと内蔵互換リストを使用します。更新は候補だけを変更し、既存設定、タスク設定、履歴、Preset、カスタムモデル ID を自動移行しません。

## 内蔵プロファイル

| プロファイル | メインモデル | 用途 |
| --- | --- | --- |
| Token 節約 | GPT-6 Luna / low | 小さな修正、明確な作業、一括置換 |
| Economy | GPT-6 Luna / medium | CRUD、フロント修正、通常 API |
| Daily | GPT-6 Luna + GPT-6 Luna | 日常開発の大半 |
| Balanced | GPT-6.1 Sol + GPT-6 Luna | 複数ファイル機能、リファクタ、連携 |
| Astra Director | GPT-6 Astra + GPT-6 Luna | Astra が計画/Review、Luna が実行 |
| Max Quality | GPT-6 Astra xhigh + GPT-6 Luna high | 難しい Bug、大規模リファクタ、リリース前 Review |

各プロファイルは UI でさらに自由に変更できます。

## ダウンロード

**[GitHub Releases](https://github.com/While-Shark/codex-config-studio/releases)** からダウンロードできます。

| プラットフォーム | 成果物 |
| --- | --- |
| Windows x64 | NSIS `.exe` |
| Linux x64 | `.AppImage` + `.deb` |
| macOS Universal | `.dmg`、Apple Silicon / Intel 対応 |

> 正式 Release ワークフローは、リポジトリ側で認証情報を設定した場合に Windows Authenticode と macOS Developer ID + notarization を任意で有効化できます。正式 Release の全ファイルには GitHub build provenance も付与され、`gh attestation verify <file> --repo While-Shark/codex-config-studio` で由来を検証できます。

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

## プロファイルの版

**GPT-6.1 / GPT-6 (v0.5.0) / v0.4.0**

現在の Balanced / 複雑なタスクでは GPT-6.1 Sol を推奨します。GPT-6（v0.5.0）と旧 v0.4.0 は不変の履歴スナップショットとして保存され、閲覧だけでは設定を変更しません。

履歴には元のモデル、思考レベル、サブ Agent 設定を保存し、新しい推奨値で上書きしません。

> これは古いモデルと固定の思考レベルを含む履歴プロファイルです。利用可否と料金はアカウントや提供元により異なります。固定レベルは Codex 内の手動調整に影響する場合があります。 確認後はプレビューのみで、設定は書き込みません。

---

<div align="center">

[Releases](https://github.com/While-Shark/codex-config-studio/releases) · [Release Notes](./RELEASE_NOTES.md)

</div>
