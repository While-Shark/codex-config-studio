<div align="center">

<img src="./src-tauri/icons/icon.svg" width="96" alt="Codex Config Studio">

# Codex Config Studio

**Astra / Sol / Terra / Luna 프로필을 한 번에 전환하는 크로스플랫폼 Codex 설정 관리자.**

전역 설정 · 프로젝트 설정 · Reasoning · 서브 Agent · 안전 백업

[![Build Desktop](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml/badge.svg)](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml)
[![Release](https://img.shields.io/github/v/release/While-Shark/codex-config-studio?include_prereleases)](https://github.com/While-Shark/codex-config-studio/releases)
![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-blue)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB)
![Languages](https://img.shields.io/badge/languages-5-purple)

[简体中文](./README.md) · [繁體中文](./README.zh-TW.md) · [English](./README.en.md) · [日本語](./README.ja.md) · **한국어**

[소개](#소개) · [기능](#기능) · [프로필](#기본-프로필) · [다운로드](#다운로드) · [개발](#로컬-개발) · [보안](#보안)

</div>

---

## 소개

Codex Config Studio는 **Tauri v2** 기반 데스크톱 설정 관리자입니다. Codex Desktop / CLI의 전역 및 프로젝트 단위 `.codex/config.toml`을 안전하게 관리합니다.

Astra, Sol, Terra, Luna를 자주 전환하거나 계획 모델, 실행 모델, Reasoning, 서브 Agent, 동시 실행 수를 시각적으로 관리하려는 사용자에게 적합합니다.

## 기능

| 기능 | 설명 |
| --- | --- |
| 🌍 전역 설정 | `~/.codex/config.toml` 관리 |
| 📁 프로젝트 설정 | `<project>/.codex/config.toml` 관리 |
| ⚡ 원클릭 프로필 | Token 절약, Economy, Daily, Balanced, Astra Director, Max Quality |
| 🧠 Reasoning | 메인 / Plan Mode / 서브 Agent 사고 수준 개별 설정 |
| 🤖 서브 Agent | 사용 여부, 기본 모델, Reasoning, 최대 동시 수 |
| 🧬 필드 상속 | 프로젝트 설정을 필드별로 하위 설정에 상속 |
| 🛡️ 안전 백업 | 최초 원본 백업 + 쓰기 전 히스토리 백업 |
| ↩️ 복원 | 앱이 처음 수정하기 전 설정으로 복원 |
| 🌐 다국어 | 중국어 간체/번체, 영어, 일본어, 한국어 |
| 📦 멀티플랫폼 | Windows / Linux / macOS |

## 기본 프로필

| 프로필 | 메인 모델 | 용도 |
| --- | --- | --- |
| Token 절약 | GPT-6 Luna / low | 작은 수정, 일괄 치환, 명확한 작업 |
| Economy | GPT-6 Luna / medium | CRUD, 프론트 수정, 일반 API |
| Daily | GPT-6 Luna + GPT-6 Luna | 대부분의 일상 개발 |
| Balanced | GPT-6 Sol + GPT-6 Luna | 다중 파일 기능, 리팩터링, 연동 |
| Astra Director | GPT-6 Astra + GPT-6 Luna | Astra 계획/Review, Luna 실행 |
| Max Quality | GPT-6 Astra xhigh + GPT-6 Luna high | 어려운 Bug, 대규모 리팩터링, 출시 전 Review |

모든 프로필은 UI에서 자유롭게 추가 조정할 수 있습니다.

## 다운로드

**[GitHub Releases](https://github.com/While-Shark/codex-config-studio/releases)** 에서 다운로드하세요.

| 플랫폼 | 산출물 |
| --- | --- |
| Windows x64 | NSIS `.exe` |
| Linux x64 | `.AppImage` + `.deb` |
| macOS Universal | `.dmg`, Apple Silicon / Intel 지원 |

> macOS CI 빌드는 현재 서명 및 notarization이 적용되지 않았습니다. 테스트에는 사용할 수 있지만 공개 배포에는 Apple 서명/공증을 권장합니다.

## 로컬 개발

Windows:

```powershell
./run-dev.ps1
```

Linux / macOS:

```bash
bash ./run-dev.sh
```

## Codex 설정 우선순위

1. CLI flags / `--config`
2. 프로젝트 `.codex/config.toml`
3. `--profile`
4. 전역 `~/.codex/config.toml`
5. 시스템 / 기본값

## 보안

- 프론트엔드에 범용 파일시스템 / Shell 권한을 노출하지 않습니다
- 설정 I/O는 제한된 Rust commands가 처리합니다
- 앱이 관리하는 모델 / Agent 키만 수정합니다
- plugins, MCP, hooks, marketplaces, project trust는 수정하지 않습니다
- 백업은 `~/.codex/.config-studio-backups/`에 저장합니다

## 프로필 버전

**GPT-6 / v0.4.0**

현재 추천은 GPT-6를 사용합니다. 이전 프로필은 기록에 완전히 보존됩니다. 버전을 살펴보는 것만으로 설정이 변경되지는 않습니다.

보관된 스냅샷은 원래 모델, 사고 수준 및 서브 Agent 설정을 유지하며 새 추천값으로 덮어쓰지 않습니다.

> 이전 모델과 고정 사고 수준이 포함된 보관 프로필입니다. 사용 가능 여부와 비용은 계정 또는 서비스 제공업체에 따라 다릅니다. 고정 수준은 Codex에서 수동 조정에 영향을 줄 수 있습니다. 확인하면 미리보기만 불러오며 설정 파일에 쓰지 않습니다.

---

<div align="center">

[Releases](https://github.com/While-Shark/codex-config-studio/releases) · [Release Notes](./RELEASE_NOTES.md)

</div>
