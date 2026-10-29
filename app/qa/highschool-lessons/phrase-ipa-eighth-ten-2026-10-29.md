# 高中空音标词组核查（第八组）

2026-10-29。范围由 catalog v135、seed stable key 和实际 lesson reader 空 IPA 清单选取。只使用词典对完整词头直接标音；未试听应用录音。

| 词头（seed ID） | UK | US | 来源与说明 |
| --- | --- | --- | --- |
| Sri Lanka (1849) | /ˌsriː ˈlæŋkə/ | /ˌsriː ˈlæŋkə/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/sri-lanka) |
| Las Vegas (2253) | /ˌlæs ˈveɪɡəs/ | /ˌlɑːs ˈveɪɡəs/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/las-vegas) |
| Rio de Janeiro (2341) | /ˌriːəʊ di ʒəˈneərəʊ/ | /ˌriːoʊ deɪ ʒəˈneroʊ/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/rio-de-janeiro) |
| San Francisco (2503) | /ˌsæn frænˈsɪskəʊ/ | /ˌsæn frænˈsɪskoʊ/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/san-francisco) |
| the Arctic Circle (2903) | /ði ˌɑːktɪk ˈsɜːkl/ | /ði ˌɑːrktɪk ˈsɜːrkl/ | [牛津](https://www.oxfordlearnersdictionaries.com/definition/english/the-arctic-circle)，包含冠词 |
| in other words (2945) | 待核 | 待核 | [剑桥](https://dictionary.cambridge.org/dictionary/english/in-other-words)有词条但未找到完整词组标音；保留空值。 |
| Quebec City (3330) | 待核 | 待核 | 本轮未找到可确认英美口音的可靠完整词组标音；暂保留空值。 |
| Niagara Falls (3332) | /naɪˌæɡərə ˈfɔːlz/ | /naɪˌæɡrə ˈfɑːlz/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/niagara-falls) |
| The Middle Ages (3478) | /ðə ˌmɪdl ˈeɪdʒɪz/ | /ðə ˌmɪdl ˈeɪdʒɪz/ | [牛津](https://www.oxfordlearnersdictionaries.com/definition/english/the-middle-ages)，包含冠词 |
| Papua New Guinea (4017) | /ˌpæpuə njuː ˈɡɪni/ | /ˌpæpuə njuː ˈɡɪni/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/papua-new-guinea)，此处如实采用其美国标音中的 njuː。 |

八份修改均通过实际 validateLesson、createLessonReader，读取英美音标与写入一致。`npx vitest run test/lessons.test.ts test/lesson-ipa-fallback-ui.test.ts`：2 文件、9 项通过。录音未经试听，不声称录音与音标一致。
