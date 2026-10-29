# 23 个 Wiktionary 英语音频候选：本地只读复核

范围：同目录 `wiktionary-batches.jsonl` 中 23 个英语栏音频词条、32 个文件名，和 `local-source-cache-results.json` 的既有 resolver 本地缓存输出；本次未访问 Wikimedia、未下载或试听、未改清单。23 个词当前在 `data/pronunciation/manifest.json` 与 `mobile-public/offline/pronunciation.json` 中均无同键基础录音。下述分类是根据词头及 Wiktionary 音频模板的文件名，不证明实际声音内容、词性、作者、许可或口音。resolver 的本地缓存没有 resolved，可能是缺数据，不能视作授权不合格或资源不存在。

| 词头 | 英语栏候选文件 | 分类及下一步 |
|---|---|---|
| fin | en-us-fin.ogg | 完整词形，优先核文件正文、作者和许可，再试听 |
| puzzle | En-ca-puzzle.ogg | 完整词形；优先核元数据和加拿大口音，试听 |
| illustrate | En-uk-illustrate.ogg | 完整词形；优先核元数据和试听 |
| knit | En-uk-knit.ogg | 完整词形；此前页面显示作者/来源是 assumed，既有规则不接受；需找到可核作者授权的其他证据或文件 |
| module | LL-Q1860 (eng)-Vealhurl-module.wav | 完整词形；优先核 Commons 作者许可、Wiktionary 英语关联和试听，验证转码 |
| bungee jumping | En-us-bungee-jumping.ogg | 完整短语候选；需确认录的是完整短语而非单词，核元数据和试听 |
| Arabic | en-us-Arabic.ogg | 语言名称/形容词；词形完整，但需确认英语读音、作者、许可 |
| Winnipeg | en-ca-Winnipeg.ogg | 地名；需核英语地名发音、来源与许可，再听审 |
| Ontario | en-ca-Ontario.ogg | 地名；需核英语地名发音、来源与许可，再听审 |
| Montreal | Montreal-English-pronunciation.oga | 地名；需核英语而非法语读音、来源与许可，再听审 |
| Sami | LL-Q1860 (eng)-Vealhurl-Sami.wav / Sami2.wav | 族群/语言专名，有两种候选；核正确义项和读音变体、授权与试听 |
| WWW | en-uk-WWW.ogg / en-us-www-1.ogg / en-us-www-2.ogg / 两项 dub 版本 | 字母缩写，多候选；应选完整逐字母名称而非 dub 口语变体，核来源与试听 |
| analyses | En-us-analyses.ogg / En-uk-analyses.ogg / LL-Q1860 (eng)-Vealhurl-analyses (verb).wav | 词形完整，但名词复数和动词形式有异读风险，需按词性核音标及听审 |
| patent | En-uk-patent.ogg / LL-Q1860 (eng)-Simplificationalizer-patent.wav | 音节或口音变体和词性需核；不能仅凭文件名决定默认读音 |
| corporate | en-uk-corporate.ogg | 同形词性异读风险；此前 Commons 作者/来源仅 assumed；须独立核实授权与具体读法 |
| orient | En-uk-orient.oga | 名动词重音/读音风险；需区分教材义及音频词性 |
| draft | En-us-draught.ogg / EN-AU ck1 draught.ogg | 文件是 draught 非原拼写；同音和义项需证据，不能直接改词头匹配 |
| keep track of | en-us-keep track.ogg | 缺末尾 of，不能当完整词组录音 |
| fall in love with | LL-Q1860 (eng)-Flame, not lame-fall in love.wav | 缺末尾 with，不能当完整词组录音 |
| keep in touch | En-au-in touch.ogg | 缺开头 keep，不能当完整词组录音 |
| cost an arm and a leg | En-au-arm and a leg.ogg | 缺 cost an，不能当完整词组录音 |
| as far as I know | en-au-as far as one knows.ogg | 人称与词形不同，不能作为确切原词录音 |
| be fond of | en-us-fond.ogg | 仅 fond，既有 resolver 标记 recording-headword-mismatch；不能当完整词组录音 |

优先可推进的是 fin、puzzle、illustrate、module，以及完整短语候选 bungee jumping：仅当服务限流结束且查到原文件明确作者、项目可接受许可、文件与英语词头确切匹配，再检查音频编码并人工试听后，才考虑接入。当前无已通过上述全部条件的候选；此前 20 个 HTTP 429 未完成词条不在这 23 项之内。用同目录 `scan-wiktionary.py` 与真实离线扫描可重现索引，需严格遵守 429/503 停止规则。
