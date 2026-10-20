<template>
  <aside class="word-ai-chat" :class="{expanded,'modal-open':showSettings}" aria-label="AI 学习助手">
      <!-- Settings dialog -->
      <AiModelSettings
        v-if="showSettings"
        :initial="settingsData"
        @saved="handleSettingsSaved"
        @close="showSettings = false"
      />

    <!-- Mobile toggle button -->
    <button
      class="ai-mobile-toggle"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      问问 AI · {{ headword }}
    </button>

    <div class="ai-body">
      <!-- Header -->
      <div class="ai-header">
        <h2 class="ai-title">AI 学习助手</h2>
        <button class="ai-settings-btn" @click="showSettings = true">
          模型设置
        </button>
      </div>

      <!-- Label -->
      <p class="ai-label">
        正在围绕「{{ headword }}」学习
        <span class="ai-note">
          本次提问会发送当前词条与对话给所选服务商；AI回答请核对
        </span>
      </p>

      <!-- Model selector -->
      <div class="ai-model-select" v-if="profiles.length">
        <label class="ai-model-label" for="ai-model-select">对话模型</label>
        <select
          id="ai-model-select"
          aria-label="对话模型"
          :disabled="profiles.length === 0"
          :value="selectedProfileId"
          @change="handleModelChange"
        >
          <option v-for="p in profiles" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
        </select>
      </div>

      <!-- Empty state when no profiles -->
      <div v-else class="ai-empty-state" role="status">
        <p>暂无可用模型</p>
        <button class="ai-add-model-btn" @click="showSettings = true">
          添加模型
        </button>
      </div>

      <!-- History area -->
      <div
        ref="historyElement" class="ai-history"
        role="log"
        aria-live="polite"
        aria-label="对话历史"
      >
        <div v-for="(msg,idx) in history" :key="idx" class="ai-msg" :class="msg.role==='user'?'ai-msg-user':'ai-msg-ai'" role="article">
          <span class="ai-msg-role">{{ msg.role==='user'?'我':'AI' }}</span>
          <div class="ai-msg-content">{{ msg.content }}</div>
        </div>
        <div v-if="pendingUserMessage" class="ai-msg ai-msg-user"><span class="ai-msg-role">我</span><div class="ai-msg-content">{{ pendingUserMessage.content }}</div></div>
        <p v-if="isBusy" role="status">正在思考…</p>
        <!-- Error message -->
        <div
          v-if="errorMessage"
          role="alert"
          class="ai-msg ai-msg-error"
        >
          <span class="ai-msg-role">错误</span>
          <div class="ai-msg-content">
            {{ errorMessage }}
            <button :disabled="!canSend" class="ai-retry-btn" @click="retryLastQuestion">
              重试
            </button>
          </div>
        </div>
      </div>

      <!-- Composer -->
      <div class="ai-composer">
        <textarea
          ref="inputRef"
          v-model="draft"
          aria-label="向 AI 提问" maxlength="4000" :disabled="isBusy || !profiles.length" placeholder="想了解这个词的什么？"
          @keydown="handleKeydown"
          @input="handleInput"
        />
        <div class="ai-actions">
          <!-- Suggestion buttons -->
          <div class="ai-suggestions">
            <button
              v-for="suggestion in suggestions"
              :key="suggestion"
              :disabled="isBusy || !profiles.length" class="ai-suggestion-btn"
              @click="insertSuggestion(suggestion)"
            >
              {{ suggestion }}
            </button>
          </div>

          <div class="ai-controls">
            <!-- Stop button while busy -->
            <button
              v-if="isBusy"
              class="ai-btn ai-btn-secondary ai-btn-stop"
              @click="handleStop"
            >
              停止
            </button>

            <!-- Clear button -->
            <button
              class="ai-btn ai-btn-ghost"
              @click="clearChat"
            >
              清空对话
            </button>

            <!-- Send button -->
            <button
              class="ai-btn ai-btn-primary"
              :disabled="!canSend"
              @click="handleSend"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {ref,watch,onMounted,onUnmounted,computed} from 'vue';
