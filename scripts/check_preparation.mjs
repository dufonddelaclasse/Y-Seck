import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Exerce les écrans avec le catalogue réel, sans serveur ni navigateur.
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('data/catalogue.json', root), 'utf8'));
const db = process.env.CATALOGUE_TEST_FILE ? JSON.parse(fs.readFileSync(process.env.CATALOGUE_TEST_FILE,'utf8')) : {};
for (const part of process.env.CATALOGUE_TEST_FILE ? [] : manifest.parts) {
  const data = JSON.parse(fs.readFileSync(new URL('data/' + part, root), 'utf8'));
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) (db[key] ||= []).push(...value); else db[key] = value;
  }
}
const listeners = {};
const app = {addEventListener(){}, querySelector(){return null;}, querySelectorAll(){return [];}, classList:{toggle(){}}};
const location = {hash:'#/metiers'};
const context = {
  window:{PUBLIC_DATA:db, addEventListener(){}, scrollTo(){}}, location,
  document:{getElementById(id){return id==='app'?app:null;}, addEventListener(type,fn){listeners[type]=fn;}, documentElement:{dataset:{}}, activeElement:null},
  localStorage:{getItem(){return null;},setItem(){}},
  matchMedia(){return {matches:false};}, setTimeout(){return 0;}, clearTimeout(){},
};
vm.createContext(context);
for (const file of ['js/data.js','js/catalog.js','js/ui.js']) vm.runInContext(fs.readFileSync(new URL(file,root),'utf8'),context);
context.window.YSECK_UI.afterRender=()=>{};
let source=fs.readFileSync(new URL('js/app.js',root),'utf8');
source=source.replace('  UI.init();\n  render();\n  booted = true;', '  window.tests={screens,S,filteredJobs,jobFilters,jobCategories,isContractJob,prepHref,examsFor,calendarCategory,calendarRows,indicativeCategories,jobRow,tabbar,categoryBooks,bookList,studyResources,expandedPrepCategories,sig,selCats,myJobs,ALL_CATS,D,jobRefs,concoursJobs};');
vm.runInContext(source,context);
const {screens,S,filteredJobs,jobFilters,jobCategories,isContractJob,prepHref,examsFor,calendarCategory,calendarRows,indicativeCategories,jobRow,tabbar,categoryBooks,bookList,studyResources,expandedPrepCategories,sig,selCats,myJobs,ALL_CATS,D,jobRefs,concoursJobs}=context.window.tests;
const data=context.window.DATA;
Object.assign(S,{profile:'etu',name:'Test',level:'Doctorat',domains:[],metDomains:[],traits:[],budget:'Plus de 1 000 €',prepBudget:'2',boursier:'Non'});
const fixed=data.jobs.filter(j=>['A+','A','B','C'].includes(j.cat)&&!isContractJob(j)&&!j.recruitment);
let counts={};
// Cartes « Concours et dates » : la fiche métier passe en frise, les cartes restent sur la fiche partagée.
const cards=id=>screens.fiche(id);
for (const j of fixed) {
  // Carte repliée par défaut quand plusieurs concours existent : elle n’affiche que les informations de base.
  const folded=cards(j.id);
  const multiple=(folded.match(/class="prep-count"/g)||[]).length>0;
  assert.equal(folded.includes('class="cat-panel"'),!multiple||(folded.match(/class="cat-panel"/g)||[]).length>0,'Pliage : '+j.id);
  expandedPrepCategories[j.id]={[j.cat]:true};
  // La fiche concours (versants, niveau, organisateur, dates) est sur la fiche métier ; Se préparer garde les aides et les prépas.
  const card=cards(j.id);
  const html=screens.preparer(j.id);
  assert(html.includes('<h1>Se préparer</h1>'),j.id);
  assert(html.includes('href="#/metier/'+j.id+'"'),j.id);
  assert(!html.includes('>Pour vos choix<'),j.id);
  assert(!html.includes('href="#/sans-concours'),j.id);
  const routes=j.routeIds.map(id=>data.accessRoutes[id]).filter(r=>r.cat===j.cat&&r.fp.split('').some(fp=>j.fp.includes(fp)));
  assert(!html.includes('data-fp="'),'Pas de fiche concours dans Se préparer : '+j.id);
  for(const f of ['E','T','H'])assert.equal(card.includes('data-fp="'+f+'"'),j.fp.includes(f)&&(!routes.length||routes.some(r=>r.fp.includes(f))),'Versant non pertinent : '+j.id+' '+f);
  assert(card.indexOf('preparation-fps')<card.indexOf('preparation-level'),'Le niveau vient après le versant : '+j.id);
  assert(!screens.etudes(j.id).includes('<dl class="profile">'),'Les lignes Diplôme / Accès sont retirées de l’orientation : '+j.id);
  assert(html.includes('Recommandations bibliographiques'),'Bibliographie : '+j.id);
  assert(html.includes('href="#/annales/'+j.id+'"'),'Annales : '+j.id);
  assert.equal(card.includes('href="#/calendrier/'+j.id+'"'),examsFor(j).length>0,'Dates : '+j.id);
  assert(!html.includes('href="#/etudes/'+j.id+'"'),'Le parcours d’études figure sur la fiche métier, pas dans Se préparer : '+j.id);;
  assert(html.includes('href="#/handicap/'+j.id+'"'));
  assert(html.includes('role="group" aria-label="Budget"'));
  assert(html.includes('>Aides</h2>')&&html.includes('>Prépas</h2>')&&!html.includes('Prépas et aides'),'Aides et prépas séparées : '+j.id);
  for(const match of card.matchAll(/<section class="exam exam-route"[^>]*>([\s\S]*?)<\/section>/g)){
    const exam=match[1];
    assert.equal((exam.match(/<h4>/g)||[]).length,1,'Un concours par encart blanc : '+j.id);
    const fields=['<h4>','Organisé par','exam-cal','En métropole','En outre-mer','official-exam-links'];
    for(let i=1;i<fields.length;i++)assert(exam.indexOf(fields[i])>exam.indexOf(fields[i-1]),'Organisation de l’encart concours : '+j.id+' '+fields[i]);
  }
  assert(!html.includes('href="#/prepa/talents'),'Talents masqués pour les non-boursiers : '+j.id);
  for(const session of examsFor(j,true))assert.equal(calendarCategory(session,j),j.cat,'Date d’une autre catégorie dans '+j.id+' : '+session.name);
  for(const rid of j.routeIds){const r=data.accessRoutes[rid];if(r.cat===j.cat)for(const fp of r.fp)if(j.fp.includes(fp)){
    assert(r.examInfo[fp]?.name&&r.examInfo[fp]?.org&&r.examInfo[fp]?.metro&&r.examInfo[fp]?.om,'Organisation du concours : '+rid+' '+fp);
    assert(card.includes(sig(r.examInfo[fp].name))||card.includes(sig((/^concours\b/i.test(r.examInfo[fp].name)?'':'Concours : ')+r.examInfo[fp].name)),'Nom du concours affiché : '+rid);
  }}
  counts[j.cat]=(counts[j.cat]||0)+1;
}
assert(fixed.some(j=>examsFor(j).length>0),'Un cas avec dates doit être vérifié.');
assert(fixed.some(j=>examsFor(j).length===0),'Un cas sans date doit être vérifié.');
// Régression INSP / inspecteurs : une route partagée ne suffit jamais à changer la catégorie d’un avis.
const administrator=data.jobs.find(j=>j.id==='admin-etat');
assert(cards('admin-terr').includes('Fonction publique territoriale')&&!cards('admin-terr').includes('Fonction publique de l’État'));
assert(cards('admin-etat').includes('Fonction publique de l’État'));
S.level='Bac+3';
assert(cards('admin-terr').includes('Niveau d’étude compatible'));
assert(cards('ingenieur-terr').includes('Niveau Bac+5 requis')&&!cards('ingenieur-terr').includes('Niveau d’étude compatible'),'Le niveau du concours prime sur le minimum de la catégorie.');
assert(!cards('atsem').includes('Niveau d’étude compatible'),'Un niveau compatible ne prouve pas le diplôme spécifique requis.');
assert(cards('fpsan014').includes('Diplôme requis')&&!cards('fpsan014').includes('Niveau d’étude compatible'),'La qualification du concours est conservée pour les métiers RMFP réglementés.');
S.level=null;
assert(cards('admin-terr').includes('Niveau Bac+3 requis'));
S.level='Doctorat';
const wrongSession={id:'regression-category',name:'Concours inspecteur B',cat:'B',fp:'E',voie:'Concours externe',date:'2099-01-01',routeIds:['admin-etat']};
data.calendar.push(wrongSession);
assert(!examsFor(administrator,true).some(c=>c.id===wrongSession.id));
data.calendar.pop();
for(const session of data.calendar)for(const rid of session.routeIds){const r=data.accessRoutes[rid];assert(r.fp.includes(session.fp));assert(session.cat==='V'||r.cat===session.cat,'Corps du calendrier incompatible : '+session.id+' '+rid);}
const example=data.calendar.find(c=>c.cat==='A+'&&c.fp==='E');
const externalFirst=calendarRows([{...example,name:'Interne avant',voie:'Concours interne',date:'2026-01-01'},{...example,name:'Externe après',voie:'Concours externe',date:'2027-01-01'}]);
assert(externalFirst.indexOf('Externe après')<externalFirst.indexOf('Interne avant'),'Les concours externes précèdent les internes, même si leur date est ultérieure.');
const communicator=data.jobs.find(j=>j.id==='fpcom018');
assert.deepEqual(Array.from(indicativeCategories(communicator)),['A','B']);
assert(jobRow(communicator).includes('job-categories')&&!jobRow(communicator).includes('Var.'));
assert.equal(communicator.cat,'V');assert.equal(prepHref(communicator),'#/preparer/'+communicator.id);
assert(screens.preparer(communicator.id).includes('<h1>Se préparer</h1>')&&screens.preparer(communicator.id).includes(communicator.name));
const communicationPrep=cards(communicator.id);
assert(communicationPrep.includes('data-action="openPrepCat" data-v="A"')&&communicationPrep.includes('data-action="openPrepCat" data-v="B"'));
assert(!communicationPrep.includes('data-action="openPrepCat" data-v="A+"')&&!communicationPrep.includes('data-action="openPrepCat" data-v="C"'));
const openState=(jobId,cat)=>cards(jobId).includes('id="prep-'+jobId+'-'+(cat==='A+'?'cat-Ap':'cat-'+cat)+'"');
const singleRoute=fixed.find(j=>j.fp.length===1&&j.routeIds.length===1),manyRoutes=fixed.find(j=>j.id==='adjoint-adm');
delete expandedPrepCategories[singleRoute.id];delete expandedPrepCategories[manyRoutes.id];
assert(openState(singleRoute.id,singleRoute.cat),'Un seul concours : la carte est dépliée.');
assert(!openState(manyRoutes.id,manyRoutes.cat)&&cards(manyRoutes.id).includes('3 concours possibles'),'Plusieurs concours : la carte est repliée.');
const singleVariable=data.jobs.find(j=>j.cat==='V'&&jobCategories(j).length===1);
assert(singleVariable&&!jobRow(singleVariable).includes('job-categories')&&!jobRow(singleVariable).includes('cat sm'),'Une catégorie VAR unique garde la taille normale.');
const purchaseJob=data.jobs.find(j=>j.id==='fpach001');
assert(!screens.etudes(purchaseJob.id).includes('Rédacteur·rice territorial·e')&&!screens.etudes(purchaseJob.id).includes('Secrétaire administratif·ve'),'L’orientation conserve uniquement les routes de la catégorie attribuée.');
const classified=data.jobs.filter(j=>j.cat==='V'&&jobCategories(j).length);
Object.assign(S,{level:null,metDomains:[],metFps:null});
for(const cat of ['A+','A','B','C']){S.metCats=[cat];const selected=filteredJobs();for(const j of classified)assert.equal(selected.some(x=>x.id===j.id),jobCategories(j).includes(cat),'Tri des catégories attribuées : '+j.id+' '+cat);}
Object.assign(S,{level:'Doctorat',metCats:null});
S.bookCategory='A+';assert(categoryBooks(communicator).every(b=>(b.categories||['A','A+']).includes('A')),'Une fiche A/B ne prend pas la bibliographie A+ sélectionnée sur une autre page.');
const inspDates=examsFor(administrator);
assert(inspDates.some(c=>c.id==='insp-2027-concours-externe'&&c.date<'2026-10-17'&&c.written>'2026-10-17'),'Une clôture passée ne masque pas les épreuves INSP2027 à venir.');
assert(data.accessRoutes['admin-etat'].examInfo.E.officialLinks.some(l=>l.url==='https://www.insp.gouv.fr/'));
assert(data.accessRoutes['admin-terr'].examInfo.T.officialLinks.some(l=>l.url==='https://inet.cnfpt.fr/'));
assert.equal(data.accessRoutes.attache.examInfo.E.officialLinks.filter(l=>/IRA de/.test(l.label)).length,5,'Les cinq instituts IRA sont accessibles.');
for(const r of Object.values(data.accessRoutes))for(const e of Object.values(r.examInfo||{})){
  assert(e.officialLinks?.length,'Liens officiels absents : '+e.id);
  assert(e.officialLinks.every(l=>l.url.startsWith('https://')&&!l.url.includes('calendrier-general-concours')),'Liens directs école ou organisateur : '+e.id);
}
const magistrate=data.jobs.find(j=>j.id==='fpjus016');assert(magistrate.routeIds.includes('magistrat-administratif')&&!magistrate.routeIds.includes('magistrat'));
S.prepBudget='1';
const fees=screens.preparer('aah');assert(fees.includes('Avec frais d’inscription')&&!fees.includes('Moins de 1 000')&&!fees.includes('Frais d’université'));
assert(fees.includes('href="#/prepa/ipag/')&&!fees.includes('href="#/prepa/privees/'));
S.prepBudget='2';
const contracts=data.jobs.filter(isContractJob);
assert.equal(contracts.length,db.legacyJobs.concat(db.rmfp).filter(j=>j.cat==='X'||j.cat==='CDD'||j.contractual===true).length,'Seuls les métiers contractuels identifiés sont reclassés.');
for (const j of contracts) {
  const html=screens.metier(j.id);
  assert(html.includes('cat-CDD'));
  assert(html.includes('href="#/sans-concours/'+j.id+'"'));
  assert(!html.includes('>Se préparer</a>'));
  assert(!html.includes('<h2>Dates des concours</h2>'));
  assert(screens['sans-concours'](j.id).includes('href="#/metier/'+j.id+'"'));
}
const variable=data.jobs.find(j=>j.cat==='V');
assert.equal(prepHref(variable),'#/preparer/'+variable.id);
assert(screens.preparer(variable.id).includes('<h1>Se préparer</h1>'));
assert.equal(variable.cat,'V');
Object.assign(S,{metCats:['CDD']});
assert.equal(filteredJobs().length,contracts.length);
S.metCats=['A+','A','B','C'];
assert(!filteredJobs().some(isContractJob));
function click(action,value=null){
  const el={getAttribute(name){return name==='data-action'?action:name==='data-v'?value:null;}};
  listeners.click({target:{closest(selector){return selector==='[data-action]'?el:null;}},detail:0,preventDefault(){}});
}
click('metCat','CDD');
assert(S.metCats.includes('CDD')&&filteredJobs().some(isContractJob),'Les contractuels s’ajoutent aux catégories choisies.');
click('metCat','CDD');
assert(!S.metCats.includes('CDD')&&!filteredJobs().some(isContractJob));
S.metCats=['B'];click('metCat','B');
assert.deepEqual(S.metCats,['B'],'Au moins une catégorie reste choisie.');
for(const level of ['Bac+3','Doctorat']){
  S.level=level;S.metCats=null;
  assert.deepEqual([...selCats()],['A+','A','B'],level+' : seules A+, A et B sont cochées par défaut.');
  assert(!filteredJobs().some(isContractJob)&&!filteredJobs().some(j=>jobCategories(j).length&&jobCategories(j).every(c=>c==='C')),'À partir de Bac+3, C et contractuels ne sont pas affichés par défaut.');
  assert(!myJobs().some(isContractJob),'À partir de Bac+3, l’accueil ne compte pas les contractuels.');
}
click('metCat','C');
assert(filteredJobs().some(j=>jobCategories(j).includes('C')),'La catégorie C reste disponible à partir de Bac+3.');
S.level='Bac+1 / +2';S.metCats=null;
assert.deepEqual([...selCats()],[...ALL_CATS],'Avant Bac+3, toutes les catégories sont cochées.');
{
  const saved=S.domains;S.domains=[];
  const contractRanked=D.jobs.filter(isContractJob)[0];
  /* Même un contractuel au meilleur score laisse les quatre premières places aux catégories A+ à C. */
  S.traits=(contractRanked.traits||[]).slice();
  for(const list of [filteredJobs(),myJobs()]){
    assert(list.some(isContractJob),'Des contractuels restent proposés.');
    assert(!list.slice(0,4).some(isContractJob),'Les contractuels arrivent à partir de la 5e place.');
  }
  S.domains=saved;S.traits=[];
}
S.metCats=null;S.metFps=['E','T'];
assert(filteredJobs().every(j=>/[ET]/.test(j.fp)),'Plusieurs versants peuvent être choisis.');
S.metFps=null;
const filters=jobFilters();
const labels=['Votre sélection','Catégories','Versants','Domaines'];
for(let i=1;i<labels.length;i++)assert(filters.indexOf(labels[i-1])<filters.indexOf(labels[i]));
assert(filters.includes('data-v="CDD"'));
assert.equal((tabbar('accueil').match(/<a /g)||[]).length,4,'Menu : Accueil, Explorer, Favoris et Profil.');
assert(tabbar('metiers').includes('>Explorer</a>')&&tabbar('concours-liste').includes('class="on" aria-current="page">')&&tabbar('concours-liste').includes('>Explorer</a>'),'Métiers et concours allument l’onglet Explorer.');
assert(!tabbar('accueil').includes('href="#/concours"'));
assert(screens.accueil().includes('href="#/concours"'),'Le tableau de bord conserve l’accès concours.');
assert(screens.etudes('greffier').includes('École nationale des greffes'));
assert(screens.etudes('greffier').includes('href="#/preparer/greffier"'));
assert(screens.prepa('privees','greffier').includes('href="#/preparer/greffier"'));
assert(!screens.prepa('privees','greffier').includes('Ipesup'));
assert(screens.bibliographie('greffier').includes('href="#/ressources-biblio/greffier"'));
assert(screens.handicap('dev').includes('href="#/sans-concours/dev"'));
Object.assign(S,{calCat:'A',calFp:'Tous',calQ:'',calView:'upcoming'});
const hospitalJob=data.jobs.find(j=>j.id==='aah');
assert(screens.calendrier(hospitalJob.id).includes(examsFor(hospitalJob).length+' sessions'),'Le filtre A doit conserver les sessions liées dont la source ne précisait pas la catégorie.');
S.boursier='Oui';
assert(!screens.preparer('magasinier').includes('class="bourse"'),'Pas de bourse Talents recommandée à une préparation de catégorie C.');
assert(!screens.preparer('magasinier').includes('href="#/prepa/talents'));
assert.equal(JSON.stringify(data.crosswalk),JSON.stringify(db.links));
const additions=data.books.filter(b=>b.id.startsWith('vp-book-'));
assert.equal(additions.length,29);
assert.equal(new Set(additions.map(b=>b.url)).size,29);
const aJob=data.jobs.find(j=>j.id==='aah'),apJob=data.jobs.find(j=>j.id==='admin-etat');
assert.equal(categoryBooks(aJob).length,156,'Les six ouvrages déjà présents ne doivent pas être affichés deux fois en A.');
assert.equal(categoryBooks(apJob).length,133,'La sélection A+ doit rester inchangée.');
for(const book of additions){
  assert.deepEqual(Array.from(book.categories),['A']);
  assert(book.authors&&book.year&&book.coverUrl&&book.subjects.length);
  assert(categoryBooks(aJob).some(b=>b.id===book.id));
  assert(!categoryBooks(apJob).some(b=>b.id===book.id));
}
Object.assign(S,{bookQ:'',bookSubject:'Toutes',bookCategory:'A+'});
assert(screens.bibliographie('aah').includes('156 ouvrages'),'Le métier A impose sa catégorie même après une visite en A+.');
assert(!screens.bibliographie('admin-etat').includes('Consulter la sélection Vie-publique'));
assert(screens.bibliographie().includes('aria-pressed="true" data-action="bookCategory" data-v="A+"'));
S.bookCategory='A';assert.equal(categoryBooks().length,156);
S.bookQ='questions contemporaines';
assert(bookList(aJob).includes('Questions contemporaines'));
S.bookQ='';S.bookSubject='Management public';assert(bookList(aJob).includes('Innovation publique'));
screens.bibliographie('admin-etat');assert.equal(S.bookSubject,'Toutes','Un thème propre à A ne doit pas masquer toute la sélection A+.');
assert(data.studyResources.length>1800);
assert.equal(new Set(data.studyResources.map(r=>r.url)).size,data.studyResources.length,'Un seul lien par document.');
assert(data.studyResources.every(r=>/^https?:\/\//.test(r.url)&&/^https:\/\//.test(r.sourceUrl)&&r.title&&!r.title.includes('opens in a new window')));
assert(data.studyResources.filter(r=>r.url.includes('Sujets_zero')).every(r=>r.kind==='entrainement'),'Les sujets zéro ne sont pas des annales de sessions passées.');
for(const cat of ['A+','A','B','C'])for(const fp of ['E','T','H']){
  assert(data.studyResources.some(r=>r.kind!=='bibliographie'&&r.categories.includes(cat)&&r.fps.includes(fp)),cat+' '+fp+' annales');
  assert(data.studyResources.some(r=>r.kind==='bibliographie'&&r.categories.includes(cat)&&r.fps.includes(fp)),cat+' '+fp+' bibliographies');
}
for(const j of fixed){
  const docs=studyResources(j,false,false);
  assert(docs.length,'Une source documentaire doit exister pour '+j.id);
  assert(docs.every(r=>r.categories.some(c=>j.cat===c)&&r.fps.some(f=>j.fp.includes(f))));
}
const hospitalDocs=studyResources(aJob,false,false);
assert(hospitalDocs.some(r=>r.sourceName==='Centre national de gestion'&&r.kind==='sujet'));
assert(!hospitalDocs.some(r=>r.concours==='Directeur d’hôpital - concours'),'Ne pas associer les sujets DH aux attachés hospitaliers.');
Object.assign(S,{resCat:'C',resFp:'E',resKind:'sujet',resYear:'Toutes',resQ:''});
assert(studyResources(null,false,true).length,'Des sujets C État doivent être indexés.');
assert(studyResources(null,false,true).every(r=>r.categories.includes('C')&&r.fps.includes('E')&&r.kind==='sujet'));
Object.assign(S,{resCat:'B',resFp:'T',resKind:'Tous',resYear:'2025',resQ:'rédacteur'});
assert(studyResources(null,false,true).length,'La recherche croisant concours, versant, catégorie et année fonctionne.');
assert.equal(categoryBooks(data.jobs.find(j=>j.id==='greffier')).length,0,'Ne pas proposer les manuels de rédacteur territorial aux greffiers.');
assert(categoryBooks(data.jobs.find(j=>j.id==='redacteur')).length>0);
assert(screens.annales('dev').includes('Entrer sans concours'));
console.log('Contrôles réussis :',counts,';',contracts.length,'CDD ;',classified.length,'VAR classés ; dates2027, versants, liens officiels, préparation personnalisée, aides, filtres et navigation.');
console.log('Bibliographie vérifiée : 29 références Vie-publique réservées à A, 6 doublons évités, 133 références A+ préservées.');
console.log('Ressources vérifiées :',data.studyResources.length,'liens uniques, 12 combinaisons catégorie/versant, filtres et associations par concours.');

// Parcours conseillé : point de départ selon le niveau, stages de 3e et de seconde, terminus sur le métier.
{
  const job=data.jobs.find(j=>j.id==='attache-terr');
  const level=(l)=>{S.level=l;return screens.metier(job.id);};
  const college=level('5e');
  assert(college.includes('class="trip"')&&college.includes('>Collège<')&&college.includes('Stage de 3e ?')&&college.includes('Stage de seconde ?')&&college.includes('Mon niveau<span class="study-level">')&&college.includes('<span>5e</span>'),'Collégien : collège, lycée et supérieur.');
  const lycee=level('Seconde');
  assert(!lycee.includes('>Collège<')&&lycee.includes('Stage de seconde ?')&&!lycee.includes('Stage de 3e ?'),'Lycéen : le collège disparaît.');
  const etudiant=level('Bac+1 / +2');
  assert(!etudiant.includes('>Lycée<')&&etudiant.includes('Mon niveau<span class="study-level">')&&etudiant.includes('<span>Bac+1 / +2</span>'),'Étudiant : études supérieures seulement.');
  const adulte=level('Sans diplôme');
  assert(adulte.includes('>Lycée<')&&adulte.includes('Études supérieures'),'Adulte sans diplôme : lycée puis études.');
  assert(adulte.includes('trip-item end')&&adulte.includes(job.name),'Le terminus est le métier.');
  assert(!screens.preparer(job.id).includes('class="trip"'),'La frise n’apparaît pas dans Se préparer.');
  S.level='Doctorat';
  console.log('Parcours vérifiés : collège, lycée, supérieur, adultes et terminus.');
}

// Référentiel du 18 octobre 2026 : concours rattachés, fiche concours, Se préparer, Évoluer et recherche.
{
  const ref=data.concours;
  for(let n=1;n<=61;n++)assert(ref.some(c=>Number(c.id.slice(2))===n),'Concours du référentiel du 18 octobre : '+n);
  assert(ref.length>=94,'Les 61 concours du référentiel et les écoles du service public (22 octobre 2026) sont chargés.');
  for(const c of ref)assert(c.routeIds.every(id=>data.accessRoutes[id]),'Corps du concours '+c.id);
  assert(!JSON.stringify(ref).includes('onglet'),'Aucun renvoi interne au classeur n’est affiché.');
  assert(!JSON.stringify(ref).match(/\d+ ?%/),'Aucun taux de réussite n’est repris.');
  const linked=data.jobs.filter(j=>j.rmfpCode&&!isContractJob(j)&&jobCategories(j).length).filter(j=>{
    const cats=jobCategories(j);return j.routeIds.map(id=>data.accessRoutes[id]).some(r=>r&&cats.includes(r.cat)&&r.fp.split('').some(f=>j.fp.includes(f)));});
  const classified=data.jobs.filter(j=>j.rmfpCode&&!isContractJob(j)&&jobCategories(j).length);
  const unexplained=classified.filter(j=>!linked.includes(j)&&!j.recruitment);
  assert(unexplained.length<=5,'Chaque fiche a un concours de sa catégorie ou une explication du recrutement : '+unexplained.map(j=>j.id).join(', '));
  S.level='Bac+3';
  const fiche=screens.metier('attache');
  assert(fiche.includes('Quelles voies ?')&&fiche.includes('3e concours')&&/À partir de (la session )?2027/.test(fiche),'La fiche métier reprend les voies expliquées et les épreuves documentées.');
  assert(fiche.includes('Administrateur - Administratrice de l’État'),'Évoluer suit les progressions du référentiel, avec les intitulés au masculin et au féminin.');
  const prep=screens.preparer('attache');
  assert(prep.includes('id="concours-ref"')&&prep.includes('Préparation conseillée')&&prep.includes('Page officielle du concours')&&!prep.includes('Études utiles'),'Se préparer présente la préparation conseillée et la page officielle du concours.');
  S.level='Seconde';
  assert(screens.preparer('attache').includes('id="stages"'),'Les élèves de seconde reçoivent les conseils de stage.');
  assert(screens.metier('attache').includes('Quelles spécialités ?')&&screens.metier('attache').includes('conseillées, jamais obligatoires'),'La frise reprend les spécialités conseillées.');
  S.level='Doctorat';
  Object.assign(S,{domains:['Numérique'],metDomains:['Numérique'],metCats:null,metFps:null,q:'administrateur de l\'etat'});
  assert(filteredJobs().some(j=>j.id==='admin-etat'),'La recherche trouve Administrateur·rice de l’État malgré les domaines choisis.');
  S.q='administratrice';assert(filteredJobs().some(j=>j.id==='admin-etat'),'La forme féminine retrouve aussi le métier.');
  S.q='';S.domains=[];S.metDomains=[];
  console.log('Référentiel vérifié : '+ref.length+' concours, '+linked.length+' fiches rattachées, fiche concours, Se préparer, Évoluer et recherche.');
}

// Écoles du service public (recherche du 22 octobre 2026) : descriptions, nouveaux concours, liens et bouton Information.
{
  const ref=data.concours,wasDone=S.done;
  S.done=true;
  assert(ref.every(c=>c.description),'Chaque concours a une description pour le bouton Information.');
  assert(jobRefs(data.jobs.find(j=>j.id==='magistrat')).some(c=>/magistrature/.test(c.name)),'Le métier de magistrat propose le concours de l’ENM.');
  assert(ref.some(c=>/Orient/.test(c.name)),'La voie Orient de l’INSP existe.');
  assert(screens['concours-fiche']('E-001').includes('data-action="concoursInfo"'),'Le bouton Information s’affiche sur la fiche concours.');
  /* Concours sans fiche correspondante dans le répertoire des métiers : ils restent sans métier lié. */
  const noJob={'sécurité sociale':'organismes hors fonction publique, aucune fiche du répertoire','Commissaire des armées':'métiers d’administration et de soutien des armées non distingués dans le répertoire','Médecin des armées':'aucune fiche de médecin militaire dans le répertoire'};
  const recent=ref.filter(c=>Number(c.id.slice(2))>61);
  for(const c of recent)assert(concoursJobs(c).length||Object.keys(noJob).some(k=>c.name.includes(k)),'Métiers liés au nouveau concours '+c.id+' : '+c.name);
  const enm=ref.find(c=>/magistrature/.test(c.name)),fiche=screens['concours-fiche'](enm.id.replace('É','E'));
  assert(fiche.includes('data-action="concoursInfo"')&&concoursJobs(enm).some(j=>j.id==='magistrat'),'Fiche ENM : bouton Information et métier de magistrat.');
  for(const c of ref.filter(c=>c.researchNotes))assert(!screens['concours-fiche'](c.id.replace('É','E')).includes(c.researchNotes.slice(0,60)),'Notes de recherche jamais affichées : '+c.id);
  S.done=wasDone;
  console.log('Écoles du service public vérifiées : '+recent.length+' nouveaux concours, '+(recent.length-Object.keys(noJob).length)+' avec métiers liés, descriptions et bouton Information.');
}

// Audit des correspondances (19 octobre 2026) : corrections appliquées et métiers sans concours expliqués.
{
  const shown=id=>data.jobs.find(j=>j.id===id).routeIds;
  assert(!shown('fpctl006').includes('magistrat')&&shown('fpctl006').includes('magistrat-crc'),'Les juridictions financières ne passent pas par l’ENM.');
  assert(!shown('fpjus017').includes('magistrat'),'Un juriste assistant n’est pas un magistrat.');
  assert(data.jobs.find(j=>j.id==='fpjus015').categories.includes('A+'),'Le magistrat judiciaire est en A+.');
  assert(!shown('fpfip011').includes('insp-fip')&&shown('fpfip011').includes('insp-douane'),'Les métiers de la douane relèvent des concours de la douane.');
  assert(data.accessRoutes['corps-59d7c76139ef'].cat==='A','Les sages-femmes hospitalières sont en catégorie A.');
  const soldier=screens.metier('fpdef019');
  assert(soldier.includes('recruitment-note')&&soldier.includes('sengager.fr')&&screens.fiche('fpdef019').includes('recruitment-note')&&screens.fiche('fpdef019').includes('data-fp="E"'),'Un métier militaire explique le recrutement par les armées, même avec les concours des écoles d’officiers.');
  assert(data.jobs.find(j=>j.id==='fpdef019').routeIds.every(id=>data.accessRoutes[id].military),'Aucun concours civil n’est proposé à un métier militaire.');
  assert(screens.metier('fpdef022').includes('>Recrutement<')&&screens.metier('fpdef022').includes('sengager.fr'),'Sans école militaire rattachée, la frise présente le recrutement par engagement.');
  console.log('Audit vérifié : corrections appliquées, métiers sans concours expliqués.');
}
