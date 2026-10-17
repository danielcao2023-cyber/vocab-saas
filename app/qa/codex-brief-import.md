# Codex 任务书：课标词表导入改造（vocab-saas）

> 起草：工程负责人，2026-10-17 12:05（上海时间）。范围已获用户批准（Grok Bot 11:56 转达）。
> 基线：app 仓库 `2fd2e86`（= 运行版 `814cd54` + README 一处说明）。分支：`feat/curriculum-import`。

## 0. 工作目录与硬性限制（先读）

工作根目录是 `~/dev/vocab-saas`，结构如下：
```
~/dev/vocab-saas/
  app/                         ← git 仓库，所有代码改动只在这里
  v2/内容.md                   ← 只读（test/meaning.test.ts 会读 ../v2/内容.md）
  v2/manual_meanings.tsv       ← 只读，owner 是内容制作
  data/curriculum/ocr/level3_list.tsv   ← 只读
  data/curriculum/ocr/level2_list.tsv   ← 只读
  app/data/raw/ecdict.csv      ← 只读（已被 .gitignore 忽略，66 MB）
```
限制：
- **只能改 `app/` 下的文件**。不要动 `v2/`、`data/`、`app/data/raw/`，也不要写 `~/dev/vocab-saas` 以外的任何位置（尤其是 `~/apps/vocab`、`~/.codex`、`~/.ssh`、Tailscale）。
- 不要 `git commit`、`git push`，也不要建分支或切分支。改动留在工作区，由工程负责人审核后提交。
- 不要装任何新依赖，不要改 `package.json` 和 `package-lock.json`。`node_modules` 已经装好了，不需要联网。
- 不要读取、打印或写入任何密钥、令牌或环境里的凭据。
- 不要在 `app/data/` 下创建或修改 `.db` 文件。需要库时用 `:memory:` 或 `--dry-run`，见第 8 节。
- 所有命令都在 `app/` 下运行：`npm test`、`npm run typecheck`。

## 1. 现状（看懂这些再动手）

- `server/src/import.ts`：
  - `readList()` 读取 CSV 格式 `headword,level[,pos]`，**按小写去重**，所以 `Miss` 会被 `miss` 吃掉。
  - `lookupKey()` 去掉括号内容、取 `/` 前的部分，然后**转小写**。
  - `loadDict()` 按小写建 map，结果 `Ms` 会查到 `MS`（微软）。
  - `filterSenses()` 和 `DROP_TAGS` 是现行的过滤规则，**不要改**。
  - `upsertWords()` 按 `ON CONFLICT(source,headword)` 做 upsert，不动 cards。
  - `compareExpected()` 是计数对比。
- `server/src/db.ts`：
  - `SCHEMA` 定义 `words` 表，唯一键是 `UNIQUE(source, headword)`。SQLite 默认 BINARY 比较，本身就区分大小写。
  - `openDb()` 里用 `addColumn()` 做轻量迁移。
- `server/src/study.ts`：
  - `nextCard()` 里的 `fresh()`：先取已建好但还没学过的认词卡（`ORDER BY w.id`），没有的话再按 `COALESCE(freq_rank,999999), id` 新建一张。
  - `normalizeAnswer()`：只做 trim、小写和合并空白。
  - `acceptedSpellings()` 的现行问题：
    - `(AmE color)` 会被当成 `"ame color"`；
    - `(pl. children)` 会被当成 `"pl. children"`；
    - `according (to)` 会把 `"to"` 也算对。
  - `checkSpelling()` 用 `acceptedSpellings(headword).includes(normalizeAnswer(answer))` 判对错。
- `web/src/App.vue`：
  - 认词卡里有 `<div class="phon">{{ card.phonetic ?? '（暂无音标）' }}</div>`；
  - 拼写卡里有 `<div class="phon">{{ card.phonetic }}</div>`；
  - 三种卡片模式都用 `<MeaningList :meaning :flag>`。test/meaning.test.ts 断言 `<MeaningList ` 恰好出现 3 次。
