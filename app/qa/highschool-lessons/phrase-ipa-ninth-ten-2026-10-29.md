# 高中空音标短语核查（第九组）

2026-10-29。由 catalog v135、seed stable key 与实际 lesson reader 空音标清单选取；按实际条目复查再写入。仅使用教材词表或词典对完整词头的直接标音；未试听录音。

| 词头（seed ID） | 英式 | 美式 | 来源 |
| --- | --- | --- | --- |
| in despair (2423) | /ɪn dɪˈspeə/ | 待核 | [English grade 10 glossary · 完整短语音标](https://www.trims.edu.az/noduploads/book/quot-english-quot-ingilis-dili-asas-xarici-dil-fanni-uzra-10-cu-sinif-ucun-darslik-1539604664-369.pdf) |
| as a matter of fact (2627) | /əz ə ˌmætər əv ˈfækt/ | 待核 | [Oxford Learner’s Pocket Word Skills wordlist · 完整短语音标](https://formanglais.com/wp-content/uploads/2020/03/pocket-guide-Word-Skills.pdf) |
| in turn (3035) | /ɪn ˈtɜːn/ | 待核 | [Focus on Modern Business wordlist · 完整短语音标](https://www.scook.at/cdn_proxy/060cebfd-319d-4c02-a23d-7b2604a53bf1/0413860101_33320_1A_ZM_Wordlist_Unit02.pdf) |
| in charge of (3104) | /ɪn ˈtʃɑːdʒ əv/ | 待核 | [Navigate B1 wordlist · 完整短语音标](https://sfl.karabuk.edu.tr/yuklenen/dosyalar/126917202125341.pdf) |
| cost an arm and a leg (3174) | /kɒst ən ɑːm ənd ə ˈleɡ/ | 待核 | [Burlington Skills glossary · 完整短语音标](https://bbspainresources.s3.eu-central-1.amazonaws.com/Skills2_AppendBas.pdf) |
| in summary (3198) | /ɪn ˈsʌməri/ | 待核 | [Cambridge English Vocabulary in Use index · 完整短语音标](https://assets.cambridge.org/97813166/31744/index/9781316631744_index.pdf) |
| generally speaking (3199) | /ˌdʒen(ə)rəli ˈspiːkɪŋ/ | 待核 | [The many faces of Britain wordlist · 完整短语音标](https://c.wgr.de/buchlinks/978-3-425-73644-0/WES-73644-072_Word_list_Theme_5_Part_C.pdf) |
| prior to (3206) | /ˈpraɪə tə/ | 待核 | [Business in Context wordlist · 完整短语音标](https://www.scook.at/cdn_proxy/8e31087a-04df-4a3c-89b8-bf45619447a4/0451750101_0451510101_WL_Lernwortschatz_gesamt.pdf) |
| regardless of (3251) | /rɪˈɡɑːdləs əv/ | /rɪˈɡɑːrdləs əv/ | [Oxford Learner’s Dictionaries · 完整短语音标](https://www.oxfordlearnersdictionaries.com/definition/english/regardless-of) |
| in particular (3419) | /ɪn pəˈtɪkjʊlə/ | 待核 | [Cambridge English Vocabulary in Use index · 完整短语音标](https://assets.cambridge.org/97813166/31744/index/9781316631744_index.pdf) |

一般教材词表未标美式，故保留美式空值；generally speaking 中 (ə) 表示来源标注的可选音。prior to、in charge of 的词尾是所引用来源的弱读。in despair 来源为高校可访问的高中教材词汇表，语境与本词条含义对应。此前认领的 on duty、in return、by accident、in tears 已由其他批次处理，未写入。

十份修改均通过实际 validateLesson 和 createLessonReader，读取音标与写入一致。`npx vitest run test/lessons.test.ts test/lesson-ipa-fallback-ui.test.ts`：2 文件、9 项通过。未试听录音，不能确认录音与音标一致。
