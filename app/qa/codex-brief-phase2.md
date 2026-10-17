# Codex 任务书：背单词 v3 第二期（查词、按高频分组浏览、AI 讲解流水线）

> 起草：工程负责人，2026-10-17 15:30（上海时间）。**状态：草稿，等用户确认第 12 节的问题后再运行。**
> 基线：app 仓库分支 `feat/v3-phase2`，从 `feat/v3-phase1` 的 `c007ded` 拉出。分支由工程负责人建好，你不要建分支，也不要切分支。
> 依据：`v3/方案.md`（1.1、1.5、第 3 节第 2 期、第 4 节第 2 期验收）、`v3/phase2-ai-content-spec.md`（下称“内容规格”）、`v3/design/design-notes.md` 第 10 节，以及视觉稿 `card-back-explain.html`、`card-back-explain-m.html`、`explain-pending.html` 和 `shots/` 里对应的三张图。
> 用户已定：查词和浏览的范围；浏览按**高频分组**，不按教材单元；AI 内容 1600 词全部生成、**不设每日上限**（订阅额度够用），但必须能断点续跑、按 input_hash 幂等；每次调用显式写 `-m gpt-6-luna`，不改 `~/.codex/config.toml`。

## 0. 工作目录与硬性限制（先读）

```
~/dev/vocab-saas/
  app/                     ← git 仓库（feat/v3-phase2），所有代码改动只在这里
  .tmp/                    ← 唯一允许的临时目录（不要用 /tmp、$TMPDIR）
  v2/内容.md               ← 只读（禁用说法、定稿文案）
  v3/方案.md、v3/phase2-ai-content-spec.md、v3/design/、v3/codex-brief-phase2.md ← 只读
```
运行方式：你以 `-C ~/dev/vocab-saas` 启动。**只能写 `app/` 和 `~/dev/vocab-saas/.tmp/`**。所有 npm 命令先 `cd app`。

- **本次绝对不调用任何模型**：不运行 `codex`（连 `codex --help` 也不要跑）、不跑 `scripts/ai-generate.ts` 的真实模式、不联网。流水线只用**模拟模型**（注入的假 runner）做单元测试。20 词试点由工程负责人之后另行运行，不归你。
- 不读、不写、不打印 `~/.codex/` 下的任何文件；代码里也不许出现写这个目录的逻辑。
- 不 `git commit`、`push`、`checkout`、`switch`、`branch`、`stash`、`reset`；改动留在工作区。
- 不装依赖，不改 `package.json` 和 `package-lock.json`。
- 不读取或打印密钥、令牌，以及环境变量里的凭据。
- 不在 `app/data/` 下创建或修改 `.db`；测试用 `:memory:` 或 `~/dev/vocab-saas/.tmp/` 下的临时文件，用完删掉。
- 不启动监听端口的服务；接口测试用 `buildApp(db).inject(...)`。
- **迁移只加不改**：只能 `addColumn`、`CREATE TABLE IF NOT EXISTS`、`CREATE INDEX IF NOT EXISTS`、`INSERT OR IGNORE` settings。不改已有 CHECK，不重建表，不改旧行。
- 第一期的行为、接口和测试全部保持，不得回退（`npm test` 现有 19 个文件、118 个测试必须继续通过）。
- 不确定的地方，按本书的默认做法实现，并写进交付报告的“假设”一节；**不要停下来提问**。

## 1. 现状（行号以 c007ded 为准）

- `server/src/db.ts`：
  - `SCHEMA` 中已有但未使用的表：`word_content`（第 27–36 行，status CHECK 只有 pending/generated/review/approved）、`content_feedback`（第 37–43 行）、`ai_jobs`、`ai_cache`（第 68–69 行）。
  - `words.freq_rank` 由导入写入，取 ECDICT 的 `frq`（COCA 词频位次），没有时用 `bnc`（`import.ts` 第 135、162 行）。注意：这个列混了两种来源，不能直接当“依据”展示。
  - 第一期迁移在第 103–120 行，`recomputeDailyStats(db)` 在第 121 行。
