# CLAUDE.md — AI 八字排盘系统开发指令

> 本文件是 Claude Code 的项目指令文件。Claude Code 在每次对话开始时自动读取此文件。
> 严格遵循本文件中的架构约定、目录结构、命名规范和开发流程。

---

## 项目概述

构建一个 AI 增强的八字排盘系统。核心理念：**排盘引擎是纯计算（确定性），AI解读是推理（非确定性），两者必须解耦**。

技术栈：TypeScript 全栈，pnpm workspace monorepo，Turborepo 构建编排。

底层历法库：**6tail/lunar-javascript**（npm 包名 `lunar-javascript`，MIT 许可证）。

---

## 项目结构（严格遵循）

```
bazi-ai/
├── CLAUDE.md                    ← 你正在读的文件
├── TASKS.md                     ← 任务进度追踪，每次开始工作前先读取
├── package.json                 ← 根 package.json（workspaces 声明）
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json           ← 共享 TS 配置
├── .env.example
├── docker-compose.yml           ← 本地 PostgreSQL + Redis
│
├── packages/
│   ├── engine/                  ← @bazi/engine（核心排盘引擎，独立 npm 包）
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   ├── src/
│   │   │   ├── index.ts         ← 统一导出
│   │   │   ├── types.ts         ← 所有 TypeScript 类型定义
│   │   │   ├── calculator.ts    ← 主入口函数 calculateBazi()
│   │   │   ├── fourPillars.ts   ← 四柱（年柱月柱日柱时柱）
│   │   │   ├── tenGods.ts       ← 十神推算
│   │   │   ├── hiddenStems.ts   ← 藏干
│   │   │   ├── dayun.ts         ← 大运排列
│   │   │   ├── liunian.ts       ← 流年
│   │   │   ├── shensha.ts       ← 命盘神煞（天乙贵人、文昌、驿马等）
│   │   │   ├── wuxing.ts        ← 五行评分 & 旺衰分析
│   │   │   ├── pattern.ts       ← 格局判断
│   │   │   ├── relations.ts     ← 刑冲合会害破
│   │   │   ├── nayin.ts         ← 纳音（已由 lunar 提供，此模块做结构化封装）
│   │   │   ├── kongwang.ts      ← 空亡
│   │   │   ├── mingGong.ts      ← 命宫计算
│   │   │   ├── taiYuan.ts       ← 胎元计算
│   │   │   ├── chengGu.ts       ← 称骨计算
│   │   │   └── utils.ts         ← 内部工具函数（五行映射表、干支序号等）
│   │   └── __tests__/
│   │       ├── calculator.test.ts
│   │       ├── fourPillars.test.ts
│   │       ├── tenGods.test.ts
│   │       ├── dayun.test.ts
│   │       └── fixtures/        ← 已验证的排盘结果 JSON（多个万年历交叉验证）
│   │           ├── case-1990-08-15-14.json
│   │           └── ...
│   │
│   ├── ai-service/              ← @bazi/ai-service（AI 解读服务）
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── prompt/
│   │   │   │   ├── system.ts    ← 命理师 System Prompt
│   │   │   │   ├── templates.ts ← 排盘 JSON → Prompt 模板
│   │   │   │   └── fewShot.ts   ← 少样本示例
│   │   │   ├── llm/
│   │   │   │   ├── provider.ts  ← LLM 抽象接口
│   │   │   │   ├── deepseek.ts
│   │   │   │   ├── claude.ts
│   │   │   │   └── openai.ts
│   │   │   ├── rag/
│   │   │   │   ├── embedder.ts  ← 文本向量化
│   │   │   │   ├── retriever.ts ← 向量检索
│   │   │   │   └── corpus/      ← 命理古籍语料（.txt/.json）
│   │   │   ├── mcp/
│   │   │   │   └── server.ts    ← MCP 协议服务器
│   │   │   └── conversation.ts  ← 对话历史管理
│   │   └── __tests__/
│   │
│   ├── api/                     ← @bazi/api（后端 API 服务）
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── app.ts           ← Express/Fastify 应用入口
│   │   │   ├── routes/
│   │   │   │   ├── bazi.ts      ← POST /api/bazi/chart
│   │   │   │   ├── ai.ts        ← POST /api/ai/chat（SSE 流式）
│   │   │   │   ├── user.ts      ← 用户相关
│   │   │   │   └── health.ts    ← GET /api/health
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts      ← JWT 鉴权
│   │   │   │   ├── rateLimit.ts ← 限流
│   │   │   │   └── validate.ts  ← 参数校验（zod）
│   │   │   ├── services/
│   │   │   │   ├── baziService.ts   ← 调用 @bazi/engine + 缓存
│   │   │   │   └── aiService.ts     ← 调用 @bazi/ai-service
│   │   │   └── db/
│   │   │       ├── prisma/
│   │   │       │   └── schema.prisma
│   │   │       └── client.ts
│   │   └── __tests__/
│   │
│   └── web/                     ← @bazi/web（Next.js 前端）
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx         ← 首页（输入生辰）
│       │   ├── chart/
│       │   │   └── [id]/
│       │   │       └── page.tsx ← 排盘结果页
│       │   ├── chat/
│       │   │   └── page.tsx     ← AI 对话页
│       │   └── api/             ← Next.js Route Handlers（可选 BFF）
│       └── components/
│           ├── BaziInput.tsx    ← 生辰输入表单
│           ├── BaziChart.tsx    ← 四柱排盘可视化
│           ├── WuxingRadar.tsx  ← 五行雷达图
│           ├── DayunTimeline.tsx← 大运时间轴
│           ├── AiChat.tsx       ← AI 对话组件（SSE）
│           └── ui/              ← 通用 UI 组件
```

