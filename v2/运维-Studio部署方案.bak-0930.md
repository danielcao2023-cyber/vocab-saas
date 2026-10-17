# 初三背单词 · Studio 部署方案（草案，待用户审阅）

- 负责人：运维巡检；编写时间：见文末交接（上海时间）
- 状态：**只有文档。没有登录 Studio，没有在 Studio 上做任何改动。** Studio 上的每一步写操作和 18420 端口上线，都要先经用户确认。
- 依据：`方案-v2.md`、`v2/工程.md`（08:41 版）、`research/运维巡检.md`。Studio 的环境事实全部引自工程负责人 02:25–08:41 的只读检查，部署前要重查。
- 部署目标版本：**第一期定版 commit `6e31f17`**（09:20 上海定版）。`releases/<commit>` 即 `releases/6e31f17`；部署验证时 `/health` 的 commit 必须是 6e31f17，前端需在新标签页核对。
- 标签：【事实】引自已有实测；【建议】我的方案；【待实测】部署前或部署时要验证。

## 1. 目标环境
- 主机：Mac Studio（家里局域网地址 192.168.100.226），macOS arm64，Node v26.4.0，sqlite3 3.54.0【事实，工程 02:25】。
- 访问范围：只在家里局域网和 Tailscale 内可用，不对公网开放，不用域名，不需要备案。
- 一期**不接 AI**，所以部署不依赖 codex；`~/.codex/config.toml` 不碰。M2 接 AI 时再补一节。
- 端口：18420。02:25 时没有被占用【事实】，部署前要重查。

## 2. 目录和身份（建议）
| 用途 | 路径 | 说明 |
|---|---|---|
| 代码发布 | `~/apps/vocab/releases/<commit短号>/` | 每个版本一个目录，不覆盖旧版本 |
| 当前版本 | `~/apps/vocab/current` → 软链到某个 release | 回滚只需改软链 |
| 数据库 | `~/apps/vocab/data/vocab.db` | 放在 release 之外，升级不会动到 |
| 配置 | `~/apps/vocab/config/vocab.env`（权限 600） | 家庭口令、监听地址都放这里；不进仓库，也不写进 plist |
| 本地备份 | `~/apps/vocab/backups/` | 保留 30 份 |
| 日志 | `~/Library/Logs/vocab/{out,err}.log` | 只记请求概要，不记口令 |
| 服务定义 | `~/Library/LaunchAgents/com.caogong.vocab.plist` | 名字可改，不能和现有的 LaunchAgent 重名 |

- 以用户身份运行，用 LaunchAgent，不用 root 的 LaunchDaemon。
- plist 里 `ProgramArguments` 写 node 的绝对路径（`/opt/homebrew/bin/node`，【待实测】部署时用 `which node` 确认），因为 launchd 的 PATH 很短。设置 `RunAtLoad`、`KeepAlive`，并把 `ThrottleInterval` 设为 10 秒。

## 3. 监听地址：需要注意的三点
1. Fastify 一次 `listen` 只能绑一个地址。要同时绑局域网和 Tailscale 两个地址，就得开两个 listener。或者绑 `0.0.0.0`，再在应用里按来源 IP 放行（127.0.0.1、192.168.100.0/24、100.64.0.0/10）。【建议】**两个 listener 都开，同时做来源 IP 白名单**，双保险。
2. **开机顺序问题**：LaunchAgent 启动时 Tailscale 可能还没连上，这时绑 100.x 地址会报 `EADDRNOTAVAIL`，服务就退出。【建议】应用里对单个地址的绑定失败做重试（例如每 15 秒重试一次），而不是整个进程退出；KeepAlive 只作最后兜底。【待实测】重启 Studio 后两个地址都能绑上。
3. **局域网地址会变吗**：如果 192.168.100.226 是 DHCP 分配的，换了地址服务就绑不上。【需用户确认】路由器上是否给 Studio 做了固定分配。Tailscale 的 100.x 地址一般是固定的，部署时用 `tailscale ip -4` 读取，写进 `vocab.env`。

