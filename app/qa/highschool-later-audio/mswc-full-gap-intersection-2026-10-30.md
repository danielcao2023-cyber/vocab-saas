# MSWC 英文索引与高中缺录交集（2026-10-30）

使用本机 `/tmp/mswc-metadata.json.gz`（官方 https://mswc.mlcommons-storage.org/metadata.json.gz，SHA-256 `9aeed163514f5a6bfbf2b5c88187be6a8c82af025bafa48af2a4ef30fdf52a1b`）英文 wordcounts 共 38,174 标签，以及当时通过 `npx tsx scripts/audit-highschool-offline-audio.ts --missing-json /tmp/audit-b-audio-latest.json` 得到的 catalog v138、384 条缺录快照（SHA-256 `b19baf826ce3e7bbbe33e3ca7c89123af367eb1d813628007b5f83f67d57e07f`）；完整 `spoken` 与标签仅忽略大小写精确比对，未去标点、拆词、展开变体或同义词。共 25 条命中，逐项和索引统计片段数见同名 JSON。计数是索引标签计数，不是可用录音数，也未保证词音完整、语义、口音或许可单项确认；大写专名、GPS、LED、PETS 等须排除大小写/缩写义项碰撞。此前本机 15 段仅覆盖这 25 项中的 stringed、motivated、spacewalk，故索引提示还可探索 22 词，不意味着可安全接入 22 词。

官方英语音频包为 [en.tar.gz](https://mswc.mlcommons-storage.org/audio/en.tar.gz)，[MLCommons 页面](https://mlcommons.org/datasets/multilingual-spoken-words/)列 32.45 GB 并标 CC BY 4.0。其结构为 `en/clips/<标签>/<样本>.opus`。可沿用本机既有 `/tmp/mswc-select-stream.py` 思路：指定少量目标、流式读取 gzip tar，在每目标采样达到上限后停止；由于 gzip 不能按单文件随机定位，扫描到末尾可能消耗接近整个包的流量，不保证提前命中或顺序，开始前应做流量预算、单连接限速和中断处理。提取后逐个记录文件路径、哈希、时长与转码，再由单独 alignment 包查相应 TextGrid、源句及目标词性，保留原片段和对齐证据；对未听审/机器识别不一致或异读多义的样本不得认定完成。已有 `/tmp/mswc-select-stream.py` 是一次性脚本，目标词写死，重用时须替换目标并审查退出条件，不能当通用安全导入器。

来源语料由源句自动对齐切词而来，不是孤立读词；所有样本仍需听审。Mozilla 对历史 CV v3 以及后来发布的 MSWC 衍生片段在当前平台条款下的适用性见 `mswc-rights-chain-2026-10-30.md`。本轮无网络下载音频、未改 manifest 和用户数据。
