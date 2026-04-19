# @bazi/engine

确定性八字排盘引擎 — 纯计算,无 AI,无副作用。相同输入必有相同输出。

基于 [6tail/lunar-javascript](https://github.com/6tail/lunar-javascript) 历法库。

## 安装

```bash
pnpm add @bazi/engine
```

## 快速开始

```typescript
import { calculateBazi } from '@bazi/engine';

const chart = calculateBazi({
  year: 1990, month: 8, day: 15,
  hour: 14, minute: 30,
  gender: 'male',
});

console.log(chart.fourPillars.year);
//   { stem: '庚', branch: '午', nayin: '路旁土',
//     hiddenStems: [...], tenGod: '偏印', ... }

console.log(chart.pattern);         // '偏印格'
console.log(chart.wuxing.dayMasterStrength);  // 'strong' | 'weak' | 'neutral'
console.log(chart.mingGong);        // { stem: '戊', branch: '寅', ... }
console.log(chart.dayun);           // 大运列表
```

## 输出结构

`BaziChart` 包含:

| 字段 | 说明 |
|---|---|
| `fourPillars` | 年/月/日/时 四柱(天干、地支、纳音、藏干、十神) |
| `wuxing` | 五行统计 + 日主强弱 + 喜忌 |
| `relations` | 刑冲合会害破暗合自刑 |
| `dayun` | 大运(前 9 步) |
| `liunian` | 流年(出生后 100 年) |
| `shensha` | 神煞(按年/月/日/时支分列,8 种基础) |
| `kongwang` | 空亡(日柱旬空 + 年柱旬空) |
| `mingGong` | 命宫 |
| `taiYuan` | 胎元 |
| `pattern` | 格局 |
| `chengGu` | 袁天罡称骨 |

## 算法要点

### 时柱 23:00 边界

采纳问真八字口径:23:00-23:59 属晚子时,**日柱仍为当日,但时柱按次日日干起五鼠遁**。例:

- 2000-01-01 23:30 → 日柱 戊午 + 时柱 甲子(用次日己未的日干 己 起五鼠遁)

### 命宫公式

```
命宫地支数 = 26 − (月支数 + 时支数);若结果 > 12,则减 12
```

月支/时支数用起寅表:**寅=1, 卯=2, 辰=3, ..., 亥=10, 子=11, 丑=12**。月支取月柱地支(节气月)。

命宫天干用年干五虎遁,把命宫地支当作"建月"求对应天干。

### 胎元

月干 +1,月支 +3。例:月柱庚申 → 胎元辛亥。

### 空亡(双输出)

同时输出:
- `kongwang.dayKong`:日柱旬空(标准)
- `kongwang.yearKong`:年柱旬空(问真八字等软件额外标注)

### 日主强弱

综合评分算法:
- **月令权重**(得令/失令最重):self 1.5 / gen 1.0 / leak -0.8 / cost -1.0 / ctrl -1.5
- **地支藏干通根**(月令 × 1.5)
- **天干生扶/克泄**

阈值:`>= 2.0 强`,`<= 1.2 弱`,其间中和(按 10 个交叉验证 fixture 拟合)。

### 格局判断(Phase 1 完整版)

流程:
1. **从弱格**:日主弱 + 通根 < 0.8
2. **从强格**:日主强 + 通根 > 5 + 无明显官杀食伤
3. **羊刃格**:月支 = 日主羊刃位(阳干)
4. **建禄格**:月支 = 日主禄位
5. **杂气格**(辰戌丑未月):中气/余气同五行透干定格
6. **本气定格**(非杂气月):以月令本气对日主的十神定格

待 Phase 2 补充:化气格、从格细分(从财/从官/从儿 等)。

### 神煞(Phase 1 八种基础)

天乙贵人、文昌贵人、驿马、桃花、华盖、空亡、羊刃、将星。

**双查规则**:天乙贵人、文昌贵人同时查年干和日干,任一命中即标。

Phase 2+ 扩充:福星贵人、太极贵人、国印贵人、德秀贵人、天厨贵人、月德、天德、天医、禄神、学堂、词馆、劫煞、亡神、红艳、魁罡、孤鸾、童子、孤辰、寡宿、丧门、吊客、天罗地网、阴差阳错、十恶大败、九丑、八专、十灵、六秀、披麻、勾绞、流霞、金舆 等 40+ 种。

## API

### `calculateBazi(input: BaziInput): BaziChart`

核心排盘函数。纯函数,无副作用。同输入必同输出,可安全缓存:

```typescript
const cacheKey = JSON.stringify(input);
```

### 错误处理

输入校验失败抛 `BaziCalculationError`(`year` 超 1900-2100、`month` 非 1-12 等)。

## 开发

```bash
pnpm install
pnpm --filter @bazi/engine test          # 跑一次
pnpm --filter @bazi/engine test:watch    # watch 模式
pnpm --filter @bazi/engine test:coverage # 覆盖率
pnpm --filter @bazi/engine build         # 构建 ESM + CJS + .d.ts
```

## 测试覆盖

10 个 fixture,经问真八字交叉验证,覆盖:

| 用例 | 特性 |
|---|---|
| 1990-08-15 14:30 男 | 普通 |
| 1985-06-20 10:30 女 | 普通 |
| 2000-12-05 18:00 男 | 从弱格 |
| 1978-11-11 08:00 女 | 大运逆行 |
| 2000-01-01 23:30 女 | 晚子时边界 |
| 1995-06-15 00:30 男 | 早子时边界 |
| 1990-02-03 12:00 男 | 立春前(归上一年) |
| 1990-02-05 12:00 女 | 立春后 |
| 2023-08-08 03:00 男 | 立秋节气交界 |
| 2023-04-15 09:00 女 | 农历闰二月 |

360 个单项断言全通过。

## 许可

MIT
