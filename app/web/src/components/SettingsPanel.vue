<script setup lang="ts">
import {nextTick,onMounted,onUnmounted,reactive,ref} from 'vue';
import {api,ClientError} from '../api';
import {applyPreferences} from '../preferences';
import {DEFAULT_PREFERENCES,PLAYBACK_RATES,type PreferencesResponse,type StudyPreferences} from '../../../shared/preferences';
const emit=defineEmits<{close:[];saved:[]}>();
const draft=reactive<StudyPreferences>({...DEFAULT_PREFERENCES}),info=ref<PreferencesResponse|null>(null),version=ref(''),busy=ref(false),error=ref(''),saved=ref(false),panel=ref<HTMLElement|null>(null);
let alive=true,pending:StudyPreferences|null=null,previousFocus:HTMLElement|null=null;
const awaitingSave=ref(false);
async function load(){if(busy.value||awaitingSave.value)return;busy.value=true;error.value='';try{const data=await api<PreferencesResponse>('/api/settings');if(!alive)return;info.value=data;Object.assign(draft,data.preferences);applyPreferences(data.preferences);try{const v=await api<{commit:string}>('/version');if(alive)version.value=v.commit;}catch{version.value='暂时无法读取';}}catch{if(alive)error.value='设置未能载入，请重试。';}finally{if(alive)busy.value=false;}}
async function save(){if(busy.value||!info.value)return;const body=pending??{...draft};busy.value=true;error.value='';saved.value=false;
 try{const data=await api<PreferencesResponse>('/api/settings',body);if(!alive)return;pending=null;awaitingSave.value=false;info.value=data;Object.assign(draft,data.preferences);applyPreferences(data.preferences);saved.value=true;emit('saved');}
 catch(e){if(alive){if(e instanceof ClientError){pending=null;awaitingSave.value=false;error.value=e.message;}else{pending=body;awaitingSave.value=true;error.value='设置尚未保存，请保持此页并重试。';}}}
 finally{if(alive)busy.value=false;}
}
function close(){if(!busy.value&&!awaitingSave.value)emit('close');}
function key(e:KeyboardEvent){
 if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}
 if(e.key==='Tab'){
  const fields=Array.from(panel.value?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]')??[]),first=fields[0],last=fields.at(-1);
  if(!first){e.preventDefault();panel.value?.focus();return;}
  if(e.shiftKey&&(document.activeElement===first||document.activeElement===panel.value)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===panel.value)){e.preventDefault();first.focus();}
 }
}
onMounted(()=>{previousFocus=document.activeElement as HTMLElement|null;void nextTick(()=>panel.value?.focus());void load();document.addEventListener?.('keydown',key);window.addEventListener('xiaobei:close-settings',close);});
onUnmounted(()=>{alive=false;document.removeEventListener?.('keydown',key);window.removeEventListener('xiaobei:close-settings',close);previousFocus?.focus?.();});
</script>
<template><div class="settings-backdrop" @click.self="close"><section ref="panel" class="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title" tabindex="-1">
 <header class="settings-heading"><div><p class="eyebrow">按你的节奏学习</p><h1 id="settings-title">设置</h1></div><button class="btn" type="button" :disabled="busy||awaitingSave" aria-label="关闭设置" @click="close">关闭</button></header>
 <form v-if="info" @submit.prevent="save"><fieldset :disabled="busy||awaitingSave"><legend>学习与发音</legend>
  <label class="settings-row" for="daily-word-limit"><span>每日词量<small>复习和新词合计，同一词补测不重复计数</small></span><div class="settings-number"><input id="daily-word-limit" v-model.number="draft.dailyWordLimit" type="number" min="5" max="100" step="1" required><span>词</span></div></label>
  <p class="settings-hint">词量修改从明天起生效，今天的任务保持不变。<span v-if="info.dailyLimitEffectiveOn">已安排 {{ info.dailyLimitEffectiveOn }} 起每天 {{ info.preferences.dailyWordLimit }} 词。</span></p>
  <label class="settings-row" for="playback-rate"><span>录音速度<small>用于词条发音和听写</small></span><select id="playback-rate" v-model.number="draft.playbackRate"><option v-for="rate in PLAYBACK_RATES" :key="rate" :value="rate">{{ rate }}×{{ rate===1?'（正常）':'' }}</option></select></label>
  <label class="settings-row" for="dictation-autoplay"><span>听写自动播放<small>进入听写题时播放读音，仍可手动重播</small></span><input id="dictation-autoplay" v-model="draft.dictationAutoPlay" type="checkbox" role="switch"></label>
 </fieldset><div class="settings-about"><h2>词库与版本</h2><p><span>当前学习词库</span><strong>{{ info.wordCount }} 词</strong></p><p><span>当前版本</span><span>{{ version||'读取中…' }}</span></p></div>
 <div class="settings-footer"><p v-if="saved" role="status" class="settings-saved">设置已保存，录音设置立即生效。</p><button class="btn primary" type="submit" :disabled="busy">{{ busy?'保存中…':awaitingSave?'重试保存':'保存设置' }}</button></div></form>
 <p v-else-if="!error" class="note">正在读取设置…</p><div v-if="error" class="note" role="alert">{{ error }} <button v-if="!info" class="link" :disabled="busy" @click="load">重试</button></div>
</section></div></template>
<style scoped>
.settings-backdrop{position:fixed;inset:0;z-index:30;background:#1720334d;display:flex;justify-content:flex-end;}.settings-panel{width:min(100%,480px);height:100%;overflow:auto;background:var(--surface);padding:28px;box-shadow:-12px 0 48px #17203318;outline:none;}.settings-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:22px;border-bottom:1px solid var(--line);}.settings-heading h1{margin:5px 0 0;font-size:26px;}.settings-heading .eyebrow{margin:0;}fieldset{border:0;padding:20px 0 0;margin:0;min-width:0;}legend,.settings-about h2{font-size:14px;font-weight:700;color:var(--ink-2);padding:0;margin:20px 0 8px;}.settings-row{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:84px;border-bottom:1px solid var(--line);font-size:15px;}.settings-row small{display:block;font-size:12px;line-height:1.6;color:var(--ink-3);margin-top:5px;}.settings-number{display:flex;align-items:center;gap:8px;flex-shrink:0;}.settings-number input{width:66px;padding:9px;}.settings-row select{max-width:150px;padding:9px;}.settings-row input,.settings-row select{border:1px solid var(--line);border-radius:9px;background:var(--surface-2);color:var(--ink);font:inherit;}.settings-row input[type=checkbox]{width:22px;height:22px;accent-color:var(--primary);flex-shrink:0;}.settings-hint{color:var(--ink-3);font-size:12px;line-height:1.8;}.settings-about{margin-top:28px;padding:0 0 20px;border-bottom:1px solid var(--line);}.settings-about p{display:flex;justify-content:space-between;gap:12px;font-size:13px;color:var(--ink-2);}.settings-footer{display:flex;flex-direction:column;gap:10px;margin-top:24px;}.settings-saved{font-size:13px;color:var(--ok);margin:0;}@media(max-width:480px){.settings-panel{padding:22px 18px calc(24px + env(safe-area-inset-bottom));}.settings-row{gap:10px;}.settings-row small{max-width:205px;}.settings-row select{max-width:125px;}}
</style>
