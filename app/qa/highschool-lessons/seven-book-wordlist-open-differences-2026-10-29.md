# 七册高中教材词表差异：现行状态复核

复核时 catalog version 134，逐项对照本目录 `*-wordlist-audit-2026-10-29.md` 中七册各单元记录，再查现行 catalog；各记录提供教材原页及来源。本清单只讨论这些审计已经发现的词头、归属和格式差异，不代表七册全部释义、发音、正文或其他潜在差异均已审完。

## 仍存的确证差异，按影响与迁移风险排序

1. **Log / log 词条重复并存在教材大小写差异。** 选择性必修四 Unit 3 教材 p.108 写 `log`；高中 catalog key `Log` / headword `Log`，Unit 3 position 198；另一 key `log` / headword `log` 关联四级、考研、托福、雅思和 GRE。两者均指日志、原木等相近词义，实际已为不同身份；改名若与数据库大小写不敏感索引冲突，或直接合并会伤及任一词条的用户进度。应先覆盖全设备、浏览器和 Android 的学习记录、已发题、卡片、事件、词书 membership 和 numeric/keyed 讲解的合并策略，再实施可回滚迁移。参见 `optional4-unit3-wordlist-audit-2026-10-29.md`。
2. **Chiwen 大小写与教材不同。** 必修二 Unit 1 p.102 教材写 `Chiwen`，catalog key/headword 为 `chiwen`，position 58，释义为传统建筑脊饰鸱吻。作为普通名称的小写是否比教材专名大写更合适尚需在正文语境中判断；大小写是确证差异，是否应改并非已经确证。若需统一，要保留 ID、学习记录、既有词头更名预期及发题兼容。参见 `compulsory2-unit1-wordlist-audit-2026-10-29.md`。
3. **the Naadam Festival 大小写与教材不同。** 必修三 Unit 1 p.103 教材为 `the Naadam Festival`，catalog key/headword 为 `the Naadam festival`，position 103；同一节日、单元一致。属显示差异，当前判分忽略大小写；如改显示仍须先核对 importer 的 headword 唯一性、key/讲解和升级路径，避免无必要迁移。参见 `compulsory3-unit1-2-wordlist-audit-2026-10-29.md`。
4. **from (then) on 的两个词条表示重叠。** 必修二 Unit 5 p.106 词表为 `from (then) on`；catalog key `from on` 的 headword 为该表达（position 381），另有 `from then on`（position 382）。其独立测试答案解析此前错误，目前该括号词头已在认词保护清单；这避免新发拼写/听写但并未统一重复学习记录和展示。应先设计跨设备状态与现有已发题兼容，再考虑合并，详见 `highschool-placeholder-question-audit-2026-10-29.md`。

## 待产品判断，不作为漏词或错归属

- 必修三 Unit 2 的教材 p.104 在完整名称 `Peking Union Medical College` 后括注 `PUMC`，该单元目前有全称无独立缩写；选择性必修四 Unit 1 在 `science fiction` 旁括注 `SF`，当前单元有全称与 `sci-fi`，未单列 `SF`。是否分别作为训练目标属产品选择，且缩写多义，不能默认漏词。
- 必修二 Unit 4 教材的 `defence (US defense)`；选择性必修二 Unit 2 的 `advisor (-ser)`；选择性必修二 Unit 3 的 `chilli`、`fibre` 美式拼法：当前单元未单列所有变体。训练系统能否接受变体需单独测试，词表不是漏单列词头。
- 必修一 Unit 5 的 `Danish`、`Denmark`；必修二 Unit 2 的 `day and night`、`Tibet`；选择性必修三 Unit 2 的 `Lao Zi`：当前属于相应 Unit，但该单元词表原页未单列；正文、源表扩展意图未核实，不能直接认定错归属或删除。
- 教材可替换骨架、词形拆分以及同一 Unit 内顺序不同，不自动视为错归属；词形题型影响以占位符审计和代码为准。

## 已核实不再列为未解决漏项

已有 `gas` 的必修一 Unit 4 归属及 `day and night` 的必修二 Unit 1 归属；`keep a balance` 显示已改正且 key 保留 `keep balance`；nanobot、Sami、Rapa River、take up a position、Alexander Fleming、Elon Musk、commit oneself to、Jean Anthelme Brillat-Savarin、St Andrews、Butchart Gardens、Jean-Philippe、vital sign、geothermal park 均已存在目标 Unit；必修三 Unit 4 的 module、telescope、disappointment 已补；Portsmouth Square、Sputnik 1、Voyager 1、Soyuz 11 已作为精确教材词条加入目标单元，原简称继续保留于非高中词书。此处只确认当前 catalog 状态，不替代升级、重复提交或离线行为测试。
