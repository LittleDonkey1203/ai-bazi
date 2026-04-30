# Monorepo 迁移记录

## 原子仓来源

- `zhouwenwang`
  - 原远端：`https://github.com/gaoxt/zhouwenwang`
- `bazi-mcp`
  - 原远端：`https://github.com/cantian-ai/bazi-mcp`

## 迁移目标

把 `D:\claude\mingli\new_prj` 作为唯一 Git 根目录，方便：

- 统一推送 GitHub
- 让 Render 直接读取根目录 `render.yaml`
- 避免嵌套仓库被 Render 或 Git 识别成 gitlink

## 迁移方式

不删除原子仓历史，只把原有 `.git` 目录重命名为：

- `zhouwenwang/.git-monorepo-backup`
- `bazi-mcp/.git-monorepo-backup`

随后在根目录执行 `git init`。

## 当时捕获到的未提交状态

### `zhouwenwang`

存在未提交修改与未跟踪文件，迁移时按“保留工作树原样”处理。

### `bazi-mcp`

存在未提交修改，迁移时按“保留工作树原样”处理。