- `web/src/MeaningList.vue` 和 `web/src/senses.ts`：`splitSenses()` 按真正的换行符 `\n` 拆分义项，先显示 2 条，其余折叠进「更多释义（N）」。flag 非空时显示「释义待人工看」。
- `web/src/api.ts` 的 `speak()`：只去掉括号，所以 `a / an` 会被整段念出来。
- `scripts/seed-due.ts` 用到了 `readList`、`loadDict`、`lookupKey`、`upsertWords`、`filterSenses`、`acceptedSpellings`。改完以后它必须还能跑通，`tsc` 也要通过。
- 测试文件：test/import.test.ts、study.test.ts、meaning.test.ts、copy.test.ts、net.test.ts、pending.test.ts、client-error.test.ts、version.test.ts。现有用例必须全部通过。
  - **只有一个例外**：import.test.ts 里 `expect(list.map(...)).toEqual(['a (an)', 'apple', 'T-shirt', 'zzzunknown']); // 去重` 这一条，按需求 1 要改成区分大小写，`Apple` 和 `apple` 都保留。改这条时在注释里写明原因。其他已有断言不许改。

## 2. 输入文件格式

- `level3_list.tsv`：tab 分隔，表头是 `page	entry	level2_star	flag	note`，共 1600 行。`level2_star=1` 的 505 行是二级词，`=0` 的 1095 行是三级新增的核心词。
  - `entry` 是课标原文，例如 `a / an`、`colour (AmE color)`、`o’clock`（弯引号）、`Miss`、`miss`、`Ms (AmE Ms.)`、`theatre (Am E theater)`（OCR 多了一个空格）。
- `level2_list.tsv`：表头相同，共 505 行，用于交叉核对。
- `manual_meanings.tsv`：tab 分隔，表头是 `entry	manual_meaning`。
  - `entry` 和 `level3_list.tsv` 的 `entry` 原文逐字一致，括号也带着。
  - `manual_meaning` 里出现字面上的两个字符 `\n`（反斜杠加 n），表示卡片上要换行。
  - 现在约 59 条，以后还会增减，**代码里不许写死条数**。
- `ecdict.csv`：表头是 `word,phonetic,definition,translation,pos,collins,oxford,tag,bnc,frq,exchange,detail,audio`。
  - 可能有跨行的引号字段，继续用 `parseCsvLine` 和 `quotesOpen` 解析。
  - `frq` 是当代语料库词频排名，`bnc` 是 BNC 排名；值为 0 表示没有数据。

## 3. 需求

### R1 区分大小写去重，ECDICT 精确优先
- `readList()`（旧的 CSV 路径）和新的课标读取函数都**按原文去重，区分大小写**。去重前先做引号规范化（见 R5）。
- 新增函数 `resolveEcdictKey(head: string, dict): string | null`。查找顺序：
  1. 先原样精确匹配；
  2. 再忽略大小写。同一个小写形式对应多个词条时，优先全小写的那个，其次取文件中第一个出现的。
- 改写 `loadDict()`，让它保留**原样词头**，例如 `MS`、`Ms.`、`miss`、`APP` 都能区分。为了兼容 `seed-due.ts`，原来的调用签名要么保留，要么一并改掉，但必须能编译、能跑。
- 查词用的词头 = 规范化后第一个主词头（规则见 R4），例如：
  - `a / an` → `a`；
  - `according (to)` → `according`；
  - `per cent (AmE percent)` → `per cent`；
  - `o’clock` → `o'clock`。
- `words` 表新增列 `ecdict_key TEXT`，存实际命中的 ECDICT 词头，查不到存 NULL。
- 用真实输入验证时，1600 条应当全部命中：精确匹配约 1592 条，忽略大小写约 8 条（`app→APP`、`god→God`、`Internet→internet`、`Miss→miss`、`Ms→MS`、`north→North`、`p.m.→P.M.`、`X-ray→x-ray`），查不到 0 条。

### R2 人工释义覆盖
- 新增 `readManualMeanings(file, curriculumEntries)`，只从 `--manual` 指定的文件读取。
  - 两边的 entry 先按 R5 做引号规范化，再比较。
  - 有任何一条 entry 不在课标词表里、entry 重复、或者释义为空，都要**报错退出**（退出码 1，并列出所有出错的行）。**这一步在写库之前完成，出错时库不能被改动。**
