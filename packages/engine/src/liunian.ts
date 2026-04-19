import type { LiuNian, DaYun, TianGan, DiZhi } from './types';
import { computeTenGod, ganZhiByIndex, stemIndex, branchIndex } from './utils';

/**
 * 流年:从出生年起,逐年推算干支与十神。
 *   生年为 1 岁(虚岁),虚岁 N 对应公历年 = birthYear + N - 1
 *   flatten 出 80 年流年,供前端时间轴展示;测试只校验前若干年。
 */
export function buildLiuNian(
  birthYear: number,
  birthYearStem: TianGan,
  birthYearBranch: DiZhi,
  dayStem: TianGan,
  years = 100,
): LiuNian[] {
  const startIdx = stemIndex(birthYearStem) + 10 *
    Math.floor(((branchIndex(birthYearBranch) - stemIndex(birthYearStem) + 12) % 12) / 2);
  // 上式用于校验,真正 index 用增量法
  void startIdx;

  const result: LiuNian[] = [];
  // 计算出生年的 60 甲子索引
  const birthIndex = findGanZhiIndex(birthYearStem, birthYearBranch);
  for (let i = 0; i < years; i++) {
    const { stem, branch } = ganZhiByIndex(birthIndex + i);
    result.push({
      year: birthYear + i,
      age: i + 1,
      stem,
      branch,
      ganZhi: `${stem}${branch}`,
      tenGod: computeTenGod(dayStem, stem),
    });
  }
  return result;
}

export function attachLiuNianToDaYun(
  dayun: DaYun[],
  liunian: LiuNian[],
): Record<number, LiuNian[]> {
  const map: Record<number, LiuNian[]> = {};
  for (const yun of dayun) {
    map[yun.index] = liunian.filter(
      (ln) => ln.age >= yun.startAge && ln.age < yun.startAge + 10,
    );
  }
  return map;
}

function findGanZhiIndex(stem: TianGan, branch: DiZhi): number {
  const s = stemIndex(stem);
  const b = branchIndex(branch);
  for (let i = 0; i < 60; i++) {
    if (i % 10 === s && i % 12 === b) return i;
  }
  throw new Error(`Ganzhi index not found: ${stem}${branch}`);
}
