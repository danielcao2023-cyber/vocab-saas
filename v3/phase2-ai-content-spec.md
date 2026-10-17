# 背单词 v3 第二期 · AI 讲解内容规格（草案）

- 起草：工程负责人，2026-10-17 13:25（上海时间）。依据：Grok Bot 转达的第二期新要求（按“尽量完整”扩大范围）、`v3/方案.md` 1.1 节、b4429a2 的 `server/src/db.ts`、视觉稿 `v3/design/`（第 10 节讲解区）。
- 状态：方案，没有写代码，没有调用任何模型。标记：【已核实】读代码或资料确认；【推断】未实测；【待实测】要在 Studio 上试。
- 原则：**每个字段不适用就留空，绝不凑数**；只有文字，**不生成、不存、不播放任何音频**；词源不确定就降级为「联想」，不能当词源展示；孩子背词完全不依赖 AI 内容。

## 1. 每个词的内容（6 类 → 9 种 kind）

| 界面块（视觉稿） | kind | 数量 | 说明 |
|---|---|---|---|
| 例句 | `example` | 0 或 2 句 | 中考风格英文 + 中文翻译，用课标释义里的常考义 |
| 常见搭配 | `collocation` | 0 或 2–3 个 | 英文搭配 + 中文 |
| 易混词 | `distinction` | 0–2 组 | 形近/音近/义近词辨析，可带 1 个对比例句 |
| 近义 · 反义 | `synonym`、`antonym` | 各 0–3 个 | 优先课标词（kb2022），再优先“先学到”的词 |
| 发音 | `pronunciation` | 0 或 1 条 | 音节、重音位置、发音要点、常见读错；**纯文字** |
| 记忆 | `mnemonic_etymology` | 0 或 1 条 | 真实词源的词根词缀拆分 + 同根词；必须带置信度 |
| 记忆 | `mnemonic_association` | 0 或 1 条 | 联想/口诀/谐音，界面标「联想 · 帮助记忆，不是词源」 |
| 记忆 | `related_words` | 0–4 个 | 派生词、词族（如 receive → receiver、receipt）；无词源时单独显示为“相关词” |

【已核实】`word_content.kind` 没有 CHECK 约束（b4429a2 `db.ts` 第 26–35 行，注释里写的是 example / mnemonic / quiz，从未使用），新增 kind **不需要迁移**。旧注释里的 `mnemonic`、`quiz` 不再使用；第一期不写 word_content。
一种 kind 一行，这样「这条有问题」可以只隐藏一块。同一个词同一 kind 以最新一条 approved、未隐藏的为准。

## 2. 数据库（只加不改）

已有表：`word_content(id, word_id, kind, body_json, model, prompt_version, status CHECK IN ('pending','generated','review','approved'), reviewed, created_at)`、`content_feedback(id, word_id, content_version, reason, created_at)`、`ai_jobs(id, kind, payload_hash, status, attempts, error, started_at, finished_at)`、`ai_cache(...)`。
迁移（全部 `addColumn` / `CREATE INDEX IF NOT EXISTS`，不改已有 CHECK、不重建表）：
- `word_content`：`flags_json TEXT`（校验标记，如 `["outside_list:fetch"]`）、`hidden_at TEXT`（被反馈或抽查否决后隐藏；因为 status 的 CHECK 里没有 rejected，又不能改表，所以用这一列表示“下架”）、`job_id INTEGER`、`input_hash TEXT`（输入快照哈希，释义变了可判断需重生成）、`downgraded_from TEXT`（词源降级为联想时写 `mnemonic_etymology`）。
- `content_feedback`：`content_id INTEGER`、`kind TEXT`、`handled_at TEXT`。
- `ai_jobs`：`word_ids TEXT`（JSON 数组）、`model TEXT`、`prompt_version TEXT`、`request_id TEXT`、`duration_ms INTEGER`、`output_file TEXT`（原始输出存 `app/data/ai-raw/`，不入库）。
- 索引：`idx_word_content_word_kind ON word_content(word_id, kind)`。
- 状态流转：校验通过且无标记 → `generated`；有需人看的标记 → `review`；该批抽查通过 → 批量 `approved`；抽查否决或孩子反馈 → 设 `hidden_at`。**孩子只看到 `approved` 且 `hidden_at IS NULL` 的块**。
- 测试：沿用第一期的迁移测试和 `scripts/verify-migration.ts`，旧数据逐行不变。

## 3. 调用方式

