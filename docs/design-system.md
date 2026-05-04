# 设计系统(中式现代,移动端优先,深色主题)

> 工程:`zhouwenwang/zhouwenwang-divination-mobile/`
> 起草日:2026-05-04 / 改造期内权威文档,与本文档冲突的旧规范以本文档为准
> 基础约定:本工程为**深色主题**(`html { color-scheme: dark }`,正文白底版本不存在),所有 token 围绕"墨黑底 + 米白文字 + 绛红/黄铜点缀"展开
> 视觉北极星:仓库根 `zhouwenwang-mobile-ui.jsx`

## 0. 适用范围与定稿决策(2026-05-04 用户确认)

- 范围:仅 `zhouwenwang-divination-mobile/`(桌面工程冻结,bazi-mcp 非 UI)
- 主品牌色:**绛红 `#c41e3a`**(取代旧 `#FF9900` 在主 CTA / 激活态 / 关键品牌位的角色)
- 辅助色:**橙 `#FF9900`** 降级为次级 CTA / 状态/警示色
- 字体:正文沿用现代无衬线;**标题 / 品牌区 / 大师名**切换 `var(--font-serif-cn)`(系统宋体栈,首选 Songti SC / SimSun,**不引入 Noto Serif SC 远程字体**)
- CSS 方案:**Tailwind CDN + CSS 变量**(Approach A)。tokens 落 `src/index.css` 的 `:root`,Tailwind 内联 config 通过 `var(--color-*)` 引用。**不动构建链**
- 移动 UI 库:**不引入**。继续手写 + `lucide-react` + `framer-motion` + `@headlessui/react`
- 中式元素接受度:**中**(印章、毛笔分隔线作为装饰位允许使用,见 §5)
- 模板组件 `MobileTableCard`:**不使用**(本工程无后台、无数据表格)

## 1. 色彩(Design Tokens 三层结构)

### 1.1 第 1 层:原始色板(中国传统色 + 视觉北极星实际色值)

> 落地位置:`src/index.css` 的 `:root` 块,改造期间在 batch 0 一次性注入。

```css
:root {
  /* === 主品牌:绛红(取代旧橙)=== */
  --c-vermilion-700: #7a1f26;   /* 深绛(active) */
  --c-vermilion-500: #c41e3a;   /* 主绛红(brand) */
  --c-vermilion-400: #d6364f;   /* 浅绛(hover) */
  --c-vermilion-100: rgba(196, 30, 58, 0.12); /* 微绛(背景 tint) */
  --c-vermilion-line: rgba(196, 30, 58, 0.25); /* 描边 */

  /* === 辅助:黄铜(中式金色,装饰主力)=== */
  --c-bronze-700: #b8882a;
  --c-bronze-500: #d4a03e;       /* 主黄铜(分隔线 / accent text) */
  --c-bronze-100: rgba(212, 160, 62, 0.08);
  --c-bronze-line: rgba(212, 160, 62, 0.12); /* 卡片淡边主力 */
  --c-bronze-line-strong: rgba(212, 160, 62, 0.25);

  /* === 旧品牌橙(降级为辅助)=== */
  --c-orange-500: #ff9900;       /* 次级 CTA / warning */
  --c-orange-600: #e88800;       /* hover */
  --c-orange-100: rgba(255, 153, 0, 0.12);

  /* === 五行/卦象语义色(语义化映射,不可改用途)=== */
  --c-wood:   #2d8b5a;           /* 木 / 墨绿 / success */
  --c-fire:   #c41e3a;           /* 火 / 与主品牌同源 */
  --c-earth:  #b87333;           /* 土 / 铜锈 */
  --c-metal:  #d4a03e;           /* 金 / 与黄铜同源 */
  --c-water:  #2d7d9a;           /* 水 / 墨青 / info */

  /* === 装饰色(用量少)=== */
  --c-amethyst-500: #7b5ea7;     /* 紫,候补装饰 */

  /* === 米白系(深底之上的文字层)=== */
  --c-paper-50:  #fffaf2;        /* 最亮 */
  --c-paper-100: #f5f0e3;        /* 主文本 */
  --c-paper-300: #c9bfaa;        /* 次文本 */
  --c-paper-500: #8a7d6b;        /* 三级文本 / 描述 */
  --c-paper-700: #6b6050;        /* 标签 / 弱化文本 */
  --c-paper-900: #4a4030;        /* 极弱 / placeholder / 已禁用 */

  /* === 墨黑(背景层)=== */
  --c-night-base:     #0a0a0f;   /* 页面底 */
  --c-night-elevated: #12120f;   /* 卡片 / 模态 */
  --c-night-input:    #0d0d0a;   /* 表单内嵌 */
  --c-night-overlay:  rgba(10, 10, 15, 0.95); /* 底部 nav 半透 */
}
```

