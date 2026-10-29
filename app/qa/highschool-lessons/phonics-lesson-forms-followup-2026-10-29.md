# 高中 lesson 词形音形复核（2026-10-29）

以高中 catalog v135/seed v135 的 stable key 映射调用真实 `createLessonReader`，对每个 ready lesson 的 `forms`，筛选纯字母且与 catalog 主词头不相同的表面形式，再调用 `getSoundSpellingLessons`。运行 `npx tsx qa/highschool-lessons/scan-lesson-form-phonics-gaps.ts` 可复现；逐行快照 `lesson-form-phonics-coverage-2026-10-29.json`。总计 544 条形式记录，其中 524 条没有直接音形映射，去掉同一词条同一拼写的重复语法标签为 453 对。它们含单音节、同形异音、罕见变形、词族及已有其他来源的形式，既非 453 个教材独立词头，也不能视为 453 个错误；筛选只覆盖现有 lesson.forms，不代表穷尽词形。

- **已补并展示**：curious 的 forms 中 curiously 和 curiosity 为教材已有词条 curious 的词族形式，并非声明为教材单列词头。剑桥英式整词音标分别 /ˈkjʊə.ri.əs.li/、/ˌkjʊə.riˈɒs.ə.ti/；补两个字母/音素映射，保留重音差别。来源 https://dictionary.cambridge.org/pronunciation/english/curiously 和 https://dictionary.cambridge.org/pronunciation/english/curiosity 。分组为教学辅助，不代表词典逐字母背书；展示清楚说明英美口音区别。
- **页面接入约束**：只对明确审核的 curious -> curiously/curiosity 开放选择，且目标确实在当前 lesson.forms 中时才展示；主词 curious 仍默认。不能对所有 forms 自动开放，因例如 deserts 有“沙漠”复数与“遗弃”第三人称两种读音，同形会混淆；除当前明确列表以外，映射存在也不自动成为相关词形按钮。原题目和答案处理不变。
- **继续待核**：designing 的 Cambridge 可查同拼写形容词音标，但当前 lesson 记录是动词分词，尚需确认用途和同音证据；其余候选必须逐词核读音和音节，尤其 ing、ed 是否增加音节及美英变体，不能凭拼写拼接或机械批量生成。

`npm test -- --run test/highschool-curious-related-phonics.test.ts test/sound-spelling-coverage.test.ts`：5 项通过。真实 reader、Vue 服务端渲染、getter、字母重建和重音及原 813 项覆盖均已检查；`npm run typecheck` 通过。未做浏览器点击切换、播放或真人录音校验；本批未处理录音。
