import {
  BRANCH_SCORE_INDEXES,
  ELEMENT_KEYS,
  getBranchDominantElement,
  getDestroyedElement,
  HALF_HARMONY_RULES,
  OPPOSING_CLASH_RULES,
  SAME_CLASH_RULES,
  SIX_COMBINATION_RULES,
  SIX_HARM_RULES,
  THREE_HARMONY_RULES,
  THREE_MEETING_RULES,
  THREE_PUNISHMENT_RULES,
} from './constants';
import type {
  BaseScoreResult,
  Branch,
  BranchMutationApplication,
  BranchMutationResult,
  BranchMutationRule,
  BranchScoreIndex,
  FiveElement,
} from './types';

type BranchContributionMap = Record<BranchScoreIndex, Partial<Record<FiveElement, number>>>;
type BranchLockMap = Partial<Record<BranchScoreIndex, boolean>>;

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

export class BranchMutationProcessor {
  public applyBranchMutations(
    baseScore: BaseScoreResult,
    inputScores: Record<FiveElement, number>,
  ): BranchMutationResult {
    const adjustedScores = cloneScores(inputScores);
    const branchContributionMap = this.buildBranchContributionMap(baseScore);
    const lockedBranches: BranchLockMap = {};
    const applications: BranchMutationApplication[] = [];
    const monthBranchDominantElement = getBranchDominantElement(baseScore.baziInput[3]);

    this.applyTransferRules(
      THREE_MEETING_RULES,
      baseScore,
      branchContributionMap,
      adjustedScores,
      lockedBranches,
      applications,
      monthBranchDominantElement,
      false,
    );
    this.applyTransferRules(
      THREE_HARMONY_RULES,
      baseScore,
      branchContributionMap,
      adjustedScores,
      lockedBranches,
      applications,
      monthBranchDominantElement,
      true,
    );
    this.applySixCombinationRules(
      SIX_COMBINATION_RULES,
      baseScore,
      branchContributionMap,
      adjustedScores,
      lockedBranches,
      applications,
      monthBranchDominantElement,
    );
    this.applyTransferRules(
      HALF_HARMONY_RULES,
      baseScore,
      branchContributionMap,
      adjustedScores,
      lockedBranches,
      applications,
      monthBranchDominantElement,
      true,
    );
    this.applySameClashRules(SAME_CLASH_RULES, baseScore, branchContributionMap, adjustedScores, lockedBranches, applications);
    this.applyPenaltyRules(OPPOSING_CLASH_RULES, baseScore, branchContributionMap, adjustedScores, lockedBranches, applications);
    this.applyPenaltyRules(THREE_PUNISHMENT_RULES, baseScore, branchContributionMap, adjustedScores, lockedBranches, applications);
    this.applyPenaltyRules(SIX_HARM_RULES, baseScore, branchContributionMap, adjustedScores, lockedBranches, applications);

    return {
      inputScores: cloneScores(inputScores),
      adjustedScores,
      lockedBranches,
      applications,
    };
  }

  private applyTransferRules(
    rules: BranchMutationRule[],
    baseScore: BaseScoreResult,
    branchContributionMap: BranchContributionMap,
    adjustedScores: Record<FiveElement, number>,
    lockedBranches: BranchLockMap,
    applications: BranchMutationApplication[],
    monthBranchDominantElement: FiveElement,
    enableVeto: boolean,
  ): void {
    rules.forEach((rule) => {
      const involvedIndexes = this.findAvailableIndexes(rule.branches, baseScore, lockedBranches);
      if (!involvedIndexes) {
        return;
      }

      if (
        enableVeto &&
        rule.targetElement &&
        this.isMonthOrderVetoed(rule.targetElement, monthBranchDominantElement)
      ) {
        return;
      }

      const elementDelta: Partial<Record<FiveElement, number>> = {};
      let totalTransferred = 0;

      involvedIndexes.forEach((index) => {
        const breakdown = branchContributionMap[index];
        ELEMENT_KEYS.forEach((element) => {
          const plannedValue = roundValue((breakdown[element] || 0) * (rule.transferRatio || 0));
          if (plannedValue === 0) {
            return;
          }

          const actualValue = this.applyDeduction(adjustedScores, element, plannedValue);
          totalTransferred = roundValue(totalTransferred + actualValue);
          addElementDelta(elementDelta, element, -actualValue);
        });
      });

      let totalBonus = 0;
      if (rule.targetElement) {
        adjustedScores[rule.targetElement] = roundValue(adjustedScores[rule.targetElement] + totalTransferred);
        addElementDelta(elementDelta, rule.targetElement, totalTransferred);

        if (rule.bonusRatio) {
          totalBonus = roundValue(totalTransferred * rule.bonusRatio);
          adjustedScores[rule.targetElement] = roundValue(adjustedScores[rule.targetElement] + totalBonus);
          addElementDelta(elementDelta, rule.targetElement, totalBonus);
        }
      }

      this.lockIndexes(involvedIndexes, lockedBranches);
      applications.push({
        label: rule.label,
        priority: rule.priority,
        mutationType: rule.mutationType,
        involvedIndexes,
        involvedBranches: involvedIndexes.map((index) => baseScore.baziInput[index] as Branch),
        targetElement: rule.targetElement,
        transferRatio: rule.transferRatio,
        bonusRatio: rule.bonusRatio,
        totalTransferred,
        totalBonus,
        totalPenalty: 0,
        penaltyRatio: rule.penaltyRatio,
        lockedIndexesAfterApply: this.getLockedIndexes(lockedBranches),
        elementDelta: this.normalizeElementDelta(elementDelta),
      });
    });
  }

