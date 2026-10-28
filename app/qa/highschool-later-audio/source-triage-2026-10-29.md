# 高中缺录来源核查：Common Voice 单词片段

Mozilla Data Collective 的 [Common Voice 7.0 Single Word Target Segment](https://mozilladatacollective.com/datasets/cmkzhp64p00wlno07elrmt20y) 标注 CC0-1.0，但其说明写明内容为 34 种语言中的数字 0–9、yes 和 no，并非通用单词或词组发音库。数据包约 3.51 GB；本次未下载，也未把它当作高中缺录的来源。

英语完整语音数据以句子为主，不等同于与词头完整对应的独立录音。其使用条件、词语边界、语音质量和授权范围需要针对具体文件确认，不能只靠数据集名称或许可证标签批量导入。

本轮同时以 Commons 的标准 `En-us-词头.ogg` 和 `En-uk-词头.ogg` 查询 34 个无 Wiktionary 音频候选的非歧义单词；只有 mustache 返回可核验的精确文件并已接入。查询未返回结果不证明其他来源不存在。