- Studio 上后台脚本 `scripts/ai-generate.ts`，逐批调用：`/opt/homebrew/bin/codex exec -m gpt-6-luna --sandbox read-only --skip-git-repo-check -C <临时空目录> "<提示词>" </dev/null`。**每次显式带 `-m gpt-6-luna`，不改 `~/.codex/config.toml`**。是否支持强制 JSON 输出（如 `--output-schema`）【待实测】；不支持就靠提示词 + 程序校验。
- 每批 N 个词（先试 1、5、10 个比较耗时和质量）【待实测】。正式批量前先跑 **20 个词试点**，把耗时、失败率和全部样例交 Grok Bot 转用户看。
- 输入给模型：词头、课标级别、我们库里的释义（meaning_zh，人工释义优先）、词性、ECDICT `exchange` 词形（如有），以及**课标词表**（1600 词，带“出词顺序号”，用于近义/反义和同根词优先挑课标词、先学到的词）。
- 同一批的 `request_id` / `payload_hash` 只查状态，结果不明就封存对账，**不重复提交**；失败限次重试 1 次（把校验错误反馈给模型），仍失败记 `ai_jobs.error`，该词显示「讲解还在准备」。
- 用户已同意 1600 词全部生成、不限每日量（订阅额度够用）。按“孩子快学到的词”优先排队。

## 4. 模型输出 JSON 结构（prompt_version = `p2-v1`）

每个词一个对象，一批输出 `{"items":[ ... ]}`，不许有 JSON 以外的文字。不适用的字段给 `[]` 或 `null`，**不要编造来凑数量**。
```json
{
  "word": "receive",
  "examples": [ { "en": "I received a letter from my pen pal last week.", "zh": "上周我收到了笔友的来信。", "target": "received" } ],
  "collocations": [ { "en": "receive a letter from sb.", "zh": "收到某人的来信" } ],
  "distinctions": [ { "words": ["receive", "accept"], "explain_zh": "receive 指收到（客观动作），accept 指接受（主观同意）。", "example": { "en": "He received a gift but didn't accept it.", "zh": "他收到了礼物，但没有接受。" } } ],
  "synonyms": [ { "word": "get", "note_zh": "得到（口语更常用）" } ],
  "antonyms": [ { "word": "send", "note_zh": "寄出、发送" } ],
  "pronunciation": { "syllables": ["re", "ceive"], "stress": 1, "points_zh": ["两个音节，重音在第二个音节"], "common_errors_zh": ["c 在 e 前读 /s/，不要读成 /k/"] },
  "etymology": {
    "confidence": "high",
    "chain": "Latin recipere → Old French receivre → English receive",
    "parts": [ { "form": "re-", "meaning_zh": "回", "origin": "Latin re-" }, { "form": "ceive", "meaning_zh": "拿", "origin": "Latin capere" } ],
    "explain_zh": "拉丁语 recipere 有“拿回、接纳”的意思，后来指收到。",
    "same_root": [ { "word": "accept", "zh": "接受" } ]
  },
  "association": { "text_zh": "拼写口诀：c 后面写 ei，不写 ie：receive、receipt。" },
  "related_words": [ { "word": "receiver", "zh": "接收者；听筒", "relation": "derivative" } ]
}
```
提示词要点：初中课标词汇和中考题型；例句只用常考义（与我们给的释义一致）；近义/反义要是“这个义项上”的近义/反义，没有就留空；词源只有在你确定时才写，并如实给 `confidence`（high / medium / low）；不确定就不写 etymology，可以写 association；association 不得写成历史来源（不许出现“来自拉丁语/古英语/源于/词源”等说法）；不要给音频、链接、音标。

## 5. 程序校验（入库前，全部自动；任何一条“拒绝”则该块不入库，“标记”则入库为 review）

**通用**
- JSON 能解析，字段类型正确，没有多余字段，`word` 与请求一致（大小写、弯引号规范化后）。
- 不含 URL、HTML、Markdown、表情符号；不含音频相关字段或文字（`audio`、`mp3`、`wav`、`http`）→ 拒绝。
- `内容.md` 禁用说法（“必考”“中考必过”“保证提分”等）→ 拒绝。
- 中文字段必须含汉字；英文字段只能是英文、数字和常用标点（弯引号先规范化）。

**例句 `example`**：数量 0 或 2，其他数量 → 拒绝整块。每句：
- **必须含目标词或其屈折形式**：词头本身（不区分大小写，按 `mainHeadwords()` 处理括号/斜杠变体），规则变化（-s/-es/-ies、-ed/-d/-ied、-ing、双写辅音、-er/-est），以及 ECDICT `exchange` 里的不规则形式（p 过去式、d 过去分词、i 现在分词、3 三单、s 复数、r 比较级、t 最高级）；短语词头整体匹配。`target` 必须等于句中实际匹配到的那个词形。不满足 → 拒绝该句（整块随之不足 2 句 → 拒绝）。
- 英文 6–20 个词且 ≤ 120 字符；中文 ≤ 40 个字。
- 难词检查：句中不在课标词表（含屈折形式）、不是大写专名或数字的词 > 1 个 → 标记 `hard_word`。
- 两句不能相同或只差标点。

**搭配 `collocation`**：0 或 2–3 个；每个含目标词或屈折形式；英文 ≤ 6 词，中文 ≤ 16 字；不重复。

**易混词 `distinction`**：0–2 组；`words` 含目标词 + 1–2 个其他词；其他词不在课标词表 → 标记 `outside_list`；`explain_zh` ≤ 120 字；带例句时同样做例句校验。

