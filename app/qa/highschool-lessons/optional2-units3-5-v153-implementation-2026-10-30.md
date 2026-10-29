# 选必二 Unit 3–5：v153 教材首义

依据 `optional2-unit3-5-seed-priority-proposals-2026-10-30.json` 和教材印刷页 110–114，修订 35 个 vocabulary 词条。逐条核对现行 catalog 与 seed 的完整旧值、source 和 flag，均无历史 meaningCorrection；采用精确旧值作为迁移条件，保留原有有效义并合并重复。原有次要义项未逐一验证；未就录音或异读声称已试听。

共享核心词 pepper 仅在 source=kb2022、meaning_source=ecdict、flag 为空且完整旧值精确吻合时通过白名单更新；另有 vocabulary 旧值保护，供以该来源创建的设备使用。测试包括手工和待核值、不匹配值以及两条旧词典重导路径。教材义是甜椒/灯笼椒，保留胡椒等旧义。

cobblestone 教材列形容词，[Oxford Advanced Learner’s Dictionary](https://www.oxfordlearnersdictionaries.com/us/definition/english/cobblestone_1) 也单列该形容词；首列“铺有鹅卵石的”，保留名词鹅卵石。Merriam-Webster 将 cobblestone 列为名词并另列 cobblestoned 形容词，不同词典处理有差异；两种词形没有混同。scream 合并重复动词释义。两项 expected 旧全文保持不变，相关 210 项测试与 typecheck 通过。

四份定向测试共 361 项：覆盖服务端与 SQL.js 离线数据库、V2/V3 未答题重发、已答题历史和幂等提交、计划保留及手工/待核/不匹配值保护；typecheck 通过。此为隔离测试，非安卓真机验收。
