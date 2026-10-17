# 初三背单词 · Studio 部署方案 v2（待用户确认）

- 负责人：运维巡检。更新时间：2026-10-17 09:38（上海）。上一版存在 `运维-Studio部署方案.bak-0930.md`。
- 状态：**只有文档。没有连 Studio，Studio 上没做任何改动。** 下面每一步写操作和 18420 上线都要等用户确认。
- 部署版本：**814cd54 回归通过（独立验收 round5，09:39 上海）**，Grok Bot 09:40 定：**部署 814cd54**（checkout 814cd54 再 build，/health 应为 814cd54）。
- 依据：`方案-v2.md`、`v2/工程.md`、`app/README.md`（6e31f17）、独立验收 round1–4，以及用户 09:30 的答复。Studio 的环境事实引自工程负责人 02:25–08:55 的只读检查，部署前要重查。
- 标签：【事实】有实测或代码依据；【建议】我的方案；【待实测】部署时要验证；【需决定】要用户或 Grok Bot 拍板。

## 0. 用户已定（09:30）
| 事项 | 决定 | 对方案的影响 |
|---|---|---|
| 局域网 IP | 固定 | `HOST` 直接写死局域网地址，不用处理地址变化 |
| 自动登录 | 已开 | 停电重启后 LaunchAgent 能起来；仍做一次重启演练 |
| 每晚备份 | 不要 | 不建定时任务。只在部署和升级前做一次备份 |
| 家庭密码 | 不设 | 不限制设备。只靠监听地址和来源网段控制访问 |
| 访问范围 | 本机、家里局域网、Tailscale | `ALLOW_CIDRS` 见第 3 节 |
| 课标 PDF | Grok Bot 让 Studio 上的 Codex 下载 | 不在本次部署范围，见第 9 节 |

**不设密码的含义**【事实，由设计决定】：家里局域网和用户 Tailscale 网络里的任何设备，打开地址就能读写孩子的进度。这是用户已接受的取舍，我只记在这里，不另提议。

## 1. 部署前的两个阻塞项（要先定）
1. **（已解决：814cd54 升到 12.11.1 并回归通过）better-sqlite3 版本对不上**【事实｜09:33 只读查看 6e31f17】`package.json` 写的是 `^11.10.0`，lock 文件锁的是 **11.10.0**，不是 08:55 说的版本（08:55 写的 12.12.0 并不存在，工程 09:36 更正为 12.11.1）。Studio 是 Node 26.4，11.10.0 大概率没有对应的预编译包，`npm ci` 会改成现场编译，需要 Xcode Command Line Tools，编译还可能失败【推断】。现在代码已冻结，两个办法：
   - A【建议】由工程负责人把 better-sqlite3 升到 12.11.1，出一个新 commit，在我这台电脑上重跑测试，再请独立验收快速回归。这样部署的是测过的版本，但要解冻代码，需要 Grok Bot 同意。
   - B 部署时在 Studio 上临时装 12.11.1（`npm i better-sqlite3@12.11.1 --no-save`）。不改代码，但 Studio 上实际跑的依赖和测试时不一样，我不推荐。这也和第 5 节第 4 步「不在 Studio 上现场换依赖」冲突，选 B 就要明确把它列为例外。
   - 无论哪种，都先在 Studio 上只读运行 `node -p process.versions.modules`，结果应为 147；对不上就改走 `node:sqlite`，那就是改代码，要回到工程负责人。
2. **正式库用什么词表**【事实】`app/data/wordlists/` 里现在只有 `sample.csv`（示例词）。官方课标词表还没到。【需决定】先用示例词上线让孩子试用，还是等课标词表导入后再上线。先上示例词的话，以后导入课标词表时要定：保留示例词的学习记录，还是清空重来。

## 2. 目标环境
- 主机：Mac Studio，家里局域网地址 192.168.100.226（固定），macOS arm64，Node v26.4.0，sqlite3 3.54.0，96 GiB 内存【事实，工程 02:25】。
- 访问：只在家里局域网和 Tailscale 内使用，不对公网开放，不用域名，不需要备案。
- 第一期不接 AI，部署不依赖 codex；`~/.codex/config.toml` 不碰。
- 端口：只开 18420。验收用的 18423 和 `qa.db` 留在我这台电脑上，不传到 Studio。

