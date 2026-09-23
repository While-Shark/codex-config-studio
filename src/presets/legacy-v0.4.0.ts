// Immutable snapshot shipped in v0.4.0. Append future revisions; never edit this snapshot.
import type { PresetDefinition } from '../preset-versions.js';

const snapshot = {
  "sourceTag": "v0.4.0",
  "sourceCommit": "c9cf5fe3d3b0f467c1c858321f03e429b065398f",
  "archivedAt": "2026-09-23",
  "presets": [
    {
      "id": "token-save",
      "values": {
        "model": "gpt-5.6-luna",
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
        "model": "gpt-5.6-luna",
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
        "model": "gpt-5.6-terra",
        "modelReasoningEffort": "medium",
        "planModeReasoningEffort": "high",
        "agentsEnabled": true,
        "defaultSubagentModel": "gpt-5.6-luna",
        "defaultSubagentReasoningEffort": "medium",
        "maxConcurrentThreadsPerSession": 2
      }
    },
    {
      "id": "balanced",
      "values": {
        "model": "gpt-5.6-sol",
        "modelReasoningEffort": "medium",
        "planModeReasoningEffort": "high",
        "agentsEnabled": true,
        "defaultSubagentModel": "gpt-5.6-luna",
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
        "defaultSubagentModel": "gpt-5.6-luna",
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
        "defaultSubagentModel": "gpt-5.6-luna",
        "defaultSubagentReasoningEffort": "high",
        "maxConcurrentThreadsPerSession": 3
      }
    }
  ],
  "descriptions": {
    "zh-CN": {
      "token-save": "Luna + low，不启用子 Agent。",
      "economy": "Luna + medium，减少返工。",
      "daily": "Terra 主力 + Luna 子 Agent。",
      "balanced": "Sol 主导 + Luna 执行。",
      "astra": "Astra 规划/Review，Luna 执行。",
      "max": "Astra xhigh + 高强度 Luna。"
    },
    "zh-TW": {
      "token-save": "Luna + low，不啟用子 Agent。",
      "economy": "Luna + medium，減少返工。",
      "daily": "Terra 主力 + Luna 子 Agent。",
      "balanced": "Sol 主導 + Luna 執行。",
      "astra": "Astra 規劃/Review，Luna 執行。",
      "max": "Astra xhigh + 高強度 Luna。"
    },
    "en": {
      "token-save": "Luna + low, with sub-agents disabled.",
      "economy": "Luna + medium to reduce rework.",
      "daily": "Terra as main model + Luna sub-agents.",
      "balanced": "Sol leads while Luna executes.",
      "astra": "Astra plans/reviews while Luna executes.",
      "max": "Astra xhigh + high-effort Luna."
    },
    "ja": {
      "token-save": "Luna + low、サブ Agent は無効。",
      "economy": "Luna + medium で手戻りを削減。",
      "daily": "Terra を主力、Luna をサブ Agent に。",
      "balanced": "Sol が主導し、Luna が実行。",
      "astra": "Astra が計画/Review、Luna が実行。",
      "max": "Astra xhigh + 高強度 Luna。"
    },
    "ko": {
      "token-save": "Luna + low, 서브 Agent 비활성화.",
      "economy": "Luna + medium으로 재작업 감소.",
      "daily": "Terra 메인 + Luna 서브 Agent.",
      "balanced": "Sol이 주도하고 Luna가 실행.",
      "astra": "Astra가 계획/Review, Luna가 실행.",
      "max": "Astra xhigh + 고강도 Luna."
    }
  }
};

for (const preset of snapshot.presets) { Object.freeze(preset.values); Object.freeze(preset); }
Object.freeze(snapshot.presets);
for (const locale of Object.values(snapshot.descriptions)) Object.freeze(locale);
Object.freeze(snapshot.descriptions);
export const legacyPresetSnapshot: Readonly<{ sourceTag: string; sourceCommit: string; archivedAt: string; presets: readonly PresetDefinition[]; descriptions: typeof snapshot.descriptions }> = Object.freeze(snapshot);
