"""Intégrer le référentiel « concours · métiers · annales · études · progressions ».
Usage : python3 scripts/import_referentiel.py /chemin/referentiel_fonction_publique_….xlsx [--check]

Produit des fichiers séparés, préfixés « ref- », dans data/catalogue :
- ref-concours-01.json : les 61 concours (voies, conditions, épreuves, annales, collège, lycée,
  options, études L1-L3, préparations, progressions, sources) et le glossaire des sigles ;
- ref-routes-01.json et ref-exam-details-01.json : les corps et cadres d’emplois absents de la base ;
- ref-links-XX.json : correspondances métier / concours proposées par filière, pour chaque fiche
  sans concours de sa catégorie et de son versant ;
- ref-annales-01.json : les collections officielles d’annales, en tête des ressources.
Les taux de réussite des préparations ne sont jamais repris.
"""
import argparse, json, re, unicodedata
from pathlib import Path
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
CHECKED = '2026-10-18'
FP = {'État': 'E', 'Territoriale': 'T', 'Hospitalière': 'H'}

# Concours du référentiel → corps ou cadres d’emplois de l’application.
ROUTES = {
    'É-001': ['admin-etat'], 'É-002': ['attache'], 'É-003': ['insp-fip'], 'É-004': ['insp-travail'],
    'É-005': ['pe'], 'É-006': ['capes'], 'É-007': ['cpe'], 'É-008': ['officier-police'],
    'É-009': ['commissaire'], 'É-010': ['insp-douane'], 'É-011': ['iass'], 'É-012': ['dsp'],
    'É-013': ['ctrl-fip'], 'É-014': ['sa'], 'É-015': ['greffier'], 'É-016': ['gpx'],
    'É-017': ['surveillant'], 'É-018': ['ctrl-douane'], 'É-019': ['trf'], 'É-020': ['agent-fip'],
    'É-021': ['adjoint-adm'], 'É-022': ['acd'], 'É-023': ['adj-chancellerie'],
    'T-024': ['admin-terr'], 'T-025': ['ingenieur-chef'], 'T-026': ['attache-terr'], 'T-027': ['ingenieur-terr'],
    'T-028': ['ctse'], 'T-029': ['biblio-terr'], 'T-030': ['ass', 'educ'], 'T-031': ['eje-terr'],
    'T-032': ['dpm'], 'T-033': ['redacteur'], 'T-034': ['redacteur'], 'T-035': ['tech-terr'],
    'T-036': ['animateur'], 'T-037': ['csmp'], 'T-038': ['acp'], 'T-039': ['etaps'],
    'T-040': ['adjoint-adm'], 'T-041': ['adj-tech-terr'], 'T-042': ['atsem'], 'T-043': ['agent-maitrise'],
    'T-044': ['police-mun'], 'T-045': ['adj-anim'], 'T-046': ['adj-patrimoine'],
    'H-047': ['dh'], 'H-048': ['d3s'], 'H-049': ['aah'], 'H-050': ['dir-soins'], 'H-051': ['ide'],
    'H-052': ['psy'], 'H-053': ['cadre-sante'], 'H-054': ['corps-9eeb8a61a6a9'], 'H-055': ['ama'],
    'H-056': ['corps-5476869dee76'], 'H-057': ['as'], 'H-058': ['auxpuer'], 'H-059': ['adjoint-adm'],
    'H-060': ['ash'], 'H-061': ['corps-3bcfcbcc7eb5'],
}

