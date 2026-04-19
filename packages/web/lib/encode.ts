import type { BaziInput } from '@bazi/engine';

/**
 * 把 BaziInput 编码为 URL 安全的 id(base64url)。
 * 避免数据库依赖 — MVP 阶段直接把生辰编码进 URL。
 */
export function encodeBaziId(input: BaziInput): string {
  const json = JSON.stringify(input);
  const b64 = Buffer.from(json, 'utf-8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeBaziId(id: string): BaziInput {
  const b64 = id.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '==='.slice((b64.length + 3) % 4);
  const json = Buffer.from(padded, 'base64').toString('utf-8');
  return JSON.parse(json) as BaziInput;
}
