# 初三背单词 · 第一期（核心背词，无 AI）

- 负责人：工程负责人 ｜ 2026-10-17（上海时间）｜ 仅在 box 上开发运行，**未部署到 Studio**。
- 依据：`../方案-v2.md`、`../v2/工程.md`、`../v2/内容.md`（修订版）；群内 08:42 补充要求（不做任何 AI 界面；必须有拼写、听写、错词本、刷新后状态保留、断线提示；词表须来自教育部官方 PDF）。

## 运行
```bash
cd /workspace/vocab-saas/app
npm install                       # Node 20+；better-sqlite3 用 11.x（有预编译包）
# 下载 ECDICT（MIT）到 data/raw/ecdict.csv（不入库）
curl -L -o data/raw/ecdict.csv https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv
npm run import -- --list data/wordlists/sample.csv --source sample --sample   # 示例数据
npm run build                     # 类型检查 + 前端打包到 dist/
npm start                         # 默认 HOST=127.0.0.1 PORT=18420 DB_PATH=data/vocab.db
# 打开 http://127.0.0.1:18420/
npm test                          # vitest
```
环境变量（没有任何密钥或令牌）：
- `HOST`：逗号分隔的 IP 列表，默认 `127.0.0.1`，例如 `HOST=127.0.0.1,192.168.1.10,100.x.y.z`。每个地址单独起一个监听（共享同一个 Fastify 处理器）。某个地址绑定失败（如 Tailscale 还没起来导致 EADDRNOTAVAIL）只记日志，每 30 秒重试，进程不退出、其他地址照常服务。
- `ALLOW_CIDRS`：来源 IP 白名单，逗号分隔，默认 `127.0.0.1/32,::1/128`；不在名单内的请求一律 403（含 /health）。IPv4 映射地址（::ffff:a.b.c.d）按 IPv4 判断。例：`ALLOW_CIDRS=127.0.0.1/32,::1/128,192.168.1.0/24,100.64.0.0/10`。
- `PORT`（默认 18420）、`DB_PATH`、`STATIC_DIR`。
- HOST/PORT/ALLOW_CIDRS 不合法时打印“配置错误”并以退出码 2 退出；这是进程唯一会因配置退出的情况。

## 词表现状（重要）
- **官方来源**：教育部《义务教育课程方案和课程标准（2022年版）》通知页 http://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html （发布 2022-04-21），英语课标 PDF：http://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582349487953.pdf
- 2026-10-17 08:45–08:48（上海时间）从 box 下载该 PDF：http 和 https 均连接超时（moe.gov.cn 从本机网络不可达），**没有拿到官方 PDF**。另外搜索引擎抓到的同批 PDF 文本是扫描件 OCR 乱码，推断该 PDF 为扫描图片，整理词表还需要 OCR + 人工校对。
- 按要求不使用二手转载词表。当前库里只有 **`data/wordlists/sample.csv`：42 个示例数据**（工程自拟常用词，不是课标原文），界面顶部有“示例数据”提示。
- 拿到 PDF 后：整理成 `data/wordlists/kb2022.csv`（`headword,level`，level 写“二级/三级”），运行
  `npm run import -- --list data/wordlists/kb2022.csv --source kb2022`。脚本会输出缺音标/缺释义的词，以及与 1600 / 二级 505 / 初中 1095（**二手转述，未验证**）的差异。
- 导入是幂等的：按 (source, headword) upsert，重复运行不新增行、不动复习记录。
- 九年级单元标注：第一期不做（`words.unit` 留空）。

## 功能
- 今日首页：“今天：复习 N 个 · 新词 N 个 · 约 N 分钟”，“开始复习 / 先学新词”。每天新词默认 10 个（settings.new_per_day），按上海时间 0 点切换。
- 认词卡：单词、音标、发音按钮、ECDICT 释义；四档自评 1 忘了 / 2 模糊 / 3 认识 / 4 很熟（对应 FSRS Again/Hard/Good/Easy）。
- 拼写卡（看释义写单词）和听写卡（听发音写单词）：认词卡第一次学过后，次日起出现。严格比对（只忽略大小写、首尾空格；括号里的变体也算对，如 a (an)）。对→认识，错→忘了，用了 Tab 首字母提示→模糊。
- 错词本：任何“忘了”或拼写/听写答错自动加入；跨天答对 3 次后移出；可手动移出；“练这 10 个”。
- 进度页：按词表显示四档掌握度（新词 / 学习中 / 熟悉 / 掌握），用认词卡的 FSRS 状态：学习中 = 学习/重学阶段或稳定度 < 7 天；熟悉 = 7–21 天；掌握 = ≥ 21 天。阈值是设计假设。
- 发音：浏览器 speechSynthesis（工程.md §2 方案）；没有该能力时提示“没听到声音？检查耳机或音量。”。macOS `say` 预录留待 Studio 阶段。
- 断线：前端每 30 秒请求 /health，任何请求失败都显示“连不上学习服务。如果不在家，请先打开 Tailscale；在家的话请家长看一下 Studio 是否开机。”
- 所有状态存 SQLite（WAL），刷新页面或重启服务不丢。