# Corps absents de la base : catégorie, niveau minimum (0 à 6, None si expérience), versant, organisateur.
NEW_ROUTES = {
    'insp-douane': ('Inspecteur·rice des douanes', 'A', 4, 'E', 'Direction générale des douanes et droits indirects (DGDDI)', 'https://www.douane.gouv.fr/recrutement', 'Concours de la DGDDI'),
    'iass': ('Inspecteur·rice de l’action sanitaire et sociale', 'A', 4, 'E', 'Ministères sociaux ; formation à l’EHESP après admission', 'https://www.ehesp.fr/formation/formations-fonction-publique/', 'Concours IASS'),
    'dsp': ('Directeur·rice des services pénitentiaires', 'A', 4, 'E', 'Ministère de la Justice ; formation à l’ENAP après admission', 'https://www.justice.gouv.fr/metiers', 'Concours de la Justice'),
    'surveillant': ('Surveillant·e pénitentiaire', 'B', 1, 'E', 'Ministère de la Justice ; formation à l’ENAP après admission', 'https://lajusticerecrute.fr/', 'Concours de la Justice'),
    'agent-fip': ('Agent·e administratif·ve des finances publiques', 'C', 1, 'E', 'Direction générale des finances publiques (DGFiP)', 'https://www.economie.gouv.fr/rejoignez-nous/agent-administratif-principal-des-finances-publiques-de-2eme-classe-externe-dgfip', 'Concours DGFiP'),
    'acd': ('Agent·e de constatation des douanes', 'C', 1, 'E', 'Direction générale des douanes et droits indirects (DGDDI)', 'https://www.douane.gouv.fr/recrutement', 'Concours de la DGDDI'),
    'adj-chancellerie': ('Adjoint·e administratif·ve de chancellerie', 'C', 1, 'E', 'Ministère de l’Europe et des Affaires étrangères', 'https://www.diplomatie.gouv.fr/fr/le-ministere/publications-programmes-et-documentation-institutionnelle/publications/annales-et-meilleures-copies/', 'Concours du ministère des Affaires étrangères'),
    'itpe': ('Ingénieur·e des travaux publics de l’État', 'A', 3, 'E', 'Ministère chargé de la transition écologique ; formation à l’ENTPE', 'https://www.entpe.fr/', 'Concours ITPE'),
    'adj-tech-etat': ('Adjoint·e technique des administrations de l’État', 'C', 0, 'E', 'Ministères, préfectures et services déconcentrés', 'https://www.interieur.gouv.fr/recrutement', 'Recrutement de l’État'),
    'ctse': ('Conseiller·ère territorial·e socio-éducatif·ve', 'A', 4, 'T', 'Centres de gestion (CDG)', 'https://www.concours-territorial.fr/epreuves.aspx?id=254', 'Concours territorial'),
    'biblio-terr': ('Bibliothécaire territorial·e', 'A', 4, 'T', 'Centres de gestion (CDG) ou CNFPT selon la session', 'https://www.concours-territorial.fr/', 'Concours territorial'),
    'eje-terr': ('Éducateur·rice territorial·e de jeunes enfants', 'A', 4, 'T', 'Centres de gestion (CDG)', 'https://www.concours-territorial.fr/', 'Concours territorial'),
    'dpm': ('Directeur·rice de police municipale', 'A', 4, 'T', 'Centres de gestion (CDG)', 'https://www.concours-territorial.fr/', 'Concours territorial'),
    'csmp': ('Chef·fe de service de police municipale', 'B', 2, 'T', 'Centres de gestion (CDG)', 'https://www.concours-territorial.fr/epreuves.aspx?id=314', 'Concours territorial'),
    'adj-tech-terr': ('Adjoint·e technique territorial·e', 'C', 1, 'T', 'Centres de gestion (CDG)', 'https://www.concours-territorial.fr/epreuves.aspx?id=283', 'Concours territorial'),
    'agent-maitrise': ('Agent·e de maîtrise territorial·e', 'C', 1, 'T', 'Centres de gestion (CDG)', 'https://www.concours-territorial.fr/epreuves.aspx?id=331&spe=24', 'Concours territorial'),
    'adj-anim': ('Adjoint·e territorial·e d’animation', 'C', 0, 'T', 'Centres de gestion (CDG)', 'https://concours-territorial.fr/calendrier.aspx?annee=2026&type=concours', 'Concours territorial'),
    'adj-patrimoine': ('Adjoint·e territorial·e du patrimoine', 'C', 0, 'T', 'Centres de gestion (CDG)', 'https://concours-territorial.fr/calendrier.aspx?annee=2026&type=concours', 'Concours territorial'),
    'dir-soins': ('Directeur·rice des soins', 'A+', None, 'H', 'Centre national de gestion (CNG) ; formation à l’EHESP', 'https://www.cng.sante.fr/candidats/concours/devenir-dh-d3s-ds/annales-rapports-jurys', 'Concours CNG'),
    'cadre-sante': ('Cadre de santé paramédical', 'A', None, 'H', 'Établissements publics de santé, après le diplôme de cadre de santé', 'https://concours.aphp.fr/informations-candidats/', 'Concours hospitalier'),
    'ingenieur-hosp': ('Ingénieur·e hospitalier·ère', 'A', 5, 'H', 'Établissements publics de santé', 'https://www.concours-fph.ars.sante.fr/', 'Concours hospitalier'),
}

