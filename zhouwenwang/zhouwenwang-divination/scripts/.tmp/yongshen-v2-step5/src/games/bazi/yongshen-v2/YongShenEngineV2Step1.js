import { BaseScoreCalculator } from './BaseScoreCalculator.js';
import { RootingVerifier } from './RootingVerifier.js';
function roundValue(value) {
    return Number(value.toFixed(4));
}
export class YongShenEngineV2Step1 {
    baseScoreCalculator;
    rootingVerifier;
    constructor(baseScoreCalculator = new BaseScoreCalculator(), rootingVerifier = new RootingVerifier()) {
        this.baseScoreCalculator = baseScoreCalculator;
        this.rootingVerifier = rootingVerifier;
    }
    analyzeStep1To3(baziInput) {
        const baseScore = this.baseScoreCalculator.calculateBaseScore(baziInput);
        const rooting = this.rootingVerifier.applyRootingPenalty(baseScore);
        const totalScore = roundValue(Object.values(rooting.adjustedScores).reduce((total, value) => total + value, 0));
        return {
            baseScore,
            rooting,
            finalScores: rooting.adjustedScores,
            totalScore,
        };
    }
}
