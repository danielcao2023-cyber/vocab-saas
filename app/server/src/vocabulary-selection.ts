import type {DB} from './db.ts';
import {HttpError} from './http-error.ts';
import {shDay} from './time.ts';
import {listVocabularyBooks} from './vocabulary-import.ts';
import {DEFAULT_VOCABULARY,type VocabularySelection,type VocabularyState,type VocabularyBook} from '../../shared/vocabulary.ts';
const KEY='vocabulary_selection';
interface Stored {selection:VocabularySelection;previous:VocabularySelection;effectiveOn:string|null}
export function vocabularyBooks(db:DB):VocabularyBook[]{
 const books=listVocabularyBooks(db) as VocabularyBook[];
 if(!books.some(b=>b.id==='kb2022')){
  const count=(db.prepare("SELECT COUNT(*) n FROM words WHERE source='kb2022'").get() as {n:number}).n;
  if(count)books.unshift({id:'kb2022',title:'初中课标1600词',category:'core',edition:'2022课标',sourceUrl:'https://www.moe.gov.cn/',wordCount:count,units:[]});
 }
 return books;
}
function validate(db:DB,input:unknown):VocabularySelection{
 if(!input||typeof input!=='object'||Array.isArray(input))throw new HttpError(400,'请选择学习词书。');
 const value=input as Record<string,unknown>;
 if(Object.keys(value).some(k=>!['bookId','unitId'].includes(k))||typeof value.bookId!=='string'||!(value.unitId===null||typeof value.unitId==='string'))throw new HttpError(400,'词书或单元格式无效。');
 const book=db.prepare('SELECT 1 FROM vocabulary_books WHERE id=?').get(value.bookId)||(value.bookId==='kb2022'&&db.prepare("SELECT 1 FROM words WHERE source='kb2022' LIMIT 1").get());
 if(!book||value.unitId!==null&&!db.prepare('SELECT 1 FROM vocabulary_units WHERE id=? AND book_id=?').get(value.unitId,value.bookId))throw new HttpError(400,'词书或单元不存在，请重新选择。');
 return {bookId:value.bookId,unitId:value.unitId};
}
function stored(db:DB):Stored{
 try{const row=db.prepare('SELECT value FROM settings WHERE key=?').get(KEY) as {value:string}|undefined;
  if(row){const value=JSON.parse(row.value);if(value.effectiveOn!==null&&!(typeof value.effectiveOn==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value.effectiveOn)))throw Error('Invalid date');return {selection:validate(db,value.selection),previous:validate(db,value.previous),effectiveOn:value.effectiveOn};}
 }catch{/* Unknown or outdated selections never expose arbitrary settings. */}
 return {selection:{...DEFAULT_VOCABULARY},previous:{...DEFAULT_VOCABULARY},effectiveOn:null};
}
export function activeVocabularySelection(db:DB,now=new Date()):VocabularySelection{
 const value=stored(db);return value.effectiveOn&&shDay(now)<value.effectiveOn?value.previous:value.selection;
}
export function selectedWordIds(db:DB,now=new Date()):Set<number>|null{
 return wordIdsForSelection(db,activeVocabularySelection(db,now));
}
export function wordIdsForSelection(db:DB,selection:VocabularySelection):Set<number>|null{
 const {bookId,unitId}=selection;
 if(bookId==='kb2022'){
  if(unitId!==null)throw new HttpError(400,'初中课标词表尚未划分教材单元。');
  const words=db.prepare("SELECT id FROM words WHERE source='kb2022'").all() as {id:number}[];
  return words.length?new Set(words.map(w=>w.id)):null;
 }
 validate(db,selection);
 return new Set((db.prepare('SELECT DISTINCT word_id FROM vocabulary_members WHERE book_id=? AND (? IS NULL OR unit_id=?)').all(bookId,unitId,unitId) as {word_id:number}[]).map(w=>w.word_id));
}
export function readVocabularyState(db:DB,now=new Date()):VocabularyState{
 const value=stored(db),books=vocabularyBooks(db),pending=!!value.effectiveOn&&shDay(now)<value.effectiveOn;
 return {selection:value.selection,activeSelection:pending?value.previous:value.selection,effectiveOn:pending?value.effectiveOn:null,books,wordCount:selectedWordIds(db,now)?.size??(db.prepare('SELECT COUNT(*) n FROM words').get() as {n:number}).n};
}
export function saveVocabularySelection(db:DB,input:unknown,now:Date):VocabularyState{
 return db.transaction(()=>{
  const selection=validate(db,input),old=stored(db),current=activeVocabularySelection(db,now);
  const same=(a:VocabularySelection,b:VocabularySelection)=>a.bookId===b.bookId&&a.unitId===b.unitId;
  if(!same(selection,old.selection)){
   const started=!!db.prepare('SELECT 1 FROM learning_days WHERE day=?').get(shDay(now));
   const next:Stored={selection,previous:current,effectiveOn:same(selection,current)||!started?null:shDay(new Date(+now+86400000))};
   db.prepare('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(KEY,JSON.stringify(next));
  }
  return readVocabularyState(db,now);
 })();
}
