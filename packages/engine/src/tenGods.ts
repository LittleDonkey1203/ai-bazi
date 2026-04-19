import type { FourPillars } from './types';
import { computeTenGod } from './utils';

/**
 * 为四柱各柱天干、各柱地支藏干标注十神(以日干为基准)。
 * 日柱天干不标(为"我")。
 */
export function annotateTenGods(fourPillars: FourPillars): void {
  const dayStem = fourPillars.day.stem;

  for (const key of ['year', 'month', 'day', 'hour'] as const) {
    const pillar = fourPillars[key];
    if (key !== 'day') {
      pillar.tenGod = computeTenGod(dayStem, pillar.stem);
    }
    for (const hidden of pillar.hiddenStems) {
      hidden.tenGod = computeTenGod(dayStem, hidden.stem);
    }
  }
}
