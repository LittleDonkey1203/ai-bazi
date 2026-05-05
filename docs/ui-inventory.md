# UI 改造清单

> 扫描时间:2026-05-04
> 工具:ui-scanner subagent
> 项目:`zhouwenwang/zhouwenwang-divination-mobile` —— `zhouwenwang-divination` 的移动端优化派生工程。
> 技术栈:React 19 + Vite 6 + TypeScript 5.8 + React Router DOM 7(Web 用 `BrowserRouter` / Electron 用 `HashRouter`),状态 Zustand 5,样式 Tailwind CDN + 自定义 CSS。
> 当前已部分完成"桌面侧边栏 → 底部导航"的响应式骨架(`Layout` / `Sidebar` / `BottomNav` / `MainContent` / `useBreakpoint`),其余页面尚未做整体响应式。
> 品牌色正在从单一橙 `#FF9900` 迁移到主绛红 `#c41e3a` + 辅助橙(本批清单仅供改造对账,不在此处分配色彩)。
> 扫描范围:**仅** `zhouwenwang/zhouwenwang-divination-mobile/src/` 下的 UI 资产 + 工程根 `index.html`。
> 已显式排除:`bazi-mcp/`、`zhouwenwang/zhouwenwang-divination/`、根目录 `zhouwenwang-mobile-ui.jsx`(设计稿)、所有 `__tests__/`、`*.test.*` / `*.spec.*`、`src/test/setup.ts`、`node_modules/`、`dist/`、`release/`,以及业务逻辑层(`core/*`、`games/*/logic.ts` 等纯 .ts、`masters/{service,prompts,config,types,index}.ts`、`utils/*`、`types/*`、`styles/*`、`vite-env.d.ts`、`components/common/{useAutoScroll.ts,index.ts}`)。

## 统计

- 总文件数:**33**
- **实改造文件数:30**(33 - 3 个 SKIP)
- **改造批次:6 个**(batch 0 / 1 / 2 / 3 / 4 / 5,合计覆盖 30 个文件)
- page:**8** 个 / layout:**4** 个 / component:**18** 个 / hook:**1** 个 / style:**2** 个 / html:**1** 个(总计 34;`Layout` 同时是入口与 layout,只计 1 次,实际行数 33)
- 前台(F):**24** 个 / 后台(A):**0** 个 —— **本工程无后台、无登录注册、无 404 路由** / 共享/全局基础设施(S):**9** 个
- 已有响应式:**13** 个(已使用 `useBreakpoint` / `matchMedia` / Tailwind `sm:` `md:` `lg:` `xl:` 断点;含部分仅排版断点)
- 完全无响应式:**20** 个
- ⚠️ 响应式判据细则:仅以下关键字算"是":`useBreakpoint`、`matchMedia`、CSS `@media (max-width|min-width|width)`、Tailwind 断点前缀 `sm:` `md:` `lg:` `xl:` `2xl:`。**`framer-motion` 与 `lucide-react` 不算响应式判据**,本次扫描已避免误判。`@media (prefers-reduced-motion)` / `@media (prefers-color-scheme)` 属于偏好查询而非视口断点,本表标记为"否"并在备注列说明。

## 清单

