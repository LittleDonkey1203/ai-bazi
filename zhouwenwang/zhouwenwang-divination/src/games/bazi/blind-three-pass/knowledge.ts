import type { DomainConfig, LiuQinConfig, PillarKey, QuestionDomain } from './types';

export const DOMAIN_CONFIG: Record<QuestionDomain, DomainConfig> = {
  overall: {
    label: '命局总览',
    tenGods: ['比肩', '劫财', '正印', '偏印', '正官', '七杀', '正财', '偏财', '食神', '伤官'],
    palaces: ['月柱', '日柱'],
  },
  career: {
    label: '事业',
    tenGods: ['正官', '七杀', '正印', '偏印', '食神', '伤官'],
    palaces: ['月柱', '时柱'],
  },
  wealth: {
    label: '财运',
    tenGods: ['正财', '偏财', '食神', '伤官', '比肩', '劫财'],
    palaces: ['月柱', '时柱'],
  },
  relationship: {
    label: '感情婚姻',
    tenGods: ['正财', '偏财', '正官', '七杀'],
    palaces: ['日柱', '时柱'],
  },
  parents: {
    label: '父母长辈',
    tenGods: ['正印', '偏印', '正财', '偏财'],
    palaces: ['年柱', '月柱'],
  },
  children: {
    label: '子女',
    tenGods: ['食神', '伤官'],
    palaces: ['时柱'],
  },
  siblings: {
    label: '兄弟姐妹',
    tenGods: ['比肩', '劫财'],
    palaces: ['月柱'],
  },
  health: {
    label: '健康',
    tenGods: ['七杀', '伤官', '偏印', '正印'],
    palaces: ['月柱', '日柱'],
  },
};

export const PILLAR_RELATION_KEYS: Record<PillarKey, '年' | '月' | '日' | '时'> = {
  年柱: '年',
  月柱: '月',
  日柱: '日',
  时柱: '时',
};

export const RELATION_KEY_TO_PILLAR: Partial<Record<string, PillarKey>> = {
  年: '年柱',
  月: '月柱',
  日: '日柱',
  时: '时柱',
};

export const PILLAR_ROLE_HINTS: Record<PillarKey, string> = {
  年柱: '年柱主家门、祖上、外缘与父母背景，事情多带外部环境和家庭根基。',
  月柱: '月柱主父母、事业平台、同辈圈和现实秩序，事情常直接落在工作与家庭责任上。',
  日柱: '日柱主命主自己与婚姻核心，凡冲合日柱，通常都不是小事。',
  时柱: '时柱主子女、项目落点、晚景和结果位，事情往往应在后续结果与未来安排。',
};

export const LIUQIN_ANCHOR_STRATEGIES: Record<string, string> = {
  father: '父亲先按财星定位；财星不显时，再看父母宫透出的字、与母星成合者，以及日主根源出处。',
  mother: '母亲先按印星定位；印星不显时，再看日主出处、父母宫透字和能生扶日主的根源。',
  siblings: '兄弟姐妹先按比劫定位；比劫不显时，再看与日主同根源、同出处、同家门之字。',
  partner: '配偶必须回到夫妻宫判断；能进入、感应或落在夫妻宫的财星或官杀，才更像真正配偶。',
  children: '子女先按食伤定位，再回时柱结果位；食伤不显时，时柱与后续应事更关键。',
};

export function detectQuestionDomain(question?: string): QuestionDomain {
  const text = question?.trim() || '';
  if (!text) {
    return 'overall';
  }
  if (/(事业|工作|升职|创业|职业|岗位|领导|公司)/.test(text)) {
    return 'career';
  }
  if (/(财运|收入|赚钱|投资|生意|财富|钱)/.test(text)) {
    return 'wealth';
  }
  if (/(婚姻|感情|恋爱|对象|桃花|伴侣|结婚)/.test(text)) {
    return 'relationship';
  }
  if (/(父母|母亲|父亲|长辈)/.test(text)) {
    return 'parents';
  }
  if (/(孩子|子女|怀孕|生育)/.test(text)) {
    return 'children';
  }
  if (/(兄弟|姐妹|手足)/.test(text)) {
    return 'siblings';
  }
  if (/(健康|疾病|身体|手术|病)/.test(text)) {
    return 'health';
  }
  return 'overall';
}

export function getLiuQinConfigs(gender: '男' | '女'): LiuQinConfig[] {
  return [
    {
      key: 'father',
      label: '父亲',
      tenGods: ['正财', '偏财'],
      palaces: ['年柱', '月柱'],
    },
    {
      key: 'mother',
      label: '母亲',
      tenGods: ['正印', '偏印'],
      palaces: ['年柱', '月柱'],
    },
    {
      key: 'siblings',
      label: '兄弟姐妹',
      tenGods: ['比肩', '劫财'],
      palaces: ['月柱'],
    },
    {
      key: 'partner',
      label: '配偶',
      tenGods: gender === '男' ? ['正财', '偏财'] : ['正官', '七杀'],
      palaces: ['日柱', '时柱'],
    },
    {
      key: 'children',
      label: '子女',
      tenGods: ['食神', '伤官'],
      palaces: ['时柱'],
    },
  ];
}
