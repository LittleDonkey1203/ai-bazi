import type { BlindThreePassAnalysis as BlindThreePassEngineAnalysis, BlindThreePassYongShenContext } from './blind-three-pass/types';
import { analyzeBlindThreePass as analyzeBlindThreePassEngine } from './blind-three-pass/engine';
import type { BaZiChartData } from './logic';
import {
  buildYongShenStageAnalysis,
  formatYongShenV2Elements,
  formatYongShenV2Scores,
  type YongShenStageSnapshot,
} from './yongshenV2Analysis';
import type { FiveElement as YongShenV2Element } from './yongshen-v2/index';

export interface YongShenAnalysis {
  dayMaster: string;
  effectiveDayMasterElement: YongShenV2Element;
  finalPattern: string;
  yongElements: YongShenV2Element[];
  jiElements: YongShenV2Element[];
  tongDangPercent: number;
  maxSelfElement: YongShenV2Element | null;
  maxOpposingElement: YongShenV2Element | null;
  climateNotes: string[];
  stageSnapshots: YongShenStageSnapshot[];
  changedStageLabels: string[];
  notes: string[];
}

export type BlindThreePassAnalysis = BlindThreePassEngineAnalysis;

function scoreLiuQinReference(profile: BlindThreePassAnalysis['liuqinProfiles'][number]): number {
  return (
    profile.directCuts.length * 3
    + profile.relatedSpecialYears.length * 2
    + profile.chapterSignals.length
    + profile.visibleOccurrences.length
    + profile.hiddenOccurrences.length
    + profile.highRiskEvidenceLines.length
    + profile.highRiskDirectJudgments.length * 2
  );
}

function buildBlindThreePassAiSpecialYearFacts(item: BlindThreePassAnalysis['specialYears'][number]) {
  return {
    year: item.year,
    age: item.age,
    kind: item.kind,
    tone: item.tone,
    score: item.score,
    fortuneGanzhi: item.fortuneGanzhi,
    flowGanzhi: item.flowGanzhi,
    targetPillars: item.targetPillars,
    linkedLiuQinLabels: item.linkedLiuQinLabels,
    triggeredTenGods: item.triggeredTenGods,
    matchedRelations: item.matchedRelations,
    annualRelations: item.annualRelations,
    annualGods: item.annualGods,
    supportiveGods: item.supportiveGods,
    cautionGods: item.cautionGods,
    whyImportant: item.whyImportant,
  };
}

function buildBlindThreePassAiReferencePayload(blind: BlindThreePassAnalysis) {
  const strongestSpecialYears = blind.specialYears.slice(0, 6).map((item) => ({
    ...buildBlindThreePassAiSpecialYearFacts(item),
    whyImportant: item.whyImportant.slice(0, 4),
  }));

  const priorityLiuQin = [...blind.liuqinProfiles]
    .map((profile) => ({
      key: profile.key,
      label: profile.label,
      referenceScore: scoreLiuQinReference(profile),
      tendency: profile.tendency,
      bodyUseMode: profile.bodyUseMode,
      focusTenGods: profile.focusTenGods,
      focusPalaces: profile.focusPalaces,
      anchorStrategy: profile.anchorStrategy,
      palaceRule: profile.palaceRule,
      stateRule: profile.stateRule,
      directCuts: profile.directCuts.slice(0, 4),
      relatedSpecialYears: profile.relatedSpecialYears.slice(0, 4),
      chapterSignals: profile.chapterSignals.slice(0, 4),
      highRiskDirectJudgments: profile.highRiskDirectJudgments.slice(0, 3),
      highRiskEvidenceLines: profile.highRiskEvidenceLines.slice(0, 4),
    }))
    .sort((a, b) => b.referenceScore - a.referenceScore);

  return {
    domain: blind.domain,
    domainLabel: blind.domainLabel,
    directConclusions: blind.directConclusions.slice(0, 4),
    strongestSpecialYears,
    priorityLiuQin,
    highRiskDisclaimer: blind.highRiskDisclaimer,
  };
}

