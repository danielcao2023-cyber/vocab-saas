# 高中缺录音：补充十词 Commons 初筛（2026-10-30）

以 catalog 137 和实际离线种子及文件哈希运行 `npx tsx scripts/audit-highschool-offline-audio.ts --missing-json /tmp/highschool-gaps-audit-a-new.json`，结果 393 个缺口（包括占位短语），选择非上轮十词的常见完整词头。

对每词使用 Commons MediaWiki `list=search`，检索 `intitle:"LL-Q1860" intitle:"词头"`，namespace 6，srlimit 30，每次间隔 1.5 秒；10 次均 HTTP 200。原始搜索结果见 ten-additional-commons-search-2026-10-30.json。

| 词头 | 搜索返回标题 |
| --- | --- |
| stringed | File:LL-Q1860 (eng)-Vealhurl-stringed instrument.wav |
| upper-class | File:LL-Q1860 (eng)-YassineChaouche-upper class.wav；File:LL-Q1860 (eng)-Vealhurl-upper class.wav |
| artemisinin | 无命中 |
| patent | File:LL-Q1860 (eng)-Arlo Barnes-patent.wav；File:LL-Q1860 (eng)-Simplificationalizer-patent.wav；File:LL-Q1860 (eng)-Vealhurl-patent troll.wav |
| draft | File:LL-Q1860 (eng)-Arlo Barnes-draft.wav；File:LL-Q1860 (eng)-Tsaag Valren-American Cream Draft.wav |
| concrete | File:LL-Q1860 (eng)-Status 401-Concrete.wav；File:LL-Q1860 (eng)-NaomiAmethyst-reinforced concrete.wav；File:LL-Q1860 (eng)-Vealhurl-concrete noun.wav；File:LL-Q1860 (eng)-Flame, not lame-Cascade concrete.wav |
| kayaking | 无命中 |
| submersible | 无命中 |
| orient | File:LL-Q1860 (eng)-I learned some phrases-orient.wav |
| cinquain | 无命中 |

patent 两条、draft、Concrete、orient 各一条文件名疑似准确，但**均未经 MediaInfo P9533/P407、录制者和许可核验**；某些词可能涉及词性、口音和发音变体，不能据文件名自动接入。upper class 是空格拼写的词组，尚不能直接等同 upper-class；stringed instrument 不是完整单词 stringed。

批量请求以上五份候选的原始元数据返回 HTTP 429，Retry-After: 4 秒（原始状态见 ten-additional-commons-detail-2026-10-30.json）；当即停止后续请求，没有将失败判为无结果。服务允许后应优先查询该批原始 metadata 与 MediaInfo，再逐项核词形、录制者、许可及异读。未修改已发布清单、音频或用户数据。
