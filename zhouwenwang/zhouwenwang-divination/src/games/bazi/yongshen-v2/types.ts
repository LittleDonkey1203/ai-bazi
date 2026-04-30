export type FiveElement = '金' | '木' | '水' | '火' | '土';

export type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

export type Branch = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';

export type BaziInput = readonly [Stem, Branch, Stem, Branch, Stem, Branch, Stem, Branch];

export type BaziIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type StemScoreIndex = 0 | 2 | 4 | 6;
export type RootCheckStemIndex = 0 | 2 | 6;
export type BranchScoreIndex = 1 | 3 | 5 | 7;
export type AdjacentStemPair = readonly [0 | 2 | 4, 2 | 4 | 6];
export type BranchMutationPriority = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6';
export type BranchMutationType =
  | 'three-meeting'
  | 'three-harmony'
  | 'half-harmony'
  | 'six-combination'
  | 'same-clash'
  | 'opposing-clash'
  | 'three-punishment'
  | 'six-harm';
export type SeasonalState = '旺' | '相' | '休' | '囚' | '死';
export type PatternType =
  | '化气格'
  | '专旺格'
  | '假专旺格'
  | '从格'
  | '假从格'
  | '身旺格'
  | '身弱格';
export type ClimateAdjustmentType = 'winter-fire-first' | 'summer-water-first';

export interface ScoreContribution {
  index: BaziIndex;
  label: string;
  sourceType: 'stem' | 'branch';
  source: Stem | Branch;
  weight: number;
  elementBreakdown: Partial<Record<FiveElement, number>>;
}

export interface BaseScoreResult {
  baziInput: BaziInput;
  scores: Record<FiveElement, number>;
  contributions: ScoreContribution[];
}

export interface RootingCheckResult {
  stemIndex: RootCheckStemIndex;
  stem: Stem;
  element: FiveElement;
  rooted: boolean;
  stemOriginalScore: number;
  penaltyApplied: number;
  supportingBranches: Branch[];
}

export interface RootingVerificationResult {
  baseScore: BaseScoreResult;
  adjustedScores: Record<FiveElement, number>;
  checks: RootingCheckResult[];
}

export interface Step1To3AnalysisResult {
  baseScore: BaseScoreResult;
  rooting: RootingVerificationResult;
  finalScores: Record<FiveElement, number>;
  totalScore: number;
}

export interface StemCombinationRule {
  stems: readonly [Stem, Stem];
  targetElement: FiveElement;
}

export interface StemCombinationApplication {
  pairIndexes: AdjacentStemPair;
  stems: readonly [Stem, Stem];
  sourceElements: readonly [FiveElement, FiveElement];
  targetElement: FiveElement;
  monthBranchDominantElement: FiveElement;
  transferRatio: number;
  boostedByMonthBranch: boolean;
  plannedTransfer: number;
  actualTransfer: number;
  elementDelta: Partial<Record<FiveElement, number>>;
}

export interface StemCombinationResult {
  inputScores: Record<FiveElement, number>;
  adjustedScores: Record<FiveElement, number>;
  monthBranchDominantElement: FiveElement;
  applications: StemCombinationApplication[];
}

export interface BranchMutationRule {
  label: string;
  branches: readonly Branch[];
  targetElement?: FiveElement;
  transferRatio?: number;
  bonusRatio?: number;
  penaltyRatio?: number;
  mutationType: BranchMutationType;
  priority: BranchMutationPriority;
}

export interface BranchMutationApplication {
  label: string;
  priority: BranchMutationPriority;
  mutationType: BranchMutationType;
  involvedIndexes: BranchScoreIndex[];
  involvedBranches: Branch[];
  targetElement?: FiveElement;
  transferRatio?: number;
  bonusRatio?: number;
  penaltyRatio?: number;
  totalTransferred: number;
  totalBonus: number;
  totalPenalty: number;
  lockedIndexesAfterApply: BranchScoreIndex[];
  elementDelta: Partial<Record<FiveElement, number>>;
}

