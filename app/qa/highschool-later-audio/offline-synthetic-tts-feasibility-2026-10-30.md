# 离线合成发音可行性调查（2026-10-30）

本轮只做本机模型盘点和两条临时合成样本；没有新增应用录音、修改音频清单或生成正式音频。合成语音不能标为真人录音，两条样本均未人工试听。未确认用户是否希望采用合成音频过渡。

## 本机模型与许可边界

- 已缓存 `mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-4bit`，本机快照版本 `5c390979e4b93af5f2932f90742ca99c7dd04687`；[该转换模型卡](https://huggingface.co/mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-4bit)和[原 Qwen 模型卡](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign)都标注 Apache-2.0，转换卡称从原模型转换。Apache-2.0 允许商业使用和再分发，但实际发布仍须核实模型、运行依赖的完整来源和相应许可、通知义务；本次未完成依赖逐项许可审计，也没有确认生成语音的发音正确性。
- 已缓存 `lucasnewman/f5-tts-mlx` 模型。其[转换模型卡](https://huggingface.co/lucasnewman/f5-tts-mlx)显示 MIT 并称由原权重转换；[原作者 F5-TTS 仓库](https://github.com/SWivid/F5-TTS#license)区分代码 MIT 和预训练模型 CC BY-NC。存在来源链许可冲突，不能仅据转换卡将该权重当作允许商业用途；本次未用它生成样本。
- macOS `say` 为系统合成选项，但其系统语音是否能将生成文件随应用再分发，需要核对本机适用条款。[Apple 曾公布的 macOS Catalina 许可](https://www.apple.com/legal/sla/docs/macOSCatalina.pdf)对系统语音公开分享和再分发有明确限制，不能把旧版条款直接当作本机当前版本条款；本次未用系统语音生成或打包样本。

## 范围与试验

以本轮临时盘点 `/tmp/reuse-gap-live.json` 中 378 条缺录为范围，按项目 `hasDictionaryPlaceholder` 对原词头判定：334 条非占位、44 条占位。334 只是输入形式满足该规则的数量，不证明合成发音准确或都适合自动生成；其中 10 条全大写缩写是 CE、WWW、GPS、LED、DDT、CPR、PLA、BBQ、CV、PETS，须逐项核对读法。专名、词性异读及词组语流也需核验。该统计是当时清单的快照，不代表已安装 APK。

使用本机现有 `mlx_audio` 环境、上述 Qwen 快照、`HF_HUB_OFFLINE=1` 和 `TRANSFORMERS_OFFLINE=1`，语言 `English`、默认速度 1.0，语音描述为 `A clear natural American English voice, speaking a short vocabulary phrase.`，分别输入 `suitable for` 与 `in charge of` 输出 WAV 到临时目录。加载时出现模型类型兼容性警告，但两次生成均返回成功。以下 SHA-256 是当次样本，不保证随机生成可逐字节复现：

| 输入 | 时长 | WAV SHA-256 | Whisper base / small 无提示识别 |
| --- | ---: | --- | --- |
| suitable for | 1.12 秒 | `db5b90f76ef9ab16faabdc958bf1625acd26d7d80bb66aa90223cca861d2ae1d` | 两者均输出 suitable for |
| in charge of | 1.20 秒 | `dfd439acf1ad6f2bf29520b1d202d566d229a0b4a6623b803a93712411a39d06` | 两者均输出 in charge of |

自动识别仅辅助验证文字，不能证明语音重音、自然度、词性、口音或音质正确，更不等同人耳听审。模型输出可能有随机性，少量成功样本不能推断整批质量。音频未保存进仓库。
