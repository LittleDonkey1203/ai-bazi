# TASK.md — 移动端导航重构

> 范围:把"桌面侧边栏导航"迁移到"移动端底部导航(BottomNav)",同时保持桌面端体验不退化,所有新代码附单元测试。
> 详细架构与约束见 `CLAUDE.md`。本文件只列**待办与验收**。

---

## 总览

| # | 任务 | 状态 | 类型 |
| --- | --- | --- | --- |
| T1 | 引入并配置 Vitest 单元测试框架 | ✅ | 基建 |
| T2 | 实现 `useBreakpoint` Hook + 测试 | ✅ | 功能 |
| T3 | 实现 `BottomNav` 组件 + 测试 | ✅ | 功能 |
| T4 | 改造 `Layout` 为响应式 + 测试 | ✅ | 功能 |
| T5 | 调整 `MobileDetector`,移除强拦截 | ✅ | 调整 |
| T6 | 同步路由占位与 padding 处理(主内容下边距) | ✅ | 适配 |
| T7 | 运行 `npm test` 与 `npm run build:web`,全部通过 | ✅ | 校验 |

**最新校验结果**(执行于 `npm test` / `npm run build:web`):
- 测试 17 / 17 通过(`useBreakpoint` 6、`BottomNav` 7、`Layout` 3、`MobileDetector` 1)
- 生产构建成功,无 TS 报错

状态约定:⬜ 未开始 / 🟡 进行中 / ✅ 完成 / ❌ 阻塞。

---

## T1. 引入并配置 Vitest

**目的**:为后续所有改动提供可执行的单测能力。

**Steps**

1. `package.json` 中 `devDependencies` 增加:
   - `vitest`
   - `@testing-library/react`
   - `@testing-library/jest-dom`
   - `@testing-library/user-event`
   - `jsdom`
   - `@types/node`(若尚未存在)
2. `package.json` `scripts` 增加:
   ```json
   "test": "vitest run",
   "test:watch": "vitest"
   ```
3. 新建 `vitest.config.ts`:
   - `environment: 'jsdom'`
   - `setupFiles: ['./src/test/setup.ts']`
   - `globals: true`
4. 新建 `src/test/setup.ts`:
   - `import '@testing-library/jest-dom'`
   - 注入 `window.matchMedia` polyfill(默认返回 `matches=false`,测试中按需覆盖)
   - 注入 `ResizeObserver` mock
5. `tsconfig.app.json` 中 `compilerOptions.types` 增加 `"vitest/globals"`,`include` 增加 `src/test`。

**验收**

- `npm test` 能空跑通过(无用例时返回 0)。
- `import { describe, it, expect } from 'vitest'` 与 `screen.getByText` 能正常解析。

---

## T2. `useBreakpoint` Hook

**位置**:`src/hooks/useBreakpoint.ts`

**API**

```ts
type Breakpoint = 'mobile' | 'tablet' | 'desktop';

interface BreakpointState {
  isMobile: boolean;    // < 768
  isTablet: boolean;    // >= 768 && < 1024
  isDesktop: boolean;   // >= 1024
  breakpoint: Breakpoint;
}

export function useBreakpoint(): BreakpointState;
```

**实现要点**

- 内部用 `window.matchMedia` 监听 `(max-width: 767px)` 与 `(min-width: 1024px)`,返回派生状态。
- 首屏 SSR 安全:若 `typeof window === 'undefined'`,默认返回 desktop 值。
- 使用 `useSyncExternalStore` 或 `useState + addEventListener('change', ...)`。

**测试**(`src/hooks/__tests__/useBreakpoint.test.ts`)

- viewport 宽度 600 → `isMobile=true, breakpoint='mobile'`。
- viewport 宽度 900 → `isTablet=true`。
- viewport 宽度 1280 → `isDesktop=true`。
- 监听变化:从 1280 → 600,断言重新渲染后 `isMobile=true`。

---

## T3. `BottomNav` 组件

**位置**:`src/components/layout/BottomNav.tsx`

**职责**

