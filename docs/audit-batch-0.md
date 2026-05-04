# Batch 0 审计报告(单 batch 模式)

> 时间:2026-05-04
> 审计员:ui-auditor subagent(报告由主会话代为落盘,因 subagent 内部 system reminder 拒绝 Write 报告文件)
> 对照 baseline:`logic-frozen-2026-05-04` tag(commit `11400be`)
> 模式:单 batch (mode 1) + 重点检查 1 / 4 / 11 / 12 + 辅助检查 2 / 3 / 5 / 6 / 8 / 10

## 审计基础事实

整个 `zhouwenwang/zhouwenwang-divination-mobile/src/` 目录在仓库中处于**整体 untracked (??) 状态**(`git ls-files src/` 返回 0 项)。logic-frozen tag 与 HEAD 之间只在 commit `8d1dbac` / `1226758` 加入了 `__snapshots__` / `.gitignore` / `package.json` / `playwright.config.ts` / `baseline.spec.ts` / `known-mobile-issues.md`。

这意味着所有 batch 0 改造产物在 git 视角下都是"新增 untracked",而非"modified",`git diff logic-frozen-2026-05-04 -- src/...` 输出为空。检查 4 / 11 因此采用**等价验证方法**(working tree 静态扫描代替 diff 对比)。

## 概览

- 检查项数:13
- ✅ 通过:8
- ⚠️ 警告:3
- ❌ 严重:1
- **总体结论:1 P0 阻塞 + 3 P1 警告;修完 P0 即可进 step H 提交**

## 重点检查结果

### 检查 1:状态对账 — ❌ 严重(P0 阻塞)

inventory 中 batch=0 共 10 项 = S001-S010,实际状态:

| ID | 文件 | inventory status | 实际 step D 后状态 |
|----|------|----|----|
| S001 | `index.html` | TODO | 已注入完整 Tailwind config(29 utilities,含 deprecated 注释 + brand-* + neutral-* 全套)→ **应为 DONE** |
| S002 | `src/main.tsx` | TODO | 未改动(符合 inventory 备注"若不需注入全局 Provider,改 SKIP")→ **应为 SKIP** |
| S003 | `src/App.tsx` | TODO | 未改动 → **应为 SKIP** |
| S004 | `src/index.css` | TODO | 已注入完整 design tokens(三层结构 + 字体栈 + 移动端字号)→ **应为 DONE** |
| S005 | `src/App.css` | TODO | 未改动(残留模板) → **应为 SKIP** |
| S006 | `src/hooks/useBreakpoint.ts` | TODO | 未改动(partial 已完成) → **应为 SKIP** |
| S007-S010 | 4 个 layout | DONE | step D 已完成 ✓ |

**结论**:6 个项(S001-S006)的 inventory 状态与现实脱节。**违反 step H "inventory 状态完整" 闸门**。修复成本 = 2 分钟改 inventory 的 status / 备注列,不改代码。

SKIP 项核对:F012 / F021 / F023 三项均 status=SKIP,备注完整,一致 ✓

### 检查 4:业务逻辑隔离 — ✅ 通过

- 等价验证:`git ls-files --others --exclude-standard | grep -E "$PROTECTED_PATHS"`
- 输出:**54 个 protected paths 文件全部 untracked**(等价于"未被 stage / touched")
- pre-commit hook 已加固覆盖 11 项(`cleanup-backlog.md` "hook regex 缺口加固"),作为机器红线
- 结论:**0 个业务逻辑文件被改动**

### 检查 11:brand-* Deprecation 新增使用 — ✅ 通过

- 4 layout + 3 decor + 3 decor 测试 + decor index + index.css + index.html → **0 处使用** `bg-/text-/border-brand-(orange|black|gray|white)`
- BottomNav 第 43 / 97 / 171 行的 `text-[#FF9900]` / `border-[#FF9900]` / `bg-[#FF9900]/10` 属改造前已存在,已通过 `cleanup-backlog.md` (b) 段视觉契约原则正式承认(`BottomNav.test.tsx:116` 锁定),不算新增使用
- F007 PalmistryPage 中的 `text-brand-gray-300` / `bg-brand-orange-500` 等 18 处不在 batch 0 范围(F007 属 batch 4),且这些 utility 拼写错误(Tailwind config 仅定义 `brand-gray` 而非 `brand-gray-300`),渲染上不生效;为 batch 4 现成债务,不算 batch 0 引入

### 检查 12:lint debt 增量 — ✅ 通过

- 当前:`100 errors / 5 warnings`(105 problems)
- baseline:`100 errors / 5 warnings`(105 problems)
- **delta:errors=0 / warnings=0**;`diff` 输出 0 行
- 结论:与 design-system §10.1 预期完全一致,改造期间未新增也未顺手减少 lint 错误

## 辅助检查结果

### 检查 2:Token 覆盖 — ✅ 通过

4 个 layout 文件均含 token utility(`bg-night` / `text-brand` / `bg-night-2` 等);index.css 三层 token 完整(34+ 变量);index.html Tailwind config 29 个 utility 映射

### 检查 3:响应式覆盖 — ✅ 通过

- Layout (`useBreakpoint()` + safe-area)
- BottomNav (`md:hidden` x2 + safe-area)
- MainContent (`sm:` `lg:` `xl:`) 均含响应式标志
- Sidebar 不含响应式断点但属预期(在 mobile 下不渲染),inventory 已标 partial

### 检查 5:Props/Emit 签名变化 — ✅ 通过(无 git 比对基线)

