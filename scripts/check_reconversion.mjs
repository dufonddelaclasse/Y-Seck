// Recette du profil « en reconversion » : parcours, mots-clés, moteur des voies d'accès et écran du budget.
// Usage : node scripts/check_reconversion.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const read = p => fs.readFileSync(new URL(p, root), 'utf8');
const manifest = JSON.parse(read('data/catalogue.json'));
assert(manifest.parts.includes('catalogue/reconversion-01.json'), 'La base reconversion doit figurer dans le manifeste.');
assert(read('js/catalog-data.js').includes("'catalogue/reconversion-01.json'"), 'La base reconversion doit être chargée dès l’onboarding.');

// Pendant l'onboarding, seuls metadata.json et la base reconversion sont lus : le test reproduit cette situation.
const db = {};
for (const part of ['catalogue/metadata.json', 'catalogue/reconversion-01.json']) {
  for (const [k, v] of Object.entries(JSON.parse(read('data/' + part)))) { if (Array.isArray(v)) (db[k] ||= []).push(...v); else db[k] = v; }
}
Object.assign(db, { legacyJobs: [], rmfp: [], links: [], routes: [], talents: [], talentsGeo: db.talentsGeo || {}, calendar: [] });
const R = db.reconversion;
assert.equal(R.jobs.length, 1069, 'Une entrée par fiche RMFP.');
assert(R.jobs.every(j => j[3].length >= 2 && j[3].length <= 10), 'Chaque fiche porte entre 2 et 10 mots-clés.');
assert(R.jobs.filter(j => j[3].length === 10).length > 800, 'La grande majorité des fiches a ses 10 mots-clés.');
assert(R.professions.every(p => p.jobs.length), 'Chaque métier du privé est rattaché à au moins une fiche.');

function start() {
  const events = { root: {}, document: {} }, fields = {};
  const app = { addEventListener(type, fn) { events.root[type] = fn; }, querySelector() { return null; }, querySelectorAll() { return []; }, classList: { toggle() {}, contains() { return false; } }, innerHTML: '' };
  const location = { hash: '#/choix-profil' };
  let stored = null;
  const context = {
    window: { PUBLIC_DATA: db, YSECK_CATALOG: { full: false, loadAll() { return Promise.resolve(); } }, addEventListener() {}, scrollTo() {} }, location,
    history: { pushState(_s, _t, h) { location.hash = h; }, replaceState(_s, _t, h) { location.hash = h; } },
    document: { getElementById(id) { return id === 'app' ? app : fields[id] || null; }, querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener(type, fn) { events.document[type] = fn; }, documentElement: { dataset: {} }, activeElement: null },
    localStorage: { getItem() { return stored; }, setItem(_k, v) { stored = v; } },
    matchMedia() { return { matches: false }; }, setTimeout() { return 0; }, clearTimeout() {}, requestAnimationFrame() {}
  };
  vm.createContext(context);
  for (const f of ['js/data.js', 'js/catalog.js', 'js/ui.js']) vm.runInContext(read(f), context);
  context.window.YSECK_UI.afterRender = () => {};
  const source = read('js/app.js').replace('  UI.init();\n  render();\n  booted = true;',
    '  window.tests={screens,S,render,recoVoies:recoVoies,recoNeedsBudget:recoNeedsBudget,recoKeyMatches:recoKeyMatches,recoSuggested:recoSuggested,recoDomains:recoDomains,setHandicap:function(v){recoHandicap=v;}};');
  vm.runInContext(source, context);
  const click = (action, value, extra) => {
    const element = Object.assign({ getAttribute(k) { return k === 'data-action' ? action : k === 'data-v' ? value : null; }, closest() { return null; } }, extra || {});
    events.document.click({ target: { closest(sel) { return sel === '[data-action]' ? element : null; } }, detail: 0, preventDefault() {} });
  };
  const submit = id => events.root.submit({ target: { id }, preventDefault() {} });
  return { ...context.window.tests, location, click, submit, events, fields };
}

// Parcours : prénom, niveau, expérience, projet, métier ; puis budget ou fin selon les voies.
const t = start();
t.click('profile', 'rec');
t.S.name = 'Léa';
t.click('level', 'Bac');
t.submit('study-form');
assert.equal(t.location.hash, '#/experience', 'L’expérience suit le niveau d’études.');
const exp = t.screens.experience();
for (const label of ['Moins de 4 ans', '4 à 5 ans', '5 à 7 ans', '7 ans et plus']) assert(exp.includes(label), 'Tranche proposée : ' + label);
assert(exp.includes('Étape 3 / 6'));
t.click('experience', '7+');
const projet = t.screens.projet();
assert(projet.includes('Apporter votre expérience pour travailler dans la fonction publique') && projet.includes('Explorer de nouveaux horizons'));
assert(!projet.includes('reco-path-num'), 'Les choix ne sont pas numérotés.');
assert(!projet.includes('boursier'), 'Aucune question boursier·e dans le profil reconversion.');
t.click('recoPath', 'metier');
assert(t.screens.projet().includes('href="#/metier-prive"'));
const metier = t.screens['metier-prive']();
assert(metier.includes('id="reco-job"') && metier.includes('class="name-line"') && metier.includes('id="reco-job-confirm"') && metier.includes('id="reco-key"') && metier.includes('role="combobox"'));
assert(!metier.includes('voies'), 'Les voies d’accès ne sont plus sur l’écran métier : elles suivent le budget.');
assert(metier.includes('Pour commencer :'), 'Sans métier saisi, des mots-clés fréquents sont déjà proposés.');
assert(metier.includes('disabled>Continuer'), 'Il faut un métier ou un mot-clé pour continuer.');
assert(!metier.includes('<span class="small center">'), 'Pas de ligne d’aide au-dessus du bouton.');
assert(!metier.includes('interets') && !metier.includes('traits'), 'La branche métier saute les centres d’intérêt et « ce qui vous ressemble ».');

