# 高中空音标专名核查（第十二组）

2026-10-29。按 catalog v135、seed stable key 和真实 lesson reader 空 IPA 清单选取；仅以词典完整专名标音为据，不拼接单词；未试听录音。

| 词头（seed ID） | 英式 | 美式 | 来源 |
| --- | --- | --- | --- |
| Albert Einstein (2754) | /ˌælbət ˈaɪnstaɪn/ | /ˌælbərt ˈaɪnstaɪn/ | [Oxford Learner’s Dictionaries · 完整专名音标](https://www.oxfordlearnersdictionaries.com/definition/english/albert-einstein) |
| Florence Nightingale (2756) | /ˌflɒrəns ˈnaɪtɪŋɡeɪl/ | /ˌflɔːrəns ˈnaɪtɪŋɡeɪl/ | [Oxford Learner’s Dictionaries · 完整专名音标](https://www.oxfordlearnersdictionaries.com/definition/english/florence-nightingale) |
| Isaac Newton (2760) | /ˌaɪzək ˈnjuːtən/ | /ˌaɪzək ˈnuːtən/ | [Oxford Learner’s Dictionaries · 完整专名音标](https://www.oxfordlearnersdictionaries.com/definition/english/isaac-newton) |
| Lake Huron (3329) | /ˌleɪk ˈhjʊərən/ | /ˌleɪk ˈhjʊrɑːn/ | [Cambridge Dictionary · 完整专名音标](https://dictionary.cambridge.org/dictionary/english/lake-huron) |
| Nova Scotia (3334) | /ˌnəʊvə ˈskəʊʃə/ | /ˌnoʊvə ˈskoʊʃə/ | [Cambridge Dictionary · 完整专名音标](https://dictionary.cambridge.org/dictionary/english/nova-scotia) |
| the Antarctic (3675) | /ði ænˈtɑːktɪk/ | /ði ænˈtɑːrktɪk/ | [Oxford Learner’s Dictionaries · 完整专名音标](https://www.oxfordlearnersdictionaries.com/definition/english/the-antarctic) |
| Alexander Fleming (13107) | /ˌælɪɡzɑːndə ˈflemɪŋ/ | /ˌælɪɡzændər ˈflemɪŋ/ | [Oxford Learner’s Dictionaries · 完整专名音标](https://www.oxfordlearnersdictionaries.com/definition/english/alexander-fleming) |

Alexander Fleming 位于 keyed 资源，运行时用真实 seed ID 替换资源里的占位 wordId；牛津英式另有 /ˌælɪɡzændə ˈflemɪŋ/ 变体，此次呈现其首列英式读法。the Antarctic 包含冠词音素。Lake Louise (3323)、Hurricane Katrina (3611)、Marie Curie (4086) 未找到可直接核实完整词头音标，保留待核。

七份修改均通过实际 validateLesson 和 createLessonReader，读取值与写入值一致，其中 keyed 项按生产 reader 的 wordId 覆盖方式验证。`npx vitest run test/lessons.test.ts test/lesson-ipa-fallback-ui.test.ts`：2 文件、9 项通过。录音未经试听，不能声称与音标匹配。
