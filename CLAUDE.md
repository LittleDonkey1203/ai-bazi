# 项目说明

> ✅ Phase 0 初始化已完成。本文件由 Claude Code 在 2026-05-04 探查项目后填写。
> 末尾「待用户确认事项」请你过目,确认后再开始 Phase 1(扫描 + inventory)。

## 项目概况

本仓库是一个 npm workspaces monorepo,包含三个工作区:
- `bazi-mcp/`:TypeScript 实现的 MCP 服务(命理领域),非 UI,**不在本次改造范围**。
- `zhouwenwang/zhouwenwang-divination/`:原始**桌面端**占卜应用(React 19 + Vite 6 + Electron),27 个 `.tsx`。
- `zhouwenwang/zhouwenwang-divination-mobile/`:**本次 UI 改造的目标工程** —— 桌面应用的"移动端优先派生版本",在桌面 UI 基础上重做布局/导航/响应式;33 个 `.tsx`(含测试),已具备 Vitest 测试基建,且子目录已有一份描述移动端架构的 `CLAUDE.md`(见 `zhouwenwang/zhouwenwang-divination-mobile/CLAUDE.md`,与本文件互为补充)。

业务定位:基于古典命理(六爻、奇门遁甲、八字、人生K线、周公解梦、手相)+ 大师人格 + AI 解读的 SPA 应用,黑底橙色品牌色(`#000000` / `#FF9900`),目前 Tailwind 走 CDN、所有页面单 SPA,无后台管理界面。

## 改造目标

本仓库正在进行一次性 UI 改造,目标:

1. 适配移动端(响应式优先,后台关键页用独立移动组件)
2. 升级视觉规范,统一设计语言
3. 注入克制的中国元素(传统色语义化、宋体增强标题层、纹样仅用于装饰位)
4. 优化移动端交互(手势、抽屉、底部 tab、卡片化等)
5. **保持业务功能 100% 不变**(测试用例不允许新增/删除/修改)

> 注:仓库根目录已存在一份 UI 设计稿 `zhouwenwang-mobile-ui.jsx`,展示了"古风传统色 + 宋体 + 印章纹样 + 底部 tab"的目标视觉,**它是设计参考,不参与构建**。

## 技术栈

> 以下信息仅描述改造目标工程 `zhouwenwang/zhouwenwang-divination-mobile/`(下称"目标工程")。

- 前端框架:React 19.1 + Vite 6.3 + TypeScript 5.8(同时通过 `cross-env APP_BUILD_TARGET` 切换 web / Electron 双构建)
- 路由:React Router DOM 7(Web 用 `BrowserRouter`,Electron 用 `HashRouter`)
- 状态管理:Zustand 5(`src/core/store.ts`,localStorage 持久化)
- 桌面 UI 库(现有):无组件库;以原生标签 + Tailwind utility class + `lucide-react` 图标 + `framer-motion` 动画 + `@headlessui/react` 自实现
- 移动 UI 库(本次改造引入):**不引入**。继续手写,沿用 `lucide-react` + `framer-motion` + `@headlessui/react`(库里也没有印章/毛笔分隔线这类中式元素)
- CSS 方案:**Tailwind CDN + CSS 变量 token**。tokens 用 `:root { --color-vermilion: #c41e3a; ... }` 落地于 `src/index.css`,Tailwind 内联 config 中通过 `var(--color-*)` 引用。**不动构建链,不切本地 Tailwind 编译**
- 测试框架:Vitest 2.1 + `@testing-library/react` 16 + `jsdom` 25;桌面工程 `zhouwenwang-divination` 没有测试基建
- 包管理器:npm(根、各 workspace 均存在 `package-lock.json`,未启用 pnpm/yarn);根目录通过 `workspaces` 字段聚合

## 关键命令

> 所有命令需在目标工程目录 `zhouwenwang/zhouwenwang-divination-mobile/` 下执行(也可在根目录用 `npm --prefix ...` 调度)。

- 启动开发:`npm run dev`(端口:`5173`,strict;`vite.config.ts` 已固定;在 `0.0.0.0` 监听)
- 生产构建:`npm run build`(= `npm run build:web`,即 `tsc -b && vite build`)
- 代码检查:`npm run lint`(eslint flat config:`@eslint/js` + `typescript-eslint` + `react-hooks` + `react-refresh`)
- 类型检查:`npm run typecheck`(= `tsc --noEmit`,batch 0 时新增到 mobile 工程的 scripts)
- 单元测试:`npm test`(= `vitest run`);监听模式 `npm run test:watch`
- 视觉回归:Playwright 截图基线对比(batch 0 搭建)。**关键约束**:必须在改造前的 `main` 分支上跑一次 `npm run test:visual --update-snapshots`(或等价命令)生成 baseline,再开始任何 UI 改动
- Electron 构建:`npm run build:electron` / `npm run dist`(本次改造**必须**保证不退化)