---

## 开发阶段与指令

### Phase 1：排盘引擎 @bazi/engine

**这是最重要的阶段。引擎质量决定整个产品的命理准确度。**

#### 1.1 初始化

```bash
# 在项目根目录
pnpm init
# 创建 pnpm-workspace.yaml 内容：
# packages:
#   - 'packages/*'

cd packages/engine
pnpm init
pnpm add lunar-javascript
pnpm add -D typescript vitest @types/node tsup
```

#### 1.2 核心接口定义（types.ts）

```typescript
// packages/engine/src/types.ts

/** 排盘输入 */
export interface BaziInput {
  year: number;         // 公历年
  month: number;        // 公历月 1-12
  day: number;          // 公历日
  hour: number;         // 24小时制 0-23
  minute?: number;      // 分钟（影响真太阳时修正）
  gender: 'male' | 'female';
  timezone?: number;    // 时区，默认 8（东八区）
  longitude?: number;   // 出生地经度，预留给真太阳时修正（Phase 1 暂不启用）
}

/** 天干 */
export type TianGan = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

/** 地支 */
export type DiZhi = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';

/** 五行 */
export type WuXing = '金' | '木' | '水' | '火' | '土';

/** 十神 */
export type ShiShen = '比肩' | '劫财' | '食神' | '伤官' | '偏财' | '正财' | '七杀' | '正官' | '偏印' | '正印';

/** 单柱 */
export interface Pillar {
  stem: TianGan;
  branch: DiZhi;
  stemElement: WuXing;
  branchElement: WuXing;
  nayin: string;
  hiddenStems: Array<{ stem: TianGan; element: WuXing; ratio: number }>;
  tenGod?: ShiShen;  // 相对于日干的十神（日柱本身无十神）
}

/** 大运 */
export interface DaYun {
  index: number;
  startAge: number;
  endAge: number;
  startYear: number;
  stem: TianGan;
  branch: DiZhi;
  tenGod: ShiShen;
}

/** 流年 */
export interface LiuNian {
  year: number;
  age: number;
  stem: TianGan;
  branch: DiZhi;
  tenGod: ShiShen;
}

/** 五行力量分析 */
export interface WuXingAnalysis {
  counts: Record<WuXing, number>;       // 各五行出现次数
  scores: Record<WuXing, number>;       // 各五行力量评分
  dayMasterStrength: 'strong' | 'weak' | 'neutral';  // 日主旺衰
  favorableElements: WuXing[];          // 喜用神五行
  unfavorableElements: WuXing[];        // 忌神五行
}

/** 关系（冲刑合会害破） */
export interface Relation {
  type: '冲' | '刑' | '合' | '会' | '害' | '破' | '三合' | '六合' | '三会';
  positions: string[];  // 如 ['年支', '日支']
  description: string;
}

/** 称骨 */
export interface ChengGu {
  weight: number;       // 总重量（两）
  description: string;  // 命运描述
}

/** 完整排盘结果 */
export interface BaziChart {
  input: BaziInput;
  fourPillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar;
  };
  wuxing: WuXingAnalysis;
  relations: Relation[];
  dayun: DaYun[];
  liunian: LiuNian[];
  shensha: string[];    // 命盘神煞列表，如 ['天乙贵人', '文昌', '驿马']
  kongwang: string;     // 空亡地支，如 '寅卯'
  mingGong: Pillar;     // 命宫
  taiYuan: Pillar;      // 胎元
  pattern: string;      // 格局名称，如 '偏印格'
  chengGu: ChengGu;     // 称骨
}
```

