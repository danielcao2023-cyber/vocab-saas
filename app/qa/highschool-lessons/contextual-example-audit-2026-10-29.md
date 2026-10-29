# 高中讲解模板化初筛与示例修订

2026-10-29。执行 `python3 qa/highschool-lessons/scan-contextual-examples.py` 可复现统计：正式 catalog 高中成员 2730 条，经 seed stable key 映射有数字 lesson 文件可扫描 2710 条，20 条无对应数字文件未扫描（可能有 keyed 读取回退）；本脚本并非实际 reader 全覆盖，也未判定所有词义是否正确。

重复文本只是候选线索，不自动等同错误。当前在所扫描范围中，搭配注释“结合语境理解这一搭配。”出现 126 次，“常见用法。”85 次，“结合例句理解搭配。”70 次，“结合语境理解。”58 次；它们教学信息较少，但有些搭配本身已经清楚，不应机械批量替换。词头替换后出现至少三次的例句模式共 31 组：如 12 次“They visited {word}.”、11 次“She studies {word}.”、9 次“The class discussed {word}.”；这类模板并非语法错误，但脱离词义的泛用例句有时难以帮助学习。

抽查后仅修改以下 5 个能自然提供语义线索的条目，保留其余合理模板；已核对 catalog 高中归属及 seed 的 `vocabulary_entry_map.entry_key` 到 ID 映射：

| stable key / ID | 修改要点 | 语义参考 |
|---|---|---|
| dioxide / 3558 | 由“名称含 dioxide 一词”改为二氧化碳的碳、氧原子组成。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/dioxide) |
| photography / 3431 | 以野生动物摄影和相机提供活动语境。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/photography) |
| nutrition / 3027 | 用食物和健康的关系说明营养学。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/nutrition) |
| philosophy / 2116 | 举出知识、是非等哲学问题。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/philosophy) |
| phrase / 2763 | 给出 in the morning 这一具体短语及其时间含义。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/phrase) |

五个修改均调用实际 `validateLesson` 成功、`createLessonReader` 返回 ready 且 senses 内容与 JSON 一致；`npx vitest run test/lessons.test.ts` 通过（1 文件、6 项）。新例句为原创或常用表达改写，未经教师独立审校；没有检查录音。示例少信息是质量候选而非自动判错，原例句也未必不正确，其他重复模板仍须逐项判断。
