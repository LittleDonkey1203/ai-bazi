import type {
  FourPillars, ShenShaTable, PillarPosition, TianGan, DiZhi, KongWang,
} from './types';
import { isBranchKong } from './kongwang';

/**
 * 命盘神煞。Phase 1 仅实现 CLAUDE.md 规定的 8 种基础神煞:
 *   天乙贵人、文昌贵人、驿马、桃花、华盖、空亡、羊刃、将星
 *
 * TODO (Phase 2+): 补充问真八字等软件支持的 40+ 种神煞:
 *   福星贵人、太极贵人、国印贵人、德秀贵人、天厨贵人、天德贵人、
 *   月德贵人、天德合、月德合、天医、禄神、学堂、词馆、飞刃、劫煞、
 *   亡神、元辰、红鸾、红艳煞、血刃、魁罡日、孤鸾煞、童子煞、
 *   孤辰、寡宿、丧门、吊客、天罗地网、阴差阳错、十恶大败、
 *   十灵日、九丑日、八专日、六秀日、披麻、勾绞煞、流霞、金舆。
 */

const PILLARS: readonly PillarPosition[] = ['year', 'month', 'day', 'hour'] as const;

/** 天乙贵人:以日干查各柱地支 */
const TIAN_YI: Record<TianGan, DiZhi[]> = {
  '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '丁': ['亥', '酉'],
  '壬': ['巳', '卯'], '癸': ['巳', '卯'],
  '辛': ['午', '寅'],
};

/** 文昌贵人:以日干查地支 */
const WEN_CHANG: Record<TianGan, DiZhi> = {
  '甲': '巳', '乙': '午',
  '丙': '申', '丁': '酉',
  '戊': '申', '己': '酉',
  '庚': '亥', '辛': '子',
  '壬': '寅', '癸': '卯',
};

/** 驿马:以年支或日支的三合局,查对应冲位为马 */
const YI_MA: Record<DiZhi, DiZhi> = {
  '寅': '申', '午': '申', '戌': '申',
  '巳': '亥', '酉': '亥', '丑': '亥',
  '申': '寅', '子': '寅', '辰': '寅',
  '亥': '巳', '卯': '巳', '未': '巳',
};

/** 桃花:以年支或日支的三合局,查沐浴之地为桃花 */
const TAO_HUA: Record<DiZhi, DiZhi> = {
  '寅': '卯', '午': '卯', '戌': '卯',
  '巳': '午', '酉': '午', '丑': '午',
  '申': '酉', '子': '酉', '辰': '酉',
  '亥': '子', '卯': '子', '未': '子',
};

/** 华盖:以年支或日支的三合局墓库为华盖 */
const HUA_GAI: Record<DiZhi, DiZhi> = {
  '寅': '戌', '午': '戌', '戌': '戌',
  '巳': '丑', '酉': '丑', '丑': '丑',
  '申': '辰', '子': '辰', '辰': '辰',
  '亥': '未', '卯': '未', '未': '未',
};

/**
 * 羊刃:阳干刃在帝旺(禄前一位),阴干刃在临官(即禄位)
 *   甲→卯, 乙→寅, 丙→午, 丁→巳, 戊→午, 己→巳
 *   庚→酉, 辛→申, 壬→子, 癸→亥
 */
const YANG_REN: Record<TianGan, DiZhi> = {
  '甲': '卯', '乙': '寅',
  '丙': '午', '丁': '巳',
  '戊': '午', '己': '巳',
  '庚': '酉', '辛': '申',
  '壬': '子', '癸': '亥',
};

/** 将星:三合局之中支(子午卯酉)为将星 */
const JIANG_XING: Record<DiZhi, DiZhi> = {
  '寅': '午', '午': '午', '戌': '午',
  '巳': '酉', '酉': '酉', '丑': '酉',
  '申': '子', '子': '子', '辰': '子',
  '亥': '卯', '卯': '卯', '未': '卯',
};

export function calculateShenSha(
  fourPillars: FourPillars,
  kongwang: KongWang,
): ShenShaTable {
  const dayStem = fourPillars.day.stem;
  const yearStem = fourPillars.year.stem;
  const yearBranch = fourPillars.year.branch;
  const dayBranch = fourPillars.day.branch;

  const table: ShenShaTable = { year: [], month: [], day: [], hour: [] };

  for (const pos of PILLARS) {
    const p = fourPillars[pos];
    const tags: string[] = [];

    // 天乙贵人(以日干或年干为主,任一命中即标)
    if (TIAN_YI[dayStem].includes(p.branch) || TIAN_YI[yearStem].includes(p.branch)) {
      tags.push('天乙贵人');
    }
    // 文昌贵人(以日干或年干为主)
    if (WEN_CHANG[dayStem] === p.branch || WEN_CHANG[yearStem] === p.branch) {
      tags.push('文昌贵人');
    }
    // 驿马(以年支或日支为主)
    if (p.branch === YI_MA[yearBranch] || p.branch === YI_MA[dayBranch]) {
      tags.push('驿马');
    }
    // 桃花
    if (p.branch === TAO_HUA[yearBranch] || p.branch === TAO_HUA[dayBranch]) {
      tags.push('桃花');
    }
    // 华盖
    if (p.branch === HUA_GAI[yearBranch] || p.branch === HUA_GAI[dayBranch]) {
      tags.push('华盖');
    }
    // 羊刃(以日干,落在哪柱即标哪柱)
    if (YANG_REN[dayStem] === p.branch) tags.push('羊刃');
    // 将星
    if (p.branch === JIANG_XING[yearBranch] || p.branch === JIANG_XING[dayBranch]) {
      tags.push('将星');
    }
    // 空亡(日柱旬空 或 年柱旬空)
    if (isBranchKong(p.branch, kongwang)) tags.push('空亡');

    table[pos] = tags;
  }

  return table;
}
