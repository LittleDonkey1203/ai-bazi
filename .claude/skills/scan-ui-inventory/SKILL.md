---
name: scan-ui-inventory
description: 当用户要求"扫描项目 UI"、"生成 UI 清单"、"开始 UI 改造的第一步"时使用。会派遣 ui-scanner subagent 扫描全项目并生成 docs/ui-inventory.md。
---

# 扫描 UI 清单(Phase 1)

## 何时使用

- 用户说"扫描项目"、"生成 UI 清单"、"开始改造"、"做 Phase 1"
- `docs/ui-inventory.md` 不存在或需要重新生成

## 前置条件

- `CLAUDE.md` 中所有 `[TODO]` 占位符已被替换为实际值(项目初始化已完成)
- `docs/design-system.md` 至少有骨架(可以稍后细化)

如果占位符还在,先引导用户做 Phase 0 初始化:让 Claude Code 探查项目并填充 `CLAUDE.md`。

## 步骤

### 1. 检查前置

```
- Read CLAUDE.md,确认无 [TODO] 占位符
- Glob `.claude/agents/ui-scanner.md` 确认 subagent 存在
- Bash `mkdir -p docs` 确保目录存在
```

### 2. 派遣 ui-scanner

向主会话发起调用(自动委托):

```
请使用 ui-scanner subagent 对整个项目做全量 UI 扫描,生成 docs/ui-inventory.md。

重点要求:
- 严格按 CLAUDE.md 中"目录约定"和"技术栈"探查
- 区分前台(F)、后台(A)、共享(S)三类 ID
- 文档末尾必须有"校验"段:实际 find 命令统计结果与清单总数对账
- 不省略任何文件,不确定的列入清单并在备注里写疑问
```

### 3. 人工核对引导

扫描完成后,主动告诉用户:

```
扫描已完成。下一步请你做三件事:

1. 打开 docs/ui-inventory.md 通读一遍,确认:
   - 总数与你的预期一致
   - 没有明显遗漏的目录
   - 备注列里"不确定"的文件,你来决定是否纳入改造

2. 在每行的 batch 列填上数字(0/1/2/3...):
   - batch 0:全局基础设施(Layout、Header、Footer、tokens 引入)—— 5-10 个文件
   - batch 1-N:前台页面(按业务模块聚类,每批 15-25 个)
   - 接下来:后台页面(按功能模块,每批 15-20 个)
   - 最后一批:残留组件、空状态、404、登录注册

3. 全部分配完后,提交清单:
   git add docs/ui-inventory.md
   git commit -m "docs(ui): initial inventory of <N> files with batch assignment"
```

### 4. 提供分批建议(可选)

如果用户希望你建议分批,基于以下原则给推荐:

- 同业务模块的页面放一批(便于复用同样的 design pattern)
- 全局组件单独一批(改一次影响全站,要先做)
- 复杂后台表格单独一批(它需要独立组件 MobileTableCard)
- 装饰性页面(404、空状态、登录)放最后一批(中式装饰发挥空间最大)
- 每批 ≤ 25 个文件(避免单会话上下文压力)

但**不要直接修改 inventory 文件**——给建议,让用户决定。

## 完成标准

- [ ] `docs/ui-inventory.md` 已生成
- [ ] 总数与 find 命令对账一致
- [ ] 用户已分配 batch 列
- [ ] 文件已 commit

## 完成后

```
Phase 1 完成。
推荐下一步:Phase 2 — 写 docs/design-system.md(设计规范定稿)。
可以让 Claude 基于 docs/design-system.md.template 起草一份,然后你审核细节
(尤其是中式色板的具体色值偏好、字体偏好、中式元素的可接受范围)。
```
