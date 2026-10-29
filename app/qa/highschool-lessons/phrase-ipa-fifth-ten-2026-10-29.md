# 高中空音标短语核查（第五组）

2026-10-29；范围由 catalog v135 与 seed 的 stable key 关联、实际 lesson reader 的空 IPA 清单选取。仅核对完整词组的词典直接标音，不从单词音标拼接；未试听应用现有录音。

| 词头（seed ID） | 本轮结果与依据 |
| --- | --- |
| moral dilemma (2354) | 待核。剑桥有[词头](https://dictionary.cambridge.org/us/dictionary/english/moral-dilemma)，本轮未取得完整词组音标。 |
| tuition fees (2365) | 待核。搜索结果有来源标音，但重音与权威词典的 tuition 读法存在疑点，未采用。 |
| resident physician (2372) | 待核。未找到可靠来源对完整词组的直接标音。 |
| fortune cookie (2444) | 补 UK /ˈfɔːtʃuːn ˌkʊki/、US /ˈfɔːrtʃuːn ˌkʊki/；[剑桥](https://dictionary.cambridge.org/pronunciation/english/fortune-cookie)。 |
| solar system (2560) | 补 UK /ˈsəʊlə ˌsɪstəm/、US /ˈsoʊlɚ ˌsɪstəm/；[剑桥](https://dictionary.cambridge.org/dictionary/english/solar-system) 词头列 the solar system，标音实际为 solar system，不包括 the。 |
| microwave oven (2567) | 待核。已查来源有不同重音标法；未找到可明确采信英美口音的权威完整词头标音。 |
| flow chart (2723) | 补 UK /ˈfləʊtʃɑːt/、US /ˈfloʊtʃɑːrt/；[剑桥 flow chart](https://dictionary.cambridge.org/dictionary/english/flow-chart) 将 flowchart 列为另一写法，[flowchart 词条](https://dictionary.cambridge.org/dictionary/english/flowchart) 给出完整标音。 |
| remote control (2773) | 补 UK /rɪˌməʊt kənˈtrəʊl/、US /rɪˌmoʊt kənˈtroʊl/；[剑桥](https://dictionary.cambridge.org/dictionary/english/remote-control)。词典另有美式重音变体，所填为其学习词典版本。 |
| air conditioner (2774) | 补 UK /ˈeə kənˌdɪʃənə/、US /ˈer kənˌdɪʃənɚ/；[剑桥](https://dictionary.cambridge.org/dictionary/english/air-conditioner)，英国读音末尾链接 r 的条件说明保留在注释。 |
| roller coaster (2876) | 补 US /ˈroʊlər ˌkoʊstər/；[剑桥美式词典](https://dictionary.cambridge.org/us/dictionary/english/roller-coaster)。未取得同词典明确英式音标，UK 保持空。 |

六份修改各自使用实际 validateLesson 检查并通过，createLessonReader 返回 ready 且音标与存储值一致。`npx vitest run test/lessons.test.ts test/lesson-ipa-fallback-ui.test.ts`：2 个文件、9 项通过。测试不代表录音与标音已匹配。