- `server/src/text.ts`：`mainHeadwords()`（第 7 行）、`normalizeQuotes()`。
- `server/src/import.ts`：ECDICT 解析在第 130–138 行，只取 phonetic/translation/pos/bnc/frq，没有取 `exchange`（词形变化）和 `tag`。ECDICT 原文件在 Studio 的 `app/data/raw/ecdict.csv`（已 gitignore）。列为：`word,phonetic,definition,translation,pos,collins,oxford,tag,bnc,frq,exchange,detail,audio`。
- `server/src/study.ts`：
  - `progress()` 第 182 行，给出四档：新词 / 学习中 / 熟悉 / 掌握。
  - `setWrong()` 第 208 行，放回错词本时不增加 wrong_count。
  - `nextCard()` 第 66 行，新词顺序：已有 New 认词卡按 id；否则按 `level2_every` 穿插 priority 2/1，组内按 `COALESCE(freq_rank,999999), id`。
- `server/src/app.ts`：第一期全部路由在第 25–75 行。
- 前端：
  - `web/src/App.vue`：顶栏第 45 行，tabs 第 40 行。
  - `components/RecognizeCard.vue`（翻面后的释义和评分）。
  - `views/StudyView.vue`：拼写/听写反馈条在第 110 行。
  - `styles/tokens.css`、`styles/app.css`。
- `scripts/verify-migration.ts` 第 7 行的 `tables` 列表。
- `.gitignore`：`node_modules/ dist/ data/raw/ data/*.db*`。

## 2. 数据库迁移（server/src/db.ts，追加在第一期迁移之后、`recomputeDailyStats` 之前）

1. 按内容规格第 2 节：
   - `word_content` 加列：`flags_json TEXT`、`hidden_at TEXT`、`hidden_reason TEXT`、`job_id INTEGER`、`input_hash TEXT`、`downgraded_from TEXT`、`approved_at TEXT`。
   - `content_feedback` 加列：`content_id INTEGER`、`kind TEXT`、`handled_at TEXT`。
   - `ai_jobs` 加列：`word_ids TEXT`、`model TEXT`、`prompt_version TEXT`、`request_id TEXT`、`duration_ms INTEGER`、`output_file TEXT`、`batch_size INTEGER`、`created_at TEXT`。
   - 索引：`idx_word_content_word_kind ON word_content(word_id, kind)`、`idx_word_content_hash ON word_content(input_hash)`、`idx_ai_jobs_hash ON ai_jobs(payload_hash)`。
2. 新表：
   ```sql
   CREATE TABLE IF NOT EXISTS word_forms (          -- ECDICT exchange 词形，供例句校验和查词用
     word_id INTEGER NOT NULL REFERENCES words(id), form TEXT NOT NULL, kind TEXT NOT NULL,  -- p/d/i/3/s/r/t/0/1
     PRIMARY KEY (word_id, form, kind));
   CREATE TABLE IF NOT EXISTS word_freq (
     word_id INTEGER NOT NULL REFERENCES words(id),
     grp TEXT NOT NULL CHECK (grp IN ('zk_high','daily_high')),
     rank INTEGER NOT NULL,          -- 组内名次，1 = 最高频
     score REAL,                     -- 排序依据数值（COCA 位次 / 模型给的 1–5 分），可空
     basis TEXT NOT NULL,            -- 中文一句话说明依据，逐词记录
     source TEXT NOT NULL,           -- 如 'ecdict-frq@<sha256前12位>'、'gpt-6-luna/p2-zk-v1'
     is_inferred INTEGER NOT NULL CHECK (is_inferred IN (0,1)),
     job_id INTEGER, created_at TEXT NOT NULL,
     PRIMARY KEY (word_id, grp));
   ```
3. settings 新键（`INSERT OR IGNORE`）：`ai_model=gpt-6-luna`（只读展示用，脚本不从这里读模型名）、`ai_batch_size=5`、`ai_max_attempts=2`、`ai_timeout_ms=600000`。
4. `scripts/verify-migration.ts` 的旧表列表加上 `word_content`、`content_feedback`、`ai_jobs`、`ai_cache`；新表加进 `addedTables`。原有断言（旧列逐行不变）照旧。

## 3. 查词（用户已定）

