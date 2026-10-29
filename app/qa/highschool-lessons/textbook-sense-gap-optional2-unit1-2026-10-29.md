# 选择性必修二 Unit 1 教材义项缺口

2026-10-29。对照人教选必二词表印刷页 108（PDF 物理页 115）及现有 lesson；教材版本路径和校验值见 [Unit 1 词表审计](optional2-unit1-wordlist-audit-2026-10-29.md)。通过正式 catalog `pep2019-optional-2` 成员及 seed 的 `vocabulary_entry_map.entry_key` 核对 stable key 与 ID；只修改 lesson，不更动身份、数据或录音。

| stable key / ID | 处理 | 依据 |
|---|---|---|
| subscribe / 3061 | 原有订阅和赞成，补认购股份（subscribe for）和定期缴费支持组织（subscribe to）两义。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/subscribe) |
| proof / 3063 | 补较正式的检验义及 put … to the proof 用法；不是学校考试。 | [Merriam-Webster](https://www.merriam-webster.com/dictionary/proof) |
| pump / 3065 | 既有水泵义项补充打气筒例句及搭配。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/pump_2) |
| handle / 3070 | 补用手搬动和操纵车辆、动物两义。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/handle_1) |
| finding / 3085 | 补法律裁决义及例句，区分调查发现。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/finding) |
| raw / 3073 | 已有未加工义项及原材料例句；未重复增加。 | 教材词表第 108 页 |

实际验证：五份修改逐一调用 `validateLesson` 成功，`createLessonReader` 返回 ready、义项数量一致；改动 finding 的例句后再次核对实际读取。`npx vitest run test/lessons.test.ts` 通过 1 文件、6 项。新增例句为原创或词典搭配的改写，未经英语教师独立审校；本次不代表全册所有义项已完成核查。
