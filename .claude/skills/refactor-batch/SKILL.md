---
name: refactor-batch
description: 当用户说"开始 batch N 改造"、"处理第 N 批"、"改造下一批 UI 文件"时使用。完整的批次改造工作流,包括改造、审计、视觉回归三步串联。
---

# 批次改造工作流(Phase 4 核心循环)

## 何时使用

- 用户明确说"开始 batch N"、"处理 batch N"、"做下一批"
- `docs/ui-inventory.md` 已存在且有 batch 分配
- `docs/design-system.md` 已定稿

## 前置检查

```
1. Read docs/ui-inventory.md,确认 batch=N 存在 TODO 文件
2. Read docs/design-system.md,确认无 [TODO] 占位符
3. Bash `git status`,确认工作区干净(没有未提交改动)
4. Bash 看当前分支,确认在主分支或专门的 ui/* 分支
```

任何前置不满足,**立即停止**并提示用户。

## 步骤

### 第 1 步:开分支(可选)

如果用户希望用独立分支(推荐),提议:

```bash
# 选项 A:在主仓库开分支
git checkout -b ui/batch-N

# 选项 B:开 worktree(适合并行改多个 batch)
git worktree add ../<project>-batch-N -b ui/batch-N
cd ../<project>-batch-N && claude
```

如果是 worktree 方案,每个 worktree 各自独立 Claude 会话,互不干扰。

### 第 2 步:派遣改造

```
请使用 ui-refactorer subagent 处理 batch=N 的所有 TODO 文件。

约束(从 CLAUDE.md 和 design-system.md 继承):
- 严格遵守业务逻辑隔离
- 改造完一个文件就更新 inventory 状态
- 每 5 个文件运行一次 lint
- 全部完成后跑 lint + typecheck + test
- 单 commit 提交,信息格式 ui(batch-N): ...
```

等待改造完成。

### 第 3 步:派遣审计

改造完成后(无论 ui-refactorer 是否报告了问题),立即:

```
请使用 ui-auditor subagent 审计 batch=N。
重点检查:状态对账、token 覆盖、响应式覆盖、业务逻辑隔离、props 签名、漏改风险、中式元素白名单、测试用例完整性。
```

审计完成后,主动汇总报告里的 ❌ 严重问题数量。

### 第 4 步:派遣视觉回归

```
请使用 visual-reviewer subagent 对 batch=N 跑视觉回归。
确认:
- Playwright MCP 已通过 `claude mcp list` 验证
- dev server 在跑(地址参考 CLAUDE.md)
```

### 第 5 步:汇总三份报告

把以下三份报告的核心结论汇总给用户:

- ui-refactorer 的执行汇报(改了哪些文件、commit hash)
- `docs/audit-batch-N.md` 的 ❌ 严重 + ⚠️ 警告
- `docs/visual-batch-N.md` 的 P0 + P1 问题

按以下格式呈现:

```
=== Batch N 完成情况 ===

改造执行:
- 处理文件 X 个,全部 DONE
- lint/typecheck/test:✅
- commit:<hash>

代码审计:
- ❌ 严重 W 个(必修):<列出>
- ⚠️ 警告 Z 个:<列出关键的>
- 详见 docs/audit-batch-N.md

视觉审查:
- P0 问题(必修):<列出>
- P1 问题:<列出>
- 详见 docs/visual-batch-N.md

请你决定下一步:
A) 继续修复 P0/严重问题(我会派遣 ui-refactorer 单独处理这几个文件)
B) 接受现状,合并到主分支并继续 batch (N+1)
C) 回滚本批次(/rewind 或 git reset --hard),用更细的 prompt 重做
```

### 第 6 步:执行用户决策

- A:派遣 ui-refactorer 处理修复清单 → 重新审计
- B:`git checkout main && git merge ui/batch-N`(或 worktree merge)
- C:执行回滚

## 失败模式与处理

| 症状 | 应对 |
|------|------|
| 上下文使用 > 60% | 主动 `/clear`,用一个新会话继续未完成的文件 |
| 同一文件被反复改 | 暂停,补充 design-system.md 的细节;或者向用户确认设计意图 |
| 测试用例新增失败 | 立即 `/rewind` 或 `git reset`,**绝不修改测试** |
| 视觉回归 P0 数量 > 30% | 整批回滚,缩小 batch 大小到 10 个文件,重做 |
| ui-refactorer 在中途报告 "上下文压力大" | 让它先 commit 部分进度,然后开新会话继续 |
| 用户中途想跳到别的 batch | 先把当前批次 commit 或 reset,不要并发处理同一仓库 |

## 完成标准(本 batch)

- [ ] inventory 中 batch=N 全部 DONE 或 SKIP(SKIP 必须有备注)
- [ ] audit 报告无 ❌ 严重问题
- [ ] visual 报告无 P0 问题
- [ ] 改动已 commit,且(若用了分支)已 merge 回主分支
- [ ] 用户在汇总后明确表态"继续下一批"

## 完成后

```
Batch N 完成。建议下一步:
- 处理 batch (N+1):再次调用 refactor-batch skill
- 或者全部 batch 都做完了,调用 audit-batch skill 做最终全局审计(Phase 5)
```
