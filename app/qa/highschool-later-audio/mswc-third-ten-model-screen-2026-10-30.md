# MSWC 五词十段进一步机器筛查（2026-10-30）

对 Arabic、analyses、concrete、knit、decrease 的各两段使用 Whisper base/small/medium（CPU、英语、temperature 0、无提示）及 ffprobe、ffmpeg `silencedetect=noise=-35dB:d=0.025`。逐段源句、成员名、片段及 TextGrid 哈希、模型与静音结果见同名 JSON。全部处于 v145 离线资源缺口快照；未人工试听，自动源句和模型结果不证明实际发音、切片完整或许可适用。

| 词与语境 | 机器筛查和注意事项 |
|---|---|
| Arabic | 两句均指阿拉伯语；第一段三模型 Arabic，第二段 small 误识为 A rabbit，其余匹配。第一段可进入听审，不能据此确定口音或音质。 |
| analyses | 两句为 analysis 的名词复数；第二段三模型 analyses，第一段输出 analysis 或其他。复数读法与动词 analyses 的异读需人工核实，不能作为所有词性的录音。 |
| concrete | 两句均描述混凝土：第一句修饰码头，第二句名词；两段三模型均为 concrete。和教材“具体的”等义项可能存在读法差异，须核词性及发音并试听。 |
| knit | 第一段源句为 close knit，三模型均不符；第二段源句语法有缺漏，两个模型识别 knit、base 为 Net；待听审，不能由语境推定准确。 |
| decrease | 两段同一名词语境，第二段三模型一致，第一段含疑似相邻 in；词性重音区别须核实，不能作为动词统一发音。 |

各片段在 -35 dB 阈值下检测到两端静音，阈值测试不能证明无截断或相邻词混入。MSWC 历史/现行分发边界见 `mswc-rights-chain-2026-10-30.md`。执行同名 Python 脚本需原隔离提取、`/tmp/mswc-resumable-20261030/alignments-screen.json`、`/tmp/mswc-current-gaps-a.json`、本机 Whisper 模型与 ffmpeg；脚本只写临时输出。未修改应用录音清单。