#### 1.3 主计算函数（calculator.ts）

```typescript
// packages/engine/src/calculator.ts
import { Solar } from 'lunar-javascript';
import type { BaziInput, BaziChart } from './types';
import { calculateFourPillars } from './fourPillars';
import { calculateTenGods } from './tenGods';
import { calculateHiddenStems } from './hiddenStems';
import { calculateDayun } from './dayun';
import { calculateLiunian } from './liunian';
import { calculateShensha } from './shensha';
import { analyzeWuxing } from './wuxing';
import { detectPattern } from './pattern';
import { findRelations } from './relations';
import { calculateKongwang } from './kongwang';
import { calculateMingGong } from './mingGong';
import { calculateTaiYuan } from './taiYuan';
import { calculateChengGu } from './chengGu';

/**
 * 核心排盘函数。纯函数，无副作用，同输入必同输出。
 * 可安全缓存：cacheKey = JSON.stringify(input)
 */
export function calculateBazi(input: BaziInput): BaziChart {
  // 1. 用 lunar-javascript 获取农历和八字基础数据
  const solar = Solar.fromYmdHms(
    input.year, input.month, input.day,
    input.hour, input.minute ?? 0, 0
  );
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();

  // 2. 逐步计算各模块（注意顺序：hiddenStems 和 tenGods 依赖 fourPillars）
  const fourPillars = calculateFourPillars(eightChar);
  calculateHiddenStems(fourPillars);  // 将藏干写入 fourPillars 各柱
  calculateTenGods(fourPillars);      // 将十神写入 fourPillars 各柱（以日干为基准）

  const dayun = calculateDayun(eightChar, input.gender, input.year);
  const liunian = calculateLiunian(dayun, input.year);
  const shensha = calculateShensha(fourPillars);
  const wuxing = analyzeWuxing(fourPillars);
  const relations = findRelations(fourPillars);
  const pattern = detectPattern(fourPillars, wuxing);
  const kongwang = calculateKongwang(eightChar);

  // 3. 组装输出
  return {
    input,
    fourPillars,
    wuxing,
    relations,
    dayun,
    liunian,
    shensha,
    kongwang,
    mingGong: calculateMingGong(eightChar),
    taiYuan: calculateTaiYuan(eightChar),
    pattern,
    chengGu: calculateChengGu(lunar),
  };
}
```

#### 1.4 lunar-javascript 关键 API 参考

