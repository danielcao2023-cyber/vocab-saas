# Codex 任务书：背单词 v3 第一期（选择题、错词本增强、家长看板、打卡、视觉改版）

> 起草：工程负责人，2026-10-17 13:10（上海时间）。范围已获用户批准（Grok Bot 12:58 转达）。**视觉部分以用户确认后的 `v3/design/` 为准；视觉稿未确认前不运行本任务书。**
> 基线：app 仓库 `b4429a2`，分支 `feat/v3-phase1`（由工程负责人建好，你不要建或切分支）。
> 依据：`v3/方案.md`（1.2、1.3、1.4、1.6 节和 4 节第 1 期验收标准）、`v3/design/design-notes.md`、`v2/内容.md`（文案语气）。

## 0. 工作目录与硬性限制（先读）

```
~/dev/vocab-saas/
  app/                     ← git 仓库（feat/v3-phase1），所有代码改动只在这里
  v2/内容.md               ← 只读（test/copy.test.ts、test/meaning.test.ts 会读 ../v2/内容.md）
  v3/方案.md               ← 只读
  v3/design/               ← 只读：视觉稿 HTML、design.css、design-notes.md、shots/*.png
  v3/codex-brief-phase1.md ← 本文件，只读
```
限制：
- **只改 `app/` 下的文件**。不要写 `~/dev/vocab-saas` 以外的任何位置，也不要读它以外的文件（Node/npm 运行时自身除外）。尤其不要碰 `~/apps/vocab`、`~/.codex`、`~/.ssh`、Tailscale、任何 wiki 或插件目录。
- 不要 `git commit`、`git push`、`git checkout`/`switch`/`branch`/`stash`/`reset`。改动留在工作区，由工程负责人审核后提交。
- **不装任何依赖，不改 `package.json` 和 `package-lock.json`**。`node_modules` 已装好；不需要也不许联网（不许 curl、npm install、npx 下载任何东西）。不要引入新的 npm 包（包括 vue-router、图表库、CSS 框架、字体包）。
- 不读取、打印或写入任何密钥、令牌、环境变量里的凭据。
- 不在 `app/data/` 下创建或修改 `.db` 文件。测试用 `:memory:` 或 `os.tmpdir()` 下的临时文件，用完删掉。
- 不启动监听端口的服务（不运行 `npm start`/`npm run dev`）。接口测试用 `buildApp(db).inject(...)`。
- 所有命令在 `app/` 下运行：`npm test`、`npm run typecheck`、`npm run build`（build 会写 `dist/`，已被 .gitignore 忽略，可以）。
- **数据库迁移只能加不能改**：只能加列（`addColumn`）、加表（`CREATE TABLE IF NOT EXISTS`）、加 settings 新键（`INSERT OR IGNORE`）。不许 `UPDATE`/`DELETE` 已有的 words、cards、review_logs、wrong_words、settings 行，不许改已有表的 `CREATE TABLE` 文本（新列一律走 `addColumn`，保证新库和迁移后的旧库结构一致），不许 `DROP`、重建表或改列类型。

## 1. 现状（读懂这些再动手，行号以 b4429a2 为准）

