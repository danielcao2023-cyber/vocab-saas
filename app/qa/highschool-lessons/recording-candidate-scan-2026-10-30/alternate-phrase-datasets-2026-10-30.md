# 开放的真人完整短语语料调研（2026-10-30）

## Google/OpenSLR SLR83

[OpenSLR 数据集官方页](https://www.openslr.org/83/)标注 CC BY-SA 4.0，按文件提供真人英语句子录音，带独立 1.9 MB 文本索引 `line_index_all.csv`；使用、裁剪并再分发前需保留来源与署名并正确处理相同方式共享要求。作者说明数据经人工质量检查但仍可能有错误。

实际下载的索引 SHA-256 `c4edc0328629278b1ba4288eec8615ba2bdff43137c88823629a56171a404da3`，包含 17877 行。对高中 386 缺口快照的 337 个非占位词头，将文本转小写并删除标点后比对：整条句子等于词头 **0 条**；18 个短语在较长句子中以连续文本出现（每个记录一条例句，见 `openslr83-highschool-text-matches-2026-10-30.json`）。其中 suitable for、refer to、take part in、lead to、in memory of 等可作为后续声学边界研究的线索，但如 head to 的某些字面命中实际为“头部转向”语境，不一定满足词条义项。

这些命中不是已经验证的独立短语录音。录音以分口音压缩包提供，当前仅下载文本索引，未下载音频或验证音质、确切切分、词义、连读及口音。可先对目标词组定位句子及文件 ID，再有针对性读取压缩包单个成员，借人工或可靠声学对齐划分并听审，保留 CC BY-SA 署名及衍生许可；不要把整句冒充短语，不要仅凭文本对齐就判为可用。

## 其他潜在语料

[MRP Corpus 作者项目](https://github.com/tweddan/MRP_Corpus)声明 CC BY 4.0、约 7000 条真人英语语句，包含词级 TextGrid 时间标注，理论上可组合连续词时间戳、复核边界并提取目标短语；本次可访问的 GitHub 仓库仅有说明文件，Zenodo record API 未列出文件，本轮没有检索到具体候选，不保证后续可下载。

[Effect AI Scripted Speech](https://mozilladatacollective.com/datasets/cmkfm9fbl00nto0070sdcrak2) 列 11000 多条真人录制句子，CSV 带文本和音频名，可能支持批量检索；但同一页面许可字段写 CC0，说明文字却写 CC BY 4.0，存在冲突，需向发布方核实具体授权，并遵守不尝试辨识说话人身份的约束。未获取索引、没有具体匹配，不视为已核授权。

结论：本轮找到可批量检索的 18 个上下文线索，但没有确定可直接接入的完整短语录音；具体文件需完成版权、切分及实际听审。本轮未改 manifest 或用户数据。

## 18 个文本命中及文件定位

以下每词仅列扫描返回的第一句，完整文字和匿名文件 ID 见表；句子为候选上下文，不是可直接播放的目标短语。包名由文件 ID 前缀与官方口音分组推断；除下方三条外，尚未检查对应压缩包内实际成员。大小为 OpenSLR 官方页的显示值。

| 目标短语 | 索引 ID / 音频文件 ID | 所在包（推断） | 原句 |
| --- | --- | --- | --- |
| suitable for | EN0284 / nom_07508_01798245723 | northern_english_male.zip，817 MB | Please make sure that your app is suitable for a mixed audience including children and parents |
| the Eiffel Tower | EN0275 / wef_09334_00767320983 | welsh_english_female.zip，595 MB | The Eiffel tower is third among the top restaurants in Paris |
| the Amazon rainforest | EN1262 / nom_07508_00671798483 | northern_english_male.zip，817 MB | Congo Rainforest is the second largest rain forest area in the world second only to the Amazon Rainforest in South America |
| refer to | EN0920 / nof_05223_01349045656 | northern_english_female.zip，314 MB | Maw may refer to a fish's air bladder |
| relate to | EN0611 / nom_09334_02147437884 | northern_english_male.zip，817 MB | Please make sure that the images you upload relate to your app in some way and are the correct resolution |
| take part in | EN1025 / wef_07049_01339309565 | welsh_english_female.zip，595 MB | Moot court is an extracurricular activity at many law schools in which participants take part in simulated court or arbitration proceedings |
| lead to | EN0050 / wef_12484_00900564235 | welsh_english_female.zip，595 MB | Decision fatigue may also lead to consumers making poor choices with their purchases |
| the Nile | EN1380 / wef_07049_00529120817 | welsh_english_female.zip，595 MB | Bast was the goddess of warfare in Lower Egypt the Nile Delta before the unification of the cultures of ancient Egypt |
| search for | EN0773 / irm_02484_01548325801 | irish_english_male.zip，164 MB | The first challenge in the small band's search for a new home comes immediately as they are forced to elude the warren's military castle |
| in memory of | EN1077 / wem_08784_00160642460 | welsh_english_male.zip，757 MB | A libation is a ritual pouring of a liquid or grains as an offering to a god or spirit or in memory of the dead |
| head to | EN1126 / mif_03397_00928579450 | midlands_english_female.zip，103 MB | If the mass of the coils of the hangman's knot are tightened beneath the jaw it levers the head to one side |
| series of | EN1435 / wef_04310_01797685276 | welsh_english_female.zip，595 MB | A series of nonviolent revolutions known as the colour revolutions overthrew governments in Georgia Ukraine Kyrgyzstan and Lebanon |
| participate in | EN1318 / irm_04310_01188820904 | irish_english_male.zip，164 MB | All the major national provider and payer organizations participate in discussions and decisions on policy and guidelines |
| engage in | EN0904 / nom_08421_01785604268 | northern_english_male.zip，817 MB | Some cyberattacks are ordered by foreign governments these governments engage in cyberwarfare with the intent to spread their propaganda sabotage or spy on their targets |
| contrary to | EN1248 / irm_03397_01251588485 | irish_english_male.zip，164 MB | Contrary to popular belief both forms of leprosy are curable |
| the Antarctic | EN0939 / wem_08421_01681965758 | welsh_english_male.zip，757 MB | The two later embarked on an antarctic tour that became the subject of a co-authored book Voyage through the Antarctic |
| more like | EN0330 / irm_04310_01583133115 | irish_english_male.zip，164 MB | Looks like we'll have to try a food that's more like actual food |
| conflict with | EN1199 / sof_03034_01293333169 | southern_english_female.zip，1.6 GB | The abbot fell into conflict with the archbishop |

优先供试听切分的三条（同在 595 MB `welsh_english_female.zip`）：

- **take part in**：`wef_07049_01339309565.wav`，上下文 “participants take part in simulated court ...”，语义为参与；ZIP 中该成员存在，原 WAV 868396 字节。
- **lead to**：`wef_12484_00900564235.wav`，上下文 “may also lead to consumers ...”，语义为导致；成员存在，原 WAV 811052 字节。
- **series of**：`wef_04310_01797685276.wav`，上下文 “A series of nonviolent revolutions ...”，语义为一系列；成员存在，原 WAV 1441836 字节。

上述三项只核了压缩包目录、句子语义及文件成员存在，**尚未获取音频、未核定声学切分边界，也未经试听**，实际是否容易切分无法预先断言。其他命中如 `head to` 的原句是头部偏转，不能仅凭文字匹配认定“前往”的义项；`the Eiffel Tower` 指塔餐厅，仍须核目标词条指代。

确切获取方式：官方包 `https://www.openslr.org/resources/83/welsh_english_female.zip`，HTTP HEAD 显示大小 595683538 字节、支持 Range；本轮通过 Range 读取 ZIP 目录核实上面三个文件名和大小，未下载完整包或任何音频。后续可使用支持 Range 的 ZIP 读取器按文件名读取单个成员到隔离目录，保留原音频 SHA-256；词级边界须强制对齐后用人工试听校正；变读、弱读或共发音截断难以自然呈现时应拒绝。按照 [官方许可页](https://www.openslr.org/83/) 的 CC BY-SA 4.0，保留数据集标题、Google copyright 2018–2019、原始链接、许可链接及修改说明，适用时遵守相同方式共享；需要核对具体分发方式并保留对应文件来源。

## 两份隔离音频和本机对齐工具检查

通过 HTTP Range 仅从 CC BY-SA 4.0 官方 ZIP 读取对应 WAV，zipfile 解压检查通过，ffmpeg 全文件解码通过：

- `take part in` 所在原句 `/tmp/slr83-candidate-audio/wef_07049_01339309565.wav`，SHA-256 `11c8f11e81ae86f32f7f9c2e625f2372843cdf89c527cb8559ecb3461d4a9742`，9.045333 秒。
- `lead to` 所在原句 `/tmp/slr83-candidate-audio/wef_12484_00900564235.wav`，SHA-256 `0c4bb22bd7fe25409e7ac4d1a7561aae38bcba849603aed3f431ef4b97c71b37`，8.448 秒。
- `series of` 的 Range 请求发生 TLS 超时，复试返回 BadZipFile，未取得文件，不作为候选。

本机没有检测到 MFA、WhisperX、torchaudio 或 aeneas，因此没有现成强制对齐器。Whisper base 的 `--word_timestamps True` 可生成粗略自动时间戳，但并非基于给定标准句的强制对齐：take part in 识别连续词约 5.28–6.10 秒；lead to 则将语句识别成 “lead consumers to make”，与索引的 “lead to consumers making” 不同，不能据此切分。均未人工试听，时间戳不能证明语音边界、没有截断或短语实际词形。

为避免误裁，本次保留两个完整原句 WAV 供后续试听，不产出假定边界无误的短语切片。要得到可靠切片需要真实对齐工具（及模型）和人工听审；尤其 lead to 须先排查文本/录音不一致。本轮未修改 manifest 或用户数据。
