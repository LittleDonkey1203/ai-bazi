import type {
  TianGan, DiZhi, WuXing, YinYang, ShiShen,
} from './types';

export const TIANGAN: readonly TianGan[] = [
  '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸',
] as const;

export const DIZHI: readonly DiZhi[] = [
  '子', '丑', '寅', '卯', '辰', '巳',
  '午', '未', '申', '酉', '戌', '亥',
] as const;

export const STEM_ELEMENT: Record<TianGan, WuXing> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

export const BRANCH_ELEMENT: Record<DiZhi, WuXing> = {
  '寅': '木', '卯': '木',
  '巳': '火', '午': '火',
  '申': '金', '酉': '金',
  '亥': '水', '子': '水',
  '辰': '土', '戌': '土', '丑': '土', '未': '土',
};

export const STEM_YINYANG: Record<TianGan, YinYang> = {
  '甲': '阳', '乙': '阴',
  '丙': '阳', '丁': '阴',
  '戊': '阳', '己': '阴',
  '庚': '阳', '辛': '阴',
  '壬': '阳', '癸': '阴',
};

export const BRANCH_YINYANG: Record<DiZhi, YinYang> = {
  '子': '阳', '丑': '阴',
  '寅': '阳', '卯': '阴',
  '辰': '阳', '巳': '阴',
  '午': '阳', '未': '阴',
  '申': '阳', '酉': '阴',
  '戌': '阳', '亥': '阴',
};

// 地支藏干(主气、中气、余气)及其比例
// 比例参考四柱预测传统分配(主气约 0.6-1.0,中气 0.2-0.3,余气 0.1-0.2)
export const BRANCH_HIDDEN_STEMS: Record<DiZhi, Array<{ stem: TianGan; ratio: number }>> = {
  '子': [{ stem: '癸', ratio: 1.0 }],
  '丑': [{ stem: '己', ratio: 0.6 }, { stem: '癸', ratio: 0.3 }, { stem: '辛', ratio: 0.1 }],
  '寅': [{ stem: '甲', ratio: 0.6 }, { stem: '丙', ratio: 0.3 }, { stem: '戊', ratio: 0.1 }],
  '卯': [{ stem: '乙', ratio: 1.0 }],
  '辰': [{ stem: '戊', ratio: 0.6 }, { stem: '乙', ratio: 0.3 }, { stem: '癸', ratio: 0.1 }],
  '巳': [{ stem: '丙', ratio: 0.6 }, { stem: '庚', ratio: 0.3 }, { stem: '戊', ratio: 0.1 }],
  '午': [{ stem: '丁', ratio: 0.7 }, { stem: '己', ratio: 0.3 }],
  '未': [{ stem: '己', ratio: 0.6 }, { stem: '丁', ratio: 0.3 }, { stem: '乙', ratio: 0.1 }],
  '申': [{ stem: '庚', ratio: 0.6 }, { stem: '壬', ratio: 0.3 }, { stem: '戊', ratio: 0.1 }],
  '酉': [{ stem: '辛', ratio: 1.0 }],
  '戌': [{ stem: '戊', ratio: 0.6 }, { stem: '辛', ratio: 0.3 }, { stem: '丁', ratio: 0.1 }],
  '亥': [{ stem: '壬', ratio: 0.7 }, { stem: '甲', ratio: 0.3 }],
};

export function stemIndex(stem: TianGan): number {
  return TIANGAN.indexOf(stem);
}

export function branchIndex(branch: DiZhi): number {
  return DIZHI.indexOf(branch);
}

export function stemByIndex(idx: number): TianGan {
  const result = TIANGAN[((idx % 10) + 10) % 10];
  if (!result) throw new Error(`Invalid stem index: ${idx}`);
  return result;
}

export function branchByIndex(idx: number): DiZhi {
  const result = DIZHI[((idx % 12) + 12) % 12];
  if (!result) throw new Error(`Invalid branch index: ${idx}`);
  return result;
}

/**
 * 十神推算:以日干为"我",判断另一天干相对日干的十神
 * 规则:
 *   同我 → 比肩(同性)/劫财(异性)
 *   我生 → 食神(同性)/伤官(异性)
 *   我克 → 偏财(同性)/正财(异性)
 *   克我 → 七杀(同性)/正官(异性)
 *   生我 → 偏印(同性)/正印(异性)
 */
export function computeTenGod(dayStem: TianGan, otherStem: TianGan): ShiShen {
  const dayEl = STEM_ELEMENT[dayStem];
  const otherEl = STEM_ELEMENT[otherStem];
  const sameYinYang = STEM_YINYANG[dayStem] === STEM_YINYANG[otherStem];

  const relation = elementRelation(dayEl, otherEl);
  switch (relation) {
    case 'same': return sameYinYang ? '比肩' : '劫财';
    case 'iGenerate': return sameYinYang ? '食神' : '伤官';
    case 'iControl': return sameYinYang ? '偏财' : '正财';
    case 'controlsMe': return sameYinYang ? '七杀' : '正官';
    case 'generatesMe': return sameYinYang ? '偏印' : '正印';
  }
}

type ElementRelation = 'same' | 'iGenerate' | 'iControl' | 'controlsMe' | 'generatesMe';

function elementRelation(me: WuXing, other: WuXing): ElementRelation {
  if (me === other) return 'same';
  // 五行相生:木→火→土→金→水→木
  const generates: Record<WuXing, WuXing> = {
    '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
  };
  // 五行相克:木→土,土→水,水→火,火→金,金→木
  const controls: Record<WuXing, WuXing> = {
    '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
  };
  if (generates[me] === other) return 'iGenerate';
  if (controls[me] === other) return 'iControl';
  if (controls[other] === me) return 'controlsMe';
  if (generates[other] === me) return 'generatesMe';
  throw new Error(`Unhandled element relation ${me} vs ${other}`);
}

