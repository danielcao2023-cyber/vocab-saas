#!/usr/bin/env python3
"""Scan public Parquet text metadata for complete, normalized target matches."""
import json
import re
from pathlib import Path
import duckdb

here = Path(__file__).resolve().parent
index = json.loads((here / 'australian-librivox-parquet-index-2026-10-30.json').read_text())
targets = json.loads((here / 'australian-librivox-targets-2026-10-30.json').read_text())
normalize = lambda text: re.sub(r'[^a-z ]', '', text.lower()).strip()
by_normalized = {normalize(target): target for target in targets}
connection = duckdb.connect()
matches = []
for part in index['parquet_files']:
    rows = connection.execute(
        'select text, reader, book, reader_id, book_id, section, duration from read_parquet(?)',
        [part['url']],
    ).fetchall()
    for row in rows:
        target = by_normalized.get(normalize(row[0]))
        if target is not None:
            matches.append({'target': target, 'row': row, 'parquet': part['filename']})
    print(f"{part['filename']}: {len(rows)} rows; {len(matches)} cumulative matches")
print(json.dumps(matches, ensure_ascii=False, indent=2))