### 3.1 接口
- `GET /api/search?q=&limit=20`：
  - 英文：先 `normalizeQuotes` 并转小写，与 `mainHeadwords(headword)` 的每个变体比对，也与 `word_forms.form` 比对（查 went 能找到 go）。排序：完全相等 > 前缀 > 包含 > 只命中词形；同级按 `words.id`。
  - 中文（含汉字）：匹配 `meaning_zh` 包含，按“命中的是第几行释义”、再按 id 排序。
  - 空查询返回 `[]`；`q` 超过 40 字符返回 400。
  - 每项返回：`{ id, headword, phonetic, firstMeaning, level, status, inWrongBook }`。
- `GET /api/word/:id`：
  - 返回 `{ word: { id, headword, phonetic, pos, meaning_zh, meaning_source, meaning_flag, level, source }, status, statusDetail, wrong, content }`。
  - `status` 取 新词 / 学习中 / 熟悉 / 掌握，判定**复用 `progress()` 的口径**，抽成一个共享函数，不要复制一份。
  - `statusDetail` 给三张卡各自的 `state` 和 `due`（没有卡就为 null）。
  - `wrong` 为 `{ inBook, wrong_count, correct_days }` 或 null。
  - `content` 同 5.4 节的结构。
- 两个接口**都不能写任何表**（包括 daily_stats 和 question_issues）。要有测试：调用前后对所有表求 hash，结果相同。
- “加入错词本”复用 `POST /api/wrong/:wordId {inBook:true}`，规则不变（不增加 wrong_count，correct_days 清空）。查词页里的“移出错词本”用 `{inBook:false}`。

### 3.2 界面（这部分没有视觉稿，按 design.css 的组件和 tokens 做，不发明新的视觉语言）
- **桌面**：顶栏中间放搜索框（placeholder“查单词，英文或中文”），快捷键 `/` 聚焦。**手机**：顶栏右侧放一个放大镜按钮，点开后搜索框盖住整个顶栏。学习页（study）不显示搜索。
- 输入时防抖 200ms 出下拉列表：最多 8 条，方向键选择，Enter 打开。打开后进入单词详情视图 `view='word'`，不引入路由；浏览器后退回到上一个视图，用 `history.pushState` 加 `popstate`，地址形如 `/?word=<id>`。
- 详情页内容：
  - 大号词头、库里的音标、原有的浏览器朗读按钮。
  - 释义：用 `MeaningList`，规则和卡片背面一致。
  - 学习状态 chip：新词 / 学习中 / 熟悉 / 掌握；有卡时附“下次复习：M月D日”，用上海日期。
  - 错词本状态，以及“加入错词本 / 移出错词本”按钮。
  - 讲解区：与 5.5 节是同一个组件，默认全部折叠，只展开例句。
- 没找到时显示“没找到这个词。课标词表里没有，或者换个拼法试试。”（新文案，放进 `copy.ts`）。

## 4. 按高频分组浏览（用户已定：不按教材单元）

### 4.1 两个分组，依据逐词记录
- **`daily_high`（日常高频）**：有可靠的公开来源，就是 ECDICT 的 `frq` 字段（COCA 当代美国英语语料库词频位次；ECDICT 说明见 https://github.com/skywind3000/ECDICT ，工程负责人 2026-10-17 核对）。`frq` 为 0 时表示没有数据，退用 `bnc`（英国国家语料库位次）。
  - 写 `scripts/freq-daily.ts --db <path> --ecdict <csv>`：直接从 ecdict.csv 重算，**不用 `words.freq_rank`**，因为那一列混了两种来源。
  - `rank` 按位次从小到大排；`score` 存位次。
  - `basis` 写“COCA 词频第 N 位（ECDICT frq）”或“BNC 词频第 N 位（ECDICT bnc，COCA 无数据）”。
  - `source='ecdict-frq@<文件 sha256 前 12 位>'`，`is_inferred=0`。
  - 两个字段都没有数据的词，排在最后，`is_inferred=1`，`basis`=“词频库无数据，排在最后（推断）”。
  - 短语词头取 `mainHeadwords()` 第一个变体去查；查不到就按无数据处理。
  - 脚本幂等，重跑结果相同。
