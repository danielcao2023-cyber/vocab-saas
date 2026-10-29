# LibriSpeech 候选裁后复核（2026-10-30）

本次对[第一批两个](librispeech-phrase-candidates-2026-10-30.md)和[第二批六个](librispeech-phrase-candidates-batch2-2026-10-30.md)句中短语候选做机器复核。**没有人工试听，不能仅据此判断可交付**；所有候选继续待听审。源句、截取时间、文件哈希、来源和许可见上述记录。八段 WAV 未添加到仓库或录音清单。

## 方法与结果

按两批记录的原句文件和秒数，使用 ffmpeg `-ss 起点 -to 终点 -c:a pcm_s16le` 重新生成切片；使用本机 Whisper base 和 small、CPU、英语、`fp16=False`、`condition_on_previous_text=False` 对各切片无提示转写。完整输出及首尾各 100 ms 的 RMS 数值保存在 [复核数据](librispeech-phrase-clip-recheck-2026-10-30.json)。RMS 为解码至 16 kHz 的浮点波形均方根，仅描述声音能量，不证明词语边界。

| 目标 | base 输出 | small 输出 | 本轮判断 |
| --- | --- | --- | --- |
| a chorus of | like a chorus of... | like a chorus of... | 均增词，需排查前一词混入和短片段识别错误。 |
| be fond of | be fun. | would be fun. | 目标尾部及前词均不确定。 |
| on duty | and on duty. | and non-duty. | 增词或误词，须检查前一词尾。 |
| except for | except for... | except for | 两者均转写目标；尾部紧邻 himself，仍需听审。 |
| in that case | In that case, | In that case, | 两者均转写目标；切片从源文件 0 秒开始，需确认首音完整。 |
| in charge of | in charge of... | in charge of... | 两者均转写目标；首 100 ms RMS 约 0.061，无法凭此排除邻词。 |
| consist of | to consist of. | can sing. | 一者增词，一者误识别。 |
| so as to | So as to | So as to | 两者均转写目标；末 100 ms RMS 约 0.106，且首词自动对齐跨度偏长，需查停顿及邻词。 |

对 `a chorus of`、`on duty` 和 `consist of`，另按前次两模型强制对齐区间的交集裁切、不加余量，分别取 3.14–3.72、1.88–2.32、1.50–2.18 秒，再用相同设置转写。结果依次为 base `of course`、`Alright.`、`갖`，small `a course of`、`and on duty.`、`can system.`；这些输出是模型猜测，不是人耳听到的内容。缩紧未能可靠排除增漏，也可能截短音素。

## 试听状态

本批试听页位于 `/tmp/xiaobei-slr12-qa-20261030/index.html`，属于临时文件而非持久交付物，本次未独立验证其播放功能。页面的存在不表示已人工听审；此前 MSWC 页面属于另一批素材。仍须由人确认发音、义项、前后边界及音质。模型文字一致、能量数值或机器对齐都不替代听审。
