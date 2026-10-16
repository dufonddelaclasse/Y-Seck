import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Exerce les écrans avec le catalogue réel, sans serveur ni navigateur.
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('data/catalogue.json', root), 'utf8'));
const db = {};
for (const part of manifest.parts) {
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
source=source.replace('  UI.init();\n  render();\n  booted = true;', '  window.tests={screens,S,filteredJobs,jobFilters,jobCategories,isContractJob,prepHref,examsFor,tabbar};');
vm.runInContext(source,context);
const {screens,S,filteredJobs,jobFilters,isContractJob,prepHref,examsFor,tabbar}=context.window.tests;
const data=context.window.DATA;
Object.assign(S,{profile:'etu',name:'Test',level:'Doctorat',domains:[],metDomains:[],traits:[],budget:'Plus de 1 000 €',prepBudget:'2',boursier:'Non'});
const fixed=data.jobs.filter(j=>['A+','A','B','C'].includes(j.cat)&&!isContractJob(j));
let counts={};
for (const j of fixed) {
  const html=screens.preparer(j.id);
  assert(html.includes('<h1>Se préparer</h1>'),j.id);
  assert(html.includes('href="#/metier/'+j.id+'"'),j.id);
  assert(!html.includes('>Pour vos choix<'),j.id);
  assert(!html.includes('href="#/sans-concours'),j.id);
  for(const f of ['E','T','H'])assert.equal(html.includes('<b>'+data.fps[f]+'</b>'),j.fp.includes(f),'Versant non pertinent : '+j.id+' '+f);
  assert.equal(html.includes('Recommandations bibliographiques'),['A','A+'].includes(j.cat),'Bibliographie : '+j.id);
  assert.equal(html.includes('href="#/calendrier/'+j.id+'"'),examsFor(j).length>0,'Dates : '+j.id);
  assert(html.includes('href="#/etudes/'+j.id+'"'));
  assert(html.includes('href="#/handicap/'+j.id+'"'));
  assert(html.includes('role="group" aria-label="Budget"'));
  assert(!html.includes('href="#/prepa/talents'),'Talents masqués pour les non-boursiers : '+j.id);
  counts[j.cat]=(counts[j.cat]||0)+1;
}
assert(fixed.some(j=>examsFor(j).length>0),'Un cas avec dates doit être vérifié.');
assert(fixed.some(j=>examsFor(j).length===0),'Un cas sans date doit être vérifié.');
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
assert.equal(prepHref(variable),'#/concours');
assert(screens.preparer(variable.id).includes('<h1>Concours et prépas</h1>'));
assert.equal(variable.cat,'V');
Object.assign(S,{metCat:'CDD',showContracts:true});
assert.equal(filteredJobs().length,contracts.length);
S.showContracts=false;
assert.equal(filteredJobs().length,0);
S.metCat='Toutes';
assert(!filteredJobs().some(isContractJob));
function click(action,value=null){
  const el={getAttribute(name){return name==='data-action'?action:name==='data-v'?value:null;}};
  listeners.click({target:{closest(selector){return selector==='[data-action]'?el:null;}},detail:0,preventDefault(){}});
}
click('metCat','CDD');
assert.equal(S.showContracts,true);
assert.equal(filteredJobs().length,contracts.length);
click('showContracts');
assert.equal(S.showContracts,false);
assert.equal(S.metCat,'Toutes');
const filters=jobFilters();
const labels=['Votre sélection','Catégories','Versants','Afficher les emplois contractuels','Domaines'];
for(let i=1;i<labels.length;i++)assert(filters.indexOf(labels[i-1])<filters.indexOf(labels[i]));
assert(filters.includes('data-v="CDD"'));
assert.equal((tabbar('accueil').match(/<a /g)||[]).length,4);
assert(!tabbar('accueil').includes('href="#/concours"'));
assert(screens.accueil().includes('href="#/concours"'),'Le tableau de bord conserve l’accès concours.');
assert(screens.etudes('greffier').includes('École nationale des greffes'));
assert(screens.etudes('greffier').includes('href="#/preparer/greffier"'));
assert(screens.prepa('privees','greffier').includes('href="#/preparer/greffier"'));
assert(!screens.prepa('privees','greffier').includes('Ipesup'));
assert(screens.bibliographie('greffier').includes('<h1>Se préparer</h1>'));
assert(screens.handicap('dev').includes('href="#/sans-concours/dev"'));
Object.assign(S,{calCat:'A',calFp:'Tous',calQ:'',calView:'upcoming'});
const hospitalJob=data.jobs.find(j=>j.id==='aah');
assert(screens.calendrier(hospitalJob.id).includes(examsFor(hospitalJob).length+' sessions'),'Le filtre A doit conserver les sessions liées dont la source ne précisait pas la catégorie.');
S.boursier='Oui';
assert(!screens.preparer('magasinier').includes('class="bourse"'),'Pas de bourse Talents recommandée à une préparation de catégorie C.');
assert(!screens.preparer('magasinier').includes('href="#/prepa/talents'));
assert.equal(JSON.stringify(data.crosswalk),JSON.stringify(db.links));
console.log('Contrôles réussis :',counts,';',contracts.length,'CDD ; VAR préservés, dates, versants, orientation, aides, filtres et navigation.');