## 3. 目录、配置和服务
| 用途 | 路径 |
|---|---|
| 代码 | `~/apps/vocab/releases/814cd54/`（每个版本一个目录，不覆盖） |
| 当前版本 | `~/apps/vocab/current` 软链到 release |
| 数据库 | `~/apps/vocab/data/vocab.db`（放在 release 外面） |
| 配置 | `~/apps/vocab/config/vocab.env`（权限 600，不进仓库，不写进 plist） |
| 备份 | `~/apps/vocab/backups/` |
| 日志 | `~/Library/Logs/vocab/{out,err}.log` |
| 服务 | `~/Library/LaunchAgents/com.caogong.vocab.plist`（用户级 LaunchAgent，不用 root） |

`vocab.env` 内容【建议】：
```
HOST=127.0.0.1,192.168.100.226,<部署时用 tailscale ip -4 读出>
PORT=18420
ALLOW_CIDRS=127.0.0.1/32,::1/128,192.168.100.0/24,100.64.0.0/10
DB_PATH=/Users/<用户>/apps/vocab/data/vocab.db
```
- **`100.64.0.0/10` 放行的是整个 Tailscale 网络里的设备**，包括以后新加入的设备和别人共享进来的设备，它们都能打开并改动孩子的进度。用户已说不限制设备，所以按此配置；如果以后想收紧，可以把这一段换成具体几台设备的 100.x 地址。
- 局域网网段 `/24` 部署时按 Studio 实际的子网掩码重查。不监听 Tailscale 的 IPv6，白名单不写 0.0.0.0/0。
- 应用对每个地址单独监听，某个地址绑不上（比如开机时 Tailscale 还没连上）只记日志，每 30 秒重试，进程不退出【事实，README】。配置写错时退出码是 2，launchd 会按 10 秒间隔反复拉起，看 err.log 就能发现。
- plist：`ProgramArguments` 用 node 的绝对路径（部署时 `which node` 确认）加 `current` 下的 tsx 入口；`WorkingDirectory` 指向 `~/apps/vocab/current`；`RunAtLoad`、`KeepAlive`、`ThrottleInterval 10`。环境变量由一个小启动脚本从 `vocab.env` 读入，不写进 plist。

## 4. 部署前只读检查（不改任何东西）
| 检查项 | 命令 |
|---|---|
| 18420 空闲 | `lsof -nP -iTCP:18420 -sTCP:LISTEN` 无输出 |
| 不休眠 | `pmset -g` 里 sleep 为 0 |
| 自动登录 | 用户已确认，只核对 `defaults read /Library/Preferences/com.apple.loginwindow autoLoginUser` 有值 |
| 防火墙 | `socketfilterfw --getglobalstate`，开着的话首次监听可能弹窗 |
| Tailscale | `tailscale status`、`tailscale ip -4`，不改 ACL |
| ABI | `node -p process.versions.modules` 应为 147 |
| 编译工具 | `xcode-select -p`（只在走现场编译时才需要） |
| 同名服务 | `launchctl list \| grep -i vocab` 无输出 |
| 磁盘 | `df -h ~` |
| 现有服务基线 | `launchctl list` 里 xianyu-backend、xianyu-tunnel、ai.hermes.gateway 的 PID 和退出码 |

## 5. 部署步骤（用户一次确认后按顺序执行，任何一步失败就停）
1. 记录第 4 节基线。
2. 建目录 `~/apps/vocab/{releases,data,config,backups}` 和 `~/Library/Logs/vocab/`。
3. 从我这台电脑经 Tailscale 用已有的 SSH 配置 rsync 代码到 `releases/814cd54/`，带上 build 好的 `dist/`（含 `version.json`），排除 `data/*.db*`、`qa/`、`node_modules/`。不新建密钥，用户名和地址不写进文档。
4. 在 Studio 上 `npm ci`（按第 1 节第 1 项的结论处理 better-sqlite3）。不全局装包，不用 sudo。
   - **必须通过的关卡**：`npm ci` 之后在 release 目录跑 `node -e "require('better-sqlite3')"`。报错就停下回报，回滚（删掉这个 release 目录），不在 Studio 上现场改代码或换依赖。【事实｜工程 09:32】之前只读查 ABI 时超时，better-sqlite3 能否在 Studio 上加载至今没确认。
5. 写 `config/vocab.env`（chmod 600）。
6. 生成正式库：按第 1 节第 2 项的结论用 `npm run import` 导入，`DB_PATH` 指向正式库。
7. 软链 `current` 指向 `releases/814cd54`。
8. 写 plist，`launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.caogong.vocab.plist`。
9. 按第 6 节验证，通过后交独立验收从浏览器实测。

