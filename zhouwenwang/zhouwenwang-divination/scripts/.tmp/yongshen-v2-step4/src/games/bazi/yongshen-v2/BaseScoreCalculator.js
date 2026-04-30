import { BRANCH_SCORE_INDEXES, ELEMENT_KEYS, HIDDEN_STEMS, POSITION_LABELS, POSITION_WEIGHTS, STEM_SCORE_INDEXES, STEMS, } from './constants.js';
function createEmptyScores() {
    return {
        金: 0,
        木: 0,
        水: 0,
        火: 0,
        土: 0,
    };
}
function roundValue(value) {
    return Number(value.toFixed(4));
}
export class BaseScoreCalculator {
    calculateBaseScore(baziInput) {
        const scores = createEmptyScores();
        const contributions = [];
        STEM_SCORE_INDEXES.forEach((index) => {
            contributions.push(this.calculateStemContribution(index, baziInput[index], scores));
        });
        BRANCH_SCORE_INDEXES.forEach((index) => {
            contributions.push(this.calculateBranchContribution(index, baziInput[index], scores));
        });
        return {
            baziInput,
            scores: this.cloneScores(scores),
            contributions,
        };
    }
    calculateStemContribution(index, stem, scores) {
        const weight = POSITION_WEIGHTS[index];
        const element = STEMS[stem];
        const elementBreakdown = {
            [element]: roundValue(weight),
        };
        scores[element] = roundValue(scores[element] + weight);
        return {
            index,
            label: POSITION_LABELS[index],
            sourceType: 'stem',
            source: stem,
            weight,
            elementBreakdown,
        };
    }
    calculateBranchContribution(index, branch, scores) {
        const weight = POSITION_WEIGHTS[index];
        const hiddenElements = HIDDEN_STEMS[branch];
        const elementBreakdown = {};
        ELEMENT_KEYS.forEach((element) => {
            const ratio = hiddenElements[element];
            if (!ratio) {
                return;
            }
            const contribution = roundValue(weight * ratio);
            scores[element] = roundValue(scores[element] + contribution);
            elementBreakdown[element] = contribution;
        });
        return {
            index,
            label: POSITION_LABELS[index],
            sourceType: 'branch',
            source: branch,
            weight,
            elementBreakdown,
        };
    }
    cloneScores(scores) {
        return {
            金: scores.金,
            木: scores.木,
            水: scores.水,
            火: scores.火,
            土: scores.土,
        };
    }
}