- `server/src/db.ts`：`SCHEMA`（7–71 行）建表；`addColumn()`（73 行）；`openDb()`（78 行）里做轻量迁移（95–102 行）。表：`words`（level 为 `三级`=核心 1095 / `二级` 505，priority 2/1）、`cards`（mode: recognize/spell/dictation，FSRS 字段）、`review_logs`（rating, state, due, stability, … , review_at, duration_ms, answer, correct, answer_id）、`wrong_words`（wrong_count, last_wrong_at, correct_days JSON 数组, removed_at）、`settings`（new_per_day=10, review_limit=200, level2_every=5）。`openDb(file, {dryRun})` 在导入试运行时对内存副本执行迁移，你的迁移必须在内存副本上也能跑。
- `server/src/time.ts`：`shDay(d)` 上海日期字符串，`shDayStart(d)` 上海 0 点。所有“哪一天”的判断都用它们。
- `server/src/study.ts`：
  - `queueState()`（52 行）首页计数和出卡共用；`DUE_WHERE`（45 行）；`newIntroducedToday()`（36 行）数今天 `state=New` 的认词卡日志；`reviewedToday()`（47 行）数今天 `state<>New` 的日志，用于 `review_limit`。
  - `nextCard()`（67 行）：先到期复习再新词；`fresh()` 按 priority 穿插（level2_every）。
  - `addWrong()`（92 行）：wrong_count+1、correct_days 清空、removed_at 置空。
  - `markCorrectForWrong()`（99 行）：任何非 Again 评分都把今天加入 correct_days，≥3 个不同日子就移出。
  - `review()`（108 行）：幂等键 answer_id；FSRS 计算（`scheduler`，`enable_fuzz:false`）；写 cards 和 review_logs；Again→`addWrong` 否则 `markCorrectForWrong`；认词卡第一次学过后建 spell/dictation 卡（明天 0 点到期）。
  - `checkSpelling()`（161 行）：对=Good，用提示=Hard，错=Again。
  - `progress()`（172 行）四档掌握度：新词 / 学习中（学习、重学或稳定度<7）/ 熟悉（7–21）/ 掌握（≥21）。
  - `wrongList()`（185 行）、`setWrong()`（191 行）、`wrongPractice()`（197 行，只返回认词卡）。
- `server/src/app.ts`：路由 `/health`、`/version`、`/api/today`、`/api/next`、`/api/review`、`/api/check`、`/api/progress`、`/api/wrong`、`/api/wrong/practice`、`POST /api/wrong/:wordId`；非 `/api` 的未知路径回 `index.html`（所以 `/parent` 已经能拿到前端页面）。
- `web/src/App.vue`（301 行，单文件，全部视图和样式都在里面）、`MeaningList.vue`（义项显示：人工释义全显示，ECDICT 显示 2 行其余折叠）、`senses.ts`、`copy.ts`（定稿文案）、`api.ts`（`api()`、`speak()` 用浏览器朗读 en-US 0.9）、`pending.ts`（断线补存，幂等键）。
- 测试：`test/*.test.ts` 共 10 个文件，全部必须继续通过。只有第 9 节列出的结构性断言允许改写。

## 2. 数据库迁移（server/src/db.ts）

在 `openDb()` 里追加（顺序无所谓，必须幂等）：
1. `review_logs` 加 3 列，全部可空，旧记录保持 NULL：
   - `qtype TEXT`：`flip`（翻面自评）/ `listen_choice`（听音选义）/ `meaning_choice`（看义选词）/ `spell` / `dictation`。旧记录 NULL 时按卡片 mode 推断（recognize→flip）。
   - `counted INTEGER`：1 = 计入 FSRS 调度；0 = 只记日志（见 4.3）。NULL = 旧记录，视同 1。
   - `context TEXT`：`study` / `practice`。NULL = 旧记录，视同 study。
2. 新表：
   ```sql
   CREATE TABLE IF NOT EXISTS question_issues (
     id INTEGER PRIMARY KEY, card_id INTEGER NOT NULL REFERENCES cards(id),
     qtype TEXT NOT NULL, context TEXT NOT NULL DEFAULT 'study',
     options_json TEXT NOT NULL,          -- 按显示顺序的 word_id 数组，长度 4
     answer_word_id INTEGER NOT NULL, issued_at TEXT NOT NULL,
     answered_at TEXT, chosen_word_id INTEGER, answer_id TEXT);
   CREATE TABLE IF NOT EXISTS daily_stats (
     day TEXT PRIMARY KEY,                -- 上海日期 YYYY-MM-DD
     new_count INTEGER NOT NULL, review_count INTEGER NOT NULL, practice_count INTEGER NOT NULL,
     answers INTEGER NOT NULL, correct INTEGER NOT NULL, duration_ms INTEGER NOT NULL,
     mastered_new INTEGER NOT NULL, completed INTEGER NOT NULL, completed_at TEXT, computed_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS streak_makeups (day TEXT PRIMARY KEY, used_at TEXT NOT NULL);
   ```
   `daily_stats` 必须能由 review_logs（+ cards、settings）完整回算，删表重算结果相同；`streak_makeups` 是用户操作，不能回算，所以单独一张表。
