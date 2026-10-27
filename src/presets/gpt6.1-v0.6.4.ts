// Immutable v0.6.4 CURRENT snapshot, archived without changing its values.
import type { PresetDefinition } from '../preset-versions.js';
const snapshot = {
  "sourceTag": "v0.6.4",
  "sourceCommit": "90a156fec05c9dcdf51b7c3b16846bf09bcd2f70",
  "archivedAt": "2026-10-27",
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
      "daily": "GPT-6 Luna as main model + GPT-6 Luna sub-agents.",
      "balanced": "GPT-6.1 Sol handles complex work near Astra quality at lower cost, with GPT-6 Luna for execution.",
      "astra": "GPT-6 Astra high/xhigh plans and reviews while GPT-6.1 Sol medium executes.",
      "max": "GPT-6 Astra xhigh + GPT-6.1 Sol high for maximum-quality execution."
    },
    "zh-CN": {
      "token-save": "GPT-6 Luna 主模型与 Plan Mode 均使用 low，不启用子 Agent。",
      "economy": "GPT-6 Luna 主模型与 Plan Mode 均使用 medium，不启用子 Agent。",
      "daily": "GPT-6 Luna 主力 + GPT-6 Luna 子 Agent。",
      "balanced": "GPT-6.1 Sol 负责接近 Astra 质量、但更看重成本的复杂任务，GPT-6 Luna 负责执行。",
      "astra": "GPT-6 Astra high/xhigh 负责规划与 Review，GPT-6.1 Sol medium 负责复杂执行。",
      "max": "GPT-6 Astra xhigh + GPT-6.1 Sol high，优先追求最高质量。"
    },
    "zh-TW": {
      "token-save": "GPT-6 Luna 主模型與 Plan Mode 均使用 low，不啟用子 Agent。",
      "economy": "GPT-6 Luna 主模型與 Plan Mode 均使用 medium，不啟用子 Agent。",
      "daily": "GPT-6 Luna 主力 + GPT-6 Luna 子 Agent。",
      "balanced": "GPT-6.1 Sol 負責接近 Astra 品質、但更重視成本的複雜任務，GPT-6 Luna 負責執行。",
      "astra": "GPT-6 Astra high/xhigh 負責規劃與 Review，GPT-6.1 Sol medium 負責複雜執行。",
      "max": "GPT-6 Astra xhigh + GPT-6.1 Sol high，優先追求最高品質。"
    },
    "ja": {
      "token-save": "GPT-6 Luna のメイン/Plan Mode を low にし、サブ Agent は無効。",
      "economy": "GPT-6 Luna のメイン/Plan Mode を medium にし、サブ Agent は無効。",
      "daily": "GPT-6 Luna を主力、GPT-6 Luna をサブ Agent に。",
      "balanced": "GPT-6.1 Sol が Astra に近い品質をより低コストで担い、GPT-6 Luna が実行を支えます。",
      "astra": "GPT-6 Astra high/xhigh が計画と Review、GPT-6.1 Sol medium が複雑な実装を担当。",
      "max": "GPT-6 Astra xhigh + GPT-6.1 Sol high で最高品質を優先。"
    },
    "ko": {
      "token-save": "GPT-6 Luna 메인/Plan Mode를 모두 low로 사용하고 서브 Agent는 비활성화합니다.",
      "economy": "GPT-6 Luna 메인/Plan Mode를 모두 medium으로 사용하고 서브 Agent는 비활성화합니다.",
      "daily": "GPT-6 Luna 메인 + GPT-6 Luna 서브 Agent.",
      "balanced": "GPT-6.1 Sol이 Astra에 가까운 품질을 더 낮은 비용으로 담당하고 GPT-6 Luna가 실행을 지원합니다.",
      "astra": "GPT-6 Astra high/xhigh가 계획과 Review를 담당하고 GPT-6.1 Sol medium이 복잡한 실행을 담당합니다.",
      "max": "GPT-6 Astra xhigh + GPT-6.1 Sol high로 최고 품질을 우선합니다."
    }
  }
};
for (const p of snapshot.presets) { Object.freeze(p.values); Object.freeze(p); }
Object.freeze(snapshot.presets);
for (const locale of Object.values(snapshot.descriptions)) Object.freeze(locale);
Object.freeze(snapshot.descriptions);
export const priorCurrentPresetSnapshot: Readonly<{
 sourceTag: string; sourceCommit: string; archivedAt: string;
 presets: readonly PresetDefinition[]; descriptions: typeof snapshot.descriptions;
}> = Object.freeze(snapshot);