## 4. Studio 的前提条件（部署前只读检查）
| 检查项 | 怎么看（只读） | 为什么 |
|---|---|---|
| 18420 空闲 | `lsof -nP -iTCP:18420 -sTCP:LISTEN` 没有输出 | 避免冲突 |
| 自动登录 | 看“用户与群组”的自动登录设置，或问用户 | LaunchAgent 要用户登录后才会运行；停电重启后如果停在登录界面，服务不会起来 |
| 不休眠 | `pmset -g` 里 sleep 是 0 | 休眠时孩子打不开 |
| 防火墙 | `/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate` | 如果开着，首次监听可能弹窗，要放行 node |
| Tailscale 状态 | `tailscale status`、`tailscale ip -4` | 确认地址；**不改 ACL** |
| 同名服务 | `launchctl list \| grep -i vocab` 没有输出 | 避免重名 |
| 磁盘 | `df -h ~` | 02:25 剩 962 GiB【事实】，只确认一下 |
| 现有服务基线 | `launchctl list` 里 xianyu-backend、xianyu-tunnel、ai.hermes.gateway 的 PID 和退出码 | 部署后对照，证明没影响别的服务 |

## 5. 部署步骤（每次写操作前都要用户确认）
0. **代码怎么到 Studio**：开发在我这台电脑的 `/workspace/vocab-saas` 进行。【待核实】这台电脑能不能直接连到 Studio：我之前从这台电脑探测连不上，但工程负责人 02:25 做过 SSH 只读检查，具体走的是哪条路径要由工程负责人说明。可选做法有两种：推到私有 Git 仓库后在 Studio 上拉取，或者用 rsync 走已有的 SSH。不新建任何密钥，凭据不写进文档。
1. 记录上面第 4 节的基线（只读）。
2. 建目录 `~/apps/vocab/{releases,data,config,backups}` 和日志目录。
3. 把代码放进 `releases/<commit>`，然后**在 Studio 上**执行 `npm ci` 和构建。better-sqlite3 是原生模块，必须在 Studio（arm64 + Node 26）上编译或下载对应的预编译包，不能从我这台 Linux 电脑拷过去。【待实测】better-sqlite3 对 Node 26 的预编译包是否可用，没有的话要有 Xcode Command Line Tools 才能编译。
4. 写 `config/vocab.env`（chmod 600），内容包括口令、两个监听地址、数据库路径。口令由用户自己设，不进聊天。
5. 如果已经有数据库（升级场景），先做部署前备份（见第 7 节），再跑数据库迁移。
6. 软链 `current` 指向新版本。
7. 写 plist，执行 `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.caogong.vocab.plist`。
8. 按第 6 节验证；全部通过后交独立验收从浏览器实测。

升级时重复 3、5、6，最后 `launchctl kickstart -k gui/$(id -u)/com.caogong.vocab` 重启服务。

## 6. 验证（分层，不能用一层代替另一层）
1. **进程**：`launchctl print gui/$(id -u)/com.caogong.vocab` 显示 running，`last exit code` 正常。
2. **端口**：`lsof -nP -iTCP:18420 -sTCP:LISTEN` 只出现局域网地址和 Tailscale 地址，**不能出现 `*:18420`**。
3. **接口**：在 Studio 上对两个地址分别 `curl -s http://<地址>:18420/health`，都返回正常。
4. **反向检查**：没有口令时，除 /health 外的接口要被拒绝。用不在白名单里的来源访问也要被拒绝（能做就做）。
5. **真实网络**：
   - 家里另一台设备通过局域网地址打开；
   - 一台不在家里网络的设备（例如手机关掉 Wi-Fi，只开 Tailscale）通过 100.x 地址打开。
6. **浏览器和业务**（交独立验收）：孩子用的那台电脑和浏览器能打开页面、输入口令；完成一组复习后，重启服务（kickstart）再看，进度还在。
7. **重启演练**：重启一次 Studio，不手动干预，服务能自己起来，两个地址都在监听。（需用户选个方便的时间。）
8. **对照基线**：xianyu-backend、xianyu-tunnel、ai.hermes.gateway 的状态和部署前一样。

