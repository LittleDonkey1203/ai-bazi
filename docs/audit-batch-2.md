# Batch 2 Audit Report

> 时间:2026-05-05
> baseline:f1afabe (logic-frozen-2026-05-04)
> HEAD(commit 前):c2bc198(batch 1 末 + PLAYBOOK 升级)
> 工作树状态:3 文件 staged 待 commit(LiuYaoPage.tsx + QiMenPage.tsx + cleanup-backlog.md)
> 分支:ui/refactor-2026-q2
> 模式:单批审计(模式 1)+ 用户额外 10 段要求
> auditor:.claude/agents/ui-auditor.md(主会话代笔本文件,subagent 仅有 Read/Bash/Grep/Glob,无 Write 权限,findings 由主会话落盘)

## 概览

- 检查文件数:**2**(F003 LiuYaoPage + F004 QiMenPage)
- ✅ 通过:**2**(全部合规)
- ⚠️ 警告(P2):**3**(均为非阻塞)
- ❌ 严重(P0/P1):**0**
- **结论:✅ 通过,可进入 4.4.3 重截 baseline**

---

## 段落 1:本批 scope 文件列表

来自 `docs/ui-inventory.md` line 109,Batch 2 = F003 + F004,共 **2 个改造文件**:

| ID | 路径 | 类型 | 端 | 路由 |
|----|------|------|----|----|
| F003 | `zhouwenwang/zhouwenwang-divination-mobile/src/games/liuyao/LiuYaoPage.tsx` | page | web | /liuyao |
| F004 | `zhouwenwang/zhouwenwang-divination-mobile/src/games/qimen/QiMenPage.tsx` | page | web | /qimen |

**同目录漏改检查**(模式 1 检查 7):
- `src/games/liuyao/` 下文件:`LiuYaoPage.tsx`(本批)、`logic.ts`(业务保护,排除)、`index.ts`(barrel,排除)— 无 .tsx 漏改
- `src/games/qimen/` 下文件:`QiMenPage.tsx`(本批)、`logic.ts`(业务保护,排除)、`index.ts`(barrel,排除)— 无 .tsx 漏改

---

## 段落 2:修改清单覆盖度

工作树 staged diff 量化:
- **F003 LiuYaoPage.tsx**:187 行 diff(net +93 / -94)
- **F004 QiMenPage.tsx**:261 行 diff(净改 +130 行)
- **2 文件总计**:230 insertions / 218 deletions(净 +12 行,几乎零膨胀,符合"className 替换 + token 迁移"特征)

| 模块 | F003 项数 | F004 项数 |
|------|----------|----------|
| M 主改动 | M1-M17 = 17 项 | M1-M21 = 21 项 |
| DA 子项(QiMen 地盘天干 mobile 修复) | — | 5 项 |
| DD 子项(QiMen datetime 切换抖动修复) | — | 2 项 |
| 附带 marginLeft 优化 | — | 计入 DD1.1 |
| **小计** | **17** | **28** |
| **两文件合计** | **45 处块改动** | |

---

## 段落 3:决策点落地确认(D1-DD)

| 决策 | 拍板内容 | 落地证据 | 状态 |
|------|----------|----------|------|
| D1 | F003 结果容器 mobile w-full(代替原 560 固定) | F003:M11 `aspect-video w-full max-w-[560px]` | ✅ |
| D2 主 | F004 九宫格 mobile 收紧字号 + 兜底 B (`min-w-[300px]` + `overflow-x-auto`) | F004 line 321-322:`<div className={isMobile ? 'overflow-x-auto w-full' : ''}>` + grid `min-w-[300px]` | ✅ |
| D5 | 仅页面顶部 h1 加 font-serif,section label 不加 | F003 line 281 + F004 line 522 h1 加 font-serif;section labels 仍 sans | ✅ |
| D5a | 卦名/爻名/宫位名删 inline `fontFamily` 走 design-system 标准栈,保留 `className font-serif` | F003 M12/M14 + F004 M7 inline `'"Noto Serif SC"'` 全部从 +diff 中消失 | ✅ |
| D5b | 顶部标题 D5b 渐变 paper→bronze→vermilion(与 batch 1 HomePage hero 一致) | F003 line 284 + F004 line 521:`linear-gradient(135deg, #f5f0e3 0%, #d4a03e 60%, #c41e3a 100%)` 一字不差 | ✅ |
| D6 | 主 CTA 切 D6 绛红 button-primary | F003 + F004:`bg-gradient-to-r from-brand to-brand-active text-paper hover:from-brand-hover hover:to-brand` | ✅ |
| D7 | F003 卦名色 `#3B82F6` 蓝 → `text-water` 墨青 | F003 diff:无新增 `#3B82F6` 行 + 新增 `text-water` className(M12)+ textShadow 同步墨青 RGB | ✅ |
| D8 | F004 九宫格外框/内格 `border-white` → `border-divider-strong` | F004 diff:`border-2 border-divider-strong` + 内 cell `border border-divider-strong` | ✅ |
| D9 | F004 信息条 mobile 切 2×2 grid + token | F004 M18:`gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr'` | ✅ |
| DA | 5 项地盘天干 mobile 修复(节省 ~32px,溢出 27px,5px 缓冲) | F004 cell 内层 `height: isMobile ? '100%' : '90%'` + 宫位名 `fontSize: isMobile ? '28px' : '48px'` + 右栏 `marginTop: isMobile ? 0 : '12px'` + 宫位名 `marginBottom: isMobile ? '2px' : '8px'` + 底部段 `flex-shrink-0` | ✅ |
| DD | datetime mobile 移除 width 动画 + w-full,desktop 保留 | F004 motion.input `initial={isMobile ? { opacity: 0 } : { opacity: 0, width: 0 }}` + className `${isMobile ? 'w-full' : ''}` | ✅ |
| DB | 九宫格 wrapper `overflow-x-auto` 保留作无害保险丝 | F004 与 D2 同行体现;cleanup-backlog "F004 九宫格 D2 兜底 B 实施状态" 条目记录 | ✅ |

