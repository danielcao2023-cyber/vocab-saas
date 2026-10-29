# MSWC 候选录音来源与使用条件核查（2026-10-30）

范围是此前从 MLCommons 镜像取得、隔离在临时目录中的 15 个现成片段：stringed、kayaking、spacewalk、belongings、motivated 各三段；逐条文件路径、源句、对齐文件及 SHA-256 见 `mswc-candidate-provenance-2026-10-29.json`。本次没有上传或导入录音，也没有人工试听或联系权利方。

## 原始来源与发布者声明

- [MSWC 作者 2021 年论文](https://datasets-benchmarks-proceedings.neurips.cc/paper/2021/file/fe131d7f5a6b38b23cc967316c13dae2-Paper-round2.pdf)第 6 页说明初始版本的音频与转写使用 Common Voice **v3 validated**，随后强制对齐并从句中自动提取单词；摘要标示该语料 CC BY 4.0。此证据针对语料初版，不是对每个样本声音完整或口音的背书。
- [MLCommons 官方下载页](https://mlcommons.org/datasets/multilingual-spoken-words/)将完整数据及英语音频列为 CC BY 4.0，明确提及商业应用，且镜像要求不要尝试识别说话人。CC BY 的[许可原文](https://creativecommons.org/licenses/by/4.0/legalcode.en)包含署名、许可链接、改动说明等条件；谁拥有并能够授予哪些具体权利仍以实际权利状态为限。发布者声明是直接公开许可依据，未发现另外针对这些具体文件与本应用签订的特别授权。
- [Mozilla 2019 年发布说明](https://blog.mozilla.org/blogarchive/blog/2019/02/28/sharing-our-common-voices-mozilla-releases-the-largest-to-date-public-domain-transcribed-voice-dataset/)将当时 Common Voice 语音与原文称为 CC0 公共领域资料；这是项目同期总体声明，本次未找到随 v3 英语原始包附带的具体许可证副本，因此不要把总体声明写成逐文件法律核验。
- [CC0 原文](https://creativecommons.org/publicdomain/zero/1.0/legalcode.en)列明放弃声明不拟被撤回，且有放弃无效时的后备许可；它同时注明仅针对声明者可处理的权利并不保证权利状态。这些条款不能单独判断其他协议的效力或本次使用。

## 现行 Mozilla 平台说明及尚待确认

[现行 Common Voice 条款](https://commonvoice.mozilla.org/terms/en.html)生效于 2025-10-31，声明数据一般为 CC0，同时出于数据管理请求不要在其他平台或服务分发全部或部分 Common Voice 数据集。[Mozilla Data Collective FAQ](https://community.mozilladatacollective.com/faq-why-cant-i-re-host-or-share-common-voice-datasets-that-i-download-from-mdc/)将从 MDC 获取数据的镜像限制描述为平台条款，另指出可咨询边界情形。

这不是对 MSWC 发布声明的撤销说明；本次未找到 Mozilla 或 MSWC 针对 **2021 年前已获取的 v3 经第三方切分的单个片段，随离线应用分发** 是否属于该条款或请求范围的明确解释。不能把数据许可与平台条款合并，也不能断言现行要求必然追溯适用或必然不适用。若要实际分发，建议先就具体使用与发布方确认，并保留来源、署名、许可及修改说明；此处不是法律结论。

## 样本局限

实际缓存片段为论文所述自动从句子切出的音频，并非逐词独立录制。现有 TextGrid 对应源句和时间区间，但不证明切片完整、清晰、口音或义项适合教学。`mswc-whisper-screen-2026-10-30.json` 为模型粗筛，不能代替逐条人工听审。此次没有更改 manifest、应用音频或用户学习数据。
