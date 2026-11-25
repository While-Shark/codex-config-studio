// Immutable snapshot of the profiles shipped in v0.6.6.
import type { PresetDefinition } from '../preset-versions.js';
const snapshot = {
  "sourceTag": "v0.6.6",
  "sourceCommit": "86f43a5d17ed3c40187661c27adb11df8942e693",
  "archivedAt": "2026-11-25",
  "presets": [
    {
      "id": "token-save",
      "values": {
        "model": "gpt-6-luna",
        "modelReasoningEffort": "low",
        "planModeReasoningEffort": "low",
        "agentsEnabled": false,
        "defaultSubagentModel": null,
        "defaultSubagentReasoningEffort": null,
        "maxConcurrentThreadsPerSession": null
      }
    },
    {
      "id": "economy",
      "values": {
        "model": "gpt-6-luna",
        "modelReasoningEffort": "medium",
        "planModeReasoningEffort": "medium",
        "agentsEnabled": false,
        "defaultSubagentModel": null,
        "defaultSubagentReasoningEffort": null,
        "maxConcurrentThreadsPerSession": null
      }
    },
    {
      "id": "daily",
      "values": {
        "model": "gpt-6.1-terra",
        "modelReasoningEffort": "medium",
        "planModeReasoningEffort": "high",
        "agentsEnabled": true,
        "defaultSubagentModel": "gpt-6.1-terra",
        "defaultSubagentReasoningEffort": "medium",
        "maxConcurrentThreadsPerSession": 2
      }
    },
    {
      "id": "balanced",
      "values": {
        "model": "gpt-6.1-sol",
        "modelReasoningEffort": "medium",
        "planModeReasoningEffort": "high",
        "agentsEnabled": true,
        "defaultSubagentModel": "gpt-6.1-terra",
        "defaultSubagentReasoningEffort": "medium",
        "maxConcurrentThreadsPerSession": 2
      }
    },
    {
      "id": "astra",
      "values": {
        "model": "gpt-6-astra",
        "modelReasoningEffort": "high",
        "planModeReasoningEffort": "xhigh",
        "agentsEnabled": true,
        "defaultSubagentModel": "gpt-6.1-sol",
        "defaultSubagentReasoningEffort": "medium",
        "maxConcurrentThreadsPerSession": 2
      }
    },
    {
      "id": "max",
      "values": {
        "model": "gpt-6-astra",
        "modelReasoningEffort": "xhigh",
        "planModeReasoningEffort": "xhigh",
        "agentsEnabled": true,
        "defaultSubagentModel": "gpt-6.1-sol",
        "defaultSubagentReasoningEffort": "high",
        "maxConcurrentThreadsPerSession": 3
      }
    }
  ],
  "descriptions": {
    "en": {
      "token-save": "GPT-6 Luna low for both main and Plan Mode, with sub-agents disabled.",
      "economy": "GPT-6 Luna medium for both main and Plan Mode, with sub-agents disabled.",
      "daily": "GPT-6.1 Terra medium leads daily work with Terra medium workers.",
      "balanced": "GPT-6.1 Sol medium plans and reviews; GPT-6.1 Terra medium workers execute bounded tasks.",
      "astra": "GPT-6 Astra high/xhigh plans and reviews while GPT-6.1 Sol medium executes.",
      "max": "GPT-6 Astra xhigh + GPT-6.1 Sol high for maximum-quality execution."
    },
    "zh-CN": {
      "token-save": "GPT-6 Luna 主模型与 Plan Mode 均使用 low，不启用子 Agent。",
      "economy": "GPT-6 Luna 主模型与 Plan Mode 均使用 medium，不启用子 Agent。",
      "daily": "GPT-6.1 Terra medium 负责日常开发，Terra medium 子 Agent 并行执行。",
      "balanced": "GPT-6.1 Sol medium 负责规划和 Review，GPT-6.1 Terra medium 子 Agent 负责执行。",
      "astra": "GPT-6 Astra high/xhigh 负责规划与 Review，GPT-6.1 Sol medium 负责复杂执行。",
      "max": "GPT-6 Astra xhigh + GPT-6.1 Sol high，优先追求最高质量。"
    },
    "zh-TW": {
      "token-save": "GPT-6 Luna 主模型與 Plan Mode 均使用 low，不啟用子 Agent。",
      "economy": "GPT-6 Luna 主模型與 Plan Mode 均使用 medium，不啟用子 Agent。",
      "daily": "GPT-6.1 Terra medium 負責日常開發，Terra medium 子 Agent 並行執行。",
      "balanced": "GPT-6.1 Sol medium 負責規劃與 Review，GPT-6.1 Terra medium 子 Agent 負責執行。",
      "astra": "GPT-6 Astra high/xhigh 負責規劃與 Review，GPT-6.1 Sol medium 負責複雜執行。",
      "max": "GPT-6 Astra xhigh + GPT-6.1 Sol high，優先追求最高品質。"
    },
    "ja": {
      "token-save": "GPT-6 Luna のメイン/Plan Mode を low にし、サブ Agent は無効。",
      "economy": "GPT-6 Luna のメイン/Plan Mode を medium にし、サブ Agent は無効。",
      "daily": "GPT-6.1 Terra medium が日常開発を担当し、Terra medium サブ Agent が並列実行します。",
      "balanced": "GPT-6.1 Sol medium が計画と Review を行い、GPT-6.1 Terra medium サブ Agent が実装します。",
      "astra": "GPT-6 Astra high/xhigh が計画と Review、GPT-6.1 Sol medium が複雑な実装を担当。",
      "max": "GPT-6 Astra xhigh + GPT-6.1 Sol high で最高品質を優先。"
    },
    "ko": {
      "token-save": "GPT-6 Luna 메인/Plan Mode를 모두 low로 사용하고 서브 Agent는 비활성화합니다.",
      "economy": "GPT-6 Luna 메인/Plan Mode를 모두 medium으로 사용하고 서브 Agent는 비활성화합니다.",
      "daily": "GPT-6.1 Terra medium이 일상 개발을 담당하고 Terra medium 서브 Agent가 병렬 실행합니다.",
      "balanced": "GPT-6.1 Sol medium이 계획과 검토를 담당하고 GPT-6.1 Terra medium 서브 Agent가 구현합니다.",
      "astra": "GPT-6 Astra high/xhigh가 계획과 Review를 담당하고 GPT-6.1 Sol medium이 복잡한 실행을 담당합니다.",
      "max": "GPT-6 Astra xhigh + GPT-6.1 Sol high로 최고 품질을 우선합니다."
    }
  }
};
for (const p of snapshot.presets) { Object.freeze(p.values); Object.freeze(p); }
Object.freeze(snapshot.presets);
for (const locale of Object.values(snapshot.descriptions)) Object.freeze(locale);
Object.freeze(snapshot.descriptions);
export const terraPresetSnapshot: Readonly<{
 sourceTag: string; sourceCommit: string; archivedAt: string;
 presets: readonly PresetDefinition[]; descriptions: typeof snapshot.descriptions;
}> = Object.freeze(snapshot);
