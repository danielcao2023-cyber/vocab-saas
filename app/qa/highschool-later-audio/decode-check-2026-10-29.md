# 高中词条录音解码抽查

2026-10-29 从已构建的 `mobile-public/offline/seed.db` 查询高中词书成员，使用 `scripts/audit-highschool-recordings.py` 同样的主词头处理方式匹配 `data/pronunciation/manifest.json`，对其中存在的 2302 个不同主录音文件逐个运行 `ffmpeg -v error -xerror -i <file> -map 0:a:0 -f null -`，均成功解码，未检出错误。

这是本机文件的解码检查，不证明内容、口音、授权或音质正确，不包含缺失的 412 个主录音，也不替代人工试听或安卓实际播放测试。音频解码检查与清单/哈希审计是不同的检查；应按实际数据重新运行。
