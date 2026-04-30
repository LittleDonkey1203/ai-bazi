import {
  calculateCantianRelationSummary,
  getCantianExtraGods,
  getCantianFlowYearGanzhi,
  getCantianPillarDetailFromGanzhi,
} from '../cantianAdapter';
import type { BaZiChartData } from '../logic';
import { DOMAIN_CONFIG, RELATION_KEY_TO_PILLAR } from './knowledge';
import type {
  BlindThreePassYongShenContext,
  DomainConfig,
  LiuQinConfig,
  LuckTone,
  PillarKey,
  QuestionDomain,
  RelationGroup,
  RelationItem,
  RelationSection,
  RelationSummary,
  SpecialYearHit,
} from './types';

const SPECIAL_YEAR_BASE_SCORE: Record<SpecialYearHit['kind'], number> = {
  岁运并临: 96,
  天克地冲: 94,
  反吟: 90,
  伏吟: 86,
  天合地合: 82,
};

const PILLAR_WEIGHT: Record<PillarKey, number> = {
  日柱: 12,
  月柱: 10,
  时柱: 8,
  年柱: 6,
};

const SUPPORTIVE_GODS = new Set([
  '天乙贵人',
  '月德贵人',
  '天德贵人',
  '德秀贵人',
  '福星贵人',
  '太极贵人',
  '文昌贵人',
  '天厨贵人',
  '天官贵人',
  '国印贵人',
]);

const CAUTION_GODS = new Set([
  '灾煞',
  '元辰',
  '童子煞',
  '亡神',
  '劫煞',
  '孤辰',
  '寡宿',
  '白虎',
  '丧门',
  '吊客',
]);

const EMOTION_GODS = new Set(['桃花', '红艳', '红鸾', '天喜', '咸池']);
const ACADEMIC_GODS = new Set(['文昌贵人', '德秀贵人', '太极贵人', '学堂']);
const MOBILITY_GODS = new Set(['驿马']);
const ACCIDENT_GODS = new Set(['灾煞', '白虎', '羊刃', '血刃']);

type AgeStage = 'child' | 'teen' | 'youth' | 'adult' | 'mature';

function getAgeStage(age: number): AgeStage {
  if (age <= 12) {
    return 'child';
  }
  if (age <= 17) {
    return 'teen';
  }
  if (age <= 22) {
    return 'youth';
  }
  if (age <= 49) {
    return 'adult';
  }
  return 'mature';
}

function getRealityPenalty(domain: QuestionDomain, age: number): number {
  if (domain === 'relationship') {
    if (age <= 12) {
      return 42;
    }
    if (age <= 17) {
      return 20;
    }
  }

  if (domain === 'career') {
    if (age <= 12) {
      return 42;
    }
    if (age <= 15) {
      return 30;
    }
    if (age <= 18) {
      return 12;
    }
  }

  if (domain === 'wealth') {
    if (age <= 12) {
      return 34;
    }
    if (age <= 17) {
      return 18;
    }
  }

  if (domain === 'children') {
    if (age <= 18) {
      return 36;
    }
    if (age <= 22) {
      return 14;
    }
  }

  return 0;
}

function collectTargets(items?: RelationItem[]): PillarKey[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return Array.from(
    new Set(
      items
        .map((item) => RELATION_KEY_TO_PILLAR[item.柱])
        .filter((pillar): pillar is PillarKey => Boolean(pillar)),
    ),
  );
}

function collectKnowledgePoints(items?: RelationItem[]): string[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => item.知识点);
}

function getGroupItems(group?: RelationGroup, relationType?: string): RelationItem[] {
  if (!group || !relationType) {
    return [];
  }
  return Array.isArray(group[relationType]) ? group[relationType] : [];
}

