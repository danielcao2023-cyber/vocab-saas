# 高中空音标短语核查（第十一组）

2026-10-29。由 catalog v135、seed stable key 和实际 lesson reader 空 IPA 清单选取；写入前确认当前 lesson 仍为空。仅使用词典或教材完整词组音标；未试听录音。

| 词头（seed ID） | 英式 | 美式 | 依据 |
| --- | --- | --- | --- |
| face down (3395) | /feɪs ˈdaʊn/ | 待核 | [Cambridge MORE! 8e wordlist · 完整短语音标](https://moreciip.cambridge.org/media/pdfs/coursebook_pdfs/additional/MORE_8e_LanguageBook_Lexique.pdf) |
| sleep in (3400) | /sliːp ɪn/ | /slip ˈɪn/ | [Collins Dictionary · 完整短语音标](https://www.collinsdictionary.com/us/dictionary/english/sleep-in) |
| give off (3667) | /ɡɪv ɒf/ | 待核 | [Laser B2 wordlist · 完整短语音标](https://exercises.hueber.de/media/36/Laser-B2-3rd-Wordlist_D.pdf) |
| take over (3790) | /teɪk ˈəʊvə/ | 待核 | [Burlington Mindset 1 wordlist · 完整短语音标](https://bbspainresources.s3.eu-central-1.amazonaws.com/Mindset1_AppendGal_24551_sz.pdf) |
| turn out (3805) | /tɜːn aʊt/ | 待核 | [Cambridge English365 wordlist · 完整短语音标](https://www.cambridge.org/elt/english365/resources/365-Level3-wordlist.pdf) |
| fall away (3807) | /fɔːl əˈweɪ/ | 待核 | [Easier English Student Dictionary · 完整短语音标](https://www.easypacelearning.com/pdf/easier_english_student_dictionary_upper-int.pdf) |
| set sail (3907) | /ˌset ˈseɪl/ | 待核 | [Macmillan Straightforward wordlist · 完整短语音标](https://api.macmillanenglish.com/fileadmin/user_upload/Czech_Republic/sl-Straightforward-2nd-Upper-intermediate.pdf) |

shave off (3523)、test out (3756)、bounce around (4022) 暂未查到可直接核对的可靠完整词头标音，保留待核。side with 已由并行代理认领，改查 set sail。sleep in 美式采用 Collins 原标 /slip ˈɪn/；给出未标重音的原资料不自行补写重音。

七份修改通过实际 validateLesson 和 createLessonReader，读取音标与写入值一致。`npx vitest run test/lessons.test.ts test/lesson-ipa-fallback-ui.test.ts`：2 文件、9 项通过。未试听录音，不声称录音与音标一致。
