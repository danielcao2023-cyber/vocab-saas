import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {AI_PROVIDERS,type AiProviderId,type AiSettingsResponse} from '../../shared/ai-chat.ts';
import {HttpError} from './http-error.ts';

interface Credential {id:string;name:string;provider:AiProviderId;model:string;apiKey:string}
const idPattern=/^[a-zA-Z0-9-]{1,80}$/;
const bad=()=>new HttpError(400,'模型配置无效，请检查名称、服务商、模型 ID 和 Key。');
function fields(value:unknown) {
  if(!value||typeof value!=='object'||Array.isArray(value))throw bad();
  const row=value as Record<string,unknown>;
  if(typeof row.name!=='string'||!row.name.trim()||row.name.trim().length>60
    ||!AI_PROVIDERS.some(p=>p.id===row.provider)||typeof row.model!=='string'
    ||!/^[-A-Za-z0-9._:/]{1,120}$/.test(row.model.trim()))throw bad();
  if(row.id!==undefined&&(typeof row.id!=='string'||!idPattern.test(row.id)))throw bad();
  if(row.apiKey!==undefined&&(typeof row.apiKey!=='string'||row.apiKey.length>4096||/[\r\n]/.test(row.apiKey)))throw bad();
  return {id:row.id as string|undefined,name:row.name.trim(),provider:row.provider as AiProviderId,
    model:row.model.trim(),apiKey:typeof row.apiKey==='string'?row.apiKey.trim():undefined};
}

/** Independent from the study database. Never expose credential() through an HTTP response. */
export function createChatConfig(file=process.env.AI_CONFIG_PATH??path.join(os.homedir(),'.config/vocab-saas/ai-models.json')) {
  function read():Credential[] {
    try {
      if(!fs.existsSync(file))return [];
      if(!fs.lstatSync(file).isFile())throw new Error();
      const document=JSON.parse(fs.readFileSync(file,'utf8'));
      if(document?.version!==1||!Array.isArray(document.profiles)||document.profiles.length>50)throw new Error();
      const seen=new Set<string>();
      return document.profiles.map((raw:unknown)=>{
        const row=fields(raw);
        if(!row.id||!row.apiKey||seen.has(row.id))throw new Error();
        seen.add(row.id);return {...row,id:row.id,apiKey:row.apiKey};
      });
    } catch {throw new HttpError(500,'模型设置暂时无法读取，请检查服务端配置文件。');}
  }
  function safe(rows:Credential[]):AiSettingsResponse {
    return {providers:AI_PROVIDERS,profiles:rows.map(({apiKey,...row})=>({...row,hasKey:!!apiKey}))};
  }
  function write(rows:Credential[]) {
    const dir=path.dirname(file),tmp=path.join(dir,`.ai-models-${randomUUID()}.tmp`);
    try {
      fs.mkdirSync(dir,{recursive:true,mode:0o700});
      if(fs.existsSync(file)&&!fs.lstatSync(file).isFile())throw new Error();
      fs.writeFileSync(tmp,JSON.stringify({version:1,profiles:rows})+'\n',{flag:'wx',mode:0o600});
      fs.renameSync(tmp,file);
    } catch {throw new HttpError(500,'模型设置未能保存，请检查服务端文件权限。');}
    finally {try{fs.unlinkSync(tmp);}catch{/* Renamed or never created. */}}
    return safe(rows);
  }
  return {
    list:()=>safe(read()),
    credential(id:string) {
      const row=read().find(p=>p.id===id);
      if(!row)throw new HttpError(404,'这个模型配置不存在，请重新选择。');
      return row;
    },
    save(input:unknown) {
      const value=fields(input),rows=read(),index=rows.findIndex(p=>p.id===value.id);
      if(value.id&&index<0)throw new HttpError(404,'这个模型配置不存在，请重新选择。');
      if(index<0&&rows.length>=50)throw new HttpError(400,'最多添加 50 个模型配置。');
      const old=rows[index],apiKey=value.apiKey||(old?.provider===value.provider?old.apiKey:'');
      if(!apiKey)throw new HttpError(400,'新增模型或更换服务商时，请填写对应的 API Key。');
      const row:Credential={...value,id:old?.id??randomUUID(),apiKey};
      if(index<0)rows.push(row);else rows[index]=row;
      return write(rows);
    },
    remove(id:string) {
      const rows=read();
      if(!idPattern.test(id)||!rows.some(p=>p.id===id))throw new HttpError(404,'这个模型配置不存在。');
      return write(rows.filter(p=>p.id!==id));
    },
  };
}
