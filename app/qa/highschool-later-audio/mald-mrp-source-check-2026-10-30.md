# MALD 和 MRP 录音来源核查（2026-10-30）

本次针对当时高中尚缺主录音的约 382 个词条调查其他来源；未取得可供逐项比对的完整索引，不能给出命中数。未下载或人工试听录音，未改动音频清单。

## MALD

- [作者实验室的项目页](https://nascl.rc.nau.edu/resources/massive-auditory-lexical-decision/)列有单词录音及词项数据入口；[原论文摘要](https://pubmed.ncbi.nlm.nih.gov/29916041/)说明数据包含 26,793 个单词录音。论文和[后续研究](https://pmc.ncbi.nlm.nih.gov/articles/PMC11965236/)描述真人单词刺激和西加拿大英语。
- 单词录音的 [DOI 元数据](https://api.datacite.org/dois/10.7939/r3-v0jr-rr12)将资源标为“MALD Word Items”，作者 Benjamin V. Tucker，许可为 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/legalcode)。非商业限制必须结合实际用途判断，不能当作允许任意商业再分发的许可。
- 作者页面所链的[录音 DOI](https://doi.org/10.7939/r3-v0jr-rr12) 与[词项数据 DOI](https://doi.org/10.7939/R36970B3D) 本次访问返回 403；没有取得词表、具体目标音频或内容匹配证据。论文或元数据开放不等于音频可用于任意用途。

## MRP Corpus

- [官方仓库说明](https://github.com/tweddan/MRP_Corpus)标注 CC BY 4.0、29 名现代标准英音使用者、逾 7,000 条语音，包含词级和音素级 TextGrid；素材为句子、短文和公版书籍片段，说明也提示可能存在转录错误。它并非现成的孤立单词录音库。
- [Zenodo 概念记录 API](https://zenodo.org/api/records/15773907)本次指向 v2（记录 20628795），元数据同时标注 CC BY 4.0 和 `access_right: restricted`，公开 `files` 数组为空。[版本列表](https://zenodo.org/api/records/20628795/versions)中 v1（15773908）同样为 restricted；v1、v2 的 `/files` API 本次均返回 403。
- 官方 GitHub 仓库本次只有 README，没有公开索引、TextGrid 或音频。未能核对 382 词的交集，也无法对文件做 Range 抽取。词级自动对齐只能作为候选定位，完整性、读音、语境和教学适用性仍需进一步核查与人工试听。

CC BY 许可和下载权限是两个不同问题；以上调查未确证任何可直接接入、已听审的目标录音。访问状态是本次实测，未来可能变化。