# Filières : corps proposé pour une fiche sans concours de sa catégorie et de son versant.
ADMIN = {'E': {'A+': 'admin-etat', 'A': 'attache', 'B': 'sa', 'C': 'adjoint-adm'},
         'T': {'A+': 'admin-terr', 'A': 'attache-terr', 'B': 'redacteur', 'C': 'adjoint-adm'},
         'H': {'A+': 'dh', 'A': 'aah', 'B': 'corps-9eeb8a61a6a9', 'C': 'adjoint-adm'}}
TECH = {'E': {'A+': 'ipef', 'A': 'itpe', 'B': 'tsdd', 'C': 'adj-tech-etat'},
        'T': {'A+': 'ingenieur-chef', 'A': 'ingenieur-terr', 'B': 'tech-terr', 'C': 'adj-tech-terr'},
        'H': {'A': 'ingenieur-hosp', 'B': 'corps-5476869dee76', 'C': 'corps-3bcfcbcc7eb5'}}
def group(**versants):
    out = {f: dict(ADMIN[f]) for f in 'ETH'}
    for f, cats in versants.items(): out[f].update(cats)
    return out
GROUPS = {
    'admin': ADMIN, 'tech': TECH,
    'recherche': {'E': {'A+': 'chercheur', 'A': 'ie', 'B': 'trf', 'C': 'atrf'}, 'T': TECH['T'], 'H': TECH['H']},
    'securite': group(E={'A+': 'commissaire', 'A': 'officier-police', 'B': 'gpx'}, T={'A': 'dpm', 'B': 'csmp', 'C': 'police-mun'}),
    'defense': group(E={'A': 'corps-f25b82f071a5', 'B': 'sous-off-gend'}),
    'justice': group(E={'A+': 'magistrat', 'A': 'dsg', 'B': 'greffier'}),
    'finances': group(E={'A': 'insp-fip', 'B': 'ctrl-fip', 'C': 'agent-fip'}),
    'international': group(E={'B': 'chancellerie', 'C': 'adj-chancellerie'}),
    'pilotage-sante': group(E={'A': 'iass'}, H={'A+': 'd3s'}),
    'soins': {'E': {}, 'T': {'A': 'ide'}, 'H': {'A+': 'dir-soins', 'A': 'ide', 'B': 'as', 'C': 'ash'}},
    'social': group(E={'A': 'ass'}, T={'A+': 'ctse', 'A': 'ass', 'C': 'agent-social'}, H={'A': 'ass'}),
    'enseignement': group(E={'A': 'capes'}),
    'culture': group(E={'A+': 'conservateur', 'A': 'corps-08e8a6d6b236', 'B': 'corps-72087d19dcef', 'C': 'magasinier'},
                     T={'A+': 'conservateur-bib', 'A': 'biblio-terr', 'B': 'acp', 'C': 'adj-patrimoine'}),
    'animation': group(E={'A': 'corps-b464cbe97049'}, T={'B': 'animateur', 'C': 'adj-anim'}),
}
FAMILY = {
    'Recherche': 'recherche', 'Sécurité': 'securite', 'Renseignement': 'securite', 'Défense': 'defense', 'Justice': 'justice',
    'Finances Publiques': 'finances', 'Finances publiques': 'finances', 'International': 'international',
    'Prévention, conseil et pilotage en santé': 'pilotage-sante', 'Médical et paramédical': 'soins',
    'Social, enfance et famille': 'social', 'Enseignement et Formation': 'enseignement',
    'Lecture publique et Documentation': 'culture', 'Culture et Patrimoine': 'culture',
    'Animation, jeunesse et sports': 'animation',
    'Interventions techniques et logistiques': 'tech', 'Bâtiment': 'tech', 'Aménagement et développement durable du territoire': 'tech',
    'Transports': 'tech', 'Environnement': 'tech', 'Agriculture': 'tech', 'Numérique': 'tech',
}
# « Soins » ne propose aucun concours A+ aux fonctions médicales : les praticiens ne relèvent pas de ces corps.
NO_GENERIC = re.compile(r'\bmedecin|\bpharmacien|\bchirurgien|\bpraticien|\bodontolog|\bbiologiste medical|\bsage-femme', re.I)

