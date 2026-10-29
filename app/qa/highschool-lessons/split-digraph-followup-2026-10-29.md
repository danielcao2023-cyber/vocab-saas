# 高中词头音形对照：相邻字母组合复核（2026-10-29）

使用正式 catalog v135、seed v135 中带 `pep2019-` 归属的 stable key，按 seed 展示词头调用实际 `getSoundSpellingLessons` 并去重，运行 `npx tsx qa/highschool-lessons/scan-split-digraphs.ts`。扫描每个词的相邻单字母 pairs 是否构成 sh、ch、th、ph、wh、ng、ck，记录其两侧声音及是否跨 chunk。该工具只产生**人工复核候选**，不以相邻字母机械认定对应音素；发音、形态边界、音节、口音均可能改变映射。

本轮原扫描覆盖 1979 个唯一音形映射，31 个候选；以下 5 个在所展示的词典读法中把字母组合拆开，并使后一个字母显示无音，已合并：

| 词头 | 修订 | 依据与限定 |
|---|---|---|
| Christmas carol | Ch 整组对应 /k/，不再说 h 无音；保留 t 不独立发音。 | 原 Oxford 词组读音参考；[K12 LibreTexts ch /k/](https://k12.libretexts.org/Bookshelves/Spelling/02%3A_Consonant_Sounds_and_Spellings/2.05%3A_The_Consonant_Sound_k) 明确列 Christmas。 |
| elsewhere | wh 整组对应 /w/，保留现有音标和重音。 | 原剑桥 elsewhere 读音；[维多利亚州教育厅 phonics](https://www.education.vic.gov.au/school/teachers/teachingresources/discipline/english/literacy/readingviewing/Pages/phonics-scoping-sequences.aspx) 列 wh 双字母组合。 |
| whisper | wh 整组对应 /w/，保留现有音标和重音。 | 原剑桥 whisper 读音及上述 phonics 参考。 |
| nowhere | wh 整组对应 /w/，保留现有音标和重音。 | 原剑桥 nowhere 读音及上述 phonics 参考。 |
| strengthen | ng 整组对应 /ŋ/，不再将 g 独立标无音。 | [Cambridge strengthen](https://dictionary.cambridge.org/pronunciation/english/strengthen)；[加纳教育课程资源](https://curriculumresources.edu.gh/wp-content/uploads/2024/11/LM-intervention-English-Level-1-section-1-LVersion.pdf) 列 ng /ŋ/。 |

wh 在其他口音可能呈现不同读法，上述仅对应现有词典映射，不推广成无例外规则。修订后扫描剩余 26 条，逐条机器记录在 `split-digraph-coverage-2026-10-29.json`：25 条 ng 两部分都标有声音（如 exchange 的 /n/+/dʒ/ 或 kangaroo 的 /ŋ/+/ɡ/），不能直接合并；acknowledge 的 ck 跨 ac 与 know 词形片段，后一 k 属 kn，不凭相邻拼写判定。上述 26 条的判定只说明不能机械批改，**未声称逐一查词典、完整审核它们的发音和词源**。其他潜在多字母组合、缺少的音形、真人录音和英美音标一致性不在本扫描覆盖范围。

`npm test -- --run test/highschool-digraph-alignment-followup.test.ts test/sound-spelling.test.ts test/sound-spelling-coverage.test.ts`：6 项通过。验证真实 getter、上述组合、所有音形的拼写及音素重建、重音标记以及原 813 词覆盖；不更改录音。
