"""Appliquer l’audit des correspondances métier / concours (octobre 2026).
Usage : python3 scripts/audit_concours.py [--check]

Lit scripts/audit-concours-2026-10.json (décisions relues : rejets, ajouts, catégories, versants)
et écrit data/catalogue/audit-01.json :
- links : rapprochements rejetés (ils l’emportent sur tout rapprochement proposé) et ajoutés ;
- routes / examDetails : corps absents de la base, nécessaires aux corrections ;
- jobCorrections : catégories et versants rectifiés.
À relancer après scripts/import_referentiel.py, qui conserve ce fichier.
"""
import argparse, json, re, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
CHECKED = '2026-10-19'

NEW_ROUTES = {
    'ir': ('Ingénieur·e de recherche', 'A', 5, 'E', 'Établissements d’enseignement supérieur et organismes de recherche (concours ITRF ou des organismes)', 'https://www.enseignementsup-recherche.gouv.fr/fr/recrutements/itrf', 'Concours ITRF'),
    'asi': ('Assistant·e ingénieur·e', 'A', 3, 'E', 'Établissements d’enseignement supérieur et organismes de recherche (concours ITRF ou des organismes)', 'https://www.enseignementsup-recherche.gouv.fr/fr/recrutements/itrf', 'Concours ITRF'),
    'ispv': ('Inspecteur·rice de santé publique vétérinaire', 'A', 5, 'E', 'Ministère de l’Agriculture ; formation à l’École nationale des services vétérinaires (ENSV)', 'https://agriculture.gouv.fr/concours-et-examens-professionnels', 'Concours du ministère de l’Agriculture'),
    'iae': ('Ingénieur·e de l’agriculture et de l’environnement', 'A', 3, 'E', 'Ministère de l’Agriculture ; formation en école d’ingénieurs agronomes', 'https://agriculture.gouv.fr/concours-et-examens-professionnels', 'Concours du ministère de l’Agriculture'),
    'magistrat-crc': ('Magistrat·e des chambres régionales des comptes', 'A+', 5, 'E', 'Cour des comptes (concours de conseiller de chambre régionale des comptes)', 'https://www.ccomptes.fr/fr/nous-rejoindre', 'Concours des juridictions financières'),
    'tsma': ('Technicien·ne supérieur·e du ministère de l’Agriculture', 'B', 2, 'E', 'Ministère de l’Agriculture', 'https://agriculture.gouv.fr/concours-et-examens-professionnels', 'Concours du ministère de l’Agriculture'),
}
# Corps hospitaliers sans catégorie dans la base : catégorie statutaire de la fonction publique hospitalière.
ROUTE_CATS = {
    'corps-f6dd8c45a494': 'A', 'corps-f79ddb32c1ad': 'A', 'corps-9dbd99cf6242': 'A', 'corps-8f2782866ddb': 'B',
    'corps-ec256241f2eb': 'A', 'corps-a68e56a74959': 'A', 'corps-59d7c76139ef': 'A', 'corps-6ba574d0c2ad': 'C',
    'corps-05649e6ff27a': 'A', 'corps-55dad331a41a': 'B', 'corps-a858c23e1fd9': 'A', 'corps-fe7341cee5b3': 'B',
    'corps-eb3e0b32cb9b': 'A', 'corps-5262c8692a47': 'A', 'corps-25c5d13bcc67': 'A', 'corps-a2609c59dafa': 'A',
    'corps-529e3002f1bc': 'A+', 'corps-d785cb350fca': 'A',
}
NOTE = 'Audit des correspondances métier / concours du 19 octobre 2026.'

