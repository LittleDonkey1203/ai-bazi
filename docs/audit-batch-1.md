# Batch 1 Audit Report

> 时间:2026-05-05
> baseline:f1afabe (logic-frozen-2026-05-04)
> HEAD:5ef938b
> 分支:ui/refactor-2026-q2
> 模式:单批审计 (模式 1)
> auditor:.claude/agents/ui-auditor.md(主会话代笔本文件)

## 检查 1:状态对账

`grep -E "^\| F00[12] \|^\| F013 " docs/ui-inventory.md` 输出三行,均为 `DONE`:

- F001 `src/pages/HomePage.tsx` → **DONE**(备注:Hero/CTA/卡片/Grid/底部 全部接 token + 装饰)
- F002 `src/components/MasterSelectorDemo.tsx` → **DONE**(备注:token 迁移 + 标题宋体 + 调试面板 DEV 包裹)
- F013 `src/masters/MasterSelector.tsx` → **DONE**(备注:token 迁移 + 印章选中态 + 大师名宋体)

结论:✅ 三项均为 DONE,batch=1 无 TODO 残留。

## 检查 4:业务逻辑隔离

```bash
git diff logic-frozen-2026-05-04 --name-only | grep -E "src/core/|src/games/.*/(logic|engine|cantian|caseStorage|chatMemory|yongshen).*\.ts$|src/masters/(service|prompts|config|types|index)\.ts$|src/utils/.*\.ts$|src/types/" || echo "BUSINESS_LOGIC_ZERO_CHANGE"
```

输出:`BUSINESS_LOGIC_ZERO_CHANGE`

结论:✅ batch 1 自 logic-frozen-2026-05-04 起,业务逻辑层零改动。Hook regex 注意点(public/masters/config.json + scripts/yongshen-v2-*)按已登记 cleanup-backlog 处理,本批未触碰。

## 检查 8:中式装饰白名单合规

逐文件比对 design-system.md §5.1 白名单:

| 文件 | 用法 | 白名单条目 | 合规 |
|------|------|------------|------|
| F001 HomePage.tsx:14 | `import { Seal, Divider, GuaWatermark }` | §5.1 row "HomePage hero" + "占卜功能卡片" + "MasterSelector 大师卡" | ✅ |
| F001 HomePage.tsx hero 后 | `<Divider />` 用于 Hero 区下方分隔 | §5.1 "HomePage hero / 毛笔分隔线" | ✅ 完全匹配 |
| F001 HomePage.tsx 游戏卡片 | `<GuaWatermark symbol={guaSymbol} size="32px" opacity={0.08} />` 在游戏卡片角落 | §5.1 "占卜功能卡片(首页 grid)/ 角落卦象水印 opacity:0.06" | ⚠️ 位置匹配,但 `opacity=0.08` 比规范 `0.06` 稍高(P2,非阻塞) |
| F001 HomePage.tsx 大师卡 | `<Seal char={master.name[0]} active size="sm" />` 用于首页大师介绍区 | §5.1 "MasterSelector 大师卡 / 印章" | ✅(印章在大师识别位,语义一致) |
| F013 MasterSelector.tsx:11/186 | `<Seal char={master.name[0]} active size="sm" />` 选中态 | §5.1 "MasterSelector 大师卡" | ✅ 完全匹配 |
| F002 MasterSelectorDemo.tsx | 仅 token 迁移 + 标题宋体,未直接引装饰组件 | — | ✅ 无越界 |

结论:6 处装饰用法,5 处完全匹配,1 处 opacity 偏离 0.02(P2)。**未发现功能性区域(button/icon/input/表头/label)出现装饰元素**,§5.2 严禁清单零违反。

## 检查 11:deprecated 类零新增

```bash
git diff f1afabe HEAD -- '*.tsx' | grep "^+" | grep -E "brand-orange|brand-black|brand-gray|brand-white"
```

输出:**(空)**

结论:✅ batch 1 改动的 3 个 .tsx 文件中,deprecated `brand-*` utility class 零新增。

## 检查 12:lint debt 增量

