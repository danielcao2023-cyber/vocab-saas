# 高中空音标短语核查（第十组）

2026-10-29。由 catalog v135、seed stable key 和实际 lesson reader 空音标清单选取，写入前逐条确认对应 lesson 仍为空。只依据教材词表的完整词组标音；未试听录音。

| 词头（seed ID） | 英式音标 | 依据 |
| --- | --- | --- |
| except for (2320) | /ɪkˈsept fə/ | [Careers in Context 1 wordlist · 完整短语音标](https://www.scook.at/cdn_proxy/f14fee0d-07f6-4861-b329-ddbd848d633f/247133_0483040101_0483040101_WL_Word_list_alphabetical.pdf) |
| early on (2789) | /ˈɜːli ɒn/ | [Business English Magazine vocabulary list · 完整短语音标](https://www.business-english.com.pl/dodatki/BEM%2075%20lista%20slow.pdf) |
| at work (2967) | /ˌæt ˈwɜːk/ | [English NEXT A1 wordlist · 完整短语音标](https://www.hueber.de/media/36/A1_wortliste_A-M_nxt.pdf) |
| deep down (3006) | /diːp ˈdaʊn/ | [In Company wordlist · 完整短语音标](https://www.hueber.de/media/36/IC_Up_Int_Unit_11_to_15_wordlist_finalV.pdf) |
| for instance (3042) | /fər ˈɪnstəns/ | [Cambridge English First Masterclass wordlist · 完整短语音标](https://kbzsg.ch/wp-content/uploads/2023/03/Masterclass-Vocabulary_2020_STUDENTS.pdf) |
| once and for all (3056) | /wʌns ən fə ɔːl/ | [Choices upper intermediate wordlist · 完整短语音标](https://www.venturesbooks.cz/ke-stazeni/category/146-choices?download=1511%3Aslovnicek-choices-upper-intermediate-pdf) |
| above all (3120) | /əbʌv ˈɔːl/ | [Careers in Context 1 wordlist · 完整短语音标](https://www.scook.at/cdn_proxy/f14fee0d-07f6-4861-b329-ddbd848d633f/247133_0483040101_0483040101_WL_Word_list_alphabetical.pdf) |
| speak up (3145) | /spiːk ˈʌp/ | [Navigate B1+ wordlist · 完整短语音标](https://www.littlepeacock.cz/dokumenty/vse/Navigate/navigate_b1plus_czech_wordlist.pdf) |
| feel at home (3146) | /fiːl ət həʊm/ | [Expert First wordlist · 完整短语音标](https://nyelvkonyvbolt.hu/uploads/files/Wordlist%20PDF%20version.pdf) |
| on behalf of (3589) | /ɒn bɪˈhɑːf əv/ | [Klett Verlag vocabulary list · 完整短语音标](https://www2.klett.de/sixcms/media.php/229/808201_0007_Vokabellernliste_Beschwerde_reagieren.pdf) |

上述词表仅提供或适用于英式标音，故美式均待进一步核实。except for、once and for all、feel at home 中保留词表所列弱读；once and for all 原文不标重音，未自行添加。for instance 在词表中使用词间连读 r。by contrast、by comparison 和 in this sense 与并行批次重合，未修改。

十份修改通过实际 validateLesson 和 createLessonReader，读取值与写入一致。`npx vitest run test/lessons.test.ts test/lesson-ipa-fallback-ui.test.ts`：2 文件、9 项通过。未试听录音，不声称录音与音标一致。
