import Database from 'better-sqlite3';
import { dailyFrequency } from '../server/src/freq.ts';
import { args,required,isMain,cli,dbArg } from '../server/src/ai/cli.ts';
if(isMain(import.meta.url))cli(()=>{const a=args();const csv=required(a,'ecdict');const db=new Database(dbArg(a),{fileMustExist:true});try{return dailyFrequency(db,csv);}finally{db.close();}});
