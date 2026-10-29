# MSWC 包下载与隔离提取结果（2026-10-30）

原进程 42092 完成音频包后因对齐包 Range 请求得到 200、未满足严格 206 验证而退出；没有从该次任务提取。随后在同目录 `alignments-safe.py` 用 Range 从 0 请求：返回 206，ETag `"afee50863a46e99d8a321ad8cc78a3c8-171"`、Content-Range `bytes 0-895991430/895991431`、Content-Length `895991431` 均匹配之前记录，文件完整下载；`gzip -t` 通过，SHA-256 `2b888855b2b1b1225ddc3501be49146ecc19b47f47199903df5aacf1213a760a`。音频 34,846,172,764 bytes，先前日志记 gzip 校验通过、SHA-256 `10ccb03c3697593121b353be28b0f288b7fe58659e1c38edb93446989a32eacc`。校验值证明本地文件完整性线索，非发布者签名或授权证明。下载日志在 `/tmp/mswc-resumable-20261030/alignments-safe.log`。

任务 PID 71433 用项目 `mswc_resume_extract.py` 一次扫描已完整包，输出 `/tmp/mswc-resumable-20261030/resume-check/`，25 个标签各 2 条、共 50 个片段及 50 个匹配 TextGrid，未缺对齐。`extract-report.json` 逐文件记录压缩包成员及片段、TextGrid 哈希；`/tmp/mswc-resumable-20261030/alignments-screen.json` 是解析 words tier 后的句子和标签出现次数，50 个各包含一次目标标签。这些记录不能证明音频内容、切分完整性、发音及口音。

可进一步听审的普通词初筛包括 fin、stringed、illustrate、corporate、spacewalk、motivated、pets，但须重新检查最新缺口、句中义项以及人工试听。analyses、concrete、orient、decrease、patent 存在词性或读音区别；两份 `led` 对齐文本是 lead 的过去式而非 LED 缩写；`knit` 第一条来自 close-knit。GPS 两段源句相同且是否实际读字母仍须试听。专有名词须核对指代，Sami 已有其他录音须重新扫描。数据来自自动对齐并切分的 Common Voice 句子，并非独立录词。分发权利边界见 `mswc-rights-chain-2026-10-30.md`。本轮没有人工试听、没有接入应用或修改 manifest 和用户数据。
