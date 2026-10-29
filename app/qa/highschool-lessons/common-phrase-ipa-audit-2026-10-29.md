# 八个常见词组音标核验（2026-10-29）

只采用来源对完整词头的音标，不拼接单词；移除音节分隔点，保留来源实际给出的重音。语句中的重读可随语境变化。

| 词头（ID） | 核验与结果 |
|---|---|
| search engine（2063） | [Cambridge](https://dictionary.cambridge.org/dictionary/english/search-engine) 英 /ˈsɜːtʃ ˌendʒɪn/、美 /ˈsɝːtʃ ˌendʒɪn/；同页面 American Dictionary 有不同的美音转写，当前选前述词条读法。 |
| Christmas carol（2307） | [Cambridge](https://dictionary.cambridge.org/us/pronunciation/english/christmas-carol) 英 /ˌkrɪsməs ˈkærəl/、美 /ˌkrɪsməs ˈkerəl/；原页第二音节弱读元音可省略，记录为含元音形式。 |
| identity card（2066） | [Oxford Learner’s Dictionaries](https://www.oxfordlearnersdictionaries.com/definition/english/identity-card) 英 /aɪˈdentəti kɑːd/、美 /aɪˈdentəti kɑːrd/。 |
| make sure（1944） | [Oxford University Press English File wordlist](https://www.atillakadak.com/_sources/_notlar/_vocabulary/voc_B2_ef.pdf) /meɪk ʃɔː/；英式教材音标，未找到同来源明确的美式整组音标，故美音留空。 |
| under pressure（2013） | [Action for Kazakhstan Grade 10 词表](https://lib.kpvk.edu.kz/wp-content/uploads/2022/03/action-10-1.pdf) /ˌʌndə ˈpreʃə/；英式教材音标，美音留空。 |
| blog post（2060） | 搜索得到非出版社镜像的词表，未能核验其原始出版文件，暂不修改。 |
| now that（2076） | 查询到逐词展示、未明确重音的 [SpanishDictionary](https://www.spanishdict.com/pronunciation/now%20that)，未找到可充分确认重音的权威整组来源，暂不修改。 |
| in shape（2090） | 查询到词组展示但未给重音的 [LanGeek](https://dictionary.langeek.co/en/word/209864)，未找到可充分确认重音的权威来源，暂不修改。 |

运行 `cd app && npm test -- --run test/highschool-common-phrase-ipa.test.ts`，一项测试覆盖五个新增条目的实际 `validateLesson` 和 `createLessonReader`。音标不代表录音已核验；本次未处理录音。
