# 校验词形的来源

`irregular-forms.ts` 是人工整理的常用不规则动词表，核对日期为 2026-10-17，依据 Cambridge English Grammar Today 的 [Table of irregular verbs](https://dictionary.cambridge.org/us/grammar/british-grammar/table-of-irregular-verbs)。此表不是 ECDICT 导出，也不声称覆盖全部英语词形。

它只帮助内容校验器识别 `became`、`built`、`paid` 等真实变形，避免误拒正确例句。词表不会写入数据库，不改变生成输入的 hash，也不会让已生成内容失效。规则变形仍由现有校验器处理；课标词头明确注明的复数和拼写变体由 `curriculumForms` 处理。这个表不为近义词或其他派生词提供豁免，例如 `affect` 不能作为 `effect` 的词形。

数据库正式导入 ECDICT 后仍保留其原始来源；本表只是缺少该数据时的有限校验补充。
