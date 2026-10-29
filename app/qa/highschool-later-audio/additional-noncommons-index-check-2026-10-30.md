# 非 Commons 开放真人录音索引补查（2026-10-30）

以 `npx tsx scripts/audit-highschool-offline-audio.ts --missing-json /tmp/audit-b-audio-gap-1030.json` 对当前 catalog v138 与隔离构建种子盘点得到 386 个缺录词条，按实际 `spoken` 完整文本大小写不敏感匹配，不剪词、不扩写或同义推断。盘点只核资源元数据与哈希，不证明音频品质、内容或许可。

## Custom Speech Commands

[Shawn Hymel 发布者仓库](https://github.com/ShawnHymel/custom-speech-commands-dataset)说明其 voice samples 为 CC BY 4.0。通过 GitHub 官方树接口只读取完整递归树（未截断，542 个节点）：https://api.github.com/repos/ShawnHymel/custom-speech-commands-dataset/git/trees/main?recursive=1 ，枚举 10 个关键词目录：archie、dracarys、fenrir、goodnight、hadouken、hey_archie、hey_fenrir、how_are_you、joke、trick_or_treat。

按上述精确完整词头对比，**0 条命中**。树中的下划线分类不自动转换成空格；即使转换亦需核实实际语音及含义后才可作为候选。本次未下载音频、未确认音质和每条讲话内容；目录标签不等于听审。

## MIT CLAC

[MIT 官方 CLAC 页面](https://sls.csail.mit.edu/downloads/clac/)对该语料声明 CC BY-SA，描述真人语音及自动转写，但此次未获取可用于精确比对的完整逐段索引，无法提供命中数或候选。自动转写并不保证与音频完全一致；也未验证实际单文件、可访问性、词头完整度或口音，因此暂不能作为可导入录音。CC BY-SA 的署名与相同方式共享等条件需针对使用方式另行核对，不在此做法律判断。

本轮没有下载大包或访问 Commons，没有修改音频清单。未找到新的可接入候选；零命中仅限上述明确检查的目录。
