# Jasper 地名录音核查

词条为加拿大地名 Jasper。录音来自 [Wikimedia Commons 的 En-us-jasper.ogg](https://commons.wikimedia.org/wiki/File:En-us-jasper.ogg)，作者 Neskaya，许可 [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)。录音原描述是普通名词 jasper；[Cambridge 普通名词词条](https://dictionary.cambridge.org/us/pronunciation/english/jasper) 给美音 /ˈdʒæs.pɚ/，[Dictionary.com 地名条目](https://www.dictionary.com/browse/jasper) 列 Jasper 加拿大城镇及 /ˈdʒæspə/，后者为不卷舌形式；项目已有地名美音 /ˈdʒæspɚ/。故选用此美式录音，跨词义对应属于依据发音的判断，不是录音源宣称地名。

2026-10-30 核对先前限流记录，Retry-After 4 秒且已过数小时；只发出一次官方文件下载请求，状态 200。文件 SHA-1 `acad0332eaaf3ced91927243ec7ed6e39edfc5c0` 与来源记录一致，SHA-256 `4255bcb62337a00952f85714f8242454aac4d80b5d3a3cb72481c784ae502c40`，时长 1.55 秒；Whisper small 和 medium 均识别为 Jasper。**未人工试听；模型识别不证明具体音素或口音。**

FFmpeg 8.1 转码：`ffmpeg -i En-us-jasper.ogg -map_metadata -1 -codec:a libmp3lame -q:a 3 -y jasper.mp3`。MP3 SHA-256 `d2206f77db8c3a196fc02d1a1c3c8500a838f0412b4b874cc4aa49588172b65a`；音频是原录音转码，不是重新录制。应用离线录音页面保留来源、作者、许可和转换说明。
