# 高中非录音内容：当前缺口与优先顺序

检查时正式 catalog version 135；`mobile-public/offline/seed.db` 中 vocabulary_meta 亦为 version 135，按高中 `pep2019-` membership 去重得到 2730 个实际词条。逐项用 `createLessonReader` 验证其词头、实际本地 ID 和 reviewed 内容；`Log` 依当前身份映射传入 highschool-log 专用 keyed 路径。本报告为只读审计，未修改用户数据或录音。

1. **明确基础讲解缺口：module。** 2730 项中 2729 项通过实际 reader 的可读与结构校验，1 项 pending：`module`（该 seed 中 ID 5775），现归必修三 Unit 4，教材印刷 p.106 为“舱；组件；模块”。它原属于考试词书，不能把本 seed 的数字 ID 假设为其他设备 ID；宜采用 keyed lesson 并验证本地设备 ID、网站和离线包。结构可读计数不等于每项内容都经过语言学或教材义项的完整人工复核。
2. **高中教材词表历史核对中已发现漏项和位置均已处理。** 七册单元级审计及追踪见 `seven-book-wordlist-open-differences-2026-10-29.md`；目前已核实 `module`/`telescope` 有必修三 Unit 4 membership，`disappointment` 和此前补入项存在；Portsmouth Square 等完整教材词头存在各自归属，原简称身份保留。不能把单元词表未列出的扩展项机械删除，也不能把该结论扩展为课文出现的每个词都已逐词核对。
3. **词库不能从历史脚本无损重建。** `data/vocabulary/SOURCES.md` 明确说明旧生成器/旧 corrections 不含全部后续勘误；`scripts/build-vocabulary-catalog.py` 已禁止覆盖正式目录并仅允许输出到新临时目录。保护只阻止误覆盖，尚未提供完整可重放修订输入与证据。应建立按 stable key、source、冲突检查和版本组织的修订清单，在隔离目录重建并逐条 diff 当前 catalog，完整一致后再称可复现；约 206 项是旧快照估计，不是本次重算。
4. **受保护骨架可安全认词，但能力覆盖不足。** 当前 50 个高中词头命中 `hasDictionaryPlaceholder`，其中 46 项是字典占位词或骨架，另 4 项是包含数字的专名 `Portsmouth Square`、`Sputnik 1`、`Voyager 1`、`Soyuz 11` 的特殊保护。保护防止不自然拼写和听写，不能说明拼写/听力已得到训练；相同构词骨架的语境题设计、具体答案与历史兼容是后续产品工作。不应据此声称这些条目已全能力覆盖。
5. **命名和身份边界。** `chiwen` 使用小写有 Getty 建筑词汇表依据，教材写 Chiwen，保留并注明差异；教材的 Naadam Festival 大小写已按前次方案修正。高中 `Log` 和其他词书 `log` 仍是两套实体，当前已基于 entry key 做显示投影，不能擅自合并学习记录；仍应完成端到端浏览器/移动构建验收。`from (then) on` 与 `from then on` 保留两个身份，前者只认词，未来如果去重必须先明确跨设备历史与旧题策略。

可复查：高中词头与各 Unit 原始页码见相应 `*-wordlist-audit-2026-10-29.md`；保护词清单和后续设计见 `highschool-placeholder-question-audit-2026-10-29.md`；现存名字对照与已修事项见 `seven-book-wordlist-open-differences-2026-10-29.md`。当前任务未审计录音和版权。

## 同日后续

`module` 已补 keyed 基础讲解，教材义项、音标及可数用法参考 https://dictionary.cambridge.org/dictionary/learner-english/module 和必修三词表。跨 ID 服务端与离线打包读取的定向测试 2 项、typecheck 通过。用原 v135 seed 和当前源码再次调用 lesson reader，高中 2730 项 pending 为零；现有 mobile-public 是旧包，需重建后核验新讲解已经包含，且覆盖仅证明资源结构/身份可读，不代表全文专家审定。
