import { BranchMutationProcessor } from './BranchMutationProcessor.js';
import { HeavenlyStemCombiner } from './HeavenlyStemCombiner.js';
import { YongShenEngineV2Step1 } from './YongShenEngineV2Step1.js';
function roundValue(value) {
    return Number(value.toFixed(4));
}
export class YongShenEngineV2Step2 {
    step1Engine;
    stemCombiner;
    branchMutationProcessor;
    constructor(step1Engine = new YongShenEngineV2Step1(), stemCombiner = new HeavenlyStemCombiner(), branchMutationProcessor = new BranchMutationProcessor()) {
        this.step1Engine = step1Engine;
        this.stemCombiner = stemCombiner;
        this.branchMutationProcessor = branchMutationProcessor;
    }
    analyzeStep1To5(baziInput) {
        const step1Result = this.step1Engine.analyzeStep1To3(baziInput);
        const stemCombinations = this.stemCombiner.applyStemCombinations(step1Result.baseScore, step1Result.finalScores);
        const branchMutations = this.branchMutationProcessor.applyBranchMutations(step1Result.baseScore, stemCombinations.adjustedScores);
        const totalScore = roundValue(Object.values(branchMutations.adjustedScores).reduce((total, value) => total + value, 0));
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
