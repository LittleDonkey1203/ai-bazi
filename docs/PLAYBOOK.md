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
git diff logic-frozen-2026-05-04 --name-only \
  | grep -E "src/core/|src/games/.*/(logic|engine|cantian|caseStorage|chatMemory|yongshen).*\.ts$|src/games/bazi/advancedAnalysis\.ts$|src/games/bazi/blind-three-pass/.*\.ts$|src/games/bazi/yongshen-v2/.*\.ts$|src/games/qinshi/(prompts|types)\.ts$|src/games/(types|index)\.ts$|src/masters/(service|prompts|config|types|index)\.ts$|src/utils/.*\.ts$|src/types/" \
  && stop || ok

# 5. node_modules 健康(腾讯管家事件后新增,batch 0 收尾后锁定)
cd zhouwenwang/zhouwenwang-divination-mobile && npm run check:deps
# 退出码非 0 → stop, 先 rm -rf node_modules && (npm ci || pnpm install --shamefully-hoist) 重建,
# 并检查腾讯管家(或其他系统加速类软件)是否仍开启 node_modules 清理

# 6. baseline 真值验证(2026-05-05 batch 1 教训新增,防"diff 输出为空但文件根本不在 commit"假阳性)
git ls-tree -r logic-frozen-2026-05-04 -- \
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