以后升级：先备份数据库，传新 release，`npm ci`，改软链，`launchctl kickstart -k gui/$(id -u)/com.caogong.vocab`。

## 6. 验证（分层，不能互相代替）
1. 进程：`launchctl print gui/$(id -u)/com.caogong.vocab` 显示 running。
2. 端口：`lsof` 只出现 127.0.0.1、局域网地址、Tailscale 地址三处 18420，**不能有 `*:18420`**。
3. 接口：分别对三个地址 `curl /health`，返回正常，**commit 为 814cd54**。
4. 反向检查：不在白名单里的来源访问返回 403（能找到这样的来源就做，做不到记未验证）。
5. 真实网络：家里另一台设备用局域网地址打开；一台只开 Tailscale、不在家里网络的设备用 100.x 地址打开。
6. 浏览器和业务（独立验收）：**新开标签页**打开，核对加载的前端文件和新 build 一致；做完一组复习后 kickstart 重启服务，进度还在。
7. 重启演练：重启一次 Studio，不手动干预，服务自己起来，三个地址都在监听。时间由用户定。
8. 对照基线：xianyu-backend、xianyu-tunnel、ai.hermes.gateway 状态和部署前一样。

## 7. 备份（用户定了不要每晚备份）
- 只在每次升级和迁移前用 `sqlite3 vocab.db ".backup backups/vocab-<时间>-predeploy.db"` 备份一次（WAL 模式下不要直接拷文件）。首次部署时库是新建的，没有要备份的数据。
- 没有定时备份和异地备份：Studio 硬盘坏了，学习进度会丢。用户以后想加，再单独做。

## 8. 回滚
- 触发条件：第 6 节第 1–3 项任何一项失败；孩子打不开或进度丢了；其他服务和基线不一样。
- 代码回滚：软链改回上一个 release，kickstart。首次部署没有上一个 release，就直接完全撤除。
- 数据回滚（只在迁移出错时）：bootout 停服务，用 predeploy 备份覆盖 `vocab.db`，删掉 `-wal`、`-shm`，再 bootstrap。会丢掉部署后的学习记录，先告诉用户。
- 完全撤除：bootout，删 plist，确认 18420 没有监听；`~/apps/vocab` 先留着，删不删由用户定。
- 回滚后按第 6 节第 1–3 项和第 8 项再查一遍。
- 已打开的页面在版本切换后可能提示「页面过期了，刷新一下再继续」，刷新即可，属预期。

## 9. 影响
- 新增一个用户级常驻 Node 进程，内存几十 MB【推断】。新占用 18420，只绑三个内网地址。
- 不改 Tailscale ACL、SSH、codex 配置和现有 LaunchAgent。需要 sudo（比如防火墙放行）时先停下来问。
- 课标 PDF 由 Studio 上的 Codex 下载（Grok Bot 09:32：用户已授权，只写 `~/vocab-data/curriculum/`），和部署互不依赖，也不在部署目录里；我不碰那个下载过程。下载完要放到我这台电脑的仓库里，由工程负责人转成 `kb2022.csv` 并导入。

## 10. 未验证
- better-sqlite3 在 Studio 上能否装上（第 1 节第 1 项）。
- 三个地址同时服务、开机后 Tailscale 地址的重试是否生效（只能在 Studio 上测）。
- 「页面过期」提示在浏览器里的实际显示。
- 发音。
- 18420 当前是否空闲、防火墙状态、局域网子网掩码（02:25 之后没再查）。

## 11. 需要确认
1. **（已定 A，已完成）Grok Bot**：better-sqlite3 走 A（升到 12.11.1 出新 commit 再回归）还是 B（部署时临时装）？我建议 A。
2. **用户**：先用示例词上线，还是等课标词表导入后再上线？
3. **用户**：同意按这份方案在 Studio 部署吗？（注意第 3 节：Tailscale 网络里所有设备都能访问。）同意后第 5 节按顺序执行，中途失败就停下回滚并报告。
4. **用户**：重启演练定在什么时间？

## 交接
- 目标：按 6e31f17 和用户 09:30 的答复更新 Studio 部署方案，交用户确认。
- 状态：已更新，2026-10-17 09:35（上海）。
- 执行位置：只在我这台电脑上改了文档，读了 `app/package.json`、`package-lock.json`、`README.md`。没有连 Studio。
- 新发现：6e31f17 锁的 better-sqlite3 是 11.10.0，不是 12.11.1；正式词表还没到。
- 下一位：Grok Bot 定第 11 节第 1 项并转给用户确认第 2–4 项。部署要等用户确认后由我执行，执行后交独立验收。