- **`zk_high`（中考高频）**：**目前没有找到可靠的公开数据源**（调研见第 11 节）。所以一律由模型**推断**，`is_inferred=1`：
  - 作为流水线的第二种任务（`ai_jobs.kind='zk_freq'`，`prompt_version='p2-zk-v1'`）。每批给模型若干词（词头、释义、级别），要求对每个词输出 `{ "word", "score": 1–5, "basis_zh" }`。`score` 表示“在中考听力、阅读、完形、写作里常见的程度”；`basis_zh` ≤ 40 字，说明理由，如“基础高频动词，常见于完形和书面表达”。
  - **校验**：
    - `score` 必须是 1–5 的整数。
    - `basis_zh` 不得包含任何数字、百分号或“统计 / 真题出现 / 次”这类数量说法——防止模型编造统计（内容.md 禁止编造的统计），违反就拒绝该条。
    - 词必须与请求一一对应。
  - 全部词出分后，`scripts/freq-zk-rank.ts` 生成 `rank`：按 score 降序，同分按 `daily_high` 的 rank，再按 id。
  - `basis` 存为“{basis_zh}（模型推断，非真题统计）”，`source='gpt-6-luna/p2-zk-v1'`。
  - 将来如果用户提供了真题语料，再加一个 `source` 并设 `is_inferred=0`。本期**不实现**真题统计。

### 4.2 接口
- `GET /api/browse?group=zk_high|daily_high&level=all|core|level2&letter=a..z|all&status=all|new|learning|familiar|mastered&page=1&size=50`：
  - 只列 `source='kb2022'` 的词。`level=core` 对应 `三级`，`level2` 对应 `二级`。`letter` 取 `mainHeadwords()` 第一个变体的首字母（小写）。`status` 的口径同 3.1 节。
  - 每项：`{ id, headword, phonetic, firstMeaning, level, status, inWrongBook, rank, basis, isInferred }`。
  - 外层：`{ items, total, page, size, group, coverage: { ranked, total } }`。
  - 该组还没有 `word_freq` 数据时，`items` 按 id 排序，`coverage.ranked=0`，界面提示“这个分组还没排好，先按词表顺序显示。”
  - 不写任何表，要有测试。

### 4.3 界面
- 导航加一个标签“词表”（桌面顶栏和手机底栏都加，顺序：今日 / 错词本 / 词表 / 进度）。
- 页面顶部：分组切换做成分段按钮“中考高频 / 日常高频”；下面三个筛选：级别（全部 / 核心词 / 二级词）、首字母（A–Z 横向滚动的小格子加“全部”）、学习状态（全部 / 新词 / 学习中 / 熟悉 / 掌握）。
- 列表每行：名次、词头、音标、释义第一行、级别标签、状态 chip、错词本小标。
  - `isInferred` 为真时，名次旁边显示灰色小标签**「推断」**，悬停或点按显示 `basis`。中考高频这一组整组都是推断，所以列表顶部再加一行说明：“中考高频排序是根据词义和用法推断的，不是真题统计。”（新文案）
  - 日常高频的 `basis` 也能点开看，例如“COCA 词频第 312 位”。
- 点一行进入 3.2 节的单词详情。分页用“加载更多”。

## 5. AI 讲解

### 5.1 输出结构、校验、状态流转
- **完全按内容规格第 1、2、4、5 节实现**：9 种 kind、`p2-v1` JSON、全部校验规则、词源降级、`generated / review / approved` 加 `hidden_at`。
- 校验写成纯函数 `server/src/content-validate.ts`，输入一个 item 和词的上下文（词头、释义、词形、课标词表），输出 `{ blocks: [{kind, body, status, flags}], rejects: [{kind, reason}] }`。
- 屈折形式的匹配用 `word_forms`，再加上内容规格第 5 节的规则变化。
- 课标词表和“出词顺序号”：写 `learnOrder(db)`，用与 `nextCard().fresh()` **完全相同**的规则推算全部 kb2022 词的出词顺序（已学的按第一次认词日志的时间在前，未学的按 fresh 规则模拟）。要有测试：用 fresh 依次取 30 个新词，顺序必须与 learnOrder 一致。

### 5.2 Studio 端批处理脚本 `scripts/ai-generate.ts`
- 用法：
  ```
  npx tsx scripts/ai-generate.ts --db <path> --ecdict <csv> [--kind content|zk_freq] [--batch 5]
        [--limit N] [--words a,b,c] [--pilot] [--dry-run] [--retry-failed] [--reconcile]
  ```
