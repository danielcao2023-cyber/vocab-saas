# 八个空音标词头核验

范围从 catalog v135 按 stable key 查本地 seed 的词条与实际 lesson；仅填写词典对对应词头直接列出的音标。数字 ID 为该 seed 的本地映射，不用于跨设备身份。未修改 catalog、数据库或音频，也未试听录音。音标为词典给出的读法，句中重音可变化。

| stable key | 结果 | 证据与边界 |
| --- | --- | --- |
| BCE | 已补英美 /ˌbiːsiːˈiː/ | [剑桥 BCE](https://dictionary.cambridge.org/pronunciation/english/bce)，对应公元前缩写。 |
| LED | 已补英美 /ˌeliːˈdiː/ | [剑桥 LED](https://dictionary.cambridge.org/pronunciation/english/led)，明确选大写发光二极管义，非动词 led 的 /led/。 |
| DDT | 已补英美 /ˌdiːdiːˈtiː/ | [剑桥 DDT](https://dictionary.cambridge.org/uk/pronunciation/english/ddt)。 |
| SARS | 已补英式 /ˈsɑːz/ 和美式 /ˈsɑːrz/ | [剑桥 SARS](https://dictionary.cambridge.org/dictionary/english/sars)。 |
| WWW | 已补英美 /ˈdʌbəljuːˌdʌbəljuːˈdʌbəljuː/ | [剑桥 www](https://dictionary.cambridge.org/pronunciation/english/www)。seed 原有音标仍保留；不覆盖词库数据。 |
| cm | 保留空，待核 | [剑桥 cm](https://dictionary.cambridge.org/dictionary/english/cm)标示其为 centimetre 的书写缩写，未直接列该缩写音标；避免把字母读音当成单位读法。 |
| BBQ | 保留空，待核 | [剑桥 BBQ](https://dictionary.cambridge.org/us/dictionary/english/bbq)将其列为 barbecue 的书写缩写，未直接标注缩写音标；seed 原有音标保持原样。 |
| chiwen | 保留空，待核 | [Getty 建筑词汇表](https://www.getty.edu/vow/AATFullDisplay?find=tree&logic=null&note=&subjectid=300391202)支持英文词形及建筑义，未提供英文 IPA。 |

5 项变更逐条运行 `validateLesson` 和 `createLessonReader` 均通过；`test/lessons.test.ts` 与 `test/lesson-ipa-fallback-ui.test.ts` 合计 9 项通过。IPA 未标为默认通用 IPA，仅分英美字段提供，避免覆盖已有词头音标或推断录音口音。
