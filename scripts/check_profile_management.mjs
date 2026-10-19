import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('data/catalogue.json', root), 'utf8'));
const db = {};
for (const part of manifest.parts) {
  const data = JSON.parse(fs.readFileSync(new URL('data/' + part, root), 'utf8'));
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) (db[key] ||= []).push(...value); else db[key] = value;
  }
}

function start(saved) {
  const events = {root:{},document:{}}, fields = {};
  const app = {addEventListener(type,fn){events.root[type]=fn;},querySelector(){return null;},querySelectorAll(){return [];},classList:{toggle(){}}};
  const location = {hash:'#/moi'};
  let stored = saved ? JSON.stringify(saved) : null;
  const confirmation = {accept:true,messages:[]};
  const context = {
    window:{PUBLIC_DATA:db,addEventListener(){},scrollTo(){},confirm(message){confirmation.messages.push(message);return confirmation.accept;}},location,
    history:{pushState(_state,_title,hash){location.hash=hash;},replaceState(_state,_title,hash){location.hash=hash;}},
    document:{getElementById(id){return id==='app'?app:fields[id]||null;},addEventListener(type,fn){events.document[type]=fn;},documentElement:{dataset:{}},activeElement:null},
    localStorage:{getItem(){return stored;},setItem(_key,value){stored=value;},removeItem(){stored=null;}},
    matchMedia(){return {matches:false};},setTimeout(){return 0;},clearTimeout(){}
  };
  vm.createContext(context);
  for (const file of ['js/data.js','js/catalog.js','js/ui.js']) vm.runInContext(fs.readFileSync(new URL(file,root),'utf8'),context);
  context.window.YSECK_UI.afterRender=()=>{};
  const footer='  UI.init();\n  render();\n  booted = true;';
  let source=fs.readFileSync(new URL('js/app.js',root),'utf8');
  assert(source.includes(footer),'Le point d’entrée du test doit correspondre à celui de l’application.');
  source=source.replace(footer,'  window.tests={screens,S,getState(){return S;},render,blankPerson,installLocationResults(value){locationResults=value;}};');
  vm.runInContext(source,context);
  const click=(action,value)=>{
    const element={getAttribute(key){return key==='data-action'?action:key==='data-v'?value:null;}};
    events.document.click({target:{closest(selector){return selector==='[data-action]'?element:null;}},detail:0,preventDefault(){}});
  };
  const input=(id,value)=>{
    const field={id,value,blur(){},matches(){return false;}};
    fields[id]=field;
    if(id==='person-name'){
      fields['identity-continue']={disabled:true};fields['hint-continue']={hidden:false};
      fields['name-confirm']={disabled:true,focus(){}};
    }
    events.root.input({target:field});
    return field;
  };
  return {...context.window.tests,events,fields,location,click,input,confirmation,saved:()=>stored?JSON.parse(stored):null};
}

const person=(extra={})=>({name:'Camille',level:'Bac',domains:['Justice'],traits:['equipe'],boursier:'Non',budget:'Gratuit uniquement',done:true,location:null,favorites:[],...extra});
const personal=(extra={})=>({profile:'etu',...person(),...extra});
const same=(actual,expected,message)=>assert.deepEqual(JSON.parse(JSON.stringify(actual)),expected,message);
const hasValidation=t=>t.screens.moi().includes('data-action="validateProfile"');

// Modifier un filtre, un favori ou une recherche non choisie ne modifie pas le profil.
const unchanged=start(personal());
assert(!hasValidation(unchanged));
unchanged.click('level','Bac');
unchanged.click('boursier','Non');
unchanged.click('budget','Gratuit uniquement');
unchanged.click('favorite','admin-terr');
unchanged.click('metCat','B');
unchanged.click('contrast');
unchanged.click('clearLocation');
unchanged.input('location-query','Lyon');
assert(!unchanged.S.pendingChanges&&!hasValidation(unchanged),'Les actions sans changement de réponse ne doivent pas demander une validation.');

