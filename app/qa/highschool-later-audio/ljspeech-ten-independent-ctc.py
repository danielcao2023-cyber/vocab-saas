import os,pathlib,json,hashlib,re,numpy as np,torch,whisper
from transformers import Wav2Vec2ForCTC,Wav2Vec2Processor
os.environ['HF_HUB_OFFLINE']='1';torch.set_num_threads(2)
root=pathlib.Path('/tmp/ljspeech-official-phrase-batch-20261030'); old=json.load(open('qa/highschool-later-audio/ljspeech-ten-whisper-timestamps-2026-10-30.json')); meta={}
with open('/tmp/ljspeech-official-verify-20261030/metadata.csv') as f:
 for line in f:
  x=line.rstrip('\n').split('|');meta[x[0]]=x[2]
model=Wav2Vec2ForCTC.from_pretrained('/tmp/audit-b-ctc-model',local_files_only=True,use_safetensors=True).eval();proc=Wav2Vec2Processor.from_pretrained('/tmp/audit-b-ctc-model',local_files_only=True);tok=proc.tokenizer;blank=tok.pad_token_id
results=[]
for phrase, prior in old.items():
 id=prior['id']; f=root/(id+'.wav')
 if not f.exists():
  print('missing',str(f),flush=True);results.append({'phrase':phrase,'id':id,'status':'missing original'});continue
 audio=whisper.load_audio(str(f),sr=16000);text=re.sub(r'[^A-Z\' ]','',meta[id].upper());text=re.sub(r' +',' ',text).strip();norm=text.replace(' ','|');ids=tok.convert_tokens_to_ids(list(norm)); assert tok.unk_token_id not in ids
 with torch.inference_mode(): logits=model(proc(audio,sampling_rate=16000,return_tensors='pt').input_values).logits;greedy=proc.batch_decode(logits.argmax(dim=-1))[0];logp=logits.log_softmax(-1).squeeze(0).numpy()
 ext=[blank]
 for j in ids:ext.extend([j,blank])
 T,S=logp.shape[0],len(ext);dp=np.full((T,S),-np.inf);parent=np.full((T,S),-1,dtype=np.int32);dp[0,0]=logp[0,blank];dp[0,1]=logp[0,ext[1]]
 for t in range(1,T):
  for s,label in enumerate(ext):
   opts=[(dp[t-1,s],s)]
   if s>0:opts.append((dp[t-1,s-1],s-1))
   if s>1 and label!=blank and label!=ext[s-2]:opts.append((dp[t-1,s-2],s-2))
   best,prev=max(opts);dp[t,s]=best+logp[t,label];parent[t,s]=prev
 s=max([S-1,S-2],key=lambda i:dp[-1,i]);states=[]
 for t in range(T-1,-1,-1):states.append(s);s=parent[t,s] if t else s
 states=states[::-1]; pn=phrase.upper().replace(' ','|'); pos=norm.find(pn)
 if pos<0 or norm.find(pn,pos+1)>=0:results.append({'phrase':phrase,'id':id,'status':'missing or ambiguous reference'});continue
 frames=[t for t,s in enumerate(states) if s%2==1 and pos<=((s-1)//2)<pos+len(pn)];assert frames
 st=min(frames)*.02;en=(max(frames)+1)*.02
 # Mean RMS silence near each alignment boundary; reports observations, never proof of word boundaries.
 chunks=[]
 for i in range(0,len(audio)-160,160):
  rms=float(np.sqrt(np.mean(audio[i:i+160]**2)));chunks.append((i/16000,rms))
 def near(c):
  return [[round(t,2),round(20*np.log10(max(a,1e-9)),1)] for t,a in chunks if abs(t-c)<.15 and a<10**(-35/20)]
 before=near(st);after=near(en)
 x={'phrase':phrase,'id':id,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'greedy':greedy,'target_greedy_match':phrase.upper() in greedy.upper(),'ctc':[round(st,2),round(en,2)],'whisper_base':prior['base']['candidate_intervals_seconds'],'whisper_small':prior['small']['candidate_intervals_seconds'],'rms_below_minus35db_10ms_windows_near_start':before,'rms_below_minus35db_10ms_windows_near_end':after,'status':'machine estimate only; not listened'};results.append(x);print(json.dumps({'phrase':phrase,'id':id,'ctc':x['ctc'],'greedy':greedy,'silence_start_windows':len(before),'silence_end_windows':len(after)}),flush=True)
pathlib.Path('/tmp/audit-b-ctc-ten-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
