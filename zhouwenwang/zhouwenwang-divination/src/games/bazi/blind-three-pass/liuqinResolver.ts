import { getGanZhiWuxing, type BaZiChartData } from '../logic';
import { getLiuQinConfigs, LIUQIN_ANCHOR_STRATEGIES } from './knowledge';
import type {
  BlindThreePassYongShenContext,
  BodyUseMode,
  LiuQinProfile,
  PillarKey,
  SpecialYearHit,
  Tendency,
  TenGodOccurrence,
} from './types';

const SHENG_MAP: Record<string, string> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
};

const KE_MAP: Record<string, string> = {
  木: '土',
  火: '金',
  土: '水',
  金: '木',
  水: '火',
};

const STEM_COMBINE_MAP: Record<string, string> = {
  甲: '己',
  己: '甲',
  乙: '庚',
  庚: '乙',
  丙: '辛',
  辛: '丙',
  丁: '壬',
  壬: '丁',
  戊: '癸',
  癸: '戊',
};

const CHANG_SHENG_BRANCH: Record<string, string> = {
  甲: '亥',
  乙: '午',
  丙: '寅',
  丁: '酉',
  戊: '寅',
  己: '酉',
  庚: '巳',
  辛: '子',
  壬: '申',
  癸: '卯',
};

const CHONG_MAP: Record<string, string> = {
  子: '午',
  午: '子',
  丑: '未',
  未: '丑',
  寅: '申',
  申: '寅',
  卯: '酉',
  酉: '卯',
  辰: '戌',
  戌: '辰',
  巳: '亥',
  亥: '巳',
};

const MONTH_STEM_RANK_HINTS: Record<string, string> = {
  甲: '长位或老大',
  己: '长位或老大',
  乙: '老二附近',
  庚: '老二附近',
  丙: '老三附近',
  辛: '老三附近',
  丁: '老四附近',
  壬: '老四附近',
  戊: '老五或更靠后',
  癸: '老五或更靠后',
};

const FOUR_MENG = new Set(['寅', '申', '巳', '亥']);
const PARENT_GODS = new Set(['正印', '偏印', '正财', '偏财']);

type HeadChildHint = {
  tendency: 'boy' | 'girl' | 'mixed';
  confidence: 'low' | 'medium' | 'high';
  boyScore: number;
  girlScore: number;
  reasons: string[];
};

type RankingHint = {
  label: string;
  reason: string;
};

type SiblingCountHint = {
  level: 'thin' | 'some' | 'many';
  siblingCount: number;
  parentSupportCount: number;
  text: string;
};

type TwinHint = {
  score: number;
  reasons: string[];
};

type HeadChildYearMonthHint = {
  tendency: 'boy' | 'girl';
  confidence: 'low' | 'medium';
  firstOccurrence: string;
  swapped: boolean;
  reason: string;
};

type HeadChildConsensus = {
  tendency: 'boy' | 'girl' | 'mixed';
  confidence: 'low' | 'medium' | 'high';
  methods: string[];
  reasons: string[];
};

function getPillarTenGods(chartData: BaZiChartData, pillar: PillarKey): string[] {
  const detail = chartData.rawBaziData[pillar];
  return [
    detail.天干?.十神,
    ...Object.values(detail.地支.藏干 ?? {}).map((item) => item?.十神),
  ].filter((item): item is string => Boolean(item));
}

function getPillarStem(chartData: BaZiChartData, pillar: PillarKey): string {
  return chartData.rawBaziData[pillar].天干?.天干 || '';
}

function getPillarBranch(chartData: BaZiChartData, pillar: PillarKey): string {
  return chartData.rawBaziData[pillar].地支.地支;
}

function getPillarBranchElement(chartData: BaZiChartData, pillar: PillarKey): string {
  return chartData.rawBaziData[pillar].地支.五行;
}

function getHiddenStems(chartData: BaZiChartData, pillar: PillarKey): string[] {
  return Object.values(chartData.rawBaziData[pillar].地支.藏干 ?? {})
    .map((item) => item?.天干)
    .filter((item): item is string => Boolean(item));
}

function isControlElement(fromElement: string, toElement: string): boolean {
  return KE_MAP[fromElement] === toElement;
}

function isControlBetween(stemFrom: string, stemTo: string): boolean {
  return isControlElement(getGanZhiWuxing(stemFrom), getGanZhiWuxing(stemTo));
}

function isFriendlyStemRelation(stemA: string, stemB: string): boolean {
  const elementA = getGanZhiWuxing(stemA);
  const elementB = getGanZhiWuxing(stemB);
  return elementA === elementB
    || SHENG_MAP[elementA] === elementB
    || SHENG_MAP[elementB] === elementA
    || STEM_COMBINE_MAP[stemA] === stemB;
}

function isFriendlyElementRelation(elementA: string, elementB: string): boolean {
  return elementA === elementB
    || SHENG_MAP[elementA] === elementB
    || SHENG_MAP[elementB] === elementA;
}

function isBranchClashed(branch: string, branches: string[]): boolean {
  return branches.some((item) => CHONG_MAP[branch] === item);
}

function formatOccurrence(occurrence: TenGodOccurrence, verb: '透' | '藏'): string {
  return `${occurrence.pillar}${occurrence.layer}${verb}${occurrence.god}（${occurrence.stem}）`;
}

