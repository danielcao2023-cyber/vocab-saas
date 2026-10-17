# 背单词 v3 第二期 Codex 交付报告

日期：2026-10-17（上海时间）。分支保持 `feat/v3-phase2`；启动时与交付时 HEAD 均为 `8ef614b`（任务书等文档提交叠在修正后的第一期基线上）。没有 commit、push、建分支或切换分支，改动留在工作区。

## 实现与文件清单

| 文件 | 用途 |
|---|---|
| `server/src/db.ts` | 追加 `migratePhase2`：3 张旧表加列，word_forms/word_freq 新表、3 个索引、4 个 settings；不修改旧 CHECK、不重建旧表、不改旧数据行。 |
| `server/src/word-status.ts`（新增） | 认词卡四档状态与中文标签的共享判定。 |
| `server/src/study.ts` | progress 复用共享状态；fresh 复用共享新词选择规则，第一期调度与接口保持。 |
| `server/src/learn-order.ts`（新增） | freshChoice/freshWordId 与 learnOrder；先按首次认词日志排已学词，再处理已有 New 卡，最后模拟 priority 穿插和词频顺序。 |
| `server/src/search.ts`（新增） | 英文、中文、词形查词；详情、状态和错词本信息；高频分组、组合筛选、分页和覆盖率；全部只读。 |
| `server/src/content.ts`（新增） | 最新 approved 且未隐藏的块；动态计算关联词的 inList/learned；坏数据返回 pending；反馈校验、隐藏及幂等。 |
| `server/src/content-validate.ts`（新增） | 9 种 kind 的纯函数校验、规则及不规则词形、课标词排序/标记、词源降级、禁用内容与 zk_freq 防编造统计校验。 |
| `server/src/freq.ts`（新增） | 5 行 CSV fixture 对应的 ECDICT 解析、exchange 词形导入、frq/bnc 频率及文件 hash、全量中考分数的名次整理。 |
| `server/src/app.ts` | 接入 search、word、browse、content、feedback 路由；讲解不接入学习调度。 |
| `server/src/ai/codex-runner.ts`（新增） | 唯一模型进程入口；固定 `gpt-6-luna`，无 shell、stdin ignore、固定工作目录、能力检测、最后完整 JSON 提取、TERM/KILL 超时；本期未执行真实入口。 |
| `server/src/ai/pipeline.ts`（新增） | 可注入 runner；排队、input_hash/payload_hash、running/unknown 对账、有限重试、失败重试专用队列、单实例锁、干净停止、只读 dry-run、pilot 文件。使用预留 ai_cache 保存 input_hash→job 对应，便于跨批大小断点恢复。 |
| `server/src/ai/prompts.ts`、`schema.ts`（新增） | p2-v1 / p2-zk-v1 提示词、严格 JSON 输出结构。 |
| `server/src/ai/review.ts`（新增） | 固定种子分层抽样、抽查 MD/CSV、逐条 apply、仅 generated 可批量 approve、hide、覆盖率统计。 |
| `server/src/ai/transfer.ts`（新增） | 只读导出、文件头/sha256/目标结构校验、导入计划、备份后单事务导入、幂等与 `$HOME/apps/` 路径保护（含符号链接）。 |
| `server/src/ai/cli.ts`（新增） | 共用参数解析和 CLI 错误出口。 |
| `scripts/import-forms.ts`、`freq-daily.ts`、`freq-zk-rank.ts`（新增） | 词形导入、日常高频重算、中考高频排序 CLI。 |
| `scripts/ai-generate.ts`（新增） | 流水线 CLI、ECDICT 输入检查、SIGINT 收尾；真实 runner 延迟到实际处理批次才调用，dry-run 不执行模型进程。 |
| `scripts/ai-review.ts`（新增） | sample/apply/approve/hide/stats；无 --yes 时数据库只读。 |
| `scripts/ai-content-export.ts`、`ai-content-import.ts`（新增） | 导出和导入 CLI；默认仅检查计划，--yes 必须同时给新备份路径。 |
| `scripts/verify-migration.ts` | 旧表列表补齐 4 张 AI 内容表，新增表报告包含 word_forms/word_freq；临时副本放项目 .tmp。 |
| `web/src/components/ExplainPanel.vue`（新增） | 6 个 details 分组、按场景默认展开、预览、localStorage、E 键、反馈、pending；无讲解播放按钮/音频。加载不阻塞评分。 |
| `web/src/components/SearchBox.vue`（新增） | 桌面搜索下拉、手机全屏搜索层、200ms 防抖、过期响应保护、最多 8 条、/、↑↓、Enter、Esc、词形标签和中文高亮。 |
| `web/src/components/StatusChip.vue`（新增） | 四档状态 chip。 |
| `web/src/views/WordView.vue`（新增） | 词头、库内音标、原有浏览器朗读、MeaningList、三张卡状态和上海日期、错词本操作；讲解全部折叠。 |
| `web/src/views/BrowseView.vue`（新增） | 两种高频分组、级别/字母/状态筛选、逐词依据、推断标签、未排序提示和加载更多。 |
| `web/src/App.vue` | 第四个“词表”导航、非学习页搜索、word 视图与 history/popstate；返回词表保留筛选和已加载项；手机搜索层覆盖底栏。家长页保持独立。 |
| `web/src/components/RecognizeCard.vue`、`views/StudyView.vue` | 认词翻面及拼写/听写反馈后显示讲解；选择题不显示；手机评分吸底。 |
| `web/src/styles/app.css` | 移植批准稿第二期讲解、查词、详情、词表样式，适配 button 和真实交互。 |
| `web/src/copy.ts`、`types.ts` | 新文案集中管理；补齐 search/browse/word/content 类型。 |
| `.gitignore` | 忽略 `data/ai-raw/`。 |
| `test/v3-migration.test.ts` | 唯一旧测试调整：settings 总数 9→13，与新增 4 个默认设置一致；旧行旧列不变的断言保留。 |
| `test/p2-helpers.ts`、`p2-host.ts`（新增） | 全表 hash、受限临时目录、5 行 ECDICT fixture、无端口的 Vue 实际交互测试宿主。 |
| `qa/v3-phase2-codex-report.md`（新增） | 本报告。 |

