# 高中短语音标批量来源比对

按当前高中 stable key 空 IPA 清单，与 Oxford《New English File Intermediate》、Cornelsen/VERITAS《English in Context 5》《Business in Context 1》《Business in Context 3》以及 Pearson Focus 4、Burlington Learning Skills 已核实词表进行只读文本比对，再逐项确认目标词头和整组音标。匹配候选不是自动通过；如 `up to` 只在 `up to date` 等更长表达中出现，不能截取或机械拼接为独立短语。

`at last`（稳定键同词头、讲解 1618）在出版方《English in Context 5》PDF 第 5 页直接列为 `[ət ˈlɑːst]`，现保持音素与重音、用斜线写为 `/ət ˈlɑːst/`。来源：https://www.scook.at/cdn_proxy/7cda8b21-2a47-4e24-a477-d330c8fd04d7/234215_0470590101_47058_EIC_5_Alphabetical_word_list.pdf 。本地可直接访问 PDF，网页索引工具本次取该文件超时；语境重音和口音可能有变化。

专属测试先红后绿；真实 validator/reader、IPA 页面回退和通用讲解共 3 文件 10 项通过，索引一致性检查通过。未处理录音、未重建离线资源。
