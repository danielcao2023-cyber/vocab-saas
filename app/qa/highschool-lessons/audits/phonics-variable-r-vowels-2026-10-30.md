# 高中词形音节变体：hire、wire、sour

以 v137 catalog 和 seed 使用 `npx tsx qa/highschool-lessons/scan-non-audio-stable-keys.ts`，本批前 751 项未命中、后 748；总数包括单音节、短语、专名及缩写，不能视作多音节缺陷。对单字母词使用 `/tmp/phonics-cmudict` 的 CMU 1.1.3 辅助筛选：混合音节候选 hire、wire、sour、fine 和 AI。机器结果仅作为筛选，不能替代词典；fine 的多音节发音可能涉及同形人名等而非本词教材义，AI 是缩写。leant 的两音节结果属于误命中人名的风险；drawer 英式读法一音节。均未强行按普通多音节处理。

补入音节数存在口音/说话者变化但对拼写很有价值的 3 个常见词：

| 词头 | 剑桥英式独立读法 | 对照依据 |
|---|---|---|
| hire | /haɪə/ | [Cambridge](https://dictionary.cambridge.org/pronunciation/english/hire) |
| wire | /waɪə/ | [Cambridge](https://dictionary.cambridge.org/pronunciation/english/wire) |
| sour | /saʊə/ | [Cambridge](https://dictionary.cambridge.org/pronunciation/english/sour) |

词典独立英音用 r 上标提示连读；内容列独立读法且提示后接元音可连读 r，美式发 r。ire/our 作为组合呈现剑桥给出的整组元音，不硬性认定音节数，也不声称教材录音口音已核验。

验证：`npm test -- --run test/highschool-variable-r-vowels.test.ts test/sound-spelling-coverage.test.ts`，2 文件 4 测试通过，真实 getter、完整拼写与对应音素、原有覆盖均检查。其余 748 项未逐个判定是否适合音形对照；本轮未处理录音。
