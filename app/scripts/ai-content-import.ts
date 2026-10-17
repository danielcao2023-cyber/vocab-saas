import fs from 'node:fs';
import {importFile} from '../server/src/ai/transfer.ts';
import {args,required,isMain,cli} from '../server/src/ai/cli.ts';
if(isMain(import.meta.url))cli(()=>{const a=args();return importFile(required(a,'db'),JSON.parse(fs.readFileSync(required(a,'in'),'utf8')),{yes:!!a.yes,backup:typeof a.backup==='string'?a.backup:undefined});});
