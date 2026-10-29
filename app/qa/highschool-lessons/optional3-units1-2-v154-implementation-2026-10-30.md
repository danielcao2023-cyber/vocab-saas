# 选必三 Unit 1–2：v154 教材首义

依据 `optional3-unit1-v152-seed-first-line-review-2026-10-30.json` 和 `optional3-unit2-v152-seed-first-line-review-2026-10-30.json` 的教材词表核对，修订 25 个 vocabulary 条目。每项对照现行 catalog 与 seed 的完整旧值、source 和 flag，均无历史 meaningCorrection；精确匹配旧全文、保留旧有效义并合并重复。原低频次义并未逐一词典认证。

共享核心 negative 仅在 source=kb2022、meaning_source=ecdict、flag 为空且完整旧值吻合时由白名单更正；另以 catalog 完整旧值保护 vocabulary 来源的设备。manual、待核及不匹配旧值不会被覆盖，测试包含两条核心词重导路径。

三份定向测试共 261 项通过，覆盖在线与 SQL.js 离线、V2/V3 未答题重发、已答题历史和重复提交、计划以及手工/待核保护；typecheck 通过。音频未进行听审，安卓真机尚未验收。

交叉复核后：noble 移除无依据的“vt. 抓住；逮捕”，参见 [Cambridge](https://dictionary.cambridge.org/dictionary/learner-english/noble)；ceramic 的制陶艺术注明常用复数 ceramics，参见 [Cambridge](https://dictionary.cambridge.org/dictionary/english/ceramics)；dynamic 和 arch 合并重复义。上述四项 expected 保留原旧全文，相关 250 项测试及 typecheck 通过。

skip 的悄悄溜走义据 [Cambridge](https://dictionary.cambridge.org/dictionary/english/skip) 加入不及物行，并标常用 skip off/out；Oxford 的及物 skip a place 用法不与其混淆。expected 保持旧值，Unit 2 的 71 项测试与 typecheck 通过。