// Chaque réponse peut être modifiée puis validée sans refaire tout le parcours.
const changes=[
  ['niveau',t=>t.click('level','Bac+3')],
  ['domaines',t=>t.click('domain','Numérique')],
  ['traits',t=>t.click('trait','dehors')],
  ['bourse',t=>t.click('boursier','Oui')],
  ['budget',t=>t.click('budget','Avec frais d’inscription')],
  ['prénom',t=>t.input('person-name','Alix')],
  ['commune',t=>{t.installLocationResults([{label:'Lyon (69001)',code:'69123',lon:4.83,lat:45.76}]);t.click('selectLocation','0');}],
  ['commune retirée',t=>t.click('clearLocation')]
];
for(const [label,change] of changes){
  const t=start(personal(label==='commune retirée'?{location:{label:'Paris (75001)',code:'75056',lon:2.35,lat:48.86}}:{}));
  change(t);
  assert(t.S.pendingChanges&&hasValidation(t),'Une modification de '+label+' doit proposer la validation.');
  assert(t.saved().pendingChanges&&t.saved().personalProfiles.etu.pendingChanges,'La modification de '+label+' doit être conservée après fermeture.');
  for(const screen of ['profil','niveau','interets','traits','situation']){
    assert(t.screens[screen]().includes('Terminer les modifications'),'Le parcours modifié doit pouvoir être validé sur '+screen+'.');
  }
  const reopened=start(t.saved());
  assert(hasValidation(reopened),'La validation doit rester disponible après réouverture : '+label);
  t.click('validateProfile');
  assert.equal(t.location.hash,'#/accueil');
  assert(!t.S.pendingChanges&&!hasValidation(t),'Une validation de '+label+' doit rétablir le bouton de modification.');
  assert(!t.saved().personalProfiles.etu.pendingChanges);
}

// Revenir à la réponse validée retire le bouton ; un ancien indicateur sans version validée ne l’affiche pas.
{
  const t=start(personal());
  t.click('level','Bac+3');
  assert(hasValidation(t),'Une modification affiche le bouton.');
  t.click('level','Bac');
  assert(!t.S.pendingChanges&&!hasValidation(t),'Revenir à la réponse validée retire le bouton.');
  const stale=start(personal({pendingChanges:true}));
  assert(!hasValidation(stale),'Un ancien indicateur sans modification réelle n’affiche pas le bouton.');
}

// Le choix boursier·e fait depuis Se préparer s’enregistre sans demander de validation du profil.
{
  const t=start(personal());
  t.location.hash='#/preparer/attache';
  t.click('toggleBoursier');
  t.location.hash='#/moi';
  assert(!t.S.pendingChanges&&!hasValidation(t),'Un réglage hors questionnaire ne bloque pas le profil en attente de validation.');
}

// Un nom vide ne devient pas valide grâce au raccourci de validation.
const required=start(personal());
required.input('person-name','   ');
required.click('validateProfile');
assert.notEqual(required.location.hash,'#/accueil');
assert(required.S.pendingChanges);

// Une inscription initiale suit toujours ses étapes, sans bouton de modification.
const initial=start(personal({done:false}));
initial.click('level','Bac+3');initial.input('person-name','Nouvel inscrit');
assert(!initial.S.pendingChanges);
assert(!initial.screens.profil().includes('Terminer les modifications'));
assert(!initial.screens.niveau().includes('Terminer les modifications'));

const siblingA=person({id:'a',name:'Ariane',favorites:['admin-terr']});
const siblingB=person({id:'b',name:'Basile',level:'Terminale',domains:['Santé'],traits:['aider'],favorites:['gpx']});
const other=person({name:'Adulte',level:'Doctorat',favorites:['magistrat']});
const family=extra=>({profile:'par',children:[siblingA,siblingB],activeChild:'a',personalProfiles:{rec:other},contrast:true,...extra});

// Les deux types de profils adultes ne partagent pas leur modification en attente.
const adults=start(personal({personalProfiles:{rec:other}}));
adults.click('budget','Avec frais d’inscription');
assert(adults.S.pendingChanges);
adults.click('profile','rec');
assert.equal(adults.S.name,'Adulte');
assert(!adults.S.pendingChanges);
assert(adults.saved().personalProfiles.etu.pendingChanges);
adults.click('profile','etu');
assert.equal(adults.S.name,'Camille');
assert(adults.S.pendingChanges);
adults.click('validateProfile');
assert(!adults.saved().personalProfiles.etu.pendingChanges);
same(adults.saved().personalProfiles.rec.favorites,['magistrat']);

// La validation et les réponses restent attachées au bon enfant.
const switching=start(family());
switching.click('level','Bac+3');
assert(switching.S.pendingChanges);
switching.click('selectChild','b');
assert.equal(switching.S.name,'Basile');
assert(!switching.S.pendingChanges&&!hasValidation(switching),'Changer d’enfant ne doit pas créer de modification.');
assert(switching.saved().children.find(c=>c.id==='a').pendingChanges);
same(switching.S.favorites,['gpx']);
switching.click('selectChild','a');
assert.equal(switching.S.level,'Bac+3');
assert(switching.S.pendingChanges&&hasValidation(switching));
switching.click('validateProfile');
assert(!switching.saved().children.find(c=>c.id==='a').pendingChanges);
assert.equal(switching.saved().children.find(c=>c.id==='b').name,'Basile');
assert(switching.screens.moi().includes('>Profils</a>'),'Deux enfants doivent pluraliser l’onglet Profils.');
assert(!switching.screens.famille().includes('Y-Seck · Parents'));
for(const screen of ['moi','famille','accueil']){
  assert(!switching.screens[screen]().includes('data-action="wipe"'),'Une famille avec des enfants ne doit pas proposer l’effacement global sur '+screen+'.');
}

