# UI 改造作战计划(Playbook)

> 这是 Claude Code 应该遵循的完整阶段化流程。每次会话开始时,Claude 应该先阅读此文档判断当前所处阶段。

## 阶段总览

```
Phase 0  环境与项目自适应    占位符替换、subagents/skills 就绪、MCP 安装
Phase 1  全站扫描            生成 docs/ui-inventory.md(脊柱)
Phase 2  设计规范定稿        填充 docs/design-system.md(色板/字体/中式元素白名单)
Phase 3  搭建底座(batch 0)  全局 tokens、useDevice、MobileTableCard、Layout 响应式
Phase 4  分批改造            按 batch 循环:改造 → 审计 → 视觉回归 → 提交
Phase 5  最终审计            三向对账、全局测试、视觉总览、生成 refactor-report.md
```

---

## Phase 0:环境与项目自适应

### 目标
让 Claude Code 探查当前项目,把模板中的 `[TODO]` 占位符全部填充为实际值。

### 步骤

1. **读取 CLAUDE.md.template**(若已重命名为 CLAUDE.md,直接读)
2. **探查项目**:
   - Read `package.json`(框架、依赖、scripts)
   - Read `tsconfig.json` / `vite.config.*` / `next.config.*`(技术栈细节)
   - Glob 顶层目录(`ls`)
   - 探查源码根、前后台目录、业务逻辑目录
   - 检测包管理器(看 `pnpm-lock.yaml` / `yarn.lock` / `package-lock.json`)
3. **替换占位符**:
   - 把 `CLAUDE.md.template` 重命名或保存为 `CLAUDE.md`(保留模板备份)
   - 同样处理 `.claude/settings.json.template` → `.claude/settings.json`
4. **安装 Playwright MCP**(指引用户终端运行):
   ```
   claude mcp add playwright npx @playwright/mcp@latest
   claude mcp list   # 验证
   ```
5. **审核与确认**:列出探查结果交给用户审核,等用户明确"OK 继续",再进入 Phase 1。

### 完成标准

- [ ] `CLAUDE.md` 中无 `[TODO]` 占位符
- [ ] `.claude/settings.json` 中 hooks 命令已根据项目实际工具配置
- [ ] `claude mcp list` 显示 playwright
- [ ] 用户已审核探查结果并确认

---

## Phase 1:全站扫描

### 目标
生成 `docs/ui-inventory.md`,这是改造的"脊柱",后续每个 batch 都依赖它。

### 步骤

调用 `scan-ui-inventory` skill,详见对应 `.claude/skills/scan-ui-inventory/SKILL.md`。

### 完成标准

- [ ] `docs/ui-inventory.md` 生成完毕
- [ ] 文件总数与 `find` 命令对账一致
- [ ] 用户已分配 batch 列(0/1/2/3...)
- [ ] 清单已 commit

---

## Phase 2:设计规范定稿

### 目标
完成 `docs/design-system.md`,定义色板、字体、断点、组件规范、中式元素白名单。后续所有 batch 都引用此文档。

### 步骤

1. **从 `docs/design-system.md.template` 起草**:
   - 让 Claude Code 读模板,再问用户偏好(主色、字体、纹样接受度)
   - 填充关键字段
2. **(可选)生成预览**:让 Claude 起草一个示例页面(如登录页),展示规范落地后的视觉,用户预览后再调整
3. **commit**:`docs(ui): finalize design system`

### 完成标准

- [ ] `docs/design-system.md` 无占位符
- [ ] 中式元素白名单明确(在哪些位置可以用、哪些不能)
- [ ] 用户视觉确认通过
- [ ] 已 commit

---

## Phase 3:搭建底座(batch 0)

### 目标
把基础设施代码就位:design tokens 引入项目、useDevice/MobileTableCard 等通用组件、全局 Layout 改为响应式。

### 步骤

1. **复制模板代码到项目实际目录**:
   - `.claude/templates/tokens.css.template` → 项目实际样式目录(常见 `src/styles/tokens.css`)
   - `.claude/templates/typography.css.template` → 同目录
   - `.claude/templates/useDevice.ts.template` → Vue 项目放 `src/composables/useDevice.ts`,React 项目放 `src/hooks/useDevice.ts`
   - `.claude/templates/MobileTableCard.template` → `src/components/MobileTableCard.{vue,tsx}`
   - 注意:模板中可能含两套版本(Vue/React 注释),Claude 要根据项目栈只保留一套
2. **在入口文件 import**:
   - 在 `main.ts` / `App.tsx` 等入口处引入 tokens.css 和 typography.css
   - 确认 Tailwind 配置(若有)能识别 CSS 变量
3. **改造全局 Layout**:
   - 把 inventory 中标记为 batch 0 的 Layout/Header/Footer 等文件改造为响应式
   - 移动端的 Header → hamburger 菜单 + 抽屉 Sidebar
