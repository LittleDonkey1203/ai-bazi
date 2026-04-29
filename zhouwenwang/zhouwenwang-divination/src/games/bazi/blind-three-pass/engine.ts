import type { BaZiChartData } from '../logic';
import { detectQuestionDomain, DOMAIN_CONFIG, getLiuQinConfigs, PILLAR_ROLE_HINTS } from './knowledge';
import { resolveLiuQinProfiles } from './liuqinResolver';
import { detectSpecialYears } from './specialYearDetector';
import type {
  BlindThreePassAnalysis,
  BlindThreePassYongShenContext,
  PillarKey,
  TenGodOccurrence,
} from './types';

function getCurrentFortune(chartData: BaZiChartData): string {
  const currentYear = new Date().getFullYear();
  const currentFortune = chartData.decadeFortune.大运.find(
    (item) => currentYear >= item.开始年份 && currentYear <= item.结束,
  );

  if (currentFortune) {
    return `${currentFortune.干支}（${currentFortune.开始年份}-${currentFortune.结束}）`;
  }

  return `起运年龄 ${chartData.decadeFortune.起运年龄} 岁`;
}

function collectTenGodOccurrences(chartData: BaZiChartData): TenGodOccurrence[] {
  const pillars: PillarKey[] = ['年柱', '月柱', '日柱', '时柱'];
  const result: TenGodOccurrence[] = [];

  pillars.forEach((pillar) => {
    const detail = chartData.rawBaziData[pillar];
    const stemGod = detail.天干?.十神;

    if (stemGod) {
      result.push({
        pillar,
        layer: '天干',
        god: stemGod,
        stem: detail.天干?.天干 || '',
      });
    }

    (['主气', '中气', '余气'] as const).forEach((layer) => {
      const hidden = detail.地支.藏干?.[layer];
      if (hidden?.十神) {
        result.push({
          pillar,
          layer,
          god: hidden.十神,
          stem: hidden.天干,
        });
      }
    });
  });

  return result;
}

function buildBodyUseHint(focusPalaces: PillarKey[], relevantOccurrences: TenGodOccurrence[]): string {
  const palaceSet = new Set(focusPalaces);
  const inCorePalace = relevantOccurrences.filter((item) => palaceSet.has(item.pillar));

  if (inCorePalace.length > 0) {
    return '目标十神已落入本题核心宫位，先按同体取用，直接看宫位承载、谁来做功、谁来接事。';
  }
  if (relevantOccurrences.length > 0) {
    return '目标十神在盘里有根，但多落外宫，偏异体取用，需要靠岁运把人和事从外面勾进来。';
  }
  return '目标十神不显，直断时不能只盯十神，要把宫位、制化和特殊流年放到前面。';
}

function buildDirectCutNotes(params: {
  chartData: BaZiChartData;
  yongShen: BlindThreePassYongShenContext;
  focusPalaces: PillarKey[];
  specialYears: BlindThreePassAnalysis['specialYears'];
}): string[] {
  const { chartData, yongShen, focusPalaces, specialYears } = params;
  const notes = [
    `体先落日主 ${chartData.dayMaster} 与日支，再看 ${focusPalaces.join('、')} 谁在承事。`,
    `当前大运为 ${getCurrentFortune(chartData)}，先核对 ${yongShen.yongElements.join('、')} 是否得运，再防 ${yongShen.jiElements.join('、')} 被岁运放大。`,
  ];

  if (yongShen.finalPattern === '化气格') {
    notes.push('此盘先按化气后的主气五行立极，六亲是否顺气成事，比单看一两个十神更关键。');
  } else if (['从格', '假从格'].includes(yongShen.finalPattern)) {
    notes.push('此盘顺势要求高，过三关时要先看哪一方在顺势，哪一方在逆势，逆势者往往就是代价。');
  } else if (['专旺格', '假专旺格', '身旺格'].includes(yongShen.finalPattern)) {
    notes.push('命局偏旺，第三关重点看财官食伤有没有真做功，还是只来引发冲突和消耗。');
  } else {
    notes.push('命局偏弱，第三关先看印比扶身够不够，再看财官食伤是不是压身成灾。');
  }

  if (specialYears.length > 0) {
    const topHit = specialYears[0];
    notes.push(`优先验证 ${topHit.year} 年（${topHit.fortuneGanzhi}/${topHit.flowGanzhi}，${topHit.kind}），这是一眼就该先拿出来验事的年份。`);
  }

  return notes;
}

