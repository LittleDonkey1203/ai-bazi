import type { ChatRequest, LLMProvider } from '../types';
import { LLMError } from '../types';

export interface OpenAICompatibleConfig {
  apiBase: string;    // e.g. https://api.viviai.cc/v1
  apiKey: string;
  model: string;      // e.g. gemini-3-pro-preview
  name?: string;      // 日志显示名,默认 'openai-compatible'
  maxRetries?: number;
  timeoutMs?: number;
}

/**
 * OpenAI Chat Completions 兼容 provider。
 * 同一份实现可对接:官方 OpenAI、viviai.cc、yunwu.ai、deepseek、openrouter、
 * 通义 OpenAI 兼容 endpoint 等。
 *
 * 调用协议:
 *   POST {apiBase}/chat/completions
 *   Authorization: Bearer {apiKey}
 *   Content-Type: application/json
 *   Body: { model, messages: [{role, content}], temperature, max_tokens, stream }
 *
 * 流式:SSE,data: {...chunk} 逐行,最后 data: [DONE]
 * 每个 chunk: choices[0].delta.content 为增量文本
 */
export class OpenAICompatibleProvider implements LLMProvider {
  readonly name: string;
  readonly model: string;
  private readonly apiBase: string;
  private readonly apiKey: string;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(cfg: OpenAICompatibleConfig) {
    this.name = cfg.name ?? 'openai-compatible';
    this.model = cfg.model;
    this.apiBase = cfg.apiBase.replace(/\/$/, '');
    this.apiKey = cfg.apiKey;
    this.maxRetries = cfg.maxRetries ?? 2;
    this.timeoutMs = cfg.timeoutMs ?? 180_000;
  }

  async chat(req: ChatRequest): Promise<string> {
    const body = this.buildBody(req, false);
    const json = await this.post(body);
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new LLMError(`Malformed response: ${JSON.stringify(json).slice(0, 200)}`);
    }
    return content;
  }

  async *chatStream(req: ChatRequest): AsyncIterable<string> {
    const body = this.buildBody(req, true);
    const url = `${this.apiBase}/chat/completions`;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    let resp: Response;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new LLMError(`HTTP ${resp.status}: ${errText.slice(0, 300)}`);
    }
    if (!resp.body) {
      throw new LLMError('No response body for stream');
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') return;
        if (!payload) continue;
        try {
          const chunk = JSON.parse(payload);
          const delta = chunk?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta.length > 0) yield delta;
        } catch {
          // ignore malformed chunks
        }
      }
    }
  }

  private buildBody(req: ChatRequest, stream: boolean) {
    const messages = [
      { role: 'system' as const, content: req.systemPrompt },
      ...req.messages.map((m) => ({ role: m.role, content: m.content })),
    ];
    return {
      model: this.model,
      messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 4096,
      stream,
    };
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  private async post(body: unknown): Promise<any> {
    const url = `${this.apiBase}/chat/completions`;
    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: this.headers(),
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!resp.ok) {
          const errText = await resp.text().catch(() => '');
          // 4xx 通常不可重试
          if (resp.status >= 400 && resp.status < 500) {
            throw new LLMError(`HTTP ${resp.status}: ${errText.slice(0, 300)}`);
          }
          throw new LLMError(`HTTP ${resp.status} (will retry): ${errText.slice(0, 300)}`);
        }
        return await resp.json();
      } catch (err) {
        clearTimeout(timer);
        lastErr = err;
        if (err instanceof LLMError && err.message.startsWith('HTTP 4')) throw err;
        if (attempt < this.maxRetries) {
          await sleep(2 ** attempt * 1000);
          continue;
        }
      }
    }
    throw new LLMError('All retries exhausted', lastErr);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