### 1.2 第 2 层:语义色(组件**只能**引用这一层)

```css
:root {
  /* 背景 */
  --color-bg-base:     var(--c-night-base);
  --color-bg-elevated: var(--c-night-elevated);
  --color-bg-input:    var(--c-night-input);
  --color-bg-overlay:  var(--c-night-overlay);

  /* 文本 */
  --color-text-primary:   var(--c-paper-100);
  --color-text-secondary: var(--c-paper-300);
  --color-text-tertiary:  var(--c-paper-500);
  --color-text-muted:     var(--c-paper-700);
  --color-text-disabled:  var(--c-paper-900);
  --color-text-brand:     var(--c-vermilion-500);
  --color-text-accent:    var(--c-bronze-500);

  /* 品牌 */
  --color-brand:        var(--c-vermilion-500);
  --color-brand-hover:  var(--c-vermilion-400);
  --color-brand-active: var(--c-vermilion-700);
  --color-brand-subtle: var(--c-vermilion-100);
  --color-brand-line:   var(--c-vermilion-line);

  /* 辅助(黄铜) */
  --color-accent:       var(--c-bronze-500);
  --color-accent-hover: var(--c-bronze-700);
  --color-accent-line:  var(--c-bronze-line);
  --color-accent-line-strong: var(--c-bronze-line-strong);

  /* 状态 */
  --color-info:    var(--c-water);
  --color-success: var(--c-wood);
  --color-warning: var(--c-orange-500); /* 旧品牌橙降级 */
  --color-danger:  var(--c-vermilion-700); /* 同色系但更深,与 brand 区分 */

  /* 边框(深底常用淡黄铜)*/
  --color-border:        var(--color-accent-line);
  --color-border-strong: var(--color-accent-line-strong);
  --color-border-focus:  var(--color-brand);

  /* 五行(语义化,只能用在五行展示)*/
  --color-element-wood:  var(--c-wood);
  --color-element-fire:  var(--c-fire);
  --color-element-earth: var(--c-earth);
  --color-element-metal: var(--c-metal);
  --color-element-water: var(--c-water);
}
```

### 1.3 第 3 层:组件 token

```css
:root {
  /* 主按钮(渐变绛红,延续视觉北极星)*/
  --button-primary-bg: linear-gradient(135deg, var(--c-vermilion-500), var(--c-vermilion-700));
  --button-primary-text: var(--c-paper-100);
  --button-primary-shadow: 0 8px 24px rgba(196, 30, 58, 0.3);

  /* 次级按钮(黄铜) */
  --button-secondary-bg: linear-gradient(135deg, var(--c-bronze-500), var(--c-bronze-700));
  --button-secondary-text: var(--c-night-base);

  /* 三级按钮(透明 + 黄铜描边) */
  --button-ghost-bg: transparent;
  --button-ghost-text: var(--c-bronze-500);
  --button-ghost-border: 0.5px solid var(--color-accent-line);

  --button-radius: 14px;
  --button-radius-pill: 20px;     /* tag / chip 用 */

  /* 卡片(参考北极星实际数值)*/
  --card-bg:      var(--color-bg-elevated);
  --card-border:  0.5px solid var(--color-accent-line);
  --card-border-hl: 1px solid var(--color-brand-line);   /* 高亮态 */
  --card-radius:  16px;
  --card-padding: 16px;

  /* 输入 */
  --input-bg:           var(--color-bg-input);
  --input-border:       0.5px solid var(--color-accent-line);
  --input-border-focus: 1px solid var(--color-brand);
  --input-radius:       12px;
  --input-height-mobile: 44px;     /* hit target ≥ 44 */
  --input-color:        var(--color-text-primary);

  /* 印章(中式装饰组件,见 §5)*/
  --seal-size-sm: 24px;
  --seal-size-md: 36px;
  --seal-size-lg: 48px;
  --seal-border:    2px solid var(--color-brand);
  --seal-border-off: 2px solid rgba(196, 30, 58, 0.25);
  --seal-bg:        rgba(196, 30, 58, 0.12);
  --seal-rotate:    -3deg;

  /* 毛笔分隔线 */
  --divider-line: linear-gradient(90deg, transparent, var(--c-bronze-500), transparent);
  --divider-opacity: 0.3;
  --divider-thickness: 0.5px;

  /* 间距阶梯(4px 倍数)*/
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* 字号阶梯(已含移动端覆盖见 §6)*/
  --font-xs:   11px;
  --font-sm:   12px;
  --font-base: 13px;     /* 移动端正文偏小,与北极星一致 */
  --font-lg:   14px;
  --font-xl:   17px;
  --font-2xl:  22px;
  --font-3xl:  26px;     /* 主标题 */

  /* 阴影 */
  --shadow-card:   0 2px 12px rgba(0, 0, 0, 0.3);
  --shadow-button: 0 8px 24px rgba(196, 30, 58, 0.3);

  /* z-index */
  --z-dropdown: 1000;
  --z-sticky:   1020;
  --z-modal:    1050;
  --z-popover:  1070;
  --z-tooltip:  1080;
  --z-bottom-nav: 100;   /* 与北极星一致 */
  --z-toast:    1090;
}
```

