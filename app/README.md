# 初三背单词

Vue 3 + Fastify + SQLite 的家庭英语学习应用，包含专注背词卡片、四个自动单词本、查词、课标浏览和扩展讲解。默认只监听本机；Studio 部署通过 Tailscale 白名单访问。

## 开发与验证

从仓库根目录进入 `app/`，使用能够加载当前 `better-sqlite3` 原生模块的 Node 版本。本轮在 Node 26.4.0 上验证，依赖版本以锁文件为准。

```bash
npm ci
npm test
npm run build
DB_PATH=data/dev-vocab.db HOST=127.0.0.1 PORT=18421 npm start
```

前端开发可另开 `npx vite`；默认 API 代理为 18420。`npm run build` 执行服务端与 Vue 类型检查、Vite 打包，并把 Git 版本写入 `dist/version.json`。运行服务读取一次版本，重新构建后需要重启服务才能更新 `/version`。

环境变量：`HOST`、`PORT`（默认 18420）、`DB_PATH`（默认 `data/vocab.db`）、`STATIC_DIR`（默认 `dist`）、`ALLOW_CIDRS`。默认白名单为本机；非法网络配置会拒绝启动，单个监听地址暂不可用则继续重试。

## 每日背单词与复习

首页只有“开始背单词”这条学习入口。每天按上海日期冻结最多 **40 个不同单词**，含到期复习与新词，反复测试不额外占名额。未完成、暂缓与到期词优先，超过容量时暂停加入新词，未排入的到期词继续保留。新词在可用词库范围内按核心词约 70%、二级词约 30%，简单/中等/复杂约 40%/40%/20% 搭配；初始复杂度由长度与词组结构估计，真实遗忘和到期情况决定后续优先级。

- 首次评估包含英译汉、汉译英、听写，每种连续独立答对三次，最少九题；三种卡片和不同单词交错出现。同日答对后间隔约 5 分钟，已有连续正确时约 15 分钟，答错后约 3 分钟再测。
- 首次九题全部独立答对进入“已掌握”；有一次错误后完成进入“熟悉”；当天累计错两次进入“不熟”。尚未测试的词在“生词”中，四个单词本互斥并自动调整。
- 已掌握词到期先抽查一个薄弱或较久未测的题型，答错一次立即降为熟悉、当天第二次错降为不熟，并补练该题型至连续三次正确。熟悉/不熟词跨天检查三个题型，干净通过后逐级提升；当天补对不会抹去当天错误。
- 首次完成后次日检查；答错词安排次日及再下一日检查，之后结合现有 FSRS 记忆状态逐步拉长间隔。遵循早密后疏的间隔复习思路，不把一张固定“遗忘曲线时间表”当成个体保证。
- 听写以字母横线输入，支持粘贴、退格和跳格。卡片右上角“学习该词”返回后保留原题，该次记为看过讲解，不当作无提示通过。读音失败可重试或暂缓，暂缓不算答对或完成。
- 当前题目、每日计划、答案幂等键与复习日志保存在服务端。断线时当前页面保留待补存答案，重试复用同一键；刷新后从服务端未答题继续，需要重新填写尚未保存的输入。

新增 `/api/learning/{today,start,next,answer,consult,defer,books}`；写接口检查 Origin，判分由服务端完成。启动时只新增 `learning_*` 表与索引，不重置旧卡片或日志；首次接入的旧词依据既有状态与稳定性映射单词本。旧接口保留兼容，日历和统计共享真实答题日志。升级前请先用 SQLite backup API 备份目标数据库；本轮只在本地开发库启用，生产尚未迁移。设计与实现计划见仓库 `docs/superpowers/`。

## 词条 AI 学习助手

单词页右侧（手机端可展开）支持多个模型配置：DeepSeek、通义千问、智谱 GLM、Kimi、豆包、MiniMax。在“模型设置”添加显示名称、服务商、模型 ID 和对应平台的 API Key，再选模型提问。预设 ID 可按账号权限修改；豆包也可填已开通的 `ep-` 接入点 ID。保存配置不调用模型。对话使用官方 OpenAI 兼容接口，当前为非流式回复，等待上限 60 秒。

