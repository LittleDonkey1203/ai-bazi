import { getWuxing } from '../../utils/ganzhiUtils';
import {
  getWuxingAnalysisFromCantian,
  type CantianBaziDetail,
  type CantianPillarDetail,
} from './cantianAdapter';

export type FiveElement = '木' | '火' | '土' | '金' | '水';
export type PillarKey = '年柱' | '月柱' | '日柱' | '时柱';
export type StrengthLevel = '身强' | '偏强' | '中和' | '偏弱' | '身弱';
export type SchoolName = '扶抑' | '调候' | '格局' | '病药通关';
export type PatternCategory = 'special_pattern' | 'ordinary_pattern';

export interface YongShenRuleDefinition {
  id: string;
  label: string;
  category: PatternCategory;
  priority: number;
  description: string;
  implementationStatus: 'skeleton' | 'active';
}

export interface YongShenScoringRules {
  monthCommandWeight: number;
  visibleStemWeights: Partial<Record<PillarKey, number>>;
  branchWeights: Partial<Record<PillarKey, number>>;
  hiddenStemWeights: {
    主气: number;
    中气: number;
    余气: number;
  };
  thresholds: {
    strong: number;
    slightlyStrong: number;
    slightlyWeak: number;
    weak: number;
  };
}

export interface YongShenClimateRule {
  season: string;
  primaryNeed: FiveElement[];
  description: string;
}

export interface YongShenEvidence {
  ruleId: string;
  summary: string;
  scoreDelta?: number;
}

export interface YongShenPatternDecision {
  ruleId: string;
  label: string;
  passed: boolean;
  confidence: number;
  evidence: string[];
}

export interface YongShenStrengthDecision {
  score: number;
  level: StrengthLevel;
  dayMaster: string;
  dayMasterElement: FiveElement;
  monthBranch: string;
  monthBranchElement: FiveElement;
  supportingElements: FiveElement[];
  drainingElements: FiveElement[];
  evidence: YongShenEvidence[];
}

export interface YongShenClimateDecision {
  season: string;
  primaryNeed: FiveElement[];
  coldScore: number;
  hotScore: number;
  dryScore: number;
  dampScore: number;
  evidence: YongShenEvidence[];
}

export interface YongShenSchoolDecision {
  school: SchoolName;
  useful: FiveElement[];
  avoided: FiveElement[];
  confidence: number;
  evidence: YongShenEvidence[];
}

export interface YongShenSynthesis {
  primaryYongShen: FiveElement[];
  secondaryYongShen: FiveElement[];
  xiShen: FiveElement[];
  jiShen: FiveElement[];
  confidence: number;
  notes: string[];
}

export interface YongShenEngineResult {
  version: 'yongshen-engine-v1';
  inputSummary: {
    dayMaster: string;
    monthBranch: string;
    monthBranchElement: FiveElement;
    baziText: string;
    wuxingCount: Record<FiveElement, number>;
  };
  candidatePatterns: YongShenPatternDecision[];
  specialPattern: YongShenPatternDecision | null;
  strength: YongShenStrengthDecision;
  climate: YongShenClimateDecision;
  structureTags: string[];
  schoolResults: {
    fuyi: YongShenSchoolDecision;
    tiaohou: YongShenSchoolDecision;
    geju: YongShenSchoolDecision;
    tongguan: YongShenSchoolDecision;
  };
  synthesis: YongShenSynthesis;
  evidence: string[];
  notes: string[];
}

interface NormalizedChartContext {
  raw: CantianBaziDetail;
  dayMaster: string;
  dayMasterElement: FiveElement;
  monthBranch: string;
  monthBranchElement: FiveElement;
  season: string;
  pillars: Record<PillarKey, CantianPillarDetail>;
  wuxingCount: Record<FiveElement, number>;
  structureTags: string[];
}

const GENERATES: Record<FiveElement, FiveElement> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
};

const CONTROLS: Record<FiveElement, FiveElement> = {
  木: '土',
  火: '金',
  土: '水',
  金: '木',
  水: '火',
};

const SEASON_BY_BRANCH: Record<string, string> = {
  寅: '春',
  卯: '春',
  辰: '春末',
  巳: '夏',
  午: '夏',
  未: '长夏',
  申: '秋',
  酉: '秋',
  戌: '秋末',
  亥: '冬',
  子: '冬',
  丑: '冬末',
};

