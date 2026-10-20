# 单词AI侧栏实现计划

**Goal:** 第五讲解tab、可配置国内模型及当前词AI对话。
**Architecture:** Vue组件调用同源Fastify代理；Key受限文件独立存储，固定官方服务地址。
**Tech Stack:** Vue3/TypeScript/Fastify/Node fetch，保持现有依赖。
**Spec:** ../specs/2026-10-20-word-ai-assistant.md

用户已指定Codex框架/验收、本地Claude Code Coder实现，不另派其他模型；按下列边界串行验收。

- [ ] 共享契约与验收用例：Codex编写模型公开类型/固定厂商表，以及服务端秘密存储、脱敏、代理行为和第五tab的失败检查。
- [ ] 服务端：Codex实现chat-config.ts、chat-routes.ts并集成buildApp的可注入configPath/fetch，先相关用例、再类型检查；不接触真实凭据。
- [ ] 本地Coder第一段：仅SenseLesson.vue第五tab和AiModelSettings.vue，读取共享契约，返回保存后事件；Codex更新旧用例并验收。
- [ ] 本地Coder第二段：仅WordAiChat.vue与WordView.vue布局，使用已定API，取消/旧响应隔离/模型切换/错误与空配置；Codex复核。
- [ ] 集成验收：全量npm test和npm run build、git diff --check；独立临时配置与已标注的假上游验聊天端到端，真实预览验证第五tab与未配置状态、桌面/390px手机、控制台、密钥不进响应与学习库。
- [ ] 保存分支提交与实现评估，询问本轮Wiki归档；未经用户授权不合并推送。
