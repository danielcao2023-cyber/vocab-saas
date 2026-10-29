#!/usr/bin/env python3
"""Read-only structural comparison; report is evidence, never an executable patch."""
import argparse
import hashlib
import json
import sys
from pathlib import Path


def load_catalog(path):
    raw = path.read_bytes()
    data = json.loads(raw)
    if not isinstance(data, dict) or not isinstance(data.get('entries'), list):
        raise ValueError(f'{path}: expected catalog object with entries')
    entries = {}
    for entry in data['entries']:
        if not isinstance(entry, dict) or not isinstance(entry.get('key'), str) or not entry['key']:
            raise ValueError(f'{path}: invalid entry key')
        if entry['key'] in entries:
            raise ValueError(f'{path}: duplicate entry key {entry["key"]!r}')
        entries[entry['key']] = entry
    return data, entries, hashlib.sha256(raw).hexdigest()


def delta(left, right):
    changes = {}
    for field in sorted(set(left) | set(right)):
        if field in left and field in right and left[field] == right[field]:
            continue
        value = {}
        if field in left:
            value['before'] = left[field]
        else:
            value['beforePresent'] = False
        if field in right:
            value['after'] = right[field]
        else:
            value['afterPresent'] = False
        changes[field] = value
    return changes


def compare(baseline, current):
    before, old, old_hash = load_catalog(baseline)
    after, new, new_hash = load_catalog(current)
    added = [{'key': key, 'entry': new[key]} for key in sorted(new.keys()-old.keys())]
    removed = [{'key': key, 'entry': old[key]} for key in sorted(old.keys()-new.keys())]
    changed = [{'key': key, 'fields': delta(old[key],new[key])} for key in sorted(old.keys()&new.keys()) if old[key] != new[key]]
    top_before = {k:v for k,v in before.items() if k != 'entries'}
    top_after = {k:v for k,v in after.items() if k != 'entries'}
    old_order = [e['key'] for e in before['entries']]
    new_order = [e['key'] for e in after['entries']]
    return {'baseline': {'sha256':old_hash,'entryCount':len(old)}, 'current': {'sha256':new_hash,'entryCount':len(new)},
            'topLevelFields':delta(top_before,top_after), 'entryOrderChanged':old_order != new_order,
            'entries': {'added':added,'removed':removed,'changed':changed},
            'note':'Read-only comparison; changes are not verified provenance or a replayable patch.'}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('baseline',type=Path)
    parser.add_argument('current',type=Path)
    args=parser.parse_args()
    try:
        result=compare(args.baseline,args.current)
        json.dump(result,sys.stdout,ensure_ascii=False,indent=2)
        sys.stdout.write('\n')
    except (OSError,ValueError,TypeError) as exc:
        print(str(exc),file=sys.stderr)
        return 1
    return 0

if __name__=='__main__':
    raise SystemExit(main())
