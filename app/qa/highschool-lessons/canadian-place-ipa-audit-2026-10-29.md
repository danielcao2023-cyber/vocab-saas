# 加拿大地名音标核验 2026-10-29

- Alberta 1847：英 /ælˈbɜːtə/、美 /ælˈbɝːt̬ə/；https://dictionary.cambridge.org/dictionary/english/alberta 明确指加拿大省份。
- Halifax 3321：英美 /ˈhælɪfæks/；https://dictionary.cambridge.org/us/dictionary/english/halifax 明确列加拿大城市和英国城市。
- Jasper 3324：美 /ˈdʒæspər/；https://www.dictionary.com/browse/jasper 美式专名条目明确指阿尔伯塔镇。页面英式音标对应普通名词碧玉，并非明确该镇读音，故英国栏保留空白；未推断加拿大当地变体。
- Edmonton 3326：英美 /ˈedməntən/；https://dictionary.cambridge.org/us/dictionary/english/edmonton 明确指加拿大城市。
- Winnipeg 3327：英美 /ˈwɪnɪpeɡ/；https://dictionary.cambridge.org/dictionary/english/winnipeg 明确指加拿大城市。
- Montreal 3331：英 /ˌmɒntriˈɔːl/、美 /ˌmɑːntriˈɔːl/；https://dictionary.cambridge.org/us/dictionary/english/montreal 明确指加拿大城市，英语两种读法不代表当地法语读法。

移除音节点，其余保留原词典符号和重音；实际口音可能不同。未核录音。通过 `cd app && npm test -- --run test/highschool-canadian-place-ipa.test.ts`，实际 validateLesson 与 createLessonReader 校验六项全部通过。校验仅覆盖所列字段。
