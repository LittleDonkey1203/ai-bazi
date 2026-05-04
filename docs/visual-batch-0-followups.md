# Batch 0 视觉回归 — Followup 登记

> 本文件记录在 step F 视觉审查中发现的、超出 batch 0 修复范围的视觉问题。
> 仅供后续 batch 作者参考，无需在 batch 0 中处理。

---

## F1 — /liuyao @ 375px 横向溢出

- 路由：/liuyao
- 视口：375px mobile
- 现象：页面主要内容 input+button 横排，scrollWidth=396 超出 windowWidth=375，用户需横向滚动才能看到并点击「开始摇卦」按钮
- 溢出元素：BUTTON class=px-8 py-3 h-[46px] rounded-xl font-bold text-lg（开始摇卦）
- baseline 状态：同样存在（pre-existing，改造前已有）
- 推测原因：LiuYaoPage.tsx 的问题输入行使用 flex 横排布局，input 设有最小宽度，button 使用 px-8 固定 padding，两者合计在 375px 下超出视口
- 推荐修复：改为 flex-col 在 mobile 下（输入框上方，按钮下方），或给 button 添加 w-full/flex-1 让其自适应
- 推荐处理 batch：batch 2（LiuYaoPage 改造批次）
- 截图：zhouwenwang/zhouwenwang-divination-mobile/tests/visual/actual/batch-0/mobile/liuyao.png

---

## F2 — /qimen @ 375px 横向溢出

- 路由：/qimen
- 视口：375px mobile
- 现象：页面主要内容 input+button 横排，scrollWidth=396 超出 windowWidth=375，「开始起盘」按钮不可见（需横向滚动）
- 溢出元素：BUTTON class=px-8 py-3 h-[46px] rounded-xl font-bold text-lg（开始起盘）
- baseline 状态：同样存在（pre-existing，改造前已有）
- 推测原因：QiMenPage.tsx 与 LiuYaoPage.tsx 使用了相同的输入行布局模式
- 推荐修复：同 F1，改为 mobile 下 flex-col 布局或 w-full button
- 推荐处理 batch：batch 2（QiMenPage 改造批次）
- 截图：zhouwenwang/zhouwenwang-divination-mobile/tests/visual/actual/batch-0/mobile/qimen.png

---

## F3 — 视觉基线测试 localStorage 残留问题

- 类型：测试基础设施问题（非业务代码问题）
- 现象：Playwright 会话中 sidebar 曾被手动折叠，折叠状态写入 localStorage（zhouwenwang-app-store.settings.sidebarCollapsed=true），导致所有 desktop 截图均为折叠态，与 baseline（展开态）出现视觉差
- 实际影响：无业务功能影响，仅影响测试可读性
- 推荐修复：在视觉测试 setup 中（或 step F 开始时）添加如下代码：
  ```js
  await page.evaluate(() => localStorage.removeItem('zhouwenwang-app-store'));
  ```
- 推荐处理 batch：不需要 batch，由测试基础设施维护人在下次 step F 之前处理

