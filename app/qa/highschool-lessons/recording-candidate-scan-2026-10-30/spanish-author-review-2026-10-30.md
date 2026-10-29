# Spanish 录音来源复查（2026-10-30）

当前资源 [En-us-Spanish.ogg](https://commons.wikimedia.org/wiki/File:En-us-Spanish.ogg)：上传记录为 Muke 于 2004-11-08 上传，原评论为 “own pronunciation of ‘Spanish’ ... {{PD}}”。原始信息页当前标注 own assumed、author assumed，许可模板 Self/PD-self；原始英语 Wiktionary 词条仅列出这份录音。原始历史和 Wiktionary 英语词条响应保存在 spanish-history-wiktionary-2026-10-30.json。上传评论提供相关背景，但未明确说录制者是谁，暂不将推定作者作为确定录制者。

一次 Commons 搜索发现两个候选：[Grendelkhan](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Grendelkhan-Spanish.wav) 和 [Wodencafe](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Wodencafe-spanish.wav)。Commons 元数据明确区分各自 Speaker、Recorder，均使用 CC0；文件名包含英文语言代码及 Spanish。相应原始结果保存在 spanish-commons-search-2026-10-30.json 和 spanish-candidates-2026-10-30.json。

针对第一个候选的 Lingua Libre Q1322770 原条目 API 查询返回 HTTP 503，未提供 Retry-After；之后立即停止请求。该候选尚未通过原条目词头及音频实听确认，不作导入，不能据搜索结果断言录音准确；音频、音质和口音均未审听。后续服务可用时低频核对原条目与音频内容，并检查转换及许可后再考虑接入。

本轮只读；保留旧 manifest、缓存、音频和学习记录。

## 后续：Commons 结构化证据与替换

不访问 Lingua Libre，直接查询 Commons 两份文件页及 MediaInfo。Grendelkhan 文件 P9533 的文本为 `Spanish`、语言为 `en`，P407 为 Q1860（英语），元数据 Artist 明确列出 Speaker 和 Recorder 均为 Grendelkhan；CC0 页面声明与结构化许可一致。Wodencafe 文件的 P9533 为 `spanish`、语言 `en`，同样明确 Speaker 和 Recorder，亦标注 CC0。对应响应保存在 spanish-commons-filepages-2026-10-30.json、spanish-commons-mediainfo-2026-10-30.json、spanish-commons-derivatives-2026-10-30.json。声明支持文件与词头、作者关联，但不是人工试听验证。

接入 Grendelkhan 录音，口音标 unknown；原 WAV SHA-256 `9842b360c3ae9e544f41a969988fa9701e308147cb26d56df21d13793c4a80d9`，70444 字节，48 kHz 单声道，0.733333 秒；Commons 官方 MP3 SHA-256 `f33fc59882b65bcb0b4c8a1d774ade955aac714ab887c44a04a473e421bd1955`，14336 字节，44.1 kHz 双声道，0.733333 秒。两份文件完整解码通过；尚未人工试听，口音、发音和音质不可据此确认。保留旧音频文件、旧 sources 记录以便追溯；manifest 仅替换 Spanish 条目，未改用户学习数据。在线 API、离线打包和原文件保留由针对性测试覆盖。已安装 APK 不会自动更新。
