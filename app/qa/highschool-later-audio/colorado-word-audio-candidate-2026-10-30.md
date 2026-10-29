# Colorado 单音节录音库候选

[Bonino 与 Malley 论文](https://pmc.ncbi.nlm.nih.gov/articles/PMC6910017/)描述 773 个单音节目标词由 3 名美国英语母语说话人分别独立朗读录制；原项目 [OSF](https://osf.io/43xfh/) 开放逐词 WAV。论文的 Corpus description 明确语料采用 CC BY-NC 4.0，紧接说明语料下载包含逐词音频；OSF 项目根目录 [License.txt](https://osf.io/download/kufhz/) 也是 CC BY-NC 4.0。[作者目标词表](https://osf.io/download/b6zpe/) 内“copyright and license info”明确版权为 University of Colorado Regents；这只允许符合非商业条件的使用，不能因可下载就认定允许商业发布；实际发布场景需确认授权适配，并保留署名、许可和修改说明。本轮不作法律意见。

以 v138 的离线盘点 387 条高中缺录为基础，小写规范化后对该目标词表做完整词头相等匹配，唯一匹配为 `fin`（表中第 189 词；教材必修二 Unit 2，seed ID 1991）。官方 API 列出 [Female_2/fin.wav 文件元数据](https://api.osf.io/v2/files/5d56fad0150734001ec574cf/)：大小 133790 字节，SHA-256 `64266916df3c3d3af54037b43207dd6a77b13dff8fd4ddd5b59ccf081363b523`；其路径明确属于目标词原始音频。该信息未下载原音频或校验文件字节，也未试听、核对个体口音或音标；非商业许可与实际发音匹配确认前不接入。论文描述词表为 773 个词，电子表因含表头产生额外文本项；命中按照目标词列实际匹配，未把标题视为词条。

此调查未使用 Mozilla、ECCC 或 OpenSLR 70/83/94 的语料，未请求 Wikimedia Commons，未修改清单。

隔离校验：从该文件官方 OSF 下载 `Female_2/fin.wav` 至 `/tmp/colorado-fin-audit/fin-female2.wav`，SHA-256 `64266916df3c3d3af54037b43207dd6a77b13dff8fd4ddd5b59ccf081363b523` 与官方 API 一致；ffprobe 显示 PCM float、44.1 kHz、单声道、0.757528 秒，ffmpeg 全文件解码无错误。此结果不证明听到的是正确的完整读音，尚未人工试听；未转码、未接入应用。CC BY-NC 4.0 的使用适用性仍待用户决定。