```typescript
import { Solar } from 'lunar-javascript';

// 从公历创建
const solar = Solar.fromYmdHms(1990, 8, 15, 14, 30, 0);
const lunar = solar.getLunar();
const eightChar = lunar.getEightChar();

// 四柱 — 返回干支字符串，需自行拆分
eightChar.getYear();        // "庚午" — 年柱
eightChar.getYearGan();     // "庚"   — 年干
eightChar.getYearZhi();     // "午"   — 年支
eightChar.getMonth();       // "庚申" — 月柱
eightChar.getMonthGan();    // "庚"
eightChar.getMonthZhi();    // "申"
eightChar.getDay();         // 日柱
eightChar.getDayGan();
eightChar.getDayZhi();
eightChar.getTime();        // 时柱
eightChar.getTimeGan();
eightChar.getTimeZhi();

// 十神 — 相对日干，返回中文字符串如 "偏财"
eightChar.getYearShiShenGan();   // 年干十神
eightChar.getMonthShiShenGan();  // 月干十神
eightChar.getTimeShiShenGan();   // 时干十神
// 注意：地支藏干的十神需自行根据藏干与日干关系推算

// 藏干 — 返回字符串（多个藏干以空格或固定格式拼接），需自行拆分
eightChar.getYearHideGan();   // 年支藏干，如 "丁己"
eightChar.getMonthHideGan();
eightChar.getDayHideGan();
eightChar.getTimeHideGan();

// 纳音
eightChar.getYearNaYin();    // "路旁土"
eightChar.getMonthNaYin();
eightChar.getDayNaYin();
eightChar.getTimeNaYin();

// 大运 — ⚠️ 参数为性别数字：1=男, 0=女（非字符串）
const yun = eightChar.getYun(input.gender === 'male' ? 1 : 0);
yun.getStartYear();               // 起运公历年
yun.getStartAge();                // 起运年龄（虚岁）
const daYunArr = yun.getDaYun();  // 大运数组（通常取前8步，共80年）
daYunArr[0].getStartAge();        // 第一步大运起始年龄
daYunArr[0].getGanZhi();          // "辛未" — 大运干支字符串

// 流年 — 从大运对象获取该步大运下的流年列表
const liuNianArr = daYunArr[0].getLiuNian();
liuNianArr[0].getYear();     // 流年公历年
liuNianArr[0].getGanZhi();   // 流年干支

// ⚠️ 神煞注意事项：
// lunar 提供的 lunar.getDayTianShen() / getDaySha() / getDayXiShen() 等
// 是"日课神煞"（某一天的择日信息），不是命盘神煞。
// 命盘神煞（天乙贵人、文昌星、驿马星、桃花、华盖、空亡等）
// 需在 shensha.ts 中根据四柱干支自行查表计算，lunar 没有直接提供。
```

#### 1.5 各模块实现要点

**mingGong.ts — 命宫**
命宫以出生月支和时支推算。口诀：虎（寅）月起子时，逆布十二支，与月支配合定命宫干支。

**taiYuan.ts — 胎元**
胎元 = 月干进一位，月支进三位。例：月柱庚申 → 胎元辛亥。

**chengGu.ts — 称骨**
按年月日时四柱各自对应重量表求和，查表输出命运描述。重量表为固定查询表，实现为纯查表函数。

**shensha.ts — 命盘神煞（自行实现，不依赖 lunar 日课接口）**
Phase 1 至少实现以下神煞，均为查表算法：
- 天乙贵人（以日干查年支/时支）
- 文昌贵人（以日干查时支）
- 驿马星（以年支/日支三合局查）
- 桃花（以年支/日支三合局查）
- 华盖（以年支查）
- 空亡（以日柱所在旬查，见 kongwang.ts）
- 羊刃（以日干查）
- 将星（以年支/日支三合局查）

#### 1.6 测试规范

每个模块对应一个测试文件。fixture 数据**必须**来源于多个权威万年历网站交叉验证后确认无误的结果。

