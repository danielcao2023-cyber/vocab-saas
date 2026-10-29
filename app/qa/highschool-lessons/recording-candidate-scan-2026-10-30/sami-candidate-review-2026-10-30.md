# Sami 录音来源与隔离核验（2026-10-30）

教材词条为选必一 Unit 3 的 `Sami`（萨米人）。[Wiktionary 英语 Sami 词条](https://en.wiktionary.org/wiki/Sami#English) 在“萨米人”义项的发音栏将 [Vealhurl-Sami.wav](https://en.wiktionary.org/wiki/File:LL-Q1860_(eng)-Vealhurl-Sami.wav) 标为 /ˈsæmi/、[Vealhurl-Sami2.wav](https://en.wiktionary.org/wiki/File:LL-Q1860_(eng)-Vealhurl-Sami2.wav) 标为 /ˈsɑːmi/，均标 Southern England；这是词典对特定文件的标注，不是本轮人工听审。文件页明确英语 transcription Sami、Speaker/Recorder Vealhurl、CC BY-SA 4.0，原始 Commons 元数据见 `commons-batch-raw-2026-10-30.json`。两者是词典在该词义下给出的读音变体，并非名词/动词重音分流。

两份原 WAV 均 HTTP 200 并在隔离目录完整解码通过：

- `/tmp/sami-audio-review/Sami.wav`：74284 字节，0.773333 秒，SHA-256 `079c086cb71ccc0759be2b59e3507f83d14bd131ecf90ac94ccc24d1667caf51`。
- `/tmp/sami-audio-review/Sami2.wav`：81708 字节，0.850667 秒，SHA-256 `4b135fdc90359cf2d1f4cc23678d0d5668a1ec630444196b61a0c1acfd8fd577`。

Whisper base/small 输出分别为 Sami.wav 的 `Summi.` / `Summy`、Sami2.wav 的 `Sami.` / `Saw me`。自动转写不能准确验证专名或元音变体；两份尚未人工试听，音质和实际发音须听审。原始下载、解码、模型结果分别记录在 `sami-download-status-2026-10-30.json`、`sami-audio-verification-2026-10-30.json` 和 `sami-whisper-results-2026-10-30.json`。本轮只产出候选；未获取 MP3 转码、未改 manifest 或用户数据。

## 后续：匹配现有讲解音标的候选接入

现有讲解列 /ˈsɑːmi/，因此选用词典同样标注这一读法的 Sami2.wav。原 WAV 经本地转码为 MP3，SHA-256 `f2e2adc26df2b1a6fe4e1eeaa8cc26dae120a0a5c0aefa685bdb6bb0d2835ca1`；保留来源、作者、CC BY-SA 4.0、词典标注及“尚未人工试听”的说明。转码、词典标注和机器输出不能替代对实际音质及读法的人工听审。
