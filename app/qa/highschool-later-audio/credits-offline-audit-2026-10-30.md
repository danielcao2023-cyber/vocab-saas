# 真人录音署名与断网展示检查（2026-10-30）

## 当前机制

服务端 `/api/pronunciation/credits` 对通过完整性验证的录音列出词头、作者、来源链接与许可链接，并统一说明已转换 MP3。移动资源生成脚本将对应作者与链接写入离线 `credits.html`，同样说明录音转为 MP3；词页通过单词锚点打开来源。通过录音数据的结构和哈希检查不代表逐条许可证或发音已审定。

对 `mobile-public/offline/credits.html#disappointment` 做隔离 Chromium 断网检查：页面仍能显示词头、作者 Dvortygirl、许可名称 CC BY-SA 3.0、原文件与许可链接，但点击许可进入离线错误页，无法读取外链许可全文或原页面。移动页面也明确提示点击来源及许可需要联网。链接 URI 载于静态 HTML，但此测试不能证明断网时普通用户可以阅读完整许可内容；实际安卓 WebView 的 `target=_blank` 和系统返回行为尚未验证。页面是否满足各许可在特定分发场景中的具体条件不在此次技术检查中下法律结论；可评估将适用许可文本随应用提供并保留每个录音来源、作者及转换信息。

## 缺失录音与播放

本轮修复前，词页即使元数据为 `missing` 也会在首次播放前显示“录音来源”，该入口在无对应录音时没有有效署名信息。现改为仅在默认录音 ready 或有已返回的可用变体时显示，元数据加载、缺失和失败时不显示；系统合成成功后保留“系统合成发音”标识。

默认录音缺失或媒体错误可回退系统语音；指定变体失败不会自动退回默认发音或系统合成，以避免混淆异读；自动播放被拦截会提示重试。15 秒无响应按当前实现提示失败而不自动触发语音回退，这一现状有定向测试，不等同于已确认缺陷。模拟器及真机播放、离线源页面入口和各条录音质量没有在此次检查中逐项验证。

验证：`test/audio.test.ts`、`test/audio-ui.test.ts`、`test/mobile-pronunciation-pack.test.ts`、`test/mobile-pronunciation-variants.test.ts`、`test/pronunciation-variants.test.ts` 共 39 项通过，`npm run typecheck` 通过。隔离 Vue 实际组件与 Playwright 在 1440×900 和 375×812 视口测试 ready 录音展示来源、切换 missing 词隐藏入口，JS 无 error、无横向溢出；模拟数据缺少部分释义字段导致 Vue prop warning。此验证不操作真实学习库或录音清单。