import {api} from '../api';
import AiModelSettings from './AiModelSettings.vue';
import {type AiSettingsResponse,type AiMessage,type AiChatResponse} from '../../../shared/ai-chat';
const props=defineProps<{wordId:number;headword:string;initialSettings?:AiSettingsResponse}>();
const expanded=ref(false),showSettings=ref(false),settingsData=ref<AiSettingsResponse|undefined>(props.initialSettings);
const profiles=computed(()=>(settingsData.value?.profiles??[]).filter(p=>p.hasKey));
const selectedProfileId=ref(profiles.value[0]?.id??'');
const history=ref<AiMessage[]>([]),pendingUserMessage=ref<AiMessage|null>(null),errorMessage=ref(''),draft=ref(''),isBusy=ref(false);
const inputRef=ref<HTMLTextAreaElement|null>(null),historyElement=ref<HTMLElement|null>(null);
const suggestions=['常用用法','两句例句','近义词区别'];
let settingsVersion=0;
let alive=true,token=0,controller:AbortController|null=null;
const canSend=computed(()=>!!selectedProfileId.value&&!isBusy.value&&!!draft.value.trim()&&draft.value.length<=4000);
function cancelPendingRequest(){token++;controller?.abort();controller=null;isBusy.value=false;pendingUserMessage.value=null;}
function clearChat(){cancelPendingRequest();history.value=[];errorMessage.value='';draft.value='';}
function handleStop(){const q=pendingUserMessage.value?.content;cancelPendingRequest();if(q)draft.value=q;}
function handleModelChange(e:Event){selectedProfileId.value=(e.target as HTMLSelectElement).value;}
const selectedSignature=computed(()=>{const p=profiles.value.find(p=>p.id===selectedProfileId.value);return p?`${p.id}/${p.provider}/${p.model}`:'';});
watch(selectedSignature,clearChat,{flush:'sync'});
watch(()=>props.wordId,clearChat,{flush:'sync'});
function handleSettingsSaved(data:AiSettingsResponse){
  // Saving can rotate a key without changing profile metadata; cancel any old request.
  settingsVersion++;clearChat();settingsData.value=data;
  if(!profiles.value.some(p=>p.id===selectedProfileId.value))selectedProfileId.value=profiles.value[0]?.id??'';
}
onMounted(async()=>{if(props.initialSettings)return;const version=++settingsVersion;try{const data=await api<AiSettingsResponse>('/api/ai/settings');if(alive&&version===settingsVersion)handleSettingsSaved(data);}catch{if(alive&&version===settingsVersion)errorMessage.value='模型设置载入失败，请打开模型设置重试。';}});
onUnmounted(()=>{alive=false;cancelPendingRequest();});
function insertSuggestion(s:string){draft.value=`请讲解 ${props.headword} 的${s}。`;inputRef.value?.focus();}
function handleInput(){errorMessage.value='';}
function handleKeydown(e:KeyboardEvent){if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)&&!e.isComposing){e.preventDefault();void handleSend();}}
function context(question:string):AiMessage[]{
  const result:AiMessage[]=[];let size=question.length;
  // Keep complete pairs and fit the server's context budget. Long replies are shortened only in the next request.
  for(let i=history.value.length-2;i>=0&&result.length<18;i-=2){
    const pair=history.value.slice(i,i+2).map(m=>({...m,content:m.content.slice(0,4000)}));
    const length=pair.reduce((n,m)=>n+m.content.length,0);if(size+length>24000)break;
    result.unshift(...pair);size+=length;
  }
  return [...result,{role:'user',content:question}];
}
async function handleSend(){
  if(!canSend.value)return;const question=draft.value.trim(),n=++token;
  controller=new AbortController();isBusy.value=true;errorMessage.value='';pendingUserMessage.value={role:'user',content:question};draft.value='';
  try{
    const response=await fetch('/api/ai/chat',{method:'POST',headers:{'content-type':'application/json'},signal:controller.signal,body:JSON.stringify({profileId:selectedProfileId.value,wordId:props.wordId,messages:context(question)})});
    const data=await response.json() as AiChatResponse&{error?:string};
    if(!alive||n!==token)return;
    if(!response.ok)throw new Error(data.error||'模型服务暂时不可用，请重试。');
    if(typeof data.content!=='string'||!data.content.trim())throw new Error('模型回复为空，请重试。');
    history.value.push({role:'user',content:question},{role:'assistant',content:data.content});
  }catch(e){if(alive&&n===token){draft.value=question;errorMessage.value=e instanceof Error&&e.name!=='TypeError'?e.message:'网络请求失败，请重试。';}}
  finally{if(alive&&n===token){isBusy.value=false;pendingUserMessage.value=null;controller=null;}}
}
function retryLastQuestion(){return handleSend();}
watch(()=>[history.value.length,isBusy.value],()=>{const el=historyElement.value;if(el)el.scrollTop=el.scrollHeight;},{flush:'post'});
</script>

