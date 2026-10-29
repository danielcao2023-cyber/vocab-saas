# 其他开放语音完整 transcript 匹配

以先前只读盘点的 catalog v137、391 条高中缺录和 `/tmp/slr83-headword-spellings.json` 的实际词头及 `acceptedSpellings` 拼写为比较集；小写、空白与句末 .!? 规范化，全文相等，不使用句内子串。

- [OpenSLR 94 Multilingual LibriSpeech](https://www.openslr.org/94/) 官方页面列 CC BY 4.0、真人有声书，提供各语种未评分 dev/test transcript 小包。下载官方 [unrated_transcripts.tar.gz](https://dl.fbaipublicfiles.com/mls/unrated_transcripts.tar.gz)，仅提取英文 dev/test 文本：7576 段、7576 个不同完整文本，与缺录词头及既有拼写变体无命中。自带 README 标注这些是对齐算法输出、未经人工验证；这只是其中一部分，不包含全量训练集，不能据此推断该语料其他范围没有可用词。本次没有下载或校验音频、说话人身份及单文件许可元数据。
- [OpenSLR 101 Speechocean762](https://www.openslr.org/101/) 官方声明 CC BY 4.0，5000 句由中文母语的儿童与成年人朗读、供发音评分；[作者仓库](https://github.com/jimbozhang/speechocean762) 的 train/text、test/text 各 2500 条、共 5000 条非空转写，4947 个不同文本，按同一规则没有完整命中。因源语料包含非母语及刻意用于发音评分的样本，完整匹配也不能直接视为标准示范发音。本次仅获取文本索引，没有下载和听审录音。

本次未请求 Wikimedia Commons、未改录音清单。没有找到符合要求的新增候选；上述范围外仍可能有其他语料。样本转码、署名和实际发音均需接入前逐项确认。
