import { HIDDEN_STEMS, ROOT_CHECK_STEM_INDEXES, STEMS } from './constants';
import type {
  BaziInput,
  BaseScoreResult,
  Branch,
  FiveElement,
  RootCheckStemIndex,
  RootingCheckResult,
  RootingVerificationResult,
  ScoreContribution,
  Stem,
} from './types';

function roundValue(value: number): number {
  return Number(value.toFixed(4));
}

export class RootingVerifier {
  public applyRootingPenalty(baseScore: BaseScoreResult): RootingVerificationResult {
    const adjustedScores = this.cloneScores(baseScore.scores);
    const checks = ROOT_CHECK_STEM_INDEXES.map((stemIndex) =>
      this.verifySingleStemRoot(stemIndex, baseScore.baziInput, baseScore.contributions, adjustedScores),
    );

    return {
      baseScore,
      adjustedScores,
      checks,
    };
  }

  public verifySingleStemRoot(
    stemIndex: RootCheckStemIndex,
    baziInput: BaziInput,
    contributions: ScoreContribution[],
    adjustedScores: Record<FiveElement, number>,
  ): RootingCheckResult {
    const stem = baziInput[stemIndex] as Stem;
    const element = STEMS[stem];
    const supportingBranches = this.findSupportingBranches(element, baziInput);
    const rooted = supportingBranches.length > 0;
    const stemContribution = this.findStemContribution(stemIndex, contributions);
    const penaltyApplied = rooted ? 0 : roundValue(stemContribution / 2);

    if (penaltyApplied > 0) {
      adjustedScores[element] = roundValue(adjustedScores[element] - penaltyApplied);
    }

    return {
      stemIndex,
      stem,
      element,
      rooted,
      stemOriginalScore: stemContribution,
      penaltyApplied,
      supportingBranches,
    };
  }

  private findSupportingBranches(element: FiveElement, baziInput: BaziInput): Branch[] {
    const branchIndexes: Array<1 | 3 | 5 | 7> = [1, 3, 5, 7];
    return branchIndexes
      .map((branchIndex) => baziInput[branchIndex] as Branch)
      .filter((branch) => {
        const hidden = HIDDEN_STEMS[branch];
        return Object.prototype.hasOwnProperty.call(hidden, element);
      });
  }

  private findStemContribution(stemIndex: RootCheckStemIndex, contributions: ScoreContribution[]): number {
    const stemContribution = contributions.find((item) => item.index === stemIndex && item.sourceType === 'stem');
    if (!stemContribution) {
      return 0;
    }

    return Object.values(stemContribution.elementBreakdown).reduce((total, value) => total + (value || 0), 0);
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