<style scoped>
.word-ai-chat {
  --bg: var(--surface);
  --bg-2: var(--surface-2);
  --danger: #b43737;
  position: sticky; top:88px; z-index:6; width:100%; min-width:0;
  background:var(--bg); border:1px solid var(--line); border-radius:12px;
}
.ai-msg-content { white-space:pre-wrap; overflow-wrap:anywhere; }
.word-ai-chat.modal-open { z-index:30; }
.ai-body { min-width:0; }
.ai-settings-btn,.ai-suggestion-btn,.ai-retry-btn { min-height:44px; }

.ai-body {
  display: flex;
  flex-direction: column;
  padding: 18px;
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ai-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.ai-settings-btn {
  background: transparent;
  border: none;
  color: var(--ink-2);
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
}

.ai-settings-btn:hover {
  background: rgba(0,0,0,0.05);
}

.ai-label {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--ink);
}

.ai-note {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--ink-2);
}

.ai-model-select {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.ai-model-label {
  font-size: 12px;
  color: var(--ink-2);
  margin-bottom: 4px;
}

.ai-model-select select {
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-2);
  color: var(--ink);
  font-size: 14px;
  outline: none;
}

.ai-model-select select:focus {
  border-color: var(--primary);
}

.ai-empty-state {
  padding: 20px;
  text-align: center;
  border: 1px dashed var(--line);
  border-radius: 8px;
  margin-bottom: 12px;
}

.ai-empty-state p {
  margin: 0 0 8px;
  color: var(--ink-2);
  font-size: 14px;
}

.ai-add-model-btn {
  background: var(--primary);
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.ai-add-model-btn:hover {
  opacity: 0.9;
}

.ai-history {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 12px;
  max-height: 42vh;
}

.ai-msg {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.ai-msg-role {
  font-size: 12px;
  color: var(--ink-2);
  margin-bottom: 4px;
}

.ai-msg-content {
  padding: 10px 12px;
  background: var(--bg-2);
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink);
}

.ai-msg-user .ai-msg-content {
  background: var(--primary);
  color: #fff;
}

.ai-msg-content.ai-msg-content-loading {
  color: var(--ink-2);
  font-style: italic;
}

.ai-msg-content.ai-msg-content-loading::before {
  content: '… ';
}

.ai-msg-error .ai-msg-content {
  background: rgba(220, 53, 69, 0.1);
  color: var(--danger);
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-retry-btn {
  background: transparent;
  border: 1px solid var(--danger);
  color: var(--danger);
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.ai-retry-btn:hover {
  background: var(--danger);
  color: #fff;
}

.ai-composer {
  display: flex;
  flex-direction: column;
}

.ai-composer textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--bg-2);
  color: var(--ink);
  font-size: 14px;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}

.ai-composer textarea:focus {
  border-color: var(--primary);
}

.ai-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.ai-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ai-suggestion-btn {
  background: var(--bg-2);
  border: 1px solid var(--line);
  padding: 4px 10px;
  border-radius: 20px;
  color: var(--ink-2);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.ai-suggestion-btn:hover {
  background: rgba(0,0,0,0.05);
}

.ai-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.ai-btn {
  min-height: 44px;
  border: none;
  padding: 0 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.ai-btn-primary {
  background: var(--primary);
  color: #fff;
}

.ai-btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.ai-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-btn-secondary {
  background: var(--bg-2);
  color: var(--ink);
  border: 1px solid var(--line);
}

.ai-btn-secondary:hover:not(:disabled) {
  background: rgba(0,0,0,0.05);
}

.ai-btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-btn-ghost {
  background: transparent;
  color: var(--ink-2);
}

.ai-btn-ghost:hover {
  background: rgba(0,0,0,0.05);
}

/* Mobile styles */
.ai-mobile-toggle {
  display: none;
  width: 100%;
  padding: 12px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

@media (max-width: 1000px) {
  .word-ai-chat {
    position: static;
    width: 100%;
    display: block;
  }

  .ai-body {
    display: none;
  }

  .expanded .ai-body {
    display: flex;
  }

  .ai-mobile-toggle {
    display: block;
    margin-bottom: 0;
  }
}
</style>