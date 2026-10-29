# 高中音形对照：当前覆盖与候选分流（2026-10-29）

采用 `cd app && npx tsx qa/highschool-lessons/scan-non-audio-stable-keys.ts`，正式 catalog v135 和本地 `mobile-public/offline/seed.db` v135，按唯一高中 stable key 匹配 seed 中映射及展示词头，再调用生产 `getSoundSpellingLessons`；不读写真实用户学习数据库。快照 `non-audio-stable-key-coverage-refresh-2026-10-29.json` 列逐项键值和分类，扫描时间为 FIFA、NASA、Jewish 三项接入后。结果是 2730 个稳定键、映射缺失 0、返回任何音形结果 1973、无结果 757（纯字母 461、含空格 290、其他 6）。纯字母统计与是否多音节没有必然关系。

重要边界：返回任何结果不代表整个词条已被完整拆解；例如一个混合词头可能只得到其部分形式的讲解。扫描基于当前 seed，并非已安装 APK 或生产库。音形映射存在不表示内容已经语言教师或真人录音逐项审核。

纯字母候选使用 CMU Pronouncing Dictionary 的 `cmudict==1.1.3` 作可复现、非权威的美国读音初筛：`python -m pip install --target /tmp/phonics-cmudict cmudict==1.1.3`，接着 `PYTHONPATH=/tmp/phonics-cmudict python qa/highschool-lessons/classify-phonics-candidates.py qa/highschool-lessons/non-audio-stable-key-coverage-refresh-2026-10-29.json`。完整分组见 `phonics-candidate-classification-2026-10-29.json`：435 个词典读法均为单音节，13 个均为多音节，5 个混合，8 个未命中。此数字仅是基于 CMU 多个读法中元音音素数的机器候选，不是实际高中多音节缺口数；CMU 同形异义词和人名可能混淆，英美变体可能不同。例如 leant 被 CMU 当作两音节人名读法，普通动词变形不能机械认定；iron、hire、wire、sour 音节和口音有变体。13 项中包含 CE、GPS、DDT、BBQ、CV 等逐字读缩写、专名和变形，故不能据此批量造普通单词讲解。

本轮从明确有权威完整读音者补 3 项：Jewish /ˈdʒuː.ɪʃ/，FIFA /ˈfiːfə/，NASA /ˈnæs.ə/；后两项明确提示是按词读的缩写，不推广为字母拼读规则。来源依次为 https://dictionary.cambridge.org/pronunciation/english/jewish 、https://dictionary.cambridge.org/pronunciation/english/fifa 、https://dictionary.cambridge.org/pronunciation/english/nasa 。结构拆分是教学辅助而非词典对每个字母的直接标注；针对性测试包含真实前端 getter、字母拼写完整性、音素和重音。`npm test -- --run test/highschool-jewish-phonics.test.ts test/highschool-fifa-nasa-phonics.test.ts` 两项通过。未处理录音。

后续批量顺序：先审查 13+5+8 个单词候选，剔除逐字缩写、同形人名误命中和单音节；在教材与词典核实每个词头、选定口音/音标、真实音节和重音，再由生成工具提出拼写音素草稿，人工复核合并/静音、变体和来源，调用运行时 getter、校验原词拼写重建与音素顺序。290 个多词词头分为完整短语、带可替换占位骨架、专名三类，仅在可核对整组音标时制作，不把多个单词的音标拼接成确定的短语重音。6 个其他形态分别判断连字符、外文及专名。建立审计 ledger 记录每一候选已完成、无需映射、变体或来源待核，避免把自动筛选误当审核；同时检查混合词头的所有实际形式，识别仅覆盖部分的条目。每批集成后复扫并保存快照，浏览器与离线包验收另行完成。