4. **跑测试 + commit**:
   - `[lint command] && [test command]`
   - `git commit -m "ui(batch-0): infrastructure - tokens, useDevice, mobile layout"`

### 完成标准

- [ ] 所有 batch=0 文件 status=DONE
- [ ] 在浏览器开发者工具切到 375px 视口,所有现有页面**不崩**(可丑,但不报错、不溢出严重)
- [ ] 测试通过
- [ ] 已 commit

---

## 每个 batch 开始前必须验证(强制门禁)

每次开启一个新 batch(包括 batch 0 的各 step)前,必须机器化验证以下 6 项。任何一项不满足 → **立即停下补齐**,不进入 batch 实质工作。

### 输出形式要求(2026-05-05 batch 1 教训新增)

每条防线的执行结果**必须粘贴实际命令的 stdout + 退出码**到当前会话,不接受"已检查"、"通过"等声明性陈述。**没有粘贴输出 = 没跑**。

**触发原因**:batch 1 启动前曾"声明 5 道防线通过"但 baseline 真值未实际验证,改到 F001/F002/F013 才发现 mobile/src 大部分文件根本不在 git 里。详见 cleanup-backlog "移动工程 src baseline 缺失"。

```bash
# 1. 当前在 ui/refactor-2026-q2 改造分支(精确分支名,batch 0 收尾后锁定)
git branch --show-current | grep -q '^ui/refactor-2026-q2$' || stop

# 2. logic-frozen tag 存在
git tag -l | grep -q logic-frozen || stop

# 3. pre-commit hook 存在且可执行
[ -x .git/hooks/pre-commit ] || stop

# 4. (打开 batch 时)与 logic-frozen tag 的 diff 在业务逻辑层为空
# 当前活动 tag:logic-frozen-2026-05-10(指向 b6caf80,feat config env injection 之后)
# 历史 tag:logic-frozen-2026-05-04(指向 f1afabe,batch 1+2+3 baseline,保留供 audit 历史溯源)
git diff logic-frozen-2026-05-10 --name-only \
  | grep -E "src/core/|src/games/.*/(logic|engine|cantian|caseStorage|chatMemory|yongshen).*\.ts$|src/games/bazi/advancedAnalysis\.ts$|src/games/bazi/blind-three-pass/.*\.ts$|src/games/bazi/yongshen-v2/.*\.ts$|src/games/qinshi/(prompts|types)\.ts$|src/games/(types|index)\.ts$|src/masters/(service|prompts|config|types|index)\.ts$|src/utils/.*\.ts$|src/types/" \
  && stop || ok

# 5. node_modules 健康(腾讯管家事件后新增,batch 0 收尾后锁定)
cd zhouwenwang/zhouwenwang-divination-mobile && npm run check:deps
# 退出码非 0 → stop, 先 rm -rf node_modules && (npm ci || pnpm install --shamefully-hoist) 重建,
# 并检查腾讯管家(或其他系统加速类软件)是否仍开启 node_modules 清理

# 6. baseline 真值验证(2026-05-05 batch 1 教训新增,防"diff 输出为空但文件根本不在 commit"假阳性)
# 使用当前活动 tag:logic-frozen-2026-05-10(2026-05-09 重打,feat config env injection 之后)
git ls-tree -r logic-frozen-2026-05-10 -- \
  zhouwenwang/zhouwenwang-divination-mobile/src/core \
  zhouwenwang/zhouwenwang-divination-mobile/src/games \
  zhouwenwang/zhouwenwang-divination-mobile/src/masters \
  zhouwenwang/zhouwenwang-divination-mobile/src/utils \
  zhouwenwang/zhouwenwang-divination-mobile/src/types \
  | wc -l
# 必须 ≥ 62(2026-05-05 实测 72,阈值 = 实际 - 10);< 62 视为 baseline 缺失,立刻停下做 baseline 建立 commit
# 触发:2026-05-05 batch 1 baseline 缺失事件,登记 cleanup-backlog "移动工程 src baseline 缺失"
```

### 6 道防线执行规范:cwd 漂移防御(2026-05-05 batch 2 教训新增)

**强制要求**:6 道防线**每条命令独立 `cd D:/workspace/ai_bazi_zhouwenwang && <cmd>` 显式锚定 monorepo 根**,不依赖前序 cwd 状态。

**正例**:
```bash
cd D:/workspace/ai_bazi_zhouwenwang && git branch --show-current
cd D:/workspace/ai_bazi_zhouwenwang && git tag -l | grep logic-frozen
cd D:/workspace/ai_bazi_zhouwenwang && git ls-tree -r logic-frozen-2026-05-04 -- zhouwenwang/zhouwenwang-divination-mobile/src/core ... | wc -l
```

