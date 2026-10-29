# sow 听写默认读音核查

选择性必修三 Unit 5 印刷页 111 的教材词表列 sow 为动词“播种”，读音 /səʊ/；参见教材文本副本 https://www.yeyulingfeng.com/wendang/640427.html 。剑桥词典区分动词播种和名词母猪的读音：https://dictionary.cambridge.org/pronunciation/english/sow 。项目 catalog 的 sow 有两类义项，音标为 [soʊ]；此前 manifest 默认来源为 noun 文件，元数据 /saʊ/，而 verb 文件已入库且标记 /soʊ/。两个录音来源与作者、许可记录见 `batch-sow-variants.json`；尚未人工试听，源文件名及词典链接不能替代听辨。

V3 发出的听写题只传 `audioWord`，播放默认录音；答题前不展示中文义项。因而此问题是默认读音与教材动词和词库音标不匹配，并非声称题目前显示了“播种”。默认值改为 verb 时，保留 noun 和 verb 变体及来源署名；默认播放按词头共享，其他收录 sow 的词书也会改用动词默认录音。词条身份、学习记录和答题结果无需更改，已经发出但未回答的题播放更新后的默认录音。

回归测试 `test/highschool-sow-dictation.test.ts`：经真实 V3 发题流程确认音频词头，检查线上默认与名词变体音频字节和 metadata，检查按同一清单构造的离线 metadata 与资源路径；`test/heteronym-recording-metadata.test.ts` 保留两变体断言并更新默认音标。此测试并不模拟完整安卓安装升级或离线包重新生成，需由集成方执行。对其余异读词，本次仅基于本地词条与现有清单查看，没有逐一核对每个词的教材目标、录音实际音质，也不能据此声称无其他不一致。
