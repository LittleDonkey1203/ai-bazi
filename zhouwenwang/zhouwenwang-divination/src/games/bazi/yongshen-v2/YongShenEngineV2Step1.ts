import { BaseScoreCalculator } from './BaseScoreCalculator';
import { RootingVerifier } from './RootingVerifier';
import type { BaziInput, Step1To3AnalysisResult } from './types';

function roundValue(value: number): number {
  return Number(value.toFixed(4));
}

export class YongShenEngineV2Step1 {
  constructor(
    private readonly baseScoreCalculator = new BaseScoreCalculator(),
    private readonly rootingVerifier = new RootingVerifier(),
  ) {}

  public analyzeStep1To3(baziInput: BaziInput): Step1To3AnalysisResult {
    const baseScore = this.baseScoreCalculator.calculateBaseScore(baziInput);
    const rooting = this.rootingVerifier.applyRootingPenalty(baseScore);
    const totalScore = roundValue(
      Object.values(rooting.adjustedScores).reduce((total, value) => total + value, 0),
    );

    return {
      baseScore,
      rooting,
      finalScores: rooting.adjustedScores,
      totalScore,
    };
  }
}
