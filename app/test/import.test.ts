import { describe, it, expect } from 'vitest';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { openDb } from '../server/src/db.ts';
import { filterSenses, REVIEW_FLAG, cleanTranslation, compareExpected, loadDict, lookupKey, readList, upsertWords } from '../server/src/import.ts';
import { parseCsvLine } from '../server/src/csv.ts';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vocab-'));
const dictFile = path.join(tmp, 'ecdict.csv');
fs.writeFileSync(dictFile, [
  'word,phonetic,definition,translation,pos,collins,oxford,tag,bnc,frq,exchange,detail,audio',
  'a,ei,,"art. 一个\\n[网络] 一",,,,,1,1,,,',
  'apple,\'æpl,,"n. 苹果\\n[网络] 苹果公司",,,,,100,90,,,',
  't-shirt,,,"n. T恤衫",,,,,0,0,,,',
  'multi,x,"line ""quoted""',
  'continues",多行,,,,,0,0,,,',
].join('\n'));
const listFile = path.join(tmp, 'list.csv');
fs.writeFileSync(listFile, '# comment\nheadword,level\n"a (an)",二级\napple,三级\nApple,三级\nT-shirt,三级\nzzzunknown,三级\n');

describe('import', () => {
  it('parses csv & keys', () => {
    expect(parseCsvLine('a,"b,c","d ""e"""')).toEqual(['a', 'b,c', 'd "e"']);
    expect(lookupKey('a (an)')).toBe('a');
    expect(lookupKey('be (am, is, are)')).toBe('be');
    expect(cleanTranslation('n. 苹果\\n[网络] 苹果公司')).toBe('n. 苹果');
  });

  it('filters ECDICT senses by tag list', () => {
    expect(filterSenses('第一个字母 A; 一个\\r\\nart. [计] 累加器').senses).toEqual(['第一个字母 A; 一个']);
    expect(filterSenses('n. 苹果\\n[网络] 苹果公司\\n[植] 苹果树').senses).toEqual(['n. 苹果', '[植] 苹果树']);
    expect(filterSenses('[医] 某病\\n[化] 某物')).toEqual({ senses: ['[医] 某病'], flag: REVIEW_FLAG });
    expect(filterSenses('')).toEqual({ senses: [], flag: null });
  });

  it('is idempotent and fills ECDICT fields', async () => {
    const list = readList(listFile);
    expect(list.map((e) => e.headword)).toEqual(['a (an)', 'apple', 'T-shirt', 'zzzunknown']); // 去重
    const dict = await loadDict(dictFile, new Set(list.map((e) => lookupKey(e.headword))));
    expect(dict.size).toBe(3);
    const db = openDb(':memory:');
    const r1 = upsertWords(db, list, dict, 'kb2022', false);
    const r2 = upsertWords(db, list, dict, 'kb2022', false);
    expect(r1.totalInDb).toBe(4); expect(r2.totalInDb).toBe(4);
    expect(r2.missingPhonetic).toBe(2); // T-shirt 无音标 + 未知词
    expect(r2.missingMeaning).toBe(1);
    const apple = db.prepare("SELECT * FROM words WHERE headword='apple'").get() as any;
    expect(apple).toMatchObject({ phonetic: "/'æpl/", meaning_zh: 'n. 苹果', meaning_raw: 'n. 苹果\\n[网络] 苹果公司', meaning_flag: null, level: '三级' });
    expect(compareExpected(4, r2.byLevel as any).length).toBe(3);
  });

  it('keeps review progress on re-import', async () => {
    const db = openDb(':memory:');
    const list = readList(listFile); const dict = await loadDict(dictFile, new Set(['a', 'apple']));
    upsertWords(db, list, dict, 'kb2022', false);
    const id = (db.prepare("SELECT id FROM words WHERE headword='apple'").get() as any).id;
    db.prepare("INSERT INTO cards(word_id,mode,due,stability,difficulty,elapsed_days,scheduled_days,reps,lapses,state) VALUES (?,'recognize','2026-01-01',1,1,0,0,3,0,2)").run(id);
    upsertWords(db, list, dict, 'kb2022', false);
    expect((db.prepare("SELECT id FROM words WHERE headword='apple'").get() as any).id).toBe(id);
    expect(db.prepare('SELECT reps FROM cards').get()).toEqual({ reps: 3 });
  });
});
