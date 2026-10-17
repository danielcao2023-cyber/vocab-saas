const D=require('/workspace/vocab-saas/app/node_modules/better-sqlite3');
for (const f of process.argv.slice(2)){ const db=new D(f,{readonly:true});
 const cols=db.prepare("pragma table_info(words)").all().map(c=>c.name);
 console.log(f, 'cols:', cols.join(','));
 const one=s=>{try{return JSON.stringify(db.prepare(s).all())}catch(e){return 'ERR '+e.message}};
 console.log(' total', one("select count(*) n from words"));
 console.log(' kb2022', one("select count(*) n from words where source='kb2022'"));
 console.log(' byprio', one("select priority, count(*) n from words where source='kb2022' group by priority"));
 console.log(' manual', one("select count(*) n from words where source='kb2022' and manual_meaning is not null and manual_meaning<>''"));
 console.log(' cards', one("select count(*) n from cards"), 'logs', one("select count(*) n from review_logs"));
}