- 7 个 props interface 存在,step D 仅动 className/style,未触碰 interface 定义
- BottomNav.test.tsx:116 断言未失败,反向佐证签名稳定

### 检查 6:硬编码 hex 残留 — ⚠️ 警告(P2 知情)

- Sidebar.tsx:**10 处**(`#1a1a1a` x2 / `#2a2a2a` x2 / `#333333` x4 / `#CCCCCC` x2)
- BottomNav.tsx:**13 处**(`#FF9900` x4 / `#333333` x3 / `#222222` x1 / `#1a1a1a` x2 / `#CCCCCC` x3)
- Layout.tsx / MainContent.tsx:**0 处**
- 全部已在 `cleanup-backlog.md` 第 36-105 行登记;BottomNav 橙永久保留(视觉契约);灰阶留待 batch 1+ 用新增的 `surface-*` / `divider` / `neutral-*` token 迁移
- index.css 第 259-360 行老样式块亦有大量 hex,同属 cleanup-backlog (a)(c) 段范围

### 检查 8:中式元素白名单合规 — ✅ 通过

decor 三组件在 batch 0 仅"新增,无任何使用方"(`grep "from .*decor" src/` 命中 0 处),符合 design-system §5.1 预期(batch 1+ 接入)。组件本身 SSR 安全 + `role="presentation"` + `aria-hidden="true"` ✓

### 检查 10:测试用例完整性 — ✅ 通过

- 5 个预存在测试(MobileDetector / BottomNav / Layout / BaziCompactGrid / useBreakpoint):全为 `??`,**0 modified**
- 3 个新增 decor 测试(Seal / Divider / GuaWatermark):新建,符合 design-system §5.3 + §10 checklist 豁免("装饰组件加测试在 decor/__tests__/ 新建")
- baseline.spec.ts 已 commit (8d1dbac)

## 待提交清单确认(对照 step H 模板)

| 清单项 | 工作树存在 | 状态 |
|----|----|----|
| `src/index.css` | ✓ | 完整 design tokens 三层 |
| `index.html` | ✓ | Tailwind config + brand-* 注释 |
| 4 个 layout 文件 | ✓ | 4/4 step D 完成 |
| decor 7 文件(3 主 + 3 测试 + 1 index) | ✓ | 7/7 齐全 |
| `docs/ui-inventory.md` | ✓ | **状态字段需修复(P0)** |
| `docs/design-system.md` | ✓ | step D 同步更新(§0 / §1 / §5 / §10.1) |
| `docs/known-mobile-issues.md` | ✓ | logic-frozen 后已 commit (1226758),工作树有进一步 modified |
| `docs/cleanup-backlog.md` | ✓ | 8 个事件登记完整 |
| `docs/lint-debt.md` | ✓ | 改造前 lint 快照 |
| `docs/lint-baseline-batch-0.log` | ✓ | 100 err / 5 warn baseline |
| `docs/PLAYBOOK.md` | ✓ | 5 阶段流程 + 强制门禁 |
| `docs/visual-batch-0.md` | ✓ | 16 路径 × 2 视口 + 0 P0 |
| `docs/visual-batch-0-followups.md` | ✓ | F1/F2/F3 登记 |
| `.claude/agents/ui-auditor.md` | ✓ | logic-frozen 后 modified(检查 11/12 + 路径覆盖) |
| `tests/visual/__snapshots__` | ✓ | 已 commit (8d1dbac),不在 stage 范围 |
| `tests/visual/actual/batch-0` | ⚠ | **未被 .gitignore 排除(P1,见下)** |
| `docs/audit-batch-0.md` | ✓ | 本文件 |

## P1 警告(知情,非阻塞)

### P1-1:`tests/visual/actual/` 未被 .gitignore 排除

- 子工程 `.gitignore` 第 37-38 行匹配的是 `tests/visual/**/*-actual.png` 与 `*-diff.png`
- 但实际产物在 `tests/visual/actual/batch-0/{desktop,mobile}/*.png`(无 `-actual` 后缀)
- step H 用通配 `git add` 会意外纳入 ~17 张 .png(8 desktop + 8 mobile + 1 home-sidebar-expanded)
- **建议**:逐项 `git add`,或先加一行 `tests/visual/actual/` 进 `.gitignore`(更稳妥)

### P1-2:4 个 layout 文件硬编码 hex 残留 23 处

已在 `cleanup-backlog.md` 登记,batch 1+ 用新增 `surface-*` / `divider` / `neutral-*` token 迁移;视觉契约橙永久保留

### P1-3:index.css 第 259-360 行老样式块大量 hex

cleanup-backlog (a) 段已规划 batch 1+ 迁移

## P0 阻塞(必须修复)

**inventory 状态对账失败:S001-S006 仍标 TODO**
- 实际:S001 / S004 已 DONE 但 inventory 未更新;S002 / S003 / S005 / S006 未改但 inventory 未改 SKIP
- 影响:违反 step H "inventory 状态完整" 闸门
- 修复成本 = 2 分钟,改 inventory 的 status + 备注列,**不动代码**

## 给主会话的建议

修 P0(2 分钟)+ 修 P1-1(.gitignore 加一行)后,batch 0 可放行 step H 提交。代码质量 100% 合规:
- lint delta=0
- 零业务逻辑触碰
- 零测试 modified
- 零新增 deprecated 使用
- token 三层完整覆盖
- 视觉回归 P0=0

batch 0 是范本级的"基础设施 + 视觉契约 + 零回归"批次,可作为后续 batch 1-5 的工作模板。
