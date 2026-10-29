# 高中十个地名和人名 Commons 检索（2026-10-30）

Commons `list=search` 每词使用 `intitle:"LL-Q1860" intitle:"词头"`、namespace 6、srlimit 30，间隔 2 秒；10 次均 HTTP 200。原始响应见同名 JSON。

| 词头 | 返回标题 |
| --- | --- |
| Jasper | File:LL-Q1860 (eng)-Wodencafe-jasper.wav |
| Winnipeg | 无命中 |
| Ontario | File:LL-Q1860 (eng)-Vealhurl-Lake Ontario.wav |
| Montreal | File:LL-Q1860 (eng)-UbiquitousSwizzy-Burlington-Plattsburgh-Montreal.wav；File:LL-Q1860 (eng)-Arlo Barnes-montreal.wav |
| Picasso | File:LL-Q1860 (eng)-Vealhurl-Picasso moth.wav；File:LL-Q1860 (eng)-Naomi Persephone Amethyst (NaomiAmethyst)-Picasso moth.wav；File:LL-Q1860 (eng)-Simplificationalizer-Picasso.wav；File:LL-Q1860 (eng)-Arlo Barnes-picasso.wav |
| Rembrandt | File:LL-Q1860 (eng)-Arlo Barnes-rembrandt.wav；File:LL-Q1860 (eng)-Simplificationalizer-Rembrandt.wav |
| Renoir | 无命中 |
| Giverny | 无命中 |
| Cusco | 无命中 |
| Dollywood | 无命中 |

Picasso、Rembrandt 两份 Simplificationalizer 大小写一致的文件名候选，原文件 extmetadata 请求 HTTP 200：Speaker 和 Recorder 均为 Simplificationalizer，标 CC0；详见 `ten-names-commons-detail-2026-10-30.json`。但随后 MediaInfo 批量请求返回 **HTTP 429，Retry-After 22 秒**，已立即停止。P9533/P407 等英语完整词头结构化数据尚未核实，无法判断同名指代及实际读法，两项均不可直接接入。

jasper、montreal、picasso、rembrandt 等小写文件名不自动等同目标专名；Lake Ontario 和 Picasso moth 也不是完整目标词头。无命中仅代表此次查询结果，不表示没有录音。未修改 manifest、音频或用户数据。

## MediaInfo 后续核查

429 冷却后仅一次 MediaInfo 批量请求返回 HTTP 200，原文见 `two-names-mediainfo-2026-10-30.json`。M92365738 的 P9533 为 Picasso/en，M92365783 的 P9533 为 Rembrandt/en，P407 均为英语 Q1860；P275 均是 CC0 Q6938433，P10893/10894 录制者及发音者均为 Simplificationalizer。与先前 Commons 文件页作者和许可一致。

MediaInfo 未提供指向画家实体的字段或词义说明，因此可确认资料声明的是英语完整词形，但不能据此断言说话者指具体人物。实际音频尚未下载、解码或试听，口音、发音和教材适配待核；不把元数据成功当作录音验收。此轮没有修改 manifest 或用户数据。
