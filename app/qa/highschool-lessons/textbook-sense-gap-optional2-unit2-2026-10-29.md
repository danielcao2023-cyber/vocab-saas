# 选择性必修二 Unit 2 教材义项与例句缺口

2026-10-29。对照人教版选必二词表印刷页 109–110（PDF 物理页 116–117）和实际 lesson；教材来源版本与校验值见 [Unit 1 审计](optional2-unit1-wordlist-audit-2026-10-29.md)。正式 catalog 的 `pep2019-optional-2` 成员及 seed 中 `vocabulary_entry_map.entry_key` 对照确认 stable key 和 ID。只修改下列 lesson；没有修改词条身份、学习数据或录音。

| stable key / ID | 修改 | 依据 |
|---|---|---|
| complex / 3131 | 补充语法中的复合句及例句。 | [Cambridge Grammar](https://dictionary.cambridge.org/grammar/british-grammar/sentence-types) |
| qualification / 3133 | 原有资格义项，补学历资格的例句和搭配。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/qualification) |
| presentation / 3144 | 除报告外，补正式出示或交付的用法。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/presentation) |
| edition / 3152 | 除书籍版本，补报刊或节目的特定一期。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/edition) |
| gain / 3185 | 原有增长例句；补名词好处、增加的分义和例句。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/gain) |
| engage / 3147 | 原用法提示已有 engage in，但缺主语自主参加的例句；补例句和搭配。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/engage-in) |
| involve / 3149 | 已有涉及、需要及使参与例句；教材中文“影响”不能直接视作与 affect 可互换，不增未经确认的新义。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/involve) |

六份修改逐一调用真实 `validateLesson` 并通过，`createLessonReader` 返回 ready 且完整 senses 与 JSON 一致；`npx vitest run test/lessons.test.ts` 通过（1 文件、6 项）。例句为原创或常见搭配的改写，尚未经英语教师独立审校；其他教材单词、录音和所有可能义项不属于本批全面核验范围。