function collectAnnualRelations(flowSection?: RelationSection): string[] {
  if (!flowSection) {
    return [];
  }

  const lines: string[] = [];
  const stemGroup = flowSection.天干 ?? {};
  const branchGroup = flowSection.地支 ?? {};

  Object.entries(stemGroup).forEach(([type, items]) => {
    (items || []).forEach((item) => {
      lines.push(`天干${type}：${item.知识点}`);
    });
  });

  Object.entries(branchGroup).forEach(([type, items]) => {
    (items || []).forEach((item) => {
      lines.push(`地支${type}：${item.知识点}`);
    });
  });

  (flowSection.双冲 ?? []).forEach((item) => {
    lines.push(`双冲：${item.知识点}`);
  });

  (flowSection.伏吟 ?? []).forEach((item) => {
    lines.push(`伏吟：${item.知识点}`);
  });

  return Array.from(new Set(lines));
}

function classifyAnnualGods(gods: string[]) {
  const unique = Array.from(new Set(gods));
  return {
    supportiveGods: unique.filter((god) => SUPPORTIVE_GODS.has(god)),
    cautionGods: unique.filter((god) => CAUTION_GODS.has(god)),
    emotionGods: unique.filter((god) => EMOTION_GODS.has(god)),
    academicGods: unique.filter((god) => ACADEMIC_GODS.has(god)),
    mobilityGods: unique.filter((god) => MOBILITY_GODS.has(god)),
    accidentGods: unique.filter((god) => ACCIDENT_GODS.has(god)),
  };
}

function pickDominantKind(params: {
  flowSection?: RelationSection;
  fortuneGanzhi: string;
  flowGanzhi: string;
}): {
  kind: SpecialYearHit['kind'];
  targetPillars: PillarKey[];
  matchedRelations: string[];
} | null {
  const { flowSection, fortuneGanzhi, flowGanzhi } = params;
  if (!flowSection) {
    if (fortuneGanzhi === flowGanzhi) {
      return {
        kind: '岁运并临',
        targetPillars: [],
        matchedRelations: ['大运与流年同柱'],
      };
    }
    return null;
  }

  const stemChongItems = getGroupItems(flowSection.天干, '冲');
  const branchChongItems = getGroupItems(flowSection.地支, '冲');
  const stemHeItems = getGroupItems(flowSection.天干, '合');
  const branchHeItems = getGroupItems(flowSection.地支, '合');
  const doubleChongItems = Array.isArray(flowSection.双冲) ? flowSection.双冲 : [];
  const fuyinItems = Array.isArray(flowSection.伏吟) ? flowSection.伏吟 : [];

  if (fortuneGanzhi === flowGanzhi) {
    return {
      kind: '岁运并临',
      targetPillars: collectTargets(fuyinItems),
      matchedRelations: ['大运与流年同柱', ...collectKnowledgePoints(fuyinItems)],
    };
  }

  const stemChongTargets = new Set(collectTargets(stemChongItems));
  const branchChongTargets = new Set(collectTargets(branchChongItems));
  const stemHeTargets = new Set(collectTargets(stemHeItems));
  const branchHeTargets = new Set(collectTargets(branchHeItems));

  const samePillarChong = Array.from(stemChongTargets).filter((pillar) => branchChongTargets.has(pillar));
  if (samePillarChong.length > 0) {
    return {
      kind: samePillarChong.some((pillar) => pillar === '日柱' || pillar === '月柱') ? '天克地冲' : '反吟',
      targetPillars: samePillarChong,
      matchedRelations: [...collectKnowledgePoints(stemChongItems), ...collectKnowledgePoints(branchChongItems)],
    };
  }

  const doubleChongTargets = collectTargets(doubleChongItems);
  if (doubleChongTargets.length > 0) {
    return {
      kind: '反吟',
      targetPillars: doubleChongTargets,
      matchedRelations: collectKnowledgePoints(doubleChongItems),
    };
  }

  if (fuyinItems.length > 0) {
    return {
      kind: '伏吟',
      targetPillars: collectTargets(fuyinItems),
      matchedRelations: collectKnowledgePoints(fuyinItems),
    };
  }

  const samePillarHe = Array.from(stemHeTargets).filter((pillar) => branchHeTargets.has(pillar));
  if (samePillarHe.length > 0) {
    return {
      kind: '天合地合',
      targetPillars: samePillarHe,
      matchedRelations: [...collectKnowledgePoints(stemHeItems), ...collectKnowledgePoints(branchHeItems)],
    };
  }

  return null;
}

