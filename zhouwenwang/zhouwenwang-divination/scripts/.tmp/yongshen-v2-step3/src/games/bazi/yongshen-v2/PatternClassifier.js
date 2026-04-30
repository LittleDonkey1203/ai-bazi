import { getDestroyerElement, getGeneratorElement, STEMS } from './constants.js';
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
export class PatternClassifier {
    classifyPattern(baseScore, stemCombinations, inputScores, totalScore) {
        const monthBranchDominantElement = stemCombinations.monthBranchDominantElement;
        const originalDayMasterElement = STEMS[baseScore.baziInput[4]];
        const transformation = this.evaluateTransformation(baseScore, stemCombinations, monthBranchDominantElement);
        const effectiveDayMasterElement = transformation.passed
            ? transformation.targetElement
            : originalDayMasterElement;
        const tongDangElements = [
            effectiveDayMasterElement,
            getGeneratorElement(effectiveDayMasterElement),
        ];
        const tongDangScore = roundValue((inputScores[tongDangElements[0]] || 0) + (inputScores[tongDangElements[1]] || 0));
        const yiDangScore = roundValue(totalScore - tongDangScore);
        const tongDangRatio = totalScore === 0 ? 0 : roundValue(tongDangScore / totalScore);
        const yiDangRatio = totalScore === 0 ? 0 : roundValue(yiDangScore / totalScore);
        const tongDangPercent = totalScore === 0 ? 0 : roundValue((tongDangScore / totalScore) * 100);
        const yiDangPercent = totalScore === 0 ? 0 : roundValue((yiDangScore / totalScore) * 100);
        const maxSelfElement = this.findMaxElementInGroup(inputScores, tongDangElements);
        const maxSelfPercent = totalScore === 0 || !maxSelfElement ? 0 : roundValue((inputScores[maxSelfElement] / totalScore) * 100);
        const opposingElements = this.getOpposingElements(tongDangElements);
        const maxOpposingElement = this.findMaxElementInGroup(inputScores, opposingElements);
        const maxOpposingPercent = totalScore === 0 || !maxOpposingElement
            ? 0
            : roundValue((inputScores[maxOpposingElement] / totalScore) * 100);
        const patternType = transformation.passed
            ? '化气格'
            : this.resolveRegularPatternType(tongDangPercent, maxSelfPercent, maxOpposingPercent);
        return {
            inputScores: cloneScores(inputScores),
            patternType,
            originalDayMasterElement,
            effectiveDayMasterElement,
            monthBranchDominantElement,
            tongDangElements,
            tongDangScore,
            yiDangScore,
            tongDangRatio,
            yiDangRatio,
            tongDangPercent,
            yiDangPercent,
            maxOpposingElement,
            maxOpposingPercent,
            maxSelfElement,
            maxSelfPercent,
            transformation,
        };
    }
    evaluateTransformation(baseScore, stemCombinations, monthBranchDominantElement) {
        const dayRelatedCombination = stemCombinations.applications.find((application) => application.pairIndexes.includes(4)) || null;
        if (!dayRelatedCombination) {
            return {
                passed: false,
                pairIndexes: null,
                pairStems: null,
                targetElement: null,
                monthBranchDominantElement,
                destroyerElement: null,
                blockingStems: [],
                shortcutYongElements: [],
                shortcutJiElements: [],
                reasons: ['日干与相邻天干不存在五合'],
            };
        }
        const targetElement = dayRelatedCombination.targetElement;
        const destroyerElement = getDestroyerElement(targetElement);
        const reasons = [];
        if (targetElement !== monthBranchDominantElement) {
            reasons.push(`合化目标五行 ${targetElement} 不等于月支主气 ${monthBranchDominantElement}`);
        }
        const blockingStems = this.findBlockingStems(baseScore, destroyerElement);
        if (blockingStems.length > 0) {
            reasons.push(`原局天干存在克制 ${targetElement} 的五行 ${destroyerElement}`);
        }
        const passed = reasons.length === 0;
        return {
            passed,
            pairIndexes: dayRelatedCombination.pairIndexes,
            pairStems: dayRelatedCombination.stems,
            targetElement,
            monthBranchDominantElement,
            destroyerElement,
            blockingStems,
            shortcutYongElements: passed
                ? [targetElement, getGeneratorElement(targetElement)]
                : [],
            shortcutJiElements: passed ? [destroyerElement] : [],
            reasons: passed ? ['满足化气格条件'] : reasons,
        };
    }
    findBlockingStems(baseScore, destroyerElement) {
        const stemIndexes = [0, 2, 4, 6];
        return stemIndexes.reduce((result, index) => {
            const stem = baseScore.baziInput[index];
            const element = STEMS[stem];
            if (element === destroyerElement) {
                result.push({ index, stem, element });
            }
            return result;
        }, []);
    }
    getOpposingElements(tongDangElements) {
        return ['金', '木', '水', '火', '土'].filter((element) => !tongDangElements.includes(element));
    }
    findMaxElementInGroup(scores, elements) {
        if (elements.length === 0) {
            return null;
        }
        return elements.reduce((currentMax, candidate) => {
            return scores[candidate] > scores[currentMax] ? candidate : currentMax;
        }, elements[0]);
    }
    resolveRegularPatternType(tongDangPercent, maxSelfPercent, maxOpposingPercent) {
        if (tongDangPercent >= 85) {
            return '专旺格';
        }
        if (tongDangPercent >= 70 && maxSelfPercent >= 65) {
            return '假专旺格';
        }
        if (tongDangPercent <= 15) {
            return '从格';
        }
        if (tongDangPercent > 15 && tongDangPercent <= 30 && maxOpposingPercent >= 65) {
            return '假从格';
        }
        if (tongDangPercent > 50) {
            return '身旺格';
        }
        return '身弱格';
    }
}
