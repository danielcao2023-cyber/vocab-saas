# LJSpeech 短语候选：五条完整句初筛（2026-10-30）

从此前 42 个短语文本匹配中挑选五条语义自然、可能便于后续人工判断边界的句子。每条逐文件从 [flexthink/ljspeech 第三方镜像](https://huggingface.co/datasets/flexthink/ljspeech) 下载到临时目录；未下载整包，也未提交音频。精确下载 URL、原句、文件大小、完整 SHA-256 和 Whisper 输出见同目录 `ljspeech-five-candidates-2026-10-30.json`。本次对临时文件重新计算 SHA-256，五项均与该 JSON 一致；此哈希只证明本次本地文件身份，并非原始数据集比对。

| 词组 | 文件 ID | 原句 | 本地 Whisper base 输出 |
| --- | --- | --- | --- |
| take part in | LJ009-0127 | But what are the feelings of those who take part in it? | But what are the feelings of those who take part in it? |
| adapt to | LJ040-0218 | and as will be shown below, this failure to adapt to his environment was a dominant trait in his later life. | And, as will be shown below, this failure to adapt to his environment was a dominant trait in his later life. |
| under pressure | LJ006-0041 | Changes introduced under pressure had been only skin deep. | Changes introduced under pressure had been only skin-d. |
| by accident | LJ012-0203 | Eventually the law overtook them, but almost by accident. | Eventually, the law overtook them, but almost by accident. |
| aware of | LJ013-0064 | Barber, it was said, became aware of this, | Barber, it was said, became aware of this. |

识别使用本机已有 OpenAI Whisper `base.pt`、CPU、英语、无提示词；五条输出都含目标词组，但 `skin deep` 被识别成 `skin-d`，显示自动识别并非听审。文本元数据文件本次 SHA-256 为 `852bce5c79e5184ba5bf2ea98aad4bcf49a5d787def5fd1f04fa2ab8aa6dc535`；它也未经与官方归档比对。

## 来源、许可与待核边界

- [LJSpeech 官方数据集说明](https://keithito.com/LJ-Speech-Dataset/)称录音为 public domain、由单一说话人读出的 LibriVox 文本。[LibriVox 公有领域说明](https://librivox.org/pages/public-domain/)指出其录音在美国为公有领域，其他司法辖区情况可能不同。不要把这个表述直接改写成 CC0 或断言所有地区再分发权利均已确认。
- 具体文件取自上述第三方镜像；镜像标注版本 1.0，尚未与官方原始包逐条比对，因此具体字节与官方发行版一致性尚未证实，使用前仍需核查权利链及适用地区条件。
- 当前保存的是完整句；未切分、未人工试听、未确认目标短语实际边界、发音、口音或教学适用性。Whisper 文字包含目标不等于声音内容或切分可用。任何截取要经过人工听审及来源、许可复核，不能直接当作孤立短语录音加入产品。
- 数据仅为候选审计；没有修改录音 manifest 或用户学习数据，也没有声称五条已可离线发布。
