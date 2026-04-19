import type {
  FourPillars, Relation, DiZhi, PillarPosition,
} from './types';

const POSITIONS: readonly PillarPosition[] = ['year', 'month', 'day', 'hour'] as const;

/** 六冲:子午、丑未、寅申、卯酉、辰戌、巳亥 */
const LIU_CHONG: Array<[DiZhi, DiZhi]> = [
  ['子', '午'], ['丑', '未'], ['寅', '申'],
  ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
];

/** 六合:子丑、寅亥、卯戌、辰酉、巳申、午未 */
const LIU_HE: Array<[DiZhi, DiZhi]> = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'],
  ['辰', '酉'], ['巳', '申'], ['午', '未'],
];

/** 三合局:申子辰、亥卯未、寅午戌、巳酉丑 */
const SAN_HE: Array<[DiZhi, DiZhi, DiZhi, string]> = [
  ['申', '子', '辰', '水'],
  ['亥', '卯', '未', '木'],
  ['寅', '午', '戌', '火'],
  ['巳', '酉', '丑', '金'],
];

/** 半合(任两支属同一三合局且含中支) */
const BAN_HE_PAIRS: Array<[DiZhi, DiZhi, string]> = [];
for (const [a, b, c, el] of SAN_HE) {
  BAN_HE_PAIRS.push([a, b, el]); // 生合中
  BAN_HE_PAIRS.push([b, c, el]); // 中合墓
  // a,c 为"拱合",传统不算半合,这里忽略
}

/** 三会:寅卯辰会木、巳午未会火、申酉戌会金、亥子丑会水 */
const SAN_HUI: Array<[DiZhi, DiZhi, DiZhi, string]> = [
  ['寅', '卯', '辰', '木'],
  ['巳', '午', '未', '火'],
  ['申', '酉', '戌', '金'],
  ['亥', '子', '丑', '水'],
];

/** 六害:子未、丑午、寅巳、卯辰、申亥、酉戌 */
const LIU_HAI: Array<[DiZhi, DiZhi]> = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'],
  ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
];

/** 六破:子酉、午卯、巳申、寅亥、辰丑、戌未 */
const LIU_PO: Array<[DiZhi, DiZhi]> = [
  ['子', '酉'], ['午', '卯'], ['巳', '申'],
  ['寅', '亥'], ['辰', '丑'], ['戌', '未'],
];

/** 三刑:寅巳申(恃势之刑)、丑戌未(无恩之刑)、子卯(无礼之刑) */
const SAN_XING_TRIO: Array<[DiZhi, DiZhi, DiZhi]> = [
  ['寅', '巳', '申'],
  ['丑', '戌', '未'],
];
const XING_PAIR: Array<[DiZhi, DiZhi]> = [
  ['子', '卯'],
  // 三刑内两两关系也视为刑
  ['寅', '巳'], ['巳', '申'], ['寅', '申'],
  ['丑', '戌'], ['戌', '未'], ['丑', '未'],
];

/** 自刑:辰辰、午午、酉酉、亥亥 */
const ZI_XING: DiZhi[] = ['辰', '午', '酉', '亥'];

/**
 * 暗合:干支暗中相合(天干五合对应的地支藏干关系)。
 * 简化处理常见暗合:寅丑、卯申、午亥、寅未 等。
 */
const AN_HE: Array<[DiZhi, DiZhi]> = [
  ['寅', '丑'], ['卯', '申'], ['午', '亥'], ['寅', '未'],
];

export function detectRelations(fourPillars: FourPillars): Relation[] {
  const branches: Array<{ pos: PillarPosition; b: DiZhi }> = POSITIONS.map(
    (p) => ({ pos: p, b: fourPillars[p].branch }),
  );

  const out: Relation[] = [];

  // 成对关系
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i]!;
      const b = branches[j]!;
      const pair: [DiZhi, DiZhi] = [a.b, b.b];

      if (matchPair(pair, LIU_CHONG)) {
        out.push(rel('冲', [a.pos, b.pos], [a.b, b.b], `${a.b}${b.b}相冲`));
      }
      if (matchPair(pair, LIU_HE)) {
        out.push(rel('六合', [a.pos, b.pos], [a.b, b.b], `${a.b}${b.b}六合`));
      }
      if (matchPair(pair, LIU_HAI)) {
        out.push(rel('害', [a.pos, b.pos], [a.b, b.b], `${a.b}${b.b}相害`));
      }
      if (matchPair(pair, LIU_PO)) {
        out.push(rel('破', [a.pos, b.pos], [a.b, b.b], `${a.b}${b.b}相破`));
      }
      if (matchPair(pair, XING_PAIR)) {
        out.push(rel('刑', [a.pos, b.pos], [a.b, b.b], `${a.b}${b.b}相刑`));
      }
      if (matchPair(pair, AN_HE)) {
        out.push(rel('暗合', [a.pos, b.pos], [a.b, b.b], `${a.b}${b.b}暗合`));
      }
      for (const [x, y, el] of BAN_HE_PAIRS) {
        if ((a.b === x && b.b === y) || (a.b === y && b.b === x)) {
          out.push(rel('半合', [a.pos, b.pos], [a.b, b.b], `${a.b}${b.b}半合${el}`));
        }
      }
    }
  }

  // 自刑
  const countBranches: Partial<Record<DiZhi, PillarPosition[]>> = {};
  for (const { pos, b } of branches) {
    (countBranches[b] ??= []).push(pos);
  }
  for (const zx of ZI_XING) {
    const poses = countBranches[zx];
    if (poses && poses.length >= 2) {
      out.push(rel('自刑', poses, [zx, zx], `${zx}${zx}自刑`));
    }
  }

  // 三合 & 三会(需要三支聚齐)
  const branchSet = new Set(branches.map((x) => x.b));
  for (const [a, b, c, el] of SAN_HE) {
    if (branchSet.has(a) && branchSet.has(b) && branchSet.has(c)) {
      const pos = branches.filter((x) => [a, b, c].includes(x.b)).map((x) => x.pos);
      out.push(rel('三合', pos, [a, b, c], `${a}${b}${c}三合${el}局`));
    }
  }
  for (const [a, b, c, el] of SAN_HUI) {
    if (branchSet.has(a) && branchSet.has(b) && branchSet.has(c)) {
      const pos = branches.filter((x) => [a, b, c].includes(x.b)).map((x) => x.pos);
      out.push(rel('三会', pos, [a, b, c], `${a}${b}${c}三会${el}局`));
    }
  }
  // 三刑(三支聚齐,额外标三刑大关系)
  for (const [a, b, c] of SAN_XING_TRIO) {
    if (branchSet.has(a) && branchSet.has(b) && branchSet.has(c)) {
      const pos = branches.filter((x) => [a, b, c].includes(x.b)).map((x) => x.pos);
      out.push(rel('刑', pos, [a, b, c], `${a}${b}${c}三刑`));
    }
  }

  return out;
}

function matchPair(pair: [DiZhi, DiZhi], table: Array<[DiZhi, DiZhi]>): boolean {
  const [a, b] = pair;
  return table.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

function rel(
  type: Relation['type'],
  positions: PillarPosition[],
  branches: DiZhi[],
  description: string,
): Relation {
  return { type, positions, branches, description };
}
