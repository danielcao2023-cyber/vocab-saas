# 高中空音标短语核查（第七组）

2026-10-29。由 catalog v135、seed stable key 和实际 lesson reader 空 IPA 清单选取；仅使用完整词头的直接标音，未试听应用录音。first aid 曾经被处理，本组以 head start 代替。

| 词头（seed ID） | UK | US | 来源和说明 |
| --- | --- | --- | --- |
| the World Wide Web (2109) | /ðə ˌwɜːld waɪd ˈweb/ | /ðə ˌwɜːrld waɪd ˈweb/ | [牛津](https://www.oxfordlearnersdictionaries.com/definition/english/the-world-wide-web)，包含冠词。 |
| Achilles' heel (2120) | /əˌkɪliːz ˈhiːl/ | /əˌkɪliːz ˈhiːl/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/achilles-heel)采用不带撇号的同一词组写法。 |
| the North Pole (2438) | /ðə ˌnɔːθ ˈpəʊl/ | /ðə ˌnɔːrθ ˈpəʊl/ | [牛津](https://www.oxfordlearnersdictionaries.com/definition/english/the-north-pole)，按该词典标音原样保留美式元音符号。 |
| the South Pole (2439) | /ðə ˌsaʊθ ˈpəʊl/ | 待核 | [牛津](https://www.oxfordlearnersdictionaries.com/definition/english/the-south-pole)包含冠词，但页面所列美国标音与英式相同，故不补美国音标。 |
| Nobel Prize (2753) | /ˌnəʊbel ˈpraɪz/ | /ˌnoʊbel ˈpraɪz/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/nobel-prize)。 |
| global positioning system (2612) | 待核 | 待核 | [剑桥完整词条](https://dictionary.cambridge.org/dictionary/english/global-positioning-system)未显示音标，GPS 字母缩写的音标不能代替。 |
| water pump (3066) | /ˈwɔːtə(r) pʌmp/ | 待核 | [Pulse 3 词表](https://www.iestrayamar.es/files/doc1920/nopresencial/grupos4/tareas/Pulse3_wordlist_eng.pdf)第 7 页直接标注完整词头，(r) 为条件性 r；只填英式，不推断美式。 |
| dim sum (3220) | /ˌdɪm ˈsʌm/ | /ˌdɪm ˈsʌm/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/dim-sum)。seed 有相同基础音标，未覆盖。 |
| head start (4024) | /ˌhed ˈstɑːt/ | /ˌhed ˈstɑːrt/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/head-start)。 |
| real estate agent (4045) | /ˈrɪəl ɪsteɪt ˌeɪdʒənt/ | /ˈriːəl ɪsteɪt ˌeɪdʒənt/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/real-estate-agent)，词典亦列美式变体。 |

九份修改均通过实际 validateLesson 与 createLessonReader，读取英美音标与写入值一致。`npx vitest run test/lessons.test.ts test/lesson-ipa-fallback-ui.test.ts`：2 文件、9 项通过。未试听录音，不声称录音和音标一致。
