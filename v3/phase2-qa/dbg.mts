const {default:Database}=await import('/workspace/vocab-saas/wt-v3p2/node_modules/better-sqlite3/lib/index.js');
const db=new Database(process.argv[2],{readonly:true});for(const q of process.argv.slice(3))console.log(JSON.stringify(db.prepare(q).all()));
