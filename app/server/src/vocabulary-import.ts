import type { DB } from './db.ts';
import { mainHeadwords } from './text.ts';
import { meaningsOverlap } from './quiz.ts';
import { randomUUID } from 'node:crypto';
import { CATALOG_ISSUE_REPLACED } from './learning/issue-cancellation.ts';

/** Catalog structure imported from external source */
export interface Catalog {
  version: number;
  books: Book[];
  units: Unit[];
  entries: Entry[];
}

export interface Book {
  id: string;
  title: string;
  category: string;
  edition: string;
  sourceUrl: string;
}

export interface Unit {
  id: string;
  bookId: string;
  title: string;
  position: number;
}

export interface Entry {
  key: string;
  headword: string;
  meaning: string;
  meaningCorrection?: {expected:string};
  headwordCorrection?: {expected:string};
  phoneticCorrection?: {expected:string};
  phonetic?: string;
  pos?: string;
  memberships: Membership[];
  retiredMemberships?: {bookId:string;unitId:string;replacementKey:string}[];
}

export interface Membership {
  bookId: string;
  unitId: string | null;
  position: number;
}

/** Type alias for the DB type from db.ts */
export type { DB };

/**
 * Creates the vocabulary schema tables if they don't exist.
 * Idempotent - can be called multiple times safely.
 */
