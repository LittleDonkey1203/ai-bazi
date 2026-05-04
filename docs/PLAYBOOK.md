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

每次开启一个新 batch(包括 batch 0 的各 step)前,必须机器化验证以下 4 项。任何一项不满足 → **立即停下补齐**,不进入 batch 实质工作。

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
```

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

### 推荐节奏

- 一天处理 1-2 个 batch(每 batch 含审计、视觉、决策、可能的修复)
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
