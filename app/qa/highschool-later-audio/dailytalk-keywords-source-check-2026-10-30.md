# KWS-DailyTalk 关键词索引与高中缺录比对（2026-10-30）

按 catalog v138 隔离离线种子生成的 386 项缺录 `/tmp/audit-b-audio-gap-1030.json`，对实际 `spoken` 完整词头按大小写不敏感逐项比对，不作子串匹配或同义扩展。

[KWS-DailyTalk 作者仓库](https://github.com/wilkinghoff/kws-dailytalk)称训练集有 15 个标签各 5 个隔离关键词：afternoon、airport、cash、credit card、deposit、dollar、evening、expensive、house、information、money、morning、night、visa、yuan。**386 缺口中精确匹配 0 条**。标签仅表示作者对训练片段的描述；未取得音频或试听，未判断各片段来源录音是否独立朗读或从句中切分。

其作者说明材料来自 [DailyTalk 原始项目](https://github.com/keonlee9420/DailyTalk)，后者标示 CC BY-SA 4.0，并在说明中提及学术用途。KWS 仓库代码显示 GPL-3.0，不能将代码许可自动视为音频授权；且未独立核清原始台词来源与子集录音再分发权，授权仍须逐源核验。这两层声明不能据此直接推断可用于任何商业分发。

比对只覆盖上述 15 个训练关键词，未对其长句验证集或 DailyTalk 全量语料执行完整转写匹配；零命中不表示整套语料无合适短语。本次未下载音频、改动清单或用户数据。