# Correspondance des épreuves documentées (onglet Epreuves_verifiees) avec les identifiants.
EPREUVES_IDS = [('Inspecteur des finances publiques', 'É-003'), ('Contrôleur des finances publiques', 'É-013'),
                ('Inspecteur du travail', 'É-004'), ('Professeur des écoles', 'É-005'), ('CPE', 'É-007'),
                ('Attaché territorial', 'T-026'), ('Ingénieur territorial', 'T-027'), ('Rédacteur principal', 'T-034'),
                ('Rédacteur territorial', 'T-033'), ('Technicien territorial', 'T-035'), ('Animateur territorial', 'T-036'),
                ('Chef service police municipale', 'T-037'), ('Adjoint administratif principal', 'T-040'),
                ('ATSEM', 'T-042'), ('Adjoint technique principal', 'T-041'), ('Agent maîtrise', 'T-043'),
                ('Attaché administration hospitalière', 'H-049'), ('D3S', 'H-048'), ('Infirmier', 'H-051')]

# Incohérences relevées dans le classeur et rectifiées ici.
CORRECTIONS = {
    # Les onglets Metiers_61, Liens_officiels et Epreuves_session_source citent la page d’annales du CNG.
    'H-047': {'annales': {'kind': 'Sujets et rapports de jury officiels', 'years': '2021 à 2026', 'url': 'https://www.cng.sante.fr/candidats/concours/devenir-dh-d3s-ds/annales-rapports-jurys'}},
    'H-048': {'annales': {'kind': 'Sujets et rapports de jury officiels', 'years': '2021 à 2026', 'url': 'https://www.cng.sante.fr/candidats/concours/devenir-dh-d3s-ds/annales-rapports-jurys'}},
    'H-050': {'annales': {'kind': 'Sujets et rapports de jury officiels', 'years': '2021 à 2026', 'url': 'https://www.cng.sante.fr/candidats/concours/devenir-dh-d3s-ds/annales-rapports-jurys'}},
    # Onglet Epreuves_verifiees : page officielle des annales 2026 de l’inspection du travail.
    'É-004': {'annales': {'kind': 'Annales officielles', 'years': '2026', 'url': 'https://travail-emploi.gouv.fr/annales-du-concours-de-linspection-du-travail-2026'}},
    # Onglet Metiers_61 : annales et meilleures copies du ministère de l’Europe et des Affaires étrangères.
    'É-023': {'annales': {'kind': 'Annales et meilleures copies', 'years': 'Sessions récentes', 'url': 'https://www.diplomatie.gouv.fr/fr/le-ministere/publications-programmes-et-documentation-institutionnelle/publications/annales-et-meilleures-copies/'}},
    # Progressions : la cible « directeur des services de greffe » existe dans l’application.
}