## 第一轮验收修复（2026-10-17）
- **首页复习数 = 实际可练卡数**：`queueState()` 同时给首页计数和出卡用，到期条件统一为 `due <= 现在`（之前首页把今天晚些才到期的学习步也算进去了）。有测试比对首页数和实际出卡数。
- **断线评分不丢**：每个答案带一个幂等键 `answerId`（服务端 review_logs.answer_id 唯一）。没存上时卡片不前进，评分按钮下显示“这张没存上，连上后会自动补存”。重新连上后自动补存一次，成功再前进；补存失败时提示保留，可以再点评分按钮（拼写/听写点“再试一次”）手动重试，用的是同一个键，服务端不会重复记。有答案没存上时每 5 秒探测一次 /health（平时 30 秒）。
  - 待内容制作审阅的新文案：“这张没存上，连上后会自动补存”、“再试一次”、“更多释义 / 收起”、“释义待人工看”。
- **验收用测试库**（只用于开发和验收，不碰 data/vocab.db）：
  ```bash
  npm run seed:due -- --db data/qa.db          # 导入示例词并造出现在到期的认词 4 张、拼写 8 张、听写 8 张；每次运行会重置该库的卡片和记录
  DB_PATH=data/qa.db PORT=18423 npm start      # http://127.0.0.1:18423/
  ```
  脚本拒绝对 vocab.db 执行。
- **ECDICT 释义过滤**（领域研究定的规则，在导入时执行）：一行算一个义项；含 [医][化][计][网络][经][法][电][机][建][人名][地名][药][矿][生化][地质][解][症][美国][英国][德国][法国] 任一标签的行删掉，[复][植][动][体][物] 等保留。卡片显示前 2 条，其余收在“更多释义”里。全删光时保留原始第一行，并标“释义待人工看”（words.meaning_flag）。原始 translation 原样存在 words.meaning_raw。
  - 标签实测（`npm run scan:tags`）：示例 42 词里出现 [计]8 [经]2 [化]1 [医]1 [机]1；全库常见标签前几位为 医、化、计、网络、经、法、电、人名、机、地名、建……
  - 抽查文件：`qa/ecdict-filter-sample.md`（'a' 加上按固定种子随机抽的 20 个词，过滤前后对比），由 `npx tsx scripts/filter-sample.ts` 生成。

## 与文档的差异
- 按 08:42 要求，**不做任何 AI 界面**（无例句区、无“AI 生成”角标、无“这条有问题”、无“例句还没生成”）。表 `word_content`（含 status）、`content_feedback`、`ai_jobs`、`ai_cache` 已按工程.md 建好但空置。
- 未做：首次水平小测、家长周报、补签/连续天数、时长上限、中考倒计时、选择题题型、家庭口令（只绑 127.0.0.1）。
- 多了 `wrong_words` 表（错词本）和 `words.level / is_sample` 列；`cards` 多 `learning_steps`（ts-fsrs 5 的字段）。
- better-sqlite3 用 11.x（12.x 在本机 Node 20 上没有预编译包）；TypeScript 用 5.x（vue-tsc 不兼容 7.x）。

## API
`GET /health` · `GET /api/today` · `GET /api/next?prefer=review|new` · `POST /api/review {cardId,rating 1-4,durationMs}` · `POST /api/check {cardId,answer,usedHint}` · `GET /api/progress` · `GET /api/wrong` · `GET /api/wrong/practice` · `POST /api/wrong/:wordId {inBook}`

## 第二轮验收修复（2026-10-17）
- **释义统一组件**：认词、拼写、听写三种卡都用 `web/src/MeaningList.vue`，规则一样：一行一个义项，先显示前 2 条，其余收在“更多释义（N）/收起”里，有标记时显示“释义待人工看”。说明：accept 只有 2 行（`vt. 接受, 承认, … 容忍` 和 `vi. 同意`），验收看到的“约 10 条”是同一行里逗号分隔的词，按领域研究“一行一个义项”的规则不拆开。
- **seed:due 加了验收用例**：认词卡里固定有 act（3 条）、enough（4 条），能看到“更多释义”；另有一个**只在测试库里的测试词 `qatest`**（source=`qa-only-test`，原始释义全部被过滤），显示“释义待人工看”。输出里列出每张拼写卡可以接受的答案。
- **运行版本**：`npm run build` 最后一步 `scripts/write-version.mjs` 把 `git rev-parse --short HEAD`（以及工作区是否有改动）写进 `dist/version.json`，git 不可用时写 `unknown`。服务启动时只读一次：先看 `APP_COMMIT` 环境变量，再读 `dist/version.json`，都没有就是 `unknown`；运行时不调用 git，读不到也不报错。`GET /health` 带 `commit` 字段，`GET /version` 返回完整信息。
- **答“忘了”后同一轮里会再出现（设计如此）**：ts-fsrs 5.4.2，代码里只设了 `fsrs({ enable_fuzz: false })`，其余用库默认值：`learning_steps = ['1m','10m']`，`relearning_steps = ['10m']`，`enable_short_term = true`。实测：新词答“忘了”，1 分钟后再到期；复习卡答“忘了”进入重学，10 分钟后再到期。所以练完一轮后首页复习数可能又变大（例如 2 → 10 分钟后 3），这是正常的短间隔重练。首页暂时不单独显示“重学 N”。
