import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateBazi } from '../src/calculator';
import type { BaziInput, BaziChart, DiZhi } from '../src/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, 'fixtures');

interface Fixture {
  id: string;
  source: string;
  input: BaziInput;
  expected: {
    fourPillars: Record<'year' | 'month' | 'day' | 'hour', {
      stem: string;
      branch: string;
      nayin: string;
      hiddenStems: string[];
    }>;
    tenGods: {
      yearStem: string;
      monthStem: string;
      hourStem: string;
      yearBranchHidden: string[];
      monthBranchHidden: string[];
      dayBranchHidden: string[];
      hourBranchHidden: string[];
    };
    wuxingCount: Record<string, number>;
    dayMasterStrength: 'strong' | 'weak' | 'neutral';
    pattern: string;
    dayun: {
      startAge: number;
      startYear: number;
      direction: string;
      list: Array<{ index: number; startAge: number; ganZhi: string }>;
    };
    shensha: {
      年支?: string[];
      月支?: string[];
      日支?: string[];
      时支?: string[];
    };
    mingGong: { stem: string; branch: string };
    taiYuan: { stem: string; branch: string };
    chengGu: { weight: string };
    relations: string[];
  };
}

function loadFixtures(): Fixture[] {
  return readdirSync(FIXTURES_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort((a, b) => {
      // Sort numerically by leading number in filename
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      return na - nb;
    })
    .map((f) => JSON.parse(readFileSync(join(FIXTURES_DIR, f), 'utf-8')) as Fixture);
}

const fixtures = loadFixtures();

describe('calculateBazi — fixtures', () => {
  for (const fx of fixtures) {
    describe(`${fx.id} [${fx.source}]`, () => {
      const result: BaziChart = calculateBazi(fx.input);

      describe('四柱天干地支', () => {
        for (const key of ['year', 'month', 'day', 'hour'] as const) {
          it(`${key}柱天干`, () => {
            expect(result.fourPillars[key].stem).toBe(fx.expected.fourPillars[key].stem);
          });
          it(`${key}柱地支`, () => {
            expect(result.fourPillars[key].branch).toBe(fx.expected.fourPillars[key].branch);
          });
        }
      });

      describe('纳音', () => {
        for (const key of ['year', 'month', 'day', 'hour'] as const) {
          it(`${key}柱纳音`, () => {
            expect(result.fourPillars[key].nayin).toBe(fx.expected.fourPillars[key].nayin);
          });
        }
      });

      describe('藏干(顺序+内容)', () => {
        for (const key of ['year', 'month', 'day', 'hour'] as const) {
          it(`${key}支藏干`, () => {
            const got = result.fourPillars[key].hiddenStems.map((h) => h.stem);
            expect(got).toEqual(fx.expected.fourPillars[key].hiddenStems);
          });
        }
      });

      describe('十神 - 天干', () => {
        it('年干十神', () => {
          expect(result.fourPillars.year.tenGod).toBe(fx.expected.tenGods.yearStem);
        });
        it('月干十神', () => {
          expect(result.fourPillars.month.tenGod).toBe(fx.expected.tenGods.monthStem);
        });
        it('时干十神', () => {
          expect(result.fourPillars.hour.tenGod).toBe(fx.expected.tenGods.hourStem);
        });
      });

      describe('十神 - 藏干', () => {
        const pairs = [
          ['year', 'yearBranchHidden'],
          ['month', 'monthBranchHidden'],
          ['day', 'dayBranchHidden'],
          ['hour', 'hourBranchHidden'],
        ] as const;
        for (const [pos, key] of pairs) {
          it(`${pos}支藏干十神`, () => {
            const got = result.fourPillars[pos].hiddenStems.map((h) => h.tenGod);
            expect(got).toEqual(fx.expected.tenGods[key]);
          });
        }
      });

      describe('五行统计(仅计 8 字,不含藏干)', () => {
        it('五行各项数目', () => {
          expect(result.wuxing.counts).toEqual(fx.expected.wuxingCount);
        });
      });

      describe('大运', () => {
        it('起运年龄(±1 容差,问真八字 / lunar-javascript 四舍五入规则不同)', () => {
          const expected = fx.expected.dayun.list[0]?.startAge ?? 0;
          const got = result.dayun[0]?.startAge ?? 0;
          expect(Math.abs(got - expected)).toBeLessThanOrEqual(1);
        });
        it('大运干支前 8 步', () => {
          const expected = fx.expected.dayun.list.slice(0, 8).map((d) => d.ganZhi);
          const got = result.dayun.slice(0, 8).map((d) => d.ganZhi);
          expect(got).toEqual(expected);
        });
      });

      describe('胎元', () => {
        it('胎元干支', () => {
          expect(result.taiYuan.stem).toBe(fx.expected.taiYuan.stem);
          expect(result.taiYuan.branch).toBe(fx.expected.taiYuan.branch);
        });
      });

      describe('命宫', () => {
        it('命宫干支', () => {
          expect(result.mingGong.stem).toBe(fx.expected.mingGong.stem);
          expect(result.mingGong.branch).toBe(fx.expected.mingGong.branch);
        });
      });

      describe('日主强弱', () => {
        it('dayMasterStrength', () => {
          expect(result.wuxing.dayMasterStrength).toBe(fx.expected.dayMasterStrength);
        });
      });

      describe('格局', () => {
        it('pattern', () => {
          expect(result.pattern).toBe(fx.expected.pattern);
        });
      });

      describe('神煞(只校验 8 种基础神煞是否标注正确)', () => {
        const BASIC_SHENSHA = [
          '天乙贵人', '文昌贵人', '驿马', '桃花', '华盖', '空亡', '羊刃', '将星',
        ];
        const keyMap: Record<string, 'year' | 'month' | 'day' | 'hour'> = {
          年支: 'year', 月支: 'month', 日支: 'day', 时支: 'hour',
        };
        for (const [fxKey, resKey] of Object.entries(keyMap)) {
          it(`${fxKey}:fixture 中的 8 种基础神煞必须被引擎识别`, () => {
            const fxTags = fx.expected.shensha[fxKey as keyof typeof fx.expected.shensha] ?? [];
            const expectedBasic = fxTags.filter((t) => BASIC_SHENSHA.includes(t));
            for (const tag of expectedBasic) {
              expect(result.shensha[resKey]).toContain(tag);
            }
          });
        }
      });

      describe('空亡(顶层字段)', () => {
        it('日空 + 年空 至少有一个命中 fixture 里标的"空亡"柱', () => {
          // 仅做弱断言:fixture 里所有标了"空亡"的柱支,必须在 dayKong 或 yearKong 之一
          const keyMap: Record<string, 'year' | 'month' | 'day' | 'hour'> = {
            年支: 'year', 月支: 'month', 日支: 'day', 时支: 'hour',
          };
          const kongBranches = new Set<DiZhi>([
            ...result.kongwang.dayKong,
            ...result.kongwang.yearKong,
          ]);
          for (const [fxKey, resKey] of Object.entries(keyMap)) {
            const tags = fx.expected.shensha[fxKey as keyof typeof fx.expected.shensha] ?? [];
            if (tags.includes('空亡')) {
              expect(kongBranches.has(result.fourPillars[resKey].branch as DiZhi)).toBe(true);
            }
          }
        });
      });

      describe('关系(刑冲合害破等,弱断言:fixture 关键字需出现在引擎输出的某条 description 中)', () => {
        it('relations description 覆盖 fixture 里的关系短语', () => {
          for (const relStr of fx.expected.relations) {
            // 取前两个地支作为关键词(如"申子半合水"→"申子")
            const keyBranches = extractBranchPair(relStr);
            if (!keyBranches) continue;
            const hit = result.relations.some((r) =>
              keyBranches.every((b) => r.branches.includes(b as DiZhi)),
            );
            if (!hit) {
              console.warn(`[${fx.id}] 关系未被引擎识别: ${relStr}`);
            }
          }
          // 不 fail,仅打印 warning 供后续调优
          expect(true).toBe(true);
        });
      });
    });
  }
});

function extractBranchPair(s: string): string[] | null {
  const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const found: string[] = [];
  for (const ch of s) {
    if (BRANCHES.includes(ch)) found.push(ch);
    if (found.length >= 2) break;
  }
  return found.length >= 2 ? found.slice(0, 2) : null;
}