export const YONGSHEN_SPECIAL_PATTERN_RULES: YongShenRuleDefinition[] = [
  {
    id: 'cong_strong',
    label: '从强格',
    category: 'special_pattern',
    priority: 100,
    description: '日主极旺，印比成势，财官食伤难以制衡时优先考虑从强。',
    implementationStatus: 'skeleton',
  },
  {
    id: 'cong_weak',
    label: '从弱格',
    category: 'special_pattern',
    priority: 95,
    description: '日主极弱，财官食伤成势，印比无法扶起时优先考虑从弱。',
    implementationStatus: 'skeleton',
  },
  {
    id: 'cong_cai',
    label: '从财格',
    category: 'special_pattern',
    priority: 90,
    description: '财星独旺且日主无根无助时，先判是否从财。',
    implementationStatus: 'skeleton',
  },
  {
    id: 'cong_guan_sha',
    label: '从官杀格',
    category: 'special_pattern',
    priority: 88,
    description: '官杀成势且日主难任，先判是否从官杀。',
    implementationStatus: 'skeleton',
  },
  {
    id: 'cong_er',
    label: '从儿格',
    category: 'special_pattern',
    priority: 86,
    description: '食伤成势而日主转从时，转入从儿判法。',
    implementationStatus: 'skeleton',
  },
  {
    id: 'hua_qi',
    label: '化气格',
    category: 'special_pattern',
    priority: 92,
    description: '天干合化与月令司权同时成立时，需单独走化气判法。',
    implementationStatus: 'skeleton',
  },
  {
    id: 'zhuan_wang',
    label: '专旺格',
    category: 'special_pattern',
    priority: 91,
    description: '一气专旺且杂气不破时，优先走专旺取用。',
    implementationStatus: 'skeleton',
  },
];

export const YONGSHEN_STRENGTH_RULES: YongShenScoringRules = {
  monthCommandWeight: 24,
  visibleStemWeights: {
    年柱: 8,
    月柱: 14,
    时柱: 8,
  },
  branchWeights: {
    年柱: 7,
    日柱: 10,
    时柱: 7,
  },
  hiddenStemWeights: {
    主气: 4,
    中气: 2.5,
    余气: 1.5,
  },
  thresholds: {
    strong: 35,
    slightlyStrong: 12,
    slightlyWeak: -12,
    weak: -35,
  },
};

export const YONGSHEN_CLIMATE_RULES: YongShenClimateRule[] = [
  { season: '春', primaryNeed: ['火', '土'], description: '春木渐旺，先看火暖土培。' },
  { season: '春末', primaryNeed: ['火', '土'], description: '春末湿重，先火后土。' },
  { season: '夏', primaryNeed: ['水', '金'], description: '夏火炎燥，先水润再看金助。' },
  { season: '长夏', primaryNeed: ['水', '金'], description: '长夏土燥夹湿，先水后金。' },
  { season: '秋', primaryNeed: ['火', '水'], description: '秋金肃杀，常先火炼再看水润。' },
  { season: '秋末', primaryNeed: ['火', '水'], description: '秋末燥重，先火通关再水润。' },
  { season: '冬', primaryNeed: ['火', '土'], description: '冬水寒重，先火暖再土实。' },
  { season: '冬末', primaryNeed: ['火', '土'], description: '冬末寒湿，先火后土。' },
];

export const YONGSHEN_SYNTHESIS_WEIGHTS = {
  fuyi: 0.4,
  tiaohou: 0.3,
  geju: 0.2,
  tongguan: 0.1,
} as const;

function toFiveElement(value: string): FiveElement {
  if (value === '木' || value === '火' || value === '土' || value === '金' || value === '水') {
    return value;
  }

  const normalized = getWuxing(value);
  if (normalized === '木' || normalized === '火' || normalized === '土' || normalized === '金' || normalized === '水') {
    return normalized;
  }

  return '土';
}

function getGeneratedBy(element: FiveElement): FiveElement {
  return (Object.entries(GENERATES).find(([, target]) => target === element)?.[0] || '木') as FiveElement;
}

function getControlledBy(element: FiveElement): FiveElement {
  return (Object.entries(CONTROLS).find(([, target]) => target === element)?.[0] || '木') as FiveElement;
}

