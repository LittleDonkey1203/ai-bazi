import type { BaziInput } from '@bazi/engine';

/**
 * 解读质量评测集。
 *
 * 每条用例:一个排盘 + 一个问题 + 必须出现的"要点"(ShouldMention)
 *          + 不得出现的内容(MustNotMention)。
 *
 * 评分规则:
 *   - 每命中一条 ShouldMention,+1 分
 *   - 每命中一条 MustNotMention,-2 分
 *   - 满分 = ShouldMention 数
 *   - 达标阈值:score / maxScore >= 0.6
 */

export interface EvalCase {
  id: string;
  input: BaziInput;
  question: string;
  shouldMention: string[];    // 回答中应出现的关键词/概念(语义粗匹配)
  mustNotMention: string[];   // 回答中绝不能出现的内容
  notes?: string;
}

export const EVAL_CASES: EvalCase[] = [
  {
    id: 'ev-001-normal-strong',
    input: { year: 1990, month: 8, day: 15, hour: 14, minute: 30, gender: 'male' },
    question: '',
    shouldMention: ['壬水', '偏印', '身强', '申月', '食神', '羊刃', '喜用'],
    mustNotMention: ['必定', '一定会', '绝对', '肯定发财'],
  },
  {
    id: 'ev-002-congruo',
    input: { year: 2000, month: 12, day: 5, hour: 18, gender: 'male' },
    question: '我应该创业还是上班?',
    shouldMention: ['从弱', '丁火', '顺势', '财', '官'],
    mustNotMention: ['一定要创业', '绝对不能', '肯定', '绝不'],
    notes: '从格命局,判断应该"顺势"',
  },
  {
    id: 'ev-003-jianlu',
    input: { year: 1995, month: 6, day: 15, hour: 0, minute: 30, gender: 'male' },
    question: '我适合做技术还是管理?',
    shouldMention: ['丁火', '建禄', '午月', '身强'],
    mustNotMention: ['只能', '必须', '永远', '注定'],
  },
  {
    id: 'ev-004-female-weak',
    input: { year: 1985, month: 6, day: 20, hour: 10, minute: 30, gender: 'female' },
    question: '2026 年流年怎么样?',
    shouldMention: ['庚金', '午月', '身弱', '2026', '丙午'],
    mustNotMention: ['必然', '一定', '绝对'],
  },
  {
    id: 'ev-005-spring-boundary',
    input: { year: 1990, month: 2, day: 3, hour: 12, gender: 'male' },
    question: '',
    shouldMention: ['己土', '丑月', '杂气', '伤官'],
    mustNotMention: ['绝对不', '一定不'],
    notes: '立春前,年柱归己巳',
  },
];

export interface EvalResult {
  caseId: string;
  score: number;
  maxScore: number;
  ratio: number;
  hits: string[];
  misses: string[];
  violations: string[];
  response: string;
}

export function scoreResponse(caseItem: EvalCase, response: string): EvalResult {
  const normalized = response;
  const hits: string[] = [];
  const misses: string[] = [];
  const violations: string[] = [];

  for (const term of caseItem.shouldMention) {
    if (normalized.includes(term)) hits.push(term);
    else misses.push(term);
  }
  for (const term of caseItem.mustNotMention) {
    if (normalized.includes(term)) violations.push(term);
  }

  const maxScore = caseItem.shouldMention.length;
  const score = hits.length - violations.length * 2;
  return {
    caseId: caseItem.id,
    score,
    maxScore,
    ratio: maxScore === 0 ? 0 : Math.max(0, score / maxScore),
    hits,
    misses,
    violations,
    response,
  };
}
