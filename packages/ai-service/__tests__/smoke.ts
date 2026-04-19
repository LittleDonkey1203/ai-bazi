/**
 * Smoke test: 用真实 Gemini API 跑一次"1990-08-15 14:30 男"的解读。
 * 验证内容:
 *   1. Engine 排盘正确
 *   2. BaziChart → 自然语言 Prompt 正确
 *   3. OpenAI-兼容 endpoint 非流式调用通畅
 *   4. 流式调用通畅
 *
 * 运行:
 *   cd packages/ai-service
 *   pnpm smoke
 * 或:
 *   pnpm --filter @bazi/ai-service smoke
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { calculateBazi } from '@bazi/engine';
import {
  createGeminiProvider,
  BaziConversation,
  buildInterpretationUserMessage,
  SYSTEM_PROMPT,
} from '../src/index';

// 加载 .env(不依赖 dotenv 依赖,手工读)
function loadEnv(): void {
  try {
    const envPath = resolve(process.cwd(), '../../.env');
    const raw = readFileSync(envPath, 'utf-8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (m) process.env[m[1]!] ??= m[2]!;
    }
  } catch {
    // .env 不存在时忽略,靠环境变量
  }
}
loadEnv();

async function main() {
  const apiKey = process.env.API_KEY;
  const apiBase = process.env.API_BASE ?? 'https://api.viviai.cc/v1';
  const model = process.env.MODEL ?? 'gemini-3-pro-preview';

  if (!apiKey) {
    console.error('❌ API_KEY missing. Set in root .env or shell env.');
    process.exit(1);
  }

  console.log('▶ Config:');
  console.log(`  API_BASE = ${apiBase}`);
  console.log(`  MODEL    = ${model}`);
  console.log(`  API_KEY  = ${apiKey.slice(0, 8)}…${apiKey.slice(-4)}`);
  console.log();

  // 1. 排盘
  console.log('▶ Step 1: calculateBazi(1990-08-15 14:30 男)');
  const chart = calculateBazi({
    year: 1990, month: 8, day: 15,
    hour: 14, minute: 30, gender: 'male',
  });
  console.log(`  四柱: ${chart.fourPillars.year.stem}${chart.fourPillars.year.branch} ${chart.fourPillars.month.stem}${chart.fourPillars.month.branch} ${chart.fourPillars.day.stem}${chart.fourPillars.day.branch} ${chart.fourPillars.hour.stem}${chart.fourPillars.hour.branch}`);
  console.log(`  格局: ${chart.pattern} | 日主: ${chart.wuxing.dayMasterStrength} | 命宫: ${chart.mingGong.stem}${chart.mingGong.branch}`);
  console.log();

  // 2. Prompt preview
  console.log('▶ Step 2: Prompt preview (front 500 chars)');
  const prompt = buildInterpretationUserMessage(chart);
  console.log('--- USER PROMPT ---');
  console.log(prompt.slice(0, 500) + '...');
  console.log();
  console.log(`  total chars: ${prompt.length}, system chars: ${SYSTEM_PROMPT.length}`);
  console.log();

  // 3. Provider
  const provider = createGeminiProvider({
    apiBase,
    apiKey,
    model,
    timeoutMs: 120_000,
    maxRetries: 1,
  });

  // 4. 非流式调用
  console.log('▶ Step 3: Non-streaming call (may take 20-60s)');
  const t0 = Date.now();
  const reply = await provider.chat({
    systemPrompt: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    maxTokens: 1500,
  });
  console.log(`  ✓ ${Date.now() - t0} ms,回复长度 ${reply.length} 字`);
  console.log('--- REPLY (first 400 chars) ---');
  console.log(reply.slice(0, 400) + (reply.length > 400 ? '…' : ''));
  console.log();

  // 5. 流式调用 + 多轮对话
  console.log('▶ Step 4: Streaming conversation');
  const conv = new BaziConversation({ chart, provider, temperature: 0.5 });
  process.stdout.write('  第一轮(全景解读): ');
  const t1 = Date.now();
  let chars = 0;
  for await (const chunk of conv.streamMessage('')) {
    process.stdout.write(chunk);
    chars += chunk.length;
    if (chars > 800) {
      process.stdout.write(' …(截断)');
      break;
    }
  }
  console.log(`\n  ✓ first turn ${Date.now() - t1} ms`);
  console.log();

  // 6. 追问
  process.stdout.write('  第二轮(追问事业方向): ');
  const t2 = Date.now();
  let followupBuf = '';
  for await (const chunk of conv.streamMessage('我现在在互联网行业,根据命盘看适合继续往哪个方向深挖?')) {
    process.stdout.write(chunk);
    followupBuf += chunk;
    if (followupBuf.length > 500) {
      process.stdout.write(' …(截断)');
      break;
    }
  }
  console.log(`\n  ✓ second turn ${Date.now() - t2} ms`);
  console.log();

  console.log('✅ All smoke checks passed.');
}

main().catch((err) => {
  console.error('❌ Smoke test failed:');
  console.error(err);
  process.exit(1);
});
