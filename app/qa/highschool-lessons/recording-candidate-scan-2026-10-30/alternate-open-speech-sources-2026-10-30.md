# 高中缺录：Commons 之外开放真人录音来源初筛（2026-10-30）

以此前 `audit-highschool-offline-audio.ts` 的 386 个缺口快照为对照；该数字是扫描时的状态，后续构建可能变化。本轮查看公开资料，未下载语料或修改 manifest、录音及用户数据。

- [Google Speech Commands](https://huggingface.co/datasets/google/speech_commands/blob/main/speech_commands.py)：资料说明数据含单词录音、版本 0.02 共 35 个词，数据集标 CC BY 4.0，复用须保留来源及署名。其官方描述所列 35 个词与本地 386 条缺口的实际 spoken 词头做大小写不敏感比较，交集为 0；因此当前没有可立即补录的词。这里引用的数据集许可不应与该加载脚本的 Apache 2.0 代码许可混同。
- [Mozilla Common Voice 条款](https://commonvoice.mozilla.org/oc/terms) 和 [官方数据集介绍](https://www.mozillafoundation.org/en/blog/common-voice-18-dataset-release/)称一般情况下录音数据集以 CC0 发布（具体版本须复核），但它主要是读句子音频及文本，不能将整句冒充完整词组录音。还需找到对应版本及具体片段、获得并核对时间切分和读法，确认版本授权及试听质量，才能判断是否有可用候选。本轮未完成精确片段匹配或自动切分。
- [The People's Speech 论文](https://arxiv.org/abs/2111.09344)描述数据包含 CC BY-SA 和 CC BY 子集，来源于第三方录音并经过转写对齐；不能仅凭总体许可证假定所有具体片段的许可、作者和分发条件相同。需要逐条追溯原始文件、许可证与作者，还要核实分段和读法；本轮没有具体候选。

结论：三类来源提供后续调查方向，但本轮没有确认**可立即接入的具体录音**。不得将语料的开放许可等同于任意音频已核权，也不得将自动分段或转写当作人工试听；先从带可审查索引的具体条目核实。
