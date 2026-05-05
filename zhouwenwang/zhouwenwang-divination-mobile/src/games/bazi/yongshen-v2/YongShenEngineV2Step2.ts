import { BranchMutationProcessor } from './BranchMutationProcessor';
import { HeavenlyStemCombiner } from './HeavenlyStemCombiner';
import { YongShenEngineV2Step1 } from './YongShenEngineV2Step1';
import type { BaziInput, Step1To5AnalysisResult } from './types';

function roundValue(value: number): number {
  return Number(value.toFixed(4));
}

export class YongShenEngineV2Step2 {
  constructor(
    private readonly step1Engine = new YongShenEngineV2Step1(),
    private readonly stemCombiner = new HeavenlyStemCombiner(),
    private readonly branchMutationProcessor = new BranchMutationProcessor(),
  ) {}

  public analyzeStep1To5(baziInput: BaziInput): Step1To5AnalysisResult {
    const step1Result = this.step1Engine.analyzeStep1To3(baziInput);
    const stemCombinations = this.stemCombiner.applyStemCombinations(
      step1Result.baseScore,
      step1Result.finalScores,
    );
    const branchMutations = this.branchMutationProcessor.applyBranchMutations(
      step1Result.baseScore,
      stemCombinations.adjustedScores,
    );
    const totalScore = roundValue(
      Object.values(branchMutations.adjustedScores).reduce((total, value) => total + value, 0),
    );

    return {
      baseScore: step1Result.baseScore,
      rooting: step1Result.rooting,
      stemCombinations,
      branchMutations,
      finalScores: branchMutations.adjustedScores,
      totalScore,
    };
  }
}