// Refuser l’effacement ne touche à aucun enfant ; accepter retire seulement l’actif.
const deleting=start(family());
deleting.confirmation.accept=false;
deleting.click('deleteChild');
assert.equal(deleting.S.children.length,2);assert.equal(deleting.S.activeChild,'a');
deleting.confirmation.accept=true;
deleting.click('deleteChild');
assert.equal(deleting.S.children.length,1);assert.equal(deleting.S.activeChild,'b');
assert.equal(deleting.S.name,'Basile');
same(deleting.S.favorites,['gpx'],'Les favoris du frère ou de la sœur doivent rester intacts.');
same(deleting.saved().personalProfiles.rec,other,'Les profils adultes sauvegardés ne doivent pas être effacés.');
assert.equal(deleting.S.contrast,true);
assert.equal(deleting.location.hash,'#/accueil');
assert(deleting.screens.moi().includes('Effacer ce profil'));
assert(!deleting.screens.moi().includes('Effacer mes données'));
assert(deleting.screens.moi().includes('>Profil</a>')&&!deleting.screens.moi().includes('>Profils</a>'));
assert.equal(deleting.confirmation.messages.length,2);

// Le dernier effacement conserve un espace parent vide, y compris après rechargement.
deleting.click('deleteChild');
assert.equal(deleting.S.children.length,0);
assert.equal(deleting.S.activeChild,null);
assert.equal(deleting.S.profile,'par');
assert.equal(deleting.S.name,'');
assert(!deleting.S.done);
deleting.screens.famille();
assert.equal(deleting.S.children.length,0,'Afficher la famille ne doit pas recréer le profil supprimé.');
const empty=start(deleting.saved());
assert.equal(empty.S.children.length,0,'Recharger ne doit pas recréer le dernier enfant supprimé.');
assert.equal(empty.S.activeChild,null);
same(empty.S.personalProfiles.rec,other);
assert(!empty.screens.moi().includes('Effacer ce profil'));
for(const screen of ['moi','famille','accueil']){
  const html=empty.screens[screen]();
  assert(html.includes('data-action="wipe">Effacer mes données</button>'),'Un parent sans enfant doit pouvoir effacer ses données sur '+screen+'.');
  assert(!html.includes('data-action="deleteChild"'),'Un espace parent vide ne doit pas proposer d’effacer un enfant inexistant sur '+screen+'.');
}

// Refuser l’effacement global préserve la famille vide, les préférences et les profils adultes.
const emptySnapshot=JSON.parse(JSON.stringify(empty.getState()));
const emptySaved=empty.saved();
empty.confirmation.accept=false;
empty.click('wipe');
same(empty.getState(),emptySnapshot,'Annuler l’effacement doit préserver tout l’état parent.');
same(empty.saved(),emptySaved,'Annuler l’effacement doit préserver les données enregistrées, y compris les profils adultes.');
assert.equal(empty.location.hash,'#/moi');

// Confirmer efface toutes les données locales et rend le choix initial de profil accessible.
empty.confirmation.accept=true;
empty.click('wipe');
assert.equal(empty.saved(),null,'Confirmer l’effacement doit vider le stockage local.');
assert.equal(empty.getState().profile,null);
assert.equal(empty.getState().name,'');
assert.equal(empty.getState().activeChild,null);
assert.equal(empty.getState().contrast,false);
same(empty.getState().children,[]);
same(empty.getState().personalProfiles,{});
same(empty.getState().favorites,[]);
assert.equal(empty.location.hash,'#/profil');
assert(empty.screens.profil().includes('profile-choice'),'Après effacement, la page Profil doit afficher le choix étudiant / parent / reconversion.');
assert.equal(empty.confirmation.messages.length,2);

// Sans effacement global, le parent peut toujours ajouter un nouvel enfant à sa famille vide.
const adding=start(emptySaved);
adding.click('addChild');
assert.equal(adding.S.children.length,1);assert.equal(adding.S.name,'');assert.equal(adding.location.hash,'#/profil');

// L’ancien stockage parent sans tableau d’enfants reste migré sans perte.
const legacy=start({profile:'par',...person({name:'Ancien enfant'})});
assert.equal(legacy.S.children.length,1);assert.equal(legacy.S.name,'Ancien enfant');

console.log('Gestion des profils vérifiée : modifications et validation, inscription initiale, isolation des enfants, suppression ciblée, famille vide persistante et effacement global confirmé ou annulé.');