- 写了人工释义的词：
  - `meaning_zh` = 人工释义，其中字面 `\n` 换成真正的换行符；
  - `meaning_flag` = NULL，也就是不显示「释义待人工看」；
  - `meaning_raw` 仍然存 ECDICT 的原始 translation；
  - 新增列 `meaning_source TEXT`，值为 `'manual'` 或 `'ecdict'`。
- 没有人工释义的词，`filterSenses()` 的现行规则不变。
- 这样前端不用改：`splitSenses()` 已经按换行拆分。例如 `online` 会显示两行，即 `adj. …` 和 `adv. …`。

### R3 没有音标就隐藏音标行
- `App.vue` 里认词卡和拼写卡的 `.phon` 都改成 `v-if="card.phonetic"`，删掉「（暂无音标）」，不放任何占位文字。
- 错词本表格里的 `<span class="muted">{{ w.phonetic }}</span>` 遇到 null 时本来就是空的，保持原样。
- 加测试：读 `App.vue` 源码，断言不再包含 `暂无音标`，并且两处 `.phon` 都带 `v-if`。写法参照 meaning.test.ts 里读源码断言的方式。

### R4 带括号或斜杠的词条：显示、查词和拼写规则
沿用 `qa/curriculum-check/check.py` 里 `normalize()` 的分类：
- **显示用的 headword**：课标原文，只做引号规范化。例如 `colour (AmE color)`、`a / an`、`o'clock`。数据库 `headword` 列存的就是这个，`entry_raw` 新列存未规范化的原文。
- **主词头**：去掉所有 `(...)`，按 `/` 拆开，每段 trim 后去掉空段。第一个是查词用的词头。
- **括号内容分类及拼写时是否算对**：

| 括号写法 | 识别方式 | 拼写算对吗 |
|---|---|---|
| `AmE X`（含 OCR 写成的 `Am E X`） | 以 `Am\s?E\s+` 开头 | 算，X 可以接受 |
| `=全称`，例如 `(=advertisement)`、`(= artificial intelligence)` | 以 `=` 开头 | 全称**不算**。但同一个括号里如果还有 `AmE X`，X 算，例如 `maths (=mathematics, AmE math)` 可以接受 math |
| `pl. 复数` | 以 `pl.` 开头 | **不算** |
| `according (to)` 特例 | 主词是 according、括号是 to | 接受 `according to`；单独的 `to` **不算** |
| 其他裸写的形式，例如 `(an)`、`(dad)`、`(bye)`、`(has)`、`(am, is, are)`、`(till)`、`(mum AmE mom)` | 以上都不是 | 算。按 `,` 和 `AmE` 拆开后，每段都可以接受（保持现有行为，现有测试 `a (an)`、`color (colour)` 依赖这一点） |

- 斜杠两边的每个主词头都算对，保持现有行为。例如 `a / an` 接受 a 和 an。
- `acceptedSpellings()` 按上表重写，返回值去重并且都已规范化。必须有一个表驱动测试，至少覆盖下面这些：
  - `a / an` → a, an
  - `according (to)` → according, according to（不含 to）
  - `colour (AmE color)` → colour, color
  - `theatre (Am E theater)` → theatre, theater
  - `maths (=mathematics, AmE math)` → maths, math（不含 mathematics）
  - `Mr (AmE Mr.)` → mr, mr.
  - `child (pl. children)` → child
  - `ad (=advertisement)` → ad
  - `father (dad)` → father, dad
  - `mother (mum AmE mom)` → mother, mum, mom
  - `be (am, is, are)` → be, am, is, are
  - `policeman / policewoman (pl. policemen / policewomen)` → policeman, policewoman
  - `per cent (AmE percent)` → per cent, percent
  - `o’clock` → o'clock
  - `T-shirt` → t-shirt
  - `Miss` → miss
  - 旧格式 `a (an)` → a, an；`color (colour)` → color, colour（现有测试保持不变）
- `web/src/api.ts` 的 `speak()` 只念第一个主词头：去掉括号、取 `/` 前的部分、trim。这样 `a / an` 念 a，`actor / actress` 念 actor。