function buildBlindThreePassAiDetailPayload(blind: BlindThreePassAnalysis) {
  return {
    ...blind,
    specialYears: blind.specialYears.map((item) => buildBlindThreePassAiSpecialYearFacts(item)),
  };
}

function buildYongShenAiPayload(yongShen: YongShenAnalysis) {
  return {
    finalPattern: yongShen.finalPattern,
    effectiveDayMasterElement: yongShen.effectiveDayMasterElement,
    yongElements: yongShen.yongElements,
    jiElements: yongShen.jiElements,
    tongDangPercent: yongShen.tongDangPercent,
    maxSelfElement: yongShen.maxSelfElement,
    maxOpposingElement: yongShen.maxOpposingElement,
    climateNotes: yongShen.climateNotes,
    changedStageLabels: yongShen.changedStageLabels,
    stageSnapshots: yongShen.stageSnapshots.map((snapshot) => ({
      stage: snapshot.stageLabel,
      patternType: snapshot.patternType,
      scores: snapshot.scores,
      tongDangPercent: snapshot.tongDangPercent,
      maxSelfElement: snapshot.maxSelfElement,
      maxSelfPercent: snapshot.maxSelfPercent,
      maxOpposingElement: snapshot.maxOpposingElement,
      maxOpposingPercent: snapshot.maxOpposingPercent,
      yongElements: snapshot.yongElements,
      jiElements: snapshot.jiElements,
      changes: snapshot.changeSummary,
    })),
  };
}

function toBlindThreePassYongShenContext(yongShen: YongShenAnalysis): BlindThreePassYongShenContext {
  return {
    finalPattern: yongShen.finalPattern,
    effectiveDayMasterElement: yongShen.effectiveDayMasterElement,
    yongElements: [...yongShen.yongElements],
    jiElements: [...yongShen.jiElements],
    tongDangPercent: yongShen.tongDangPercent,
    maxSelfElement: yongShen.maxSelfElement,
    maxOpposingElement: yongShen.maxOpposingElement,
    climateNotes: [...yongShen.climateNotes],
    changedStageLabels: [...yongShen.changedStageLabels],
  };
}

export function analyzeYongShen(chartData: BaZiChartData): YongShenAnalysis {
  const stageAnalysis = buildYongShenStageAnalysis(chartData);
  const finalSnapshot = stageAnalysis.finalSnapshot;
  const finalMapping = stageAnalysis.finalResult.yongShenMapping;
  const climateAdjustment = finalMapping.climateAdjustment;

  return {
    dayMaster: chartData.dayMaster,
    effectiveDayMasterElement: finalMapping.effectiveDayMasterElement,
    finalPattern: finalMapping.patternType,
    yongElements: [...finalMapping.yongElements],
    jiElements: [...finalMapping.jiElements],
    tongDangPercent: finalSnapshot.tongDangPercent,
    maxSelfElement: finalSnapshot.maxSelfElement,
    maxOpposingElement: finalSnapshot.maxOpposingElement,
    climateNotes: climateAdjustment.applied
      ? [...climateAdjustment.reasons]
      : ['当前未触发最终调候修正'],
    stageSnapshots: stageAnalysis.snapshots,
    changedStageLabels: stageAnalysis.changedSnapshots.map((item) => item.stageLabel),
    notes: [
      `最终采用 ${finalSnapshot.stageLabel} 作为页面与 AI 共享的喜用神结论。`,
      ...stageAnalysis.changedSnapshots.flatMap((item) =>
        item.changeSummary.map((summary) => `${item.stageLabel}：${summary}`),
      ),
    ],
  };
}

export function analyzeBlindThreePass(chartData: BaZiChartData, question?: string): BlindThreePassAnalysis {
  const yongShen = analyzeYongShen(chartData);
  return analyzeBlindThreePassEngine({
    chartData,
    question,
    yongShen: toBlindThreePassYongShenContext(yongShen),
  });
}

