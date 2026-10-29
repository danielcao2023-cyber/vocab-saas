# Commons 不限定来源的短语检索（2026-10-30）

MediaWiki `list=search` 使用 `intitle:"短语" filetype:audio`、namespace 6、srlimit 50，不限定 LL-Q1860，间隔 2 秒。查询到 `first hand` 时发生 TLS 握手超时，主动停止，后续 3 条未请求；原始结果见同名 JSON。

| 短语 | 状态 | 返回标题 |
| --- | --- | --- |
| all over the world | 200 | 无结果 |
| under pressure | 200 | File:Heartbeat under pressure at mitral point.wav |
| make progress | 200 | 无结果 |
| concerned about | 200 | File:One visitor named Hou Yugang said he was not too concerned about climate change and Baishui’s melting.ogg |
| in closing | 200 | 无结果 |
| so as to | 200 | 无结果 |
| first hand | 网络失败：TLS 握手超时 | 未知 |
| at first hand | 未请求 | 未知 |
| from then on | 未请求 | 未知 |
| to be frank | 未请求 | 未知 |

`under pressure` 返回的是心跳医疗录音而非英语短语发音；`concerned about` 返回完整新闻叙述，不能截取当作完整词条录音。这两项未进入版权/作者验证，其余成功搜索无命中；没有可确认候选。请求失败及未请求不代表无文件，本次查询也受索引和搜索方式限制。没有修改 manifest 或用户数据。