**反例**(本批 batch 2 启动时遭遇假阴性):
```bash
cd zhouwenwang/zhouwenwang-divination-mobile && npm run check:deps   # Gate 5,cwd 进入 mobile 子目录
git ls-tree -r logic-frozen-2026-05-04 -- zhouwenwang/zhouwenwang-divination-mobile/src/core ... | wc -l   # Gate 6
# 结果:0(假阴性)— 因为前一条 cd 后 cwd 已在 mobile 子目录,
#       第 6 条用相对路径 zhouwenwang/zhouwenwang-divination-mobile/src/core 在 mobile 子目录下不存在
#       立刻显示"baseline 真值 0 < 62"假违规,误以为需要重建 baseline
```

**触发原因**:batch 2 启动时 6 道防线 Gate 6 首次跑 `0`(假阴性),Bash 工具 cwd 在多次调用间持久化,Gate 5 `cd zhouwenwang/...` 后 cwd 进入 mobile 子目录,Gate 6 用相对路径 `zhouwenwang/.../src/core` 找不到目标。第二次跑(显式 `cd D:/workspace/ai_bazi_zhouwenwang &&`)立即得到正确值 72。

**机器化检查**:在 `.claude/agents/ui-auditor.md` 与本 PLAYBOOK 里**所有跑 6 道防线 / Push 前 6 项审核 / 业务保护红线核查的 git/wc/grep 命令前都必须前缀 `cd D:/workspace/ai_bazi_zhouwenwang &&`**,否则视为命令无效。

### 工程认知

`CLAUDE.md` 的硬性约束是**文档级保障**,可被遗忘 / 漂移 / 跨会话失效。**机器级保障(hook + tag + 自动审计)才是不可绕过的红线**。

这一对认知由 **batch 0 step E 前夕的 hook 缺失回溯审计**得出(2026-05-04)。当时发现 `.git/hooks/pre-commit` 从未存在,batch 0 期间业务逻辑保护完全靠 Claude 自觉。**事后审计虽证明无违规,但"靠自觉"本身就是缺陷**,自此引入此强制门禁段。

后续任何会话开始 batch 工作前,优先级:**机器门禁 > Claude 记忆 > CLAUDE.md 文字约束**。

---

## Phase 4:分批改造(核心循环)

### 目标
按 batch 顺序处理所有 UI 文件,每批走完整四步:改造 → 审计 → 视觉 → 决策。

### 步骤

调用 `refactor-batch` skill,对每个 batch(N=1, 2, 3, ...)循环。详见对应 `.claude/skills/refactor-batch/SKILL.md`。

### Batch 标准工作流(2026-05-05 batch 1 教训固化)

batch 1 实操出 6 段标准流程,固化下来给 batch 2-5 复用。**严格按顺序执行,缺一不可**。

#### 4.1 启动阶段

**A. 跑 6 道防线** — 见上节"每个 batch 开始前必须验证(强制门禁)",每条贴实际 stdout + 退出码。

**B. Stash + wip 分支安全锁**(任何 git 重大操作前):

```bash
git stash push -u -m "wip: pre-batch-N safety stash"
git branch wip/batch-N-YYYYMMDD-HHMM   # 在当前 HEAD 留快照点,不切过去
```

**强制使用场景**(任何超出"普通改文件 + commit"的 git 操作都必须先做这一步):
- 重写 tag(`git tag -f`)
- 跨边界 token 修订(改 batch 0 的 `src/index.css`)
- 任何 baseline / branch 结构调整
- push 前的最后一刻

**触发原因**:batch 1 baseline commit `f1afabe` 之前如果未做 stash + wip 安全锁,一旦 baseline add 后撤销操作出错,工作树 + 157 个新文件会丢。详见 cleanup-backlog "移动工程 src baseline 缺失"。

**C. inventory scope 锁定** — 从 `docs/ui-inventory.md` 取出 batch N 的所有文件列表,贴给用户口头确认 scope 才开工。

**D. 批前探查基于实际代码读取(2026-05-05 batch 2 教训新增)**

**强制要求**:批前对每个 scope 文件做"现状探查报告",**必须基于 Read 实际代码**,而非 inventory 备注 / 先验直觉 / 类比其他文件。报告必须包含:
1. 实际行数 + 实际 flex / grid 布局结构(逐行号引用)
2. 实际 hex / 字体栈 / inline style 的精确位置 + 行号
3. 实际是否已用 `useBreakpoint()` / `isMobile` / Tailwind `md:` 断点
4. 实际页面顶部标题 + 当前 styling
5. 修法清单按行号块标注,与上述探查项一一对应

**反例**(本批 batch 2 启动时被实测推翻的两个预测):
- **D1 六爻矩阵竖向预测**:批前依 inventory 备注"卦象六爻矩阵需移动端竖向适配"假设当前是横向 6 列;实测 Read F003 line 572-680 发现已是 6 行竖向堆叠,**真问题是结果容器 560px 固定**。
- **D2 < 360px 横滚必启用预测**:批前数学计算 `(320-32)/3 ≈ 95px < 100px` 推断必触发横滚兜底;实测 320 视口下九宫格收紧字号后能完整 3×3 显示,**横滚降级为无害保险丝**。