- **调用模型**：唯一的入口是 `server/src/ai/codex-runner.ts`。它用 `child_process.spawn`，不用 shell，参数是数组：
  ```
  /opt/homebrew/bin/codex exec -m gpt-6-luna --sandbox read-only --skip-git-repo-check
      -C <HOME>/dev/vocab-saas [--output-last-message <outFile>] [--output-schema <schemaFile>] "<prompt>"
  ```
  - `stdio: ['ignore', ...]`，等价于 `</dev/null`。
  - 模型名写成常量 `MODEL='gpt-6-luna'`，**每次调用都显式带 `-m`**，不能通过参数或环境变量改。
  - 不传任何 `-c`/`--config` 覆盖项，不传 `--dangerously-*`、`--full-auto` 或 `--yolo`。
  - 超时用 `ai_timeout_ms`，到时 SIGTERM，10 秒后 SIGKILL。
  - 环境变量原样继承，**不打印、不记录**。
  - `--output-schema` 和 `--output-last-message` 是否支持【待实测】：写 `detectFlags(helpText)`，用 fixture 文本测试；真实运行时由脚本自己跑一次 `codex exec --help` 来检测（你不要跑）。不支持就只靠提示词，从 stdout 截出最后一个完整的 JSON 对象。
  - 临时文件（prompt、schema、输出）放在 `~/dev/vocab-saas/.tmp/ai/<job_id>/`；原始输出复制到 `app/data/ai-raw/<job_id>.json`。`.gitignore` 加上 `data/ai-raw/`。
- **runner 可以注入**：`ai-generate` 的核心逻辑写成 `runPipeline(db, opts, runner)`。测试里传 `FakeRunner`，按词返回 fixture 输出；可以模拟成功、坏 JSON、校验失败、超时、进程退出码非 0。
- **排队**：
  - content：先排已有卡的词，按最近的 due 排；然后按 `learnOrder` 排还没学的词。
  - zk_freq：全部 kb2022 词，按 id 排。
  - `--words` 指定的词放最前；`--limit` 限制本次处理的词数。
- **幂等，按 input_hash**：
  - `input_hash = sha256(kind | prompt_version | MODEL | headword | meaning_zh | level | 词形列表 | 课标词表版本hash)`。
  - 如果某个词已经有同一个 input_hash 的 word_content 行（任何 status，隐藏的也算），或者 zk_freq 已有同一个 job 来源的行，就跳过，不再调用。
  - 释义改了，hash 就会变，那个词会重新排队；旧行保留，不删。
  - 批的 `payload_hash` = 批内各词 input_hash 排序后再 hash。
- **ai_jobs 记录和有限重试**：
  - 每批先插一行 `status='running'`，填 `started_at`、`word_ids`、`model`、`prompt_version`、`batch_size`、`request_id`（uuid）；结束时写 `finished_at`、`duration_ms`、`status`。
  - `status` 取 `succeeded / partial / failed / unknown`。
  - 失败最多 `ai_max_attempts=2` 次，即首次加 1 次重试；重试时把校验错误摘要加进提示词。还失败就写 `error`（截断到 500 字），这些词留在“还在准备”。
  - **默认绝不无限重跑**；`--retry-failed` 只对 `failed` 的批再给 1 次机会。
  - 启动时发现上次遗留的 `running` 行，标成 `unknown`，**不自动重提**。`--reconcile` 会去读它的 `output_file` 或 `.tmp` 里的输出：能解析就按正常流程入库，不能就标 `failed`。
  - 同一个 `payload_hash` 已有 `succeeded` 时不再提交。
- **单实例锁**：`~/dev/vocab-saas/.tmp/ai/generate.lock`，里面写 pid；pid 已不存在时可以接管。
- **不设每日上限**（用户已定），但要能随时 Ctrl-C：当前批完成或超时后，干净退出。
- **`--dry-run`**：只打印将要处理的批（词列表和 hash），不调用，不写库。
- **`--pilot`**（20 词试点用，配合 `--limit 20 --words <list>`）：
  - 正常调用并入库，但**不批准任何内容**。
  - 结束时在 `app/qa/ai-pilot/<上海时间戳>/` 写：
    - `summary.md`：每批的词、批大小、耗时（ms）、重试次数、退出码、通过、标记、拒绝、降级的数量，以及总耗时和平均每词耗时。
    - `batch-<n>.raw.json`：原始输出。
    - `batch-<n>.validated.json`：校验后每个块的 status 和 flags，拒绝的原因。
    - `samples.md`：每个词按界面块的顺序排好的可读样例，供用户和领域研究看。
  - 终端打印每批耗时一行。
  - 支持 `--batch 1|5|10`，方便试点时比较。

