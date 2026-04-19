import { calculateBazi } from '@bazi/engine';
import type { LLMProvider } from '../types';
import { SYSTEM_PROMPT } from '../prompt/system';
import { buildInterpretationUserMessage } from '../prompt/templates';
import { EVAL_CASES, scoreResponse, type EvalCase, type EvalResult } from './cases';

export interface ABConfig {
  /** 多个候选 system prompt(变体),用于 A/B 对比 */
  variants: Record<string, string>;
  /** 温度(所有变体共用) */
  temperature?: number;
}

export interface ABRunResult {
  variantName: string;
  perCase: EvalResult[];
  totalScore: number;
  totalMaxScore: number;
  totalRatio: number;
  passedCount: number;     // ratio >= 0.6 的用例数
}

/**
 * 跑一个变体 prompt,对所有评测 case 出结果。
 */
export async function runAB(
  provider: LLMProvider,
  ab: ABConfig,
  cases: EvalCase[] = EVAL_CASES,
): Promise<ABRunResult[]> {
  const results: ABRunResult[] = [];

  for (const [variantName, sysPrompt] of Object.entries(ab.variants)) {
    const perCase: EvalResult[] = [];

    for (const caseItem of cases) {
      const chart = calculateBazi(caseItem.input);
      const userMsg = buildInterpretationUserMessage(chart, caseItem.question || undefined);

      const response = await provider.chat({
        systemPrompt: sysPrompt,
        messages: [{ role: 'user', content: userMsg }],
        temperature: ab.temperature ?? 0.5,
      });

      perCase.push(scoreResponse(caseItem, response));
    }

    const totalScore = perCase.reduce((s, r) => s + r.score, 0);
    const totalMaxScore = perCase.reduce((s, r) => s + r.maxScore, 0);
    const passedCount = perCase.filter((r) => r.ratio >= 0.6).length;

    results.push({
      variantName,
      perCase,
      totalScore,
      totalMaxScore,
      totalRatio: totalMaxScore === 0 ? 0 : totalScore / totalMaxScore,
      passedCount,
    });
  }

  return results;
}

/** 格式化结果为表格(打印用) */
export function formatABReport(results: ABRunResult[]): string {
  const lines: string[] = [];
  lines.push('# A/B Eval Report');
  lines.push('');
  for (const r of results) {
    lines.push(`## Variant: ${r.variantName}`);
    lines.push(`Total: ${r.totalScore} / ${r.totalMaxScore}  (${(r.totalRatio * 100).toFixed(1)}%)`);
    lines.push(`Passed: ${r.passedCount} / ${r.perCase.length}`);
    lines.push('');
    lines.push('| Case | Score | Hits | Misses | Violations |');
    lines.push('|------|-------|------|--------|------------|');
    for (const c of r.perCase) {
      lines.push(`| ${c.caseId} | ${c.score}/${c.maxScore} (${(c.ratio * 100).toFixed(0)}%) | ${c.hits.length} | ${c.misses.length} | ${c.violations.length} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
