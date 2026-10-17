import {it,expect} from 'vitest';
import {database} from './v3-helpers.ts';
import {snapshot,item} from './p2-helpers.ts';
import {sha256} from '../server/src/freq.ts';
import {importEditorContent,applyCorrections} from '../server/src/ai/editor.ts';
import {pipelineQueue} from '../server/src/ai/pipeline.ts';
import {contentCoverage} from '../server/src/ai/coverage.ts';
import {applyWordPatches} from '../server/src/ai/word-patches.ts';
const examples=[{en:'We go to school together every morning.',zh:'我们每天早上一起去学校。',target:'go'},{en:'I want to go home after lunch.',zh:'我想午饭后回家。',target:'go'}];
const collocations=[{en:'go to school',zh:'去上学'},{en:'go home',zh:'回家'}];
function setup(){const db=database(1);db.prepare("UPDATE words SET headword='go' WHERE id=1").run();const word=db.prepare('SELECT id,headword,meaning_zh FROM words WHERE id=1').get();return {db,manifest:{format:'vocab-core-editor-manifest',version:1,model:'codex-editor',prompt_version:'p2-core-editor-v1',words:[word]},output:{items:[item('go',{examples,collocations})]}};}
it('editor imports preserve honest provenance, are dry-run by default, and satisfy real core coverage without approval',()=>{
  const {db,manifest,output}=setup();try{
    const before=snapshot(db);expect(importEditorContent(db,manifest,output)).toMatchObject({planned:2,written:0,rejects:[]});expect(snapshot(db)).toEqual(before);
    expect(importEditorContent(db,manifest,output,true)).toMatchObject({written:2,rejects:[]});
    expect(db.prepare('SELECT DISTINCT model,prompt_version FROM word_content').all()).toEqual([{model:'codex-editor',prompt_version:'p2-core-editor-v1'}]);
    expect(db.prepare("SELECT COUNT(*) n FROM word_content WHERE status NOT IN ('generated','review')").get()).toEqual({n:0});
    expect(contentCoverage(db).real).toMatchObject({coreGenerated:1,coreApproved:0});expect(pipelineQueue(db,{profile:'core'}).words).toHaveLength(0);
    expect(importEditorContent(db,manifest,output,true).written).toBe(0);
    db.prepare("UPDATE words SET meaning_zh='改变后的释义' WHERE id=1").run();expect(()=>importEditorContent(db,manifest,output,true)).toThrow('stale');expect(pipelineQueue(db,{profile:'core'}).words).toHaveLength(1);
  }finally{db.close();}
});
it('word patches check old values, preserve raw meanings and all non-word tables, and are idempotent',()=>{
  const {db}=setup();try{
    db.prepare("UPDATE words SET meaning_zh='旧义',meaning_raw='raw dictionary',phonetic=NULL WHERE id=1").run();
    const input={format:'vocab-word-patches',version:1,patches:[{entry:'go',field:'meaning_zh',expected:'旧义',value:'v. 去',source:'editorial review'},{entry:'go',field:'phonetic',expected:null,value:'/ɡəʊ/',source:'dictionary reference'}]};
    const before=snapshot(db);expect(applyWordPatches(db,input)).toMatchObject({planned:2,written:0});expect(snapshot(db)).toEqual(before);
    expect(applyWordPatches(db,input,true)).toMatchObject({written:2});expect(snapshot(db,['words'])).toEqual(Object.fromEntries(Object.entries(before).filter(([k])=>k!=='words')));
    expect(db.prepare('SELECT meaning_raw,meaning_source,meaning_zh,phonetic FROM words WHERE id=1').get()).toEqual({meaning_raw:'raw dictionary',meaning_source:'manual',meaning_zh:'v. 去',phonetic:'/ɡəʊ/'});
    expect(applyWordPatches(db,input,true)).toMatchObject({written:0,unchanged:2});
    expect(()=>applyWordPatches(db,{...input,patches:[{...input.patches[0],value:'另一个值'}]},true)).toThrow('stale');
    expect(()=>applyWordPatches(db,{...input,patches:[{...input.patches[0],field:'meaning_raw'}]},true)).toThrow('invalid');
  }finally{db.close();}
});
it('corrections verify the exact latest original and insert a review revision while hiding the old row',()=>{
  const {db,manifest,output}=setup();try{
    importEditorContent(db,manifest,output,true);const row=db.prepare("SELECT id,body_json FROM word_content WHERE kind='example'").get() as {id:number;body_json:string};
    const corrected=examples.map(x=>({...x}));corrected[1].zh='我想在午饭后回家。';const input={corrections:[{content_id:row.id,original_body_hash:sha256(row.body_json),corrected_body:corrected,reason:'make the translation natural'}]};
    const before=snapshot(db);expect(applyCorrections(db,input)).toMatchObject({planned:1,written:0});expect(snapshot(db)).toEqual(before);
    expect(applyCorrections(db,input,true).written).toBe(1);expect(()=>applyCorrections(db,input,true)).toThrow('stale');
    expect(db.prepare("SELECT status,reviewed,approved_at FROM word_content ORDER BY id DESC LIMIT 1").get()).toEqual({status:'review',reviewed:0,approved_at:null});
    expect(contentCoverage(db).real).toMatchObject({coreGenerated:1,coreApproved:0});
  }finally{db.close();}
});
