# Known Mobile Issues(改造前 baseline 观察记录)

> 来源:`tests/visual/__snapshots__/mobile/*.png`(2026-05-04 baseline,375×812)
> 性质:**改造前已存在的问题**,**不是改造引入的回归**。本文件仅作待办登记,后续 batch 处理时引用本文件对应条目。
> 范围对照:`docs/ui-inventory.md` 的文件 ID 与批次分配。

## 全局模式(跨页面)

### G1. BottomNav 永久遮挡主内容尾部

**现象**:多个页面(home / masters / bazi / palmistry)在 baseline 截图中出现 BottomNav 覆盖在最后一屏内容之上,被遮挡的元素包括:
- home.png:"奇门遁甲""手相分析"游戏卡片中部 + 底部"本地隐私保护""AI智能分析""传统易学智慧" 三栏部分被遮
- masters.png:第 7 个大师卡片(雷佳音)完整被覆盖,调试信息面板部分被遮
- bazi.png:**性别选择(男/女按钮)整体被 BottomNav 遮**,无法点击
- palmistry.png:第二张卡片"智慧线"完全被遮(只看到圆点),其后内容也错位

**推测对应文件**:
- `S010 MainContent.tsx`:容器 `paddingBottom` 在 mobile 时仅 `5rem`(80px),BottomNav 实际高度(64px + safe-area-inset-bottom)若 ≥ 80px 就会遮
- `S009 BottomNav.tsx`:实际渲染高度可能因 `min-height: 64px` + safe-area 超出预期

**修复时机**:
- **batch 0 step D**:重新评估 `MainContent.tsx` 的 `pb-20` 是否够用;若不够,改 `pb-24`(96px)或 `pb-28`(112px)。**这属于"接 token + 微调安全边距",仍在 step D 的"接 token"语义内,可做**。
- 若不在 batch 0 修,登记到 batch 1 起所有页面 layout 的"补 padding"清单

**优先级**:🔴 高(影响关键 CTA 可达性)

---

### G2. 输入框 / 按钮左切 + 文字垂直堆叠

**现象**:liuyao / qimen / zhougong 等页面的"诚心问卦"或"梦境描述"输入框,在 mobile 视口下:
- 输入框左侧被"切掉"(placeholder 第一字第一笔不可见)
- "开始摇卦"按钮的中文字符垂直堆叠(每字一行)
- 输入框 + 按钮采用 flex row,但容器宽度不足以容纳两者,导致输入框被压缩到极窄

**推测对应文件**:`F003 LiuYaoPage.tsx` / `F004 QiMenPage.tsx` / `F008 ZhouGongPage.tsx`

**修复时机**:
- batch 2(LiuYao + QiMen)/ batch 4(ZhouGong)
- 修复方案:在 `< md` 时把 input + button flex-row 改为 flex-col,各自占满宽度

**优先级**:🟠 中高(影响主要交互入口)

---

### G3. 双列 grid 在窄屏挤压

**现象**:HomePage 的"古老智慧 / 大师团队"区域用 2-column grid,在 375 宽下:
- 左侧"古老智慧"下面叠了 6 个游戏卡片(每张约 100px 宽)
- 卡片描述文字被挤成"每字一行"的垂直字串
- 视觉上左半区高耸,右半区短小,整体不平衡

**推测对应文件**:`F001 HomePage.tsx`

**修复时机**:batch 1
**修复方案**:`< md` 时改为单列堆叠;游戏卡片改为 2 列均匀网格(不嵌套在"古老智慧"列下)

**优先级**:🔴 高(首页第一印象)

---

## 按文件 ID 分组的具体问题

### F001 HomePage.tsx(batch 1)

| # | 现象 | 视口 | 截图 |
|---|------|------|------|
| F001-1 | 双列 grid 嵌套游戏卡片(见 G3) | 375×812 | `mobile/home.png` |
| F001-2 | 标题"周文王在线算命"虽然居中,但与下方描述间距偏大,顶部留白多;hero 结构在窄屏可压缩 | 375×812 | `mobile/home.png` |
| F001-3 | 底部三栏"本地隐私保护""AI智能分析""传统易学智慧"被 BottomNav 遮(见 G1) | 375×812 | `mobile/home.png` |

### F002 MasterSelectorDemo.tsx + F013 MasterSelector.tsx(batch 1)

| # | 现象 | 视口 | 截图 |
|---|------|------|------|
| F002-1 | 标题"周文王占卜 - 大师选择"在 375 宽下换行(尚可读),但字号偏大;mobile 应缩一档 | 375×812 | `mobile/masters.png` |
| F002-2 | 9 个大师卡片单列 vertical list,但第 7-9 张被 BottomNav 遮(见 G1) | 375×812 | `mobile/masters.png` |
| F002-3 | 调试信息面板("选中大师ID""大师名称""描述""提示词长度")在生产页中出现,**应该在 mobile 隐藏或仅 dev 模式可见** | 375×812 | `mobile/masters.png` |

### F003 LiuYaoPage.tsx(batch 2)

| # | 现象 | 视口 | 截图 |
|---|------|------|------|
| F003-1 | "诚心问卦"输入框被左切(见 G2) | 375×812 | `mobile/liuyao.png` |
| F003-2 | "开始摇卦"按钮中文字符垂直堆叠(因为按钮宽度被压缩;见 G2) | 375×812 | `mobile/liuyao.png` |
| F003-3 | "起卦时间:" 标签与"当前时间 / 自选时间"radio 横向挤压;每个 radio 标签的"时间"两字换行 | 375×812 | `mobile/liuyao.png` |
| F003-4 | 快速开始 3 个示例问题(今年运势/家人健康/近期财运)排版混乱:文本左对齐与右对齐混合,实际是"快速开始:"标签与问题列表 flex 排版坏掉 | 375×812 | `mobile/liuyao.png` |

