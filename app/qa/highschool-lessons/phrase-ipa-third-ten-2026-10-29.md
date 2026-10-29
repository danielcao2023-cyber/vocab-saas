# 10 个高中短语的词典音标核验

按正式 catalog stable key 在本地 seed 中定位实际 lesson，英美 IPA 均为空才检查。仅使用权威词典对完整短语直接标示的读音，不机械拼接；不改词库、用户记录或录音，也未试听录音。

| stable key | 本轮结果 | 来源及边界 |
| --- | --- | --- |
| now that | 补美式 /ˈnɑʊ ðət/；英式保留空 | [剑桥 now (that)](https://dictionary.cambridge.org/dictionary/english/now-that)美式词条标示 /ˈnɑʊ (ðət)/，将括号表示的可选 that 展开为本词头含 that 的完整形式；句中可省略 that。 |
| upside down | 补英美 /ˌʌpsaɪd ˈdaʊn/ | [剑桥完整短语](https://dictionary.cambridge.org/pronunciation/english/upside-down)。seed 本有音标，保持不变。 |
| aware of | 保留空 | [剑桥 aware](https://dictionary.cambridge.org/dictionary/english/aware)只有 aware 词头 IPA，未标完整搭配。 |
| in shape | 保留空 | [剑桥 shape](https://dictionary.cambridge.org/us/dictionary/english/shape)列搭配，无完整短语 IPA。 |
| keep track of | 保留空 | [剑桥短语页](https://dictionary.cambridge.org/dictionary/english/keep-track)未标完整短语 IPA。 |
| make fun of | 保留空 | [剑桥短语页](https://dictionary.cambridge.org/dictionary/english/make-fun-of)未标完整短语 IPA。 |
| keep in mind | 保留空 | [剑桥短语页](https://dictionary.cambridge.org/dictionary/english/bear-keep-in-mind)列搭配，无完整短语 IPA。 |
| belong to | 保留空 | [剑桥短语页](https://dictionary.cambridge.org/dictionary/english/belong-to)标 belong，非完整短语 IPA。 |
| as well as | 保留空 | [剑桥短语页](https://dictionary.cambridge.org/dictionary/english/as-well-as)未标完整短语 IPA。 |
| in addition | 保留空 | [剑桥短语页](https://dictionary.cambridge.org/dictionary/english/in-addition-to)未标完整短语 IPA。 |

两个修改均实际 `validateLesson`、`createLessonReader` ready 通过；`test/lessons.test.ts` 与 `test/lesson-ipa-fallback-ui.test.ts` 合计 9 项通过。句中重音、弱读可变化，未试听录音。