**触发原因**:inventory 备注是 Phase 1 扫描时的"问题假设",可能在后续 batch 间已被部分解决或方向被推翻;依赖备注会做错决策、写无效改造代码。

**正确流程**:
1. 用户拍板决策点 D1-Dx
2. Claude **先 Read 实际代码** → 给现状探查报告
3. 用户基于真实现状 + Claude 决策建议二次拍板(可能推翻初版决策)
4. **拍板后才 Edit**

**反流程**(批 2 之前一度采用的危险路径):用户拍板 → Claude 直接 Edit → 实测发现假设错误 → 回炉。

#### 4.2 改造阶段:中途质量门(每文件一闭环)

**不允许"全部改完一次性 commit"**。每改完**一个文件**(以 `git diff` 单文件为单位):

1. `npm test` — 必须 45/45(或当前基准)
2. `npm run typecheck` — 0 errors
3. **若有视觉变化** → dev server 跑起来 → **用户在浏览器实测 + 口头 ack**
4. ack 后才进入下一个文件

多个 ack 过的文件累积成一个 batch commit。**commit 时机由"全部 ack" 触发,不是"全部改完"**。

**触发原因**:batch 1 F001 HomePage hero `<Divider />` 在 DPR=1 屏完全不可见(0.5px × 0.3 opacity × 双端透明渐变三重弱化)。当时如果未做"逐文件用户 ack",会被埋进 batch commit push 后才发现。详见 cleanup-backlog "Divider token 数值修订"。

**例外:纯 token 替换可批量**(4 条同时为真才允许;任何一条不满足 → 逐文件 ack):
- ✅ 只把 hex 色换成 `var(--color-*)` 或 Tailwind token 类
- ✅ 不改任何布局类(`grid` / `flex` / `padding` / `margin`)
- ✅ 不加任何装饰组件(`<Seal>` / `<Divider>` / `<GuaWatermark>`)
- ✅ 不改字体(`font-serif` 等)

例外路径仍需 `npm test` + `typecheck` 通过。

#### 4.3 跨边界 token 修订流程

改造 batch N 期间发现 batch 0 的 token 数值有问题(如 batch 1 发现 Divider 不可见),按以下流程,**不允许混入 batch N main commit**:

1. **独立 commit**,prefix `fix(tokens):` 而非 `ui(batch-N):`
2. commit message **必须包含**:
   - `Refs: docs/cleanup-backlog.md <条目标题>`
   - `Cross-batch: 在 batch N 期间修 batch 0 token,已显式登记`
3. 同步更新 `docs/design-system.md` 对应数值
4. `docs/cleanup-backlog.md` 登记一条:**修订原因 / 实测证据(数值/截图) / 影响范围 / 遗留风险**

**范例**:commit `04d9af1` (fix(tokens): increase Divider visibility) — 实测 height 0.5px / opacity 0.3 → 1px / opacity 0.5,Refs cleanup-backlog "Divider token 数值修订"。

**触发原因**:batch 1 期间 Divider 不可见的问题如果混进 `ui(batch-1):` main commit,后续 git blame 时会误认为是 batch 1 改造引入,事故溯源失真。

#### 4.3.1 修法稳健性:数学化定位 + ≥3px 缓冲(2026-05-05 batch 2 教训新增)

**强制要求**:当存在数学化"溢出 / 边缘像素 / 容器尺寸不足"问题时,修法**必须预留 ≥ 3px 缓冲**应对字体渲染差异 / 不同 DPI / line-height 微调 / 浏览器引擎差异。**不要为"最小改动"牺牲稳健性**。

**典范流程**:
1. 数学计算实际溢出量(如:cell 高度 111px,内容总高 138px,**溢出 27px**)
2. 列出修法选项与"节省量":
   - 选项 1(最小改动):节省 28px → **缓冲 1px,不足**
   - 选项 2(组合修法):节省 32px → **缓冲 5px,稳健**
3. **优先选择 ≥3px 缓冲的修法**;选项 1 在不同字号/DPI 下可能裁剪复发
4. 浏览器实测验证缓冲在 320 / 375 / 桌面三视口下都生效

**触发原因**:batch 2 F004 地盘天干 mobile 不可见问题,选项 1(节省 28px,1px 缓冲)看起来"刚好够",但用户决策选了选项 1+2 组合(节省 ~32px,5px 缓冲)。实测验证 5px 缓冲在 320 极窄视口、不同浏览器渲染差异下都稳定显示。如果选了选项 1,可能在某些边缘条件(如 webfont 加载完成后字高变化)裁剪复发,需要 batch 2 末或 batch 3 再修。

**与 4.2 中途质量门的关系**:质量门要求每文件 ack 后才进下一个,如果数学缓冲不足导致回炉,会撞中途质量门(用户在浏览器实测时再次发现裁剪),整批节奏拖延。**预留 ≥3px 缓冲是"一次到位"的修法稳健性原则,与质量门相辅相成**。

