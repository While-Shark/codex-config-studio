import type { ModelTierUsage, ModelUsage } from './usage-dashboard';

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

export type TierAwareCostEstimate = CostEstimate & {
  baseUsd: number;
  fastSurchargeUsd: number;
  tierCoveredTokens: number;
  tierCoverage: number;
  fastAdjustedTokens: number;
  unadjustedFastModels: string[];
  unsupportedServiceTiers: string[];
  tierAdjustmentComplete: boolean;
};

/**
 * Reference rates for ChatGPT Work / Codex token-based USD billing.
 * This is intentionally versioned as a snapshot instead of pretending prices are timeless.
 * The UI labels the result as a reference estimate, not the user's actual bill.
 */
export const CODEX_USD_REFERENCE_CATALOG: PricingCatalog = {
  id: 'openai-codex-usd-2026-09-29',
  label: 'OpenAI ChatGPT Work / Codex USD token rate',
  snapshotDate: '2026-09-29',
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
    'gpt-5.4-mini': {input:0.75, cachedInput:0.075, output:4.5},
    'gpt-5.3-codex': {input:1.75, cachedInput:0.175, output:14},
    'gpt-5.2': {input:1.75, cachedInput:0.175, output:14},
    'gpt-daybreak-blue-latest': {input:4, cachedInput:0.4, output:20},
    'gpt-daybreak-red-latest': {input:12.5, cachedInput:1.25, output:75},
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

export function fastMultiplierForModel(model: string): number | null {
  const normalized=normalizePricedModel(model);
  if(['gpt-6-astra','gpt-6-sol','gpt-6-luna'].includes(normalized))return 2.5;
  if(normalized.startsWith('gpt-5.6-'))return 2.5;
  if(normalized==='gpt-5.5')return 2.5;
  if(normalized==='gpt-5.4')return 2;
  return null;
}

function normalizeTier(value:string|null|undefined):string {
  return (value??'').trim().toLowerCase();
}

function isFastTier(value:string|null|undefined):boolean {
  const normalized=normalizeTier(value);
  return normalized==='priority'||normalized==='fast';
}

function isDefaultTier(value:string|null|undefined):boolean {
  const normalized=normalizeTier(value);
  return normalized===''||normalized==='default';
}

function modelReasoningKey(model:string,reasoning:string|null):string {
  return normalizePricedModel(model)+'\u0000'+(reasoning??'');
}

export function estimateTierAwareUsageCost(
  modelRows: ModelUsage[],
  modelTierRows: ModelTierUsage[],
  totalTokens: number,
  catalog: PricingCatalog = CODEX_USD_REFERENCE_CATALOG,
): TierAwareCostEstimate {
  const base=estimateUsageCost(modelRows,totalTokens,catalog);
  const surchargeByModel=new Map<string,number>();
  const unadjustedFastModels=new Set<string>();
  const unsupportedServiceTiers=new Set<string>();
  let fastSurchargeUsd=0;
  let tierCoveredTokens=0;
  let fastAdjustedTokens=0;

  for(const row of modelTierRows){
    const normalized=normalizePricedModel(row.model);
    if(!catalog.rates[normalized])continue;
    const tokens=Math.max(0,row.usage.totalTokens||0);

    if(isDefaultTier(row.serviceTier)){
      tierCoveredTokens+=tokens;
      continue;
    }
    if(!isFastTier(row.serviceTier)){
      const raw=row.serviceTier?.trim();
      if(raw)unsupportedServiceTiers.add(raw);
      continue;
    }

    const multiplier=fastMultiplierForModel(normalized);
    if(multiplier===null){
      unadjustedFastModels.add(row.model);
      continue;
    }
    tierCoveredTokens+=tokens;
    const baseRowCost=estimateModelCost(row,catalog);
    if(baseRowCost===null)continue;
    const surcharge=baseRowCost*(multiplier-1);
    fastSurchargeUsd+=surcharge;
    fastAdjustedTokens+=tokens;
    const key=modelReasoningKey(row.model,row.reasoning);
    surchargeByModel.set(key,(surchargeByModel.get(key)??0)+surcharge);
  }

  const modelRowsAdjusted=base.modelRows.map(row=>({
    ...row,
    usd:row.usd+(surchargeByModel.get(modelReasoningKey(row.model,row.reasoning))??0),
  })).sort((a,b)=>b.usd-a.usd||a.model.localeCompare(b.model));
  const tierCoverage=base.coveredTokens>0?Math.min(1,tierCoveredTokens/base.coveredTokens):0;
  const unadjusted=[...unadjustedFastModels].sort();
  const unsupported=[...unsupportedServiceTiers].sort();
  const tierAdjustmentComplete=base.coveredTokens<=0||(
    tierCoverage>=0.999999&&unadjusted.length===0&&unsupported.length===0
  );

  return {
    ...base,
    usd:base.usd+fastSurchargeUsd,
    baseUsd:base.usd,
    fastSurchargeUsd,
    tierCoveredTokens,
    tierCoverage,
    fastAdjustedTokens,
    modelRows:modelRowsAdjusted,
    unadjustedFastModels:unadjusted,
    unsupportedServiceTiers:unsupported,
    tierAdjustmentComplete,
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
