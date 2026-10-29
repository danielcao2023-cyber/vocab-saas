import argparse,json,sqlite3,re,os,hashlib,collections
from pathlib import Path
from urllib.parse import urlsplit

parser=argparse.ArgumentParser(description='Audit high-school primary recording metadata and hashes; not a listening or runtime audit.')
parser.add_argument('--db',required=True,help='Path to an installed vocabulary database, opened read-only')
parser.add_argument('--missing-json',help='Optional path to write the complete missing list')
args=parser.parse_args()
p=str(Path(__file__).resolve().parent.parent/'data/pronunciation');m=json.load(open(p+'/manifest.json'))['entries']; db=sqlite3.connect(Path(args.db).resolve().as_uri()+'?mode=ro',uri=True)
rows=db.execute("select distinct w.id,w.headword from words w join vocabulary_members vm on vm.word_id=w.id join vocabulary_books b on b.id=vm.book_id where b.category='high'").fetchall()
def main(s):return [x.strip() for x in re.sub(r'\(.*?\)|（.*?）','',re.sub('[’‘ʼ]',"'",s)).split('/') if x.strip()]
def safe_url(value):
 try:
  u=urlsplit(value)
  return u.scheme=='https' and bool(u.hostname) and u.username is None and u.password is None
 except (TypeError, ValueError):return False
def valid(k,r):
 if not isinstance(r,dict) or r.get('word')!=k or r.get('accent') not in ('us','uk','unknown'):return False
 if not all(isinstance(r.get(x),str) and r[x].strip() for x in ['author','license']):return False
 if not all(safe_url(r.get(x)) for x in ['sourceUrl','licenseUrl']):return False
 file=r.get('file','');h=r.get('sha256','')
 if not isinstance(file,str) or not isinstance(h,str) or not re.fullmatch(r'[A-Za-z0-9_-]+\.mp3',file) or not re.fullmatch('[a-f0-9]{64}',h):return False
 try:
  f=os.path.realpath(p+'/'+file)
  return f.startswith(os.path.realpath(p)+os.sep) and os.path.isfile(f) and 0<os.path.getsize(f)<=2000000 and hashlib.sha256(open(f,'rb').read()).hexdigest()==h
 except OSError:return False
c=collections.Counter(); bad=[]; variants=collections.Counter()
for id,h in rows:
 forms=main(h); key=forms[0] if forms else ''; r=m.get(key); ok=valid(key,r);c['词条总数']+=1;c['有效录音' if ok else '无有效主录音']+=1
 if not ok:bad.append([id,h,key,'无清单' if not r else '文件或元数据无效'])
 if ok:
  c['口音_'+r.get('accent','')]+=1
  for v in ('noun','verb'):
   if valid(key,r.get('variants',{}).get(v)):variants[v]+=1
print(json.dumps({'counts':c,'valid_variants':variants,'missing_samples':bad[:30],'missing_all':len(bad)},ensure_ascii=False,indent=2))
if args.missing_json:
 Path(args.missing_json).write_text(json.dumps(bad,ensure_ascii=False,indent=2)+'\n')
