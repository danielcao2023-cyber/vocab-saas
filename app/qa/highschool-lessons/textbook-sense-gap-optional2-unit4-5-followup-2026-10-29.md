# 选择性必修二 Unit 4–5 义项缺口复核

2026-10-29。对照人教选必二原版教材印刷页 112–114（PDF 物理页 119–121）及实际 lesson；教材路径、版本和校验值见 [Unit 1 审计](optional2-unit1-wordlist-audit-2026-10-29.md)。下列 stable key 均为正式 catalog `pep2019-optional-2` 成员，并对照 seed `vocabulary_entry_map.entry_key` 核实 ID。只改 lesson，不改身份、学习数据或录音。

| stable key / ID | 修改 | 来源 |
|---|---|---|
| collapse / 3398 | 补人因病或虚弱突然倒下，明确并不必然失去意识。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/collapse) |
| manual / 3399 | 原有手工和体力义，补手动泵例句及搭配。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/manual) |
| arise / 3271 | 补起床义，标明较正式或文学化语域。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/arise) |
| mist / 3310 | 增加镜面水汽例句及搭配。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/mist) |
| panic / 3377 | 补使动物惊慌的及物例句。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/panic_2) |
| needle / 3370 | 补注射针例句。 | [Cambridge injection](https://dictionary.cambridge.org/dictionary/english/injection) |
| delay / 3369 | 增加使交通工具耽搁的例句。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/delay) |
| desperate / 3384 | 补孤注一掷、冒险尝试的义项。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/desperate) |

八份修改逐一通过实际 `validateLesson`，`createLessonReader` 均返回 ready 且完整 senses 和 JSON 一致；`npx vitest run test/lessons.test.ts` 通过（1 文件、6 项）。新增例句为原创或常用搭配改写，尚未经英语教师独立审校；本批不代表整册已逐义审完，也未试听录音。
