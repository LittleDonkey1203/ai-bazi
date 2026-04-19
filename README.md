# 八字 AI · Bazi AI

AI 增强的八字排盘与解读系统。**排盘引擎是纯计算(确定性),AI 解读是推理(非确定性),两者严格解耦。**

## 仓库结构

```
bazi-ai/
├── packages/
│   ├── engine/        @bazi/engine       — 确定性排盘引擎(纯函数)
│   ├── ai-service/    @bazi/ai-service   — LLM 解读(provider 抽象 + prompt + RAG + MCP)
│   ├── api/           @bazi/api          — HTTP API (Express + Prisma + Redis + SSE)
│   └── web/           @bazi/web          — 前端 (Next.js 14 App Router + TailwindCSS)
├── docker-compose.yml                    — PostgreSQL + Redis 本地基础设施
├── testcase/                             — fixture 原始数据(问真八字截图)
├── .env.example                          — 环境变量模板
└── TASKS.md                              — 详细任务追踪
```

## 快速开始

```bash
# 1. 装依赖
pnpm install

# 2. 基础设施(PostgreSQL + Redis)
docker compose up -d

# 3. 跑引擎测试(离线,不需服务)
pnpm --filter @bazi/engine test

# 4. 启动 API server (需 Redis,可选 Postgres 若用 auth)
pnpm --filter @bazi/api prisma:generate
pnpm --filter @bazi/api prisma:migrate     # 首次建表
pnpm --filter @bazi/api dev                # http://localhost:3001

# 5. 启动前端
pnpm --filter @bazi/web dev                # http://localhost:3000
```

## 核心能力

### 排盘引擎 `@bazi/engine`

纯计算,同输入必同输出,无副作用。基于 [6tail/lunar-javascript](https://github.com/6tail/lunar-javascript)。

覆盖:
- 四柱(含 23:00 晚子时按次日日干起五鼠遁)
- 十神(天干 + 地支藏干)
- 藏干、纳音
- 大运、流年
- 空亡(日柱旬空 + 年柱旬空双输出)
- 神煞 8 种基础(天乙/文昌/驿马/桃花/华盖/空亡/羊刃/将星,双查年干+日干)
- 刑冲合会害破暗合自刑
- 命宫(问真八字公式:`26 − 月支数 − 时支数`)
- 胎元、称骨(含 51 条命运表)
- 格局(基础八格 + 建禄/羊刃 + 杂气 + 从弱/从强)
- 日主强弱(得令+通根+生扶三要素)

**360 个单项断言全部通过**(10 个 fixture,经问真八字交叉验证)。

### AI 解读 `@bazi/ai-service`

- **LLM Provider 抽象**(OpenAI-兼容 + Gemini 工厂)
- **命理师 System Prompt**(30 年实战人设)
- **BaziChart → 自然语言** 转换器(非 JSON)
- **多轮对话**(自动裁剪历史)
- **MCP Server**(getBaziChart / getBaziChartAsText 工具,可接入 Claude Desktop / Cursor)
- **RAG 基础版**(十干论语料 + 关键词检索,向量检索 Phase 2+ 扩展)
- **A/B 评测框架**(多 prompt 变体对比 + 命中率评分)

### API 服务 `@bazi/api`

- Express + Helmet + CORS + 速率限制
- Prisma(PostgreSQL)— User / SavedChart / Conversation / Message
- Redis 排盘缓存(无 TTL,基于 md5(input))
- SSE 流式 `/api/ai/chat`
- JWT 鉴权(pino 日志)
- Zod 参数校验

### 前端 `@bazi/web`

- Next.js 14 App Router + TailwindCSS
- 首页生辰表单(时辰快选 + 精确分钟)
- 排盘结果页:四柱表格、五行柱状图、大运时间轴、刑冲合害、神煞、空亡/命宫/胎元/称骨
- AI 对话页:SSE 流式 + Markdown 渲染 + 多轮追问
- BFF 模式:API Key 只在 Node 服务端,不暴露浏览器

## 开发

```bash
pnpm test                # 跑所有包测试
pnpm build               # 构建所有包
pnpm --filter @bazi/web dev
pnpm --filter @bazi/api dev
pnpm --filter @bazi/ai-service smoke  # 真机调 LLM API
```

## 许可

MIT
