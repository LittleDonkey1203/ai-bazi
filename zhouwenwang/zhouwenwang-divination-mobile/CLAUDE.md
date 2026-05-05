# CLAUDE.md — zhouwenwang-divination-mobile

> 本工程是 `zhouwenwang/zhouwenwang-divination` 的**移动端优化派生版本**。
> 它保留原有的占卜业务逻辑、AI 服务对接、状态管理与构建链，仅对**布局/导航/响应式**进行重构,把"桌面侧边栏导航"迁移到"移动端底部导航栏(BottomNav)",并通过响应式断点同时兼容桌面端。

---

## 1. 工程定位

| 属性 | 内容 |
| --- | --- |
| 名称 | `zhouwenwang-divination-mobile` |
| 派生自 | `../zhouwenwang-divination` |
| 主要目标 | 在保持业务功能完全等价的前提下,把 UI 改造为"Mobile-First + 桌面回退"的响应式布局 |
| 核心改动 | 1) 新增 `BottomNav` 组件 2) 改造 `Layout` 为响应式 3) 新增 `useBreakpoint` Hook 4) 调整 `MobileDetector` 不再拦截手机用户 |
| 不动改动 | 业务页面 (`src/games/*`)、状态 store、AI 服务、masters、core/* |
| 构建 | Vite 6 + React 19 + TypeScript 5.8 |
| 测试 | Vitest + @testing-library/react + jsdom |

---

## 2. 关键架构

### 2.1 入口与路由

```
src/main.tsx
  └── src/App.tsx            // 选择 BrowserRouter / HashRouter (Electron 用 Hash)
        └── components/layout/Layout.tsx
              ├── MobileDetector       (设备检测,改造后不再阻拦手机)
              ├── MarqueeNotification  (跑马灯)
              ├── Sidebar              (>= md 显示)
              ├── BottomNav            (< md 显示, 新增)
              └── MainContent          (路由出口, 容纳所有 game 页面)
```

### 2.2 导航数据源

导航项**唯一来源**:`src/games/index.ts` 暴露的 `getAllGames()`,加上一个固定的"首页"项。
**`Sidebar` 与 `BottomNav` 必须共用同一份数据源**,新增/隐藏游戏时不能出现两边不一致。

### 2.3 状态管理

- `src/core/store.ts`:Zustand store,持久化到 localStorage。
- `useSettings`:含 `sidebarCollapsed`(桌面侧边栏折叠态),移动端不使用此字段,但保持兼容。
- `useUI`、`useMaster`、`useStore`:沿用,不改动。

### 2.4 路由约定

所有路由路径定义在 `src/games/index.ts` 的 `path` 字段。新增游戏 → 同步增加路由(`MainContent.tsx`)。
**不要在 BottomNav 中硬编码路径列表**,一律从 `getAllGames()` 派生。

---

## 3. 响应式断点

| 名称 | 范围 | 行为 |
| --- | --- | --- |
| `mobile` | `< 768px` | 隐藏 Sidebar,显示 BottomNav,主内容左/右无外边距 |
| `tablet` | `768 – 1023px` | 显示 Sidebar(可折叠),不显示 BottomNav |
| `desktop` | `>= 1024px` | 显示 Sidebar(默认展开),不显示 BottomNav |

断点判断走 `src/hooks/useBreakpoint.ts`(新增)。**禁止**直接在组件里写 `window.innerWidth < 768`。

---

## 4. 新增文件清单

| 路径 | 作用 |
| --- | --- |
| `src/hooks/useBreakpoint.ts` | 监听 `matchMedia`,返回 `{ isMobile, isTablet, isDesktop, breakpoint }` |
| `src/hooks/__tests__/useBreakpoint.test.ts` | 单元测试 |
| `src/components/layout/BottomNav.tsx` | 移动端底部导航栏 |
| `src/components/layout/__tests__/BottomNav.test.tsx` | 单元测试 |
| `src/components/layout/__tests__/Layout.test.tsx` | 响应式分支测试 |
| `vitest.config.ts` | Vitest 配置 |
| `src/test/setup.ts` | 测试环境(注入 `matchMedia` polyfill 等) |

---

## 5. 修改文件清单

| 路径 | 修改点 |
| --- | --- |
| `src/components/layout/Layout.tsx` | 根据 `useBreakpoint()` 决定渲染 `Sidebar` 或 `BottomNav`;主内容在移动端 `marginLeft: 0`、`paddingBottom: 64px` 给 BottomNav 让位 |
| `src/components/common/MobileDetector.tsx` | 移除"建议在电脑访问"的强拦截,默认放行手机用户;可保留作为隐藏的开发期工具 |
| `package.json` | 新增 `test`、`test:watch` 脚本;新增 `vitest`、`@testing-library/react`、`@testing-library/jest-dom`、`jsdom` 等 devDependencies |
| `tsconfig.app.json` | 包含测试目录,types 增加 `vitest/globals` |

---

## 6. 移动端 UX 规则

1. **触摸目标**:BottomNav 每项最小高度 `56px`,可点区域 ≥ `44×44px`(iOS HIG 推荐)。
2. **安全区**:BottomNav 容器使用 `padding-bottom: env(safe-area-inset-bottom)`,适配 iPhone 刘海屏底部。
3. **图标 + 文字**:每项均有图标 + 中文短标签,激活态用品牌橙 `#FF9900`。
4. **可见项数**:最多 5 个主导航项。游戏数 > 4 时,把"首页"+ 前 3 个游戏 + "更多" 这种方案兜底。
5. **"更多"页**:展开剩余功能;同时承载"设置"入口。
6. **滚动行为**:页面滚动时 BottomNav **不隐藏**,固定在 `position: fixed; bottom: 0`。
7. **横屏**:横屏(高度 < 480px)时弱化标签文字,只显图标。
8. **暗色风格**:沿用全站黑底 + 橙色品牌色,不引入新配色。

---

## 7. 测试规范

- 测试框架:**Vitest** + **@testing-library/react**,环境 `jsdom`。
- 文件命名:与被测文件同目录的 `__tests__/` 子目录,后缀 `.test.ts(x)`。
- 必须覆盖的最小用例集:
  - `useBreakpoint`:不同 viewport 宽度返回正确断点。
  - `BottomNav`:渲染所有可见游戏项;当前路由项有激活样式;点击触发路由变更。
  - `Layout`:`isMobile=true` 渲染 `BottomNav` 不渲染 `Sidebar`;反之亦然。
- 运行命令:
  - 一次性:`npm test`
  - 监听:`npm run test:watch`
- **TDD 优先**:每个新组件先写 1-2 个核心用例再写实现;实现后补全分支用例。

---

## 8. 开发约束(MUST)

1. **不要修改 `src/games/*`、`src/core/*`、`src/masters/*`、`src/utils/*` 的业务逻辑**,本次任务只动布局。
2. **不要硬编码路由列表**,导航项必须从 `getAllGames()` 派生,加 `首页`。
3. **不要引入新的 UI 框架/组件库**,沿用 `lucide-react` 图标 + Tailwind CDN + `framer-motion`。
4. **不要破坏 Electron 构建**,Layout 改造后必须仍可在 `HashRouter` 下正常工作。
5. **所有新代码必须有单元测试**,无测试不合并。
6. **CSS 优先用 Tailwind utility class**,不要新建额外 CSS 文件;`safe-area-inset-bottom` 用 `style` 内联或 `@supports`。
7. **保留原 Sidebar**,不删除;只是不在移动端渲染它。

---

## 9. 常用命令

```bash
# 安装依赖
npm install

# 开发
npm run dev               # http://localhost:5173

# 单元测试
npm test                  # 一次性运行
npm run test:watch        # 监听模式

# 生产构建
npm run build             # = build:web
npm run build:web
npm run build:electron

# Lint
npm run lint
```

---

## 10. 已知风险与注意事项

- **Tailwind 走 CDN**(见 `index.html`):测试时 jsdom 不会加载 CDN,断言**不要依赖具体 class 的视觉效果**,只断言 class 是否存在或元素是否在 DOM 中。
- **`useBreakpoint` 在 SSR/jsdom 默认无 `matchMedia`**:测试 setup 中需 polyfill。
- **底部导航高度** 影响游戏页面的最后一屏滚动,统一通过 `MainContent` 在 mobile 时增加 `pb-20` 处理,各游戏页**无须**逐个改。
- **MobileDetector** 旧逻辑会在小屏弹"建议电脑访问"模态框,本次改造后默认禁用拦截,只保留"已使用移动端"的轻提示(或彻底移除)。