/**
 * 五虎遁:由年干推正月(寅月)的月干
 *   甲己之年丙作首
 *   乙庚之年戊为头
 *   丙辛之岁寻庚起
 *   丁壬壬寅顺水流
 *   戊癸之年起甲寅
 */
export function yinMonthStem(yearStem: TianGan): TianGan {
  const map: Record<TianGan, TianGan> = {
    '甲': '丙', '己': '丙',
    '乙': '戊', '庚': '戊',
    '丙': '庚', '辛': '庚',
    '丁': '壬', '壬': '壬',
    '戊': '甲', '癸': '甲',
  };
  return map[yearStem];
}

/**
 * 五鼠遁:由日干推子时的时干
 *   甲己日甲子起
 *   乙庚日丙子起
 *   丙辛日戊子起
 *   丁壬日庚子起
 *   戊癸日壬子起
 */
export function ziHourStem(dayStem: TianGan): TianGan {
  const map: Record<TianGan, TianGan> = {
    '甲': '甲', '己': '甲',
    '乙': '丙', '庚': '丙',
    '丙': '戊', '辛': '戊',
    '丁': '庚', '壬': '庚',
    '戊': '壬', '癸': '壬',
  };
  return map[dayStem];
}

/**
 * 根据 24 小时制转地支时辰
 *   23:00-00:59 → 子
 *   01:00-02:59 → 丑
 *   ...
 */
export function hourToBranch(hour: number): DiZhi {
  if (hour < 0 || hour > 23) throw new Error(`Invalid hour ${hour}`);
  if (hour === 23 || hour === 0) return '子';
  const idx = Math.floor((hour + 1) / 2);
  return DIZHI[idx] as DiZhi;
}

/**
 * 由日干和时支推算时干(五鼠遁)
 */
export function computeHourStem(dayStem: TianGan, hourBranch: DiZhi): TianGan {
  const zi = ziHourStem(dayStem);
  const offset = branchIndex(hourBranch);
  return stemByIndex(stemIndex(zi) + offset);
}

/**
 * 六十甲子纳音表(整理自传统60甲子纳音歌诀)
 */
export const NAYIN_TABLE: Record<string, string> = {
  '甲子': '海中金', '乙丑': '海中金',
  '丙寅': '炉中火', '丁卯': '炉中火',
  '戊辰': '大林木', '己巳': '大林木',
  '庚午': '路旁土', '辛未': '路旁土',
  '壬申': '剑锋金', '癸酉': '剑锋金',
  '甲戌': '山头火', '乙亥': '山头火',
  '丙子': '涧下水', '丁丑': '涧下水',
  '戊寅': '城头土', '己卯': '城头土',
  '庚辰': '白蜡金', '辛巳': '白蜡金',
  '壬午': '杨柳木', '癸未': '杨柳木',
  '甲申': '泉中水', '乙酉': '泉中水',
  '丙戌': '屋上土', '丁亥': '屋上土',
  '戊子': '霹雳火', '己丑': '霹雳火',
  '庚寅': '松柏木', '辛卯': '松柏木',
  '壬辰': '长流水', '癸巳': '长流水',
  '甲午': '沙中金', '乙未': '沙中金',
  '丙申': '山下火', '丁酉': '山下火',
  '戊戌': '平地木', '己亥': '平地木',
  '庚子': '壁上土', '辛丑': '壁上土',
  '壬寅': '金箔金', '癸卯': '金箔金',
  '甲辰': '覆灯火', '乙巳': '覆灯火',
  '丙午': '天河水', '丁未': '天河水',
  '戊申': '大驿土', '己酉': '大驿土',
  '庚戌': '钗钏金', '辛亥': '钗钏金',
  '壬子': '桑柘木', '癸丑': '桑柘木',
  '甲寅': '大溪水', '乙卯': '大溪水',
  '丙辰': '沙中土', '丁巳': '沙中土',
  '戊午': '天上火', '己未': '天上火',
  '庚申': '石榴木', '辛酉': '石榴木',
  '壬戌': '大海水', '癸亥': '大海水',
};

export function ganZhiString(stem: TianGan, branch: DiZhi): string {
  return `${stem}${branch}`;
}

/**
 * 六十甲子序号(0-59): 甲子=0, 乙丑=1, ..., 癸亥=59
 * 公式: stemIndex + 10 * ((branchIndex - stemIndex + 12) / 2) mod 60
 * 简化: 查询 60 对组合
 */
export function ganZhiIndex(stem: TianGan, branch: DiZhi): number {
  const sIdx = stemIndex(stem);
  const bIdx = branchIndex(branch);
  // Only valid pairings: (stemIdx % 2) === (branchIdx % 2)
  if (sIdx % 2 !== bIdx % 2) {
    throw new Error(`Invalid ganzhi pair: ${stem}${branch}`);
  }
  // 60 组:每组由 10*i + k 索引,不过实现用增量搜索更简单
  for (let i = 0; i < 60; i++) {
    if (i % 10 === sIdx && i % 12 === bIdx) return i;
  }
  throw new Error(`Ganzhi not found: ${stem}${branch}`);
}

export function ganZhiByIndex(idx: number): { stem: TianGan; branch: DiZhi } {
  const normalized = ((idx % 60) + 60) % 60;
  return {
    stem: stemByIndex(normalized % 10),
    branch: branchByIndex(normalized % 12),
  };
}
