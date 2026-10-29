# LJSpeech 十组短语：CTC 与 Whisper 边界筛查（2026-10-30）

对 `ljspeech-ten-whisper-timestamps-2026-10-30.json` 中十条已有 LJSpeech 完整句，离线使用固定修订 `facebook/wav2vec2-base-960h@22aad52d435eb6dbaf354bdad9b0da84ce7d6156` 做无提示 CTC 贪心转写和整句参考文本的 CTC Viterbi 对齐；模型权重 SHA-256、公开许可、原 WAV 与模型加载警告的解释见 `ljspeech-independent-ctc-experiment-2026-10-30.md`。WAV 重采样 16 kHz、2 CPU 线程、低优先级，未输出裁剪音频。模型在参考文本上强制对齐，不是从语音独立验证原文；无提示贪心转写 10 条均含目标短语，仅为辅证。

| 短语 | CTC 秒 | Whisper base 秒 | Whisper small 秒 |
|---|---|---|---|
| by accident | 3.12–3.84 | 2.90–3.74 | 2.94–3.64 |
| under pressure | 1.44–2.04 | 1.18–1.98 | 1.20–1.94 |
| take part in | 1.68–2.34 | 1.62–2.34 | 1.62–2.38 |
| adapt to | 3.62–4.34 | 3.46–4.32 | 3.46–4.34 |
| side with | 1.42–1.84 | 1.26–1.80 | 1.28–1.82 |
| result in | 5.66–6.16 | 5.54–6.16 | 5.54–6.18 |
| lead to | 0.26–0.60 | 0.14–0.62 | 0.16–0.62 |
| on duty | 1.66–2.14 | 1.44–2.06 | 1.52–2.06 |
| search for | 1.52–1.94 | 1.44–1.94 | 1.44–1.96 |
| concerned about | 5.36–6.14 | 5.14–6.06 | 5.16–6.02 |

三套模型估计均是粗定位，不是音素级标注。对 CTC 边界前后各 150 ms 分别计算 10 ms 窗口 RMS；低于 −35 dB 的窗口及实际时间保存在同名 JSON。阈值结果**不能证明词间停顿**：低能量可能是擦音、塞音闭塞、词内间隙或背景低电平；也无法排除前后词混入。`result in`、`lead to` 的 CTC 起点附近没有低于阈值的窗口，其他有窗口也未验证其在词间。`take part in`、`search for` 的模型时间差相对较小，但其参考文本显示分别紧邻其他词，仍需对完整句与候选边界进行人工听审。故本轮无法确认任何一项满足“两侧真实停顿且无相邻词混入”，不应据此自动裁剪或接入应用。

逐项无提示模型输出、音频 SHA-256、时间和能量窗口见 `ljspeech-ten-independent-ctc-2026-10-30.json`；复现实验脚本见 `ljspeech-ten-independent-ctc.py`，依赖实验时的临时模型、音频与官方 metadata。模型加载仍报告 `wav2vec2.masked_spec_embed` 缺失，eval 不传掩码索引；未人工听审、不作准确切点保证、不修改应用。
