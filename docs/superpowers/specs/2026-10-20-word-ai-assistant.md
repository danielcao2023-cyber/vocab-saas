# 单词补充讲解 tab 与 AI 侧栏设计

用户授权：将截图中的“再多了解一点”独立为tab；单词页加可选模型的AI侧栏，设置中维护API Key；沿用Codex设计/验收、本地Coder实现的流程。继承未合并的dd3f953，在feat/word-ai-assistant继续，不自动合并推送。

- 第五tab“再多了解一点”包含发音、词形、进阶义项和参考资料，只在选中时出现；其他四tab不重复这些内容。
- 桌面单词内容+右侧sticky聊天；手机显示可展开AI面板。发送当前词ID和有限对话历史；服务端拼词条教学上下文，不读学习记录。不持久化聊天；换词/切换模型清空对话，取消并忽略旧请求。纯文本渲染，支持提问、示例问题、重试、取消和清空。
- 设置窗口维护多个独立模型配置（显示名、厂商、模型ID、API Key）；六个预设厂商DeepSeek/千问/GLM/Kimi/豆包/MiniMax，模型ID可改。官方固定地址，首版不允许任意代理URL。保存不触发付费请求。
- Key仅保存在服务端AI_CONFIG_PATH或~/.config/vocab-saas/ai-models.json，0600原子写入，不进学习库、Git、日志、localStorage或GET响应。编辑留空保持原Key；换厂商必须提供新Key；删除配置有明确操作。前端只得到hasKey。
- GET /api/ai/settings -> {providers,profiles}; POST /api/ai/settings -> 保存一个配置并返回相同响应；POST /api/ai/settings/:id/delete -> 删除并返回相同响应。写操作校验同源Origin（缺省允许CLI），跨源拒绝。
- POST /api/ai/chat -> {profileId,wordId,messages}; messages为user/assistant纯文本、末条user，最多20条、每条4000字、总24000字。仅POST请求触发模型；官方固定URL，redirect:error，60秒超时，限制响应大小，最多两个并发；错误不回传上游原文/Key。返回{content,provider,model}。
- 基础版非流式完整答复，发送中显示等待和停止；不增加依赖，不复用本机其他应用的密钥，不改现有模型路由。

文件边界：shared/ai-chat.ts传输与厂商契约；server/src/chat-config.ts服务端安全存储；server/src/chat-routes.ts代理与上下文；components/AiModelSettings.vue设置；components/WordAiChat.vue对话；WordView.vue集成。

验收：先失败用例，再分段实现；覆盖Key不回显/不修改学习记录/错误脱敏/消息校验/原子保存/换词旧响应/模型切换/第五tab互斥。全量测试构建；桌面和手机真实浏览器；无真实Key时以明确测试fixture验端到端，不能冒充真实云模型已调用。

官方依据（2026-10-20）：DeepSeek https://api-docs.deepseek.com/，Flash参数deepseek-flash；千问 https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope，原北京兼容域名仍可用；GLM https://docs.bigmodel.cn/cn/api/introduction；Kimi https://platform.kimi.com/blog/posts/kimi-api-quick-start-guide；豆包 https://console.volcengine.com/ark/region%3Acn-beijing/docs/text-generation；MiniMax https://platform.minimax.cn/docs/api-reference/text-openai-api。
