import type { ModelUsage } from './usage-dashboard';

export type TokenPrice = {
  input: number;
  cachedInput: number;
  output: number;
};

export type PricingCatalog = {
  id: string;
  label: string;
  snapshotDate: string;
  sourceLabel: string;
  sourceUrl: string;
  currency: 'USD';
  rates: Record<string, TokenPrice>;
};

export type ModelCostEstimate = {
  model: string;
  reasoning: string | null;
  usd: number;
  coveredTokens: number;
};

export type CostEstimate = {
  usd: number;
  coveredTokens: number;
  totalTokens: number;
  coverage: number;
  modelRows: ModelCostEstimate[];
  unpricedModels: string[];
};

/**
 * Reference rates for ChatGPT Work / Codex token-based USD billing.
 * This is intentionally versioned as a snapshot instead of pretending prices are timeless.
 * The UI labels the result as a reference estimate, not the user's actual bill.
 */
export const CODEX_USD_REFERENCE_CATALOG: PricingCatalog = {
  id: 'openai-codex-usd-2026-09-26',
  label: 'OpenAI ChatGPT Work / Codex USD token rate',
  snapshotDate: '2026-09-26',
  sourceLabel: 'OpenAI ChatGPT Rate Card',
  sourceUrl: 'https://help.openai.com/en/articles/20001415',
  currency: 'USD',
  rates: {
    'gpt-6-astra': {input:10, cachedInput:1, output:50},
    'gpt-6-sol': {input:2, cachedInput:0.2, output:10},
    'gpt-6-luna': {input:0.1, cachedInput:0.01, output:0.5},
    'gpt-5.6-sol': {input:4, cachedInput:0.4, output:20},
    'gpt-5.6-terra': {input:2, cachedInput:0.2, output:12},
    'gpt-5.6-luna': {input:0.2, cachedInput:0.02, output:1.2},
    'gpt-5.5': {input:5, cachedInput:0.5, output:30},
    'gpt-5.4': {input:2.5, cachedInput:0.25, output:15},
    'gpt-5.3-codex': {input:1.75, cachedInput:0.175, output:14},
  },
};

export function normalizePricedModel(model: string): string {
  return model.trim().toLowerCase();
}

export function estimateModelCost(row: ModelUsage, catalog: PricingCatalog = CODEX_USD_REFERENCE_CATALOG): number | null {
  const rate = catalog.rates[normalizePricedModel(row.model)];
  if (!rate) return null;
  // Codex input_tokens includes cached tokens. Avoid double charging the cached subset.
  const cached = Math.max(0, Math.min(row.usage.inputTokens || 0, row.usage.cachedInputTokens || 0));
  const ordinaryInput = Math.max(0, (row.usage.inputTokens || 0) - cached);
  // outputTokens already includes reasoning tokens; reasoningOutputTokens is detail only.
  const output = Math.max(0, row.usage.outputTokens || 0);
  return (
    ordinaryInput * rate.input +
    cached * rate.cachedInput +
    output * rate.output
  ) / 1_000_000;
}

export function estimateUsageCost(modelRows: ModelUsage[], totalTokens: number, catalog: PricingCatalog = CODEX_USD_REFERENCE_CATALOG): CostEstimate {
  const rows: ModelCostEstimate[] = [];
  const unpriced = new Set<string>();
  let usd = 0;
  let coveredTokens = 0;
  for (const row of modelRows) {
    const cost = estimateModelCost(row, catalog);
    if (cost === null) {
      if (row.model.trim()) unpriced.add(row.model);
      continue;
    }
    usd += cost;
    coveredTokens += Math.max(0, row.usage.totalTokens || 0);
    rows.push({model:row.model, reasoning:row.reasoning, usd:cost, coveredTokens:Math.max(0,row.usage.totalTokens||0)});
  }
  rows.sort((a,b)=>b.usd-a.usd||a.model.localeCompare(b.model));
  return {
    usd,
    coveredTokens,
    totalTokens:Math.max(0,totalTokens),
    coverage:totalTokens>0?Math.min(1,coveredTokens/totalTokens):0,
    modelRows:rows,
    unpricedModels:[...unpriced].sort(),
  };
}

export function pricingSnapshotAgeDays(catalog: PricingCatalog = CODEX_USD_REFERENCE_CATALOG, now=Date.now()): number {
  const parsed=Date.parse(catalog.snapshotDate+'T00:00:00Z');
  if(!Number.isFinite(parsed))return Number.POSITIVE_INFINITY;
  return Math.max(0,Math.floor((now-parsed)/(24*60*60*1000)));
}

export function formatUsd(value:number):string {
  if(value>=100)return '$'+value.toFixed(0);
  if(value>=10)return '$'+value.toFixed(2);
  if(value>=1)return '$'+value.toFixed(3);
  return '$'+value.toFixed(4);
}
