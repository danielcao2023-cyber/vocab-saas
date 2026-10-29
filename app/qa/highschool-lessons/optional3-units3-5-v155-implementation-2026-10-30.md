# 选必三 Unit 3–5：v155 教材首义

依据 `optional3-unit3-5-seed-priority-proposals-2026-10-30.json` 和教材印刷页 108–111，修订 26 个 vocabulary 词条。逐一核验 catalog 和 seed 完整旧值及来源，均未标待核、无历史 meaningCorrection；使用精确旧值迁移，合并重复并保留有效旧义。三个专名原值为“无”，只精确匹配该旧值迁移。bark 删除把狗叫标作及物的错误词性；sow 与 polish 的异读/词形暂缓。原低频次义未逐一核证，未声称听审录音。

共享核心 bat 和 folk 分别仅对 kb2022 / ecdict / 无 flag、且完整旧值精确匹配者启用白名单，并为 vocabulary 来源保留独立旧值保护；测试两条核心词重新导入路径、手工与待核保护。核心词 fine 当前为 manual，不覆盖。

五份定向测试合计 282 项通过，覆盖服务端与 SQL.js 离线、V2/V3 未答题重发、已答记录和幂等提交、计划、手工和待核值保护；typecheck 通过。未进行安卓真机验收。

交叉复核后 crush 的及物义“变形”改为“使变形”，符合 [Cambridge](https://dictionary.cambridge.org/dictionary/english/crush) 的挤压致物体损坏或变形用法；expected 旧值未改变，Unit 4 相关 90 项测试通过。
