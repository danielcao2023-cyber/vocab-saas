# MSWC 五词十段自动筛查（2026-10-30）

针对已提取 50 段中的 fin、illustrate、corporate、stringed、motivated 各两段，使用本机 Whisper base/small/medium（CPU、英文、无提示、temperature 0），并运行 ffprobe 与 ffmpeg `silencedetect=noise=-35dB:d=0.025`。对应源音频成员、片段及对齐 SHA-256、原句、各模型输出、时长及静音事件见 `mswc-five-new-model-screen-2026-10-30.json`；所有标签都在本次 catalog v145 实际离线资源扫描的缺口中，但这是构建快照，不是每台用户设备。

| 词 | base / small / medium 简述 | 筛查判断 |
|---|---|---|
| fin | 1: Son / Fin / So；2: 空 / Fin / Fin | 两条未三模型一致，第二条可待试听，短词识别不稳定 |
| stringed | 1: String the / string / string the；2: Shrinked it / Stringed it / 空 | 均有疑似邻词或词尾不清风险，仅待进一步听审 |
| illustrate | 1: illustrate / illustrate / Illustrator；2: to illustrate / illustrate / Illustrated | 第一条较接近；第二条可能包含前置 to；均需人工听审 |
| corporate | 1: Co-operate / Go pray / corporate；2: for our planet / Co-opment / Well, I'll put | 模型分歧明显，暂不采纳 |
| motivated | 1: 三者 Anyway；2: God of Eden / I don't want to be a nuke / Bye for now | 严重不一致，疑对齐或识别问题，暂不采纳 |

所有文件均是约一秒的源句自动对齐片段，而非独立录词。对应句子中的词汇义项与目标普通词基本相符，但自动对齐文本不能证明实际音频对应或截取正确；两端在设定阈值下均可检测到一定静音，不能保证无截断或混入邻词。没有人工试听，不能把模型结果当听审。MSWC 标示 CC BY 4.0 及 Common Voice 来源的分发边界见 `mswc-rights-chain-2026-10-30.md`；无分发结论。

复现：完整提取目录、`/tmp/mswc-resumable-20261030/alignments-screen.json` 和重新生成的 `/tmp/mswc-current-gaps-a.json` 就绪后，执行 `/opt/homebrew/Cellar/openai-whisper/20250625_4/libexec/bin/python qa/highschool-later-audio/mswc-five-new-model-screen.py`；需要本机缓存三种模型与 ffmpeg。该脚本写临时 JSON，不修改应用。临时目录可能被系统清理，提交的 JSON 保留源成员和哈希以便以后复查。本轮未改音频清单或用户数据。
