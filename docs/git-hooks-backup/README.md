# Git Hooks 备份

`.git/hooks/` 不被 git 跟踪,本目录用于备份关键 hook 内容,确保团队成员 clone 仓库后可手动恢复 hook。

## 当前备份

### pre-commit

UI 改造期间业务逻辑保护 hook(2026-05-04 创建,batch 0 step E 前夕安装,step F 前夕加固)。

**安装方式**:

```bash
cp docs/git-hooks-backup/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**作用**:`git commit` 时拦截对业务逻辑路径(`src/core/*` / `src/games/*/(logic|engine|...)*` / `src/masters/*` / `src/utils/*` / `src/types/*` 等)的改动,阻止意外破坏。覆盖范围对照 `CLAUDE.md` "业务逻辑目录" 段,详见 hook 文件头注释 11 项对照表。

**临时绕过**(强烈不推荐):

```bash
git commit --no-verify
```

绕过后**必须**在 `docs/cleanup-backlog.md` 登记原因。

**失效条件**:UI 改造完全结束后(所有 batch DONE,Phase 5 最终审计通过),可移除本 hook 与备份。

## 验证 hook 是否在工作

任意时刻执行下面的"自检"序列,期望看到 hook 拦截:

```bash
# 1. 创建一个临时违规文件(在保护路径下)
TMP="zhouwenwang/zhouwenwang-divination-mobile/src/core/__hook_test_DELETE_ME__.tmp.ts"
echo "// hook test" > "$TMP"
git add "$TMP"

# 2. 尝试提交(期望被拦)
git commit -m "test: should be blocked"
# 输出应包含: "❌ 改造期禁止修改业务逻辑文件"

# 3. 清理
git reset HEAD "$TMP"
rm -f "$TMP"
```

## 维护

每次 hook 文件被修改(`.git/hooks/pre-commit`),**同步更新本目录的备份**,作为单独 commit:

```bash
cp .git/hooks/pre-commit docs/git-hooks-backup/pre-commit
git add docs/git-hooks-backup/pre-commit
git commit -m "chore(hooks): sync pre-commit backup"
```
