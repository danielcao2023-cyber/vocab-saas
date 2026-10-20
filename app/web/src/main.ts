import { createApp } from 'vue';
import App from './App.vue';
async function start(){
 if(import.meta.env.VITE_MOBILE==='1'){
  const {startOfflineRuntime}=await import('./offline/runtime');
  await startOfflineRuntime();
  await import('./styles/mobile.css');
 }
 createApp(App).mount('#app');
}
void start().catch(()=>{
 const root=document.getElementById('app');
 if(root){root.textContent='本机词库未能打开。请先重新打开应用；若仍失败，请保留应用数据以便恢复，勿清除数据。';root.setAttribute('role','alert');}
});
