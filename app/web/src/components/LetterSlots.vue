<script setup lang="ts">
import {computed,ref,watch,nextTick} from 'vue';
const props=defineProps<{modelValue:string;pattern:string;disabled?:boolean}>();
const emit=defineEmits<{'update:modelValue':[value:string];submit:[]}>();
const chars=computed(()=>[...props.pattern]),editable=computed(()=>chars.value.map((c,i)=>c==='_'?i:-1).filter(i=>i>=0));
const values=ref<string[]>([]),inputs:Record<number,HTMLInputElement|null>={};
let lastEmitted:string|undefined,lastPattern=props.pattern;
const clean=(s:string)=>s.toLowerCase().replace(/[^a-z]/g,'');
watch(()=>[props.modelValue,props.pattern],()=>{if(props.modelValue===lastEmitted&&props.pattern===lastPattern)return;lastPattern=props.pattern;lastEmitted=undefined;const letters=clean(props.modelValue);values.value=chars.value.map((c,i)=>c==='_'?letters[editable.value.indexOf(i)]??'':c);},{immediate:true});
function focus(index:number){void nextTick(()=>inputs[index]?.focus());}
function output(){lastEmitted=values.value.join('');emit('update:modelValue',lastEmitted);}
function distribute(text:string,index:number){if(props.disabled)return;const letters=clean(text);let slot=editable.value.indexOf(index);for(const char of letters){if(slot>=editable.value.length)break;values.value[editable.value[slot++]]=char;}output();focus(editable.value[Math.min(slot,editable.value.length-1)]);}
function input(event:Event,index:number){if(props.disabled)return;const target=event.target as HTMLInputElement,value=clean(target.value);values.value[index]='';if(value)distribute(value,index);else output();target.value=values.value[index];}
function paste(event:ClipboardEvent,index:number){event.preventDefault();if(!props.disabled)distribute(event.clipboardData?.getData('text')??'',index);}
function key(event:KeyboardEvent,index:number){if(props.disabled)return;const n=editable.value.indexOf(index);
 if(event.key==='Enter'&&!event.isComposing){event.preventDefault();if(editable.value.every(i=>values.value[i]))emit('submit');}
 else if(event.key==='Backspace'&&!values.value[index]&&n>0){event.preventDefault();values.value[editable.value[n-1]]='';output();focus(editable.value[n-1]);}
 else if(event.key==='ArrowLeft'&&n>0){event.preventDefault();focus(editable.value[n-1]);}
 else if(event.key==='ArrowRight'&&n<editable.value.length-1){event.preventDefault();focus(editable.value[n+1]);}
}
</script>
<template><div class="letter-slots" role="group" aria-label="拼写答案"><template v-for="(char,i) in chars" :key="i"><input v-if="char==='_'" :ref="el=>inputs[i]=el as HTMLInputElement|null" :value="values[i]??''" :disabled="disabled" :aria-label="`第${editable.indexOf(i)+1}个字母`" type="text" inputmode="text" autocomplete="off" autocapitalize="off" :spellcheck="false" @input="input($event,i)" @paste="paste($event,i)" @keydown="key($event,i)" @focus="($event.target as HTMLInputElement).select?.()"><span v-else :class="{space:char===' '}">{{ char }}</span></template></div></template>
<style scoped>
.letter-slots{display:flex;flex-wrap:wrap;justify-content:center;align-items:end;gap:8px;margin:20px auto 28px;max-width:100%;}
input{width:40px;min-width:0;height:56px;text-align:center;padding:0;border:0;border-bottom:2px solid var(--line);border-radius:0;background:transparent;color:var(--ink);caret-color:var(--primary);font:400 28px/1.2 ui-monospace,monospace;}
input:focus,input:focus-visible{border-bottom-color:var(--primary);outline:none;box-shadow:none;}span{font-size:22px;padding-bottom:8px;}.space{width:12px;}input:disabled{opacity:.75;}
</style>
