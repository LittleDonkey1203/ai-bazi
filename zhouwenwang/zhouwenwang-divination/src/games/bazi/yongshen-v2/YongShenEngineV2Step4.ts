import { PatternClassifier } from './PatternClassifier';
import { YongShenEngineV2Step3 } from './YongShenEngineV2Step3';
import type { BaziInput, Step1To7AnalysisResult } from './types';

export class YongShenEngineV2Step4 {
  constructor(
    private readonly step3Engine = new YongShenEngineV2Step3(),
    private readonly patternClassifier = new PatternClassifier(),
  ) {}

  public analyzeStep1To7(baziInput: BaziInput): Step1To7AnalysisResult {
    const step3Result = this.step3Engine.analyzeStep1To6(baziInput);
    const patternClassification = this.patternClassifier.classifyPattern(
      step3Result.baseScore,
      step3Result.stemCombinations,
      step3Result.finalScores,
      step3Result.totalScore,
    );

    return {
      baseScore: step3Result.baseScore,
      rooting: step3Result.rooting,
      stemCombinations: step3Result.stemCombinations,
      branchMutations: step3Result.branchMutations,
      seasonalAdjustment: step3Result.seasonalAdjustment,
      patternClassification,
      finalScores: step3Result.finalScores,
      totalScore: step3Result.totalScore,
    };
  }
}
