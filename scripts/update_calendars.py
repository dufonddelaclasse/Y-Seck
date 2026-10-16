import json, re, unicodedata, hashlib, concurrent.futures
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.parse import urljoin
from lxml import html

ROOT=Path(__file__).resolve().parents[1]/'work'
CACHE=ROOT/'source-cache'; CACHE.mkdir(parents=True,exist_ok=True)
REPO=Path(__file__).resolve().parents[1]
BASE='https://www.fonction-publique.gouv.fr'
SCORE=BASE+'/devenir-agent-public/calendrier-general-concours'
ARS='https://www.concours-fph.ars.sante.fr'
import datetime
CHECKED=datetime.date.today().isoformat()

def get(url):
    p=CACHE/(hashlib.sha256(url.encode()).hexdigest()+'.html')
    if not p.exists():
        with urlopen(Request(url,headers={'User-Agent':'Y-Seck-public-data-import/1.0'}),timeout=40) as r: p.write_bytes(r.read())
    return html.fromstring(p.read_bytes())

def text(el): return ' '.join(el.text_content().split())
def norm(s): return ''.join(c for c in unicodedata.normalize('NFD',s.lower()) if unicodedata.category(c)!='Mn')
MONTHS={m:i+1 for i,m in enumerate(['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'])}
def iso(s):
    s=norm(s)
    m=re.search(r'(\d{1,2})[-/](\d{1,2})[-/](20\d\d)',s)
    if m:return f'{m[3]}-{int(m[2]):02}-{int(m[1]):02}'
    m=re.search(r'(\d{1,2})(?:er)?\s+('+'|'.join(MONTHS)+r')\s+(20\d\d)',s)
    if m:return f'{m[3]}-{MONTHS[m[2]]:02}-{int(m[1]):02}'
    return None

# Conserver les doubles formes déjà inclusives ; compléter les intitulés masculins.
PAIRS={'directeur':'directeur·rice','administrateur':'administrateur·rice','inspecteur':'inspecteur·rice','conservateur':'conservateur·rice','contrôleur':'contrôleur·se','acheteur':'acheteur·se','chargé':'chargé·e','agent':'agent·e','adjoint':'adjoint·e','technicien':'technicien·ne','ingénieur':'ingénieur·e','assistant':'assistant·e','conseiller':'conseiller·ère','gestionnaire':'gestionnaire','conducteur':'conducteur·rice','animateur':'animateur·rice','éducateur':'éducateur·rice','professeur':'professeur·e','chercheur':'chercheur·se','enseignant':'enseignant·e','gardien':'gardien·ne','ouvrier':'ouvrier·ère','opérateur':'opérateur·rice','référent':'référent·e','délégué':'délégué·e','diplomate':'diplomate','réalisateur':'réalisateur·rice','formateur':'formateur·rice','coordinateur':'coordinateur·rice','coordonnateur':'coordonnateur·rice','magasinier':'magasinier·ère','infirmier':'infirmier·ère','aide-soignant':'aide-soignant·e','ambulancier':'ambulancier·ère','greffier':'greffier·ère','rédacteur':'rédacteur·rice','traducteur':'traducteur·rice','sapeur':'sapeur·se','pompier':'pompier·ère','développeur':'développeur·se','préparateur':'préparateur·rice','expert':'expert·e','attaché':'attaché·e','militaire':'militaire','psychologue':'psychologue','médecin':'médecin','pilote':'pilote','chef':'chef·fe','officier':'officier·ère','marin':'marin·e','sous-officier':'sous-officier·ère','comptable':'comptable','surveillant':'surveillant·e','intervenant':'intervenant·e','réparateur':'réparateur·rice','mécanicien':'mécanicien·ne','architecte':'architecte','photographe':'photographe','journaliste':'journaliste','accueillant':'accueillant·e','jardinier':'jardinier·ère','cuisinier':'cuisinier·ère','boulanger':'boulanger·ère','pâtissier':'pâtissier·ère','maître':'maître·sse','président':'président·e','magistrat':'magistrat·e','avocat':'avocat·e','auditeur':'auditeur·rice','employé':'employé·e','électricien':'électricien·ne','électronicien':'électronicien·ne','plombier':'plombier·ère','éboueur':'éboueur·se','restaurateur':'restaurateur·rice','manipulateur':'manipulateur·rice','rééducateur':'rééducateur·rice','commissaire':'commissaire','médiateur':'médiateur·rice'}
def inclusive(s):
    if '/' in s or '·' in s:return s
    def repl(m):
        old=m[0]; new=PAIRS.get(old.lower(),old)
        return new[0].upper()+new[1:] if old[0].isupper() else new
    return re.sub(r"[\wÀ-ÿ]+(?:-[\wÀ-ÿ]+)?",repl,s)

def score_page(i):
    p=get(SCORE+'?items_per_page=30&page='+str(i))
    return [urljoin(BASE,a.get('href')) for a in p.xpath('//h3/a[contains(@href,"/calendrier-general-concours/")]')]
