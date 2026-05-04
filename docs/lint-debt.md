# Lint 债务清单(改造前快照)

> 时间:2026-05-04
> 来源:Phase 3 batch 0 step E 闸门 1(`npm run lint`)
> 原始日志:[`docs/lint-baseline-batch-0.log`](./lint-baseline-batch-0.log)
> 状态:**改造前预存在,改造期间不全量修复**
> 配套规则:[`docs/design-system.md` §10.1 改造期间允许的 lint 顺手修复](./design-system.md)
> 增量检测:[`.claude/agents/ui-auditor.md` 检查 12](../.claude/agents/ui-auditor.md)

## 总览

| 来源 | 数量 |
|---|---|
| ESLint errors | **100** |
| ESLint warnings | **5** |
| Vite build warnings | **8**(详见 `docs/cleanup-backlog.md`) |
| **合计** | **113** |

### 按 ESLint 规则分类

| 规则 | 数量 | 顺手修允许? | 备注 |
|---|---|---|---|
| `@typescript-eslint/no-unused-vars` | **59** | ✅ 允许(白名单)| unused imports + unused locals,可安全删除 |
| `@typescript-eslint/no-explicit-any` | **35** | ❌ 严禁 | `any → 具体类型`可能改运行时类型推导 |
| `react-hooks/exhaustive-deps` | **5** | ❌ 严禁 | 添加依赖改 useEffect 触发频率 |
| `prefer-const` | **3** | ✅ 允许(白名单)| `let → const`,纯静态 |
| `@typescript-eslint/no-namespace` | **3** | ❌ 严禁 | 涉及 `src/games/types.ts` 业务结构性改动 |
| **合计** | **105** | 62 允许 / 43 严禁 | |

### 业务逻辑保护路径(pre-commit hook 拦截)

以下路径下的文件**禁止任何 lint 修复**(包括白名单内的):
- `src/core/*`
- `src/games/*/(logic|engine|cantian|caseStorage|chatMemory|yongshen)*.ts`
- `src/masters/{service,prompts,config,types,index}.ts`
- `src/utils/*.ts`
- `src/types/*`

> ✅ **2026-05-04 step F 前夕加固**:`src/games/bazi/advancedAnalysis.ts` 与 `src/games/types.ts` 已被 hook regex 覆盖(`pre-commit hook` 文件头注释列出 11 项对照表全 ✓)。详见 `docs/cleanup-backlog.md` "hook regex 缺口加固" 段。本表中所有原 🔒 标记文件现等同于 🚫 处理。

---

## 按文件分类(逐文件列错误)

> 状态图例:
> - ✅ **可修**:UI 文件 + 全部错误在白名单
> - 🚫 **保护路径(不动)**:hook regex 拦截,任何 lint 修复都不允许
> - ⚠️ **混合**:UI 文件,但含禁区规则(如 `any`),只能顺手修白名单部分
> - 🔒 ~~业务但 hook 未覆盖~~ —— **2026-05-04 step F 前夕已 resolved**,所有原 🔒 文件已纳入 🚫 hook 覆盖范围,此分类不再使用

### UI 文件(可修白名单部分)

#### `src/components/common/HistoryList.tsx` — ⚠️ 混合
- `131:6` warning `react-hooks/exhaustive-deps`(loadRecords 缺依赖)— ❌ 严禁

#### `src/components/common/MarkdownRenderer.tsx` — ✅ 可修(1)
- `17:3` error `no-unused-vars`(`isStreaming` 未使用)— ✅ 允许

#### `src/components/common/SettingsModal.tsx` — ⚠️ 混合(7 可修 + 2 禁区)
- `6:38` error `no-unused-vars`(`Fragment` 未使用)— ✅
- `7:10` error `no-unused-vars`(`Dialog` 未使用)— ✅
- `7:18` error `no-unused-vars`(`Transition` 未使用)— ✅
- `8:52` error `no-unused-vars`(`Upload` 未使用)— ✅
- `10:24` error `no-unused-vars`(`exportSettings` 未使用)— ✅
- `10:40` error `no-unused-vars`(`importSettings` 未使用)— ✅
- `13:22` error `no-unused-vars`(`hasValidApiKey` 未使用)— ✅
- `233:39` error `no-explicit-any` — ❌
- `384:41` error `no-explicit-any` — ❌

#### `src/components/layout/Layout.tsx` — ⚠️ 混合
- `37:6` warning `react-hooks/exhaustive-deps`(initializeSettings 缺依赖)— ❌
- `63:6` warning `react-hooks/exhaustive-deps`(initializeMasters 缺依赖)— ❌

#### `src/components/layout/MainContent.tsx` — ✅ 可修(2)
- `18:7` error `no-unused-vars`(`QinShiPage` 未使用,因路由注释)— ✅
- `34:52` error `no-unused-vars`(`isCollapsed` prop 未使用)— ✅

#### `src/components/layout/Sidebar.tsx` — ⚠️ 混合(1 可修 + 1 禁区)
- `45:40` error `no-explicit-any`(preloadKey as any cast)— ❌
- `154:11` error `no-unused-vars`(`clearError` 解构未用)— ✅

