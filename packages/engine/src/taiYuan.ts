import type { FourPillars, Pillar, TianGan, DiZhi } from './types';
import { stemIndex, branchIndex, stemByIndex, branchByIndex } from './utils';
import { makePillar } from './fourPillars';

/**
 * 胎元 = 月柱天干进一位,月柱地支进三位
 *   例:月柱庚申 → 胎元辛亥
 */
export function calculateTaiYuan(fourPillars: FourPillars): Pillar {
  const monthStem = fourPillars.month.stem;
  const monthBranch = fourPillars.month.branch;
  const taiStem = stemByIndex(stemIndex(monthStem) + 1);
  const taiBranch = branchByIndex(branchIndex(monthBranch) + 3);
  return makePillar(taiStem as TianGan, taiBranch as DiZhi);
}
