# 高中词头占位符出题审计

范围：catalog version 133 中至少属于一本 `pep2019-` 词书的 2730 个唯一词条；以正则 `\b(?:sb|sth)\b|\.{2,}|…|[()]` 按词头扫描，命中 45 项（其中 18 项含省略号、26 项含 sb/sth，另有 1 项括号形式）。这是规则扫描，不保证能发现所有不含上述标记的语法骨架。当前实现：`server/src/text.ts` 中 hasDictionaryPlaceholder 保护带句点的 sb./sth. 与三个显式列举的句型；`learning/evidence-store.ts` 让命中项只发认词，V3 首次未命中项初始为拼写，V2 policy 对未命中项也可能安排拼写或听写；V2/V3 的已发题恢复与提交也依据同一检测函数。`acceptedSpellings` 位于 `server/src/study.ts`。下述结果通过直接运行实际函数复核，是符合调度条件时可能发题，不声称这轮已实际向用户派出。

## 16 个未保护的省略号骨架

- 必修一 Unit 3：`cut ... out`、`compare ... with ...`、`compare ... to ...`。
- 必修一 Unit 5：`date back to ...`。
- 必修二 Unit 1：`prevent ... from`、`donate ... to ...`。
- 必修二 Unit 3：`keep ... in mind`。
- 必修二 Unit 4：`join ... to ...`。
- 必修三 Unit 1：`range from ... to ...`。
- 必修三 Unit 5：`to ... extent`、`in a ... manner`。
- 选择性必修一 Unit 2：`keep in touch with ...`。
- 选择性必修一 Unit 5：`devote ... to`。
- 选择性必修二 Unit 3：`slice ... off`。
- 选择性必修三 Unit 1：`bring ... to life`。
- 选择性必修四 Unit 1：`on a ... basis`。

每项 hasDictionaryPlaceholder 返回 false，acceptedSpellings 仅接受其本身带字面省略号的字符串，不接纳补入具体对象的自然表达；dictation 的 audioWord 也来自同一骨架。V3 能将它们作为初始拼写题，也可能在后续发听写；V2 同样有风险。剩余的 `leave ... alone` 和 `prefer ... to ...` 在显式保护清单内，不属该漏判。

## 括号形式

必修二 Unit 5 `from (then) on` 未被保护；acceptedSpellings 返回 `from on` 和 `then`，自然表达 `from then on` 未被这一词条接受。catalog 同时存在独立词条 `from then on`，不代表前一词条可以安全出拼写/听写。教材这个括号可能表示两种表达，但不能机械地删括号后组合成 `from on`；也不能将孤立 `then` 当整个短语答案。需分别设计词条答案及旧学习记录兼容，避免重复统计。

## 已被保护项与限制

当前 26 个 sb./sth. 项中各词头均使用句点表示且命中现有规则，已有仅认词及旧题保护；语义中缺失成分但不带本次标记的表达仍需人工进一步审计。识别卡是否能提供足够学习价值、已存历史数据如何投影，均未在本次检查中做出验收结论。建议将 16 个缺口先与现有骨架一样限制为认词，并保护升级前已发题；`from (then) on` 因已有完整重复词条，先单独设计去重与答案兼容。

## 建议的有限修复及回归验证

1. 对上述 16 个确证省略号词头、以及 `from (then) on` 使用显式名单或严格的省略号词头保护（不对所有括号形式一概限制）；沿用现有仅认词策略。保持展示、catalog key、ID、学习历史不变，V2/V3 已发未答拼写/听写采用已有停用并重新发题逻辑；已提交结果保留，提交时返回 409 不能误记新错题。注意 V3 对这类词的熟练程度是认词证据投影，不能宣称已验证拼写或听力。
2. `from (then) on` 在词头中保留教材写法并暂时认词，避免更改已存在的 `from then on` 及其历史。教材完整自然表达 `from then on` 可见 https://dictionary.cambridge.org/dictionary/english/from-then-on ；不要把独立 `then` 或不完整 `from on` 作为该短语拼写答案。将来如要恢复拼写，须明确两词条去重、答案和旧发题快照，不能全局改括号变体规则。当前代码按 `from on`、`then` 生成两种字母长度，短答案 `then` 如果用户选该长度并输入就能被服务端判对；从完整 `from then on` 输入会被拒绝，并不表示认词题会被错误评分。
3. 测试每个名单词头 V2/V3 在不同初始/复习状态及在线、离线共用引擎中不发 spell/dictation；模拟升级前未答旧题在恢复后失效并以认词重发；旧题迟到提交不改变事件与学习记录；已答历史不被删除；普通带省略号以外的词与正常括号变体不受影响。验证 `from (then) on` 不再生成错误 pattern 或误接受 `then`，独立 `from then on` 仍可按正常短语测试。
