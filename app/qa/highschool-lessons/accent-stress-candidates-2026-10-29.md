# 高中英美重音差异候选（2026-10-29）

运行 `cd app && npx tsx qa/highschool-lessons/scan-accent-claims.ts`；按 catalog v135 与离线 seed 的人教高中成员关系，使用生产 getter 查 1979 个去重的现有映射。只对默认 IPA、uk 都有主重音且 uk 字段为单一 IPA 的条目，粗略比较主重音前的连续元音组数，产出 25 候选。它是启发式候选，非错误清单：元音连写、双元音和不一致的音节分隔方式可产生假阳性，未标单音节重音和多选音标不在扫描范围。完整结果为同名 JSON。

本批核验四项：

- narrator：剑桥[美音首重音、英音次音节重音](https://dictionary.cambridge.org/pronunciation/english/narrator)；剑桥美音采用 /e/，而 [Merriam-Webster](https://www.merriam-webster.com/dictionary/narrator) 也列其他元音及重音变体，现有美式元音不能仅因剑桥写法不同就认错，不改。
- frustrated：[剑桥](https://dictionary.cambridge.org/us/pronunciation/english/frustrated) 明列美式首重音、英式第二音节重音，现有说明有依据，不改；美式词典细写闪音，与不标细节的普通音位标记不同。
- cigarette：[剑桥](https://dictionary.cambridge.org/us/pronunciation/english/cigarette) 英式后重音、美式首重音，与现有标法一致，不改。
- vibrate：[剑桥](https://dictionary.cambridge.org/pronunciation/english/vibrate) 英式后重音、美式首重音，与现有标法一致，不改。

其余 21 候选本批未独立核验；被筛出的 be attracted to、realistic 可能因连续元音组算法而误报，需人工判断。未被筛出不代表口音及 IPA 正确，本扫描没有逐词检查字母音素、音频或词典读音。结构、覆盖和跨重音测试共 3 文件 15 项通过；未改录音。

第二批 10 项：

- [outgoing](https://dictionary.cambridge.org/pronunciation/english/outgoing)：外向义英后重音、美首重音，与现有说明相符；离任义英美均可首重音，现有说明未将结论扩大至该义。
- [ballet](https://dictionary.cambridge.org/pronunciation/english/ballet)、[brochure](https://dictionary.cambridge.org/pronunciation/english/brochure)、[café](https://dictionary.cambridge.org/pronunciation/english/cafe)、[donate](https://dictionary.cambridge.org/pronunciation/english/donate)：现有默认与 uk 的主重音方向均与剑桥所列一致；donate 次重音未在本轮独立验证。
- [frontier](https://dictionary.cambridge.org/pronunciation/english/frontier)：美式后重音、英式前或后重音，现有表述保留了英式前重音为一种变体。
- [resource](https://dictionary.cambridge.org/pronunciation/english/resource)：所选美式和英式读法均在剑桥列项中，英式另有首重音变体。
- [moustache](https://dictionary.cambridge.org/pronunciation/english/moustache)、[mustache](https://dictionary.cambridge.org/us/pronunciation/english/mustache)：现有英美主重音与剑桥所列一致。
- [princess](https://dictionary.cambridge.org/pronunciation/english/princess)：剑桥英美两栏都列前、后重音，原说明将其分别归于英、美常见，词典未提供频率数据，表述证据不足；改为两种读法均可用于英美，保留示例分段与 uk 字段。

累计核查 14/25 条，其余 11 条尚未逐项核验；真实 getter 定向、结构及覆盖测试 3 文件 6 项通过。审计只覆盖上述音标及主重音，未核查所有字母对照与录音。
