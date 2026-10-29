# 高中缺录音的 Wiktionary 批量候选索引（2026-10-30）

范围是当时 catalog v137 与 mobile-public 离线资源的实际只读扫描。394 个缺基础录音的 stable key 中排除 48 个带占位条目，剩余 346 条，按实际 `pronunciationHeadword` 去重为 345 个播放词。输入快照 `offline-gaps.json` 可由 `npx tsx scripts/audit-highschool-offline-audio.ts --missing-json /tmp/highschool-gap.json` 重做；结果会随着资源重建而变化。

对这 345 个词，使用 Wiktionary 英语词条批量 API，每批 20 项，提取英语章节 `{{audio|en|...}}` 模板，结果在 `wiktionary-batches.jsonl`：

- 325 项查询成功：其中 23 项提取出至少一个音频模板、112 项英语章节未匹配到该模板、186 项页面不存在、4 项没有英语章节。
- 20 项查询失败：同一批次两次 HTTP 429；这 20 项不是无录音结论。共 18 批，17 成功、1 失败。
- 23 项涉及 32 个文件名；只读项目本地 Commons 元数据缓存经既有 resolver 检查，32 个均未达到缓存中可直接确认的 resolved 状态。缓存未命中或校验未通过不代表原始文件不存在。具体结果见 `local-source-cache-results.json`；没有声称录音音质、作者或许可证已逐一核实。

候选可能与请求词不完全一致：如 `keep track of` 指向 keep track、`fall in love with` 指向 fall in love、`draft` 指向 draught；`corporate`、`patent` 等可能有词性异读，地名专名与缩写也须单独审查。跨语言章节不得混用。模板提取只是初筛：未识别所有页面音频写法、渲染音频、页面跳转或词头别名，也未判断录音内容、作者、授权、语种、音质或口音。

运行期间一个批次出现 429 后，旧采集脚本在重试失败后继续请求了其余批次，这是限流处理错误。已停止外部查询，`scan-wiktionary.py` 改为遇 429 或 503 立即停止，不自动重试该状态；原始结果如实保留。以后应先核服务的 Retry-After 和状态，待允许后再开始新文件或仅重查失败词；不会把失败行当作已验证的无结果。普通非限流故障最多重试一次，批间 1 秒。

复现方式：`python3 qa/highschool-lessons/recording-candidate-scan-2026-10-30/scan-wiktionary.py /tmp/highschool-gap.json /tmp/new-wiktionary-batches.jsonl`。脚本不写入词库或音频；已存在输出会跳过其中请求过的词（包含失败项），重查失败项须另准备输入或输出。未批量导入，未下载音频。
