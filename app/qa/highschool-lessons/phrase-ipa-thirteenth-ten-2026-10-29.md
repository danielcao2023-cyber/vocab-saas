# 高中空音标专名核查（第十三组）

2026-10-29。依据 catalog v135、seed stable key 和实际 reader 的空 IPA 清单选取，修改前确认 lesson 仍无音标；要求来源给出完整词头发音，未试听录音。

| 词头（seed ID） | 英式 | 美式 | 依据 |
| --- | --- | --- | --- |
| the Nile (1973) | /ðə ˈnaɪl/ | 待核 | [Business English Magazine vocabulary list · 完整专名音标](https://www.business-english.com.pl/dodatki/BEM%2084%20lista%20slow.pdf) |
| the Kremlin (1980) | /ðə ˈkremlɪn/ | /ðə ˈkremlɪn/ | [Oxford Learner’s Dictionaries · 完整专名音标](https://www.oxfordlearnersdictionaries.com/definition/english/the-kremlin) |
| the Emerald Isle (2181) | /ði ˌemərəld ˈaɪl/ | /ði ˌemərəld ˈaɪl/ | [Oxford Learner’s Dictionaries · 完整专名音标](https://www.oxfordlearnersdictionaries.com/definition/english/the-emerald-isle) |
| the Golden Gate Bridge (2505) | /ðə ˌɡəʊldən ɡeɪt ˈbrɪdʒ/ | 待核 | [Oxford Learner’s Dictionaries · 完整专名音标](https://www.oxfordlearnersdictionaries.com/definition/english/the-golden-gate-bridge) |

未补且保留待核：the Forbidden City (1983) 的国家教育资源词表搜索可见，但 PDF 打开受限且音标字符抽取损坏，未据搜索摘要填入；the Normans (2177)、the Mission District (2506)、the Richmond District (2510)、the Victorian era (3750) 暂无可核对的权威完整词头标音。Battle of Hastings (2178) 的牛津词条含 the，未从不同词头的音标机械去掉冠词。Golden Gate Bridge 的牛津页面美式栏与英式相同且含英式元音，本轮美式不填。

四份修改通过实际 validateLesson 和 createLessonReader，读取音标与写入一致。`npx vitest run test/lessons.test.ts test/lesson-ipa-fallback-ui.test.ts`：2 文件、9 项通过。录音未经试听，不能声称与音标匹配。
