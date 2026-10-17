# 词表文件
- `sample.csv`：**示例数据**（42 个工程自拟常用词，level=示例），只用于开发和测试，不是课标词表。
- 正式词表应为 `kb2022.csv`（从教育部 2022 版英语课标 PDF 附录整理），格式：
  ```
  headword,level
  "a (an)",二级
  ability,三级
  ```
  level 按课标原文标注（二级 / 三级）。导入：`npm run import -- --list data/wordlists/kb2022.csv --source kb2022`