function resolveLuckTone(
  yongShen: BlindThreePassYongShenContext,
  flowGanzhi: string,
  dayMaster: string,
): {
  tone: LuckTone;
  triggeredTenGods: string[];
} {
  const flowDetail = getCantianPillarDetailFromGanzhi(flowGanzhi, dayMaster);
  const triggeredTenGods = [
    flowDetail.天干?.十神,
    ...Object.values(flowDetail.地支.藏干 ?? {})
      .map((item) => item?.十神)
      .filter((item): item is string => Boolean(item)),
  ].filter((item): item is string => Boolean(item));
  const elements = [flowDetail.天干.五行, flowDetail.地支.五行];
  let yongCount = 0;
  let jiCount = 0;

  elements.forEach((element) => {
    if (yongShen.yongElements.includes(element)) {
      yongCount += 1;
    }
    if (yongShen.jiElements.includes(element)) {
      jiCount += 1;
    }
  });

  if (jiCount > yongCount) {
    return { tone: '偏凶', triggeredTenGods };
  }
  if (yongCount > jiCount) {
    return { tone: '偏吉', triggeredTenGods };
  }
  return { tone: '吉凶并见', triggeredTenGods };
}

function inferLinkedLiuQinLabels(params: {
  liuQinConfigs: LiuQinConfig[];
  targetPillars: PillarKey[];
  triggeredTenGods: string[];
}): string[] {
  const { liuQinConfigs, targetPillars, triggeredTenGods } = params;
  return liuQinConfigs
    .filter((config) =>
      config.palaces.some((pillar) => targetPillars.includes(pillar))
      || config.tenGods.some((god) => triggeredTenGods.includes(god)),
    )
    .map((config) => config.label);
}

function buildImportantReasonLines(params: {
  kind: SpecialYearHit['kind'];
  domainConfig: DomainConfig;
  targetPillars: PillarKey[];
  tone: LuckTone;
  matchedRelations: string[];
  annualRelations: string[];
  linkedLiuQinLabels: string[];
  annualGods: string[];
  supportiveGods: string[];
  cautionGods: string[];
  yongShen: BlindThreePassYongShenContext;
}): string[] {
  const {
    kind,
    domainConfig,
    targetPillars,
    tone,
    matchedRelations,
    annualRelations,
    linkedLiuQinLabels,
    annualGods,
    supportiveGods,
    cautionGods,
    yongShen,
  } = params;

  const lines = [
    `${kind}落在${targetPillars.length > 0 ? targetPillars.join('、') : '大运与流年'}，本轮优先核对${domainConfig.palaces.join('、')}。`,
    matchedRelations.length > 0 ? `主证据：${matchedRelations.join('；')}` : '本年以同柱或伏吟关系为主。',
  ];

  if (annualRelations.length > matchedRelations.length) {
    lines.push(`全年关系链：${annualRelations.join('；')}`);
  }

  if (linkedLiuQinLabels.length > 0) {
    lines.push(`关联六亲：${linkedLiuQinLabels.join('、')}`);
  }

  if (annualGods.length > 0) {
    lines.push(`流年神煞：${annualGods.join('、')}`);
  }

  if (supportiveGods.length > 0) {
    lines.push(`当年也带 ${supportiveGods.join('、')}，说明不是单纯硬冲，往往还有贵人、文书、资源或缓冲。`);
  }

  if (cautionGods.length > 0) {
    lines.push(`当年同时带 ${cautionGods.join('、')}，即便表面成事，也更容易伴随口舌、病痛、磕碰或情绪代价。`);
  }

  if (tone === '偏凶') {
    lines.push(`流年五行更偏向忌神 ${yongShen.jiElements.join('、')}，应事更容易带冲击、压力或被迫调整。`);
  } else if (tone === '偏吉') {
    lines.push(`流年五行能借到用神 ${yongShen.yongElements.join('、')}，即便有冲合，也更像主动变局或借势成事。`);
  } else {
    lines.push('这一年吉凶并见，往往一边出结果，一边付代价。');
  }

  return lines;
}

