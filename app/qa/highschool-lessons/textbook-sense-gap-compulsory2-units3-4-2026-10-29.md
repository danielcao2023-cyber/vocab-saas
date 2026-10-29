# 必修二 Unit 3–5 教材义项与例句缺口

2026-10-29。对照人教高中必修二教材词表印刷页 104–105（本地存图 `sources/compulsory-2/112.jpg`、`113.jpg`），与现有 lesson 逐一对照；教材版本及来源见 [Unit 3–4 词表审计](compulsory2-unit3-4-wordlist-audit-2026-10-29.md)。正式 catalog 中均属 `pep2019-compulsory-2`，通过 seed 的 `vocabulary_entry_map.entry_key` 校验 stable key 与 ID。仅修改以下 lesson，不更动词条身份或学习数据。

| stable key / ID | 新增教材义 | 词典依据 |
|---|---|---|
| resident / 2082 | 住院医生，说明美国语境和在职培训。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/resident_1) |
| plus / 2083 | 补充“而且”及名词“加号”。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/plus) |
| tough / 2079 | 严厉、严格。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/tough_1) |
| charge / 2145 | 主管、负责，展示 in charge of 和 take charge of。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/charge_1) |
| generous / 2151 | 数量或大小充裕。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/generous) |
| feast / 2156 | 宗教节日，区别于宴会。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/feast_1) |
| virtual / 2190 | 事实上的、几乎完全的，区别于计算机模拟。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/virtual) |

所有新增义项各配两条例句及两条搭配。七份修改均实际调用 `validateLesson` 并通过，`createLessonReader` 返回 ready 且义项数量一致；最后调整 plus 与 virtual 的内容后，再次校验完整 senses 读取一致。`npx vitest run test/lessons.test.ts` 通过（1 文件、6 项）。例句为原创或常用词典搭配的改写，未经英语教师独立审校；不代表全册已逐义审完；未试听或处理录音。
