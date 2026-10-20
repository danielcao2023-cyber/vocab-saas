import initSqlJs, { type SqlJsConfig, type BindParams, type SqlValue } from 'sql.js';
import type { DB } from '../../../server/src/db.ts';

type Row = Record<string, SqlValue>;
export interface BrowserStatement {
  get(...parameters: unknown[]): Row | undefined;
  all(...parameters: unknown[]): Row[];
  run(...parameters: unknown[]): { changes: number; lastInsertRowid: number };
}
export interface BrowserDatabase {
  prepare(sql: string): BrowserStatement;
  exec(sql: string): BrowserDatabase;
  pragma(sql: string, options?: { simple?: boolean }): unknown;
  transaction<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R;
  close(): void;
  export(): Uint8Array;
}

/** Only the synchronous subset used by the shared application is implemented. */
export function asSharedDb(db: BrowserDatabase): DB { return db as unknown as DB; }

function value(input: unknown): SqlValue {
  if (input === undefined || input === null) return null;
  if (typeof input === 'string' || typeof input === 'number' || input instanceof Uint8Array) return input;
  throw new TypeError('SQLite parameters must be strings, numbers, blobs or null');
}
function bindings(parameters: unknown[]): BindParams {
  if (parameters.length === 1 && Array.isArray(parameters[0])) return parameters[0].map(value);
  if (parameters.length === 1 && parameters[0] !== null && typeof parameters[0] === 'object' && !(parameters[0] instanceof Uint8Array)) {
    const named: Record<string, SqlValue> = {};
    for (const [key, val] of Object.entries(parameters[0])) {
      if (/^[:@$]/.test(key)) named[key] = value(val);
      else for (const prefix of [':', '@', '$']) named[prefix + key] = value(val);
    }
    return named;
  }
  return parameters.map(value);
}

export async function openBrowserDatabase(bytes: Uint8Array, options: Pick<SqlJsConfig, 'locateFile'> = {}): Promise<BrowserDatabase> {
  if (bytes.byteLength < 100) throw new Error('SQLite database image is empty or truncated');
  const SQL = await initSqlJs(options);
  const raw = new SQL.Database(bytes);
  let closed = false, depth = 0, savepoint = 0;
  const checkOpen = () => { if (closed) throw new Error('SQLite database is closed'); };
  const execute = (sql: string, parameters: unknown[], first: boolean): Row[] => {
    checkOpen();
    const statement = raw.prepare(sql);
    try {
      statement.bind(bindings(parameters));
      const rows: Row[] = [];
      while (statement.step()) { rows.push(statement.getAsObject()); if (first) break; }
      return rows;
    } finally { statement.free(); }
  };
  const db: BrowserDatabase = {
    prepare(sql) {
      checkOpen();
      return {
        get: (...parameters) => execute(sql, parameters, true)[0],
        all: (...parameters) => execute(sql, parameters, false),
        run(...parameters) {
          execute(sql, parameters, false);
          const changes = raw.getRowsModified();
          const lastInsertRowid = Number(raw.exec('SELECT last_insert_rowid() AS id')[0]?.values[0]?.[0] ?? 0);
          return { changes, lastInsertRowid };
        },
      };
    },
    exec(sql) { checkOpen(); raw.exec(sql); return db; },
    pragma(sql, opts) {
      const rows = execute(`PRAGMA ${sql}`, [], false);
      return opts?.simple ? Object.values(rows[0] ?? {})[0] : rows;
    },
    transaction(fn) {
      return function (this: unknown, ...args) {
        checkOpen();
        const nested = depth > 0, point = `mobile_${++savepoint}`;
        raw.exec(nested ? `SAVEPOINT ${point}` : 'BEGIN'); depth++;
        try {
          const result = fn.apply(this, args);
          if (result && typeof (result as { then?: unknown }).then === 'function') throw new TypeError('SQLite transactions must be synchronous');
          raw.exec(nested ? `RELEASE SAVEPOINT ${point}` : 'COMMIT');
          return result;
        } catch (error) {
          raw.exec(nested ? `ROLLBACK TO SAVEPOINT ${point}; RELEASE SAVEPOINT ${point}` : 'ROLLBACK');
          throw error;
        } finally { depth--; }
      };
    },
    close() { if (!closed) { raw.close(); closed = true; } },
    export() {
      checkOpen();
      if (depth) throw new Error('Cannot export during a SQLite transaction');
      // sql.js serializes by closing and reopening SQLite, which resets connection pragmas.
      try { return raw.export(); } finally { raw.exec('PRAGMA foreign_keys=ON'); }
    },
  };
  try {
    raw.exec('PRAGMA foreign_keys=ON');
    if (db.pragma('integrity_check', { simple: true }) !== 'ok') throw new Error('SQLite integrity check failed');
    return db;
  } catch (error) { raw.close(); throw error; }
}
