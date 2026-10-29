# 先前限流的 20 个词：单次重查（2026-10-30）

此前 20 词所在批次 HTTP 429，不能判无录音。本次以一个 Wiktionary 批量 API 请求重查，HTTP 200、无 Retry-After，未重试，20 个词均获得有效页面状态：4 个词有英语栏音频模板、5 个有英语栏但未匹配 audio 模板、11 个页面不存在。本次 0 个查询失败；后两类不证明没有其他音频来源，模板方法也不识别所有潜在音频格式。

| 词头 | 词典英语栏候选 | 后续条件 |
|---|---|---|
| LED | Vealhurl LED1 / LED2 两个 WAV | 英语栏同时给逐字母 /ɛl.iːˈdiː/ 与 /lɛd/，不能仅凭文件名判断；需核 Commons 作者许可、完整读法并试听 |
| decrease | En-us-decrease.ogg | 英语栏标注名词和动词重音不同；此前已单独解析出 Commons Dvortygirl、CC BY-SA 3.0 元数据，须试听判词性，不能默认录音覆盖两者 |
| concrete | en-us-concrete.ogg | 英语栏列多读法及动词变体；需核源作者许可并听审教材词性读法 |
| in charge of | Vealhurl-in charge.wav | 页面重定向到 in charge，录音文件缺 of，不能当作原短语完整录音 |

读取项目本地 Commons metadata 缓存时，上述 5 个文件均未在缓存中直接 resolved（`wiktionary-retry20-cache-2026-10-30.json`），这不表示它们缺授权或不存在；decrease 的先前独立查询结果与本次本地缓存检查区别见上。Wiktionary 的关键词形、IPA 和关联见 `wiktionary-retry20-raw-2026-10-30.json`；各词及状态见 `wiktionary-retry20-2026-10-30.json`。本次仅 Wiktionary 一次请求，没有请求 Commons、下载音频或修改 manifest，未人工试听。