3. settings 新键（`INSERT OR IGNORE`，不动已有键）：`choice_enabled=1`、`choice_weights=1,1,1`（flip,listen_choice,meaning_choice 的权重）、`makeup_per_month=2`、`makeup_window_days=7`、`duration_cap_ms=300000`。
4. `openDb()` 末尾调用 `recomputeDailyStats(db)` 回算所有有日志的日子（只写 daily_stats）。

## 3. 选择题：认词卡的一种出题方式（server/src/quiz.ts 新文件 + study.ts + app.ts）

规则（用户已定）：**不新建卡片，每日量不变**。认词卡到期时随机用 `flip / listen_choice / meaning_choice` 之一呈现；选对 = Good，选错 = Again（自动进错词本）；**服务端判对**。拼写、听写卡不变。
- `pickQtype(card, rng, settings)`：`state=New` 的认词卡（第一次见）永远 `flip`；其他认词卡按 `choice_weights` 加权随机；`choice_enabled=0` 时永远 `flip`；干扰项凑不齐 3 个时退回 `flip`。`rng` 可注入，测试用固定种子。
- `buildQuestion(db, card, qtype, rng)` 选 3 个干扰项：
  - 候选池：同 `source` 的词，`meaning_zh` 非空；示例词只和示例词配。
  - 排除：与答案主词头小写相同（`Miss`/`miss`）；选项显示文本规范化后与其他选项重复；**同义**——取答案和候选前 2 行释义，去掉词性前缀和括号内容，按 `[,，;；、]` 切成中文义项集合，有任一义项相同就排除（双向）。
  - 优先：同词性（第一行开头的词性，`vt./vi./v.` 视为同一类），词形相近（小写词头编辑距离小、首字母相同、长度差 ≤2 加分）；从得分最高的约 12 个里随机挑 3 个；同词性不够时放宽词性。
  - `listen_choice`：选项文本 = 各词 `meaning_zh` 第一行；题面只播答案发音，**界面不显示答案词头**。
  - `meaning_choice`：题面 = 答案 `meaning_zh` 前 2 行（人工释义全显示，沿用 MeaningList 规则）；选项文本 = 各词头。
  - 4 个选项用 rng 打乱，写入 `question_issues`。
- **刷新不变题**：`/api/next` 返回某张认词卡时，如果该卡有今天（上海日期）发出、尚未作答、context 相同的 question_issue，就原样复用（同题型、同选项顺序）。
- `/api/next` 返回 `{ card, question }`，`question` 为 `null`（flip、拼写、听写）或 `{ id, qtype, prompt?, options: [{ wordId, text }] }`。卡片仍返回 headword 等字段（发音要用）。
- 新接口 `POST /api/answer { questionId, choiceWordId, durationMs?, answerId }`：
  - 校验题目存在；`answerId` 重复时返回第一次的结果（`duplicate:true`），不重复记日志；题目已作答而 answerId 不同时 409。
  - `correct = choiceWordId === answer_word_id`；`review(db, cardId, correct ? Good : Again, now, { qtype, context, answer: 所选词头, correct, answerId, durationMs })`；回写 `answered_at/chosen_word_id/answer_id`。
  - 返回 `{ ok, correct, answerWordId, chosenWordId, expected: { headword, phonetic, meaning_zh, meaning_source }, chosen: { headword, meaning_first_line }, due, duplicate }`。
- `POST /api/review`（flip）和 `POST /api/check`（拼写/听写）同样写入 `qtype`（flip / spell / dictation）和 `context`（请求体可带 `context:'practice'`，缺省 study）。
- `review()` 签名扩展 `extra.qtype / extra.context`，其余行为不变。

