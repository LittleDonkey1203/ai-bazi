import {
  ADJACENT_STEM_PAIRS,
  ELEMENT_KEYS,
  getBranchDominantElement,
  STEM_COMBINATION_RULES,
  STEMS,
} from './constants';
import type {
  AdjacentStemPair,
  BaseScoreResult,
  FiveElement,
  ScoreContribution,
  Stem,
  StemCombinationApplication,
  StemCombinationResult,
  StemCombinationRule,
} from './types';

function roundValue(value: number): number {
  return Number(value.toFixed(4));
}

function cloneScores(scores: Record<FiveElement, number>): Record<FiveElement, number> {
  return {
    金: scores.金,
    木: scores.木,
    水: scores.水,
    火: scores.火,
    土: scores.土,
  };
}

function addElementDelta(
  delta: Partial<Record<FiveElement, number>>,
  element: FiveElement,
  value: number,
): void {
  const current = delta[element] || 0;
  delta[element] = roundValue(current + value);
}

export class HeavenlyStemCombiner {
  public applyStemCombinations(
    baseScore: BaseScoreResult,
    inputScores: Record<FiveElement, number>,
  ): StemCombinationResult {
    const adjustedScores = cloneScores(inputScores);
    const monthBranchDominantElement = getBranchDominantElement(baseScore.baziInput[3]);
    const applications: StemCombinationApplication[] = [];

    ADJACENT_STEM_PAIRS.forEach((pairIndexes) => {
      const application = this.applySinglePair(
        pairIndexes,
        baseScore,
        adjustedScores,
        monthBranchDominantElement,
      );

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

  private applySinglePair(
    pairIndexes: AdjacentStemPair,
    baseScore: BaseScoreResult,
    adjustedScores: Record<FiveElement, number>,
    monthBranchDominantElement: FiveElement,
  ): StemCombinationApplication | null {
    const [leftIndex, rightIndex] = pairIndexes;
    const leftStem = baseScore.baziInput[leftIndex] as Stem;
    const rightStem = baseScore.baziInput[rightIndex] as Stem;
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
    const elementDelta: Partial<Record<FiveElement, number>> = {};

    const leftActual = this.applyDeduction(adjustedScores, leftElement, leftPlanned);
    const rightActual = this.applyDeduction(adjustedScores, rightElement, rightPlanned);
    const actualTransfer = roundValue(leftActual + rightActual);

    addElementDelta(elementDelta, leftElement, -leftActual);
    addElementDelta(elementDelta, rightElement, -rightActual);
    adjustedScores[matchedRule.targetElement] = roundValue(
      adjustedScores[matchedRule.targetElement] + actualTransfer,
    );
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

  private findMatchedRule(leftStem: Stem, rightStem: Stem): StemCombinationRule | null {
    return (
      STEM_COMBINATION_RULES.find(
        (rule) =>
          (rule.stems[0] === leftStem && rule.stems[1] === rightStem) ||
          (rule.stems[0] === rightStem && rule.stems[1] === leftStem),
      ) || null
    );
  }

  private findStemContribution(index: 0 | 2 | 4 | 6, contributions: ScoreContribution[]): number {
    const contribution = contributions.find((item) => item.index === index && item.sourceType === 'stem');
    if (!contribution) {
      return 0;
    }

    return roundValue(
      ELEMENT_KEYS.reduce((total, element) => total + (contribution.elementBreakdown[element] || 0), 0),
    );
  }

  private applyDeduction(
    adjustedScores: Record<FiveElement, number>,
    element: FiveElement,
    plannedValue: number,
  ): number {
    const current = adjustedScores[element];
    const actualValue = roundValue(Math.min(current, plannedValue));
    adjustedScores[element] = roundValue(current - actualValue);
    return actualValue;
  }

  private normalizeElementDelta(
    delta: Partial<Record<FiveElement, number>>,
  ): Partial<Record<FiveElement, number>> {
    return ELEMENT_KEYS.reduce<Partial<Record<FiveElement, number>>>((result, element) => {
      if (delta[element]) {
        result[element] = roundValue(delta[element] || 0);
      }
      return result;
    }, {});
  }
}