| ID | 路径 | 类型 | 端 | 路由 | 主要元素 | 已响应式 | batch | status | 备注 |
|----|------|------|----|----|---------|---------|-------|--------|------|
| S001 | zhouwenwang/zhouwenwang-divination-mobile/index.html | html | shared | - | viewport meta / Tailwind CDN config / brand colors | 否 | 0 | DONE | 工程根入口;内嵌 Tailwind config(brand-orange 等),后续主色迁移时需在此声明扩展色 | step B 注入 Tailwind config (29 utilities + brand-* deprecation) |
| S002 | zhouwenwang/zhouwenwang-divination-mobile/src/main.tsx | component | shared | - | createRoot / StrictMode | 否 | 0 | SKIP | React 入口,仅挂载 App,无 UI 元素;batch 0 时若不需注入全局 Provider/字体引导,改 SKIP | batch 0 评估后无需注入全局 Provider/字体引导,跳过 |
| S003 | zhouwenwang/zhouwenwang-divination-mobile/src/App.tsx | layout | shared | - | Router / Layout / ElectronInfo | 否 | 0 | SKIP | 顶层路由壳,依据 `isElectron()` 切换 BrowserRouter / HashRouter;batch 0 时若不需注入全局 Provider/字体引导,改 SKIP | batch 0 评估后 Router 壳无需改动,跳过 |
| S004 | zhouwenwang/zhouwenwang-divination-mobile/src/index.css | style | shared | - | reset / dark theme / 动画 keyframes(fadeIn/slideIn 等) | 否 | 0 | DONE | 含 `@media (prefers-color-scheme)`(已注释禁用,强制暗色)— 不算视口断点;design-tokens 的 CSS 变量后续应放此处 | step B 注入完整 design tokens 三层 + 字体栈 + 移动端覆盖 |
| S005 | zhouwenwang/zhouwenwang-divination-mobile/src/App.css | style | shared | - | logo / card / read-the-docs 残留 | 否 | 0 | SKIP | 含 `@media (prefers-reduced-motion)` — 偏好查询,不算视口断点;模板残留样式可能可清理但需确认 | 模板残留(logo/read-the-docs),不影响功能;留 batch 5 末批清理(见 cleanup-backlog.md) |
| S006 | zhouwenwang/zhouwenwang-divination-mobile/src/hooks/useBreakpoint.ts | hook | shared | - | matchMedia(MOBILE/DESKTOP) → `{ isMobile, isTablet, isDesktop }` | 是 | 0 | SKIP | partial - 已完成响应式骨架(本次主色/语义化迁移可能无需改动);改造期所有断点判断的唯一来源 | hook 无样式只读,partial 已完成响应式契约,batch 0 不动 |
| S007 | zhouwenwang/zhouwenwang-divination-mobile/src/components/layout/Layout.tsx | layout | shared | - | MobileDetector / Marquee / Sidebar / BottomNav / MainContent 装配 | 是 | 0 | DONE | partial - 已完成响应式骨架;step D: bg-black→bg-night, paddingBottom 修 G1 (calc + safe-area) |
| S008 | zhouwenwang/zhouwenwang-divination-mobile/src/components/layout/Sidebar.tsx | layout | shared | - | nav-list / collapse-btn / settings-entry / 大师 badge | 否 | 0 | DONE | partial - 已完成响应式骨架;step D: bg-black→bg-night ×2, Star 图标 text-[#FF9900]→text-brand;灰阶 hex 留 cleanup-backlog |
| S009 | zhouwenwang/zhouwenwang-divination-mobile/src/components/layout/BottomNav.tsx | layout | shared | - | tab-bar / more-sheet(底部抽屉) / safe-area-inset | 是 | 0 | DONE | partial - 已完成响应式骨架;step D: bg-black→bg-night, bg-[#111111]→bg-night-2;active 态 text-[#FF9900] 受测试断言锁定,留 cleanup-backlog |
| S010 | zhouwenwang/zhouwenwang-divination-mobile/src/components/layout/MainContent.tsx | layout | shared | - | Routes / Suspense / framer-motion 页面切换 | 是 | 0 | DONE | partial - 已完成响应式骨架;step D: bg-black→bg-night |
| F001 | zhouwenwang/zhouwenwang-divination-mobile/src/pages/HomePage.tsx | page | web | / | hero / 游戏卡片 grid / 大师介绍 / cta | 是 | 1 | DONE | 仅排版断点(`md:text-6xl`);布局 grid 未分级,卡片在窄屏可能堆叠不佳 | batch 1 完成,Hero/CTA/卡片/Grid/底部 全部接 token + 装饰 |
| F002 | zhouwenwang/zhouwenwang-divination-mobile/src/components/MasterSelectorDemo.tsx | page | web | /masters | header / 大师卡片 / 调试信息面板 | 否 | 1 | DONE | 注:CLAUDE.md 称其为"大师选择演示页",定位为页;包裹 MasterSelector | batch 1 完成,token 迁移 + 标题宋体 + 调试面板 DEV 包裹 |
| F003 | zhouwenwang/zhouwenwang-divination-mobile/src/games/liuyao/LiuYaoPage.tsx | page | web | /liuyao | 问题输入 / 起卦动画(video) / 卦象展示 / AI 流式分析 | 是 | 2 | TODO | 仅排版断点(`md:text-5xl`);卦象六爻矩阵需移动端竖向适配 |
| F004 | zhouwenwang/zhouwenwang-divination-mobile/src/games/qimen/QiMenPage.tsx | page | web | /qimen | 时间选择器 / 九宫格盘 / quick-questions / AI 流式分析 | 是 | 2 | TODO | 仅排版断点;九宫格在 < 360 宽屏需收紧字号或允许横滚 |
| F005 | zhouwenwang/zhouwenwang-divination-mobile/src/games/bazi/BaZiPage.tsx | page | web | /bazi | 出生信息 form / 多视图 tabs / 命盘 grid / 神煞 / 大运 / 流年 / AI 对话 / 案例存档 | 是 | 3 | TODO | **本工程最复杂页**(2800+ 行);已大量使用 `md:` `lg:` `xl:` 分级,真正的响应式优等生但仍有 `xl:hidden` 与桌面专属侧栏要再检视 |
| F006 | zhouwenwang/zhouwenwang-divination-mobile/src/games/bazi/components/BaziCompactGrid.tsx | component | web | - | 紧凑命盘 grid(主星/天干/地支/藏干/纳音/神煞) | 否 | 3 | TODO | BaZiPage 子组件,固定列宽,移动端横滚展示;批次跟随 BaZiPage |
| F007 | zhouwenwang/zhouwenwang-divination-mobile/src/games/palmistry/PalmistryPage.tsx | page | web | /palmistry | 文件拖拽上传 / 图像预览 / AI 流式分析 | 是 | 4 | TODO | `md:grid-cols-2`;移动端拖拽体验需改造为点击拍照/相册 |
| F008 | zhouwenwang/zhouwenwang-divination-mobile/src/games/zhougong/ZhouGongPage.tsx | page | web | /zhougong | 梦境文本输入 / quick-questions / AI 流式分析 | 是 | 4 | TODO | 仅排版断点(`md:text-5xl`) |
| F009 | zhouwenwang/zhouwenwang-divination-mobile/src/games/lifekline/LifeKlinePage.tsx | page | web | /lifekline | 表单 / Recharts 蜡烛图 / 统计卡片 / Markdown 解读 | 是 | 4 | TODO | `md:grid-cols-2` `md:grid-cols-4`;K 线图在窄屏需横向滚动或缩略 |
| F010 | zhouwenwang/zhouwenwang-divination-mobile/src/games/lifekline/components/KlineChart.tsx | component | web | - | recharts ComposedChart / Bar / 自定义蜡烛 shape / Tooltip | 否 | 4 | TODO | LifeKlinePage 子组件,使用 ResponsiveContainer(recharts 内部自适应),但外层断点未分级 |
| F011 | zhouwenwang/zhouwenwang-divination-mobile/src/games/lifekline/components/LifeKlineMarkdown.tsx | component | web | - | ReactMarkdown(绿色主题) | 否 | 4 | TODO | LifeKlinePage 子组件;典型富文本渲染,移动端字号/行距需复核 |
| F012 | zhouwenwang/zhouwenwang-divination-mobile/src/games/qinshi/QinShiPage.tsx | page | web | (路由已注释) | 文件上传 / 风格选择卡片 / 生成图预览 | 是 | SKIP | SKIP | 路由未启用(`/qinshi` 在 `MainContent.tsx` 中被注释),本次不改造,等路由启用后补响应式 |
| F013 | zhouwenwang/zhouwenwang-divination-mobile/src/masters/MasterSelector.tsx | component | web | - | 大师卡片网格 / loading / error 态 | 否 | 1 | DONE | 复用组件:HomePage、MasterSelectorDemo、SettingsModal 都用它;批次建议跟随 MasterSelectorDemo | batch 1 完成,token 迁移 + 印章选中态 + 大师名宋体 |
| F014 | zhouwenwang/zhouwenwang-divination-mobile/src/components/common/HistoryList.tsx | component | shared | - | 列表 / 详情面板 / 删除/清空确认 | 否 | 5 | TODO | 各占卜页可能引用(目前 grep 未见直接引用,但已 export);移动端需做卡片化 |
| F015 | zhouwenwang/zhouwenwang-divination-mobile/src/components/common/SettingsModal.tsx | component | shared | - | Headless UI Dialog / tabs / form / API key / 数据导入导出 | 否 | 5 | TODO | Sidebar 与 BottomNav 都触发它;移动端模态需占满屏并允许分步,改造重点之一 |
| F016 | zhouwenwang/zhouwenwang-divination-mobile/src/components/common/MarkdownRenderer.tsx | component | shared | - | ReactMarkdown(橙色主题) | 否 | 5 | TODO | 通用 Markdown,字号/行距移动端需复核 |
| F017 | zhouwenwang/zhouwenwang-divination-mobile/src/components/common/StreamingMarkdown.tsx | component | shared | - | 流式 Markdown(代码块/表格预处理) | 否 | 5 | TODO | 各占卜页 AI 流式输出统一组件 |
| F018 | zhouwenwang/zhouwenwang-divination-mobile/src/components/common/TypewriterText.tsx | component | shared | - | 打字机效果 + 闪烁光标 | 否 | 5 | TODO | 装饰组件,本次改造可能仅微调字色 |
| F019 | zhouwenwang/zhouwenwang-divination-mobile/src/components/common/ErrorToast.tsx | component | shared | - | 顶部 toast / 关闭按钮 | 否 | 5 | TODO | 使用 styles/modalStyles.ts 的内联样式,移动端宽度需复核 |
| F020 | zhouwenwang/zhouwenwang-divination-mobile/src/components/common/MarqueeNotification.tsx | component | shared | - | 顶部跑马灯 / 指数退避 fetch | 否 | 5 | TODO | 全局覆盖型组件,移动端高度/字号需复核 |
| F021 | zhouwenwang/zhouwenwang-divination-mobile/src/components/common/MobileDetector.tsx | component | shared | - | (空实现,返回 null) | 否 | SKIP | SKIP | 空实现遗物,维持现状,本次不动 |
| F022 | zhouwenwang/zhouwenwang-divination-mobile/src/components/common/GitHubLink.tsx | component | shared | - | 浮窗按钮 / GitHub icon / 跳转 | 否 | 5 | TODO | 全局浮窗(右上角);移动端可能与跑马灯/导航有重叠,需复核 z-index 与位置 |
| F023 | zhouwenwang/zhouwenwang-divination-mobile/src/components/ElectronInfo.tsx | component | shared | - | 浮窗 / 平台与版本展示 | 否 | SKIP | SKIP | 仅 Electron 浮窗,桌面窗口宽度足够,本次不做响应式;batch 0 完成后跑 `npm run build:electron` 冒烟测试,确认浮窗位置无破坏 |

## 校验

- 文件系统统计命令(PowerShell):

      Get-ChildItem zhouwenwang\zhouwenwang-divination-mobile\src -Recurse -File `
        -Include *.tsx,*.css | Where-Object { $_.FullName -notmatch '__tests__' }
      Get-Item zhouwenwang\zhouwenwang-divination-mobile\index.html
      Get-Item zhouwenwang\zhouwenwang-divination-mobile\src\hooks\useBreakpoint.ts

- 等价 bash:

      find zhouwenwang/zhouwenwang-divination-mobile/src -type f \
           \( -name '*.tsx' -o -name '*.css' \) ! -path '*__tests__*'

- 命令结果:
  - `.tsx`(排除 `__tests__/`):**29** 个
  - `.css`:**2** 个(`src/index.css`、`src/App.css`)
  - 纯 UI hook(白名单):**1** 个(`src/hooks/useBreakpoint.ts`)
  - 工程根 `index.html`:**1** 个
  - 合计:**33** 个
- 清单总数:**33**(其中 30 改造 + 3 SKIP)
- ✅ **一致**

附:被显式排除而未列入的 .ts(均属业务逻辑/类型/工具,按用户指示不纳入):
`core/*` (6) · `games/index.ts` · `games/types.ts` · `games/*/index.ts` (7) · `games/*/logic.ts` (7) · `games/qinshi/{prompts,types}.ts` (2) · `games/bazi/{advancedAnalysis,cantianAdapter,caseStorage,chatMemory,yongshenEngine,yongshenV2Analysis}.ts` (6) · `games/bazi/blind-three-pass/*.ts` (5) · `games/bazi/yongshen-v2/*.ts` (14) · `masters/{service,prompts,config,types,index}.ts` (5) · `utils/*` (6) · `types/index.ts` · `styles/modalStyles.ts` · `vite-env.d.ts` · `components/common/{index.ts,useAutoScroll.ts}` (2) · `components/layout/index.ts`(barrel)。共计被排除 ~65 个非 UI .ts 文件,符合用户范围声明。

## 给用户的建议(已锁定,见下方"批次执行计划")

> ✅ 决策已于 2026-05-04 锁定。下方"批次执行计划"是权威来源,以下记录仅作历史。

### 推荐 batch 划分(scanner 原推荐,与最终决策略有调整)

scanner 原本推荐把人生K线放在 batch 3(与八字一组),最终用户决定:八字单独成 batch 3,人生K线并入 batch 4(与周公、手相一起)。

### 不确定的文件 → 用户决策

- **F012 `QinShiPage.tsx`** → SKIP(路由未启用,等启用后补)
- **F021 `MobileDetector.tsx`** → SKIP(空实现遗物,维持现状)
- **F023 `ElectronInfo.tsx`** → SKIP(桌面窗口宽度足够;batch 0 完成后跑 Electron 冒烟测试)

## 批次执行计划

> 后续 ui-refactorer 按号取件;每批一个 commit,信息格式 `ui(batch-N): 简述`。

| Batch | 主题 | 文件数 | 文件 ID(顺序为 ui-refactorer 推荐处理顺序) |
|-------|------|--------|------------------------------------|
| **0** | 全局基础设施 + design tokens 接入 + Playwright 视觉回归基建 | 10 | S001、S004、S005、S002、S003、S006、S007、S008、S009、S010 |
| **1** | 首页 + 大师选择 | 3 | F001、F002、F013 |
| **2** | 六爻 + 奇门 | 2 | F003、F004 |
| **3** | 八字(本工程最复杂页,单独成批) | 2 | F005、F006 |
| **4** | 周公 + 手相 + 人生K线 | 5 | F008、F007、F009、F010、F011 |
| **5** | 通用 UI 组件(末批,中式装饰发挥位) | 8 | F015、F020、F016、F017、F014、F018、F019、F022 |
| **SKIP** | 不在本次范围 | 3 | F012、F021、F023 |
| **合计** | — | **30 改造 + 3 SKIP = 33** | — |

### 批次内执行要点

- **batch 0**:**先 baseline 后改造**。
  1. 切到 `main`(改造前)+ 搭好 Playwright,跑一次截图基线(7 个核心页面 × {mobile 390×844, tablet 768×1024, desktop 1440×900});
  2. 在 `src/index.css` 注入 design tokens(`:root` CSS 变量),`index.html` 内联 Tailwind config 用 `var(--color-*)` 引用;
  3. S006-S010 标 partial,只接入新 tokens,**不重写**响应式骨架;
  4. 加 `package.json` 的 `typecheck` 脚本(已加);
  5. 收尾:`npm run typecheck && npm run build:web && npm run build:electron`(Electron 冒烟)。
- **batch 1-4**:每批先 `useBreakpoint()` 评估、改样式、跑 vitest + typecheck + 视觉回归(对照 batch 0 的 baseline,允许的差异需人工 ack)。
- **batch 5**:通用组件改造容易跨批影响 batch 1-4 已改的页面,**视觉回归必须再跑一次**全量。
- **每批结束**:commit,格式 `ui(batch-N): 简述`(子工程 CLAUDE.md 约束)。

### SKIP 文件的后续轨迹

- F012 `QinShiPage.tsx`:启用 `/qinshi` 路由后单独立 ticket,继承 batch 4 风格(古风头像生成页与手相、周公同类)。
- F021 `MobileDetector.tsx`:本次零改动;**改造结束后**评估是否彻底删除并清理 `Layout.tsx` 中的 import。
- F023 `ElectronInfo.tsx`:batch 0 完成后跑 `npm run build:electron`,确认浮窗与新 design tokens 不冲突;若发生位置/字色问题,小修单独提 PR,不并入本次改造范围。
