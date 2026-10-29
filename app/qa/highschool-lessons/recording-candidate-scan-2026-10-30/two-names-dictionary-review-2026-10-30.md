# Picasso / Rembrandt：词典与具体录音关联核查（2026-10-30）

应用 catalog 将 Picasso 释为毕加索（西班牙艺术家），Rembrandt 释为荷兰画家，均为选必三 Unit 1；此处为现有数据，不声称已逐字核对教材。

- [英语 Wiktionary Picasso](https://en.wiktionary.org/wiki/Picasso#English) 将其列为姓氏，并展示 Pablo Picasso；英语 IPA 列 RP /pɪˈkæsəʊ/、General American /pɪˈkɑːsoʊ/ 及 /-ˈkæ-/ 变体。[剑桥读音](https://dictionary.cambridge.org/pronunciation/english/picasso) 给英 /pɪˈkæsəʊ/、美 /pɪˈkɑːsoʊ/。
- [英语 Wiktionary Rembrandt](https://en.wiktionary.org/wiki/Rembrandt#English) 指向荷兰画家 Rembrandt van Rijn；另有郁金香词义。[Collins](https://www.collinsdictionary.com/dictionary/english/rembrandt) 对画家列英 /ˈrɛmbrænt/，美 /ˈrɛmˌbrænt/ 或 /ˈrɛmˌbrɑnt/。

此前 Wiktionary API 扫描 `wiktionary-batches.jsonl` 对两词的英语栏均记录 no_audio_found；本次只读网页文本也未核实到其直接关联 Simplificationalizer 两份录音。Wiktionary 页面存在艺术家释义和词典读法，不等于 Commons 录音是词典音频或证明其实际读法及特定指代。已核实的 Commons 结构化数据仅提供英语词形，不能识别说话时是否指艺术家。两份候选均尚未下载或试听，不能根据读音预设口音、指代或适用义项。

Collins 给 Rembrandt van Rijn 年份 1606–1669，而当前 catalog 写 1609–1669；这是可疑数据差异，需对照权威传记及教材后走兼容修订流程，本次没有改 catalog。没有请求 Commons 或修改 manifest、录音、用户数据。

## Rembrandt 出生年修复

荷兰 [Rijksmuseum](https://www.rijksmuseum.nl/en/stories/10-things/story/10-things-about-life-rembrandt) 和伦敦 [National Gallery](https://www.nationalgallery.org.uk/artists/rembrandt) 明确这位画家生于 1606 年、卒于 1669 年，足以确认原 catalog 的 1609 错误。实际 lesson `data/lessons/3485.json` 为同一荷兰画家，没有出生年份，故无需更改；原释义来自当前 catalog，不声称已核教材原文。

catalog version 从 137 升至 138，仅对稳定 key `Rembrandt` 的意义做精确旧值校正（1609 → 1606），`meaningCorrection.expected` 限定旧导入文本，保留原 unit/position、词头和已有学习记录。针对测试覆盖新安装、精确旧释义升级、非标准和手动释义保护、离线升级备份及已发题目快照；真实既有用户数据库未改。详情见 `test/highschool-rembrandt-correction.test.ts`。本次没有重建已安装 APK。