export function buildYongShenFocus(chartData: BaZiChartData, question?: string): string {
  const yongShen = analyzeYongShen(chartData);

  return [
    '本轮优先任务：先定喜用神，再进入全盘分析，不允许绕开本地规则另起一套结论。',
    '喜用神必须以 yongshen-v2 规则引擎为准，并明确交代格局、同党比例、关键拐点与最终喜忌。',
    question ? `用户当前关注：${question}` : '用户当前未指定单一问事，先按命局总览定喜用神。',
    `最终格局：${yongShen.finalPattern}`,
    `最终用神：${formatYongShenV2Elements(yongShen.yongElements)}`,
    `最终忌神：${formatYongShenV2Elements(yongShen.jiElements)}`,
    `有效日主五行：${yongShen.effectiveDayMasterElement}`,
    `关键拐点：${yongShen.changedStageLabels.length > 0 ? yongShen.changedStageLabels.join('；') : '当前五个阶段没有发生喜忌翻转'}`,
    `调候说明：${yongShen.climateNotes.join('；')}`,
    `阶段摘要：${yongShen.stageSnapshots
      .map((snapshot) => `${snapshot.stageLabel} -> ${snapshot.patternType} / 用神 ${formatYongShenV2Elements(snapshot.yongElements)} / 忌神 ${formatYongShenV2Elements(snapshot.jiElements)}`)
      .join('；')}`,
    `本地规则结果：${JSON.stringify(buildYongShenAiPayload(yongShen), null, 2)}`,
    '输出要求：先下结论，再列证据；最后明确给出“主用神 / 忌神 / 当前大运是否助用神”。',
  ].join('\n');
}

export function buildBlindThreePassFocus(chartData: BaZiChartData, question?: string): string {
  const yongShen = analyzeYongShen(chartData);
  const blind = analyzeBlindThreePass(chartData, question);
  const blindAiDetail = buildBlindThreePassAiDetailPayload(blind);

  return [
    '本轮优先任务：先以 yongshen-v2 的本地喜用神结论为背景，再按高德臣盲派“过三关”的顺序直断。',
    '过三关顺序固定：第一关立极定体用和对象；第二关看六亲星、宫位、同体异体；第三关看做功、状态、吉凶、引动与应期。',
    '回答时先给直断结论，再给依据，不要先写冗长的八字基础科普。',
    question ? `用户当前问题：${question}` : '用户未指定单一问题，先围绕命主本身、事业、财运、婚姻展开。',
    `前置喜用神结论：格局 ${yongShen.finalPattern} / 用神 ${formatYongShenV2Elements(yongShen.yongElements)} / 忌神 ${formatYongShenV2Elements(yongShen.jiElements)}`,
    `喜用神规则结果：${JSON.stringify(buildYongShenAiPayload(yongShen), null, 2)}`,
    `盲派过三关规则结果：${JSON.stringify(blindAiDetail, null, 2)}`,
    `高风险直断免责声明：${blind.highRiskDisclaimer}`,
    '若输出兄弟个数、头胎男女、夭寿、早离、再婚或绝对排行等高风险绝对直断，必须先带上免责声明，再给依据，不允许伪装成稳结论。',
    '输出格式要求：按“第一关 / 第二关 / 第三关 / 特殊流年 / 六亲直断 / 当前大运验证”六段输出。',
  ].join('\n');
}

export function buildBlindThreePassActionFocus(question?: string): string {
  return [
    '本轮是“过三关直断”专用咨询，页面最终只展示 AI 成文结果，不展示本地规则展开过程。',
    '必须吸收本地规则引擎已经筛出的特殊流年、六亲结论和高风险免责声明，但不要把 JSON、逐条规则、第一关第二关第三关的推导原样复述出来。',
    '输出顺序固定为：1. 流年验事 2. 六亲断语 3. 直接回答当前问题。',
    '流年验事只选最强的 2 到 4 个年份，直接说最可能发生过的具体事，不要铺陈规则链。',
    '六亲断语直接下结论，必要时用一句短证据托住，不要再展示“定位规则 / 宫位规则 / 状态规则”等内部标题。',
    '涉及高风险绝对直断时，必须先带免责声明，再给结论。',
    question
      ? `当前问题必须落回这里作答：${question}`
      : '如果用户没有额外问题，就把重心放在命主已经发生过的关键流年事件和六亲细节上。',
  ].join('\n');
}

