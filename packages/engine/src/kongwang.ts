import type { KongWang, TianGan, DiZhi } from './types';
import { stemIndex, branchIndex, branchByIndex } from './utils';

/**
 * 某个干支所在"旬"的旬空(空亡)两支。
 * 六十甲子分六旬,每旬十日,每旬末两支不见天干,为空亡。
 *   甲子旬(甲子~癸酉):空 戌亥
 *   甲戌旬(甲戌~癸未):空 申酉
 *   甲申旬(甲申~癸巳):空 午未
 *   甲午旬(甲午~癸卯):空 辰巳
 *   甲辰旬(甲辰~癸丑):空 寅卯
 *   甲寅旬(甲寅~癸亥):空 子丑
 */
export function xunKong(stem: TianGan, branch: DiZhi): [DiZhi, DiZhi] {
  const sIdx = stemIndex(stem);
  const bIdx = branchIndex(branch);
  // 从该干支回推旬首的地支索引
  // 甲X 旬首时 stemIdx=0, 所以 xunHeadBranchIdx = (bIdx - sIdx + 12) % 12
  const xunHeadBranchIdx = ((bIdx - sIdx) % 12 + 12) % 12;
  // 该旬末 branchIdx = xunHeadBranchIdx + 9,超出的两支为空亡
  // 更直接:空亡两支 = (xunHeadBranchIdx + 10) % 12 和 (xunHeadBranchIdx + 11) % 12
  const k1 = (xunHeadBranchIdx + 10) % 12;
  const k2 = (xunHeadBranchIdx + 11) % 12;
  return [branchByIndex(k1), branchByIndex(k2)];
}

export function calculateKongWang(
  dayStem: TianGan, dayBranch: DiZhi,
  yearStem: TianGan, yearBranch: DiZhi,
): KongWang {
  return {
    dayKong: xunKong(dayStem, dayBranch),
    yearKong: xunKong(yearStem, yearBranch),
  };
}

export function isBranchKong(branch: DiZhi, kw: KongWang): boolean {
  return kw.dayKong.includes(branch) || kw.yearKong.includes(branch);
}