### 1.4 Tailwind CDN 配置(在 `index.html` 内联,引用 CSS 变量)

```html
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          /* 旧 brand-* 保留(避免 batch 期间 .tsx 内 className="bg-brand-orange" 大面积变红) */
          'brand-black':  '#000000',
          'brand-white':  '#FFFFFF',
          'brand-gray':   '#CCCCCC',
          'brand-orange': 'var(--c-orange-500)',  // @deprecated batch 5 末批移除,新代码用 brand-aux

          /* 新增,改造期 className 优先使用这一组 */
          'brand':        'var(--color-brand)',
          'brand-hover':  'var(--color-brand-hover)',
          'brand-subtle': 'var(--color-brand-subtle)',
          'accent':       'var(--color-accent)',
          'paper':        'var(--color-text-primary)',
          'paper-2':      'var(--color-text-secondary)',
          'paper-3':      'var(--color-text-tertiary)',
          'night':        'var(--color-bg-base)',
          'night-2':      'var(--color-bg-elevated)',
          'wood':         'var(--color-element-wood)',
          'fire':         'var(--color-element-fire)',
          'earth':        'var(--color-element-earth)',
          'metal':        'var(--color-element-metal)',
          'water':        'var(--color-element-water)',
        },
        fontFamily: {
          serif: ['Songti SC', 'STSong', 'SimSun', 'FangSong', 'serif'],
        },
      },
    },
  }
</script>
```

> ⚠️ Tailwind CDN 不能识别 `var(...)` 在 `colors` 里直接做 utility(如 `bg-brand` 会编译成 `background-color: var(--color-brand)` —— 这一步 CDN 是支持的)。`var()` 在 `colors` 字段是合法的:CDN 模式下生成 `background-color: var(--color-brand)` 是有效 CSS。**已验证可行**。

### 1.4.1 brand-orange Deprecation 政策

- `brand-orange` Tailwind 类处于 deprecation 期,**batch 0 ~ 4 不允许新增使用**,已存在使用保留至 batch 5 统一清理
- ui-auditor 会在每个 batch 检查 `git diff` `+` 号行的 `brand-orange` 新增,违反 → 警告(详见 `.claude/agents/ui-auditor.md` 检查 11)
- 新代码用法:
  - 主 CTA / 激活态 → `bg-brand` / `text-brand`
  - 次级 CTA / warning → 用 `var(--color-warning)` 或新增 utility `bg-brand-aux`(在 Tailwind config 显式映射:`'brand-aux': 'var(--color-warning)'`)
- batch 5 统一清理时,把所有 `brand-orange` 用法按上述用法替换,然后从 `index.html` 内联 config 中删除 `brand-orange` 键

## 2. 字体

### 2.1 字体栈

