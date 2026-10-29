# MSWC 提取恢复辅助工具

`mswc_resume_extract.py` 是独立只读提取助手，**不修改正在运行的下载任务**。它不是下载续传器；必须等 PID 42092 及同目录 `run.py` 均结束、确认完整音频与对齐包下载完成且通过 `gzip -t` 后才运行。工具检查指定旧 PID 仍在则拒绝，也检查输入包同目录是否存在正在执行的 `run.py`；然后在指定输出目录创建独占 `.extract.lock` 并再次检查，避免同一输出目录中的两个本工具实例并发。该检测无法发现所有可能以其他脚本名写入同一文件的程序，运行前仍须确认没有其他下载或提取任务；PID 重用也会保守拒绝。若进程意外终止遗留锁，先人工确认锁中 PID 和所有相关进程均结束，再移除锁，勿自动清理正在使用的锁。

示例（仅在旧任务结束且两个包存在并完成 gzip 完整性检查后执行）：

```sh
python3 qa/highschool-later-audio/mswc_resume_extract.py \
  --audio /tmp/mswc-resumable-20261030/audio.tar.gz \
  --alignments /tmp/mswc-resumable-20261030/alignments.tar.gz \
  --gaps /tmp/audit-b-mswc-intersection.json \
  --out /tmp/mswc-resumable-20261030/resume-check \
  --previous-pid 42092
```

每次重新顺序扫描已下载完整 gzip tar。`samples/<label>-<n>.opus` 和 `alignment/<id>.TextGrid` 只采用匹配的常规文件；文件已存在时比较归档中对应原始字节的 SHA-256，一致则跳过，不一致立即报错且不覆盖。完成后写出 `extract-report.json`，含归档来源路径、各片段和对齐哈希及缺失对齐文件；报告已存在时同样比对内容、不一致则停。重新扫描消耗磁盘读取和 CPU，但不重新联网下载。若原归档或目标清单变化，输出不一致会停而不会覆盖。程序拒绝 `.part` 文件；不能从文件名独立证明 gzip 已验证，调用者必须先验证。所有输出仍是研究候选，不代表读音正确或已授权导入。

用 `python3 qa/highschool-later-audio/test_mswc_resume_extract.py` 执行三项隔离 fixture：中断后缺文件恢复、已有文件哈希不符拒绝覆盖、已运行旧 PID/输出锁/模拟源任务拒绝并发。测试不访问网络、生产清单或当前下载目录。2026-10-30 实际运行 3 项通过。
