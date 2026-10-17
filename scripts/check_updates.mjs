import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../js/update.js', import.meta.url), 'utf8');
const release = JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).version;
assert(source.includes("var currentVersion = '" + release + "'"), 'Le module et le fichier de version doivent annoncer la même livraison.');
for (const file of ['index.html','js/catalog-data.js']) {
  const text=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  const versions=Array.from(text.matchAll(/\?v=(\d{8}-\d+)/g),match=>match[1]);
  assert(versions.length&&versions.every(version=>version===release),'Tous les éléments chargés doivent partager la même version : '+file);
}
const [releaseDay, releaseNumber] = release.split('-');
const nextVersion = releaseDay + '-' + (Number(releaseNumber) + 1);
const previousVersion = releaseDay + '-' + (Number(releaseNumber) - 1);

function start({version = nextVersion, hash = '#/accueil', offline = false} = {}) {
  const events = {window: {}, document: {}}, nodes = [], requests = [], navigations = [];
  let modal = false, observer;
  const element = tag => ({
    tagName: tag.toUpperCase(), children: [], hidden: false, listeners: {},
    setAttribute() {},
    appendChild(child) { this.children.push(child); },
    addEventListener(type, fn) { this.listeners[type] = fn; }
  });
  const document = {
    baseURI: 'https://dufonddelaclasse.github.io/Y-Seck/?source=test', readyState: 'complete', visibilityState: 'visible', activeElement: null,
    body: {appendChild(node) { nodes.push(node); }}, createElement: element,
    querySelector(selector) { assert.equal(selector, 'dialog[open]'); return modal ? {} : null; },
    addEventListener(type, fn) { events.document[type] = fn; }
  };
  const location = {hash, href: 'https://dufonddelaclasse.github.io/Y-Seck/?source=test' + hash, replace(url) { navigations.push(url); }};
  vm.runInNewContext(source, {
    document, window: {location, addEventListener(type, fn) { events.window[type] = fn; }},
    URL, Date, setTimeout(fn) { fn(); },
    MutationObserver: function (fn) { observer = fn; this.observe = function () {}; },
    fetch: async (url, options) => {
      requests.push({url, options});
      if (offline) throw new Error('Hors connexion');
      return {ok: true, json: async () => ({version})};
    },
    localStorage: new Proxy({}, {get() { throw new Error('Une vérification de version ne doit jamais modifier les réponses.'); }})
  });
  return {
    events, nodes, requests, navigations, document, location,
    setModal(value) { modal = value; observer(); },
    changeRoute(value) { location.hash = value; location.href = 'https://dufonddelaclasse.github.io/Y-Seck/?source=test' + value; events.window.hashchange(); },
    visibleNotice() { return nodes.find(node => !node.hidden); }
  };
}
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

const update = start(); await settle();
assert.equal(update.requests.length, 1);
assert.equal(update.requests[0].url, 'https://dufonddelaclasse.github.io/Y-Seck/version.json');
assert.equal(update.requests[0].options.cache, 'no-store');
assert(update.visibleNotice(), 'Une nouvelle version doit être proposée dans un écran de consultation.');
assert.equal(update.navigations.length, 0, 'La nouvelle version ne doit jamais recharger automatiquement la page.');
update.changeRoute('#/metier/admin-etat'); await settle();
assert.equal(update.requests.length, 1, 'Les navigations rapprochées ne doivent pas multiplier les requêtes.');
update.visibleNotice().children[1].listeners.click();
const target = new URL(update.navigations[0]);
assert.equal(target.searchParams.get('v'), nextVersion);
assert.equal(target.searchParams.get('source'), 'test');
assert.equal(target.hash, '#/metier/admin-etat', 'Actualiser doit conserver la fiche consultée.');

for (const route of ['bienvenue', 'versants', 'categories-intro', 'choix-profil', 'profil', 'niveau', 'interets', 'traits', 'situation']) {
  const onboarding = start({hash: '#/' + route}); await settle();
  assert(!onboarding.visibleNotice(), 'Le parcours ' + route + ' ne doit pas être interrompu.');
  assert.equal(onboarding.navigations.length, 0);
  onboarding.changeRoute('#/accueil');
  assert(onboarding.visibleNotice(), 'La proposition différée doit apparaître après le parcours.');
}

const editing = start(); editing.document.activeElement = {tagName: 'INPUT'}; await settle();
assert(!editing.visibleNotice(), 'La proposition ne doit pas apparaître pendant une saisie.');
editing.document.activeElement = null; editing.events.document.focusout();
assert(editing.visibleNotice());
editing.setModal(true); assert(!editing.visibleNotice(), 'La proposition reste hors des fenêtres modales.');
editing.setModal(false); assert(editing.visibleNotice());
const deferredRefresh = editing.visibleNotice().children[1];
editing.changeRoute('#/profil'); deferredRefresh.listeners.click();
assert.equal(editing.navigations.length, 0, 'Même un ancien bouton ne doit pas recharger un parcours en cours.');
editing.changeRoute('#/accueil');
editing.visibleNotice().children[2].listeners.click();
assert(!editing.visibleNotice(), 'Plus tard ferme la proposition pour cette version.');
editing.changeRoute('#/metiers'); assert(!editing.visibleNotice());

const resume = start({version: release}); await settle();
assert(!resume.visibleNotice(), 'Aucune proposition pour la version courante.');
resume.document.visibilityState = 'hidden'; resume.events.document.visibilitychange();
resume.document.visibilityState = 'visible'; resume.events.document.visibilitychange(); await settle();
assert.equal(resume.requests.length, 2, 'Le retour dans un onglet vérifie une nouvelle livraison.');
for (const version of [previousVersion, '20000101-99', 'incorrect', null]) {
  const stale = start({version}); await settle();
  assert(!stale.visibleNotice(), 'Une réponse ancienne ou invalide ne doit pas proposer de régression.');
}
const offline = start({offline: true}); await settle();
assert(!offline.visibleNotice()); assert.equal(offline.navigations.length, 0);
console.log('Mises à jour vérifiées : contrôle sans cache, proposition différée hors onboarding/saisie/modale, aucun rechargement automatique, route et réponses conservées.');