### 补记 2026-10-17 09:40（上海）：better-sqlite3 走 A，版本 12.11.1
- Grok Bot 09:32 定走 A。工程 09:36 更正：12.12.0 不存在，改用 **12.11.1**（npm engines 为 Node 20–26）。解冻代码要用户同意。
- 【事实｜09:40 我在自己电脑上用 HTTP HEAD 探测 GitHub 发布文件】`better-sqlite3-v12.11.1-node-v147-darwin-arm64.tar.gz` 返回 200（存在）；对照组 `node-v999` 和 11.10.0 的 `node-v147-darwin-arm64` 都返回 404。说明 12.11.1 有 ABI 147 的 macOS arm64 预编译包，11.10.0 没有。
- 【待实测】Studio 上 Node 26.4 的 ABI 是否就是 147，之前只读检查超时，没确认。第 5 节第 4 步的 `require('better-sqlite3')` 关卡照旧保留，不通过就停。

### 补记 2026-10-17 09:36（上海）：814cd54（待独立验收回归）
- 【事实｜09:35 我只读核对】18420、18423 的 /health 都返回 814cd54；两个进程（72296、72301）都跑在 `/workspace/vocab-saas/.node/bin/node`；系统 `/usr/bin/node` 仍是 v20.19.2；`.node/` 在 app 目录外面。
- 回归通过后，**部署版本改为 814cd54**，第 5 节和第 6 节第 3 项里的 6e31f17 都按 814cd54 执行。没通过之前仍以 6e31f17 为准。
- rsync 时 `.node/` 不能带到 Studio（那是 Linux 版 Node），`node_modules/` 照旧排除，Studio 用自带的 Node 26.4 重新 `npm ci`。开发机是 Node 26.12.0，Studio 是 26.4.0，大版本相同，ABI 都应为 147，但 Studio 上没实测，`require('better-sqlite3')` 关卡照旧。
- 开发机上的 18420、18423 是 nohup 起的，没有守护，电脑重启后不会自己起来。这只影响测试，不影响 Studio。

### 补记 2026-10-17 09:37（上海）：2fd2e86（只改 README）
- 【事实｜git diff --stat 814cd54 2fd2e86】只改了 README.md，代码一样。
- 部署时传哪个提交要说清楚：`dist/version.json` 记的是 build 时的 HEAD。如果从 2fd2e86 build，Studio 上 /health 会显示 2fd2e86，不是 814cd54。【建议】部署时 checkout 2fd2e86 再 build，第 6 节第 3 项按 2fd2e86 核对，并在报告里注明「代码与回归通过的 814cd54 相同」。

### 补记 2026-10-17 09:40（上海）：814cd54 回归通过
- 独立验收 round5 通过（Node 26.12.0、better-sqlite3 12.11.1）。部署代码以 814cd54 为准，按上条建议从 2fd2e86 build。第 1 节第 1 项（better-sqlite3 版本）已解决。

### 补记 2026-10-17 09:42（上海）：部署提交与回滚
- 部署 814cd54，不用 2fd2e86（上一条建议作废）。
- 6e31f17 **不能作为 Studio 上的回滚版本**：Studio 是首次部署，上面没有旧 release；而且 6e31f17 锁的 better-sqlite3 11.10.0 没有 Node 26 的 darwin-arm64 预编译包（09:40 探测 404），在 Studio 上很可能装不上。首次部署失败的回滚方式是第 8 节的「完全撤除」。6e31f17 只作为代码历史保留。

### 补记 2026-10-17 09:55（上海）：部署停在只读预检（第 2 步），Studio 未改动
- 【事实｜只读预检】局域网地址实际为 en0 192.168.50.136/24、en1 192.168.50.237/24，不是 192.168.100.226。HOST 和 ALLOW_CIDRS 要等用户确认地址后改成 192.168.50.x 和 192.168.50.0/24。
- 【事实】`autoLoginUser` 读不到值，自动登录没开（与 09:30 答复不符）。需要用户开启或明确接受。
- 【事实】Node v26.4.0 `/opt/homebrew/bin/node`，ABI 147；18420 空闲；sleep 0；防火墙开着（State=1）；Tailscale IPv4 100.101.33.1（CLI `/opt/homebrew/bin/tailscale`）；磁盘剩余 958Gi；没有同名服务。
- 基线（PID/上次退出码）：ai.hermes.gateway 1929/0；xianyu-backend 1913/0；xianyu-tunnel 58613/255（部署前就是 255）。
- `ssh mac-studio` 报主机密钥验证失败，直接用 IP 加现有密钥能连上；没改 known_hosts 和 ssh 配置。
- 用户确认后从第 3 步接着做，部署 814cd54。

