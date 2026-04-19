/**
 * MCP (Model Context Protocol) Server for bazi engine.
 *
 * 暴露工具给任意支持 MCP 的 LLM 客户端(Claude Desktop、Cursor 等)。
 *
 * 启动:
 *   npx -y @bazi/ai-service mcp
 * 或:
 *   tsx packages/ai-service/src/mcp/server.ts
 *
 * 客户端配置示例(Claude Desktop claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "bazi": {
 *         "command": "npx",
 *         "args": ["-y", "tsx", "<path-to>/packages/ai-service/src/mcp/server.ts"]
 *       }
 *     }
 *   }
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { calculateBazi } from '@bazi/engine';
import { formatChartForPrompt } from '../prompt/templates';

const BaziInputSchema = {
  year: z.number().int().min(1900).max(2100).describe('公历出生年,1900-2100'),
  month: z.number().int().min(1).max(12).describe('公历出生月,1-12'),
  day: z.number().int().min(1).max(31).describe('公历出生日,1-31'),
  hour: z.number().int().min(0).max(23).describe('24 小时制小时,0-23'),
  minute: z.number().int().min(0).max(59).optional().describe('分钟,默认 0'),
  gender: z.enum(['male', 'female']).describe('性别:male=男, female=女'),
};

export function createBaziMcpServer(): McpServer {
  const server = new McpServer({
    name: 'bazi-engine',
    version: '0.0.1',
  });

  server.tool(
    'getBaziChart',
    '根据公历出生时间 + 性别,排出完整八字命盘(四柱、十神、藏干、纳音、五行、大运、流年、神煞、命宫、胎元、称骨、格局)。返回 JSON 结构化数据。',
    BaziInputSchema,
    async (params) => {
      try {
        const chart = calculateBazi(params);
        return {
          content: [
            { type: 'text', text: JSON.stringify(chart, null, 2) },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            { type: 'text', text: `排盘失败:${err instanceof Error ? err.message : String(err)}` },
          ],
        };
      }
    },
  );

  server.tool(
    'getBaziChartAsText',
    '根据公历出生时间 + 性别排盘,返回命理师可读的**自然语言**版(非 JSON),适合直接塞给其他 LLM 做解读。',
    BaziInputSchema,
    async (params) => {
      try {
        const chart = calculateBazi(params);
        const text = formatChartForPrompt(chart);
        return { content: [{ type: 'text', text }] };
      } catch (err) {
        return {
          isError: true,
          content: [
            { type: 'text', text: `排盘失败:${err instanceof Error ? err.message : String(err)}` },
          ],
        };
      }
    },
  );

  return server;
}

/** 独立启动入口(stdio 传输) */
export async function main(): Promise<void> {
  const server = createBaziMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('MCP server failed:', err);
    process.exit(1);
  });
}
