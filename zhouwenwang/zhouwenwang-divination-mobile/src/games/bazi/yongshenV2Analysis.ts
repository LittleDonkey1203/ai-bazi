import type { BaZiChartData } from './logic';
import {
  HeavenlyStemCombiner,
  PatternClassifier,
  YongShenEngineV2Step1,
  YongShenEngineV2Step2,
  YongShenEngineV2Step3,
  YongShenEngineV2Step4,
  YongShenEngineV2Step5,
  YongShenMapper,
  type BaziInput as YongShenV2Input,
  type FiveElement as YongShenV2Element,
  type PatternClassificationResult as YongShenV2PatternClassificationResult,
  type Step1To8AnalysisResult,
  type YongShenMappingResult as YongShenV2MappingResult,
} from './yongshen-v2/index';

export type YongShenV2StageKey = 'step1to3' | 'step1to5' | 'step1to6' | 'step1to7' | 'step1to8';

export type YongShenStageSnapshot = {
  stageKey: YongShenV2StageKey;
  stageLabel: string;
  totalScore: number;
  scores: Record<YongShenV2Element, number>;
  patternType: string;
  tongDangPercent: number;
  maxSelfElement: YongShenV2Element | null;
  maxSelfPercent: number;
  maxOpposingElement: YongShenV2Element | null;
  maxOpposingPercent: number;
  yongElements: YongShenV2Element[];
  jiElements: YongShenV2Element[];
  changeSummary: string[];
};

export type YongShenStageAnalysisResult = {
  finalResult: Step1To8AnalysisResult;
  finalSnapshot: YongShenStageSnapshot;
  snapshots: YongShenStageSnapshot[];
  changedSnapshots: YongShenStageSnapshot[];
};

const yongShenV2Step1Engine = new YongShenEngineV2Step1();
const yongShenV2Step2Engine = new YongShenEngineV2Step2();
const yongShenV2Step3Engine = new YongShenEngineV2Step3();
const yongShenV2Step4Engine = new YongShenEngineV2Step4();
const yongShenV2Step5Engine = new YongShenEngineV2Step5();
const yongShenV2StemCombiner = new HeavenlyStemCombiner();
const yongShenV2PatternClassifier = new PatternClassifier();
const yongShenV2Mapper = new YongShenMapper();

const stageLabels: Record<YongShenV2StageKey, string> = {
  step1to3: 'Step1To3 基础分配 + 通根',
  step1to5: 'Step1To5 加入地支突变',
  step1to6: 'Step1To6 加入季节乘数',
  step1to7: 'Step1To7 格局分类',
  step1to8: 'Step1To8 喜忌映射',
};

const elementOrder: YongShenV2Element[] = ['金', '木', '水', '火', '土'];

export function formatYongShenV2Scores(scores: Record<YongShenV2Element, number>) {
  return elementOrder
    .map((element) => `${element} ${Number(scores[element].toFixed(4))}`)
    .join(' / ');
}

export function formatYongShenV2Elements(elements: YongShenV2Element[]) {
  return elements.length > 0 ? elements.join('、') : '待定';
}

export function toYongShenV2Input(chartData: BaZiChartData): YongShenV2Input {
  return [
    chartData.rawBaziData.年柱.天干.天干,
    chartData.rawBaziData.年柱.地支.地支,
    chartData.rawBaziData.月柱.天干.天干,
    chartData.rawBaziData.月柱.地支.地支,
    chartData.rawBaziData.日柱.天干.天干,
    chartData.rawBaziData.日柱.地支.地支,
    chartData.rawBaziData.时柱.天干.天干,
    chartData.rawBaziData.时柱.地支.地支,
  ] as YongShenV2Input;
}

function buildStageChangeSummary(
  previousSnapshot: YongShenStageSnapshot | null,
  currentPattern: YongShenV2PatternClassificationResult,
  currentMapping: YongShenV2MappingResult,
): string[] {
  if (!previousSnapshot) {
    return ['作为第一阶段基准盘，用于观察后续规则叠加后的变化。'];
  }

  const summaries: string[] = [];
  if (previousSnapshot.patternType !== currentPattern.patternType) {
    summaries.push(`格局由 ${previousSnapshot.patternType} 变为 ${currentPattern.patternType}`);
  }

  const previousYongText = previousSnapshot.yongElements.join('、');
  const currentYongText = currentMapping.yongElements.join('、');
  if (previousYongText !== currentYongText) {
    summaries.push(`用神由 ${previousYongText || '待定'} 改为 ${currentYongText || '待定'}`);
  }

  const previousJiText = previousSnapshot.jiElements.join('、');
  const currentJiText = currentMapping.jiElements.join('、');
  if (previousJiText !== currentJiText) {
    summaries.push(`忌神由 ${previousJiText || '待定'} 改为 ${currentJiText || '待定'}`);
  }

  if (summaries.length === 0) {
    summaries.push('较上一阶段喜忌未翻转，但力量结构已经发生变化。');
  }

  return summaries;
}

