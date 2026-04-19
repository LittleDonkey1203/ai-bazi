import type { BaziChart } from '@bazi/engine';
import type { ChatMessage, LLMProvider } from './types';
import { SYSTEM_PROMPT } from './prompt/system';
import { buildInterpretationUserMessage } from './prompt/templates';

export interface ConversationOptions {
  chart: BaziChart;
  provider: LLMProvider;
  /** 温度,默认 0.7 */
  temperature?: number;
  /** 最大历史轮数,超出自动裁剪(保首轮 + 最近 N 轮) */
  maxHistoryTurns?: number;
}

/**
 * 多轮对话会话。
 *
 * 首轮 user 消息会自动带上排盘数据 + 用户问题(或默认全景解读请求),
 * 后续轮次只发用户问题本身,排盘上下文留在消息历史里供 LLM 参考。
 */
export class BaziConversation {
  private history: ChatMessage[] = [];
  private readonly chart: BaziChart;
  private readonly provider: LLMProvider;
  private readonly temperature: number;
  private readonly maxHistoryTurns: number;

  constructor(opts: ConversationOptions) {
    this.chart = opts.chart;
    this.provider = opts.provider;
    this.temperature = opts.temperature ?? 0.7;
    this.maxHistoryTurns = opts.maxHistoryTurns ?? 12;
  }

  /** 流式发送一条用户消息,yield 增量文本,结束后消息已自动入 history */
  async *streamMessage(userMessage: string): AsyncIterable<string> {
    const fullUserMsg = this.buildUserMessage(userMessage);
    this.history.push({ role: 'user', content: fullUserMsg });

    let assistantBuf = '';
    for await (const delta of this.provider.chatStream({
      systemPrompt: SYSTEM_PROMPT,
      messages: this.history,
      temperature: this.temperature,
      stream: true,
    })) {
      assistantBuf += delta;
      yield delta;
    }
    this.history.push({ role: 'assistant', content: assistantBuf });
    this.trimHistory();
  }

  /** 非流式发送一条消息 */
  async sendMessage(userMessage: string): Promise<string> {
    const fullUserMsg = this.buildUserMessage(userMessage);
    this.history.push({ role: 'user', content: fullUserMsg });

    const response = await this.provider.chat({
      systemPrompt: SYSTEM_PROMPT,
      messages: this.history,
      temperature: this.temperature,
    });
    this.history.push({ role: 'assistant', content: response });
    this.trimHistory();
    return response;
  }

  /** 获取当前会话历史 */
  getHistory(): readonly ChatMessage[] {
    return this.history;
  }

  /** 清空会话 */
  reset(): void {
    this.history = [];
  }

  private buildUserMessage(userMessage: string): string {
    // 首轮:排盘数据 + 问题 打包
    if (this.history.length === 0) {
      return buildInterpretationUserMessage(this.chart, userMessage || undefined);
    }
    return userMessage;
  }

  /**
   * 裁剪策略:保留首轮(含排盘上下文) + 最近 (maxHistoryTurns − 1) 轮。
   * 一轮 = 1 user + 1 assistant。
   */
  private trimHistory(): void {
    const maxMessages = this.maxHistoryTurns * 2;
    if (this.history.length <= maxMessages) return;
    // 首轮 user + assistant(2 条) + 最近 maxMessages-2 条
    const firstTurn = this.history.slice(0, 2);
    const tail = this.history.slice(-(maxMessages - 2));
    this.history = [...firstTurn, ...tail];
  }
}