### 补记 2026-10-17 09:57（上海）：用户 09:56 确认的网络规则（取代第 3 节的 HOST/ALLOW_CIDRS 建议）
- 只走 Tailscale：`HOST=100.101.33.1`，不监听局域网和 127.0.0.1。
- 白名单只列用户自己账号（danielcao2023@）下的设备，每台一个 /32；不用 100.64.0.0/10，不放 192.168.x。共享进来的 sqkjxx-sx（100.118.192.105，另一个账号）不在名单里。以后新加设备要在 `vocab.env` 补地址再重启服务。不动 Tailscale 配置和 ACL。
- 不开自动登录。Studio 重启后由 Grok Bot 用 SSH 登上去启动服务，启动命令部署时实测后写在这里。
- 第 6 节的局域网验证、第 6 节第 7 项重启演练本次都不做。

## 部署结果（2026-10-17 09:58 上海，以本节为准）
- 已部署 814cd54，入口 http://100.101.33.1:18420/ ，/health 返回 ok、commit 814cd54、words 0。
- HOST=100.101.33.1，PORT=18420，APP_COMMIT=814cd54。
- ALLOW_CIDRS（全部 /32）：100.101.33.1 mac-studio、100.103.243.6 grok-bot-vm、100.94.88.50 iphone182、100.95.34.44 macbook-air、100.95.235.78 muse、100.118.171.77 pc、100.110.193.93 redmibook、100.108.125.14 tencent-beijing、100.116.239.91 z2pro-0qxv。已排除 sqkjxx-sx 100.118.192.105。
- 重启后手动启动：SSH 登上 Studio 运行 `~/apps/vocab/start.sh`（幂等，已实测不会重复启动；无人登录时用 user 域拉起未验证）。
- 与方案的出入：本机没有 rsync，改用 tar | ssh，排除内容不变。
- 未验证：真实设备浏览器、名单外设备返回 403、重启演练、发音、孩子用哪台设备待用户确认。

## 课标词表正式导入（待独立验收通过，2026-10-17 12:48 上海整理）
- 版本 b4429a2（本机 /workspace/vocab-saas/app 分支 feat/curriculum-import，git archive 导出、本机构建，version.json 须 b4429a2 dirty:false）。依赖/lock 未变，无新环境变量；新列启动或导入时自动 ALTER。
- 导入文件传到 Studio ~/apps/vocab/import/kb2022/，sha256：level3 1118225a…c055、level2 f94670b9…be07、manual c29051f2…f0a4、ecdict 1a6947e0…c3cf（ecdict.csv 不在 git，单独传）。
- 顺序：部署 releases/b4429a2 → npm ci --omit=dev + require 关卡 → 停服务 → 备份 vocab.db(+wal/shm) 到 backups/ → 导入前跑数量核对 → 换 current、APP_COMMIT=b4429a2 → import --dry-run → 正式 import → 数量核对 → 启动 → /health 须 b4429a2、words 1600。
- 导入命令和数量核对 node 命令见群聊工程负责人 12:44 / 12:48 消息；预期 {"all":1600,"sample":0,"total":1600,"l2":505,"l3":1095,"core":1095,"manual":59,"flagged":0,"cards":0,"logs":0}。
- 回滚：停服务，current 指回 814cd54，APP_COMMIT=814cd54，用备份恢复数据库，启动，/health 须 814cd54、words 0。

## 课标导入结果（2026-10-17 12:46 上海，以本节为准）
- Studio 现行 b4429a2，/health {"ok":true,"commit":"b4429a2","words":1600}；导入后计数与预期一致（1600/505/1095/manual 59/flagged 0）。
- 备份 ~/apps/vocab/backups/vocab.db.pre-kb2022-20261017-1246（sha256 b9bea26a…d482，无 wal/shm）；config/vocab.env.bak-814cd54。
- 偏差：git archive 无 .git 致 version.json=unknown，改为 /tmp clone 检出 b4429a2 构建。
- 回滚：停服务 → current 指回 releases/814cd54 → 恢复 vocab.env.bak-814cd54 → 恢复上述备份 → 启动，/health 须 814cd54 words 0。
- 未验证：用户设备浏览器（well 4 行、o’clock 弯引号）、发音、重启演练。

