#!/usr/bin/env python3
"""Compare an already downloaded MSWC metadata gzip with a read-only gap audit JSON."""
import argparse, gzip, json
p=argparse.ArgumentParser();p.add_argument('metadata');p.add_argument('gaps');args=p.parse_args()
with gzip.open(args.metadata,'rt',encoding='utf-8') as f:
 buf='';found=False;counts=None
 while True:
  chunk=f.read(262144)
  if not chunk:break
  buf+=chunk
  if not found:
   i=buf.find('"en": {"language":')
   if i<0:buf=buf[-80:];continue
   buf=buf[i:];found=True
  i=buf.find('"wordcounts": {')
  if i<0:continue
  j=buf.find('}',i)
  if j<0:continue
  counts=json.loads(buf[i+len('"wordcounts": '):j+1]);break
if counts is None:raise SystemExit('English wordcounts not found in expected metadata format')
with open(args.gaps,encoding='utf-8') as f:gaps=json.load(f)
items=[{'key':x['key'],'word':x['word'],'spoken':x['spoken'],'clip_count':counts[x['spoken'].casefold()]} for x in gaps if x['spoken'].casefold() in counts]
print(json.dumps({'englishLabelCount':len(counts),'gapCount':len(gaps),'matches':items},ensure_ascii=False,indent=2))
