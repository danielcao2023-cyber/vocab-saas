# 词表文件与导入

- `sample.csv`：42 个工程自拟示例词（level=示例），只用于开发和测试。
- 正式课标输入为只读 TSV：`../data/curriculum/ocr/level3_list.tsv`（1600 词），其中 `level2_star=1` 为二级 505 词，`=0` 为三级新增核心 1095 词。`../data/curriculum/ocr/level2_list.tsv` 用于核对二级集合。
- 人工释义为内容制作维护的 `../v2/manual_meanings.tsv`（`entry`、`manual_meaning`）。仅在显式传入 `--manual` 时读取；字面 `\n` 会转为卡片上的换行。人工来源的释义全部展开。

所有命令在 `app/` 下运行：

```bash
npm run import -- --curriculum ../data/curriculum/ocr/level3_list.tsv \
  --level2 ../data/curriculum/ocr/level2_list.tsv \
  --manual ../v2/manual_meanings.tsv --source kb2022 \
  --ecdict data/raw/ecdict.csv --db data/vocab.db --clear-sample --dry-run
```

选项：

| 选项 | 含义 |
| --- | --- |
| `--curriculum <tsv>` | 新课标入口；必需列为 `entry`、`level2_star`；重复词头或无效星标报错 |
| `--level2 <tsv>` | 可选；其 entry 集合须与主表 star=1 集合完全一致 |
| `--manual <tsv>` | 可选；人工释义覆盖；未知 entry、重复 entry、空释义汇总报错 |
| `--source <name>` | 必填；词表来源标识，例如 `kb2022` |
| `--ecdict <csv>` | 默认 `data/raw/ecdict.csv`；精确匹配优先，其次忽略大小写 |
| `--db <path>` | 默认 `DB_PATH` 或 `data/vocab.db` |
| `--clear-sample` | 同一事务删除 `is_sample=1` 的词及关联复习、卡片、错词、内容、反馈和缓存，输出各表删除数 |
| `--dry-run` | 在已有库的只读序列化内存副本上完整执行；库不存在则用空内存库，绝不创建目标文件 |
| `--list <csv>` | 保留的旧入口，不能与 `--curriculum` 同用 |
| `--sample` | 仅用于旧 CSV，标记示例词 |

输入校验完成后才打开数据库。课标清理、upsert 和计数核对在同一事务完成，默认严格核对 1600 / 二级 505 / 三级 1095；不一致即回滚并以退出码 1 退出。人工释义校验失败同样退出 1，数据库不会被打开或迁移。

按 `(source, headword)` 幂等更新所有导入内容列，保留 word id 和正式词的 cards、review_logs、wrong_words。引号 `’`、`‘`、`ʼ` 规范为 `'` 后按原文区分大小写，因此 `Miss` 与 `miss` 均保留。显示词头保留括号；原始 OCR entry 另存 `entry_raw`；实际词典命中词头存 `ecdict_key`。旧来源中不在当前表内的行只报告为 `staleRows`，不删除；它们若导致计数不一致，整个导入回滚。

JSON 输出包含 inserted / updated / unchanged、总数和二三级数量、人工覆盖数、待审核词表、缺音标词表、未命中词表、大小写回退词表、示例清理计数、旧行和 dryRun 标志。未命中 ECDICT 会报告，但不单独视为错误。

新词优先核心组（priority=2），每 `settings.level2_every` 个课标认词卡穿插一个二级词（priority=1，默认 5，设为 0 则先学完核心词）。组内按 ECDICT frq 排序，frq=0 时退回 bnc，两者为 0 排最后；两组耗尽后再出其他来源的 priority=0 词。

旧 CSV 格式与用法保持可用：

```csv
headword,level
"a (an)",二级
ability,三级
```

```bash
npm run import -- --list data/wordlists/sample.csv --source sample --sample
```
