# 十个短语音标核验（2026-10-29）

只采用完整词头在教材中的音标，保留实际重音；没有标重音的原样保留。语境重读与弱读可能变化。只找到英音的美音栏留空。

| 词头 ID | 结果与来源 |
|---|---|
| make progress 2004 | 英 /meɪk ˈprəʊɡres/，美音留空；[Global Pre-intermediate wordlist](https://www.hueber.de/media/36/Global_Pre-Intermediate_wordlist.pdf)。 |
| adapt to 2010 | 英美 /əˈdæpt tə/，to 为弱读；[Pearson 英式词表](https://www.pearson.com/content/dam/one-dot-com/one-dot-com/english/SampleMaterials/Secondary/Focus/BritishEnglish/Focus-BrE2_StudentsBook_U1-Wordlist.pdf)、[美式词表](https://www.pearson.com/content/dam/one-dot-com/one-dot-com/english/SampleMaterials/Secondary/Focus/americanenglish/Focus%20AE%20Level%202%20StudentBook%20Unit%201%20wordlist.pdf)。 |
| make out 2018 | 英 /meɪk aʊt/，来源无重音标记，美音留空；[National Geographic Learning Close-up 词表](https://www.eltcloseup.com/file/657/download?token=HT4JnbPO)。 |
| due to 2043 | 英 /djuː tə/，原文无重音，美音留空；[Express Publishing 词表](https://storage1.expresspublishingapps.co.uk/teachercorner/glossaries/LRN_B1_Glossary.pdf)。 |
| stir up 2053 | 英 /stɜːr ˈʌp/，原文保留连读 r，美音留空；[Pearson Focus 3 词表](https://content.fimsschools.com/ebooks/Focus%20Student%20Book/Focus%20Student%20Book%203.pdf)。 |
| go through 2078 | 英 /ɡəʊ θruː/，原文无重音，美音留空；[Macmillan Laser B2 词表](https://www.hueber.de/media/36/Laser-B2-3rd-Wordlist_D.pdf)。 |
| concerned about 2007 | 搜到第三方转载的带 be / sth 词组，未确认准确词头的完整可靠音标，暂不填。 |
| watch over 2028 | 搜到非权威字典结果，未找到可靠原文，暂不填。 |
| day and night 2029 | 搜到逐词发音而未给明确整组重音的页面，暂不填。 |
| search for 2048 | 搜到第三方转载，未找到可直接核验的出版来源，暂不填。 |

`cd app && npm test -- --run test/highschool-common-phrase-ipa-batch3.test.ts` 通过，调用真实 validateLesson 和 createLessonReader 检查六词。未处理或核验录音。