export function buildBaziAiBridgeFocus(chartData: BaZiChartData, question?: string): string {
  const yongShen = analyzeYongShen(chartData);
  const blind = analyzeBlindThreePass(chartData, question);
  const blindAiDetail = buildBlindThreePassAiDetailPayload(blind);

  return [
    '以下内容是页面本地规则引擎生成的隐藏上下文，供 AI 回答时使用，不要把原始 JSON、全部规则过程或逐关分析整段复述给用户。',
    question ? `当前问题：${question}` : '当前问题：命局总览',
    `喜用神规则结果：${JSON.stringify(buildYongShenAiPayload(yongShen), null, 2)}`,
    `过三关规则结果：${JSON.stringify(blindAiDetail, null, 2)}`,
    `高风险直断免责声明：${blind.highRiskDisclaimer}`,
    '面向用户的输出要求：只吸收本地规则结论，优先输出最终判断、流年验事、六亲断语，以及对当前问题的直接回答。',
    '默认输出结构：',
    '1. 流年验事：只挑最强的 2 到 4 个年份，每个年份直接说可能发生了什么，不要展开完整规则链。',
    '2. 六亲断语：按父母、兄弟姐妹、配偶、子女择重点直断，不要先解释规则，再给结论。',
    '3. 当前问题回答：回到用户提问本身，直接回答。',
    '除非用户追问，不要展开完整规则过程，不要复述“第一关/第二关/第三关”的内部推导。若涉及高风险绝对直断，必须先带免责声明再给结论。',
  ].join('\n\n');
}

export function buildBlindThreePassActionFocusV2(question?: string): string {
  return [
    '本轮是“过三关直断”专用咨询，页面最终只展示 AI 成文结果，不展示本地规则展开过程。',
    '先以命盘原始数据、大运流年和用户问题独立判断，但不得绕开本地喜用神引擎和过三关规则输出；两者必须合参，而不是二选一。',
    '流年验事必须同时结合：1. 喜用神引擎的最终喜忌 2. 特殊流年标签 3. 当年的刑冲合害关系 4. 当年的神煞 5. 打中的宫位、十神和六亲线，不允许只凭一句泛泛年份结论。',
    '若某个年份虽然结构强，但与现实年龄常识明显冲突，要改写成该年龄段更合理的家庭、学业、健康、人际或家宅事件，不能硬断不合常识的情节。',
    '六亲断语必须全面参考本地规则输出，尤其是兄弟数量、兄弟排行、头胎男女、同胎、多子少子这类定式信息，默认以本地规则为主，不要随意弱化成模糊倾向。',
    '父母、兄弟、配偶、子女不要求机械平均铺开，但凡本地规则已经给出明确而且稳定的口径，就要吸收进最终断语里，不得因为想简化输出而直接忽略。',
    '输出顺序固定为：1. 流年验事 2. 六亲断语 3. 直接回答当前问题。',
    '流年验事优先写最有把握、最有证据的 2 到 4 个年份；每个年份直接落到具体事件方向，但不要把完整规则链原样抄给用户。',
    '六亲断语直接下结论，必要时用一句短证据托住，不要再展示“定位规则 / 宫位规则 / 状态规则”等内部标题。',
    '涉及高风险绝对直断时，必须先带免责声明，再给结论。',
    question
      ? `当前问题必须落回这里作答：${question}`
      : '如果用户没有额外问题，就把重心放在命主已经发生过的关键流年事件和六亲细节上。',
  ].join('\n');
}

