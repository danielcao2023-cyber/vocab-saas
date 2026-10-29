# 高中及考试词库历史基线与当前目录：重建差异核查

现有 `scripts/build-vocabulary-catalog.py` 根据七份 XLSX、六份考试词表、Unit 边界以及旧 `corrections.json` 生成历史基线；脚本拒绝向正式词库目录写入，拒绝覆盖已有 `catalog.json` 或 `sources.json`，并不修改学习数据库。现行 `data/vocabulary/SOURCES.md` 明确该旧脚本缺少后续已审核的新增、勘误和归属调整，不能无损重建当前目录；禁止将旧基线替换正式目录。

本次在独立新临时目录 `/tmp/vocab-audit.N4kBzM` 运行历史生成器，输出 catalog SHA-256 `394e352e060a9201512379a68bad47d4cf3eed1cdc360119f8a5ec014245f92c`，当前 version 135 catalog SHA-256 `07bde0a283cd9811a217f2e2d0eadeea48b9bb637b9f8684d1522c9448bae602`。七份 XLSX 和六份考试原始输入的 SHA-256 与仓库 sources.json 的相应条目匹配；这只能证明使用了已记录的源文件，不能证明源词表无误或涵盖后续修订。

使用 `scripts/compare-vocabulary-catalogs.py` 只读对比，结果分别为 12054 与 12073 个稳定键；19 个新增、0 个移除、213 个已有键字段发生改变。已有键字段变化包括 197 个 meaning、197 个 meaningCorrection、8 个 memberships、4 个 retiredMemberships、9 个 phonetic 和 9 个 phoneticCorrection、3 个 headword 和 3 个 headwordCorrection；同一条可计入多类。顶层 version 与 entry 顺序也不同。完整快照差异保存在临时 `/tmp/vocab-audit.N4kBzM/comparison.json`；每个字段保留前后内容、输入字节哈希及缺失/空值区别，临时目录不构成长期保存承诺。

复核命令：

```sh
python3 scripts/compare-vocabulary-catalogs.py /tmp/vocab-audit.N4kBzM/catalog.json data/vocabulary/catalog.json
```

该比较器只向标准输出写报告，不写输入文件、不自动应用修订；拒绝重复稳定键。测试覆盖输出稳定、字段和 membership 差异、键增删、空值与缺失、条目顺序及输入文件保持原样。报告不是教材授权证明，不代表每项变更均已逐字核对，更不是可直接重放的变更清单；特别是 `entryOrderChanged` 只标志变化，没有列出完整重排，不能用输出恢复完整目录。

建议后续构建可重放修订输入时，以原始文件哈希和稳定键绑定审定记录，保留每次变更前值、后值、来源页/URL、决策和核验状态；membership 变更与 retiredMemberships 须按身份及其旧值做冲突检查，不得假设旧 key 更名即用户身份可合并。以只允许写入新临时目录的重建程序生成候选，再比较所有顶层字段、每个词条的完整字段及顺序，校验和当前目录逐字节一致，并分别做全新导入与已有设备迁移、旧题重试和离线持久化测试，才可宣称该版本无损重建。还须核查源教材/词表再分发权限，原始文件的位置本身不构成授权。
