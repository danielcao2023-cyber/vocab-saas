# 选择性必修四 Unit 1 教材义项补充（2026-10-29）

依据已审核教材 PDF 印刷页 106（物理页 113；本地 PDF 路径、SHA-256 和出版社册次来源见 `optional4-unit1-wordlist-audit-2026-10-29.md`），核实 catalog stable key、headword、Unit 1 归属及当前 lesson ID；未改词库 catalog、词头、ID、学习记录或录音。

| stable key / ID | 新增内容 | 词典依据 |
|---|---|---|
| leather / 3794 | 补 leathers 复数皮制服装义及例句，说明尤其是骑行防护衣。 | https://dictionary.cambridge.org/dictionary/english/leather |
| pace / 3806 | 补 pace oneself 调整节奏以保持体力的动词用法。 | https://dictionary.cambridge.org/dictionary/english/pace |
| panel / 3796 | 补专家咨询组义和例句。 | https://dictionary.cambridge.org/dictionary/english/panel |
| alien / 3785 | 补法律语境非本国公民义，说明不等同于无合法居留权；例句限法律用法。 | https://dictionary.cambridge.org/dictionary/english/alien |
| random / 3812 | 补非正式“奇怪、令人意外”义，区别于随机选取。 | https://dictionary.cambridge.org/dictionary/english/random |
| maximum / 3813 | 将形容词和名词分义，补例句，原两句保留。 | https://dictionary.cambridge.org/dictionary/english/maximum |

运行 `npm test -- --run test/highschool-optional4-meaning-followup.test.ts`：测试通过；逐词使用真实 validateLesson 和 createLessonReader 验证新义及例句。例句为原创，词典支持词义与用法，不代表逐句经过英语教师或母语者审核；其他义项及读音变体未做完整核验。
