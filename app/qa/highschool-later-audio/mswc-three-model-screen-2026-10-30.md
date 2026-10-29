# MSWC 三个候选的本机自动筛查（2026-10-30）

选取既有隔离样本 belongings-2、kayaking-1、spacewalk-1，没有下载源语音、导入、上传或人工试听。模型均为本机 Whisper base/small/medium、英语、CPU、temperature 0、无提示；模型对短词可能误识或幻觉，识别一致不保证音频准确、完整或适合教学。音频为 MSWC 对源句自动对齐提取的片段，非独立朗读。

| 文件和 SHA-256 | 三种模型输出 | 源自动转写的词义与教材 | 时长与粗边界 |
|---|---|---|---|
| belongings-2.opus `0d6335b401c2d4b22d56604e3f2d70528eed8ee64d2560541a033ebbf3a3798b` | 三者均为 belongings | 源句 packed his belongings，名词“物品”，与高中词义一致；源句自动词区间 3.53–4.30 秒 | 约 1.00 秒；静音约 0–0.148 和 0.805–0.996 秒 |
| kayaking-1.opus `dedb0867952d85e550dab7c6f82aa187b95e6b8f5d211bdbc16288f256d292e6` | 三者均为 kayaking | 源句 sea kayaking，名词“皮划艇运动”，与高中词义一致；源句自动词区间 3.69–4.39 秒 | 约 1.01 秒；静音约 0–0.163 和 0.841–1.00 秒 |
| spacewalk-1.opus `05866f3f2cdf96355526635496229d6b13cd1969fbef90a443b32bc42b1c9bbf` | 三者均为 spacewalk | 源句 a little spacewalk，名词“太空行走”，与高中词义一致；源句自动词区间 3.46–4.44 秒 | 约 1.01 秒；静音约 0–0.035 秒；末尾未检出阈值下静音，需重点人工听审 |

静音使用 ffmpeg `silencedetect=noise=-35dB:d=0.025`，结果依赖阈值，背景噪声和语音弱音均可造成误判；spacewalk 尾端未检出静音不是断言截断。对齐时间属于源句，不是证明输出片段边界。源句、音频路径与哈希详见 `mswc-candidate-provenance-2026-10-29.json`。

[MSWC 官方页面](https://mlcommons.org/datasets/multilingual-spoken-words/)对英语 audio 列 CC BY 4.0，禁止尝试识别录音人；[作者论文](https://datasets-benchmarks-proceedings.neurips.cc/paper/2021/file/fe131d7f5a6b38b23cc967316c13dae2-Paper-round2.pdf)称初版取 Common Voice v3 validated，由强制对齐产生候选。此前 [来源权利审计](mswc-rights-chain-2026-10-30.md)记录现行 Mozilla 平台条款边界。Mozilla 在其[官方 Hugging Face 组织页面](https://huggingface.co/mozilla-foundation)称自 2025 年 10 月起数据通过 MDC 提供，特定历史版本可联系询问；本次未找到 v3 英语当前官方下载链接，也未取得原始整句或其包内许可证明。来源音频可获性、精确截取、与现行条款关系及真人听审均需再确认。
