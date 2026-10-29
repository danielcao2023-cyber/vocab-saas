# 高中短语完整词头音标核查：第十六批

2026-10-29；仅核查下面 10 个词头的完整短语标音，不涉及录音、音频内容和口音匹配。不存在可靠完整标音的词条保持空白；没有从单词音标拼接短语读音。剑桥英式词尾可连读 r 未写进独立短语的英式音标。保留原词条身份和其它内容。

| 词头（ID） | 结果 | 依据和边界 |
|---|---|---|
| grizzly bear (3282) | 补英、美音标 | [Cambridge](https://dictionary.cambridge.org/pronunciation/english/grizzly-bear)；英、美复合词重音有区别。 |
| freezing cold (3285) | 补英音 | [Business in Context 1 词表第 41 页](https://www.scook.at/cdn_proxy/e65a9a87-5348-447d-af9e-56396d817cfd/0451450101_0448210101_WL_BiC1_Lernwortschatz_gesamt.pdf)；未找到可靠的完整美式标音，保留空白。 |
| Heimlich manoeuvre (3409) | 补英、美音标 | [Cambridge](https://dictionary.cambridge.org/us/pronunciation/english/heimlich-manoeuvre)；呈现完整词头。 |
| duck-billed platypus (3904) | 补英、美音标 | [Cambridge](https://dictionary.cambridge.org/us/pronunciation/english/duck-billed-platypus)。 |
| flea collar (4080) | 补英、美音标 | [Cambridge](https://dictionary.cambridge.org/us/pronunciation/english/flea-collar)；另一词典重音不同，因此采用剑桥完整词条变体。 |
| take up a position (13106) | 待核 | [Longman 搭配词典](https://24talk.ir/wp-content/uploads/2020/10/Longman-Collocations-Dictionary-and-Thesaurus-by-Pearson-Education-z-lib.org_.pdf)列搭配及例句，未见完整标音。 |
| vital sign (13114) | 待核 | [Vocabulary.com](https://www.vocabulary.com/dictionary/vital%20sign) 提供读音，但其所示重音缺少常见主重音标记；本轮未确认足够可靠的单数完整词头标音。 |
| geothermal park (13115) | 待核 | 未找到可靠完整短语标音；[有道搜索结果](https://dict.youdao.com/w/geothermal_park/)不构成完整标音依据。 |
| red braised pork (3245) | 待核 | [MDBG](https://www.mdbg.net/chinese/dictionary?page=worddict&wdqb=braised&wdrst=0) 给出对应翻译，但未列完整英语音标。 |
| lamb kebab (3218) | 待核 | 未找到可靠词典完整短语标音；[教学材料](https://lib.ysu.am/disciplines_bk/d341080c308c570ac2c8e48679e819a8.pdf)有词组但无完整 IPA。 |

验证：以上 5 个修改项均实际调用 `validateLesson` 和 `createLessonReader`，返回 `true / ready` 且实际读取的 UK/US 音标与 JSON 一致；`npx vitest run test/lessons.test.ts test/lesson-ipa-fallback-ui.test.ts` 通过，2 文件、9 测试。没有试听录音，也不推断录音与音标一致。
