# OpenSLR 英文 transcript 缺录再比对

2026-10-30 使用 `scripts/audit-highschool-offline-audio.ts` 对 catalog v137 和离线 seed/资源只读盘点，高中词条 2730，缺录 391（含 49 条占位表达）；先前 392 条中的 Merry Christmas! 已接入。该统计核验元数据与文件哈希，不能代表发音质量、真实听辨或授权全面审核。

分别比对 [OpenSLR 83 官方完整索引](https://www.openslr.org/resources/83/line_index_all.csv) 17877 条和 [OpenSLR 70 官方男女索引](https://www.openslr.org/70/)共 3359 条，后者为尼日利亚英语，均在项目官方页面标 CC BY-SA 4.0。按完整 transcript 对整词头做小写、空白及句末 .!? 规范化，同时使用 `server/src/study.ts` 的 `acceptedSpellings` 生成已有英美拼写变体和括号中已有变体作为候选；两套索引对 391 条均无新增命中。结果不把句子内部子串当独立词录音，不自行生成拼写变体，也不证明未查语料不存在可用录音。

脚本中间数据在 `/tmp/audio-source-gap-recheck.json`、`/tmp/slr83-headword-spellings.json`、`/tmp/slr83-line-index.csv`、`/tmp/slr70-female.tsv`、`/tmp/slr70-male.tsv`；只下载小型文本索引，没有下载音频大包，也未访问 Commons。即便将来发现文字匹配，也需核查录音实际内容、口音、词义、文件和许可，不能以索引本身等同验收。
