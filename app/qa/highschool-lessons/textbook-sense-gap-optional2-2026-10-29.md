# 选择性必修二教材义项和例句缺口

2026-10-29；对照人教高中选必二单元词表印刷页 112–113（本地教材 PDF 物理页 119–120），再查词典及现有 lesson。教材版本、原始路径与校验值见 [Unit 1 核查记录](optional2-unit1-wordlist-audit-2026-10-29.md)。只补有明确教材义项且原 lesson 不充分覆盖之处；新增例句为原创，尚未经独立英语教师逐句审校，不涉及录音。

| 词条 | 核对结果与处理 | 依据 |
|---|---|---|
| steel 3311 | 教材列钢铁工业；新增 the steel industry 搭配和例句，钢铁行业为名词修饰用法，未误设为独立动词义。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/steel) |
| slip 3363 | 原有滑倒和小错误示例，补悄悄溜走及纸条两个独立义项，各含两例。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/slip) |
| fabric 3354 | 原只有布料，补组织、社会结构义项和例句。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/fabric) |
| fellow 3380 | 原含同伴形容词和学会会员名词，补男人／家伙的非正式名词义项，注明语域。 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/fellow) |
| blister 3351 | 原有皮肤水疱和油漆起泡动词，补表面气泡名词义及漆面例句；教材也提金属表面，本次例句不推断金属成因。 | [Merriam-Webster](https://www.merriam-webster.com/dictionary/blister) |
| drown 3373 | 教材有淹没；实时 lesson 已有该义项及例句，不重复修改。 | 本地教材第 113 页 |
| proceed 3305、shore 3307、accent 3314、owe 3316、swell 3349、nerve 3353 | 实时 lesson 已涵盖教材所列主要义项及相关例句；catalog 的其他考试词义并不能据此认作教材缺漏。 | 本地教材第 112–113 页 |

验证：5 份修改均实际通过 `validateLesson`，`createLessonReader` 返回 ready、义项数量与 JSON 一致；`npx vitest run test/lessons.test.ts` 为 1 个测试文件、6 项通过。校验不等同于教师对例句的语言质量审核，也不验证完整词条或录音。
