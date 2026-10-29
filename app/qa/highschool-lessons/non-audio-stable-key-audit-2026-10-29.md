# 高中非录音资源按 stable key 盘点

执行 `cd app && npx tsx qa/highschool-lessons/scan-non-audio-stable-keys.ts`；报告 JSON 保存在 `non-audio-stable-key-coverage-2026-10-29.json`，包含逐项完整 stable key 清单。正式 catalog version 135 中取任一 `pep2019-` membership 的唯一 entry，使用 `mobile-public/offline/seed.db` 中 `vocabulary_entry_map.entry_key` 与本 seed 的词头和 ID，调用生产 `createLessonReader` 和前端 `getSoundSpellingLessons`；Log 按服务端显示投影处理。seed 的 catalog_version 是 135；统计不代表已安装 APK 或其他设备已经更新。

- 高中唯一词条 2730，映射缺失 0，reader pending 0。reader 的校验是身份、结构及 reviewed 状态，不能证明语言内容正确或教材所有义项完整。
- 讲解通用、英式和美式 IPA 均空的 468：纯字母词头 43、含空格 422、其他 3；其中大写开头 156 是专名或缩写候选，也混有句首大写词等，不能视作已确认专名。短语、专名和缩写要人工判断是否能提供可靠 IPA，不要用机械拼接。
- 前端音形资源查找无结果的 798：纯字母 480、含空格 309、其他 9；纯字母包含单音节、缩写和专名，不等同多音节缺失，短语也未判断是否有必要。需逐项核实读音、音节和教材适用性。
- 一个核心义项的 2002 项只是优先复审候选：不少词本来只有一个教材义项，因此不能当作缺陷。已有多义词也可能漏义，无法用这个数字衡量所有遗漏。
- 50 项命中现有字典占位保护，阻止不自然拼写题，具体能力覆盖及结构题仍需后续方案，详见既有 placeholder audit。

## 针对性修订

`artemisinin`（本 seed ID 2688，稳定键 artemisinin）原讲解音标三项空。柯林斯词典给出一种英式读音 /ˌɑːtɪˈmɪzɪnɪn/，已添加到英式字段及引用；美国音标和默认播放未推断，当前学习页头部数据是否显示该字段需另核对。词条实际 `validateLesson` 和 reader ready、lesson 测试 6/6 通过。音标读法存在变体，未试听录音。来源：https://www.collinsdictionary.com/dictionary/english/artemisinin 。

优先级：先确认课程常用多音节或有歧义的词，再核对专名/缩写和短语；以教材词表或词典逐义审查，而不是按单一义项数量批量造内容。词库可重放构建和已安装设备升级验收仍需另作，历史详情见 non-audio-current-priorities。
