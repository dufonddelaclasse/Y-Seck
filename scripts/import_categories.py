"""Reprendre les catégories renseignées dans le classeur « Métiers à préciser ».
Usage : python3 scripts/import_categories.py /chemin/Y-Seck_metiers_categories.xlsx [--extra scripts/categories-complementaires.json] [--check]
Les catégories observées dans les offres ne sont jamais remplacées ; seules les fiches sans catégorie sont complétées.
"""
import argparse, json, re
from pathlib import Path
from openpyxl import load_workbook
from import_workbook import ROOT

VALID = ['A+', 'A', 'B', 'C']

def parse(value):
    cats = [p.strip().upper() for p in re.split(r'[|,/]', str(value or '')) if p.strip()]
    if not cats or any(c not in VALID for c in cats): return None
    return [c for c in VALID if c in cats]

def read_review(path):
    ws = load_workbook(path, read_only=True, data_only=True)['Métiers à préciser']
    rows = list(ws.iter_rows(values_only=True))
    head = next(i for i, r in enumerate(rows) if r and r[0] == 'Identifiant')
    out = {}
    for r in rows[head + 1:]:
        if not r or not r[0]: continue
        cats = parse(r[3])
        if cats is None: raise ValueError('Catégorie invalide pour ' + str(r[0]) + ' : ' + str(r[3]))
        note = str(r[4] or '').strip()
        out[r[0]] = (cats, 'équipe', note)
    return out

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('classeur', type=Path); parser.add_argument('--extra', type=Path); parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    updates = read_review(args.classeur)
    if args.extra:
        extra = json.loads(args.extra.read_text())
        for id, value in extra['categories'].items():
            if id not in updates: updates[id] = (parse(value), 'complément', extra['note'])
    manifest = json.loads((ROOT / 'data/catalogue.json').read_text())
    files = {p: json.loads((ROOT / 'data' / p).read_text()) for p in manifest['parts'] if re.search(r'/rmfp-\d+\.json$', p)}
    jobs = {j['id']: j for part in files.values() for j in part['rmfp']}
    unknown = [id for id in updates if id not in jobs]
    if unknown: raise ValueError('Identifiants inconnus : ' + ', '.join(unknown))
    changed = 0
    for id, (cats, source, note) in updates.items():
        job = jobs[id]
        if job.get('categoryCounts') or (job.get('categories') and not job.get('categorySource')): continue
        job['categories'] = cats; job['categorySource'] = source
        if note: job['categoryNote'] = note
        else: job.pop('categoryNote', None)
        changed += 1
    left = [j['id'] for j in jobs.values() if j['cat'] == 'V' and not j.get('categories') and not j.get('contractual')]
    if not args.check:
        # Réécrire seulement les fichiers métiers, dans leur découpage actuel.
        for path, part in files.items(): (ROOT / 'data' / path).write_text(json.dumps(part, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(('Contrôle réussi' if args.check else 'Catégories importées') + f' : {changed} métiers complétés, {len(left)} restent sans catégorie.')