## 目录约定

> 路径全部相对于目标工程 `zhouwenwang/zhouwenwang-divination-mobile/`。

- 源码根:`src/`
- 前台目录:**无前后台分离**(本应用只有一个 SPA、一套路由、一套用户角色)
- 后台目录:**N/A**(无管理后台;`docs/PLAYBOOK.md` 中"后台 batch"概念可整体省略,把所有 batch 视为前台)
- 页面目录:
  - `src/pages/HomePage.tsx`(首页)
  - `src/games/<game>/<Game>Page.tsx`(每个占卜功能一个 Page,共 7 个,其中 `qinshi/QinShiPage.tsx` 在 `getAllGames()` 中标记 `hidden`)
- 组件目录:
  - `src/components/common/*`:通用 UI 组件(ErrorToast、HistoryList、MarkdownRenderer、MarqueeNotification、SettingsModal、StreamingMarkdown、TypewriterText、MobileDetector 等)
  - `src/components/layout/*`:布局相关(Layout、Sidebar、BottomNav、MainContent)
  - `src/games/<game>/components/*`:游戏内子组件(目前仅 `bazi/components/BaziCompactGrid.tsx`、`lifekline/components/{KlineChart,LifeKlineMarkdown}.tsx`)
  - `src/masters/MasterSelector.tsx`:大师选择 UI
- 业务逻辑目录(改造禁止修改):
  - `src/core/*` —— Zustand store / settings / storage / types / history / quickQuestions
  - `src/games/*/logic.ts`、`src/games/bazi/{advancedAnalysis,cantianAdapter,caseStorage,chatMemory,yongshenEngine,yongshenV2Analysis}.ts`、`src/games/bazi/blind-three-pass/*`、`src/games/bazi/yongshen-v2/*`、`src/games/qinshi/{prompts,types}.ts`、`src/games/types.ts`、`src/games/index.ts`(导航数据源)
  - `src/masters/{service,prompts,config,types}.ts`(`MasterSelector.tsx` 是 UI,可改;其他四个是业务,不可改)
  - `src/utils/{ganzhiUtils,electron,resources,url,preload}.ts`(纯算法/适配)
  - `src/types/*`
  - 测试目录 `src/**/__tests__/*`、`src/test/setup.ts`

## 改造硬性约束(违反则立即停止报告)

- ❌ **禁止修改业务逻辑层文件**(见上方"业务逻辑目录")
- ❌ **禁止修改组件 props 接口签名**(可新增可选 prop,不可改名/改类型/删除已有 prop)
- ❌ **禁止修改任何测试用例**(包括 `.test`、`.spec`、e2e 文件)
- ❌ 禁止删除文件
- ❌ 禁止"顺手"重命名或移动文件
- ❌ 禁止破坏 Electron 构建(`HashRouter` 路径与 `base: './'` 必须仍可工作)
- ✅ 业务逻辑层(`.tsx` 的组件 body)只允许添加 `useDevice()` / `useBreakpoint()` 这类纯 UI 判断 hook 的 import 和调用
- ✅ 每个 commit 只改一个 batch,信息格式:`ui(batch-N): 简述`
- ✅ 子工程 `CLAUDE.md` 已存在的额外约束(导航数据必须从 `getAllGames()` 派生、`Sidebar` 与 `BottomNav` 共源、不要硬编码路由列表等)继续生效

## 必读文档(每次会话开始前都要读)

- `docs/ui-inventory.md` — 全站清单,改造的"脊柱"(尚未生成,Phase 1 产出)
- `docs/design-system.md` — 设计规范(色彩/字体/断点/中式元素白名单)(尚未生成,Phase 1 产出)
- `docs/PLAYBOOK.md` — 阶段化作战计划(已存在,根目录)
- `zhouwenwang/zhouwenwang-divination-mobile/CLAUDE.md` — 子工程移动端架构说明(已存在,本文件的补充)
- `zhouwenwang/zhouwenwang-divination-mobile/TASK.md` — 已完成的"桌面侧边栏 → 底部导航"任务记录,用于了解既有改造进度

## 改造分批

按 `docs/ui-inventory.md` 的 batch 字段顺序处理,**一次只处理一个 batch**。批号约定(本工程无后台,简化为前台单链):

