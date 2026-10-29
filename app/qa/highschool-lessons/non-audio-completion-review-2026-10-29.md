# 高中非录音完成度复核

2026-10-29；以 catalog/离线 seed v135 为范围。以下是可验证的覆盖或行为，不是语言专家对全部内容的签字验收。`npx tsx qa/highschool-lessons/scan-non-audio-stable-keys.ts` 使用 stable key 和实际 reader 的本次结果：2730 个高中唯一词条，映射缺失 0、reader pending 0，IPA 全空 257、无音形映射 755、单义项 1904、占位保护 50；这些计数产生于本次补 `break away` 之前，数值会随修订变化。

| 范围 | 已实现及证据 | 仍需处理或无法仅靠结构证实 |
| --- | --- | --- |
| 教材词表 | 人教版七册的单元对照记录见各 `*-wordlist-audit-2026-10-29.md`，已确认漏项跟进见 `seven-book-wordlist-open-differences-2026-10-29.md` 和 `non-audio-current-priorities-2026-10-29.md`。 | 记录中涉及教材页的审计，不等于教材所有正文词、所有义项都已覆盖；Log 与 log、from (then) on 重叠身份仍需兼容迁移设计，不能简单合并。旧生成脚本尚不能无损重建完整 catalog。 |
| 讲解与例句 | 2730 项当前可由实际 reader 返回 reviewed 讲解；`contextual-example-audit-2026-10-29.md` 有模板抽查和具体修订记录。 | reader 只证明身份、结构和审核标志；1904 个单义项是复核候选，不等于缺陷。例句通顺、词性、译文及教材义项完整性仍需逐条语义核实；不能称已全部经教师审校。 |
| 音标及发音拼写 | 以实际 reader/getSoundSpellingLessons 统计；已完成的分批词典复核见 `phrase-ipa-*` 和音形专项审计。 | 257 个三类 IPA 均空和 755 个音形未命中含专名、缩写、短语及单音节，不可视作同等缺陷或机械拼接；需优先教材常见词逐项查证。词形映射差异亦须另查 `phonics-lesson-forms-followup-2026-10-29.md`。 |
| 练习 | `test/highschool-fresh-install-flow.test.ts`、`test/highschool-unit-restart.test.ts` 覆盖隔离库中新词、选项、跨天、未完成与重启；`test/highschool-spelling-variants.test.ts` 覆盖已列拼写变体。 | 50 个骨架/特殊专名只认词，不能声称已覆盖拼写和听写；具体语境题需产品及迁移设计。测试不能证明长期复习效果，也不等于家长或孩子真实使用验收。 |
| 跨设备 | `cross-device-identities-2026-10-29.md` 中模拟 ID 偏移 100000，2730 项线上、离线源码和现有离线资源均 ready；真实 tsx 启动有自动回归。 | 模拟不能替代已安装 APK 的真实升级和用户设备验收；不验证词条语义、录音或播放口音。 |

## 本次确定性修订

教材常用短语 `break away`（必修二 Unit 4，stable key `break away`）原讲解无音标。Upstream Pre-Intermediate Companion 第 6c.9 项直接标记整组 `/breɪk əˈweɪ/`，故将其加为通用音标并记录来源，不机械组合；例句读法会随句子重音变化。来源：https://learningclub.egis.com.pl/zasoby/de480c75/1_upstream_pre-intermediate_companion.pdf 。`in shape`、`fade away` 暂未找到同等可确认的完整短语及重音来源，保持空白。本次不判断录音及口音。实际 `validateLesson`/reader 与 IPA 页面回退相关 3 文件 10 测试通过；索引一致性检查通过。离线打包资源未在本步骤重建。
