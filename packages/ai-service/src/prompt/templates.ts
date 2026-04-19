import type { BaziChart, Pillar } from '@bazi/engine';

/**
 * 将 BaziChart 结构化数据转换为命理师能直接理解的自然语言格式。
 *
 * 核心设计原则:
 *   1. 不塞原始 JSON — LLM 对 JSON 解析差,且格式污染输出
 *   2. 按传统排盘单结构排列 — 年/月/日/时 四柱并列
 *   3. 关键判断结果前置 — 格局、日主强弱放最前
 *   4. 冗余术语带中文名 — LLM 理解中文命理术语远好于英文字段名
 */
export function formatChartForPrompt(chart: BaziChart): string {
  const lines: string[] = [];

  const { input, fourPillars, wuxing, kongwang, pattern, mingGong, taiYuan, chengGu } = chart;

  const gender = input.gender === 'male' ? '男' : '女';
  const minute = input.minute ?? 0;
  const dateTime = `${input.year}-${pad(input.month)}-${pad(input.day)} ${pad(input.hour)}:${pad(minute)}`;

  lines.push('## 排盘基本信息');
  lines.push(`出生:${dateTime}(${gender})`);
  lines.push('');

  lines.push('## 四柱');
  lines.push(formatPillarRow('柱', '年柱', '月柱', '日柱', '时柱'));
  lines.push(formatPillarRow('天干',
    fourPillars.year.stem, fourPillars.month.stem,
    fourPillars.day.stem + '(日主)', fourPillars.hour.stem));
  lines.push(formatPillarRow('地支',
    fourPillars.year.branch, fourPillars.month.branch,
    fourPillars.day.branch, fourPillars.hour.branch));
  lines.push(formatPillarRow('纳音',
    fourPillars.year.nayin, fourPillars.month.nayin,
    fourPillars.day.nayin, fourPillars.hour.nayin));
  lines.push(formatPillarRow('藏干',
    describeHidden(fourPillars.year),
    describeHidden(fourPillars.month),
    describeHidden(fourPillars.day),
    describeHidden(fourPillars.hour)));
  lines.push(formatPillarRow('十神',
    fourPillars.year.tenGod ?? '-',
    fourPillars.month.tenGod ?? '-',
    '日主本身',
    fourPillars.hour.tenGod ?? '-'));
  lines.push('');

  lines.push('## 格局与强弱');
  lines.push(`格局:${pattern}`);
  lines.push(`日主强弱:${strengthZh(wuxing.dayMasterStrength)}`);
  if (wuxing.favorableElements.length) {
    lines.push(`喜用五行:${wuxing.favorableElements.join('、')}`);
  }
  if (wuxing.unfavorableElements.length) {
    lines.push(`忌神五行:${wuxing.unfavorableElements.join('、')}`);
  }
  lines.push('');

  lines.push('## 五行统计(原局八字不含藏干)');
  lines.push(Object.entries(wuxing.counts)
    .map(([el, c]) => `${el}:${c}`)
    .join('  '));
  lines.push('');

  if (chart.relations.length > 0) {
    lines.push('## 刑冲合害破');
    for (const r of chart.relations) {
      lines.push(`- ${r.description}(${r.positions.map(posZh).join('、')})`);
    }
    lines.push('');
  }

  lines.push('## 空亡');
  lines.push(`日柱旬空:${kongwang.dayKong.join('、')}`);
  lines.push(`年柱旬空:${kongwang.yearKong.join('、')}`);
  lines.push('');

  lines.push('## 神煞(按柱位)');
  for (const pos of ['year', 'month', 'day', 'hour'] as const) {
    const tags = chart.shensha[pos];
    if (tags.length) lines.push(`${posZh(pos)}:${tags.join('、')}`);
  }
  lines.push('');

  lines.push('## 命宫 / 胎元');
  lines.push(`命宫:${mingGong.stem}${mingGong.branch}`);
  lines.push(`胎元:${taiYuan.stem}${taiYuan.branch}`);
  lines.push('');

  lines.push('## 称骨');
  lines.push(`重量:${chengGu.weight}`);
  if (chengGu.description) lines.push(`断语:${chengGu.description}`);
  lines.push('');

  lines.push('## 大运(前 8 步)');
  for (const d of chart.dayun.slice(0, 8)) {
    lines.push(`  第${d.index}步:${d.ganZhi}(${d.tenGod}),${d.startAge}-${d.endAge}岁,${d.startYear}起运`);
  }
  lines.push('');

  // 流年只取最近 10 年(避免 prompt 过长)
  const currentYear = new Date().getFullYear();
  const recent = chart.liunian.filter(
    (ln) => ln.year >= currentYear - 1 && ln.year <= currentYear + 9,
  );
  if (recent.length > 0) {
    lines.push(`## 近 10 年流年(${recent[0]!.year}-${recent[recent.length - 1]!.year})`);
    for (const ln of recent) {
      lines.push(`  ${ln.year}(${ln.age}岁):${ln.ganZhi}(${ln.tenGod})`);
    }
  }

  return lines.join('\n');
}

/**
 * 组装给命理师的用户消息。
 */
export function buildInterpretationUserMessage(
  chart: BaziChart,
  question?: string,
): string {
  const chartText = formatChartForPrompt(chart);
  if (question && question.trim()) {
    return `${chartText}\n\n## 用户问题\n${question.trim()}\n\n请基于以上排盘数据回答。`;
  }
  return `${chartText}\n\n请按你的解读结构(总论 → 性格 → 事业财富 → 感情 → 健康 → 当前大运 → 开运建议)给出完整解读。`;
}

function describeHidden(p: Pillar): string {
  if (p.hiddenStems.length === 0) return '-';
  return p.hiddenStems
    .map((h) => `${h.stem}${h.tenGod ? `(${h.tenGod})` : ''}`)
    .join('、');
}

function formatPillarRow(label: string, y: string, m: string, d: string, h: string): string {
  const pad = (s: string, n: number) => s + ' '.repeat(Math.max(0, n - visualLen(s)));
  return `${pad(label, 6)} ${pad(y, 18)} ${pad(m, 18)} ${pad(d, 18)} ${pad(h, 18)}`;
}

function visualLen(s: string): number {
  // 粗略估计中文宽度 2
  let w = 0;
  for (const ch of s) w += /[\u4e00-\u9fff]/.test(ch) ? 2 : 1;
  return w;
}

function posZh(pos: string): string {
  const map: Record<string, string> = { year: '年柱', month: '月柱', day: '日柱', hour: '时柱' };
  return map[pos] ?? pos;
}

function strengthZh(s: 'strong' | 'weak' | 'neutral'): string {
  return { strong: '身强', weak: '身弱', neutral: '中和' }[s];
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
