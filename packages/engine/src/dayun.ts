import type { DaYun, Gender, TianGan, DiZhi } from './types';
import { computeTenGod } from './utils';

interface LunarYun {
  getStartYear(): number;
  getStartAge(): number;
  getDaYun(): LunarDaYunItem[];
}
interface LunarDaYunItem {
  getStartAge(): number;
  getStartYear(): number;
  getGanZhi(): string;
}

interface LunarEightCharWithYun {
  getYun(gender: number, sect?: number): LunarYun;
}

/**
 * 大运计算:调用 lunar-javascript 的 getYun(genderNum)。
 *   gender: male → 1, female → 0(注意是数字,非字符串)
 * 返回前 N 步大运(默认取前 9 步)。
 */
export function buildDaYun(
  eightChar: LunarEightCharWithYun,
  gender: Gender,
  dayStem: TianGan,
  steps = 9,
): DaYun[] {
  const yun = eightChar.getYun(gender === 'male' ? 1 : 0);
  const raw = yun.getDaYun();
  const result: DaYun[] = [];

  // 第一项通常为起运前的岁运(童限),正式大运从 index 1 开始
  // lunar-javascript: raw[0] 是出生到起运前的小运,raw[1] 起是第一步大运
  // 但不同版本行为不一致,这里过滤掉 startAge === 0 的首项
  const filtered = raw.filter((d) => d.getStartAge() > 0 || d.getGanZhi() !== '');

  for (let i = 0; i < Math.min(steps, filtered.length); i++) {
    const item = filtered[i];
    if (!item) break;
    const ganZhi = item.getGanZhi();
    if (!ganZhi || ganZhi.length !== 2) continue;
    const stem = ganZhi[0] as TianGan;
    const branch = ganZhi[1] as DiZhi;
    const startAge = item.getStartAge();
    const startYear = item.getStartYear();
    result.push({
      index: i + 1,
      startAge,
      endAge: startAge + 9,
      startYear,
      stem,
      branch,
      ganZhi,
      tenGod: computeTenGod(dayStem, stem),
    });
  }
  return result;
}