function buildRealityAdjustedEvents(params: {
  domain: QuestionDomain;
  age: number;
  targetPillars: PillarKey[];
  linkedLiuQinLabels: string[];
  tone: LuckTone;
  annualRelations: string[];
  annualGods: string[];
  supportiveGods: string[];
  cautionGods: string[];
}): string[] {
  const {
    domain,
    age,
    targetPillars,
    linkedLiuQinLabels,
    tone,
    annualRelations,
    annualGods,
    supportiveGods,
    cautionGods,
  } = params;
  const ageStage = getAgeStage(age);
  const targetSet = new Set(targetPillars);
  const familyLabel = linkedLiuQinLabels.length > 0 ? linkedLiuQinLabels.join('、') : '家里人';
  const hasEmotionGod = annualGods.some((god) => EMOTION_GODS.has(god));
  const hasAcademicGod = annualGods.some((god) => ACADEMIC_GODS.has(god));
  const hasMobilityGod = annualGods.some((god) => MOBILITY_GODS.has(god));
  const hasAccidentGod = annualGods.some((god) => ACCIDENT_GODS.has(god));
  const hasPunishOrHarm = annualRelations.some((item) => item.includes('地支刑') || item.includes('地支害'));
  const hasRush = annualRelations.some((item) => item.includes('冲'));

  if (ageStage === 'child') {
    const childEvents = [
      `这一年不能按成年人的婚恋、事业去断，更像学校、家庭安排、搬家转学、身体磕碰或和${familyLabel}有关的事。`,
      hasAcademicGod
        ? `当年见 ${annualGods.filter((god) => ACADEMIC_GODS.has(god)).join('、')}，更容易应在学习表现、竞赛考试、老师关注或才艺机会。`
        : '若月柱和年柱受动，常见应在家里规矩变化、父母操心、学校环境或住宿安排。',
      hasAccidentGod || hasPunishOrHarm
        ? '因为当年还带刑害或煞气，现实里要优先防磕碰受伤、发烧炎症、惊吓和情绪不稳。'
        : '如果有合而无重冲，更像环境调整、有人照应或生活节奏被重新安排。',
    ];

    if (domain === 'relationship' || hasEmotionGod) {
      childEvents[1] = hasEmotionGod
        ? `当年见 ${annualGods.filter((god) => EMOTION_GODS.has(god)).join('、')}，也不要直断成感情大事，更像人缘、早熟心思、同学互动或家长对交友的干预。`
        : '即便问到感情，也只能落在人缘、同学相处、家庭对交友的限制，不应直断婚恋。';
    }

    return childEvents;
  }

  if (ageStage === 'teen') {
    if (domain === 'relationship' || hasEmotionGod) {
      return [
        `这一年更像青春期的人缘、早恋苗头、暗中喜欢或因交友问题和家里、学业发生冲突，不应直断成婚姻变化。`,
        hasEmotionGod
          ? `当年见 ${annualGods.filter((god) => EMOTION_GODS.has(god)).join('、')}，会放大异性缘和情绪波动，但现实落点仍以同学圈、网络社交、家长管控为主。`
          : '若再压到日柱，情绪与自我认同会更明显，容易因为关系或面子问题影响学习状态。',
        hasPunishOrHarm || hasRush
          ? '刑冲害重时，常见的不是定婚，而是闹脾气、被家长发现、关系中断、转学分班或社交圈洗牌。'
          : '若合多于冲，则更像有人接近、收到关注，或者因为活动、社团、成绩而增加互动。',
      ];
    }

    if (domain === 'career') {
      return [
        '这个年龄段不按职场直断，更现实的是升学方向、师长关系、班级位置、竞赛资格、社团角色或第一次明确未来路径。',
        hasAcademicGod
          ? `当年见 ${annualGods.filter((god) => ACADEMIC_GODS.has(god)).join('、')}，更容易出现在考试发挥、老师器重、证书录取或文书作品。`
          : '若月柱受动，往往是学校规则变化、班主任压力、分班、住校或家庭对学业投入增加。',
        hasAccidentGod || hasPunishOrHarm
          ? '若还带煞与刑害，要防叛逆、被处分、受伤、生病或心理压力骤增。'
          : '若贵人神煞重，常有人帮扶、介绍机会或给出关键建议。',
      ];
    }
  }

  if (ageStage === 'youth') {
    if (domain === 'career') {
      return [
        '这一年更现实的落点是专业选择、实习、毕业去向、第一次正式就业、考公考研或岗位试错，不一定已经到高位变动。',
        supportiveGods.length > 0
          ? `当年带 ${supportiveGods.join('、')}，适合借师长、前辈、文书资格和平台资源上台阶。`
          : '若月柱和时柱同时被牵动，常见是实习转正、换城市、项目收口或毕业后路径敲定。',
        cautionGods.length > 0 || hasPunishOrHarm
          ? '若又带煞和刑害，容易出现 offer 反复、考试失利、合同不顺、与上级不合或去留两难。'
          : '若冲合得用，多半是带压力的机会，不一定轻松，但能把方向定下来。',
      ];
    }

    if (domain === 'wealth') {
      return [
        '这个年龄段更现实的财事是学费、生活费、第一份收入、兼职、奖学金、家里资助、搬家租房和初步理财，不宜直断成大额产业腾挪。',
        hasAcademicGod
          ? '若有文昌、德秀之类，多半与证书、录取、奖助学金、文书成果直接相关。'
          : '若时柱受动，更容易应在兼职收入、项目回款或生活成本突然加大。',
        cautionGods.length > 0 || hasPunishOrHarm
          ? '若带煞重，则钱事更像花销失控、被骗、电子产品损坏、押金纠纷或家里临时支出。'
          : '若贵人神煞重，则常有人帮衬或通过平台拿到第一笔像样的收入。',
      ];
    }
  }

  if (domain === 'relationship' || targetSet.has('日柱')) {
    return [
      `这一年婚恋最容易被推到必须表态的节点，常见应在确定关系、订婚同居、分手分居之间，属于${tone === '偏吉' ? '主动定局' : tone === '偏凶' ? '被动翻盘' : '边成边耗'}。`,
      hasEmotionGod
        ? `当年见 ${annualGods.filter((god) => EMOTION_GODS.has(god)).join('、')}，异性缘、吸引力和情绪纠缠都会被放大，容易一边动心一边惹是非。`
        : '若当年已有对象，多半不是小摩擦，而是双方现实条件、住处、距离或父母意见直接介入。',
      cautionGods.length > 0 || hasPunishOrHarm
        ? '若又见煞与刑害，就算成事，也容易夹着口舌、冷战、三方介入、健康或居住问题。'
        : targetSet.has('时柱')
          ? '时柱也被带动时，感情事常和怀孕、生育计划、后续生活安排一起出现。'
          : '若流年又压到月柱，常见工作平台或家里安排直接影响婚事进退。',
    ];
  }

  if (domain === 'career' || targetSet.has('月柱')) {
    return [
      '这一年事业位最容易出硬事件，常见应在换岗离职、团队拆分、上级更替、项目停摆或重新分工。',
      supportiveGods.length > 0
        ? `当年带 ${supportiveGods.join('、')}，说明不是纯粹受打击，也可能是借贵人、证书、文书和平台改位。`
        : tone === '偏吉'
          ? '偏吉时更像带压力的上台、接权、换更大平台。'
          : '偏凶时更像被动背责、制度卡住、不得不换环境。',
      cautionGods.length > 0 || hasPunishOrHarm
        ? '若同时见刑害和煞气，要防口舌是非、制度处罚、合同阻滞、出差奔波或身体扛不住。'
        : targetSet.has('日柱')
          ? '日柱也被牵动时，事情不会只停在工作层面，个人状态和家庭节奏通常会一起被打乱。'
          : '如果还连到时柱，往往是项目结果、业绩兑现或离职后的去向一并落地。',
    ];
  }

  if (domain === 'wealth') {
    return [
      '这一年财运不是小钱小账，常见应在大额进出、投资取舍、买房装修、借贷还款或合作分账。',
      supportiveGods.length > 0
        ? `当年带 ${supportiveGods.join('、')}，更像资源带财、贵人带财、手续批下来或通过平台赚到钱。`
        : tone === '偏吉'
          ? '偏吉时更像借项目、平台或资源做成一笔事。'
          : '偏凶时更像资金链吃紧、回款拖延、合伙反复或花销压顶。',
      cautionGods.length > 0 || hasPunishOrHarm
        ? '若又见刑害与煞气，钱事最怕合同问题、税务处罚、家里突发支出、医疗开销或合伙翻脸。'
        : targetSet.has('月柱')
          ? '月柱动得重时，钱事多和工作平台、家庭责任、长辈安排绑定。'
          : '时柱动得重时，更容易应在结果兑现、后续负担或子女开销。',
    ];
  }

  if (domain === 'parents' || targetSet.has('年柱')) {
    return [
      `这一年${familyLabel}一侧最容易出硬事，常见应在身体检查、住处调整、家里翻修、老人操心或家庭关系重排。`,
      hasMobilityGod
        ? `当年见 ${annualGods.filter((god) => MOBILITY_GODS.has(god)).join('、')}，更容易伴随搬家、奔波、异地处理家事或往返医院。`
        : tone === '偏吉'
          ? '偏吉时更像搬家置业、家里办喜事、父母资源帮忙。'
          : '偏凶时更像病痛、争执、负债或必须扛责任。',
      cautionGods.length > 0 || hasAccidentGod
        ? '若当年还见煞气，优先防老人健康、交通磕碰、官非口舌或家中突发情况。'
        : targetSet.has('月柱')
          ? '年柱连月柱一起动时，往往不是外缘消息，而是家里要你亲自处理。'
          : '若只打年柱，多是长辈背景、老家事务、祖上房产或远方亲属牵出来的事。',
    ];
  }

  if (domain === 'children' || targetSet.has('时柱')) {
    return [
      '这一年多应在子女、怀孕、生育、教育安排、项目结果或晚一步才显的事情上。',
      supportiveGods.length > 0
        ? `当年带 ${supportiveGods.join('、')}，更容易把后续安排、录取结果、怀孕生子或项目收口往好的方向推。`
        : tone === '偏吉'
          ? '偏吉时更像怀孕生子、项目收口、考试录取、后续安排敲定。'
          : '偏凶时更像为孩子操心、结果反复、延误返工或后续成本超预期。',
      cautionGods.length > 0 || hasPunishOrHarm
        ? '若再见刑害煞气，则要防流产保胎、孩子病伤、项目返工或结果拖延。'
        : targetSet.has('日柱')
          ? '若日柱也一起动，命主个人生活节奏会被直接拉进来，不是旁观性质。'
          : '若只动时柱，很多事是先有征兆，后见结果。',
    ];
  }

  if (domain === 'siblings') {
    return [
      '这一年兄弟姐妹、同辈、合伙人或朋友圈最容易出实事，常见应在资源争夺、借钱、合作、翻脸或重新抱团。',
      supportiveGods.length > 0
        ? `当年带 ${supportiveGods.join('、')}，也可能表现为同辈帮忙、贵人介绍资源、合作暂时还能成。`
        : tone === '偏吉'
          ? '偏吉时能变成同辈帮忙、联合成事。'
          : '偏凶时则容易变成分钱、抢资源、口舌和站队。',
      cautionGods.length > 0 || hasPunishOrHarm
        ? '若又见刑害煞气，最要防借钱失和、项目扯皮、同学朋友翻脸或因站队惹事。'
        : targetSet.has('月柱')
          ? '月柱被引动时，这类人会直接影响你的工作平台和日常秩序。'
          : '若再牵到日柱，最终会落回你自己的生活安排和利益分配。',
    ];
  }

  if (domain === 'health') {
    return [
      '这一年健康位不能按小问题看，常见应在炎症、睡眠情绪、刀伤碰伤、手术检查或慢性问题突然被放大。',
      supportiveGods.length > 0
        ? `当年带 ${supportiveGods.join('、')}，说明也有机会通过检查、调理、手术或治疗把问题处理掉。`
        : tone === '偏吉'
          ? '偏吉时更像主动检查、调理、戒旧习，借变局把问题处理掉。'
          : '偏凶时则容易拖成不得不治、不得不休息。',
      cautionGods.length > 0 || hasAccidentGod
        ? '若再见煞气，要格外防意外伤、血光、炎症、交通磕碰和精神内耗。'
        : targetSet.has('日柱')
          ? '日柱受冲时，身体和情绪通常会同步出反应。'
          : '若月柱受压更重，则多半和工作压力、作息失衡、家里责任一起到来。',
    ];
  }

  return [
    `这一年不太像平年，更多是${tone === '偏吉' ? '主动定局' : tone === '偏凶' ? '被动翻盘' : '边成边耗'}式的节点年，事情会逼着你表态或调整。`,
    cautionGods.length > 0 || hasAccidentGod
      ? `流年又带 ${cautionGods.join('、') || '煞气'}，现实里往往不是只变不痛，而是边动边付代价。`
      : targetSet.has('月柱')
        ? '月柱被打到时，最常应在工作平台、家庭秩序、父母责任和现实规则层面。'
        : '若先冲到年柱，往往从家门、老家、长辈、外部环境开始起事。',
    supportiveGods.length > 0
      ? `好处是当年也带 ${supportiveGods.join('、')}，说明关键时刻往往还有人帮、手续能过或结果能被兜住。`
      : targetSet.has('时柱')
        ? '时柱也被带动，后续结果、项目落点、子女和晚一步显现的事会非常明显。'
        : '若日柱被牵住，命主自己和婚姻核心通常绕不过去。',
  ];
}