```typescript
// packages/engine/__tests__/calculator.test.ts
import { describe, it, expect } from 'vitest';
import { calculateBazi } from '../src/calculator';

describe('calculateBazi', () => {

  // ✅ 已验证：1990-08-15 14:30 男
  // 年柱：庚午，月柱：庚申，日柱：丙辰，时柱：甲未
  // 日干丙火：年干庚=偏财，月干庚=偏财，时干甲=偏印
  it('1990-08-15 14:30 男 — 四柱验证', () => {
    const result = calculateBazi({
      year: 1990, month: 8, day: 15,
      hour: 14, minute: 30, gender: 'male',
    });

    // 四柱
    expect(result.fourPillars.year.stem).toBe('庚');
    expect(result.fourPillars.year.branch).toBe('午');
    expect(result.fourPillars.month.stem).toBe('庚');   // ✅ 庚申，非甲申
    expect(result.fourPillars.month.branch).toBe('申');
    expect(result.fourPillars.day.stem).toBe('丙');
    expect(result.fourPillars.day.branch).toBe('辰');
    expect(result.fourPillars.hour.stem).toBe('甲');
    expect(result.fourPillars.hour.branch).toBe('未');

    // 十神（以日干丙火为基准）
    expect(result.fourPillars.year.tenGod).toBe('偏财');   // 庚=丙的偏财
    expect(result.fourPillars.month.tenGod).toBe('偏财');  // 庚=丙的偏财
    expect(result.fourPillars.hour.tenGod).toBe('偏印');   // 甲=丙的偏印

    // 五行
    expect(result.wuxing.dayMasterStrength).toBeDefined();
  });

  // 边界用例：子时换日
  // lunar-javascript 默认不换日（23:00-23:59 仍属当日时柱"子"）
  // 如需换日流派，在 BaziInput 增加 midnightBranch: 'current' | 'next' 配置项
  it('子时边界 — 2000-01-01 23:30 女，默认不换日', () => {
    const result = calculateBazi({
      year: 2000, month: 1, day: 1,
      hour: 23, minute: 30, gender: 'female',
    });
    // 日柱应为 2000-01-01 对应日柱（不换日）
    // 时柱天干需根据日干五鼠遁推算"壬子"或"甲子"等
    expect(result.fourPillars.hour.branch).toBe('子');
    expect(result.fourPillars.day.stem).toBeDefined();
  });

  // 边界用例：闰月（公历日期正常，农历对应闰月不影响四柱计算）
  it('2023-03-23 08:00 男 — 农历闰二月不影响四柱', () => {
    const result = calculateBazi({
      year: 2023, month: 3, day: 23,
      hour: 8, gender: 'male',
    });
    expect(result.fourPillars.year.stem).toBe('癸');  // 2023 癸卯年
    expect(result.fourPillars.year.branch).toBe('卯');
  });

  // 边界用例：年份边界（立春前后月柱换年）
  it('1990-02-03 男 — 立春前属己巳年', () => {
    // 1990 年立春为 2 月 4 日，2 月 3 日仍属 1989 己巳年
    const result = calculateBazi({
      year: 1990, month: 2, day: 3,
      hour: 12, gender: 'male',
    });
    expect(result.fourPillars.year.stem).toBe('己');
    expect(result.fourPillars.year.branch).toBe('巳');
  });

});
```

**测试命令**：
```bash
pnpm --filter @bazi/engine test          # 跑一次
pnpm --filter @bazi/engine test:watch    # watch 模式
pnpm --filter @bazi/engine test:coverage # 覆盖率报告
```

#### 1.7 Phase 1 完成标准