function getElementRelationScore(other: FiveElement, dayMaster: FiveElement): number {
  if (other === dayMaster) {
    return 1;
  }
  if (GENERATES[other] === dayMaster) {
    return 0.9;
  }
  if (GENERATES[dayMaster] === other) {
    return -0.55;
  }
  if (CONTROLS[dayMaster] === other) {
    return -0.7;
  }
  if (CONTROLS[other] === dayMaster) {
    return -1;
  }
  return 0;
}

function getSeason(monthBranch: string): string {
  return SEASON_BY_BRANCH[monthBranch] || '四季平';
}

function getPillars(raw: CantianBaziDetail): Record<PillarKey, CantianPillarDetail> {
  return {
    年柱: raw.年柱,
    月柱: raw.月柱,
    日柱: raw.日柱,
    时柱: raw.时柱,
  };
}

function detectStructureTags(context: NormalizedChartContext): string[] {
  const visibleGods = (Object.values(context.pillars) as CantianPillarDetail[])
    .map((pillar) => pillar.天干.十神)
    .filter((value): value is string => Boolean(value));
  const tags: string[] = [];

  if (visibleGods.includes('正官') && (visibleGods.includes('正印') || visibleGods.includes('偏印'))) {
    tags.push('官印相生');
  }
  if (visibleGods.includes('七杀') && (visibleGods.includes('正印') || visibleGods.includes('偏印'))) {
    tags.push('杀印相生');
  }
  if ((visibleGods.includes('食神') || visibleGods.includes('伤官')) && (visibleGods.includes('正财') || visibleGods.includes('偏财'))) {
    tags.push('食伤生财');
  }
  if ((visibleGods.includes('正财') || visibleGods.includes('偏财')) && (visibleGods.includes('正官') || visibleGods.includes('七杀'))) {
    tags.push('财官同路');
  }
  if ((visibleGods.includes('比肩') || visibleGods.includes('劫财')) && (visibleGods.includes('正财') || visibleGods.includes('偏财'))) {
    tags.push('比劫分财');
  }
  if (visibleGods.includes('伤官') && (visibleGods.includes('正官') || visibleGods.includes('七杀'))) {
    tags.push('伤官见官');
  }

  return tags;
}

function normalizeChart(rawBaziData: CantianBaziDetail): NormalizedChartContext {
  const pillars = getPillars(rawBaziData);
  const dayMaster = rawBaziData.日主;
  const dayMasterElement = toFiveElement(dayMaster);
  const monthBranch = rawBaziData.月柱.地支.地支;
  const monthBranchElement = toFiveElement(rawBaziData.月柱.地支.五行);
  const season = getSeason(monthBranch);
  const baseWuxingCount = getWuxingAnalysisFromCantian(rawBaziData);
  const wuxingCount: Record<FiveElement, number> = {
    木: baseWuxingCount.木 || 0,
    火: baseWuxingCount.火 || 0,
    土: baseWuxingCount.土 || 0,
    金: baseWuxingCount.金 || 0,
    水: baseWuxingCount.水 || 0,
  };

  const context: NormalizedChartContext = {
    raw: rawBaziData,
    dayMaster,
    dayMasterElement,
    monthBranch,
    monthBranchElement,
    season,
    pillars,
    wuxingCount,
    structureTags: [],
  };

  context.structureTags = detectStructureTags(context);
  return context;
}

function detectSpecialPattern(context: NormalizedChartContext, strength: YongShenStrengthDecision): YongShenPatternDecision[] {
  const supportiveCount = strength.supportingElements.reduce((total, element) => total + (context.wuxingCount[element] || 0), 0);
  const drainingCount = strength.drainingElements.reduce((total, element) => total + (context.wuxingCount[element] || 0), 0);

  return YONGSHEN_SPECIAL_PATTERN_RULES.map((rule) => {
    if (rule.id === 'cong_strong') {
      const passed = strength.score >= 55 && supportiveCount >= drainingCount * 2;
      return {
        ruleId: rule.id,
        label: rule.label,
        passed,
        confidence: passed ? 0.72 : 0.18,
        evidence: [
          `日主强弱分 ${strength.score}，扶身五行计数 ${supportiveCount}，耗泄克制计数 ${drainingCount}。`,
          passed ? '已接近从强判法的门槛，后续需补“是否有根、有破格”细则。' : '暂不满足从强门槛。',
        ],
      };
    }

    if (rule.id === 'cong_weak') {
      const passed = strength.score <= -55 && drainingCount >= supportiveCount * 2;
      return {
        ruleId: rule.id,
        label: rule.label,
        passed,
        confidence: passed ? 0.72 : 0.18,
        evidence: [
          `日主强弱分 ${strength.score}，耗泄克制计数 ${drainingCount}，扶身五行计数 ${supportiveCount}。`,
          passed ? '已接近从弱判法的门槛，后续需补“印比是否真无力”细则。' : '暂不满足从弱门槛。',
        ],
      };
    }

    return {
      ruleId: rule.id,
      label: rule.label,
      passed: false,
      confidence: 0.15,
      evidence: [`${rule.label} 当前仅落了规则表与接口，细则判定待补。`],
    };
  });
}

