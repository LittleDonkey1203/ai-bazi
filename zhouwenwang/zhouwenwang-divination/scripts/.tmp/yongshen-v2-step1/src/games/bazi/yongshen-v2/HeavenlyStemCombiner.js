import { ADJACENT_STEM_PAIRS, ELEMENT_KEYS, getBranchDominantElement, STEM_COMBINATION_RULES, STEMS, } from './constants.js';
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
function addElementDelta(delta, element, value) {
    const current = delta[element] || 0;
    delta[element] = roundValue(current + value);
}
export class HeavenlyStemCombiner {
    applyStemCombinations(baseScore, inputScores) {
        const adjustedScores = cloneScores(inputScores);
        const monthBranchDominantElement = getBranchDominantElement(baseScore.baziInput[3]);
        const applications = [];
        ADJACENT_STEM_PAIRS.forEach((pairIndexes) => {
            const application = this.applySinglePair(pairIndexes, baseScore, adjustedScores, monthBranchDominantElement);
            if (application) {
                applications.push(application);
            }
        });
        return {
            inputScores: cloneScores(inputScores),
            adjustedScores,
            monthBranchDominantElement,
            applications,
        };
    }
    applySinglePair(pairIndexes, baseScore, adjustedScores, monthBranchDominantElement) {
        const [leftIndex, rightIndex] = pairIndexes;
        const leftStem = baseScore.baziInput[leftIndex];
        const rightStem = baseScore.baziInput[rightIndex];
        const matchedRule = this.findMatchedRule(leftStem, rightStem);
        if (!matchedRule) {
            return null;
        }
        const leftElement = STEMS[leftStem];
        const rightElement = STEMS[rightStem];
        const transferRatio = matchedRule.targetElement === monthBranchDominantElement ? 0.8 : 0.5;
        const boostedByMonthBranch = transferRatio === 0.8;
        const leftOriginalScore = this.findStemContribution(leftIndex, baseScore.contributions);
        const rightOriginalScore = this.findStemContribution(rightIndex, baseScore.contributions);
        const leftPlanned = roundValue(leftOriginalScore * transferRatio);
        const rightPlanned = roundValue(rightOriginalScore * transferRatio);
        const elementDelta = {};
        const leftActual = this.applyDeduction(adjustedScores, leftElement, leftPlanned);
        const rightActual = this.applyDeduction(adjustedScores, rightElement, rightPlanned);
        const actualTransfer = roundValue(leftActual + rightActual);
        addElementDelta(elementDelta, leftElement, -leftActual);
        addElementDelta(elementDelta, rightElement, -rightActual);
        adjustedScores[matchedRule.targetElement] = roundValue(adjustedScores[matchedRule.targetElement] + actualTransfer);
        addElementDelta(elementDelta, matchedRule.targetElement, actualTransfer);
        return {
            pairIndexes,
            stems: [leftStem, rightStem],
            sourceElements: [leftElement, rightElement],
            targetElement: matchedRule.targetElement,
            monthBranchDominantElement,
            transferRatio,
            boostedByMonthBranch,
            plannedTransfer: roundValue(leftPlanned + rightPlanned),
            actualTransfer,
            elementDelta: this.normalizeElementDelta(elementDelta),
        };
    }
    findMatchedRule(leftStem, rightStem) {
        return (STEM_COMBINATION_RULES.find((rule) => (rule.stems[0] === leftStem && rule.stems[1] === rightStem) ||
            (rule.stems[0] === rightStem && rule.stems[1] === leftStem)) || null);
    }
    findStemContribution(index, contributions) {
        const contribution = contributions.find((item) => item.index === index && item.sourceType === 'stem');
        if (!contribution) {
            return 0;
        }
        return roundValue(ELEMENT_KEYS.reduce((total, element) => total + (contribution.elementBreakdown[element] || 0), 0));
    }
    applyDeduction(adjustedScores, element, plannedValue) {
        const current = adjustedScores[element];
        const actualValue = roundValue(Math.min(current, plannedValue));
        adjustedScores[element] = roundValue(current - actualValue);
        return actualValue;
    }
    normalizeElementDelta(delta) {
        return ELEMENT_KEYS.reduce((result, element) => {
            if (delta[element]) {
                result[element] = roundValue(delta[element] || 0);
            }
            return result;
        }, {});
    }
}