export function buildBaziAiBridgeFocusV2(chartData: BaZiChartData, question?: string): string {
  const yongShen = analyzeYongShen(chartData);
  const blind = analyzeBlindThreePass(chartData, question);
  const blindReference = buildBlindThreePassAiReferencePayload(blind);
  const blindAiDetail = buildBlindThreePassAiDetailPayload(blind);

  return [
    '以下内容是页面本地规则引擎生成的隐藏上下文，供 AI 回答时使用，不要把原始 JSON、全部规则过程或逐关分析整段复述给用户。',
    '回答时必须先根据 chartData.rawBaziData、关系信息、大运流年和用户问题自行分析，但不得绕开本地规则；原盘判断、本地喜用神结论、本地过三关规则三者必须交叉校验。',
    question ? `当前问题：${question}` : '当前问题：命局总览',
    `喜用神规则结果：${JSON.stringify(buildYongShenAiPayload(yongShen), null, 2)}`,
    `过三关候选参考：${JSON.stringify(blindReference, null, 2)}`,
    `过三关规则明细（仅供必要时查阅）：${JSON.stringify(blindAiDetail, null, 2)}`,
    `高风险直断免责声明：${blind.highRiskDisclaimer}`,
    '使用优先级要求：',
    '1. 原盘、大运流年、现实年龄常识是基础。',
    '2. 喜用神引擎结果必须进入流年验事判断，明确区分哪些年份是在扶用神、泄用神、制忌神还是助忌神。',
    '3. 特殊流年判断必须同时看流年神煞、全年刑冲合害、命中宫位、触发十神和牵动六亲。',
    '4. 六亲部分必须充分吸收本地规则，尤其兄弟数量排行、头胎男女、同胎、子女多少等定式信息，原则上以规则为主，不要随意推翻。',
    '面向用户的输出要求：优先输出你重新分析后的最终判断、流年验事、六亲断语，以及对当前问题的直接回答。',
    '默认输出结构：',
    '1. 流年验事：只挑最强的 2 到 4 个年份，每个年份直接说可能发生了什么，但每条判断都必须暗含喜用神、神煞、刑冲合害和六亲牵动的综合依据。',
    '2. 六亲断语：围绕本地规则已明确的六亲线直断，尤其不能漏掉兄弟数量排行、头胎男女、同胎等规则主导项；不要先解释规则，再给结论。',
    '3. 当前问题回答：回到用户提问本身，直接回答。',
    '除非用户追问，不要展开完整规则过程，不要复述“第一关 / 第二关 / 第三关”的内部推导。若涉及高风险绝对直断，必须先带免责声明再给结论。',
  ].join('\n\n');
}

function formatSpecialYearSection(blind: BlindThreePassAnalysis): string[] {
  if (blind.specialYears.length === 0) {
    return ['- 当前还没有筛到足够强的特殊流年，后续需要用真实命例继续校正规则阈值。'];
  }

  return blind.specialYears.flatMap((item) => [
    `#### ${item.year} 年（${item.age} 岁）`,
    `- 标签：${item.kind}｜${item.tone}｜大运 ${item.fortuneGanzhi}｜流年 ${item.flowGanzhi}`,
    `- 命中宫位：${item.targetPillars.length > 0 ? item.targetPillars.join('、') : '大运与流年同柱'}`,
    `- 牵动六亲：${item.linkedLiuQinLabels.length > 0 ? item.linkedLiuQinLabels.join('、') : '当前未锁定单一六亲'}`,
    `- 十神触发：${item.triggeredTenGods.length > 0 ? item.triggeredTenGods.join('、') : '当前未提取到十神触发'}`,
    `- 关系证据：${item.matchedRelations.length > 0 ? item.matchedRelations.join('；') : '以同柱或伏吟为主'}`,
    `- 全年刑冲合害：${item.annualRelations.length > 0 ? item.annualRelations.join('；') : '当前未提取到额外关系'}`,
    `- 流年神煞：${item.annualGods.length > 0 ? item.annualGods.join('、') : '当前未提取到流年神煞'}`,
    `- 助力神煞：${item.supportiveGods.length > 0 ? item.supportiveGods.join('、') : '当前无明显助力神煞'}`,
    `- 压力神煞：${item.cautionGods.length > 0 ? item.cautionGods.join('、') : '当前无明显压力神煞'}`,
    ...item.whyImportant.map((reason) => `- 重要原因：${reason}`),
    ...item.likelyEvents.map((event) => `- 可能应事：${event}`),
    '',
  ]);
}

