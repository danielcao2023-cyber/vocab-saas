# 高中字典骨架：语境拼写候选与实施边界

按当前 catalog 高中 membership 和 `hasDictionaryPlaceholder` 检索 50 条，排除因名称中数字而单独保护的 Portsmouth Square、Sputnik 1、Voyager 1、Soyuz 11，余 46 条语法骨架。该列表不是语法完整性证明；当前受保护词以认词训练，V2/V3 的能力选择及旧单卡、在途题保护见 `test/highschool-skeleton-regression.test.ts` 和 `test/placeholder-compat.test.ts`。

## 三条可进入小样设计的候选

不是已审核可投产题目。每题由人工编写完整语境、中文解释和明确拼写提示，并针对目标空格建立审定答案；允许评审指出同义词，不要求输入 `sb.` 或省略号。

- `prefer ... to ...`：示意 `I ____ tea to coffee.`（我喜欢茶胜过咖啡），目标空格 `prefer`。Cambridge 对 `prefer A to B` 有明确语法说明：https://dictionary.cambridge.org/grammar/british-grammar/preference 。该空格测试所给语境中的目标动词拼写，不是同时验证所有比较结构。最终题需确保替代合法表达不被无提示误判。
- `prevent ... from`：示意 `The fence can ____ the dog from escaping.`（围栏能够阻止狗逃跑），目标空格 `prevent`。语法结构参考 https://dictionary.cambridge.org/grammar/british-grammar/word-patterns-prevent 。`stop` 也可能成立，单凭译文只收 prevent 会误判；需增加清晰的目标词提示、承认提示依赖，或按题目语义审定其他答案，不可机械判错。
- `turn sb. down`：示意 `The manager had to ____ him down.`（经理不得不拒绝他），目标空格 `turn`。词义与代词位置参考 https://dictionary.cambridge.org/us/dictionary/english/turn-down 。应明确是拒绝请求，区分其他 turn down 义项；评审可检查其他合理填法及提示。

题目只验证给定句子中一个目标拼写和局部句型，不等同完整短语的所有用法，更不是听写能力。像 `from (then) on` 与已有完整词条、`keep ... in mind` 与 `keep in mind` 存在重叠，须先处理候选去重；教材标题词典符号不能被作为目标答案。

## 其余 43 条：尚需逐条设计并独立核对

本次不认定其不能出题，只是不足以安全定义答案集合、上下文、同义词及与现有词条的关系。可拆分的动词、可变对象/动词形式、多个介词和时态尤其需要逐个检查。

- `leave ... alone`
- `sign up for sth.`
- `pretend to do sth.`
- `cut ... out`
- `compare ... with ...`
- `compare ... to ...`
- `date back to ...`
- `donate ... to ...`
- `remind sb. of sb.`
- `remind sb. of sth.`
- `keep sb. company`
- `keep ... in mind`
- `join ... to ...`
- `break away from sb.`
- `break away from sth.`
- `absorbed in sth.`
- `absorbed in sb.`
- `set sth. up`
- `in addition to sb.`
- `in addition to sth.`
- `from (then) on`
- `dress sb. up`
- `range from ... to ...`
- `have sth. in common`
- `carry sb. through sth.`
- `tend to do sth.`
- `in the hope of doing sth.`
- `so as to do sth.`
- `provide for sb.`
- `be about to do sth.`
- `to ... extent`
- `in a ... manner`
- `be willing to do sth.`
- `keep in touch with ...`
- `devote ... to`
- `slice ... off`
- `take sb.'s breath away`
- `proceed to sth.`
- `owe sth. to sb.`
- `help sb. to one's feet`
- `bring ... to life`
- `on a ... basis`
- `take for granted`

## 实施约束

1. 使用经审核、按 stable catalog key 寻址的题库，每题保存原句/译文、空位边界、目标能力、具体目标变形、完整规范答案与允许变体、来源及状态。后端在发题时把已审版本及答案快照固化到 issue；客户端只能看到题干与空格，不能提前拿到答案。涉及给首字母或原形等提示时，要与无提示回忆分开记录。
2. 不解除 `hasDictionaryPlaceholder` 的全局保护，也不把语境拼写直接映射为现有 `spell` 整词拼写卡，更不能顺带启用 `dictation`。需先定义独立题型及能力证据、稳定级别和迁移策略；目前 V3 `capabilityNeeds` 明确排除了受保护条目的拼写/听写，V2 策略和旧练习也有独立保护，单改 UI 或 acceptedSpellings 会失效或产生错误证据。
3. 题目应确保语义可区分，合理同义答案要么接受、要么明确目标形式并记为有提示；检查大小写、词尾、标点、键盘和辅助功能。含空格和多空结构应考虑当前 `LetterSlots` 对字母数、固定标点和提交长度的约束。
4. 建立回归覆盖：受保护未覆盖项仍仅认词；受控题目只能提交自己的答案，符合语法的变体和常见错答；旧未答题/已答结果、重试幂等、题目内容升级后的快照、设备本地 ID 变化、离线重启；同义目标不在同日重复安排。独立回忆与提示后的练习须保留不同证据来源。
5. 三题先做桌面及手机可用性验证和逐条语言审校，尤其学生能否理解空位以及多解如何提示；再扩展其余词条。
