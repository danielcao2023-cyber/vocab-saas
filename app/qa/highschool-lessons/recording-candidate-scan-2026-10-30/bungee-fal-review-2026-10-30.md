# bungee jumping 候选录音与 FAL 审核（2026-10-30）

- 英语 [Wiktionary 词条](https://en.wiktionary.org/wiki/bungee_jumping) 的美音关联 [Commons 文件页](https://commons.wikimedia.org/wiki/File:En-us-bungee-jumping.ogg)。已有 Commons 原始 metadata（同目录 commons-batch-raw-2026-10-30.json）描述完整短语的美式英语发音，标 own work、作者 Jelkner、许可 FAL。该文件的元数据许可模板没有明确指定版本；它链接当前许可页面并指向 1.3 范本，这不能单独证明作者将本文件限定为 1.3。
- [Free Art License 官方 1.3 文本](https://artlibre.org/licence/lal/en/) 2.2 要求发行副本时附完整许可或准确说明其所在、列明原作者与原作获取位置；2.3 还要求说明修改并以相同或兼容许可分发后续作品。这里仅列条款内容，文件版本适用性、音频转码的法律适配及整体分发方式尚待确认；并非律师意见。
- 原始文件 https://upload.wikimedia.org/wikipedia/commons/8/88/En-us-bungee-jumping.ogg 于本轮 HTTP 200 单独下载至 /tmp/bungee-original.ogg，16833 字节；SHA-256 7dc66d1d6ef78fcdcc8ee08011c2e3ed8695158fece09ea0ae3a4eeee469219d。ffprobe：Vorbis、44100 Hz、双声道、1.186803 秒；ffmpeg 完整解码成功。Whisper base 英语自动识别 “Bungie jumping”，属于辅助线索，不是人工听审或准确性证明；未进行人工试听。
- scripts/mobile-pronunciation-assets.ts 将 manifest 指向的 MP3 经文件哈希验证后独立复制到 mobile-public/offline/recordings/，产出含作者、原始页、许可链接及可选注记的 credits 行；scripts/mobile-assets.ts 生成 credits.html 并注明转为 MP3，来源和许可链接需要联网。该脚本的 THIRD-PARTY-NOTICES.txt 目前不包含 FAL 全文。在线/离线实际发行是否满足该具体来源许可、是否需更具体转码标记，须基于明确版本进一步审查。
- 本轮只做调查，没有转码导入、修改 manifest 或用户数据。临时原文件不属于项目发行物。
