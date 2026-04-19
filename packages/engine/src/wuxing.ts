import type {
  FourPillars, WuXing, WuXingAnalysis, DiZhi, PillarPosition,
} from './types';
import {
  STEM_ELEMENT, BRANCH_ELEMENT, BRANCH_HIDDEN_STEMS,
} from './utils';

const POSITIONS: readonly PillarPosition[] = ['year', 'month', 'day', 'hour'] as const;
const WUXING_LIST: readonly WuXing[] = ['金', '木', '水', '火', '土'] as const;

const GENERATES: Record<WuXing, WuXing> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
};
const CONTROLS: Record<WuXing, WuXing> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
};
const GENERATES_INV: Record<WuXing, WuXing> = {
  '木': '水', '火': '木', '土': '火', '金': '土', '水': '金',
};
function controlledBy(me: WuXing): WuXing {
  return (Object.entries(CONTROLS).find(([, v]) => v === me)![0]) as WuXing;
}

/** 日主与某五行的五类关系 */
type DayRelation = 'self' | 'gen' | 'ctrl' | 'leak' | 'cost';

function dayRel(dayEl: WuXing, other: WuXing): DayRelation {
  if (dayEl === other) return 'self';
  if (GENERATES[other] === dayEl) return 'gen';
  if (GENERATES[dayEl] === other) return 'leak';
  if (CONTROLS[other] === dayEl) return 'ctrl';
  if (CONTROLS[dayEl] === other) return 'cost';
  throw new Error(`unreachable: ${dayEl} vs ${other}`);
}

/** 月令权重(得令/失令基准分) */
const MONTH_WEIGHT: Record<DayRelation, number> = {
  self:  1.5,  // 当令(帝旺/临官)
  gen:   1.0,  // 令生我(相)
  leak: -0.8,  // 我生令(休,泄气)
  cost: -1.0,  // 我克令(死)
  ctrl: -1.5,  // 令克我(囚,失令重)
};

/** 地支藏干权重 */
const BRANCH_HIDDEN_WEIGHT: Record<DayRelation, number> = {
  self:  1.5,
  gen:   1.0,
  leak: -0.2,
  cost: -0.3,
  ctrl: -0.4,
};

/** 天干生扶/克泄权重 */
const STEM_WEIGHT: Record<DayRelation, number> = {
  self:  1.2,
  gen:   0.9,
  leak: -0.3,
  cost: -0.4,
  ctrl: -0.6,
};

export function analyzeWuXing(fourPillars: FourPillars): WuXingAnalysis {
  const counts: Record<WuXing, number> = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
  const scores: Record<WuXing, number> = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };

  for (const pos of POSITIONS) {
    const p = fourPillars[pos];
    counts[p.stemElement] += 1;
    counts[p.branchElement] += 1;

    const monthWeight = pos === 'month' ? 2 : 1;
    scores[p.stemElement] += 1.0 * monthWeight;
    for (const h of p.hiddenStems) {
      scores[h.element] += h.ratio * monthWeight;
    }
  }

  const dayEl = fourPillars.day.stemElement;
  const monthBranch = fourPillars.month.branch;
  const monthMainEl = STEM_ELEMENT[BRANCH_HIDDEN_STEMS[monthBranch][0]!.stem];

  let strength = MONTH_WEIGHT[dayRel(dayEl, monthMainEl)];

  // 通根:地支藏干(月令 ×1.5)
  for (const pos of POSITIONS) {
    const weight = pos === 'month' ? 1.5 : 1.0;
    const hidden = BRANCH_HIDDEN_STEMS[fourPillars[pos].branch];
    for (const h of hidden) {
      const hEl = STEM_ELEMENT[h.stem];
      strength += BRANCH_HIDDEN_WEIGHT[dayRel(dayEl, hEl)] * h.ratio * weight;
    }
  }

  // 天干生扶/克泄(日干本身不计)
  for (const pos of ['year', 'month', 'hour'] as const) {
    const stemEl = fourPillars[pos].stemElement;
    strength += STEM_WEIGHT[dayRel(dayEl, stemEl)];
  }

  // 阈值:strong >= 2.0, weak <= 1.2,其间 neutral
  // (scoring 分布偏正,"弱命"实际普遍;阈值按 10-fixture 拟合)
  let dayMasterStrength: 'strong' | 'weak' | 'neutral';
  if (strength >= 2.0) dayMasterStrength = 'strong';
  else if (strength <= 1.2) dayMasterStrength = 'weak';
  else dayMasterStrength = 'neutral';

  const favorable: WuXing[] = [];
  const unfavorable: WuXing[] = [];
  if (dayMasterStrength === 'weak') {
    favorable.push(dayEl, GENERATES_INV[dayEl]);
    unfavorable.push(CONTROLS[dayEl], GENERATES[dayEl], controlledBy(dayEl));
  } else if (dayMasterStrength === 'strong') {
    favorable.push(CONTROLS[dayEl], GENERATES[dayEl], controlledBy(dayEl));
    unfavorable.push(dayEl, GENERATES_INV[dayEl]);
  }

  return { counts, scores, dayMasterStrength, favorableElements: favorable, unfavorableElements: unfavorable };
}

/**
 * 日主通根深度评分(供格局从格判断):
 *   只算 地支藏干的比劫+印星 + 天干印星(不含 天干比劫)
 *   阈值参考:< 0.8 视为"通根极浅",适合判"从弱格"
 */
export function dayMasterRootScore(fourPillars: FourPillars): number {
  const dayEl = fourPillars.day.stemElement;
  let root = 0;
  for (const pos of POSITIONS) {
    const w = pos === 'month' ? 1.5 : 1.0;
    const hidden = BRANCH_HIDDEN_STEMS[fourPillars[pos].branch];
    for (const h of hidden) {
      const hEl = STEM_ELEMENT[h.stem];
      if (hEl === dayEl) root += h.ratio * w * 1.5;
      else if (GENERATES[hEl] === dayEl) root += h.ratio * w * 0.8;
    }
  }
  for (const pos of ['year', 'month', 'hour'] as const) {
    const el = fourPillars[pos].stemElement;
    if (GENERATES[el] === dayEl) root += 0.8;
  }
  return root;
}
