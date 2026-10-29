# 非 Commons 开放语音资源调查（2026-10-30）

本次检索并比对索引，仅隔离提取一个音频样本核对文件可用性，未修改清单或判断听辨质量。现有词库通过 `npx tsx scripts/audit-highschool-offline-audio.ts --missing-json /tmp/audio-source-gap-1030.json` 以 catalog v137 和已构建离线种子盘点：2730 个高中词条、392 条缺录；这是文件元数据和 SHA-256 检查，不证明声音质量或许可准确，也可能随构建更新而变化。

## OpenSLR 83：完整话语中有一个精确命中

[项目官方页面](https://openslr.org/83/)明确提供真人 WAV、语句索引、CC BY-SA 4.0 和英国/爱尔兰口音分类；[论文](https://aclanthology.org/2020.lrec-1.804/)说明采集与许可。将官方 `line_index_all.csv` 17,877 行全文与上述 392 个缺录条目的 `spoken` 比对，统一小写并移除标点，恰有 1 个词条命中：`Merry Christmas!` 对应 `Merry Christmas`，可见多种方言 ID。索引 URL https://www.openslr.org/resources/83/line_index_all.csv 。示例 `sof_07060_01012381485` 和 `wem_09334_00998328509`；通过 ZIP HTTP Range 实际取得 `sof_07060_01012381485.wav`：WAV PCM、48 kHz、单声道、2.730667 秒、262188 字节，SHA-256 `9f81daa1056af32522ed72c97e306f169abb484a84f4782993499631eca1ed79`；已解码、尚未人工试听，仍需确认完整发音。该库主要是完整句子，不能无边界、未经听辨地切分成单词。发布录音须复核该项目授权与署名、许可链接、修改标注及 share-alike 条款；不作法律结论。ZIP 总长度 1636701939 字节，支持 HTTP Range；本次仅读末尾 65536 字节、中央目录 395456 字节与目标文件约 116 KB，未下载完整包。官方 about 标注 Copyright 2018、2019 Google，录音文件为匿名 ID，不提供每位说话人姓名和独立许可，须保留此范围的署名信息，不能虚构个人作者；音质验收未进行。

## Speech Commands v0.01：单词录音但无缺口命中

[数据集作者论文](https://arxiv.org/abs/1804.03209)确认其为孤立词音频；[发布说明镜像](https://github.com/DagsHub/audio-datasets/blob/main/Speech_Commands_Dataset/README.md)列 30 个目标词、WAV 与 CC BY 4.0。30 词列表和上述 392 条规范化完整词头交集为 0；没有下载或试听，不可宣称已验证其音频、许可原始版本及 0.02 版本。它不能批量填补当前缺口。

## MRP Corpus：许可候选，但不是现成词条录音

[作者项目](https://github.com/tweddan/MRP_Corpus)声称 CC BY 4.0、29 名英国本土发音人，7000 余段话语，配词级和音素级 TextGrid；给出 [Zenodo DOI](https://doi.org/10.5281/zenodo.15773907)。材料包括句子、书籍片段，未发现已切好的完整词条库；此次 Zenodo 页面工具无法访问，也没有下载和比对音频或 TextGrid，不能宣称命中数或适用于直接切词。可以在取得实际文件及确认条款后，以时间戳形成候选并逐条人工核查完整发音和上下文。

## 其他排除或待证实

[WordAudio](https://github.com/mrcraked/WordAudio)提及 MIT 和可生成音频，但同时标注 text-to-speech，未能确认源音频及独立再分发权，不作为真人开放音源。 [Openjam](https://github.com/amirj4m/openjam) README 将词典数据称 MIT 且将音频写在路线图；其[原始归属说明](https://github.com/amirj4m/openjam/blob/main/ATTRIBUTION.md)标音频来源 TBD，无法据此认定音频已有或 MIT。 [LDC American English Spoken Lexicon](https://catalog.ldc.upenn.edu/LDC99L23)声称 53,602 个独立真人词录音，但采用 LDC User Agreement；本次未发现可自由离线再分发的开放许可，不能直接接入。

研究没有发现可确认的、直接覆盖大批现存缺口且授权清晰的现成孤立词真人录音库；候选语音、许可证和匹配数均有上述边界。

## OpenSLR 83 最小接入方案（尚未实施）

`mainHeadwords('Merry Christmas!')` 保留标点，manifest 必须精确使用该项目词头，不能以索引省标点形式代替。在线 pronunciation API 和离线 pack 接受任意 HTTPS 来源并检查词头、MP3 名称、文件完整性和 SHA-256，不要求 Commons provider；项目自动导入器的 provider/URL 规则则针对 Commons 等，不能直接作为此来源的导入器。可经人工试听后受控转码，记录源 WAV、ZIP 文件名、样本 ID、source SHA-256、转码命令和 MP3 SHA-256；使用真实语料版权标识 `Google, Inc.（OpenSLR 83；录音者匿名；文件 ID …）`，不得把 Google 描述成实际说话人。官方来源和 CC BY-SA 4.0 许可链接均予保留。

现有来源页面把链接叫“原始录音”，若链接为 ZIP 应明确这是所在压缩包；离线来源表不显示 pronunciationNote，需要确保样本 ID 和转码信息可见。新增定向测试应覆盖真实标点词头、在线响应及字节哈希、离线打包/来源署名、许可与样本 ID、源文件缺失和损坏时不冒充 ready、运行中旧题不改变答案和学习记录；重新构建并验收离线应用。实际听辨和满足许可要求后才决定接入。

已接入该样本：MP3 由源 WAV 执行 `ffmpeg -nostdin -hide_banner -loglevel error -i /tmp/slr83-merry-christmas.wav -map_metadata -1 -codec:a libmp3lame -b:a 96k /tmp/slr83-merry-christmas.mp3` 生成，SHA-256 `679c70efbb95690674b213c8c66f069181cc1671bd77ca431de36caf72ea371c`；默认词头和原始 ID 保留，来源说明注明未人工试听、转码及匿名说话人。线上和离线来源都展示样本说明，并将原始压缩包准确标名。Commons 导入脚本对 OpenSLR 项仅保护不删除、不覆盖，不将其视作 Commons 验证。定向测试 `test/highschool-openslr-merry.test.ts` 等 4 文件 18 项通过；尚需重建离线包及实际设备试听。
