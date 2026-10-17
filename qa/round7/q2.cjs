const D=require('/workspace/vocab-saas/app/node_modules/better-sqlite3');
const f=process.argv[2]; const db=new D(f,{readonly:true});
const a=s=>db.prepare(s).all();
console.log('src',JSON.stringify(a("select meaning_source, count(*) n from words group by 1")));
console.log('flag',JSON.stringify(a("select meaning_flag, count(*) n from words group by 1")));
console.log('nophon',JSON.stringify(a("select count(*) n from words where phonetic is null or phonetic=''")));
console.log('sample',JSON.stringify(a("select count(*) n from words where is_sample=1")));
for (const h of ['can','will','well','still','Miss','miss','Ms','o\'clock','right','either','laptop','app','God','god'])
  console.log(JSON.stringify(a("select headword,entry_raw,phonetic,meaning_source,meaning_flag,priority,freq_rank,replace(meaning_zh,char(10),' | ') m from words where headword=?".replace('?',"'"+h.replace("'","''")+"'"))));
console.log('curly',JSON.stringify(a("select headword from words where headword like '%’%' or headword like '%‘%'")));
console.log('dupCI',JSON.stringify(a("select lower(headword) h,count(*) n from words group by 1 having n>1")));
