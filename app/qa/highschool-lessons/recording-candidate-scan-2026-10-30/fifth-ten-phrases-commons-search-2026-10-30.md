# 高中十个重要短语 Commons 第五批检索（2026-10-30）

Commons MediaWiki `list=search` 逐项检索 `intitle:"LL-Q1860" intitle:"短语"`，namespace 6、srlimit 30，间隔 2 秒；10 次均 HTTP 200，未遇 429/503。原始响应见同名 JSON。

| 短语 | 返回标题 |
| --- | --- |
| senior high school | 无命中 |
| junior high school | File:LL-Q1860 (eng)-Vealhurl-junior high school.wav |
| make an impression | 无命中 |
| concentrate on | 无命中 |
| take notes | 无命中 |
| suitable for | 无命中 |
| be responsible for | 无命中 |
| be attracted to | 无命中 |
| take control of | 无命中 |
| package tour | 无命中 |

[junior high school 候选](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Vealhurl-junior_high_school.wav)：文件名完整；原文件元数据明确 Speaker 和 Recorder 都是 Vealhurl，许可 CC BY-SA 4.0，MediaInfo P407 是英语。然而 MediaInfo 没有 P9533（结构化词头）也没有标签；此前 Wiktionary 英语栏扫描无关联录音。因此尚未独立核实该文件真实完整词头，不可报告为验证通过或接入。原始 metadata 和 MediaInfo 请求均 HTTP 200，详见 `junior-high-school-commons-detail-2026-10-30.json`。

剩余九项未返回候选；查询无命中不代表录音不存在。没有下载、试听或修改 manifest 和用户数据。

## junior high school 后续核验及接入

Commons 文件页原始 wikitext（`junior-high-school-page-history-2026-10-30.json`）明确 `transcription = junior high school`、`languageId = Q1860`、`author = Vealhurl`、`cc-by-sa-4.0`，上传者 Vealhurl；这补足此前缺失的原词形证据，而不是通过不完整的 MediaInfo P9533 推断。

隔离下载原 WAV（134188 字节，SHA-256 `3f83f37bf9ba55e22e3790a8f86c5181a64e7dcad911c65df3bd810e7cbd8c40`，1.397333 秒）和 Commons 官方 MP3（27484 字节，SHA-256 `4c005ccafe44c55b4b82fca3d6c899fe8768447a1ce3c7a9665ec57745845dc5`，1.397347 秒），均完整解码。Whisper base 本机英文识别结果为 “Junior high school”，只作为辅助，不是人工试听或口音验证。

源码 manifest 和 sources 新增本条，标注口音 unknown、尚未人工试听，保留 CC BY-SA 4.0 署名；在线 API、离线打包及资源哈希均有真实测试。未修改用户学习数据，已安装安卓包不会自动更新。