function resolveBodyUseMode(focusPalaces: PillarKey[], occurrences: TenGodOccurrence[]): BodyUseMode {
  if (occurrences.some((item) => focusPalaces.includes(item.pillar))) {
    return '同体取用';
  }
  if (occurrences.length > 0) {
    return '异体取用';
  }
  return '待岁运引动';
}

function resolveTendency(params: {
  occurrences: TenGodOccurrence[];
  yongShen: BlindThreePassYongShenContext;
  focusPalaces: PillarKey[];
}): Tendency {
  const { occurrences, yongShen, focusPalaces } = params;
  let score = 0;

  occurrences.forEach((occurrence) => {
    const element = getGanZhiWuxing(occurrence.stem);
    score += occurrence.layer === '天干' ? 3 : 2;
    if (focusPalaces.includes(occurrence.pillar)) score += 2;
    if (yongShen.yongElements.includes(element)) score += 2;
    if (yongShen.jiElements.includes(element)) score -= 2;
  });

  if (score >= 8) return '偏助力';
  if (score <= 2) return '偏压力';
  return '吉凶并见';
}

function selectRepresentativeOccurrence(focusPalaces: PillarKey[], occurrences: TenGodOccurrence[]): TenGodOccurrence | null {
  const palaceVisible = occurrences.find((item) => focusPalaces.includes(item.pillar) && item.layer === '天干');
  if (palaceVisible) return palaceVisible;
  const visible = occurrences.find((item) => item.layer === '天干');
  if (visible) return visible;
  return occurrences[0] ?? null;
}

function resolvePalaceElementRelation(
  palaceElement: string,
  starElement: string,
): 'support' | 'control' | 'same' | 'neutral' {
  if (palaceElement === starElement) return 'same';
  if (SHENG_MAP[palaceElement] === starElement) return 'support';
  if (KE_MAP[palaceElement] === starElement) return 'control';
  return 'neutral';
}

function buildAnchorStrategy(params: { key: LiuQinProfile['key']; occurrences: TenGodOccurrence[] }): string {
  const { key, occurrences } = params;
  const strategy = LIUQIN_ANCHOR_STRATEGIES[key];
  return occurrences.length > 0
    ? `本盘先走基础定位。${strategy}`
    : `本盘原局对应十神不显，只能走资料里的通变法与宫位法。${strategy}`;
}

function buildPalaceRule(params: {
  chartData: BaZiChartData;
  focusPalaces: PillarKey[];
  representativeOccurrence: TenGodOccurrence | null;
  occurrences: TenGodOccurrence[];
}): string {
  const { chartData, focusPalaces, representativeOccurrence, occurrences } = params;

  if (occurrences.some((item) => focusPalaces.includes(item.pillar))) {
    return '按“正星守宫”看，这条六亲线星宫直接重合，事情更容易坐宫，人和事都不会太绕。';
  }

  if (!representativeOccurrence) {
    return '按“宫位代星”和“通变法”处理，这条六亲线先看宫位是否被引动，再补出处与根源。';
  }

  const starElement = getGanZhiWuxing(representativeOccurrence.stem);
  const palaceRelations = focusPalaces.map((pillar) => {
    const pillarDetail = chartData.rawBaziData[pillar];
    const branchRelation = resolvePalaceElementRelation(pillarDetail.地支.五行, starElement);
    const stemRelation = resolvePalaceElementRelation(pillarDetail.天干.五行, starElement);
    return branchRelation === 'control' || stemRelation === 'control'
      ? 'control'
      : branchRelation === 'support' || stemRelation === 'support' || branchRelation === 'same' || stemRelation === 'same'
        ? 'support'
        : 'neutral';
  });

  if (palaceRelations.includes('control')) {
    return '按“宫位克星”看，这条六亲线所在环境不护人，容易离家、离祖、关系反复，或这类人本身多灾多折腾。';
  }

  if (palaceRelations.includes('support')) {
    return '按“宫位生助星”看，这条六亲线环境能护人，说明家庭、婚姻或结果位能给这类人留出位置。';
  }

  return '这条六亲线星宫没有直接重合，宫位也不明显偏护，判断时要更多依赖岁运触发和外部环境。';
}

function buildStateRule(params: {
  representativeOccurrence: TenGodOccurrence | null;
  tendency: Tendency;
  bodyUseMode: BodyUseMode;
}): string {
  const { representativeOccurrence, tendency, bodyUseMode } = params;

  if (!representativeOccurrence) return '按“星不显先看宫位与出处”处理，这类六亲平时不一定显，但一到节点年就可能突然有事。';
  if (representativeOccurrence.layer === '天干' && tendency === '偏助力') return '这条六亲线是“透出天干直接看坐基”的典型，更容易应成条件较好、办事有力、寿元也更稳。';
  if (representativeOccurrence.layer === '天干' && tendency === '偏压力') return '这条六亲线虽然透干，但更像“显弱又受克”，多见操心、多灾、关系耗神或人本身很折腾。';
  if (bodyUseMode === '同体取用') return '这条六亲线虽未必全透，但已贴身入宫，事情对命主影响很实，不容易只是心理层面。';
  return '这条六亲线更像“有根但不显”，平时不一定突出，逢冲合刑害才真正显状态。';
}

function buildRelatedSpecialYearHits(params: {
  hits: SpecialYearHit[];
  focusPalaces: PillarKey[];
  focusTenGods: string[];
}): SpecialYearHit[] {
  const { hits, focusPalaces, focusTenGods } = params;
  return hits
    .filter((hit) => hit.targetPillars.some((pillar) => focusPalaces.includes(pillar)) || hit.triggeredTenGods.some((god) => focusTenGods.includes(god)))
    .slice(0, 2);
}

