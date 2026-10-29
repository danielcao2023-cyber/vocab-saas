# 高中离线主录音覆盖盘点（2026-10-30）

在 `app/` 运行 `npx tsx scripts/audit-highschool-offline-audio.ts`。如需完整缺口，追加 `--missing-json /tmp/highschool-audio-gaps.json`；输出文件必须不存在。脚本以只读方式打开本机重建的 `mobile-public/offline/seed.db`，按当前 catalog 的稳定 key 查真实词条，再按应用的发音词头规则查已生成的 `mobile-public/offline/pronunciation.json` 与 `recordings/`；不打开或改变使用者学习库。正式源清单与音频也做同样检查。统计以高中 catalog 条目为单位，重复册次归属算一次，不能当成各 Unit 人次或独立音频数量。

本次 catalog 版本 137，2,730 条高中词条均映射到离线 seed；2,336 条有通过元数据及文件 SHA-256 检查的离线主录音，394 条缺失或未通过检查。源目录与离线版均为 2,336 条，未发现仅一侧通过的词条。49 条包含字典占位符，其中 48 条缺主录音。通过检查的主录音中，标为美式 1,499、英式 49、未知口音 788；这些是清单标签，非本次听辨结果。

此结果只描述**本机重新生成的离线资源**，不证明任何已安装 APK 包含这些资源，也不证明录音正确、可解码、授权已再次核验或经过逐条人工试听。此次检查核对词头、必要元数据、安全文件路径及文件哈希；没有做听审。词性变体不计入主录音覆盖。`mappingMissing` 独立统计 catalog 无法解析的条目；出现该情况时应先处理 seed/catalog 版本一致性，不能将其视为已查无录音。

验证：TypeScript 类型检查通过；完整缺口输出为 394 条，指定已有输出文件被拒绝，运行前后 seed 的 SHA-256 相同（`ccc3720f3857613d771c1cca089cdd90bc228484f52a5bdcffce2c01abc2b1e9`）。此哈希仅对应本次构建，后续重建可能改变。
