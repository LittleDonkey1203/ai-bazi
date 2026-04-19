import type { BaziChart } from '@bazi/engine';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface ChatRequest {
  systemPrompt: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

/** LLM 统一抽象接口 */
export interface LLMProvider {
  readonly name: string;
  readonly model: string;

  /** 流式调用,逐 token yield */
  chatStream(req: ChatRequest): AsyncIterable<string>;

  /** 非流式调用,返回完整文本 */
  chat(req: ChatRequest): Promise<string>;
}

export interface BaziInterpretationRequest {
  chart: BaziChart;
  question?: string;
  history?: ChatMessage[];
}

export class LLMError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'LLMError';
  }
}