```css
:root {
  --font-sans:
    -apple-system, BlinkMacSystemFont,
    "PingFang SC",
    "HarmonyOS Sans",
    "Microsoft YaHei",
    Helvetica, Arial, sans-serif;

  --font-serif-cn:
    "Songti SC",
    "STSong",
    "SimSun",
    "FangSong",
    serif;

  --font-mono:
    "SF Mono", "Cascadia Code", "JetBrains Mono",
    Consolas, "Courier New", monospace;
}

body { font-family: var(--font-sans); }
.font-serif { font-family: var(--font-serif-cn); }   /* 与 Tailwind 配置呼应 */
```

### 2.2 字体加载策略

- **不加载 Google Fonts CDN**。视觉北极星 `.jsx` 用 `https://fonts.googleapis.com/css2?family=Noto+Serif+SC:...` 是 mockup 便利,**生产不要这么做**(国内可达性差、首屏体积、隐私)。
- 优先**走系统字体栈**:Windows 上 `SimSun`/`Microsoft YaHei`、macOS 上 `Songti SC`、Android `Noto Serif CJK`。三大平台都自带,大多数情况无须自托管字体文件。
- **不自托管字体。系统字体栈是唯一方案。** 如未来用户反馈中文衬线效果不一致(如 Linux 用户),先调降级链顺序,最后才考虑自托管,且需单独立项评审,不在本改造范围内。

### 2.3 字体使用约定

| 位置 | 字体 | 字重 |
|------|------|------|
| 全局正文、表单、按钮文字 | `--font-sans` | 400 |
| 各页 h1(页面标题) | `--font-serif-cn` | 500 |
| HomePage hero 大标题 | `--font-serif-cn` + 渐变 text | 500 |
| 大师名字(MasterSelector / Sidebar / BottomNav 激活) | `--font-serif-cn` | 500 |
| 卦名 / 卦辞 / 命盘字段名 | `--font-serif-cn` | 500 |
| AI 流式输出正文 | `--font-sans` | 400(可读性优先,**不切宋体**) |
| 数字(五行计数 / 大运年份)| `--font-mono` 或 `tabular-nums` | 400 |
| 印章字符 | `--font-serif-cn` | 500 |

### 2.4 行高与字号(中文)

- 中文正文:`line-height: 1.7`(中文比英文需要更大行距)
- 中文标题:`line-height: 1.3`
- AI 流式输出 / Markdown 长文:`line-height: 1.8`(有效降低阅读疲劳)

## 3. 断点

继承现有 `useBreakpoint` 契约(见 `src/hooks/useBreakpoint.ts`,**不改动**):

| 名称 | 范围 | 行为 |
|------|------|------|
| `mobile` | `< 768px` | 隐藏 Sidebar,显示 BottomNav,主内容左右无外边距,`paddingBottom: 5rem` |
| `tablet` | `768 – 1023px` | 显示 Sidebar(可折叠),不显示 BottomNav |
| `desktop` | `>= 1024px` | 显示 Sidebar(默认展开),不显示 BottomNav |

**核心切换点**:`md` (768px)。所有响应式样式以这个断点为分水岭。

> 禁止在组件里直接写 `window.innerWidth < 768`;一律走 `useBreakpoint()` hook。Tailwind utility 类的 `md:` `lg:` 也允许(数值与上表一致)。

## 4. 圆角 / 阴影 / 间距

- 圆角:卡片 16px、按钮 14px、tag/chip 20px(pill)、印章 4px(方正)。**与北极星一致,偏圆润而非纸面感**(因为深色主题需要轻盈感)
- 阴影:深色主题阴影默认不可见,主要用**外发光**(主按钮 `0 8px 24px rgba(196,30,58,0.3)`),其他位置不要堆叠阴影
- 间距:用 `var(--space-N)` 或 Tailwind utility(`p-4` = 16px / `gap-2` = 8px,数值与本表对齐)

## 5. 中式元素白名单(接受度:中)

### 5.1 ✅ 允许使用的位置

