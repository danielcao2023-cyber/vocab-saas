# 当前高中缺录的 Wiktionary 音频映射复核（2026-10-30）

实际执行 `npx tsx scripts/audit-highschool-offline-audio.ts --missing-json /tmp/highschool-gaps-audit-a-current.json`：catalog 138、高中 2730 词条、384 个离线缺口（其中 49 含字典占位符）、335 个非占位完整词头。与此前当日 Wiktionary 原始批处理及失败补查合并：335 个词均有结果，196 无页面、112 有页面无英语音频、3 无英语栏、24 有音频映射；24 项当前清单及文件名见 `current-highschool-wiktionary-candidates-2026-10-30.json`。结果来自此前缓存快照，并非本轮重查全部页面。重定向、短语多词差异和大小写差异不得当作完整匹配。

本轮对此前只查本地缓存、未充分核作者的四份文件向 Commons 批量查询一次，HTTP 200，原始响应见 `wiktionary-remaining-commons-detail-2026-10-30.json`。

| 词头 | 英语 Wiktionary 映射及 Commons 原文件声明 | 状态 |
| --- | --- | --- |
| [concrete](https://en.wiktionary.org/wiki/concrete#English) | [En-us-concrete.ogg](https://commons.wikimedia.org/wiki/File:En-us-concrete.ogg)：描述明确完整词头及美国英语，作者 Dvortygirl，自录；CC BY-SA 3.0（亦有其他许可），元数据与原始 wikitext 一致 | 可进入试听及名词/形容词/动词重音核验；未听审、不确认具体词性读法 |
| [decrease](https://en.wiktionary.org/wiki/decrease#English) | [En-us-decrease.ogg](https://commons.wikimedia.org/wiki/File:En-us-decrease.ogg)：描述明确完整词头及美国英语，作者 Dvortygirl，自录；CC BY-SA 3.0（亦有其他许可） | 可进入试听；名词与动词重音不同，不能在未听前当作所有词性的通用音频 |
| [LED](https://en.wiktionary.org/wiki/LED#English) | [LED1](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Vealhurl-LED1.wav) 与 [LED2](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Vealhurl-LED2.wav)：英语栏将两份音频置于 /ɛl.iːˈdiː/ 与 /lɛd/ 读法下，未在映射中分别标注对应关系；Commons 明确 Speaker、Recorder 均 Vealhurl、CC BY-SA 4.0 | 候选；必须逐份试听或其他可靠证据确定实际读法，不能依据文件名数字判定，也不能混同 past tense led |
| [bungee jumping](https://en.wiktionary.org/wiki/bungee_jumping#English) | 之前 Commons 原始快照中 [En-us-bungee-jumping.ogg](https://commons.wikimedia.org/wiki/File:En-us-bungee-jumping.ogg) 描述完整词头及美国英语，Artist Jelkner、Source own work、许可 FAL（Free Art License） | 可再分发条款与本项目当前接受许可集及发行方式的兼容性仍需核对；不可简单假设 CC 许可或立即接入，未试听 |

此前 24 项中多个是音频不包含目标完整短语（如 in charge、in touch、keep track），或 Commons 作者仅 assumed、许可未知、指代与词性变体待核；不自动接入。此次没有下载或试听音频，没有更改 manifest、sources 或用户数据。