def score_detail(url):
    p=get(url); main=p.xpath('//main')[0]
    h=main.xpath('.//h1'); name=text(h[0]) if h else ''
    entire=text(main)
    cat=re.search(r'Catégorie statutaire\s*:\s*Catégorie (A\+|A|B|C)',entire)
    voie=re.search(r"Voie d'accès\s*:\s*(.*?)\s*Employeur",entire)
    rows={}
    for tr in main.xpath('.//tr'):
        cells=tr.xpath('./th|./td')
        if len(cells)>=2:rows[norm(text(cells[0]))]=text(cells[1])
    def val(fragment):return next((v for k,v in rows.items() if fragment in k),'')
    opening=val('ouverture');closing=val('cloture');written=val('ecrites');oral=val('orales')
    if not closing:
        m=re.search(r'Date de clôture des inscriptions\s*:\s*(.*?)(?:Calendrier|Modalités|$)',entire)
        closing=m[1] if m else ''
    return {'id':'score-'+url.rsplit('/',1)[1],'name':inclusive(name),'rawName':name,'cat':cat[1] if cat else 'V','fp':'E','voie':voie[1] if voie else 'Voir l’avis','url':url,'source':'SCORE','checked':CHECKED,'open':iso(opening),'date':iso(closing),'openLabel':opening,'closeLabel':closing,'writtenLabel':written,'oralLabel':oral,'written':iso(written),'oral':iso(oral)}

def ars_page(i):
    p=get(ARS+'/home?page='+str(i)+'&size=10')
    out=[]
    for a in p.xpath('//h2/a[contains(@href,"/consulter/concours/")]'):
        card=a.getparent().getparent();s=text(card)
        dates=re.findall(r'(\d{2}-\d{2}-20\d\d)',s)
        labels=card.xpath('.//*[contains(@class,"fr-card__desc")]')
        parts=[text(x) for x in labels[0].xpath('./div/div')] if labels else []
        name=text(a);n=norm(name)
        cat='C' if any(w in n for w in ['ouvrier','entretien','agent de maitrise','ambulancier','hospitaliers qualifies','blanchisseur']) else ('B' if any(w in n for w in ['technicien','adjoint des cadres','medico-administratif','moniteur','animateur','aide-soignant','auxiliaire de puericulture']) else ('A' if any(w in n for w in ['infirmier','ingenieur','psychologue','cadre de sante','attache','directeur','ergotherapeute','psychomotricien','masseur','assistant socio','educateur','orthophoniste','orthoptiste','manipulateur','sage-femme','dieteti','conseiller en economie']) else 'V'))
        out.append({'id':'fph-'+a.get('href').rsplit('/',1)[1],'name':inclusive(name),'rawName':name,'cat':cat,'fp':'H','voie':'Concours hospitalier · consulter l’avis','url':urljoin(ARS,a.get('href')),'source':'ARS','checked':CHECKED,'date':iso(dates[1]) if len(dates)>1 else None,'written':iso(dates[0]) if dates else None,'writtenLabel':dates[0] if dates else '', 'closeLabel':dates[1] if len(dates)>1 else '', 'location':parts[0] if parts else '', 'employer':parts[1] if len(parts)>1 else ''})
    return out

def import_calendar():
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
        total_text=text(get(SCORE));total=int(re.search(r'(\d+) r[ée]sultat',total_text)[1]);pages=(total+29)//30
        urls=sorted(set(u for page in ex.map(score_page,range(pages)) for u in page))
        score=list(ex.map(score_detail,urls))
        total_ars=int(re.search(r'(\d+) concours trouv',text(get(ARS)))[1]);ars=[x for page in ex.map(ars_page,range(1,(total_ars+9)//10+1)) for x in page]
    ars=list({x['id']:x for x in ars}.values())
    Path(ROOT/'calendar-import.json').write_text(json.dumps(score+ars,ensure_ascii=False))
    print('SCORE',len(score),'ARS',len(ars),flush=True)


if __name__=='__main__':
    import argparse, sys
    from import_workbook import publish, load_catalogue
    parser=argparse.ArgumentParser(description='Actualiser SCORE et ARS en conservant les liens validés.');parser.add_argument('--check',action='store_true');args=parser.parse_args()
    # Cache quotidien : ne pas réutiliser une ancienne copie d’un avis modifié.
    CACHE=ROOT/'source-cache'/CHECKED;CACHE.mkdir(parents=True,exist_ok=True)
    import_calendar()
    db=load_catalogue();new=json.loads((ROOT/'calendar-import.json').read_text());old={c['id']:c for c in db['calendar']}
    patterns={r['id']:r for r in db['routes']}
    for c in new:
        previous=old.get(c['id'],{});rec=dict(previous);rec.update(c)
        # Conserver les rattachements manuels ; compléter les nouveaux avis par les règles des corps.
        ids=list(previous.get('routeIds',[]))
        if not ids:
            for r in db['routes']:
                if c['fp'] in r['fp'] and r.get('matchPattern') and re.search(r['matchPattern'],norm(c.get('rawName',c['name'])).replace('’',"'"),re.I):ids.append(r['id'])
        if not ids:
            name=norm(c.get('rawName',c['name'])).replace('’',"'")
            rid='corps-'+hashlib.sha1((c['fp']+'|'+name).encode()).hexdigest()[:12]
            if rid not in patterns:
                route={'id':rid,'name':c['name'],'cat':c['cat'],'lvl':None,'fp':c['fp'],'access':c['voie'],'cal':'','prep':'','source':c['url'],'matchPattern':'^'+re.escape(name)+'$'}
                db['routes'].append(route);patterns[rid]=route
            ids=[rid]
        rec['routeIds']=sorted(set(ids));old[c['id']]=rec
    db['calendar']=list(old.values());db['checked']=CHECKED
    # Les métiers, corps, notes de validation et correspondances ne sont jamais remplacés par ce rafraîchissement.
    if not args.check:publish(db)
    print(('Contrôle sans écriture' if args.check else 'Actualisation terminée')+f" : {len(new)} avis SCORE/ARS, {len(db['links'])} correspondances conservées.")