### F004 QiMenPage.tsx(batch 2)

| # | 现象 | 视口 | 截图 |
|---|------|------|------|
| F004-1 | "您想算点什么?"输入框被左切(同 G2) | 375×812 | `mobile/qimen.png` |
| F004-2 | "开始起盘"按钮中文垂直堆叠(同 G2) | 375×812 | `mobile/qimen.png` |
| F004-3 | "快速开始:" 标签 + 3 个问题的右侧分布,标签字号大于问题文字,视觉重心偏左 | 375×812 | `mobile/qimen.png` |
| F004-4 | "起盘时间:" 标签 + radio "当前时间 / 选择时间";标签的"间"字换行,radio 的"时间"两字也换行 | 375×812 | `mobile/qimen.png` |

### F005 BaZiPage.tsx + F006 BaziCompactGrid.tsx(batch 3)

| # | 现象 | 视口 | 截图 |
|---|------|------|------|
| F005-1 | 案例管理卡片("八字命例信息管理")基本 OK,但描述文字偏长,占用 6 行 | 375×812 | `mobile/bazi.png` |
| F005-2 | "保存为命例""新建命例"两个按钮 OK | 375×812 | `mobile/bazi.png` |
| F005-3 | **性别选择(男/女)、录入方式(阳历/农历/四柱反查)整体被 BottomNav 遮**(见 G1)。这是"开始八字推命"前的必填选择,严重可达性问题 | 375×812 | `mobile/bazi.png` |
| F005-4 | "阳历输入"被高亮(deprecation 旧橙 `#FF9900`)— 改造期会迁移到 `bg-brand` | 375×812 | `mobile/bazi.png` |

### F007 PalmistryPage.tsx(batch 4)

| # | 现象 | 视口 | 截图 |
|---|------|------|------|
| F007-1 | "上传手相图片"卡片虚线边框 + 相机图标 + 描述文字 OK | 375×812 | `mobile/palmistry.png` |
| F007-2 | 4 张能力卡片(生命线/智慧线/感情线/事业线)垂直排列;**"智慧线"卡完全被 BottomNav 覆盖**(只剩黄圆点)(见 G1) | 375×812 | `mobile/palmistry.png` |
| F007-3 | 卡片之间的间距 + BottomNav 遮挡导致用户感觉只有 3 张卡(漏掉中间一张) | 375×812 | `mobile/palmistry.png` |

### F008 ZhouGongPage.tsx(batch 4)

| # | 现象 | 视口 | 截图 |
|---|------|------|------|
| F008-1 | "请详细描述您的梦境..."输入框被压缩到极窄,文字"请/详/细/描/述/您/的/梦/境"垂直堆叠成 9 行(同 G2 模式) | 375×812 | `mobile/zhougong.png` |
| F008-2 | "开始解梦"按钮 OK(因为输入框被极致压缩,按钮反而正常) | 375×812 | `mobile/zhougong.png` |
| F008-3 | "快速开始:" 标签 + 3 问题(梦见考试失败/梦见飞翔/梦见捡到钱财)flex 排版同 F003-4 模式 | 375×812 | `mobile/zhougong.png` |

### F009 LifeKlinePage.tsx + F010 KlineChart.tsx + F011 LifeKlineMarkdown.tsx(batch 4)

| # | 现象 | 视口 | 截图 |
|---|------|------|------|
| F009-1 | 整体表单布局 OK,但"性别"两个 radio "男 女"之间间距异常小,几乎贴在一起 | 375×812 | `mobile/lifekline.png` |
| F009-2 | "出生年份"select(2001 年下拉)位于 form 中部,样式 OK | 375×812 | `mobile/lifekline.png` |
| F009-3 | "开始分析"按钮 disabled 状态(因为没填写),配色偏深;启用态待批次改造时观察 | 375×812 | `mobile/lifekline.png` |

---

## 修复时间表(汇总)

| Batch | 处理的问题 | 关键 ID |
|-------|----------|---------|
| 0(step D)| **G1 BottomNav 遮挡** —— 调整 `MainContent.tsx` 的 `pb-*` 让位 | S010 |
| 1 | F001 HomePage 双列 grid 重构 + masters 调试面板隐藏 | F001 / F002 / F013 |
| 2 | LiuYao / QiMen 的输入框-按钮 flex 在 mobile 改 column,标签纵向栈,radio 间距 | F003 / F004 |
| 3 | BaZi 表单(已部分响应式,补窄屏检视) | F005 / F006 |
| 4 | ZhouGong / Palmistry / LifeKline 表单 + 卡片 spacing | F007 / F008 / F009 / F010 / F011 |

---

## 不在本表追踪的(因不构成问题或属于 baseline 正常状态)

- 黑色背景、橙色品牌色 —— 改造期会迁移到绛红 `#c41e3a`(见 design-system.md §1.4.1 deprecation)
- "更多"按钮在 BottomNav 中显示("更多"项目数大于 5 时折叠)—— 这是 `S009 BottomNav` 既有 partial 实现的预期行为
- 各页 hero 区垂直留白 —— 桌面观感下需要,mobile 下若觉得过大,batch 1 可缩