function analyzeStrength(context: NormalizedChartContext): YongShenStrengthDecision {
  const evidence: YongShenEvidence[] = [];
  let score = 0;

  const pushEvidence = (ruleId: string, summary: string, scoreDelta: number) => {
    score += scoreDelta;
    evidence.push({ ruleId, summary, scoreDelta: Number(scoreDelta.toFixed(2)) });
  };

  const monthDelta = getElementRelationScore(context.monthBranchElement, context.dayMasterElement) * YONGSHEN_STRENGTH_RULES.monthCommandWeight;
  pushEvidence(
    'strength.month_command',
    `月令 ${context.monthBranch}${context.monthBranchElement} 对日主 ${context.dayMaster}${context.dayMasterElement} 的作用分 ${monthDelta.toFixed(2)}。`,
    monthDelta,
  );

  (Object.entries(YONGSHEN_STRENGTH_RULES.visibleStemWeights) as Array<[PillarKey, number]>).forEach(([pillar, weight]) => {
    const stem = context.pillars[pillar].天干.天干;
    const relation = getElementRelationScore(toFiveElement(stem), context.dayMasterElement);
    const delta = relation * weight;
    if (delta !== 0) {
      pushEvidence(
        `strength.visible_stem.${pillar}`,
        `${pillar}天干 ${stem} 对日主的作用分 ${delta.toFixed(2)}。`,
        delta,
      );
    }
  });

  (Object.entries(YONGSHEN_STRENGTH_RULES.branchWeights) as Array<[PillarKey, number]>).forEach(([pillar, weight]) => {
    const branchElement = toFiveElement(context.pillars[pillar].地支.五行);
    const relation = getElementRelationScore(branchElement, context.dayMasterElement);
    const delta = relation * weight;
    if (delta !== 0) {
      pushEvidence(
        `strength.branch.${pillar}`,
        `${pillar}地支 ${context.pillars[pillar].地支.地支}${branchElement} 对日主的作用分 ${delta.toFixed(2)}。`,
        delta,
      );
    }
  });

  (Object.keys(context.pillars) as PillarKey[]).forEach((pillar) => {
    (Object.entries(YONGSHEN_STRENGTH_RULES.hiddenStemWeights) as Array<['主气' | '中气' | '余气', number]>).forEach(([layer, weight]) => {
      const hiddenStem = context.pillars[pillar].地支.藏干?.[layer]?.天干;
      if (!hiddenStem) {
        return;
      }
      const relation = getElementRelationScore(toFiveElement(hiddenStem), context.dayMasterElement);
      const delta = relation * weight;
      if (delta !== 0) {
        pushEvidence(
          `strength.hidden_stem.${pillar}.${layer}`,
          `${pillar}${layer} ${hiddenStem} 对日主的作用分 ${delta.toFixed(2)}。`,
          delta,
        );
      }
    });
  });

  let level: StrengthLevel = '中和';
  if (score >= YONGSHEN_STRENGTH_RULES.thresholds.strong) {
    level = '身强';
  } else if (score >= YONGSHEN_STRENGTH_RULES.thresholds.slightlyStrong) {
    level = '偏强';
  } else if (score <= YONGSHEN_STRENGTH_RULES.thresholds.weak) {
    level = '身弱';
  } else if (score <= YONGSHEN_STRENGTH_RULES.thresholds.slightlyWeak) {
    level = '偏弱';
  }

  return {
    score: Number(score.toFixed(2)),
    level,
    dayMaster: context.dayMaster,
    dayMasterElement: context.dayMasterElement,
    monthBranch: context.monthBranch,
    monthBranchElement: context.monthBranchElement,
    supportingElements: [context.dayMasterElement, getGeneratedBy(context.dayMasterElement)],
    drainingElements: [
      GENERATES[context.dayMasterElement],
      CONTROLS[context.dayMasterElement],
      getControlledBy(context.dayMasterElement),
    ],
    evidence,
  };
}

