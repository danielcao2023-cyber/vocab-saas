# LJSpeech 短语的独立 CTC 对齐实验（2026-10-30）

从已有完整句候选中选择 `LJ009-0127`（take part in）和 `LJ012-0203`（by accident）；两份此前已与 LJSpeech 官方归档同 ID 文件逐字节比对一致。原 WAV 与官方 metadata 的 SHA-256 见 `ljspeech-independent-ctc-results-2026-10-30.json`。官方 [LJSpeech 说明](https://keithito.com/LJ-Speech-Dataset/)称 LibriVox 语音及书籍文本在美国为 public domain，其他司法辖区表述有保留；不是 CC0 的声明。

下载 [Meta wav2vec2-base-960h](https://huggingface.co/facebook/wav2vec2-base-960h) 固定修订 `22aad52d435eb6dbaf354bdad9b0da84ce7d6156` 到隔离 `/tmp/audit-b-ctc-model`，官方模型卡标 Apache 2.0；safetensors 文件 SHA-256 `8aa76ab2243c81747a1f832954586bc566090c83a0ac167df6f31f0fa917d74a` 与仓库 LFS 元数据一致。下载单连接限速 2 MiB/s，实验仅 CPU 两线程、低优先级；不联网传送 WAV。

音频经 ffmpeg 重采样 16 kHz，采用官方 normalized transcript 大写、空格转 `|`，使用模型逐帧 CTC 分数和 Viterbi 最优路径（包含 blank 与重复字母跳转限制），按名义 20 ms 帧间隔估计短语首尾；脚本见 `ljspeech-independent-ctc-experiment.py`，依赖本轮 `/tmp` 资产和固定模型文件。Whisper 比较值来自 `ljspeech-ten-whisper-timestamps-2026-10-30.json`，其为自动转写的词时间。CTC 模型不是专为词边界标定的对齐模型，强制对齐即使文本错误也可能给出时间，CTC blank 和卷积感受野也使所报时间不是实际声学边界。

| 目标短语 | CTC 估计 | Whisper base | Whisper small |
|---|---|---|---|
| take part in | 1.68–2.34 s | 1.62–2.34 s | 1.62–2.38 s |
| by accident | 3.12–3.84 s | 2.90–3.74 s | 2.94–3.64 s |

第二条起点和终点的差异提醒不能直接使用自动切点；第一条接近也不是正确性的证明。Transformers 加载提示 checkpoint 缺少 `wav2vec2.masked_spec_embed` 并重新初始化；本次推理为 `eval` 且未提供遮盖索引，该字段属于 SpecAugment 掩码路径，但仍保留加载警告和由此带来的验证边界。未进行人工听审、未导出片段或修改应用。

额外无提示贪心 CTC 识别 `/tmp/from-then-on-original.wav`（SHA-256 `3cc15d381594e24b3b8db57c96a01b5e3be7d0fdccc3df9361efda0bc5dcf5ef`）得到 `FROM DERON`，无法确定 then/there，不能用作原录音正确与否的证明。相关原音频和来源应以其独立审计为准。
