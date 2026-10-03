<div align="center">

<img src="./src-tauri/icons/icon.svg" width="96" alt="Codex Config Studio">

# Codex Config Studio

**Codex 설정을 더 안전하고 직관적으로 관리하는 데스크톱 컨트롤 패널.**

`.codex/config.toml`을 직접 편집하지 않고도 모델/Reasoning 프로필 전환, 전역/프로젝트 설정 관리, Model Integrity 확인, 로컬 사용량 분석, 서명 업데이트를 할 수 있습니다.

[![Release](https://img.shields.io/github/v/release/While-Shark/codex-config-studio)](https://github.com/While-Shark/codex-config-studio/releases/latest)
[![Build Desktop](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml/badge.svg)](https://github.com/While-Shark/codex-config-studio/actions/workflows/build-windows.yml)
![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-blue)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB)

[简体中文](./README.zh-CN.md) · [繁體中文](./README.zh-TW.md) · [English](./README.md) · [日本語](./README.ja.md) · **한국어**

[다운로드](#다운로드) · [핵심 기능](#핵심-기능) · [기본 프로필](#기본-프로필) · [안전 설계](#안전-설계) · [개발](#개발)

</div>

---

## 왜 Codex Config Studio인가요?

Codex는 강력하지만 실제 프로젝트의 설정은 금방 복잡해집니다. 프로젝트마다 다른 모델, Reasoning, 서브 Agent, 안전 검사, 업데이트 정책이 필요합니다.

**Codex Config Studio는 이런 설정을 시각적이고 되돌릴 수 있으며 프로젝트 단위로 관리 가능한 워크플로로 바꿉니다.**

## 핵심 기능

| | 기능 | 제공하는 가치 |
| --- | --- | --- |
| ⚡ | **프로필 & Current Task** | Token Saver, Daily, Balanced, Astra Director, Max Quality 또는 작업별 모델/Reasoning 조합을 한 번에 전환합니다. |
| 🌍 | **전역 + 프로젝트 범위** | `~/.codex/config.toml`과 프로젝트별 `.codex/config.toml`을 필드 단위 상속과 함께 관리합니다. |
| 🩺 | **Config Health** | 최근의 신뢰 가능한 Codex schema로 설정을 검사하고, 알 수 없거나 미래의 필드는 기본 보존합니다. |
| 🔒 | **Model Integrity** | 의도한 모델/Reasoning을 잠그고 설정 드리프트를 감지하며 로컬에서 관찰 가능한 Codex rollout 증거와 비교합니다. |
| 📊 | **사용량 분석** | 7일 / 30일 / 전체 기간 Token, 모델 추세, 서브 Agent 활동, reroute, 프로젝트 활동, 참고 비용을 확인합니다. |
| 🛡️ | **안전한 편집과 복원** | 쓰기 전 백업, 기록, 차이 미리보기, Studio가 처음 수정하기 전 원본 설정 복원을 지원합니다. |
| 🔄 | **서명 업데이트** | 안정 버전을 자동 확인하고, 사용자 확인 후 서명을 검증해 앱 안에서 업데이트합니다. |
| 🌐 | **크로스플랫폼 + 다국어** | Windows, Linux, macOS; 영어, 중국어 간체/번체, 일본어, 한국어 지원. |

## 기본 프로필

| 프로필 | 모델 구성 | 권장 용도 |
| --- | --- | --- |
| **Token Saver** | GPT-6 Luna low · Plan low | 작은 수정, 일괄 치환, 명확한 작업 |
| **Economy** | GPT-6 Luna medium · Plan medium | CRUD, 프론트엔드 수정, 일반 API |
| **Daily** | GPT-6 Luna medium + Luna medium 서브 Agent | 일상 개발 |
| **Balanced** | GPT-6.1 Sol medium + Luna medium 서브 Agent | 다중 파일 기능, 리팩터링, 연동 |
| **Astra Director** | GPT-6 Astra high/xhigh + GPT-6.1 Sol medium 서브 Agent | 아키텍처, 작업 분해, 복잡한 구현, Review |
| **Max Quality** | GPT-6 Astra xhigh + GPT-6.1 Sol high 서브 Agent | 어려운 Bug, 대규모 리팩터링, 출시 전 Review |

프로필은 시작점일 뿐 고정 모드가 아닙니다. UI에서 모델, Reasoning, 서브 Agent, 동시 실행 수를 자유롭게 바꿀 수 있습니다.

현재 프로필 버전: **GPT-6.1 · 2026-10-03**. v0.6.1의 GPT-6.1 프로필, GPT-6 v0.5.0 프로필, 이전 v0.4.0 프로필은 읽기 전용 기록 스냅샷으로 계속 보존됩니다.

## Config Health & Model Integrity

### Config Health

- 최근의 신뢰 가능한 Codex 설정 schema를 사용합니다.
- 일반 쓰기에서 알 수 없거나 미래에 추가된 필드를 보존합니다.
- 알 수 없는 필드를 정리하기 전 명시적 확인을 요구합니다.
- 모델 메타데이터에 최소 클라이언트 버전이 있으면 로컬 Codex CLI 호환성을 확인합니다.
- 신뢰한 schema / 모델 메타데이터를 캐시해 오프라인에서도 최근 데이터를 사용합니다.

### Model Integrity

- 범위별 유효 `model`과 `model_reasoning_effort`를 잠급니다.
- Studio에서 보이는 설정 드리프트를 감지합니다.
- 로컬 Codex rollout 증거를 읽어 최근 관찰된 모델/Reasoning과 reroute를 표시합니다.
- 기록되지 않았거나 관찰할 수 없는 서버 내부 라우팅을 로컬에서 검증 가능한 사실처럼 표현하지 않습니다.

## 사용량 분석

대시보드는 로컬 Codex rollout JSONL을 **읽기 전용**으로 분석하며 다음을 표시할 수 있습니다.

- 7일 / 30일 / 전체 기간 Token 사용량
- 모델 및 Reasoning 추세
- 루트 세션과 서브 Agent 사용량
- 관찰 가능한 reroute 기록
- 최근 프로젝트 활동
- 설명 가능한 Token 급증 힌트
- 버전 관리된 참고 비용

참고 비용은 날짜가 있는 가격 스냅샷과 로컬에서 관찰 가능한 메타데이터를 기반으로 한 추정치이며, **공식 청구 데이터가 아닙니다**.

## 다운로드

최신 정식 버전:

**[GitHub Releases →](https://github.com/While-Shark/codex-config-studio/releases/latest)**

| 플랫폼 | 패키지 |
| --- | --- |
| Windows x64 | NSIS `.exe` |
| Linux x64 | `.AppImage` + `.deb` |
| macOS Universal | Apple Silicon + Intel 지원 `.dmg` |

정식 Release에는 updater 서명, SHA-256 체크섬, GitHub build provenance가 포함됩니다.

## 서명 자동 업데이트

정식 빌드는:

1. 최신 **안정 버전**을 자동 확인하고
2. 새 버전을 능동적으로 알리며
3. 서명된 updater 패키지를 검증하고
4. 사용자 확인 후에만 설치하고
5. 업데이트 후 새 버전으로 재시작합니다.

장시간 실행 중에도 주기적으로 다시 확인합니다. 자동 확인 실패는 작업을 방해하지 않으며, 미서명/dev 빌드는 GitHub Release 페이지로 안전하게 폴백합니다.

## 안전 설계

Codex Config Studio는 설정 변경에 보수적으로 동작합니다.

- Studio가 관리하는 모델 / Agent 키만 수정합니다.
- 알 수 없거나 미래의 필드는 기본 보존합니다.
- project trust, plugins, MCP, hooks, marketplaces는 수정하지 않습니다.
- 쓰기 시 백업, 기록, 직렬화된 네이티브 쓰기 잠금, 안전한 임시 파일 교체를 사용합니다.
- 프로젝트 백업은 `~/.codex/.config-studio-backups/`에 저장합니다.
- 프론트엔드에 범용 파일시스템 또는 Shell 권한을 제공하지 않습니다.

## 설정 우선순위

높은 순서:

1. CLI flags / `--config`
2. 프로젝트 `.codex/config.toml`
3. `--profile`
4. 전역 `~/.codex/config.toml`
5. 시스템 / 내장 기본값

> Codex는 신뢰된 프로젝트의 프로젝트 설정만 로드합니다. Codex Config Studio는 project trust를 자동으로 변경하지 않습니다.

## 개발

### Windows

```powershell
./run-dev.ps1
```

### Linux / macOS

```bash
bash ./run-dev.sh
```

표준 Tauri 워크플로:

```bash
npm ci
npm run tauri:dev
```

로컬 패키징:

```text
Windows:       ./build-windows.ps1
Linux/macOS:   bash ./build-unix.sh
```

---

<div align="center">

**Codex 설정은 강력해야 하지만, 취약해서는 안 됩니다.**

[최신 릴리스](https://github.com/While-Shark/codex-config-studio/releases/latest) · [Release Notes](./RELEASE_NOTES.md)

</div>
