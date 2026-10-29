# 10 个高中短语的完整短语音标

以当前 catalog stable key 识别词条，使用本 seed 本地 ID 读取 lesson；只采用词典直接给出的完整词头音标，不拼接单词。未更改 catalog、用户数据或录音，也未试听。句中重音可能变化。

| stable key | 本轮结果 | 来源及边界 |
| --- | --- | --- |
| junior high school | 补英式 /ˌdʒuːniə ˈhaɪ skuːl/ | [剑桥完整短语](https://dictionary.cambridge.org/pronunciation/english/junior-high-school)英式明确；页面美式显示 /ˌdʒuː.ni.njɚ/ 的重复音节与其他来源不一致，本轮不照抄，保留美式待核。 |
| blog post | 补英式 /ˈblɒɡ ˌpəʊst/ 和美式 /ˈblɑːɡ ˌpoʊst/ | [剑桥完整短语](https://dictionary.cambridge.org/pronunciation/english/blog-post)。 |
| take notes | 保留空 | [剑桥 note](https://dictionary.cambridge.org/dictionary/english/note)给搭配例句，未直接标完整短语。 |
| on earth | 保留空 | [剑桥短语页](https://dictionary.cambridge.org/dictionary/english/on-earth?q=on-earth_1)未给完整短语 IPA。 |
| day and night | 保留空 | [剑桥短语页](https://dictionary.cambridge.org/dictionary/english/day-and-night)未给完整短语 IPA。 |
| due to | 保留空 | [剑桥短语页](https://dictionary.cambridge.org/dictionary/english/due-to)未给完整短语 IPA。 |
| stir up | 保留空 | [剑桥短语页](https://dictionary.cambridge.org/dictionary/english/stir-up)展示 stir 单词的 IPA，并非完整短语。 |
| go through | 保留空 | [剑桥短语页](https://dictionary.cambridge.org/dictionary/english/go-through)展示 go 的 IPA，并非完整短语。 |
| break away | 保留空 | [剑桥短语页](https://dictionary.cambridge.org/dictionary/english/break-away)展示 break 的 IPA，并非完整短语。 |
| on average | 保留空 | [剑桥短语页](https://dictionary.cambridge.org/dictionary/english/on-average)未给完整短语 IPA。 |

两项变更逐条经 `validateLesson` 和实际 `createLessonReader` ready 验证；`test/lessons.test.ts` 与 `test/lesson-ipa-fallback-ui.test.ts` 合计 9 项通过。