export function buildYongShenStageAnalysis(chartData: BaZiChartData): YongShenStageAnalysisResult {
  const baziInput = toYongShenV2Input(chartData);

  const step1 = yongShenV2Step1Engine.analyzeStep1To3(baziInput);
  const step1Pattern = yongShenV2PatternClassifier.classifyPattern(
    step1.baseScore,
    yongShenV2StemCombiner.applyStemCombinations(step1.baseScore, step1.finalScores),
    step1.finalScores,
    step1.totalScore,
  );
  const step1Mapping = yongShenV2Mapper.mapYongShen(step1.baseScore, step1Pattern);

  const step2 = yongShenV2Step2Engine.analyzeStep1To5(baziInput);
  const step2Pattern = yongShenV2PatternClassifier.classifyPattern(
    step2.baseScore,
    step2.stemCombinations,
    step2.finalScores,
    step2.totalScore,
  );
  const step2Mapping = yongShenV2Mapper.mapYongShen(step2.baseScore, step2Pattern);

  const step3 = yongShenV2Step3Engine.analyzeStep1To6(baziInput);
  const step3Pattern = yongShenV2PatternClassifier.classifyPattern(
    step3.baseScore,
    step3.stemCombinations,
    step3.finalScores,
    step3.totalScore,
  );
  const step3Mapping = yongShenV2Mapper.mapYongShen(step3.baseScore, step3Pattern);

  const step4 = yongShenV2Step4Engine.analyzeStep1To7(baziInput);
  const step4Mapping = yongShenV2Mapper.mapYongShen(step4.baseScore, step4.patternClassification);

  const step5 = yongShenV2Step5Engine.analyzeStep1To8(baziInput);

  const rawSnapshots = [
    {
      stageKey: 'step1to3' as const,
      totalScore: step1.totalScore,
      scores: step1.finalScores,
      pattern: step1Pattern,
      mapping: step1Mapping,
    },
    {
      stageKey: 'step1to5' as const,
      totalScore: step2.totalScore,
      scores: step2.finalScores,
      pattern: step2Pattern,
      mapping: step2Mapping,
    },
    {
      stageKey: 'step1to6' as const,
      totalScore: step3.totalScore,
      scores: step3.finalScores,
      pattern: step3Pattern,
      mapping: step3Mapping,
    },
    {
      stageKey: 'step1to7' as const,
      totalScore: step4.totalScore,
      scores: step4.finalScores,
      pattern: step4.patternClassification,
      mapping: step4Mapping,
    },
    {
      stageKey: 'step1to8' as const,
      totalScore: step5.totalScore,
      scores: step5.finalScores,
      pattern: step5.patternClassification,
      mapping: step5.yongShenMapping,
    },
  ];

  const snapshots: YongShenStageSnapshot[] = [];
  rawSnapshots.forEach((item, index) => {
    const previousSnapshot = index > 0 ? snapshots[index - 1] : null;
    snapshots.push({
      stageKey: item.stageKey,
      stageLabel: stageLabels[item.stageKey],
      totalScore: Number(item.totalScore.toFixed(4)),
      scores: {
        金: Number(item.scores.金.toFixed(4)),
        木: Number(item.scores.木.toFixed(4)),
        水: Number(item.scores.水.toFixed(4)),
        火: Number(item.scores.火.toFixed(4)),
        土: Number(item.scores.土.toFixed(4)),
      },
      patternType: item.mapping.patternType,
      tongDangPercent: Number(item.pattern.tongDangPercent.toFixed(4)),
      maxSelfElement: item.pattern.maxSelfElement,
      maxSelfPercent: Number(item.pattern.maxSelfPercent.toFixed(4)),
      maxOpposingElement: item.pattern.maxOpposingElement,
      maxOpposingPercent: Number(item.pattern.maxOpposingPercent.toFixed(4)),
      yongElements: [...item.mapping.yongElements],
      jiElements: [...item.mapping.jiElements],
      changeSummary: buildStageChangeSummary(previousSnapshot, item.pattern, item.mapping),
    });
  });

  const changedSnapshots = snapshots.filter((item) =>
    item.changeSummary.some(
      (summary) => !summary.includes('作为第一阶段基准盘') && !summary.includes('未翻转'),
    ),
  );

  return {
    finalResult: step5,
    finalSnapshot: snapshots[snapshots.length - 1],
    snapshots,
    changedSnapshots,
  };
}
