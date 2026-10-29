# 高中静音描述与配对候选扫描（2026-10-29）

执行 `cd app && npx tsx qa/highschool-lessons/scan-silent-letter-claims.ts`。通过 catalog v135、离线 seed、生产 getter 获取 1979 个去重高中已有映射，在每块提示及全词口音说明中，筛查单个英文字母被描述为“不发音/不读/不单独发音”，但同块或全词配对中又存在该字母且标了声音的情况。扫描生成 199 条候选及其上下文，见同名 JSON，包含因同一文本在 hint、tip 重复出现的重复结果。

不能将 199 条当作实际错误：样例 formal 的说明讲英式词尾前 r，所显示音形是美式；confidence 的不同 e 分别发音与静音；assist 的“双写 s 不读两次”表示共同发 /s/，而不是静音。筛选全文仅出现一次相关字母且该提示不含“英式/英音”的候选，结果为 0；这仍不是词典核验或正确性证明，因为文本可能描述其他口音、词根或变体，且规则会漏掉多字母组合、其他措辞及拼写重复造成的错误。

本轮没有证据充分的可修改项，未对 199 个候选逐条核实，不声称无静音错误。真实 getter 定向、结构和覆盖测试 3 文件 9 项通过；未处理录音。

本轮人工核对 8 个候选（仅核所列静音说明和相关 IPA，未覆盖整词所有拼写）：

- engage：两处 e 不同，词尾 e 不单独发音的说明并不与词首 e 的 /ɪ/ 冲突；但应说明结尾 ge 的拼写作用。已依据 [Spellzone 软 g 教材](https://www.spellzone.com/unit19/page8.cfm) 增加 e 提示词尾 g 是软音的说明；整词 [剑桥读音](https://dictionary.cambridge.org/pronunciation/english/engage) 不变。
- audience、reference：提示说末尾 e 不单独发音，与同词内部 e 的音素并不冲突；依据 [audience](https://dictionary.cambridge.org/pronunciation/english/audience)、[reference](https://dictionary.cambridge.org/us/pronunciation/english/reference) 保留。
- assist、innovation：双写“不读两次”非字母全静音，符合 [assist](https://dictionary.cambridge.org/us/pronunciation/english/assist)、[innovation](https://dictionary.cambridge.org/us/pronunciation/english/innovation) 中每组双写一个音，保留。
- Niagara Falls：描述仅针对美式示例 Niagara 的第二个 a，未否定首个和末尾 a 的读音；[现有 Wiktionary 所列英美 IPA](https://en.wiktionary.org/wiki/Niagara_Falls#English) 有该元音变体，保留。字母到音素的细分不是词典直接提供，仍为教学分组。
- Svalbard：说明明确此图英式读法的 d 发音，另外列其他 d 不发音变体；[现有 Wiktionary 英语词条](https://en.wiktionary.org/wiki/Svalbard#English) 同时提供两种，非矛盾，保留。
- make sense：描述词尾 e，不是 make 或 sense 中全部 e；候选来自重复字母，未查得整组词典标音，除局部文字误报判断外整词读音仍待核。

真实 getter、结构与覆盖测试 3 文件 6 项通过；其他候选未逐项核实，未处理录音。

第二批检查 venue、barbecue、escape、precise、recite、delete、emerge、release：

- venue、barbecue 的配对已把 ue 整体对应 /juː/，旧说明仍写 u 发音、e 不单独发音，虽然后者并非完全错误，但表达与组合教学不一致；改说明为 ue 对应 /juː/。依据 [Whickham 拼读课程](https://whickhamparochial.eschools.co.uk/storage/secure_download/YmJEZDg5MFhXbmJEUmhmeTJEZDExUT09) 的 venue 和 [兰开夏郡教材](https://www.lancashire.gov.uk/media/947083/bbp-sample-pages.pdf) 的 ue 读音规则。
- escape、precise、recite、delete 之前仅说末 e 不单独发音，现补充相应 a-e、i-e、e-e 分离拼写与长元音的关系；音标、字母配对和重音不变。依据[西澳学校拼写计划](https://www.serpentineps.wa.edu.au/_files/ugd/fae298_d7c1dbd01e5f4f11823fa100d9d7e30c.pdf) 对 e-e/delete 的明确例子，[学校 a-e 列表](https://www.montgomery-inf.essex.sch.uk/wp-content/uploads/2020/04/Week-Beginning-20.4-a_e-PDF.pdf) 对 escape 的例子，及[维多利亚州 phonics 课程](https://www.education.vic.gov.au/school/teachers/teachingresources/discipline/english/literacy/readingviewing/Pages/phonics-scoping-sequences.aspx) 的分离元音组合。
- emerge 已解释末尾 g 在 e 前为 /dʒ/，release 的 ea 对应 /iː/ 且末尾 e 不单独发音；本轮保留原文。

真实 getter、元音组合、结构与覆盖测试 4 文件 12 项通过；检查范围只限上述表述，其他候选仍待核，未处理录音。
