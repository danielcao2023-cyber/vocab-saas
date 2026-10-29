# 高中音形缺口复核与人名补充（2026-10-29）

重新运行 `npx tsx qa/highschool-lessons/scan-mixed-phonics-gaps.ts`，对 seed 中有高中归属、实际展示词头经生产 `mainHeadwords` 解析得到至少两形式的 3 个 stable key 逐形式调用 `getSoundSpellingLessons`；3 个均各形式有返回，部分缺失和全部缺失均为 0。结果与全部形式保存在 `mixed-phonics-coverage-2026-10-29.json`。此统计仅覆盖生产解析器当前实际拆出的形式，不等于教材中所有拼写变体都已显示或审核。

本批对前次 CMU 单词多音节候选按证据分流：

- **已补、已测**：Carla、Aisha。剑桥姓名词条分别给英式 /ˈkɑː.lə/ 和英美 /aɪˈiː.ʃə/，音形对照已接入口；分别注明英美差异及具体姓名可能有不同读法。来源 https://dictionary.cambridge.org/pronunciation/english/carla 和 https://dictionary.cambridge.org/pronunciation/english/aisha 。分组是教学辅助，不声称反映实际教材人物的真人发音。
- **逐字读缩写，不作为普通词多音节分词**：CE、GPS、DDT、BBQ、CV；这些是否单列字母发音辅导是独立产品决策。
- **同形误命中或音节/口音变体待核**：leant（CMU 条目涉及同形姓名，不能覆盖普通动词变形）、iron、hire、wire、sour、fine、AI。英美具体发音应逐个核对，不将 CMU 某项自动认作该词条的标准分音。参见 https://dictionary.cambridge.org/pronunciation/english/iron 、https://dictionary.cambridge.org/pronunciation/english/hire 、https://dictionary.cambridge.org/pronunciation/english/sour 。
- **剩余姓名或专名待核**：Roderick、Oliver、Edmonds、Sami。Roderick 的剑桥条目给 UK /ˈrɒd.ər.ɪk/、US /ˈrɑː.dɚ.ɪk/，与候选机器音节数不一致；须先处理口音、姓名身份及发音分段。Oliver 搜索得到的剑桥小写 oliver 条目不应直接当作教材人物身份依据。
- **CMU 未命中待核**：BCE、chiwen、cm、Dollywood、Kazak、CPR、Giverny、gramme；其中多为缩写、专名或英式拼写，不能依据缺失推断音节。

本批后再次运行 `scan-non-audio-stable-keys.ts`，2730 个高中 stable key，getter 无结果 **755**：459 纯字母词头、290 含空格、6 其他；0 个 seed 映射缺失。基于 `cmudict==1.1.3` 的辅助分类：435 全部机器读法为一音节、11 全部为多音节、5 为混合、8 未命中，详细清单保存 `phonics-candidate-classification-2026-10-29.json`。该分组不是语言学审核结论，尤其是姓名、异形词和英美变体；`phonics-current-gap-assessment-2026-10-29.md` 内的 757 和 13 是前一快照的历史数，此处以新快照为准。

运行 `npm test -- --run test/highschool-carla-aisha-phonics.test.ts test/sound-spelling-coverage.test.ts`：4 项测试通过，包含真实前端 getter、各字母拼写和音素、重音以及原有 813 词覆盖。未处理录音，亦未试听这两位教材人物的发音。
