# Naadam Festival 与 chiwen 的大小写核查

- 人教必修三 Unit 1 p.103 为 `the Naadam Festival`；当前 catalog key/headword `the Naadam festival`。两者指同一节日；将显示统一为教材写法属于编辑选择，而非当前答案错误。UNESCO 将 Naadam 描述为蒙古传统节庆：https://ich.unesco.org/en/RL/naadam-the-mongolian-festival-of-the-three-manly-games-00395 。
- 人教必修二 Unit 1 p.102 写 `Chiwen`，释义鸱吻；目前 key/headword `chiwen` 指屋脊饰。Getty Art & Architecture Thesaurus 使用小写普通名词 https://www.getty.edu/vow/AATFullDisplay?subjectid=300391202 ；中国文化网文章使用大写 https://en.chinaculture.org/library/2008-01/16/content_38999_4.htm 。因此大小写各有实际依据，教材形式差异确证但不能断言小写错误；建议保留小写，展示或教材说明中可注明教材写法。
- 当前 catalog 两个名称分别只有一个大小写不敏感匹配；这不代表所有用户设备不会有同名不同身份记录。Naadam 旧 catalog key 必须保留；词头条件修正应仅作用于原词库数据而不覆盖用户编辑、并守住冲突。`words` 的 source/headword 唯一约束和 importer 的条件更新须在目标设备上实测，不根据现有 catalog 断言设备无冲突。
- 固定 numeric 讲解为 1957 chiwen、2348 the Naadam festival。服务端和离线运行时严格校验 headword；改词头而不处理讲解会导致查不到或匹配失败。设备运行 ID 可不同，因此旧/new 大小写分别提供 keyed 讲解，原 numeric 内容留存，以便未被条件迁移（用户编辑或冲突）的旧设备继续读；新大小写 keyed 文件以教材显示为准。
- 已发拼写/听写按 `normalizeAnswer` 不区分大小写，仅改变大小写时理论上答案集合不变；需用 V2/V3 在迁移前发题、迁移后重试及重复提交的测试证明，并核对已提交事件与 due 不变。
- 测试建议：旧库升级保留 word ID、学习状态、错题、卡片、membership 和订正记录；模拟同名候选冲突与用户改动时不覆盖、不错误绑定；旧与新大小写分别在不同设备 ID 的服务端及离线包获取 keyed 讲解；新安装构建并确认题目判分。旧词与大小写修正不涉及录音处理。
