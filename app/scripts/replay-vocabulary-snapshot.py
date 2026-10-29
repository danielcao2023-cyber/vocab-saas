#!/usr/bin/env python3
"""Replay historical catalog differences; this does not certify their sources."""
import argparse
import hashlib
import json
import os
import sys
import tempfile
from pathlib import Path


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def encode(value):
    return (json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n').encode('utf-8')


def unpack(raw):
    obj = json.loads(raw)
    if not isinstance(obj, dict) or not isinstance(obj.get('entries'), list):
        raise ValueError('invalid catalog')
    entries = {}
    for item in obj['entries']:
        if not isinstance(item, dict) or not isinstance(item.get('key'), str) or not item['key']:
            raise ValueError('invalid stable key')
        if item['key'] in entries:
            raise ValueError('duplicate stable key')
        entries[item['key']] = item
    return obj, entries


def make_snapshot(before_raw, after_raw):
    before, old = unpack(before_raw)
    after, new = unpack(after_raw)
    if encode(before) != before_raw or encode(after) != after_raw:
        raise ValueError('catalog encoding is not canonical; cannot promise byte identity')
    changes = []
    for key in sorted(old.keys() | new.keys()):
        if old.get(key) == new.get(key):
            continue
        changes.append({'key': key, 'before': old.get(key), 'after': new.get(key)})
    return {'schema': 1, 'provenance': 'historical snapshot difference; not individual source verification',
            'baselineSha256': sha(before_raw), 'targetSha256': sha(after_raw),
            'beforeTop': {k: v for k, v in before.items() if k != 'entries'},
            'afterTop': {k: v for k, v in after.items() if k != 'entries'},
            'beforeOrder': list(old), 'afterOrder': list(new), 'changes': changes}


def apply_snapshot(before_raw, snapshot):
    if not isinstance(snapshot, dict) or snapshot.get('schema') != 1:
        raise ValueError('invalid snapshot schema')
    if sha(before_raw) != snapshot.get('baselineSha256'):
        raise ValueError('baseline hash mismatch')
    before, entries = unpack(before_raw)
    if {k: v for k, v in before.items() if k != 'entries'} != snapshot.get('beforeTop'):
        raise ValueError('baseline top-level conflict')
    if list(entries) != snapshot.get('beforeOrder'):
        raise ValueError('baseline ordering conflict')
    changes = snapshot.get('changes')
    if not isinstance(changes, list):
        raise ValueError('invalid changes')
    seen = set()
    for change in changes:
        if not isinstance(change, dict) or set(change) != {'key', 'before', 'after'}:
            raise ValueError('invalid change')
        key = change['key']
        if not isinstance(key, str) or not key or key in seen:
            raise ValueError('duplicate or invalid change key')
        seen.add(key)
        old, new = change['before'], change['after']
        if (old is None and key in entries) or (old is not None and (key not in entries or entries[key] != old)):
            raise ValueError('entry before-value conflict')
        if new is None:
            if old is None:
                raise ValueError('empty change')
            del entries[key]
        else:
            if not isinstance(new, dict) or new.get('key') != key:
                raise ValueError('entry after-value or stable-key conflict')
            entries[key] = new
    order = snapshot.get('afterOrder')
    if not isinstance(order, list) or any(not isinstance(x, str) for x in order) or len(order) != len(set(order)) or set(order) != set(entries):
        raise ValueError('missing, duplicate or unexpected output key')
    top = snapshot.get('afterTop')
    if not isinstance(top, dict) or 'entries' in top:
        raise ValueError('invalid target top-level fields')
    output = encode({**top, 'entries': [entries[key] for key in order]})
    if sha(output) != snapshot.get('targetSha256'):
        raise ValueError('target hash mismatch')
    return output


def write_new_temporary(path, raw):
    path = Path(path)
    temp_root = Path(tempfile.gettempdir()).resolve()
    parent = path.parent.resolve(strict=True)
    if not parent.is_relative_to(temp_root):
        raise ValueError('output must be inside system temporary directory')
    target = parent / path.name
    if target.exists() or target.is_symlink():
        raise ValueError('output already exists')
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    if hasattr(os, 'O_NOFOLLOW'):
        flags |= os.O_NOFOLLOW
    try:
        fd = os.open(target, flags, 0o600)
    except FileExistsError as exc:
        raise ValueError('output already exists') from exc
    try:
        with os.fdopen(fd, 'wb') as f:
            f.write(raw)
    except BaseException:
        target.unlink(missing_ok=True)
        raise


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['snapshot', 'replay'])
    parser.add_argument('baseline', type=Path)
    parser.add_argument('target_or_snapshot', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    try:
        raw = args.baseline.read_bytes()
        if args.mode == 'snapshot':
            result = encode(make_snapshot(raw, args.target_or_snapshot.read_bytes()))
        else:
            result = apply_snapshot(raw, json.loads(args.target_or_snapshot.read_bytes()))
        write_new_temporary(args.output, result)
    except (OSError, ValueError, TypeError, KeyError) as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0

if __name__ == '__main__':
    sys.exit(main())
