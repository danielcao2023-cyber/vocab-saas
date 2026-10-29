# Commons 单批元数据复核（2026-10-30）

一次请求覆盖此前 23 词的 32 个 Wiktionary 英语音频文件名，HTTPS 200，无 Retry-After；没有自动重试或下载音频。原始 API 返回 `commons-batch-raw-2026-10-30.json`，逐候选经既有 resolver 和本次批次 metadata 的结果见 `commons-batch-results-2026-10-30.json`。32 页中现有解析器产生 20 个可用 metadata 记录，14 文件在 resolver 中 resolved；resolved 仅是自动筛选结果，不等于词性、声音、作者或授权已经独立确认。

**优先候选 1 个：module** — [Wiktionary 英语栏](https://en.wiktionary.org/wiki/module#English) 关联 [Commons 单词文件](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Vealhurl-module.wav)，metadata 标注 Speaker/Recorder Vealhurl、CC BY-SA 4.0，文件名含英语词头 module，自动 resolver resolved。口音为 unknown；尚未下载、解码或试听，不能确认实际录音内容和音质。接入前还需核转码文件、人工听审、保留许可与署名、再执行离线映射测试。

以下暂不作为明确可接入候选：

- Arabic：自动 resolver 显示作者 Muke Tever，但**原始 Artist 字段明确写明无机器可读作者，仅为推测**；不能把解析器抽出的名字当已核作者。需另找独立作者证据。
- analyses、patent、orient：名词/动词或读音变体需先确定教材词性及实际音频；orient 的 Artist 原始字段为 “I learned some phrases.”，更不能直接当作者身份。
- draft：两个文件词形为 draught，词义和发音对应性需要额外证据，不能凭 resolver 的 resolved 自动视作完全匹配。
- WWW：三项资源自动 resolved，但属于缩写，需听审完整逐字母读法并选择恰当版本；Sami 两项是专名，需辨认教材对象和读音。
- 其余 18 个未 resolved 文件中，含缺完整词组、未知作者或许可、无法解析等不同原因；这些状态都不是该词没有录音的证明。尤其 corporate 和 knit 原始作者为 assumed，不可直接导入。

同目录 `local-review-2026-10-30.md` 按 23 个词提供上下文分类；先前 Wiktionary 查询失败的 20 个词不在此次批次，仍待服务允许后另行查询。本批未写 manifest、sources 或用户数据。
