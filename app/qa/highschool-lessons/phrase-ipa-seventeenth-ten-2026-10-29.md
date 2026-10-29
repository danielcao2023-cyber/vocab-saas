# 高中短语完整词头音标核查：第十七批

2026-10-29；检查以下 10 个原始空音标词头，只接受可靠来源直接给出的完整词头音标，不拼接单词音标。未试听、修改或判定录音。

| 词头（ID） | 结果和依据 |
|---|---|
| light-emitting diode (3049) | 补英、美完整音标，[Cambridge](https://dictionary.cambridge.org/us/pronunciation/english/light-emitting-diode)，英美音标主次重音不同。 |
| dim sim (3841) | 补英、美完整音标，[Oxford Learner’s Dictionaries](https://www.oxfordlearnersdictionaries.com/us/definition/english/dim-sum)，页面在 dim sum 词条的 dim sim 变体处直接给出两种口音标音；此处仅用于发音，不因此认定澳式 dim sim 与 dim sum 的菜品完全相同。 |
| daily routine (2782) | 待核；搜索到 [SpanishDictionary](https://www.spanishdict.com/pronunciation/daily%20routine) 的音节 IPA，但未明确标记重音。 |
| sense of touch (3340) | 待核；[Cambridge 搭配例句](https://dictionary.cambridge.org/example/english/sense-of-touch)未给完整标音。 |
| theoretical framework (3089) | 待核；[Forvo](https://forvo.com/word/theoretical_framework/)有录音条目，无可靠完整 IPA。 |
| cardiopulmonary resuscitation (3407) | 待核；[Cambridge 完整发音页](https://dictionary.cambridge.org/pronunciation/english/cardiopulmonary-resuscitation)在本次访问返回 403，未能验证其音标内容。 |
| mouth-to-mouth rescue breathing (3408) | 待核；[Cambridge](https://dictionary.cambridge.org/us/dictionary/english/mouth-to-mouth)出现完整短语的例句，但不是完整词头的音标。 |
| manuka honey (3870) | 待核；[毛利语和英文读音讨论](https://www.temarareo.org/TMR-Manuka.html)说明存在变读，未核实可靠完整短语英美 IPA。 |
| Jade Rabbit (2607) | 待核；未找到可靠完整词头标音。 |
| take out a loan (2616) | 补英音：[Compact First 词表](https://www.venturesbooks.cz/ke-stazeni/category/258-compact-for-schools?download=2617:compact-first-original)第 7 页明确给出 teɪk aʊt eɪ ləʊn；沿用原表不额外推断重音，美音待核。 |

验证：三项修改均通过实际 `validateLesson`，`createLessonReader` 返回 ready 且音标与 JSON 一致；`npx vitest run test/lessons.test.ts test/lesson-ipa-fallback-ui.test.ts` 通过（2 文件、9 项）。测试仅验证结构和读取，不验证发音真实性。