| 位置 | 元素 | 落地组件 / 类名 |
|------|------|------|
| BottomNav 激活态指示 | 4px 黄铜小圆点 + 宋体标签(`font-serif`) | `S009 BottomNav.tsx`(已存在,batch 0 接 token) |
| HomePage hero | 渐变文字 `linear-gradient(135deg, #f5f0e3, #d4a03e 60%, #c41e3a)`、宋体大标题、毛笔分隔线 `<Divider />` | `F001 HomePage.tsx`(batch 1) |
| 占卜功能卡片(首页 grid) | 角落卦象水印 `opacity: 0.06`(`☰☲☵☳☴☱` lucide 之外) | `F001 HomePage.tsx`(batch 1) |
| MasterSelector 大师卡 | **印章组件 `<Seal />`** —— 红色方框 + 单字 + `transform: rotate(-3deg)` | `F013 MasterSelector.tsx`(batch 1)新增 `components/decor/Seal.tsx` |
| 占卜结果分段 | 三色标记 `【卦辞】黄铜` / `【解析】绛红` / `【建议】墨绿` | `F003 LiuYaoPage / F004 QiMenPage / F008 ZhouGongPage / F005 BaZiPage` 共用 `MarkdownRenderer` 增主题色 prop |
| 八字命盘五行展示 | 五行语义色 `var(--color-element-*)` | `F005 BaZiPage / F006 BaziCompactGrid`(batch 3) |
| AI 流式输出大师署名 | 印章 + 大师名 "{name} 为您解卦" | `F017 StreamingMarkdown` 头部插槽(batch 5) |
| SettingsModal tabs | 毛笔分隔线 `<Divider />` 用作章节分割 | `F015 SettingsModal`(batch 5) |
| MarqueeNotification | 微黄铜底色 `--c-bronze-100`,字色 `--c-paper-700` | `F020 MarqueeNotification`(batch 5) |

### 5.2 ❌ 严禁使用中式元素的位置

- **功能图标**:lucide-react 保持(放大镜 / 关闭 / 上传 / 钩选 / 加号 等)
- **input / textarea 控件本身**:边框、内边距、focus 状态保持现代清晰,印章/纹样不能干扰输入
- **表格 / 数据展示**:八字四柱矩阵、人生K线 chart 内部保持简洁数据视觉(色彩可用语义五行色,**纹样不加**)
- **错误 toast / loading 指示**:`F019 ErrorToast` 保持中性色 + 标准图标;loading 沿用 lucide spinner(允许换色为 `--c-bronze-500`,但不要换成"墨晕扩散"动画 —— 性能与可读性优先)
- **recharts 图表元素**:K线 / Bar / Tooltip 配置保持默认形态,色彩可走 `--color-element-*` 五行色
- **headlessui Dialog 内部**:遮罩 + 关闭按钮 + 焦点环保持标准
- **Markdown 内文(非头部署名)**:由 AI 生成,装饰会干扰可读性

### 5.3 关键装饰组件清单(batch 0 时新增)

放置目录:`src/components/decor/`(新目录,**不污染** `common/` 通用组件)。

| 文件 | 职责 |
|------|------|
| `Seal.tsx` | 印章组件,props: `char` `active` `size` |
| `Divider.tsx` | 毛笔分隔线,props: `label?`(中间标记符) |
| `GuaWatermark.tsx` | 卦象水印,props: `symbol` `color` `opacity?` |

> 这三个组件必须 SSR 安全、零业务依赖、有 vitest 用例,`framer-motion` 仅用于 hover/active 微动效。

## 6. 移动适配规则(本工程具体落实)

### 6.1 字号微调

```css
@media (max-width: 768px) {
  :root {
    --font-3xl: 22px;   /* 26 → 22 */
    --font-2xl: 17px;   /* 22 → 17 */
  }
  body { font-size: 13px; }   /* 与北极星密度一致 */
}
```

### 6.2 组件适配点

- **SettingsModal(F015)** :`< md` 时全屏 + 顶部安全区,关闭按钮置顶部右侧;长表单按 tabs 拆分
- **BaZiPage(F005)**:四柱矩阵 / 神煞 grid 在 `< md` 时 `overflow-x: auto`,允许横滚;`xl:hidden` 桌面专属侧栏在 mobile 隐藏
- **LifeKlinePage(F009 / F010 KlineChart)**:K 线在 `< md` 时高度从 320 → 240,`recharts ResponsiveContainer` 自适应
- **PalmistryPage(F007)**:文件拖拽改为"点击选择文件"按钮触发 input(`accept="image/*" capture`,移动端会唤起相机/相册)
- **HistoryList(F014)**:`< md` 时列表项卡片化(图标 + 标题 + 时间 + 简述,删除按 swipe 或长按)
- **MarkdownRenderer / StreamingMarkdown(F016/F017)**:`< md` 时正文 13px,代码块字号 11px,行高 1.8

