# 选择性必修一 Unit 1 教材义项补充（2026-10-29）

依据已核查的教材词表 PDF 印刷页 106（物理页 113；出版社册次 https://book.pep.com.cn/1412001124191/，本地教材 PDF 的来源和 SHA-256 见 `optional1-unit-boundaries-2026-10-29.md`），核实 catalog stable key、headword、Unit 1 归属以及当前 lesson 数字 ID；不改变 catalog、词头、ID、学习记录或录音。

| stable key / ID | 新增内容 | 直接释义依据 |
|---|---|---|
| vital / 2691 | 补教材“充满生机”义、例句。 | https://dictionary.cambridge.org/dictionary/learner-english/vital |
| extract / 2701 | 拆出动词提取/取出、名词摘录、名词提取物；补拔出牙齿和提取物例句，保留原两句。 | https://dictionary.cambridge.org/dictionary/english/extract |
| obtain / 2704 | 增加正式不及物“情况、规则存在或通行”义和例句；说明通常不用进行时。 | https://dictionary.cambridge.org/dictionary/english/obtain |
| flow / 2721 | 分开动词流动与名词流动、持续供应，保留原两句并补信息流例句。 | https://dictionary.cambridge.org/dictionary/english/flow |
| patent / 2732 | 增形容词“受专利保护的”，补例句并扩展词性。 | https://dictionary.cambridge.org/dictionary/english/patent |

另检查 boil / 170：教材列“沸点”，既有 noun 解释沸腾状态，而剑桥的 boil 名词指沸腾状态或起沸，并非温度定义；准确温度为 boiling point，故未机械补写或误导学生。参考 https://dictionary.cambridge.org/dictionary/english/boil。

`npm test -- --run test/highschool-optional1-meaning-followup.test.ts` 通过，逐项调用实际 validateLesson 与 createLessonReader 检查五词新义和例句。释义基于所列词典，例句除常见短搭配外为原创，未经教师或母语者逐句审校；未声称完整覆盖所有义项和音标变体。
