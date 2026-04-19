import type { FourPillars, Pillar, TianGan, DiZhi } from './types';
import {
  branchIndex, stemByIndex, stemIndex, yinMonthStem,
} from './utils';
import { makePillar } from './fourPillars';

/**
 * 命宫地支数表(起点为寅 = 1):
 *   寅=1, 卯=2, 辰=3, 巳=4, 午=5, 未=6,
 *   申=7, 酉=8, 戌=9, 亥=10, 子=11, 丑=12
 */
const BRANCH_TO_MING_NUM: Record<DiZhi, number> = {
  '寅': 1, '卯': 2, '辰': 3, '巳': 4, '午': 5, '未': 6,
  '申': 7, '酉': 8, '戌': 9, '亥': 10, '子': 11, '丑': 12,
};
const MING_NUM_TO_BRANCH: DiZhi[] = [
  '寅', '卯', '辰', '巳', '午', '未',
  '申', '酉', '戌', '亥', '子', '丑',
];

/**
 * 命宫计算:
 *   1. 命宫地支数 = 26 − (月支数 + 时支数);若结果 > 12 则减 12
 *   2. 月支/时支数用起寅表(寅=1 .. 丑=12),以月柱地支(节气月)为准
 *   3. 命宫天干:以年干五虎遁,把命宫地支当作"建月"求对应天干
 */
export function calculateMingGong(
  fourPillars: FourPillars,
  yearStem: TianGan,
): Pillar {
  const monthNum = BRANCH_TO_MING_NUM[fourPillars.month.branch];
  const hourNum = BRANCH_TO_MING_NUM[fourPillars.hour.branch];

  let mingNum = 26 - (monthNum + hourNum);
  if (mingNum > 12) mingNum -= 12;
  if (mingNum <= 0) mingNum += 12;

  const mingBranch = MING_NUM_TO_BRANCH[mingNum - 1]!;

  // 命宫天干:年上起月表(五虎遁)
  const yinStem = yinMonthStem(yearStem);
  const offsetFromYin = (branchIndex(mingBranch) - branchIndex('寅') + 12) % 12;
  const mingStem = stemByIndex(stemIndex(yinStem) + offsetFromYin);

  return makePillar(mingStem, mingBranch);
}
