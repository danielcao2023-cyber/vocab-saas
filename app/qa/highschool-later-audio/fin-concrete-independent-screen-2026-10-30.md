# fin / concrete 真人录音候选复核

2026-10-30；仅检查隔离目录中的候选，不改应用录音或 manifest。两段均是独立录词，未人工听审；机器转写、文件可解码及元数据均不能确认声音正确、词性、重音或教学适用性。

| 词条 | 本地原始文件与 SHA-256 | 来源与许可证据 | 自动样本检查 |
| --- | --- | --- | --- |
| fin | `/tmp/colorado-fin-audit/fin-female2.wav`；`64266916df3c3d3af54037b43207dd6a77b13dff8fd4ddd5b59ccf081363b523` | [Colorado 单音节语料](https://pmc.ncbi.nlm.nih.gov/articles/PMC6910017/)；[具体文件官方元数据](https://api.osf.io/v2/files/5d56fad0150734001ec574cf/) 的 SHA-256 与本地一致。语料标 CC BY-NC 4.0；其非商业限制是否适用于本项目实际分发仍待判断，不能当作可用于任意商业用途。 | ffprobe：0.757528 秒；ffmpeg 完整解码成功。Whisper base / small / medium 分别转写 `Fin` / `Finn` / `fin`；同音拼写可能产生混淆。 |
| concrete | `/tmp/shtooka-more/mary/flac/eng-53756f73.flac`；`b8e30299887626aff94b841def28cf90adea050a54cea8c1f3c81843116a32c8` | Shtooka / WimsEdu Mary 词包，本地原始 FLAC 标签标记说话者 Mary Maury、词包作者 Bernadette Perrin-Riou、Csilla Ducrocq、Mary Maury 及 CC BY 3.0 US；[原始词包](https://fsi-languages.yojik.eu/audiocollections/archives/eng-wims-mary_flac.tar.xz)。具体重音、词性及权利归属仍需结合实际音频和来源再核。 | ffprobe：1.350 秒；ffmpeg 完整解码成功。Whisper base / small / medium 均转写 `Concrete`；文字识别不区分所需重音。 |

两个样本用本机缓存的 Whisper base、small、medium 模型，CPU、英文、无提示、temperature 0 分别转写；结果相互关联，不是三次独立人工审核。`fin` 需要确认许可在实际使用场景下适用并听审；`concrete` 的词典列出不同重音，必须听辨并确认是否对应教材目标义项，不能仅由模型转写认定。模型筛查脚本临时保存于 `/tmp/review-recordings-highschool.py`，临时目录可能被系统清理。

背景与更完整的权利、教材和既有审计： [Colorado fin](colorado-word-audio-candidate-2026-10-30.md)、[concrete 义项及重音](orient-decrease-concrete-review-2026-10-30.md)。