function formatRelatedSpecialYear(hit: SpecialYearHit): string {
  return `${hit.year}（${hit.fortuneGanzhi}/${hit.flowGanzhi}，${hit.kind}）`;
}

function collectOrderedOccurrences(chartData: BaZiChartData, pillars: PillarKey[]): TenGodOccurrence[] {
  const orderedLayers: Array<'主气' | '中气' | '余气'> = ['主气', '中气', '余气'];
  const result: TenGodOccurrence[] = [];
  pillars.forEach((pillar) => {
    const detail = chartData.rawBaziData[pillar];
    if (detail.天干?.十神) result.push({ pillar, layer: '天干', god: detail.天干.十神, stem: detail.天干.天干 });
    orderedLayers.forEach((layer) => {
      const hidden = detail.地支.藏干?.[layer];
      if (hidden?.十神) result.push({ pillar, layer, god: hidden.十神, stem: hidden.天干 });
    });
  });
  return result;
}
function mapChildStarToGender(god: string, gender: BaZiChartData['gender']): 'boy' | 'girl' | null {
  if (god !== '食神' && god !== '伤官') return null;
  if (gender === '男') return god === '食神' ? 'boy' : 'girl';
  return god === '食神' ? 'girl' : 'boy';
}

function resolveHeadChildYearMonthHint(chartData: BaZiChartData): HeadChildYearMonthHint | null {
  const entries = collectOrderedOccurrences(chartData, ['年柱', '月柱']).filter((item) => item.god === '食神' || item.god === '伤官');
  const first = entries[0];
  if (!first) return null;

  const baseTendency = mapChildStarToGender(first.god, chartData.gender);
  if (!baseTendency) return null;

  const branches = (['年柱', '月柱', '日柱', '时柱'] as PillarKey[])
    .filter((pillar) => pillar !== first.pillar)
    .map((pillar) => getPillarBranch(chartData, pillar));
  const swapped = isBranchClashed(getPillarBranch(chartData, first.pillar), branches);
  const finalTendency = swapped ? (baseTendency === 'boy' ? 'girl' : 'boy') : baseTendency;

  return {
    tendency: finalTendency,
    confidence: first.layer === '天干' && !swapped ? 'medium' : 'low',
    firstOccurrence: `${first.pillar}${first.layer}${first.god}`,
    swapped,
    reason: swapped
      ? '年月子孙星先后顺序原本已出象，但该柱被原局冲动，当前按换象处理。'
      : '年月子孙星先后顺序先出象，当前先按首现子孙星落点取头胎倾向。',
  };
}

function resolveHeadChildTendency(chartData: BaZiChartData): HeadChildHint | null {
  const dayStem = getPillarStem(chartData, '日柱');
  const timeStem = getPillarStem(chartData, '时柱');
  const dayBranchElement = getPillarBranchElement(chartData, '日柱');
  const timeBranchElement = getPillarBranchElement(chartData, '时柱');
  const isMale = chartData.gender === '男';
  let boyScore = 0;
  let girlScore = 0;
  const reasons: string[] = [];

  if ((isMale && isControlBetween(timeStem, dayStem)) || (!isMale && isControlBetween(dayStem, timeStem))) {
    boyScore += 2;
    reasons.push('日时天干走到“头胎男”一侧。');
  }
  if ((isMale && isControlBetween(dayStem, timeStem)) || (!isMale && isControlBetween(timeStem, dayStem))) {
    girlScore += 2;
    reasons.push('日时天干走到“头胎女”一侧。');
  }
  if (isFriendlyStemRelation(dayStem, timeStem)) {
    girlScore += 1;
    reasons.push('日时天干同气、相生或相合，女象加重。');
  }
  if ((isMale && isControlElement(timeBranchElement, dayBranchElement)) || (!isMale && isControlElement(dayBranchElement, timeBranchElement))) {
    boyScore += 1;
    reasons.push('日时地支也在推男象。');
  }
  if ((isMale && isControlElement(dayBranchElement, timeBranchElement)) || (!isMale && isControlElement(timeBranchElement, dayBranchElement))) {
    girlScore += 1;
    reasons.push('日时地支也在推女象。');
  }
  if (isFriendlyElementRelation(dayBranchElement, timeBranchElement)) {
    girlScore += 1;
    reasons.push('日时地支同气或相生，女象再加一层。');
  }
  if (boyScore === 0 && girlScore === 0) return null;

  const diff = Math.abs(boyScore - girlScore);
  if (diff === 0) {
    return { tendency: 'mixed', confidence: 'low', boyScore, girlScore, reasons: Array.from(new Set(reasons)) };
  }
  return {
    tendency: boyScore > girlScore ? 'boy' : 'girl',
    confidence: diff >= 3 ? 'high' : 'medium',
    boyScore,
    girlScore,
    reasons: Array.from(new Set(reasons)),
  };
}

