#!/usr/bin/env python3
"""Read local dictionaries and unit-verified textbook sheets; never touch a learning DB."""
import argparse, bisect, hashlib, json, re, unicodedata
from pathlib import Path
import openpyxl

def clean(value):
    return ' '.join(unicodedata.normalize('NFC',str(value or '')).replace('’',"'").replace('‘',"'").split())

def generate(downloads, textbooks, output):
    manifest=Path(__file__).resolve().parents[1]/'data/vocabulary/highschool-units.json'
    # This legacy generator does not include later reviewed edits. Never write
    # into the published directory, even if its catalog was moved or deleted.
    if output.parent.resolve() == manifest.parent.resolve():
        raise ValueError('refusing to overwrite published vocabulary directory; use a new scratch directory')
    source_output=output.with_name('sources.json')
    if output.resolve() == source_output.resolve() or any(p.exists() or p.is_symlink() for p in (output,source_output)):
        raise ValueError('refusing to overwrite existing catalog or sources; use a new scratch directory')
    schools=json.loads(manifest.read_text())
    exams=[('cet4','大学英语四级','CET4_T.json'),('cet6','大学英语六级','CET6_T.json'),('kaoyan','考研英语','KaoYan_3_T.json'),('toefl','托福 TOEFL','TOEFL_3_T.json'),('ielts','雅思 IELTS','IELTS_3_T.json'),('gre','GRE','GRE_3_T.json')]
    books=[];units=[];entries={};sources=[]
    def add(head,meaning,phone,book,unit,position):
        head=clean(head);meaning=str(meaning or '').replace('\\n','\n').strip()
        if not head or len(head)>120 or not meaning or len(meaning)>16000 or '\ufffd' in head:
            raise ValueError(f'Invalid entry: {book}/{head}')
        item=entries.setdefault(head,{'key':head,'headword':head,'meaning':meaning,'phonetic':clean(phone),'memberships':[]})
        member={'bookId':book,'unitId':unit,'position':position}
        if not any(m['bookId']==book and m['unitId']==unit for m in item['memberships']):item['memberships'].append(member)
    def record(file,url,**extra):
        sources.append({'file':file.name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'url':url,**extra})
    for school in schools:
        file=textbooks/school['sourceDirectory']/'words.xlsx'
        workbook=openpyxl.load_workbook(file,read_only=True,data_only=True)
        rows=list(workbook.active.values)[1:];workbook.close()
        heads=[clean(row[0]) for row in rows]
        starts=[]
        for unit in school['unitStarts']:
            matches=[i for i,h in enumerate(heads) if h==unit['startWord']]
            if len(matches)!=1:raise ValueError(f'Ambiguous/missing unit boundary {school["id"]}/{unit}')
            starts.append(matches[0]);units.append({'id':school['id']+':'+unit['id'],'bookId':school['id'],'title':unit['title'],'position':len(starts)-1})
        if starts[0]!=0 or starts!=sorted(set(starts)):raise ValueError('Unit boundary ordering mismatch')
        books.append({key:school[key] for key in ['id','title','category','edition','sourceUrl']})
        for i,row in enumerate(rows):
            unit=school['unitStarts'][bisect.bisect_right(starts,i)-1]
            add(row[0],row[3],row[2] or row[1],school['id'],school['id']+':'+unit['id'],i)
        meta=json.loads((file.parent/'meta.json').read_text())
        record(file,meta['wordSource'],bookId=school['id'],unitStarts=starts,rows=len(rows),officialUrl=school['sourceUrl'],printedWordPage=school['printedWordPage'])
    for id,title,filename in exams:
        file=downloads/'qwerty-learner-dicts'/filename
        rows=json.loads(file.read_text());books.append({'id':id,'title':title,'category':'exam','edition':'本地下载词表 2026-10','sourceUrl':'https://github.com/RealKai42/qwerty-learner'})
        for i,row in enumerate(rows):
            trans=row.get('trans');meaning='\n'.join(str(t).strip() for t in trans if str(t).strip()) if isinstance(trans,list) else str(trans or '')
            add(row.get('name'),meaning,row.get('usphone') or row.get('ukphone'),id,None,i)
        record(file,'https://github.com/RealKai42/qwerty-learner',bookId=id,rows=len(rows))
    corrections=json.loads(manifest.with_name('corrections.json').read_text())
    for correction in corrections['entries']:
        item=entries.get(correction['headword'])
        if not item or item['meaning']!=correction['expected']:
            raise ValueError(f'Correction source mismatch: {correction["headword"]}')
        item['meaningCorrection']={'expected':item['meaning']}
        item['meaning']=correction['meaning']
        if 'expectedPhonetic' in correction:
            if item['phonetic']!=correction['expectedPhonetic']:
                raise ValueError(f'Phonetic source mismatch: {correction["headword"]}')
            item['phoneticCorrection']={'expected':item['phonetic']}
            item['phonetic']=correction['phonetic']
    result={'version':corrections['version'],'books':books,'units':units,'entries':list(entries.values())}
    output.parent.mkdir(parents=True,exist_ok=True)
    # Exclusive creation also prevents an overwrite if a file appeared while
    # the sources were being read. Clean up only the catalog created here.
    with output.open('x',encoding='utf-8') as catalog_file:
        try:
            with source_output.open('x',encoding='utf-8') as source_file:
                catalog_file.write(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
                source_file.write(json.dumps({'generatedAt':'2026-10-26','normalization':'NFC, curly apostrophe and whitespace; case preserved; no stemming','sources':sources},ensure_ascii=False,indent=2)+'\n')
        except Exception:
            output.unlink(missing_ok=True)
            raise
    print(json.dumps({'books':len(books),'units':len(units),'uniqueEntries':len(entries),'memberships':sum(len(e['memberships']) for e in entries.values()),'bytes':output.stat().st_size},ensure_ascii=False))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--downloads',type=Path,required=True);parser.add_argument('--textbooks',type=Path,required=True);parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args();generate(args.downloads,args.textbooks,args.output)