## 4. 错词本增强（study.ts + app.ts）

### 4.1 列表 `GET /api/wrong?sort=count|recent`
- `count`（默认）：`wrong_count DESC, last_wrong_at DESC`；`recent`：`last_wrong_at DESC`。
- 每项加 `fails: { flip?: n, listen_choice?: n, meaning_choice?: n, spell?: n, dictation?: n }`：该词所有卡片的答错日志（`correct=0` 或 `rating=1`）按 qtype 计数，旧日志 qtype 为 NULL 时按卡片 mode 推断。
- 加 `correct_days`（数字，已有）、`last_wrong_at`（ISO，前端显示“今天/昨天/N 天前”）。
- 汇总：`{ items, total, practicedTwiceThisWeek }`（本周=上海时间周一 0 点起，correct_days 里落在本周的天数 ≥2 的词数，对应文案“其中 N 个本周已练对 2 次”）。

### 4.2 混合题型练习 `GET /api/wrong/practice?sort=…`
- 取前 10 个词。每个词：按“最近一次答错”排列它错过的题型；以 70% 概率出最近错过的题型，30% 在可用题型里均匀随机（`spell/dictation` 只有对应卡已存在时可用；选择题凑不齐干扰项时不可用）。从没有题型记录的词，在 flip/listen_choice/meaning_choice 里随机。
- 返回 `{ items: [{ card, question }] }`，选择题当场发 question_issue（context=practice）。前端依次出题，提交时带 `context:'practice'`。

### 4.3 当天重复练习只让第一次计入 FSRS
- 在 `review()` 里：`context='practice'` 且这张卡**今天（上海日期）已有 counted≠0 的日志**（不管来自学习还是练习）时，这次只记日志：插入 review_logs，`counted=0`，state/due/stability/difficulty/elapsed_days/scheduled_days 填**卡片当前值**，cards 表不更新。
- 其他情况 `counted=1`，正常走 FSRS。`context='study'` 的学习步（同一天多次）照常全部计入。
- `counted=0` 的日志不算进 `reviewedToday()`（不占 review_limit），也不算进 `newIntroducedToday()`。
- 错词本记账（addWrong / 毕业计数）对只记日志的答案照常进行。

### 4.4 自动毕业规则
**现行逻辑（已读代码确认）**：同一个词任何卡（认词/拼写/听写）的任何非 Again 评分（含「模糊」和用了提示的拼写，Hard）都把当天（上海日期）加入 correct_days；集满 3 个不同日子就移出；任何一次 Again 都清空重来；3 天不要求日历上连续。手动“放回错词本”也走 addWrong，会让 wrong_count +1。
**本期改为（工程提议，待用户确认；请把判断集中在一个函数 `countsTowardGraduation(rating)` 里，方便改回）**：
1. 只有 Good/Easy 计入 correct_days；Hard 既不计入也不清空。
2. 只记日志的练习答案（counted=0）同样计入（每天最多算一天，本来就按日期去重）。
3. 手动放回错词本（`POST /api/wrong/:id {inBook:true}`）不增加 wrong_count，只把 removed_at 置空、correct_days 清空。
4. 仍然是“3 个不同日子、中间答错就清零”，不要求连续日历日。

## 5. 打卡与连续天数（server/src/stats.ts 新文件）

- **一天的界限是上海时间 0 点**（`shDay`）。
- `recomputeDailyStats(db, days?)`：从 review_logs 回算每天：
  - `new_count`：认词卡 `state=New` 且 counted≠0 的日志数；`review_count`：`state<>New` 且 counted≠0；`practice_count`：counted=0；`answers`：全部日志；
  - `correct`：`correct` 列非空时取它，否则 `rating>1`（和现在完成页的算法一致）；
  - `duration_ms`：每条 `min(duration_ms, duration_cap_ms)` 求和，NULL 记 0；
  - `mastered_new`：当天有认词卡的稳定度从 <21 跨到 ≥21 的数量（复习后的稳定度 = 同卡下一条日志的 stability，没有下一条就取 cards.stability）；
  - `completed`：见下；幂等，重复运行结果相同。