### 5.3 审核和批准（`scripts/ai-review.ts`）
- `sample --job <id>|--since <ISO>`：按内容规格第 6 节的抽样规则生成抽查表 `app/qa/ai-review/<时间戳>.md`，加一份同名 CSV。列为：word_id、词、kind、content_id、内容、判定（空）、错误类型（空）、核对来源（空）、日期（空）。抽样用固定种子，并把种子写进表头。
- `apply --sheet <csv>`：读填好的判定，“错”的设 `hidden_at` 和 `hidden_reason`，“对”的批准。
- `approve --job <id>`：只把该批 `generated` 状态、`hidden_at IS NULL` 的块设为 `approved`，写 `approved_at`。**`review` 状态（含全部词源、有标记的块）必须逐条在 `apply` 里判“对”才批准**，不能被批量批准。
- `hide --content <id> --reason <text>`、`stats`（各状态、各 kind 的数量，以及覆盖率：有至少一块 approved 的词数 / 1600）。
- 所有命令都要 `--db <path>`。默认只打印将要做的改动，加 `--yes` 才写库。

### 5.4 接口
- `GET /api/word/:id/content`：
  - 只返回 `approved` 且 `hidden_at IS NULL` 的块；同一 kind 取最新一条。
  - 结构：`{ status: 'ready'|'pending', blocks: [{ id, kind, body, flags, label }] }`，块按规格第 7 节的顺序。
  - 近义、反义、同根词、相关词的每个词附 `inList` 和 `learned`；`learned` 在请求时按卡片状态计算，不存库。
  - 没有任何块时返回 `{ status:'pending', blocks:[] }`。
  - 不写库。
- `POST /api/content/:contentId/feedback { reason }`：
  - `reason` 只能是“例句不通 / 意思不对 / 太难 / 其他”之一。
  - 写 `content_feedback`：word_id、content_id、kind、`content_version = model/prompt_version`、reason。同时设该块的 `hidden_at` 和 `hidden_reason='feedback:<reason>'`。
  - 返回 `{ ok:true }`。对已隐藏的块重复提交，返回 ok，不重复写行。
- 内容接口出错（例如表不存在、JSON 坏了）时，返回 pending，**绝不影响 `/api/next`、`/api/review` 等学习接口**。要有测试：word_content 里放一行坏 JSON，学习流程照常。

### 5.5 讲解区界面（必须对照视觉稿）
- 新组件 `components/ExplainPanel.vue`，**按 design-notes 第 10 节和三张截图实现**。
  - 位置：认词卡翻面后，放在释义下面、评分按钮上面；拼写和听写答完后，放在反馈条下面；单词详情页里也用它。选择题答完后不显示（保持第一期的界面）。
  - 每块用 `<details>`，顺序固定。默认展开例句和搭配；拼写/听写答完后只展开例句；折叠时右侧显示一行预览。展开状态存 localStorage。快捷键 E 全部展开或收起（输入框聚焦时不响应）。
  - 讲解区标题旁的总标签“AI 生成 · 可能有误”；每块右下角“这条有问题”，点开出 4 个选项。提交后该块隐藏，原位显示“已记下，这条先不再出现。”
  - 词源框和联想框的样式、文字，严格照稿子；联想框里写“不是词源”。降级来的联想（`downgraded_from`）同样按联想显示。
  - 近义/反义做成小卡片，显示“已学”和“课标外”；发音只有文字，不显示 AI 给的音标，**讲解区里没有任何播放按钮或音频**。
  - pending 状态：显示“讲解还在准备”和 `内容.md` 定稿句“这个词的例句还没生成，先看释义和发音。”，不转圈，不显示错误。
  - 手机上评分按钮吸底（`position: sticky`）。
- 讲解区只用来展示：加载不能挡住评分（评分按钮不要等内容请求返回）；请求失败按 pending 处理。
- 文案：design-notes 第 10 节列出的新文案，加上本书 3.2 和 4.3 节的新句子，全部放进 `copy.ts`，加新键。