export function migrateVocabulary(db: DB): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vocabulary_books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      edition TEXT NOT NULL,
      source_url TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vocabulary_units (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL REFERENCES vocabulary_books(id),
      title TEXT NOT NULL,
      position INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vocabulary_members (
      book_id TEXT NOT NULL REFERENCES vocabulary_books(id),
      word_id INTEGER NOT NULL REFERENCES words(id),
      unit_id TEXT NOT NULL DEFAULT '',
      position INTEGER NOT NULL,
      PRIMARY KEY(book_id, unit_id, word_id)
    );

    CREATE TABLE IF NOT EXISTS vocabulary_entry_map (
      entry_key TEXT PRIMARY KEY,
      word_id INTEGER NOT NULL REFERENCES words(id)
    );

    CREATE TABLE IF NOT EXISTS vocabulary_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_vocabulary_members_word_id ON vocabulary_members(word_id);
    CREATE INDEX IF NOT EXISTS idx_vocabulary_members_book_id ON vocabulary_members(book_id);
  `);
}

/**
 * Installs or updates vocabulary catalog data atomically.
 * Idempotent - safe to call multiple times with same or expanded catalog.
 * Does not delete existing words, cards, or learning data.
 * Preserves existing content except explicitly audited, expected-value corrections.
 */
export function installVocabulary(db: DB, catalog: Catalog): void {
  // Validate catalog structure
  validateCatalog(catalog);

  // Build lookup maps for validation
  const bookIds = new Set(catalog.books.map((b) => b.id));
  const unitMap = new Map<string, Unit>();
  for (const unit of catalog.units) {
    if (!bookIds.has(unit.bookId)) {
      throw new Error(`Unit ${unit.id} references unknown book ${unit.bookId}`);
    }
    unitMap.set(unit.id, unit);
  }

  // Validate all memberships reference valid book/unit combinations
  for (const entry of catalog.entries) {
    for (const membership of entry.memberships) {
      if (!bookIds.has(membership.bookId)) {
        throw new Error(
          `Entry ${entry.key} membership references unknown book ${membership.bookId}`
        );
      }
      if (membership.unitId !== null && (!unitMap.has(membership.unitId)||unitMap.get(membership.unitId)!.bookId!==membership.bookId)) {
        throw new Error(
          `Entry ${entry.key} membership references unknown unit ${membership.unitId}`
        );
      }
    }
  }

  // Start transaction for atomicity
  const tx = db.transaction(() => {
    const optionCorrections = new Map<number, {oldOption:string;newOption:string}>();
    // Upsert books
    for (const book of catalog.books) {
      db.prepare(
        `INSERT INTO vocabulary_books (id, title, category, edition, source_url)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           title=excluded.title,
           category=excluded.category,
           edition=excluded.edition,
           source_url=excluded.source_url`
      ).run(book.id, book.title, book.category, book.edition, book.sourceUrl);
    }

    // Upsert units
    for (const unit of catalog.units) {
      db.prepare(
        `INSERT INTO vocabulary_units (id, book_id, title, position)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           book_id=excluded.book_id,
           title=excluded.title,
           position=excluded.position`
      ).run(unit.id, unit.bookId, unit.title, unit.position);
    }

    const resolveWord = wordResolver(db);
    // Resolve stable identities and preserve learner evidence.
    for (const entry of catalog.entries) {
      const wordId = resolveWord(entry);
      // A narrower textbook entry supersedes this membership, not this word's identity or history.
      for(const retired of entry.retiredMemberships??[]){
        if(!catalog.entries.some(e=>e.key===retired.replacementKey&&e.memberships.some(m=>m.bookId===retired.bookId&&m.unitId===retired.unitId)))throw new Error('Missing membership replacement: '+retired.replacementKey);
        db.prepare('DELETE FROM vocabulary_members WHERE word_id=? AND book_id=? AND unit_id=?').run(wordId,retired.bookId,retired.unitId);
      }
      // A published editorial correction is conditional: never replace core or learner-edited content.
      if(entry.headwordCorrection){
        const isBalanceCorrection=entry.key==='keep balance' && entry.headword==='keep a balance' && entry.headwordCorrection.expected==='keep balance';
        const isNaadamCorrection=entry.key==='the Naadam festival' && entry.headword==='the Naadam Festival' && entry.headwordCorrection.expected==='the Naadam festival';
        const changed=db.prepare("UPDATE words SET headword=? WHERE id=? AND source='vocabulary' AND meaning_source IN ('词库导入','词库校订') AND meaning_flag IS NULL AND headword=? AND NOT EXISTS (SELECT 1 FROM words other WHERE (other.source='vocabulary' OR ?=1) AND other.headword=? AND other.id<>?)")
          .run(entry.headword,wordId,entry.headwordCorrection.expected,Number(isBalanceCorrection||isNaadamCorrection),entry.headword,wordId);
        // Preserve the answer shown to a learner before this specific correction.
        // Open spelling/dictation issues normally carry an empty options array.
        if(changed.changes && isBalanceCorrection)
          db.prepare("UPDATE learning_issues SET options_json=? WHERE word_id=? AND answered_at IS NULL AND mode IN ('spell','dictation') AND options_json='[]'")
            .run(JSON.stringify([{legacyHeadword:'keep balance'}]),wordId);
      }
      if(entry.meaningCorrection){
        const updated=db.prepare("UPDATE words SET meaning_zh=?,meaning_source='词库校订' WHERE id=? AND source='vocabulary' AND meaning_source IN ('词库导入','词库校订') AND meaning_flag IS NULL AND meaning_zh=? AND (?=0 OR headword=?)")
          .run(entry.meaning,wordId,entry.meaningCorrection.expected,entry.headwordCorrection?1:0,entry.headword);
        // Recognition questions snapshot only the first line at issue time. Repair an
        // unanswered snapshot only when the import changed this value or a prior
        // catalog correction already installed exactly this value. The latter repairs
        // snapshots left behind by an earlier upgrade while preserving user edits.
        const oldOption=entry.meaningCorrection.expected.split('\n')[0],newOption=entry.meaning.split('\n')[0];
        const alreadyCorrected=updated.changes?true:!!db.prepare("SELECT 1 FROM words WHERE id=? AND headword=? AND source='vocabulary' AND meaning_source='词库校订' AND meaning_flag IS NULL AND meaning_zh=?").get(wordId,entry.headword,entry.meaning);
        if(alreadyCorrected&&oldOption!==newOption)optionCorrections.set(wordId,{oldOption,newOption});
      }
      if(entry.phoneticCorrection)db.prepare("UPDATE words SET phonetic=? WHERE id=? AND source='vocabulary' AND meaning_source IN ('词库导入','词库校订') AND meaning_flag IS NULL AND phonetic=?")
        .run(entry.phonetic,wordId,entry.phoneticCorrection.expected);

      // Insert/update vocabulary_entry_map (authoritative mapping)
      db.prepare(
        `INSERT INTO vocabulary_entry_map (entry_key, word_id)
         VALUES (?, ?)
         ON CONFLICT(entry_key) DO UPDATE SET word_id=excluded.word_id`
      ).run(entry.key, wordId);

      // Process each membership
      for (const membership of entry.memberships) {
        const unitId = membership.unitId ?? '';
        db.prepare(
          `INSERT INTO vocabulary_members (book_id, word_id, unit_id, position)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(book_id, unit_id, word_id) DO UPDATE SET
             position=excluded.position`
        ).run(membership.bookId, wordId, unitId, membership.position);
      }
    }

    // Reissue rather than mutate an already displayed card: an old page may
    // submit even an otherwise-valid choice after its meaning has changed.
    if(optionCorrections.size){
      const pending=db.prepare("SELECT * FROM learning_issues WHERE mode='recognize' AND answered_at IS NULL AND answer_id IS NULL").all() as {id:string;day:string;word_id:number;mode:string;options_json:string;issued_at:string;assisted:number}[];
      for(const issue of pending){
        let raw:unknown;try{raw=JSON.parse(issue.options_json);}catch{continue;}
        if(!Array.isArray(raw)||raw.some(option=>!option||typeof option!=='object'||typeof option.id!=='number'||typeof option.text!=='string'))continue;
        const options=raw.map(option=>{
          if(!option||typeof option!=='object')return {option,changed:false};
          const correction=optionCorrections.get(option.id);
          return correction&&option.text===correction.oldOption?{option:{...option,text:correction.newOption},changed:true}:{option,changed:false};
        });
        if(!options.some(x=>x.changed))continue;
        const correct=options.filter(x=>x.option?.id===issue.word_id);
        if(correct.length!==1||typeof correct[0].option.text!=='string')continue;
        // Prefer the correct answer and then untouched distractors; only remove
        // overlaps involving a changed option, retaining the original display order.
        const kept=[correct[0]];
        const distractors=options.filter(x=>x!==correct[0]&&x.option?.id!==0).sort((a,b)=>Number(a.changed)-Number(b.changed));
        for(const item of distractors){
          if(typeof item.option?.text!=='string'||kept.some(k=>(item.changed||k.changed)&&meaningsOverlap(item.option.text,k.option.text)))continue;
          kept.push(item);
        }
        const choices=options.filter(x=>x.option?.id===0||kept.includes(x)).map(x=>x.option);
        const closed=db.prepare("UPDATE learning_issues SET answered_at=?,result_json=? WHERE id=? AND answered_at IS NULL AND answer_id IS NULL").run(new Date().toISOString(),CATALOG_ISSUE_REPLACED,issue.id);
        if(closed.changes)db.prepare("INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at,assisted) VALUES (?,?,?,?,?,?,?)").run(randomUUID(),issue.day,issue.word_id,issue.mode,JSON.stringify(choices),issue.issued_at,issue.assisted);
      }
    }

    // Update catalog version metadata
    db.prepare(
      `INSERT INTO vocabulary_meta (key, value)
       VALUES ('catalog_version', ?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value`
    ).run(String(catalog.version));
  });

  tx();
}

/**
 * Lists all vocabulary books with their word counts and units.
 * Returns data sorted by rowid insertion order (for units, by position).
 */
export function listVocabularyBooks(db: DB): Array<{
  id: string;
  title: string;
  category: string;
  edition: string;
  sourceUrl: string;
  wordCount: number;
  units: Array<{
    id: string;
    title: string;
    wordCount: number;
    position: number;
  }>;
}> {
  const books = db
    .prepare(
      `SELECT id, title, category, edition, source_url AS sourceUrl
       FROM vocabulary_books
       ORDER BY ROWID`
    )
    .all() as Array<{
    id: string;
    title: string;
    category: string;
    edition: string;
    sourceUrl: string;
  }>;

  return books.map((book) => {
    const wordCount = (db.prepare(
      `SELECT COUNT(DISTINCT word_id) AS wordCount
       FROM vocabulary_members
       WHERE book_id = ?`
    ).get(book.id) as { wordCount: number }).wordCount;

    const units = db
      .prepare(
        `SELECT id, title, position,
                (SELECT COUNT(DISTINCT word_id) FROM vocabulary_members WHERE unit_id = vocabulary_units.id AND book_id = vocabulary_units.book_id) AS wordCount
         FROM vocabulary_units
         WHERE book_id = ?
         ORDER BY position`
      )
      .all(book.id) as Array<{
      id: string;
      title: string;
      position: number;
      wordCount: number;
    }>;

    return {
      id: book.id,
      title: book.title,
      category: book.category,
      edition: book.edition,
      sourceUrl: book.sourceUrl,
      wordCount,
      units: units.map((u) => ({
        id: u.id,
        title: u.title,
        wordCount: u.wordCount,
        position: u.position,
      })),
    };
  });
}

/**
 * Validates catalog structure and content.
 * Throws on invalid data.
 */
function validateCatalog(catalog: Catalog): void {
  if (!Number.isSafeInteger(catalog.version)||catalog.version<1||catalog.version>999) {
    throw new Error('Catalog must have a numeric version');
  }

  if (!Array.isArray(catalog.books) || catalog.books.length === 0) {
    throw new Error('Catalog must have at least one book');
  }

  if (!Array.isArray(catalog.units)) {
    throw new Error('Catalog units must be an array');
  }

  if (!Array.isArray(catalog.entries) || catalog.entries.length === 0) {
    throw new Error('Catalog must have at least one entry');
  }

  for(const [label,items,key] of [['book',catalog.books,'id'],['unit',catalog.units,'id'],['entry',catalog.entries,'key']] as const){
    const seen=new Set<string>();for(const item of items){const id=(item as unknown as Record<string,unknown>)[key];if(typeof id!=='string'||!id.trim()||seen.has(id))throw Error('Invalid or duplicate '+label+' identifier');seen.add(id);}
  }
  for(const unit of catalog.units){if(typeof unit.bookId!=='string'||typeof unit.title!=='string'||!unit.title.trim()||!Number.isSafeInteger(unit.position)||unit.position<0)throw Error('Invalid unit');}
  // Validate books
  for (const book of catalog.books) {
    if (!book.id || typeof book.id !== 'string') {
      throw new Error(`Book must have a non-empty id: ${JSON.stringify(book)}`);
    }
    if (!book.title || typeof book.title !== 'string') {
      throw new Error(`Book ${book.id} must have a non-empty title`);
    }
    if (!book.category || typeof book.category !== 'string') {
      throw new Error(`Book ${book.id} must have a non-empty category`);
    }
    if (!book.edition || typeof book.edition !== 'string') {
      throw new Error(`Book ${book.id} must have a non-empty edition`);
    }
    if (!book.sourceUrl || typeof book.sourceUrl !== 'string') {
      throw new Error(`Book ${book.id} must have a non-empty sourceUrl`);
    }
  }

  // Validate entries
  for (const entry of catalog.entries) {
    if (!entry.key || typeof entry.key !== 'string') {
      throw new Error(`Entry must have a non-empty key: ${JSON.stringify(entry)}`);
    }
    if (!entry.headword || typeof entry.headword !== 'string') {
      throw new Error(`Entry ${entry.key} must have a non-empty headword`);
    }
    if (!entry.meaning || typeof entry.meaning !== 'string') {
      throw new Error(`Entry ${entry.key} must have a non-empty meaning`);
    }
    if (!Array.isArray(entry.memberships) || (entry.memberships.length === 0 && !entry.retiredMemberships?.length)) {
      throw new Error(`Entry ${entry.key} must have at least one membership`);
    }
    if(entry.retiredMemberships!==undefined&&(!Array.isArray(entry.retiredMemberships)||entry.retiredMemberships.some(r=>!r||typeof r.bookId!=='string'||typeof r.unitId!=='string'||typeof r.replacementKey!=='string'||!r.bookId||!r.unitId||!r.replacementKey)))throw new Error('Invalid retired membership');
    if(entry.headwordCorrection&&(typeof entry.headwordCorrection.expected!=='string'||!entry.headwordCorrection.expected.trim()||entry.headwordCorrection.expected.length>500||entry.headword.length>500))throw Error('Invalid headword correction');
    if(entry.meaningCorrection&&(!entry.meaningCorrection.expected||typeof entry.meaningCorrection.expected!=='string'||entry.meaningCorrection.expected.length>16000))throw Error('Invalid meaning correction');
    if(entry.phoneticCorrection&&(typeof entry.phoneticCorrection.expected!=='string'||!entry.phoneticCorrection.expected.trim()||entry.phoneticCorrection.expected.length>500||typeof entry.phonetic!=='string'||!entry.phonetic.trim()||entry.phonetic.length>500))throw Error('Invalid phonetic correction');
    for (const membership of entry.memberships) {
      if (!membership.bookId || typeof membership.bookId !== 'string') {
        throw new Error(
          `Entry ${entry.key} membership must have a non-empty bookId`
        );
      }
      if (
        membership.unitId !== null &&
        (typeof membership.unitId !== 'string' || membership.unitId === '')
      ) {
        throw new Error(
          `Entry ${entry.key} membership unitId must be null or non-empty string`
        );
      }
      if (!Number.isSafeInteger(membership.position) || membership.position < 0) {
        throw new Error(
          `Entry ${entry.key} membership position must be a non-negative number`
        );
      }
    }
  }
}

/**
 * Gets existing word ID or creates a new word.
 * Preserves existing word content (meaning, phonetic, etc.).
 * Matches by headword (case-sensitive) or mainHeadwords variants.
 * Ambiguous matches fail.
 */
function wordResolver(db:DB){
 const exact=new Map<string,Set<number>>(),aliases=new Map<string,Set<number>>();
 const add=(map:Map<string,Set<number>>,key:string,id:number)=>{let ids=map.get(key);if(!ids)map.set(key,ids=new Set());ids.add(id);};
 for(const word of db.prepare('SELECT id,headword FROM words').all() as {id:number;headword:string}[]){add(exact,word.headword,word.id);for(const key of mainHeadwords(word.headword))add(aliases,key,word.id);}
 const mapped=new Map((db.prepare('SELECT entry_key,word_id FROM vocabulary_entry_map').all() as {entry_key:string;word_id:number}[]).map(r=>[r.entry_key,r.word_id]));
 const insert=db.prepare("INSERT INTO words(headword,meaning_zh,phonetic,pos,source,meaning_source) VALUES (?,?,?,?,'vocabulary','词库导入')");
 return (entry:Entry):number=>{
  if(mapped.has(entry.key))return mapped.get(entry.key)!;
  if(entry.headwordCorrection){
   const candidates=db.prepare("SELECT id,source FROM words WHERE headword=?").all(entry.headwordCorrection.expected) as {id:number;source:string}[];
   if(candidates.length){
    const belongs=db.prepare("SELECT 1 FROM vocabulary_members WHERE word_id=? AND book_id=? AND unit_id=? AND position=?");
    const old=candidates.filter(w=>w.source==='vocabulary' && entry.memberships.some(m=>!!belongs.get(w.id,m.bookId,m.unitId??'',m.position)));
    if(candidates.length!==1||old.length!==1)throw Error('Cannot safely resolve previous headword: '+entry.headwordCorrection.expected);
    return old[0].id;
   }
  }
  const matches=exact.get(entry.headword)??aliases.get(entry.headword);
  if(matches?.size){if(matches.size!==1)throw Error('Ambiguous headword: '+entry.headword);return [...matches][0];}
  const id=Number(insert.run(entry.headword,entry.meaning,entry.phonetic??null,entry.pos??null).lastInsertRowid);
  add(exact,entry.headword,id);for(const key of mainHeadwords(entry.headword))add(aliases,key,id);mapped.set(entry.key,id);return id;
 };
}
