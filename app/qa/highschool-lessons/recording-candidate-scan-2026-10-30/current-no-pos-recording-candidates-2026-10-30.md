# 当前 382 缺录的无词性异读候选筛选（2026-10-30）

实际运行离线审计：高中 2730 项、382 缺口，其中 49 项含占位符。只复核此前 Wiktionary/Commons 原始索引和文件声明，补充一次 Commons MediaInfo 请求（HTTP 200，见 `led-mediainfo-current-2026-10-30.json`）。

- **bungee jumping**：英语 Wiktionary 关联 [En-us-bungee-jumping.ogg](https://commons.wikimedia.org/wiki/File:En-us-bungee-jumping.ogg)，Commons 原始元数据显示完整英语短语，来源 own work、作者 Jelkner，采用 Free Art License（FAL）。这是开放许可候选，不存在名词/动词异读，但 FAL 不在现有解析器支持的许可集合中；发行兼容、许可文件与署名要求尚待核，不能直接自动导入，未试听和解码。原始元数据见 `commons-batch-raw-2026-10-30.json`。
- **LED**：Wiktionary 英语栏列 [LED1](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Vealhurl-LED1.wav) / [LED2](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Vealhurl-LED2.wav) 与 /ɛl.iːˈdiː/、/lɛd/ 两读法，Commons 文件页为 Vealhurl 录制、CC BY-SA 4.0；但本轮 MediaInfo P9533 分别是 **LED1** 与 **LED2**，不是精确的 LED。Wiktionary 关联不能独立证明录音有没有念出数字，具体读法仍须核实，不直接认为完整词头可用；上次 LED1 下载遇 429 后停止，没有音频。
- 已经接入的 WWW 和 Sami 不属于当前缺口；余下的 Arabic 等有原始作者 assumed 或其他来源不清，concrete、decrease、analyses、patent 等有待区分的读法和词性，暂不归为本次优先无歧义候选。

本次没有找到已完成听审、且可无条件接入的候选；上述来源记录可指导后续审核。本轮未下载或试听、未更改 manifest 和用户数据。