function scoreYear(params: {
  kind: SpecialYearHit['kind'];
  targetPillars: PillarKey[];
  domainConfig: DomainConfig;
  domain: QuestionDomain;
  age: number;
  triggeredTenGods: string[];
  tone: LuckTone;
  supportiveGods: string[];
  cautionGods: string[];
  annualRelations: string[];
}): number {
  const { kind, targetPillars, domainConfig, domain, age, triggeredTenGods, tone, supportiveGods, cautionGods, annualRelations } = params;
  const pillarScore = targetPillars.reduce((sum, pillar) => sum + PILLAR_WEIGHT[pillar], 0);
  const palaceScore = targetPillars.filter((pillar) => domainConfig.palaces.includes(pillar)).length * 8;
  const godScore = triggeredTenGods.filter((god) => domainConfig.tenGods.includes(god)).length * 4;
  const toneScore = tone === '偏凶' ? 6 : tone === '偏吉' ? 4 : 3;
  const cautionScore = cautionGods.length * 2;
  const supportScore = supportiveGods.length;
  const relationScore = annualRelations.filter((item) => item.includes('地支刑') || item.includes('地支害')).length * 2;
  const realityPenalty = getRealityPenalty(domain, age);

  return SPECIAL_YEAR_BASE_SCORE[kind] + pillarScore + palaceScore + godScore + toneScore + cautionScore + supportScore + relationScore - realityPenalty;
}