### 6.3 hit target

- 所有可点击元素:`min-height / min-width 44px`
- BottomNav 每项:`height: 64px`(已存在)
- input 在移动端:`height: 44px`(`--input-height-mobile`)
- 关闭按钮 / 删除按钮:不小于 44×44 触摸区(可视图标更小,但触摸区要补足)

## 7. 动效

- 时长:`< 300ms`(超出会拖累移动端体验)
- 缓动:`ease-out`(符合"墨晕"自然感)
- 入场:`fade + 微 translateY(8px)`,**不要弹性**
- `framer-motion` 已在依赖中,沿用其 `motion.div`、`AnimatePresence`
- **禁用**:背景视差、3D 翻转、墨水扩散粒子动画(性能 + 可读性损失)
- 已存在的页面切换动效(`MainContent`)保持,只接 token

## 8. 可访问性 (a11y)

- 颜色对比度:深底白字 `#f5f0e3 on #0a0a0f` ≈ 14.8:1 ✅;次文本 `#c9bfaa` ≈ 9.4:1 ✅;三级 `#8a7d6b` ≈ 5.0:1 ✅;`#6b6050` ≈ 3.5:1 ⚠️ 仅用于辅助标签,**不要用于正文**
- 焦点环:**保留**键盘 focus 样式,色 `var(--color-border-focus)`
- 装饰性 SVG / 印章:加 `aria-hidden="true"`
- BottomNav 激活态:`aria-current="page"`(已存在)
- MarqueeNotification:`aria-live="polite"` 不打断屏幕阅读器

## 9. 性能预算

- 首屏 CSS 增量(本次改造,即新增 token + decor 组件样式):**< 8 KB**(token 文件本身约 4 KB,gzip 后 < 2 KB)
- 字体文件:**0 KB**(走系统字体栈,不自托管)
- bundle size 总增量:**< 5%**(仅新增 3 个 decor 组件 + 视觉回归基建,不引入任何新依赖)
- 视觉回归基线截图:`tests/visual/__snapshots__/`(`.gitignore` 排除生成产物,只 commit 基线)

## 10. 改造单文件 checklist(每个 batch 改文件时对照)

- [ ] 颜色:旧 `#FF9900` → 视情况替换为 `var(--color-brand)`(主 CTA / 激活)或保留 `var(--color-warning)`(状态提示位)
- [ ] 颜色:其他硬编码 hex → `var(--color-*)` 或 Tailwind `bg-brand` `text-paper` 等 utility
- [ ] 间距:用 `var(--space-*)` 或 Tailwind 数值类(`p-4` `gap-2`),不要再用零散 `style={{ padding: 12 }}`
- [ ] 响应式:页面 / 关键 grid 需要 `useBreakpoint()` 或 Tailwind `md:` 分级(参考各文件 inventory 备注)
- [ ] 标题层切换 `font-serif`(品牌 / 章节标题 / 大师名 / 卦名)
- [ ] hit target:可点击元素 ≥ 44×44(尤其在 mobile)
- [ ] 中式装饰仅在 §5.1 白名单位置使用(印章 / 毛笔分隔线 / 卦象水印 / 五行色)
- [ ] **业务逻辑零改动**(props 接口签名 / state / store 调用 / API 一字不变)
- [ ] **测试零改动**(`__tests__/` 不动,如需为新装饰组件加测试,在 `src/components/decor/__tests__/` 新建)
- [ ] 未新增使用 `brand-orange` Tailwind 类(已有保留,新增禁止;详见 §1.4.1)
- [ ] 视觉回归:对照 batch 0 的 baseline 跑一次,允许的差异需在 PR 描述里 ack
- [ ] Electron 兼容:涉及 Layout / 路由 / 全局浮窗(F022 / F023)的改动后跑一次 `npm run build:electron`

## 11. 不在本设计系统范围内

- 国际化(只支持简中)
- 浅色主题切换(强制 dark)
- 后台 / 管理 / 数据表格(本工程无)
- 登录注册 / 404 / 鉴权流程(本工程无)
- 邮件模板(无)
- `MobileTableCard`(用户已确认跳过)
- `zhouwenwang/zhouwenwang-divination/`(原桌面工程冻结)

如后续新增上述场景,本文件需扩展(不要静默添加约定)。