function buildDirectConclusions(params: {
  specialYears: BlindThreePassAnalysis['specialYears'];
  liuqinProfiles: BlindThreePassAnalysis['liuqinProfiles'];
  yongShen: BlindThreePassYongShenContext;
}): string[] {
  const { specialYears, liuqinProfiles, yongShen } = params;
  const lines: string[] = [];
  const topHit = specialYears[0];

  if (topHit) {
    lines.push(`先拿 ${topHit.year} 年（${topHit.kind}）验事，这年最像会逼命主做决定的大节点，不是普通平年。`);
  }

  const pressureProfiles = liuqinProfiles.filter((item) => item.tendency === '偏压力').slice(0, 2);
  if (pressureProfiles.length > 0) {
    lines.push(`六亲里先防 ${pressureProfiles.map((item) => item.label).join('、')} 这几条线，它们更容易带来责任、耗财、病痛或关系上的硬碰硬。`);
  }

  const supportProfiles = liuqinProfiles.filter((item) => item.tendency === '偏助力').slice(0, 2);
  if (supportProfiles.length > 0) {
    lines.push(`能真正帮命主成事的，多半还是 ${supportProfiles.map((item) => item.label).join('、')} 这几条线。`);
  }

  lines.push(`最后还是要回到用忌：命局以 ${yongShen.yongElements.join('、')} 为用，凡能顺用神的年份多成事，逆用神的年份多出代价。`);
  return lines;
}

export function analyzeBlindThreePass(params: {
  chartData: BaZiChartData;
  question?: string;
  yongShen: BlindThreePassYongShenContext;
}): BlindThreePassAnalysis {
  const { chartData, question, yongShen } = params;
  const domain = detectQuestionDomain(question);
  const config = DOMAIN_CONFIG[domain];
  const occurrences = collectTenGodOccurrences(chartData);
  const relevantOccurrences = occurrences.filter((item) => config.tenGods.includes(item.god));
  const visibleOccurrences = relevantOccurrences
    .filter((item) => item.layer === '天干')
    .map((item) => `${item.pillar}${item.layer}见${item.god}（${item.stem}）`);
  const hiddenOccurrences = relevantOccurrences
    .filter((item) => item.layer !== '天干')
    .map((item) => `${item.pillar}${item.layer}藏${item.god}（${item.stem}）`);
  const palaceAnchors = config.palaces.map((pillar) => `${pillar}：${PILLAR_ROLE_HINTS[pillar]}`);
  const liuQinConfigs = getLiuQinConfigs(chartData.gender);
  const specialYears = detectSpecialYears({
    chartData,
    domain,
    yongShen,
    liuQinConfigs,
  });
  const liuqinProfiles = resolveLiuQinProfiles({
    chartData,
    yongShen,
    occurrences,
    specialYears,
  });

  return {
    domain,
    domainLabel: config.label,
    gate1: {
      liJi: `第一关先立极。当前以“${config.label}”为断点，先定命主自身与题目对象的主次，再落宫位。`,
      tiReference: [
        `日主 ${chartData.dayMaster}`,
        `日柱 ${chartData.rawBaziData.日柱.天干.天干}${chartData.rawBaziData.日柱.地支.地支}`,
      ],
      yongReference: config.tenGods,
      focusPalaces: config.palaces,
      keyJudgment: `这一关只盯 ${config.palaces.join('、')} 与 ${config.tenGods.join('、')}，不先散断全盘。`,
    },
    gate2: {
      relevantTenGods: config.tenGods,
      visibleOccurrences,
      hiddenOccurrences,
      bodyUseHint: buildBodyUseHint(config.palaces, relevantOccurrences),
      palaceAnchors,
    },
    gate3: {
      structureTags: [
        `最终格局 ${yongShen.finalPattern}`,
        `用神 ${yongShen.yongElements.join('、')}`,
        `忌神 ${yongShen.jiElements.join('、')}`,
      ],
      currentFortune: getCurrentFortune(chartData),
      currentFortuneEffect: `当前先看 ${yongShen.yongElements.join('、')} 是否得运，再防 ${yongShen.jiElements.join('、')} 被放大。`,
      directCutNotes: buildDirectCutNotes({
        chartData,
        yongShen,
        focusPalaces: config.palaces,
        specialYears,
      }),
    },
    specialYears,
    liuqinProfiles,
    directConclusions: buildDirectConclusions({
      specialYears,
      liuqinProfiles,
      yongShen,
    }),
    highRiskDisclaimer: '以下“高风险绝对直断”属于盲派强断口径，只能作为高风险假设使用，必须结合命主现实经历、家庭结构与后续命例回验，不可单凭单条规则直接定论。',
  };
}
