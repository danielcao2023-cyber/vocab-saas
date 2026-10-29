# MSWC 另一组五词十段自动筛查（2026-10-30）

对 spacewalk、pets、Ontario、Winnipeg、Montreal 两段各执行本机 Whisper base/small/medium（英文、CPU、无提示、temperature 0）及 ffprobe、`silencedetect=noise=-35dB:d=0.025`。逐段源句、成员、片段及 TextGrid 哈希、时长、静音、模型输出见同名 JSON；五个词均在 catalog v145 的构建离线缺口快照中。候选来自自动对齐的 Common Voice 句子切片，非独立朗读，未人工试听。

| 候选 | 三模型结果与文本语境 | 筛查结果 |
|---|---|---|
| Ontario 1/2 | 均 Ontario；1 是 Lake Ontario，2 是加拿大省 | 两段可进一步试听，前者语境指湖而非省；语音是否适合需听审 |
| Winnipeg 1/2 | medium 均 Winnipeg，base/small 不符；两句都在描述加拿大城市 | 读音及切片可靠性待听审，机器分歧较大 |
| spacewalk 1 | 三者均 spacewalk；语境太空行走 | 阈值下开头仅 0.035 秒静音、末尾无静音，存在边界疑点，不判定截断，重点试听 |
| spacewalk 2 | to spacewalk / It's a spacewalk / Spacewalk | 可能混入邻词，待听审 |
| pets 1/2 | 1 全部不符；2 均 pets；语境宠物 | 2 可待听审；1 暂不采纳 |
| Montreal 1/2 | 1 均 Montreal；2 Montréal/Montreal/Montreal | 1 对应加拿大城市，2 为体育语境可能指队名；口音、片段完整性待听审 |

静音检测仅依给定阈值，不保证切片完整；模型一致不证明听审、读音正确或可教学。分发许可与历史/现行平台规则的限制见 `mswc-rights-chain-2026-10-30.md`，不可由本筛查认定可发行。复现依赖 `/tmp/mswc-resumable-20261030/resume-check` 的原提取、`alignments-screen.json`、`/tmp/mswc-current-gaps-a.json`、本机 Whisper 三模型和 ffmpeg：运行 `.../openai-whisper/20250625_4/libexec/bin/python qa/highschool-later-audio/mswc-next-ten-model-screen.py`。脚本只写临时文件。没有修改应用或录音清单。
