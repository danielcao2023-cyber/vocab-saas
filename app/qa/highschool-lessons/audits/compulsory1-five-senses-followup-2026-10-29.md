# 必修一教材常用义补充（2026-10-29）

对照教材印刷页 113–114（人教社 https://book.pep.com.cn/1412001121191/）及 catalog 的 `pep2019-compulsory-1` 归属，确认 stable key 与当前 lesson 的词头、ID 对应：advance/1663、survival/1674、credit/1720、request/1725、flight/1701。未修改 catalog、词头、ID、学习记录或录音。

| 词条 | 修订 | 词典依据 |
|---|---|---|
| advance | 教材列不及物前进、发展；补两句不及物例句，原动词项并未包含这两种句式。 | https://dictionary.cambridge.org/dictionary/english/advance |
| survival | 教材列幸存事物；分出可数的历史遗存义，补例句。此义偏书面，举延续的习俗为例。 | American Heritage，经 Wordnik 可查：https://www.wordnik.com/words/survival |
| credit | 教材列借款和称赞；补信贷与赞誉两项，赊购和银行信贷并非信用度本身。 | https://dictionary.cambridge.org/dictionary/english/credit |
| request | 教材列名词和动词；原两例各有一词性但合并一项，现分项并补例。保留原两句，名词例句改为新义项 ID。 | https://dictionary.cambridge.org/dictionary/english/request |
| flight | 教材列航班、航程；补航程时长例句，原有航班和鸟类飞行例句保留。 | https://dictionary.cambridge.org/dictionary/english/flight |

例句为原创，词典支持释义及语法，不代表逐句经教师或母语者审核。未全面复查各词所有义项、变体或语音。运行 `npm test -- --run test/highschool-compulsory1-meaning-followup.test.ts`：1 项测试通过，逐个使用真实 validateLesson、createLessonReader 验证五个词条与例句。
