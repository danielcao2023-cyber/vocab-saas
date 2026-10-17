# v3 第一期交接（工程负责人，2026-10-17 15:20 上海时间）

## 1. 提交
分支 `feat/v3-phase1`（worktree `/workspace/vocab-saas/wt-v3`），基线 b4429a2：
- `523dc58` Codex 实现（Studio run2，14:31:17 启动，约 15:04 结束；diff sha256 bcc4b883…5c01，原样应用，没改）
- `c007ded` 工程负责人复核修正（见第 3 节）

`/workspace/vocab-saas/app`（feat/curriculum-import @ b4429a2）没动；18420、18423 和它们的 dist 也没动。

## 2. Codex 做了什么（详见 `qa/v3-phase1-codex-report.md`）
- 迁移（只加不改）：review_logs 加 qtype/counted/context 三列；新增 question_issues、daily_stats、streak_makeups 三张表；新增 6 个 settings 键，用 INSERT OR IGNORE 写入；openDb 末尾回算 daily_stats。
- quiz.ts：pickQtype（New 卡永远翻面；choice_enabled/choice_weights 控制）；buildQuestion（同 source、同示例标记；排除同词头、显示文本重复、同义；同词性和词形相近的优先）；刷新时复用同一道题；POST /api/answer 由服务端判分，幂等，409。
- 错词本：按次数和按最近两种排序；fails 按题型统计（旧日志的 NULL 按卡片类型推断）；混合题型练习（70/30）；当天重复练习记 counted=0；毕业规则只认 Good/Easy，Hard 不计入也不清零，Again 清零；手动放回不增加 wrong_count。
- stats.ts：daily_stats 回算（按上海 0 点分日）、queueStateAt、打卡、连续天数、7/30/100 徽章、补签（需今天已完成、每月 2 次、最近 7 天，三项都从 settings 读）、家长汇总。
- 前端：按批准稿拆成 5 个视图和 5 个组件，加 styles/tokens.css；/parent 没有入口，也不要 PIN；没有新增依赖，package.json 和 lock 都没改。

## 3. 我的修正（c007ded）
1. **旧日志回算错误（大问题，已修）**：ts-fsrs 5 的 `log.due` 对所有非 New 状态（Learning、Review、Relearning）记的都是"上一次复习时间"。Codex 只处理了 Learning/Relearning，所以 b4429a2 留下的旧历史在 queueStateAt 里几乎全被算成"到期"，打卡判成未完成。我在 qa.db 副本上用 b4429a2 的代码生成了 12 天合成历史：原实现 674 个时刻里有 650 个不对，10 天里 2 天的打卡判错；修正后 674/674 全对，10/10 天打卡全对。回归测试：`test/stats-legacy.test.ts`。
   说明：新日志的 `review_logs.due` 现在存的是作答前真实的 cards.due（Codex 的改动），旧行一个字节都没改。
2. **服务端判分加固**：卡片有今天未作答的选择题时，`POST /api/review` 返回 409，不能用"翻面自评"绕过选择题。
3. **泄题**：看义选词的题面、听音选义的选项里，出现答案词头时（如 while 的"一会儿（for a while）"、dear 的"（Oh dear）"）在作答前遮成"～"。kb2022 里约 11 个词有这个问题。测试：`test/choice-mask.test.ts`。

## 4. 测试（Node 26.12.0）
- `npm test`：19 个文件、118 个测试全过（Codex 114 个 + 我加的 4 个）；`npm run typecheck` 通过；`npm run build` 通过（version.json c007ded，不是 dirty）。
- 迁移核验 `scripts/verify-migration.ts --db`：
  - qa.db（1600 词、1 张卡、0 条日志）：旧列不变，integrity ok。
  - 合成历史库（147 张卡、674 条日志、42 个错词）：旧列不变，daily_stats 10 行，integrity ok。
  - 另外逐行 sha256 对比 words、cards、review_logs、wrong_words 的旧列：完全相同。settings 只多了 6 个新键。
