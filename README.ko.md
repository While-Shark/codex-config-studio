<div align="center">

<img src="./src-tauri/icons/icon.svg" width="96" alt="Codex Config Studio">

# Codex Config Studio

**Astra / Sol / Terra / Luna 프로필을 한 번에 전환하는 크로스플랫폼 Codex 설정 관리자.**

전역/프로젝트 설정 · Config Health · Model Integrity · 사용량 분석 · Reasoning · 서브 Agent · 안전 업데이트

[![Build Desktop](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml/badge.svg)](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml)
[![Release](https://img.shields.io/github/v/release/While-Shark/codex-config-studio?include_prereleases)](https://github.com/While-Shark/codex-config-studio/releases)
![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-blue)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB)
![Languages](https://img.shields.io/badge/languages-5-purple)

[简体中文](./README.md) · [繁體中文](./README.zh-TW.md) · [English](./README.en.md) · [日本語](./README.ja.md) · **한국어**

[소개](#소개) · [기능](#기능) · [프로필](#기본-프로필) · [다운로드](#다운로드) · [개발](#로컬-개발) · [보안](#보안)

</div>

> **UI/UX 개선**: 두 열 레이아웃, 고정 적용 영역, 설정 그룹, 프로젝트/프로필 기록 및 읽기 전용 미리보기. 초안 폐기 확인, 포커스 관리 및 키보드 탭 조작을 추가했습니다. 다국어, 테마, 상속, 보관 프로필 경고를 유지하며 쓰기 완료 전 잠금을 해제하지 않습니다.

---

## 소개

Codex Config Studio는 **Tauri v2** 기반 데스크톱 설정 관리자입니다. Codex Desktop / CLI의 전역 및 프로젝트 단위 `.codex/config.toml`을 안전하게 관리합니다.

Astra, Sol, Terra, Luna를 자주 전환하거나 계획 모델, 실행 모델, Reasoning, 서브 Agent, 동시 실행 수를 시각적으로 관리하려는 사용자에게 적합합니다.

## 기능

| 기능 | 설명 |
| --- | --- |
| 🌍 전역 설정 | `~/.codex/config.toml` 관리 |
| 📁 프로젝트 설정 | `<project>/.codex/config.toml` 관리 |
| 🎯 현재 작업 빠른 전환 | 작은 수정 / 일상 개발 / 복잡한 문제 / 아키텍처별로 모델과 Reasoning을 편집하고 선호를 저장 |
| ⚡ 원클릭 프로필 | Token 절약, Economy, Daily, Balanced, Astra Director, Max Quality |
| 🧠 Reasoning | 메인 / Plan Mode / 서브 Agent 사고 수준 개별 설정 |
| 🤖 서브 Agent | 사용 여부, 기본 모델, Reasoning, 최대 동시 수 |
| 🧬 필드 상속 | 프로젝트 설정을 필드별로 하위 설정에 상속 |
| 🛡️ 안전 백업 | 최초 원본 백업 + 쓰기 전 히스토리 백업 |
| ↩️ 복원 | 앱이 처음 수정하기 전 설정으로 복원 |
| 🩺 Config Health | 최근의 신뢰 가능한 Codex schema로 검증하며, 알 수 없거나 미래의 필드는 기본 보존하고 정리 전 확인+백업 필요 |
| 🔒 Model Integrity | 유효 모델/Reasoning을 잠그고 설정 드리프트 및 로컬 Codex rollout의 관찰 가능한 런타임 증거를 비교 |
| 📊 사용량과 참고 비용 | 7일 / 30일 / 전체 기간, 모델 추세, Agent 분석, reroute 타임라인, 버전이 있는 참고 비용 |
| 🗂️ 최근 프로젝트 개요 | Config Studio 기록에서 최근 활동, Token, 세션, 주요 모델, reroute를 요약 |
| 🔄 안전 업데이트 | 안정 버전 확인과 정식 서명 빌드의 인앱 업데이트. 미서명 빌드는 Release 페이지로 안전하게 폴백 |
| 🌐 다국어 | 중국어 간체/번체, 영어, 일본어, 한국어 |
| 📦 멀티플랫폼 | Windows / Linux / macOS |

## Config Health, Model Integrity, 사용량 분석

### Config Health

Config Health는 **OpenAI Codex 저장소에서 생성된 권위 있는 설정 schema**를 우선 사용하고 마지막으로 신뢰한 버전을 로컬에 보관합니다. 오프라인/폴백 소스 또는 너무 오래된 캐시는 참고로 표시할 수 있지만 **알 수 없는 필드 삭제 경고에는 사용하지 않습니다**.

- 일반 쓰기는 Studio가 관리하는 키만 수정하며 알 수 없거나 미래에 추가된 필드는 보존합니다.
- 알 수 없는 필드를 제거하려면 명시적 확인이 필요하고 먼저 백업 및 기록을 생성합니다.
- 로컬 Codex CLI 버전을 표시하고 연속된 권위 schema 사이의 추가/삭제/구조 변경 필드를 비교할 수 있습니다.
- 문서 설명만 바뀐 경우 구조 변경으로 보고하지 않습니다.

### Model Integrity

Model Integrity는 범위의 유효 `model` 및 `model_reasoning_effort`를 잠그고 Studio에서 보이는 설정 드리프트를 감지합니다. 또한 로컬 Codex rollout에 이미 기록된 런타임 증거와 비교해 최근 모델/Reasoning, 관찰 가능한 reroute, 최근 5개 증거를 보여 주며 읽기 전용 새로고침을 제공합니다.

> 검증 범위는 **Studio에서 보이는 설정 + 로컬에 기록된 rollout 증거**입니다. CLI 임시 재정의, 로컬에 기록되지 않은 동작, 관찰할 수 없는 서버 내부 라우팅은 로컬 보장 범위 밖입니다.

### 프로젝트 사용량과 참고 비용

프로젝트 사용량 대시보드는 로컬 Codex rollout JSONL을 읽기 전용으로 집계하며 7일 / 30일 / 전체 기간을 지원합니다. 모델/Reasoning, 루트/서브 Agent, 일별/모델별 추세, Agent 분석, 관찰 가능한 reroute 타임라인, 최근 프로젝트 개요와 함께 정확한 과거 일별 사용량만을 기준으로 한 설명 가능한 Token 급증 힌트를 제공합니다.

참고 비용은 **날짜와 버전이 있는 가격 스냅샷**을 사용합니다. 알 수 없는 모델 가격은 추정하지 않으며 오래된 스냅샷에는 경고합니다. 모든 사용량과 비용 값은 **best-effort 로컬 텔레메트리이며 청구 데이터가 아닙니다**.

모델 후보는 OpenAI Codex 공식 `models.json`에서 자동으로 새로고침되며 로컬에 24시간 캐시됩니다. 오프라인이거나 공식 소스를 가져오지 못하면 최근 캐시와 내장 호환 목록을 계속 사용합니다. 새로고침은 선택지만 갱신하며 기존 설정, 작업 선호, 기록, Preset 또는 사용자 지정 모델 ID를 자동 변경하지 않습니다.

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

> 정식 Release 워크플로는 저장소 서명 자격 증명이 설정된 경우 Windows Authenticode와 macOS Developer ID + notarization을 선택적으로 활성화할 수 있습니다. 모든 정식 Release 파일에는 GitHub build provenance도 생성되며 `gh attestation verify <file> --repo While-Shark/codex-config-studio`로 출처를 검증할 수 있습니다.

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
