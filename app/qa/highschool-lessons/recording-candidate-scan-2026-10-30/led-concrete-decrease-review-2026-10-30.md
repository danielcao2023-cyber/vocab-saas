# concrete、decrease、LED 候选隔离核验（2026-10-30）

Commons 来源和 Wiktionary 文件关联见 `current-highschool-wiktionary-candidates-2026-10-30.md`；Commons 元数据原文见 `wiktionary-remaining-commons-detail-2026-10-30.json`。

| 候选 | 原文件状态 | 作者及许可 | 本机识别 |
| --- | --- | --- | --- |
| [concrete](https://commons.wikimedia.org/wiki/File:En-us-concrete.ogg) | 200，Vorbis，16150 字节、1.25 秒，SHA-256 `6831533b824983d9d80a3f0a389b62d373f1448ed5234b0c882c6883ca81a345`；ffmpeg 完整解码通过 | Commons 页面标 Dvortygirl 自录、CC BY-SA 3.0（还有其他许可选项） | Whisper base `concrete`、small `concrete.` |
| [decrease](https://commons.wikimedia.org/wiki/File:En-us-decrease.ogg) | 200，Vorbis，14487 字节、1.20 秒，SHA-256 `ac51343197be50761db915779454522aa5788068f5933a6b7e7c3ccf180c29e6`；ffmpeg 完整解码通过 | Commons 页面标 Dvortygirl 自录、CC BY-SA 3.0（还有其他许可选项） | Whisper base `Decrease`、small `Decrease.` |
| [LED1](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Vealhurl-LED1.wav) | 下载 HTTP 429，Retry-After 1 秒，已停止 | Commons 元数据标 Speaker 和 Recorder 均为 Vealhurl、CC BY-SA 4.0 | 未取得、未识别 |
| [LED2](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Vealhurl-LED2.wav) | 未请求 | Commons 元数据标 Speaker 和 Recorder 均为 Vealhurl、CC BY-SA 4.0 | 未取得、未识别 |

两份原音频路径 `/tmp/led-concrete-decrease-audio/concrete.ogg` 与 `/tmp/led-concrete-decrease-audio/decrease.ogg`。Wiktionary 说明 concrete 有多种重音，decrease 名词和动词读法不同。两模型的单词输出不能辨识重音、词性、口音或音素；没有现成 phonemizer / allosaurus / torchaudio，可用模型不提供可靠语音音素识别。因此本次未能确认两份文件适用的具体读法，必须人工听审或用其他可靠的声学证据核定；两模型一致也不等于人工听审。

原始下载状态、哈希解码和模型结果见同目录 `led-concrete-decrease-download-2026-10-30.json`、`concrete-decrease-verification-2026-10-30.json`、`concrete-decrease-whisper-2026-10-30.json`。没有下载官方 MP3 转码，没有改 manifest 或用户数据。
