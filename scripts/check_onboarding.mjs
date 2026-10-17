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
  const location = {hash:'#/choix-profil'};
  let stored = saved ? JSON.stringify(saved) : null;
  const context = {
    window:{PUBLIC_DATA:db,addEventListener(){},scrollTo(){}},location,
    history:{pushState(_state,_title,hash){location.hash=hash;},replaceState(_state,_title,hash){location.hash=hash;}},
    document:{getElementById(id){return id==='app'?app:fields[id]||null;},addEventListener(type,fn){events.document[type]=fn;},documentElement:{dataset:{}},activeElement:null},
    localStorage:{getItem(){return stored;},setItem(_key,value){stored=value;}},
    matchMedia(){return {matches:false};},setTimeout(){return 0;},clearTimeout(){}
  };
  vm.createContext(context);
  for (const file of ['js/data.js','js/catalog.js','js/ui.js']) vm.runInContext(fs.readFileSync(new URL(file,root),'utf8'),context);
  context.window.YSECK_UI.afterRender=()=>{};
  let source=fs.readFileSync(new URL('js/app.js',root),'utf8');
  source=source.replace('  UI.init();\n  render();\n  booted = true;', '  window.tests={screens,S,render,blankPerson};');
  vm.runInContext(source,context);
  const click=(action,value)=>{
    const element={getAttribute(key){return key==='data-action'?action:key==='data-v'?value:null;}};
    events.document.click({target:{closest(selector){return selector==='[data-action]'?element:null;}},detail:0,preventDefault(){}});
  };
  const submit=id=>events.root.submit({target:{id},preventDefault(){}});
  const nameInput=value=>{
    const input={id:'person-name',value,blurred:false,blur(){this.blurred=true;},matches(){return false;}};
    fields['person-name']=input;
    fields['identity-continue']={disabled:true};fields['hint-continue']={hidden:false};
    fields['name-confirm']={disabled:true,focus(){}};
    events.root.input({target:input});
    return input;
  };
  return {...context.window.tests,context,events,fields,location,click,submit,nameInput,saved:()=>JSON.parse(stored)};
}

for (const profile of ['etu','par','rec']) {
  const t=start();
  t.click('profile',profile);
  assert.equal(t.location.hash,'#/profil');
  const first=t.screens.profil();
  assert(first.includes(profile==='par'?'Le prénom de votre enfant':'Votre prénom'));
  assert(first.includes('required maxlength="50"')&&first.includes('id="identity-continue" disabled'));
  assert(!first.includes('data-action="level"'),'Le prénom et le niveau doivent être sur deux écrans.');
  assert(first.includes('href="#/choix-profil"'),'Le choix initial du profil reste réversible.');
  t.nameInput('   ');t.submit('identity-form');
  assert.equal(t.location.hash,'#/profil','Un prénom vide ne valide pas la première étape.');
  const input=t.nameInput('  Alexis  ');
  assert.equal(t.fields['identity-continue'].disabled,false);
  t.click('confirmName');
  assert.equal(t.S.name,'Alexis');assert(input.blurred);
  assert.equal(t.location.hash,'#/niveau');
  const second=t.screens.niveau();
  assert(second.includes('Étape 2 / 5')&&second.includes('href="#/profil"'));
  assert(second.includes('data-action="level"')&&!second.includes('id="person-name"'));
  assert.equal(second.includes('data-v="CAP / BEP"'),profile==='rec');
  t.submit('study-form');assert.equal(t.location.hash,'#/niveau','Un niveau doit être choisi avant de poursuivre.');
  t.location.hash='#/interets';t.render();
  assert.equal(t.location.hash,'#/niveau','Un lien direct ne doit pas sauter le niveau obligatoire.');
  t.click('level',profile==='rec'?'CAP / BEP':'Seconde');t.submit('study-form');
  assert.equal(t.location.hash,'#/interets');
  assert(t.screens.interets().includes('Étape 3 / 5')&&t.screens.interets().includes('href="#/niveau"'));
  assert(t.screens.traits().includes('Étape 4 / 5'));
  const situation=t.screens.situation();
  assert(situation.includes('Étape 5 / 5')&&situation.includes('Avec frais d’inscription')&&!situation.includes('Moins de 1 000'));
  for(const html of [first,second,t.screens.interets(),t.screens.traits(),situation])assert(!/>Passer<|>passer</.test(html));
}

// Entrée valide et masque le clavier sans sauter automatiquement l'écran.
const keyboard=start({profile:'etu'}), input=keyboard.nameInput('Camille');
keyboard.location.hash='#/profil';
let prevented=false;
keyboard.events.root.keydown({target:input,key:'Enter',isComposing:false,keyCode:13,preventDefault(){prevented=true;}});
assert(prevented&&input.blurred);assert.equal(keyboard.location.hash,'#/profil');
keyboard.events.root.keydown({target:input,key:'Enter',isComposing:true,keyCode:229,preventDefault(){throw Error('La composition de texte doit rester libre.');}});

// L'ajout d'un enfant repart du prénom et conserve le premier parcours familial.
const family=start({profile:'par',children:[{id:'enfant-1',name:'Ariane',level:'Terminale',done:true}],activeChild:'enfant-1'});
family.click('addChild');
assert.equal(family.location.hash,'#/profil');assert.equal(family.S.profile,'par');
assert.equal(family.S.name,'');assert.equal(family.S.level,null);
assert(family.screens.profil().includes('Le prénom de votre enfant')&&family.screens.profil().includes('href="#/accueil"'));
assert(!family.screens['choix-profil']().includes('data-action="profile"'),'Une famille établie ne repasse pas par le choix étudiant/parent.');
assert.equal(family.S.children.find(child=>child.id==='enfant-1').name,'Ariane');

// Les réponses historiques restent sélectionnées sous le nouveau libellé, y compris après changement de profil.
const old=start({profile:'etu',name:'Alexis',level:'Seconde',budget:'Moins de 1 000 €',personalProfiles:{rec:{name:'Léa',level:'Bac',budget:'Moins de 1 000 €'}}});
assert.equal(old.S.budget,'Avec frais d’inscription');
assert(old.screens.situation().includes('aria-pressed="true" data-action="budget" data-v="Avec frais d’inscription"'));
old.click('profile','rec');assert.equal(old.S.budget,'Avec frais d’inscription');
assert.equal(old.saved().budget,'Avec frais d’inscription');
const guard=start();guard.location.hash='#/situation';guard.render();assert.equal(guard.location.hash,'#/choix-profil');
guard.S.profile='etu';guard.location.hash='#/niveau';guard.render();assert.equal(guard.location.hash,'#/profil');
console.log('Onboarding vérifié : prénom obligatoire distinct du niveau, 5 étapes, retours, clavier, famille et migration du budget.');
