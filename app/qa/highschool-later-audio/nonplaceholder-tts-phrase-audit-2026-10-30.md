# 高中缺录多词词头的系统语音输入抽查

依据本轮离线种子生成的 387 项缺录快照 `/tmp/audio-source-gap-024.json`，筛选非占位多词词头并检查常见符号、sb./sth.、one's、oneself。未发现这一子集带有未展开的 sb./sth.；`seek one's fortune` 和 `commit oneself to` 是词典式原词形。脚本扫描不构成对每条发音和例句的听审。

使用 `test/tts-phrase-audit.test.ts` 调用实际 `speak()`，模拟录音失败并截取 SpeechSynthesisUtterance，验证 `on behalf`、`seek one's fortune`、`commit oneself to`、`the OB-GYN department` 原样进入系统语音。此测试不证明不同系统声线实际发音正确，未人工试听。定向运行 `npx vitest run test/tts-phrase-audit.test.ts test/audio.test.ts`：27 项通过。

`on behalf` 为 catalog 单列片段（3588，选必三 Unit 3），缺录时原样朗读；教材单列词头是 `on behalf of`（3589），参见 `qa/highschool-lessons/optional3-unit3-wordlist-audit-2026-10-29.md`。3588 的 lesson 明确说明不能孤立使用，并给出 `on her behalf`、`on behalf of the class` 示例；[剑桥词典 behalf](https://dictionary.cambridge.org/dictionary/english/behalf) 亦说明这两类结构。朗读词头片段并不必然是系统误读；是否将其单独作为练习词由产品策略决定，不能仅据此删除或合并两个已有身份及学习记录。未对用户数据库、词库和音频清单作修改。
