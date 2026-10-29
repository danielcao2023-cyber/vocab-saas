# parcel 审计缺口跟进

已有 `batch-3941-3960-deep-2026-10-29.md` 标注 3957 parcel 缺少动词例句。实际检查确认名词与动词混为一个义项，原有两句仅用名词。根据 [Cambridge parcel something up](https://dictionary.cambridge.org/dictionary/english/parcel-up) 和 [Collins parcel](https://www.collinsdictionary.com/dictionary/english/parcel)，分出包裹名词与打包动词，新增两个原创例句、搭配和英美拼写说明；未更改录音。词典支持含义及用法，并非逐句母语者审核；parcel 的其他词义尚未完整审核。

运行 `npm test -- --run test/highschool-parcel-sense.test.ts`，通过 1 项：调用实际 `validateLesson` 和 `createLessonReader`，验证两义项及动词例句。原审计中的 3393 motion、3398 collapse、4063 handwriting 待补义项已由其他后续修订填入，本批未再编辑。尚未发现其他明确且仍未修复的审计缺口，不推测凑数。