#### 4.3.2 Tailwind CDN runtime JIT 限制(2026-05-08 batch 3 教训新增)

**现象**:Tailwind CDN runtime JIT 模式下,**动态字符串拼接的 className 不会触发 utility 生成**(仅静态字面量被识别)。例如 `className={`px-${value}`}` 或动态构造的 `${condition ? 'class-a' : 'class-b'}` 即便最终值合法也可能不被编译,导致样式在浏览器中不生效。

**例子**:F006 BaziCompactGrid 5 轮迭代中,⓱ 用动态 className 设置 cell padding(根据 `isCompact` 三元拼装),Tailwind CDN JIT 未识别 → 视觉缺失;㉘-fix 改用 inline `style={{ padding: ... }}` 替代,问题立即解决。

**处置原则**:
- 动态 / 条件式 className 不可靠时改用 **inline style** 替代
- 静态字面量优先使用 Tailwind utility(JIT 识别保证)
- 如必须使用条件 className,枚举所有可能值的**完整字面量**(让 JIT 静态扫描可见),禁止字符串模板拼接

**适用范围**:Tailwind CDN runtime 模式 + 动态字符串构造 + JIT 编译期识别要求(本工程全 batch 适用,与 design-system §1 对齐)。

#### 4.3.3 Playwright 自动测量诊断:视觉对不齐场景找 ground truth(2026-05-08 batch 3 教训新增)

**现象**:layout / 视觉对不齐场景靠直觉数学计算容易**遗漏 App-level / 容器层级约束**,导致多轮回炉。**用 Playwright `page.evaluate` 测量 `boundingClientRect / scrollWidth / clientWidth / getComputedStyle` 才能揭示真根因**。

**例子**:Step 2c W1c 阶段 D8 演进,凭直觉数学计算导致 4 阶段回炉(lg → xl → 2xl → 200px 左栏)。每阶段都用 Playwright 测量驱动决策:
- D8.lg:Playwright 揭示右栏 panel rect=682(< table 860)→ 推翻直觉
- D8.xl:5 视口实测发现 1280-1535 视口仍滚,1024 反而免
- D8.2xl:实测发现 1536+ 视口 panel rect=828(max-w 约束链)
- 最终 + M79 200px 左栏:5 视口(1024/1280/1440/1536/1920)全免滚 ✓

**处置原则**:
- layout / 视觉对不齐时**不要凭推测修法**,用 Playwright `page.evaluate` 测量 ground truth
- 写临时 `tests/diag/*.spec.ts` 跑多视口测量,得到精确数据再决定修法
- 测量后**立即删除临时脚本**(保留截图供视觉验收,git status 干净)

**适用范围**:响应式断点决策 / 容器宽度数学 / 元素溢出排查 / dashboard 类多层级嵌套布局。

#### 4.3.4 视觉对不齐先做数学诊断:box height + 换行 + line-height + 内层结构(2026-05-08 batch 3 教训新增)

**现象**:cell padding 对齐 / table 行高 / sticky 元素布局对不齐时,简单调 `padding/margin` 多次回炉。**先做数学诊断列出"box height + 换行 + line-height + 内层 div"四要素**,才能找到根因。

**例子**:F006 ㉝-㉞ 中日期 sticky cell 视觉对不齐,多次回炉:
- ㉗:`alignSelf` hack(后被 ㉝ overrule,根因不在 align)
- ㉘-fix:inline padding 替代(教训 4.3.2 适用,但仍未对齐)
- 最终 ㉝:date sticky cell 内层加 `leading-4` div 才解决
- 根因:line-height 影响 box height,需要**内层结构隔离**才能精确控制行高

**处置原则**:
- 视觉对不齐先列出"box height + 换行 + line-height + 内层 div"四要素数学
- 再决定修法(可能是内层结构 / line-height / padding / inline 控制其一)
- **不要"凭感觉"调 padding/margin** 期望对齐 — 大概率治标不治本

**适用范围**:cell padding 对齐 / table 行高 / sticky 元素布局 / 多行文本视觉等高 / 嵌套 flex/grid 子项视觉错位。

#### 4.3.5 跨语义 utility 复用判断:装饰类合并 vs 业务语义类保留(2026-05-08 batch 3 教训新增)

**现象**:≤5 漂移合并阈值在 batch 3 处置中暴露边界 — **同表面装饰类合并合理(如 surface-active / surface-hover / divider 等中性灰),跨业务语义类应保留 hex**(如喜用神暖色 / 过三关冷蓝 / textarea focus 黄铜 / user 气泡冷蓝 / assistant 气泡黄铜)。

**例子**:
- **M77 hover hex 保留**:`hover:bg-[#1d1d1d]` 与 M77 处置一致 — hover 视觉契约 batch 1+2 已建立,token 化会破坏跨批契约
- **M81 user 气泡 token 化**:user 气泡灰系合并到 `surface-hover/active`(同表面装饰类)
- **M81 assistant 气泡保留**:`bg-[#151311]` 暖色 — Cantian Style 主题完整性(跨业务语义)
- **M89-3 对比度保护**:active 数字色 `text-paper/60` 替代 `text-black/60`(绛红底配黑半透对比度退化)

