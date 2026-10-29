# 选择性必修三五项用法复核（2026-10-29）

seed v135 `vocabulary_entry_map` 核实 ID 3427、3428、3463、3474、3505 的稳定 key 依次为 rank、purchase、bronze、guarantee、reward。教材词表印刷页 106–107（本地 PDF 物理页 113–114，文件路径与 hash 见 `optional3-unit1-wordlist-audit-2026-10-29.md`）有相应词条与词性义项；未改身份、教材归属或用户记录。

| ID | 本轮发现和处理 | 词典依据 |
|---|---|---|
| 3427 rank | 教材有行列义，原例句只有等级、排名；补行列义。 | [Collins rank](https://www.collinsdictionary.com/us/dictionary/english/rank) |
| 3428 purchase | 教材列购买和购买物品；原名词例仅示物品，补购买行为名词例。 | [Cambridge purchase](https://dictionary.cambridge.org/dictionary/english/purchase) |
| 3463 bronze | 教材列青铜色；原例句显示材质，补颜色例并解释颜色不能证明材质。 | [Cambridge bronze](https://dictionary.cambridge.org/dictionary/english/bronze) |
| 3474 guarantee | 教材列保修单；原名词例未解释产品保修条件，补保修承诺小节。 | [Cambridge guarantee](https://dictionary.cambridge.org/dictionary/learner-english/guarantee) |
| 3505 reward | 教材列报酬；原只用泛泛奖励例，补赏金具体用法。 | [Cambridge reward](https://dictionary.cambridge.org/dictionary/english/reward) |

原合并义项保留；例句为原创但未经母语者审校。本轮未审核其他义项或音标，未处理录音。实际 `createLessonReader` 和 `validateLesson` 定向五项测试以及 `npx tsc --noEmit` 通过。
