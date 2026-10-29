# 历史词库快照的可重放重建（2026-10-29）

本记录及 `catalog-v9-v135-history-snapshot-2026-10-29.json` 是旧生成器 v9 与当时正式 v135 目录的**历史差异快照**，并非逐项教材来源认证、内容校验或可用于未来任意版本的通用勘误规则。快照含顶层前后值、每个变动稳定键的完整前后词条（新增/删除分别用 null 标记）、全部前后稳定键顺序及输入输出 SHA-256，包含完整 membership 和顺序。并不保存用户学习数据或原词表。

`python3 scripts/replay-vocabulary-snapshot.py` 的 snapshot/replay 命令只允许在系统临时目录中的现有文件夹写入全新文件；输出采用独占创建，失败删除自己创建的半成品，拒绝已有文件和链接。replay 检查精确的基线 SHA-256、顶层字段、完整基线顺序、每项变更之前值、重复键、输出集合与顺序，再检查目标字节 SHA-256；只有全部通过才写出。快照 SHA-256 本身作为审计记录，用于独立核对该文件，工具不把它当签名或来源可信证明。

从 `/Users/caogong/Downloads/词库` 和 `/Users/caogong/Documents/Codex/2026-10-26/vocab-expansion/sources` 实际重新运行 `scripts/build-vocabulary-catalog.py`，生成 13 本词书、36 个单元、12054 个旧稳定键，输出 SHA-256 `394e352e060a9201512379a68bad47d4cf3eed1cdc360119f8a5ec014245f92c`。将快照应用于该实际新基线，输出与本轮正式目录逐字节比较一致，均为 `07bde0a283cd9811a217f2e2d0eadeea48b9bb637b9f8684d1522c9448bae602`。快照 SHA-256 `403fed49c77db3a731dd1fc6850d6e8504b52e3b02b5f4ef33d9acc3394dc8c1`。

可复核示例（用 Python 的系统临时目录创建全新子目录，勿替换正式目录）：

```sh
TMP_REPLAY=$(python3 -c 'import tempfile; print(tempfile.mkdtemp(prefix="vocab-replay-"))')
python3 scripts/build-vocabulary-catalog.py \
  --downloads /Users/caogong/Downloads/词库 \
  --textbooks /Users/caogong/Documents/Codex/2026-10-26/vocab-expansion/sources \
  --output "$TMP_REPLAY/catalog.json"
python3 scripts/replay-vocabulary-snapshot.py replay \
  "$TMP_REPLAY/catalog.json" qa/highschool-lessons/catalog-v9-v135-history-snapshot-2026-10-29.json \
  "$TMP_REPLAY/rebuilt.json"
cmp "$TMP_REPLAY/rebuilt.json" data/vocabulary/catalog.json
```

定向 7 项 unittest 覆盖前后值与顺序、基线和目标哈希、冲突与篡改、重复/缺失键、禁止覆盖/符号链接/非临时目录以及模拟写入故障清理；`python3 -m unittest discover -s test -p 'test_vocabulary_snapshot_replay.py'` 通过。此结果只证明该两个快照可在当前源输入条件下重建；教材逐项核验、知识产权授权、不同设备旧题和学习数据迁移均不属于本重建测试范围。未改正式 catalog 或学习数据库，未处理录音。
