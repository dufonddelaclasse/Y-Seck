"""Importer le classeur interne sans casser les identifiants et correspondances.
Usage : python3 scripts/import_workbook.py /chemin/Y-Seck_base_interne.xlsx --check
Retirer --check pour générer data/catalogue.json et js/catalog-data.js.
"""
import argparse, copy, datetime, json, re
from pathlib import Path
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
JOB_FIELDS = ['id','origin','rmfpCode','name','sourceName','domain','rmfpDomain','family','fp','categories','lvl','access','source','qualification','aliases','traits','prep','cal','steps','active']
ROUTE_FIELDS = ['id','name','cat','lvl','fp','access','cal','prep','source','matchPattern']
LINK_FIELDS = ['id','jobId','routeId','status','source','note']
EXAM_FIELDS = ['id','name','cat','fp','voie','open','date','openLabel','closeLabel','writtenLabel','oralLabel','location','employer','url','source','checked','routeIds','provisional']

def rows(wb, name):
    if name not in wb.sheetnames: raise ValueError('Onglet manquant : '+name)
    values=list(wb[name].values)
    return [list(r) for r in values[1:] if r and r[0] is not None]
def string(v): return '' if v is None else str(v)
def parts(v): return [p.strip() for p in string(v).split('|') if p.strip()]
def boolean(v):
    if v in [True,1,'TRUE','true','VRAI','oui','Oui']: return True
    if v in [False,0,'FALSE','false','FAUX','non','Non',None,'']:return False
    raise ValueError('Booléen invalide : '+str(v))
def date(v):
    if not v:return None
    if isinstance(v,(datetime.date,datetime.datetime)):return v.isoformat()[:10]
    value=str(v).strip();datetime.date.fromisoformat(value);return value
def level(v):
    if v is None or v=='':return None
    n=int(v)
    if n<0 or n>6:raise ValueError('Niveau minimum attendu de 0 à 6, ou vide si non déterminé.')
    return n
def unique(records,label):
    ids=[r['id'] for r in records]
    if len(set(ids))!=len(ids):raise ValueError('Identifiants en double dans '+label)
    if any(not re.fullmatch(r'[A-Za-z0-9_:.+\-]+',x) for x in ids):raise ValueError('Identifiant invalide dans '+label)
def source_url(value):
    if value and not str(value).startswith('https://'):raise ValueError('Une source doit être une URL HTTPS : '+str(value))
    if any(c in str(value) for c in ['"','<','>','\n','\r']):raise ValueError('Caractère interdit dans une URL source.')

