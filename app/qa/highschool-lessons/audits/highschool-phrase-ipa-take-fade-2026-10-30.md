# 高中短语音标核查：take notes、fade away

- `take notes`：完整词头英式 /teɪk nəʊts/，见 [English Vocabulary in Use 词汇索引](https://news.ncac.mn/uploads/bookSubject/2022-03/6242544709b8b.pdf)；原音标三字段为空，已写主音标、英式音标和原形音标。
- `fade away`：完整词头英式 /feɪd əˈweɪ/，见 [Express Publishing WISH B2 词汇表](https://storage1.expresspublishingapps.co.uk/teachercorner/glossaries/WISH_B2_2_MINI_REV.pdf)，词条 2.2.61；已写主音标、英式音标和原形音标。

来源均直接列完整词组，非按单词机械拼接。自然语流有变体；未推测美音或试听录音。测试 `test/highschool-phrase-ipa-take-fade.test.ts` 用真实 reader 和 validateLesson。

静态盘点方法：读取当前 catalog 中至少一个 `pep2019-` membership 且 headword 含空格的 498 个 key，按 headword 小写匹配 data/lessons 数字及 keyed JSON，唯一匹配 496 项；按 pronunciation 的 ipa、uk、us 是否为空计数。修订后仅主 ipa 为空 304，其中三字段均空 213；另外两项 `keep a balance`、`the Naadam Festival` 有多个文件匹配，必须走真实 reader/稳定 key 再核，未纳入计数。此数据包含人地名、语法占位模板与已有独立音形资源，不能理解成 213 个普通短语全部缺发音，也不能代表用户不同设备真实读取结果；其他头部无空格但包含斜线等表达不在范围。本次未查全部词头、音频或教师验收。
