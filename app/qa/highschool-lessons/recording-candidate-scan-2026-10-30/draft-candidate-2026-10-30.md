# draft 候选录音隔离核查（2026-10-30）

[Commons 原始文件页](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Arlo_Barnes-draft.wav)（pageid 105074721）元数据将 Speaker 与 Recorder 分别明确列为 Arlo Barnes，许可证为 [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)，页面源码是 `{{cc-zero}}`；原始响应见 `draft-commons-detail-2026-10-30.json`。此前同目录 `five-candidates-mediainfo-2026-10-30.json` 的 MediaInfo P9533 为 draft/en、P407 为英语 Q1860，与目标完整词形一致。

原 WAV 与 Commons 官方 MP3 分别 HTTP 200，并保存到 `/tmp/draft-audio-audit/draft-original.wav` 和 `/tmp/draft-audio-audit/draft-commons.mp3`。下载记录见 `draft-commons-download-status-2026-10-30.json`。

- WAV：SHA-256 `6d12fea073ff627ef9fe9afb0fe2e521d4177bc6e64ef447ae64fb1c5e748def`，91412 字节，44.1 kHz 单声道，1.035918 秒。
- MP3：SHA-256 `8cd654a56077a83821c1ab168f55515536bb605c7fd5f25b7344abaa3bf003e6`，18766 字节，44.1 kHz 双声道，1.035918 秒。

两份文件均用 `ffmpeg -v error -i FILE -f null -` 完整解码通过。尚未人工试听，实际发音、口音与音质没有经听审核实，若接入应将口音标 unknown，并区分元数据声明和人工核验。未修改 manifest、sources、应用音频或用户学习数据；临时文件可能被系统清理，接入前请重新核对哈希。

## 接入

隔离核查后重新核对 MP3 SHA-256，在源码 manifest 增加 `draft`，录音口音为 unknown，保留 CC0、来源与录制者署名；sources 缓存加入该 Commons 文件的元数据，词形 P9533/P407 原始依据见上文 MediaInfo。仅修改该录音，未修改用户学习数据；未人工试听。`test/highschool-draft-recording.test.ts` 覆盖高中 unit、在线元数据和音频返回字节、临时目录离线打包和署名；该测试连同 pronunciation-source 测试共 34 项通过。已安装安卓包未更新。
