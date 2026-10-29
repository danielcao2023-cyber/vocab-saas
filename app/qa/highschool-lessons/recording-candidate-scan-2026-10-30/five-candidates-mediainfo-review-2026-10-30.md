# 五份候选录音的 Commons MediaInfo 复核（2026-10-30）

仅一次 Commons `wbgetentities` 请求，HTTP 200，5 个 MediaInfo 返回，未触发 429/503；原始响应见 `five-candidates-mediainfo-2026-10-30.json`。检查 P9533（所述词、语言）、P407（语言）、P275（许可实体）、P10893（录制者）和 P10894（发音者）。录制者/发音者字段解释参照此前 Spanish 已查的同类 Commons 原页面 extmetadata。

| 候选 | 英语词头与录制者 | 结构化许可 | 判断 |
| --- | --- | --- | --- |
| [patent / Arlo Barnes](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Arlo_Barnes-patent.wav) | P9533 patent/en、P407 Q1860；P10893 和 P10894 都给出 Arlo Barnes | P275 Q6938433（CC0） | 可继续核验的候选；patent 存在口音读法差异，须核对教材目标与音频 |
| [patent / Simplificationalizer](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Simplificationalizer-patent.wav) | P9533 patent/en、P407 Q1860；录制者和发音者均 Simplificationalizer | P275 Q6938433（CC0） | 可继续核验的候选；实际读音和口音待核 |
| [draft / Arlo Barnes](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Arlo_Barnes-draft.wav) | P9533 draft/en、P407 Q1860；录制者和发音者均 Arlo Barnes | P275 Q6938433（CC0） | 可继续核验的候选；实际读音和口音待核 |
| [Concrete / Status 401](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-Status_401-Concrete.wav) | 此响应没有 P9533、P407、P10893 或 P10894 | P275 Q6938433（CC0） | 词头及录制者未确认，暂不适用 |
| [orient / I learned some phrases](https://commons.wikimedia.org/wiki/File:LL-Q1860_(eng)-I_learned_some_phrases-orient.wav) | P9533 orient/en、P407 Q1860；录制者和发音者均 I learned some phrases | P275 Q18199165；本次未另查实体名称和许可原文 | 作者及词头有结构化声明，具体许可及名词/动词读法须核，暂不适用 |

上述三份 CC0 候选已从结构化声明核对词形、语言、录制者和许可，但未查本次原文件页 extmetadata、未下载解码或试听，亦不保证教材适配或离线可用；不等于已验收或导入。具体 P275 Q6938433 = CC0 的依据是此前 Spanish 文件的 Commons 页面元数据与其 MediaInfo 交叉结果。无候选在本轮修改 manifest、缓存、音频或用户数据。
