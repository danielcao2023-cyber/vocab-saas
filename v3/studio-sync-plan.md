# v3 第一期 · Studio 同步与 Codex 运行方案（待用户确认，尚未执行）

- 起草：工程负责人，2026-10-17 13:12（上海时间）。本轮**没有**对 Studio 做任何写操作，也没有 ssh 登录过。
- 前提：用户先确认 `v3/design/` 视觉稿（可带修改意见，改完再确认）。
- 范围：Studio 上只动 `~/dev/vocab-saas/` 里面；不碰 `~/apps/vocab`、生产 18420、`~/.codex/config.toml`、`~/.ssh`、Tailscale。Codex 每次显式带 `-m gpt-6.1-sol`，不改全局默认。

## 现状（已知）
- Studio `~/dev/vocab-saas/app` 还留着 v2 时 Codex 的旧改动，缺工程后来的两次修正，不能当来源（群里 12:50 已说明）。
- `package.json` / `package-lock.json` 从 `2fd2e86` 到 `b4429a2` 没有变化（box 上 `git diff --stat` 为空），所以 Studio 旧 app 里已装好的 `node_modules`（better-sqlite3 12.11.1，ABI 147）可以直接搬过去用，不需要联网 `npm ci`。【待 S0 核实 Studio 上的锁文件哈希】

## S0 只读检查（ssh caogong@100.101.33.1）
```bash
cd ~/dev/vocab-saas && ls
git -C app log -1 --oneline; git -C app status --short | wc -l
shasum -a 256 app/package-lock.json        # 应等于 box 上 b4429a2 的锁文件哈希
ls app/node_modules/better-sqlite3/build/Release/ | head -3
PATH=/opt/homebrew/bin:$PATH node -v; /opt/homebrew/bin/codex --version
ls v2 v3 2>/dev/null; df -h ~ | tail -1
```

## S1 box 上打包（本地，可逆）
```bash
cd /workspace/vocab-saas/wt-v3
git bundle create /workspace/vocab-saas/xfer/v3-phase1.bundle feat/v3-phase1
git bundle verify /workspace/vocab-saas/xfer/v3-phase1.bundle
```

## S2 Studio 上替换 app/（只在 ~/dev/vocab-saas 里）
```bash
cd ~/dev/vocab-saas && TS=$(date +%Y%m%d-%H%M) && mkdir -p _archive xfer v3
git -C app add -A -N && git -C app diff --binary > _archive/app-v2-stale-$TS.diff   # 旧改动留档
mv app _archive/app-v2-stale-$TS
# 从 box 传入（scp）：xfer/v3-phase1.bundle，v3/方案.md，v3/codex-brief-phase1.md，v3/design/（整个目录），v2/内容.md（只读镜像，覆盖 Studio 上的旧副本）
git clone -b feat/v3-phase1 xfer/v3-phase1.bundle app
mv _archive/app-v2-stale-$TS/node_modules app/
[ -f _archive/app-v2-stale-$TS/data/raw/ecdict.csv ] && mkdir -p app/data/raw && cp _archive/app-v2-stale-$TS/data/raw/ecdict.csv app/data/raw/   # 第一期用不到，留着备用
cd app && git log -1 --oneline && PATH=/opt/homebrew/bin:$PATH npm test && PATH=/opt/homebrew/bin:$PATH npm run typecheck   # 基线必须全绿
```
回滚：`rm -rf app && mv _archive/app-v2-stale-$TS app`。

## S3 Codex 运行
```bash
export PATH=/opt/homebrew/bin:$PATH
cd ~/dev/vocab-saas
nohup /opt/homebrew/bin/codex exec -C ~/dev/vocab-saas --skip-git-repo-check --sandbox workspace-write \
  -m gpt-6.1-sol -c model_reasoning_effort=high "$(cat v3/codex-brief-phase1.md)" </dev/null \
  > xfer/codex-v3p1-$(date +%H%M).log 2>&1 &
```
- 只读监控：`tail` 日志、`git -C app status --short`。预计时长【推断】1–3 小时。
- 结束后 Studio 上**不提交**。

## S4 取回、审核、提交（box）
```bash
# Studio：
cd ~/dev/vocab-saas/app && git add -A -N && git diff --binary > ../xfer/v3p1.diff && git status --short > ../xfer/v3p1.status
# scp 回 box 后：
cd /workspace/vocab-saas/wt-v3 && git apply --check ../xfer/v3p1.diff && git apply ../xfer/v3p1.diff
export PATH=/workspace/vocab-saas/.node/bin:$PATH && npm ci --prefer-offline   # 只在 wt-v3 内
npm test && npm run typecheck && npm run build
```
工程负责人逐文件审代码，修问题后在 `feat/v3-phase1` 上提交。

## S5 box 上本地验证（不碰 18420/18423）
- 新开测试端口 **18424**，数据库用 `data/qa.db` 的**副本** `data/qa-v3.db`（再造一份带 10 天历史的库），`STATIC_DIR` 指向 wt-v3 自己的 dist。
- `npx tsx scripts/verify-migration.ts --db <副本>`（不加 npm script，package.json 不改）：旧数据逐行不变。
- 用 playwright 截同样 16 张图，和 `v3/design/shots/` 并排对比；然后交独立验收。
- 上线 18420 前停下，报 Grok Bot；用户确认后交运维巡检：上线前单独备份正式库，在备份副本上先跑 verify-migration。

## 需要用户确认的 Studio 动作（汇总）
1. S0 只读 ssh 检查。
2. S2：把 `~/dev/vocab-saas/app` 整个移到 `~/dev/vocab-saas/_archive/`（旧改动另存 diff），换成新分支的干净副本；搬 node_modules；同步 v2/内容.md、v3/ 文档和视觉稿。
3. S3：在 Studio 上用 `-m gpt-6.1-sol` 高推理跑一次 Codex（占订阅额度），只写 `~/dev/vocab-saas`。
4. S4：从 Studio 取回 diff。

## S3b 重跑 Codex（2026-10-17 14:30 准备，**未执行，需批准**）
第一次运行（14:23:28 开始）只做了只读核对，因任务书写着“视觉稿未确认前不运行”而停下，没有改任何文件。任务书已在 `929484d` 去掉所有阻塞语句。
1. 同步（只写 ~/dev/vocab-saas）：新 bundle → `git -C ~/dev/vocab-saas/app pull --ff-only ../v3-phase1.bundle feat/v3-phase1`（app 工作区干净）；`v3/codex-brief-phase1.md`、`v3/design/design-notes.md` 覆盖到 `~/dev/vocab-saas/v3/`。
2. 启动前记录 `~/.codex/config.toml` 的 sha256（只取哈希）。
3. 启动：
```bash
export PATH=/opt/homebrew/bin:$PATH
cd ~/dev/vocab-saas && date "+START %F %T %Z" > codex-v3p1-run2.start && \
nohup /opt/homebrew/bin/codex exec -C ~/dev/vocab-saas --skip-git-repo-check --sandbox workspace-write \
  -m gpt-6.1-sol -c model_reasoning_effort=high "$(cat v3/codex-brief-phase1.md)" </dev/null \
  > ~/dev/vocab-saas/codex-v3p1-run2.log 2>&1 &
```
注意：`-C ~/dev/vocab-saas` 让沙盒可写范围是整个 `~/dev/vocab-saas`（外加 /tmp、$TMPDIR）；“只写 app/”靠任务书约束，结束后用 `git -C app status` 和对 `v2/ v3/` 的 sha256 比对核实。