function resolveHeadChildConsensus(chartData: BaZiChartData): HeadChildConsensus | null {
  const dayTimeHint = resolveHeadChildTendency(chartData);
  const yearMonthHint = resolveHeadChildYearMonthHint(chartData);
  if (!dayTimeHint && !yearMonthHint) return null;

  const methods: string[] = [];
  const reasons: string[] = [];

  if (dayTimeHint) {
    const tendencyLabel = dayTimeHint.tendency === 'boy' ? '偏男' : dayTimeHint.tendency === 'girl' ? '偏女' : '男女打平';
    methods.push(`日时法：男象 ${dayTimeHint.boyScore} 分，女象 ${dayTimeHint.girlScore} 分，${tendencyLabel}。`);
    if (dayTimeHint.reasons.length > 0) reasons.push(`日时法细节：${dayTimeHint.reasons.join('；')}`);
  }

  if (yearMonthHint) {
    methods.push(`年月子孙星法：首见 ${yearMonthHint.firstOccurrence}，当前判为${yearMonthHint.tendency === 'boy' ? '男象' : '女象'}${yearMonthHint.swapped ? '，且已按换象处理' : ''}。`);
    reasons.push(`年月子孙星法细节：${yearMonthHint.reason}`);
  }

  if (dayTimeHint && yearMonthHint) {
    if (dayTimeHint.tendency !== 'mixed' && dayTimeHint.tendency === yearMonthHint.tendency) {
      return { tendency: dayTimeHint.tendency, confidence: dayTimeHint.confidence === 'high' ? 'high' : 'medium', methods, reasons };
    }
    if (dayTimeHint.tendency === 'mixed') {
      return { tendency: yearMonthHint.tendency, confidence: yearMonthHint.confidence, methods, reasons };
    }
    reasons.push('两套头胎规则当前没有完全同向，只能保留倾向，不抬成硬断。');
    return { tendency: 'mixed', confidence: 'low', methods, reasons };
  }

  if (dayTimeHint) return { tendency: dayTimeHint.tendency, confidence: dayTimeHint.confidence, methods, reasons };
  return { tendency: yearMonthHint!.tendency, confidence: yearMonthHint!.confidence, methods, reasons };
}

function resolveSiblingCountHint(params: {
  occurrences: TenGodOccurrence[];
  allOccurrences: TenGodOccurrence[];
  tendency: Tendency;
}): SiblingCountHint | null {
  const { occurrences, allOccurrences, tendency } = params;
  const siblingCount = occurrences.length;
  const parentSupportCount = allOccurrences.filter((item) => PARENT_GODS.has(item.god)).length;

  if (siblingCount >= 5 || (siblingCount >= 3 && parentSupportCount >= 4)) {
    return { level: 'many', siblingCount, parentSupportCount, text: '同胞胎数偏多，不像独门独枝，父母生育力和家门扩展感都更重。' };
  }
  if (siblingCount >= 3) {
    return { level: 'some', siblingCount, parentSupportCount, text: '同胞不止一人，现实里多半至少有一到两位手足，或存在损胎信息。' };
  }
  if (siblingCount <= 1 && tendency === '偏压力') {
    return { level: 'thin', siblingCount, parentSupportCount, text: '手足缘薄，现实里更像独子、独女，或名义有手足但长期各过各。' };
  }
  return null;
}

function resolveSiblingRankingHint(chartData: BaZiChartData): RankingHint | null {
  const dayStem = getPillarStem(chartData, '日柱');
  const dayBranch = getPillarBranch(chartData, '日柱');
  const otherBranches = (['年柱', '月柱', '时柱'] as PillarKey[]).map((pillar) => getPillarBranch(chartData, pillar));
  const longSheng = CHANG_SHENG_BRANCH[dayStem];
  const opposite = longSheng ? CHONG_MAP[longSheng] : '';

  if (['丙', '戊', '壬'].includes(dayStem) && dayBranch === longSheng) return { label: '长位或老大', reason: '阳干阳生，自坐长生，长位信息最直。' };
  if (['丙', '戊', '壬'].includes(dayStem) && dayBranch === opposite) return { label: '长位附近', reason: '日坐冲长生，常见自己居长位；若有上方手足，多半有损、分离或不在一起成长。' };
  if (dayStem === '甲' && dayBranch === '戌') return { label: '长位或老大', reason: '甲木长生在亥，逆一位到戌，更像老大。' };
  if (dayStem === '庚' && dayBranch === '辰') return { label: '长位或老大', reason: '庚金长生在巳，逆一位到辰，更像老大。' };
  if ((dayStem === '丁' && dayBranch === '酉') || (dayStem === '己' && dayBranch === '酉') || (dayStem === '癸' && dayBranch === '卯')) {
    return { label: isBranchClashed(dayBranch, otherBranches) ? '长位附近' : '长位或老大', reason: isBranchClashed(dayBranch, otherBranches) ? '阴干阴生本带长位，但被刑冲后，现实里容易变成上有姐兄、自己承长位责任。' : '阴干阴生又不逢刑冲，长位信号较直。' };
  }
  if (dayStem === '乙' && dayBranch === '未') return { label: '长位或老大', reason: '乙木长生在午，顺一位到未，更像老大。' };
  if (dayStem === '辛' && dayBranch === '丑') return { label: '长位或老大', reason: '辛金长生在子，顺一位到丑，更像老大。' };

  const monthStem = getPillarStem(chartData, '月柱');
  if (MONTH_STEM_RANK_HINTS[monthStem]) {
    return { label: MONTH_STEM_RANK_HINTS[monthStem], reason: '按月干排行法，只作辅助定位，不单独代替全盘验证。' };
  }
  return null;
}