- **完成今日任务（打卡）**：以“当天最后一条 counted≠0 日志的时刻 T”判断——在 T 时刻**没有到期复习**（按 `DUE_WHERE` 和 review_limit 的口径）且**新词额度已用完或已无未学词**，即 `completed=1, completed_at=T`。T 时刻的卡片状态由日志重建：某卡在 T 时的 due = T 之前最后一条日志的下一条日志的 `due` 字段（ts-fsrs 的日志 `due` 是复习前的到期时间），没有下一条就用 cards.due；拼写/听写卡从该词第一次认词卡日志的时刻起存在，初始 due = 那一天的上海次日 0 点。额度用当前 settings。
  - 写一个 `queueStateAt(db, T)`，并用测试证明：在任意随机历史上，`queueStateAt(db, now)` 与现有 `queueState(db, now)` 结果一致。
  - 每次 `review()` / `/api/answer` 成功后重算当天那一行（这样“刚做完”立刻打卡）。
- `GET /api/streak?month=YYYY-MM`（缺省本月）：
  - 计入连续的日子 = `completed=1` 或在 `streak_makeups` 里。`current`：今天已完成就从今天往回数，否则从昨天往回数；`best`：历史最长。
  - `calendar`：该月每天 `{ day, status: done|makeup|missed|today|future|before_start }`（第一次有日志之前的日子为 before_start）。
  - `badges`：`[7, 30, 100]` 各 `{ days, earned: best>=days, progress: min(current, days) }`。
  - `makeupLeft`：本月（按被补的那一天所在月份）还剩几次 = `makeup_per_month` − 已用；`makeupCandidates`：可补的日子。
- `POST /api/streak/makeup { day }`：条件全部满足才写入，否则 400 并给出原因：该日 < 今天、未完成、不早于第一次有日志的日子、在 `makeup_window_days`（7）天内、该日所在月份补签次数 < `makeup_per_month`、**今天已完成今日任务**（补签作为“今天多做了”的奖励，【待确认】）。
- `/api/today` 增加 `completed`（今天是否已打卡）和 `streak`（current）。

## 6. 家长看板（`GET /api/parent/summary?days=30` + 前端 `/parent`）

只读，不写任何表（daily_stats 由别处维护；这个接口只在需要时重算今天那一行）。返回：
- `daily`：近 N 天每天 `{ day, new, review, practice, answers, correct, accuracy, durationMs, completed, makeup }`；
- `totals`：学习天数（answers>0）、总用时、正确率、近 7 天和本周（周一起）的学习天数/分钟/新学/新掌握；
- `streak`：current、best、本月补签次数；
- `wrongTop20`：按 wrong_count 降序（含已移出错词本的词，标 `inBook`），每项 `{ headword, wrong_count, last_wrong_at, topQtype, inBook }`；
- `progress`：课标词表按 `level` 分开：`core`（三级，1095）和 `level2`（二级，505），各自四档（复用 progress() 的口径）；
- `generatedAt`（ISO）。
前端 `/parent`：`App.vue` 按 `location.pathname` 判断，`/parent` 渲染 `ParentView`，**孩子的导航和任何孩子页面里都不出现 `/parent` 链接或文字**。不加 PIN。

## 7. 前端：按确认后的视觉稿重做（web/src）

**必须实现 `~/dev/vocab-saas/v3/design/` 里已确认的视觉稿**：先读 `design-notes.md`，再对照 `shots/*.png` 和对应的 HTML。颜色、字体栈、间距、圆角、阴影、动效全部取自 `design.css` 的变量；把它搬成 `web/src/styles/tokens.css`（变量）和 `web/src/styles/app.css`（组件样式），不要再引入别的颜色。只用系统字体，不引用任何外部 CDN 或网络资源。

