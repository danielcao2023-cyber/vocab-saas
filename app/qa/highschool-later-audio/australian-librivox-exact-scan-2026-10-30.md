# 澳洲题材 LibriVox 语料整段匹配调查

2026-10-30 对 [Australian English Speech](https://huggingface.co/datasets/ablmontazer/australian-english-speech) 进行只读索引扫描。语料页面标注 CC0-1.0，称其录音来自 LibriVox 志愿朗读，并列出每行朗读者、书目、章节等信息；本次没有逐条独立核对其授权链。页面同时说明转写由机器生成、口音未经逐个读者核实。所有音频均未下载、试听或导入。

扫描时从 `/tmp/current-highschool-missing.json` 快照的 403 行中，以当时 manifest 中词头（大小写不敏感）过滤，得到 **362 个词条**；快照源文件 SHA-256 为 `851aa458f7f66dfb70aa87cd4658da10e4cbbb4dbce1d6bcf0977836cb69f4e2`。这不是截至现在的完整缺录清单，也不代表当时其他审计口径的 377 个缺口。用于扫描的确切词头保存在 `australian-librivox-targets-2026-10-30.json`，SHA-256 `a7d399fb24353926999516b7ba6cf9b8afc43090728f88c02fc43133c142b100`。

官方数据集服务器返回的 21 个 Parquet 分片索引保存在 `australian-librivox-parquet-index-2026-10-30.json`，SHA-256 `ca32dd04b5d7d8faa5cc2562ed5e31fda0154a1452040bc2ec914eb1d6344c27`。逐一远程读取分片的转写、朗读者、书目、读者及书目 ID、章节与时长；完整转写与完整词头统一小写、去除非 ASCII 字母及空格以外字符后做相等比较，**21 个分片均读取成功，匹配 0 条**。这是机器转写的整段匹配结果，不证明语料中完全没有目标词的句内发音；不能将句内出现、自动切片或本次零匹配当作已审听或已验证发音。

复现：Python 环境安装 `duckdb`（本次 2.0.0） 并允许远程读取 Parquet，然后在仓库根目录运行 `python3 app/qa/highschool-later-audio/australian-librivox-exact-scan.py`。脚本只查询文本和元数据，不读取音频列；远程分片可能更新或失效，索引未记录各分片内容哈希，不能保证未来数据快照逐字节一致。恢复匹配还须核具体源录音、授权、词义、完整性及实际音质；不得将机器转写或识别结果称为人工试听。
