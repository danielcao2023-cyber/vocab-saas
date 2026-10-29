# 高中四项音形缺口复核

日期：2026-10-29。检查实际前端 `getSoundSpellingLessons` 索引，原四个候选均未见音形条目；本轮未处理录音。词典音标证据取自搜索工具返回的词典页面内容，字母对音素及教学分块由 Codex 人工整理，不是词典逐字母标注或人工听审。分块用于拼写记忆，不宣称唯一音节划分。

| 词头 | 本轮结果 | 可核查依据及边界 |
|---|---|---|
| Birmingham | 新增英国城市的 /ˈbɜːmɪŋəm/ 对照，Bir /bɜː/、ming /mɪŋ/、ham /əm/，提示 h 不发音。| [Cambridge 音标](https://dictionary.cambridge.org/pronunciation/english/birmingham)；[Cambridge 地名说明](https://dictionaryblog.cambridge.org/2018/11/14/london-leicester-and-lincoln-pronouncing-english-place-names/)。教材指英国城市；词典美式尾音 /hæm/ 所指美国同名城市，不当成英国城市口音变体。|
| Switzerland | 新增美式 /ˈswɪtsɚlənd/ 对照，英式 /ˈswɪtsələnd/ 注明差异；重读首段，z 对应 /s/。| [Cambridge](https://dictionary.cambridge.org/pronunciation/english/switzerland)。|
| disappointment | 新增 /ˌdɪsəˈpɔɪntmənt/ 对照，dis 次重读、ppoint 主重读、双 p 共对应 /p/。| [Cambridge](https://dictionary.cambridge.org/dictionary/english/disappointment)。|
| Princeton | 本轮未添加：未取得可直接核对完整词头的权威词典 IPA；自动转写或不明来源结果不足以确认，不臆造。| 待核美国地名及大学关联、IPA 和音形。|

实际 `getSoundSpellingLessons` 定向测试、全词形结构及覆盖测试共 9 项通过；`npm run typecheck` 通过。未验证真实录音是否与展示口音一致，仍需后续试听。
