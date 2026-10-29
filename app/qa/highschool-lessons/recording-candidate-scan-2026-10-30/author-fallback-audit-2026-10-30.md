# Commons 作者回退复核（2026-10-30）

原始 API 对 Arabic 的 Artist 标为 assumed，描述仅称 Muke Tever 的发音，不足以证明录音制作者或授权人；原解析会将发音者写入 author。修正后只有明确 recorded by 的描述可作为缺失 Artist 时的回退。真实原文快照见 test/fixtures/commons-arabic-assumed.json。

扫描 data/pronunciation/sources.json 3711 条，描述匹配撇号所有格 pronunciation 或 pronunciation of ... by 且无 recorded by 的共有 15 条，均有同源 manifest 项。下面是宽松筛查候选，并非 15 个已确认缺陷：缓存不保存原 Artist HTML，无法判定其作者是从原 Artist 还是旧描述回退得出。by 为明显误报；男性说话者等也不构成作者声明。此扫描不代表其他类型的潜在缺陷已排除。

| 词 | 文件 | 缓存 author | 描述 |
| --- | --- | --- | --- |
| by | File:En-us-by.ogg | Dvortygirl | Pronunciation of the word 'by'in US English |
| helpful | File:En-us-helpful.ogg | Willy Skillets | Pronunciation of the word "helpful" in US English by Willy Skillets. |
| jog | File:En-us-jog.ogg | Mx. Granger | American English pronunciation of "jog" by a male speaker. |
| kite | File:En-us-kite.ogg | Mx. Granger | American English pronunciation of "kite" by a male speaker. |
| Chinese | File:En-us-Chinese.ogg | Muke Tever | Muke Tever's pronunciation of “Chinese” in general American English. /ʧaɪˈniz/ |
| English | File:En-us-English.ogg | Muke Tever | Muke Tever's pronunciation of “English” in general American English. /ˈɪŋɡlɪʃ/ |
| eye | File:En-us-eye.ogg | Muke Tever | Muke Tever's pronunciation of the English word “eye”. General American: /aɪ/ |
| surprise | File:En-us-surprise.ogg | Muke Tever | Pronunciation of the word surprise by Muke Tever |
| ballet | File:En-us-ballet.flac | 0x0077BE | Pronunciation of the word "ballet" by a native speaker of American English. |
| Spanish | File:En-us-Spanish.ogg | Muke Tever | Muke Tever's pronunciation of “Spanish” in general American English. /ˈspænɪʃ/ |
| Halloween | File:En-us-Halloween.ogg | Mx. Granger | American English pronunciation of "Halloween" by a male speaker. |
| accessory | File:En-us-accessory.ogg | SneverdleSnavis | SneverdleSnavis's pronunciation of “accessory” in English. General American: /əkˈsɛsəɹi/ |
| blossom | File:En-us-blossom.ogg | Mx. Granger | American English pronunciation of "blossom" by a male speaker. |
| vitamin | File:En-us-vitamin.ogg | Mx. Granger | American English pronunciation of "vitamin" by a male speaker. |
| buffet | File:En-us-buffet.ogg | 0x0077BE | Pronunciation of the word "buffet" by a male native speaker of American English. |

未变更 sources、manifest、音频和用户数据；这些已发布项需要逐条核对原始 Commons metadata、版权和作者后再决定处理。当前修复仅约束新解析；loadCommonsMetadata 仍会加载旧的规范化缓存，不可将本次修改视为已清理历史条目。Arabic 不在此 15 个已发布条目中。
