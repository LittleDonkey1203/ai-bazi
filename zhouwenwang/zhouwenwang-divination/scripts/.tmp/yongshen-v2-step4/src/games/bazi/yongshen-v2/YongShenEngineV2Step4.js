import { PatternClassifier } from './PatternClassifier.js';
import { YongShenEngineV2Step3 } from './YongShenEngineV2Step3.js';
export class YongShenEngineV2Step4 {
    step3Engine;
    patternClassifier;
    constructor(step3Engine = new YongShenEngineV2Step3(), patternClassifier = new PatternClassifier()) {
        this.step3Engine = step3Engine;
        this.patternClassifier = patternClassifier;
    }
    analyzeStep1To7(baziInput) {
        const step3Result = this.step3Engine.analyzeStep1To6(baziInput);
        const patternClassification = this.patternClassifier.classifyPattern(step3Result.baseScore, step3Result.stemCombinations, step3Result.finalScores, step3Result.totalScore);
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