// Mots-clés : autocomplétion dès la première lettre, uniquement depuis la base, liés au métier saisi.
assert(t.recoKeyMatches('c').length > 0, 'Suggestions dès la première lettre.');
assert(t.recoKeyMatches('zzqx').length === 0, 'Un mot hors de la base n’est jamais proposé.');
assert(t.recoKeyMatches('comp').every(l => R.keywords.includes(l)));
t.S.recoJob = 'comptable';
const linked = t.recoSuggested();
assert(linked.some(l => /compt/i.test(l)), 'Le métier saisi fait remonter ses mots-clés : ' + linked.join(', '));
assert(t.screens['metier-prive']().includes('Liés à votre métier :'));
const first = linked[0];
t.click('recoKey', first);
assert.deepEqual([...t.S.recoKeys], [first]);
assert(t.S.domains.length >= 1 && t.S.domains.length <= 2, 'Deux domaines au plus sont déduits du métier.');
for (const k of R.keywords.slice(0, 12)) t.click('recoKey', k);
assert(t.S.recoKeys.length <= 10, 'Dix mots-clés au plus.');

// Budget : jamais de question boursier·e, mention Prépas Talents pour les demandeurs d'emploi.
const sit = t.screens.situation();
assert(!sit.includes('data-action="boursier"') && !/boursier·e \?/.test(sit), 'Pas de question boursier·e.');
assert(sit.includes('Prépas Talents') && sit.includes('Demandeur·se d’emploi'), 'Mention Prépas Talents pour les demandeurs d’emploi.');
assert(sit.includes('Frais d’inscription uniquement') && !sit.includes('Gratuit uniquement'));
assert(sit.includes('href="#/metier-prive"'), 'Retour vers le métier depuis le budget.');
t.S.budget = 'Je ne sais pas';
assert(t.screens.situation().includes('href="#/voies"') && t.screens.situation().includes('Voir les voies d’accès'), 'Le budget mène aux voies d’accès.');
t.S.budget = null;

// Les huit profils de recette du plan d'action.
const ids = () => JSON.parse(JSON.stringify(t.recoVoies().map(v => v.id)));
function profile({ level, exp, path = 'metier', job = '', handicap = false }) {
  t.S.level = level; t.S.experience = exp; t.S.recoPath = path; t.S.recoJob = job; t.S.recoKeys = []; t.setHandicap(handicap);
  return { voies: ids() };
}
const cases = [
  ['Avocate, 12 ans', { level: 'Bac+5', exp: '7+', job: 'avocate' }, ['enm-pro', 'troisieme', 'contrat', 'externe', 'sansconcours'], true],
  ['Infirmier libéral, 6 ans', { level: 'Bac+3', exp: '5-7', job: 'infirmier libéral' }, ['titres-fph', 'contrat', 'sansconcours'], false],
  ['Ingénieur BTP, 3 ans', { level: 'Bac+5', exp: '0-4', job: 'ingénieur btp' }, ['contrat', 'externe', 'sansconcours'], true],
  ['Commercial, 8 ans, bac', { level: 'Bac', exp: '7+', job: 'commercial' }, ['troisieme', 'contrat', 'externe', 'sansconcours'], true],
  ['Ouvrière sans diplôme, 5 ans', { level: 'Sans diplôme', exp: '5-7', job: 'ouvrière de production' }, ['troisieme', 'contrat', 'externe', 'sansconcours'], true],
  ['Développeur, 4 ans, bac+2', { level: 'Bac+2', exp: '4-5', job: 'développeur' }, ['troisieme', 'contrat', 'externe', 'sansconcours'], true],
  ['Ancien militaire, 10 ans, bac', { level: 'Bac', exp: '7+', job: 'ancien militaire' }, ['emplois-reserves', 'troisieme', 'contrat', 'externe', 'sansconcours'], true],
  ['Caissière RQTH, 2 ans, CAP (branche 2)', { level: 'CAP', exp: '0-4', path: 'nouveau', job: '', handicap: true }, ['contrat', 'externe', 'sansconcours', 'boe'], true]
];
for (const [name, input, voies] of cases) {
  const got = profile(input);
  assert.deepEqual(got.voies, voies, name + ' : voies ' + got.voies.join(', '));
}

