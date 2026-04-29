# 系统启动文档

## 1. 适用范围

本文档对应当前仓库的实际目录结构，默认你是从 GitHub 把整个仓库 clone 下来后，在仓库根目录执行命令。

当前前后端代码都在：

```text
zhouwenwang/zhouwenwang-divination
```

这份文档只覆盖“前端 Web + 后端 API”启动，不包含 Electron 打包，不包含额外资料目录，也不依赖数据库迁移。

当前仓库里这些目录不是前后端启动必需项：

- `bazi-mcp/`
- `高德臣盲派六亲过三关/`
- `docs/` 之外的分析资料

## 2. 启动原则

目标是“别人拿到仓库后，不改任何业务代码，只按文档操作就能把前后端拉起来”。

因此本指南采用以下约束：

- 不修改前端源码
- 不修改后端源码
- 不要求改 `src/masters/config.ts`
- 前端不新增 `.env`
- 只需要创建后端配置文件 `backend/.env`

前端当前会自动使用“当前页面主机名 + `3001` 端口”去请求后端。

例如：

- 打开 `http://localhost:5173` 时，前端会请求 `http://localhost:3001`
- 打开 `http://192.168.1.10:5173` 时，前端会请求 `http://192.168.1.10:3001`

也就是说，只要前后端跑在同一台机器上，前端不需要再改地址配置。

## 3. 已验证环境

我在当前仓库上已实际验证过以下命令可以启动成功：

- 后端 `npm start`
- 前端 `npm run dev`

本地验证环境：

- Node.js `v24.14.1`
- npm `11.11.0`

建议给其他开发者的要求：

- Node.js `20+`
- npm `10+`

## 4. 仓库准备

### 4.1 clone 仓库

```bash
git clone <你的仓库地址>
cd <仓库目录>
```

### 4.2 进入前端主目录

```bash
cd zhouwenwang/zhouwenwang-divination
```

如果你未来上传 GitHub 时，把 `zhouwenwang/zhouwenwang-divination` 这一层直接当成仓库根目录，那么本文档里所有这一步 `cd zhouwenwang/zhouwenwang-divination` 都可以去掉。

## 5. 安装依赖

推荐使用 `npm ci`，因为仓库已经提交了 `package-lock.json`，这样更稳定、可复现。

### 5.1 安装前端依赖

在 `zhouwenwang/zhouwenwang-divination` 目录下执行：

```bash
npm ci
```

### 5.2 安装后端依赖

```bash
cd backend
npm ci
cd ..
```

## 6. 配置后端 `.env`

后端配置文件位置：

```text
zhouwenwang/zhouwenwang-divination/backend/.env
```

前端本身不要求你修改任何代码文件。AI 能不能正常用，取决于这个 `.env` 是否配置正确。

### 6.1 方案 A：使用官方 Gemini Key

先复制示例文件：

PowerShell:

```powershell
Copy-Item .\backend\env.example .\backend\.env
```

Bash:

```bash
cp backend/env.example backend/.env
```

然后把 `backend/.env` 改成至少包含下面这些内容：

```env
GEMINI_API_KEY=你的_Gemini_API_Key
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://192.168.1.*
MAX_REQUESTS_PER_MINUTE=60
MAX_FILE_SIZE=10485760
LOG_LEVEL=info
```

### 6.2 方案 B：使用兼容 OpenAI 接口的中转服务

当前后端代码也原生支持兼容接口，不需要改代码，只需要把 `backend/.env` 写成下面这样：

```env
API_BASE=https://你的兼容接口根地址/v1
API_KEY=你的兼容接口密钥
MODEL=你要使用的模型名
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://192.168.1.*
MAX_REQUESTS_PER_MINUTE=60
MAX_FILE_SIZE=10485760
LOG_LEVEL=info
```

说明：

