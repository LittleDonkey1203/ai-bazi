import { YongShenEngineV2Step4 } from './YongShenEngineV2Step4';
import { YongShenMapper } from './YongShenMapper';
import type { BaziInput, Step1To8AnalysisResult } from './types';

export class YongShenEngineV2Step5 {
  constructor(
    private readonly step4Engine = new YongShenEngineV2Step4(),
    private readonly yongShenMapper = new YongShenMapper(),
  ) {}

  public analyzeStep1To8(baziInput: BaziInput): Step1To8AnalysisResult {
    const step4Result = this.step4Engine.analyzeStep1To7(baziInput);
    const yongShenMapping = this.yongShenMapper.mapYongShen(
      step4Result.baseScore,
      step4Result.patternClassification,
    );

    return {
      baseScore: step4Result.baseScore,
      rooting: step4Result.rooting,
      stemCombinations: step4Result.stemCombinations,
      branchMutations: step4Result.branchMutations,
      seasonalAdjustment: step4Result.seasonalAdjustment,
      patternClassification: step4Result.patternClassification,
      yongShenMapping,
      finalScores: step4Result.finalScores,
      totalScore: step4Result.totalScore,
    };
  }
}