- batch 0:全局基础设施。**重点是"补"而非"重写"**:
  - 落地 design tokens(CSS 变量 + Tailwind 内联 config 映射)
  - 视觉规范对齐(色彩从 `#FF9900` 单色橙 → `#c41e3a` 主绛红 + `#d4a03e` 黄铜 + 米白/墨青;字体 `'Noto Serif SC'` 标题层)
  - 中式装饰位(印章组件、毛笔分隔线、跑马灯样式微调)
  - Playwright 视觉回归基建 + main 分支 baseline 截图
  - `Layout` / `Sidebar` / `BottomNav` / `MainContent` / `useBreakpoint`(已存在)在 inventory 中标记 `partial - 已完成响应式骨架`,**不重写**,只接入新 tokens
- batch 1-N:前台页面(按业务模块聚类:HomePage / 六爻 / 奇门 / 八字 / 周公 / 人生K线 / 手相 / 古风头像)
- batch 末批:`components/common/*` 残留(Toast、Marquee、Settings、Markdown、Detector 等)、空状态(本工程**无登录注册、无 404 路由**;中式装饰演示位优先放在 SettingsModal / HomePage 顶图)

具体每个 batch 包含哪些文件,由用户在 inventory 生成后人工分配。

## 当不确定时

不要猜。优先采取以下顺序:

1. 通过 Read / Grep / Glob 在项目里找答案
2. 如果项目里没答案,使用 AskUserQuestion 工具问用户
3. **绝不**基于"通常做法"或"看起来像"做修改

## 初始化检查清单(已自检)

- [x] 已读取根目录与三个工作区 `package.json`
- [x] 已识别框架(React 19 + Vite 6 + TS 5.8)
- [x] 已识别路由方案(React Router DOM 7,Web/Electron 双 Router)
- [x] 已识别 CSS 方案(Tailwind CDN + 全局 `index.css`,**无本地 Tailwind 编译**)
- [x] 已统计源码目录下 UI 文件数量(目标工程 `src` 下:33 `.tsx`、约 67 `.ts`、2 `.css`、0 `.vue`/`.svelte`/`.html`(`index.html` 在工程根))
- [x] 已找到业务逻辑层目录(`src/core`、`src/games/*/logic.ts`+引擎、`src/masters/{service,prompts,config,types}`、`src/utils`)
- [x] 已确认包管理器(npm + workspaces)
- [x] 已确认 lint(`npm run lint`)/ test(`npm test`)命令存在;**typecheck 命令不存在**,visual 回归基建**不存在**
- [x] 占位符全部填充
- [x] 待用户确认事项已在下方列出

---

## 锁定决策(2026-05-04 用户确认)

1. **改造范围**:**仅** `zhouwenwang/zhouwenwang-divination-mobile/`。原桌面工程 `zhouwenwang/zhouwenwang-divination/` 冻结,本次 0 改动。
2. **子工程 CLAUDE.md**:保留,与本文件**互补**;**冲突时以本文件为准**。
3. **视觉北极星**:`zhouwenwang-mobile-ui.jsx`。
   - **主品牌色**:绛红 `#c41e3a`(取代旧 `#FF9900` 在主 CTA、激活态、关键品牌位的角色)
   - **辅助色**:橙 `#FF9900` 降级为次级 CTA、状态/警示色
   - 其他基础色:黄铜 `#d4a03e`、米白 `#fffaf2`、墨青 `#2d7d9a`、墨绿 `#2d8b5a`、紫 `#7b5ea7`、铜锈 `#b87333`(配合五行/卦象语义化)
   - 标题字体:`'Noto Serif SC'`(宋体增强标题层)
4. **CSS 方案**:Tailwind CDN + CSS 变量。tokens 落 `src/index.css` 的 `:root`,Tailwind 内联 config 通过 `var(--color-*)` 映射。**不动构建链**。
5. **移动 UI 库**:**不引入**。继续手写 + lucide-react + framer-motion + @headlessui/react。
6. **新增基建**:
   - `package.json` scripts 加 `"typecheck": "tsc --noEmit"`(batch 0 时落)
   - 引入 Playwright 视觉回归(batch 0 时搭建)
   - **关键时序**:必须先在**改造前的 main 分支**生成 baseline 截图,再开始任何 UI 修改。否则基线被污染,回归无意义。
7. **Electron 兼容**:**必须保证不破坏**。`HashRouter` + `base: './'` 契约延续;batch 0 完成后做一次 Electron 构建冒烟测试(`npm run build:electron`)。
8. **批次起点**:已部分完成的响应式骨架文件(`Layout` / `Sidebar` / `BottomNav` / `MainContent` / `useBreakpoint` 及其测试)**纳入** inventory,备注列标记 `partial - 已完成响应式骨架`。batch 0 工作降级为"补 design tokens + 视觉规范对齐 + 中式装饰",**不重写**。
9. **模板组件裁剪**:模板包里的 `MobileTableCard` 本次**不使用**(本工程无后台、无数据表格)。Phase 3 复制模板组件时跳过它。
