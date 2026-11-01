# vocab-saas：背单词（家用）

只给家里孩子用的英语背单词网页，跑在家里的 Mac Studio 上，只能通过 Tailscale 访问。

词库范围：初三 → 高中、四六级、托福（2026-11 起陆续加入）。

## 目录
- `app/`：程序代码（Fastify + SQLite + ts-fsrs + Vue）。完整提交历史和分支都在这个仓库里：
  - `main`：本说明和全部文档 + 代码主线
  - `feat/curriculum-import`：v2 课标词表导入版（线上上一版 b4429a2）
  - `feat/v3-phase1`：v3 第一期（2026-10-17 18:11 上线的 fd89c10）
  - `feat/v3-phase2`：v3 第二期（开发中）
  - 运行方法见 `app/README.md`。
- `方案-v1.md`、`方案-v2.md`：前两版方案。
- `v2/`：v2 的工程、内容、研究、运维（Studio 部署）文档。
- `v3/`：v3 方案、Codex 任务书、设计稿和截图、文案审查、第一/二期验收材料。
- `research/`：各角色的前期调研。
- `qa/`：独立验收的各轮报告和原始响应。
- `data/curriculum/ocr/`：课标词表 OCR 整理结果（tsv）。

## 没有放进仓库的东西
- 数据库（`*.db` 等，含孩子的学习记录）、`node_modules`、构建产物、日志、打包/传输文件、运行时状态、任何 `.env` / `vocab.env` / 密钥。
- **ECDICT 原始词典**（约 66MB，MIT 许可）：需要时下载到 `app/data/raw/ecdict.csv`：
  ```bash
  curl -L -o app/data/raw/ecdict.csv https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv
  ```
  项目主页：https://github.com/skywind3000/ECDICT
- **课标 PDF**（约 31MB）和 OCR 页图：来自教育部《义务教育英语课程标准（2022年版）》，
  http://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html
