import { YongShenEngineV2Step1, type BaziInput, type FiveElement } from '../src/games/bazi/yongshen-v2/index';

type ExpectedCase = {
  name: string;
  input: BaziInput;
  expectedScores: Record<FiveElement, number>;
  expectedTotal: number;
};

const TEST_CASES: ExpectedCase[] = [
  {
    name: 'case-1',
    input: ['戊', '寅', '乙', '卯', '乙', '亥', '壬', '午'],
    expectedScores: {
      金: 0,
      木: 60.5,
      水: 20.5,
      火: 10,
      土: 9,
    },
    expectedTotal: 100,
  },
  {
    name: 'case-2',
    input: ['丁', '丑', '庚', '戌', '壬', '子', '甲', '辰'],
    expectedScores: {
      金: 23,
      木: 13,
      水: 19,
      火: 9,
      土: 36,
    },
    expectedTotal: 100,
  },
];

function normalizeScores(scores: Record<FiveElement, number>): Record<FiveElement, number> {
  return {
    金: Number(scores.金.toFixed(4)),
    木: Number(scores.木.toFixed(4)),
    水: Number(scores.水.toFixed(4)),
    火: Number(scores.火.toFixed(4)),
    土: Number(scores.土.toFixed(4)),
  };
}

function assertScores(actual: Record<FiveElement, number>, expected: Record<FiveElement, number>, label: string) {
  (Object.keys(expected) as FiveElement[]).forEach((element) => {
    if (actual[element] !== expected[element]) {
      throw new Error(`${label} 分数不匹配: ${element} expected=${expected[element]} actual=${actual[element]}`);
    }
  });
}

function main() {
  const engine = new YongShenEngineV2Step1();

  TEST_CASES.forEach((testCase) => {
    const result = engine.analyzeStep1To3(testCase.input);
    const normalizedBaseScores = normalizeScores(result.baseScore.scores);
    const normalizedFinalScores = normalizeScores(result.finalScores);

    assertScores(normalizedBaseScores, testCase.expectedScores, `${testCase.name} base`);
    assertScores(normalizedFinalScores, testCase.expectedScores, `${testCase.name} final`);

    if (result.totalScore !== testCase.expectedTotal) {
      throw new Error(`${testCase.name} total 不匹配: expected=${testCase.expectedTotal} actual=${result.totalScore}`);
    }

    console.log(`\n[PASS] ${testCase.name}`);
    console.log(JSON.stringify({
      input: testCase.input,
      baseScores: normalizedBaseScores,
      finalScores: normalizedFinalScores,
      totalScore: result.totalScore,
      rooting: result.rooting.checks,
    }, null, 2));
  });
}

main();
