# 高中词库释义异常候选（2026-10-30）

运行 `cd app && python3 qa/highschool-lessons/scan-catalog-meaning-artifacts.py`，检查 catalog v135 中有 `pep2019-` 成员关系的 2730 个 stable key；扫描替换符、对象残留、括号不平衡、词尾省略号及少量英文字典残留模板，结果见同名 JSON。规则是候选生成，不覆盖所有乱码或语义截断，也不识别语义错误。扫描时 `bagpipes` 已通过现有 meaningCorrection 修为“风笛”。

逐项判断：

- `chart`：`跟踪（进展或发展` 左括号未闭合，属于明确的未闭合格式；无法仅据此断定其他内容被截断；建议保守补成 `跟踪（进展或发展）`。剑桥词典 [progress 的例句](https://dictionary.cambridge.org/dictionary/english/progress) 有 chart progress 的用法；这里只修标点，不新增未查证的义项。修改必须协同 catalog 版本升级和老用户词义更新机制，本轮暂未写共享 catalog。
- `cabbage`：`（俚)` 中英文括号混用，并非释义截断；建议将 `)` 替换为 `）`，不更改词义。[剑桥](https://dictionary.cambridge.org/dictionary/english/cabbage) 可核蔬菜基本义，但未核其他俚语。
- `prefer ... to ...`、`be responsible for`、`focus on`、`fee`、`in memory of`、`behave`：末尾省略号是中文搭配宾语/短语占位，并非仅凭扫描可认定截断，保留原样；这些词义未逐条权威核验。

源数据目前尚未修改，真实发布版本、升级迁移及运行时覆盖需要由版本升级负责人统一处理。未处理录音。

离线 seed：chart（2722）当前为词库导入原文，汉译英、详情或结果可能显示该释义；认词选择使用首行，未闭合括号位于第二行。cabbage（207）已绑定初中词源 kb2022，其 seed 释义为“n. 卷心菜”，当前不使用 catalog 的长释义。源更正只作用于词库来源、受控来源标记、无 flag 且旧值完全匹配的记录；已有学习记录不改，但未完成题快照的特殊修正当前只覆盖 bagpipes。具体升级后表现还需在旧库与已发题场景测试，不能仅据源码宣称安全。

## v137 标点修订与升级测试

catalog v137 对 chart 精确原值仅加末尾 `）`，cabbage 仅将 `（俚)` 改成 `（俚）`；两者均以 v136 完整原值设 `meaningCorrection.expected`，没有改词义。词典 [Cambridge progress](https://dictionary.cambridge.org/dictionary/english/progress) 的 chart progress 例句支持保留“跟踪进展”的语义；cabbage 的修订仅排版，不表示其俚语逐项已核。新版本使用现有精确匹配、来源及 flag 保护，不覆盖人工释义或 kb2022 初中词条。

认词题选项快照仅存释义第一行：chart 的修订在第二行，不改变其选择项；cabbage 的括号在第一行，若有历史词库来源的进行中选项，继续保留旧选项以免变更已展示题面，仅标点不同，不改变正确选项或学习证据。完成后的重复提交沿用已存结果。新增 `test/highschool-catalog-bracket-correction.test.ts` 覆盖新装、v136 升级及备份、kb2022 和人工编辑保护、进行中认词题、已存干扰项与答案重试；和既有 bagpipes 升级测试共 2 文件 9 项通过，typecheck 通过。尚未重建离线 seed/打包，需由集成方继续处理。