## 7. 备份
- **部署前和迁移前**：`sqlite3 ~/apps/vocab/data/vocab.db ".backup ~/apps/vocab/backups/vocab-<时间>-predeploy.db"`。开着 WAL 模式时也要用 `.backup`，不要直接拷文件。
- **每晚备份**：用一个独立的 LaunchAgent（StartCalendarInterval，例如每天 03:30）执行 `.backup`，本地保留 30 份。这属于新增的定时任务，**需要用户单独同意**。
- **异地备份**：复制到 NAS 或腾讯云，**由用户决定去哪里、什么路径**（方案-v2 第 8 节第 4 项还没有答复）。NAS 只在局域网可用，SSH 端口 10000【事实，wiki】。
- **恢复演练**：每月一次，把一份备份拷到临时路径，用 `sqlite3 <文件> "PRAGMA integrity_check;"` 检查，再用一个测试实例打开看看。

## 8. 回滚
- **触发条件**：第 6 节第 1–3 项有任何一项失败；孩子打不开或进度丢了；其他服务的状态和基线不一样。
- **代码回滚**：软链 `current` 改回上一个 release，然后 `launchctl kickstart -k gui/$(id -u)/com.caogong.vocab`。
- **数据回滚**（只在迁移出问题时）：先停服务（`launchctl bootout gui/$(id -u)/com.caogong.vocab`），用 predeploy 备份覆盖 `vocab.db`，同时删掉 `-wal` 和 `-shm` 文件，再 bootstrap。这会丢掉部署之后的学习记录，要先和用户说明。
- **完全撤除**：bootout，删掉 plist；确认 18420 已经没有监听；`~/apps/vocab` 先保留，删不删由用户决定。
- **回滚后检查**：再按第 6 节第 1–3 项和第 8 项验证一遍。

## 9. 对 Studio 的影响
- 新增一个用户级常驻 Node 进程，内存预计几十 MB【推断】，和 96 GiB 内存相比可以忽略。
- 新占用 18420 端口，只绑两个内网地址。
- 不改 Tailscale ACL、SSH、codex 配置和现有的 LaunchAgent；不装全局 npm 包；不用 sudo（如果防火墙放行要 sudo，先停下来问用户）。

## 10. 未验证项
- 这台电脑到 Studio 的传输路径（第 5 节第 0 步）。
- better-sqlite3 在 Node 26 上的安装方式。
- Studio 有没有设自动登录和不休眠，防火墙状态，局域网地址是不是固定的。
- 开机时 Tailscale 地址的就绪时间，以及应用的重试逻辑是否有效。
- 18420 端口当前是否空闲（02:25 之后没再查过）。

## 11. 需要用户决定
1. 同意按这份方案在 Studio 部署吗？（工程负责人做出可运行版本、独立验收在本地测过之后再执行）
2. 每晚备份这个定时任务要不要开？异地备份放 NAS 还是腾讯云，路径是什么？
3. 路由器上有没有给 Studio 固定 192.168.100.226？Studio 有没有设自动登录？
4. 重启演练安排在什么时间？
5. 家庭口令由你自己在 Studio 上填进 `vocab.env`，还是由部署的人生成后私下交给你？

## 交接
- 目标：在第一期上线前，准备好可审阅的 Studio 部署方案。
- 状态：草案完成，见下方时间戳（上海时间）。
- 执行位置：只在我这台电脑上写了这份文档；没有连接 Studio。
- 依赖：工程负责人的可运行版本（入口、构建命令、/health 路径、监听配置项），以及用户对第 11 节的答复。
- 下一位负责人：工程负责人确认第 3 节的监听实现和第 5 节第 0 步的传输路径；Grok Bot 汇总后交给用户审阅。
- 写成时间：2026-10-17 08:42（上海时间）

## 补充：对照第一期 commit 3a8430f（2026-10-17 08:52 上海时间，只读查看代码）
- 【事实】`server/src/main.ts` 只调用一次 `listen`，监听地址读 `HOST` 环境变量，默认是 127.0.0.1。应用里没有来源 IP 白名单，也没有家庭口令（README 第 41 行写明“未做”）。
  - 结论：**照现在的代码部署到 Studio，只有 Studio 本机能打开**。如果把 `HOST` 改成 0.0.0.0，家里网络和 Tailscale 里的任何设备不用口令都能读写进度。
  - 部署前要先做完第 3 节的两个 listener、来源 IP 白名单和绑定重试，加不加口令由用户决定。
