# 高中普通词音形缺口跟进：iron

范围：catalog v137、离线 seed 中人教七册 2730 个唯一 stable key；命令 `npx tsx qa/highschool-lessons/scan-non-audio-stable-keys.ts > /tmp/highschool-stable-coverage.json` 使用实际 reader/getSoundSpellingLessons。新增前无音形 755，新增后 754；这个数字包含单音节、专名、短语，不等于真实缺陷或多音节缺口。静态扫描按照字母块筛出 110 个单词候选，其中元音字母块不能确定音节数。

- iron 是普通词、实际 getter 原未命中。以 [Cambridge 英美发音](https://dictionary.cambridge.org/pronunciation/english/iron) 的英式 /aɪən/ 为据补音形；整词列 i /aɪ/、r 不单独发音、o /ə/、n /n/ 作为教学拆解，明确美式有 r 音；不声称词典给出具体音节边界，不推断当前录音口音。
- drawer 在 Cambridge 英式 /drɔː(r)/ 为单音节，本次从多音节候选排除；style、plate、hike 的字母元音组含静音 e 等，不能据此判多音节；chiwen 是专名而非普通词。除以上明确判断之外，粗筛其余项目没有逐词核完。
- 词典标音、项目分字母对照和实际录音可有差别；本批未验证真人录音或各口音的音节实现。source 中发音数据可核；字母拆解是教学解释，不声称由词典原文逐字给出。

验证 `npm test -- --run test/highschool-iron-phonics.test.ts test/sound-spelling-coverage.test.ts`：2 文件、4 测试通过，覆盖真实 getter、字母及音标、原词覆盖；扫描确认 iron 不再列为无映射。
