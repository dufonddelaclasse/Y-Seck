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
  const confirmation = {accept:true,messages:[]}, opened = [];
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
  context.window.YSECK_UI.open=(kind,title,html)=>{opened.push({kind,title,html});};
  context.window.YSECK_UI.close=()=>{};
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
  return {...context.window.tests,events,fields,location,click,input,confirmation,opened,saved:()=>stored?JSON.parse(stored):null};
}


const personal=(extra={})=>({profile:'etu',name:'Camille',level:'Bac',domains:['Justice'],traits:['equipe'],boursier:'Non',budget:'Gratuit uniquement',done:true,location:null,favorites:['attache','magistrat'],filterHintSeen:true,...extra});

// Onglets Métiers et Concours : chaque page liste un seul type, sans filtre « Affichage ».
{
  const t=start(personal());
  t.location.hash='#/metiers';
  const page=t.screens.metiers();
  assert(page.includes('Vos métiers')&&!page.includes('concours-row'),'La page Métiers ne liste que des métiers.');
  assert(page.includes('href="#/concours-liste"')&&page.includes('>Métiers</a>')&&page.includes('>Concours</a>'),'Le menu propose Métiers et Concours.');
  assert(!t.screens.metiers().includes('Explorer'),'L’onglet Explorer devient Métiers.');
  t.location.hash='#/concours-liste';
  const concours=t.screens['concours-liste']();
  assert(concours.includes('Vos concours')&&concours.includes('concours-row')&&!concours.includes('href="#/metier/'),'La page Concours ne liste que des concours.');
  const key=concours.match(/#\/concours-fiche\/([^"]+)/)[1];
  const fiche=t.screens['concours-fiche'](key);
  assert(fiche.includes('<h1>')&&fiche.includes('job-cards')&&fiche.includes('class="trip"'),'La fiche concours suit la frise et présente les métiers liés en cartes.');
  const home=(t.location.hash='#/accueil',t.screens.accueil());
  assert(home.includes('home-concours')&&home.includes('Vos concours'),'L’accueil propose les concours sélectionnés.');
}

// Métier présent dans les trois versants : concours de l’État d’abord, ou du versant filtré, et les autres en onglets.
{
  const t=start(personal());
  t.location.hash='#/metier/fpach005';
  const selected=html=>(html.match(/<button[^>]*class="trip-tab"[^>]*aria-selected="true"[^>]*>([\s\S]*?)<\/button>/)||[])[1]||'';
  const page=t.screens.metier('fpach005');
  assert(selected(page).includes('État')&&page.includes('3 concours possibles')&&page.includes('Administrateur - Administratrice de l’État'),'Sans préférence, la fiche ouvre le concours de l’État et propose les autres versants en onglets.');
  t.S.metFps=['H'];
  assert(selected(t.screens.metier('fpach005')).includes('Hospitalière'),'Un seul versant filtré : la fiche ouvre son concours.');
  t.S.metFps=null;
}

// Bandeau d’aide des filtres : une seule fois.
{
  const t=start(personal({filterHintSeen:false}));
  t.location.hash='#/metiers';t.render();
  assert(t.saved().filterHintSeen,'Le bandeau des filtres n’est montré qu’une fois.');
}

// Favoris : cartes avec suppression confirmée.
{
  const t=start(personal());
  const page=t.screens.favoris();
  assert(page.includes('swipe-item')&&page.includes('data-action="askUnfavorite"')&&page.includes('job-cards'));
  t.click('askUnfavorite','attache');
  assert.equal(t.opened.at(-1).kind,'confirm');
  assert.deepEqual([...t.S.favorites],['attache','magistrat'],'Aucune suppression avant confirmation.');
  t.click('unfavorite','attache');
  assert.deepEqual([...t.S.favorites],['magistrat']);
}

// Profil : lignes qui ouvrent un choix, bouton « Terminer » seulement après une modification, liens de suppression rouges.
{
  const t=start(personal());
  let page=t.screens.moi();
  assert(page.includes('data-action="editField"')&&page.includes('Touchez une ligne pour modifier votre réponse.'));
  assert(!page.includes('Terminer les modifications'),'Sans modification, pas de bouton « Terminer les modifications ».');
  assert(page.includes('class="danger-link"'));
  t.click('editField','level');
  assert.equal(t.opened.at(-1).kind,'profile-field');
  assert(t.opened.at(-1).html.includes('data-action="level"')&&!t.opened.at(-1).html.includes('data-action="domain"'),'Le choix ne montre que les options de la ligne.');
  t.click('level','Bac+3');
  assert(t.screens.moi().includes('Terminer les modifications'));
}

// Apparence : réglage du mode sombre dans la page d’accessibilité.
{
  const t=start(personal());
  assert.equal(t.S.colorMode,'auto');
  assert(t.screens.accessibilite().includes('data-action="colorMode"'));
  t.click('colorMode','dark');
  assert.equal(t.saved().colorMode,'dark');
}

// Dates des concours : pas de filtres sur la page d’un métier.
{
  const t=start(personal());
  const page=t.screens.calendrier('attache');
  assert(!page.includes('id="cal-q"')&&!page.includes('data-action="calCat"'),'Le calendrier d’un métier n’a pas de filtres.');
}

console.log('Série du 19/10 : explorer, favoris, profil, apparence et calendrier vérifiés.');

// Le mode sombre généré suit la feuille de style.
import { execFileSync } from 'node:child_process';
execFileSync('python3',[new URL('scripts/build_dark.py',root).pathname,'--check'],{stdio:'inherit'});
