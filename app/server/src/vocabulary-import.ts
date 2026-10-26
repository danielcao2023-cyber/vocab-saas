import type { DB } from './db.ts';
import { mainHeadwords } from './text.ts';

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
  phonetic?: string;
  pos?: string;
  memberships: Membership[];
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
 * Preserves existing word meanings and phonetics.
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
    // Process entries without changing existing word content or evidence.
    for (const entry of catalog.entries) {
      const wordId = resolveWord(entry);

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
    if (!Array.isArray(entry.memberships) || entry.memberships.length === 0) {
      throw new Error(`Entry ${entry.key} must have at least one membership`);
    }
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
  const matches=exact.get(entry.headword)??aliases.get(entry.headword);
  if(matches?.size){if(matches.size!==1)throw Error('Ambiguous headword: '+entry.headword);return [...matches][0];}
  const id=Number(insert.run(entry.headword,entry.meaning,entry.phonetic??null,entry.pos??null).lastInsertRowid);
  add(exact,entry.headword,id);for(const key of mainHeadwords(entry.headword))add(aliases,key,id);mapped.set(entry.key,id);return id;
 };
}
