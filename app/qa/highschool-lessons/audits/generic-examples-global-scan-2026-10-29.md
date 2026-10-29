# 高中讲解模板例句筛查（2026-10-29）

执行 `npx tsx qa/highschool-lessons/scan-generic-examples.ts`。脚本只读 catalog v135、内置 seed stable-key 映射和实际 `createLessonReader`；遍历全部 2730 个有 `pep2019-` membership 的唯一词条的主义项英文例句，按六个固定短语筛查“文章/报告讨论 X”等表达。修改前 reader pending 为 0、命中 41 个例句，修改后 reader pending 为 0、命中 34 个。命中是优先审查候选，不自动代表错误；未查每个命中项，更不能证明其他例句、教材释义、音标全部正确。统计仅限本机 seed 和当前源码，不代表其他设备。保留脚本供复现，数据变化后数量可能变化。

本次人工检查并修改下列 7 条中的泛化例句，保持 stable key、词条、义项及例句 ID：

| ID/key | 改动说明 | 词义参考 |
|---|---|---|
| 3053 diarrhoea | 改为患者向医生或护士描述腹泻的语境。| [Cambridge diarrhoea](https://dictionary.cambridge.org/dictionary/english/diarrhoea) |
| 3054 dehydration | 改为脱水使人虚弱与医生检查脱水的语境。| [Cambridge dehydration](https://dictionary.cambridge.org/dictionary/english/dehydration)、[dehydrated](https://dictionary.cambridge.org/dictionary/english/dehydrated) |
| 3496 tobacco | 改为烟叶和香烟含烟草的具体语境。| [Cambridge tobacco](https://dictionary.cambridge.org/dictionary/english/tobacco) |
| 3497 alcohol | 改为清洁剂成分及不含酒精饮品的语境。| [Cambridge alcohol](https://dictionary.cambridge.org/dictionary/learner-english/alcohol) |
| 3526 cigarette | 改为禁烟标志与烟头的具体语境。| [Cambridge cigarette](https://dictionary.cambridge.org/dictionary/english/cigarette) |
| 3533 sugary | 改为含糖饮料与水的选择；保留蛋糕的例句。| [Cambridge sugary](https://dictionary.cambridge.org/dictionary/english/sugary) |
| 3552 starve | 增加食物不足的语境并区分挨饿与饿死。| [Cambridge starve](https://dictionary.cambridge.org/dictionary/english/starve) |

词典用于核实词义和用法，不代表逐句母语者审校。没有重新审核这些词全部音标与教材义项，也没有完成对全库释义/音标的逐项语义核查；病例例句仅说明语言用法，不作为诊疗建议。7 条实际 reader 和 validateLesson 测试、`npx tsc --noEmit` 通过。未处理录音。
