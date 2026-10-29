# 高中空音标短语核查（第六组）

2026-10-29。由 catalog v135、seed stable key 和实际 lesson reader 空 IPA 清单选取；仅使用剑桥词典对完整词头直接标音，省略音节分隔点但保留音素和重音；未试听应用录音。

| 词头（seed ID） | UK | US | 来源和说明 |
| --- | --- | --- | --- |
| artificial intelligence (2811) | /ˌɑːtɪfɪʃəl ɪnˈtelɪdʒəns/ | /ˌɑːrt̬əfɪʃəl ɪnˈtelədʒəns/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/artificial-intelligence) |
| theme park (2875) | /ˈθiːm ˌpɑːk/ | /ˈθiːm ˌpɑːrk/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/theme-park) |
| culture shock (3153) | /ˈkʌltʃə ˌʃɒk/ | /ˈkʌltʃɚ ˌʃɑːk/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/culture-shock) |
| comfort zone (3155) | /ˈkʌmfət ˌzəʊn/ | /ˈkʌmfɚt ˌzoʊn/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/comfort-zone) |
| junk food (3227) | /ˈdʒʌŋk ˌfuːd/ | /ˈdʒʌŋk ˌfuːd/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/junk-food) |
| shopping mall (3286) | /ˈʃɒpɪŋ ˌmɔːl/ | /ˈʃɑːpɪŋ ˌmɑːl/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/shopping-mall)，词典另有美国标音变体。 |
| electric shock (3346) | /ɪˌlektrɪk ˈʃɒk/ | /ɪˌlektrɪk ˈʃɑːk/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/electric-shock) |
| fine art (3440) | /ˌfaɪn ˈɑːt/ | /ˌfaɪn ˈɑːrt/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/fine-art)，词典另有美国标音变体。 |
| press conference (3930) | /ˈpres ˌkɒnfərəns/ | /ˈpres ˌkɑːnfɚəns/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/press-conference) |
| estate agent (4044) | /ɪˈsteɪt ˌeɪdʒənt/ | /ɪˈsteɪt ˌeɪdʒənt/ | [剑桥](https://dictionary.cambridge.org/dictionary/english/estate-agent)，词典标明主要英式用法，美式通常称 real estate agent。 |

十份修改均通过实际 validateLesson、createLessonReader，且读取的英美音标与写入值一致。`npx vitest run test/lessons.test.ts test/lesson-ipa-fallback-ui.test.ts`：2 文件、9 项通过。未听录音，不声称录音和音标对应。
