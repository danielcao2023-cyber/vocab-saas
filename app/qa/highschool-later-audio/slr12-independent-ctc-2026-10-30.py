import os,pathlib,json,hashlib,re,numpy as np,torch,whisper
from transformers import Wav2Vec2ForCTC,Wav2Vec2Processor
os.environ['HF_HUB_OFFLINE']='1';torch.set_num_threads(2)
base=pathlib.Path('/tmp/slr12-candidates-20261030');other=pathlib.Path('/tmp/slr12-candidates-batch2-20261030')
entries=[]
for x in json.load(open(base/'candidate-provenance.json'))['entries']:
 entries.append({'word':x['word'],'text':x['original_transcript']['line'][0].split(' ',1)[1],'src':str(base/pathlib.Path(x['source_member']).name),'clip':[x['start_seconds'],x['end_seconds']]})
for x in json.load(open(other/'candidate-provenance.json'))['candidates']:
 entries.append({'word':x['target'],'text':x['transcript'],'src':str(other/x['source']['name']),'clip':[x['start'],x['end']]})
model=Wav2Vec2ForCTC.from_pretrained('/tmp/audit-b-ctc-model',local_files_only=True,use_safetensors=True).eval();proc=Wav2Vec2Processor.from_pretrained('/tmp/audit-b-ctc-model',local_files_only=True);tok=proc.tokenizer;blank=tok.pad_token_id
out=[]
for x in entries:
 audio=whisper.load_audio(x['src'],sr=16000);text=re.sub(r'[^A-Z\' ]','',x['text'].upper());text=re.sub(r' +',' ',text).strip();ref=text.replace(' ','|'); phrase=x['word'].upper().replace(' ','|');pos=ref.find(phrase); assert pos>=0 and ref.find(phrase,pos+1)<0
 ids=tok.convert_tokens_to_ids(list(ref));assert tok.unk_token_id not in ids
 with torch.inference_mode():logits=model(proc(audio,sampling_rate=16000,return_tensors='pt').input_values).logits;greedy=proc.batch_decode(logits.argmax(dim=-1))[0];logp=logits.log_softmax(-1).squeeze(0).numpy()
 ext=[blank]
 for token in ids:ext.extend([token,blank])
 T,S=len(logp),len(ext);dp=np.full((T,S),-np.inf);parent=np.full((T,S),-1,dtype=np.int32);dp[0,0]=logp[0,blank];dp[0,1]=logp[0,ext[1]]
 for t in range(1,T):
  for s,label in enumerate(ext):
   opts=[(dp[t-1,s],s)]
   if s>0:opts.append((dp[t-1,s-1],s-1))
   if s>1 and label!=blank and label!=ext[s-2]:opts.append((dp[t-1,s-2],s-2))
   best,prev=max(opts);dp[t,s]=best+logp[t,label];parent[t,s]=prev
 s=max([S-1,S-2],key=lambda i:dp[-1,i]);states=[]
 for t in range(T-1,-1,-1):states.append(s);s=parent[t,s] if t else s
 states=states[::-1]
 def span(lo,hi):
  times=[t for t,s in enumerate(states) if s%2==1 and lo<=((s-1)//2)<hi and ref[(s-1)//2]!='|']
  return [round(min(times)*.02,2),round((max(times)+1)*.02,2)] if times else None
 left=ref.rfind('|',0,max(0,pos-1))+1;right=ref.find('|',pos+len(phrase)+1);right=len(ref) if right<0 else right
 previous=ref[left:pos-1] if pos else None;following=ref[pos+len(phrase)+1:right] if pos+len(phrase)<len(ref) else None
 r={**x,'sha256':hashlib.sha256(pathlib.Path(x['src']).read_bytes()).hexdigest(),'greedy':greedy,'ctc':span(pos,pos+len(phrase)),'previous':{'word':previous,'span':span(left,pos-1)} if previous else None,'next':{'word':following,'span':span(pos+len(phrase)+1,right)} if following else None,'model':'facebook/wav2vec2-base-960h@22aad52d435eb6dbaf354bdad9b0da84ce7d6156','method':'full source transcript forced alignment; 20ms nominal frames; character token spans are not acoustic phoneme boundaries','human_auditioned':False};out.append(r);print(json.dumps(r,ensure_ascii=False),flush=True)
pathlib.Path('/tmp/slr12-independent-ctc-results-20261030.json').write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n')
