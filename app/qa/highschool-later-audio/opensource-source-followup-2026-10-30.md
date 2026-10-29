# 高中录音来源补充调查（2026-10-30）

本次为只读来源调查，未下载音频、修改录音清单或试听；不能据此推断高中缺录词的实际覆盖率或音质。此前 [来源初筛](source-triage-2026-10-29.md)、[Shtooka 检查](shtooka-source-check-2026-10-29.md)、[LJSpeech 检查](ljspeech-source-check-2026-10-29.md)和 [Tatoeba 检查](tatoeba-source-check-2026-10-29.md)保留其各自时间点的核验范围。

## Lingua Libre 与 Wikimedia Commons

[Commons 英语 Lingua Libre 分类](https://commons.wikimedia.org/wiki/Category:Lingua_Libre_pronunciation-eng)本次查看时显示 110,371 个文件；这是录音文件数，不是去重词数，也不是高中词头可用覆盖数。候选不限于 `En-us-词头` 这类标准命名，可补充既有标准文件名检索。Commons [结构化数据属性表](https://commons.wikimedia.org/wiki/Commons:Structured_data/Properties_table)列有音频文字 P9533、语言 P407、说话者 P10894、录制者 P10893、Lingua Libre ID P10369，可用于以完整目标词头和英语语言筛选候选；字段并非保证每条都有，文本匹配不等于词形、义项、口音或真人录音的正确性。

[MediaWiki CommonsMetadata 文档](https://www.mediawiki.org/wiki/Extension:CommonsMetadata/en)说明可以通过 imageinfo 的 extmetadata 查询作者、署名及许可等信息；[Imageinfo](https://www.mediawiki.org/wiki/API:Imageinfo)还支持文件 URL、哈希等元数据，并提示 extmetadata 查询较昂贵，应小批量请求。自动提取后仍要核对原始 Commons 文件页及许可条件；缺失或有歧义的候选不能自动导入。对于词性变读、词组、英国/美国变体及专名，需确认完整录音内容和对应义项，并实际试听。

[Commons 的复用说明](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/licenses)指出许可依文件而不同：CC BY 可复制和修改，须遵守署名、许可链接及改动说明等条件；CC BY-SA 还对适用的改编版本提出相同或兼容许可条件。是否构成改编、某一应用分发方式如何满足具体许可，须按实际文件和完整许可条款判断；不应据分类或工具代码的许可证推断全部音频授权。Commons 同时说明页面元数据不提供权利状态保证。

## Wiktionary 发音索引

[Reza2kn/wiktionary-ipa-audio-en](https://huggingface.co/datasets/Reza2kn/wiktionary-ipa-audio-en) 按记录列词头、IPA、口音标签、音频文件名、配对方式与 Wiktionary 来源；可作机器初筛，但作者说明录音可能有不同许可和署名要求，须回溯原始页面。本次未下载该数据或音频，也未计算其对本词库的命中率。

网页展示本身可见潜在错配，不能把索引配对视为试听和标注正确的证明：

- `raven` 一行给出 Received Pronunciation IPA，却指向 `En-us-raven.ogg.mp3`；美国文件名与其音标标签不一致，实际音频未试听。
- `day` 一行指向 `En-uk-a_day.ogg.mp3`；文件名含冠词 `a`，不能仅凭关联把录音断定为单独的 `day`。实际内容未试听。

录音可能既有 Wiktionary 关联也在 Lingua Libre 分类中出现；它们是查找途径，不是可直接相加的独立覆盖量。第三方索引显示的口音/音标信息也不能替代录音原页权利核验。

## Shtooka 单文件的新证据

此前 Shtooka 集合 README 不可访问；本次读取所列的 Emmanuel、Judith、verbs 和 Wims Mary 的包 README 仍得到 502，仍不能将目录里的「免费」视为整包离线再分发许可证明。

单文件 [En-uk-computer.ogg](https://commons.wikimedia.org/wiki/File:En-uk-computer.ogg) 页面标示来源为 Shtooka、作者 Association Shtooka 和 Judith Franck、CC BY 3.0 US；页面描述为伦敦说话者录音。其许可页面列出复制及改编并署名、提供许可链接和说明改动的要求。该证据只适用于这个文件，不能推断其他 Shtooka 文件或整包许可；本次未试听或导入。

## Common Voice 与其他限制

此前已确认 [Common Voice 单词片段](source-triage-2026-10-29.md)仅含特定数字和 yes/no，而非通用词库。完整英语 Common Voice 以句子语音为主，需额外取得可靠词边界，不能直接作为完整单词录音。

[Mozilla Common Voice 条款](https://commonvoice.mozilla.org/oc/terms)称数据集原则上以 CC0 提供（另有说明除外），同时请求不要在其他平台发布、分发或镜像数据集的全部或部分，要求通过 Mozilla Data Collective 访问。离线 APK 携带从数据集获得的片段是否涉及该请求，应就实际使用方式向 Mozilla 核实；不能仅据数据集标签断言适合打包分发，也不在此推断该请求的法律效力。

[Forvo API 官方说明](https://api.forvo.com/documentation/general-information/)列有署名、非商业、相同方式共享等条件与商业计划差异，链接有效期约两小时；它并未在本次调查中证明允许将音频离线打包再分发，因此不视为可直接导入来源。

后续如开展候选比对，应保留每条词头、文件页面、作者、原许可链接、许可版本、文件版本及摘要、完整转写、口音/义项和试听结果；先做来源和许可证审核，再考虑导入。用户数据和现有录音不在此次调查范围内。
