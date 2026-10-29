# 高中词条跨设备讲解身份审计

从 `app` 目录运行：

```sh
npx tsx scripts/lesson-identity-index.ts
npx tsx qa/highschool-lessons/check-cross-device-identities.ts
```

依赖当前已生成的 `mobile-public/offline/seed.db`、`mobile-public/offline/lessons`；若缺少或过期，应通过项目认可的安全离线资产生成流程更新后再运行。本脚本仅以只读方式打开固定的离线 seed，不读取运行时用户库。以该 seed 中高中词书成员的去重词条和 stable key 为输入，在独立的内存 SQLite 新建另一套词条，ID 均加 100000，模拟安装顺序不同的设备；不写入原 seed、用户数据或学习记录。服务端和浏览器 SQLite 均使用临时内存库。

逐词请求真实服务端 lesson 路由，以及离线 runtime 分别读取 `data/lessons` 和 `mobile-public/offline/lessons` 的路径。验证状态为 ready、返回新设备 ID、显示词头相符（含 Log 的显示修正），特殊 keyed 文件沿真实路由处理；检查每个成员至少拥有一个 stable key。首条命令验证 JSON 和运行时 TS 索引与 catalog、审定数字讲解及显式别名一致。

2026-10-29 本地 Node v26.4.0、tsx 4.23.15：高中唯一词条 2730；无 stable key 0；线上、离线源码资源及当前离线资产三条读取路径全部成功 2730，失败 0。此统计是固定 seed 的可读取性与身份测试，不是对教材覆盖完整性、释义准确性、例句质量、录音和学习调度的逐项审定。它模拟新设备变更 ID；升级旧题、用户编辑词头和数字 ID 碰撞另由 `test/stable-lesson-identity.test.ts` 等回归覆盖，不能用此计数代替真机升级验收。
