# Render 免费部署指南

## 1. 适用目标

这份指南对应当前仓库的免费部署场景，目标是：

- 用一个 Render Free Web Service 同时承载前端和后端
- 不暴露额外公网端口
- 不把 API Key 写进前端源码

当前推荐部署目录仍然是：

```text
zhouwenwang/zhouwenwang-divination
```

## 2. 为什么选 Render

当前更适合这个项目的免费方案是 Render 单服务部署，原因有两个：

1. 它有持续可用的免费 Web Service，可直接跑 Node/Express
2. 这个项目原本前后端分离，但免费平台通常只给一个公网入口，用单服务托管最稳

不建议把这个项目优先部署到“前端一个免费服务 + 后端另一个免费服务”的组合上，因为你当前前端默认是本地开发思路，拆开部署后需要额外处理默认地址、CORS 和可用性。

## 3. 我已经为仓库做的部署兼容

当前仓库已补齐以下能力：

- 前端本地开发仍默认请求 `当前主机:3001`
- 前端生产环境默认请求“当前站点同源地址”
- 后端在生产环境可直接托管 `dist/` 静态文件
- 仓库根目录新增了 `render.yaml`

也就是说，部署后访问 Render 给你的公网地址，页面和 API 会走同一个域名。

## 4. 部署前准备

你需要准备下面两类信息中的一类：

### 方案 A：Gemini 官方 Key

```env
GEMINI_API_KEY=你的_Gemini_API_Key
```

### 方案 B：兼容 OpenAI 接口的中转服务

```env
API_BASE=https://你的兼容接口根地址/v1
API_KEY=你的兼容接口密钥
MODEL=你要使用的模型名
```

二选一即可。

## 5. Render 上的部署步骤

### 5.1 推送代码到 GitHub

先把当前仓库推到 GitHub。

如果你推送的是整个仓库根目录，那么 Render 会自动使用仓库根目录里的 `render.yaml`，其中已经指定：

```text
rootDir: zhouwenwang/zhouwenwang-divination
```

### 5.2 在 Render 创建 Blueprint 或 Web Service

优先推荐 Blueprint 方式，因为仓库里已经有 `render.yaml`。

如果你手动创建 Web Service，也请保持下面这组配置：

- Runtime: `Node`
- Plan: `Free`
- Root Directory: `zhouwenwang/zhouwenwang-divination`
- Build Command: `npm ci && npm --prefix backend ci && npm run build`
- Start Command: `npm --prefix backend start`
- Health Check Path: `/api/health`

### 5.3 配置环境变量

至少设置：

```env
NODE_ENV=production
```

然后再补下面两套里的其中一套：

Gemini 方案：

```env
GEMINI_API_KEY=你的_Gemini_API_Key
```

兼容接口方案：

```env
API_BASE=https://你的兼容接口根地址/v1
API_KEY=你的兼容接口密钥
MODEL=你要使用的模型名
```

可选但建议设置：

```env
ALLOWED_ORIGINS=https://你的-render-域名.onrender.com
```

如果你后面绑定了自定义域名，就把它也加入 `ALLOWED_ORIGINS`，多个值用逗号分隔。

## 6. 部署后的验收

部署完成后，先验证这两个地址：

### 6.1 健康检查

```text
https://你的-render-域名.onrender.com/api/health
```

预期至少包含：

```json
{
  "status": "ok"
}
```

如果模型配置正确，通常还会看到：

```json
{
  "apiConfigured": true
}
```

### 6.2 首页访问

```text
https://你的-render-域名.onrender.com/
```

打开后应能正常进入首页，且 AI 咨询不再提示“后端不可用”或“未配置 API”。

## 7. 免费版限制

Render 免费 Web Service 的现实限制要先接受：

- 空闲 15 分钟后会休眠
- 下次访问会有冷启动，通常要等几十秒到约 1 分钟
- 本地文件系统是临时的，重启或重新部署后不会保留

所以它适合演示、测试、自己先上线跑通，不适合当正式生产服务。

## 8. 如果你以后要拆成前后端两个服务

当前代码也已经留了口子：前端支持构建时设置 `VITE_SERVER_URL`。

如果你未来改成：

- 前端：静态站点
- 后端：单独 API 服务

那么前端构建前可以设置：

```env
VITE_SERVER_URL=https://你的-api-域名
```

但就你当前“先找一个免费服务器上线”的目标，仍然建议先走单 Render Web Service。
