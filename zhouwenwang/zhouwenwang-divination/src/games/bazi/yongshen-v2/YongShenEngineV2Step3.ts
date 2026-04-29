import { SeasonalMultiplierApplier } from './SeasonalMultiplierApplier';
import { YongShenEngineV2Step2 } from './YongShenEngineV2Step2';
import type { BaziInput, Step1To6AnalysisResult } from './types';

function roundValue(value: number): number {
  return Number(value.toFixed(4));
}

export class YongShenEngineV2Step3 {
  constructor(
    private readonly step2Engine = new YongShenEngineV2Step2(),
    private readonly seasonalMultiplierApplier = new SeasonalMultiplierApplier(),
  ) {}

  public analyzeStep1To6(baziInput: BaziInput): Step1To6AnalysisResult {
    const step2Result = this.step2Engine.analyzeStep1To5(baziInput);
    const seasonalAdjustment = this.seasonalMultiplierApplier.applySeasonalMultipliers(
      step2Result.baseScore,
      step2Result.finalScores,
    );
    const totalScore = roundValue(
      Object.values(seasonalAdjustment.adjustedScores).reduce((total, value) => total + value, 0),
    );

    return {
      baseScore: step2Result.baseScore,
      rooting: step2Result.rooting,
      stemCombinations: step2Result.stemCombinations,
      branchMutations: step2Result.branchMutations,
      seasonalAdjustment,
      finalScores: seasonalAdjustment.adjustedScores,
      totalScore,
    };
  }
}