| 视觉稿 | 实现 |
|---|---|
| home.html（home-desktop / home-mobile） | `views/HomeView.vue`：今天一句话（保持 `今天：复习 N 个 · 新词 N 个 · 约 N 分钟`，数字主色）、`COPY.homeRelearnNote`、开始复习/先学新词、和上周比（上周无数据就不显示）、课标进度（核心/二级分开）、错词本小卡、打卡日历 + 补签 + 徽章（`components/StreakCalendar.vue`）。 |
| card-front / card-back / card-back-ecdict | `views/StudyView.vue` + `components/RecognizeCard.vue`：进度条（本轮已做/本轮预计）、题型标签、核心/二级标签、`COPY.repeatCard`、衬线大字、发音按钮、翻面、MeaningList、四档自评按钮（1–4）。 |
| q-listen / q-meaning-correct / q-meaning-wrong | `components/ChoiceQuestion.vue`：2×2 选项（手机一列），A–D 标签 + 1–4 快捷键，R 重听；提交后按服务端结果标绿/红/变淡，反馈条：对“正确 ✓ + 词头 音标 第一义项”，错“应为 B：whether 是否。已加入错词本。”+“你选的 X：…”；“下一个（Enter）”。 |
| spell.html | 拼写/听写卡：大输入框；答错显示“差一点”和字母级对比（`web/src/diff.ts` 的 `charDiff(typed, expected)`，纯函数，带测试）。保留 Tab 提示首字母、断线补存提示和“再试一次”。 |
| wrong.html / empty.html | `views/WrongView.vue`：排序切换（按错的次数 / 最近错的）、每词错在哪种题型、`N/3 天` 进度、最近错的时间、移出按钮、“练这 N 个”；空状态插图和文案。 |
| done.html | `views/DoneView.vue`：今日完成/已打卡（`completed` 为真时），否则沿用“这一轮没有更多到期的卡了”。 |
| parent.html | `views/ParentView.vue`：顶栏“学习看板 · 家长 · 只读”、一句话周报、4 个指标、30 天堆叠柱状图（纯 CSS/内联 SVG，不加图表库）、正确率折线、错词 Top 20、课标进度、说明。 |
- 手机（≤640px）底部标签栏，桌面顶部导航；学习页不显示导航。
- 动效按 design-notes 第 5 节；`prefers-reduced-motion` 时关闭。答错不抖动。
- 文案：现有 `COPY` 里的定稿句子原样保留；视觉稿里的新句子集中放进 `copy.ts`（新键），方便内容制作审阅。不要自己发明稿子里没有的文案；必须新增的（如错误提示）在交付说明里列出。
- 现有行为必须保留：断线补存（PendingSubmitter、幂等键、“这张没存上，连上后会自动补存”“再试一次”）、4xx “页面过期了，刷新一下再继续/刷新”、离线横幅、示例数据横幅、无音标不显示音标行、人工释义全显示、ECDICT 折叠、快捷键表（? 键）。
- 可以把 App.vue 拆成多个组件；不要引入 vue-router，用一个简单的 view 状态 + pathname 判断。

## 8. 每日量不变（必须有测试证明）

同一份种子历史分两份库：一份 `choice_enabled=1`，一份 `=0`，用同样的 now 序列和“全答对”的作答脚本跑完一天：两边 `todaySummary()` 每一步的 review/new 计数相同、当天出过的卡集合相同、review_logs 条数相同。

## 9. 测试（全部在 `app/` 下：`npm test`、`npm run typecheck`、`npm run build` 都必须通过）

