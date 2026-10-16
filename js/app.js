(function () {
  'use strict';

  var D = window.DATA;
  var root = document.getElementById('app');
  var UI = window.YSECK_UI;
  var expandedDatesJob = null;
  var KEY = 'ofp-state-v1';

  /* ---------- État ---------- */
  var defaults = {
    profile: null, level: null, domains: [], traits: [], boursier: null, budget: null, done: false,
    metDomains: null, metCat: 'Toutes', metFp: 'Tous', q: '', calCat: 'Toutes', track: 'Administratif',
    prepBudget: null, alert: false, openCat: null, region: 'Toutes', talentsAll: false,
    name: '', location: null, favorites: [], children: [], activeChild: null, personalProfiles: {},
    metMode: 'mine', jobLimit: 60, calFp: 'Tous', calView: 'upcoming', calLimit: 40, calQ: '',
    contrast: false, largeText: false, dysFont: false, bookQ: '', bookSubject: 'Toutes'
  };
  var PERSON_FIELDS = ['name', 'level', 'domains', 'traits', 'boursier', 'budget', 'done', 'location', 'favorites'];
  var S = load();

  function personData(st) {
    var out = {};
    PERSON_FIELDS.forEach(function (k) { out[k] = Array.isArray(st[k]) ? st[k].slice() : st[k]; });
    return out;
  }
  function blankPerson(name) { return { name: name || '', level: null, domains: [], traits: [], boursier: null, budget: null, done: false, location: null, favorites: [] }; }
  function activeChild() { return S.children.find(function (c) { return c.id === S.activeChild; }); }
  function syncPerson() {
    if (isParent()) {
      var child = activeChild(); if (child) Object.assign(child, personData(S));
    } else if (S.profile) S.personalProfiles[S.profile] = personData(S);
  }
  function usePerson(p) {
    Object.assign(S, blankPerson(), p);
    S.metDomains = null; S.metMode = 'mine'; S.metCat = 'Toutes'; S.metFp = 'Tous'; S.q = ''; S.jobLimit = 60; S.region = 'Toutes';
    S.prepBudget = null; S.talentsAll = false; S.calCat = 'Toutes'; S.calFp = 'Tous'; S.calQ = ''; S.calLimit = 40;
    locationResults = []; locationStatus = ''; locationQuery = ''; locationSearchId++;
  }
  function ensureFamily() {
    if (!S.children.length) {
      var child = Object.assign(blankPerson('Enfant 1'), { id: 'enfant-1' });
      child.name = child.name || 'Enfant 1'; S.children.push(child); S.activeChild = child.id;
    }
    if (!activeChild()) S.activeChild = S.children[0].id;
  }
  function childName() { var c = activeChild(); return c ? c.name || 'votre enfant' : 'votre enfant'; }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      var st = Object.assign({}, defaults, raw ? JSON.parse(raw) : {});
      ['traits', 'domains', 'favorites', 'children'].forEach(function (k) { if (!Array.isArray(st[k])) st[k] = []; });
      st.personalProfiles = st.personalProfiles || {};
      st.children = st.children.filter(function (c) { return c && c.id; }).map(function (c) { return Object.assign(blankPerson(), c); });
      if (st.profile === 'par' && !st.children.length) {
        st.children = [Object.assign(blankPerson('Enfant 1'), personData(st), { id: 'enfant-1' })];
        st.children[0].name = st.children[0].name || 'Enfant 1'; st.activeChild = 'enfant-1';
      }
      if (st.profile === 'par' && st.children.length) {
        var child = st.children.find(function (c) { return c.id === st.activeChild; }) || st.children[0];
        st.activeChild = child.id; Object.assign(st, personData(child));
      }
      /* À chaque ouverture, l'onglet Métiers repart des domaines choisis */
      st.metDomains = null;
      st.metMode = 'mine'; st.jobLimit = 60;
      if (['Bac+5','Doctorat'].indexOf(st.level) > -1 && st.metCat === 'C') st.metCat = 'Toutes';
      return st;
    } catch (e) { return Object.assign({}, defaults, { domains: [], traits: [], favorites: [], children: [], personalProfiles: {} }); }
  }
  function save() {
    syncPerson();
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ }
  }
  function set(patch) { Object.assign(S, patch); save(); render(); }

  /* ---------- Icônes ---------- */
  var I = {
    bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    down: '<svg class="chev turn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    check: '<svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>'
  };

  Object.assign(I, UI.icons);
  I.grid = UI.icons.compass;
  I.layers = UI.icons.book;

  /* ---------- Outils ---------- */
  var MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  function fmtDate(iso) {
    var p = iso.split('-');
    return { day: String(parseInt(p[2], 10)), month: MONTHS[parseInt(p[1], 10) - 1], year: p[0] };
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function attr(name, val) { return ' data-' + name + '="' + esc(val) + '"'; }
  function domainLabel(id) { return (D.domainLabels || {})[id] || id; }
  function norm(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ').toLowerCase(); }
  function isParent() { return S.profile === 'par'; }
  function catClass(c) { return c === 'A+' ? 'cat-Ap' : (c === 'V' ? 'cat-X' : 'cat-' + c); }
  function catLabel(c) { return c === 'X' ? 'Contrat' : (c === 'V' ? 'Catégorie selon le poste' : 'Catégorie ' + c); }
  function catShort(c) { return c === 'X' || c === 'V' ? '<span style="font-size:0.6875rem">' + (c === 'V' ? 'Var.' : 'CT') + '</span>' : c; }
  function catBadge(c, size) {
    return '<span class="cat ' + (size || '') + ' ' + catClass(c) + '" aria-hidden="true">' + catShort(c) + '</span><span class="sr-only">' + catLabel(c) + ', </span>';
  }
  function fpNames(fp) { return fp.split('').map(function (k) { return D.fps[k]; }); }
  function traitLabel(id) {
    for (var g = 0; g < D.traitGroups.length; g++) {
      for (var i = 0; i < D.traitGroups[g].items.length; i++) if (D.traitGroups[g].items[i][0] === id) return D.traitGroups[g].items[i][1];
    }
    return id;
  }
  function ext(href, label, cls) {
    return '<a class="external-link ' + (cls === undefined ? 'link-plain mt-s' : cls) + '" href="' + esc(href) + '" target="_blank" rel="noopener" title="' + esc(label) + ' (nouvelle fenêtre)">' +
      esc(label) + '<span class="sr-only"> (nouvelle fenêtre)</span></a>';
  }
  function announce(msg) {
    var live = document.getElementById('live');
    if (!live) return;
    live.textContent = '';
    setTimeout(function () { live.textContent = msg; }, 50);
  }
  function back(href, label) { return '<a class="back" href="' + href + '">' + I.back + esc(label) + '</a>'; }
  function progress(n, total) {
    var out = '<div class="progress" style="grid-template-columns:repeat(' + total + ',minmax(0,1fr))" aria-hidden="true">';
    for (var i = 1; i <= total; i++) out += '<span class="' + (i <= n ? 'on' : '') + '"></span>';
    return out + '</div>';
  }
  function tabbar(active) {
    if (active === 'prepas') active = 'concours';
    var tabs = [['accueil', isParent() ? 'Famille' : 'Accueil', I.home], ['metiers', 'Métiers', I.grid], ['concours', 'Concours', I.layers], ['favoris', 'Favoris', I.bookmark], ['moi', 'Profil', I.user]];
    return '<nav class="tabbar" aria-label="Navigation principale">' + tabs.map(function (t) {
      var on = t[0] === active;
      return '<a href="#/' + t[0] + '" class="' + (on ? 'on' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + t[2] + t[1] + '</a>';
    }).join('') + '</nav>';
  }
  function chip(action, value, label, on, extraCls) {
    return '<button type="button" class="chip' + (extraCls ? ' ' + extraCls : '') + ((action === 'metCat' || action === 'calCat') && value !== 'Toutes' ? ' category-choice ' + catClass(value) : '') + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', action) + attr('v', value) + '>' + esc(label) + '</button>';
  }
  function searchField(id, label, placeholder, value) {
    return '<div class="search">' + I.search + '<label class="sr-only" for="' + id + '">' + esc(label) + '</label>' +
      '<input type="search" id="' + id + '" placeholder="' + esc(placeholder) + '" value="' + esc(value || '') + '" autocomplete="off">' +
      '<button type="button" class="search-clear" data-action="clearSearch"' + attr('v',id) + ' aria-label="Effacer la recherche"' + (value ? '' : ' hidden') + '>' + I.close + '</button></div>';
  }

  /* ---------- Régions (code postal) ---------- */
  var REG = {
    ARA: 'Auvergne-Rhône-Alpes', BFC: 'Bourgogne-Franche-Comté', BRE: 'Bretagne', CVL: 'Centre-Val de Loire', COR: 'Corse',
    GE: 'Grand Est', HDF: 'Hauts-de-France', IDF: 'Île-de-France', NOR: 'Normandie', NA: 'Nouvelle-Aquitaine',
    OCC: 'Occitanie', PDL: 'Pays de la Loire', PACA: 'Provence-Alpes-Côte d’Azur', OM: 'Outre-mer'
  };
  var DEP = {
    '01': 'ARA', '02': 'HDF', '03': 'ARA', '04': 'PACA', '05': 'PACA', '06': 'PACA', '07': 'ARA', '08': 'GE', '09': 'OCC', '10': 'GE',
    '11': 'OCC', '12': 'OCC', '13': 'PACA', '14': 'NOR', '15': 'ARA', '16': 'NA', '17': 'NA', '18': 'CVL', '19': 'NA', '20': 'COR',
    '21': 'BFC', '22': 'BRE', '23': 'NA', '24': 'NA', '25': 'BFC', '26': 'ARA', '27': 'NOR', '28': 'CVL', '29': 'BRE', '30': 'OCC',
    '31': 'OCC', '32': 'OCC', '33': 'NA', '34': 'OCC', '35': 'BRE', '36': 'CVL', '37': 'CVL', '38': 'ARA', '39': 'BFC', '40': 'NA',
    '41': 'CVL', '42': 'ARA', '43': 'ARA', '44': 'PDL', '45': 'CVL', '46': 'OCC', '47': 'NA', '48': 'OCC', '49': 'PDL', '50': 'NOR',
    '51': 'GE', '52': 'GE', '53': 'PDL', '54': 'GE', '55': 'GE', '56': 'BRE', '57': 'GE', '58': 'BFC', '59': 'HDF', '60': 'HDF',
    '61': 'NOR', '62': 'HDF', '63': 'ARA', '64': 'NA', '65': 'OCC', '66': 'OCC', '67': 'GE', '68': 'GE', '69': 'ARA', '70': 'BFC',
    '71': 'BFC', '72': 'PDL', '73': 'ARA', '74': 'ARA', '75': 'IDF', '76': 'NOR', '77': 'IDF', '78': 'IDF', '79': 'NA', '80': 'HDF',
    '81': 'OCC', '82': 'OCC', '83': 'PACA', '84': 'PACA', '85': 'PDL', '86': 'NA', '87': 'NA', '88': 'GE', '89': 'BFC', '90': 'BFC',
    '91': 'IDF', '92': 'IDF', '93': 'IDF', '94': 'IDF', '95': 'IDF', '97': 'OM', '98': 'OM'
  };
  function regionOf(code) { return DEP[String(code).slice(0, 2)] || 'OM'; }
  function regionSelect() {
    var keys = Object.keys(REG);
    return '<label class="select"><span>Région</span><select id="region">' +
      '<option value="Toutes"' + (S.region === 'Toutes' ? ' selected' : '') + '>Toute la France</option>' +
      keys.map(function (k) { return '<option value="' + k + '"' + (S.region === k ? ' selected' : '') + '>' + esc(REG[k]) + '</option>'; }).join('') +
      '</select></label>';
  }
  function inRegion(code) { return S.region === 'Toutes' || regionOf(code) === S.region; }
  var locationResults = [], locationStatus = '', locationQuery = '', locationSearchId = 0, communes = null;
  function locationForm() {
    return '<section class="stack mt-m"><h2 class="h3">' + (isParent() ? 'Son lieu de vie' : 'Votre lieu de vie') + '</h2><p class="small m0">' + (S.location ? esc(S.location.label) : 'Ajoutez une commune pour classer les Prépas Talents par proximité.') + '</p>' +
      searchField('location-query','Commune ou code postal','Ex. : Lyon ou 69003',locationQuery) + '<button type="button" class="btn outline" data-action="searchLocation">Rechercher la commune</button>' +
      '<p class="small m0" role="status">' + esc(locationStatus) + '</p><div class="stack">' + locationResults.map(function (c, i) { return '<button type="button" class="chip" data-action="selectLocation"' + attr('v', i) + '>' + esc(c.label) + '</button>'; }).join('') + '</div>' +
      (S.location ? '<button type="button" class="text-btn" data-action="clearLocation">Retirer la commune</button>' : '') +
      '<p class="small m0">La recherche et le calcul des distances se font sur cet appareil. La commune saisie n’est transmise à aucun service externe.</p></section>';
  }
  async function searchLocation() {
    var input = document.getElementById('location-query');
    var query = input ? input.value.trim() : '';
    var request = ++locationSearchId;
    if (query.length < 2) { locationStatus = 'Saisissez une commune ou un code postal.'; render(); return; }
    var owner = isParent() ? S.activeChild : S.profile;
    locationStatus = 'Recherche de communes…'; locationResults = []; render();
    try {
      if (!communes) {
        var response = await fetch('data/communes.json');
        if (!response.ok) throw new Error('communes');
        var manifest = await response.json();
        communes = Array.isArray(manifest) ? manifest : [].concat.apply([], await Promise.all(manifest.parts.map(async function (path) {
          var part = await fetch('data/' + path); if (!part.ok) throw new Error('communes'); return part.json();
        })));
      }
      if (request !== locationSearchId || owner !== (isParent() ? S.activeChild : S.profile)) return;
      var q = norm(query);
      locationResults = communes.filter(function (c) { return /^\d{5}$/.test(query) ? c[2].indexOf(query) > -1 : norm(c[0]).indexOf(q) > -1; })
        .sort(function (a, b) { return (norm(a[0]) === q ? -1 : 0) - (norm(b[0]) === q ? -1 : 0) || a[0].localeCompare(b[0], 'fr'); }).slice(0, 12)
        .map(function (c) { return { label: c[0] + ' (' + c[2].join(', ') + ')', code: c[1], lon: c[3], lat: c[4] }; });
      locationStatus = locationResults.length ? 'Choisissez votre commune.' : 'Aucune commune trouvée. Essayez une autre orthographe.';
    } catch (err) { if(request !== locationSearchId)return; locationStatus = 'Le référentiel de communes est indisponible. Réessayez plus tard.'; }
    render();
  }
  function distanceTo(t) {
    if (!S.location || !t.coords || t.online) return Infinity;
    var rad = Math.PI / 180, a = S.location.lat * rad, b = t.coords[1] * rad;
    var d = Math.sin((b - a) / 2) ** 2 + Math.cos(a) * Math.cos(b) * Math.sin((t.coords[0] - S.location.lon) * rad / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(d), Math.sqrt(1 - d));
  }

  /* ---------- Niveau ---------- */
  /* 0 sans diplôme, 1 brevet ou CAP, 2 bac, 3 bac+2, 4 bac+3, 5 bac+5, 6 doctorat */
  var RANK = {
    '6e': 0, '5e': 0, '4e': 0, '3e': 0, 'Seconde': 1, 'Première': 1, 'Terminale': 1,
    'Bac+1 / +2': 2, 'Bac+3': 4, 'Bac+5': 5, 'Doctorat': 6,
    'Sans diplôme': 0, 'Brevet': 1, 'CAP / BEP': 1, 'Bac': 2, 'Bac+2': 3
  };
  var NEED = ['', 'Avec le brevet ou un CAP', 'Avec le bac', 'Avec un Bac+2', 'Avec un Bac+3', 'Avec un Bac+5', 'Avec un doctorat'];
  var DIP = ['Sans diplôme', 'Brevet ou CAP', 'Bac', 'Bac+2', 'Bac+3', 'Bac+5', 'Doctorat'];
  function userRank() { return S.level && RANK[S.level] !== undefined ? RANK[S.level] : null; }
  function categoryFit(category) {
    var rank=userRank(),minimum={'A+':4,A:4,B:2,C:0}[category];
    return rank!==null&&minimum!==undefined&&rank>=minimum?'<span class="category-fit">'+I.check+'<span>Niveau d’étude compatible</span></span>':'';
  }
  function isOpen(j) { var r = userRank(); return j.lvl !== null && r !== null && r >= j.lvl; }
  function jobCategories(j) { return j.categories && j.categories.length ? j.categories : [j.cat]; }
  function passesLevelCategory(j) { return !(userRank() >= 5) || jobCategories(j).some(function (c) { return ['B', 'A', 'A+'].indexOf(c) > -1; }); }

  function reachable() {
    var l = S.level;
    if (!l) return 'A+, A, B ou C selon votre diplôme.';
    if (['6e', '5e', '4e', '3e'].indexOf(l) > -1) return 'Avec le brevet : certains concours C. Avec le bac : B.';
    if (l === 'Sans diplôme') return 'Catégorie C sans concours, PACTE ou contrat.';
    if (l === 'Brevet' || l === 'CAP / BEP') return 'Catégorie C dès maintenant. B avec le bac.';
    if (l === 'Seconde' || l === 'Première' || l === 'Terminale') return 'Avec le bac : B et C. Avec une licence : A et A+.';
    if (l === 'Bac+1 / +2' || l === 'Bac' || l === 'Bac+2') return 'B et C dès maintenant. A et A+ avec une licence.';
    return 'A+, A et B : selon le diplôme spécifique et les conditions du concours.';
  }

  /* ---------- Correspondance métiers ---------- */
  function sharedTraits(j) { return (j.traits || []).filter(function (t) { return S.traits.indexOf(t) > -1; }); }
  function matchesDomains(job, domains) { return domains.some(function(id){return (job.interests || [job.domain]).indexOf(id)>-1;}); }
  function score(j) { return (matchesDomains(j,S.domains) ? 3 : 0) + sharedTraits(j).length; }
  function myJobs() {
    var base = D.jobs.filter(function (j) { return passesLevelCategory(j) && (!S.domains.length || matchesDomains(j,S.domains)); });
    return base.sort(function (a, b) { return score(b) - score(a); });
  }
  function activeDomains() { return S.metDomains === null ? S.domains.slice() : S.metDomains; }

  /* Prépas Talents qui préparent les concours d'une liste de métiers */
  function prepKeys(jobs) {
    var keys = [];
    jobs.forEach(function (j) {
      var preps = [j.prep].concat((j.routeIds || []).map(function (id) { return D.accessRoutes[id] && D.accessRoutes[id].prep; }));
      preps.filter(Boolean).forEach(function (p) { if (keys.indexOf(norm(p)) === -1) keys.push(norm(p)); });
    });
    return keys;
  }
  function talentMatches(t, keys) {
    return t.concours.filter(function (c) { var n = norm(c); return keys.some(function (k) { return n.indexOf(k) > -1; }); });
  }

  function todayISO() {
    var parts = new Intl.DateTimeFormat('fr', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    function part(type) { return parts.find(function (p) { return p.type === type; }).value; }
    return part('year') + '-' + part('month') + '-' + part('day');
  }
  function upcoming() {
    var today = todayISO();
    return D.calendar.filter(function (c) { return (c.date || c.written || c.oral || '') >= today || (!c.date && c.provisional); }).sort(function (a, b) { return (a.date || '9999').localeCompare(b.date || '9999'); });
  }
  function examsFor(j, all) {
    var routes = (j.routeIds || []).map(function (id) { return D.accessRoutes[id]; }).filter(Boolean);
    return (all ? D.calendar : upcoming()).filter(function (c) {
      if (j.fp.indexOf(c.fp) === -1) return false;
      if ((c.routeIds || []).some(function (id) { return (j.routeIds || []).indexOf(id) > -1; })) return true;
      return false;
    });
  }
  function calendarRows(list, limit) {
    if (!list.length) return '<p class="empty">Aucune session publiée pour cette sélection.</p>';
    return list.slice(0, limit || 40).map(function (c) {
      var status = c.provisional ? 'Calendrier prévisionnel' : (c.date && c.date < todayISO() ? 'Candidatures closes' : 'Session publiée');
      return '<article class="prep"><div class="head"><h3 class="h3">' + esc(c.name) + '</h3>' + catBadge(c.cat, 'sm') + '</div><p>' + esc(D.fps[c.fp] + ' · ' + c.voie) + '</p>' +
        (c.location ? '<p>' + esc(c.location + (c.employer ? ' · ' + c.employer : '')) + '</p>' : '') +
        '<span class="small">' + status + '</span><dl class="exam-dates"><dt>Ouverture</dt><dd>' + esc(c.openLabel || c.open || 'Non publiée') + '</dd><dt>Clôture</dt><dd>' + esc(c.closeLabel || c.date || 'Non publiée') + '</dd><dt>Écrits ou sélection</dt><dd>' + esc(c.writtenLabel || 'Non publiés') + '</dd><dt>Oraux</dt><dd>' + esc(c.oralLabel || 'Non publiés') + '</dd></dl>' +
        ext(c.url, 'Voir l’avis officiel', 'link-plain') + '<p class="small m0">Source : ' + esc(c.source) + ' · vérifiée le ' + esc(c.checked) + '</p></article>';
    }).join('');
  }

  /* ---------- Écrans : introduction ---------- */
  var screens = {};
  var STEPS = 4;

  function introDots(n) {
    return '<div class="intro-dots" aria-hidden="true">' + [1, 2, 3].map(function (i) { return '<span class="' + (i === n ? 'on' : '') + '"></span>'; }).join('') + '</div>';
  }

  screens.bienvenue = function () {
    return '<main class="screen welcome">' +
      '<div class="welcome-deco" aria-hidden="true"><span class="cat-Ap">A+</span><span class="cat-A">A</span><span class="cat-B">B</span><span class="cat-C">C</span></div>' +
      '<div class="welcome-txt">' +
      '<h1 class="wordmark">Y-Seck</h1>' +
      '<p class="welcome-lead">Tous les métiers de la fonction publique, et le chemin pour y arriver.</p>' +
      '<p class="welcome-sub">Avec ou sans concours, avec ou sans diplôme\u00a0: trouvez les métiers qui vous ressemblent, les études et les prépas pour les atteindre.</p>' +
      '</div>' +
      introDots(1) +
      '</main><div class="footer welcome-foot"><a class="btn white" href="#/versants">Commencer</a>' +
      (S.done ? '<a class="link-plain white-link" href="#/accueil">Aller à mon parcours</a>' : '') + '</div>';
  };

  screens.versants = function () {
    var fps = [
      { k: 'E', t: 'La fonction publique d’État', d: 'Elle fait tourner les services de l’État, partout en France.', ex: 'Ministères, préfectures, écoles et lycées, tribunaux, impôts, police, armées.', tint: 'tint-blue', dot: 'var(--blue)' },
      { k: 'T', t: 'La fonction publique territoriale', d: 'Elle travaille au plus près des habitant·es, dans leur ville, leur département, leur région.', ex: 'Mairies, intercommunalités, conseils départementaux et régionaux.', tint: 'tint-mint', dot: 'var(--mint)' },
      { k: 'H', t: 'La fonction publique hospitalière', d: 'Elle soigne et accompagne, dans les établissements publics de santé.', ex: 'Hôpitaux publics, EHPAD publics, établissements sociaux et médico-sociaux.', tint: 'tint-cyan', dot: '#22C7E0' }
    ];
    return '<main class="screen">' +
      '<div class="topbar">' + back('#/bienvenue', 'Retour') + '<span class="eyebrow">Comprendre 1 / 2</span></div>' +
      '<h1 class="mt-m">3 fonctions publiques</h1>' +
      '<p class="lead">Travailler dans le service public, c’est travailler pour l’un de ces trois employeurs.</p>' +
      '<div class="stack mt-s">' + fps.map(function (f) {
        return '<section class="explain ' + f.tint + '" aria-label="' + esc(f.t) + '">' +
          '<h2 class="explain-t"><span class="dot" style="background:' + f.dot + '"></span>' + esc(f.t) + '</h2>' +
          '<p>' + esc(f.d) + '</p><p class="ex"><b>Où ?</b> ' + esc(f.ex) + '</p></section>';
      }).join('') + '</div>' +
      '<div class="callout tint-yellow"><span class="pin"></span><p>Bon à savoir : un même métier existe souvent dans les trois. Et au cours d’une carrière, on peut passer de l’une à l’autre.</p></div>' +
      '</main><div class="footer"><a class="btn" href="#/categories-intro">J’ai compris</a></div>';
  };

  screens['categories-intro'] = function () {
    var cats = [
      { id: 'A+', t: 'Les cadres supérieurs', d: 'Ils dirigent les grandes administrations et pilotent les politiques publiques.', dip: 'Bac+3 minimum, souvent Bac+5', ex: 'Directeur·rice d’hôpital, magistrat·e, commissaire', tint: 'tint-blue' },
      { id: 'A', t: 'Concevoir, élaborer, manager', d: 'Ils imaginent les projets, préparent les décisions et encadrent des équipes.', dip: 'Bac+3 minimum', ex: 'Attaché·e, inspecteur·rice, professeur·e, infirmier·ère', tint: 'tint-mint' },
      { id: 'B', t: 'Appliquer, rédiger, gérer', d: 'Ils mettent en œuvre les décisions, suivent les dossiers et peuvent encadrer une petite équipe.', dip: 'Bac minimum', ex: 'Greffier·ère, technicien·ne, gardien·ne de la paix', tint: 'tint-cyan' },
      { id: 'C', t: 'Exécuter, accueillir, assurer', d: 'Ils font tourner le service au quotidien, sur le terrain et au contact du public.', dip: 'Brevet, CAP, BEP, ou sans diplôme', ex: 'Adjoint·e administratif·ve, agent·e technique, ATSEM', tint: 'tint-yellow' }
    ];
    return '<main class="screen category-screen">' +
      '<div class="topbar">' + back('#/versants', 'Retour') + '<span class="eyebrow">Comprendre 2 / 2</span></div>' +
      '<h1 class="mt-m">4 catégories</h1>' +
      '<p class="lead">Chaque poste appartient à une catégorie. Elle dépend du niveau de responsabilité et du diplôme demandé pour y entrer.</p>' +
      '<div class="stack mt-s">' + cats.map(function (c) {
        return '<section class="explain row-x ' + c.tint + '" aria-label="Catégorie ' + c.id + '">' +
          '<span class="cat lg ' + catClass(c.id) + '" aria-hidden="true">' + c.id + '</span>' +
          '<div class="explain-body"><h2 class="explain-t"><span class="sr-only">Catégorie ' + c.id + ' : </span>' + esc(c.t) + '</h2>' +
          '<p>' + esc(c.d) + '</p><p class="ex"><b>Pour y entrer :</b> ' + esc(c.dip) + '</p><p class="ex"><b>Par exemple :</b> ' + esc(c.ex) + '</p>' + categoryFit(c.id) + '</div></section>';
      }).join('') + '</div>' +
      '<div class="callout tint-blue"><span class="pin"></span><p>Rien n’est figé : on peut monter de catégorie au cours de sa carrière, par concours interne ou par promotion.</p></div>' +
      '</main><div class="footer"><button type="button" class="btn" data-action="startProfile">Démarrer mon profil</button></div>';
  };

  /* ---------- Écrans : onboarding ---------- */

  screens.profil = function () {
    var profiles = [['etu', 'Étudiant·e'], ['par', 'Parent'], ['rec', 'En reconversion']];
    var html = '<main class="screen">' +
      '<div class="topbar"><span class="eyebrow">Étape 1 / ' + STEPS + '</span>' +
      (S.done ? '<a class="link-plain" href="#/accueil">Fermer</a>' : '<a class="link-plain" href="#/accueil" data-action="skip">Passer</a>') + '</div>' +
      progress(1, STEPS) +
      (isParent() ? '<h1 class="mt-l">Prénom ou pseudo de l’enfant</h1>' :
      '<h1 class="mt-l">Vous êtes</h1><p class="lead">Le parcours s’adapte à votre profil.</p><div class="stack mt-s">' + profiles.map(function (p) {
        var on = S.profile === p[0];
        return '<button type="button" class="opt' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', 'profile') + attr('v', p[0]) + '><span>' + p[1] + '</span>' + (on ? I.check : '') + '</button>';
      }).join('') + '</div>');
    if (S.profile) {
      var list = S.profile === 'rec' ? D.levels.adult : D.levels.school;
      var title = isParent() ? 'Le niveau d’étude de votre enfant' : 'Votre niveau d’étude';
      html += '<label class="field mt-s"><span>' + (isParent() ? 'Prénom ou pseudo de votre enfant' : 'Votre prénom ou pseudo') + ' <span class="small">(facultatif)</span></span><input id="person-name" maxlength="50" autocomplete="off" value="' + esc(S.name) + '"></label>' +
        '<section class="stack mt-m divider" aria-label="' + esc(title) + '"><h2>' + title + '</h2><div class="row">' +
        list.map(function (l) { return chip('level', l, l, S.level === l); }).join('') + '</div></section>';
    }
    var ready = S.profile && S.level;
    html += '<p class="notice mt-m">' + I.lock + '<span>Vos réponses restent sur cet appareil. Rien n’est envoyé, aucun compte, aucun traceur. <a href="#/confidentialite">Données personnelles</a></span></p>';
    html += '</main><div class="footer">' +
      (ready ? '' : '<span class="small center" id="hint-continue">' + (isParent() ? 'Choisissez son niveau pour continuer.' : 'Choisissez un profil puis un niveau pour continuer.') + '</span>') +
      '<button type="button" class="btn" data-action="go" data-v="interets"' + (ready ? '' : ' disabled aria-describedby="hint-continue"') + '>Continuer</button></div>';
    return html;
  };

  screens.interets = function () {
    var n = S.domains.length;
    var count = n === 0 ? 'Aucun choix : on vous montre tout.' : (n === 1 ? '1 domaine choisi' : n + ' domaines choisis');
    return '<main class="screen">' +
      '<div class="topbar">' + back('#/profil', 'Retour') + '<span class="eyebrow">Étape 2 / ' + STEPS + '</span></div>' +
      progress(2, STEPS) +
      '<h1 class="mt-l">' + (isParent() ? 'Ce qui attire votre enfant' : 'Ce qui vous attire') + '</h1>' +
      '<p class="lead">Choisissez autant de domaines que vous voulez.</p>' +
      '<div class="grid-2 interest-grid mt-s">' + D.domains.map(function (d) {
        var on = S.domains.indexOf(d) > -1;
        return '<button type="button" class="interest-option' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', 'domain') + attr('v', d) + '><span class="interest-name">' + esc(domainLabel(d)) + '</span><span class="interest-check" aria-hidden="true">' + (on ? I.check : '') + '</span></button>';
      }).join('') + '</div></main>' +
      '<div class="footer"><div class="interest-footer"><span class="small">' + count + '</span><button type="button" class="text-btn" data-action="clearDomains"' + (n ? '' : ' disabled') + '>Effacer</button></div><a class="btn" href="#/traits">Continuer</a></div>';
  };

  screens.traits = function () {
    var n = S.traits.length;
    return '<main class="screen">' +
      '<div class="topbar">' + back('#/interets', 'Retour') + '<span class="eyebrow">Étape 3 / ' + STEPS + '</span></div>' +
      progress(3, STEPS) +
      '<h1 class="mt-l">' + (isParent() ? 'Sa façon de travailler' : 'Votre façon de travailler') + '</h1>' +
      '<p class="lead">' + (isParent() ? 'Ce qui lui ressemble.' : 'Ce qui vous ressemble.') + ' Sans limite, il n’y a pas de mauvaise réponse.</p>' +
      D.traitGroups.map(function (g) {
        var title = isParent() ? g.title.replace('vous plaît', 'lui plaît').replace('Votre caractère', 'Son caractère') : g.title;
        return '<section class="stack mt-s" aria-label="' + esc(title) + '"><h2 class="h3">' + esc(title) + '</h2><div class="row">' +
          g.items.map(function (t) { return chip('trait', t[0], t[1], S.traits.indexOf(t[0]) > -1); }).join('') + '</div></section>';
      }).join('') +
      '</main><div class="footer"><span class="small center">' + (n === 0 ? 'Vous pouvez passer cette étape.' : n + ' trait' + (n > 1 ? 's' : '') + ' choisi' + (n > 1 ? 's' : '')) + '</span>' +
      '<a class="btn" href="#/situation">Continuer</a></div>';
  };

  screens.situation = function () {
    var q = isParent() ? 'Votre enfant est-il boursier·e ?' : 'Êtes-vous boursier·e ?';
    var budgets = ['Gratuit uniquement', 'Moins de 1 000 €', 'Plus de 1 000 €', 'Je ne sais pas'];
    return '<main class="screen">' +
      '<div class="topbar">' + back('#/traits', 'Retour') + '<span class="eyebrow">Étape 4 / ' + STEPS + '</span></div>' +
      progress(4, STEPS) +
      '<h1 class="mt-l">' + (isParent() ? 'Sa situation' : 'Votre situation') + '</h1>' +
      '<h2 class="h3 mt-s">' + q + '</h2>' +
      '<div class="grid-2">' + ['Oui', 'Non'].map(function (v) {
        var on = S.boursier === v;
        return '<button type="button" class="opt sm center' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', 'boursier') + attr('v', v) + '>' + v + '</button>';
      }).join('') + '</div>' +
      '<h2 class="h3 mt-m">Budget pour se préparer</h2>' +
      '<div class="stack">' + budgets.map(function (b) {
        var on = S.budget === b;
        return '<button type="button" class="opt sm' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', 'budget') + attr('v', b) + '><span>' + b + '</span>' + (on ? I.check : '') + '</button>';
      }).join('') + '</div>' +
      '<section class="callout tint-yellow mt-s talents-box" aria-label="Qu’est-ce qu’une Prépa Talents ?"><span class="pin red"></span><div>' +
      '<h2 class="h3">C’est quoi, une Prépa Talents ?</h2>' +
      '<p>Une préparation <b>gratuite</b> aux concours de catégorie A, A+ et B, dans une université, un IEP ou une école du service public. Plus de 100 en France, outre-mer compris.</p>' +
      '<p>Au programme : cours, entraînements aux épreuves et un·e tuteur·rice qui vous suit toute l’année.</p>' +
      '<p><b>' + (S.boursier === 'Oui' ? 'Bonne nouvelle : ' : '') + 'une bourse de ' + esc(D.talentsGrantLabel || '5 000 €') + ' par an</b> est versée aux élèves. L’entrée se fait sur dossier et entretien, selon les ressources et la motivation.</p>' +
      '</div></section>' +
      '</main><div class="footer"><a class="btn" href="#/accueil" data-action="finish">Voir ' + (isParent() ? 'son parcours' : 'mon parcours') + '</a></div>';
  };

  /* ---------- Tableau de bord ---------- */
  function personalHome() {
    var jobs = myJobs();
    var sub = S.domains.slice(0, 3).map(domainLabel).join(', ') + (S.domains.length > 3 ? '…' : '');
    var cards = [
      ['#/metiers', 'tint-mint', 'var(--mint)', isParent() ? 'Ses métiers à découvrir' : 'Vos métiers à découvrir', jobs.length + ' pistes selon ' + (isParent() ? 'ses' : 'vos') + ' choix.'],
      ['#/concours', 'tint-cyan', '#22C7E0', 'Comment y accéder', reachable()]
    ];
    return '<main class="screen pt">' +
      '<span class="eyebrow">' + (isParent() ? 'Parcours de votre enfant' : 'Votre espace personnel') + '</span>' +
      '<h1>' + (isParent() ? esc(childName()) : (S.name ? 'Bonjour ' + esc(S.name) : 'Votre avenir, à votre rythme')) + '</h1>' +
      (S.level ? '<span class="study-level">' + I.graduation + '<span>' + esc(S.level) + '</span></span>' : '') +
      '<p class="lead">Découvrez les métiers publics qui correspondent à ' + (isParent() ? 'ses' : 'vos') + ' envies.</p>' +
      (isParent() ? '<a class="link-plain" href="#/accueil">Tous les parcours de la famille</a>' : '') +
      (sub ? '<p class="small m0">' + esc(sub) + '</p>' : '') +
      '<div class="stack mt-s">' + cards.map(function (c) {
        return '<a class="card ' + c[1] + '" href="' + c[0] + '"><div class="card-txt">' +
          '<span class="t"><span class="dot" style="background:' + c[2] + '"></span>' + c[3] + '</span><span class="d">' + esc(c[4]) + '</span></div>' +
          '<span class="go">' + I.arrow + '</span></a>';
      }).join('') + '</div>' +
      '<div class="grid-2"><a class="prep" href="#/favoris"><b>' + S.favorites.length + '</b><span>' + (isParent() ? 'Ses métiers favoris' : 'Vos métiers favoris') + '</span></a><a class="prep" href="#/interets"><b>' + (isParent() ? 'Son projet' : 'Votre projet') + '</b><span>Affiner les préférences</span></a></div>' +
      '</main>' + tabbar('accueil');
  }
  screens.accueil = function () { return isParent() ? screens.famille() : personalHome(); };
  screens.enfant = function () { return personalHome(); };
  screens.famille = function () {
    ensureFamily();
    var completed = S.children.filter(function (c) { return c.done; }).length;
    var favorites = S.children.reduce(function (n, c) { return n + c.favorites.length; }, 0);
    return '<main class="screen pt"><span class="eyebrow">Y-Seck · Parents</span><h1>Mon espace famille</h1>' +
      '<p class="lead">Accompagnez chaque enfant à son rythme, dans un seul espace.</p>' +
      '<div class="grid-2"><div class="prep"><b>' + S.children.length + '</b><span>Parcours accompagnés</span></div><div class="prep"><b>' + completed + '</b><span>Profils complétés</span></div></div>' +
      '<h2 class="mt-m">Les parcours de votre famille</h2><div class="stack">' + S.children.map(function (c) {
        return '<button type="button" class="prep family-card" data-action="openChild"' + attr('v', c.id) + '><span class="head"><b>' + esc(c.name || 'Votre enfant') + '</b>' + I.chev + '</span><span class="small">' + esc(c.level || 'Niveau à renseigner') + ' · ' + (c.done ? 'Profil complété' : 'Profil initial') + '</span><span class="row">' + c.domains.map(function (d) { return '<span class="tag">' + esc(domainLabel(d)) + '</span>'; }).join('') + '</span><span class="small">' + c.favorites.length + ' métier' + (c.favorites.length > 1 ? 's' : '') + ' favori' + (c.favorites.length > 1 ? 's' : '') + '</span></button>';
      }).join('') + '</div><button type="button" class="btn outline" data-action="addChild">Ajouter un profil</button>' +
      '<p class="small">Chaque enfant conserve ses choix, son lieu de vie et ses favoris. Les informations restent sur cet appareil.</p></main>' + tabbar('accueil');
  };
  function childSelector() {
    if (!isParent()) return '';
    return '<div class="row scroller" role="group" aria-label="Choisir un enfant">' + S.children.map(function (c) {
      return chip('selectChild', c.id, c.name || 'Votre enfant', c.id === S.activeChild, 'blue');
    }).join('') + '</div>';
  }
  screens.favoris = function () {
    var list = D.jobs.filter(function (j) { return S.favorites.indexOf(j.id) > -1; });
    return '<main class="screen pt"><span class="eyebrow">Garder pour plus tard</span><h1>' + (isParent() ? 'Ses favoris' : 'Vos favoris') + '</h1>' + childSelector() +
      (isParent() ? '<p class="small">La sélection de ' + esc(childName()) + '</p>' : '') +
      '<div class="list">' + (list.length ? list.map(jobRow).join('') : '<p class="empty">Aucun métier enregistré. Ouvrez une fiche métier puis choisissez « Ajouter aux favoris ».</p>') + '</div><a class="btn outline" href="#/metiers">Explorer les métiers</a></main>' + tabbar('favoris');
  };

  /* ---------- Métiers ---------- */
  function filteredJobs() {
    var q = norm(S.q || '');
    var doms = activeDomains();
    var list = D.jobs.filter(function (j) {
      if (!passesLevelCategory(j)) return false;
      if (doms.length && !matchesDomains(j,doms)) return false;
      if (S.metCat !== 'Toutes' && jobCategories(j).indexOf(S.metCat) === -1) return false;
      if (S.metFp !== 'Tous' && j.fp.indexOf(S.metFp) === -1) return false;
      if (q && norm(j.name + ' ' + j.domain + ' ' + (j.rmfpDomain || '') + ' ' + (j.sourceName || '') + ' ' + (j.aliases || []).join(' ') + ' ' + (j.interests || []).map(domainLabel).join(' ')).indexOf(q) === -1) return false;
      return true;
    });
    return list.slice().sort(function (a, b) {
      return score(b) - score(a) || (isOpen(a) ? 0 : 1) - (isOpen(b) ? 0 : 1) || a.lvl - b.lvl;
    });
  }
  function jobRow(j) {
      var ranked = userRank() !== null;
      var shared = sharedTraits(j);
      var badges = '';
      if (ranked && j.lvl !== null) badges += isOpen(j) ? '<span class="fit on">' + (j.qualification ? 'Diplôme spécifique requis' : 'Niveau d’études compatible · conditions à vérifier') + '</span>' : '<span class="fit">' + esc(NEED[j.lvl] || 'Conditions à vérifier') + '</span>';
      if (shared.length) badges += '<span class="fit like">' + (isParent() ? 'Ce qui lui ressemble' : 'Ce qui vous ressemble') + ' : ' + esc(shared.slice(0, 2).map(traitLabel).join(', ').toLowerCase()) + '</span>';
      return '<a class="list-row" href="#/metier/' + j.id + '">' + catBadge(j.cat) +
        '<div class="main"><span class="name">' + esc(j.name) + '</span><span class="meta">' + esc(j.domain + ' · ' + fpNames(j.fp).join(', ')) + '</span>' +
        (badges ? '<span class="fits">' + badges + '</span>' : '') + '</div>' + I.chev + '</a>';
  }
  function jobRows() {
    var list = filteredJobs();
    if (!list.length) return '<p class="empty">Aucun métier avec ces filtres. <button type="button" class="text-btn" data-action="forYou">Revenir à ' + (isParent() ? 'ses' : 'vos') + ' choix</button></p>';
    return '<p class="small">' + list.length + ' métier' + (list.length > 1 ? 's' : '') + ' · ' + Math.min(S.jobLimit, list.length) + ' affichés</p>' + list.slice(0, S.jobLimit).map(jobRow).join('') +
      (S.jobLimit < list.length ? '<button type="button" class="btn outline mt-s" data-action="moreJobs">Afficher 60 métiers de plus</button>' : '');
  }

  function filterSummary() {
    var doms = activeDomains();
    return '<span class="tag">' + (doms.length ? doms.length + ' domaine' + (doms.length > 1 ? 's' : '') : 'Tous les domaines') + '</span>' +
      '<span class="tag' + (S.metCat === 'Toutes' ? '' : ' fill ' + catClass(S.metCat)) + '">' + esc(S.metCat === 'Toutes' ? (userRank() >= 5 ? 'B, A, A+' : 'Toutes catégories') : 'Catégorie ' + S.metCat) + '</span><span class="tag">' + esc(S.metFp === 'Tous' ? '3 versants' : D.fps[S.metFp]) + '</span>';
  }
  function jobFilters() {
    var doms = activeDomains();
    var order = S.domains.concat(D.domains.filter(function (d) {return S.domains.indexOf(d) === -1;}));
    return '<section class="stack"><h3>Votre sélection</h3><div class="row">' +
      chip('forYou', '', isParent() ? 'Pour votre enfant' : 'Pour vous', S.metMode === 'mine') + chip('allDomains', '', 'Tous les domaines', S.metMode === 'all') + '</div></section>' +
      '<section class="stack mt-m"><h3>Domaines</h3><div class="row" role="group" aria-label="Domaines">' + order.map(function(d){return chip('metDomain',d,domainLabel(d),doms.indexOf(d)>-1);}).join('') + '</div></section>' +
      '<section class="stack mt-m"><h3>Catégories</h3><div class="row" role="group" aria-label="Catégorie">' + (userRank()>=5 ? ['Toutes','A+','A','B'] : ['Toutes','A+','A','B','C']).map(function(c){return chip('metCat',c,c==='Toutes'?'Toutes':c,S.metCat===c);}).join('') + '</div></section>' +
      '<section class="stack mt-m"><h3>Versants</h3><div class="row" role="group" aria-label="Versants">' + ['Tous','E','T','H'].map(function(f){return chip('metFp',f,f==='Tous'?'3 versants':D.fps[f],S.metFp===f);}).join('') + '</div></section>' +
      '<div class="sheet-actions"><button type="button" class="btn" data-ui="close">Afficher ' + filteredJobs().length + ' métiers</button></div>';
  }
  screens.metiers = function () {
    return '<main class="screen pt">' +
      '<span class="eyebrow">Explorer</span><div class="title-row"><h1>' + (isParent() ? 'Ses métiers' : 'Vos métiers') + '</h1><button id="filters-open" type="button" class="icon-btn" data-action="openFilters" aria-label="Régler les filtres métiers">' + I.settings + '</button></div>' + childSelector() +
      (Date.now() < hintUntil ? '<p class="filter-hint" role="status">Utilisez les réglages pour filtrer les métiers par catégorie.</p>' : '') +
      '<div class="row filter-summary" aria-label="Filtres actifs">' + filterSummary() + '</div>' +
      searchField('q','Rechercher un métier','Rechercher un métier',S.q) +
      '<div class="list" id="jobs">' + jobRows() + '</div></main>' + tabbar('metiers');
  };
  function jobDetails(id) {
    var j=D.jobs.find(function(x){return x.id===id;}); if(!j)return '';
    return '<p class="body source-text">' + esc(j.desc) + '</p><dl class="profile"><dt>Diplôme</dt><dd>' + esc(j.lvl===null?'Selon le corps et le poste':DIP[j.lvl]) + '</dd><dt>Accès</dt><dd>' + esc(j.access) + '</dd>' +
      (j.qualification ? '<dt>Diplôme spécifique</dt><dd>' + esc(j.qualification) + '</dd>' : '') +
      (j.rmfpCode ? '<dt>Référence</dt><dd>' + esc(j.rmfpCode) + '</dd><dt>Domaine et famille</dt><dd>' + esc(j.rmfpDomain + ' · ' + j.family) + '</dd>' + (j.categories.length ? '<dt>Catégories observées</dt><dd>' + esc(j.categories.join(', ')) + ' · selon les offres CSP, à vérifier pour chaque poste.</dd>' : '') : '') + '</dl>' +
      ['activities','conditions','knowledge','skills','qualities'].map(function(key){return j[key]?'<details class="source-detail"><summary>' + ({activities:'Les activités',conditions:'Conditions d’exercice et d’accès',knowledge:'Les connaissances',skills:'Les savoir-faire',qualities:'Les savoir-être'})[key] + '</summary><p class="body source-text">' + esc(j[key]) + '</p></details>':'';}).join('') +
      (!j.rmfpCode && j.source ? ext(j.source,'Source des conditions d’accès','link-plain mt-s') : '');
  }
  screens.metier = function (id) {
    var j = D.jobs.filter(function (x) { return x.id === id; })[0];
    if (!j) return screens.metiers();
    var tint = { 'A+': 'tint-blue', A: 'tint-mint', B: 'tint-cyan', C: 'tint-yellow', X: 'tint-cyan', V: 'tint-cyan' };
    var ladder = j.ladder;
    if (!ladder) {
      if (j.cat === 'C') ladder = [[j.name, 'C'], ['concours interne ou promotion'], ['Poste de catégorie B', 'B']];
      else if (j.cat === 'B') ladder = [[j.name, 'B'], ['concours interne ou promotion'], ['Poste de catégorie A', 'A']];
      else if (j.cat === 'A') ladder = [[j.name, 'A'], ['expérience et concours interne'], ['Encadrement supérieur', 'A+']];
      else if (j.cat === 'A+') ladder = [[j.name, 'A+'], ['expérience'], ['Emplois de direction', 'A+']];
      else if (j.rmfpCode) ladder = [[j.name, 'Métier'], ['formation, expérience et mobilité'], ['Évolution selon le corps et l’employeur', 'Selon le poste']];
      else ladder = [[j.name, 'Contrat'], ['concours interne selon les conditions'], ['Fonctionnaire titulaire', 'A, B ou C']];
    }
    var dates = examsFor(j);
    var shared = sharedTraits(j);
    return '<main class="screen top-tight">' + back('#/metiers', 'Métiers') +
      '<div class="row job-meta" role="group" aria-label="Catégorie, centres d’intérêt et versants" tabindex="0"><span class="tag fill ' + catClass(j.cat) + '">' + catLabel(j.cat) + '</span>' +
      (j.interests || [j.domain]).map(function (d) { return '<span class="tag">' + esc(domainLabel(d)) + '</span>'; }).join('') +
      fpNames(j.fp).map(function (f) { return '<span class="tag">' + esc(f) + '</span>'; }).join('') + '</div>' +
      '<h1 class="sm">' + esc(j.name) + '</h1><p class="body">' + esc(j.desc.length>300?j.desc.slice(0,297).replace(/\s+\S*$/,'')+'…':j.desc) + '</p>' +
      '<button type="button" class="btn outline" data-action="favorite"' + attr('v', j.id) + ' aria-pressed="' + (S.favorites.indexOf(j.id) > -1) + '">' + I.bookmark + (S.favorites.indexOf(j.id) > -1 ? 'Retirer des favoris' : 'Ajouter aux favoris') + '</button>' +
      '<button type="button" class="link-action" data-action="jobDetails"' + attr('v',j.id) + '>' + I.info + 'Plus de détails</button>' +
      (shared.length ? '<div class="callout tint-mint"><span class="pin"></span><p>' + (isParent() ? 'Lui ressemble' : 'Vous ressemble') + ' : ' + esc(shared.map(traitLabel).join(', ').toLowerCase()) + '.</p></div>' : '') +
      '<h2 class="eyebrow mt-m">Pour y accéder</h2>' +
      '<div class="list steps">' + j.steps.map(function (s, i) {
        var exam = s.charAt(0) === '*';
        var txt = exam ? s.slice(1) : s;
        return '<div class="list-row static"><span class="num">' + (i + 1) + '</span><span class="step-txt">' + esc(txt) + '</span></div>';
      }).join('') + '</div>' +
      '<section class="stack mt-m"><h2>Dates des concours</h2>' + calendarRows(dates, expandedDatesJob===j.id ? dates.length : 2) +
      (dates.length > 2 ? '<button type="button" class="btn outline" data-action="moreJobDates"' + attr('v',j.id) + '>' + (expandedDatesJob===j.id?'Réduire les dates':'Afficher les ' + (dates.length-2) + ' autres sessions') + '</button>' : '') + '</section>' +
      '<h2 class="eyebrow mt-m">Évoluer</h2><div class="ladder">' + ladder.map(function (r) {
        if (r.length === 1) return '<div class="via">↓ ' + esc(r[0]) + '</div>';
        var t = r[1] === 'A+' ? 'tint-blue' : (r[1] === 'A' ? 'tint-mint' : (r[1] === 'C' ? 'tint-yellow' : tint[j.cat]));
        return '<div class="rung ' + t + '"><span>' + esc(r[0]) + '</span><small>' + esc(r[1]) + '</small></div>';
      }).join('') + '</div>' +
      '<a class="btn mt-m" href="#/concours/prepas">' + I.book + 'Se préparer</a>' +
      ext('https://www.fonction-publique.gouv.fr/toutes-les-publications/repertoire-commun-des-metiers-de-la-fonction-publique', 'Consulter la source métier sur fonction-publique.gouv.fr', 'link-plain') + '</main>' + tabbar('metiers');
  };

  /* ---------- Concours : catégories dépliables ---------- */
  screens.concours = function () {
    var mine = myJobs();
    return '<main class="screen pt">' +
      '<span class="eyebrow">Concours</span><h1>Concours et prépas</h1><p class="lead sm">Les conditions de diplôme varient selon le concours. Touchez une catégorie pour savoir où passer les épreuves.</p>' +
      '<div class="stack mt-s">' + D.categories.map(function (c) {
        var open = S.openCat === c.id;
        var jobs = mine.filter(function (j) { return j.cat === c.id; });
        var fpCount = { E: 0, T: 0, H: 0 };
        jobs.forEach(function (j) { j.fp.split('').forEach(function (f) { fpCount[f]++; }); });
        var fps = ['E', 'T', 'H'].sort(function (a, b) { return fpCount[b] - fpCount[a]; });
        var panelId = 'cat-panel-' + catClass(c.id);
        var panel = '';
        if (open) {
          panel = '<div class="cat-panel" id="' + panelId + '">' +
            '<p class="small m0">' + esc(c.note) + '</p>' +
            (jobs.length ? '<h3 class="h4">Pour ' + (isParent() ? 'ses' : 'vos') + ' choix</h3><div class="row">' + jobs.slice(0, 6).map(function (j) {
              return '<a class="tag link" href="#/metier/' + j.id + '">' + esc(j.name) + '</a>';
            }).join('') + '</div>' : '') +
            '<h3 class="h4">Où passer les épreuves</h3>' +
            fps.map(function (f) {
              var e = D.exam[c.id][f];
              return '<div class="exam">' +
                '<div class="exam-head"><b>' + esc(D.fps[f]) + '</b>' + (fpCount[f] ? '<span class="fit on">' + (isParent() ? 'Ses' : 'Vos') + ' choix</span>' : '') + '</div>' +
                '<dl><dt>Organisé par</dt><dd>' + esc(e.org) + '</dd><dt>Métropole</dt><dd>' + esc(e.metro) + '</dd><dt>Outre-mer</dt><dd>' + esc(e.om) + '</dd></dl></div>';
            }).join('') +
            '<p class="small m0">Les villes exactes figurent dans chaque avis de concours.</p>' +
            '</div>';
        }
        return '<div class="catcard-wrap ' + c.tint + (open ? ' open' : '') + '">' +
          '<button type="button" class="catcard" aria-expanded="' + open + '" aria-controls="' + panelId + '"' + attr('action', 'openCat') + attr('v', c.id) + '>' +
          '<span class="cat lg ' + catClass(c.id) + '" aria-hidden="true">' + c.id + '</span>' +
          '<span class="txt"><span class="sr-only">Catégorie ' + c.id + ' : </span><b>' + esc(c.dip) + '</b><span class="role">' + esc(c.role) + '</span><span class="ex">' + esc(c.ex) + '</span>' + categoryFit(c.id) + '</span>' +
          I.down + '</button>' + panel + '</div>';
      }).join('') + '</div>' +
      '<h2 class="eyebrow mt-m">Pour toutes et tous</h2>' +
      '<div class="checks">' + D.conditions.map(function (k) { return '<div>' + I.check + '<span>' + esc(k) + '</span></div>'; }).join('') + '</div>' +
      '<div class="grid-2 mt-m"><a class="btn outline" href="#/calendrier">Calendrier</a><a class="btn outline" href="#/etudes">Quelles études ?</a></div>' +
      '<a class="btn outline" href="#/sans-concours">Entrer sans concours</a>' +
      '<a class="btn outline" href="#/handicap">Handicap : accès et aménagements</a>' + preparationContent() + '</main>' + tabbar('concours');
  };

  screens.calendrier = function (jobId) {
    var job = D.jobs.find(function (j) { return j.id === jobId; });
    var base = job ? examsFor(job, S.calView === 'all') : (S.calView === 'all' ? D.calendar : upcoming());
    var list = base.filter(function (c) {
      return (S.calCat === 'Toutes' || c.cat === S.calCat) && (S.calFp === 'Tous' || c.fp === S.calFp) && (!S.calQ || norm(c.name + ' ' + (c.location || '')).indexOf(norm(S.calQ)) > -1);
    }).slice().sort(function (a,b) { return (a.date || '9999').localeCompare(b.date || '9999'); });
    return '<main class="screen top-tight">' + back(job ? '#/metier/' + job.id : '#/concours', job ? 'Métier' : 'Concours et prépas') +
      '<span class="eyebrow">Calendrier</span><h1 class="sm">Dates des concours</h1>' + (job ? '<p class="body">' + esc(job.name) + '</p>' : '') +
      searchField('cal-q','Rechercher un concours ou une ville','Concours ou ville',S.calQ) +
      '<div class="row" role="group" aria-label="Sessions">' + chip('calView','upcoming','À venir',S.calView === 'upcoming','blue') + chip('calView','all','Toutes les sessions',S.calView === 'all','blue') + '</div>' +
      '<div class="row" role="group" aria-label="Catégorie">' + ['Toutes','A+','A','B','C'].map(function(c) { return chip('calCat',c,c,S.calCat===c,'narrow'); }).join('') + '</div>' +
      '<div class="row" role="group" aria-label="Versant">' + ['Tous','E','T','H'].map(function(f) { return chip('calFp',f,f==='Tous'?'3 versants':D.fps[f],S.calFp===f,'blue'); }).join('') + '</div>' +
      '<p class="small m0">' + list.length + ' sessions · sources vérifiées le ' + esc(D.catalogChecked) + '. Les dates CNFPT 2027 sont prévisionnelles.</p>' +
      '<div class="stack calendar-list">' + calendarRows(list, S.calLimit) + '</div>' +
      (list.length > S.calLimit ? '<button type="button" class="btn outline" data-action="moreCalendar">Afficher 40 sessions de plus</button>' : '') +
      '</main>' + tabbar('concours');
  };

  screens.etudes = function () {
    var tracks = { 'Administratif': 1, 'Technique': 1, 'Social': 1, 'Dès le brevet': 1 };
    var data = {
      'Administratif': { tip: 'Les IPAG et CPAG sont les instituts des universités dédiés aux concours administratifs.', steps: [
        ['Bac général ou techno', 'Toutes les spécialités ouvrent la voie'], ['Licence', 'Droit, AES, économie, science politique'],
        ['Master ou IPAG', 'Administration publique, droit public'], ['Concours de catégorie A ou A+', 'IRA, attaché·e territorial·e, INSP, INET']] },
      'Technique': { tip: 'Un BTS ou un BUT suffit pour viser la catégorie B technique.', steps: [
        ['Bac général, techno ou pro', 'Sciences, industrie, numérique'], ['BTS ou BUT', 'Informatique, génie civil, électronique'],
        ['Concours de catégorie B', 'Technicien·ne'], ['Évoluer en catégorie A', 'Ingénieur·e, par concours interne']] },
      'Social': { tip: 'Les diplômes d’État du social se préparent en 3 ans, après le bac.', steps: [
        ['Bac', 'Toutes séries'], ['Diplôme d’État en 3 ans', 'Assistant·e de service social, éducateur·rice spécialisé·e'],
        ['Concours ou recrutement', 'Catégorie A, État, collectivités ou hôpitaux']] },
      'Dès le brevet': { tip: 'Le brevet suffit pour certains concours de catégorie C. Ensuite, on progresse par concours interne.', steps: [
        ['Brevet', 'Diplôme national du brevet'], ['CAP ou BEP', 'Utile pour certains concours, pas obligatoire partout'],
        ['Concours de catégorie C', 'Adjoint·e administratif·ve ou technique, ATSEM'], ['Évoluer en catégorie B', 'Par concours interne ou promotion']] }
    };
    data = D.tracks || data; tracks = data;
    var cfg = data[S.track] || data.Administratif;
    return '<main class="screen top-tight">' + back('#/concours', 'Concours') +
      '<span class="eyebrow">Orientation</span><h1 class="sm">Quelles études choisir ?</h1>' +
      '<div class="row">' + Object.keys(tracks).map(function (t) { return chip('track', t, t, S.track === t); }).join('') + '</div>' +
      '<div class="timeline">' + cfg.steps.map(function (s, i) {
        var last = i === cfg.steps.length - 1;
        return '<div class="tl' + (last ? ' last' : '') + '"><div class="rail"><span class="node"></span>' + (last ? '' : '<span class="bar"></span>') + '</div>' +
          '<div class="txt"><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></div></div>';
      }).join('') + '</div>' +
      '<div class="callout tint-cyan"><span class="pin"></span><p>' + esc(cfg.tip) + '</p></div>' +
      (cfg.source ? ext(cfg.source, 'Vérifier ce parcours dans la source', 'link-plain') : '') +
      '<a class="btn mt-s" href="#/prepas">Trouver une prépa</a></main>' + tabbar('concours');
  };

  screens['sans-concours'] = function () {
    return '<main class="screen top-tight">' + back('#/accueil', 'Accueil') +
      '<span class="eyebrow">Autres voies</span><h1 class="sm">Sans concours, c’est possible</h1>' +
      '<p class="lead sm">4 portes d’entrée dans le service public.</p>' +
      '<div class="list">' + D.noExam.map(function (w, i) {
        return '<div class="list-row static top"><span class="cat sm ' + w.bg + '" aria-hidden="true">' + (i + 1) + '</span>' +
          '<div class="main"><span class="name">' + esc(w.t) + '</span><span class="meta long">' + esc(w.d) + '</span></div></div>';
      }).join('') + '</div>' +
      ext(D.noExamUrl, 'Voir les recrutements sans concours', 'btn outline mt-s') +
      ext(D.jobsUrl, 'Voir les offres d’emploi') + '</main>' + tabbar('accueil');
  };

  /* ---------- Prépas ---------- */
  function preparationContent() {
    var opts = [['0', 'Gratuit'], ['1', 'Moins de 1 000 €'], ['2', 'Tous budgets']];
    var b = S.prepBudget;
    if (b === null) b = S.budget === 'Gratuit uniquement' ? '0' : (S.budget === 'Moins de 1 000 €' ? '1' : '2');
    var on = S.boursier === 'Oui';
    var keys = prepKeys(myJobs());
    var nbT = D.talents.filter(function (t) { return talentMatches(t, keys).length; }).length;
    var list = D.preps.filter(function (p) { return p.budget <= parseInt(b, 10) && (!p.talents || on); });
    return '<section class="stack mt-l" id="preparations"><span class="eyebrow">Se préparer</span><h2 id="prep-title" tabindex="-1">Prépas et aides</h2>' +
      '<a class="btn outline" href="#/bibliographie">Recommandations bibliographiques</a>' +
      '<div class="row" role="group" aria-label="Budget">' + opts.map(function (o) { return chip('prepBudget', o[0], o[1], b === o[0], 'blue'); }).join('') + '</div>' +
      '<button type="button" class="switch-row" role="switch" aria-checked="' + on + '" data-action="toggleBoursier"><span>' + (isParent() ? 'Mon enfant est boursier·e' : 'Je suis boursier·e') + '</span><span class="switch" aria-hidden="true"></span></button>' +
      '<div class="stack">' + list.map(function (p) {
        var hi = p.talents && on;
        var extra = p.id === 'talents' && S.domains.length ? '<span class="fit on">' + nbT + ' pour ' + (isParent() ? 'ses' : 'vos') + ' choix</span>' : '';
        return '<a class="prep' + (hi ? ' hi' : '') + '" href="#/prepa/' + p.id + '"><div class="head"><h2 class="h3">' + esc(p.t) + '</h2><span class="price">' + esc(p.price) + '</span></div>' +
          '<p>' + esc(p.d) + '</p><span class="prep-foot">' + extra + '<span class="more">Voir le détail' + I.chev + '</span></span></a>';
      }).join('') + '</div>' +
      (on ? '<div class="bourse"><div><b>' + esc(D.talentsGrantLabel || '5 000 €') + ' / an</b><span>Bourse Talents ' + esc(D.talentsGrantYear || '2026-2027') + ', pour les élèves des Prépas Talents.</span></div><span class="dot big" aria-hidden="true"></span></div>' : '') +
      '<a class="link-plain" href="#/handicap">Handicap : prévoir les aménagements</a></section>';
   }
  screens.prepas = function () { return screens.concours(); };

  function talentsList(jobFilter) {
    var jobs = jobFilter ? [jobFilter] : myJobs();
    var keys = prepKeys(jobs);
    var all = D.talents.map(function (t) { return { t: t, m: keys.length ? talentMatches(t, keys) : [] }; })
      .filter(function (x) { return inRegion(x.t.cp); });
    var matched = all.filter(function (x) { return x.m.length; }).sort(function (a, b) { return b.m.length - a.m.length; });
    var shown = (S.talentsAll || !keys.length) ? all : matched;
    if (S.location) shown.sort(function (a, b) {
      var da = distanceTo(a.t), db = distanceTo(b.t);
      return da === db ? a.t.name.localeCompare(b.t.name, 'fr') : da - db;
    });
    return { shown: shown, matched: matched.length, total: all.length, hasKeys: keys.length > 0 };
  }

  function talentsRows(r) {
    if (!r.shown.length) return '<p class="empty">Aucune Prépa Talents dans cette région pour ces concours.</p>';
    return r.shown.map(function (x) {
      var t = x.t, reg = regionOf(t.cp);
      var conc = x.m.length ? x.m : t.concours;
      var extra = conc.length > 3 ? ' +' + (conc.length - 3) : '';
      var distance = distanceTo(t);
      return '<div class="list-row static top"><span class="pin-ico" aria-hidden="true">' + I.pin + '</span><div class="main">' +
        '<span class="name sm">' + esc(t.name) + '</span>' +
        '<span class="meta">' + esc(t.city + ' · ' + REG[reg]) + (t.online ? ' · en ligne' : '') + '</span>' +
        (S.location ? '<span class="meta">' + (t.online ? 'À distance' : (Number.isFinite(distance) ? 'Environ ' + Math.round(distance) + ' km à vol d’oiseau' : 'Distance indisponible')) + '</span>' : '') +
        '<span class="meta long">' + (x.m.length ? '<b class="ok">Prépare : </b>' : 'Concours : ') + esc(conc.slice(0, 3).join(', ')) + esc(extra) + '</span>' +
        '</div></div>';
    }).join('');
  }

  screens.prepa = function (id, arg2) {
    var p = D.preps.filter(function (x) { return x.id === id; })[0];
    if (!p || (id==='talents' && S.boursier!=='Oui')) return screens.prepas();
    var head = '<main class="screen top-tight">' + back('#/prepas', 'Prépas') +
      '<span class="eyebrow">' + esc(p.price) + '</span><h1 class="sm">' + esc(p.t) + '</h1>';
    var foot = '</main>' + tabbar('prepas');

    if (id === 'talents') {
      var job = arg2 ? D.jobs.filter(function (j) { return j.id === arg2; })[0] : null;
      var r = talentsList(job);
      var scope = job ? 'pour ' + job.name : (S.domains.length ? 'pour ' + (isParent() ? 'ses' : 'vos') + ' choix' : '');
      return head +
        '<p class="body">Préparations gratuites, avec tutorat, aux concours A, A+ et B. Admission sur dossier et entretien, sous conditions de ressources et de mérite. Bourse de ' + esc(D.talentsGrantLabel || '5 000 €') + ' par an.</p>' +
        (S.location ? '<p class="small m0">Du plus proche au plus éloigné de ' + esc(S.location.label) + '. Distances entre centres des communes.</p>' : '<a class="link-plain" href="#/moi">Ajouter un lieu de vie pour classer par proximité</a>') +
        regionSelect() +
        (r.hasKeys ? '<div class="row">' + chip('talentsAll', 'mine', r.matched + ' ' + scope, !S.talentsAll, 'blue') + chip('talentsAll', 'all', 'Toutes (' + r.total + ')', S.talentsAll, 'blue') + '</div>' : '') +
        '<div class="list" id="talents">' + talentsRows(r) + '</div>' +
        '<p class="small m0">Source : fonction-publique.gouv.fr, liste consultée le 15/10/2026.</p>' + foot;
    }
    if (id === 'ipag') {
      var rows = D.ipag.filter(function (x) { return inRegion(x.dep); });
      return head +
        '<p class="body">Rattachés aux universités (IPAG) ou aux IEP (CPAG). Ils préparent aux concours A+, A, B et C, et délivrent la licence et le master d’administration publique.</p>' +
        '<div class="checks"><div>' + I.check + '<span>Licence d’administration publique : accès avec un Bac+2</span></div><div>' + I.check + '<span>Master 1 avec un Bac+3, master 2 avec un Bac+4</span></div><div>' + I.check + '<span>Préparations aux concours, y compris internes</span></div></div>' +
        regionSelect() +
        '<div class="list">' + (rows.length ? rows.map(function (x) {
          return '<div class="list-row static"><span class="pin-ico" aria-hidden="true">' + I.pin + '</span><div class="main"><span class="name sm">' + esc(x.name) + '</span><span class="meta">' + esc(x.city + ' · ' + REG[regionOf(x.dep)]) + '</span></div></div>';
        }).join('') : '<p class="empty">Aucun IPAG ou CPAG dans cette région. Pensez à la formation à distance.</p>') + '</div>' +
        ext(D.ipagUrl, 'Trouver un IPAG ou un CPAG') +
        ext(D.ipagDistanceUrl, 'Licence et master à distance (CNED et IPAG de Poitiers)', 'btn outline') + foot;
    }
    if (id === 'iep') {
      var list = D.iep.filter(function (x) { return inRegion(x.dep); });
      return head +
        '<p class="body">Les Instituts d’études politiques et les universités délivrent des masters d’administration publique et préparent aux concours A et A+.</p>' +
        regionSelect() +
        '<div class="list">' + (list.length ? list.map(function (x) {
          return '<div class="list-row static top"><span class="pin-ico" aria-hidden="true">' + I.pin + '</span><div class="main"><span class="name sm">' + esc(x.name) + '</span><span class="meta">' + esc(x.city + ' · ' + REG[regionOf(x.dep)]) + '</span><span class="meta long">' + esc(x.note) + '</span></div></div>';
        }).join('') : '<p class="empty">Aucun établissement listé dans cette région.</p>') + '</div>' + foot;
    }
    /* privées */
    var cats = {};
    myJobs().forEach(function (j) { cats[j.cat] = true; });
    return head +
      '<p class="body">Payantes, à distance ou en présentiel. Elles ne remplacent pas l’inscription au concours. Comparez les tarifs et demandez les taux de réussite.</p>' +
      '<div class="list">' + D.privees.map(function (x) {
        var fit = x.tags.split(' ').some(function (t) { return cats[t]; }) && S.domains.length;
        return '<div class="list-row static top"><div class="main"><span class="name sm">' + esc(x.name) + '</span><span class="meta">' + esc(x.mode + ' · concours ' + x.tags) + '</span><span class="meta long">' + esc(x.note) + '</span>' +
          (fit ? '<span class="fits"><span class="fit on">Prépare à des concours de ' + (isParent() ? 'ses' : 'vos') + ' choix</span></span>' : '') + '</div></div>';
      }).join('') + '</div>' +
      '<p class="small m0">Liste non exhaustive, sans classement ni partenariat.</p>' + foot;
  };

  function bookList() {
    var q=norm(S.bookQ),list=D.books.filter(function(b){return (S.bookSubject==='Toutes'||b.subjects.indexOf(S.bookSubject)>-1)&&(!q||norm(b.title+' '+b.authors).indexOf(q)>-1);});
    return '<p class="small" role="status">' + list.length + ' ouvrage' + (list.length>1?'s':'') + '</p><div class="book-list">' + (list.length?list.map(function(b){
      var title=b.title.split(' : ')[0];
      var body=(b.coverUrl||b.cover?'<img src="' + esc(b.coverUrl||b.cover) + '" alt="Couverture de ' + esc(b.title) + '" loading="lazy" width="66" height="92">':'<span class="book-cover-placeholder" aria-hidden="true">'+I.book+'</span>')+'<div><h2 class="book-title">' + esc(title) + '</h2><p>' + esc(b.authors) + '</p></div>';
      return b.url?'<a class="book-card external-link" href="' + esc(b.url) + '" target="_blank" rel="noopener" title="' + esc(b.title) + '">' + body + '</a>':'<article class="book-card" title="' + esc(b.title) + '">' + body + '</article>';
    }).join(''):'<p class="empty">Aucun ouvrage avec ces critères.</p>') + '</div>';
  }
  screens.bibliographie = function () {
    var subjects=[];D.books.forEach(function(b){b.subjects.forEach(function(t){if(subjects.indexOf(t)<0)subjects.push(t);});});
    return '<main class="screen top-tight">' + back('#/concours/prepas','Concours et prépas') +
      '<span class="eyebrow">Lire et préparer</span><h1>Bibliographie</h1><p class="small m0">Sélection indicative de l’INSP · septembre 2026.</p>' +
      searchField('book-q','Rechercher un titre ou un auteur','Titre ou auteur',S.bookQ) +
      '<label class="select"><span>Thématique</span><select id="book-subject">' + ['Toutes'].concat(subjects).map(function(t){return '<option' + (S.bookSubject===t?' selected':'') + '>' + esc(t) + '</option>';}).join('') + '</select></label>' +
      '<div id="books">' + bookList() + '</div>' +
      '<p class="small">Ces lectures ne remplacent pas le programme du concours.</p>' + ext(D.bookSource.url,'Consulter la sélection INSP','link-plain') + '</main>' + tabbar('concours');
  };

  screens.handicap = function () {
    return '<main class="screen top-tight">' + back('#/concours', 'Concours') +
      '<span class="eyebrow">Être accompagné·e</span><h1 class="sm">Handicap : accès et aménagements</h1>' +
      '<div class="prose"><p>Vous pouvez demander des adaptations des épreuves. Il existe aussi une voie de recrutement spécifique, sous conditions.</p>' +
      '<h2>Adapter les épreuves</h2><p>Du temps supplémentaire, des pauses ou une aide humaine ou technique peuvent être prévus selon vos besoins.</p>' +
      '<p>Contactez le service qui organise le concours avant la date limite indiquée dans l’avis. Le certificat d’un médecin agréé doit être établi moins de six mois avant les épreuves.</p>' +
      '<h2>Un recrutement par contrat</h2><p>Certains bénéficiaires de l’obligation d’emploi peuvent être recrutés par un contrat spécifique en catégorie A, B ou C. Les conditions de diplôme restent à remplir.</p>' +
      '<p>Ce contrat peut conduire à une titularisation après évaluation des aptitudes. Elle n’est pas automatique.</p>' +
      '<h2>Préparer votre démarche</h2><p>Demandez les modalités au service recruteur ou à son référent handicap. Vous n’avez aucune information de santé à renseigner dans cette application.</p></div>' +
      ext('https://www.service-public.gouv.fr/particuliers/vosdroits/F430', 'Vérifier les démarches sur Service Public') +
      '<a class="btn outline" href="#/accessibilite">Adapter la lecture de l’application</a></main>' + tabbar('concours');
  };


  /* ---------- Profil et informations légales ---------- */
  var PROFILE_LABEL = { etu: 'Étudiant·e', par: 'Parent', rec: 'En reconversion' };

  screens.moi = function () {
    var rows = [
      ['Profil', S.profile ? PROFILE_LABEL[S.profile] : 'Non renseigné'],
      [isParent() ? 'Niveau de votre enfant' : 'Niveau', S.level || 'Non renseigné'],
      ['Domaines', S.domains.length ? S.domains.map(domainLabel).join(', ') : 'Tous'],
      ['Façon de travailler', S.traits.length ? S.traits.map(traitLabel).join(', ') : 'Non renseignée'],
      ['Boursier·e', S.boursier || 'Non renseigné'],
      ['Budget', S.budget || 'Non renseigné']
    ];
    return '<main class="screen pt">' +
      '<span class="eyebrow">Profil</span><h1>' + (isParent() ? 'Le profil de ' + esc(childName()) : 'Votre profil') + '</h1>' + childSelector() +
      '<dl class="list m0">' + rows.map(function (r) {
        return '<div class="list-row static col"><dt class="meta">' + esc(r[0]) + '</dt><dd class="name sm m0">' + esc(r[1]) + '</dd></div>';
      }).join('') + '</dl>' +
      locationForm() + '<a class="btn mt-s" href="#/profil">Modifier ' + (isParent() ? 'ses' : 'mes') + ' choix</a>' +
      '<button type="button" class="btn danger" data-action="wipe">Effacer mes données</button>' +
      '<p class="notice">' + I.lock + '<span>Ces informations sont enregistrées uniquement dans ce navigateur. Elles ne sont envoyées à personne.</span></p>' +
      '<div class="list mt-m">' +
      '<a class="list-row" href="#/versants"><div class="main"><span class="name">Comprendre la fonction publique</span><span class="meta">Les 3 fonctions publiques et les 4 catégories</span></div>' + I.chev + '</a>' +
      '<a class="list-row" href="#/confidentialite"><div class="main"><span class="name">Données personnelles</span></div>' + I.chev + '</a>' +
      '<a class="list-row" href="#/accessibilite"><div class="main"><span class="name">Accessibilité et confort de lecture</span></div>' + I.chev + '</a>' +
      '<a class="list-row" href="#/mentions"><div class="main"><span class="name">Mentions légales</span></div>' + I.chev + '</a>' +
      '</div></main>' + tabbar('moi');
  };

  screens.confidentialite = function () {
    var L = D.legal;
    return '<main class="screen top-tight">' + back('#/moi', 'Profil') +
      '<span class="eyebrow">RGPD</span><h1 class="sm">Données personnelles</h1>' +
      '<div class="prose">' +
      '<p><strong>En bref : vos réponses restent sur votre appareil.</strong> Pas de compte, pas de cookie, pas de mesure d’audience, pas de publicité.</p>' +
      '<h2>Responsable du traitement</h2><p><span class="todo">' + esc(L.publisher) + '</span>, <span class="todo">' + esc(L.address) + '</span>. Contact : <span class="todo">' + esc(L.contact) + '</span>.</p>' +
      '<h2>Ce qui est enregistré</h2><ul>' +
      '<li>Le profil (étudiant·e, parent, reconversion) et le niveau d’étude.</li>' +
      '<li>Les domaines et la façon de travailler choisis, la situation de bourse et le budget indiqués.</li>' +
      '<li>Les réglages d’affichage (filtres, région, confort de lecture).</li>' +
      '<li>Le prénom ou pseudo facultatif, les profils enfants, la commune choisie et les métiers favoris.</li></ul>' +
      '<p>Aucune adresse e-mail ni adresse postale précise n’est demandée. Chaque enfant conserve un profil indépendant dans ce navigateur.</p>' +
      '<h2>Où et combien de temps</h2><p>Dans le stockage local de votre navigateur (localStorage), jamais sur un serveur. Ces données restent jusqu’à ce que vous les effaciez, depuis l’onglet Profil ou les réglages de votre navigateur.</p>' +
      '<h2>Pourquoi</h2><p>Uniquement pour adapter les contenus à votre situation. Ce stockage est nécessaire au service demandé : il ne demande pas de consentement.</p>' +
      '<h2>Hébergement</h2><p>L’application est hébergée par ' + esc(L.host) + '. Comme tout hébergeur, il peut enregistrer l’adresse IP des visiteur·ses dans ses journaux techniques, pour la sécurité du service.</p>' +
      '<h2>Liens externes</h2><p>Les liens vers des sites publics (calendrier des concours, offres d’emploi, cartes des prépas) ouvrent ces sites, qui ont leur propre politique de confidentialité.</p>' +
      '<h2>Vos droits</h2><p>Vous pouvez à tout moment consulter, modifier ou effacer vos données depuis l’onglet Profil. Pour toute question, écrivez à <span class="todo">' + esc(L.contact) + '</span>. Vous pouvez aussi saisir la CNIL : ' + ext('https://www.cnil.fr/fr/plaintes', 'cnil.fr', '') + '.</p>' +
      '<p class="small">Mise à jour : ' + esc(L.updated) + '</p>' +
      '</div></main>' + tabbar('moi');
  };

  screens.accessibilite = function () {
    var L = D.legal;
    return '<main class="screen top-tight">' + back('#/moi', 'Profil') +
      '<span class="eyebrow">RGAA</span><h1 class="sm">Déclaration d’accessibilité</h1>' +
      '<section class="stack" aria-label="Confort de lecture"><h2>Confort de lecture</h2>' +
      ['contrast', 'largeText', 'dysFont'].map(function (key, i) { return '<button type="button" class="switch-row" role="switch" aria-checked="' + !!S[key] + '" data-action="' + key + '"><span>' + ['Contraste renforcé', 'Texte agrandi', 'Police de lecture DYS'][i] + '</span><span class="switch" aria-hidden="true"></span></button>'; }).join('') + '</section>' +
      '<div class="prose">' +
      '<p><span class="todo">' + esc(L.publisher) + '</span> s’engage à rendre cette application accessible, conformément à l’article 47 de la loi n° 2005-102 du 11 février 2005.</p>' +
      '<h2>État de conformité</h2><p>La conformité RGAA reste à évaluer par un audit complet. Les vérifications réalisées ne permettent pas d’annoncer un taux de conformité.</p>' +
      '<h2>Ce qui est déjà pris en compte</h2><ul>' +
      '<li>Lien d’évitement, titres hiérarchisés et titre de page à chaque écran.</li>' +
      '<li>Navigation complète au clavier, focus visible et conservé après chaque choix.</li>' +
      '<li>État des choix annoncé aux lecteurs d’écran (boutons pressés, blocs dépliés, interrupteur, résultats des filtres).</li>' +
      '<li>Contrastes de texte d’au moins 4,5:1, zones cliquables d’au moins 44 px.</li>' +
      '<li>Informations jamais portées par la couleur seule, liens externes signalés.</li>' +
      '<li>Zoom et agrandissement du texte autorisés, animations réduites si demandé.</li></ul>' +
      '<h2>Établissement de cette déclaration</h2><p>Déclaration établie le ' + esc(L.updated) + ', sur la base d’une auto-évaluation. Technologies : HTML, CSS, JavaScript.</p>' +
      '<h2>Retour d’information et contact</h2><p>Si vous n’arrivez pas à accéder à un contenu ou à un service, écrivez à <span class="todo">' + esc(L.contact) + '</span> pour être orienté·e vers une alternative accessible.</p>' +
      '<h2>Voies de recours</h2><p>Si vous n’obtenez pas de réponse satisfaisante, vous pouvez saisir le Défenseur des droits : ' + ext('https://formulaire.defenseurdesdroits.fr/', 'formulaire en ligne', '') + ', ou par courrier gratuit, sans affranchissement : Défenseur des droits, Libre réponse 71120, 75342 Paris CEDEX 07.</p>' +
      '</div></main>' + tabbar('moi');
  };

  screens.mentions = function () {
    var L = D.legal;
    return '<main class="screen top-tight">' + back('#/moi', 'Profil') +
      '<span class="eyebrow">Informations</span><h1 class="sm">Mentions légales</h1>' +
      '<div class="prose">' +
      '<h2>Éditeur</h2><p><span class="todo">' + esc(L.publisher) + '</span><br><span class="todo">' + esc(L.address) + '</span><br>Contact : <span class="todo">' + esc(L.contact) + '</span></p>' +
      '<h2>Directeur·rice de la publication</h2><p><span class="todo">' + esc(L.director) + '</span></p>' +
      '<h2>Conception</h2><p>' + esc(L.design) + '</p>' +
      '<h2>Hébergement</h2><p>' + esc(L.host) + ', ' + esc(L.hostAddress) + '</p>' +
      '<h2>Sources</h2><p>Chaque session renvoie à son avis officiel. Les catégories observées dans les offres ne constituent pas une condition de diplôme.</p>' + D.catalogSources.map(function (s) { return '<p>' + ext(s.url, s.name, 'link-plain') + '<span class="small">Vérifié le ' + esc(s.checked) + ' · ' + esc(s.note) + '</span></p>'; }).join('') +
      '<h2>Polices de caractères</h2><p>DM Sans et OpenDyslexic, sous licence SIL Open Font License, sont hébergées avec l’application.</p>' +
      '</div></main>' + tabbar('moi');
  };

  /* ---------- Routeur ---------- */
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/');
    return { name: parts[0] || (S.done ? 'accueil' : (S.introSeen ? 'profil' : 'bienvenue')), arg: parts[1], arg2: parts[2] };
  }

  var lastRoute = null;
  var booted = false;
  var hintUntil = 0, hintTimer = null;
  function render() {
    document.documentElement.dataset.contrast = String(!!S.contrast);
    document.documentElement.dataset.largeText = String(!!S.largeText);
    document.documentElement.dataset.dysFont = String(!!S.dysFont);
    var r = route();
    var key = r.name + '/' + (r.arg || '') + '/' + (r.arg2 || '');
    var changed = key !== lastRoute;
    lastRoute = key;
    if (changed && r.name === 'metiers') {
      hintUntil = Date.now() + 5000;
      clearTimeout(hintTimer);
      hintTimer = setTimeout(function () { var hint = root.querySelector('.filter-hint'); if (hint) hint.remove(); }, 5000);
    }

    var a = document.activeElement;
    var focusSel = null;
    if (!changed && a && root.contains(a)) {
      if (a.id) focusSel = '#' + a.id;
      else if (a.getAttribute('data-action')) {
        focusSel = '[data-action="' + a.getAttribute('data-action') + '"]' + (a.getAttribute('data-v') !== null ? '[data-v="' + a.getAttribute('data-v').replace(/"/g, '\\"') + '"]' : '');
      }
    }

    var fn = screens[r.name] || screens[S.done ? 'accueil' : 'profil'];
    root.innerHTML = fn(r.arg, r.arg2);
    var main = root.querySelector('main');
    if (main) {
      main.id = 'contenu';
      if (['accessibilite','accueil','enfant'].indexOf(r.name) === -1) main.insertAdjacentHTML('beforeend', '<a class="link-plain mt-s" href="#/accessibilite">Confort de lecture et accessibilité</a>');
    }
    var t = root.querySelector('h1');
    if (t) t.setAttribute('tabindex', '-1');
    document.title = (t ? t.textContent + ' · ' : '') + 'Y-Seck';
    var contextJob=r.name==='metier'&&D.jobs.find(function(j){return j.id===r.arg;});
    UI.afterRender({root:root,title:t?t.textContent:'Y-Seck',isJobs:r.name==='metiers',category:contextJob&&['A+','A','B','C'].indexOf(contextJob.cat)>-1?{label:contextJob.cat,className:catClass(contextJob.cat)}:null,summary:r.name==='metiers'?filterSummary():'',filters:r.name==='metiers'?jobFilters():'',changed:changed});

    if (changed) {
      if (t && booted) t.focus({ preventScroll: true });
      if (r.name === 'prepas' || (r.name === 'concours' && r.arg === 'prepas')) {
        var prep = document.getElementById('prep-title'); if (prep) { prep.scrollIntoView(); prep.focus({ preventScroll: true }); }
      }
    } else if (focusSel) {
      var el = root.querySelector(focusSel);
      if (el) el.focus({ preventScroll: true });
    }
  }

  function countAnnounce(sel) {
    var n = root.querySelectorAll(sel || '#jobs .list-row, .calendar-list .list-row, #talents .list-row').length;
    announce(n === 0 ? 'Aucun résultat' : (n === 1 ? '1 résultat' : n + ' résultats'));
  }

  function navigate(hash) {
    /* Afficher l’écran dans le même clic, sans attendre l’événement hashchange. */
    if (location.hash !== hash) history.pushState(null, '', hash);
    render(); window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', function () { render(); window.scrollTo(0, 0); });

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var a = el.getAttribute('data-action');
    var v = el.getAttribute('data-v');
    var i, next;
    switch (a) {
      case 'openFilters': UI.open('filters','Filtrer les métiers',jobFilters(),el); break;
      case 'jobDetails': UI.open('details','Plus de détails',jobDetails(v),el); break;
      case 'moreJobDates': expandedDatesJob=expandedDatesJob===v?null:v; render(); break;
      case 'profile':
        if (isParent() && v !== 'par') break;
        if (S.profile !== v) {
          syncPerson(); S.profile = v;
          if (v === 'par') { ensureFamily(); usePerson(activeChild()); }
          else usePerson(S.personalProfiles[v] || blankPerson());
        }
        save(); render(); break;
      case 'addChild': {
        syncPerson();
        var child = Object.assign(blankPerson('Enfant ' + (S.children.length + 1)), { id: 'enfant-' + Date.now().toString(36) });
        S.children.push(child); S.activeChild = child.id; usePerson(child); save();
        location.hash = '#/profil'; break;
      }
      case 'openChild': case 'selectChild': {
        syncPerson(); var selected = S.children.find(function (c) { return c.id === v; });
        if (!selected) break;
        S.activeChild = selected.id; usePerson(selected); save();
        if (a === 'openChild') location.hash = selected.done ? '#/enfant' : '#/profil'; else render();
        break;
      }
      case 'favorite': {
        next = S.favorites.slice(); i = next.indexOf(v);
        if (i > -1) next.splice(i, 1); else next.push(v);
        set({ favorites: next }); announce(i > -1 ? 'Métier retiré des favoris' : 'Métier ajouté aux favoris'); break;
      }
      case 'level': set({ level: v }); break;
      case 'domain':
        i = S.domains.indexOf(v); next = S.domains.slice();
        if (i > -1) next.splice(i, 1); else next.push(v);
        set({ domains: next, metDomains: null, metMode: 'mine', jobLimit: 60 }); break;
      case 'clearDomains': set({domains:[],metDomains:null,metMode:'mine',jobLimit:60}); announce('Les domaines sélectionnés ont été effacés.'); break;
      case 'trait':
        i = S.traits.indexOf(v); next = S.traits.slice();
        if (i > -1) next.splice(i, 1); else next.push(v);
        set({ traits: next }); break;
      case 'boursier': set({ boursier: v }); break;
      case 'budget': set({ budget: v, prepBudget: null }); break;
      case 'go': location.hash = '#/' + v; break;
      case 'startProfile': S.introSeen = true; save(); location.hash = '#/profil'; break;
      case 'finish': e.preventDefault(); S.done = true; save(); navigate('#/accueil'); break;
      case 'clearSearch': {
        e.preventDefault(); clearTimeout(searchTimer);
        if(v==='q'){S.q='';S.jobLimit=60;}
        else if(v==='cal-q'){S.calQ='';S.calLimit=40;}
        else if(v==='book-q')S.bookQ='';
        else if(v==='location-query'){locationQuery='';locationResults=[];locationStatus='';locationSearchId++;}
        else break;
        save(); render();
        var searchInput=document.getElementById(v);if(searchInput)searchInput.focus({preventScroll:true});
        announce('Recherche effacée. La liste complète pour vos filtres est affichée.'); break;
      }
      case 'skip': S.done = true; save(); break;
      case 'metDomain':
        next = activeDomains().slice(); i = next.indexOf(v);
        if (i > -1) next.splice(i, 1); else next.push(v);
        set({ metDomains: next, metMode: 'custom', jobLimit: 60 }); countAnnounce(); break;
      case 'forYou': set({ metDomains: null, metMode: 'mine', metCat: 'Toutes', metFp: 'Tous', q: '', jobLimit: 60 }); countAnnounce(); break;
      case 'allDomains': set({ metDomains: [], metMode: 'all', jobLimit: 60 }); countAnnounce(); break;
      case 'moreJobs': set({ jobLimit: S.jobLimit + 60 }); break;
      case 'metCat': set({ metCat: v, jobLimit: 60 }); countAnnounce(); break;
      case 'metFp': set({ metFp: v, jobLimit: 60 }); countAnnounce(); break;
      case 'calCat': set({ calCat: v }); countAnnounce(); break;
      case 'calFp': set({ calFp: v, calLimit: 40 }); break;
      case 'calView': set({ calView: v, calLimit: 40 }); break;
      case 'moreCalendar': set({ calLimit: S.calLimit + 40 }); break;
      case 'searchLocation': searchLocation(); break;
      case 'selectLocation': {
        var loc = locationResults[Number(v)];
        if (loc) { locationResults = []; locationStatus = ''; set({ location: loc }); announce('Commune enregistrée. Les prépas seront classées par proximité.'); }
        break;
      }
      case 'clearLocation': set({ location: null }); break;
      case 'contrast': case 'largeText': case 'dysFont': {
        var preference = {}; preference[a] = !S[a]; set(preference); announce('Préférence de lecture mise à jour'); break;
      }
      case 'track': set({ track: v }); announce('Parcours ' + v + ' affiché'); break;
      case 'openCat': set({ openCat: S.openCat === v ? null : v }); break;
      case 'prepBudget': set({ prepBudget: v }); break;
      case 'talentsAll': set({ talentsAll: v === 'all' }); countAnnounce('#talents .list-row'); break;
      case 'toggleBoursier': set({ boursier: S.boursier === 'Oui' ? 'Non' : 'Oui' }); break;
      case 'alert': set({ alert: !S.alert }); announce(S.alert ? 'Alerte activée' : 'Alerte désactivée'); break;
      case 'wipe':
        if (window.confirm('Effacer toutes vos réponses de cet appareil ?')) {
          try { localStorage.removeItem(KEY); } catch (err) { /* rien à effacer */ }
          S = Object.assign({}, defaults, { domains: [], traits: [], favorites: [], children: [], personalProfiles: {} });
          announce('Vos données ont été effacées');
          if (location.hash === '#/profil') render(); else location.hash = '#/profil';
        }
        break;
    }
  });

  root.addEventListener('change', function (e) {
    if (e.target.id === 'book-subject') { set({bookSubject:e.target.value}); return; }
    if (e.target.id === 'region') { set({ region: e.target.value }); countAnnounce('.screen .list .list-row'); }
  });

  var searchTimer = null;
  root.addEventListener('input', function (e) {
    if(e.target.matches('.search input')){var clear=e.target.closest('.search').querySelector('.search-clear');if(clear)clear.hidden=!e.target.value;}
    if(e.target.id==='location-query'){locationQuery=e.target.value;locationSearchId++;return;}
    if (e.target.id === 'book-q') { S.bookQ=e.target.value;save();document.getElementById('books').innerHTML=bookList();return; }
    if (e.target.id === 'cal-q') {
      S.calQ = e.target.value; S.calLimit = 40; save();
      clearTimeout(searchTimer); searchTimer = setTimeout(render, 350); return;
    }
    if (e.target.id === 'person-name') { S.name = e.target.value; save(); return; }
    if (e.target.id !== 'q') return;
    S.q = e.target.value; S.jobLimit = 60; save();
    var box = document.getElementById('jobs');
    if (box) box.innerHTML = jobRows();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { countAnnounce('#jobs .list-row'); }, 600);
  });

  UI.init();
  render();
  booted = true;
})();