// Durées du 3e concours : 4 ans (FPT, ENM), 5 ans (IRA, enseignement), 6 ans (INSP).
profile({ level: 'Bac', exp: '4-5', job: 'commercial' });
let tc = t.recoVoies().find(v => v.id === 'troisieme').text;
assert(/attaché/.test(tc) && !/IRA/.test(tc) && !/INSP/.test(tc));
profile({ level: 'Bac', exp: '5-7', job: 'commercial' });
tc = t.recoVoies().find(v => v.id === 'troisieme').text;
assert(/IRA/.test(tc) && !/INSP/.test(tc));
profile({ level: 'Bac', exp: '7+', job: 'commercial' });
assert(/INSP/.test(t.recoVoies().find(v => v.id === 'troisieme').text));

// Le métier mène toujours au budget.
profile({ level: 'Bac+3', exp: '5-7', job: 'infirmière' });
assert(t.screens['metier-prive']().includes('href="#/situation"'));

// Voies : page de consultation (pas de frise), repère sur la première, sources, case handicap, réserve et bouton de fin.
const voies = t.screens.voies();
assert(!voies.includes('class="progress"') && voies.includes('href="#/situation"'));
assert(voies.includes('La plus directe pour vous') && voies.includes('Source :') && voies.includes('data-action="recoHandicap"'));
assert(!voies.includes('ne se substitue ni aux textes officiels') && voies.includes('data-action="finish"') && voies.includes('Découvrir les métiers et concours'));
t.S.done = true;
assert(t.screens.accueil().includes('class="app-mention"'), 'La mention figure au bas de l’espace personnel.');
const voiesDone = t.screens.voies();
assert(voiesDone.includes('href="#/accueil"') && voiesDone.includes('href="#/metiers"') && voiesDone.includes('class="tabbar"'), 'Une fois le profil terminé, la page reste consultable depuis l’espace perso.');
t.S.done = false;
t.setHandicap(true);
assert(!JSON.stringify(t.S).includes('handicap'), 'La situation de handicap n’est jamais enregistrée.');

// Branche 2 : questionnaire étudiant sans la question boursier·e.
t.S.recoPath = 'nouveau';
assert(t.screens.interets().includes('href="#/projet"') && t.screens.interets().includes('Étape 5 / 8'));
assert(t.screens.situation().includes('href="#/traits"') && !t.screens.situation().includes('data-action="boursier"'));

// Demandeur·se d'emploi : même parcours.
const d = start();
d.click('profile', 'dem');
assert.equal(d.S.profile, 'dem');
d.S.name = 'Sam'; d.click('level', 'Bac+2'); d.submit('study-form');
assert.equal(d.location.hash, '#/experience', 'Le profil demandeur d’emploi suit le parcours reconversion.');
d.click('experience', '4-5'); d.click('recoPath', 'metier'); d.S.recoJob = 'vendeur'; d.S.budget = 'Je ne sais pas';
assert(d.screens.situation().includes('ouvertes aux demandeur·ses d’emploi') && !d.screens.situation().includes('data-action="boursier"'));
assert(d.screens.voies().includes('Vos voies d’accès'));

// Règle : « en reconversion » et « demandeur·se d'emploi » partagent chaque écran. Toute divergence hors libellé du profil échoue ici.
function walk(profileId) {
  const w = start(); w.click('profile', profileId);
  w.S.name = 'Sam'; w.S.level = 'Bac+2'; w.S.experience = '4-5'; w.S.recoPath = 'metier'; w.S.recoJob = 'vendeur'; w.S.recoKeys = ['vente']; w.S.budget = 'Je ne sais pas';
  const out = {};
  for (const name of ['niveau', 'experience', 'projet', 'metier-prive', 'situation', 'voies']) out[name] = w.screens[name]();
  w.S.recoPath = 'nouveau';
  for (const name of ['interets', 'ambition', 'traits', 'situation']) out['nouveau-' + name] = w.screens[name]();
  w.S.done = true; out.moi = w.screens.moi(); out.voiesDone = w.screens.voies(); out.accueil = w.screens.accueil();
  return out;
}
const rec = walk('rec'), dem = walk('dem');
const neutral = html => html.replace(/Les Prépas Talents<\/h2>|Demandeur·se d’emploi \?<\/h2>/g, 'TITRE</h2>').replace(/ouvertes aux demandeur·ses d’emploi|vous sont ouvertes/g, 'OUVERTES').replace(/En reconversion|En recherche d’emploi/g, 'PROFIL');
for (const k of Object.keys(rec)) assert.equal(neutral(dem[k]), neutral(rec[k]), 'Écran « ' + k + ' » : les profils reconversion et demandeur d’emploi doivent rester identiques.');

console.log('Reconversion vérifiée : base de ' + R.keywords.length + ' mots-clés, ' + R.professions.length + ' métiers du privé, parcours, autocomplétion, budget sans boursier·e, 8 profils de recette, parité reconversion / demandeur d’emploi.');
