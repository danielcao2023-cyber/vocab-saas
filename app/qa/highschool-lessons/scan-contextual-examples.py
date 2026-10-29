#!/usr/bin/env python3
"""Run from app/: python3 qa/highschool-lessons/scan-contextual-examples.py.
Read-only heuristic; numerical lesson files only, not keyed fallback lessons.
"""
import collections, json, re, sqlite3
from pathlib import Path

catalog = json.loads(Path('data/vocabulary/catalog.json').read_text())
db = sqlite3.connect('file:mobile-public/offline/seed.db?mode=ro', uri=True)
notes = collections.Counter()
examples = collections.defaultdict(list)
stats = collections.Counter()
for entry in catalog['entries']:
    if not any(m['bookId'].startswith('pep2019-') for m in entry['memberships']):
        continue
    stats['high_school_catalog_entries'] += 1
    mapping = db.execute('select word_id from vocabulary_entry_map where entry_key=?', (entry['key'],)).fetchone()
    path = Path('data/lessons') / f'{mapping[0]}.json' if mapping else None
    if not path or not path.exists():
        stats['not_scanned_no_numeric_file'] += 1
        continue
    stats['numeric_file_entries'] += 1
    lesson = json.loads(path.read_text())
    for sense in lesson.get('senses', []):
        for item in sense.get('collocations', []):
            notes[item.get('note', '')] += 1
        for item in sense.get('examples', []):
            en = item.get('en', '')
            pattern = re.sub(re.escape(entry['headword']), '{word}', en, flags=re.I) if len(entry['headword']) > 3 else en
            examples[pattern].append({'key': entry['key'], 'id': mapping[0], 'text': en})
print(json.dumps({'scope': dict(stats), 'common_notes': notes.most_common(25), 'repeated_example_patterns': [{'pattern': p, 'items': xs} for p, xs in sorted(examples.items(), key=lambda row: -len(row[1])) if len(xs) >= 3]}, ensure_ascii=False, indent=2))
db.close()
