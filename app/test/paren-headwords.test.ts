// D6：带括号注释的词头可查，--words 选择同理。
import {it,expect} from 'vitest';
import fs from 'node:fs';
import {search} from '../server/src/search.ts';
import {runPipeline} from '../server/src/ai/pipeline.ts';
import {fakeRunner} from '../server/src/ai/fake-runner.ts';
import {database} from './v3-helpers.ts';
import {temp} from './p2-helpers.ts';
function db3(){const db=database(4);db.prepare("UPDATE words SET headword='child (pl. children)' WHERE id=2").run();db.prepare("UPDATE words SET headword='be (am, is, are)' WHERE id=3").run();db.prepare("UPDATE words SET headword='children''s' WHERE id=4").run();return db;}
it.each(['child (pl. children)','Child (pl. Children)','child(pl. children)','child  (pl.  children)','child (pl','child','be (am, is, are)','be'])('search %j finds the parenthetical headword first',q=>{
  const db=db3();try{const r=search(db,q);expect(r[0]?.headword,q).toBe(q.startsWith('be')?'be (am, is, are)':'child (pl. children)');}finally{db.close();}
});
it('ordinary prefix search is unchanged and a wrong note does not match',()=>{const db=db3();try{expect(search(db,'chil').map(r=>r.headword)).toEqual(['child (pl. children)',"children's"]);expect(search(db,'dog (pl. dogs)')).toEqual([]);}finally{db.close();}});
it('--words child selects "child (pl. children)"; exact headwords still win; unknown still errors',async()=>{
  const db=db3(),root=temp();try{
    const dry=await runPipeline(db,{root,fake:true,dryRun:true,words:['child','be'],limit:2,batch:1},fakeRunner);expect(dry.batches?.flatMap(b=>b.words)).toEqual(['child (pl. children)','be (am, is, are)']);
    const full=await runPipeline(db,{root,fake:true,dryRun:true,words:['child (pl. children)'],limit:1,batch:1},fakeRunner);expect(full.batches?.flatMap(b=>b.words)).toEqual(['child (pl. children)']);
    await expect(runPipeline(db,{root,fake:true,dryRun:true,words:['dog']},fakeRunner)).rejects.toThrow('unknown requested word: dog');
  }finally{db.close();fs.rmSync(root,{recursive:true,force:true});}
});
