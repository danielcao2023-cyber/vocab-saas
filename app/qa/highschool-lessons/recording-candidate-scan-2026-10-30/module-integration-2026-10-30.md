# module 录音接入（2026-10-30）

范围：人教必修三 Unit 4 的 stable key `module`（同时存在于其他考试词书），不复制学习记录。来源为 [Wiktionary 英语栏](https://en.wiktionary.org/wiki/module#English) 链接的 [Commons 录音](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Vealhurl-module.wav)，作者和录制者 Vealhurl，CC BY-SA 4.0；Commons metadata pageid 124958524。先前单次批量 API 的原始响应保存在本目录。文件名及词典英语栏对应 module，未人工试听；口音保持 unknown。

仅发两次低频下载请求，原始 WAV 与 Commons 官方 MP3 转码均返回 200、未出现 Retry-After。ffmpeg 完整解码两者无错误；ffprobe 原 WAV 为 pcm_s16le、48 kHz 单声道、1.053333 秒、101164 字节，MP3 为 44.1 kHz 双声道、1.053333 秒、24569 字节。原文件 SHA-256 `f334997e0d76c7cfc56b50e2cbf9ee764a4bec924b4d04d15d2462d83d4a9829`；项目打包 MP3 SHA-256 `083fe2edc1313915ffb2afe35eabf68af4ea07bc42290dd924bd676b7cd2bb02`。转换前后时长一致并可解码不等于已核对实际读音、口音或音质。

只在 manifest 和 sources 添加 module 一项，并加入文件 `module-083fe2edc131.mp3`，保持来源链接和许可署名；未更改其他条目。`npm test -- --run test/highschool-module-recording.test.ts` 1 项通过：验证教材 stable key、manifest 元数据与哈希、内存库在线接口字节、临时离线打包文件和署名。mobile-public 与已安装 APK 并未通过此测试重建。
