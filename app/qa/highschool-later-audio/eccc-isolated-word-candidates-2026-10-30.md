# ECCC 真人整词录音候选（2026-10-30）

[英国 Sheffield English Consistent Confusion Corpus 官方页面](https://spandh.dcs.shef.ac.uk/ECCC/)注明 CC BY 4.0，要求署名论文 Marxer、Barker、Cooke、Garcia Lecumberri（2016）。[技术资料](https://spandh.dcs.shef.ac.uk/ECCC/data/marxer_barker_cooke_2016.pdf)说明四位说话人单独朗读常见词，人工分段；这些不是从句子截词。其 ZIP `confusionWavs/ReadMe.txt` 说明双声道 WAV 左声道为干净目标人声、右声道为噪声；必须提取左声道并注明转换，不能把双声道原样当作无噪教学录音。官方页面标英国英语，文件未注明具体个人姓名，不应推断说话人身份。CC BY 4.0 的使用须保留作者、来源、许可链接和改动说明；本记录不是法律意见。

对官方 ZIP 通过 HTTP Range 读取 `confusionCorpus_v1.2.csv`（3207 行、1729 个目标词）与 391 条高中缺录精确比较（小写匹配、项目内已有拼写变体），得到两个词头：

| 教材词头 | 文件 / 说话人 | 索引音标 | 当前课文讲解 | 核验状态 |
| --- | --- | --- | --- | --- |
| puzzle（必修二 Unit 4） | `T_33145.wav` / s1 | /ˈpʌzəl/ | /ˈpʌzəl/ | ZIP 中央目录可见该文件，未下载和试听；另一个 `T_40900.wav` 标 /ˈpʊzəl/，不可未经验证替代。 |
| Log/log（选择性必修四 Unit 3） | `T_11035.wav`、`T_32198.wav` / s3 | /ˈlɒɡ/ | 英式 /lɒɡ/ | ZIP 中央目录可见两文件，未下载和试听；应检查应用实际展示 log 与稳定词条身份。 |

官方压缩包长度 173138764 字节，支持按区段读取；仅取 ZIP 中央目录、索引 CSV 与文本 README，没有下载录音；上述文件大小和存在性来自中央目录，不等于文件可解码或经听辨。录音清单未改；接入前需单独下载、核验摘要、左声道提取、完整音质/读音试听、跟踪语料与具体文件来源，并验证在线、离线和已有学习状态。

## puzzle 接入

已按中央目录定位和 HTTP Range 下载 `T_33145.wav`（未下载整个压缩包），原双声道 PCM、16 kHz、0.89825 秒、57532 字节，源 SHA-256 `548611cd100bc7a4c290194a1faf6d86112e61e6697c28aba5de5e33e9b0acee`。执行 `ffmpeg -nostdin -hide_banner -loglevel error -i /tmp/eccc-puzzle-33145.wav -map_metadata -1 -af 'pan=mono|c0=c0' -codec:a libmp3lame -b:a 96k /tmp/eccc-puzzle-33145.mp3`，保留左声道干净目标语音，去掉右声道噪声、转 MP3；MP3 SHA-256 `6e27c4069531c1d586d2dee78332c010fc429063afdb67c0eddebefc78c5a0a5`，16 kHz 单声道，完整解码无错误。语料索引给出的词与音标匹配；音频仍未经人工试听，实际口音尚未听审，元数据和网页均明确标注。保留 corpus 作者/论文、CC BY 4.0、原 ZIP 链接、样本 ID 和修改说明；导入器保护独立来源免被 Commons 任务清除。在线/离线、来源、导入保护等 4 个测试文件 14 项及 typecheck 通过，尚需离线包重建及真机试听。Log 未接入。