function formatLiuQinSection(blind: BlindThreePassAnalysis): string[] {
  return blind.liuqinProfiles.flatMap((profile) => [
    `#### ${profile.label}`,
    `- 重点十神：${profile.focusTenGods.join('、')}`,
    `- 重点宫位：${profile.focusPalaces.join('、')}`,
    `- 定位规则：${profile.anchorStrategy}`,
    `- 体用方式：${profile.bodyUseMode}`,
    `- 吉凶倾向：${profile.tendency}`,
    `- 星宫关系：${profile.palaceRule}`,
    `- 状态规则：${profile.stateRule}`,
    `- 章节信号：${profile.chapterSignals.length > 0 ? profile.chapterSignals.join('；') : '当前未提取到专题章节信号'}`,
    `- 盘内位置：${profile.positionSummary}`,
    `- 透干：${profile.visibleOccurrences.length > 0 ? profile.visibleOccurrences.join('；') : '当前未见明显透干'}`,
    `- 藏干：${profile.hiddenOccurrences.length > 0 ? profile.hiddenOccurrences.join('；') : '当前未见明显藏干'}`,
    ...profile.directCuts.map((cut) => `- 直断：${cut}`),
    ...profile.highRiskEvidenceLines.map((item) => `- 高风险证据：${item}`),
    `- 对应特殊流年：${profile.relatedSpecialYears.length > 0 ? profile.relatedSpecialYears.join('；') : '当前前五个特殊流年里暂未单独打中'}`,
    '',
  ]);
}

function formatHighRiskSection(blind: BlindThreePassAnalysis): string[] {
  const lines = blind.liuqinProfiles.flatMap((profile) => [
    ...profile.highRiskDirectJudgments.map((item) => `- ${profile.label}：${item}`),
    ...profile.highRiskEvidenceLines.map((item) => `- ${profile.label}证据：${item}`),
  ]);

  if (lines.length === 0) {
    return ['- 当前还没有放出新的高风险绝对直断，后续只在规则更稳定或用户明确接受风险时再继续放开。'];
  }

  return [
    `- 免责声明：${blind.highRiskDisclaimer}`,
    ...lines,
  ];
}

function formatVisibleSpecialYearSection(blind: BlindThreePassAnalysis): string[] {
  if (blind.specialYears.length === 0) {
    return ['- 当前还没有筛到足够强的验事流年。'];
  }

  return blind.specialYears.flatMap((item) => [
    `#### ${item.year} 年（${item.age} 岁）`,
    `- 标签：${item.kind}｜${item.tone}｜大运 ${item.fortuneGanzhi}｜流年 ${item.flowGanzhi}`,
    `- 牵动六亲：${item.linkedLiuQinLabels.length > 0 ? item.linkedLiuQinLabels.join('、') : '当前未锁定单一六亲'}`,
    ...item.likelyEvents.map((event) => `- 应事：${event}`),
    '',
  ]);
}

function formatVisibleLiuQinSection(blind: BlindThreePassAnalysis): string[] {
  return blind.liuqinProfiles.flatMap((profile) => {
    const conciseCuts = profile.directCuts.filter(
      (item) =>
        !item.startsWith('宫位判断：')
        && !item.startsWith('状态判断：')
        && !item.startsWith('章节信号：'),
    );
    const visibleCuts = conciseCuts.slice(0, 2);
    const visibleHighRisk = profile.highRiskDirectJudgments.slice(0, 2);

    return [
      `#### ${profile.label}`,
      ...visibleCuts.map((item) => `- 断语：${item}`),
      ...visibleHighRisk.map((item) => `- 高风险：${item}`),
      '',
    ];
  });
}

