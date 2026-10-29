# 选择性必修四五项教材用法补充（2026-10-29）

本机 seed v135 核实 `vocabulary_entry_map`：ID 3854、3923、3962、4021、4009 依次对应稳定 key dive、bond、dust、bounce、relay。教材词表印刷 p.107–110（本地 PDF 物理页 114–117；路径及 SHA-256 见 `optional4-unit1-wordlist-audit-2026-10-29.md`）有对应词性及义项。未改身份、归属或学习记录。

| 词条 | 缺口和处理 | 词典依据 |
|---|---|---|
| 3854 dive | 教材有跳水/潜水名词，原只有动词例；补名词例。| [Cambridge dive](https://dictionary.cambridge.org/dictionary/english/dive) |
| 3923 bond | 教材有建立信任关系的动词，原仅列名词例；补动词及例句。| [Cambridge bond](https://dictionary.cambridge.org/dictionary/english/bond) |
| 3962 dust | 教材列沙土、灰尘，原只有室内灰尘；补室外细尘语境，说明不等同于所有沙粒。| [Cambridge dust](https://dictionary.cambridge.org/dictionary/english/dust) |
| 4021 bounce | 教材有弹跳与弹性名词，原只有动词例；补名词分义及两例。| [Cambridge bounce](https://dictionary.cambridge.org/dictionary/english/bounce) |
| 4009 relay | 教材有接班的人，原仅有接力赛与转达；补轮班人员义。| [Cambridge relay](https://dictionary.cambridge.org/us/dictionary/english/relay) |

原合并义项保留；新增例句为原创，尚未经母语者审校。`createLessonReader` 和 `validateLesson` 的五项定向测试与 `npx tsc --noEmit` 通过；其他义项和音标未在本轮全面核查，未处理录音。