- 合成历史校验（`v3/phase1-qa/`）：
  - `check-migrated.mts`：每天的 completed 和剩余队列都和旧代码当时一致；删表重算结果相同；new/review/answers/correct 与手写 SQL 一致。
  - `check-steps.mts`：每次作答后 queueStateAt 等于当时的 queueState（674/674）。
- 性能：日志复制到约 1 万条时，单日回算 88 ms（每次作答都会触发）。

## 5. 18424 测试实例
- 地址：http://127.0.0.1:18424 ，家长页 http://127.0.0.1:18424/parent
- 数据库：`wt-v3/data/qa-v3-hist.db`，是合成历史库（`v3/phase1-qa/hist-b4429a2.db`，即 qa.db 副本 + 用 b4429a2 代码模拟的 10-03 到 10-14 学习历史）的新副本，所以能看到复习、选择题、错词本、打卡和补签。
- 纯 qa.db 副本在 `wt-v3/data/qa-v3.db`，只做了迁移核验，没挂到端口上（它没有复习卡，出不了选择题）。
- 静态目录：`v3/phase1-qa/dist-18424`
- 重置或重启：`v3/phase1-qa/restart-18424.sh`（只处理 cwd 是 wt-v3 的 18424 进程）。

## 6. 浏览器验证（headless Chrome + playwright-core；截图在 `v3/phase1-shots/`）
脚本是 `v3/phase1-qa/e2e.mjs`，全程没有 console 错误，也没有 4xx/5xx。
- 一轮学完今天的 78 题：翻面 17、听音选义 5、看义选词 6、拼写 26、听写 24。完成后 completed=1，连续天数从 0 变 1；补签 10-16 后变 2，本月补签剩 1 次。
- 错词本练习 10 题：都是今天已学过的卡，所以全部 counted=0，不影响 FSRS。
- 截图：
  - 首页（练习前、练习后、补签后；桌面和手机）
  - 翻面正反面
  - 听音选义：出题、答对、答错
  - 看义选词：出题、答对、答错
  - 拼写答错（字母级对比）和答对、听写答错
  - 完成页
  - 错词本（两种排序；手机）
  - 错词练习
  - 家长页（桌面和手机）
- 和视觉稿对比：版式、颜色、组件基本一致。小差异：
  - 打卡图例用 ●▨◯ 字符，没用色块。
  - 家长页柱状图图例是纯文字。
  - 卡片背面的快捷键行显示"R 重听"，稿子是"空格 听发音"。
  - "? 快捷键表"靠左。
  - 选项键同时显示字母和数字。
  - 我认为都不阻塞，没改。
- 孩子页面的 DOM 里没有 "parent" 或"家长"字样；/parent 页面上没有任何按钮或链接。

## 7. 没验证 / 待定
- **正式库副本没核验**：~/apps/vocab 不能碰，需要用户提供副本或授权。核验命令：`npx tsx scripts/verify-migration.ts --db <副本>`
- 真机点按、朗读试听（TTS）、`prefers-reduced-motion` 下的动效、断线补存在真实浏览器里的表现：只有单元测试，没实测。
- 文案：错词本上的"连续 3 天答对会自动移出"是批准稿原句，但规则是"3 个不同的日子"，不要求连续。建议改成"3 个不同的日子答对会自动移出"，需要内容方确认。Codex 补的几句新文案（见报告）也需要内容审阅。
- 每次作答都要全量重建历史来回算当天统计。1 万条日志时 88 ms；以后日志多了可以改成增量。
- "刚才这个再来一次"的判断沿用了旧逻辑：几天前留下的 Learning/Relearning 卡也会显示这句。不是这次引入的回归。

## 8. 复现
```bash
cd /workspace/vocab-saas/wt-v3 && export PATH=/workspace/vocab-saas/.node/bin:$PATH
npm test && npm run typecheck && npm run build
cd /workspace/vocab-saas/v3/phase1-qa
npx --no-install tsx make-history.mts      # 本目录 node_modules 链到 wt-v3；用 b4429a2 代码在 qa.db 副本上生成合成历史（结果固定）
npx --no-install tsx check-migrated.mts; npx --no-install tsx check-steps.mts
./restart-18424.sh && node e2e.mjs                 # 截图写到 ../phase1-shots/
```

