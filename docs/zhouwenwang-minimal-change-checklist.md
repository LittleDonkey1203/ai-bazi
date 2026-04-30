# `zhouwenwang` 最小改动清单

## 1. 当前代码结构判断

基于代码检查，`zhouwenwang` 当前八字链路非常集中，适合做“局部替换”而不是大改架构。

核心链路如下：

1. 页面入口：`src/games/bazi/BaZiPage.tsx`
2. 八字计算：`src/games/bazi/logic.ts`
3. AI 解读：`src/masters/service.ts` + `src/masters/prompts.ts`
4. 历史记录：`src/core/history.ts`

这说明第一阶段不需要重做全站，只需要围绕这 4 个区域改。

## 2. 已确认的事实

### 2.1 八字页面

`BaZiPage.tsx` 负责：

- 接收出生信息
- 调用 `generateBaZiChart`
- 将结果整理成 `analysisData`
- 调用 `getAIAnalysisStream`
- 把结果写入 `addRecord`

这意味着页面层已经承担了一整条主链，但好处是入口单一，适合最小替换。

### 2.2 八字算法

`logic.ts` 当前是本地算法，存在几个明显问题：

- 农历转阳历是简化模拟
- 主要结构偏演示用途
- 命盘字段不够完整
- 难以支撑后续更专业的报告生成

结论：`logic.ts` 是第一优先替换点。

### 2.3 AI 解读

`prompts.ts` 里已经有八字专用 prompt 模板，`service.ts` 负责把结构化数据送给 Gemini。

这部分不需要重做交互，只需要：

- 改 prompt
- 改输入上下文
- 约束输出结构

### 2.4 历史记录

`history.ts` 目前主要基于本地存储，已经有按类型记录、读取、清除的完整逻辑。

结论：

- 第一阶段可以先继续沿用
- 不需要一开始接数据库
- 只要确保新的 chart 结构能被保存即可

## 3. 对 `bazi-mcp` 的判断

`bazi-mcp` 的最有价值入口是 `getBaziDetail`。

它的特点：

- 输入简单
- 可直接传 `solarDatetime`
- 返回结构化命盘信息
- 字段远比当前本地逻辑完整

而且它在 `src/index.ts` 已经直接导出方法，不一定非要跑成 MCP 服务。

这意味着第一阶段最省事的接入方法是：

- 直接把 `bazi-mcp` 当依赖使用
- 在 `zhouwenwang` 里写一个适配层
- 输出兼容 `BaZiPage.tsx` 展示层的数据结构

## 4. 第一阶段只改哪些文件

建议最先动下面几处：

### 4.1 `src/games/bazi/logic.ts`

改造目标：

- 保留 `generateBaZiChart` 这个函数名
- 内部改为调用 `bazi-mcp` 适配结果
- 尽量保持 `BaZiPage.tsx` 不需要大改

这是最关键的“外壳不变、内核替换”点。

### 4.2 `src/games/bazi/BaZiPage.tsx`

改造目标：

- 尽量不动页面布局
- 只调整字段读取方式
- 如果 `generateBaZiChart` 变成异步，则改调用方式
- 保持当前用户输入流程不变

### 4.3 `src/masters/prompts.ts`

改造目标：

- 删除明显依赖“模型脑补”的部分
- 改成根据结构化命盘进行解读
- 降低空泛概率判断
- 让输出更像“基于命盘事实的解释”

### 4.4 `src/masters/service.ts`

改造目标：

- 保持现有 Gemini 调用方式
- 只增强输入上下文
- 优先传完整四柱、十神、藏干、大运等结构化字段

### 4.5 `src/core/history.ts`

改造目标：

- 暂时不重写
- 只确认新数据结构序列化正常
- 后面再决定是否上服务端持久化

## 5. 第一阶段尽量不要动的文件

- 路由层
- 大部分通用组件
- Sidebar / Layout
- 其他术数页面
- 设置页的大部分逻辑
- 后端 Gemini 代理的大框架

这些都不是第一阶段最容易出价值的地方。

## 6. 最小改造实现路径

建议按下面顺序动手：

1. 在 `zhouwenwang` 内新增一个 `bazi-mcp` 适配模块
2. 让 `generateBaZiChart` 改为基于适配模块产出数据
3. 调整 `BaZiPage.tsx` 适配异步和新字段
4. 调整 `prompts.ts` 让 AI 只解释结构化结果
5. 验证历史记录仍可保存

## 7. 最可能出现的兼容问题

### 7.1 同步改异步

当前 `generateBaZiChart` 是同步函数，接 `bazi-mcp` 后大概率要变成异步。

影响：

- `BaZiPage.tsx` 调用要改
- 加载状态要更明确

### 7.2 字段不兼容

当前页面展示字段偏简化：

- `fourPillars`
- `wuxingAnalysis`
- `personalityTraits`
- `keyPoints`

而 `bazi-mcp` 返回更专业也更复杂，必须做字段映射。

正确做法不是改页面去吃原始返回，而是新增适配层。

### 7.3 Prompt 仍然过度自由

如果只换排盘不换 prompt，结果仍然会不稳定。

所以第一阶段必须同时改：

- 排盘数据来源
- AI 解读模板

## 8. 当前最合理的技术决定

第一阶段推荐这样做：

- 保留 `zhouwenwang` 前端和现有交互
- 保留现有 Gemini 接入路径
- 保留本地历史记录
- 替换 `logic.ts` 的八字内核
- 调整 prompt 让 AI 不再瞎补命盘

## 9. 下一步直接可执行的工作

接下来可以直接开始代码实现，优先顺序如下：

1. 在 `zhouwenwang` 安装并接入 `bazi-mcp`
2. 写八字适配层
3. 改 `generateBaZiChart`
4. 改 `BaZiPage.tsx`
5. 改八字 prompt

这就是当前最小改动、最符合开源复用思路的落地路径。
