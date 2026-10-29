import whisper,torch,json,pathlib,subprocess,re
root=pathlib.Path('/tmp/mswc-resumable-20261030/resume-check'); report=json.loads((root/'extract-report.json').read_text()); targets={'spacewalk','pets','ontario','winnipeg','montreal'}; rows=[x for x in report['samples'] if x['label'] in targets];contexts=json.loads(pathlib.Path('/tmp/mswc-resumable-20261030/alignments-screen.json').read_text()); c={r['member']:r for r in contexts};gaps=json.loads(pathlib.Path('/tmp/mswc-current-gaps-a.json').read_text());missing={x['spoken'].casefold() for x in gaps}; out=[];torch.set_num_threads(4)
for s in rows:
 path=root/s['file'];d=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=sample_rate,channels','-of','json',str(path)],text=True));p=subprocess.run(['ffmpeg','-hide_banner','-nostdin','-i',str(path),'-af','silencedetect=noise=-35dB:d=0.025','-f','null','-'],capture_output=True,text=True,check=True);events=[l.strip() for l in p.stderr.splitlines() if 'silence_' in l];out.append({**s,'currentBuiltOfflineMissing':s['label'] in missing,'context':c[s['archive_member']],'probe':d,'silenceEvents':events,'models':{}})
for name in ['base','small','medium']:
 model=whisper.load_model(name,device='cpu')
 for row in out:
  a=model.transcribe(str(root/row['file']),language='en',fp16=False,temperature=0,verbose=None);row['models'][name]=a['text'].strip();print(name,row['file'],repr(a['text'].strip()),flush=True)
  pathlib.Path('/tmp/mswc-next-screen-partial.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
 del model
pathlib.Path('/tmp/mswc-next-screen.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