## Fix round 1（2026-10-17 15:36–15:45 上海时间，commit c39117d，基于 c007ded）
针对独立验收 15:35 报告 `qa/v3-phase1/结果.md`。只在本机 wt-v3 改，Studio、18420、18423 都没碰。

### 已修
- **缺陷 1 判分绕过**
  - `/api/review`：这张卡今天在任何 context 下有没答的选择题，一律 409（`question pending`）。已存过的 answerId 重放照旧幂等返回。
  - `context:'practice'` 的 `/api/review` 和 `/api/check` 只收错词本里的词，或今天刚移出的词（同一轮里刚毕业或刚放回，晚到的提交仍有效）；其他返回 409 `practice only for wrong-book words`。翻面练习不写 question_issues，所以用错词本归属来判断「是不是 /api/wrong/practice 发的卡」。
  - 防卡死：另一个 context 有待答选择题时，`issueQuestion` 出同一题型的选择题，不出翻面；出不了题就复用那道题。
  - 回归测试 `test/fix1.test.ts` 按报告原样复现：company 类卡，due 10-14，`{cardId,rating:4,context:"practice"}` → 409，卡和日志不变，题仍未答。原测试 `quiz.test.ts` 里正好断言了这个绕过返回 200，已改成 409，之后先答题再练。
  - 18424 上 curl 实测：company（card 145）practice 409、study 409；放进错词本后 practice 仍 409。记录在 `v3/phase1-qa/fix1/must1-curl.log`。
- **缺陷 2 文案**：`wrongRule`「3 个不同的日子答对会自动移出。」，`wrongEmptyNote`「答错或点了「忘了」的词会自动放进来，在 3 个不同的日子答对就会移出。」。代码里已经没有「连续 3 天」，有测试守着。批准稿 `v3/design/`（wrong.html、empty.html、src/gen.py、design-notes.md 83/84/90 行）里还是旧句，没改，属于已批准的设计产物。
- **小问题**
  - (a) 拼写：编辑距离 ≤ max(1, 长度×30%) 才显示「差一点」，否则显示新文案「答错了」（待内容复核）。zzz→receive 显示「答错了」。
  - (b) 补签提示随状态变：今天没完成用原句；完成了且有可补的日子「点一下漏签的日期就能补签。」；没有可补的日子「现在没有可以补签的日子。」；本月次数用完「这个月的补签次数已用完。」。三句都是新文案，待内容复核。漏签但不能补的日子现在可以点，点了显示服务端给的原因，比如「10月04日：已超出可补签的时间范围。」。`/api/streak` 新增 `todayDone`、`makeupBlocked`，只加字段。
  - (c) 家长页正确率折线：x 两端各留 12/1000，svg 设 `overflow: visible`。
  - (d) 遮题：新增共用的 `maskAnswer`（server/src/text.ts）。服务端看义选词题面和听音选义选项都遮，重新渲染已出的题也遮；前端也用同一个函数。词头和变体遮成「～」，词形说明里的原形遮成「某词」，例如「lose的过去式」→「某词的过去式」，「（may 的过去式）」→「（某词 的过去式）」。没用 ECDICT exchange，库里没有这份数据，靠「X的过去式/过去分词/现在分词/复数/比较级/最高级/第三人称」这个格式识别。全库 1600 词×2 题型扫描（`v3/phase1-qa/fix1/scan.mts`）：3200 题全能出，遮挡后 0 处露出答案。
  - (e) 干扰项：义项重叠判断放宽为三种情况：相同、一方包含另一方（≥2 字）、属于同一近义组。近义组目前只有称呼两组：女士/小姐/夫人/太太/淑女/贵妇/妇女/女人，先生/绅士/阁下/男人。全库扫描时 Ms 的选项是 mix/mark/meat、most/map/man，不再有 miss。