## 6. 词形导入
- `scripts/import-forms.ts --db <path> --ecdict <csv>`：对每个 kb2022 词，按 ECDICT `exchange` 解析，格式 `p:went/d:gone/i:going/3:goes/s:...`，写入 `word_forms`，用 `INSERT OR IGNORE`，幂等。
- 短语词头不导入。
- 没有 `--ecdict` 或文件不存在时报错退出，不改库。
- 测试用一个只有 5 行的 fixture CSV。

## 7. 第一期界面不回退
- 首页、学习、错词本、完成页、家长页的现有测试全部保持。
- 新增的“词表”标签、搜索框**不出现在**学习页和 `/parent`；孩子页面里仍然不能出现 `/parent`。

## 8. 测试（`npm test`、`npm run typecheck`、`npm run build` 都必须通过）

新增测试文件：`test/p2-migration.test.ts`、`content-validate.test.ts`、`ai-pipeline.test.ts`、`ai-review.test.ts`、`search.test.ts`、`browse.test.ts`、`freq.test.ts`、`explain-ui.test.ts`。至少覆盖：

- **迁移**：
  - 在第一期结构的库上（可用 b4429a2 fixture 加第一期迁移）跑第二期迁移，旧表旧列逐行不变，可重复执行。
  - `verify-migration` 输出包含新表。
- **校验**：内容规格第 5 节每一条规则都有正例和反例。重点：
  - 例句词形匹配：went、studies、stopped、bigger，以及短语词头。
  - 词源降级：confidence 不是 high，或 parts 对不上词头。
  - 联想里出现“来自拉丁语”要拒绝。
  - URL、音频字样、禁用说法要拒绝。
  - 课标外近义词标记，并且每块最多留 1 个。
  - syllables 拼起来要等于词头。
- **流水线（FakeRunner）**：
  - 命令参数：每次都含 `-m gpt-6-luna`，`stdio[0]` 是 `'ignore'`，含 `-C <HOME>/dev/vocab-saas`，不含 `-c`、`--config`、`config.toml`、`dangerously`。
  - 源码检查：`server/src/ai/` 和 `scripts/ai-*.ts` 里不出现 `.codex/` 路径的写操作。
  - 同一批输入跑两次，第二次 0 次调用。
  - 释义改了，只重跑这个词。
  - 坏 JSON 时重试 1 次就停：attempts=2，status=failed，不发第 3 次调用。
  - 遗留的 running 标成 unknown，不重提；`--reconcile` 能从输出文件入库。
  - 超时会被杀掉，并记录 error。
  - 锁文件防止两个实例同时跑。
  - `--dry-run` 不写库。
  - `--pilot` 生成 summary.md、samples.md 和每批的 JSON，summary 里有每批耗时；pilot 不批准任何内容。
- **审核**：`approve` 不批准 review 状态的块；`apply` 按表处理；抽样数量符合规格第 6 节，同一种子结果相同。
- **zk_freq**：`basis_zh` 里含数字或“真题出现”要拒绝；rank 的生成规则正确；`is_inferred` 必须是 1。
- **daily_high**：用 fixture ecdict 验证 frq、bnc、无数据三种情况的 rank、basis、is_inferred，重跑结果相同。
- **查词和浏览**：英文、中文、词形（went→go）、弯引号都能查到；排序正确；对 kb2022 的 1600 词，用词头逐个查，全部能找到（可用测试库造 1600 个假词）；**查词、看详情、浏览、看讲解都不产生 review_logs，也不写任何表**（全表 hash 对比）；筛选组合正确。
- **内容接口**：只返回 approved 且未隐藏的块；反馈后隐藏，重复提交幂等；坏数据返回 pending，学习接口不受影响。
- **前端**：
  - ExplainPanel 的 SSR 渲染：块顺序正确，空块不显示，联想框里有“不是词源”，讲解区没有 `<audio>` 或播放按钮，pending 文案正确。
  - 推断标签会显示。
  - 搜索框不出现在 StudyView。
  - `COPY` 的新键都有值。

## 9. 交付
- 结束时写 `app/qa/v3-phase2-codex-report.md`，最终回复里给出同样的内容，包括：
  - 改了和新增了哪些文件，各做了什么；
  - 新增测试列表；
  - `npm test`、`typecheck`、`build` 的结果；
  - 新文案原文；
  - 假设；
  - 没做或没验证的事项。
