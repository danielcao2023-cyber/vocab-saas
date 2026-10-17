"""只读核查：课标词表 OCR 结果 vs 自洽性 vs ECDICT。输出写到本目录。"""
import csv, collections, re, json, os, sys
csv.field_size_limit(10**9)
BASE = '/workspace/vocab-saas'
OUT = f'{BASE}/qa/curriculum-check'
ECDICT = f'{BASE}/app/data/raw/ecdict.csv'   # app 导入脚本默认路径（import.ts --ecdict 默认值）
DROP = ['医','化','计','网络','经','法','电','机','建','人名','地名','药','矿','生化','地质','解','症','美国','英国','德国','法国']

def load(f): return list(csv.DictReader(open(f, encoding='utf-8'), delimiter='\t'))
l3 = load(f'{BASE}/data/curriculum/ocr/level3_list.tsv')
l2 = load(f'{BASE}/data/curriculum/ocr/level2_list.tsv')
R = {}  # 结果汇总

# ---------- 1. 计数与自洽 ----------
R['l3_total'] = len(l3); R['l3_star'] = sum(r['level2_star'] == '1' for r in l3); R['l3_unstar'] = R['l3_total'] - R['l3_star']
R['l2_total'] = len(l2)
star = [r['entry'] for r in l3 if r['level2_star'] == '1']; l2e = [r['entry'] for r in l2]
R['star_minus_l2'] = sorted(set(star) - set(l2e)); R['l2_minus_star'] = sorted(set(l2e) - set(star))
def norm_cmp(e): return re.sub(r'\s+', ' ', e.replace('’', "'")).strip()
R['star_minus_l2_norm'] = sorted({norm_cmp(x) for x in star} - {norm_cmp(x) for x in l2e})
R['l2_minus_star_norm'] = sorted({norm_cmp(x) for x in l2e} - {norm_cmp(x) for x in star})
for name, rows in (('l3', l3), ('l2', l2)):
    c = collections.Counter(r['entry'] for r in rows)
    R[f'{name}_dups'] = [k for k, v in c.items() if v > 1]
    R[f'{name}_dups_ci'] = [k for k, v in collections.Counter(norm_cmp(r['entry']).lower() for r in rows).items() if v > 1]
    R[f'{name}_empty'] = sum(1 for r in rows if not r['entry'].strip())
    R[f'{name}_ws'] = [r['entry'] for r in rows if r['entry'] != r['entry'].strip() or '  ' in r['entry'] or '\t' in r['entry']]
    R[f'{name}_flagged'] = [r for r in rows if r['flag'] not in ('0', '')]
    R[f'{name}_notes'] = [(r['page'], r['entry'], r['note']) for r in rows if r['note']]
E = [r['entry'] for r in l3]
R['odd_chars'] = [e for e in E if re.search(r"[^A-Za-z ()/.,'=\-]", e)]
R['caps'] = [e for e in E if re.search(r'[A-Z]', e)]
R['paren'] = [e for e in E if '(' in e]
R['slash'] = [e for e in E if '/' in e]
R['multiword'] = [e for e in E if ' ' in re.sub(r'\s*\(.*?\)', '', e).replace(' / ', '/').strip()]
R['abbrev'] = [e for e in E if '=' in e or re.fullmatch(r'[A-Z]{2,}.*', e) or re.search(r'\b(Mr|Mrs|Ms|Dr)\b', e)]

def sortkey(e): return re.sub(r'[^a-z]', '', re.sub(r'\(.*?\)', '', e.replace('’', "'")).lower())
breaks = []
for name, rows in (('level3', l3), ('level2', l2)):
    for i in range(1, len(rows)):
        a, b = rows[i-1], rows[i]
        if sortkey(b['entry']) < sortkey(a['entry']):
            breaks.append((name, a['page'], b['page'], a['entry'], b['entry']))
    pages = [int(r['page']) for r in rows]
    R[f'{name}_pages'] = (min(pages), max(pages), dict(collections.Counter(pages)))
R['order_breaks'] = breaks

# ---------- 2. 词头规范化 ----------
def normalize(entry):
    e = entry.replace('’', "'").strip()
    paren = re.findall(r'\((.*?)\)', e)
    main = re.sub(r'\s*\(.*?\)', '', e).strip()
    heads = [h.strip() for h in main.split('/') if h.strip()]
    variants, kind = [], []
    for p in paren:
        p = p.strip()
        if p.startswith('='):
            kind.append('full_form'); variants += [x.strip() for x in re.split(r',', p[1:]) if x.strip() and not x.strip().startswith('AmE')]
            m = re.search(r'Am\s?E\s+(.+)', p);  m and variants.append(m.group(1).strip())
        elif re.match(r'Am\s?E\b', p):
            kind.append('AmE'); variants.append(re.sub(r'^Am\s?E\s+', '', p).strip())
        elif p.startswith('pl.'):
            kind.append('plural'); variants += [x.strip() for x in p[3:].split('/')]
        elif main == 'according' and p == 'to':
            kind.append('phrase'); variants.append('according to')
        else:
            kind.append('alt_form')
            for x in re.split(r',|\bAmE\b', p): x.strip() and variants.append(x.strip())
    return heads, variants, kind

