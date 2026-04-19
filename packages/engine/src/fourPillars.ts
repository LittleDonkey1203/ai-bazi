import type {
  BaziInput, FourPillars, Pillar, TianGan, DiZhi, HiddenStemEntry,
} from './types';
import {
  STEM_ELEMENT, BRANCH_ELEMENT, BRANCH_HIDDEN_STEMS,
  NAYIN_TABLE, ganZhiString,
  stemIndex, computeHourStem, hourToBranch, stemByIndex,
} from './utils';

interface LunarEightChar {
  getYearGan(): string;
  getYearZhi(): string;
  getMonthGan(): string;
  getMonthZhi(): string;
  getDayGan(): string;
  getDayZhi(): string;
  getTimeGan(): string;
  getTimeZhi(): string;
}

/**
 * 从 lunar-javascript EightChar 提取四柱结构化数据。
 *
 * 时柱特殊处理:23:00-23:59 属晚子时,问真八字等现代软件约定:
 *   日柱仍用当日日干(lunar 默认行为一致)
 *   但时柱按"次日日干"起五鼠遁 → 得甲子(若次日己日)等
 *
 * 故引擎不直接采用 lunar 的 getTimeGan(),而是自行按以下规则计算:
 *   hour in [0, 22]       → 用当日日干 + hourBranch 经五鼠遁得时干
 *   hour === 23           → 用"次日日干"(当日日干 +1 in 10 循环) + 子 得时干
 */
export function buildFourPillars(
  eightChar: LunarEightChar,
  hour: number,
): FourPillars {
  const yearStem = eightChar.getYearGan() as TianGan;
  const yearBranch = eightChar.getYearZhi() as DiZhi;
  const monthStem = eightChar.getMonthGan() as TianGan;
  const monthBranch = eightChar.getMonthZhi() as DiZhi;
  const dayStem = eightChar.getDayGan() as TianGan;
  const dayBranch = eightChar.getDayZhi() as DiZhi;

  const hourBranch = hourToBranch(hour);
  const effectiveDayStemForHour: TianGan = hour === 23
    ? stemByIndex(stemIndex(dayStem) + 1)
    : dayStem;
  const hourStem = computeHourStem(effectiveDayStemForHour, hourBranch);

  return {
    year:  makePillar(yearStem, yearBranch),
    month: makePillar(monthStem, monthBranch),
    day:   makePillar(dayStem, dayBranch),
    hour:  makePillar(hourStem, hourBranch),
  };
}

export function makePillar(stem: TianGan, branch: DiZhi): Pillar {
  return {
    stem,
    branch,
    stemElement: STEM_ELEMENT[stem],
    branchElement: BRANCH_ELEMENT[branch],
    nayin: NAYIN_TABLE[ganZhiString(stem, branch)] ?? '',
    hiddenStems: buildHiddenStems(branch),
  };
}

function buildHiddenStems(branch: DiZhi): HiddenStemEntry[] {
  return BRANCH_HIDDEN_STEMS[branch].map(({ stem, ratio }) => ({
    stem,
    element: STEM_ELEMENT[stem],
    ratio,
  }));
}
