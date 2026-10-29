# 六个专名及节日名称音标核验（2026-10-29）

以下英美音标来自 Cambridge Dictionary 的英式与美式发音栏目，移除音节分隔点，保留重音、音素和 Toronto 美音的闪音符号。音标呈现的是词典列出的读法，实际口音可有变化；没有试听或验证项目录音。

| ID | 条目 | 英式 | 美式 | 来源 |
|---|---|---|---|---|
| 1736 | Disneyland | /ˈdɪznilænd/ | /ˈdɪznilænd/ | https://dictionary.cambridge.org/pronunciation/english/disneyland |
| 2344 | Thanksgiving | /ˌθæŋksˈɡɪvɪŋ/ | /ˌθæŋksˈɡɪvɪŋ/ | https://dictionary.cambridge.org/pronunciation/english/thanksgiving |
| 3322 | Vancouver | /vænˈkuːvə/ | /vænˈkuːvɚ/ | https://dictionary.cambridge.org/pronunciation/english/vancouver |
| 3325 | Toronto | /təˈrɒntəʊ/ | /təˈrɑːnt̬oʊ/ | https://dictionary.cambridge.org/pronunciation/english/toronto |
| 3328 | Ontario | /ɒnˈteəriəʊ/ | /ɑːnˈterioʊ/ | https://dictionary.cambridge.org/pronunciation/english/ontario |
| 3745 | Shakespeare | /ˈʃeɪkspɪə/ | /ˈʃeɪkspɪr/ | https://dictionary.cambridge.org/pronunciation/english/shakespeare |

六项均填入编号 lesson 的英美音标、默认美音及原形，并注明词典来源和口音说明；没有待确认项。定向测试 `cd app && npm test -- --run test/highschool-six-name-ipa.test.ts` 对六份原始文件分别调用实际 `validateLesson`，再通过 `createLessonReader` 检查读取、音标及来源，1 项测试通过。该验证不等于对词条其余内容或音频的全面验证。
