# 高中讲解核心例句结构检查（2026-10-30）

范围为当前正式 catalog v137 中有 `pep2019-` 归属的 2730 个唯一稳定键，以构建离线 seed v137 的 `vocabulary_entry_map` 找到词头和 ID，再调用实际服务端 `createLessonReader`，`Log` 使用应用特殊 keyed 读取。复跑 `npx tsx qa/highschool-lessons/scan-non-audio-stable-keys.ts`：缺稳定键映射 0、reader 非 ready 0；reader 所调用的 `validateLesson` 要求每个核心义项至少两个非空中英文例句，因此 ready 不是语义、教材完整性或已安装设备验证的证明。

本轮另在同一映射及 reader 所得 lesson 中遍历核心 `senses[].examples`，查找常见文本待填标记（待补、待完善、暂无、待填写、TODO、TBD、placeholder、例句待）及英文例句里 `sb.`、`sth.`、省略号占位，未命中；仅检测列举的模式，不能排除其他占位形式。比较同一义项内去首尾空白和英文大小写后的重复例句，修复前找到 `erupt` 一项：两条英文均为 “The volcano erupted lava during the night.”，原中文分别称“岩浆”和“熔岩”。根据 [美国地质调查局关于 magma 与 lava 的说明](https://www.usgs.gov/faqs/what-difference-between-magma-and-lava?items_per_page=6&page=1&qt-=)，本轮保留一条并将喷出地表的 lava 译为“熔岩”，减少重复且精确区分两个术语。

仅修改 `data/lessons/1826.json` 中该处；新增真实 reader 及 `validateLesson` 定向测试 `test/highschool-erupt-examples.test.ts`，联合 `test/lessons.test.ts` 共 7 项通过，`npm run typecheck` 通过。未检查所有词的准确性、完整教材义项、真人录音或已安装离线包；结构扫描不能替代逐条语言和教学审校，暂未重新生成离线资产。