### 没修 / 留作后续
- 7 听音选义正确项常是生僻义（safe→保险箱）：已经在用 ECDICT 第一行，问题出在第一行本身的义项顺序，不好顺手修，留到第二期 AI 内容或人工常用义。
- 10 离线横幅「请家长看一下 Studio 是否开机」：按要求没改措辞。这句只是提示，不是家长页入口；第一期交接里「孩子页面无家长字样」那句不准确，以此为准。
- 9 最后一张答错当天立即算完成：符合任务书，等用户决定。
- 近义组是手写的小表，只覆盖称呼；以后发现其他近义误配再加。

### 测试
- `npm test`：20 个文件，127 个测试全过（原 118 + fix1 的 9 个）；`npm run typecheck` 通过；`npm run build` 通过（version.json c39117d，dirty=false）。
- 18424：`dist-18424` 换成 c39117d 的构建，用 restart-18424.sh 重置（合成历史库新副本），/health commit c39117d。curl 验证后又重置了一次，现在是干净状态。
- 截图（headless Chrome，`v3/phase1-qa/fix1/shots.mjs`，无 console 错误）：`phase1-shots/fix1-wrong.png`（含 fix1-wrong-top.png 裁剪）、`fix1-wrong-empty.png`（拦截 /api/wrong 返回空列表看空状态）、`fix1-home-makeup-hint.png`（点了 10-04 后显示原因）、`fix1-parent-chart.png`。
- 未验证：折线最后一点紧贴右边的情况，合成库今天没有作答数据，只按几何推算；补签「完成后/用完」两种提示只做了代码和类型检查，浏览器里没走到；真机。

## Copy round（2026-10-17 17:28–17:32 上海时间，commit fd89c10，基于 c39117d）
依据内容制作的 `v3/phase1-copy-review.md`（17:40 版），13 条建议全部照改，其余保留。只在本机 wt-v3 改，Studio 和 wt-v3p2 没碰。

| 审查条目 | 改动 | 文件 |
|---|---|---|
| #1 wrongRule | 「在 3 个不同的日子答对，就会自动移出错词本。」 | web/src/copy.ts |
| #3 spellWrong | 「答错了」→「拼错了」 | web/src/copy.ts |
| #5 expectedChoice | 「应为 B：…」→「正确答案是 B：…。已加入错词本。」 | web/src/copy.ts |
| #6 makeupHint | 「完成今天的任务后，就能补签没打卡的日子。」 | web/src/copy.ts |
| #7 makeupReady | 「点一下没打卡的日子就能补签。」 | web/src/copy.ts |
| #10 dictationPrompt | 「听发音，拼出单词」 | web/src/copy.ts |
| #11 roundDone | 「这一轮的词做完了。」 | web/src/copy.ts |
| #12 comparison | 改函数参数，传本周和上周的绝对值：`comparison(mastered, previousMastered, accuracy, previousAccuracy)` →「本周新掌握 X 个（上周 Y 个）· 正确率 A%（上周 B%）」。API 不用改：/api/today 的 `comparison.thisWeek/previousWeek` 本来就带 `masteredNew` 和 `accuracy`；原来是前端自己算差值 | web/src/copy.ts, web/src/views/HomeView.vue |
| #13 统一「回到今日」 | 新增 `COPY.backToday`，完成页「回首页」和错词本空状态都用它 | web/src/copy.ts, web/src/views/DoneView.vue, web/src/views/WrongView.vue |
| #14 wrongPracticeNote | 「练错词会先出你错过的题型。同一个词一天只算第一次练。」 | web/src/copy.ts |
| #15 错词本摘要（待工程确认的那条） | 口径改成移出进度（见下）。文案用审查文件给的「其中 N 个已经对了 2 天，再对 1 天就移出。」，N=0 时整句不显示。API 字段 `practicedTwiceThisWeek` 改名为 `twoCorrectDays` | server/src/study.ts, web/src/copy.ts（`nearOut`、`wrongSummary`）, web/src/views/WrongView.vue, HomeView.vue, App.vue, types.ts |
| #16 补签原因 | 「已超出可补签的时间范围」→「这一天太久了，不能补签」 | server/src/stats.ts |
| #17 日期格式 | 「10月03日」→「10月3日」，用 Number() 去掉前导 0 | web/src/components/StreakCalendar.vue |
| #18 coreNote / level2Note | 「三级新增 / 小学阶段」→「初中新学 / 小学学过」 | web/src/copy.ts |