export function buildBlindThreePassLocalSummary(chartData: BaZiChartData, question?: string): string {
  const blind = analyzeBlindThreePass(chartData, question);

  return [
    '## 过三关直断',
    '',
    question ? `当前关注：${question}` : '当前关注：命局总览',
    '',
    '### 流年验事',
    ...formatVisibleSpecialYearSection(blind),
    '### 六亲断语',
    ...formatVisibleLiuQinSection(blind),
    blind.liuqinProfiles.some((item) => item.highRiskDirectJudgments.length > 0) ? '### 免责声明' : '',
    blind.liuqinProfiles.some((item) => item.highRiskDirectJudgments.length > 0)
      ? `- ${blind.highRiskDisclaimer}`
      : '',
  ].join('\n');
}

export function buildBlindThreePassActionFocusV3(question?: string): string {
  return [
    '本轮是“过三关直断”专用咨询。页面最终只展示 AI 成文结果，不展示本地规则展开过程，但你必须充分吸收这些规则结果后再继续深推，不可只做摘要复述。',
    '你的身份默认就是资深命理师。你不是来照抄本地规则结论，而是要在命盘原始数据、大运流年、喜用神引擎结果、过三关本地规则结果和用户当前问题的基础上继续推论、继续论事。',
    '喜用神结论必须真正参与推论。要明确哪些年份、哪些六亲、哪些事件是在扶用神、泄用神、制忌神、助忌神。',
    '流年验事必须同时结合：1. 喜用神与忌神 2. 特殊流年标签 3. 当年的刑冲合害 4. 当年的神煞 5. 打中的宫位、十神、六亲线，不允许只凭一句泛泛年份结论。',
    '本地规则给出的“可能应事”“直断句”“六亲定式”不是边界，只是你继续深入分析的基础。你可以在不违背原盘和规则主线的前提下，进一步推出更完整、更具体、更像真人经历的事件链。',
    '如果某个流年的本地规则输出只集中在某一个方面，例如只提到感情、父母、财务或健康，你不能把这个年份机械限制在这一面。你需要继续按照八字逻辑，结合十神、宫位、喜忌、刑冲合害与岁运结构，推出这个年份还可能同步牵动的其他方面，例如事业、学业、家宅、人际、财务、身体、证照、搬动等。',
    '但这种扩展必须有八字依据，不允许无根据发散。',
    '若某个年份虽然结构强，但与现实年龄常识冲突，必须自动修正表达。例如儿童期优先落在家庭、健康、学业、搬迁、亲缘、惊吓、人际，不要硬断恋爱婚变。',
    '六亲分析不能机械缩成几条空话。凡本地规则已经给出较强依据的内容，尤其兄弟数量、排行、头胎男女、同胎、多子少子、父母状态等，要充分吸收后再继续展开。',
    '对于兄弟排行这类内容，如果本地规则已经给出“若与现实不符，可能是什么原因”，这些解释不要删减，不要擅自简化成一句模糊话。',
    '允许你超出本地规则已写出的表面断语继续深推，但不允许脱离本地规则主轴乱发挥。',
    '输出顺序固定为：1. 流年验事 2. 六亲断语 3. 直接回答当前问题。',
    '流年验事优先写最有把握、最有证据的 2 到 4 个年份；每个年份直接落到具体事件方向，不要只停留在本地规则已经写出的单一事件面向，也不要把完整规则链原样抄给用户。',
    '六亲断语以本地规则强结论为骨架，在此基础上继续深入分析，不要只停留在规则原句。谁的信息最强就重点写谁，但不要漏掉本地规则里已经很关键的六亲信息。',
    '六亲断语直接下结论，必要时用一句短证据托住，不要再展示“定位规则 / 宫位规则 / 状态规则”等内部标题。',
    '涉及高风险绝对直断时，必须先带免责声明，再给结论。',
    question
      ? `当前问题必须落回这里作答：${question}`
      : '如果用户没有额外问题，就以“历史流年验事 + 六亲重点直断”为主。',
  ].join('\n');
}