#### `src/games/bazi/BaZiPage.tsx` — ✅ 可修(2)
- `171:7` error `no-unused-vars`(`branchYinYangMap` 未使用)— ✅
- `186:7` error `no-unused-vars`(`branchHiddenStemMap` 未使用)— ✅

#### `src/games/lifekline/LifeKlinePage.tsx` — ⚠️ 混合(4 可修 + 3 禁区)
- `2:18` error `no-unused-vars`(`AnimatePresence` 未使用)— ✅
- `3:22` error `no-unused-vars`(`User` 未使用)— ✅
- `3:28` error `no-unused-vars`(`Calendar` 未使用)— ✅
- `3:38` error `no-unused-vars`(`RefreshCcw` 未使用)— ✅
- `84:52` error `no-explicit-any` — ❌
- `84:68` error `no-explicit-any` — ❌
- `154:23` error `no-explicit-any` — ❌

#### `src/games/lifekline/components/KlineChart.tsx` — ⚠️ 混合(1 可修 + 2 禁区)
- `21:43` error `no-unused-vars`(`label` 未使用)— ✅
- `21:52` error `no-explicit-any` — ❌
- `53:34` error `no-explicit-any` — ❌

#### `src/games/liuyao/LiuYaoPage.tsx` — ✅ 可修(3)
- `5:28` error `no-unused-vars`(`HEXAGRAM_NAMES` 未使用)— ✅
- `161:9` error `no-unused-vars`(`generateTestHexagram` 未使用)— ✅
- `427:35` error `no-unused-vars`(catch 参数 `e` 未使用)— ✅

#### `src/games/qimen/QiMenPage.tsx` — ✅ 可修(3)
- `4:10` error `no-unused-vars`(`RefreshCw` 未使用)— ✅
- `4:21` error `no-unused-vars`(`Sparkles` 未使用)— ✅
- `8:3` error `no-unused-vars`(`getPalaceColor` 未使用)— ✅

#### `src/games/qinshi/QinShiPage.tsx` — ✅ 可修(4)
- `6:35` error `no-unused-vars`(`useEffect` 未使用)— ✅
- `7:18` error `no-unused-vars`(`AnimatePresence` 未使用)— ✅
- `11:30` error `no-unused-vars`(`convertImageToBase64` 未使用)— ✅
- `18:8` error `no-unused-vars`(`QinShiData` 未使用)— ✅

#### `src/games/zhougong/ZhouGongPage.tsx` — ✅ 可修(1)
- `281:35` error `no-unused-vars`(catch 参数 `e` 未使用)— ✅

#### `src/masters/MasterSelector.tsx` — ⚠️ 混合(1 可修 + 1 禁区)
- `29:3` error `no-unused-vars`(`className` prop 未使用)— ✅
- `64:6` warning `react-hooks/exhaustive-deps` — ❌

#### `src/pages/HomePage.tsx` — ✅ 可修(2)
- `183:35` error `no-unused-vars`(`index` 未使用)— ✅
- `259:54` error `no-unused-vars`(`index` 未使用)— ✅

#### `src/styles/modalStyles.ts` — ✅ 可修(1)
- `388:10` error `no-unused-vars`(`type` 未使用)— ✅

### 业务逻辑保护路径(任何修复都禁止 — 🚫)

#### `src/core/history.ts` — 🚫
- `212:9` error `prefer-const`(`allRecords` 未重赋值)— 即使白名单规则,**保护路径不动**

#### `src/core/settings.ts` — 🚫
- `27:44` error `no-explicit-any` — ❌

#### `src/core/storage.ts` — 🚫(5 处全部不动)
- `30:29` error `no-explicit-any` — ❌
- `54:14` error `no-unused-vars`(`parseError`)— 白名单但保护路径
- `76:29` error `no-explicit-any` — ❌
- `236:56` error `no-explicit-any` — ❌
- `272:38` error `no-explicit-any` — ❌

#### `src/core/store.ts` — 🚫(3 处全部不动)
- `47:16` error `no-explicit-any` — ❌
- `49:26` error `no-explicit-any` — ❌
- `156:30` error `no-explicit-any` — ❌

#### `src/core/types.ts` — 🚫
- `22:36` error `no-explicit-any` — ❌
- `135:29` error `no-explicit-any` — ❌

#### `src/games/bazi/cantianAdapter.ts` — 🚫
- `156:10` error `no-unused-vars`(`formatLunarDatetime`)— 白名单但保护路径

#### `src/games/bazi/chatMemory.ts` — 🚫
- `296:33` error `no-unused-vars`(`_master`)— 白名单但保护路径
- `296:50` error `no-unused-vars`(`_hasSpecialContext`)— 白名单但保护路径

#### `src/games/lifekline/logic.ts` — 🚫(8 处)
- `2:3` error `no-unused-vars`(`getFourPillarsGanZhi`)
- `4:3` error `no-unused-vars`(`TIANGAN`)
- `5:3` error `no-unused-vars`(`DIZHI`)
- `26:10` error `no-unused-vars`(`getGanZhiIndex`)
- `33:10` error `no-unused-vars`(`getGanZhiByIndex`)
- `187:58` error `no-unused-vars`(`gender`)
- `192:7` error `prefer-const`(`baseScore`)
- `225:11` error `no-unused-vars`(`volatility`)

