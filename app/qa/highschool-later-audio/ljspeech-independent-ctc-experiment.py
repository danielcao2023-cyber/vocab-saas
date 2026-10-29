import os, sys, pathlib, json, hashlib, re, numpy as np, torch, whisper
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
os.environ['HF_HUB_OFFLINE']='1';torch.set_num_threads(2)
root=pathlib.Path('/tmp/ljspeech-official-phrase-batch-20261030'); meta={}
with open('/tmp/ljspeech-official-verify-20261030/metadata.csv') as f:
 for line in f:
  x=line.rstrip('\n').split('|');meta[x[0]]=x[2]
model=Wav2Vec2ForCTC.from_pretrained('/tmp/audit-b-ctc-model',local_files_only=True,use_safetensors=True).eval();proc=Wav2Vec2Processor.from_pretrained('/tmp/audit-b-ctc-model',local_files_only=True); tok=proc.tokenizer; blank=tok.pad_token_id
result=[]
for id,phrase in [('LJ009-0127','take part in'),('LJ012-0203','by accident')]:
 f=root/(id+'.wav');audio=whisper.load_audio(str(f),sr=16000);text=re.sub(r'[^A-Z\' ]','',meta[id].upper());text=re.sub(r' +',' ',text).strip(); norm=text.replace(' ','|');ids=tok.convert_tokens_to_ids(list(norm));assert tok.unk_token_id not in ids
 inp=proc(audio,sampling_rate=16000,return_tensors='pt').input_values
 with torch.inference_mode(): logp=model(inp).logits.log_softmax(-1).squeeze(0).numpy()
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
 states=states[::-1];phrase_norm=phrase.upper().replace(' ','|');pos=norm.find(phrase_norm);assert pos>=0 and norm.find(phrase_norm,pos+1)<0
 frame_ids=[t for t,s in enumerate(states) if s%2==1 and pos<=((s-1)//2)<pos+len(phrase_norm)];assert frame_ids
 stride=320/16000; ct=[round(min(frame_ids)*stride,2),round((max(frame_ids)+1)*stride,2)]
 row={'id':id,'target':phrase,'source_sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'model':'facebook/wav2vec2-base-960h@22aad52d435eb6dbaf354bdad9b0da84ce7d6156','method':'full normalized reference transcript, CTC Viterbi blank/repetition states; frame offsets nominal stride 20ms','duration':len(audio)/16000,'frames':T,'target_interval':ct,'source_metadata_sha256':hashlib.sha256(pathlib.Path('/tmp/ljspeech-official-verify-20261030/metadata.csv').read_bytes()).hexdigest()};result.append(row);print(json.dumps(row),flush=True)
pathlib.Path('/tmp/audit-b-ctc-results.json').write_text(json.dumps(result,indent=2)+'\n')
