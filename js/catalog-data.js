/* Données publiques réparties en fichiers lisibles ; aucune réponse de profil n’est transmise.
   Sans profil terminé, seuls les réglages de l’onboarding sont lus : le reste du catalogue (métiers, concours,
   calendriers…) est chargé à la fin de la création du profil, par YSECK_CATALOG.loadAll(). */
(function () {
  'use strict';
  var root = document.getElementById('app');
  /* Ouverture, actualisation ou mise à jour : même écran d’attente que le chargement des métiers après le profil. */
  root.innerHTML = '<main class="screen loading-screen"><p class="loading-text" role="status">Chargement en cours</p></main>';
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem('ofp-state-v1')) || {}; } catch (e) { saved = null; }
  /* Stockage indisponible : tout le catalogue, comme avant. */
  var onboardingOnly = !!saved && !saved.done;
  var ONBOARDING_PARTS = ['catalogue/metadata.json'];
  /* Collections attendues par catalog.js, vides tant que le catalogue n’est pas chargé. */
  function emptyData() { return { legacyJobs: [], rmfp: [], links: [], routes: [], talents: [], talentsGeo: {}, calendar: [] }; }
  var manifest = null;
  function read(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('Données indisponibles'); return r.json(); });
  }
  function script(path) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script'); s.src = path; s.onload = resolve; s.onerror = reject; document.body.appendChild(s);
    });
  }
  function readParts(paths) {
    var result = new Array(paths.length), next = 0;
    function worker() {
      var i = next++;
      if (i >= paths.length) return Promise.resolve();
      return read('data/' + paths[i]).then(function (part) { result[i] = part; return worker(); });
    }
    return Promise.all(Array.from({length: Math.min(6, paths.length)}, worker)).then(function () { return result; });
  }
  function publish(parts) {
    var data = emptyData();
    parts.forEach(function (p) { Object.keys(p).forEach(function (key) {
      data[key] = Array.isArray(p[key]) ? (data[key] || []).concat(p[key]) : p[key];
    }); });
    window.PUBLIC_DATA = data;
  }
  /* Fin de l’onboarding : lecture de tout le catalogue, puis nouvelle préparation des données. */
  function loadAll() {
    if (window.YSECK_CATALOG.full) return Promise.resolve();
    return readParts(manifest.parts).then(publish).then(function () { return script('js/catalog.js?v=20261019-196'); })
      .then(function () { window.YSECK_CATALOG.full = true; });
  }
  read('data/catalogue.json').then(function (m) {
    manifest = m;
    if (!m.parts) { onboardingOnly = false; return [m]; }
    return readParts(onboardingOnly ? m.parts.filter(function (p) { return ONBOARDING_PARTS.indexOf(p) > -1; }) : m.parts);
  }).then(function (parts) {
    publish(parts);
    window.YSECK_CATALOG = { full: !onboardingOnly, loadAll: loadAll };
    return script('js/catalog.js?v=20261019-196').then(function () { return script('js/app.js?v=20261019-196'); });
  }).catch(function (error) {
    console.error('Chargement du catalogue :', error);
    root.innerHTML = '<main class="screen"><h1>Chargement interrompu</h1><p>Les données n’ont pas pu être chargées. Vérifiez votre connexion puis réessayez.</p><button class="btn" id="retry-data">Réessayer</button></main>';
    document.getElementById('retry-data').addEventListener('click', function () { location.reload(); });
  });
})();