当前 lint 输出尾部:`✖ 105 problems (100 errors, 5 warnings)`
baseline `docs/lint-baseline-batch-0.log` 尾部:`✖ 105 problems (100 errors, 5 warnings)`

逐项细看:HomePage.tsx 仍是 `183:35` + `259:54` 两处 `'index' is defined but never used`(均存在于 baseline);MasterSelector.tsx 仍是 `29:3 className unused` + `64:6 useEffect deps`(均存在于 baseline)。MasterSelectorDemo.tsx 未出现新条目。

结论:✅ 增量为 0。lint debt 与 batch 0 baseline 完全一致(100/5)。

## 检查 14:视觉回归状态

5/16 mismatch 细分:

- **3 处真改动**(batch 1 视觉重构,预期 mismatch):
  1. home (desktop) — F001 Hero/Grid 装饰 + token 迁移
  2. home (mobile) — 同上,移动断点
  3. masters (mobile) — F002 + F013 token 迁移 + 印章选中态
- **2 处 batch 0 累积假阳性**(baseline 时机错配遗留,与 batch 1 无关,已登记 cleanup-backlog 待统一重制):
  4. liuyao (mobile) — batch 0 token 透出,本批未改 LiuYaoPage
  5. qimen (mobile) — 同上,本批未改 QiMenPage

结论:⚠️ P2 — 5/16 mismatch 全部已分类,无未知告警。重截 baseline 已立项,见 cleanup-backlog "视觉回归 baseline 时机错配"。

## 检查 15:Electron 冒烟构建

```bash
npm --prefix zhouwenwang/zhouwenwang-divination-mobile run build:electron
```

结果:
- `✓ built in 10.66s`
- 所有 chunk 正常生成(react-vendor 48 KB / ui-vendor 138 KB / utils-vendor 197 KB / index 1180 KB)
- HomePage / MasterSelectorDemo 独立 chunk 化(说明路由 lazy 部分可用)
- Electron 入口 `electron/main.cjs` 链接正常,`base: './'` 契约保持

警告(全是 batch 0 step E 已登记的预存在问题,非本批新引入):
- 8 个 `dynamic import will not move module into another chunk` 警告(games/index.ts 静态 import 与 MainContent.tsx lazy() 冲突,batch 0 cleanup-backlog "step E 闸门暴露的预存在债务" §2 已登记)
- `bundle size > 1000 KB`(同上,§3 已登记)

结论:✅ Electron 构建通过,无 React 错误,HashRouter 路径与 base 契约不变。

## 总结

- **P0 数:0** — 业务逻辑零改动 / props 接口未改(F013 className 失效已登记,非本批新引入)/ 测试零修改 / 无 build 失败
- **P1 数:0** — deprecated 类零新增 / lint 零增量 / 中式装饰白名单零越界
- **P2 数:2**
  - GuaWatermark `opacity=0.08` 偏离规范 `0.06`(建议下调,非阻塞;追加登记 cleanup-backlog 或后续微调)
  - 视觉回归 5/16 mismatch(3 真 + 2 假阳性,均已登记 cleanup-backlog "视觉回归 baseline 时机错配")

**结论:✅ 通过**。Batch 1 改造严格遵守 CLAUDE.md 硬性约束,装饰落点全部命中 §5.1 白名单,token 迁移彻底,业务逻辑零改动,Electron 冒烟通过,可进入 batch 2。

---

相关文件:
- `docs/ui-inventory.md`(F001/F002/F013 状态 DONE)
- `docs/design-system.md` §5.1 中式装饰白名单
- `docs/lint-baseline-batch-0.log`(lint 对账基准)
- `docs/cleanup-backlog.md`(本批新登记 5 条:F013 className / Divider token / Playwright chromium / baseline 时机错配 / + 4 条 baseline 期间登记)
- `zhouwenwang/zhouwenwang-divination-mobile/src/pages/HomePage.tsx`
- `zhouwenwang/zhouwenwang-divination-mobile/src/components/MasterSelectorDemo.tsx`
- `zhouwenwang/zhouwenwang-divination-mobile/src/masters/MasterSelector.tsx`
