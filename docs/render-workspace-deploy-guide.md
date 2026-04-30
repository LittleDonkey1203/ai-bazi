# Render 工作区整体部署指引

## 1. 适用范围

这份文档对应整个工作区：

```text
D:\claude\mingli\new_prj
```

现在这个目录已经按 monorepo 方式整理，根目录是唯一主仓，Render 也应该直接连接这个根仓。

当前可部署的运行单元有两个：

- `zhouwenwang/zhouwenwang-divination`
  - React 前端 + Express 后端
  - 生产模式下由一个 Web Service 同时托管页面和 API
- `bazi-mcp`
  - 独立的 Node HTTP 服务
  - 对外提供 `/mcp`

## 2. 当前 monorepo 结构

根目录新增了：

- `package.json`
- `render.yaml`
- `.gitignore`

其中：

- 根级 `package.json` 负责统一脚本入口
- 根级 `render.yaml` 负责 Render Blueprint
- 根级 `.gitignore` 负责忽略整个工作区的构建产物和环境变量

## 3. 根级命令

在 `D:\claude\mingli\new_prj` 下可直接使用：

```bash
npm run bootstrap
```

安装各运行单元依赖。

```bash
npm run build
```

构建主站和 `bazi-mcp`。

```bash
npm run dev:app
```

启动主站前端开发服务。

```bash
npm run dev:app:backend
```

启动主站后端开发服务。

```bash
npm run start:mcp
```

启动 `bazi-mcp` HTTP 服务。

## 4. Render Blueprint

根目录的 `render.yaml` 当前定义了两个免费 Web Service：

1. `zhouwenwang-divination`
   - `rootDir: zhouwenwang/zhouwenwang-divination`
   - `buildCommand: npm ci && npm --prefix backend ci && npm run build`
   - `startCommand: npm --prefix backend start`
   - `healthCheckPath: /api/health`
2. `bazi-mcp-http`
   - `rootDir: bazi-mcp`
   - `buildCommand: npm ci && npm run build`
   - `startCommand: npm run start:http`
   - `healthCheckPath: /health`

## 5. Git 边界调整

这次 monorepo 整理的核心变化是：

- `new_prj` 成为唯一 Git 仓库根目录
- 原 `zhouwenwang/.git`
- 原 `bazi-mcp/.git`

不再作为当前生效仓库，而是改成备份目录：

- `zhouwenwang/.git-monorepo-backup`
- `bazi-mcp/.git-monorepo-backup`

这样做的目的只有一个：让根仓把两个子目录当成普通源码目录，而不是嵌套仓库。

## 6. Render 上如何部署

### 6.1 推送根仓

把整个 `D:\claude\mingli\new_prj` 根仓推到你自己的 GitHub 仓库。

### 6.2 在 Render 创建 Blueprint

直接选择根仓，Render 会读取根目录 `render.yaml`。

### 6.3 环境变量

主站服务至少需要：

```env
NODE_ENV=production
```

然后二选一补齐：

```env
GEMINI_API_KEY=...
```

或：

```env
API_BASE=...
API_KEY=...
MODEL=...
```

建议再补：

```env
ALLOWED_ORIGINS=https://你的主站域名.onrender.com
```

`bazi-mcp-http` 当前不依赖额外密钥即可启动。

## 7. 部署后验收

主站服务：

```text
https://你的主站.onrender.com/api/health
https://你的主站.onrender.com/
```

MCP 服务：

```text
https://你的-mcp.onrender.com/health
https://你的-mcp.onrender.com/mcp
```

其中 `/mcp` 需要 `POST` 调用。

## 8. 免费版限制

按当前官方文档，Render 免费 Web Service 空闲 15 分钟后会休眠，下次请求通常有冷启动；免费服务文件系统也是临时的，不适合持久化本地文件。

官方文档：

- https://render.com/docs/free
- https://render.com/docs/blueprint-spec
- https://render.com/docs/monorepo-support
- https://render.com/docs/github