def norm(s):
    s = unicodedata.normalize('NFD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()
def cell(v): return '' if v is None else str(v).strip()
def table(wb, name):
    rows = [[cell(c) for c in r] for r in wb[name].iter_rows(values_only=True)]
    head = next(i for i, r in enumerate(rows) if r and r[0] in ('Concours_ID', 'ID', 'Versant', 'Sigle', 'Niveau scolaire', 'Filière', 'Organisme'))
    return [dict(zip(rows[head], r)) for r in rows[head + 1:] if any(r)]
def cat(repere):
    r = repere.strip()
    return 'A+' if r.startswith('A+') else r[:1]
def clean(text):
    # Les renvois internes au classeur (« voir onglet … ») ne sont pas destinés au public.
    text = re.sub(r'\s*;?\s*(voir|cf\.?)\s+(l[’\']\s*)?onglets?\s+[A-Za-z_0-9]+\.?', '', text or '', flags=re.I)
    text = re.sub(r'\s*;\s*', ' ; ', text).strip(' ;')
    return re.sub(r'\s+', ' ', text)

def read(path):
    wb = load_workbook(path, read_only=True, data_only=True)
    vue = {r['Concours_ID']: r for r in table(wb, 'VUE_UNIQUE_61')}
    lycee = {r['Concours_ID']: r for r in table(wb, 'Lycee_61_concours')}
    etudes = {r['Concours_ID']: r for r in table(wb, 'Etudes_61_concours')}
    options = {r['Concours_ID']: r for r in table(wb, 'Options_lycee_61')}
    annales = {r['Concours_ID']: r for r in table(wb, 'Annales_61_concours')}
    catalogue = {r['ID']: r for r in table(wb, 'Concours_catalogue')}
    sessions = {}
    for r in table(wb, 'Epreuves_session_source'):
        sessions.setdefault(r['ID'], []).append({'session': r['Session'], 'text': clean(r['Information documentée']), 'caution': clean(r["Précaution d'affichage"]), 'status': r['Niveau de vérification'], 'url': r['URL officielle']})
    for r in table(wb, 'Epreuves_verifiees'):
        cid = next((i for k, i in EPREUVES_IDS if norm(k) in norm(r['Concours'])), None)
        if not cid: continue
        if any(s['session'] == r['Session'] for s in sessions.get(cid, [])): continue
        sessions.setdefault(cid, []).append({'session': r['Session'], 'text': clean(r['Épreuves décrites par la source']), 'caution': '', 'status': r['Statut'], 'url': r['URL source']})
    progressions = []
    for r in table(wb, 'Progressions_24'):
        target = r['Concours_ID cible'] or ('dsg' if 'greffe' in norm(r['Corps / fonction cible']) else '')
        progressions.append({'from': r['Concours_ID départ'], 'to': target, 'fromCat': r['De repère'], 'toCat': r['Vers repère'], 'toName': r['Corps / fonction cible'],
                             'voie': clean(r['Voie de transition à examiner']), 'condition': clean(r['Condition/risque essentiel']), 'source': r['Source officielle']})
    sigles = [{'id': r['Sigle'], 'label': r['Intitulé complet']} for r in table(wb, 'Sigles_en_clair') if r.get('Sigle')]
    stages = [{'level': r['Niveau scolaire'], 'domain': r['Projet ou domaine'], 'device': r['Dispositif'], 'advice': clean(r['Suggestion pour Public Match']), 'tip': clean(r['Conseil simple à afficher']), 'places': clean(r['Structures possibles']), 'caution': clean(r['Précautions d’accueil / droits']), 'source': r['Source officielle']} for r in table(wb, 'Stages_et_rencontres')]
    prepas = [{'name': r['Organisme'], 'categories': r['Catégorie'], 'scope': r['Périmètre concours'], 'url': r['URL de preuve']} for r in table(wb, 'Prepas_resultats')]
    concours = []
    for cid, v in vue.items():
        ly, et, op, an, ca = lycee.get(cid, {}), etudes.get(cid, {}), options.get(cid, {}), annales.get(cid, {}), catalogue.get(cid, {})
        ann = None
        if an.get('Lien officiel'):
            ann = {'kind': an['Type ressource'], 'years': an['Année(s) réellement repérées'], 'url': an['Lien officiel'], 'scope': clean(an['Périmètre exact']), 'caution': clean(an['Réserve pour publication'])}
        ann = CORRECTIONS.get(cid, {}).get('annales') or ann
        concours.append({
            'id': cid, 'fp': FP[v['Versant']], 'cat': cat(v['Repère de catégorie']), 'name': v['Concours / recrutement'],
            'routeIds': ROUTES[cid], 'voies': clean(v["Type et voies d'accès"]), 'metiers': clean(v['Métiers associés (exemples, non exhaustifs)']),
            'domain': clean(ca.get('Domaine d’intérêt', '')), 'condition': clean(v['Conditions de diplôme (à vérifier par voie)']),
            'epreuves': clean(ca.get('Épreuves – résumé') or v['Épreuves (aperçu, session à préciser)']), 'variations': clean(ca.get('Variations / vigilance', '')),
            'sessions': sessions.get(cid, []), 'annales': ann,
            'college': clean(ly.get('Au collège : priorités', '')), 'collegeOption': clean(ly.get('Option collège (facultative)', '')),
            'lyceeGeneral': clean(ly.get('Lycée voie générale — spécialités utiles (non exigées)', '')), 'lyceeTechno': clean(ly.get('Lycée voie technologique — piste', '')),
            'lyceePro': clean(ly.get('Lycée voie professionnelle — piste', '')), 'lyceeWhy': clean(ly.get('Pourquoi ces enseignements ?', '')),
            'stage': clean(ly.get('Stage 3e / stage 2de / rencontre', '')),
            'optionSeconde': clean(op.get('En seconde — enseignements OPTIONNELS à explorer', '')), 'optionTerminale': clean(op.get('En première / terminale — enseignements OPTIONNELS', '')),
            'studies': clean(et.get('Licence / BUT / autre domaine possible', '')), 'l1': clean(et.get('L1 / 1re année : contenus conseillés', '')),
            'l2': clean(et.get('L2 / 2e année : contenus conseillés', '')), 'l3': clean(et.get('L3 / 3e année : contenus conseillés', '')),
            'master': clean(et.get('Master / formation spécialisée', '')), 'prepa': clean(et.get('Préparation spécifique à envisager', '') or v['Préparations conseillées (pas un classement)']),
            'afterBac': clean(et.get('Dès le bac possible ?', '')), 'vigilance': clean(v['Vigilance essentielle']),
            'source': v['Source officielle concours'], 'checked': CHECKED,
        })
    for c in concours:
        c['next'] = [p for p in progressions if p['from'] == c['id']]
    return {'concours': concours, 'sigles': sigles, 'stagesAdvice': stages, 'prepaOrganisms': prepas}

def load_catalogue():
    manifest = json.loads((DATA / 'catalogue.json').read_text())
    db, parts = {}, [p for p in manifest['parts'] if not Path(p).name.startswith('ref-')]
    for p in parts:
        for k, v in json.loads((DATA / p).read_text()).items():
            db[k] = (db.get(k) or []) + v if isinstance(v, list) else v
    return manifest, parts, db

def job_categories(j):
    if j.get('contractual') or j['cat'] in ('X', 'CDD'): return []
    if j['cat'] != 'V': return [j['cat']]
    counts, cats = j.get('categoryCounts') or {}, j.get('categories') or []
    if counts:
        top = max(counts.get(c, 0) for c in cats) if cats else 0
        if top: return [c for c in ['A+', 'A', 'B', 'C'] if c in cats and counts.get(c, 0) >= top / 2]
    return [c for c in ['A+', 'A', 'B', 'C'] if c in cats]

def build(ref, db):
    routes = {r['id']: r for r in db['routes']}
    new_routes, exam_details = [], []
    for rid, (name, c, lvl, fp, org, source, title) in NEW_ROUTES.items():
        if rid in routes: continue
        r = {'id': rid, 'name': name, 'cat': c, 'lvl': lvl, 'fp': fp, 'cal': norm(name.split('·')[0]), 'prep': '', 'source': source,
             'access': 'Concours · consulter l’avis', 'matchPattern': '^' + re.escape(norm(name.split('·')[0])), 'cardTitle': title}
        new_routes.append(r); routes[rid] = r
        exam_details.append({'id': rid + '__' + fp, 'routeId': rid, 'fp': fp, 'name': 'Concours : ' + name, 'org': org,
                             'metro': 'Lieux précisés dans l’avis de chaque session.', 'om': 'Centres d’outre-mer précisés dans l’avis lorsque le concours en ouvre.',
                             'source': source, 'checked': CHECKED, 'cardTitle': title, 'officialLinks': [{'label': 'Page officielle du recrutement', 'url': source}]})
    for c in ref['concours']:
        for rid in c['routeIds']:
            if rid not in routes: raise ValueError('Corps inconnu pour ' + c['id'] + ' : ' + rid)
    # Correspondances proposées par filière, sans doublon ni retour sur un rapprochement rejeté.
    existing = {(l['jobId'], l['routeId']) for l in db['links']}
    covered = {}
    for l in db['links']:
        if l['status'] == 'rejeté' or l['routeId'] not in routes: continue
        r = routes[l['routeId']]
        for f in r['fp']: covered.setdefault(l['jobId'], set()).add((r['cat'], f))
    links = []
    for j in db['rmfp']:
        if j.get('active') is False or NO_GENERIC.search(norm(j['name'])): continue
        g = GROUPS[FAMILY.get(j.get('rmfpDomain'), 'admin')]
        for c in job_categories(j):
            for f in j['fp']:
                if (c, f) in covered.get(j['id'], set()): continue
                rid = g.get(f, {}).get(c)
                r = routes.get(rid)
                if not r or r['cat'] != c or f not in r['fp'] or (j['id'], rid) in existing: continue
                existing.add((j['id'], rid)); covered.setdefault(j['id'], set()).add((c, f))
                links.append({'id': j['id'] + '__' + rid, 'jobId': j['id'], 'routeId': rid, 'status': 'proposé', 'source': r['source'],
                              'note': 'Concours indicatif de la filière (référentiel du 18 octobre 2026) : vérifier le corps ou cadre d’emplois indiqué dans l’offre.'})
    annales, by_url = [], {}
    known = {r['url'] for r in db.get('studyResources', [])}
    for c in ref['concours']:
        a = c['annales']
        if not a: continue
        # Une même page officielle peut servir plusieurs concours : un seul lien, rattaché à chacun.
        if a['url'] in known: continue
        if a['url'] in by_url:
            r = by_url[a['url']]
            r['title'] += ' · ' + c['name']; r['concours'] += ' · ' + c['name']
            for k, v in (('categories', c['cat']), ('fps', c['fp'])):
                if v not in r[k]: r[k].append(v)
            r['routeIds'] += [x for x in c['routeIds'] if x not in r['routeIds']]
            continue
        annales.append({'id': 'ref-annales-' + norm(c['id']).replace(' ', '-'), 'title': 'Annales officielles : ' + c['name'], 'kind': 'annales',
                        'categories': [c['cat']], 'fps': [c['fp']], 'concours': c['name'], 'routeIds': c['routeIds'], 'year': a['years'],
                        'url': a['url'], 'sourceUrl': c['source'] or a['url'], 'sourceName': a['kind'], 'scope': 'document', 'checked': CHECKED,
                        'note': a.get('caution', '')})
        by_url[a['url']] = annales[-1]
    return new_routes, exam_details, links, annales

def write_parts(key, records, base):
    files, batch, size, i = [], [], 0, 1
    def flush():
        nonlocal batch, size, i
        name = 'catalogue/%s-%02d.json' % (base, i)
        (DATA / name).write_text(json.dumps({key: batch}, ensure_ascii=False, separators=(',', ':')) + '\n')
        files.append(name); batch, size, i = [], 0, i + 1
    for r in records:
        n = len(json.dumps(r, ensure_ascii=False))
        if batch and size + n > 85000: flush()
        batch.append(r); size += n
    if batch: flush()
    return files

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('classeur', type=Path); parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    ref = read(args.classeur)
    manifest, parts, db = load_catalogue()
    new_routes, exam_details, links, annales = build(ref, db)
    print(f"{len(ref['concours'])} concours, {len(new_routes)} corps ajoutés, {len(links)} correspondances proposées, {len(annales)} collections d’annales, {len(ref['sigles'])} sigles.")
    if args.check: raise SystemExit(0)
    for old in (DATA / 'catalogue').glob('ref-*.json'): old.unlink()
    files = write_parts('concours', ref['concours'], 'ref-concours')
    (DATA / 'catalogue/ref-glossaire-01.json').write_text(json.dumps({'sigles': ref['sigles'], 'stagesAdvice': ref['stagesAdvice'], 'prepaOrganisms': ref['prepaOrganisms']}, ensure_ascii=False, separators=(',', ':')) + '\n')
    files.append('catalogue/ref-glossaire-01.json')
    files += write_parts('routes', new_routes, 'ref-routes') + write_parts('examDetails', exam_details, 'ref-exam-details')
    files += write_parts('links', links, 'ref-links') + write_parts('studyResources', annales, 'ref-annales')
    manifest['parts'] = parts + files
    (DATA / 'catalogue.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