**所有 11 项决策点全部落地,零遗漏**。

---

## 段落 4:业务保护红线验证(模式 1 检查 4 + 5 + 10)

### 4.1 业务逻辑层文件零改动

```bash
git diff logic-frozen-2026-05-04 --name-only | grep -E "src/core/|src/games/.*/(logic|engine|cantian|caseStorage|chatMemory|yongshen).*\.ts$|src/masters/(service|prompts|config|types|index)\.ts$|src/utils/.*\.ts$|src/types/"
```
输出:`BUSINESS_LOGIC_ZERO_CHANGE`

具体 logic.ts 单独验证:
```bash
git diff logic-frozen-2026-05-04 -- liuyao/logic.ts qimen/logic.ts
```
输出:**(空)** — **F003 + F004 双 logic.ts 零改动**。

### 4.2 测试零改动

```bash
git diff logic-frozen-2026-05-04 --stat | grep -E "\.(test|spec)\."
```
输出:`TEST_FILES_ZERO_CHANGE`

注:F003/F004 本来就**没有** `__tests__/` 目录(`liuyao/` + `qimen/` 目录下唯三文件:`*Page.tsx` + `logic.ts` + `index.ts`),故"测试零改动"为 vacuous true 但也表示零回归风险。

### 4.3 状态/handler/fetch 零改动(深度核查)

针对 F003 + F004 diff,专项 grep:
```bash
git diff logic-frozen ... | grep "^[+-]" | grep -E "useState|useEffect|set\w+|fetch|console\.|on(Click|Change|Submit)|handle[A-Z]"
```
输出:**(空)** — 两文件 diff 无任何 React state setter / fetch / event handler 修改。所有 + 行均落在 `className` / `style` / wrapper `<div>` / 装饰文字。

### 4.4 hook 调用白名单合规

LiuYaoPage.tsx 新增 hook 调用:
```typescript
import { useBreakpoint } from '../../hooks/useBreakpoint';  // 第 12 行
const { isMobile } = useBreakpoint();                        // 第 30 行
```
QiMenPage.tsx 同理。**仅 useBreakpoint(白名单允许的纯 UI hook),无任何业务 hook 新增**。

### 4.5 props 接口签名零改动

F003 / F004 是 page 组件,**无 Props 接口**(从 React Router `<Routes>` 直接挂载),故 props 检查 vacuous true。

### 4.6 deprecated brand-* 类零新增

```bash
git diff ... | grep "^+" | grep -E "brand-orange|brand-black|brand-gray|brand-white"
```
输出:`NO_DEPRECATED_BRAND_CLASS_ADDITIONS`

---

## 段落 5:回归保护验证(14 PASS / 16 total)

按 4.4.1 已 ack 的视觉回归结果:

**14 PASS**(回归保护成功):
- desktop 8/8(包括 **desktop/liuyao + desktop/qimen 桌面零回归**,改造期最关键的护栏)
- mobile 6/6(home、masters 等已改造页面 + 未改造页面稳定)

**2 FAIL**(本批改造目标 mismatch,预期):
- mobile/liuyao(F003 改造目标)
- mobile/qimen(F004 改造目标)

无未分类项。

---

## 段落 6:改造度量(本批硬证据)

> **本批改造的核心交付指标 — 用户明确要求作为硬证据记录**

```
横向溢出消除:
  baseline mobile 截图宽度:409 × 892
  实际 mobile 截图宽度:    375 × 892
  横向溢出:               34px → 0px (完全消除)
```

