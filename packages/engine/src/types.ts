export type TianGan = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

export type DiZhi =
  | '子' | '丑' | '寅' | '卯' | '辰' | '巳'
  | '午' | '未' | '申' | '酉' | '戌' | '亥';

export type WuXing = '金' | '木' | '水' | '火' | '土';

export type YinYang = '阴' | '阳';

export type ShiShen =
  | '比肩' | '劫财' | '食神' | '伤官'
  | '偏财' | '正财' | '七杀' | '正官'
  | '偏印' | '正印';

export type Gender = 'male' | 'female';

export type PillarPosition = 'year' | 'month' | 'day' | 'hour';

export interface BaziInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute?: number;
  gender: Gender;
  timezone?: number;
  longitude?: number;
}

export interface HiddenStemEntry {
  stem: TianGan;
  element: WuXing;
  ratio: number;
  tenGod?: ShiShen;
}

export interface Pillar {
  stem: TianGan;
  branch: DiZhi;
  stemElement: WuXing;
  branchElement: WuXing;
  nayin: string;
  hiddenStems: HiddenStemEntry[];
  tenGod?: ShiShen;
}

export interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
}

export interface DaYun {
  index: number;
  startAge: number;
  endAge: number;
  startYear: number;
  stem: TianGan;
  branch: DiZhi;
  ganZhi: string;
  tenGod: ShiShen;
}

export interface LiuNian {
  year: number;
  age: number;
  stem: TianGan;
  branch: DiZhi;
  ganZhi: string;
  tenGod: ShiShen;
}

export interface WuXingAnalysis {
  counts: Record<WuXing, number>;
  scores: Record<WuXing, number>;
  dayMasterStrength: 'strong' | 'weak' | 'neutral';
  favorableElements: WuXing[];
  unfavorableElements: WuXing[];
}

export type RelationType =
  | '冲' | '刑' | '合' | '会' | '害' | '破'
  | '三合' | '六合' | '三会' | '半合' | '暗合' | '自刑';

export interface Relation {
  type: RelationType;
  positions: PillarPosition[];
  branches: DiZhi[];
  description: string;
}

export interface ChengGu {
  weight: string;
  totalQian: number;
  description: string;
}

export interface KongWang {
  dayKong: [DiZhi, DiZhi];
  yearKong: [DiZhi, DiZhi];
}

export interface ShenShaTable {
  year: string[];
  month: string[];
  day: string[];
  hour: string[];
}

export interface BaziChart {
  input: BaziInput;
  fourPillars: FourPillars;
  wuxing: WuXingAnalysis;
  relations: Relation[];
  dayun: DaYun[];
  liunian: LiuNian[];
  shensha: ShenShaTable;
  kongwang: KongWang;
  mingGong: Pillar;
  taiYuan: Pillar;
  pattern: string;
  chengGu: ChengGu;
}

export class BaziCalculationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'BaziCalculationError';
  }
}
