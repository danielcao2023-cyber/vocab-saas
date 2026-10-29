# 高中缺录音：非 Wikimedia 来源调查（2026-10-30）

本记录为只读来源调查，未将任何音频接入应用。使用本机重建离线资源扫描得到的 394 条高中主录音缺口作为比对范围（catalog v137；口径详见 [离线覆盖盘点](offline-coverage-reproducible-2026-10-30.md)）。以下匹配以应用实际发音词头为准，忽略大小写而保留完整词形，不拆分短语、不将词形变化视为等价；命中仅是检索候选，不能证明实际文件内容、词义、音质或授权已经逐项通过审核。这是本机离线资源的缺口，不代表已安装 APK 的状态。

## Speech Commands v0.02

[数据集卡](https://huggingface.co/datasets/google/speech_commands)与其[词表和来源说明](https://huggingface.co/datasets/google/speech_commands#source-data)说明该数据集为志愿者按提示孤立读出的 35 个英语词，标称 CC BY 4.0，要求不试图确定说话人身份。按上面口径将其 35 个标签与 394 条缺口比较，**匹配 0 条**；数据集不解决本次缺口。此结果仅针对已列标签，不代表其他版本或其他数据集不存在候选。本次没有下载或试听该数据集音频。

## Auditory English Lexicon Project（AELP）

[新加坡国立大学官方介绍](https://inetapps.nus.edu.sg/aelp/about)列出 10,170 个英语单词、英美及新加坡英语真人录音和六名说话人。该页未见对应用内离线复制、修改和再分发的明确许可；目前未取得完整词表与逐项录音，因此尚无法给出高中缺口命中数，不能直接接入。若后续考虑使用，应先向项目方核实具体音频及离线发布权利，并核对录音内容、音质与口音。

## LexiCore 与 LexiDeck

[LexiCore](https://github.com/X-Trivle/LexiCore) 的开放词表为 CC BY 4.0，但其配套 LexiDeck 是单独产品，[项目 NOTICE 第 3 节](https://github.com/X-Trivle/LexiCore/blob/main/NOTICE.md)明确不授予该产品音频权利。不得以词表许可推断音频可离线再分发；免费样本也不自动授予此项权利。本轮未进行音频覆盖比较。

## Openjam

[Openjam](https://github.com/amirj4m/openjam) 声称词库及代码使用 MIT，并将英美发音 URL 列于未来路线；本轮未证实实际音频文件或其授权。词库和代码的授权不自动覆盖 URL 指向的第三方录音，本轮未计算录音覆盖，不能作为可直接导入的来源。

## Word Atlas：合成语音的边界

[Word Atlas](https://github.com/designfuchen/word-atlas) 的 7,298 条数据和文件清单实际可访问；其清单列出 UK 和 US 单词音频各 7,298 个，及例句音频。以同一 394 条缺口和上述精确匹配口径比对，得到 **13 个单词候选、0 个多词短语**：fin、puzzle、illustrate、patent、draft、rewarding、decrease、concrete、motivated、corporate、Log/log、knit、module。13 项英美路径均出现在其清单，但未逐条验证 HTTP、试听、词义或音标；Log 与 log 的大小写及身份需单独核查。抽检的 UK fin 音频可访问且可解码，文件 SHA-256 `cad7113c96041b5f31949af76f148704547347733de7f47e9d77c47ab45c4931` 与该项目清单一致；未人工试听。样本仅在临时目录核查，未导入。

该项目 [CONTENT_LICENSE.md](https://github.com/designfuchen/word-atlas/blob/main/CONTENT_LICENSE.md) 明确说明音频由 ElevenLabs 合成，**不能计作真人录音**，并标示成品音频为 CC BY 4.0、要求署名与标明修改，但许可限于维护者有权授予的范围。CC BY 4.0 本身允许复制、修改和离线分发；然而 [ElevenLabs 套餐说明](https://elevenlabs.io/docs/overview/administration/billing)区分免费及付费生成内容的商业使用权，而生成时套餐和适用版本未由 Word Atlas 公开确认。因此不能仅凭项目声明断定所有再授权链条已核实；如日后考虑合成语音离线发布，应先核实作者的生成与授权依据，并在产品及统计中明确标为合成音频。

本轮没有请求先前限流的 Wikimedia 服务；没有修改录音清单、代码或应用音频。未找到可安全接入的新增真人录音候选。
