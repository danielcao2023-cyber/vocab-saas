# 人教高中选择性必修一：单元边界及教材差异

核查范围：人教 2019 版选择性必修第一册，教材附录“各单元生词和习惯用语”印刷页 106–111。本地教材副本：`/Users/caogong/Documents/Codex/2026-10-26/vocab-expansion/sources/optional-1/textbook.pdf`，SHA-256 `94ec493439239c436326e228e3d3ad78c7053ac5abc005db5739119f6a98c33d`；该文件是同版公开 PDF 副本，并非本次从出版社网站重新取得。对应词表的来源、哈希和出版社册次链接见 `data/vocabulary/sources.json` 和 `data/vocabulary/unit-evidence.json`。

PDF 物理页 = 印刷页 + 7；教材页有两栏，阅读时应按栏从上到下，而不是按提取文本的左右逐行顺序。对应本地 `textbook.txt` 可搜索词头，但需回看 PDF 确认排版及符号。

| 单元 | 词表印刷页（PDF 物理页） | 教材首词 | 教材最后一项 | 目录边界情况 |
|---|---|---|---|---|
| 1 | 106–107（113–114） | physiology | Princeton | 首尾均对应 |
| 2 | 107–108（114–115） | phrase | the Amish | 目录起词一致，末项缺失，见下 |
| 3 | 108–109（115–116） | buffet | Dollywood | 首尾均对应 |
| 4 | 109–110（116–117） | interaction | Albania | 首尾均对应 |
| 5 | 110–111（117–118） | hybrid | DDT | 首尾均对应 |

明确缺口：教材印刷页 108 右栏 Unit 2 专名末尾依次出现 Melbourne、Christian、the Amish，接下来才是 Unit 3 的 buffet；现有目录 `pep2019-optional-1:unit2` 最后一项是 Christian（源表位置 156），源 XLSX 对应下一行已是 buffet，catalog 内不存在 `the Amish`。因此这是第三方源表漏项而非仅靠修改 Unit 边界能解决的问题。添加前需核定数据生成、版本升级、讲解与训练对专名的处理，不能仅手改数据库。

此项审计核对五个首尾边界及所述明确遗漏，**不是对各单元内部每个词和释义逐词核验**。另外，源表同一 Unit 的重复词形会去重；如语法变形或括号内英文解释是否应独立成学习卡，需逐项按产品规则决定，不能把数目差机械等同漏词。