dict_rows = {}; lower = collections.defaultdict(list); lemma_of = {}
with open(ECDICT, encoding='utf-8', newline='') as f:
    rd = csv.reader(f); hdr = next(rd)
    for row in rd:
        w = row[0]; dict_rows[w] = row; lower[w.lower()].append(w)
def filtered(t):
    lines = [l.strip() for l in t.replace('\\r', '').split('\\n') if l.strip()]
    kept = [l for l in lines if not any(m in DROP for m in re.findall(r'\[([^\]]+)\]', l))]
    return kept, lines
def lemma(w):
    row = dict_rows.get(w) or (dict_rows.get(lower[w.lower()][0]) if lower.get(w.lower()) else None)
    if not row: return None
    for part in (row[10] or '').split('/'):
        if part.startswith('0:'): return part[2:]
    return None
def lookup(h):
    if h in dict_rows: return h, 'exact'
    if h.lower() in lower:
        c = lower[h.lower()]; return (h.lower() if h.lower() in c else c[0]), 'case_insensitive'
    for alt in (h.replace(' ', '-'), h.replace('-', ' '), h.replace('.', ''), h + '.'):
        if alt in dict_rows: return alt, 'variant_spelling'
    lm = lemma(h)
    if lm and lm in dict_rows: return lm, 'lemma'
    return None, 'not_found'

norm_rows, not_found, suspicious = [], [], []
gt2 = 0
for r in l3:
    heads, variants, kind = normalize(r['entry'])
    level = '二级' if r['level2_star'] == '1' else '三级'
    for i, h in enumerate(heads):
        hit, how = lookup(h)
        trans = dict_rows[hit][3] if hit else ''
        kept, lines = filtered(trans)
        vhits = {v: lookup(v)[1] for v in variants}
        norm_rows.append({'page': r['page'], 'entry': r['entry'], 'level': level, 'headword': h, 'is_primary': int(i == 0),
                          'variants': ' | '.join(variants), 'paren_kind': ','.join(kind), 'ecdict_word': hit or '', 'match': how,
                          'phonetic': dict_rows[hit][1] if hit else '', 'senses_raw': len(lines), 'senses_filtered': len(kept),
                          'variant_matches': ' | '.join(f'{k}:{v}' for k, v in vhits.items())})
        if not hit:
            not_found.append({'page': r['page'], 'entry': r['entry'], 'headword': h, 'level': level}); continue
        if len(kept) > 2: gt2 += 1
        reasons = []
        if not trans.strip(): reasons.append('ECDICT 释义为空')
        elif not kept: reasons.append('释义全被过滤（会标“释义待人工看”）')
        if not dict_rows[hit][1]: reasons.append('无音标')
        if hit[0].isupper() and not h[0].isupper(): reasons.append(f'只匹配到大写词条 {hit}（可能是专名）')
        if how == 'lemma': reasons.append(f'按词形还原匹配到 {hit}')
        if how in ('case_insensitive', 'variant_spelling') and hit.lower() != h.lower(): reasons.append(f'匹配到变体 {hit}')
        if how == 'case_insensitive' and not (hit[0].isupper() and not h[0].isupper()): reasons.append(f'大小写不同的词条 {hit}，释义可能不对应')
        exact_v = [v for v, m in vhits.items() if m == 'exact']
        if how == 'case_insensitive' and exact_v: reasons.append('建议改用括号变体：' + ', '.join(exact_v))
        if kept and all(re.match(r'^(n\.)?\s*\[?(人名|地名)', l) for l in kept): reasons.append('释义只有人名/地名')
        bad_v = [k for k, v in vhits.items() if v == 'not_found']
        if bad_v: reasons.append('括号变体查不到：' + ', '.join(bad_v))
        if reasons:
            suspicious.append({'page': r['page'], 'entry': r['entry'], 'headword': h, 'ecdict_word': hit, 'match': how, 'reasons': '；'.join(reasons),
                               'filtered_first': kept[0] if kept else (lines[0] if lines else '')})

R['heads_total'] = len(norm_rows); R['primary_total'] = sum(x['is_primary'] for x in norm_rows)
R['match_counts'] = dict(collections.Counter(x['match'] for x in norm_rows))
R['primary_match_counts'] = dict(collections.Counter(x['match'] for x in norm_rows if x['is_primary']))
R['not_found'] = not_found; R['suspicious_n'] = len(suspicious); R['gt2'] = gt2
R['no_phonetic'] = sum(1 for x in norm_rows if x['ecdict_word'] and not x['phonetic'])
R['filtered_empty'] = sum(1 for x in norm_rows if x['ecdict_word'] and x['senses_filtered'] == 0)

def wcsv(name, rows, fields, delim=','):
    with open(f'{OUT}/{name}', 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields, delimiter=delim); w.writeheader(); w.writerows(rows)
wcsv('not_found.csv', not_found, ['page', 'entry', 'headword', 'level'])
wcsv('suspicious.csv', suspicious, ['page', 'entry', 'headword', 'ecdict_word', 'match', 'reasons', 'filtered_first'])
wcsv('normalized.tsv', norm_rows, list(norm_rows[0].keys()), '\t')
json.dump(R, open(f'{OUT}/summary.json', 'w'), ensure_ascii=False, indent=1, default=str)
print(json.dumps({k: v for k, v in R.items() if k not in ('caps', 'paren', 'multiword', 'abbrev', 'l3_pages', 'level2_pages', 'level3_pages')}, ensure_ascii=False, default=str)[:6000])
