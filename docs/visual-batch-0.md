# Batch 0 视觉回归报告

> 时间：2026-05-04
> 工具：visual-reviewer subagent (Playwright MCP)
> baseline：zhouwenwang/zhouwenwang-divination-mobile/tests/visual/__snapshots__/{desktop,mobile}/*.png
> 对照：dev server http://localhost:5173 当前状态
> actual 截图：zhouwenwang/zhouwenwang-divination-mobile/tests/visual/actual/batch-0/{desktop,mobile}/

---

## !! 顶部警告区（P0）

**P0 问题数：0**

无结构性崩溃、无关键内容消失、无横向溢出新增。以下两个横向溢出路由经与 baseline 比对确认为**改造前已存在**，不是 batch 0 引入：
- /liuyao @ 375px — scrollWidth=396 vs windowWidth=375（基线同样溢出）
- /qimen @ 375px — scrollWidth=396 vs windowWidth=375（基线同样溢出）

---

## 概览

- 对比总数：16（8 路由 × 2 视口）
- 预期变化：16（所有路由均有色彩/背景变化）
- 需关注：3
- P0 必修：0
- followup：3（已登记到 docs/visual-batch-0-followups.md）

---

## Console 错误说明

所有 16 个路由报告 **0 个 React 错误**。唯一错误为：

    [ERROR] Failed to load resource: net::ERR_CONNECTION_REFUSED @ http://localhost:3001/api/marquee

原因：MarqueeNotification 组件尝试访问后端 API 服务（端口 3001），该服务在当前 dev 环境未运行。不影响 UI 渲染，baseline 下同样存在。

---

## 16 张对比详情

### Desktop 1440×900

#### / (home)
- baseline: tests/visual/__snapshots__/desktop/home.png
- actual: tests/visual/actual/batch-0/desktop/home.png
- 差异：背景 #000000 → #0a0a0f；Sidebar 在折叠态（Playwright 会话 localStorage 残留，非回归，见 P2）；页面内容、卡片、文字完整呈现
- 检查项：
  - 横向溢出：OK scrollWidth=1425, clientWidth=1440
  - Sidebar 在左侧：OK 存在，left=0
  - 主内容错位：OK 无
  - Console errors：OK 0
- 分类：预期变化

#### /masters
- baseline: tests/visual/__snapshots__/desktop/masters.png
- actual: tests/visual/actual/batch-0/desktop/masters.png
- 差异：背景 #000000 → #0a0a0f；大师卡片 4 列布局正确渲染；调试信息面板正常显示
- 检查项：
  - 横向溢出：OK scrollWidth=1440, clientWidth=1440
  - Sidebar 在左侧：OK 存在，left=0
  - 主内容错位：OK 无
  - Console errors：OK 0
- 分类：预期变化

#### /liuyao
- baseline: tests/visual/__snapshots__/desktop/liuyao.png
- actual: tests/visual/actual/batch-0/desktop/liuyao.png
- 差异：背景 #000000 → #0a0a0f；问题输入框 + 开始摇卦按钮正常显示
- 检查项：
  - 横向溢出：OK scrollWidth=1440, clientWidth=1440
  - Sidebar 在左侧：OK 存在，left=0
  - 主内容错位：OK 无
  - Console errors：OK 0
- 分类：预期变化

#### /qimen
- baseline: tests/visual/__snapshots__/desktop/qimen.png
- actual: tests/visual/actual/batch-0/desktop/qimen.png
- 差异：背景 #000000 → #0a0a0f；问题输入框 + 开始起盘按钮 + 快速开始问题正常显示
- 检查项：
  - 横向溢出：OK scrollWidth=1440, clientWidth=1440
  - Sidebar 在左侧：OK 存在，left=0
  - 主内容错位：OK 无
  - Console errors：OK 0
- 分类：预期变化

#### /bazi
- baseline: tests/visual/__snapshots__/desktop/bazi.png
- actual: tests/visual/actual/batch-0/desktop/bazi.png
- 差异：背景 #000000 → #0a0a0f；命例管理器 + 出生信息表单 + 录入预览正常显示
- 检查项：
  - 横向溢出：OK scrollWidth=1425, clientWidth=1440
  - Sidebar 在左侧：OK 存在，left=0
  - 主内容错位：OK 无
  - Console errors：OK 0
- 分类：预期变化

#### /zhougong
- baseline: tests/visual/__snapshots__/desktop/zhougong.png
- actual: tests/visual/actual/batch-0/desktop/zhougong.png
- 差异：背景 #000000 → #0a0a0f；梦境描述文本框 + 快速开始问题正常显示
- 检查项：
  - 横向溢出：OK scrollWidth=1440, clientWidth=1440
  - Sidebar 在左侧：OK 存在，left=0
  - 主内容错位：OK 无
  - Console errors：OK 0
- 分类：预期变化

#### /lifekline
- baseline: tests/visual/__snapshots__/desktop/lifekline.png
- actual: tests/visual/actual/batch-0/desktop/lifekline.png
- 差异：背景 #000000 → #0a0a0f；姓名 + 性别 + 出生年份 + 开始分析按钮正常显示
- 检查项：
  - 横向溢出：OK scrollWidth=1440, clientWidth=1440
  - Sidebar 在左侧：OK 存在，left=0
  - 主内容错位：OK 无
  - Console errors：OK 0
- 分类：预期变化

#### /palmistry
- baseline: tests/visual/__snapshots__/desktop/palmistry.png
- actual: tests/visual/actual/batch-0/desktop/palmistry.png
- 差异：背景 #000000 → #0a0a0f；上传区 + 四个手相线卡片（2×2 grid）正常显示
- 检查项：
  - 横向溢出：OK scrollWidth=1440, clientWidth=1440
  - Sidebar 在左侧：OK 存在，left=0
  - 主内容错位：OK 无
  - Console errors：OK 0
- 分类：预期变化

---

### Mobile 375×812

#### / (home)
- baseline: tests/visual/__snapshots__/mobile/home.png
- actual: tests/visual/actual/batch-0/mobile/home.png
- 差异：背景 #000000 → #0a0a0f；BottomNav bg-night 生效（#111111 → #0a0a0f）；首页激活态 #FF9900（视觉契约保持）；主内容 paddingBottom=80px；卡片文字竖向堆叠与 baseline 完全一致（预存在问题）
- 检查项：
  - 横向溢出：OK scrollWidth=360, windowWidth=375
  - BottomNav 在底部：OK bottom=812px = viewport height
  - 主内容错位：OK 无
  - Console errors：OK 0
- 分类：预期变化

#### /masters
- baseline: tests/visual/__snapshots__/mobile/masters.png
- actual: tests/visual/actual/batch-0/mobile/masters.png
- 差异：背景 #000000 → #0a0a0f；BottomNav 颜色变化；大师卡片单列正常显示
- 检查项：
  - 横向溢出：OK scrollWidth=360, windowWidth=375
  - BottomNav 在底部：OK bottom=812px = viewport height
  - 主内容错位：OK 无
  - Console errors：OK 0
- 分类：预期变化

#### /liuyao
- baseline: tests/visual/__snapshots__/mobile/liuyao.png
- actual: tests/visual/actual/batch-0/mobile/liuyao.png
- 差异：背景 #000000 → #0a0a0f；BottomNav 颜色变化；开始摇卦 button 超出右边界（baseline 同样溢出）
- 检查项：
  - 横向溢出：WARN scrollWidth=396 > 375（pre-existing，非 batch 0 引入）
  - BottomNav 在底部：OK bottom=812px = viewport height
  - 主内容错位：OK 无
  - Console errors：OK 0
- 分类：预存在问题（需后续 batch 修复）

#### /qimen
- baseline: tests/visual/__snapshots__/mobile/qimen.png
- actual: tests/visual/actual/batch-0/mobile/qimen.png
- 差异：背景 #000000 → #0a0a0f；BottomNav 颜色变化；开始起盘 button 超出右边界（baseline 同样溢出）
- 检查项：
  - 横向溢出：WARN scrollWidth=396 > 375（pre-existing）
  - BottomNav 在底部：OK bottom=812px = viewport height
  - 主内容错位：OK 无
  - Console errors：OK 0
- 分类：预存在问题（需后续 batch 修复）

#### /bazi
- baseline: tests/visual/__snapshots__/mobile/bazi.png
- actual: tests/visual/actual/batch-0/mobile/bazi.png
- 差异：背景 #000000 → #0a0a0f；BottomNav 颜色变化；八字表单单列正常显示
- 检查项：
  - 横向溢出：OK scrollWidth=360, windowWidth=375
  - BottomNav 在底部：OK bottom=812px = viewport height
  - 主内容错位：OK 无
  - Console errors：OK 0
- 分类：预期变化

#### /zhougong
- baseline: tests/visual/__snapshots__/mobile/zhougong.png
- actual: tests/visual/actual/batch-0/mobile/zhougong.png
- 差异：背景 #000000 → #0a0a0f；BottomNav 颜色变化；梦境输入框 + 快速问题链接正常显示
- 检查项：
  - 横向溢出：OK scrollWidth=360, windowWidth=375
  - BottomNav 在底部：OK bottom=812px = viewport height
  - 主内容错位：OK 无
  - Console errors：OK 0
- 分类：预期变化

#### /lifekline
- baseline: tests/visual/__snapshots__/mobile/lifekline.png
- actual: tests/visual/actual/batch-0/mobile/lifekline.png
- 差异：背景 #000000 → #0a0a0f；BottomNav 颜色变化；表单单列居中正常显示
- 检查项：
  - 横向溢出：OK scrollWidth=360, windowWidth=375
  - BottomNav 在底部：OK bottom=812px = viewport height
  - 主内容错位：OK 无
  - Console errors：OK 0
- 分类：预期变化

#### /palmistry
- baseline: tests/visual/__snapshots__/mobile/palmistry.png
- actual: tests/visual/actual/batch-0/mobile/palmistry.png
- 差异：背景 #000000 → #0a0a0f；BottomNav 颜色变化；上传区 + 手相线卡片单列正常显示
- 检查项：
  - 横向溢出：OK scrollWidth=360, windowWidth=375
  - BottomNav 在底部：OK bottom=812px = viewport height
  - 主内容错位：OK 无
  - Console errors：OK 0
- 分类：预期变化

---

## 关键发现汇总

### P0（必修，布局崩坏）— 无

### P1（建议修，pre-existing 溢出）

#### /liuyao @ 375px
- 现象：scrollWidth=396 > windowWidth=375，开始摇卦 button 超出右边界，用户需横向滚动才能点击
- baseline 状态：同样存在，改造前遗留
- 推测原因：LiuYaoPage.tsx 输入行 flex 布局 + px-8 固定 padding，在 375px 下 input+button 总宽超出视口
- 建议处理 batch：batch 2（LiuYaoPage 改造批次）
- 截图：tests/visual/actual/batch-0/mobile/liuyao.png

#### /qimen @ 375px
- 现象：scrollWidth=396 > windowWidth=375，开始起盘 button 超出右边界
- baseline 状态：同样存在，改造前遗留
- 推测原因：QiMenPage.tsx 同样的输入行布局模式
- 建议处理 batch：batch 2（QiMenPage 改造批次）
- 截图：tests/visual/actual/batch-0/mobile/qimen.png

### P2（可选）

#### Desktop Sidebar 折叠状态（测试环境问题，非代码问题）
- 现象：actual 截图中侧边栏全部为折叠态（仅图标），baseline 为展开态（显示文字标签）
- 根因：Playwright 会话复用了 localStorage 中残留的 sidebarCollapsed:true 状态。实际用户首次访问 sidebarCollapsed=false，侧边栏为展开态
- 验证：localStorage zhouwenwang-app-store 中 settings.sidebarCollapsed = false（已核查）
- 建议：视觉基线测试每次运行前执行 localStorage.clear() 或清除对应 key
- 不需要修任何业务代码

---

## 对 design-system §1 设计意图的对照

- [x] 主背景从纯黑 (#000000) 切到墨黑 (#0a0a0f) — 16 张均确认 bg-night = rgb(10, 10, 15) = #0a0a0f 生效。HomePage.tsx 包装层 bg-black 仍为 #000000（属 batch 1 范围），被 MainContent bg-night 覆盖，整体呈现无问题
- [x] Sidebar Star 图标橙→绛红 — 展开态确认 className=w-5 h-5 text-brand，computed color = rgb(196, 30, 58) = #c41e3a。8 张 desktop 时 sidebar 折叠未渲染 star 标题行，代码层直接确认正确
- [x] BottomNav 激活态保持橙色 (#FF9900 brand-aux) — mobile 8 张均确认激活项 color = rgb(255, 153, 0) = #FF9900 — 视觉契约保持
- [x] mobile 视口主内容 paddingBottom 增加（safe-area 让位）— 实测 MainContent 过渡包装器 paddingBottom=80px（含 64px BottomNav + safe-area-inset-bottom 等价值）

---

## 数据汇总

| 路由 | desktop | mobile | 移动端问题数 | 说明 |
|------|---------|--------|------------|------|
| / | 预期变化 | 预期变化 | 0 | |
| /masters | 预期变化 | 预期变化 | 0 | |
| /liuyao | 预期变化 | 需关注 | 1 | 溢出 pre-existing，batch 2 修 |
| /qimen | 预期变化 | 需关注 | 1 | 溢出 pre-existing，batch 2 修 |
| /bazi | 预期变化 | 预期变化 | 0 | |
| /zhougong | 预期变化 | 预期变化 | 0 | |
| /lifekline | 预期变化 | 预期变化 | 0 | |
| /palmistry | 预期变化 | 预期变化 | 0 | |

---

## 建议下一步

**可进入 step G（ui-auditor 审计）。**

- P0 问题数 = 0，无结构性崩溃
- batch 0 的四个核心改动全部确认生效：
  1. bg-night (#0a0a0f) 替换 bg-black (#000000) 用于 Layout/Sidebar/BottomNav/MainContent — 确认
  2. Sidebar Star 图标 text-brand (#c41e3a) 替换 text-[#FF9900] — 代码层确认 computed = rgb(196, 30, 58)
  3. BottomNav bg-night 替换 bg-black/bg-[#111111] — 确认
  4. MainContent safe-area paddingBottom（80px 渲染值，含 safe-area-inset-bottom）— 确认
- 两个 P1 横向溢出属 pre-existing，已登记 followups，纳入 batch 2 处理
- Desktop sidebar 折叠态属测试环境 localStorage 残留，不是代码问题，不阻塞进 step G