**近义 / 反义 `synonym` / `antonym`**：各 ≤ 3；不能是目标词本身或其屈折形式；同一个词不能既是近义又是反义；不重复。
- 逐个查课标词表（大小写不敏感，按 `mainHeadwords()`）：在表内记 `in_list`；**不在表内 → 标记 `outside_list:<词>`**，界面显示灰色“课标外”，排在课标词后面；每块最多保留 1 个课标外词，多的丢弃。
- 排序：课标词按“出词顺序号”从小到大（先学到的在前）；界面再按孩子实际学习状态标“已学”（显示时计算，不存库）。
- `note_zh` ≤ 20 字。

**发音 `pronunciation`**（只有文字）：
- `syllables` 拼起来（去掉 ·、连字符）必须等于词头字母（单词词头；短语词头不生成此块）；`stress` 是合法下标。
- `points_zh`、`common_errors_zh` 各 ≤ 3 条，每条 ≤ 40 字。
- 模型给的音标一律丢弃，界面只显示库里已有的音标。

**词源 `mnemonic_etymology`**：
- 必须有 `confidence`。**缺失或不是 `high` → 不作为词源入库，降级为 `mnemonic_association`**（`downgraded_from='mnemonic_etymology'`，文字改写为“可以这样记：…”，去掉“来自/源于”等历史说法），界面显示「联想」。
- `parts[].form` 去掉连字符后必须按顺序出现在词头里（如 receive 中的 re、ceive），否则降级。
- `same_root` ≤ 4，逐个查课标词表并标 `in_list`；`explain_zh` ≤ 80 字。
- 所有词源条目入库为 `review`，必须经领域研究抽查通过才 `approved`（见第 6 节比例）。

**联想 `mnemonic_association`**：`text_zh` ≤ 80 字；出现“来自拉丁语 / 古英语 / 希腊语 / 源于 / 词源 / 词根是”等历史表述 → 拒绝（防止把联想包装成词源）。

**相关词 `related_words`**：≤ 4；不能是目标词本身；`relation` ∈ derivative / compound / same_root；不在课标词表的标 `outside_list`（允许，派生词常不在表内）。

## 6. 领域研究抽查要点

每批生成后出一张抽查表（词、块、内容、判定 对/错/存疑、错误类型、核对来源链接和日期）。目标：抽查错误率 ≤ 约 2%（方案第 4 节）。
**抽样**
- 随机 5% 的词，全部块都看；
- 全部 59 个人工释义词、全部多义词（释义 ≥ 3 行）中随机 20%；
- **词源：前 200 个词 100% 核对**，错误率 ≤ 2% 后降到每批 20%；
- **近义/反义：每批 10%，全部 `outside_list` 条目 100%**；
- 降级成联想的条目每批 10%（看有没有仍在冒充词源）；
- 所有带 `hard_word` 标记的例句 100%。
**核对什么**
1. 例句：是否自然、初中难度、用的是课标常考义（与卡片释义一致）、中文翻译准确，像中考题而不是生硬造句。
2. 搭配：真实常用（对照教材/词典例句），中文对应。
3. 易混词：辨析结论是否正确、例句是否支持结论。
4. 近义/反义：在**这个义项**上是否真的近义/反义，难度是否合适，有没有把只在某种语境下成立的词当通用近义词。
5. 发音：音节划分和重音与权威词典一致（Cambridge / Longman / Oxford Learner's 任选，记录链接）；“常见读错”是否真实、对中国学生有用。
6. **词根词源**：拆分和来源链条必须能在 Etymonline、Merriam-Webster 或 OED 查到，记录链接；同根词确实同源（不能只是长得像，如 hear/heart）；词缀意思讲法是否通行，像 receive 的 re- 这类原义不明确的要注意措辞。
7. 联想：不误导、不冒充历史来源、没有不适合初中生的内容。
**处理**：判错的块设 `hidden_at` 并记原因；同一类错误超过 2% 时暂停该 kind 的批量，改提示词（新 prompt_version）后重跑该批。领域研究出抽查表，内容制作不必参与。

## 7. 界面（见视觉稿第 10 节）
- 块顺序：例句、常见搭配、易混词、近义 · 反义、发音、记忆（词源 → 联想 → 相关词）；默认展开例句和搭配；空块不显示。
- `GET /api/word/:id/content` 只返回 approved 且未隐藏的块；没有任何块时返回 `{ status: 'pending' }`，界面显示「讲解还在准备」。
- `POST /api/content/:contentId/feedback { reason }`：写 content_feedback、设该块 `hidden_at`，返回后界面显示“已记下，这条先不再出现。”
- 讲解只展示，不产生 review_logs，不影响 FSRS。

## 8. 未定 / 待实测
- `codex exec` 能否强制 JSON 输出、每批词数和单批耗时【待实测，20 词试点】。
- 词源“high”置信度的模型自评是否可信——靠前 200 词 100% 抽查来判断，不可信就全部走人工核对或只留联想。
- receive 一类 re- 原义不明确的词，讲法以领域研究核对为准。
