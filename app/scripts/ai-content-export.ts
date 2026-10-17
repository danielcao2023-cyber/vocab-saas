import { exportFile } from '../server/src/ai/transfer.ts';
import {args,required,isMain,cli} from '../server/src/ai/cli.ts';
if(isMain(import.meta.url))cli(()=>{const a=args();return exportFile(required(a,'db'),required(a,'out'));});