function analyzeClimate(context: NormalizedChartContext): YongShenClimateDecision {
  const climateRule = YONGSHEN_CLIMATE_RULES.find((rule) => rule.season === context.season) || YONGSHEN_CLIMATE_RULES[0];
  const coldScore = context.season.startsWith('冬') ? 4 : context.wuxingCount.水 + context.wuxingCount.金;
  const hotScore = context.season.startsWith('夏') || context.season === '长夏' ? 4 : context.wuxingCount.火;
  const dryScore = context.wuxingCount.金 + (context.season.startsWith('秋') ? 2 : 0);
  const dampScore = context.wuxingCount.水 + context.wuxingCount.土 + (context.season === '春末' || context.season === '冬末' ? 1 : 0);

  return {
    season: context.season,
    primaryNeed: climateRule.primaryNeed,
    coldScore,
    hotScore,
    dryScore,
    dampScore,
    evidence: [
      {
        ruleId: 'climate.season',
        summary: `月令 ${context.monthBranch} 落在 ${context.season}，调候优先看 ${climateRule.primaryNeed.join('、')}。`,
      },
      {
        ruleId: 'climate.profile',
        summary: `寒热燥湿简表：寒 ${coldScore} / 热 ${hotScore} / 燥 ${dryScore} / 湿 ${dampScore}。`,
      },
    ],
  };
}

function analyzeFuyiSchool(context: NormalizedChartContext, strength: YongShenStrengthDecision, climate: YongShenClimateDecision): YongShenSchoolDecision {
  const resourceElement = getGeneratedBy(context.dayMasterElement);
  const outputElement = GENERATES[context.dayMasterElement];
  const wealthElement = CONTROLS[context.dayMasterElement];
  const officialElement = getControlledBy(context.dayMasterElement);

  let useful: FiveElement[];
  let avoided: FiveElement[];
  let confidence = 0.68;
  let summary = '按扶抑中和处理。';

  if (strength.level === '身强' || strength.level === '偏强') {
    useful = [outputElement, wealthElement, officialElement];
    avoided = [context.dayMasterElement, resourceElement];
    summary = '身强或偏强，优先取泄耗财官。';
  } else if (strength.level === '身弱' || strength.level === '偏弱') {
    useful = [resourceElement, context.dayMasterElement];
    avoided = [outputElement, wealthElement, officialElement];
    summary = '身弱或偏弱，优先取印比扶身。';
    confidence = 0.72;
  } else {
    useful = [climate.primaryNeed[0], outputElement, officialElement];
    avoided = [context.dayMasterElement, resourceElement];
    confidence = 0.55;
  }

  return {
    school: '扶抑',
    useful,
    avoided,
    confidence,
    evidence: [
      { ruleId: 'school.fuyi.level', summary: `强弱判断为 ${strength.level}。` },
      { ruleId: 'school.fuyi.rule', summary },
    ],
  };
}

function analyzeGejuSchool(context: NormalizedChartContext, strength: YongShenStrengthDecision): YongShenSchoolDecision {
  const resourceElement = getGeneratedBy(context.dayMasterElement);
  const outputElement = GENERATES[context.dayMasterElement];
  const wealthElement = CONTROLS[context.dayMasterElement];
  const officialElement = getControlledBy(context.dayMasterElement);

  const useful = new Set<FiveElement>();
  const avoided = new Set<FiveElement>();
  const evidence: YongShenEvidence[] = [];

  if (context.structureTags.includes('官印相生') || context.structureTags.includes('杀印相生')) {
    useful.add(resourceElement);
    useful.add(officialElement);
    evidence.push({ ruleId: 'school.geju.guanyin', summary: '见官印/杀印相生，格局侧重印与官杀的顺生关系。' });
  }
  if (context.structureTags.includes('食伤生财')) {
    useful.add(outputElement);
    useful.add(wealthElement);
    evidence.push({ ruleId: 'school.geju.shishang', summary: '见食伤生财，格局侧重食伤与财的流转。' });
  }
  if (context.structureTags.includes('比劫分财')) {
    avoided.add(context.dayMasterElement);
    avoided.add(wealthElement);
    evidence.push({ ruleId: 'school.geju.bijie', summary: '见比劫分财，防止比劫过旺夺财。' });
  }
  if (context.structureTags.includes('伤官见官')) {
    avoided.add(officialElement);
    evidence.push({ ruleId: 'school.geju.shangguan', summary: '见伤官见官，官星不宜再受冲击。' });
  }

  if (useful.size === 0) {
    useful.add(strength.supportingElements[0]);
    evidence.push({ ruleId: 'school.geju.default', summary: '未识别到明确成格路径，格局层先回退到主体结构。' });
  }

  return {
    school: '格局',
    useful: [...useful],
    avoided: [...avoided],
    confidence: evidence.length > 1 ? 0.62 : 0.4,
    evidence,
  };
}

