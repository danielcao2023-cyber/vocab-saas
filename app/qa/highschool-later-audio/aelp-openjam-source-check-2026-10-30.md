# AELP 与 Openjam 录音来源核查（2026-10-30）

本轮仅调查来源和访问方式，**没有试听、导入或接入任何录音**；以下是当前证据的边界，不是对版权状态的最终法律判断。

## NUS Auditory English Lexicon Project（AELP）

- [项目主页](https://inetapps.nus.edu.sg/aelp/)和[下载页](https://inetapps.nus.edu.sg/aelp/downloads)列有英文单词和非词录音，单词包分别由六位新加坡、美式、英式说话者录制，每个 ZIP 约 523–683 MB。网站注明 NUS 保留权利；本次在下载页未找到授权将音频重新分发的条款。
- 实测美式女声单词包 [`F2_WORDS.zip`](https://inetapps.nus.edu.sg/aelp/download.ashx?file=F2_WORDS.zip) 对 `Range: bytes=0-1023` 返回 HTTP 200，而非 206；接收达到 1 MB 后终止，未完成下载或比对词头。其他文件不应据此推断。
- 下载入口及语料描述不能替代录音再分发授权。除非取得适用于目标音频和离线分发的明确许可，并逐条核对词头、录音质量及署名要求，否则不可接入。未进行人工听审。

## Openjam

- [项目 README](https://github.com/amirj4m/openjam)将词汇数据库描述为 MIT 许可，schema 列有音频 URL 字段；同一页面将英美音频托管列为未来 v0.6 计划，已列数据来源和许可说明没有明确到逐条音频。
- 数据库代码或文本的 MIT 声明不能自动证明外部音频文件的来源、权属、真人录制或可再分发许可。此轮未发现足以核实并导入的目标音频，也未开展听审；后续版本可重新核查。