function resolveTwinHint(chartData: BaZiChartData): TwinHint | null {
  const visibleStems = (['年柱', '月柱', '日柱', '时柱'] as PillarKey[]).map((pillar) => ({ pillar, stem: getPillarStem(chartData, pillar) }));
  const timeStem = getPillarStem(chartData, '时柱');
  const timeElement = getGanZhiWuxing(timeStem);
  const timeHiddenRoots = getHiddenStems(chartData, '时柱');
  const branches = (['年柱', '月柱', '日柱', '时柱'] as PillarKey[]).map((pillar) => getPillarBranch(chartData, pillar));

  const stemCounts = new Map<string, number>();
  visibleStems.forEach((item) => stemCounts.set(item.stem, (stemCounts.get(item.stem) ?? 0) + 1));

  const duplicateStems = Array.from(stemCounts.entries()).filter(([, count]) => count >= 2).map(([stem]) => stem);
  const timeLinkedVisible = visibleStems.filter((item) => item.pillar !== '时柱' && (item.stem === timeStem || getGanZhiWuxing(item.stem) === timeElement));
  const sharedRootWithTime = visibleStems.filter((item) => item.pillar !== '时柱' && timeHiddenRoots.includes(item.stem));
  const parentLinked = timeLinkedVisible.some((item) => item.pillar === '年柱' || item.pillar === '月柱') || sharedRootWithTime.some((item) => item.pillar === '年柱' || item.pillar === '月柱');

  let score = 0;
  const reasons: string[] = [];
  if (duplicateStems.length > 0) {
    score += 2;
    reasons.push(`盘内有重复天干 ${duplicateStems.join('、')}。`);
  }
  if (timeLinkedVisible.length > 0) {
    score += 1;
    reasons.push('重复或同气天干直接牵到时柱。');
  }
  if (sharedRootWithTime.length > 0) {
    score += 1;
    reasons.push('关键天干和时柱同根，带同一时空复制感。');
  }
  if (parentLinked) {
    score += 1;
    reasons.push('同胎信号又牵回父母宫。');
  }
  if (branches.filter((branch) => FOUR_MENG.has(branch)).length >= 2) {
    score += 1;
    reasons.push('四孟偏多，二体同宫感更强。');
  }
  if (score < 4) return null;
  return { score, reasons: Array.from(new Set(reasons)) };
}
function buildHighRiskEvidenceLines(params: {
  chartData: BaZiChartData;
  allOccurrences: TenGodOccurrence[];
  key: LiuQinProfile['key'];
  occurrences: TenGodOccurrence[];
  tendency: Tendency;
  relatedSpecialYearHits: SpecialYearHit[];
  bodyUseMode: BodyUseMode;
}): string[] {
  const { chartData, allOccurrences, key, occurrences, tendency, relatedSpecialYearHits, bodyUseMode } = params;
  const lines: string[] = [];
  const relatedYearText = relatedSpecialYearHits.map(formatRelatedSpecialYear).join('、');

  if (key === 'father' || key === 'mother') {
    if (occurrences.length === 0) lines.push('父母线证据：原局对应财印星不显，这条线更多依赖父母宫、出处和岁运补定位。');
    if (relatedSpecialYearHits.length > 0) lines.push(`父母应期证据：${relatedYearText} 直接碰到父母宫或父母星。`);
    if (tendency === '偏压力' && bodyUseMode === '同体取用') lines.push('父母压力证据：父母星已贴近年/月核心宫位，命主更容易直接承接照护、耗财或家庭责任。');
  }

  if (key === 'children') {
    const headChildConsensus = resolveHeadChildConsensus(chartData);
    if (headChildConsensus) {
      const tendencyLabel = headChildConsensus.tendency === 'boy' ? '男象偏重' : headChildConsensus.tendency === 'girl' ? '女象偏重' : '两法有分歧';
      lines.push(`头胎合议证据：当前${tendencyLabel}，置信度 ${headChildConsensus.confidence}。`);
      headChildConsensus.methods.forEach((item) => lines.push(`头胎方法：${item}`));
      headChildConsensus.reasons.forEach((item) => lines.push(`头胎细节：${item}`));
    }
    lines.push(`子女线证据：原局食伤/子息星共 ${occurrences.length} 处。`);
    if (relatedSpecialYearHits.length > 0) lines.push(`子女应期证据：${relatedYearText} 更像怀孕、生育、子女病伤或教育压力年。`);
  }

  if (key === 'siblings') {
    const countHint = resolveSiblingCountHint({ occurrences, allOccurrences, tendency });
    const rankingHint = resolveSiblingRankingHint(chartData);
    const twinHint = resolveTwinHint(chartData);
    if (countHint) lines.push(`同胞数量证据：原局同胞星 ${countHint.siblingCount} 处，父母生育支持星 ${countHint.parentSupportCount} 处。`);
    if (rankingHint) lines.push(`排行证据：${rankingHint.reason}`);
    if (twinHint) lines.push(`同胎证据：评分 ${twinHint.score}，${twinHint.reasons.join('；')}`);
  }

  if (key === 'partner' && tendency === '偏压力' && bodyUseMode === '同体取用') {
    lines.push('配偶线证据：配偶星与夫妻宫贴身同体，婚姻波动一旦出现，往往不是外围信息，而是命主本人直接入局。');
  }

  return Array.from(new Set(lines));
}