- 二选一即可
- 如果同时写了 `GEMINI_API_KEY` 和 `API_BASE/API_KEY/MODEL`，后端会优先走 `GEMINI_API_KEY`
- `backend/.env` 已被 `.gitignore` 忽略，不要把真实密钥提交到 GitHub

## 7. 启动后端

打开第 1 个终端，在 `zhouwenwang/zhouwenwang-divination/backend` 目录执行：

```bash
npm start
```

看到类似下面的信息就说明后端已经起来了：

```text
服务地址: http://localhost:3001
环境: development
```

### 7.1 验证后端是否启动成功

浏览器打开：

```text
http://127.0.0.1:3001/api/health
```

正常应返回 JSON，至少包含：

```json
{
  "status": "ok"
}
```

如果你已经把 AI 配置填对了，通常还会看到：

```json
{
  "apiConfigured": true
}
```

如需进一步检查模型配置，可以访问：

```text
http://127.0.0.1:3001/api/validate
```

## 8. 启动前端

打开第 2 个终端，在 `zhouwenwang/zhouwenwang-divination` 目录执行：

```bash
npm run dev
```

默认前端地址：

```text
http://127.0.0.1:5173
```

当前前端 dev server 已配置为：

- Host: `0.0.0.0`
- Port: `5173`
- 严格占用端口，不自动换端口

所以如果 `5173` 被占用，前端会直接报错，而不是偷偷切到别的端口。

## 9. 启动成功的验收标准

满足下面 4 条，就说明别人已经按文档把系统拉起来了：

1. `http://127.0.0.1:3001/api/health` 返回 `status: ok`
2. `http://127.0.0.1:5173` 可以正常打开首页
3. 前端页面里的 AI 咨询不再提示“后端不可用”或“未配置 API”
4. 不需要修改 `src/masters/config.ts`，也不需要在前端源码里写死密钥

## 10. 明确不要改的地方

为了保证“零改代码启动”，请明确不要做下面这些事：

- 不要修改 `src/masters/config.ts`
- 不要把 API Key 写进前端源码
- 不要修改前端请求地址逻辑
- 不要改 Vite 端口，除非你同时也知道自己为什么要改后端和 CORS

如果按本文档启动，前端默认就是通过后端代理访问模型，不需要再走前端直连模型那条路径。

## 11. 常见问题

### 11.1 页面能打开，但 AI 不工作

先检查：

- `backend/.env` 是否真的存在
- `http://127.0.0.1:3001/api/health` 里的 `apiConfigured` 是否为 `true`
- 后端终端有没有报密钥或模型配置错误

### 11.2 前端报 CORS 错误

一般是 `ALLOWED_ORIGINS` 没包含当前访问地址。

本地开发建议至少保留：

```env
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://192.168.1.*
```

### 11.3 5173 或 3001 端口被占用

先停止占用端口的旧进程，再重新启动：

Windows 可先检查：

```powershell
netstat -ano | findstr :5173
netstat -ano | findstr :3001
```

### 11.4 误以为必须改前端配置文件

当前代码路径下，正常启动只需要改 `backend/.env`，不需要碰前端源码。

## 12. 推荐的最短启动流程

如果你要把步骤贴给别人，直接发下面这组命令就够了。

### 终端 1：后端

```bash
cd <仓库目录>/zhouwenwang/zhouwenwang-divination/backend
npm ci
# 创建并填写 .env
npm start
```

### 终端 2：前端

```bash
cd <仓库目录>/zhouwenwang/zhouwenwang-divination
npm ci
npm run dev
```

### 打开页面

```text
http://127.0.0.1:5173
```

## 13. 当前文档结论

按当前仓库代码，别人想把你的前后端直接拉起来，不需要改任何业务代码，只需要：

- clone 仓库
- 进入 `zhouwenwang/zhouwenwang-divination`
- 分别安装前后端依赖
- 正确创建 `backend/.env`
- 启动后端 `npm start`
- 启动前端 `npm run dev`

这就是当前最稳的启动路径。