## 新增测试

共新增 9 个测试文件，保留原有 20 个文件、127 个测试；合计 **29 个文件、218 个测试通过**，新增 91 个测试。

- `test/p2-migration.test.ts`：旧 AI 表逐列保留、迁移可重复、默认值和新表报告。
- `test/content-validate.test.ts`：全部 kind 的结构、数量、长度、目标词、屈折变化（went/studies/stopped/bigger）、短语、难词、课标外限制、词源降级、联想防历史说法、音节重音、URL/HTML/Markdown/音频/禁用文案、zk 评分。
- `test/ai-pipeline.test.ts`：runner 参数和 stdin、能力检测 fixture、无真实进程的超时 TERM/KILL、30 次 fresh 与 learnOrder 一致、幂等/单词释义变更、pilot 词表及全部产物、坏 JSON/校验/超时/非零退出的有限重试、running→unknown、对账、干净停止、活/死 PID 锁、dry-run、zk 推断、retry-failed 范围。
- `test/ai-review.test.ts`：generated/review 批量批准边界、逐条审核、默认不写库、固定种子及抽样比例、首批词源全查及后续比例、输出文件。
- `test/search.test.ts`：英文/中文/词形/引号/变体排序、40 字符、详情/讲解只读全表 hash、共享状态、错词本规则、1600 个造词逐词检索。
- `test/browse.test.ts`：无排序数据回退、组合筛选、分页、覆盖率、无效参数与全表 hash。
- `test/freq.test.ts`：5 行 ECDICT fixture；frq、bnc、无数据；短语不导入词形；缺文件不写；重复导入/重排相同；zk 同分排序。
- `test/explain-ui.test.ts`：SSR 的 6 块顺序、空块、默认折叠/展开、联想标签、无音频/播放、推断与逐行依据、最新批准内容、反馈幂等、坏 JSON/缺表时学习不受影响；实际组件搜索防抖/过期响应/快捷键/手机取消、E 键/存储/反馈、筛选和加载更多。
- `test/content-transfer.test.ts`：只读导出、含隐藏状态往返、异库 id 映射、默认不写、强制备份、重复导入 0 变化、缺词/冲突、其他表 hash 不变、未迁移/坏头/坏 hash 拒绝、正式路径及符号链接拒绝、事务中途失败整体回滚。

