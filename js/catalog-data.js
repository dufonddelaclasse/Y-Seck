/* Données publiques réparties en fichiers lisibles ; aucune réponse de profil n’est transmise. */
(function () {
  'use strict';
  var root = document.getElementById('app');
  root.innerHTML = '<main class="screen"><h1>Y-Seck</h1><p role="status">Chargement des métiers…</p></main>';
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
  read('data/catalogue.json').then(function (m) {
    return m.parts ? readParts(m.parts) : [m];
  }).then(function (parts) {
    var data = {};
    parts.forEach(function (p) { Object.keys(p).forEach(function (key) {
      data[key] = Array.isArray(p[key]) ? (data[key] || []).concat(p[key]) : p[key];
    }); });
    window.PUBLIC_DATA = data;
    return script('js/catalog.js?v=20261019-36').then(function () { return script('js/app.js?v=20261019-36'); });
  }).catch(function (error) {
    console.error('Chargement du catalogue :', error);
    root.innerHTML = '<main class="screen"><h1>Chargement interrompu</h1><p>Les données n’ont pas pu être chargées. Vérifiez votre connexion puis réessayez.</p><button class="btn" id="retry-data">Réessayer</button></main>';
    document.getElementById('retry-data').addEventListener('click', function () { location.reload(); });
  });
})();