function buildChapterSignals(params: {
  chartData: BaZiChartData;
  key: LiuQinProfile['key'];
  occurrences: TenGodOccurrence[];
  allOccurrences: TenGodOccurrence[];
  relatedSpecialYearHits: SpecialYearHit[];
  tendency: Tendency;
}): string[] {
  const { chartData, key, occurrences, allOccurrences, relatedSpecialYearHits, tendency } = params;

  if (key === 'father' || key === 'mother') {
    const lines: string[] = [];
    const parentPalaceHits = occurrences.filter((item) => item.pillar === '年柱' || item.pillar === '月柱');
    const visibleHits = occurrences.filter((item) => item.layer === '天干');
    if (visibleHits.length > 0) lines.push('按父母章节的优先级，这条线先取透干，再回年柱、月柱核对是否与父母宫有感应。');
    else if (parentPalaceHits.length > 0) lines.push('这条线更接近“明干无时暗中求”，要从父母宫暗字和根源出处里锁父母。');
    else lines.push('这条线更接近“宫位优先于十神”，先看年、月父母宫，再补财印通变。');

    const yearBranch = getPillarBranch(chartData, '年柱');
    const monthBranch = getPillarBranch(chartData, '月柱');
    if (key === 'father' && ['戌', '亥'].includes(yearBranch)) lines.push('年柱带乾象，父亲线更容易从乾宫、父母宫和坐在母星上的字里找。');
    if ((key === 'mother' && ['未', '申'].includes(yearBranch)) || ['未', '申'].includes(monthBranch)) lines.push('父母宫带坤象，母亲线更容易从坤宫、父母宫和日主出处里落实。');
    if (relatedSpecialYearHits.length > 0 && tendency === '偏压力') lines.push(`这条线已经和强应期挂上钩了，优先回验 ${relatedSpecialYearHits.map(formatRelatedSpecialYear).join('、')}。`);
    return lines;
  }

  if (key === 'children') {
    const lines: string[] = [];
    const timeGods = getPillarTenGods(chartData, '时柱');
    const timeStem = getPillarStem(chartData, '时柱');
    const dayStem = getPillarStem(chartData, '日柱');
    const headChildConsensus = resolveHeadChildConsensus(chartData);

    if (timeGods.includes('伤官')) lines.push('时柱见伤官时，优先防子女顶嘴、反骨、伤病或让父母操心。');
    if (timeGods.includes('偏印')) lines.push('时柱见偏印时，更怕孩子走偏、想法孤僻，或者和父母的表达方式不对路。');
    if (timeGods.includes('比肩') || timeGods.includes('劫财')) lines.push('时柱见比劫，多主子女花销大、主观强，容易走到让家里多操心的一面。');
    if (timeGods.includes('七杀')) lines.push('时柱见七杀，多主子女性急、硬顶、拒管，必须结合后天教育与岁运调。');
    if (isControlBetween(timeStem, dayStem)) lines.push('时干直接克日干，属于不太服管的信号，现实里更容易表现成顶嘴、离心或意见硬碰硬。');
    if (headChildConsensus && headChildConsensus.tendency !== 'mixed') lines.push(`按头胎合议法，目前更偏${headChildConsensus.tendency === 'boy' ? '男象' : '女象'}，置信度 ${headChildConsensus.confidence}，但仍只作高风险辅助证据。`);
    if (occurrences.length >= 3) lines.push('子息线不算单薄，至少不是只有一闪而过的子女信号，后续要结合夫妻线再看生养质量。');
    else if (occurrences.length <= 1) lines.push('子息线偏薄，不能轻断多子，必须用岁运、生养经历和夫妻线一起核。');
    if (relatedSpecialYearHits.length > 0) lines.push(`子女线的验事年优先回看 ${relatedSpecialYearHits.map(formatRelatedSpecialYear).join('、')}。`);
    return lines;
  }

  if (key === 'siblings') {
    const lines: string[] = [];
    const monthGods = getPillarTenGods(chartData, '月柱');
    const countHint = resolveSiblingCountHint({ occurrences, allOccurrences, tendency });
    const rankingHint = resolveSiblingRankingHint(chartData);
    const twinHint = resolveTwinHint(chartData);
    if (monthGods.includes('伤官')) lines.push('兄弟宫见伤官，有“上不招、下不招”的味道，手足关系里容易带克损、失折或各自难安。');
    if (monthGods.includes('正官') || monthGods.includes('七杀')) lines.push('兄弟宫见官杀，不是完全没兄弟，就是手足线更容易出损伤、离散、牢灾或有人掌权。');
    if (monthGods.includes('偏印') || monthGods.includes('伤官') || monthGods.includes('七杀')) lines.push('月柱带枭、伤、杀时，按兄弟反目标志，平时就容易话不投机，遇到家产、钱财或责任时更易翻脸。');
    if (countHint) lines.push(`按同胞星数量看，${countHint.text}`);
    if (rankingHint) lines.push(`按兄弟排行诀，命主更像${rankingHint.label}。${rankingHint.reason}`);
    if (twinHint) lines.push(`命局带同胎/双胞胎信号：${twinHint.reasons[0]}`);
    return lines;
  }

  if (key === 'partner') {
    return ['配偶线仍然必须回夫妻宫和日柱验证，单有财官不等于就是真配偶，只有能进夫妻宫、感应夫妻宫的才更可靠。'];
  }

  return [];
}

