# 初三背单词

Vue 3 + Fastify + SQLite 的家庭英语学习应用，包含认词、拼写、听写、错词本、查词、课标浏览和扩展讲解。默认只监听本机；Studio 部署通过 Tailscale 白名单访问。

## 开发与验证

从仓库根目录进入 `app/`，使用能够加载当前 `better-sqlite3` 原生模块的 Node 版本。本轮在 Node 26.8.2 上验证，依赖版本以锁文件为准。

```bash
npm ci
npm test
npm run build
DB_PATH=data/dev-vocab.db HOST=127.0.0.1 PORT=18421 npm start
```

前端开发可另开 `npx vite`；默认 API 代理为 18420。`npm run build` 执行服务端与 Vue 类型检查、Vite 打包，并把 Git 版本写入 `dist/version.json`。运行服务读取一次版本，重新构建后需要重启服务才能更新 `/version`。

环境变量：`HOST`、`PORT`（默认 18420）、`DB_PATH`（默认 `data/vocab.db`）、`STATIC_DIR`（默认 `dist`）、`ALLOW_CIDRS`。默认白名单为本机；非法网络配置会拒绝启动，单个监听地址暂不可用则继续重试。

## 词表与中文释义

课标源文件位于仓库 `data/curriculum/ocr/`，三级词表共 1600 条，其中二级 505、初中新学 1095。2026-10-17 对 Studio 数据库的只读核对结果：1600 个词均有中文释义，59 条使用人工释义，1590 条有音标；当时扩展讲解表为空。

本轮本地修订后，1600 词均有释义和音标，人工释义表共 239 条（原有 59 条、新修订 180 条）。原始释义 `meaning_raw` 保留。每词两句例句和二至三条搭配已完成交叉编辑审核，共 3200 个已批准内容块；这里的审核指 Codex 编辑审核，尚不等同于教师审校。生产数据库尚未应用这些变更。

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

全量音频仍在分批补齐，以 `coverage.json` 的时间和实际 `ready` 数为准。服务端核对文件 SHA-256，损坏、缺失或来源不合格的录音不会作为可播放内容返回；旧机器朗读不会作为失败回退。

## 扩展讲解制作

基础中文释义与 AI 扩展讲解分开统计。核心内容为每词两句自然例句和二至三条常用搭配；词源、词性辨析等字段不适用或未核实时留空。生成稿、已核查稿、对孩子可见的已批准内容不能混计。

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
- `qa/ai-editorial-review/final-core-1600-2026-10-17/`：逐块 hash、审核与修订映射、覆盖率及重复导入验证。
- `qa/meaning-review/`：1600 词基础释义审查、修订记录与音标来源。

在已导入同一课标词库、已完成第二阶段迁移的开发库上，先预览导入：

```bash
npx tsx scripts/ai-review.ts patch-words --db data/dev-vocab.db \
  --patches data/content/word-patches-2026-10-17.json
npx tsx scripts/ai-content-import.ts --db data/dev-vocab.db \
  --in data/content/core-1600-2026-10-17.json
```

补丁预览无冲突后加 `--yes` 应用；内容导入应用还必须提供新的 `--backup <备份路径>`。同值补丁与同内容重复执行不会新增记录；遇到释义原值不一致时先复核，不能强行覆盖。先在开发副本验证，正式库受路径保护，需要单独执行已批准的上线交接流程。以上产物不含孩子的答题记录。

## 其他说明

FSRS 决定复习安排；同日再次答题、错词练习和断线重试均有独立处理，答案使用幂等键。家长看板位于 `/parent`。讲解反馈会隐藏对应块，旧版本不会因新版本隐藏而复活。

设计与内容约束见仓库 `v3/`。此前 README 的第一期开发记录保留在 [历史说明](docs/phase1-historical-notes.md)，其中早期“42 个示例词”“无 AI”“浏览器朗读”等描述不再代表当前实现。