  private applySixCombinationRules(
    rules: BranchMutationRule[],
    baseScore: BaseScoreResult,
    branchContributionMap: BranchContributionMap,
    adjustedScores: Record<FiveElement, number>,
    lockedBranches: BranchLockMap,
    applications: BranchMutationApplication[],
    monthBranchDominantElement: FiveElement,
  ): void {
    rules.forEach((rule) => {
      const involvedIndexes = this.findAvailableIndexes(rule.branches, baseScore, lockedBranches);
      if (!involvedIndexes || !rule.targetElement) {
        return;
      }

      if (this.isMonthOrderVetoed(rule.targetElement, monthBranchDominantElement)) {
        this.applyBoundPenaltyRule(
          rule,
          baseScore,
          branchContributionMap,
          adjustedScores,
          lockedBranches,
          applications,
          involvedIndexes,
        );
        return;
      }

      this.applyTransferRules(
        [rule],
        baseScore,
        branchContributionMap,
        adjustedScores,
        lockedBranches,
        applications,
        monthBranchDominantElement,
        false,
      );
    });
  }

  private applySameClashRules(
    rules: BranchMutationRule[],
    baseScore: BaseScoreResult,
    branchContributionMap: BranchContributionMap,
    adjustedScores: Record<FiveElement, number>,
    lockedBranches: BranchLockMap,
    applications: BranchMutationApplication[],
  ): void {
    rules.forEach((rule) => {
      const involvedIndexes = this.findAvailableIndexes(rule.branches, baseScore, lockedBranches);
      if (!involvedIndexes || !rule.targetElement || !rule.bonusRatio) {
        return;
      }

      let baseAmount = 0;
      involvedIndexes.forEach((index) => {
        const branch = baseScore.baziInput[index] as Branch;
        const dominantElement = getBranchDominantElement(branch);
        baseAmount = roundValue(baseAmount + (branchContributionMap[index][dominantElement] || 0));
      });

      const totalBonus = roundValue(baseAmount * rule.bonusRatio);
      adjustedScores[rule.targetElement] = roundValue(adjustedScores[rule.targetElement] + totalBonus);

      const elementDelta: Partial<Record<FiveElement, number>> = {};
      addElementDelta(elementDelta, rule.targetElement, totalBonus);
      this.lockIndexes(involvedIndexes, lockedBranches);

      applications.push({
        label: rule.label,
        priority: rule.priority,
        mutationType: rule.mutationType,
        involvedIndexes,
        involvedBranches: involvedIndexes.map((index) => baseScore.baziInput[index] as Branch),
        targetElement: rule.targetElement,
        bonusRatio: rule.bonusRatio,
        totalTransferred: 0,
        totalBonus,
        totalPenalty: 0,
        lockedIndexesAfterApply: this.getLockedIndexes(lockedBranches),
        elementDelta: this.normalizeElementDelta(elementDelta),
      });
    });
  }