export interface BranchMutationResult {
  inputScores: Record<FiveElement, number>;
  adjustedScores: Record<FiveElement, number>;
  lockedBranches: Partial<Record<BranchScoreIndex, boolean>>;
  applications: BranchMutationApplication[];
}

export interface Step1To5AnalysisResult {
  baseScore: BaseScoreResult;
  rooting: RootingVerificationResult;
  stemCombinations: StemCombinationResult;
  branchMutations: BranchMutationResult;
  finalScores: Record<FiveElement, number>;
  totalScore: number;
}

export interface SeasonalAdjustmentItem {
  element: FiveElement;
  monthBranchDominantElement: FiveElement;
  state: SeasonalState;
  multiplier: number;
  originalScore: number;
  adjustedScore: number;
}

export interface SeasonalAdjustmentResult {
  inputScores: Record<FiveElement, number>;
  adjustedScores: Record<FiveElement, number>;
  monthBranchDominantElement: FiveElement;
  adjustments: SeasonalAdjustmentItem[];
}

export interface Step1To6AnalysisResult {
  baseScore: BaseScoreResult;
  rooting: RootingVerificationResult;
  stemCombinations: StemCombinationResult;
  branchMutations: BranchMutationResult;
  seasonalAdjustment: SeasonalAdjustmentResult;
  finalScores: Record<FiveElement, number>;
  totalScore: number;
}

export interface TransformationBlockingStem {
  index: StemScoreIndex;
  stem: Stem;
  element: FiveElement;
}

export interface TransformationCheckResult {
  passed: boolean;
  pairIndexes: AdjacentStemPair | null;
  pairStems: readonly [Stem, Stem] | null;
  targetElement: FiveElement | null;
  monthBranchDominantElement: FiveElement;
  destroyerElement: FiveElement | null;
  blockingStems: TransformationBlockingStem[];
  shortcutYongElements: FiveElement[];
  shortcutJiElements: FiveElement[];
  reasons: string[];
}

export interface PatternClassificationResult {
  inputScores: Record<FiveElement, number>;
  patternType: PatternType;
  originalDayMasterElement: FiveElement;
  effectiveDayMasterElement: FiveElement;
  monthBranchDominantElement: FiveElement;
  tongDangElements: readonly [FiveElement, FiveElement];
  tongDangScore: number;
  yiDangScore: number;
  tongDangRatio: number;
  yiDangRatio: number;
  tongDangPercent: number;
  yiDangPercent: number;
  maxOpposingElement: FiveElement | null;
  maxOpposingPercent: number;
  maxSelfElement: FiveElement | null;
  maxSelfPercent: number;
  transformation: TransformationCheckResult;
}

export interface Step1To7AnalysisResult {
  baseScore: BaseScoreResult;
  rooting: RootingVerificationResult;
  stemCombinations: StemCombinationResult;
  branchMutations: BranchMutationResult;
  seasonalAdjustment: SeasonalAdjustmentResult;
  patternClassification: PatternClassificationResult;
  finalScores: Record<FiveElement, number>;
  totalScore: number;
}

export interface ClimateAdjustmentResult {
  applied: boolean;
  adjustmentType: ClimateAdjustmentType | null;
  insertedYongElement: FiveElement | null;
  forcedJiElement: FiveElement | null;
  reasons: string[];
}

export interface YongShenMappingResult {
  inputScores: Record<FiveElement, number>;
  patternType: PatternType;
  effectiveDayMasterElement: FiveElement;
  maxElement: FiveElement | null;
  yongElements: FiveElement[];
  jiElements: FiveElement[];
  climateAdjustment: ClimateAdjustmentResult;
  notes: string[];
}

export interface Step1To8AnalysisResult {
  baseScore: BaseScoreResult;
  rooting: RootingVerificationResult;
  stemCombinations: StemCombinationResult;
  branchMutations: BranchMutationResult;
  seasonalAdjustment: SeasonalAdjustmentResult;
  patternClassification: PatternClassificationResult;
  yongShenMapping: YongShenMappingResult;
  finalScores: Record<FiveElement, number>;
  totalScore: number;
}