### #15 N 的口径
- 旧（c39117d `server/src/study.ts:203–206`）：`SELECT correct_days FROM wrong_words WHERE removed_at IS NULL`，然后统计 correct_days 里落在本周（上海时间周一到今天）的日期数 ≥ 2 的词。不在本周的答对日不算，所以和「3 个不同的日子」口径对不上。
- 新（`server/src/study.ts:203–208`）：同一条 SQL，统计 `new Set(correct_days).size === 2` 的词，不看周。correct_days 的写入规则没变：只有 Good/Easy 加当天日期（按上海日期去重）；Hard 不加也不清零；Again 和手动放回清零；满 3 天移出。所以 N =「还在错词本里、再对 1 天就移出」的词数。
- 18424 合成历史库：旧 N=14，新 N=15。多出来的那个词的 2 个答对日不全在本周。

### 测试
- `npm test`：21 个文件，132 个测试全过（fix1 的 127 + `test/copy-round.test.ts` 5 个）。另外改了几条断言：`stats.test.ts` 的「超出」改为「太久」，`ui.test.ts` 的 3 处文案，`wrongbook.test.ts` 的字段名，`fix1.test.ts` 的 wrongRule。
- `npm run typecheck`、`npm run build` 都通过（version.json fd89c10，dirty=false）。dist-18424 已换成新构建。
- headless 浏览器走查（脚本在 `v3/phase1-qa/copy/`，全程没有 console 错误，也没有 4xx/5xx），截图在 `v3/phase1-shots/`：
  - `copy-before-done.png`、`copy-calendar-before.png`：今天没完成时提示「完成今天的任务后…」。点 10-16 显示「10月16日：先完成今天的任务才能补签。」，点 10-04 显示「10月4日：这一天太久了，不能补签。」
  - `copy-week-comparison.png`：「本周新掌握 5 个（上周 0 个）· 正确率 75%（上周 77%）」
  - `copy-wrong-before-grad.png` → `copy-practice-after-grad.png` → `copy-wrong-after-grad.png`：用 `setup-grad.mjs` 只改 18424 副本库，把错词本第一名 could 的 correct_days 设成 2 个合成日期（它原来就有 2 天：10-13、10-14）。然后在浏览器里点「练这 10 个」，第一张 could 翻面选「认识」。错词本从 32 个变成 31 个，could 移出，N 从 15 变成 14。中间那张截图是自动跳到的下一张听写卡，上面能看到 #10 的新文案。
  - `copy-calendar-done.png`：用接口答完今天的 78 题（`finish-today.mjs`），提示变成「点一下没打卡的日子就能补签。」，有 6 天可以补。
  - `copy-calendar-used-up.png`：补了 10-16 和 10-15 后，本月剩 0 次，提示「这个月的补签次数已用完。」，点 10-13 显示「10月13日：这个月的补签次数已用完。」，连续 3 天。
  - `copy-done-page.png`：完成页按钮是「回到今日」。
- 走查完以后用 restart-18424.sh 重置，/health 显示 fd89c10。

### 没改 / 待定
- #15 的句式是审查文件写的条件句（「如果 N 就是…」），现在口径已经确认符合这个条件，所以直接用了。N=0 时整句不显示是工程这边加的处理，请内容制作确认。
- 首页错词本那一行变成「错词本 N 个。其中…」。原来是逗号接后半句，现在后半句可能不出现，所以改成句号。请内容制作顺便看一眼。
- `v3/design/` 批准稿里的旧文案（「连续 3 天」「本周已练对 2 次」「应为」等）没改，属于已批准的设计产物。
- 未验证：真机；「现在没有可以补签的日子」这个状态只有单测（合成库里一直有可补的日子）；#3 和 #5 只做了单测和组件渲染，没在浏览器里故意答错去看。
