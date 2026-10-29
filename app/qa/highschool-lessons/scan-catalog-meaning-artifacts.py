"""Read-only candidate scanner: python3 qa/highschool-lessons/scan-catalog-meaning-artifacts.py"""
import json
import re
from pathlib import Path

catalog = json.loads(Path('data/vocabulary/catalog.json').read_text())
entries = [e for e in catalog['entries'] if any(m['bookId'].startswith('pep2019-') for m in e['memberships'])]
findings = []
for entry in entries:
    meaning = entry['meaning']
    categories = []
    if '\ufffd' in meaning or '锟斤拷' in meaning or '[object Object]' in meaning:
        categories.append('replacement-or-object')
    if any(meaning.count(a) != meaning.count(b) for a, b in [('(', ')'), ('（', '）'), ('[', ']'), ('【', '】')]):
        categories.append('bracket-imbalance')
    if re.search(r'(?:\.{3,}|…+)\s*$', meaning):
        categories.append('terminal-ellipsis')
    if re.search(r'\((?:also|abbrev|esp|usu)\b', meaning, re.I):
        categories.append('dictionary-artifact')
    if categories:
        findings.append({'key': entry['key'], 'meaning': meaning, 'categories': categories})
print(json.dumps({'catalogVersion': catalog['version'], 'highschoolKeys': len(entries), 'candidates': findings}, ensure_ascii=False, indent=2))