function analyzeTongguanSchool(context: NormalizedChartContext): YongShenSchoolDecision {
  const wood = context.wuxingCount.木;
  const fire = context.wuxingCount.火;
  const earth = context.wuxingCount.土;
  const metal = context.wuxingCount.金;
  const water = context.wuxingCount.水;
  const evidence: YongShenEvidence[] = [];
  let useful: FiveElement[] = [];
  let avoided: FiveElement[] = [];

  if (wood > 0 && metal > 0) {
    useful = ['水'];
    evidence.push({ ruleId: 'school.tongguan.metal_wood', summary: '金木对峙时，先看水通关。' });
  } else if (water > 0 && fire > 0) {
    useful = ['木'];
    evidence.push({ ruleId: 'school.tongguan.water_fire', summary: '水火相战时，先看木通关。' });
  } else if (wood > 0 && earth > 0) {
    useful = ['火'];
    evidence.push({ ruleId: 'school.tongguan.wood_earth', summary: '木土相持时，先看火通关。' });
  } else if (earth > 0 && water > 0) {
    useful = ['金'];
    evidence.push({ ruleId: 'school.tongguan.earth_water', summary: '土水互碍时，先看金通关。' });
  } else if (fire > 0 && metal > 0) {
    useful = ['土'];
    evidence.push({ ruleId: 'school.tongguan.fire_metal', summary: '火金交战时，先看土通关。' });
  } else {
    useful = [context.dayMasterElement];
    avoided = [getControlledBy(context.dayMasterElement)];
    evidence.push({ ruleId: 'school.tongguan.default', summary: '未识别到明显交战轴，病药通关层先保守处理。' });
  }

  return {
    school: '病药通关',
    useful,
    avoided,
    confidence: evidence[0]?.ruleId.endsWith('default') ? 0.32 : 0.58,
    evidence,
  };
}

function analyzeTiaohouSchool(climate: YongShenClimateDecision): YongShenSchoolDecision {
  return {
    school: '调候',
    useful: climate.primaryNeed,
    avoided: [],
    confidence: 0.74,
    evidence: climate.evidence,
  };
}

