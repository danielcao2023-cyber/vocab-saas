# 异读词听写与默认音标跟进

以 `mobile-public/offline/seed.db` 为只读基础，关联 `vocabulary_members` 中 `pep2019-` 书籍、`data/lessons` 及当前录音清单，不接触用户数据。抽查并非对所有异读词逐一听审。

- tear（必修三 Unit 2）：国家智慧教育平台索引的[教材 PDF](https://r3-ndr.ykt.cbern.com.cn/edu_product/esp/assets_document/bf54b36f-4c75-4c91-8b9c-53ce15e4f903.pkg/pdf.pdf)列名词“眼泪”，录音默认 noun /tɪr/、lesson 主音标 /tɪr/ 一致，另有撕裂读音入口。PDF 原站页面本次访问返回 403，结论同时依搜索索引和[教材副本](https://fliphtml5.com/cozhh/zmud/%E6%99%AE%E9%80%9A%E9%AB%98%E4%B8%AD%E6%95%99%E7%A7%91%E4%B9%A6%C2%B7%E8%8B%B1%E8%AF%AD%E5%BF%85%E4%BF%AE_%E7%AC%AC%E4%B8%89%E5%86%8C/)；未试听。
- discount（必修二 Unit 3）：lesson 主音标与词库首义为名词 /ˈdɪskaʊnt/、折扣；默认录音文件为动词。该[英文词典读音栏](https://en.wiktionary.org/wiki/discount#English)将 /dɪˈskaʊnt/ 的音频直接链接到当前使用的 [Vealhurl 动词录音](https://en.wiktionary.org/wiki/File:LL-Q1860_(eng)-Vealhurl-discount_(verb).wav)，故为这份录音增加对应 IPA，避免页面把名词音标配在动词录音旁；来源仍未人工试听。该词典对动词按义项区分读法，[剑桥](https://dictionary.cambridge.org/dictionary/english/discount)将 /dɪˈskaʊnt/用于“忽视”和“降价”，因此不应笼统声称动词只能有一种读法。教材也列出名词折扣和动词打折；现有名词录音缺失仍需后续处理。
- import：教材同时列名词和动词；默认动词和 lesson 动词 IPA 对应，catalog 列的音标则是名词读法。现有名词、动词录音可选；目前不能只凭首义要求更换默认。
- advocate、exploit：教材重点为动词；默认录音来源分别标动词，lesson 亦给动词音标。transport 教材有名词和动词，默认名词；moderate 教材列形容词和动词，默认形容词；abstract 教材列形容词和名词，默认名词录音与主音标的重音一致。音频未试听，不能推断不存在其他音质或音素问题。
- seed 当前高中 membership 中无 wind、lead、record、present；不能仅以它们在全库存在就称为高中词书中的缺陷。

听写在作答前不展示义项，系统按词头选择默认录音，因此这里关注默认音频与教材读音、学习页标注的一致性，不应误称题面明确指定某义项。相关回归覆盖录音 metadata 在线离线返回及词页优先显示；不是完整安卓打包升级或音质试听。