function buildPositionSummary(params: {
  label: string;
  occurrences: TenGodOccurrence[];
  focusPalaces: PillarKey[];
  anchorStrategy: string;
  palaceRule: string;
  stateRule: string;
  chapterSignals: string[];
}): string {
  const { label, occurrences, focusPalaces, anchorStrategy, palaceRule, stateRule, chapterSignals } = params;
  const palaceHits = occurrences.filter((item) => focusPalaces.includes(item.pillar));
  const visibleHits = occurrences.filter((item) => item.layer === '天干');
  if (occurrences.length === 0) return `${label}星在原局不显，先按“通变法、宫位代星、寻根基找出处”处理。${anchorStrategy}${chapterSignals.length > 0 ? ` ${chapterSignals[0]}` : ''}`;
  if (palaceHits.length > 0 && visibleHits.length > 0) return `${label}星既入核心宫位又有透干，是“正星守宫”的强信号。${palaceRule}${chapterSignals.length > 0 ? ` ${chapterSignals[0]}` : ''}`;
  if (palaceHits.length > 0) return `${label}星虽然不一定全透，但已压进${focusPalaces.join('、')}，更像“宫位先锁人，再看星怎么落”。${stateRule}${chapterSignals.length > 0 ? ` ${chapterSignals[0]}` : ''}`;
  if (visibleHits.length > 0) return `${label}星有透干但多落外宫，这条线存在感强，却容易从外部环境、家族结构或现实平台绕进来。${palaceRule}${chapterSignals.length > 0 ? ` ${chapterSignals[0]}` : ''}`;
  return `${label}星多藏不透，缘分和牵扯并不少，但真正出大事时通常要靠特殊流年把暗线翻出来。${stateRule}${chapterSignals.length > 0 ? ` ${chapterSignals[0]}` : ''}`;
}

function buildDirectCuts(params: {
  label: string;
  bodyUseMode: BodyUseMode;
  tendency: Tendency;
  occurrences: TenGodOccurrence[];
  palaceRule: string;
  stateRule: string;
  chapterSignals: string[];
}): string[] {
  const { label, bodyUseMode, tendency, occurrences, palaceRule, stateRule, chapterSignals } = params;
  const lines: string[] = [];
  if (occurrences.length === 0) lines.push(`${label}这条线不靠原局明着说话，必须回宫位、出处和岁运验证，不然容易断飘。`);
  else if (bodyUseMode === '同体取用') lines.push(`${label}星落近身宫位，命主很难和这类人保持纯旁观关系，事情一来就是自己要接。`);
  else lines.push(`${label}星多落外宫，平时像隔着一层，但一旦被大运流年勾出来，事情会从外部环境压进来。`);
  lines.push(`宫位判断：${palaceRule}`);
  lines.push(`状态判断：${stateRule}`);
  chapterSignals.forEach((signal) => lines.push(`章节信号：${signal}`));
  if (tendency === '偏助力') lines.push(`${label}这条线更容易给命主带来帮助、资源、牵线或结果位上的助推。`);
  else if (tendency === '偏压力') lines.push(`${label}这条线更容易应在操心、耗财、责任、病痛或关系上的硬碰硬。`);
  else lines.push(`${label}这条线本身就是得失同来，既能成事，也容易把代价一起带进来。`);
  if (occurrences.some((item) => item.layer === '天干')) lines.push('因为有透干，这类事通常不会完全藏着，到节点年外界也能看见。');
  else lines.push('因为多藏干不透，很多细节往往先暗里发酵，后面才真正显事。');
  return lines;
}
function buildHighRiskDirectJudgments(params: {
  chartData: BaZiChartData;
  allOccurrences: TenGodOccurrence[];
  key: LiuQinProfile['key'];
  label: string;
  occurrences: TenGodOccurrence[];
  tendency: Tendency;
  chapterSignals: string[];
  relatedSpecialYearHits: SpecialYearHit[];
  bodyUseMode: BodyUseMode;
}): string[] {
  const { chartData, allOccurrences, key, label, occurrences, tendency, chapterSignals, relatedSpecialYearHits, bodyUseMode } = params;
  const lines: string[] = [];
  const signalText = chapterSignals.join('；');
  const relatedYearText = relatedSpecialYearHits.map(formatRelatedSpecialYear).join('、');

  if ((key === 'father' || key === 'mother') && tendency === '偏压力') {
    if (occurrences.length === 0) lines.push(`${label}线可作高风险绝对直断：与命主缘分偏薄，家庭结构、抚养关系或早年分离感会比较重。`);
    if (relatedSpecialYearHits.length > 0) lines.push(`${label}线可作高风险绝对直断：${relatedYearText} 这几段更像${label}的病灾、手术、分离、搬迁或家门震动年。`);
    if (bodyUseMode === '同体取用' && occurrences.some((item) => item.layer === '天干')) lines.push(`${label}线可作高风险绝对直断：这条压力不是轻微别扭，现实里多半会落成看得见的照护、耗财或长期操心。`);
  }

  if (key === 'children') {
    const headChildConsensus = resolveHeadChildConsensus(chartData);
    if (occurrences.length <= 1) lines.push('子女线可作高风险绝对直断：少子、晚子、养子、女多男少或先生养困难的概率偏高。');
    if (headChildConsensus && headChildConsensus.tendency !== 'mixed') lines.push(`子女线可作高风险绝对直断：头胎更偏${headChildConsensus.tendency === 'boy' ? '男孩' : '女孩'}。当前本地规则置信度 ${headChildConsensus.confidence}；若现实已生育，优先回验头胎性别；若尚未生育，只能当作倾向，不可当成概率保证。`);
    if (signalText.includes('伤官') || signalText.includes('不太服管') || signalText.includes('七杀')) lines.push('子女线可作高风险绝对直断：至少一名子女更容易反骨、难管、操心，或在人生某阶段有伤病与学业波动。');
    if (relatedSpecialYearHits.length > 0) lines.push(`子女线可作高风险绝对直断：${relatedYearText} 更像子女线被引爆的年份，现实里容易出现怀孕、生育、子女病伤或教育压力事件。`);
  }

  if (key === 'siblings') {
    const countHint = resolveSiblingCountHint({ occurrences, allOccurrences, tendency });
    const rankingHint = resolveSiblingRankingHint(chartData);
    const twinHint = resolveTwinHint(chartData);
    if (signalText.includes('上不招、下不招') || signalText.includes('官杀') || signalText.includes('翻脸')) lines.push('兄弟姐妹线可作高风险绝对直断：手足中有损伤、失折、离散、长期不往来或一方明显拖累全家的概率偏高。');
    if (countHint?.level === 'many') lines.push('兄弟姐妹线可作高风险绝对直断：家里不像独门独枝，同胞胎数偏多。');
    else if (countHint?.level === 'some') lines.push('兄弟姐妹线可作高风险绝对直断：同胞不止一人，现实里多半至少有一到两位手足，或存在损胎信息。');
    else if (countHint?.level === 'thin') lines.push('兄弟姐妹线可作高风险绝对直断：手足缘薄，更像独子独女，或名义有手足但长期各过各。');
    if (rankingHint) lines.push(`兄弟姐妹线可作高风险绝对直断：命主更像${rankingHint.label}；若现实排行不符，多半对应上方手足有损、分开抚养或不同门。`);
    if (twinHint) lines.push('兄弟姐妹线可作高风险绝对直断：命局自带同胎信息，需结合现实确认命主本人或手足中是否存在双胞胎。');
  }

  if (key === 'partner' && tendency === '偏压力' && bodyUseMode === '同体取用') {
    lines.push('配偶线可作高风险绝对直断：婚缘波动偏重，婚后矛盾、冷战、两地或再婚信息要重点防。');
  }

  return Array.from(new Set(lines));
}

