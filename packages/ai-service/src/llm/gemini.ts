import { OpenAICompatibleProvider, type OpenAICompatibleConfig } from './openaiCompatible';

export interface GeminiProviderConfig extends Omit<OpenAICompatibleConfig, 'name' | 'apiBase' | 'model'> {
  apiBase?: string;  // 默认 https://api.viviai.cc/v1
  model?: string;    // 默认 gemini-3-pro-preview
}

/**
 * Google Gemini(通过 OpenAI 兼容中转 endpoint)。
 *
 * 默认走 viviai.cc 中转。如需换其他 endpoint(yunwu、openrouter 等),
 * 只要兼容 OpenAI Chat Completions 协议,传 apiBase 即可。
 */
export function createGeminiProvider(cfg: GeminiProviderConfig): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider({
    name: 'gemini',
    apiBase: cfg.apiBase ?? 'https://api.viviai.cc/v1',
    apiKey: cfg.apiKey,
    model: cfg.model ?? 'gemini-3-pro-preview',
    maxRetries: cfg.maxRetries,
    timeoutMs: cfg.timeoutMs,
  });
}