- [ ] `calculateBazi()` 返回完整 `BaziChart` 对象，TypeScript 编译零错误
- [ ] 至少 50 个 fixture 测试用例通过（覆盖不同年代、子时、闰月、立春前后）
- [ ] 四柱、十神、藏干、纳音与权威万年历结果一致
- [ ] 大运排列正确（男顺女逆，起运年龄正确）
- [ ] 流年列表正确
- [ ] 神煞至少覆盖：天乙贵人、文昌、驿马、桃花、华盖、空亡、羊刃、将星
- [ ] 命宫、胎元、称骨计算正确
- [ ] 五行评分算法输出合理
- [ ] 格局判断覆盖基础格局（正官格、七杀格、正印格、偏印格、食神格、伤官格、正财格、偏财格）
- [ ] 刑冲合会害关系检测正确
- [ ] `pnpm --filter @bazi/engine build` 输出 ESM + CJS 双格式
- [ ] 导出类型定义 .d.ts
- [ ] 测试覆盖率 > 90%

---

### Phase 2：AI 解读服务 @bazi/ai-service

#### 2.1 初始化

```bash
cd packages/ai-service
pnpm init
pnpm add @bazi/engine   # workspace 依赖
pnpm add openai          # OpenAI SDK（兼容 DeepSeek 等）
pnpm add @anthropic-ai/sdk  # Claude
pnpm add @modelcontextprotocol/sdk  # MCP Server
pnpm add -D typescript vitest @types/node
```

#### 2.2 LLM Provider 抽象

```typescript
// packages/ai-service/src/llm/provider.ts
export interface LLMProvider {
  chat(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    stream?: boolean;
  }): AsyncIterable<string>;  // 统一流式输出接口
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
```

每个 LLM 实现一个文件（deepseek.ts / claude.ts / openai.ts），统一实现 `LLMProvider` 接口。切换模型只需换 provider 实例，上层代码零修改。

#### 2.3 Prompt 工程

System Prompt 模板结构：

```
你是一位精通八字命理的专业命理师，拥有30年实战经验。

## 排盘数据
{由 templates.ts 将 BaziChart JSON 转为自然语言格式}

## 参考古籍
{RAG 检索到的三命通会/渊海子平相关段落}

## 规则
1. 基于排盘数据分析，不要编造数据
2. 先总述命盘特征，再分析细节
3. 关注日主旺衰、格局、用神
4. 大运流年结合分析
5. 语言通俗易懂，避免过于晦涩
6. 不做绝对化断言，用"倾向于"、"可能"等措辞
```

`templates.ts` 负责将 `BaziChart` JSON 转为 Prompt 中的结构化文本。关键：**不要把原始 JSON 塞进 Prompt**，要转成命理师能理解的自然语言格式。

#### 2.4 MCP Server

```typescript
// packages/ai-service/src/mcp/server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { calculateBazi } from '@bazi/engine';

const server = new McpServer({ name: 'bazi-mcp', version: '1.0.0' });

server.tool('getBaziChart',
  {
    year: z.number(), month: z.number(), day: z.number(),
    hour: z.number(), gender: z.enum(['male', 'female']),
  },
  async (params) => {
    const chart = calculateBazi(params);
    return { content: [{ type: 'text', text: JSON.stringify(chart, null, 2) }] };
  }
);
```

#### 2.5 Phase 2 完成标准

- [ ] DeepSeek / Claude / OpenAI 三个 Provider 实现并可切换
- [ ] System Prompt 模板完成，BaziChart JSON → 自然语言转换器完成
- [ ] 流式输出正常工作（SSE）
- [ ] MCP Server 可通过 `npx` 启动
- [ ] 30 组「排盘 + 预期解读要点」评测集准备完成
- [ ] RAG 基础版完成（至少嵌入三命通会日干论述部分）
- [ ] Prompt A/B 测试框架（可切换 prompt 版本并对比评分）

---

### Phase 3：API 服务 @bazi/api

#### 3.1 初始化

```bash
cd packages/api
pnpm init
pnpm add @bazi/engine @bazi/ai-service  # workspace 依赖
pnpm add express cors helmet
pnpm add ioredis           # Redis 缓存
pnpm add prisma @prisma/client
pnpm add zod               # 参数校验
pnpm add jsonwebtoken bcryptjs
pnpm add -D typescript vitest @types/express @types/node
```

#### 3.2 核心路由

