import { ELEMENT_KEYS, getBranchDominantElement, getDestroyedElement, getGeneratedElement, getGeneratorElement, } from './constants.js';
function roundValue(value) {
    return Number(value.toFixed(4));
}
function cloneScores(scores) {
    return {
        金: scores.金,
        木: scores.木,
        水: scores.水,
        火: scores.火,
        土: scores.土,
    };
}
export class SeasonalMultiplierApplier {
    applySeasonalMultipliers(baseScore, inputScores) {
        const monthBranchDominantElement = getBranchDominantElement(baseScore.baziInput[3]);
        const adjustedScores = cloneScores(inputScores);
        const adjustments = ELEMENT_KEYS.map((element) => this.adjustSingleElement(element, monthBranchDominantElement, inputScores, adjustedScores));
        return {
            inputScores: cloneScores(inputScores),
            adjustedScores,
            monthBranchDominantElement,
            adjustments,
        };
    }
    adjustSingleElement(element, monthBranchDominantElement, inputScores, adjustedScores) {
        const originalScore = inputScores[element];
        const state = this.resolveSeasonalState(element, monthBranchDominantElement);
        const multiplier = this.getMultiplierByState(state);
        const adjustedScore = roundValue(originalScore * multiplier);
        adjustedScores[element] = adjustedScore;
        return {
            element,
            monthBranchDominantElement,
            state,
            multiplier,
            originalScore,
            adjustedScore,
        };
    }
    resolveSeasonalState(element, monthBranchDominantElement) {
        if (element === monthBranchDominantElement) {
            return '旺';
        }
        if (element === getGeneratedElement(monthBranchDominantElement)) {
            return '相';
        }
        if (element === getGeneratorElement(monthBranchDominantElement)) {
            return '休';
        }
        if (getDestroyedElement(element) === monthBranchDominantElement) {
            return '囚';
        }
        return '死';
    }
    getMultiplierByState(state) {
        switch (state) {
            case '旺':
                return 1.5;
            case '相':
                return 1.2;
            case '休':
                return 0.9;
            case '囚':
                return 0.8;
            case '死':
                return 0.5;
            default:
                return 1;
        }
    }
}
