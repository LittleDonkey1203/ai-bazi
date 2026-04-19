# @bazi/api

HTTP API 服务 — 暴露 `@bazi/engine` 排盘 + `@bazi/ai-service` LLM 解读为 REST + SSE。

## 路由

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/health` | 健康检查(Redis 状态) |
| POST | `/api/bazi/chart` | 排盘(Redis 缓存,无 TTL) |
| POST | `/api/ai/chat` | AI 解读(SSE 流式) |
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |

## 启动依赖

```bash
# 根目录
docker compose up -d        # 启动 PostgreSQL + Redis
pnpm install
pnpm --filter @bazi/api prisma:generate
pnpm --filter @bazi/api prisma:migrate   # 首次建表
pnpm --filter @bazi/api dev              # 启动 API server
```

## 环境变量

见根目录 `.env.example`。关键:

- `DATABASE_URL` — PostgreSQL 连接串
- `REDIS_URL` — Redis 连接串
- `JWT_SECRET` — 签发 token 的密钥(生产必改)
- `API_KEY` / `API_BASE` / `MODEL` — LLM 配置(与 @bazi/ai-service 共享)

## 测试

```bash
pnpm --filter @bazi/api test
```

集成测试用 Supertest 直接打 Express app,无需启动真实端口;但排盘会走 Redis,故需先 `docker compose up -d redis`。
