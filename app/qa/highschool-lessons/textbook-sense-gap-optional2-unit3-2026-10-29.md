# 选择性必修二 Unit 3–4 教材义项与例句缺口

2026-10-29。对照人教选必二词表印刷页 111（PDF 物理页 118）与实际 lesson；教材来源和校验值见 [Unit 1 审计](optional2-unit1-wordlist-audit-2026-10-29.md)。下列词条均核对正式 catalog 的 `pep2019-optional-2` 归属及 seed 的 `vocabulary_entry_map.entry_key` 与 ID；只改 lesson，不改用户记录或录音。

| stable key / ID | 处理 | 参考 |
|---|---|---|
| dairy / 3256 | 补乳品厂或乳品企业义及例句。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/dairy) |
| fundamental / 3259 | 原说明已提 fundamentals，补基本原理名词分义与例句，明确常用复数。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/fundamental) |
| modest / 3262 | 补“朴素的”含义及房屋例句，区分谦虚。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/modest) |
| consistent / 3261 | 原有“始终如一”，补持续稳定增长例句，不将其误用为任意连续事件。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/consistent) |
| massive / 3272 | 补严重损毁用法及例句。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/massive) |
| stable / 3239 | 补人的情绪平稳、稳重用法。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/stable_1) |
| temper / 3224 | 火气及 lose one's temper 已有例句，未重复修改。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/temper_1) |

六份修改分别实际调用 `validateLesson` 成功，`createLessonReader` 返回 ready 且完整 senses 与 JSON 一致；调整 modest、massive 释义之后再次验证。`npx vitest run test/lessons.test.ts` 通过 1 文件、6 项。新增例句为原创或常用词典搭配的改写，未经英语教师独立审校；本批不代表教材全部义项或录音已审核。
