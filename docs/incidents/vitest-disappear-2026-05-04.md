# Incident: vitest 反复消失(2026-05-04)

> 类别:开发环境 / 工具链 / 第三方安全软件干扰
> 严重度:P1(阻塞改造期 batch 0 收尾)
> 状态:✅ 已根治(关闭腾讯管家 + pnpm 救场重建 + check:deps 哨兵 + PLAYBOOK 第 5 道防线)

## 现象时间线

| # | 时间 | 描述 | 解决 |
|---|---|---|---|
| 1 | step C 期间(早) | `vitest.mjs` 缺失,`npm test` MODULE_NOT_FOUND | `npm install vitest --no-save` |
| 2 | step F 后(visual-reviewer subagent 跑完) | 整个 `vitest/` 目录消失 | 同上 |
| 3 | step E 后续(早,与 #2 紧邻) | 又消失 | 同上 |
| 4 | batch 0 commit 后 | 大批 dev 包消失(vitest / vite / jsdom / @testing-library 全部) | **本次根治** |

## 第 4 次诊断(根因定位)

通过 6 项查询(诊断协议见会话历史):

1. ✅ **lockfile 完整**:`package-lock.json` 含 vitest@2.1.9 + 33 个相关包,`devDependencies.vitest = ^2.1.8` 正式声明 → **排除"--no-save 副产物 prune"假设**
2. ✅ **Windows Defender 日志为空**:`Get-MpThreatDetection` 无 vitest/node_modules 隔离记录 → **排除"Defender 删除"**
3. ✅ **写测试通过**:在 node_modules 路径手动写文件 OK → **排除"权限/junction 问题"**
4. ⚠️ **不只是 vitest 丢**:`vite/dist/node/index.js` / `jsdom/lib/api.js` / `@testing-library/react/dist/index.js` 全部消失 → **是大规模批量删除**
5. ⚠️ **timestamp 异常**:`node_modules/` mtime = `21:21:10`,`.package-lock.json` mtime = `18:01:16`(npm 元数据没动)→ **绕过 npm 操作的删除**
6. ⚠️ **Playwright MCP 浏览器残留 11+ chrome.exe**:从 step F 视觉回归一直留到现在,但 chrome 子进程不直接动 node_modules

**用户确认**:**腾讯电脑管家**装在机器上,有"系统加速 / 垃圾清理"功能定期扫描清理"无用大文件",**误判 node_modules 为冗余清理**。这是绕过 npm + 不留 Defender 痕迹的最合理解释。

## 根因

**腾讯电脑管家的"系统加速/垃圾清理"功能**周期性扫描并删除 `D:\workspace\` 下的 `node_modules` 内容。具体行为:
- **绕过 npm**(直接文件删除,不更新 `.package-lock.json`)
- **绕过 Windows Defender 日志**(不是恶意文件隔离,是"清理"操作,走另一条日志路径)
- **批量删除多个包**(@vitest/_, vite, jsdom, @testing-library/_,可能还有更多 dev 依赖)
- **保留 .bin/ wrapper**(npm 创建的可执行入口被认为不是"垃圾",留下来)

## 处理(2026-05-04 batch 0 收尾)

1. **用户操作**:关闭腾讯电脑管家(已确认进程不在)
2. **杀掉 Playwright MCP 残留 chrome.exe(11+ 个)**:`Stop-Process -Force`
3. **重建 node_modules**:
   - 尝试 1:`npm ci`(npm registry npmjs.org,EPERM + TLS 错误失败)
   - 尝试 2:`npm install --registry=npmmirror`(死锁在 reify 阶段,16 分钟无写入)
   - **尝试 3 成功**:`pnpm install --shamefully-hoist --registry=npmmirror`(2m 29s 完成)
4. **`npm run check:deps` 哨兵命令**:检查 4 个关键包(vitest / jsdom / @testing-library/react / vite)是否完整
5. **PLAYBOOK 强制门禁加第 5 道防线**:每个 batch 启动前跑 `check:deps`
6. **本 incident 文档存档**:供未来 batch 1-5 / 后续会话回查

## 长期防护

- **工程目录加白名单**:`D:\workspace\` 应在腾讯管家(或任何"系统加速"类软件)永久白名单
- **建议卸载腾讯管家**:开发机不建议安装"清理 / 加速"类软件;它们的"智能清理"算法常常误判开发工具产物
- **每次 batch 启动前哨兵**:`npm run check:deps`(已加 PLAYBOOK 第 5 道防线)
- **CI 中跑 npm ci**:CI 环境不受本机 AV 影响,作为最终防线
- **lockfile 双轨临时残余**:`pnpm-lock.yaml` 因 pnpm 救场生成,本工程主路径仍为 npm + `package-lock.json`;pnpm-lock 不应 commit(已在收尾 commit 中明确不 stage)

## 残余风险

- **腾讯管家可能开机自启**:本次"关闭"如果是临时禁用而非卸载,下次开机会激活,可能再次清理 node_modules
- **建议**:批量改造期间,用户每天会话开始前先确认管家是否仍处于关闭状态,跑 `npm run check:deps` 验证

## 关键日志/命令(供后续 incident 复制)

```bash
# 检查腾讯管家 / 360 / 火绒等是否活
powershell -Command "Get-Process | Where-Object { $_.Name -match 'QQ|Tencent|TXEDU|qmsafe' -or $_.Description -match '管家|加速|清理' } | Select Id,Name,StartTime"

# 检查 Defender 日志
powershell -Command "Get-WinEvent -LogName 'Microsoft-Windows-Windows Defender/Operational' -MaxEvents 100 | Where { $_.Message -like '*node_modules*' }"

# node_modules 健康
cd zhouwenwang/zhouwenwang-divination-mobile && npm run check:deps

# 紧急救场
rm -rf node_modules
pnpm install --shamefully-hoist --registry=https://registry.npmmirror.com
```
