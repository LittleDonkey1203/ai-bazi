import { YongShenEngineV2Step4 } from './YongShenEngineV2Step4.js';
import { YongShenMapper } from './YongShenMapper.js';
export class YongShenEngineV2Step5 {
    step4Engine;
    yongShenMapper;
    constructor(step4Engine = new YongShenEngineV2Step4(), yongShenMapper = new YongShenMapper()) {
        this.step4Engine = step4Engine;
        this.yongShenMapper = yongShenMapper;
    }
    analyzeStep1To8(baziInput) {
        const step4Result = this.step4Engine.analyzeStep1To7(baziInput);
        const yongShenMapping = this.yongShenMapper.mapYongShen(step4Result.baseScore, step4Result.patternClassification);
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