- 【事实】已有的环境变量 `DB_PATH`、`PORT`、`STATIC_DIR` 正好对应第 2 节的目录布局，`DB_PATH` 指向 `~/apps/vocab/data/vocab.db` 就行。
- 【事实】`npm start` 运行时用 tsx 直接跑 TS，tsx 已在 dependencies 里，生产环境不需要单独编译后端。
- 【待实测｜部署阻塞风险】better-sqlite3 11.x 是在我这台电脑的 Node 20 上装成功的，Studio 是 Node 26.4。11.x 很可能没有 Node 26 的预编译包，到时会在本地编译，需要 Xcode Command Line Tools。部署前在 Studio 的临时目录里试装一次（这是写操作，要先经用户同意，装完删掉），或者改用 Node 自带的 `node:sqlite`，由工程负责人决定。
- 【建议】部署时 `npm ci --omit=dev` 之前，要么先在 Studio 上 build 出 `dist`，要么把 build 好的 `dist` 一起传过去。
- 【事实｜工程负责人 08:52 说明】代码传输路径：从我这台电脑经 Tailscale 用已有的 SSH 配置 rsync 到 Studio（用户此前让 Grok Bot 配好的那条连接），不新建密钥；用户名和地址按此前约定不写进文档。这一步会改 Studio 上的文件，要等用户确认部署后再做。第 5 节第 0 步据此定案。
- 【进行中】工程负责人在实现多地址监听、30 秒重试和来源 IP 白名单（默认只放本机）。新 commit 报出后我再核对。
- 【事实｜08:53 只读看 commit 1e8cd42】白名单按 `req.socket.remoteAddress` 判断，不信任 X-Forwarded-For，也处理了 `::ffff:` 这种映射地址。第 3 节第 1、2 点在代码层面已经满足；两块网卡同时对外服务，要等上了 Studio 实测。
- 【建议】Studio 上 `vocab.env` 这样配：`HOST=127.0.0.1,<局域网IP>,<Tailscale IPv4>`；`ALLOW_CIDRS=127.0.0.1/32,::1/128,192.168.100.0/24,100.64.0.0/10`。局域网网段要在部署时按实际子网掩码重查。只用 Tailscale IPv4，不监听它的 IPv6 地址（fd7a:115c:a1e0::/48）。白名单不要写 0.0.0.0/0。
- 【已定｜工程负责人 08:55】better-sqlite3 部署时用 12.12.0：先在 Studio 上只读运行 `node -p process.versions.modules` 核对 ABI 是否为 147，对不上就改用 `node:sqlite`。在临时目录试装归入部署审批。
- 【建议｜08:58 对照 commit 871ba66】Studio 上只部署正式服务，只开 18420 端口。验收库 `data/qa.db` 和 18423 端口只在我这台电脑上用，不传到 Studio。rsync 时排除 `data/*.db*`、`qa/`、`node_modules/`，免得用开发机的库覆盖 Studio 上的正式库。正式库第一次在 Studio 上用导入脚本单独生成。
- 【事实｜09:05 工程负责人 commit 7bffcee】build 时把 commit 写进 `dist/version.json`。运行时先读 `APP_COMMIT`，再读这个文件，都没有就显示 unknown，不调用 git。所以 rsync 时 `dist/` 要一起传，部署验证时用 `/health` 的 commit 字段核对实际运行的版本，见第 6 节第 3 项。

### 补记 2026-10-17 09:20（上海）：6e31f17 复核后的部署注意
- 前端更新后，已打开的旧标签页会继续跑旧脚本（独立验收 round4 看到过「收起（1）」）。部署验证必须用新开的标签页或强制刷新，并核对加载的 index-*.js 文件名与新 dist 一致，再看 /health 的 commit。
- 6e31f17 起，提交答案遇到 4xx 会提示「页面过期了，刷新一下再继续」。切换版本后，如果孩子的页面还开着，看到这个提示属预期，刷新即可；5xx 和断网仍走离线补存。这个提示在浏览器里还没验证过，部署后不把它当作已验证。
- 6e31f17 没有新增环境变量，部署步骤不变。

### 补记 2026-10-17 09:21（上海）：定版
- 第一期以 6e31f17 定版。在用户确认前不动 Studio，也不再改代码。部署只传这个版本的代码和 dist/，不带 data/*.db*、qa/、node_modules/。
- 已知限制：「页面过期」提示接口已复现，浏览器里没验证过，不阻塞部署。发音、两个地址同时服务、课标官方词表仍未验证。
