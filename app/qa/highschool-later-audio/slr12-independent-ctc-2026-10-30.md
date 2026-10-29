# 八条 LibriSpeech 候选的独立 CTC 对齐筛查

2026-10-30。使用同一八段完整源句及其原始转写，对照[前次 Whisper 裁后复核](librispeech-phrase-clip-recheck-2026-10-30.md)。本次没有人工听审、裁剪新音频、导入录音或修改 manifest；不声称任何片段已可教学或分发。

## 方法与可复现性

使用本机已有 `facebook/wav2vec2-base-960h` 固定修订 `22aad52d435eb6dbaf354bdad9b0da84ce7d6156`；本地 `model.safetensors` SHA-256 `8aa76ab2243c81747a1f832954586bc566090c83a0ac167df6f31f0fa917d74a`。完整源句重采样至 16 kHz，英语原始转写转为大写字符及词间分隔符，采用 CTC blank / 重复字符约束的 Viterbi 路径求目标短语及前后邻词的字符模型活跃帧，名义帧步长 20 ms。参照 [TorchAudio 官方 CTC 对齐教程](https://docs.pytorch.org/audio/stable/tutorials/forced_alignment_tutorial.html)；本实现与 Whisper 的音频模型不同，但两者仍共享原始音频、转写与语料背景，不是人工标注。

完整字段、原句与音频 SHA-256 见 [结果 JSON](slr12-independent-ctc-results-2026-10-30.json)；[复现脚本](slr12-independent-ctc-2026-10-30.py) 在 app 目录运行：

```sh
/opt/homebrew/Cellar/openai-whisper/20250625_4/libexec/bin/python qa/highschool-later-audio/slr12-independent-ctc-2026-10-30.py
```

需原批次数据 `/tmp/slr12-candidates-20261030`、`/tmp/slr12-candidates-batch2-20261030`、上述模型目录 `/tmp/audit-b-ctc-model`、Python 依赖和 FFmpeg；临时数据可能被系统清理，缺失时不可复现。模型加载时报告 `wav2vec2.masked_spec_embed` 缺失并重新初始化；本次是 eval 推理且未提供遮盖索引，仍保留警告，不能把它忽略为已完成验证。完整源音频、候选与许可链见前述批次审计。

## 与现有截段比较

| 短语 | 现有截段，秒 | CTC 目标活跃帧，秒 | 前 / 后邻词活跃帧，秒 |
| --- | --- | --- | --- |
| a chorus of | 3.06–3.78 | 3.22–3.72 | LIKE 3.00–3.14；LAUGHTER 3.78–4.12 |
| be fond of | 5.22–5.88 | 5.34–5.80 | WOULD 5.18–5.32；THEM 5.86–6.00 |
| on duty | 1.82–2.42 | 2.08–2.50 | ABSENT 1.74–2.00；无后词 |
| except for | 2.38–3.14 | 2.72–3.08 | TROUBLEMAKER 1.88–2.46；HIMSELF 3.14–3.48 |
| in that case | 0.00–1.16 | 0.40–1.12 | 无前词；SAID 1.46–1.62 |
| in charge of | 1.86–2.56 | 1.98–2.48 | WAS 1.80–1.90；CLEARING 2.66–2.98 |
| consist of | 1.46–2.22 | 1.56–2.14 | TO 1.44–1.50；TWO 2.28–2.44 |
| so as to | 4.98–6.30 | 5.80–6.24 | SYDENHAM 4.54–4.98；ARRIVE 6.34–6.70 |

这些数字仅是字符 CTC 帧峰，并非音素、词首或词尾的真实声学边界：blank、上下文窗口和连读会使活跃帧偏离发音。现有切片与模型前词帧重叠的 `a chorus of`、`be fond of`、`on duty`、`except for`、`in charge of`、`consist of` 应优先检查是否带入邻词；`on duty` 的目标末帧晚于截段结束，提示可能截尾。`so as to` 起点明显不同于此前 Whisper 约 5.02–5.04 秒，不能凭其中一种结果决定切点。`in that case` 从文件零点开始，需检查源音频本身是否从词首开始。

[Montreal Forced Aligner 官方文档](https://montreal-forced-aligner.readthedocs.io/en/v3.4.1/user_guide/index.html)说明其利用发音词典提供词和音素对齐，适合补充音素层面的人工定位；但当前机器未发现 MFA 可执行程序或现成对应英语声学模型，因此本次没有运行 MFA、没有音素级结果，也没有证据证明 CTC 比 Whisper 或 MFA 对本批更准确。下一步应在人耳与波形/频谱中逐条对照完整句、切片和相邻词，并对不同语音模型的争议区域做人工判断；模型间一致或不一致均不自动决定是否接入。
