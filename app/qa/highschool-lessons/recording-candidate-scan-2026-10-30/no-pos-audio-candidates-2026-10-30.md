# 已查 Commons 中无需词性异读判断的高中候选（2026-10-30）

实际离线审计为高中 384 缺口，其中 49 含占位符；对照本日先前 Wiktionary 英语栏批量结果与 Commons 原始响应（`wiktionary-batches.jsonl`、`commons-batch-raw-2026-10-30.json`）。本轮只读现存证据，没有网络请求、下载或试听。

## 优先候选：WWW

高中 `WWW` 属必修二 Unit 3，表示万维网等缩写，不存在名词/动词重音分流。三份录音均列于 [英语 Wiktionary WWW 条目](https://en.wiktionary.org/wiki/WWW#English)，且原始 Commons 元数据明确：

| 文件 | 原始词形及录制信息 | 许可 | 后续核验 |
| --- | --- | --- | --- |
| [En-uk-WWW.ogg](https://commons.wikimedia.org/wiki/File:En-uk-WWW.ogg) | 英国英语 WWW；说明明确 recorded by ATMarsden，来源 own work | CC BY 4.0 | 仍须确认实际逐字母读法、音质与文件完整性 |
| [En-us-www-1.ogg](https://commons.wikimedia.org/wiki/File:En-us-www-1.ogg) | 美国英语 WWW；Artist Pariah24，来源 own work | CC BY-SA 4.0 | 文件名小写但描述明确 WWW；须核读法及音质 |
| [En-us-www-2.ogg](https://commons.wikimedia.org/wiki/File:En-us-www-2.ogg) | 美国英语 WWW 替代读法；Artist Pariah24，来源 own work | CC BY-SA 4.0 | 需要辨别替代读法和教材适配 |

以上明确原始词头、作者和许可，值得进入隔离下载、完整解码及听审；但现有证据不确定是否念完整三个字母，不能称已验收或选定播放版本。

## 待核而非直接可用

- [Sami](https://en.wiktionary.org/wiki/Sami#English) 的两份 Vealhurl 音频（Sami.wav 与 Sami2.wav）均有 Speaker/Recorder、CC BY-SA 4.0 和 Wiktionary 英语栏映射；但候选涉及不同发音与具体族群/语言指代，需查原始词形和具体读法，不宜当作无歧义音频直接用。
- [bungee jumping](https://commons.wikimedia.org/wiki/File:En-us-bungee-jumping.ogg) 原页面描述完整词形、Artist Jelkner、自有来源，但许可为 Free Art License（FAL），不是项目当前支持的 CC 许可；复用条件及分发兼容性仍需核，尚未下载或试听。
- Arabic 的原始 Artist 是 assumed，不能将推测姓名作为已验证录制作者。

没有修改 manifest、音频或用户数据；Wiktionary 词头映射与 Commons 授权声明不等同于人工听审、具体音质或读法验证。

## WWW 隔离下载与模型辅助

英式 [En-uk-WWW.ogg](https://commons.wikimedia.org/wiki/File:En-uk-WWW.ogg) 原文件 39258 字节、2.795964 秒，SHA-256 `b3bc4f4da93171f67d68d0966b38be75b21ef09f02771bcca0586d28c10b3f13`；美式 [En-us-www-1.ogg](https://commons.wikimedia.org/wiki/File:En-us-www-1.ogg) 47707 字节、2.713832 秒，SHA-256 `5ec6c62a9dfbc92b76bba6c9395fc187893ac4d1e088495c30a59708efc97277`。两份均 ffmpeg 完整解码通过，保存于 `/tmp/www-audio-review/`。

Whisper base 和 small 对英式分别输出 `W-W-W` / `W-W-W`；美式分别输出 `taboom taboom taboom` / `W.W.W.`，模型之间不一致，不能确定实际发音内容。即便英式两模型一致，也不能由此断定三个字母读得完整或音质合适；两份都**尚未人工试听**。

下载美式 2 文件时 HTTP 429、Retry-After 1 秒，立即停止，未获取第三份。下载状态、解码与模型原始输出记录在 `www-download-status-2026-10-30.json`、`www-audio-verification-2026-10-30.json` 和 `www-whisper-results-2026-10-30.json`。尚未下载官方 MP3 转码，没有更改 manifest 或用户数据。

## 后续：英式候选接入

英式原文件通过本地 ffmpeg 转码为 MP3，SHA-256 `5c742822c8faf9d5ee49011a4f6c7dc054f11d042c4b159b0f60cccdcc507610`，并以 `WWW` 精确词头接入。来源、录制者和 CC BY 4.0 保留于应用；录音说明明确标注转码、机器辅助筛查和**尚未人工试听**。两种模型的结果属于辅助证据，不是人工听审或音质保证；美式候选未接入。
