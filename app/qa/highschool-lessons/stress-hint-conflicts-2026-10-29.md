# 高中重音标记与提示文字冲突筛查

执行 `cd app && npx tsx qa/highschool-lessons/scan-stress-hint-conflicts.ts`，按 catalog v135、离线 seed 和真实 getter 去重 1979 个已有映射，筛查若干明确的“此部分轻读/重读”等提示与分块 stress 的矛盾。初始扫描 7 项：underwater、leftover、disability、consultation、hypothetical、entrepreneur、intermediate 均把原 IPA 已标次重音的块叫作轻读；现只将提示和 tip 统一写“此部分次重读”，不更改 IPA、音节或重音。修复后同规则扫描 0 项（前后结果分别见同名 JSON 和 `stress-hint-conflicts-after-2026-10-29.json`）。

本规则仅匹配列举的几种汉语模板，不能覆盖所有描述矛盾，更不能证明整词 IPA 符合词典。真实 getter 定向与结构、覆盖测试 3 文件 9 项通过；未处理录音。