**处置原则**:
- 合并到 token 前判断"装饰类(可合并)vs 业务语义类(保留 hex)"
- **装饰类**:同表面 / 同层级 / 中性灰白,无业务可识别性 → 合并 token
- **业务语义类**:主题色 / 状态色 / 业务可识别色(如阴爻灰 / 五行色 / 大师业务色 / Cantian 暖色 / 喜用神/过三关功能色)→ 保留 hex
- 保留 hex 时**同步登记 cleanup-backlog**,待 design-system 二阶段 token 系统补全统一处置

**适用范围**:所有 hex → token 化决策(每批 token 化高频触发)。

#### 4.3.6 Layout 改造前 Playwright 全栈测:三层约束链(2026-05-08 batch 3 教训新增)

**现象**:layout 改造前若仅看局部组件可用宽度,会**遗漏 App-level 约束链**(App-level Sidebar + 外层 max-w + 内层 grid template + panel padding)。**必须先用 Playwright 测量全栈数据再决定修法**,避免逐层发现引发多轮回炉。

**例子**:D8 4 阶段回炉的根因 = 之前 layout 数学只算到 dashboard 内部双栏,没识别**三层约束链**:
- App-level Sidebar `256px`(`Sidebar.tsx` 始终占用,所有视口)
- 外层 BaZiPage `max-w-7xl` = `1280px`(整页框架,与 LiuYao/QiMen 共享模板)
- dashboard 容器 `max-w-[1280px]`(被外层 padding 卡到 ~1248px)
- 双栏 `[300px_minmax(0,1fr)]` + `gap-6` → 右栏估算 ~924,实测 panel rect=828(panel padding 减去 ~96)
- 最终 M79 双栏左栏 300→200px + Playwright 5 视口实测才达成全免滚

**处置原则**:
- layout 改造前必先用 Playwright 测量"**App sidebar / 外层 max-w / 容器 max-w / 内部 grid template / panel padding**"五层全栈数据
- 数学复盘:列出每层级宽度收紧量,推算最终可用宽度,与内容 min-w 比对
- **多视口实测验证**(1024 / 1280 / 1440 / 1536 / 1920),含主流桌面 + 高分屏

**适用范围**:所有响应式 layout 改造(特别是大屏 dashboard 类页面 / 双栏布局 / 嵌套容器嵌套场景)。

#### 4.3.7 失效 utility 大面积下游症状的扩散控制

**触发场景**:Step 修法前 grep 发现某文件含 N 倍于段 scope 的失效 utility(如自定义 `brand-gray-*` 系列因 Tailwind config 缺失全部不渲染)。

**典型案例**:batch 4 Step 2a Block 1,F007 PalmistryPage 段 scope 仅 6 处 brand 残留,但 grep 发现全文 20 处 `text-brand-gray-300` / `bg-brand-gray-900` 类失效 utility(属 P0 工程债下游症状)。

**决策**:
- ❌ 不全文修复(违反三红线第一条 scope 蔓延)
- ❌ 不逐处 patch(治标不治本,应用层逐处修是低杠杆操作)
- ✅ **仅修段内目标,其余全部登记 backlog 不本批扩散**
- ✅ **配套动作**:Edit 前先 grep 失效 utility 清单(前置审计),避免 Edit 中途撞见再决策

**理由**:
- 失效 utility 是框架级 P0 工程债的下游症状,应用层逐处修是治标
- 段内逐处修 = scope 失控,从"段范围"变成"文件全清扫"
- backlog 登记保持视觉缺口在已知状态(保持 batch 3 之前的状态,未恶化)
- 等框架级 P0 修复(如 Tailwind config 补全)后批量回归测试 + 一次性修复

**配套实践**:
- 每个 Block 开 Edit 前先 grep 失效 utility(前置审计模式)
- 失效 utility 清单合并到现有同源 backlog 章节(避免章节膨胀)
- commit message 明确"段内 N 处修复,文件内 X 处保留登记 backlog"

#### 4.3.8 DOM computed style 优于 PNG 视觉判读

**触发场景**:视觉验证时,CC 判读 PNG 截图与用户肉眼实测结果**冲突**。

**典型案例**:batch 4 Step 2c-pre Block 5,CC 在 Playwright 移动端 baseline 截图中判定"zhougong/lifekline desktop hero 标题白色",但用户桌面浏览器肉眼实测 hero 是绛红渐变。事后查 DOM computed style 证实:hero 是 `linear-gradient(135deg, #f5f0e3 0%, #d4a03e 60%, #c41e3a 100%)` 渐变,**米白起始色 #f5f0e3 在黑底上低对比度被 CC 视觉判读为白色**。

