# 教材已列拼写变体：补充接受答案

2026-10-29。范围为现有七册逐 Unit 审计中明确注明的变体，以及必修一 Welcome Unit 原页可确认的两组，不是对所有教材括注进行穷举。现有 9 组保持不变。本轮逐项对照教材、词典、catalog v135 与 `acceptedSpellings`；发现下列 7 组裸词头此前互不接受，而两种词头均独立存在于 catalog。新增显式双向接受仅影响判分及题目答案长度，不合并词条或学习记录，也不扩展动词变形、词组或同义词。

| 变体 | 教材证据 | 词典依据 |
|---|---|---|
| organise / organize | 必修一 p.112，Welcome Unit；人教社本地页面 120.jpg（见 `compulsory1-welcome-wordlist-audit-2026-10-29.md` 哈希）标 NAmE -ize。| [Cambridge organize](https://dictionary.cambridge.org/us/dictionary/english/organize) |
| organisation / organization | 同上 p.112 标 NAmE -ization。 | [Cambridge organization](https://dictionary.cambridge.org/dictionary/english/organization) |
| recognise / recognize | 必修一 p.114，Unit 2，本地出版社 122.jpg（哈希见 `compulsory1-unit2-wordlist-audit-2026-10-29.md`）标 NAmE -ize。 | [Cambridge recognize](https://dictionary.cambridge.org/us/dictionary/english/recognize) |
| civilisation / civilization | 同上 p.114，标 NAmE -ization。 | [Cambridge civilization](https://dictionary.cambridge.org/us/dictionary/english/civilization) |
| harbour / harbor | 选必二 p.112，Unit 4；本地 PDF 物理页 119，哈希与路径见 `optional2-unit1-wordlist-audit-2026-10-29.md`，词头括注 especially US harbor。 | [Cambridge harbor](https://dictionary.cambridge.org/dictionary/english/harbor) |
| enrol / enroll | 同上 p.112，括注 especially US enroll，义为加入、注册。 | [Cambridge enrol](https://dictionary.cambridge.org/us/dictionary/english/enrol) |
| inquire / enquire | 选必一 p.110，Unit 4；本地 PDF 物理页 117，哈希与路径见 `optional1-unit-boundaries-2026-10-29.md`，教材明确写 `(= enquire)`，义为询问、打听。 | [Cambridge inquire](https://dictionary.cambridge.org/us/dictionary/learner-english/inquire) 将 enquire 列为英式变体；[inquire into](https://dictionary.cambridge.org/us/dictionary/english/inquire-into) 也列英式 enquire into。某些正式语域存在用词偏好，因此只对独立动词词头按教材含义互认，未推广到其他词组或变形。 |

`catalog.json` 中上述每个拼写的 key 均为对应词头、都独立属于该高中 Unit，也可能属于考试词书；本次不变更任何 key、ID、成员、词义和历史记录。其余审计所列 `bean curd` / `tofu`、`transport` / `transportation` 等是不同词或语义关系，未作为拼写变体；`tornadoes` / `tornados` 为复数词形，本轮未扩展。其他教材括注未作穷举，不能把本报告当作全部变体已经找齐。

回归：`test/highschool-spelling-variants.test.ts` 345 项通过；覆盖两个方向、原词头及括注、旧练习、V2/V3、在线/离线、拼写/听写、已发题恢复、答案长度、各新增词对保持独立身份和另一条记录不变，以及拒绝泛化 `inquired` 和 `inquire into`。`npm run typecheck` 通过。未验证真人录音。