### R5 弯引号统一
- 新增共享函数 `normalizeQuotes(s)`：把 `’`（U+2019）、`‘`（U+2018）和 `ʼ`（U+02BC）都替换成 `'`。放在 `server/src/text.ts`，前后端都能引用。
- 导入时，headword、entry 比较和查词都先做这一步。`o’clock` 入库后应是 `o'clock`。
- 判对时，`normalizeAnswer()` 先调用 `normalizeQuotes()`，再 trim、转小写、合并空白。孩子的输入和标准答案用的是同一个函数。
- 单元测试至少包括：
  - `checkSpelling` 对词头 `o'clock` 的卡，输入 `o’clock`、`O’Clock `、`o'clock` 都判对；
  - 词头存的是弯引号原文时，输入直引号也判对；
  - `normalizeQuotes('o’clock') === "o'clock"`。

### R6 优先级与新词顺序
- `words` 表新增列 `priority INTEGER NOT NULL DEFAULT 0`：
  - 核心词（`level2_star=0`，level 写 `三级`）= 2；
  - 二级词（`level2_star=1`，level 写 `二级`）= 1；
  - 示例词和其他来源 = 0。
- `freq_rank`：取命中词条的 `frq`；`frq` 为 0 时退回用 `bnc`；两者都是 0 就存 NULL，排序时排在最后。
  - 例如 o'clock 的 frq 是 4064、bnc 是 0；Ms. 两项都是 0。
- `settings` 表新增默认值 `INSERT OR IGNORE ('level2_every','5')`，意思是每 5 个新词里有 1 个二级词，可以配置；设成 0 表示不穿插，严格先学完核心词。
- 改写 `nextCard()` 里的 `fresh()`：
  1. 如果已经有建好但还没学过的认词卡，先出它，改为 `ORDER BY c.id`。
  2. 否则数一下已有多少张课标词（priority>0）的认词卡，记为 n。如果 `level2_every>0` 且 `(n+1) % level2_every === 0`，这一张从二级组里选，否则从核心组选。组内按 `COALESCE(freq_rank,999999), w.id` 排序。
  3. 选中的组没词了就换另一组，两组都没了再选 priority=0 的词。
- `queueState()` 和 `todaySummary()` 的计数口径不变，首页数字和实际出卡必须继续一致（现有测试「home review count == cards actually served」要通过）。
- 测试：
  - 准备 10 个核心词和 3 个二级词，`level2_every=5`，`new_per_day` 设大一些，连续学 13 个新词。前 10 个的顺序应是「核心 ×4、二级 ×1、核心 ×4、二级 ×1」，组内按 freq_rank 排。
  - `level2_every=0` 时，先出完全部核心词。
  - 二级组用完后，自动全部改出核心词。

### R7 清除示例词
- 新增导入选项 `--clear-sample`：在同一个事务里删除 `is_sample=1` 的词（现在的 qa.db 里有 `sample` 42 个、`qa-only-test` 1 个），以及这些词关联的 `review_logs`（经由 cards）、`cards`、`wrong_words`、`word_content`、`content_feedback`、`ai_cache`。
  - 绝不能删 `is_sample=0` 的行。
  - 输出每张表删了多少行。
  - 库里没有示例词时什么都不做，正式库可以放心带上这个选项。
- 删完以后 `progress()` 里不再有示例来源，「当前是示例数据」的提示自然就消失了。这一点要有测试。

### R8 新的导入入口：幂等、不丢复习记录、支持试运行
命令行：
```
npm run import -- --curriculum ../data/curriculum/ocr/level3_list.tsv \
  --level2 ../data/curriculum/ocr/level2_list.tsv \
  --manual ../v2/manual_meanings.tsv \
  --source kb2022 [--ecdict data/raw/ecdict.csv] [--db <path>] [--clear-sample] [--dry-run]
```
旧的 `--list <csv>` 路径保留，`seed-due.ts` 和现有测试都在用。

处理顺序：
1. **校验阶段，不写库**：
   - 课标 entry 做引号规范化后不能重复，区分大小写；
   - `--level2` 文件里的 entry 集合必须和 star=1 的集合完全一致；
   - 人工释义必须通过 R2 的校验；
   - ECDICT 查不到的词只打印出来，不算错误。

   任何一项失败都 exit 1，并且不碰数据库。
