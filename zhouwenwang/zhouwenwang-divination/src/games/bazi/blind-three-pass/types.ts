export type PillarKey = '年柱' | '月柱' | '日柱' | '时柱';
export type QuestionDomain =
  | 'overall'
  | 'career'
  | 'wealth'
  | 'relationship'
  | 'parents'
  | 'children'
  | 'siblings'
  | 'health';
export type HiddenLayer = '天干' | '主气' | '中气' | '余气';
export type SpecialYearKind = '天克地冲' | '天合地合' | '岁运并临' | '伏吟' | '反吟';
export type LuckTone = '偏吉' | '偏凶' | '吉凶并见';
export type BodyUseMode = '同体取用' | '异体取用' | '待岁运引动';
export type Tendency = '偏助力' | '偏压力' | '吉凶并见';
export type LiuQinKey = 'father' | 'mother' | 'siblings' | 'partner' | 'children';

export type RelationItem = {
  柱: string;
  知识点: string;
  元素?: string;
};

export type RelationGroup = Record<string, RelationItem[]>;
export type RelationSection = {
  天干?: RelationGroup;
  地支?: RelationGroup;
  双冲?: RelationItem[];
  伏吟?: RelationItem[];
};
export type RelationSummary = Partial<Record<string, RelationSection>>;

export interface TenGodOccurrence {
  pillar: PillarKey;
  layer: HiddenLayer;
  god: string;
  stem: string;
}

export interface DomainConfig {
  label: string;
  tenGods: string[];
  palaces: PillarKey[];
}

export interface BlindThreePassYongShenContext {
  finalPattern: string;
  effectiveDayMasterElement: string;
  yongElements: string[];
  jiElements: string[];
  tongDangPercent: number;
  maxSelfElement: string | null;
  maxOpposingElement: string | null;
  climateNotes: string[];
  changedStageLabels: string[];
}

export interface LiuQinConfig {
  key: LiuQinKey;
  label: string;
  tenGods: string[];
  palaces: PillarKey[];
}

export interface SpecialYearHit {
  year: number;
  age: number;
  fortuneGanzhi: string;
  flowGanzhi: string;
  kind: SpecialYearKind;
  score: number;
  tone: LuckTone;
  targetPillars: PillarKey[];
  triggeredTenGods: string[];
  linkedLiuQinLabels: string[];
  matchedRelations: string[];
  annualRelations: string[];
  annualGods: string[];
  supportiveGods: string[];
  cautionGods: string[];
  whyImportant: string[];
  likelyEvents: string[];
}

export interface LiuQinProfile {
  key: LiuQinKey;
  label: string;
  focusTenGods: string[];
  focusPalaces: PillarKey[];
  anchorStrategy: string;
  visibleOccurrences: string[];
  hiddenOccurrences: string[];
  bodyUseMode: BodyUseMode;
  tendency: Tendency;
  palaceRule: string;
  stateRule: string;
  chapterSignals: string[];
  positionSummary: string;
  directCuts: string[];
  highRiskDirectJudgments: string[];
  highRiskEvidenceLines: string[];
  relatedSpecialYears: string[];
}

export interface BlindThreePassAnalysis {
  domain: QuestionDomain;
  domainLabel: string;
  gate1: {
    liJi: string;
    tiReference: string[];
    yongReference: string[];
    focusPalaces: string[];
    keyJudgment: string;
  };
  gate2: {
    relevantTenGods: string[];
    visibleOccurrences: string[];
    hiddenOccurrences: string[];
    bodyUseHint: string;
    palaceAnchors: string[];
  };
  gate3: {
    structureTags: string[];
    currentFortune: string;
    currentFortuneEffect: string;
    directCutNotes: string[];
  };
  specialYears: SpecialYearHit[];
  liuqinProfiles: LiuQinProfile[];
  directConclusions: string[];
  highRiskDisclaimer: string;
}
