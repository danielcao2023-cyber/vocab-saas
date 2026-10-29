"""Read-only triage; run from app/ with cmudict==1.1.3 available:
  python qa/highschool-lessons/classify-phonics-candidates.py \
    qa/highschool-lessons/non-audio-stable-key-coverage-refresh-2026-10-29.json
CMU pronunciation guesses are advisory and do not prove identity or syllables.
"""
import collections
import json
import sys
import cmudict

coverage = json.load(open(sys.argv[1], encoding='utf8'))
pronunciations = cmudict.dict()
groups = collections.defaultdict(list)
for row in coverage['noSoundMapping']:
    if row['shape'] != 'single-letters':
        groups[row['shape']].append(row['headword'])
        continue
    variants = pronunciations.get(row['headword'].lower())
    if not variants:
        kind = 'not_in_cmudict'
    else:
        counts = {sum(phone[-1].isdigit() for phone in variant) for variant in variants}
        kind = 'all_single' if max(counts) == 1 else 'all_multi' if min(counts) > 1 else 'mixed'
    groups[kind].append(row['headword'])
print(json.dumps({'cmudict_version':'1.1.3', 'groups':dict(groups)}, ensure_ascii=False, indent=2))
