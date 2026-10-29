# 高中连字符普通词发音拼写补充

范围使用 catalog v137 和离线 seed 的 stable-key 扫描：`npx tsx qa/highschool-lessons/scan-non-audio-stable-keys.ts`。本轮前无音形 754、后 751；该总数包含短语、专名、缩写和单音节词，不是多音节缺陷数。

| 词头 | 完整词典音标 | 依据 | 说明 |
|---|---|---|---|
| high-end | /ˌhaɪˈend/ | [Cambridge 发音](https://dictionary.cambridge.org/pronunciation/english/high-end) | 主重音在 end，连字符不读 |
| make-up | /ˈmeɪk.ʌp/ | [Cambridge 发音](https://dictionary.cambridge.org/pronunciation/english/make-up) | 名词两音节；美式也常拼 makeup |
| upper-class | /ˌʌpə ˈklɑːs/ | [Easier English Student Dictionary, upper-class](https://www.easypacelearning.com/pdf/easier_english_student_dictionary_upper-int.pdf) | 英式音标，次重音 upper、主重音 class；美式音不同 |

连字符、双写字母和末尾 e 按可读拼写映射到对应音素；逐字母划分为教学解释，不声称词典给出相同分段。Wi-Fi 属缩写形式，Buñol、Jean-Philippe 属专名，未当普通词强行补充；普通单词粗筛中 style、plate 等静音 e 字母组并不表示多音节。其他 751 项需逐项分类；具体录音和口音未验证。

验证：`npm test -- --run test/highschool-hyphen-words-phonics.test.ts test/sound-spelling-coverage.test.ts`，2 文件 4 测试通过，检查前端真实 getter、原拼写、字母覆盖与来源；本次扫描 3 项均不再列缺失。
