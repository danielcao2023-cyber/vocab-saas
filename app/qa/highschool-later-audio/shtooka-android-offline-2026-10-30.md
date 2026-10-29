# Shtooka 四条录音：安卓离线 WebView 验收

验收日期：2026-10-30。代码基准：`4e5c6805`；使用该提交的源码和已构建的离线资源制作临时 debug 包，在 Android 模拟器 `emulator-5556` 安装独立 applicationId 和空白学习数据。种子库的答题记录、学习事件和任务记录均为空。测试时模拟器已有飞行模式开启、Wi-Fi 关闭、无默认活动网络；未更改设备网络状态。通过 adb 转发的 Chrome DevTools Protocol 在实际 Android WebView 的 `https://localhost` 页面进行检查。

在各单词页面点击「听发音」，WebView 中实际 `HTMLMediaElement` 均触发 `playing` 与 `ended`，无错误；所请求文件在离线 WebView 中返回 HTTP 200，内容 SHA-256 如下。每个词条均展示「尚未人工试听」，有指向离线来源页对应词条锚点的「录音来源」链接。离线来源页在 WebView 中 HTTP 200，HTML 内对应行包含作者、原始资源链接、许可链接和转码说明。

| 词条 | 离线资源 | SHA-256 | 来源页作者与许可 |
| --- | --- | --- | --- |
| in the open air | `in-the-open-air-2d7afe9871db.mp3` | `2d7afe9871dbf5cd1d10f4e544dda14715c6a0d241326c2657b51b6c3777a9cd` | Emmanuel Revah、Nicolas Vion；CC BY 2.0 FR |
| in memory of | `in-memory-of-f643626b87cb.mp3` | `f643626b87cb75e2a0f908bc0720640087411960a3fcd089bf6ed29297282209` | Emmanuel Revah、Nicolas Vion；CC BY 2.0 FR |
| in ruins | `in-ruins-d5dda101f61b.mp3` | `d5dda101f61b33b5d20b26a46ee285c8a4418f7cae3dd6c112e7627d83daa222` | Emmanuel Revah、Nicolas Vion；CC BY 2.0 FR |
| illustrate | `illustrate-3299d94f5741.mp3` | `3299d94f57418c653ec620dd21df9d3a76f15d5430e16003a2dfdcbf3b85aab4` | Mary Maury、Bernadette Perrin-Riou、Csilla Ducrocq；CC BY 3.0 US |

词条页面链接和来源页的内容均已检查；来源页通过本机 WebView 请求并解析，未在断网时访问外部原始资源或许可网站。录音是否真正被人耳听到、口音与词义是否准确均未做人工听审；播放事件不能替代音质或发音审核。此次为模拟器独立 debug 包测试，不代表正式签名 APK 或真实设备已验收。