```
POST /api/bazi/chart
  Body: { year, month, day, hour, minute?, gender, timezone? }
  Response: BaziChart JSON
  缓存: Redis key = bazi:${md5(JSON.stringify(input))}，TTL 永久

POST /api/ai/chat
  Body: { chartId, message, conversationId? }
  Response: SSE 流（text/event-stream）
  Headers: { Authorization: Bearer <jwt> }

POST /api/auth/register
POST /api/auth/login
GET  /api/user/profile
GET  /api/health
```

#### 3.3 缓存策略

```typescript
// packages/api/src/services/baziService.ts
import Redis from 'ioredis';
import { calculateBazi, type BaziInput, type BaziChart } from '@bazi/engine';
import { createHash } from 'crypto';

const redis = new Redis(process.env.REDIS_URL!);

export async function getBaziChart(input: BaziInput): Promise<BaziChart> {
  const cacheKey = `bazi:${createHash('md5')
    .update(JSON.stringify(input))
    .digest('hex')}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached) as BaziChart;

  const chart = calculateBazi(input);
  await redis.set(cacheKey, JSON.stringify(chart)); // 永不过期（排盘结果确定性）
  return chart;
}
```

#### 3.4 Phase 3 完成标准

- [ ] 所有路由实现并有集成测试
- [ ] Redis 缓存命中率可监控
- [ ] JWT 鉴权正常
- [ ] SSE 流式推送 AI 回答
- [ ] Zod 参数校验覆盖所有输入
- [ ] Prisma schema 定义完成（User, BaziChart, Conversation, Message）
- [ ] docker-compose 可一键启动 PostgreSQL + Redis

---

### Phase 4：前端 @bazi/web

#### 4.1 初始化

```bash
cd packages/web
pnpm create next-app . --typescript --tailwind --app --src-dir=false
pnpm add @bazi/engine  # 前端也可直接调用引擎（离线排盘，无需后端）
```

#### 4.2 页面结构

| 路由 | 功能 | 备注 |
|------|------|------|
| `/` | 首页，生辰输入表单 | DatePicker + 时辰选择 |
| `/chart/[id]` | 排盘结果展示 | 四柱表格 + 五行雷达图 + 大运时间轴 |
| `/chat` | AI 对话 | SSE 流式 + Markdown 渲染 |
| `/chart/[id]/share` | 分享页（SSR） | 用于 SEO 和社交分享 |

#### 4.3 核心组件

- `BaziInput.tsx` — 日期选择 + 时辰选择（下拉，十二时辰）+ 性别
- `BaziChart.tsx` — 四柱表格可视化（天干、地支、藏干、十神、纳音分行显示）
- `WuxingRadar.tsx` — 五行力量雷达图（Recharts）
- `DayunTimeline.tsx` — 大运横向时间轴（可点击展开流年）
- `AiChat.tsx` — AI 对话窗口（SSE 消费 + Markdown 渲染 + 打字机效果）
- `RelationGraph.tsx` — 刑冲合会害关系图（可选，用 D3 或简单 SVG）

#### 4.4 Phase 4 完成标准

- [ ] 首页表单可正确提交并跳转到结果页
- [ ] 排盘结果页展示完整四柱信息
- [ ] 五行雷达图正确渲染
- [ ] 大运时间轴可交互
- [ ] AI 对话流式输出正常
- [ ] 移动端响应式完美
- [ ] 分享页 SSR 渲染正确

---

## 关键配置文件

### 根 package.json

```json
{
  "name": "bazi-ai",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2",
    "typescript": "^5.5"
  }
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

### tsconfig.base.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: bazi
      POSTGRES_PASSWORD: bazi_dev_123
      POSTGRES_DB: bazi_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

### .env.example

```bash
# Database
DATABASE_URL="postgresql://bazi:bazi_dev_123@localhost:5432/bazi_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# LLM API Keys
DEEPSEEK_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# JWT
JWT_SECRET=your-secret-key-change-in-production

# App
PORT=3001
NODE_ENV=development
```

