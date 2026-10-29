# 用户下载词库的本地音频盘点（2026-10-30）

只读递归扫描 `/Users/caogong/Downloads/词库`，不追随目录符号链接，共 384 个文件：380 个 qwerty-learner JSON、一个逐行 JSON 的 DictionaryByGPT4 文本、ECDICT CSV、ToastFish SQLite 数据库及 `.DS_Store`。没有独立 mp3/wav/ogg/oga/m4a/flac/aac/opus/webm/aiff/wma 文件，也没有 zip/7z/tar/gz/tgz/rar/bz2/xz 文件需要列目录或解压；没有文件名含 license、licence、copyright、notice、readme、版权或授权的本地说明。

- ECDICT 的 `ecdict.csv` 有 audio 列，完整读取 770611 行，其 audio 非空数为 0。
- 380 个 qwerty JSON 的递归字段，以及 8714 行有效的 DictionaryByGPT4 JSONL（键 word/content），未发现 audio/speech/sound/voice/pronounce 或 license 类键，也没有常见音频文件扩展名 URL、data:audio 数据 URI；这一检索不覆盖任意隐写或自定义编码。
- ToastFish `inami.db` 只读扫描 19 张表、427 列，没有 SQLite blob 值。15 张英语词书表的 `ukspeech` 和 `usspeech` 列含类似 `illustrate&type=2` 的**文本片段**，不是内嵌音频文件，也不是完整 URL；该目录没有给出录音提供者、作者及可再分发授权，不能据此当作离线真人音频或推定可打包。

当前运行 `npx tsx scripts/audit-highschool-offline-audio.ts --missing-json /tmp/highschool-gaps-downloads-audit.json` 得 386 个离线缺口，其中 49 个为占位符，337 个非占位完整词头。与 ToastFish 的 `headWord` 大小写精确匹配有 10 个：illustrate、decrease、concrete、orient、rewarding、patent、corporate、knit、fin、Arabic；它们仅对应上述 speech 文本片段，**不是 10 份可复用录音**。这些词部分有词性或口音读音差异，不可依据文本片段判定内容。

结论：本目录中没有检出可独立复用且许可明确的音频，因而可导入录音交集为 0。以上为该目录及所检查文件类型的证据，不能排除用户其他位置的资源或未识别的特殊编码。扫描未读取或修改个人学习记录，也未改下载目录、manifest、现有录音或用户数据。