2. **写库阶段，一个事务**：`--clear-sample`（如果带了）→ 按 `(source, headword)` upsert 所有列，包括 phonetic、pos、meaning_zh、meaning_raw、meaning_flag、meaning_source、ecdict_key、entry_raw、level、priority、freq_rank，`is_sample=0`。
   - **绝不能动** cards、review_logs、wrong_words 里属于课标词的行，word id 也必须保持不变。
3. **计数核对**，在事务里做：查 `source=kb2022` 的总数、`level='二级'` 的数量和 `level='三级'` 的数量。默认预期是 1600 / 505 / 1095，用 `upsertCurriculum(..., { expected })` 参数传入，方便测试用小数字。
   - 不一致就回滚并 exit 1；
   - 库里还有这次词表里没有的 kb2022 旧行时，只列出来，不删。
4. **输出 JSON**，包括：
   - inserted、updated、unchanged；
   - total / 二级 / 三级；
   - manualApplied 条数；
   - flagged 条数及词表（应当只剩没写人工释义、而且释义全被过滤掉的词；用真实输入时应为 0）；
   - missingPhonetic 条数及词表（真实输入约 10 个）；
   - caseInsensitiveHits 词表；
   - clearSample 删除计数；
   - staleRows；
   - dryRun 标志。
- **`--dry-run`**：不许改动 `--db` 指向的文件。做法：
  - 文件存在时，用 `new Database(path, { readonly: true }).serialize()` 得到一个缓冲区，在它的内存副本 `new Database(buf)` 上完整跑一遍迁移、清除、upsert 和核对，然后输出同样的 JSON；
  - 文件不存在时，用空的 `:memory:` 库，并且**不能创建文件**。
- **幂等**：连续跑两次，第二次 inserted=0、updated=0，unchanged=1600；行数、word id、cards 和 review_logs 都不变。

### R9 测试与验收命令（全部在 `app/` 下运行）
- 新增或扩展测试，覆盖 R1–R8，用 test/ 里的临时目录小样本，可以仿照 import.test.ts 的写法。至少包括：
  - `Miss` 和 `miss` 两行都保留；
  - `Ms` 精确查不到时，忽略大小写命中 `MS`，人工释义覆盖它，flag 为 NULL，`meaning_source='manual'`；
  - 人工释义的 entry 不在词表里时报错，而且库没被改动；
  - 人工释义里的 `\n` 存成真正的换行，`splitSenses` 拆出 2 条；
  - 计数不一致时回滚；
  - level2 交叉核对不一致时报错；
  - 重复导入后 word id、cards.reps 和 review_logs 都不变；
  - `--dry-run` 后数据库文件的字节不变，文件不存在时也不会被创建；
  - `--clear-sample` 能删掉示例词及其卡片和记录，而且不碰课标词；
  - R4、R5、R6 的用例。
- 必须全部通过：`npm test`、`npm run typecheck`。
- 再用真实输入做一次试运行，并把输出贴到最终说明里：
  `npm run import -- --curriculum ../data/curriculum/ocr/level3_list.tsv --level2 ../data/curriculum/ocr/level2_list.tsv --manual ../v2/manual_meanings.tsv --source kb2022 --db data/__codex_dryrun_nonexistent.db --dry-run`
  预期输出：total 1600、二级 505、三级 1095；manualApplied 等于人工释义的条数；flagged 为 0；`data/__codex_dryrun_nonexistent.db` 没有被创建。
- 更新 `app/data/wordlists/README.md` 和 `server/src/import.ts` 文件头的用法说明，写清新的命令行和各个选项。

## 4. 交付
- 结束时给出一份说明：改了哪些文件、各自改了什么、新增了哪些测试、`npm test` 和 `npm run typecheck` 的结果摘要、真实输入试运行的 JSON，以及没做到或有疑问的地方（不要编造通过）。
- 预计会改动的文件：
  - `server/src/import.ts`、`server/src/db.ts`、`server/src/study.ts`；
  - 新增 `server/src/text.ts`；
  - `web/src/App.vue`、`web/src/api.ts`；
  - 可能还有 `scripts/seed-due.ts`；
  - `test/import.test.ts`、`test/study.test.ts`、`test/meaning.test.ts`；
  - 新增 `test/curriculum.test.ts`；
  - `data/wordlists/README.md`。

  超出这个范围的改动，要在说明里给出理由。
