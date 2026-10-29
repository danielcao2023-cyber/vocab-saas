# 高中词库范围与通式讲解核查（2026-10-29）

## 本机现状复算

命令：`npx tsx qa/highschool-lessons/scan-non-audio-stable-keys.ts`。该脚本只读 catalog v135、本机离线 seed v135、正式 lesson reader 与音形 lookup；七册（必修 1–3、选必 1–4）含 36 个目录单元，其中必修一含 welcome 单元。各单元均有 membership；跨单元归属数分别为 386、407、470、382、385、357、348（这些不是去重词数）。2730 个唯一高中 catalog 条目中，seed stable key 缺映射 0，实际 reader pending 0。

当次扫描 257 条全部 IPA 字段空、760 条无音形 lookup、1921 条仅一个主义项、50 条判定为受保护的占位词头；这些均为筛查候选，不等同错误、缺少多音节词或已正确出题。结构合格不证明义项、教材覆盖、内容质量、口音和用户实际安装包正确。此统计仅覆盖本机 seed 与当前源码，不代表其他设备；七册旧逐词审计有后续修复，不能把原差异原样认作现存缺陷。未重新逐词比对全部教材原页，也未逐条检验 V2/V3 交互及不同范围计划。

## 可证实的讲解缺口与修复

原选必一 Unit 2 教材（见 `optional1-unit-boundaries-2026-10-29.md` 原教材路径、哈希）列 `in this sense (in … sense)`；词库 ID 2804 stable key `in this sense` 的讲解只给 this/that 两例，没有说明教材通式中可由其他词限定角度。原审计 `optional1-unit2-wordlist-audit-2026-10-29.md` 已提示该表示差异。现补充 `in a broader sense` 的搭配、原创例句和语境说明，明确不同限定词不能任意互换；[Cambridge sense 搭配](https://dictionary.cambridge.org/us/collocation/english/sense) 给出 `in the broad sense` 等作为用法依据。该例句本身未经母语者审校。保持原词头、答案规则、ID、归属及学习记录。

定向测试真实读取 `createLessonReader`、调用 `validateLesson` 并检查通式及例句；通过。`npx tsc --noEmit` 通过。未处理录音。
