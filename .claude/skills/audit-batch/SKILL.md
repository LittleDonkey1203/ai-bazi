---
name: audit-batch
description: 当用户要求"审计某个 batch"、"检查改造质量"、"做最终审计"、"全局对账"时使用。提供单批审计和最终全局审计两种模式。
---

# 改造审计(单批 / 最终)

## 何时使用

- 用户说"审计 batch N"
- 用户说"做最终审计"或"全局对账"
- 完成所有 batch 后的验收阶段(Phase 5)
- 怀疑某次改造有遗漏时

## 模式 1:单 batch 审计

用户指定 batch 编号 N。直接派遣 ui-auditor:

```
请使用 ui-auditor subagent 审计 batch=N(单 batch 模式)。
```

输出:`docs/audit-batch-N.md`

## 模式 2:最终全局审计(Phase 5 必跑)

### 第 1 步:派遣全局审计

```
请使用 ui-auditor subagent 做最终全局审计(全局模式)。
执行三向数量对账 + 全局测试构建 + bundle size 对比。
输出 docs/audit-final.md。
```

### 第 2 步:三向对账核心命令

如果 subagent 在执行中需要参考,以下是命令模板(需要根据 CLAUDE.md 替换 `<src_root>` 和文件扩展名):

```bash
# A:文件系统 UI 文件总数
A=$(find <src_root> -type f \( -name '*.vue' -o -name '*.tsx' -o -name '*.jsx' \) ! -path '*/node_modules/*' | wc -l)

# B:清单总数
B=$(grep -cE '^\| [A-Z][0-9]+ \|' docs/ui-inventory.md)

# C:状态完成数(DONE + SKIP)
C_DONE=$(grep -c '| DONE |' docs/ui-inventory.md)
C_SKIP=$(grep -c '| SKIP |' docs/ui-inventory.md)
C=$((C_DONE + C_SKIP))

# D:实际有 git diff 的 UI 文件数
D=$(git diff main --name-only | grep -E '\.(vue|tsx|jsx)$' | wc -l)

# 期望:A == B(扫描完整),C == B(状态完整),D ≤ C_DONE(没有越界改动)
echo "A=$A B=$B C=$C D=$D"
echo "对账结果:扫描完整=$([ $A -eq $B ] && echo ✅ || echo ❌)"
echo "         状态完整=$([ $C -eq $B ] && echo ✅ || echo ❌)"
echo "         改动合规=$([ $D -le $C_DONE ] && echo ✅ || echo ❌)"
```

### 第 3 步:全局残留扫描

```bash
# 硬编码颜色残留(排除 token 定义文件)
grep -rEn "#[0-9a-fA-F]{6}\b" <src_root> \
  --include="*.vue" --include="*.tsx" --include="*.jsx" --include="*.css" --include="*.scss" \
  | grep -v "tokens.css" \
  | grep -v "design-system" \
  > /tmp/hardcoded-colors.txt
wc -l /tmp/hardcoded-colors.txt

# 行内 style 残留
grep -rEn 'style="[^"]*color:' <src_root> \
  --include="*.vue" --include="*.tsx" --include="*.jsx" \
  > /tmp/inline-style.txt
wc -l /tmp/inline-style.txt
```

### 第 4 步:测试 & 构建闸门

```bash
# 按 CLAUDE.md 中的命令依次跑
[lint command] && \
[typecheck command] && \
[test command] && \
[build command]
```

任何一项失败都不算改造完成。

### 第 5 步:Bundle Size 对比(可选)

```bash
# 改造前(在 main 分支测一次,提前保存)
git stash && git checkout main
[build command]
du -sh dist/ > /tmp/size-before.txt

# 回到改造后分支
git checkout - && git stash pop
[build command]
du -sh dist/ > /tmp/size-after.txt

cat /tmp/size-before.txt /tmp/size-after.txt
```

如果增长 > 20%,需要在最终报告中标注并分析原因(通常是引入移动 UI 库)。

### 第 6 步:派遣视觉回归(全量)

```
请使用 visual-reviewer subagent 做最终视觉回归(覆盖所有 batch 涉及的核心路由)。
```

### 第 7 步:生成最终报告

写入 `docs/refactor-report.md`:

```markdown
# UI 改造完成报告

> 日期:[填]
> 改造范围:全栈 UI 移动适配 + 视觉规范升级 + 中式元素注入

## 数量对账

| 维度 | 数值 | 状态 |
|------|------|------|
| 文件系统 UI 文件 (A) | N | - |
| 清单总数 (B) | N | A == B ✅ |
| 已 DONE (C_DONE) | N | - |
| 已 SKIP (C_SKIP) | N | C_DONE + C_SKIP == B ✅ |
| 实际改动 (D) | N | D <= C_DONE ✅ |

## 测试 & 构建

- Lint:✅ / ❌(详情)
- Typecheck:✅ / ❌
- Unit Test:X / Y 通过
- Visual Regression:X / Y 路由通过
- Build:✅,bundle size +X%

## 残留问题(非阻塞)

- 硬编码颜色残留:N 处(详见 /tmp/hardcoded-colors.txt)
- 行内 style 残留:N 处
- 这些在文件 ... 中,建议下一迭代清理

## 已知遗留(不影响功能)

- ...

## 视觉回归亮点

- 移动端适配通过率:X%
- P0 问题清零
- 中式皮肤一致性:符合 design-system.md

## 建议下一步

- 用户验收测试(UAT)
- 真机回归(iOS Safari、Android Chrome、微信内置浏览器)
- 性能测试(Lighthouse 移动端评分)
- 后续优化方向:...
```

## 完成标准

- [ ] A=B 一致(扫描完整)
- [ ] C 与 B 一致(状态完整)
- [ ] D 不超过 C_DONE(没越界改动)
- [ ] 所有测试 / 构建通过
- [ ] 视觉回归无 P0
- [ ] 报告已生成并 commit

## 完成后

如果以上全部通过:

```
🎉 UI 改造圆满完成。

核心成果:
- N 个 UI 文件全部完成移动适配
- 视觉规范统一为基于 design tokens 的三层结构
- 中国元素已克制注入装饰位
- 业务逻辑零修改

建议:
- 在合并到 main 前,做一次真机回归
- 把这次改造的经验沉淀回 CLAUDE.md(更新"已完成项"段落)
- 把 .claude/agents 和 .claude/skills 提交到仓库,供未来复用
```

如果有问题:

```
最终审计发现 N 个阻塞性问题,详见 docs/refactor-report.md。
建议:
- 先修复 P0,再合并
- 派遣 ui-refactorer 处理具体文件
```