- 显示底部导航栏,数据来自 `getAllGames()` + 固定的"首页"项。
- 主导航最多 5 项;若可见项 > 5,前 4 项 + "更多" 折叠项,"更多"打开抽屉/弹层展示剩余项 + 设置。
- 点击项跳转路由;当前路径高亮(品牌橙 `#FF9900`)。

**HTML 结构**

```tsx
<nav
  role="navigation"
  aria-label="底部导航"
  className="fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-[#333333] md:hidden"
  style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
>
  <ul className="flex items-stretch justify-around h-16">
    {/* 每一项: <li><Link><Icon/><span>{label}</span></Link></li> */}
  </ul>
</nav>
```

**测试**(`src/components/layout/__tests__/BottomNav.test.tsx`)

- 渲染时显示"首页"以及 `getAllGames()` 返回的所有项的 `name`(在直接展示数 ≤ 5 的前提下)。
- 当前路由 `/bazi` 时,"八字推命"项含激活态(用 `aria-current="page"` 断言,而不是 class 名)。
- 点击"奇门遁甲"后,`useLocation().pathname === '/qimen'`(用 `MemoryRouter` + `<Routes>` + 探测元素验证)。
- 当游戏数 > 4 时,渲染"更多"按钮,点击后能在弹层中找到剩余项。

---

## T4. 改造 `Layout` 为响应式

**位置**:`src/components/layout/Layout.tsx`

**改动**

- 引入 `useBreakpoint()`。
- 移动端(`isMobile === true`):
  - 不渲染 `<Sidebar />`。
  - 渲染 `<BottomNav />`。
  - 主内容容器 `marginLeft: 0`,`paddingBottom: 5rem`(给 BottomNav 让位)。
- 桌面/平板:沿用现有 Sidebar 布局,不动 `marginLeft` 逻辑。

**测试**(`src/components/layout/__tests__/Layout.test.tsx`)

- mock `useBreakpoint` 返回 mobile → DOM 中找不到 `data-testid="sidebar"`,但能找到 `role="navigation" aria-label="底部导航"`。
- mock `useBreakpoint` 返回 desktop → 能找到 Sidebar,找不到底部导航。
- 必要时把 `Sidebar` 增加 `data-testid="sidebar"` 用于断言。

---

## T5. 调整 `MobileDetector`

**位置**:`src/components/common/MobileDetector.tsx`

**改动**

- 默认**不再弹出**"建议电脑访问"模态框。
- 保留组件文件,但导出空实现(返回 `null`),避免外部 import 报错;或将原行为放在一个隐藏的开发期开关后。
- `Layout.tsx` 中保留对它的引用即可,无需删除。

**测试**

- 渲染 `<MobileDetector />` 后,DOM 中**不**出现"获得最佳体验"文案。

---

## T6. 主内容下边距适配

**位置**:`src/components/layout/MainContent.tsx`

**改动**

- 接入 `useBreakpoint()`(或通过 props 由 Layout 传入 `isMobile`)。
- mobile 时给最外层容器增加 `pb-20`(与 BottomNav 高度 + 安全区匹配)。

**验收**

- 任意游戏页最后一屏的内容,在 iPhone 视口(390×844)下不会被 BottomNav 遮挡。

---

## T7. 校验

**Steps**

1. `npm install`
2. `npm test` 全部通过(覆盖 T2/T3/T4/T5)。
3. `npm run build:web` 无 TS / Vite 错误。
4. `npm run dev` 后用 Chrome DevTools 设备模拟:
   - iPhone 12 Pro:看到底部导航,无 Sidebar。
   - iPad Pro:看到 Sidebar,无底部导航。
   - 1440×900 桌面:同 iPad 行为。

**完成标准**

- 全部测试通过。
- 生产构建无错误。
- 桌面端无视觉退化。
- 移动端 5 个核心占卜模块均可通过底部导航在两次点击内到达。

---

## 不在本次范围内(Out of Scope)

- 各游戏页内部的移动端排版细化(表单换行、按钮尺寸等)。
- 后端 API、AI 服务、masters 数据。
- Electron 打包配置。
- 国际化、深色/浅色主题切换。

如后续需要扩展,新开 `TASK-mobile-pages.md`。
