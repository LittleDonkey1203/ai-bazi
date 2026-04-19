import { Solar } from 'lunar-javascript';
import type { BaziInput, BaziChart } from './types';
import { BaziCalculationError } from './types';
import { buildFourPillars } from './fourPillars';
import { annotateTenGods } from './tenGods';
import { buildDaYun } from './dayun';
import { buildLiuNian } from './liunian';
import { calculateKongWang } from './kongwang';
import { calculateShenSha } from './shensha';
import { analyzeWuXing } from './wuxing';
import { detectRelations } from './relations';
import { detectPattern } from './pattern';
import { calculateMingGong } from './mingGong';
import { calculateTaiYuan } from './taiYuan';
import { calculateChengGu } from './chengGu';

/**
 * 核心排盘函数。纯函数,无副作用。同输入必同输出,可安全缓存。
 * cacheKey = JSON.stringify(input)
 */
export function calculateBazi(input: BaziInput): BaziChart {
  validateInput(input);

  const { year, month, day, hour, minute = 0 } = input;
  let solar, lunar, eightChar;
  try {
    solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    lunar = solar.getLunar();
    eightChar = lunar.getEightChar();
  } catch (err) {
    throw new BaziCalculationError('Failed to compute solar/lunar/eightChar', err);
  }

  const fourPillars = buildFourPillars(eightChar, hour);
  annotateTenGods(fourPillars);

  const kongwang = calculateKongWang(
    fourPillars.day.stem, fourPillars.day.branch,
    fourPillars.year.stem, fourPillars.year.branch,
  );

  const shensha = calculateShenSha(fourPillars, kongwang);
  const wuxing = analyzeWuXing(fourPillars);
  const relations = detectRelations(fourPillars);
  const pattern = detectPattern(fourPillars, wuxing);

  const dayun = buildDaYun(eightChar, input.gender, fourPillars.day.stem);
  const liunian = buildLiuNian(
    year,
    fourPillars.year.stem,
    fourPillars.year.branch,
    fourPillars.day.stem,
  );

  const mingGong = calculateMingGong(fourPillars, fourPillars.year.stem);
  const taiYuan = calculateTaiYuan(fourPillars);
  const chengGu = calculateChengGu(
    fourPillars.year.stem, fourPillars.year.branch,
    lunar.getMonth(), lunar.getDay(),
    fourPillars.hour.branch,
  );

  return {
    input,
    fourPillars,
    wuxing,
    relations,
    dayun,
    liunian,
    shensha,
    kongwang,
    mingGong,
    taiYuan,
    pattern,
    chengGu,
  };
}

function validateInput(input: BaziInput): void {
  const { year, month, day, hour, minute = 0 } = input;
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new BaziCalculationError(`year out of supported range [1900, 2100]: ${year}`);
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new BaziCalculationError(`month invalid: ${month}`);
  }
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new BaziCalculationError(`day invalid: ${day}`);
  }
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new BaziCalculationError(`hour invalid: ${hour}`);
  }
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new BaziCalculationError(`minute invalid: ${minute}`);
  }
  if (input.gender !== 'male' && input.gender !== 'female') {
    throw new BaziCalculationError(`gender invalid: ${input.gender}`);
  }
}