function synthesizeYongShen(
  context: NormalizedChartContext,
  strength: YongShenStrengthDecision,
  candidatePatterns: YongShenPatternDecision[],
  schoolResults: YongShenEngineResult['schoolResults'],
): YongShenSynthesis {
  const activePattern = candidatePatterns.find((item) => item.passed) || null;
  if (activePattern?.ruleId === 'cong_strong') {
    return {
      primaryYongShen: strength.supportingElements.slice(0, 2),
      secondaryYongShen: [GENERATES[context.dayMasterElement]],
      xiShen: strength.supportingElements.slice(0, 2),
      jiShen: strength.drainingElements.slice(0, 2),
      confidence: 0.78,
      notes: ['特殊格局命中从强候选，当前综合层先按从强口径返回。'],
    };
  }

  if (activePattern?.ruleId === 'cong_weak') {
    return {
      primaryYongShen: strength.drainingElements.slice(0, 2),
      secondaryYongShen: [getControlledBy(context.dayMasterElement)],
      xiShen: strength.drainingElements.slice(0, 2),
      jiShen: strength.supportingElements.slice(0, 2),
      confidence: 0.78,
      notes: ['特殊格局命中从弱候选，当前综合层先按从弱口径返回。'],
    };
  }

  const weightMap = new Map<FiveElement, number>();
  const addWeight = (elements: FiveElement[], weight: number) => {
    elements.forEach((element, index) => {
      const rankWeight = Math.max(weight - index * 0.15, 0.05);
      weightMap.set(element, (weightMap.get(element) || 0) + rankWeight);
    });
  };

  addWeight(schoolResults.fuyi.useful, YONGSHEN_SYNTHESIS_WEIGHTS.fuyi);
  addWeight(schoolResults.tiaohou.useful, YONGSHEN_SYNTHESIS_WEIGHTS.tiaohou);
  addWeight(schoolResults.geju.useful, YONGSHEN_SYNTHESIS_WEIGHTS.geju);
  addWeight(schoolResults.tongguan.useful, YONGSHEN_SYNTHESIS_WEIGHTS.tongguan);

  schoolResults.fuyi.avoided.forEach((element) => weightMap.set(element, (weightMap.get(element) || 0) - 0.3));
  schoolResults.geju.avoided.forEach((element) => weightMap.set(element, (weightMap.get(element) || 0) - 0.15));
  schoolResults.tongguan.avoided.forEach((element) => weightMap.set(element, (weightMap.get(element) || 0) - 0.1));

  const ranking = (['木', '火', '土', '金', '水'] as FiveElement[])
    .map((element) => ({ element, score: weightMap.get(element) || 0 }))
    .sort((left, right) => right.score - left.score);

  const positive = ranking.filter((item) => item.score > 0);
  const negative = [...ranking].reverse().filter((item) => item.score <= 0);
  const consistency =
    schoolResults.fuyi.useful.some((element) => schoolResults.tiaohou.useful.includes(element))
    || schoolResults.fuyi.useful.some((element) => schoolResults.geju.useful.includes(element));

  return {
    primaryYongShen: positive.slice(0, 1).map((item) => item.element),
    secondaryYongShen: positive.slice(1, 3).map((item) => item.element),
    xiShen: positive.slice(0, 3).map((item) => item.element),
    jiShen: negative.slice(0, 2).map((item) => item.element),
    confidence: consistency ? 0.74 : 0.58,
    notes: [
      `综合权重采用 扶抑 ${YONGSHEN_SYNTHESIS_WEIGHTS.fuyi} / 调候 ${YONGSHEN_SYNTHESIS_WEIGHTS.tiaohou} / 格局 ${YONGSHEN_SYNTHESIS_WEIGHTS.geju} / 病药通关 ${YONGSHEN_SYNTHESIS_WEIGHTS.tongguan}。`,
      consistency ? '扶抑与其他门派存在交集，综合置信度较高。' : '各门派取用存在分歧，后续应补更细的格局和盲派校验。',
    ],
  };
}

export function analyzeYongShen(rawBaziData: CantianBaziDetail): YongShenEngineResult {
  const context = normalizeChart(rawBaziData);
  const strength = analyzeStrength(context);
  const candidatePatterns = detectSpecialPattern(context, strength);
  const climate = analyzeClimate(context);
  const schoolResults = {
    fuyi: analyzeFuyiSchool(context, strength, climate),
    tiaohou: analyzeTiaohouSchool(climate),
    geju: analyzeGejuSchool(context, strength),
    tongguan: analyzeTongguanSchool(context),
  };
  const synthesis = synthesizeYongShen(context, strength, candidatePatterns, schoolResults);
  const specialPattern = candidatePatterns.find((item) => item.passed) || null;

  return {
    version: 'yongshen-engine-v1',
    inputSummary: {
      dayMaster: context.dayMaster,
      monthBranch: context.monthBranch,
      monthBranchElement: context.monthBranchElement,
      baziText: rawBaziData.八字,
      wuxingCount: context.wuxingCount,
    },
    candidatePatterns,
    specialPattern,
    strength,
    climate,
    structureTags: context.structureTags,
    schoolResults,
    synthesis,
    evidence: [
      ...strength.evidence.map((item) => item.summary),
      ...climate.evidence.map((item) => item.summary),
      ...schoolResults.fuyi.evidence.map((item) => item.summary),
      ...schoolResults.geju.evidence.map((item) => item.summary),
      ...schoolResults.tongguan.evidence.map((item) => item.summary),
    ],
    notes: [
      '当前版本先把喜用神从 prompt 中拆出来，形成独立规则引擎。',
      '特殊格局判定目前是保守骨架，后续需要继续补“真从、假从、化气、专旺”的细则。',
      '盲派过三关应在本引擎结果之上继续做体用、宫位与做功校验，而不是反过来决定喜用神。',
    ],
  };
}
