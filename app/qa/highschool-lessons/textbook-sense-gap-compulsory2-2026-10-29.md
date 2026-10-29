# 必修二教材义项与例句缺口

2026-10-29。人教高中必修二原版词表印刷页 103（本地存图 `sources/compulsory-2/111.jpg`）列出以下义项；教材来源与版本说明见 [Unit 2 审计](compulsory2-unit2-wordlist-audit-2026-10-29.md)。通过正式 catalog 的 `pep2019-compulsory-2` 成员及 seed 的 `vocabulary_entry_map.entry_key` 校对 stable key 与 ID；仅修改各词 lesson，不更改词条身份或学习数据。

| stable key / ID | 原缺口与补充 | 词典依据 |
|---|---|---|
| living / 2008 | 已有活着的、生计；新增居住或日常生活用的地方。 | [Oxford](https://www.oxfordlearnersdictionaries.co.uk/us/definition/english/living_1) |
| reserve / 2016 | 已有保护区、预订；新增储备物资、储藏量。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/reserve) |
| plain / 2017 | 已有平原、简单朴素；新增直率、坦诚。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/plain_1) |
| beauty / 2021 | 已有美、美丽；新增美人或美好的事物，说明称人时语域。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/beauty) |
| engine / 2062 | 已有发动机；新增牵引列车的火车头。 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/engine) |
| network / 2070 | 已有名词网络；分别补及物“连接成网络”和不及物“建立工作关系”。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/network) |

所有新增义项各配原创中英例句两条和搭配两条。六份修改均调用实际 `validateLesson`，`createLessonReader` 返回 ready 且义项数量一致；`npx vitest run test/lessons.test.ts` 通过 1 文件、6 测试。此次不代表整册教材已逐义完整审核；原创例句未经过英语教师独立审校，未试听或处理录音。
