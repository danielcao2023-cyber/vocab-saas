<template>
  <div
    class="ai-settings-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="模型设置"
    @keydown="handleOverlayKeydown"
  >
    <div class="ai-settings-backdrop" @click="handleBackdrop" />
    <div ref="panel" class="ai-settings-panel">
      <button class="ai-settings-close" @click="handleClose" aria-label="关闭设置">
        &times;
      </button>

      <h2 class="ai-settings-title">模型设置</h2>
      <p class="settings-note">{{ isMobileBuild()?'Key 加密保存在这台手机中，不会回显或写入学习数据库。':'Key 保存在本机服务端配置文件中，不会回显或写入学习数据库。' }}保存不会调用模型；发送提问按服务商规则计费。</p>
      <p v-if="status" class="settings-note" role="status">{{ status }}</p>

      <form class="ai-settings-form" @submit.prevent="handleSave">
        <fieldset :disabled="isBusy || isLoading" class="model-fields">
        <div class="ai-settings-draft-fields">
          <div class="form-group">
            <label for="draft-name">显示名称</label>
            <input
              id="draft-name" ref="nameInput" aria-label="显示名称" maxlength="60"
              v-model="draft.name"
              type="text"
              placeholder="例如：DeepSeek Flash"
              autocomplete="off"
              required
            />
          </div>

          <div class="form-group">
            <label for="draft-provider">服务商</label>
            <select
              id="draft-provider" aria-label="服务商"
              v-model="draft.provider"
              @change="handleProviderChange"
              required
            >
              <option
                v-for="provider in providers"
                :key="provider.id"
                :value="provider.id"
              >
                {{ provider.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="draft-model">模型 ID</label>
            <input
              id="draft-model" aria-label="模型 ID" maxlength="120"
              v-model="draft.model"
              type="text"
              :placeholder="currentDefaultModel"
              required
            />
            <p v-if="currentHint" class="form-hint">{{ currentHint }}</p>
          </div>

          <div class="form-group">
            <label for="draft-apiKey">API Key</label>
            <input
              id="draft-apiKey" aria-label="API Key" maxlength="4096"
              v-model="draft.apiKey"
              type="password"
              autocomplete="new-password"
              :placeholder="isEditingSameProvider ? '留空保留已保存的 Key' : '输入 API Key'"
            />
          </div>

          <div v-if="saveError" class="form-error" role="alert">
            {{ saveError }}
          </div>

          <div class="form-actions">
            <button type="submit" :disabled="isBusy || isLoading || !draft.name || !draft.model">
              保存模型
            </button>
          </div>
        </div>
        </fieldset>
      </form>

      <div class="ai-settings-list">
        <h3>已配置模型</h3>
        <div v-if="profiles.length === 0" class="empty-list">
          暂无已配置的模型
        </div>
        <ul v-else class="model-list">
          <li v-for="profile in profiles" :key="profile.id" class="model-item">
            <div class="model-info">
              <span class="model-name">{{ profile.name }}</span>
              <span class="model-provider">({{ getProviderName(profile.provider) }})</span>
              <span class="model-id">{{ profile.model }} · {{ profile.hasKey ? "Key 已配置" : "未配置 Key" }}</span>
            </div>
            <div class="model-actions">
              <button  :disabled="isBusy || isLoading" @click="editProfile(profile)" type="button">
                编辑
              </button>
              <button
                :disabled="isBusy || isLoading" @click="handleDelete(profile)"
                type="button"
                class="delete-btn"
              >
                删除
              </button>
            </div>
          </li>
        </ul>

        <button
          v-if="profiles.length > 0"
          class="add-model-btn"
          type="button"
          :disabled="isBusy || isLoading" @click="resetDraft"
        >
          新增模型
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref,computed,onMounted,onUnmounted,nextTick} from 'vue';
import {api} from '../api';
import {isMobileBuild} from '../offline/mobile-mode';
import {AI_PROVIDERS,type AiModelInput,type AiModelProfile,type AiSettingsResponse,type AiProviderId} from '../../../shared/ai-chat';
const props=defineProps<{initial?:AiSettingsResponse}>();
const emit=defineEmits<{close:[];saved:[settings:AiSettingsResponse]}>();
const providers=ref(props.initial?.providers??AI_PROVIDERS),profiles=ref<AiModelProfile[]>(props.initial?.profiles??[]);
const panel=ref<HTMLElement|null>(null),nameInput=ref<HTMLInputElement|null>(null);
const isLoading=ref(!props.initial),isBusy=ref(false),saveError=ref(''),status=ref(''),editingId=ref<string>();
const draft=ref<AiModelInput>({name:'',provider:'deepseek',model:AI_PROVIDERS[0].defaultModel,apiKey:''});
const currentProvider=computed(()=>providers.value.find(p=>p.id===draft.value.provider));
const currentDefaultModel=computed(()=>currentProvider.value?.defaultModel??'');
const currentHint=computed(()=>currentProvider.value?.hint??'');
const isEditingSameProvider=computed(()=>profiles.value.some(p=>p.id===editingId.value&&p.provider===draft.value.provider));
let alive=true;let previousFocus:HTMLElement|null=null;
onMounted(async()=>{
  previousFocus=typeof document!=='undefined'?document.activeElement as HTMLElement:null;
  await nextTick();if(alive)nameInput.value?.focus();
  if(!alive)return;
  if(!props.initial){try{const data=await api<AiSettingsResponse>('/api/ai/settings');if(alive){profiles.value=data.profiles;providers.value=data.providers;emit('saved',data);}}
  catch{if(alive)saveError.value='模型设置载入失败，请关闭后重试。';}finally{if(alive)isLoading.value=false;}}
});
onUnmounted(()=>{alive=false;draft.value.apiKey='';previousFocus?.focus?.();});
function handleClose(){if(isBusy.value)return;draft.value.apiKey='';emit('close');}
function handleBackdrop(){handleClose();}
function handleProviderChange(){draft.value.model=currentDefaultModel.value;draft.value.apiKey='';saveError.value='';status.value='';}
function resetDraft(){editingId.value=undefined;draft.value={name:'',provider:'deepseek',model:AI_PROVIDERS[0].defaultModel,apiKey:''};saveError.value='';}
function editProfile(p:AiModelProfile){if(isBusy.value)return;editingId.value=p.id;draft.value={name:p.name,provider:p.provider,model:p.model,apiKey:''};saveError.value='';status.value='';nameInput.value?.focus();}
function getProviderName(id:AiProviderId){return providers.value.find(p=>p.id===id)?.name??id;}
function apply(data:AiSettingsResponse){profiles.value=data.profiles;providers.value=data.providers;emit('saved',data);}
async function handleSave(){
  if(isBusy.value||isLoading.value)return;isBusy.value=true;saveError.value='';status.value='';
  try{const data=await api<AiSettingsResponse>('/api/ai/settings',{...draft.value,id:editingId.value});if(alive){apply(data);resetDraft();status.value='模型已保存，尚未发起模型请求。';}}
  catch{if(alive)saveError.value='保存失败，请检查名称、模型 ID 和 API Key；更换服务商需重新填写 Key。';}
  finally{draft.value.apiKey='';if(alive)isBusy.value=false;}
}
async function handleDelete(p:AiModelProfile){
  if(isBusy.value||isLoading.value)return;isBusy.value=true;saveError.value='';
  try{const data=await api<AiSettingsResponse>(`/api/ai/settings/${encodeURIComponent(p.id)}/delete`,{});if(alive){apply(data);if(editingId.value===p.id)resetDraft();status.value='模型已删除。';}}
  catch{if(alive)saveError.value='删除失败，请重试。';}finally{if(alive)isBusy.value=false;}
}
function handleOverlayKeydown(e:KeyboardEvent){
  if(e.key==='Escape'){e.stopPropagation();handleClose();return;}
  if(e.key!=='Tab'||!panel.value?.querySelectorAll)return;
  const items=Array.from(panel.value.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]'));
  const first=items[0],last=items.at(-1);if(!first||!last)return;
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
}
</script>

<style scoped>
.model-fields { border:0; padding:0; margin:0; min-width:0; }
.settings-note { padding:0 24px; color:var(--ink-2); font-size:12px; line-height:1.6; }
.model-info { min-width:0; overflow-wrap:anywhere; }
.model-actions { flex-shrink:0; }
.model-item { gap:8px; }
.ai-settings-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.ai-settings-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.ai-settings-panel {
  position: relative;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: auto;
  background: var(--surface, #fff);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.ai-settings-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  color: var(--ink-2, #666);
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
}

.ai-settings-close:hover {
  background: var(--line, rgba(0, 0, 0, 0.05));
  color: var(--ink, #333);
}

.ai-settings-title {
  margin: 0;
  padding: 1rem 1.5rem 0.5rem;
  font-size: 18px;
  color: var(--ink, #333);
}

.ai-settings-form {
  padding: 0 1.5rem 1rem;
}

.ai-settings-draft-fields {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 14px;
  font-weight: 500;
  color: var(--ink, #333);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  font-size: 14px;
  border: 1px solid var(--line, #ddd);
  border-radius: 4px;
  background: var(--surface-2, #fafafa);
  color: var(--ink, #333);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary, #3346C4);
  box-shadow: 0 0 0 2px rgba(74, 144, 217, 0.2);
}

.form-hint {
  margin: 0.25rem 0 0;
  font-size: 12px;
  color: var(--ink-2, #666);
}

.form-error {
  margin: 0.75rem 0;
  padding: 0.75rem;
  background: rgba(220, 53, 69, 0.1);
  border-left: 3px solid #dc3545;
  color: #dc3545;
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

button[type="submit"] {
  min-height: 44px;
  padding: 0 1.5rem;
  font-size: 14px;
  font-weight: 500;
  background: var(--primary, #3346C4);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

button[type="submit"]:hover:not(:disabled) {
  filter: brightness(1.05);
}

button[type="submit"]:active:not(:disabled) {
  transform: translateY(1px);
}

button[type="submit"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ai-settings-list {
  padding: 0 1.5rem 1rem;
  border-top: 1px solid var(--line, #ddd);
}

.ai-settings-list h3 {
  margin: 1rem 0 0.75rem;
  font-size: 16px;
  color: var(--ink, #333);
}

.empty-list {
  padding: 1rem;
  text-align: center;
  color: var(--ink-2, #666);
  font-size: 14px;
}

.model-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.model-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--line, #eee);
}

.model-item:last-child {
  border-bottom: none;
}

.model-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.model-name {
  font-weight: 500;
  color: var(--ink, #333);
}

.model-provider {
  font-size: 12px;
  color: var(--ink-2, #666);
}

.model-id {
  font-size: 12px;
  color: var(--ink-2, #666);
}

.model-actions {
  display: flex;
  gap: 0.5rem;
}

.model-actions button {
  min-height: 44px;
  padding: 0 1rem;
  font-size: 13px;
  background: var(--surface-2, #fafafa);
  border: 1px solid var(--line, #ddd);
  border-radius: 4px;
  cursor: pointer;
  color: var(--ink, #333);
  transition: background 0.2s, border-color 0.2s;
}

.model-actions button:hover {
  background: var(--line, #eee);
}

.model-actions .delete-btn:hover {
  background: rgba(220, 53, 69, 0.1);
  border-color: #dc3545;
  color: #dc3545;
}

.add-model-btn {
  width: 100%;
  margin-top: 1rem;
  min-height: 44px;
  padding: 0.75rem;
  font-size: 14px;
  font-weight: 500;
  background: transparent;
  border: 1px dashed var(--primary, #3346C4);
  border-radius: 4px;
  cursor: pointer;
  color: var(--primary, #3346C4);
  transition: background 0.2s;
}

.add-model-btn:hover {
  background: rgba(74, 144, 217, 0.05);
}

/* Responsive */
@media (max-width: 600px) {
  .ai-settings-overlay {
    padding: 0;
  }

  .ai-settings-panel {
    width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
}
</style>