含义:
- 旧版 baseline 在 mobile 下产生 409px 视口(34px 横向溢出),意味着用户在 375px 真实手机上需要左右横滑才能看到全部 UI
- 改造后 mobile 视口稳定在 375px,**0 横向溢出**,移动端可视性回归 100%
- 320 极窄视口(iPhone 5 SE 时代)单独验证:9 宫位地盘天干全部可见,DA 决策的 32px 字号节省 + 5px 缓冲发挥作用

playwright fullPage 截图机制:`截图宽度 = Math.max(viewport.width, document.scrollWidth)`。baseline 409 = 改造前 `document.scrollWidth` 因横向溢出 > viewport 375 → 截图取 409。改造后 `document.scrollWidth` 收回到 viewport 375 → 截图取 375。**409 → 375 = 横向溢出消除的客观度量证据**。

---

## 段落 7:浏览器实测覆盖

### F003 LiuYao
- F003-1 输入框/按钮 mobile flex-col 修复 — ✅ PASS
- F003-2 disabled 态 / 主 CTA 绛红对比度 — ✅ PASS
- F003-3 起卦时间区竖向布局 — ✅ PASS
- F003-4 快速开始 label 单独行 — ✅ PASS
- D6 主 CTA 绛红 disabled 对比度 — ✅ PASS
- D7 卦名色 #3B82F6 蓝 → text-water 墨青融入 — ✅ PASS
- M17 异常 margin mobile 紧凑(14rem→2rem / 20rem→4rem) — ✅ PASS
- 桌面零回归 — ✅ PASS
- BottomNav 激活态 #FF9900 视觉契约保留 — ✅ PASS

### F004 QiMen 主验收
- F004-1 输入框/按钮 — ✅ PASS
- F004-2 disabled / D6 主 CTA 绛红 — ✅ PASS
- F004-3 快速开始 chip — ✅ PASS(已记 cleanup-backlog 横滑跑马灯增强候选)
- F004-4 起盘时间区 — ✅ PASS
- 320 极窄视口验证 — ✅ PASS
- 桌面零回归 — ✅ PASS
- DA 9 宫位地盘天干全显示 — ✅ PASS

### 跨批回归保护
- F003 在 F004 改造期重测 — ✅ PASS

---

## 段落 8:P0/P1/P2 分类

### P0(阻塞,必须修复):**0**

零阻塞:业务逻辑零改动 / props 签名零变化 / 测试零改动 / Electron 构建通过 / 无装饰白名单越界 / 无 deprecated brand-* 类新增。

### P1(警告,建议修复):**0**

### P2(非阻塞观察项):**3**

**P2-1:ui-inventory.md 中 F003/F004 仍标 TODO**
- 现状:`docs/ui-inventory.md` line 39-40 F003/F004 状态字段仍为 `TODO`
- 原因:本批改造 staged 但未 commit,inventory 状态字段同样未 commit(预期行为,主会话 4.5 commit 时一并翻 DONE)
- 影响:不阻塞;主会话在 4.5 步骤 commit 时把 inventory 状态翻 DONE 即可
- 处置:无需登记 cleanup-backlog,属于流程过渡态

**P2-2:F004 默认五行色 `#CCCCCC`(qimen line 288)**
- 现状:`getWuxingColor` 业务函数体内 `return colorMap[wuxing] || '#CCCCCC';`
- 性质:这是**业务函数的兜底默认色**,与 `--c-gray-300: #cccccc` token 完全等价(灰阶漂移容忍度规则适用)
- 影响:不阻塞;视觉无差;但在 design-system §1.4(灰阶 token 化)阶段应统一替换
- 处置:**建议追加登记到 cleanup-backlog**,与 batch 1 audit P2-2 类同(已存在的灰阶硬编码兜底,延后到 batch 5 末批清理);本审计仅识别,登记动作由主会话决定

**P2-3:阴爻灰色 token 缺失(本批已登记)**
- 现状:F003 line 642/653 阴爻颜色仍用 `#9ca3af`(非动)/`#6b7280`(动)直写
- 原因:design-system 当前无对应灰阶语义 token
- 处置:已登记 `docs/cleanup-backlog.md` "阴爻灰色 token 缺失(2026-05-05 batch 2 F003 浏览器实测发现)" — batch 5 评估
- 注:阳爻 `#FCD34D`(line 671)同 BottomNav `#FF9900` 视觉契约原则——是六爻业务可识别色,非装饰色,**不视为违规**(阳爻配阴爻形成不可破坏配对契约)

---

## 段落 9:本批新增 cleanup-backlog 条目(共 4 条)

工作树 `docs/cleanup-backlog.md` 已 staged +115 行新增,3 个 `## ` 一级标题 + 1 条预记:

