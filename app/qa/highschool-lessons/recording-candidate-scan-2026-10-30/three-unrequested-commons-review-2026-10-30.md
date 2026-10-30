# 上次未请求的三个短语：Commons 音频候选（2026-10-30）

对先前宽检索中未请求的 `at first hand`、`from then on`、`to be frank`，依次以 Commons MediaWiki `list=search`、namespace 6、`intitle:"词头" filetype:audio`、上限 50 查询；三次均 HTTP 200，原始结果见 `three-unrequested-commons-2026-10-30.json`。首尾两项本查询无结果，不代表不存在录音。

`from then on` 命中 [文件页](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Eilidhmax-from_then_on.wav)。原始文件页 wikitext（`from-then-on-wikitext-2026-10-30.json`）的 Lingua Libre record 直接标 `transcription = from then on`、`languageId = Q1860`、speaker/author Eilidhmax，许可 `cc-by-4.0`；文件 imageinfo（`from-then-on-commons-detail-2026-10-30.json`）亦标英语 Lingua Libre 录音、speaker/recorder Eilidhmax、CC BY 4.0。此为完整词头及来源明确的候选，非人工试听结论。请求 MediaInfo 返回 HTTP 200 但内容是 DBConnectionError（`from-then-on-mediainfo-2026-10-30.json`），未用作成功证据。

最新本地缺录快照中精确词条 ID 2230 `from then on` 和可选形式 ID 2229 `from (then) on` 的播放词均为 `from then on`。是否用于后者需结合产品展示和运行时确认，不得暗示文件读出不含 then 的形式。未下载音频、未试听、未独立核验口音与音质；未更改 manifest 或用户数据。

## 隔离下载与实际调用核查

原始 WAV `https://upload.wikimedia.org/wikipedia/commons/2/2c/LL-Q1860_%28eng%29-Eilidhmax-from_then_on.wav` 取得 HTTP 200，保存在 `/tmp/from-then-on-original.wav`，93,740 字节，SHA-256 `3cc15d381594e24b3b8db57c96a01b5e3be7d0fdccc3df9361efda0bc5dcf5ef`。ffprobe 为 48 kHz 单声道 PCM s16le，0.976 秒；ffmpeg 整文件解码成功。Whisper base 转写 `from there on`，small 转写 `from then on`；模型有分歧，只能作为筛查线索，仍需人工试听，不应据此声称已核实录音内容或口音。

`web/src/audio.ts` 的 `pronunciationHeadword` 显式将 `from (then) on` 规范为 `from then on`；该精确词头自身也解析为同一播放词。桌面调用 `/api/pronunciation/audio?word=from%20then%20on`，离线 `bundledAudio` 按播放词查询打包索引；`pronunciationCreditsUrl` 同样以此词生成来源链接。两个词头的听写/练习能力仍按既有占位逻辑决定，不能从播放映射推断均有完整拼写测试。本次没有转码、导入、试听或更改 manifest。

## 接入与核验补充

Commons 官方转码 MP3（16,077 字节，SHA-256 `94fc5e26ecc446488d23ee496dcb5e55406122a8950e6f6c35fc5cfe8b84694f`）时长 0.976 秒。原 WAV 在 -35 dB 阈值下语音活动大致为 0.195–0.789 秒，首尾留有静音，未见明显截断。Whisper medium 和 small 都识别为 “from then on”，base 识别为 “from there on”；这是同一模型家族不同规模的结果，不能当独立人工听审，也不能证明口音。原文件提供者明确标注完整词头、英语、作者及 CC BY 4.0，现将 Commons 转码文件加入清单，口音标为 unknown；来源、署名、许可及未听审状态保留在归属信息。两个教材形式均依现有规则映射为播放词 from then on，录音实际播放完整短语，不声称录出省略 then 的形式。定向测试覆盖播放词规范化、在线音频及来源、打包文件哈希和署名。
