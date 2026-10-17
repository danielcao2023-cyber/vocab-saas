import fs from 'node:fs';
const {makePrompt}=await import('/workspace/vocab-saas/wt-v3p2/server/src/ai/prompts.ts');
const {fakeRunner}=await import('/workspace/vocab-saas/wt-v3p2/server/src/ai/fake-runner.ts');
const s=JSON.parse(fs.readFileSync('/workspace/vocab-saas/v3/phase2-qa/ai-root/.tmp/ai/87/request.json','utf8'));
try{const r=await fakeRunner({prompt:makePrompt(s.kind,s.words,s.curriculum,[]),schema:{},jobId:87,directory:'',timeoutMs:1} as any);console.log(r.stdout.slice(0,200));}catch(e){console.log('ERR',(e as Error).message);}