Key 保存到服务端 `AI_CONFIG_PATH`，默认 `~/.config/vocab-saas/ai-models.json`，文件权限 0600，原子写入。它是本机明文配置，需按密钥文件管理；不进学习数据库、浏览器存储或 HTTP 查询响应。编辑留空保留原 Key，更换服务商必须填新的 Key。多人访问同一应用实例会共用这些模型配置和调用额度，沿用本机/Tailscale 白名单访问边界。

只在发送时将当前词条（单词、释义、音标）及有限对话发送到所选服务商；不发送学习记录。聊天仅在页面内存中保存，切词、切模型或刷新会清空。支持停止、失败重试和清空；模型输出为纯文本，内容请核对。每次请求最多 20 条消息、每条 4000 字、合计 24000 字；长回复只在下一次发送上下文时截短，页面展示保留完整回复。

接口：`GET /api/ai/settings`、`POST /api/ai/settings`、`POST /api/ai/settings/:id/delete`、`POST /api/ai/chat`。写操作校验 Origin；服务商地址固定且不跟随重定向；两个并发、每分钟 20 次请求上限，错误不回传上游原文。测试通过注入模拟上游完成，不需要或复用任何真实 Key；真实云模型连通性需配置对应账号后验证。

官方协议依据：[DeepSeek](https://api-docs.deepseek.com/)、[百炼](https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope)、[智谱](https://docs.bigmodel.cn/cn/api/introduction)、[Kimi](https://platform.kimi.com/blog/posts/kimi-api-quick-start-guide)、[豆包](https://console.volcengine.com/ark/region%3Acn-beijing/docs/text-generation)、[MiniMax](https://platform.minimax.cn/docs/api-reference/text-openai-api)。预设仅作便捷起点，模型可用性以服务商账号为准。

## 词表与中文释义

课标源文件位于仓库 `data/curriculum/ocr/`，三级词表共 1600 条，其中二级 505、初中新学 1095。2026-10-17 对 Studio 数据库的只读核对结果：1600 个词均有中文释义，59 条使用人工释义，1590 条有音标；当时扩展讲解表为空。

本轮本地修订后，1600 词均有释义和音标，人工释义表共 239 条（原有 59 条、新修订 180 条）。原始释义 `meaning_raw` 保留。每词两句例句和二至三条搭配已完成交叉编辑审核，共 3200 个已批准内容块；这里的审核指 Codex 编辑审核，尚不等同于教师审校。生产数据库尚未应用这些变更。

补齐 10 项缺失音标之外，后续另修正 use、record、survey、AI、PE 共 5 条多音或缩写音标，明确词性或字母读法。修订依据是词典文本与音源所在词性小节的交叉核对，不代表已逐条试听；独立后续补丁保留原值和来源，不改原 190 字段补丁包。

首次建立本地词库：

```bash
mkdir -p data/raw
curl -L -o data/raw/ecdict.csv https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv
npm run import -- --curriculum ../data/curriculum/ocr/level3_list.tsv \
  --level2 ../data/curriculum/ocr/level2_list.tsv \
  --manual ../v2/manual_meanings.tsv --source kb2022 --db data/dev-vocab.db
```

ECDICT 原始文件与数据库不入 Git。导入保持 `(source, headword)` 幂等，不重置已有学习记录。`--dry-run` 在内存副本执行，不创建或修改目标文件。正式路径默认受保护，详见 `server/src/guard.ts`；不要通过换 HOME 或符号链接绕过保护。

## 真人发音

网页播放 `GET /api/pronunciation/audio?word=...` 的本地 MP3，不再调用浏览器 `speechSynthesis`。重复播放、切题、换词和卸载会停止旧录音；自动播放被浏览器阻止、音频缺失或加载失败时有明确重试入口。

录音与清单位于 `data/pronunciation/`：

- `manifest.json`：本地就绪文件、作者、逐文件许可、原始来源和 SHA-256。
- `sources.json`：Wikimedia Commons 的源文件元数据。
- `coverage.json`：ready / unknown / missing 分开统计；文件名存在不算就绪。
- `progress.json`：断点、失败原因、服务端 Retry-After。

```bash
# 需要 ffprobe；每次只尝试尚未就绪且不在冷却期的词。
npx tsx scripts/prepare-pronunciation.ts --limit=20
```

默认导入 Commons 真人录音，优先美式、无合适美式时可用已核实英式录音。音频转为 MP3，保留来源许可；`/api/pronunciation/credits` 提供逐词署名。公开页面可访问不等于许可合格，录音者/许可无法确认时保留 unknown。遇到 429/503 遵守 Retry-After，不通过更换服务绕过限流。词性影响读音的词需要明确对应读法。

截至 2026-10-20，本地真人录音清单有 1599 / 1600 词就绪；`underground` 的候选录音尚未核准与名词、形容词的重音对应关系，标为 unknown，不会用机器朗读冒充真人录音。以 `coverage.json` 的时间和实际 `ready` 数为准。服务端核对文件 SHA-256，损坏、缺失或来源不合格的录音不会作为可播放内容返回。

## 扩展讲解制作

基础中文释义、旧核心内容与完整讲解必须分别统计。2026-10-17 的核心包仅含每词两句例句和二至三条搭配，不代表已满足完整讲解要求。用户于 2026-10-18 认可 `manage` 样例，并要求按该标准扩展全部 1600 词。

完整讲解按常用义项组织：每义分别给自然英中例句、句型和常见/固定搭配，近义区别、限定语境的反义或相反表达；另有易混点、可靠的词根/构词与词族、原创情境助记和词形发音。不能强凑词源或反义词；确实不适用时须说明原因，也不能因不存在“所有语境通用的反义词”而漏掉明确的 `ability / inability` 等关系。事实来源与联想分开，推荐网址与实际核验来源分开。结构校验、独立模型审校、Codex 内容审读和教师审核不能混称。

完整讲解保存为 `data/lessons/<wordId>.json`，共享契约在 `shared/lesson.ts`；`GET /api/word/:id/lesson` 按需返回身份匹配、结构完整且已审校的文件，不修改学习数据库。缺失、草稿或无效文件不会冒充完整讲解，页面保留旧内容。`manage` 的正式样例为 `data/lessons/825.json`。真实完成数量以独立覆盖检查为准，不能把已生成任务数或旧核心块数量当作完成词数。

```bash
# 公共词典参考缓存；只读词库，不读取孩子的学习记录
npx tsx scripts/lesson-sources.ts --db data/dev-vocab.db
# 完整讲解小批编写与独立审校，先暂存，复核后再扩大
npx tsx scripts/lesson-generate.ts --db data/dev-vocab.db --real --fetch-sources --words ability,accept,after --concurrency 2
# 独立检查可交付文件；fullCurriculumComplete 还要求总词数恰为 1600
npx tsx scripts/lesson-status.ts --db data/dev-vocab.db --out ../.tmp/lesson-coverage.json
# 只读内容疑点汇总：重复、占位、审校记录与内容指纹、每义覆盖；不能代替语义审读
npx tsx scripts/lesson-quality.ts --db data/dev-vocab.db --out qa/lesson-quality/latest.json
```

生成草稿、原始模型输出及来源缓存保留在 `.tmp/lesson-generation/` 和 `.tmp/lesson-source-evidence/`；随讲解交付的审校记录在 `data/lesson-audit/`，包含来源摘要、输入与内容指纹、审校修改和真实制作方式。文件使用原子替换。`--publish` 只发布通过校验与审校的新内容，不覆盖已有讲解；超时、失败或审计不匹配的缓存不能作为通过结果恢复。生成与审校是不同调用；审校沿用用户已有 Codex CLI 模型设置，不修改全局配置。全量内容仍须复核实际覆盖、来源和疑点，不能仅以测试通过判定教学正确。

`lesson-root-sources.ts --limit 1600` 可补充英语词源段明确指向的原语词条，只读取完全匹配的语言段，结果独立保存至 `.tmp/lesson-root-evidence/`，不会直接改课文。词条抓取成功只代表拿到了资料；有的原语词条只有另一个词形链接，仍需继续查证其含义。缺页或缺对应语言段时保留缺失，不能用同形的其他语言条目替代。

2026-10-20 本地交付核对：完整讲解和逐词审校侧录各 1600 份；`qa/lesson-quality/coverage-20261020-delivery.json` 报告 1600 reviewed、0 draft、0 invalid、0 missing。`qa/lesson-quality/quality-20261020-delivery.json` 另保留 2632 条需人工判断的规则提示，不能用覆盖数字代替教学正确性。已对高优先级提示做独立内容审读，修正 `wet`、`to` 的词库输入漂移和 `size`、`technology` 等词源来源问题；制作、审读、来源和最终哈希留在 `data/lesson-audit/` 与 `.tmp/lesson-review/`。59 个测试文件、474 项测试及构建通过；390px 手机宽度、认词翻面后完整讲解和作答推进已在临时学习库中实测，真实学习记录未改。此处的“reviewed”指独立 AI 审校，不代表教师逐词把关。

以下为旧核心内容流程，保留用于原数据维护与兼容回退：

```bash
# 只读覆盖审计
npx tsx scripts/ai-content-status.ts --db data/dev-vocab.db --out ../.tmp/content-coverage.json
# 先小批真实生成；省略 --real 会使用显式标注的假模型
npx tsx scripts/ai-generate.ts --db data/dev-vocab.db --real --profile core --batch 10 --limit 10
# 生成可核查的样本，随后使用 ai-review 的 apply/approve 命令
npx tsx scripts/ai-review.ts sample --db data/dev-vocab.db --since 2026-10-17
```

Codex CLI 从 PATH 查找，沿用已有登录，不把凭据写入项目。项目根从源文件位置推导；任务产物与错误可追踪，重复执行按输入版本/hash 和内容块补缺。新生成内容不会自动批准。`ai-content-export.ts` 导出已批准内容及其隐藏状态，排除假模型；正式导入必须按交接流程备份和验证。

本轮可移植交付位于：

- `data/content/core-1600-2026-10-17.json`：1600 词的 3200 个已批准核心内容块。
- `data/content/word-patches-2026-10-17.json`：180 项释义、10 项音标补丁，带原值与来源。
- `data/content/phonetics-followup-2026-10-17.json`：后续 5 项多音与缩写音标修订；审核及应用前后字段哈希见 `qa/meaning-review/phonetics-followup-5-applied-2026-10-17.json`。
- `qa/ai-editorial-review/final-core-1600-2026-10-17/`：逐块 hash、审核与修订映射、覆盖率及重复导入验证。
- `qa/meaning-review/`：1600 词基础释义审查、修订记录与音标来源。

在已导入同一课标词库、已完成第二阶段迁移的开发库上，先预览导入：

```bash
npx tsx scripts/ai-review.ts patch-words --db data/dev-vocab.db \
  --patches data/content/word-patches-2026-10-17.json
npx tsx scripts/ai-review.ts patch-words --db data/dev-vocab.db \
  --patches data/content/phonetics-followup-2026-10-17.json
npx tsx scripts/ai-review.ts patch-words --db data/dev-vocab.db \
  --patches data/content/word-patches-to-2026-10-20.json
npx tsx scripts/ai-review.ts patch-words --db data/dev-vocab.db \
  --patches data/content/word-patches-wet-toilet-2026-10-20.json
npx tsx scripts/ai-content-import.ts --db data/dev-vocab.db \
  --in data/content/core-1600-2026-10-17.json
```

补丁预览无冲突后加 `--yes` 应用；内容导入应用还必须提供新的 `--backup <备份路径>`。同值补丁与同内容重复执行不会新增记录；遇到释义原值不一致时先复核，不能强行覆盖。先在开发副本验证，正式库受路径保护，需要单独执行已批准的上线交接流程。以上产物不含孩子的答题记录。

按上面顺序逐个预览、应用补丁，再导入核心内容。`to`、`wet` 的后续补丁同时列明 ECDICT 原值与仓库人工释义表的已知旧值（`expectedAlternatives`），兼容新建开发库；其他未记录的改动仍拒绝覆盖。重新运行课标导入会恢复词典与人工释义表中的基础字段，之后应重新按此顺序应用补丁。

## 其他说明

FSRS 决定复习安排；同日再次答题、错词练习和断线重试均有独立处理，答案使用幂等键。家长看板位于 `/parent`。讲解反馈会隐藏对应块，旧版本不会因新版本隐藏而复活。

设计与内容约束见仓库 `v3/`。此前 README 的第一期开发记录保留在 [历史说明](docs/phase1-historical-notes.md)，其中早期“42 个示例词”“无 AI”“浏览器朗读”等描述不再代表当前实现。
