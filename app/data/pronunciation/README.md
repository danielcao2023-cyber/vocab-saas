# 真人单词录音缓存

`manifest.json` 的 `entries` 仅保存已经下载到本目录、经过 MP3 解码检查并有逐文件作者与许可记录的音频。键为课标词条的第一个 `mainHeadwords` 主词头（保留大小写）；它不等于完整课标词条文本。

`file` 为本目录内的安全文件名，`sha256` 用于校验内容。`sourceUrl` 指向原始录音说明页，`author`、`license`、`licenseUrl` 是录音本身的来源与许可。Commons 的 CC0 结构化数据许可、Free Dictionary API 的 GPL 软件许可都不能替代音频许可。

- `verified-overrides.json`：经英文 Wiktionary 词条核实的特殊文件名、词性与口音映射；不是已完成许可审核或下载的清单。整短语录音不得冒充单词录音。
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

Commons 指向 `deed.en` 等官方许可摘要页时，保存对应的标准许可 URL；不改变许可种类。部分旧文件缺少结构化作者时，仅在原说明中明确写明“recorded by 某人”时采纳，仍无法验证的文件保持 `unknown`。

最初的 `receive`、`accept` 两条录音由用户试听确认，原录音者为 Dvortygirl，许可为 [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)，从 Commons 原始 Ogg 转换为 MP3。其余音频沿用 Commons 提供的 MP3 转码，保留原录音署名及许可。缓存验证证明文件可播放且具有明确来源，并不替代逐词教学审听；同形异音词仍需结合当前释义核验。
