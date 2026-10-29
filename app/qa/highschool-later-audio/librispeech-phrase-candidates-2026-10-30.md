# LibriSpeech 句中短语候选（2026-10-30）

本次是来源和自动对齐试验，不是录音验收。未人工试听，没有把素材接入应用。切分片段来自句内语流，不是单独朗读；发音、连读、边界和教学适用性须人工复核，发布前还须核清署名等许可义务。

## 扫描与来源

- [LibriSpeech-PC / OpenSLR 145](https://www.openslr.org/145/) 提供仅含文本、恢复标点和大小写的七个索引分区，标注 CC BY 4.0；它说明有部分样本在恢复过程中丢失，因此扫描不能代表完整 LibriSpeech。下载的 [manifests.tar.gz](https://www.openslr.org/resources/145/manifests.tar.gz) SHA-256：`96d4eae2222b29b66437a21959252419bcd4762e5042e71e023790171054d1c0`。
- 使用当时 382 条高中缺录清单，排除四条随后已接入的 Shtooka 条目，在剩余项中筛出 283 个含空格且非占位的词头。对七个索引的 266,655 段文本进行忽略大小写、保留词形的词边界匹配：132 个词头至少出现于一句中，整段等于词头的匹配为 0。句内命中不等于录音可用或准确。
- 音频源为 [LibriSpeech / OpenSLR 12](https://www.openslr.org/12/)，页面标注 CC BY 4.0；从其 [dev-clean.tar.gz 官方镜像](https://openslr.elda.org/resources/12/dev-clean.tar.gz)流式提取指定文件，找到后提前结束，未保存或完整校验整个 337,926,286 字节压缩包。又流式提取同包的对应原始转写核对。下列各 SHA-256 均指实际提取文件；原句和片段暂存于系统临时目录，不随仓库提交。

## 候选

| 词头 | 官方包内原句文件及 SHA-256 | 原始 transcript 与语境 | 候选切分（秒）及 WAV SHA-256 |
| --- | --- | --- | --- |
| a chorus of | `LibriSpeech/dev-clean/2428/83699/2428-83699-0036.flac`；`80f381eafe553a36f9eb1304afd30138cc505df1cb962d6646d6dd96cd2e93ff` | `THE INFORMATION WAS GREETED WITH WHAT SOUNDED UNCOMMONLY LIKE A CHORUS OF LAUGHTER`；对应转写文件 `2428-83699.trans.txt` 的 SHA-256 为 `52b6865e148d9f0bc228b1d8ff0dc91c9fad32d394ad6b9ec0e4a14ca8161e6d`。语境指一阵笑声。 | 3.06–3.78；`d3bf17d99d2726286ee20e092b623bfb636a2f38f9aaf7299a09fd3dad13b815` |
| be fond of | `LibriSpeech/dev-clean/7850/286674/7850-286674-0000.flac`；`c59cf2e70b3d0f1f21bad4da424d1af733f4454caa11c19b8b2bef98a81f5ef8` | `A PERSON WOULD THINK THAT AFTER A FAMILY HAD LIVED SO LONG IN A PLACE ALL THE NEIGHBORS WOULD BE FOND OF THEM YET IT IS NOT SO`；对应转写文件 `7850-286674.trans.txt` 的 SHA-256 为 `b11617fb7d03339c49c8bd187cc94fce95b544015864a19e135d103caaf685f4`。语境为邻居喜欢他们。 | 5.22–5.88；`3bb024bc1098400dce62038fb2f67884666c68e617785f2838c810e176785dd6` |

这两个 WAV 用 ffmpeg 从原句转换为 `pcm_s16le`，时间分别在模型估计边界两侧额外保留约 0.04 秒。Whisper base 和 small 无提示转写均包含目标短语；强制对齐分别给出 `a chorus of` 3.10–3.74 / 3.14–3.72 秒，`be fond of` 均为 5.26–5.84 秒。两个模型方法相关，不能视为两次独立听审，时间估计可能截断词音或混入邻词。

另检索到 `appeal to` 的原句 `LibriSpeech/dev-clean/1272/128104/1272-128104-0009.flac`，SHA-256 `2bfbcdfab6024ccd3bfeb4e883cc7f9cc613235e504bfc068fd34069056513b7`。该语境是名词 *appeal*，与教材可能要求的动词搭配存在差异，未生成短语候选；不可仅凭文字相同认定词义匹配。
