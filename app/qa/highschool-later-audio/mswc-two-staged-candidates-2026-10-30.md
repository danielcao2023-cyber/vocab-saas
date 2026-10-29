# MSWC 两项候选的隔离转码与接入建议（2026-10-30）

本次仅生成 `/tmp/audit-b-mswc-candidates/` 内候选，未修改应用音频、manifest、用户数据，也未人工试听。两段来自 Common Voice v3 句级录音经自动对齐切片，并不是独立词条录音；具体来源与许可边界见 `mswc-rights-chain-2026-10-30.md`、机器筛查见 `mswc-three-model-screen-2026-10-30.md`。

| 词头 | MSWC 压缩包内路径 | 源 Opus SHA-256 | 临时 MP3 SHA-256 | 来源句 |
|---|---|---|---|---|
| belongings | `en/clips/belongings/common_voice_en_101527.opus` | `0d6335b401c2d4b22d56604e3f2d70528eed8ee64d2560541a033ebbf3a3798b` | `90ecadc3dd890259ea7b7e6aa53cb50e45df775d57e29e0106e84d317de76d7e` | the boy went to his room and packed his belongings |
| kayaking | `en/clips/kayaking/common_voice_en_20376420.opus` | `dedb0867952d85e550dab7c6f82aa187b95e6b8f5d211bdbc16288f256d292e6` | `8a30fa0023b53816bb0d37c516f2708ae26bf0d22adc3d9d8af4ac53c311496d` | the kamal is still a tool recommended for use in sea kayaking |

命令对每段分别执行 `ffmpeg -nostdin -hide_banner -loglevel error -i INPUT.opus -map_metadata -1 -codec:a libmp3lame -b:a 96k OUTPUT.mp3`；随后 `ffmpeg -nostdin -hide_banner -loglevel error -i OUTPUT.mp3 -f null -` 均解码完成。三种本地 Whisper 模型识别出相应词、-35 dB 静音阈值下两端有短暂停顿；这些并不能证明没有音节截断、口音合适或发音正确。

## 如后续决定接入

可沿用现有 OpenSLR/ECCC 元数据和离线来源页，暂定 `accent: unknown`、`provider: mswc`；署名为 `MLCommons Multilingual Spoken Words Corpus（源自 Common Voice v3；说话人匿名）`，来源链接为 [英语原始语料压缩包](https://mswc.mlcommons-storage.org/audio/en.tar.gz)，来源说明标为“原始语料压缩包”，证据链接为 [MLCommons 官方页面](https://mlcommons.org/datasets/multilingual-spoken-words/)，许可链接为 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。在 `pronunciationNote` 明示原文件 ID、自动从句中切分、转码与未人工试听；机器筛查和源句不作为人工认证。原句与哈希留在审计资料中供追踪。

`scripts/prepare-pronunciation.ts` 的两处第三方 provider 保护当前仅涵盖 `openslr` 和 `eccc`；新增 `mswc` 时须覆盖清单保留及自动队列跳过，避免后续 Commons 更新覆盖。须添加实际在线音频 API、离线构建与资源播放、网页/离线来源页和许可、缺损及哈希处理、自动导入保护的测试；确保与现有录音兼容。现行 MDC 与历史派生片段的适用关系尚无明确解释，不把 MLCommons 标示解读为已经排除全部其他使用条件。spacewalk 本轮不准备接入。