#### `src/games/liuyao/logic.ts` — 🚫
- `216:9` error `no-unused-vars`(`yaoTypes`)
- `217:9` error `no-unused-vars`(`symbols`)

#### `src/games/qimen/logic.ts` — 🚫
- `136:9` error `no-unused-vars`(`day`)

#### `src/games/zhougong/logic.ts` — 🚫
- `195:61` error `no-unused-vars`(`keywords`)

#### `src/masters/service.ts` — 🚫(20 处全部不动,本工程最重业务文件)
- 10 处 `no-explicit-any`(行号 102:39 / 149:54 / 149:89 / 213:77 / 490:19 / 493:14 / 678:19 / 681:14 / 845:14 / 1239:14 / 1616:46 / 1629:17 — 实 12 处)
- 8 处 `no-unused-vars`(`gameType` / `parseError` / `enableStreaming` / `effectiveApiKey` / `error` / `apiKey` 等)
- 1 处 `prefer-const`(`lastSentLength` 414:7)
- 1 处 `no-unused-vars`(`lastSentLength` 414:7,与 prefer-const 同行)

#### `src/masters/types.ts` — 🚫
- `46:9` error `no-explicit-any`

#### `src/types/index.ts` — 🚫(4 处全部不动)
- `31:9` / `69:23` / `71:24` / `99:34` errors `no-explicit-any`

#### `src/utils/animations.ts` — 🚫
- `85:6` warning `react-hooks/exhaustive-deps`

### 业务保护(原 🔒,现 🚫 — hook 已覆盖)

> 2026-05-04 step F 前夕 hook regex 加固后,以下文件已被 `.git/hooks/pre-commit` 拦截。处理方式与 🚫 一致:**任何 lint 修复都不允许**。

#### `src/games/bazi/advancedAnalysis.ts` — 🚫(原 🔒,已 hook 覆盖)
- `7:3` error `no-unused-vars`(`formatYongShenV2Scores`)
- `304:10` error `no-unused-vars`(`formatSpecialYearSection`)
- `326:10` error `no-unused-vars`(`formatLiuQinSection`)
- `347:10` error `no-unused-vars`(`formatHighRiskSection`)

#### `src/games/types.ts` — 🚫(原 🔒,已 hook 覆盖)
- `18:8` error `no-namespace` — ❌
- `73:8` error `no-namespace` — ❌
- `152:8` error `no-namespace` — ❌

---

## 改造期间允许的"顺手修"子集(白名单)

统计:
- `no-unused-vars`(unused imports + locals):**59** 处
- `prefer-const`:**3** 处
- 子集合计:**62** 处

但**业务逻辑保护路径下不动**(🚫 标记的文件,step F 前夕 hook 加固后,原 🔒 也并入 🚫):
- 🚫 hook 路径下白名单错误:`history.ts:212` (prefer-const) + `storage.ts:54` + `cantianAdapter.ts:156` + `chatMemory.ts:296×2` + `lifekline/logic.ts` 7 处 + `liuyao/logic.ts` 2 处 + `qimen/logic.ts` 1 处 + `zhougong/logic.ts` 1 处 + `service.ts` ~10 处 + `advancedAnalysis.ts` 4 处(原 🔒)= **~30 处**

**实际改造期可在 batch 1-5 顺手修的:62 - 26 - 4 = ~32 处**(分布在 13 个 UI 文件中)

预期改造结束后,白名单子集应清零(降到 0 或仅剩个别遗漏)。

## 改造期间严禁触碰的子集

统计:
- `no-explicit-any`:**35** 处
- `react-hooks/exhaustive-deps`:**5** 处
- `no-namespace`:**3** 处
- 子集合计:**43** 处

改造结束后此子集仍存在,留给"lint cleanup"独立立项。其中:
- `no-explicit-any` 集中在 `masters/service.ts`(~12 处)+ `core/storage.ts`(4)+ `core/store.ts`(3)+ `core/types.ts`(2)+ `core/settings.ts`(1)+ `types/index.ts`(4)+ `masters/types.ts`(1)+ `lifekline/LifeKlinePage.tsx`(3)+ `KlineChart.tsx`(2)+ `Sidebar.tsx`(1)+ `SettingsModal.tsx`(2),全是历史 type 妥协
- `react-hooks/exhaustive-deps` 都是历史 useEffect 缺依赖,改了可能改 hook 触发节奏
- `no-namespace` 是 `games/types.ts` 用 `namespace` 而非 ES2015 module — 改要重写整个 export 结构

---

## Vite warnings(8 条,详见 `docs/cleanup-backlog.md`)

合计 **8 处**"动态+静态混合导入"警告,所有 game `*Page.tsx` + `core/history.ts` 都受影响,导致 `lazy()` 失效、index chunk 膨胀到 1170 KB。

修复需重构 `games/index.ts`(业务逻辑禁区,本批不动),登记给独立 perf 立项。