def read_workbook(path, db):
    result=copy.deepcopy(db);wb=load_workbook(path,data_only=False,read_only=True)
    job_by_id={j['id']:copy.deepcopy(j) for j in result['legacyJobs']+result['rmfp']}
    edited=[]
    for row in rows(wb,'Metiers'):
        row+= [None]*(len(JOB_FIELDS)-len(row));values=dict(zip(JOB_FIELDS,row))
        id=string(values['id']);j=job_by_id.get(id,{'id':id,'traits':[],'lvl':None,'cat':'V'})
        origin=string(values.pop('origin'))
        if origin not in ['RMFP','Accès']:raise ValueError('Origine invalide pour '+id)
        for k,v in values.items():
            if k in ['categories','aliases','traits']:j[k]=parts(v)
            elif k=='steps':j[k]=[s.strip() for s in string(v).splitlines() if s.strip()]
            elif k=='lvl':j[k]=level(v)
            elif k=='active':j[k]=boolean(v)
            else:j[k]=string(v)
        if not j['name'] or not j['domain']:raise ValueError('Intitulé ou domaine manquant : '+id)
        if any(c not in ['A+','A','B','C','X','V'] for c in j['categories']):raise ValueError('Catégorie invalide : '+id)
        if not j['fp'] or any(c not in 'ETH' for c in j['fp']):raise ValueError('Versant invalide : '+id)
        if j['source']:source_url(j['source'])
        j['cat']=j['categories'][0] if len(j['categories'])==1 else 'V'
        edited.append((origin,j))
    # Une ligne supprimée du classeur est conservée. Utiliser Actif = FALSE pour masquer.
    unique([j for _,j in edited],'Metiers')
    originals={j['id']:('RMFP' if j.get('rmfpCode') else 'Accès',j) for j in result['legacyJobs']+result['rmfp']}
    originals.update({j['id']:(origin,j) for origin,j in edited})
    result['rmfp']=[j for origin,j in originals.values() if origin=='RMFP'];result['legacyJobs']=[j for origin,j in originals.values() if origin=='Accès']
    jobs={j['id']:j for _,j in originals.values()}
    for row in rows(wb,'Contenus'):
        id,jid,field,value=(row+[None]*4)[:4]
        if jid not in jobs:raise ValueError('Contenu sans métier : '+str(jid))
        if field not in ['desc','activities','conditions','knowledge','skills','qualities']:raise ValueError('Champ de contenu inconnu : '+str(field))
        jobs[jid][field]=string(value)
    for name,key,fields in [('CorpsGrades','routes',ROUTE_FIELDS),('Correspondances','links',LINK_FIELDS),('Concours','calendar',EXAM_FIELDS)]:
        records={r['id']:r for r in result[key]}
        seen=[]
        for row in rows(wb,name):
            row += [None]*(len(fields)-len(row));values=dict(zip(fields,row));id=string(values['id']);seen.append({'id':id});rec=records.get(id,{'id':id})
            old=copy.deepcopy(rec)
            if name=='Concours' and old.get('checked') and date(values.get('checked')) and date(values['checked'])<old['checked']:
                raise ValueError('Classeur plus ancien que la base pour '+id+' : réexporter le classeur avant de continuer.')
            for k,v in values.items():
                if k in ['open','date','checked']:rec[k]=date(v)
                elif k=='lvl':rec[k]=level(v)
                elif k=='routeIds':rec[k]=parts(v)
                elif k=='provisional':rec[k]=boolean(v)
                else:rec[k]=string(v)
            if name=='Correspondances' and old.get('status')=='validé' and rec.get('status')=='proposé':rec['status']='validé'
            for field,label in [('open','openLabel'),('date','closeLabel')]:
                if field in fields and rec.get(field)!=old.get(field) and rec.get(label)==old.get(label):rec[label]=rec.get(field) or ''
            for k in ['url','source']:
                if rec.get(k) and str(rec[k]).startswith('http'):source_url(rec[k])
            records[id]=rec
        unique(seen,name);result[key]=list(records.values())
    unique(list(jobs.values()),'Metiers')
    route_ids={r['id'] for r in result['routes']}
    for r in result['routes']:
        if r.get('matchPattern'):re.compile(r['matchPattern'])
    for l in result['links']:
        if l['jobId'] not in jobs or l['routeId'] not in route_ids:raise ValueError('Correspondance orpheline : '+l['id'])
        if l['status'] not in ['proposé','validé','rejeté']:raise ValueError('Statut inconnu : '+l['id'])
        if l['status']=='validé' and not l.get('source'):raise ValueError('Source manquante pour le lien validé : '+l['id'])
        source_url(l.get('source'))
    for c in result['calendar']:
        if any(id not in route_ids for id in c.get('routeIds',[])):raise ValueError('Corps inconnu dans le concours '+c['id'])
        if c.get('open') and c.get('date') and c['open']>c['date']:raise ValueError('Ouverture après clôture : '+c['id'])
        source_url(c.get('url'))
        if c.get('cat') not in ['A+','A','B','C','V','X']:raise ValueError('Catégorie de concours invalide : '+c['id'])
    preps={t['id']:('talents',t) for t in result['talents']}
    for group,entries in result['otherPreps'].items():preps.update({t['id']:(group,t) for t in entries})
    for row in rows(wb,'Preparations'):
        id,group,name,city,cp,conc,online,lon,lat,note,url=(row+[None]*11)[:11]
        if group not in ['talents','ipag','iep','privees']:raise ValueError('Type de préparation inconnu : '+str(group))
        t=preps.get(id,(group,{}))[1];t.update(id=string(id),name=string(name),city=string(city),online=boolean(online))
        if group=='talents':t.update(cp=string(cp),concours=parts(conc),coords=[float(lon),float(lat)] if lon is not None and lat is not None else None)
        else:t.update(dep=string(cp),tags=string(conc),note=string(note))
        if url:t['source']=string(url);source_url(url)
        preps[id]=(group,t)
    result['talents']=[t for group,t in preps.values() if group=='talents'];result['otherPreps']={g:[t for group,t in preps.values() if group==g] for g in ['ipag','iep','privees']}
    unique([t for _,t in preps.values()],'Preparations')
    result['sources']=[dict(zip(['id','name','url','checked','note'],row[:5])) for row in rows(wb,'Sources')]
    for source in result['sources']:source['checked']=date(source['checked']);source_url(source['url'])
    for path,type,value in [r[:3] for r in rows(wb,'Reglages')]:
        keys=path.split('.');target=result['settings']
        for k in keys[:-1]:target=target[int(k)] if isinstance(target,list) else target[k]
        k=int(keys[-1]) if isinstance(target,list) else keys[-1]
        if isinstance(target,list) and k==len(target):target.append(None)
        target[k]=boolean(value) if type=='boolean' else (float(value) if type=='number' else (None if type=='object' and value is None else string(value)))
    for j in jobs.values():
        if j['domain'] not in result['settings']['domains']:raise ValueError('Domaine absent des réglages : '+j['domain'])
    result['checked']=datetime.date.today().isoformat()
    return result

