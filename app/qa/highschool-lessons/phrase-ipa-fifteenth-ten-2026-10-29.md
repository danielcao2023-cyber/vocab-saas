# 高中空音标专名核查（第十五组）

2026-10-29。由 catalog v135、seed stable key 与实际 reader 的空 IPA 清单选取，写入前确认 lesson 为空；只采用可靠来源对完整词头的直接标音。录音未试听。

| 词头（seed ID） | 状态 | 依据或待核原因 |
| --- | --- | --- |
| Machu Picchu (1741) | 已补英、美 /ˌmɑːtʃuː ˈpiːktʃuː/ | [剑桥完整词头](https://dictionary.cambridge.org/pronunciation/english/machu-picchu)，按其英语发音原样保留 k。 |
| the Eiffel Tower (1733) | 待核 | 有第三方转载的教材列表，但冠词音素和英语口音出处不能可靠确认。 |
| the Andes Mountains (1738) | 待核 | 暂未找到可靠完整词头标音。 |
| the Amazon rainforest (1739) | 待核 | 暂未找到可靠完整词头标音。 |
| the Inca Empire (1740) | 待核 | 暂未找到可靠完整词头标音。 |
| Lake Titicaca (1745) | 待核 | 找到分音节读音，但缺少可靠完整词头重音标记。 |
| Aswan Dam (1972) | 待核 | 暂未找到可靠完整词头标音；仅有地名 Aswan 标音不够。 |
| Saint Basil's Cathedral (1982) | 待核 | 暂未找到可靠完整词头标音。 |
| the USSR (2597) | 待核 | 所见词典标注 USSR 字母读法，未找到含 the 的完整词头标音。 |
| the International Space Station (2606) | 待核 | 所见权威教学材料完整词头不含 the，不能机械添加冠词。 |

Machu Picchu 实际 validateLesson 与 createLessonReader 通过，读出音标与写入一致。`npx vitest run test/lessons.test.ts test/lesson-ipa-fallback-ui.test.ts`：2 文件、9 项通过。未试听录音，不能据此断言录音与音标匹配。