export function detectSpecialYears(params: {
  chartData: BaZiChartData;
  domain: QuestionDomain;
  yongShen: BlindThreePassYongShenContext;
  liuQinConfigs: LiuQinConfig[];
}): SpecialYearHit[] {
  const { chartData, domain, yongShen, liuQinConfigs } = params;
  const domainConfig = DOMAIN_CONFIG[domain];
  const currentYear = new Date().getFullYear();
  const birthYear = chartData.birthDate.getFullYear();
  const natalInput = {
    年: {
      天干: chartData.fourPillars.year.stem,
      地支: chartData.fourPillars.year.branch,
    },
    月: {
      天干: chartData.fourPillars.month.stem,
      地支: chartData.fourPillars.month.branch,
    },
    日: {
      天干: chartData.fourPillars.day.stem,
      地支: chartData.fourPillars.day.branch,
    },
    时: {
      天干: chartData.fourPillars.hour.stem,
      地支: chartData.fourPillars.hour.branch,
    },
  };

  const hits: SpecialYearHit[] = [];

  chartData.decadeFortune.大运.forEach((fortune) => {
    const startYear = Math.max(fortune.开始年份, birthYear);
    const endYear = Math.min(fortune.结束, currentYear);

    for (let year = startYear; year <= endYear; year += 1) {
      const flowGanzhi = getCantianFlowYearGanzhi(year);
      const relationSummary = calculateCantianRelationSummary({
        ...natalInput,
        大运: {
          天干: fortune.干支.charAt(0),
          地支: fortune.干支.charAt(1),
        },
        流年: {
          天干: flowGanzhi.charAt(0),
          地支: flowGanzhi.charAt(1),
        },
      }) as RelationSummary;
      const picked = pickDominantKind({
        flowSection: relationSummary.流年,
        fortuneGanzhi: fortune.干支,
        flowGanzhi,
      });

      if (!picked) {
        continue;
      }

      const { tone, triggeredTenGods } = resolveLuckTone(yongShen, flowGanzhi, chartData.dayMaster);
      const annualRelations = collectAnnualRelations(relationSummary.流年);
      const annualGods = getCantianExtraGods(chartData.baziText, chartData.gender, [flowGanzhi])[0] ?? [];
      const { supportiveGods, cautionGods } = classifyAnnualGods(annualGods);
      const linkedLiuQinLabels = inferLinkedLiuQinLabels({
        liuQinConfigs,
        targetPillars: picked.targetPillars,
        triggeredTenGods,
      });
      const age = year - birthYear + 1;

      hits.push({
        year,
        age,
        fortuneGanzhi: fortune.干支,
        flowGanzhi,
        kind: picked.kind,
        score: scoreYear({
          kind: picked.kind,
          targetPillars: picked.targetPillars,
          domainConfig,
          domain,
          age,
          triggeredTenGods,
          tone,
          supportiveGods,
          cautionGods,
          annualRelations,
        }),
        tone,
        targetPillars: picked.targetPillars,
        triggeredTenGods,
        linkedLiuQinLabels,
        matchedRelations: picked.matchedRelations,
        annualRelations,
        annualGods,
        supportiveGods,
        cautionGods,
        whyImportant: buildImportantReasonLines({
          kind: picked.kind,
          domainConfig,
          targetPillars: picked.targetPillars,
          tone,
          matchedRelations: picked.matchedRelations,
          annualRelations,
          linkedLiuQinLabels,
          annualGods,
          supportiveGods,
          cautionGods,
          yongShen,
        }),
        likelyEvents: buildRealityAdjustedEvents({
          domain,
          age,
          targetPillars: picked.targetPillars,
          linkedLiuQinLabels,
          tone,
          annualRelations,
          annualGods,
          supportiveGods,
          cautionGods,
        }),
      });
    }
  });

  return hits
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return right.year - left.year;
    })
    .slice(0, 5);
}
