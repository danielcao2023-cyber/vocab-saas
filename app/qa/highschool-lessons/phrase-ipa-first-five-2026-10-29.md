# 5 个高中常见短语：完整短语音标核验

仅接受词典对完整短语直接标注的 IPA，不把单词音标机械拼接，也不推测音频的口音或内容；ID 为本地 seed 映射，非跨设备稳定身份。

| stable key | 检查结果 | 来源与边界 |
| --- | --- | --- |
| senior high school | 已将英式 /ˌsiːniə ˈhaɪ ˌskuːl/、美式 /ˌsiːnjɚ ˈhaɪ ˌskuːl/ 写入 lesson ID 1617 的对应字段 | [剑桥完整短语词条](https://dictionary.cambridge.org/dictionary/english/senior-high-school)；音节点分隔符省略，不改变音素或重音。句中重读可能变化。 |
| at last | 保持空，待核 | [剑桥短语页](https://dictionary.cambridge.org/dictionary/english/at-long-last)有释义，没有完整短语 IPA；另有词表列出音标，但本轮要求词典直接标注。 |
| what if | 保持空，待核 | [剑桥 what if 释义](https://dictionary.cambridge.org/dictionary/english/what-if?q=what-if_1)无短语 IPA；其 what-if 名词页面不等同该疑问句用法。 |
| concentrate on | 保持空，待核 | [剑桥 concentrate 词条](https://dictionary.cambridge.org/dictionary/english/concentrate)仅给动词单词音标及搭配例句，并无完整短语 IPA。 |
| make an impression | 保持空，待核 | [剑桥 impression 词条](https://dictionary.cambridge.org/us/dictionary/english/impression)展示搭配但未提供完整短语 IPA。 |

1617 经实际 `validateLesson` 和 `createLessonReader` 检查通过；`test/lessons.test.ts` 与 `test/lesson-ipa-fallback-ui.test.ts` 共 9 项通过。未试听录音；没有改 catalog、用户数据或其他词条。