export function resolveLiuQinProfiles(params: {
  chartData: BaZiChartData;
  yongShen: BlindThreePassYongShenContext;
  occurrences: TenGodOccurrence[];
  specialYears: SpecialYearHit[];
}): LiuQinProfile[] {
  const { chartData, yongShen, occurrences, specialYears } = params;
  const liuQinConfigs = getLiuQinConfigs(chartData.gender);

  return liuQinConfigs.map((config) => {
    const relevantOccurrences = occurrences.filter((item) => config.tenGods.includes(item.god));
    const bodyUseMode = resolveBodyUseMode(config.palaces, relevantOccurrences);
    const tendency = resolveTendency({ occurrences: relevantOccurrences, yongShen, focusPalaces: config.palaces });
    const representativeOccurrence = selectRepresentativeOccurrence(config.palaces, relevantOccurrences);
    const anchorStrategy = buildAnchorStrategy({ key: config.key, occurrences: relevantOccurrences });
    const palaceRule = buildPalaceRule({ chartData, focusPalaces: config.palaces, representativeOccurrence, occurrences: relevantOccurrences });
    const stateRule = buildStateRule({ representativeOccurrence, tendency, bodyUseMode });
    const relatedSpecialYearHits = buildRelatedSpecialYearHits({ hits: specialYears, focusPalaces: config.palaces, focusTenGods: config.tenGods });
    const relatedSpecialYears = relatedSpecialYearHits.map(formatRelatedSpecialYear);
    const chapterSignals = buildChapterSignals({ chartData, key: config.key, occurrences: relevantOccurrences, allOccurrences: occurrences, relatedSpecialYearHits, tendency });
    const highRiskDirectJudgments = buildHighRiskDirectJudgments({ chartData, allOccurrences: occurrences, key: config.key, label: config.label, occurrences: relevantOccurrences, tendency, chapterSignals, relatedSpecialYearHits, bodyUseMode });
    const highRiskEvidenceLines = buildHighRiskEvidenceLines({ chartData, allOccurrences: occurrences, key: config.key, occurrences: relevantOccurrences, tendency, relatedSpecialYearHits, bodyUseMode });

    return {
      key: config.key,
      label: config.label,
      focusTenGods: config.tenGods,
      focusPalaces: config.palaces,
      anchorStrategy,
      visibleOccurrences: relevantOccurrences.filter((item) => item.layer === '天干').map((item) => formatOccurrence(item, '透')),
      hiddenOccurrences: relevantOccurrences.filter((item) => item.layer !== '天干').map((item) => formatOccurrence(item, '藏')),
      bodyUseMode,
      tendency,
      palaceRule,
      stateRule,
      chapterSignals,
      positionSummary: buildPositionSummary({ label: config.label, occurrences: relevantOccurrences, focusPalaces: config.palaces, anchorStrategy, palaceRule, stateRule, chapterSignals }),
      directCuts: buildDirectCuts({ label: config.label, bodyUseMode, tendency, occurrences: relevantOccurrences, palaceRule, stateRule, chapterSignals }),
      highRiskDirectJudgments,
      highRiskEvidenceLines,
      relatedSpecialYears,
    };
  });
}
