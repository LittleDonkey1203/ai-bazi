import type {
  FourPillars, WuXingAnalysis, ShiShen, TianGan, DiZhi,
} from './types';
import { BRANCH_HIDDEN_STEMS, STEM_ELEMENT, computeTenGod } from './utils';
import { dayMasterRootScore } from './wuxing';

/**
 * 十干禄位(临官位):
 *   甲寅 乙卯 丙巳 丁午 戊巳 己午
 *   庚申 辛酉 壬亥 癸子
 */
const LU_POSITION: Record<TianGan, DiZhi> = {
  '甲': '寅', '乙': '卯',
  '丙': '巳', '丁': '午',
  '戊': '巳', '己': '午',
  '庚': '申', '辛': '酉',
  '壬': '亥', '癸': '子',
};

/** 羊刃:只阳干立格(帝旺位) */
const YANG_REN: Partial<Record<TianGan, DiZhi>> = {
  '甲': '卯', '丙': '午', '戊': '午', '庚': '酉', '壬': '子',
};

const ZAQI_BRANCHES: DiZhi[] = ['辰', '戌', '丑', '未'];

/**
 * 格局判断(Phase 1 完整版):
 *
 *   1. 从弱格:日主弱 + 通根极浅(rootScore < 0.8)
 *   2. 从强格:日主强 + 通根极深(> 4)+ 无明显官杀食伤制约
 *   3. 羊刃格:月支 = 日主羊刃位(阳干)
 *   4. 建禄格:月支 = 日主禄位
 *   5. 杂气格(辰戌丑未月):
 *      中气 or 余气同五行天干透出 → 杂气{该气十神}格
 *      全不透 → 杂气{本气十神}格
 *   6. 非杂气月:以月令本气定格(不论透干与否,取本气对日主的十神)
 *
 *   TODO (Phase 2+):
 *     - 化气格(甲己合化土、乙庚合化金等)
 *     - 从强格细分(从旺/专旺/一行得气)
 *     - 从弱格细分(从财/从官/从杀/从儿)
 */
export function detectPattern(
  fourPillars: FourPillars,
  wuxing: WuXingAnalysis,
): string {
  const dayStem = fourPillars.day.stem;
  const monthBranch = fourPillars.month.branch;
  const hiddenInMonth = BRANCH_HIDDEN_STEMS[monthBranch];
  const mainHidden = hiddenInMonth[0];
  if (!mainHidden) return '未知格';

  const rootScore = dayMasterRootScore(fourPillars);

  // ── 1. 从弱格 ──────────────────────────────────────────────
  if (wuxing.dayMasterStrength === 'weak' && rootScore < 0.8) {
    return '从弱格';
  }

  // ── 2. 从强格 ──────────────────────────────────────────────
  if (wuxing.dayMasterStrength === 'strong' && rootScore > 5 && countOpposing(fourPillars) <= 1) {
    return '从强格';
  }

  // ── 3. 羊刃格(阳干) ─────────────────────────────────────
  if (YANG_REN[dayStem] === monthBranch) return '羊刃格';

  // ── 4. 建禄格 ──────────────────────────────────────────────
  if (LU_POSITION[dayStem] === monthBranch) return '建禄格';

  // ── 5. 杂气(辰戌丑未) ────────────────────────────────────
  if (ZAQI_BRANCHES.includes(monthBranch)) {
    const otherStems = [
      fourPillars.year.stem,
      fourPillars.month.stem,
      fourPillars.hour.stem,
    ];
    // 中气/余气:同五行透出即视作"透干";取透出的天干算十神(阴阳以实际天干为准)
    for (let i = 1; i < hiddenInMonth.length; i++) {
      const entry = hiddenInMonth[i]!;
      const el = STEM_ELEMENT[entry.stem];
      const matchingStem = otherStems.find((s) => STEM_ELEMENT[s] === el);
      if (matchingStem) {
        return `杂气${tenGodToPattern(computeTenGod(dayStem, matchingStem))}`;
      }
    }
    // 都不透,以本气定
    return `杂气${tenGodToPattern(computeTenGod(dayStem, mainHidden.stem))}`;
  }

  // ── 6. 非杂气月:以月令本气定格 ───────────────────────────
  return tenGodToPattern(computeTenGod(dayStem, mainHidden.stem));
}

function tenGodToPattern(tg: ShiShen): string {
  const map: Record<ShiShen, string> = {
    '比肩': '建禄格',
    '劫财': '羊刃格',
    '食神': '食神格',
    '伤官': '伤官格',
    '偏财': '偏财格',
    '正财': '正财格',
    '七杀': '七杀格',
    '正官': '正官格',
    '偏印': '偏印格',
    '正印': '正印格',
  };
  return map[tg];
}

function countOpposing(fourPillars: FourPillars): number {
  const dayEl = fourPillars.day.stemElement;
  let count = 0;
  for (const pos of ['year', 'month', 'hour'] as const) {
    const stemEl = fourPillars[pos].stemElement;
    if (stemEl !== dayEl && !isGen(stemEl, dayEl)) count += 1;
  }
  for (const pos of ['year', 'month', 'day', 'hour'] as const) {
    const branchEl = fourPillars[pos].branchElement;
    if (branchEl !== dayEl && !isGen(branchEl, dayEl)) count += 0.5;
  }
  return count;
}

function isGen(a: string, b: string): boolean {
  const gen: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  return gen[a] === b;
}
