#!/usr/bin/env python3
"""Copy the official USCIS reading and writing vocabulary lists out of their
PDFs into content/vocab/*.json, word for word (never retyped).

    python3 scripts/vocab/extract_vocabulary.py

Needs `pdftotext` (poppler-utils). It reads each word with its position on the
page (`pdftotext -bbox`), groups words into entries (words closer than a small
gap belong together), and puts each entry under the column heading above it.
Run it again only if USCIS publishes new lists; then check the output against
the PDFs by eye before committing.
"""
import html
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCES = {
    'reading': ROOT / 'content/vocab/source/reading-vocabulary.pdf',
    'writing': ROOT / 'content/vocab/source/writing-vocabulary.pdf',
}
TITLES = {
    'reading': 'Reading Vocabulary for the Naturalization Test',
    'writing': 'Writing Vocabulary for the Naturalization Test',
}
SAME_ENTRY_GAP = 8.0  # points between words of one entry ("Bill of Rights")
SAME_LINE = 3.0       # points of y difference for words on one line

WORD = re.compile(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>')


def words(pdf):
    out = subprocess.run(['pdftotext', '-bbox', str(pdf), '-'], check=True, capture_output=True, text=True).stdout
    return [
        {'x0': float(a), 'y0': float(b), 'x1': float(c), 'text': html.unescape(t)}
        for a, b, c, _, t in WORD.findall(out)
    ]


def lines(ws):
    rows = []
    for w in sorted(ws, key=lambda w: (w['y0'], w['x0'])):
        if rows and abs(rows[-1][0]['y0'] - w['y0']) <= SAME_LINE:
            rows[-1].append(w)
        else:
            rows.append([w])
    return [sorted(r, key=lambda w: w['x0']) for r in rows]


def entries(row):
    groups = []
    for w in row:
        if groups and w['x0'] - groups[-1][-1]['x1'] < SAME_ENTRY_GAP:
            groups[-1].append(w)
        else:
            groups.append([w])
    return [{'x0': g[0]['x0'], 'x1': g[-1]['x1'], 'text': ' '.join(w['text'] for w in g)} for g in groups]


def extract(kind):
    ws = words(SOURCES[kind])
    # "(rev. 08/08)" in the top corner.
    revision = next((w['text'] for w in ws if re.fullmatch(r'\d\d/\d\d\)', w['text'])), '').strip('()')
    title_y = next(w['y0'] for w in ws if w['text'] == 'Vocabulary')
    body = [w for w in ws if w['y0'] > title_y + 5]
    rows = lines(body)
    # Heading rows: every word is upper case (PEOPLE, QUESTION, (FUNCTION), ...).
    head_rows, data_rows = [], []
    for r in rows:
        (head_rows if not data_rows and all(w['text'] == w['text'].upper() for w in r) else data_rows).append(r)
    # Column headings: heading words stacked above each other belong together.
    # (Entries are listed top to bottom within a column: data_rows are in order.)
    heads = []
    for r in head_rows:
        for e in entries(r):
            mid = (e['x0'] + e['x1']) / 2
            match = next((h for h in heads if h['x0'] - 6 <= mid <= h['x1'] + 6), None)
            if match:
                match['parts'].append((r[0]['y0'], e['text']))
                match['x0'] = min(match['x0'], e['x0'])
                match['x1'] = max(match['x1'], e['x1'])
            else:
                heads.append({'x0': e['x0'], 'x1': e['x1'], 'parts': [(r[0]['y0'], e['text'])]})
    heads.sort(key=lambda h: h['x0'])
    for h in heads:
        h['name'] = ' '.join(t for _, t in sorted(h['parts']))
        h['entries'] = []
    # Entries in one column share a left edge. Group the entries by left edge,
    # then pair the groups with the headings from left to right.
    all_entries = [e for r in data_rows for e in entries(r)]
    edges = []
    for x in sorted(e['x0'] for e in all_entries):
        if edges and x - edges[-1][-1] <= 12:
            edges[-1].append(x)
        else:
            edges.append([x])
    if len(edges) != len(heads):
        raise SystemExit(f'{kind}: found {len(edges)} columns of words but {len(heads)} headings; check the PDF')
    for e in all_entries:
        i = next(k for k, group in enumerate(edges) if group[0] <= e['x0'] <= group[-1])
        heads[i]['entries'].append(e['text'])
    return {
        'title': TITLES[kind],
        'source': f'content/vocab/source/{kind}-vocabulary.pdf (USCIS, rev. {revision})',
        'note': 'Copied from the PDF by scripts/vocab/extract_vocabulary.py. Do not edit by hand.',
        'categories': [{'category': h['name'], 'entries': h['entries']} for h in heads],
    }


def main():
    for kind in SOURCES:
        data = extract(kind)
        path = ROOT / f'content/vocab/{kind}-vocabulary.json'
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        n = sum(len(c['entries']) for c in data['categories'])
        print(f'{path.relative_to(ROOT)}: {n} entries in {len(data["categories"])} columns')
    return 0


if __name__ == '__main__':
    sys.exit(main())