export function buildBaziAiBridgeFocusV3(chartData: BaZiChartData, question?: string): string {
  const yongShen = analyzeYongShen(chartData);
  const blind = analyzeBlindThreePass(chartData, question);
  const blindReference = buildBlindThreePassAiReferencePayload(blind);
  const blindAiDetail = buildBlindThreePassAiDetailPayload(blind);

  return [
    '以下内容是页面本地规则引擎生成的隐藏上下文，供你回答时使用。不要把原始 JSON、全部规则过程、字段名或逐关分析原样复述给用户。',
    '你要把这些材料当作“命理师案头资料”，不是当作现成答案照抄。你的任务是在这些资料基础上继续推论、继续深入分析。',
    '回答时必须先根据 chartData.rawBaziData、关系信息、大运流年和用户问题自行分析，但不得绕开本地规则；原盘判断、本地喜用神结论、本地过三关规则三者必须交叉校验。',
    question ? `当前问题：${question}` : '当前问题：命局总览',
    `喜用神规则结果：${JSON.stringify(buildYongShenAiPayload(yongShen), null, 2)}`,
    `过三关候选参考：${JSON.stringify(blindReference, null, 2)}`,
    `过三关规则明细（仅供必要时查阅）：${JSON.stringify(blindAiDetail, null, 2)}`,
    `高风险直断免责声明：${blind.highRiskDisclaimer}`,
    '当前分析材料包括：1. 八字原盘与 rawBaziData 2. 十神、宫位、关系信息 3. 大运流年 4. 喜用神规则结果 5. 过三关规则结果 6. 用户当前问题。',
    '你的工作方式必须是：先读原盘、十神结构、宫位关系、大运流年；再把喜用神结果真正纳入判断，明确事件和六亲是顺用神还是逆用神；再把过三关规则结果当作强参考，尤其是六亲定式、特殊流年、兄弟排行数量、头胎男女、同胎、多子少子、父母状态等；在以上基础上继续深入推论，而不是停留在本地规则给出的表层断语。',
    '使用优先级要求：',
    '1. 原盘、大运流年、现实年龄常识是基础。',
    '2. 喜用神引擎结果必须进入流年验事判断，明确区分哪些年份是在扶用神、泄用神、制忌神还是助忌神。',
    '3. 特殊流年判断必须同时看流年神煞、全年刑冲合害、命中宫位、触发十神和牵动六亲。',
    '4. 六亲部分必须充分吸收本地规则，尤其兄弟数量排行、头胎男女、同胎、子女多少等定式信息，原则上以规则为主，不要随意推翻。',
    '5. 本地规则中的“应事”与“断语”只是基础参考，你可以继续往下分析，补出更完整的现实事件形态、人物关系和事情走向。',
    '6. 如果某个流年的本地规则输出只落在一方面，例如只写感情、只写父母、只写财务，你仍应继续依照八字逻辑，推演这个年份还可能连带牵动的其他方面，例如事业、学业、家宅、身体、人际、搬动、证照、口舌、合作等，但必须有命理依据，不可空扩。',
    '7. 但不能违背原盘结构、喜忌逻辑和现实年龄常识。',
    '8. 六亲部分里，凡本地规则已经给出较强定式的，默认优先保留其主判断，不要随意弱化。',
    '9. 尤其兄弟排行类断语，如果规则已经给出“若与现实不符，可能对应上方手足有损、分开抚养、不同门、排行错位”等解释，这些关键解释不要删减。',
    '10. 你可以比规则讲得更深，但不要比规则讲得更虚。',
    '面向用户的输出要求：优先输出最终判断，不要输出规则过程。',
    '默认输出结构：',
    '1. 流年验事：只挑最强的 2 到 4 个年份，每个年份直接说可能发生了什么，但每条判断都必须暗含喜用神、神煞、刑冲合害和六亲牵动的综合依据，而且不局限于规则里已经点出的单一事项。',
    '2. 六亲断语：以本地规则强结论为骨架，再继续深入分析，尤其不能漏掉兄弟数量排行、头胎男女、同胎等规则主导项；不要先解释规则，再给结论。',
    '3. 当前问题回答：回到用户提问本身，直接回答。',
    '除非用户追问，不要展开完整规则过程，不要复述“第一关 / 第二关 / 第三关”的内部推导。若涉及高风险绝对直断，必须先带免责声明再给结论。',
  ].join('\n\n');
}