def load_catalogue():
    manifest=json.loads((ROOT/'data/catalogue.json').read_text())
    if 'parts' not in manifest:return manifest
    result={}
    for part in manifest['parts']:
        data=json.loads((ROOT/'data'/part).read_text())
        for key,value in data.items():
            if isinstance(value,list):result.setdefault(key,[]).extend(value)
            else:result[key]=value
    return result

def publish(db):
    target=ROOT/'data/catalogue.json';backup=ROOT/'work/backups';backup.mkdir(parents=True,exist_ok=True)
    if target.exists():(backup/(datetime.datetime.now().strftime('%Y%m%d-%H%M%S')+'-catalogue.json')).write_text(json.dumps(load_catalogue(),ensure_ascii=False))
    folder=ROOT/'data/catalogue';folder.mkdir(parents=True,exist_ok=True)
    parts=[];meta={k:v for k,v in db.items() if not isinstance(v,list)}
    (folder/'metadata.json').write_text(json.dumps(meta,ensure_ascii=False,separators=(',',':'))+'\n');parts.append('catalogue/metadata.json')
    for key,records in db.items():
        if not isinstance(records,list):continue
        batches=[];batch=[];length=0
        for record in records:
            size=len(json.dumps(record,ensure_ascii=False,separators=(',',':')))
            if batch and length+size>85000:batches.append(batch);batch=[];length=0
            batch.append(record);length+=size
        if batch:batches.append(batch)
        for i,batch in enumerate(batches):
            name=key+'-'+str(i+1).zfill(2)+'.json';(folder/name).write_text(json.dumps({key:batch},ensure_ascii=False,separators=(',',':'))+'\n');parts.append('catalogue/'+name)
    target.write_text(json.dumps({'version':db['version'],'checked':db['checked'],'parts':parts},ensure_ascii=False,indent=2)+'\n')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('classeur',type=Path);parser.add_argument('--check',action='store_true');args=parser.parse_args()
    db=load_catalogue();updated=read_workbook(args.classeur,db)
    if not args.check:publish(updated)
    print(('Contrôle réussi' if args.check else 'Base mise à jour')+f" : {len(updated['rmfp'])} métiers RMFP, {len(updated['routes'])} corps, {len(updated['links'])} correspondances et {len(updated['calendar'])} sessions.")