def norm(s):
    s = unicodedata.normalize('NFD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()

def load():
    manifest = json.loads((DATA / 'catalogue.json').read_text())
    parts = [p for p in manifest['parts'] if not Path(p).name.startswith('audit-')]
    db = {}
    for p in parts:
        for k, v in json.loads((DATA / p).read_text()).items():
            db[k] = (db.get(k) or []) + v if isinstance(v, list) else v
    return manifest, parts, db

def job_categories(j, fixes):
    if j['id'] in fixes and 'categories' in fixes[j['id']]: return fixes[j['id']]['categories']
    if j.get('contractual') or j['cat'] in ('X', 'CDD'): return []
    if j['cat'] != 'V': return [j['cat']]
    counts, cats = j.get('categoryCounts') or {}, j.get('categories') or []
    if counts:
        top = max([counts.get(c, 0) for c in cats] or [0])
        if top: return [c for c in ['A+', 'A', 'B', 'C'] if c in cats and counts.get(c, 0) >= top / 2]
    return [c for c in ['A+', 'A', 'B', 'C'] if c in cats]

def main(check):
    audit = json.loads((ROOT / 'scripts/audit-concours-2026-10.json').read_text())
    manifest, parts, db = load()
    routes = {r['id']: r for r in db['routes']}
    new_routes, exams = [], []
    for rid, (name, c, lvl, fp, org, source, title) in NEW_ROUTES.items():
        if rid in routes: continue
        r = {'id': rid, 'name': name, 'cat': c, 'lvl': lvl, 'fp': fp, 'cal': norm(name.split('·')[0]), 'prep': '', 'source': source,
             'access': 'Concours · consulter l’avis', 'matchPattern': '^' + re.escape(norm(name.split('·')[0])), 'cardTitle': title}
        new_routes.append(r); routes[rid] = r
        exams.append({'id': rid + '__' + fp, 'routeId': rid, 'fp': fp, 'name': 'Concours : ' + name, 'org': org,
                      'metro': 'Lieux précisés dans l’avis de chaque session.', 'om': 'Centres d’outre-mer précisés dans l’avis lorsque le concours en ouvre.',
                      'source': source, 'checked': CHECKED, 'cardTitle': title, 'officialLinks': [{'label': 'Page officielle du recrutement', 'url': source}]})
    for rid, c in ROUTE_CATS.items():
        if rid in routes: routes[rid]['cat'] = c
    jobs = {j['id']: j for j in db['rmfp'] + db['legacyJobs']}
    fixes = {}
    for x in audit['category']:
        fixes.setdefault(x['job_id'], {})['categories'] = x['categories']
    for x in audit['fp']:
        fixes.setdefault(x['job_id'], {})['fp'] = x['fp']
    rejected = {(x['job_id'], x['route_id']): x['reason'] for x in audit['reject']}
    # Corps ajoutés : ingénieurs de recherche, assistants ingénieurs et ministère de l’Agriculture.
    rules = []
    for j in db['rmfp']:
        n = norm(j['name'])
        if re.search(r'\bingenieure? (e )?de recherche\b', n):
            rules.append((j['id'], 'ir', 'Corps des ingénieurs de recherche (BAP).')); rejected.setdefault((j['id'], 'ie'), 'Fonction d’ingénieur de recherche : corps des ingénieurs de recherche, pas des ingénieurs d’études.')
        if re.search(r'\bassistante? (e )?ingenieu', n):
            rules.append((j['id'], 'asi', 'Corps des assistants ingénieurs (BAP).')); rejected.setdefault((j['id'], 'ie'), 'Fonction d’assistant ingénieur : corps des assistants ingénieurs, pas des ingénieurs d’études.')
        if j.get('rmfpDomain') == 'Agriculture' and 'E' in (fixes.get(j['id'], {}).get('fp') or j['fp']):
            cats = job_categories(j, fixes)
            if 'A' in cats: rules.append((j['id'], 'ispv' if 'veterin' in n else 'iae', 'Corps du ministère de l’Agriculture.'))
            if 'B' in cats: rules.append((j['id'], 'tsma', 'Corps du ministère de l’Agriculture.'))
    adds = [(x['job_id'], x['route_id'], x['reason']) for x in audit['add']] + rules
    links, skipped, seen = [], [], set()
    for (jid, rid), reason in rejected.items():
        links.append({'id': 'audit__' + jid + '__' + rid, 'jobId': jid, 'routeId': rid, 'status': 'rejeté', 'source': '', 'note': reason})
    for jid, rid, reason in adds:
        j, r = jobs.get(jid), routes.get(rid)
        if not j or not r or (jid, rid) in rejected or (jid, rid) in seen:
            skipped.append((jid, rid, 'inconnu ou rejeté')); continue
        fp = fixes.get(jid, {}).get('fp') or j['fp']
        if r['cat'] not in job_categories(j, fixes) or not set(r['fp']) & set(fp):
            skipped.append((jid, rid, 'catégorie ou versant incompatibles')); continue
        seen.add((jid, rid))
        links.append({'id': 'audit__' + jid + '__' + rid, 'jobId': jid, 'routeId': rid, 'status': 'proposé', 'source': r['source'], 'note': NOTE + ' ' + reason})
    for n in audit.get('notes', []):
        for jid in n['job_ids']:
            if jid in jobs: fixes.setdefault(jid, {})['recruitment'] = {'text': n['text'], 'url': n['url'], 'label': n['label']}
    corrections = [dict(id=jid, **fix) for jid, fix in sorted(fixes.items())]
    print(f"{len(rejected)} rejets, {len(seen)} ajouts, {len(corrections)} fiches rectifiées, {len(new_routes)} corps ajoutés ; {len(skipped)} ajouts écartés.")
    for s in skipped: print('  écarté :', *s)
    if check: return
    out = {'routes': new_routes, 'examDetails': exams, 'links': links, 'jobCorrections': corrections,
           'routeCorrections': [{'id': rid, 'cat': c} for rid, c in ROUTE_CATS.items() if rid in routes]}
    (DATA / 'catalogue/audit-01.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n')
    manifest['parts'] = parts + ['catalogue/audit-01.json']
    (DATA / 'catalogue.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--check', action='store_true')
    main(parser.parse_args().check)
