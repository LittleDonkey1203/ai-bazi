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

function buildBlindThreePassAiReferencePayload(blind: BlindThreePassAnalysis) {
  const strongestSpecialYears = blind.specialYears.slice(0, 4).map((item) => ({
    year: item.year,
    age: item.age,
    kind: item.kind,
    tone: item.tone,
    score: item.score,
    linkedLiuQinLabels: item.linkedLiuQinLabels,
    annualRelations: item.annualRelations,
    annualGods: item.annualGods,
    likelyEvents: item.likelyEvents.slice(0, 3),
  }));

  const priorityLiuQin = [...blind.liuqinProfiles]
    .map((profile) => ({
      label: profile.label,
      referenceScore: scoreLiuQinReference(profile),
      tendency: profile.tendency,
      bodyUseMode: profile.bodyUseMode,
      directCuts: profile.directCuts.slice(0, 2),
      relatedSpecialYears: profile.relatedSpecialYears.slice(0, 2),
      chapterSignals: profile.chapterSignals.slice(0, 2),
      highRiskDirectJudgments: profile.highRiskDirectJudgments.slice(0, 1),
    }))
    .sort((a, b) => b.referenceScore - a.referenceScore)
    .slice(0, 3);

  return {
    domain: blind.domain,
    domainLabel: blind.domainLabel,
    directConclusions: blind.directConclusions.slice(0, 4),
    strongestSpecialYears,
    priorityLiuQin,
    highRiskDisclaimer: blind.highRiskDisclaimer,
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

  return [
    '本轮优先任务：先以 yongshen-v2 的本地喜用神结论为背景，再按高德臣盲派“过三关”的顺序直断。',
    '过三关顺序固定：第一关立极定体用和对象；第二关看六亲星、宫位、同体异体；第三关看做功、状态、吉凶、引动与应期。',
    '回答时先给直断结论，再给依据，不要先写冗长的八字基础科普。',
    question ? `用户当前问题：${question}` : '用户未指定单一问题，先围绕命主本身、事业、财运、婚姻展开。',
    `前置喜用神结论：格局 ${yongShen.finalPattern} / 用神 ${formatYongShenV2Elements(yongShen.yongElements)} / 忌神 ${formatYongShenV2Elements(yongShen.jiElements)}`,
    `喜用神规则结果：${JSON.stringify(buildYongShenAiPayload(yongShen), null, 2)}`,
    `盲派过三关规则结果：${JSON.stringify(blind, null, 2)}`,
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

  return [
    '以下内容是页面本地规则引擎生成的隐藏上下文，供 AI 回答时使用，不要把原始 JSON、全部规则过程或逐关分析整段复述给用户。',
    question ? `当前问题：${question}` : '当前问题：命局总览',
    `喜用神规则结果：${JSON.stringify(buildYongShenAiPayload(yongShen), null, 2)}`,
    `过三关规则结果：${JSON.stringify(blind, null, 2)}`,
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
    '必须先基于命盘原始数据、当前大运流年、用户问题自行完成判断，再参考本地规则结果做交叉验证。',
    '本地规则结果只是候选参考，不是必须照抄的标准答案；如果与命盘结构、流年组合或现实常识冲突，以你重新判断后的结果为准。',
    '输出顺序固定为：1. 流年验事 2. 六亲断语 3. 直接回答当前问题。',
    '流年验事只选最强的 2 到 4 个年份，直接说最可能发生过的具体事，不要铺陈规则链。',
    '六亲断语只说把握最大的 1 到 3 项，宁缺毋滥，不要把父母、兄弟、配偶、子女全部平铺说一遍。',
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

  return [
    '以下内容是页面本地规则引擎生成的隐藏上下文，供 AI 回答时使用，不要把原始 JSON、全部规则过程或逐关分析整段复述给用户。',
    '回答时必须先根据 chartData.rawBaziData、关系信息、大运流年和用户问题自行分析，再把本地规则结果当作参考校验，不要直接改写成本地规则摘要。',
    question ? `当前问题：${question}` : '当前问题：命局总览',
    `喜用神规则结果：${JSON.stringify(buildYongShenAiPayload(yongShen), null, 2)}`,
    `过三关候选参考：${JSON.stringify(blindReference, null, 2)}`,
    `过三关规则明细（仅供必要时查阅）：${JSON.stringify(blind, null, 2)}`,
    `高风险直断免责声明：${blind.highRiskDisclaimer}`,
    '面向用户的输出要求：优先输出你重新分析后的最终判断、流年验事、六亲断语，以及对当前问题的直接回答。',
    '默认输出结构：',
    '1. 流年验事：只挑最强的 2 到 4 个年份，每个年份直接说可能发生了什么，不要展开完整规则链。',
    '2. 六亲断语：只挑把握最大的 1 到 3 项来讲，不要把所有六亲都说一遍，不要先解释规则，再给结论。',
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
