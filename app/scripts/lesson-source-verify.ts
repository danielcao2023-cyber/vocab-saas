import { mainHeadwords, normalizeQuotes } from '../server/src/text.ts';

const tagPattern = /<\/?([a-z][\w:-]*)\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi;
const normalized = (value: string) => normalizeQuotes(value).normalize('NFC').replace(/\s+/g, ' ').trim();

function classes(tag: string) {
  const attributes = tag.replace(/^<\/?[a-z][\w:-]*/i, '').replace(/\/?>$/, '');
  for (const value of attributes.matchAll(/\s+([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    if (value[1].toLowerCase() === 'class') return new Set((value[2] ?? value[3] ?? value[4] ?? '').split(/\s+/));
  }
  return new Set<string>();
}

/** Preserve case and punctuation; only an explicitly labelled AmE spelling is an alias. */
function acceptedHeadwords(headword: string) {
  const accepted = new Set(mainHeadwords(headword).map(normalized));
  for (const match of headword.matchAll(/\(([^()]*)\)|（([^（）]*)）/g)) {
    const note = match[1] ?? match[2];
    const american = /\bAm\s*E\b\s*(?:[:：=]\s*)?([^,，;；]+)/.exec(note)?.[1];
    if (!american) continue;
    for (const spelling of american.split('/').map(normalized)) {
      if (/^[A-Za-z][A-Za-z'. -]*$/.test(spelling)) accepted.add(spelling);
    }
  }
  accepted.delete('');
  return accepted;
}

function textContent(html: string) {
  const named: Record<string, string> = { amp: '&', apos: "'", quot: '"', nbsp: ' ', lsquo: "'", rsquo: "'", lt: '<', gt: '>', ndash: '–', mdash: '—' };
  return normalized(html.replace(/<[^>]*>/g, '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
    if (name.startsWith('#')) {
      const point = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1));
      if (!Number.isInteger(point) || point < 1 || point > 0x10ffff || (point >= 0xd800 && point <= 0xdfff)) throw new Error('invalid Cambridge headword entity');
      return String.fromCodePoint(point);
    }
    return named[name.toLowerCase()] ?? entity;
  }));
}

/** The first hw+dhw in a block identifies the entry, never a later example or related word. */
function firstHeadword(block: string) {
  const tags = [...block.matchAll(tagPattern)];
  for (let index = 0; index < tags.length; index++) {
    const opening = tags[index], names = classes(opening[0]);
    if (opening[0].startsWith('</') || !names.has('hw') || !names.has('dhw')) continue;
    const name = opening[1].toLowerCase(); let depth = 1;
    for (const next of tags.slice(index + 1)) {
      if (next[1].toLowerCase() !== name) continue;
      depth += next[0].startsWith('</') ? -1 : /\/>$/.test(next[0]) ? 0 : 1;
      if (depth === 0) {
        const word = textContent(block.slice(opening.index! + opening[0].length, next.index));
        if (!word) throw new Error('empty Cambridge entry headword');
        return word;
      }
    }
    throw new Error('unclosed Cambridge entry headword');
  }
  throw new Error('Cambridge entry has no verifiable hw dhw headword');
}

/**
 * Select exact Cambridge entries from already-fetched HTML; no network or fuzzy matching.
 * Balanced div boundaries exclude other entries and footer definitions from the inventory.
 */
export function selectCambridgeEntryHtml(html: string, headword: string): string {
  const accepted = acceptedHeadwords(headword);
  if (!accepted.size) throw new Error('missing expected Cambridge headword');
  const content = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|template|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  const selected: string[] = [];
  let start = -1, depth = 0;
  for (const tag of content.matchAll(tagPattern)) {
    if (tag[1].toLowerCase() !== 'div') continue;
    const closing = tag[0].startsWith('</'), entry = !closing && classes(tag[0]).has('entry-body__el');
    if (start < 0) {
      if (entry) { start = tag.index!; depth = 1; }
      continue;
    }
    if (entry) throw new Error('nested Cambridge entry boundaries');
    depth += closing ? -1 : /\/>$/.test(tag[0]) ? 0 : 1;
    if (depth !== 0) continue;
    const block = content.slice(start, tag.index! + tag[0].length);
    if (accepted.has(firstHeadword(block))) selected.push(block);
    start = -1;
  }
  if (start >= 0) throw new Error('unclosed Cambridge entry boundary');
  if (!selected.length) throw new Error(`no exact Cambridge entry for ${headword}`);
  return selected.join('\n');
}
