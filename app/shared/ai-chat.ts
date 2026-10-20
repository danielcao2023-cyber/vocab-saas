export const AI_PROVIDERS = [
  {id:'deepseek',name:'DeepSeek',defaultModel:'deepseek-flash',endpoint:'https://api.deepseek.com/chat/completions',hint:'Flash 当前对应 V4.1 Flash；也可填写其他官方模型 ID。'},
  {id:'qwen',name:'通义千问',defaultModel:'qwen3.8-max',endpoint:'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',hint:'使用北京地域百炼 API Key，模型 ID 按账号开通情况填写。'},
  {id:'glm',name:'智谱 GLM',defaultModel:'glm-5.3',endpoint:'https://open.bigmodel.cn/api/paas/v4/chat/completions',hint:'使用智谱开放平台的通用 API Key。'},
  {id:'kimi',name:'Kimi',defaultModel:'kimi-k2.5',endpoint:'https://api.moonshot.cn/v1/chat/completions',hint:'模型 ID 可按 Kimi 开放平台中可用的模型修改。'},
  {id:'doubao',name:'豆包',defaultModel:'doubao-seed-2-1-pro-260915',endpoint:'https://ark.cn-beijing.volces.com/api/v3/chat/completions',hint:'填写火山方舟 Model ID 或已开通的 ep- 接入点 ID。'},
  {id:'minimax',name:'MiniMax',defaultModel:'MiniMax-M3',endpoint:'https://api.minimax.cn/v1/chat/completions',hint:'使用中国区通用 API Key，模型 ID 可按账号修改。'},
] as const;

export type AiProviderId = typeof AI_PROVIDERS[number]['id'];
export interface AiModelProfile {id:string;name:string;provider:AiProviderId;model:string;hasKey:boolean}
export interface AiModelInput {id?:string;name:string;provider:AiProviderId;model:string;apiKey?:string}
export interface AiSettingsResponse {providers:typeof AI_PROVIDERS;profiles:AiModelProfile[]}
export interface AiMessage {role:'user'|'assistant';content:string}
export interface AiChatRequest {profileId:string;wordId:number;messages:AiMessage[]}
export interface AiChatResponse {content:string;provider:AiProviderId;model:string}
