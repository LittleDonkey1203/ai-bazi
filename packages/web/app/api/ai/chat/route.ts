import { NextRequest } from 'next/server';
import { calculateBazi } from '@bazi/engine';
import {
  createGeminiProvider,
  SYSTEM_PROMPT,
  buildInterpretationUserMessage,
  type ChatMessage,
} from '@bazi/ai-service';
import { decodeBaziId } from '@/lib/encode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/chat
 *   Body: { chartId: string, message: string, history: ChatMessage[] }
 *   Returns: text/event-stream (SSE)
 *
 * BFF 模式:API Key 只在 Node server 端读取,不暴露给浏览器。
 */
export async function POST(req: NextRequest) {
  const { chartId, message, history = [] } = await req.json() as {
    chartId: string;
    message: string;
    history?: ChatMessage[];
  };

  const apiKey = process.env.API_KEY;
  const apiBase = process.env.API_BASE ?? 'https://api.viviai.cc/v1';
  const model = process.env.MODEL ?? 'gemini-3-pro-preview';

  if (!apiKey) {
    return new Response('Server missing API_KEY', { status: 500 });
  }

  let chart;
  try {
    chart = calculateBazi(decodeBaziId(chartId));
  } catch (err) {
    return new Response(`Invalid chartId: ${err instanceof Error ? err.message : String(err)}`, { status: 400 });
  }

  const provider = createGeminiProvider({ apiBase, apiKey, model, timeoutMs: 180_000 });

  const messages: ChatMessage[] = history.length === 0
    ? [{ role: 'user', content: buildInterpretationUserMessage(chart, message || undefined) }]
    : [...history, { role: 'user', content: message }];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const delta of provider.chatStream({
          systemPrompt: SYSTEM_PROMPT,
          messages,
          temperature: 0.6,
          stream: true,
        })) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