**决策**:
- ✅ **DOM > PNG**:computed style 是 CSS rendered ground truth,视觉判读是间接观察
- ✅ **冲突时以 DOM 为准**:computed style 字符串匹配比 PNG 视觉判读可靠 100 倍

**实现模式**:
```javascript
// 用 Playwright evaluate 拿 DOM computed style
const bgImage = await h1.evaluate(el => getComputedStyle(el).backgroundImage);
const color = await h1.evaluate(el => getComputedStyle(el).color);
const bgClip = await h1.evaluate(el => getComputedStyle(el).webkitBackgroundClip);
expect(bgImage).toContain('rgb(196, 30, 58)');  // 期望 hex 出现在 computed style
```

**适用范围**:
- 渐变颜色验证(PNG 压缩损失渐变细节)
- text-transparent + bg-clip-text 类 trick(视觉判读不可靠)
- token 化 Δ=0 验证(不该有视觉变化的场景,避免假阳性)
- font-family / font-weight / line-height 等不易肉眼判定的 CSS 属性

**不适用范围**:
- 布局类问题(溢出 / flex 行为 / 响应式断点)—— 仍需 PNG + 手动测量
- 用户主观视觉感受("按钮太大" / "颜色不协调")—— 需要人眼参与

**配套实践**:
- Playwright spec 写 evaluate 语句获取 computed style + expect 字符串匹配
- 临时验证用 spec 文件验证完即删(不进 commit)
- 业务红线验证优先用 computed style 而不是 PNG 判读

#### 4.4 批末:视觉回归 + 重截 baseline

batch N main commit 之后、push 之前,按顺序:

**A. 跑视觉回归**

```bash
cd zhouwenwang/zhouwenwang-divination-mobile
npx playwright test tests/visual/baseline.spec.ts
```

**B. 分类每条 mismatch**

| 类别 | 处置 |
|------|------|
| 真 batch N 改造差异 | 写入 `docs/audit-batch-N.md` + 用户 ack 截图 |
| batch 0 / batch N-1 累积假阳性 | cleanup-backlog 登记,不动 |

**C. 跑 audit-batch skill** → 产出 `docs/audit-batch-N.md`,P0=0 才能 push。

**D. 重截 baseline**(独立 commit,在 main commit 之后):

```bash
npx playwright test --update-snapshots tests/visual/baseline.spec.ts
git add tests/visual/*-snapshots/
git commit -m "test(visual): re-baseline after batch N (X snapshots updated)"
```

**触发原因**:batch 1 实测,baseline `8d1dbac` (May 4 18:35) 早于 batch 0 layout commit `d76c5c6` (May 4 21:58),mobile liuyao / qimen 出现 5px scrollWidth 假阳性。**不每批重截 → 假阳性累积到 batch 5 全 fail → 视觉回归防线失效**。详见 cleanup-backlog "视觉回归 baseline 时机错配"。

#### 4.5 Push 前 6 项审核(全部贴实际命令输出)

| # | 项目 | 验证命令 | 通过条件 |
|---|------|---------|---------|
| 1 | commit message 完整 | `git log -1 --format=%B HEAD` | 含 `Refs:` + 业务约束验证段 |
| 2 | 文件范围 = batch N inventory | `git diff <prev-batch-tag> --name-only` | 与 inventory 列逐一对照 |
| 3 | logic-frozen tag 指向正确 | `git rev-parse logic-frozen-2026-05-04` | 仍指向 baseline commit(若本批未重打 tag) |
| 4 | 业务逻辑 diff = 空 | `git diff logic-frozen-2026-05-04 -- src/core/ src/games/*/logic.ts src/masters/{service,prompts,config,types,index}.ts src/utils/ src/types/` | 无输出 |
| 5 | pre-commit hook 实际跑过 | commit 时控制台有 hook 输出 / `[ -x .git/hooks/pre-commit ]` 验证可执行 | 通过 |
| 6 | dry-run push 通过 | `git push --dry-run origin ui/refactor-2026-q2` | 仅推到 ui/refactor-2026-q2,不触 deploy/render-monorepo |

任一项不通过 → **立即停**,修完重审 6 项。

**触发原因**:batch 0 收尾时 5 个 commit 误在 `deploy/render-monorepo` 分支完成,几乎触发 Render 生产自动部署(已通过 option C 修正 + pre-push hook 拦截)。详见 cleanup-backlog "batch 0 收尾后的分支结构修正"。第 6 项 dry-run 是 batch 1 没做但应做的 belt-and-suspenders。

#### 4.6 Push 后清理

Push 成功后**立即**清理启动阶段的安全脚手架:

```bash
git push origin ui/refactor-2026-q2  # 真实 push
git stash list | grep "pre-batch-N safety" && git stash drop <stash-id>
git branch -D wip/batch-N-YYYYMMDD-HHMM
```

**强制纪律**:任何阶段创建的 stash + wip 分支,都在 batch N push 完成后统一清理。**不允许"留作下批用"——下批用下批的安全脚手架,不复用上批的**。