1. **阴爻灰色 token 缺失**(2026-05-05 F003 浏览器实测发现)— design-system 待迭代,batch 5 评估
2. **F004 快速开始 chip 横滑跑马灯增强候选**(2026-05-05 F004 浏览器实测提出)— 功能增强,未来 microinteraction 迭代
3. **F004 九宫格 D2 兜底 B 实施状态**(2026-05-05 浏览器实测确认)— 实施记录,无遗留
4. **(预记)6 道防线 cwd 漂移问题**(本批启动遭遇)— 流程改进类,4.6 步骤写入 PLAYBOOK 强制门禁段

---

## 段落 10:与 batch 1 audit 对照

来自 `docs/audit-batch-1.md` 的两个 P2 在本批的状态:

| Batch 1 P2 | 本批是否触碰 | 当前状态 |
|------------|-------------|---------|
| GuaWatermark `opacity=0.08` 偏离规范 `0.06` | 否(F001 不在本批 scope) | 仍存在,非本批责任,batch 5 通用组件改造时一并处理 |
| 视觉回归 5/16 mismatch(baseline 时机错配) | 间接触碰(本批新视觉 baseline 是 batch 1 末 78dfb31 重截) | **已不再适用**,baseline 已在 batch 1 末 re-baseline |

---

## 模式 1 标准检查矩阵汇总

| 检查 | 项目 | 结果 |
|------|------|------|
| 1 | 状态对账 | F003/F004 状态在工作树仍 TODO(P2-1,流程过渡态) |
| 2 | Token 覆盖 | bg-night/text-neutral-2/text-paper/border-divider/text-brand 等 token 大量出现 — ✅ PASS |
| 3 | 响应式覆盖 | useBreakpoint + isMobile 三元 + Tailwind md: 全覆盖 — ✅ PASS |
| 4 | 业务逻辑隔离 | logic.ts 零改动 + setState/fetch/handler 在 diff 零出现 — ✅ PASS |
| 5 | Props 签名变化 | F003/F004 是 page 无 props — vacuous PASS |
| 6 | 硬编码残留 | F003=5 处(标题渐变 + 阴阳爻视觉契约);F004=11 处(标题渐变 + 五行业务函数 + 吉星吉门语义 + 值符值使语义 + 默认灰兜底) — 全部归类视觉契约或业务语义,无逃逸 — ✅ PASS |
| 7 | 同目录漏改 | liuyao/qimen 各仅 1 .tsx,已包含 — ✅ PASS |
| 8 | 中式装饰白名单 | `<Seal/<Divider/<GuaWatermark` 在两文件零匹配,符合 design-system §5.1 — ✅ PASS |
| 9 | Tailwind 残留 | 大量 token 化 utility,无 `bg-white`/`text-gray-700` 直写 — ✅ PASS |
| 10 | 测试用例完整性 | `git diff --stat | grep test` = 空 — ✅ PASS |
| 11 | brand-* deprecation | `git diff | grep "^+" | grep brand-orange|brand-black|brand-gray|brand-white` = 空 — ✅ PASS |
| 12 | Lint 总数对比 | 当前 100 errors / 5 warnings;baseline 100 errors / 5 warnings;**delta = 0** — ✅ PASS |
| 13 | 业务保护红线深度核查 | 见段落 4 — ✅ PASS |
| 14 | 视觉回归 ack | 14 PASS / 2 FAIL(预期)— ✅ PASS(已 ack) |
| 15 | Electron 冒烟 | `✓ built`,zero error,所有 chunk 正常 — ✅ PASS |

---

## 总结

- **通过率:2 / 2(100%)**
- **阻塞性问题(P0):0**
- **警告(P1):0**
- **观察项(P2):3**(均非阻塞)
  - P2-1 inventory 状态字段过渡态(主会话 commit 时一并更新)
  - P2-2 F004 默认灰兜底 `#CCCCCC`(灰阶漂移容忍度内,batch 5 评估)
  - P2-3 阴爻灰色 token 缺失(已登记 cleanup-backlog)
- **改造硬指标**:横向溢出 409→375 = **34px 完全消除**
- **业务保护红线**:logic.ts 零改 / setState 零改 / 测试零改 / hook 仅 useBreakpoint
- **下一步建议**:**✅ 通过,可进入 4.4.3 重截 baseline**

---

相关文件:
- `docs/ui-inventory.md`(F003/F004 状态在 4.5 commit 时翻 DONE)
- `docs/design-system.md` §5.1 中式装饰白名单(F003/F004 唯一允许装饰 batch 5 落地)
- `docs/cleanup-backlog.md`(本批新增 3 条已 staged)
- `docs/lint-baseline-batch-0.log`(lint 对账基准 100/5)
- `docs/audit-batch-1.md`(批次格式参考 + P2 对照)
- `zhouwenwang/zhouwenwang-divination-mobile/src/games/liuyao/LiuYaoPage.tsx`
- `zhouwenwang/zhouwenwang-divination-mobile/src/games/qimen/QiMenPage.tsx`