  private applyPenaltyRules(
    rules: BranchMutationRule[],
    baseScore: BaseScoreResult,
    branchContributionMap: BranchContributionMap,
    adjustedScores: Record<FiveElement, number>,
    lockedBranches: BranchLockMap,
    applications: BranchMutationApplication[],
  ): void {
    rules.forEach((rule) => {
      const involvedIndexes = this.findAvailableIndexes(rule.branches, baseScore, lockedBranches);
      if (!involvedIndexes || !rule.penaltyRatio) {
        return;
      }

      const elementDelta: Partial<Record<FiveElement, number>> = {};
      let totalPenalty = 0;

      involvedIndexes.forEach((index) => {
        const branch = baseScore.baziInput[index] as Branch;
        const dominantElement = getBranchDominantElement(branch);
        const plannedPenalty = roundValue(
          (branchContributionMap[index][dominantElement] || 0) * rule.penaltyRatio!,
        );
        const actualPenalty = this.applyDeduction(adjustedScores, dominantElement, plannedPenalty);
        totalPenalty = roundValue(totalPenalty + actualPenalty);
        addElementDelta(elementDelta, dominantElement, -actualPenalty);
      });

      this.lockIndexes(involvedIndexes, lockedBranches);
      applications.push({
        label: rule.label,
        priority: rule.priority,
        mutationType: rule.mutationType,
        involvedIndexes,
        involvedBranches: involvedIndexes.map((index) => baseScore.baziInput[index] as Branch),
        penaltyRatio: rule.penaltyRatio,
        totalTransferred: 0,
        totalBonus: 0,
        totalPenalty,
        lockedIndexesAfterApply: this.getLockedIndexes(lockedBranches),
        elementDelta: this.normalizeElementDelta(elementDelta),
      });
    });
  }

  private applyBoundPenaltyRule(
    rule: BranchMutationRule,
    baseScore: BaseScoreResult,
    branchContributionMap: BranchContributionMap,
    adjustedScores: Record<FiveElement, number>,
    lockedBranches: BranchLockMap,
    applications: BranchMutationApplication[],
    involvedIndexes: BranchScoreIndex[],
  ): void {
    const elementDelta: Partial<Record<FiveElement, number>> = {};
    let totalPenalty = 0;

    involvedIndexes.forEach((index) => {
      const breakdown = branchContributionMap[index];
      ELEMENT_KEYS.forEach((element) => {
        const plannedPenalty = roundValue((breakdown[element] || 0) * 0.2);
        if (plannedPenalty === 0) {
          return;
        }

        const actualPenalty = this.applyDeduction(adjustedScores, element, plannedPenalty);
        totalPenalty = roundValue(totalPenalty + actualPenalty);
        addElementDelta(elementDelta, element, -actualPenalty);
      });
    });

    this.lockIndexes(involvedIndexes, lockedBranches);
    applications.push({
      label: `${rule.label}（合绊）`,
      priority: rule.priority,
      mutationType: rule.mutationType,
      involvedIndexes,
      involvedBranches: involvedIndexes.map((index) => baseScore.baziInput[index] as Branch),
      targetElement: rule.targetElement,
      totalTransferred: 0,
      totalBonus: 0,
      totalPenalty,
      penaltyRatio: 0.2,
      lockedIndexesAfterApply: this.getLockedIndexes(lockedBranches),
      elementDelta: this.normalizeElementDelta(elementDelta),
    });
  }

  private buildBranchContributionMap(baseScore: BaseScoreResult): BranchContributionMap {
    return BRANCH_SCORE_INDEXES.reduce<BranchContributionMap>((result, index) => {
      const contribution = baseScore.contributions.find(
        (item) => item.index === index && item.sourceType === 'branch',
      );
      result[index] = contribution?.elementBreakdown || {};
      return result;
    }, { 1: {}, 3: {}, 5: {}, 7: {} });
  }

  private findAvailableIndexes(
    ruleBranches: readonly Branch[],
    baseScore: BaseScoreResult,
    lockedBranches: BranchLockMap,
  ): BranchScoreIndex[] | null {
    const matchedIndexes: BranchScoreIndex[] = [];

    for (const ruleBranch of ruleBranches) {
      const match = BRANCH_SCORE_INDEXES.find((index) => {
        if (lockedBranches[index] || matchedIndexes.includes(index)) {
          return false;
        }
        return baseScore.baziInput[index] === ruleBranch;
      });

      if (match === undefined) {
        return null;
      }

      matchedIndexes.push(match);
    }

    return matchedIndexes;
  }

  private isMonthOrderVetoed(
    targetElement: FiveElement,
    monthBranchDominantElement: FiveElement,
  ): boolean {
    return getDestroyedElement(monthBranchDominantElement) === targetElement;
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

  private lockIndexes(indexes: BranchScoreIndex[], lockedBranches: BranchLockMap): void {
    indexes.forEach((index) => {
      lockedBranches[index] = true;
    });
  }

  private getLockedIndexes(lockedBranches: BranchLockMap): BranchScoreIndex[] {
    return BRANCH_SCORE_INDEXES.filter((index) => lockedBranches[index]);
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