新增 `test/v3-migration.test.ts`、`test/quiz.test.ts`、`test/wrongbook.test.ts`、`test/stats.test.ts`、`test/parent.test.ts`、`test/diff.test.ts`，至少覆盖：
- **迁移不改旧数据**：在临时文件里用 b4429a2 的建表语句（把 b4429a2 `SCHEMA` 和 95–102 行迁移后的结构原样存成 `test/fixtures/schema-b4429a2.sql`）建库，造 3 个词、跨 10 天的随机历史（cards、review_logs 含 answer_id、wrong_words 含已移出的），对 words/cards/review_logs/wrong_words/settings 全部列做快照；用新的 `openDb()` 打开两次；旧列逐行逐字段完全相同（每张卡的 due 不变），review_logs 新列全为 NULL，settings 旧键值不变、新键存在，daily_stats 已回算，`PRAGMA integrity_check` 为 ok。
- `scripts/verify-migration.ts --db <path>`：把指定库**复制**到临时目录（`serialize()` 或 backup，不写原文件），在副本上跑 `openDb()`，输出 JSON（各表行数前后、旧列逐行比对是否完全一致、新增列/表、daily_stats 行数、integrity_check）。拒绝以写方式打开原文件；有测试证明原文件字节不变。
- 选择题：New 认词卡永远 flip；权重和种子固定时三种题型都会出现；`choice_enabled=0` 只出 flip；干扰项 3 个、不重复、不同义、不含同词头大小写变体、恰好一个正确；凑不齐时退回 flip；刷新（再调 /api/next）题目和选项顺序不变；`/api/answer` 服务端判对：对→Good，错→Again 且进错词本；answerId 重复只记一次；已答题换 answerId 返回 409；日志 qtype/context 正确。
- 错词本：两种排序；fails 按题型计数（含旧日志 NULL 推断）；混合练习优先错过的题型（固定种子下统计）；当天第二次练习 counted=0 且 cards 不变、不占 review_limit；毕业规则 4.4 的 1–4 条。
- 打卡：跨上海午夜（UTC 15:59 / 16:00）归属正确；完成今日任务当天 completed=1，未完成为 0；连续天数 +1；删掉 daily_stats 重算结果完全相同；`queueStateAt(now) == queueState(now)`（随机历史多组）；补签各条件（次数用完、超出 7 天、今天未完成、早于开始日、已完成的日子）都被拒；里程碑 7/30/100。
- 家长页：与手工 SQL 统计逐项一致（抽 3 天）；接口不写库（调用前后除 daily_stats 今天那一行外，各表数据不变）；`wrongTop20` 最多 20 条；核心/二级分开。
- 前端：`charDiff`；`COPY` 新键都有值；孩子侧组件源码里不含 `/parent`。
- **允许改写的旧断言（只有这些）**：`test/meaning.test.ts` 里 “`<MeaningList ` 恰好 3 次” 和 “`class="phon"` 恰好 2 个”、`test/copy.test.ts` 里 “App.vue 含 `{{ COPY.repeatCard }}` / `{{ COPY.homeRelearnNote }}`、不含 alert/confirm”——因为组件拆分，改成扫描 `web/src/**/*.vue`：每个 `<MeaningList` 都带 `:source=`、每个 `class="phon"` 都带 `v-if` 判断音标、两句定稿文案都被渲染、全部 .vue 都不含 `alert(`/`confirm(`。改写处加注释说明原因。其他已有断言不许改。

## 10. 交付

- 结束时在 `app/qa/v3-phase1-codex-report.md` 写说明，并在最终回复里给出同样内容：改了哪些文件、各自做了什么；新增测试列表；`npm test`、`npm run typecheck`、`npm run build` 的结果摘要（贴通过/失败数，不许编造）；新增文案清单；没做到或有疑问的地方。
- 预计改动：`server/src/db.ts`、`study.ts`、`app.ts`，新增 `server/src/quiz.ts`、`server/src/stats.ts`、`scripts/verify-migration.ts`；`web/src/App.vue`、`copy.ts`、`api.ts`，新增 `web/src/views/*`、`web/src/components/*`、`web/src/styles/*`、`web/src/diff.ts`；`test/` 下新增和第 9 节允许的改写；`README.md` 功能段落更新。超出范围的改动要在说明里给理由。
- 不做：查词/浏览、高频分组、AI 生成（第二期）；登录、PIN；音频文件。