---

## 开发调试命令速查

```bash
# === 安装 ===
pnpm install                               # 安装所有依赖

# === 单包开发（推荐，各阶段独立调试）===
pnpm --filter @bazi/engine dev             # 排盘引擎 watch 模式
pnpm --filter @bazi/engine test            # 跑引擎测试
pnpm --filter @bazi/engine test:watch      # 引擎测试 watch
pnpm --filter @bazi/engine test:coverage   # 覆盖率报告
pnpm --filter @bazi/engine build           # 构建引擎

pnpm --filter @bazi/ai-service dev         # AI 服务开发
pnpm --filter @bazi/api dev                # API 服务开发
pnpm --filter @bazi/web dev                # 前端开发

# === 全局命令 ===
turbo run dev                              # 启动全部（自动处理依赖顺序）
turbo run build                            # 构建全部
turbo run test                             # 测试全部

# === 基础设施 ===
docker compose up -d                       # 启动 PostgreSQL + Redis
docker compose down                        # 停止

# === 数据库 ===
pnpm --filter @bazi/api prisma generate    # 生成 Prisma Client
pnpm --filter @bazi/api prisma migrate dev # 运行迁移
pnpm --filter @bazi/api prisma studio      # 打开数据库 GUI
```

---

## 编码规范

1. **所有代码用 TypeScript**，strict 模式，不允许 `any`
2. **命名规范**：文件用 camelCase，类型用 PascalCase，常量用 UPPER_SNAKE_CASE
3. **中文命理术语**：类型定义中使用中文字面量类型（如 `type WuXing = '金' | '木' | '水' | '火' | '土'`），注释用中文，变量名用英文
4. **引擎函数必须是纯函数**：不访问数据库、不调用 API、不读取环境变量、不产生副作用
5. **错误处理**：引擎层抛自定义 Error（`BaziCalculationError`），API 层统一捕获转 HTTP 状态码
6. **日志**：API 层用 pino，引擎层不打日志
7. **测试**：引擎层覆盖率目标 > 90%，API 层 > 70%

---

## 注意事项与陷阱

1. **子时问题**：传统命理中，23:00-01:00 为子时。部分流派认为 23:00 后算下一天的日柱（子时换日），另一流派不换。lunar-javascript 默认不换日。需在 `BaziInput` 增加可选配置项 `midnightBranch?: 'current' | 'next'`，默认 `'current'`（不换日）。

2. **真太阳时**：严格排盘需要根据出生地经度修正真太阳时。Phase 1 暂不实现，`BaziInput` 已预留 `longitude?: number` 字段。

3. **lunar-javascript 的 `getEightChar()`** 返回的各方法结果为字符串，需要自行拆解为结构化数据。藏干字符串的拆分格式需实测确认（可能为 `"丁己"` 连续字符，每个汉字一个干）。

4. **十神推算**：以日干为"我"，其他天干与日干的关系确定十神。藏干中的十神也需要推算（根据藏干与日干关系）。lunar 提供的 `getXxxShiShenGan()` 只覆盖天干十神，地支藏干十神需自行计算。

5. **大运顺逆**：男命阳年顺排、阴年逆排；女命反之。lunar-javascript 的 `getYun(gender)` 已处理，传入 `1`（男）或 `0`（女），**不是字符串**。

6. **格局判断**：这是最复杂的部分，不同流派有分歧。Phase 1 先实现基础八格（正官、七杀、正印、偏印、食神、伤官、正财、偏财），后续迭代增加特殊格局（从格、化格等）。

7. **AI 解读不替代排盘计算**：AI 只负责"解读"引擎输出的数据，绝对不能让 AI 自行推算八字，大概率出错。

8. **fixture 数据必须交叉验证**：在多个权威万年历网站（如 `httpc://www.jingzhouying.com`、专业排盘软件）核对后方可写入 fixture，错误的 fixture 比没有测试更危险。
