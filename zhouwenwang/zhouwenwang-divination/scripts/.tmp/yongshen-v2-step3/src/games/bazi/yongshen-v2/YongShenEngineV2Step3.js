import { SeasonalMultiplierApplier } from './SeasonalMultiplierApplier.js';
import { YongShenEngineV2Step2 } from './YongShenEngineV2Step2.js';
function roundValue(value) {
    return Number(value.toFixed(4));
}
export class YongShenEngineV2Step3 {
    step2Engine;
    seasonalMultiplierApplier;
    constructor(step2Engine = new YongShenEngineV2Step2(), seasonalMultiplierApplier = new SeasonalMultiplierApplier()) {
        this.step2Engine = step2Engine;
        this.seasonalMultiplierApplier = seasonalMultiplierApplier;
    }
    analyzeStep1To6(baziInput) {
        const step2Result = this.step2Engine.analyzeStep1To5(baziInput);
        const seasonalAdjustment = this.seasonalMultiplierApplier.applySeasonalMultipliers(step2Result.baseScore, step2Result.finalScores);
        const totalScore = roundValue(Object.values(seasonalAdjustment.adjustedScores).reduce((total, value) => total + value, 0));
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
