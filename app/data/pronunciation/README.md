# 单词发音缓存

`manifest.json` 的 `entries` 保存本地 MP3 音频，包括经来源及许可核验的真人录音和明确标为 `kind: synthetic` 的合成语音；文件需通过解码检查并记录来源与许可。键为课标词条的第一个 `mainHeadwords` 主词头（保留大小写）；它不等于完整课标词条文本。

## 录音必需范围（2026-10-30）

按用户确认的规则，只要求独立英文单词具备录音。短语、缩写、人名地名等专名，以及本轮明确排除的中文文化名称音译 `chiwen`，不计入录音缺口。已有词条及音频保留。`upper-class` 等连字符复合词仍是单词；`Arabic`、`Kazak` 等语言或族群词、`café`、`résumé` 等英语使用的借词仍需录音。大写或非 ASCII 字母本身不是排除理由。

`highschool-audio-exemptions.json` 逐项列出已复核的单词形态排除项及原因；含空白的多词表达按短语统计。未列入排除表的新单词形态词条默认要求录音，不自动依据大小写或缩写外形排除。混合普通名词含义的词条保守保留在必需范围内。该规则只用于覆盖审计，不改变出题、播放回退或学习记录。

执行 `npx tsx scripts/audit-highschool-offline-audio.ts` 可同时查看全部词条原始覆盖数和 `requiredAudio` 必需范围统计。`--missing-json OUTPUT` 仍导出所有缺少主录音的词条，并附 `requirement` 和 `audioRequired`，避免把免录音误当成已录音。

目录 v160、本轮离线构建验算：高中共 2730 个词条；2126 个必需单词词条均有来源元数据及 SHA-256 有效的离线主录音，必需主录音缺口为 0。其余 604 个免录音词条中，248 个已有录音；356 个无录音项由 330 个多词表达、10 个缩写、15 个专名、1 个文化名称音译组成。这里允许已明确标注的合成语音，只统计主词头覆盖，不代表逐个词性变读、每种口音或逐词人工试听都完成。

`file` 为本目录内的安全文件名，`sha256` 用于校验内容。`sourceUrl` 指向原始录音说明页，`author`、`license`、`licenseUrl` 是录音本身的来源与许可。Commons 的 CC0 结构化数据许可、Free Dictionary API 的 GPL 软件许可都不能替代音频许可。

- `verified-overrides.json`：经 Wiktionary 英语词条小节核实的特殊文件名、词性与口音映射（含法语版的 `Anglais` 英语小节）；不是已完成许可审核或下载的清单。整短语录音不得冒充单词录音。
- `sources.json`：已核验的 Commons 录音元数据与官方 MP3 转码地址。
- `progress.json`：逐词处理状态、失败原因和 `Retry-After` 冷却时刻，供断点续跑。
- `coverage.json`：1600 个课标主词头的本地音频覆盖情况；`unknown` 包括未尝试、超时、限流、许可待核验以及尚未找到对应录音的词，不能解释为“没有真人音频”。

从 `app` 目录执行：

```sh
npx tsx scripts/prepare-pronunciation.ts --limit=20
npx tsx scripts/prepare-pronunciation.ts --all --delay-ms=1000
npx tsx scripts/prepare-pronunciation.ts --words=apple,about --limit=2
```

脚本默认使用 Commons，默认每批查询 50 个文件（可用 `--metadata-batch-size=10` 调小）的许可和官方 MP3 转码信息，使用 `curl --http1.1` 顺序下载，并用本机 `ffprobe` 验证格式与时长；只请求经 API 核验的官方 URL，不跟随 HTTP 重定向。媒体每组最多 10 条，在同一进程中串行复用 TLS 连接；不启用并发，提供公开维护者主页的合规 User-Agent，默认传输开始频率最多每 2 秒一条（`--audio-interval-ms=2000`），遇到 HTTP/网络错误立即停止当前组。组间同样保持请求开始间隔；落盘结果不再重复等待。重复运行只跳过 SHA256 完整且仍符合已验证音源选择的缓存，保留尚在冷却期内的词；收到 429/503 时停止本批并保存服务器要求的等待时间，之后的媒体间隔至少退让到 6 秒并保留在 progress.json。连续网络失败会暂停当前批次；`--all` 按保存的冷却时间自动继续单一串行队列，普通 `--limit` 单批结束后退出。未知来源或许可需要人工核验的词不会反复请求；更正来源后可使用 `--retry-unverified` 重新核验。脚本不读取或修改学习数据库。

Free Dictionary API 是独立的可选来源，必须显式使用 `--provider=free-dictionary`。仅接受该 API 返回的确切词条音频及逐音频许可，并通过 Commons 元数据核实作者与许可；不会在 Commons 限流时自动切换服务重试同一请求。它的在线稳定性和词表覆盖尚无保证。

Commons 指向 `deed.en` 等官方许可摘要页时，保存对应的标准许可 URL；不改变许可种类。部分旧文件缺少结构化作者时，仅在原说明中明确写明“recorded by 某人”“某人的 pronunciation”或“pronunciation of … by 某人”时采纳；仅有推测作者或上传者信息的文件保持 `unknown`。

公有领域录音须同时有文件级 Public domain 标记与 `PD-self` 或 `PD-user` 许可类别，保存对应的原始类别和文件许可区链接，不改称 CC0。

最初的 `receive`、`accept` 两条录音由用户试听确认，原录音者为 Dvortygirl，许可为 [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)，从 Commons 原始 Ogg 转换为 MP3。其余音频沿用 Commons 提供的 MP3 转码，保留原录音署名及许可。缓存验证证明文件可播放且具有明确来源，并不替代逐词教学审听；同形异音词仍需结合当前释义核验。
