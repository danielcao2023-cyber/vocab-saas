import json,subprocess,urllib.parse,time,re,collections,sys
rows=json.load(open(sys.argv[1])); words=list(dict.fromkeys(r['spoken'] for r in rows if not r['placeholder'] and r['spoken']));out=sys.argv[2];done=set()
try:
 for l in open(out):done.update(json.loads(l)['requested'])
except FileNotFoundError:pass
words=[w for w in words if w not in done]
for offset in range(0,len(words),20):
 batch=words[offset:offset+20];params=urllib.parse.urlencode({'action':'query','format':'json','formatversion':'2','prop':'revisions','rvprop':'content','rvslots':'main','redirects':'1','titles':'|'.join(batch)});url='https://en.wiktionary.org/w/api.php?'+params;result=None;error=None
 for attempt in range(2):
  p=subprocess.run(['curl','--http1.1','--proto','=https','-sS','--compressed','--connect-timeout','6','--max-time','18','--user-agent','VocabSaasPronunciation/1.0 (personal educational audio importer)','-w','\n%{http_code}',url],capture_output=True,text=True,timeout=22)
  try:
   body,status=p.stdout.rsplit('\n',1);status=int(status)
   if p.returncode!=0 or status!=200:
    error=f'curl={p.returncode} http={status}'
    if status in (429,503): break
    time.sleep(2*(attempt+1));continue
   result=json.loads(body)
   if 'error' in result: error='api:'+str(result['error'].get('code'));result=None;time.sleep(2*(attempt+1));continue
   break
  except Exception as e:error='invalid_response:'+str(e);time.sleep(2*(attempt+1))
 if result is None:
  item={'requested':batch,'status':'failed','error':error,'rows':[{'word':w,'status':'query_failed'} for w in batch]}
 else:
  q=result.get('query',{});redirect={r['from']:r['to'] for r in q.get('redirects',[])};normalized={r['from']:r['to'] for r in q.get('normalized',[])};pages={p['title']:p for p in q.get('pages',[])};output=[]
  for w in batch:
   name=normalized.get(w,w);name=redirect.get(name,name);p=pages.get(name)
   if not p:output.append({'word':w,'status':'unmatched_response','title':name});continue
   if p.get('missing'):output.append({'word':w,'status':'no_page','title':name});continue
   content=p.get('revisions',[{}])[0].get('slots',{}).get('main',{}).get('content','');sections=re.split(r'(?m)^==\s*([^=\n]+?)\s*==\s*$',content);english=next((sections[i+1] for i in range(1,len(sections)-1,2) if sections[i].strip().lower()=='english'),'');audio=[]
   for m in re.finditer(r'\{\{audio\s*\|\s*en\s*\|\s*([^|}\n]+)',english,re.I):audio.append(m.group(1).strip())
   output.append({'word':w,'status':'audio_candidates' if audio else ('no_audio_found' if english else 'no_english_section'),'title':name,'audio':list(dict.fromkeys(audio)),'evidenceUrl':'https://en.wiktionary.org/wiki/'+urllib.parse.quote(name.replace(' ','_'))+'#English','redirected':name.casefold()!=w.casefold()})
  item={'requested':batch,'status':'success','rows':output}
 with open(out,'a') as f:f.write(json.dumps(item,ensure_ascii=False)+'\n')
 print(f'batch {offset//20+1}: {item["status"]} ({len(batch)})',flush=True)
 if item['status']=='failed' and ('http=429' in (error or '') or 'http=503' in (error or '')):
  print('rate limited; stop. Check Retry-After externally before resuming.',flush=True);break
 time.sleep(1)