- 预计改动：
  - 服务端：`server/src/db.ts`、`app.ts`、`study.ts`（抽出状态函数），新增 `server/src/content-validate.ts`、`content.ts`、`search.ts`、`freq.ts`、`learn-order.ts`、`ai/codex-runner.ts`、`ai/pipeline.ts`、`ai/prompts.ts`、`ai/schema.ts`。
  - 脚本：`scripts/ai-generate.ts`、`ai-review.ts`、`import-forms.ts`、`freq-daily.ts`、`freq-zk-rank.ts`。
  - 前端：`web/src/components/ExplainPanel.vue`、`SearchBox.vue`，`views/WordView.vue`、`BrowseView.vue`。
  - 其他：`.gitignore`。
- **本期不做**：
  - 真题语料统计；按教材单元浏览；音频（包括讲解区里的任何播放）；
  - 实际调用模型、试点运行、全量生成；
  - AI 易混词做干扰项（第三期）；登录、PIN。

## 10. 运行后由工程负责人做（不归你）
- 复核、提交、18425 测试实例、截图对照视觉稿。
- 用户确认后，在 Studio 跑：
  1. `import-forms`、`freq-daily`；
  2. `ai-generate --pilot --limit 20 --words <20 个词>`，分别用 `--batch 1/5/10` 比较；
  3. 把 summary.md、samples.md 交用户和领域研究；
  4. 定下批大小后再全量跑。
- 前后比对 `~/.codex/config.toml` 的 sha256。

## 11. 调研：“中考高频”有没有可靠的公开来源（工程负责人，2026-10-17 上海时间）

结论：**没有找到可以直接引用的、方法和数据都公开的全国中考词频表**，所以 `zk_high` 本期一律标「推断」。“日常高频”有可靠来源（ECDICT 的 frq/bnc）。

- ECDICT（https://github.com/skywind3000/ECDICT ，2026-10-17 查看）：`frq` 是当代语料库（COCA）词频顺序，`bnc` 是 BNC 词频顺序，数值越小越常用；0 表示没有数据（见 issue #57：https://github.com/skywind3000/ECDICT/issues/57 ）。
  - `tag` 里的 `zk` 只表示“属于中考大纲词汇”，**不是频率**，不能用来排中考高频。
- 学术研究只有局部样本，没有可用的词表：
  - 陕西 2020–2024 年中考听力的词块研究，5 份试卷、2915 词，统计的是词块不是单词（http://ojs.s-p.sg/index.php/jxffcxysj/article/viewFile/25177/pdf ）。
  - 广州 116 套与全国 200 套的完形选项词频对比，是网文，原始数据没有公开（https://sjds.net/727200.html ）。
- 网上流传的“中考高频词汇表”都是文档分享站上的付费文档，统计方法和语料不可核实，版权不明，**不能当可靠来源**。例如：
  - https://m.renrendoc.com/paper/504055869.html （自称统计“近 10 年各省市真题”）
  - https://max.book118.com/html/2026/0523/6212101050012140.shtm （自称统计“700 余套真题”）
- 自己统计的路径：用真题原卷文本统计词频，在技术上可行（参见 https://blog.csdn.net/m0_66450607/article/details/140676204 ，北京 2012–2022 年）。但网上的真题合集多来自网盘转存，来源和授权都不清楚，本期不做；如果用户能提供来源清楚的真题文本，第三期可以加上 `source='真题语料'`、`is_inferred=0`。

## 12. 运行前要用户确认的问题
1. 查词、词表页没有视觉稿。要先出稿给你看（建议），还是让 Codex 按现有组件风格直接做、做完再截图看？
2. 中考高频由 gpt-6-luna 给每个词打 1–5 分，再推出排序，整组标「推断」并写明“不是真题统计”。这样可以吗？还是暂时只做“日常高频”，中考高频等有真题来源再说？
3. 试点的 20 个词：默认取孩子接下来要学的 20 个（按 learnOrder），另外加入 receive、accept、whether 这三个稿子里核对过的词。要换成你指定的词吗？
4. 生成内容的上线方式：流水线在 Studio `~/dev/vocab-saas` 的库副本上跑，审核通过后再导入正式库。导入工具和上线步骤需要另批（`~/apps/vocab` 现在禁止触碰）。本期先不做导入工具，可以吗？
