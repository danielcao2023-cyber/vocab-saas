# 高中空音标短语核查（第十四组）

2026-10-29。由 catalog v135、seed stable key 与真实 reader 空 IPA 清单选取，写入前确认 lesson 空值；只采用教材词表完整短语标音，未试听录音。

| 词头（seed ID） | 英式 | 来源 |
| --- | --- | --- |
| look forward to (1633) | /lʊk ˈfɔːwəd tə/ | [New English File Intermediate wordlist · 完整短语音标](https://englishservice.cz/download/New%20English%20File%20Intermediate%20Wordlist.pdf) |
| from then on (2230) | /frəm ðen ɒn/ | [Get to the Top Plus 5 companion · 完整短语音标](https://hu.elt-eu.com/sites/default/files/media/unprotected-files/Get_to_the_Top_Plus_5_companion.pdf) |
| the media (2297) | /ðə ˈmiːdiə/ | [National Geographic Learning wordlist · 完整短语音标](https://www.eltngl.com/sites/file/275959/download?token=tmLYqSzg) |
| ought to (2637) | /ɔːt tə/ | [ESL Lounge wordlist · 完整短语音标](https://www.esl-lounge.com/student/reference/b1-cefr-vocabulary-word-list-verbs-2.php) |
| a bunch of (3290) | /ə bʌntʃ əv/ | [Helbling Step by Step 2 wordlist · 完整短语音标](https://www.helbling.com/sites/default/files/media/documents/371140086_Step2SB.pdf) |
| take for granted (4004) | /teɪk fɔː(r) ɡrɑːntɪd/ | [Oxford Navigate B2 wordlist · 完整短语音标](https://www.littlepeacock.cz/dokumenty/vse/Navigate/navigate_b2_czech_wordlist.pdf) |

本批仅补有来源依据的英式读音，美式待核；look forward to 和 ought to 按来源弱读。keep your eyes open (2143)、to name but a few (2494)、straighten up (2938) 暂未查到可靠完整词头标音；as far as I am concerned (3197) 找到的教学材料音标实际缩读为 I’m，并非完整 I am 原词头，因此保留待核。not to mention、in hand、a handful of 属于其他代理范围，未改。

六份修改通过实际 validateLesson 和 createLessonReader，读取音标与写入值一致。`npx vitest run test/lessons.test.ts test/lesson-ipa-fallback-ui.test.ts`：2 文件、9 项通过。录音未试听，不能声称录音与音标匹配。
