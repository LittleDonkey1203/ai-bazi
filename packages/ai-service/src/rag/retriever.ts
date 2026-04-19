import type { BaziChart } from '@bazi/engine';
import { CORPUS_RIGAN, type CorpusEntry } from './corpus/rigan';

/**
 * RAG 基础版检索器。
 *
 * Phase 2 基础版采用 **结构化查询 + 关键词匹配**,而不是向量检索:
 *   1. 命理查询维度天然强结构化(日干、月令、格局 基本确定)
 *   2. 向量检索需要 embedding API,且对短语料命中率不如精确 tag
 *   3. 后续可引入 embedding 做"模糊问题"检索(用户自由提问)
 *
 * TODO (Phase 2+):
 *   - Gemini embedding(如 viviai 支持 /embeddings)
 *   - BM25 / TF-IDF 混合 (对 RAG 细节问答)
 *   - 扩充语料:十神章、格局章、神煞章、大运章
 */

export interface RagContext {
  entries: CorpusEntry[];
  formatted: string;
}

/**
 * 根据排盘抽取最相关的古籍片段(日干论为主)。
 * 返回 formatted 字符串,可直接拼入 system prompt。
 */
export function retrieveForChart(chart: BaziChart, limit = 2): RagContext {
  const dayStem = chart.fourPillars.day.stem;
  const entries = CORPUS_RIGAN
    .filter((e) => e.tags.includes(dayStem))
    .slice(0, limit);

  return {
    entries,
    formatted: entries.length === 0 ? '' : formatEntries(entries),
  };
}

/**
 * 按用户自由问题做关键词检索(简版)。
 * 关键词:日干 / 十神 / 格局 / 神煞 等。
 */
export function retrieveByKeywords(keywords: string[], limit = 3): RagContext {
  const scored = CORPUS_RIGAN.map((entry) => {
    let score = 0;
    for (const kw of keywords) {
      if (entry.tags.includes(kw)) score += 3;
      if (entry.title.includes(kw)) score += 2;
      if (entry.body.includes(kw)) score += 1;
    }
    return { entry, score };
  });
  const top = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry);

  return {
    entries: top,
    formatted: top.length === 0 ? '' : formatEntries(top),
  };
}

function formatEntries(entries: CorpusEntry[]): string {
  const lines: string[] = ['## 古籍参考(供你解读时引用,不必全部采纳)'];
  for (const e of entries) {
    lines.push(`### ${e.title}`);
    lines.push(e.body);
    lines.push('');
  }
  return lines.join('\n');
}

export { CORPUS_RIGAN };
export type { CorpusEntry };
