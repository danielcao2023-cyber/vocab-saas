# 高中音形：教材英美拼写变体复核（2026-10-29）

以高中 catalog v135 和 seed v135 按 stable key 查询展示词头；扫描 `answerForms` 中不属于 `mainHeadwords` 的片段，按其含义人工区分真实变体、例示、缩写说明、占位符和错误切分。运行 `cd app && npx tsx qa/highschool-lessons/scan-answer-form-phonics-gaps.ts`，生成 `answer-form-phonics-coverage-2026-10-29.json`。共 13 个解析片段，但不是 13 个有效变体：UNESCO 长称因逗号被错误分段；from (then) on 的骨架被拆成三个片段；app、gym、AI 的括号为释义而非拼写变体，不能作为独立词形；shelves 为单音节复数，此次不属于多音节缺口。

- **已补**：honour (AmE honor) 的 honor 原本找不到音形；依据剑桥美音 /ˈɑː.nɚ/ 新增 honor 独立映射，保留 h 不发音，并以美式拼写标注。原 honour 讲解此前使用美音，本次按剑桥英音 /ˈɒn.ə/ 改为英式音素和重音，明确英美读音差异。来源 https://dictionary.cambridge.org/pronunciation/english/honour 、https://dictionary.cambridge.org/pronunciation/english/honor 。分段为教学映射，词典证实整词读法，不证明真人录音一致。
- **已有**：organise (AmE organize)、recognise (AmE recognize) 两个单独词形原本各有映射；medium (pl. media) 的 media 已有独立映射，但复数括注暂不自动扩展为音形选择，保持现有行为。
- **显示逻辑已修**：音形 getter 只识别严格单词形式的 `(AmE word)`，并在原主词后追加已存在的拼写映射；不将其他括注、多个单词或缺失映射变成按钮。不改变 `mainHeadwords`、`answerForms`、题目答案和学习记录。`organise` 和 `recognise` 同样可切换美式对照。展示的默认对照仍使用主词，不把原始括注作为词本身。音频目标沿用 SenseLesson 的当前选择，选中 honor 时会传入 honor；本轮未试听或确认其是否有真人录音。

`npm test -- --run test/highschool-honor-variant-phonics.test.ts test/sound-spelling-coverage.test.ts`：5 项通过。新增测试读取真实 lesson、渲染实际 Vue `SenseLesson` 和 `SoundSpellingLesson` 服务端 HTML，检查两种词形按钮、英美对应音素、静音 h、字母完整性及非目标括注不扩展；原 813 词与多形式覆盖仍通过。`npm run typecheck` 通过。当前 in-app browser 不可用，SSR 检查未覆盖客户端点击切换或声音播放；需后续浏览器验证。
