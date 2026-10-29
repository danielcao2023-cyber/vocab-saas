# 高中单元义项初筛：具名待核线索汇总（2026-10-30）

范围：仅自动读取 audits 目录中 28 份文件名含 full-sense-screen 或 core-followup 的报告；不是七册所有单元均已覆盖的证明，也不汇总其他命名的旧报告。逐行筛出明确指出具体义项、例句或教材归属疑点的表格行；泛称“例句待核”的整批不计入下表。这些是报告中的历史线索，可能已被其他并行批次解决；使用前须核对当前 lesson 和后续审计。

## 本批新获词典证据并修复

| 词头 | 依据 | 状态 |
|---|---|---|
| precisely | [Cambridge](https://dictionary.cambridge.org/dictionary/english/precisely) | 已补义项和例句，真实 reader/validateLesson 已通过 |
| exhibition | [Cambridge](https://dictionary.cambridge.org/dictionary/english/exhibition) | 已补义项和例句，真实 reader/validateLesson 已通过 |
| guarantee | [Cambridge](https://dictionary.cambridge.org/dictionary/english/guarantee) | 已补义项和例句，真实 reader/validateLesson 已通过 |

## 其他具名线索（原报告指向教材或记录词典有限证据，具体词义仍需逐项核查）

| 原报告 | 条目 | 原状态摘要 |
|---|---|---|
| optional2-unit3-full-sense-screen-2026-10-30.md | fibre / fibre | 纤维；膳食纤维；词典支持纤维可织成制品，原例句为材料纤维；“制品”作为独立词义缺证据，保持待核 |
| optional3-unit1-full-sense-screen-2026-10-30.md | realism / realism | 现实主义（艺术）；务实的态度；教材“逼真”义是否有对应例句待核 |
| optional3-unit1-full-sense-screen-2026-10-30.md | set apart from / set apart from | 使与众不同；区别；教材“使优于”义是否覆盖待核 |
| optional3-unit1-full-sense-screen-2026-10-30.md | noble / noble | 高尚的；贵族的；贵族；教材“宏伟的”义待核 |
| optional3-unit1-full-sense-screen-2026-10-30.md | mythology / mythology | 神话；神话学；教材“虚幻的想法”义未见例句，待核 |
| optional3-unit1-full-sense-screen-2026-10-30.md | ceramic / ceramic | 陶瓷的；陶瓷制品；教材“制陶艺术”义待核 |
| optional3-unit1-full-sense-screen-2026-10-30.md | entry / entry | 进入；入场；入口；条目；记录；参赛作品；教材“参与”义是否覆盖待核 |
| optional3-unit2-full-sense-screen-2026-10-30.md | Lao Zi / Lao Zi | 已核：教材 Unit 2 正文印刷页 15 作 Laozi，目录 Lao Zi 可作为正文扩展；未在单元词表单列 |
| optional4-unit1-full-sense-screen-2026-10-30.md | turn out / turn out | 结果是；原来是；关掉；后续已补到场例句；“使朝外”仍待核 |
| optional4-unit3-full-sense-screen-2026-10-29.md | royal / royal | 王室的；皇家的；待核：教材“高贵的”未独立示例 |
| optional4-unit3-full-sense-screen-2026-10-29.md | in hand / in hand | 在手头；正在处理；在控制中；待核：教材“可供使用”未明确示例 |
| optional4-unit3-full-sense-screen-2026-10-29.md | meanwhile / meanwhile | 与此同时；待核：教材对比用法未独立示例 |
| optional4-unit3-full-sense-screen-2026-10-29.md | arrest / arrest | 逮捕；拘捕；阻止；遏制；待核：教材名词“中止”未独立示例 |
| optional4-unit4-full-sense-screen-2026-10-29.md | mail / mail | 邮件；邮寄；待核：教材“发电邮给”缺例句 |
| optional4-unit4-full-sense-screen-2026-10-29.md | shade / shade | 阴凉处；色度；遮挡光线；灯罩；把图画涂暗；待核：教材“阴影部分”“加灯罩”缺独立示例 |
| optional4-unit4-full-sense-screen-2026-10-29.md | input / input | 输入；投入；意见；输入；待核：教材“投入”未独立示例 |
| optional4-unit5-full-sense-screen-2026-10-30.md | geometry / geometry | 几何学；待核：教材“几何图形”与词典结构义边界 |

本轮扫描命中 17 条历史线索；此数并非确认仍待修数量，不包含无具体疑点的普遍“待核”条目。若各报告单元或实际数据与教材不同，须另核出版社原版。对 fibre 的独立“制品”义已有词典材料纤维证据但未证实该独立义；保持待核。已修三项参考词典为本次新核证，新增例句自拟。

定向测试：`npm test -- --run test/highschool-optional3-unit1-pending-followup.test.ts`，2 项通过；包含本单元实际 reader 和 validateLesson。

## 必修册回查（2026-10-30）

上述 17 条具名历史线索均来自选择性必修，没有必修册的具名条目；必修三 Unit 3 的泛待核条目经源码抽查后，occur 原已有“想到”例句但未独立说明，已补分义；seek 的 seek to do 义及例句原未覆盖，现已补。具体来源与范围见 compulsory3-unit3-core-followup；不能据此推断其他必修单元均已完成核验。

## 逐条回查状态（2026-10-30）

以下对上面 17 条历史线索逐项回查当前 lesson 与各单元后续审计；仅针对列明疑点，不代表词条全义核查完成。

| 线索 | 当前状态及边界 |
|---|---|
| fibre | 已补纤维材料/织物；不能泛指所有成品 |
| realism | 已补艺术作品逼真性质 |
| set apart from | 已补优于同类语境，区别不必然意味着更好 |
| noble | 已补宏伟义 |
| mythology | 已补流传但可能不真实的观念 |
| ceramic | 已补 ceramics 制陶艺术及词形说明 |
| entry | 已补参加比赛相关义例 |
| Lao Zi | 已核教材正文出现，Unit 词表未单列 |
| turn out | 已补朝外、使朝外 |
| royal | 已补盛大/豪华，不能泛化道德高尚 |
| in hand | 已补现有可供使用资源 |
| meanwhile | 已据 Collins COBUILD 补语境对比义，不作普遍替换 |
| arrest | 已补停止/中止名词 |
| mail | 已补发电子邮件义 |
| shade | 已补绘画暗部、给灯加罩 |
| input | 已补资源投入 |
| geometry | 已补物体构型；单个几何图形宜称 geometric shape，不能无条件互换 |

本次新增 meanwhile 检查见 optional4-unit3 原审计及独立测试。以上是 17 条已登记具体疑点的状态；一般“例句待核”及未收录报告的其他疑点不在该计数内。