## 验证结果

所有 npm 命令均在 app 目录运行，并设置 `TMPDIR=/Users/caogong/dev/vocab-saas/.tmp`，使原有测试的 os.tmpdir() 也落在许可目录。

- `npm test`：29 files passed；218 tests passed（2026-10-17 17:52 上海时间最后一轮）。
- `npm run typecheck`：通过。
- `npm run build`：通过；51 modules；JS 132.11 kB（gzip 48.45 kB），CSS 32.39 kB（gzip 7.24 kB）；构建版本 `8ef614b (dirty)`。
- 另用项目现有 TypeScript 对 `scripts/` 与 `server/src/` 完整检查：通过（原 npm typecheck 的 tsconfig 不直接覆盖所有脚本）。
- `git diff --check`：通过。
- 接口验证全部用 Fastify.inject；前端用 SSR 和 Vue 自定义宿主，不启动监听端口、不联网。
- 没有执行模型调用、真实模式、CLI help、试点或全量任务。所有 runner 验证均为注入假 runner/假进程。
- 代码和报告只写 app；临时文件只写项目 .tmp；测试临时数据库已清理。

## 新文案原文

下列来自 copy.ts 的第二期新键；函数形式用于替换真实数量，不含视觉稿示意数据。

- `explain`：讲解
- `aiLabel`：AI 生成 · 可能有误
- `expandAll`：全部展开
- `collapseAll`：全部收起
- `reportContent`：这条有问题
- `feedbackReasons[0]`：例句不通
- `feedbackReasons[1]`：意思不对
- `feedbackReasons[2]`：太难
- `feedbackReasons[3]`：其他
- `feedbackSaved`：已记下，这条先不再出现。
- `contentTitles.example`：例句
- `contentTitles.collocation`：常见搭配
- `contentTitles.distinction`：易混词
- `contentTitles.relations`：近义 · 反义
- `contentTitles.pronunciation`：发音
- `contentTitles.memory`：记忆
- `synonym`：近义
- `antonym`：反义
- `etymology`：词源
- `association`：联想 · 帮助记忆，不是词源
- `sameRoot`：同根词
- `relatedWords`：相关词
- `learned`：已学
- `outsideList`：课标外
- `explainPending`：讲解还在准备
- `explainPendingNote`：这个词的例句还没生成，先看释义和发音。
- `searchPlaceholder`：查单词，英文或中文
- `cancel`：取消
- `search`：查词
- `noSearchResults`：没找到这个词。
- `noSearchResultsNote`：课标词表里没有，或者换个拼法试试。
- `searchTip`：英文、中文都能查，比如 receive、收到
- `searchFormsTip`：过去式、复数这些变化形式也能查，比如 went、children
- `searchResults`：{n} 个结果
- `formResults`：词形
- `searchKeys`：↑↓ 选择 · Enter 打开 · Esc 关闭
- `searchTooLong`：最多输入 40 个字。
- `wordList`：词表
- `zkHigh`：中考高频
- `dailyHigh`：日常高频
- `inferred`：推断
- `basis`：依据：
- `zkHighNote`：中考高频排序是根据词义和用法推断的，不是真题统计。每个词的依据写在释义下面。
- `dailyHighNote`：按 COCA（美国当代英语语料库）词频排序，数据来自 ECDICT。词频库里没有的词排在最后，标「推断」。
- `unrankedNote`：这个分组还没排好，先按词表顺序显示。
- `addWrong`：加入错词本
- `inWrong`：在错词本里
- `notInWrong`：不在错词本里。
- `removeWrong`：移出错词本
- `wrongBook`：错词本
- `lookupWrongNote`：加入后会出现在“练错词”里；查词本身不算学习，不会改复习安排。
- `learningStatus`：学习状态
- `nextReview`：下次复习：
- `back`：← 返回
- `loadMore`：加载更多
- `all`：全部
- `levelLabel`：级别
- `letterLabel`：首字母
- `statuses.new`：新词
- `statuses.learning`：学习中
- `statuses.familiar`：熟悉
- `statuses.mastered`：掌握
- `cardStates[0]`：新词
- `cardStates[1]`：学习中
- `cardStates[2]`：复习中
- `cardStates[3]`：重学中
- `noCard`：还没开始
- `wrongCount`：错过 {n} 次
- `correctDays`：{n}/3 天
- `browseTotal`：共 {n} 个

