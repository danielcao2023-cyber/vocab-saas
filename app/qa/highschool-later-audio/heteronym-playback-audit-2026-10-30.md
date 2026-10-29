# 异读词变体显示检查

查看 WordView、SoundSpellingLesson、V3 学习播放和在线/离线录音访问：词页变体按钮传递显式 noun/verb，音标和自定义标签来自同一变体元数据；来源链接按词头显示来源列表；变体播放失败不会自动用系统语音代替。听写卡按 `audioWord` 播默认录音，已发题不保存录音文件快照：更新应用资源后未答旧题会听到更新后的默认音频；答案和学习记录独立保存，不因此改变。此结论是代码与定向测试结果，非安卓真机听辨。

complex 音形对照 /kɑːmˈpleks/ 与默认录音元数据 /kəmˈplɛks/ 都是已有记录的形容词变读；选择名词变体后，面板曾说“下方音形对照为默认读音”，表达不准确。现改为“刚播放所选读音；下方音形对照请参照其标注音标”，兼容 bow/tear 的变体键与语义标签不一情况。组件回归包含真实 complex 映射，并保留切词异步保护、失败和离线包测试。

本轮初见 discount 变体音标 /dɪsˈkaʊnt/ 与来源 /dɪˈskaʊnt/ 分界不同，不足以认定错误：[Oxford](https://www.oxfordlearnersdictionaries.com/us/definition/english/discount_2) 的动词词形采用前者，[Wiktionary](https://en.wiktionary.org/wiki/discount#English) 对同一个词的动词读音使用后者，因此保留既有映射。两者重音均在第二音节；不由拼写不同推定录音不同。
