// Immutable GPT-6.1 profile snapshot shipped in v0.6.1. Append future revisions; never edit this snapshot.
import type { PresetDefinition } from '../preset-versions.js';

const snapshot = {
  "sourceTag": "v0.6.1",
  "sourceCommit": "ffc77fd597bc4dc85890f0690bcc407024b2361b",
  "archivedAt": "2026-10-03",
  "presets": [
    {
      "id": "token-save",
      "values": {
        "model": "gpt-6-luna",
        "modelReasoningEffort": "low",
        "planModeReasoningEffort": "medium",
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
        "planModeReasoningEffort": "high",
        "agentsEnabled": false,
        "defaultSubagentModel": null,
        "defaultSubagentReasoningEffort": null,
        "maxConcurrentThreadsPerSession": null
      }
    },
    {
      "id": "daily",
      "values": {
        "model": "gpt-6-luna",
        "modelReasoningEffort": "medium",
        "planModeReasoningEffort": "high",
        "agentsEnabled": true,
        "defaultSubagentModel": "gpt-6-luna",
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
        "defaultSubagentModel": "gpt-6-luna",
        "defaultSubagentReasoningEffort": "medium",
        "maxConcurrentThreadsPerSession": 2
      }
    },
    {
      "id": "astra",
      "values": {
        "model": "gpt-6-astra",
        "modelReasoningEffort": "medium",
        "planModeReasoningEffort": "high",
        "agentsEnabled": true,
        "defaultSubagentModel": "gpt-6-luna",
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
        "defaultSubagentModel": "gpt-6-luna",
        "defaultSubagentReasoningEffort": "high",
        "maxConcurrentThreadsPerSession": 3
      }
    }
  ],
  "descriptions": {
    "zh-CN": {
      "token-save": "GPT-6 Luna + low，不启用子 Agent。",
      "economy": "GPT-6 Luna + medium，减少返工。",
      "daily": "GPT-6 Luna 主力 + GPT-6 Luna 子 Agent。",
      "balanced": "GPT-6.1 Sol 主导 + GPT-6 Luna 执行。",
      "astra": "GPT-6 Astra 规划/Review，GPT-6 Luna 执行。",
      "max": "GPT-6 Astra xhigh + 高强度 GPT-6 Luna。"
    },
    "zh-TW": {
      "token-save": "GPT-6 Luna + low，不啟用子 Agent。",
      "economy": "GPT-6 Luna + medium，減少返工。",
      "daily": "GPT-6 Luna 主力 + GPT-6 Luna 子 Agent。",
      "balanced": "GPT-6.1 Sol 主導 + GPT-6 Luna 執行。",
      "astra": "GPT-6 Astra 規劃/Review，GPT-6 Luna 執行。",
      "max": "GPT-6 Astra xhigh + 高強度 GPT-6 Luna。"
    },
    "en": {
      "token-save": "GPT-6 Luna + low, with sub-agents disabled.",
      "economy": "GPT-6 Luna + medium to reduce rework.",
      "daily": "GPT-6 Luna as main model + GPT-6 Luna sub-agents.",
      "balanced": "GPT-6.1 Sol leads while GPT-6 Luna executes.",
      "astra": "GPT-6 Astra plans/reviews while GPT-6 Luna executes.",
      "max": "GPT-6 Astra xhigh + high-effort GPT-6 Luna."
    },
    "ja": {
      "token-save": "GPT-6 Luna + low、サブ Agent は無効。",
      "economy": "GPT-6 Luna + medium で手戻りを削減。",
      "daily": "GPT-6 Luna を主力、GPT-6 Luna をサブ Agent に。",
      "balanced": "GPT-6.1 Sol が主導し、GPT-6 Luna が実行。",
      "astra": "GPT-6 Astra が計画/Review、GPT-6 Luna が実行。",
      "max": "GPT-6 Astra xhigh + 高強度 GPT-6 Luna。"
    },
    "ko": {
      "token-save": "GPT-6 Luna + low, 서브 Agent 비활성화.",
      "economy": "GPT-6 Luna + medium으로 재작업 감소.",
      "daily": "GPT-6 Luna 메인 + GPT-6 Luna 서브 Agent.",
      "balanced": "GPT-6.1 Sol이 주도하고 GPT-6 Luna가 실행.",
      "astra": "GPT-6 Astra가 계획/Review, GPT-6 Luna가 실행.",
      "max": "GPT-6 Astra xhigh + 고강도 GPT-6 Luna."
    }
  }
};

for (const preset of snapshot.presets) { Object.freeze(preset.values); Object.freeze(preset); }
Object.freeze(snapshot.presets);
for (const locale of Object.values(snapshot.descriptions)) Object.freeze(locale);
Object.freeze(snapshot.descriptions);

export const gpt61PresetSnapshot: Readonly<{
  sourceTag: string;
  sourceCommit: string;
  archivedAt: string;
  presets: readonly PresetDefinition[];
  descriptions: typeof snapshot.descriptions;
}> = Object.freeze(snapshot);