**触发原因**:不清理 → 下批启动 6 道防线时 `git stash list` / `git branch` 残留迷惑判断"哪个是 wip / 哪个是真"。复用上批的 stash 还会让"本批 wip"与"上批未清理"语义混淆。

### 节奏建议

- 一天处理 1-2 个 batch(每 batch 含 6 段标准工作流)
- 每个 batch 完成后做一次冒烟测试(打开几个核心页面真机看一眼)
- 如果连续两个 batch 出现 P0 问题,停下复盘 design-system.md 是否有缺失

### 完成标准

- [ ] inventory 中除 SKIP 外全部 status=DONE
- [ ] 每个 batch 都有 audit-batch-N.md 和 visual-batch-N.md
- [ ] 所有 batch 已 commit 并 merge 回主分支

---

## Phase 5:最终审计

### 目标
做三向数量对账,跑全量测试和构建,生成 `refactor-report.md`,完成验收。

### 步骤

调用 `audit-batch` skill 的"模式 2"。详见 `.claude/skills/audit-batch/SKILL.md`。

### 完成标准

- [ ] A=B=C 对账通过
- [ ] D ≤ C_DONE
- [ ] 全部测试和构建通过
- [ ] 视觉回归无 P0
- [ ] `docs/refactor-report.md` 已生成并 commit

---

## 跨阶段原则

### 关于 commit

- 每个 batch 一个 commit,格式 `ui(batch-N): <描述>`
- 文档变更单独 commit:`docs(ui): <描述>`
- 不允许"大杂烩 commit"——发现混着改了多个 batch,必须 reset 重来

### 关于回滚

随时可用 `/rewind` 或 `git reset` 回滚:

- ui-refactorer 跑废一个 batch:`git reset --hard HEAD~1`(若已 commit)或 `/rewind`
- 整个改造方向不对(如设计规范不符合预期):`git checkout main` 重新规划

### 关于上下文管理

- 每个 batch 用一个独立会话(改造结束后 `/clear`)
- 上下文使用超过 60% 时,主动 commit 部分进度并新开会话
- 不在同一会话里跨 batch 工作

### 关于不确定

- Claude 遇到不确定的设计/代码决策,使用 AskUserQuestion 工具
- **绝不**基于"通常做法"或"看起来像"做修改
- 不确定时优先 Read / Grep,而不是猜

### 关于 baseline 真值(2026-05-05 batch 1 新增)

`git diff <tag> -- <path>` 输出为空有两种含义:
- **(a)** 真无改动
- **(b)** 文件根本不在 `<tag>` 指向的 commit 里

**仅靠 `git diff` 无法区分**。判断流程:

1. `git ls-tree -r <baseline-tag> -- <path>` 验证文件在 baseline 中存在
2. 不存在 → baseline 缺失,**先做 baseline 建立 commit**(`chore(repo): track ... as baseline`),再开始改造
3. 存在 → diff 空 = 真无改动

**触发**:batch 1 改 F001/F002/F013 时 `git status` 显示文件 untracked,溯源发现移动工程 fs 派生但未做完整 git add,baseline 缺失。`git diff logic-frozen-2026-05-04 -- src/core/` 之前一直输出空,但其实是因为 src/core/ 那时根本不在任何 commit 里。详见 cleanup-backlog "移动工程 src baseline 缺失"。

---

## PLAYBOOK 自身的迭代纪律(2026-05-05 新增)

每个 batch 启动 prompt 必须包含一项:

> "读 cleanup-backlog 中本批新登记的工程债,如果有'流程改进'类的,立即 propose 写入 PLAYBOOK。"

每个 batch 都可能暴露新的盲点,PLAYBOOK 必须随之进化。

**不允许**:
- ❌ 把"流程改进"类工程债拖到末批 batch 5 才一并处理
- ❌ batch 启动时跳过"PLAYBOOK 是否需要更新"的检查

**每次更新 PLAYBOOK 用独立 commit**,格式:
```
docs(playbook): incorporate batch N lessons (...)
```

**触发**:batch 1 期间登记 13+ 条 cleanup-backlog,其中"流程改进"类(baseline 真值 / 重截 baseline / dry-run / 中途质量门 等)如果不在 batch 1 末固化进 PLAYBOOK,batch 2 就会重复同样的盲点,导致"教训年年学,坑年年踩"。

**鉴别"流程改进"类工程债的快速判断**:
- ✅ 是流程改进:任何"下次应该 / 不应该……"句式的反思 — 写入 PLAYBOOK
- ✅ 是流程改进:任何会被多个 batch 复用的检查项 / 命令模板 — 写入 PLAYBOOK
- ❌ 不是流程改进:具体某个文件的 token 修订决策 — 留在 cleanup-backlog
- ❌ 不是流程改进:具体某个 commit 的事件溯源 — 留在 cleanup-backlog
