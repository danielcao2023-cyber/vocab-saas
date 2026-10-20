import { expect, it } from 'vitest';
import { selectCambridgeEntryHtml } from '../scripts/lesson-source-verify.ts';

const entry = (word: string, marker = word) => `<div class="pr entry-body__el"><div class="pos-header"><span class="hw dhw">${word}</span></div><div class="definition"><div class="def ddef_d">${marker}</div></div></div>`;

it('keeps all matching parts of speech and excludes suffixes, prefixes, other words and page footer', () => {
  const page = entry('after', 'preposition') + entry('after-', 'prefix') + entry('after', 'adverb') + entry('afterward') + '<div class="def ddef_d">footer</div>';
  const selected = selectCambridgeEntryHtml(page, 'after');
  expect(selected).toContain('preposition'); expect(selected).toContain('adverb');
  expect(selected).not.toMatch(/prefix|afterward|footer/);
  expect(selectCambridgeEntryHtml(entry('ability') + entry('-ability'), 'ability')).not.toContain('-ability');
});

it.each([['No', 'no'], ['Polish', 'polish'], ['US', 'us'], ['Mr.', 'Mr']])('rejects a case or punctuation redirect from %s to %s', (expected, actual) => {
  expect(() => selectCambridgeEntryHtml(entry(actual), expected)).toThrow(/no exact Cambridge entry/);
});

it('selects exact case from a page containing both meanings', () => {
  expect(selectCambridgeEntryHtml(entry('Polish', 'language') + entry('polish', 'shine'), 'polish')).not.toContain('language');
});

it('accepts only main headwords and explicit AmE variants, not plural or explanatory parentheses', () => {
  expect(selectCambridgeEntryHtml(entry('color'), 'colour (AmE color)')).toContain('color');
  expect(selectCambridgeEntryHtml(entry('Mr.'), 'Mr (AmE Mr.)')).toContain('Mr.');
  expect(selectCambridgeEntryHtml(entry('math'), 'maths (=mathematics, AmE math)')).toContain('math');
  expect(selectCambridgeEntryHtml(entry('an'), 'a / an')).toContain('an');
  expect(() => selectCambridgeEntryHtml(entry('children'), 'child (pl. children)')).toThrow();
  expect(() => selectCambridgeEntryHtml(entry('mathematics'), 'maths (=mathematics, AmE math)')).toThrow();
});

it('decodes headword entities and formatting without losing case or punctuation', () => {
  const html = `<div data-note="a > b" class='entry-body__el pr'><span class='dhw hw'><b>o</b>&#x2019;clock</span><div>time</div></div>`;
  expect(selectCambridgeEntryHtml(html, "o'clock")).toContain('time');
  expect(selectCambridgeEntryHtml(entry('per&nbsp;cent'), 'per cent (AmE percent)')).toContain('per&nbsp;cent');
});

it('never takes a matching related word after the entry first headword as identity evidence', () => {
  const html = entry('pear', '<span class="hw dhw">apple</span>');
  expect(() => selectCambridgeEntryHtml(html, 'apple')).toThrow(/no exact Cambridge entry/);
});

it('rejects absent or malformed entry boundaries and ignores script/comment lookalikes', () => {
  expect(() => selectCambridgeEntryHtml('<span class="hw dhw">apple</span>', 'apple')).toThrow();
  expect(() => selectCambridgeEntryHtml('<div class="entry-body__el"><span class="hw dhw">apple</span>', 'apple')).toThrow(/unclosed/);
  expect(() => selectCambridgeEntryHtml('<div class="entry-body__el">apple</div>', 'apple')).toThrow(/no verifiable/);
  expect(() => selectCambridgeEntryHtml(`<script>${entry('apple')}</script><!-- ${entry('apple')} -->${entry('pear')}`, 'apple')).toThrow();
  expect(() => selectCambridgeEntryHtml(entry('apple').replace('entry-body__el', 'not-entry-body__el'), 'apple')).toThrow();
  expect(() => selectCambridgeEntryHtml(entry('apple').replace('class="pr entry-body__el"', 'data-class="entry-body__el"'), 'apple')).toThrow();
  expect(() => selectCambridgeEntryHtml(entry('apple').replace('class="pr entry-body__el"', `data-note=" class='entry-body__el' "`), 'apple')).toThrow();
});