## 上线 v3 第一期 fd89c10（18:11）
时间均为 2026-10-17 上海。用户 18:07 在 Grok Bot 聊天里亲自确认部署。
- 源码：本机 /workspace/vocab-saas/app 仓库分支 feat/v3-phase1 = fd89c1060018b9daabd5b889a980aaa2bfb072d8（app 工作区本身检出的是 feat/curriculum-import@b4429a2，fd89c10 在 wt-v3 工作区；按提交号构建，不受影响）。package.json/lock 与 b4429a2 相同，无新环境变量。
- 构建：/tmp clone 检出 fd89c10，npm ci + npm run build，dist/version.json = {"commit":"fd89c10","dirty":false}。vitest 130/132 通过，失败的 2 个是 clone 里没有 ../v2/内容.md（路径问题），在 wt-v3 工作区重跑这 2 个文件 10/10 通过。
- 传输：tar | ssh 到 releases/fd89c10（排除 .git、node_modules、qa、data/*.db*），Studio 上 npm ci --omit=dev；better-sqlite3 在 Node v26.4.0（ABI 147）上 require 通过，不需要重编译。
- 18:08 预采集（服务运行中，只读）：/health {"ok":true,"commit":"b4429a2","words":1600}；current → releases/b4429a2；计数 {"all":1600,"sample":0,"l2":505,"l3":1095,"core":1095,"manual":59,"flagged":0,"cards":10,"logs":3}；cards id+due 排序 dump sha256 15295a18…5732。
- 18:10 停服务：launchctl bootout gui/501/com.caogong.vocab，18420 已关、无进程。停后计数和 due dump 与预采集相同。
- 备份：backups/vocab.db.pre-v3p1-20261017-1810，446464 字节，sha256 f64f9092…66c3（停服务后 wal/shm 已被合并删除，所以只有主文件）；due dump backups/vocab.db.pre-v3p1-20261017-1810.cards-due.tsv（271 字节，sha256 15295a18…5732）；config/vocab.env.bak-b4429a2（与原 vocab.env sha256 相同）。releases/b4429a2 保留。
- 迁移核对（备份副本 /tmp/v3p1-verify.db）：verify-migration 退出码 0，words 1600/1600、cards 10/10、review_logs 3/3、wrong_words 1/1，旧列全部不变；review_logs 新增 qtype/counted/context；新表 question_issues/daily_stats/streak_makeups；settings 3→9；daily_stats 1 行；integrity ok。用 fd89c10 的 openDb 真实迁移副本后，按 b4429a2 的列算 words/cards/review_logs 行哈希与备份一致。b4429a2 代码临时起在 127.0.0.1:18499 读迁移后的副本：/health b4429a2 words 1600，/api/today 正常；临时进程已停，副本已删。
- 18:11 切换：current → releases/fd89c10；vocab.env 只改了 APP_COMMIT=b4429a2 → fd89c10（diff 只有这一行，HOST、PORT、DB_PATH、ALLOW_CIDRS 未动）；start.sh → "started in gui/501"。
- 18:11 验证：/health {"ok":true,"commit":"fd89c10","words":1600}；/version {"commit":"fd89c10","source":"env"}；/version.json fd89c10 dirty:false；首页 200；lsof 只监听 100.101.33.1:18420（PID 71096），127.0.0.1 无响应。计数与预采集相同；due dump 与备份 dump 逐字节相同（sha256 15295a18…5732）；三表旧列行哈希相同；integrity ok。再跑 start.sh → "already running"。其他服务不变：hermes 1929/0、xianyu-backend 1913/0、xianyu-tunnel 58613/255。err.log 为空，out.log 只有 listen 行。
- 回滚（没用上）：bootout → current 指回 releases/b4429a2 → 用 vocab.env.bak-b4429a2 恢复 → 删掉 data/vocab.db-wal/-shm，用 backups/vocab.db.pre-v3p1-20261017-1810 恢复（sha256 须 f64f9092…66c3）→ start.sh → /health 须 b4429a2 words 1600。注意：fd89c10 上线后的新学习记录在回滚时会丢失。旧版 b4429a2 能读迁移后的库，所以只回代码、不回库也行。
- 未验证：用户设备浏览器里的 v3 界面、发音、重启演练（按用户要求不做）；独立验收还没从真实入口复查 API。
