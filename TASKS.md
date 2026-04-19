# TASKS.md — 开发任务追踪

> Claude Code 每次开始工作前先读取此文件,了解当前进度。完成任务后更新状态。
> 状态标记:[ ] 未开始 / [x] 已完成 / [~] 进行中

## 当前阶段:Phase 3 API + Phase 4 前端 MVP 已搭建,等安装完成后跑测试

---

## Phase 1 — 排盘引擎 ✅ 已完成

### 初始化
- [x] monorepo 根配置(package.json, pnpm-workspace.yaml, turbo.json, tsconfig.base.json, .npmrc, .gitignore, docker-compose.yml, .env.example)
- [x] packages/engine 配置(tsconfig, vitest, tsup)

### 核心模块
- [x] types.ts(完整类型定义,含 KongWang 对象化、ShenShaTable 分柱位)
- [x] utils.ts(干支五行映射、五鼠遁、五虎遁、60 甲子纳音、10 十神推算)
- [x] fourPillars.ts(含 23:00 晚子时:日柱当日、时柱按次日日干起五鼠遁)
- [x] tenGods.ts(天干 + 藏干十神)
- [x] kongwang.ts(日柱旬空 + 年柱旬空双输出)
- [x] relations.ts(冲刑合会害破暗合自刑)
- [x] wuxing.ts(得令+通根+生扶三要素,按 10 fixture 拟合阈值)
- [x] dayun.ts + liunian.ts(正确过滤 index 0 的小运)
- [x] shensha.ts(8 种基础:天乙/文昌双查年干+日干,其余标准)
- [x] pattern.ts(八格 + 建禄/羊刃 + 杂气[同五行透干] + 从弱/从强)
- [x] mingGong.ts(问真八字公式:26 − 月支数 − 时支数,结果 > 12 减 12)
- [x] taiYuan.ts(月干 +1,月支 +3)
- [x] chengGu.ts(51 条命运表)
- [x] calculator.ts + index.ts + lunar-javascript.d.ts

### 测试
- [x] 10 个 fixture(问真八字交叉验证)
- [x] 修复 case 2 日柱庚辰 → 庚寅
- [x] 修复 case 3 胎元戊辰 → 戊寅
- [x] 修复 case 9 "申引相刑" 笔误
- [x] **360 / 360 单项断言全通过**
- [ ] 扩展 fixture 到 50(等用户提供更多权威排盘)

### 构建发布
- [x] tsup 双格式 + .d.ts
- [x] packages/engine/README.md
- [ ] 发布到 npm registry(等用户决定)

---

## Phase 2 — AI 解读服务 ✅ 基础版完成

### 初始化
- [x] packages/ai-service 配置
- [x] 依赖:@bazi/engine workspace 引用、@modelcontextprotocol/sdk、zod

### LLM Provider
- [x] types.ts(LLMProvider 接口、ChatMessage、ChatRequest)
- [x] llm/openaiCompatible.ts(通用 OpenAI 兼容 provider,含指数退避重试 + 4xx 不重试 + 流式 SSE 解析)
- [x] llm/gemini.ts(Gemini 工厂,默认 viviai.cc)
- [ ] llm/claude.ts(Anthropic 原生,Phase 2+)
- [ ] llm/deepseek.ts(DeepSeek,Phase 2+)

### Prompt 工程
- [x] prompt/system.ts(命理师人设,六维输出结构,禁绝对断言)
- [x] prompt/templates.ts(BaziChart → 自然语言,非 JSON,命理术语自洽)
- [x] prompt/fewShot.ts(3 组示例:偏印/从弱/杂气伤官)

### 对话 + 流式
- [x] conversation.ts(多轮 + 首轮注入排盘 + 历史裁剪)

### MCP Server
- [x] mcp/server.ts(getBaziChart + getBaziChartAsText 工具,stdio 传输)

### RAG
- [x] rag/corpus/rigan.ts(十干论 10 条精选)
- [x] rag/retriever.ts(结构化 tag 检索 + 关键词检索)
- [ ] Gemini embedding(当 viviai 支持 /embeddings 时启用,Phase 2+)
- [ ] 扩充语料:十神章、格局章、神煞章、大运章(Phase 2+)

