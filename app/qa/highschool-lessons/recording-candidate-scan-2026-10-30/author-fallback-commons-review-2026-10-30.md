# 既有来源作者复核（2026-10-30）

对上轮 15 个候选仅进行一次 Commons API 批量请求，HTTP 200，15 条均返回，失败 0，未出现 429/503；原始响应见同目录 author-fallback-commons-2026-10-30.json。高中归属使用 catalog 的 pep2019 成员关系与离线 seed 的 entry_key → 词头精确核对。

| 词 | 高中归属 | 原始 Artist | 分类 | 原始描述摘要 |
| --- | --- | --- | --- | --- |
| [accessory](https://commons.wikimedia.org/wiki/File:En-us-accessory.ogg) | pep2019-compulsory-3 / unit3 | SneverdleSnavis | 明确 Artist | SneverdleSnavis's pronunciation of “accessory” in English. General American: /əkˈsɛsəɹi/ |
| [ballet](https://commons.wikimedia.org/wiki/File:En-us-ballet.flac) | pep2019-compulsory-1 / unit1 | 0x0077BE | 明确 Artist | Pronunciation of the word "ballet" by a native speaker of American English. |
| [blossom](https://commons.wikimedia.org/wiki/File:En-us-blossom.ogg) | pep2019-optional-3 / unit5 | Mx. Granger | 明确 Artist | American English pronunciation of " blossom " by a male speaker. |
| [buffet](https://commons.wikimedia.org/wiki/File:En-us-buffet.ogg) | pep2019-optional-1 / unit3 | 0x0077BE | 明确 Artist | Pronunciation of the word "buffet" by a male native speaker of American English. |
| [Halloween](https://commons.wikimedia.org/wiki/File:En-us-Halloween.ogg) | pep2019-compulsory-3 / unit1 | Mx. Granger | 明确 Artist | American English pronunciation of " Halloween " by a male speaker. |
| [jog](https://commons.wikimedia.org/wiki/File:En-us-jog.ogg) | pep2019-compulsory-1 / unit3 | Mx. Granger | 明确 Artist | American English pronunciation of " jog " by a male speaker. |
| [Spanish](https://commons.wikimedia.org/wiki/File:En-us-Spanish.ogg) | pep2019-compulsory-1 / unit2 | No machine-readable author provided. Muke assumed (based on copyright claims). | 仅 assumed，描述仅指发音者 | Muke Tever 's pronunciation of “Spanish” in general American English. /ˈspænɪʃ/ |
| [vitamin](https://commons.wikimedia.org/wiki/File:En-us-vitamin.ogg) | pep2019-optional-2 / unit3 | Mx. Granger | 明确 Artist | American English pronunciation of " vitamin " by a male speaker. |
| [by](https://commons.wikimedia.org/wiki/File:En-us-by.ogg) | 未匹配高中词头 | Dvortygirl | 明确 Artist | Pronunciation of the word 'by'in US English |
| [Chinese](https://commons.wikimedia.org/wiki/File:En-us-Chinese.ogg) | 未匹配高中词头 | No machine-readable author provided. Muke assumed (based on copyright claims). | 仅 assumed，描述仅指发音者 | Muke Tever 's pronunciation of “Chinese” in general American English. /ʧaɪˈniz/ |
| [English](https://commons.wikimedia.org/wiki/File:En-us-English.ogg) | 未匹配高中词头 | No machine-readable author provided. Muke assumed (based on copyright claims). | 仅 assumed，描述仅指发音者 | Muke Tever 's pronunciation of “English” in general American English. /ˈɪŋɡlɪʃ/ |
| [eye](https://commons.wikimedia.org/wiki/File:En-us-eye.ogg) | 未匹配高中词头 | No machine-readable author provided. Muke assumed (based on copyright claims). | 仅 assumed，描述仅指发音者 | Muke Tever 's pronunciation of the English word “eye”. General American: /aɪ/ |
| [helpful](https://commons.wikimedia.org/wiki/File:En-us-helpful.ogg) | 未匹配高中词头 | Willy Skillets | 明确 Artist | Pronunciation of the word "helpful" in US English by Willy Skillets. |
| [kite](https://commons.wikimedia.org/wiki/File:En-us-kite.ogg) | 未匹配高中词头 | Mx. Granger | 明确 Artist | American English pronunciation of " kite " by a male speaker. |
| [surprise](https://commons.wikimedia.org/wiki/File:En-us-surprise.ogg) | 未匹配高中词头 | No machine-readable author provided. Muke assumed (based on copyright claims). | 仅 assumed，描述仅指发音者 | Pronunciation of the word surprise by Muke Tever |

结论：10 条原始 Artist 明确，5 条仅 assumed，其中 Spanish 属高中词条；均没有描述中明确 recorded by 的补充证据。明确 Artist 指 Commons 元数据作出作者标注，不等于独立验证录音者、授权声明或音质。

后续：优先核实 Spanish 及其他 4 条的原始文件页完整历史与授权依据，证据不足时考虑下线对应录音或换具明确来源的版本。此次只读，不变更已发布 manifest、sources、录音和用户数据；查询结果可能随 Commons 页面更新变化。
