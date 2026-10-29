# SLR83 短语的固定文本自动对齐实验（2026-10-30）

本机检查未找到已安装的 Montreal Forced Aligner、WhisperX、torchaudio 或独立英文对齐模型；已有 OpenAI Whisper 20250625、base 和 small 本地权重。 [Whisper 官方仓库](https://github.com/openai/whisper)声明其代码和原版权重使用 MIT；[OpenSLR 83](https://www.openslr.org/83/)声明该数据 CC BY-SA 4.0，裁剪与发布须另行考虑来源署名和具体许可要求。本次只做内部实验，不导出剪辑或改应用。

使用既有两份 WAV 与官方行索引原句，直接将完整参考文本 token 输入 Whisper `timing.find_alignment`，执行解码器 cross-attention 和 DTW 词级定位，2 线程 CPU、进程低优先级运行。其为强制文本对齐实验性估计，不是独立的 CTC/MFA 系统；强制传入文本会在文本错误时仍产生时间戳，不能同时当作识别验证。base 与 small 同属 Whisper，互相接近也不证明边界正确。完整逐词数据、文本与音频 SHA-256 见同名 JSON。

| 目标 | 源 WAV | base 估计 | small 估计 |
|---|---|---|---|
| refer to | nof_05223_01349045656.wav | 2.06–2.68 s | 2.06–2.66 s |
| take part in | wef_07049_01339309565.wav | 5.30–6.10 s | 5.30–6.12 s |

这些时间未通过人工试听、波形/音素标注或独立模型评测，不能说明自然切点、尾音完整、连读正确及口音适合；未生成或发布正式录音。必须先用独立验证方法和实际听审后才考虑剪辑。MSWC 下载单独运行，未操作或中断其进程。