### 评测
- [x] eval/cases.ts(5 组基础评测 + should/mustNot 关键词)
- [x] eval/runner.ts(A/B 框架:多 prompt 变体并行跑 + 打分表)
- [ ] 扩展到 30 组(Phase 2+)

### 配置 & 部署
- [x] .env / .env.example 模板
- [x] smoke test 脚本(真机调 Gemini 通过)

---

## Phase 3 — API 服务 ✅ 骨架完成,等依赖安装 + 集成测试

### 初始化
- [x] packages/api 配置(tsconfig, vitest)
- [x] Prisma schema(User / SavedChart / Conversation / Message)
- [x] config.ts(dotenv 加载 + 生产校验)

### 基础设施
- [x] db/redis.ts(ioredis 单例 + 优雅关闭)
- [x] db/prisma.ts(Prisma 单例 + 优雅关闭)
- [x] services/baziService.ts(Redis 缓存,md5(input) key,无 TTL)

### 中间件
- [x] middleware/auth.ts(JWT 签发 + 强/弱鉴权)
- [x] middleware/validate.ts(Zod body 校验)
- [x] middleware/rateLimit.ts(排盘 20/min,AI 20/min)

### 路由
- [x] routes/health.ts(GET /api/health — Redis ping)
- [x] routes/bazi.ts(POST /api/bazi/chart)
- [x] routes/ai.ts(POST /api/ai/chat SSE)
- [x] routes/auth.ts(POST /api/auth/register, /login)

### Server
- [x] app.ts(Helmet + CORS + pino 日志 + 404 + 错误处理)
- [x] server.ts(监听 + 优雅关闭 SIGINT/SIGTERM)

### 测试 & 基础设施
- [x] docker-compose.yml(PostgreSQL 16 + Redis 7,含 healthcheck)
- [x] __tests__/bazi.test.ts(Supertest 集成测试 4 条)
- [ ] __tests__/ai.test.ts(SSE 集成测试,mock provider 避免真调 API)
- [ ] __tests__/auth.test.ts(注册/登录/JWT)
- [ ] pnpm install 完成后跑测试验证

---

## Phase 4 — 前端 ✅ MVP 骨架完成

### 初始化
- [x] packages/web 配置(next.config、tsconfig、tailwind、postcss)
- [x] layout + globals.css + 字体(Noto Serif SC / KaiTi)

### 页面
- [x] app/page.tsx(首页 + 引言)
- [x] app/chart/[id]/page.tsx(排盘结果页,SSR)
- [x] app/chat/[id]/page.tsx(AI 对话页)
- [x] app/api/ai/chat/route.ts(BFF:API Key 服务端,SSE 转发)

### 核心组件
- [x] components/BaziInputForm.tsx(生辰输入 + 时辰快选 / 精确时分 / 性别)
- [x] components/FourPillarsTable.tsx(四柱表格:天干/地支/藏干/纳音/十神)
- [x] components/WuxingBars.tsx(五行柱状图 + 颜色区分)
- [x] components/DayunTimeline.tsx(大运横向时间轴 + 干支 + 十神)
- [x] components/RelationsList.tsx(刑冲合害破彩色标签)
- [x] components/ShenshaBox.tsx(神煞按柱位分组)
- [x] components/ChatClient.tsx(SSE 消费 + Markdown 渲染 + 多轮追问)
- [x] lib/encode.ts(BaziInput ↔ base64url id 编码 — 无 DB 依赖 MVP)

### 待办
- [ ] 移动端响应式优化(当前基础可用,需精修)
- [ ] 分享页 SSR(/chart/[id]/share,用于社交转发)
- [ ] 五行雷达图(Recharts,Phase 4+)
- [ ] Playwright E2E 测试(Phase 4+)

---

## 已知的 Phase 间联动问题

- 前端目前**直连 API Key**(通过 Next.js route 转发,key 在 server)。生产应走 `@bazi/api` 后端,前端只打 `/api/*` 同源路径。
- Prisma 只有 schema,未跑 migrate(需要 `docker compose up -d postgres` + `prisma migrate dev`)。
- 测试覆盖:engine 完整,ai-service 基础,api 基础(1 文件 4 条),web 无(需 Playwright)。
