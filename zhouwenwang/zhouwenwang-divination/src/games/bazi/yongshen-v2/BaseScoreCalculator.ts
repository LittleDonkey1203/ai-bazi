import {
  BRANCH_SCORE_INDEXES,
  ELEMENT_KEYS,
  HIDDEN_STEMS,
  POSITION_LABELS,
  POSITION_WEIGHTS,
  STEM_SCORE_INDEXES,
  STEMS,
} from './constants';
import type {
  BaziInput,
  BaseScoreResult,
  Branch,
  FiveElement,
  ScoreContribution,
  Stem,
  StemScoreIndex,
} from './types';

function createEmptyScores(): Record<FiveElement, number> {
  return {
    金: 0,
    木: 0,
    水: 0,
    火: 0,
    土: 0,
  };
}

function roundValue(value: number): number {
  return Number(value.toFixed(4));
}

export class BaseScoreCalculator {
  public calculateBaseScore(baziInput: BaziInput): BaseScoreResult {
    const scores = createEmptyScores();
    const contributions: ScoreContribution[] = [];

    STEM_SCORE_INDEXES.forEach((index) => {
      contributions.push(this.calculateStemContribution(index, baziInput[index] as Stem, scores));
    });

    BRANCH_SCORE_INDEXES.forEach((index) => {
      contributions.push(this.calculateBranchContribution(index, baziInput[index] as Branch, scores));
    });

    return {
      baziInput,
      scores: this.cloneScores(scores),
      contributions,
    };
  }

  public calculateStemContribution(
    index: StemScoreIndex,
    stem: Stem,
    scores: Record<FiveElement, number>,
  ): ScoreContribution {
    const weight = POSITION_WEIGHTS[index];
    const element = STEMS[stem];
    const elementBreakdown: Partial<Record<FiveElement, number>> = {
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

  public calculateBranchContribution(
    index: 1 | 3 | 5 | 7,
    branch: Branch,
    scores: Record<FiveElement, number>,
  ): ScoreContribution {
    const weight = POSITION_WEIGHTS[index];
    const hiddenElements = HIDDEN_STEMS[branch];
    const elementBreakdown: Partial<Record<FiveElement, number>> = {};

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

  private cloneScores(scores: Record<FiveElement, number>): Record<FiveElement, number> {
    return {
      金: scores.金,
      木: scores.木,
      水: scores.水,
      火: scores.火,
      土: scores.土,
    };
  }
}
