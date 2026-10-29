# 高中讲解中的动词词形音形跟进

范围为 catalog v137 中人教七册词条的 lesson.forms；`npx tsx qa/highschool-lessons/scan-lesson-form-phonics-gaps.ts` 运行真实 getter，不访问用户数据库。当前 544 条形式记录中 522 条未匹配，重复词形及单音节均包含在内；这些是扫描记录数，不是确认缺陷数，也不能推断全部需要音形讲解。完整详情可按上述命令重生成。

| 形式 | 词典音标 | 证据 | 界面 |
|---|---|---|---|
| designing | /dɪˈzaɪnɪŋ/ | [Oxford design 动词词形](https://www.oxfordlearnersdictionaries.com/definition/english/design_2) | design 讲解中可选 |
| exploring | /ɪkˈsplɔːrɪŋ/ | [Oxford explore 动词词形](https://www.oxfordlearnersdictionaries.com/definition/english/explore) | explore 讲解中可选 |

Oxford 页面直接列英美完整词形音标；音形分组是教学说明，区别于词典仅给出完整词形 IPA。exploring 英式 r 后接元音时可听见；源读音不推断实际录音口音。只通过 reviewedRelatedSoundForms 显式白名单加上 lesson 真实存在的两项，不自动套规则添加所有词形。improving 的完整 -ing 音标本次未从可访问权威词典确认，暂不填；扫描不能判定该词无对应读音。

验证 `npm test -- --run test/highschool-designing-exploring-phonics.test.ts test/highschool-curious-related-phonics.test.ts test/sound-spelling-coverage.test.ts`：3 文件 7 测试通过；包含真实 reader、validateLesson、Vue SSR 原词页面和移除词形的负例，以及拼写、音素、重音和原有覆盖。未验真人录音、手机设备及所有其他词形。
