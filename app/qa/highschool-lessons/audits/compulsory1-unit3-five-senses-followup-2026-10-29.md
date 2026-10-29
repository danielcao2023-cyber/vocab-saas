# 必修一 Unit 3 教材义项补充（2026-10-29）

对照教材印刷页 115（出版社册次 https://book.pep.com.cn/1412001121191/；本地教材页 `/Users/caogong/Documents/Codex/2026-10-26/vocab-expansion/sources/compulsory-1/123.jpg`），确认 catalog stable key、headword、必修一 Unit 3 归属及对应 lesson 数字 ID；未改 catalog、词头、ID、学习记录或录音。

| stable key / ID | 教材缺口 | 词典依据 |
|---|---|---|
| come along / 1753 | 补到达、出现；英式催促“快点”义及例句。 | https://dictionary.cambridge.org/dictionary/english/come-along |
| track / 1754 | 补足迹、车辆痕迹；说明痕迹常用复数。 | https://dictionary.cambridge.org/dictionary/english/track |
| championship / 1763 | 区分冠军地位与锦标赛，补保持、保住冠军称号例句。 | https://dictionary.cambridge.org/dictionary/english/championship |
| apart / 1765 | 补分成碎片、散开，搭配拆开与散架。 | https://dictionary.cambridge.org/dictionary/english/apart |
| give up / 1775 | 补反身结构 give oneself up to 投降、自首，说明反身代词随主语变化。 | https://dictionary.cambridge.org/dictionary/english/give-up |

另核 sweat / 1758：教材列及物“出汗弄湿”，[Collins](https://www.collinsdictionary.com/dictionary/english/sweat) 确有该义，但本轮未找到足以确认自然用法的例句，暂未增写。

`npm test -- --run test/highschool-compulsory1-unit3-meaning-followup.test.ts` 通过；逐词调用实际 validateLesson 与 createLessonReader 验证新增义项及例句。新增句子为原创，词典证明含义和用法，未逐句经教师或母语者审校；未全面核验其他义项与音标变体。
