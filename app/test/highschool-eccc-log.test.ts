import {expect,it,vi,afterEach} from 'vitest';
import fs from 'node:fs';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {makeLegacyFixture} from './learning-v3-helpers';
import {activateEvidencePolicy} from '../server/src/learning/evidence-migration';
import {migrateVocabulary} from '../server/src/vocabulary-import';
import {startLearning,nextLearning,answerLearning} from '../server/src/learning/engine';
import {buildApp} from '../server/src/app';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
import {createLocalRuntime} from '../web/src/offline/runtime';
import {bundledAudio,setMobileRecordings} from '../web/src/offline/mobile-mode';
import {packPronunciations} from '../scripts/mobile-pronunciation-assets';
const t=new Date('2026-10-21T01:00:00Z');afterEach(()=>vi.unstubAllGlobals());
function fixture(v3:boolean){const db=makeLegacyFixture(2);db.prepare("UPDATE words SET headword='Log' WHERE id=1").run();db.prepare("UPDATE words SET headword='log' WHERE id=2").run();migrateVocabulary(db);db.prepare("INSERT INTO vocabulary_entry_map(entry_key,word_id) VALUES ('Log',1),('log',2)").run();db.prepare("INSERT INTO wrong_words(word_id,wrong_count,last_wrong_at,correct_days) VALUES (1,2,'2026-10-01T00:00:00.000Z','[]'),(2,4,'2026-10-01T00:00:00.000Z','[]')").run();if(v3)activateEvidencePolicy(db,t);return db;}
it('serves both log spellings and preserves the corpus source in online and offline credits',async()=>{
 const entries=JSON.parse(fs.readFileSync('data/pronunciation/manifest.json','utf8')).entries;const upper=entries.Log,lower=entries.log;expect(upper).toBeDefined();expect(lower).toBeDefined();expect(upper.word).toBe('Log');expect(lower.word).toBe('log');expect(upper.sha256).toBe(lower.sha256);expect(upper.ipa).toBe('/lɒɡ/');expect(upper.pronunciationNote).toContain('未人工试听');expect(upper.pronunciationNote).toContain('T_11035.wav');
 const db=fixture(false),app=buildApp(db),dir=mkdtempSync(join(tmpdir(),'eccc-log-'));let mobile:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;try{
  const before=db.prepare('SELECT entry_key,word_id FROM vocabulary_entry_map ORDER BY entry_key').all();const beforeHistory=db.prepare('SELECT word_id,wrong_count FROM wrong_words ORDER BY word_id').all();
  for(const word of ['Log','log']){const meta=(await app.inject('/api/pronunciation?word='+word)).json();expect(meta.status).toBe('ready');const audio=await app.inject('/api/pronunciation/audio?word='+word);expect(audio.statusCode).toBe(200);expect(createHash('sha256').update(audio.rawPayload).digest('hex')).toBe(upper.sha256);const credit=(await app.inject('/api/pronunciation/credits?word='+word)).body;for(const s of ['T_11035.wav','未人工试听','左声道','CC BY 4.0','Marxer'])expect(credit).toContain(s)}
  const detail=(await app.inject('/api/word/1')).json();expect(detail.word.headword).toBe('log');
  const packed=packPronunciations({version:1,entries:{Log:upper,log:lower}},'data/pronunciation',dir);expect(createHash('sha256').update(readFileSync(join(dir,upper.file))).digest('hex')).toBe(upper.sha256);for(const s of ['T_11035.wav','未人工试听','左声道','CC BY 4.0','Marxer'])expect(packed.credits).toContain(s);
  setMobileRecordings(packed.recordings);expect(bundledAudio('Log')).toBe(bundledAudio('log'));mobile=await openBrowserDatabase(db.serialize());const runtime=createLocalRuntime({db:mobile,save:async()=>{},assetFetch:vi.fn(),recordings:packed.recordings,now:()=>t});for(const w of ['Log','log'])expect(await(await runtime.fetch('/api/pronunciation?word='+w)).json()).toMatchObject({status:'ready',word:w,ipa:'/lɒɡ/'});expect(db.prepare('SELECT entry_key,word_id FROM vocabulary_entry_map ORDER BY entry_key').all()).toEqual(before);expect(db.prepare('SELECT word_id,wrong_count FROM wrong_words ORDER BY word_id').all()).toEqual(beforeHistory);const offlineDetail=await(await runtime.fetch('/api/word/1')).json();expect(offlineDetail.word.headword).toBe('log');
 }finally{mobile?.close();await app.close();db.close();rmSync(dir,{recursive:true,force:true})}
});
for(const v3 of [false,true])for(const offline of [false,true])it(`${v3?'V3':'V2'} ${offline?'offline':'online'} keeps the already issued Log identity and audio key`,async()=>{
 const source=fixture(v3);startLearning(source,t);const issue=nextLearning(source,t).card!;source.prepare("UPDATE learning_issues SET mode='dictation' WHERE id=?").run(issue.issueId);const mobile=offline?await openBrowserDatabase(source.serialize()):null;const db=mobile?asSharedDb(mobile):source;try{const before=db.prepare('SELECT entry_key,word_id FROM vocabulary_entry_map ORDER BY entry_key').all();const c=nextLearning(db,t).card!;expect(c.issueId).toBe(issue.issueId);expect(c.audioWord).toBe('Log');const r=answerLearning(db,{policyVersion:3,issueId:c.issueId,answerId:'same-issue',answer:'log'},t);expect(r.correct).toBe(true);expect(db.prepare('SELECT entry_key,word_id FROM vocabulary_entry_map ORDER BY entry_key').all()).toEqual(before);expect(new Set((before as {word_id:number}[]).map(x=>x.word_id)).size).toBe(2)}finally{mobile?.close();source.close()}
});
