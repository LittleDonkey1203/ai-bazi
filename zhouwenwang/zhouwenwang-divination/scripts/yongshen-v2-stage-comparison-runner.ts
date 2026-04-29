import {
  HeavenlyStemCombiner,
  PatternClassifier,
  YongShenEngineV2Step1,
  YongShenEngineV2Step2,
  YongShenEngineV2Step3,
  YongShenEngineV2Step4,
  YongShenEngineV2Step5,
  YongShenMapper,
  type BaziInput,
  type FiveElement,
  type PatternClassificationResult,
  type YongShenMappingResult,
} from '../src/games/bazi/yongshen-v2/index';

type StageSnapshot = {
  stage: 'step1to3' | 'step1to5' | 'step1to6' | 'step1to7' | 'step1to8';
  totalScore: number;
  scores: Record<FiveElement, number>;
  patternType: string;
  tongDangPercent: number;
  maxSelfPercent: number;
  maxOpposingPercent: number;
  yongElements: FiveElement[];
  jiElements: FiveElement[];
};

const TEST_CASES: Array<{ name: string; input: BaziInput }> = [
  { name: 'case-1', input: ['戊', '寅', '乙', '卯', '乙', '亥', '壬', '午'] },
  { name: 'case-2', input: ['丁', '丑', '庚', '戌', '壬', '子', '甲', '辰'] },
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

function buildSnapshot(
  stage: StageSnapshot['stage'],
  totalScore: number,
  scores: Record<FiveElement, number>,
  patternClassification: PatternClassificationResult,
  mapping: YongShenMappingResult,
): StageSnapshot {
  return {
    stage,
    totalScore: Number(totalScore.toFixed(4)),
    scores: normalizeScores(scores),
    patternType: mapping.patternType,
    tongDangPercent: patternClassification.tongDangPercent,
    maxSelfPercent: patternClassification.maxSelfPercent,
    maxOpposingPercent: patternClassification.maxOpposingPercent,
    yongElements: [...mapping.yongElements],
    jiElements: [...mapping.jiElements],
  };
}

function main() {
  const step1Engine = new YongShenEngineV2Step1();
  const step2Engine = new YongShenEngineV2Step2();
  const step3Engine = new YongShenEngineV2Step3();
  const step4Engine = new YongShenEngineV2Step4();
  const step5Engine = new YongShenEngineV2Step5();
  const stemCombiner = new HeavenlyStemCombiner();
  const patternClassifier = new PatternClassifier();
  const yongShenMapper = new YongShenMapper();

  TEST_CASES.forEach((testCase) => {
    const step1 = step1Engine.analyzeStep1To3(testCase.input);
    const step1Pattern = patternClassifier.classifyPattern(
      step1.baseScore,
      stemCombiner.applyStemCombinations(step1.baseScore, step1.finalScores),
      step1.finalScores,
      step1.totalScore,
    );
    const step1Mapping = yongShenMapper.mapYongShen(step1.baseScore, step1Pattern);

    const step2 = step2Engine.analyzeStep1To5(testCase.input);
    const step2Pattern = patternClassifier.classifyPattern(
      step2.baseScore,
      step2.stemCombinations,
      step2.finalScores,
      step2.totalScore,
    );
    const step2Mapping = yongShenMapper.mapYongShen(step2.baseScore, step2Pattern);

    const step3 = step3Engine.analyzeStep1To6(testCase.input);
    const step3Pattern = patternClassifier.classifyPattern(
      step3.baseScore,
      step3.stemCombinations,
      step3.finalScores,
      step3.totalScore,
    );
    const step3Mapping = yongShenMapper.mapYongShen(step3.baseScore, step3Pattern);

    const step4 = step4Engine.analyzeStep1To7(testCase.input);
    const step4Mapping = yongShenMapper.mapYongShen(step4.baseScore, step4.patternClassification);

    const step5 = step5Engine.analyzeStep1To8(testCase.input);

    const snapshots: StageSnapshot[] = [
      buildSnapshot('step1to3', step1.totalScore, step1.finalScores, step1Pattern, step1Mapping),
      buildSnapshot('step1to5', step2.totalScore, step2.finalScores, step2Pattern, step2Mapping),
      buildSnapshot('step1to6', step3.totalScore, step3.finalScores, step3Pattern, step3Mapping),
      buildSnapshot('step1to7', step4.totalScore, step4.finalScores, step4.patternClassification, step4Mapping),
      buildSnapshot('step1to8', step5.totalScore, step5.finalScores, step5.patternClassification, step5.yongShenMapping),
    ];

    console.log(`\n[STAGE-COMPARISON] ${testCase.name}`);
    console.log(JSON.stringify({
      input: testCase.input,
      stages: snapshots,
    }, null, 2));
  });
}

main();