## 假设和实现约定

1. `--words` 在普通模式中优先排队，不会把其余词排除；在 `--pilot` 中覆盖默认试点词表。`--limit` 按词数计算。`--retry-failed` 只处理明确 failed 的输入，每次仅给 1 次机会，不顺带提交新词或 unknown 任务。
2. 使用预留 `ai_cache` 记录输入 hash 与 job 的对应，避免 failed/unknown 因改变批大小而自动重复提交。旧 job 没有缓存时采取保守阻止策略；只有显式 retry-failed 才恢复失败词。课标版本 hash 基于规范化词表及词形，不把实时出词序号纳入，避免学习进度改变导致全量重生成。
3. zk_freq 分数入库时暂存 `rank=0`，浏览只把 `rank>0` 当成已排序数据；全量出分后执行 freq-zk-rank，才发布名次。rank 工具在缺词时明确报错，避免把不完整推断显示成完整排序。
4. 词源前 200 个生成词保持全部抽查；没有记录证明这些条目全部完成核对且错误率不超过 2%，就继续全查，而非自动降低抽样。课标外标记的块也采取全查的保守做法。
5. 词源降级时丢弃历史链和历史解释，用 parts 重建“可以这样记：…”；仍有历史断言或超长则拒绝该块；和原联想合并时最多 80 字，保留降级标记，等待逐条审核。
6. 各场景的展开偏好分开保存。详情页每次进入均全部折叠，遵从用户明确决定；不会读取学习卡片上保存的展开状态。
7. word_freq 内容冲突在 --yes 导入事务中更新；相同内容跳过。word_content 同词、kind、input_hash 已存在时一律跳过（包括 review 或隐藏行），并报告内容差异为冲突。
8. 没有通过审核的块不会展示。讲解解析异常时整次响应返回 pending；不尝试修复数据库。详情的三张卡显示实际 FSRS 阶段与日期，总状态仍严格按认词卡四档判定。
9. 1600 词完整搜索覆盖采用合成测试库验证，未读取真实学习库；视觉参考采用批准稿 HTML/CSS 及给定截图。实际设备与截图对比由工程负责人后续验收。

## 未做或未验证

- 未运行任何真实模型、codex CLI（包括 help），未试点、未全量生成、未实际批准内容；真实模型耗时、输出质量、支持的 CLI flags 与领域抽查错误率待工程负责人和领域研究验证。
- 未对真实数据库运行导出/导入、词形导入或频率重算；未访问 `~/apps/vocab`；导入工具保留不可绕过的正式路径拒绝。
- 未读写或打印 `~/.codex/` 内容，未比较该目录配置文件 hash；该核对按任务书由工程负责人做。
- 未启动 18425 或任何监听服务，未部署、未做真实浏览器/手机端截图与音频实际试听；已做 SSR 和实际组件事件验证。
- 未安装依赖，未改 package.json/package-lock.json；未联网、未调研外部来源。
- 未做真题统计、教材单元、讲解音频、AI 干扰项、登录或 PIN。
- 新文案已集中入 copy.ts；真实模型语义准确性与文案领域复核属于后续试点。
- 已提出私人 Wiki 归档提醒；未经确认没有归档。

## 后续交接

工程负责人复核并自行提交；运行测试实例和截图对照。用户确认后，按任务书在库副本上先导入词形、生成日常高频，再跑 batch 1/5/10 试点；比较 summary/samples 后确定批大小，继续全量生成与分层审核。中考全量出分后执行 freq-zk-rank。正式库搬运和上线仍须另批。
