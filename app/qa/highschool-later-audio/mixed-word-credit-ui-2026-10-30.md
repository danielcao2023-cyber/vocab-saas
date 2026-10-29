# 混合词头录音来源显示核查（2026-10-30）

隔离种子与现有清单中找到 emperor/empress、host/hostess、prince/princess 三组词头；两侧各有音形对照和录音条目。原页面顶部链接始终属于主词；在音形面板选择 empress 并播放时，实际请求 empress 音频，但页面只有 emperor 来源，可能造成归属误解。

修复后，音形面板按所选词头查询元数据，仅在 ready 时显示该词来源及可用说明；切换词头或异步返回过期数据时不沿用上一个词的说明。真实播放退回系统语音成功后，面板改标系统合成并隐藏该录音来源；播放失败也不显示本次录音来源。顶部主词信息单独维护。在线和离线沿用各自现成来源链接构造函数。

隔离浏览器（1200×900）使用真实 emperor/empress 讲解、清单与模拟播放：切换到 empress 并点击播放，音频请求为 empress，来源链接同时正确指向 emperor（顶部）和 empress（面板）。未使用用户学习库。修复后截图 `/tmp/mixed-credits-before.png`（该临时文件名沿用原脚本，内容为修复后）。测试：`npx vitest run test/audio-ui.test.ts test/audio.test.ts test/explain-ui.test.ts test/mobile-pronunciation-variants.test.ts test/mobile-pronunciation-pack.test.ts test/lesson-ui.test.ts`，6 文件 72 项通过；`npm run typecheck` 通过。自动化覆盖混合词选择、系统语音回退与主词链接隔离，已有测试覆盖音频切换和离线录音包；本次没有逐条试听录音，也未单独做安卓真机 UI 验收或法律结论。
