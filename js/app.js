(function () {
  'use strict';

  var D = window.DATA;
  var root = document.getElementById('app');
  var UI = window.YSECK_UI;
  var expandedDatesJob = null, jobSlideRequested = false, expandedPrepCategories = {}, visitedRoutes = [], tripCatPick = null;
  var talentIntroAnimate = false, nameAnimate = false, interestGesture = null;
  /* Premier passage : seul l’onboarding est chargé ; le catalogue complet arrive à la fin de la création du profil. */
  var catalogReady = !window.YSECK_CATALOG || window.YSECK_CATALOG.full, catalogLoading = false, dashboardEnter = false, profileFinished = false;
  var LIGHT_ROUTES = ['bienvenue', 'versants', 'categories-intro', 'choix-profil', 'profil', 'niveau', 'interets', 'traits', 'situation', 'confidentialite', 'accessibilite', 'mentions'];
  var KEY = 'ofp-state-v1';

  /* ---------- État ---------- */
  var defaults = {
    profile: null, level: null, domains: [], traits: [], ambitions: [], defis: [], agentPublic: null, experience: null, boursier: null, budget: null, done: false, pendingChanges: false,
    metDomains: null, metCats: null, metFps: null, q: '', calCat: 'Toutes', calCats: null, calFps: null, track: 'Administratif',
    prepBudget: null, alert: false, openCat: null, region: 'Toutes', talentsAll: false,
    name: '', location: null, favorites: [], children: [], activeChild: null, personalProfiles: {},
    metMode: 'mine', jobLimit: 60, calFp: 'Tous', calView: 'upcoming', calLimit: 40, calQ: '',
    contrast: false, largeText: false, dysFont: false, colorMode: 'auto', cq: '', filterHintSeen: false, tipSeen: {}, bookQ: '', bookSubject: 'Toutes', bookCategory: 'A', bookFp: 'Tous',
    resQ: '', resCat: 'Toutes', resFp: 'Tous', resCats: null, resFps: null, resKind: 'Tous', resYear: 'Toutes', resLimit: 40, installOffered: false
  };
  var PERSON_FIELDS = ['name', 'level', 'domains', 'traits', 'ambitions', 'defis', 'agentPublic', 'experience', 'boursier', 'budget', 'done', 'location', 'favorites', 'pendingChanges', 'validated'];
  var PROFILE_SCREENS = ['moi', 'profil', 'niveau', 'interets', 'ambition', 'traits', 'situation'];
  var EDITABLE_FIELDS = ['name', 'level', 'domains', 'traits', 'ambitions', 'defis', 'agentPublic', 'experience', 'boursier', 'budget', 'location'];
  var S = load();
  /* Profil enregistré avant octobre 2026 : sans version validée, aucune modification n’est considérée en attente. */
  if (S.done && !S.validated) S.pendingChanges = false;
  syncPending();
  var profileSnapshot = profileSignature();

  function personData(st) {
    var out = {};
    PERSON_FIELDS.forEach(function (k) { out[k] = Array.isArray(st[k]) ? st[k].slice() : st[k]; });
    out.budget = normalizeBudget(out.budget);
    return out;
  }
  function normalizeBudget(value) { return value === 'Moins de 1 000 €' || value === 'Avec frais d’inscription' ? 'Frais d’inscription uniquement' : value; }
  /* Budget pour se préparer : un profil boursier a « Gratuit uniquement » (les droits universitaires lui sont remis),
     un profil non boursier « Frais d’inscription uniquement ». Les deux gardent « Plus de 1 000 € » et « Je ne sais pas ». */
  function budgetOptions(boursier) { return [boursier === 'Oui' ? 'Gratuit uniquement' : 'Frais d’inscription uniquement', 'Plus de 1 000 €', 'Je ne sais pas']; }
  function budgetFor(boursier, budget) {
    if (!boursier || !budget) return budget;
    if (budget === 'Gratuit uniquement' || budget === 'Frais d’inscription uniquement') return budgetOptions(boursier)[0];
    return budget;
  }
  /* IPAG, CPAG, IEP et universités : gratuits pour un profil boursier (droits universitaires remis), avec frais d’inscription sinon. */
  var UNI_PREPS = ['ipag', 'iep'];
  function prepPrice(p) { return UNI_PREPS.indexOf(p.id) > -1 ? (S.boursier === 'Oui' ? 'Gratuit' : 'Frais d’inscription') : p.price; }
  function prepBudget(p) { return UNI_PREPS.indexOf(p.id) > -1 ? (S.boursier === 'Oui' ? 0 : 1) : p.budget; }
  function blankPerson(name) { return { name: name || '', level: null, domains: [], traits: [], ambitions: [], defis: [], agentPublic: null, experience: null, boursier: null, budget: null, done: false, location: null, favorites: [], pendingChanges: false, validated: null }; }
  function profileSignature() { return JSON.stringify(EDITABLE_FIELDS.map(function(k){return S[k];})); }
  function profileNeedsValidation() { return !!(S.done && S.pendingChanges); }
  /* Les réponses sont comparées à la dernière version validée : revenir en arrière retire le bouton « Terminer les modifications ». */
  function markValidated() { S.validated = profileSignature(); S.pendingChanges = false; }
  function syncPending() {
    if (!S.done) { S.pendingChanges = false; return; }
    if (!S.validated) S.validated = profileSignature();
    S.pendingChanges = profileSignature() !== S.validated;
  }
  function profileSubmitLabel(label) { return profileNeedsValidation() ? 'Terminer les modifications' : label; }
  function profileContinuation(href,label,ready) {
    if(profileNeedsValidation())return '<button type="button" class="btn" data-action="validateProfile">Terminer les modifications</button>';
    return ready===false?'<button type="button" class="btn" disabled>'+label+'</button>':'<a class="btn" href="'+href+'">'+label+'</a>';
  }
  /* Étape facultative : le bouton reste grisé sans choix, un lien discret permet de passer. */
  function skipStep(href) { return profileNeedsValidation()?'':'<a class="skip-step" href="'+href+'">Passer cette étape</a>'; }
  function validateProfile() {
    if(!identityReady()){navigate(nameReady()?'#/niveau':'#/profil');announce(nameReady()?'Choisissez un niveau pour continuer.':'Renseignez un prénom pour continuer.');return;}
    var back=profileReturn;profileReturn=null;
    S.name=S.name.trim();markValidated();profileSnapshot=profileSignature();save();navigate(back||'#/accueil');announce('Modifications enregistrées.');
  }
  function activeChild() { return S.children.find(function (c) { return c.id === S.activeChild; }); }
  function syncPerson() {
    if (isParent()) {
      var child = activeChild(); if (child) Object.assign(child, personData(S));
    } else if (S.profile) S.personalProfiles[S.profile] = personData(S);
  }
  function usePerson(p) {
    Object.assign(S, blankPerson(), p);
    S.budget = normalizeBudget(S.budget);
    if (S.done && !S.validated) S.pendingChanges = false;
    syncPending();
    profileSnapshot=profileSignature();
    S.metDomains = null; S.metMode = 'mine'; S.metCats = null; S.metFps = null; S.q = ''; S.cq = ''; S.jobLimit = 60; S.region = 'Toutes';
    S.prepBudget = null; S.talentsAll = false; S.calCat = 'Toutes'; S.calFp = 'Tous'; S.calCats = null; S.calFps = null; S.calQ = ''; S.calLimit = 40;
    locationResults = []; locationStatus = ''; locationQuery = ''; locationSearchId++;
  }
  function ensureFamily() {
    if (!S.children.length) {
      var child = Object.assign(blankPerson(), { id: 'enfant-1' });
      S.children.push(child); S.activeChild = child.id;
    }
    if (!activeChild()) S.activeChild = S.children[0].id;
  }
  function childName() { var c = activeChild(); return c ? c.name || 'votre enfant' : 'votre enfant'; }
  function familyEstablished() { return isParent() && S.children.some(function(c){return c.done;}); }
  function nameReady() { return !!(S.profile && S.name.trim()); }
  function identityReady() { return !!(nameReady() && S.level); }
  /* Sur téléphone, l’écran suivant n’apparaît qu’une fois le clavier refermé : sinon son bouton du bas suit la fermeture
     du clavier et bouge avant de se poser. Sans clavier ouvert (ou sans visualViewport), on enchaîne aussitôt. */
  function afterKeyboard(fn) {
    var vv = window.visualViewport, open = function () { return window.innerHeight - vv.height > 120; };
    if (!vv || !open()) { fn(); return; }
    var done = false, timer = setTimeout(go, 500);
    function go() { if (done) return; done = true; clearTimeout(timer); vv.removeEventListener('resize', check); fn(); }
    function check() { if (!open()) setTimeout(go, 60); }
    vv.addEventListener('resize', check);
  }
  function confirmName(advance) {
    var input=document.getElementById('person-name');
    if(!input||!input.value.trim())return;
    S.name=input.value.trim();input.value=S.name;save();
    input.blur();
    if(advance){afterKeyboard(function(){if(profileNeedsValidation())validateProfile();else navigate('#/niveau');});return;}
    var button=document.getElementById('name-confirm');if(button)button.focus({preventScroll:true});
    announce('Prénom enregistré.');
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      var saved=raw?JSON.parse(raw):{};
      var st = Object.assign({}, defaults, saved);
      st.budget = normalizeBudget(st.budget);
      ['traits', 'domains', 'ambitions', 'defis', 'favorites', 'children'].forEach(function (k) { if (!Array.isArray(st[k])) st[k] = []; });
      st.personalProfiles = st.personalProfiles || {};
      st.children = st.children.filter(function (c) { return c && c.id; }).map(function (c) { return Object.assign(blankPerson(), c); });
      if (st.profile === 'par' && !st.children.length && !Object.prototype.hasOwnProperty.call(saved,'children') && (st.name||st.level||st.done)) {
        st.children = [Object.assign(blankPerson('Enfant 1'), personData(st), { id: 'enfant-1' })];
        st.children[0].name = st.children[0].name || 'Enfant 1'; st.activeChild = 'enfant-1';
      }
      if (st.profile === 'par' && st.children.length) {
        var child = st.children.find(function (c) { return c.id === st.activeChild; }) || st.children[0];
        st.activeChild = child.id; Object.assign(st, personData(child));
      }
      if(st.profile==='par'&&!st.children.length){st.activeChild=null;Object.assign(st,blankPerson());}
      /* À chaque ouverture, l'onglet Métiers repart des domaines choisis */
      st.metDomains = null;
      st.metMode = 'mine'; st.jobLimit = 60;
      /* Filtres à choix multiple : les anciens réglages uniques reviennent aux choix par défaut. */
      ['metCat', 'metFp', 'showContracts', 'contractsV'].forEach(function (k) { delete st[k]; });
      if (!Array.isArray(st.metCats)) st.metCats = null;
      if (!Array.isArray(st.metFps)) st.metFps = null;
      return st;
    } catch (e) { return Object.assign({}, defaults, { domains: [], traits: [], favorites: [], children: [], personalProfiles: {} }); }
  }
  function save() {
    var current=profileSignature();
    /* Le choix boursier·e ou la commune saisis ailleurs s’enregistrent directement : seul le questionnaire demande une validation. */
    if(S.done&&profileSnapshot!==undefined&&current!==profileSnapshot){
      if(PROFILE_SCREENS.indexOf(route().name)>-1)syncPending();
      else if(!S.pendingChanges)S.validated=current;
    }
    syncPerson();
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ }
    profileSnapshot=current;
  }
  /* Espace perso : pas de défilement quand tous les blocs tiennent à l'écran. */
  var homeLocked = false;
  function lockHome(on) {
    homeLocked = on;
    var de = document.documentElement;
    if (!de || !de.classList || typeof requestAnimationFrame !== 'function') return;
    de.classList.remove('home-locked');
    if (!on) return;
    requestAnimationFrame(function () {
      if (!homeLocked) return;
      de.classList.toggle('home-locked', de.scrollHeight <= window.innerHeight + 1);
    });
  }
  window.addEventListener('resize', function () { if (homeLocked) lockHome(true); });
  function set(patch) { Object.assign(S, patch); save(); render(); }

  /* ---------- Icônes ---------- */
  var I = {
    studyMap: '<svg class="study-map-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4 3 6.2v13.6L9 18l6 2 6-2.2V4.2L15 6 9 4z"/><path d="M9 4v14M15 6v14"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
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
  I.send = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l6 6-6 6"/><path d="M21 11h-9a8 8 0 0 0-8 8v1"/></svg>';
  I.plus = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  I.grid = UI.icons.compass;
  /* Concours : copie et crayon (onglet) ; médaille de l’admission (fiches métier) et sceau validé (fiches concours) dans l’ovale d’arrivée ; cible (Se préparer). */
  I.exam = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20.5H6.5A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 17 5v4.5"/><path d="M8.5 8h5M8.5 11.5h5M8.5 15h2.5"/><path d="m19.6 12.6 1.8 1.8-6.2 6.2-2.6.8.8-2.6z"/></svg>';
  I.medal = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.3 7 21l5-2.5 5 2.5-1.5-7.7"/></svg>';
  I.seal = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.91 1.98 3.45.66.66 3.45L21 12l-1.98 2.91-.66 3.45-3.45.66L12 21l-2.91-1.98-3.45-.66-.66-3.45L3 12l1.98-2.91.66-3.45 3.45-.66z"/><path d="m8.6 12.2 2.3 2.3 4.5-4.8"/></svg>';
  I.target = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="currentColor"/></svg>';
  I.layers = UI.icons.book;

  /* ---------- Outils ---------- */
  /* « 2026-10-17 » devient « 17 octobre 2026 ». */
  function frDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); if (!m) return String(iso || '');
    return parseInt(m[3], 10) + (m[3] === '01' ? 'er' : '') + ' ' + ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][parseInt(m[2], 10) - 1] + ' ' + m[1];
  }
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
  function isContractJob(j) { return j.cat === 'X' || j.cat === 'CDD' || j.contractual === true; }
  function displayCategory(j) { return isContractJob(j) ? 'CDD' : j.cat; }
  function jobById(id) { return D.jobs.find(function(j){return j.id===id;}); }
  /* Se préparer ouvert depuis une fiche concours (#/preparer/métier/concours) : la page et ses sous-pages restent centrées
     sur ce concours, retours compris. Oublié dès qu’on quitte ces pages. */
  var prepFocus = null, PREP_PAGES = ['preparer', 'prepa', 'annales', 'bibliographie', 'ressources-biblio', 'handicap', 'etudes', 'calendrier'];
  function prepHref(j) { return isContractJob(j) ? '#/sans-concours/' + j.id : '#/preparer/' + j.id + (prepFocus && prepFocus.job === j.id ? '/' + prepFocus.key : ''); }
  function catClass(c) { return c === 'A+' ? 'cat-Ap' : (c === 'V' ? 'cat-X' : 'cat-' + c); }
  function catLabel(c) { return c === 'CDD' || c === 'X' ? 'CDD · emploi contractuel' : (c === 'V' ? 'Catégorie selon le poste' : 'Catégorie ' + c); }
  function catShort(c) { return c === 'CDD' || c === 'X' ? I.contract : c === 'V' ? '<span style="font-size:0.6875rem">' + 'Var.' + '</span>' : c; }
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
  function mail(addr) { return '<a href="mailto:' + esc(addr) + '">' + esc(addr) + '</a>'; }
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
  /* Métiers et concours partagent l’onglet Explorer : il rouvre la dernière liste consultée. */
  function exploreHref() { return S.explore === 'concours' ? '#/concours-liste' : '#/metiers'; }
  function exploreSwitch(active) {
    return '<div class="explore-switch" role="tablist" aria-label="Métiers ou concours" data-on="' + (active === 'concours' ? 1 : 0) + '">' + [['metiers', 'Métiers'], ['concours', 'Concours']].map(function (t) {
      var on = t[0] === active;
      return '<a role="tab" href="' + (t[0] === 'concours' ? '#/concours-liste' : '#/metiers') + '" class="' + (on ? 'on' : '') + '" aria-selected="' + on + '">' + esc(t[1]) + '</a>';
    }).join('') + '</div>';
  }
  /* Menu du bas : l’onglet actif prend la version pleine de son pictogramme, même tracé que la version vide (UI.icons) ;
     le signet plein est celui du bouton Favori des fiches. La boussole pleine garde son aiguille en creux. */
  var fillIcon = function (svg) { return svg.replace('fill="none"', 'fill="currentColor"'); };
  var TAB_FILLED = {
    home: fillIcon(I.home), bookmark: fillIcon(I.bookmark), user: fillIcon(I.user),
    compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path stroke="none" fill="currentColor" fill-rule="evenodd" d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 1 0 0-17zM15.5 8.5l-2 5-5 2 2-5z"/></svg>'
  };
  function tabbar(active) {
    if (active === 'prepas' || active === 'concours') active = 'accueil';
    if (active === 'metiers' || active === 'concours-liste') active = 'explorer';
    var tabs = [['accueil', isParent() ? 'Famille' : 'Accueil', I.home, TAB_FILLED.home], ['explorer', 'Explorer', I.compass, TAB_FILLED.compass], ['favoris', 'Favoris', I.bookmark, TAB_FILLED.bookmark], ['moi', isParent()&&S.children.length>=2?'Profils':'Profil', I.user, TAB_FILLED.user]];
    return '<nav class="tabbar" aria-label="Navigation principale">' + tabs.map(function (t) {
      var on = t[0] === active;
      return '<a href="' + (t[0] === 'explorer' ? exploreHref() : '#/' + t[0]) + '" class="' + (on ? 'on' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + (on ? t[3] : t[2]) + esc(t[1]) + '</a>';
    }).join('') + '</nav>';
  }
  function chip(action, value, label, on, extraCls) {
    return '<button type="button" class="chip' + (extraCls ? ' ' + extraCls : '') + ((action === 'metCat' || action === 'calCat' || action === 'calCats' || action === 'resCats' || action === 'bookCategory') && value !== 'Toutes' ? ' category-choice ' + catClass(value) : '') + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', action) + attr('v', value) + '>' + (action === 'metCat' && value === 'CDD' ? '<span>Contractuels</span>' + I.contract : esc(label)) + '</button>';
  }
  /* Valider une recherche ferme le clavier ; les résultats se mettent déjà à jour pendant la saisie. */
  function submitSearch(id) {
    var input = document.getElementById(id); if (!input) return;
    input.blur(); if (id === 'q') updateSuggest(false);
    /* Commune : Entrée ou la flèche lancent la même recherche que « Rechercher la commune ». */
    if (id === 'location-query') { searchLocation(); return; }
    var results = root.querySelector('#jobs, #study-results, #books, .calendar-list');
    if (results && id !== 'location-query') { var n = results.querySelectorAll('.list-row, .study-card, .book-card').length; announce(n ? n + ' résultat' + (n > 1 ? 's' : '') : 'Aucun résultat'); }
  }
  function searchField(id, label, placeholder, value) {
    return '<div class="search">' + I.search + '<label class="sr-only" for="' + id + '">' + esc(label) + '</label>' +
      '<input type="search" id="' + id + '" placeholder="' + esc(placeholder) + '" value="' + esc(value || '') + '" autocomplete="off" enterkeyhint="search">' +
      '<button type="button" class="search-clear" data-action="clearSearch"' + attr('v',id) + ' aria-label="Effacer la recherche"' + (value ? '' : ' hidden') + '>' + I.close + '</button>' +
      '<button type="button" class="search-go' + (value ? ' ready' : '') + '" data-action="submitSearch"' + attr('v',id) + ' aria-label="Valider la recherche">' + I.arrow + '</button></div>';
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
  function regionName(k) { return k === 'Toutes' ? 'Toute la France' : REG[k]; }
  /* Prépas Talents : carte des régions de métropole (la région choisie en couleur, toutes pour la France entière),
     puis un champ qui ouvre la liste des régions par le bas de l’écran. */
  function regionMap() {
    var m = D.regionMap; if (!m) return '';
    return '<svg class="region-map' + (S.region === 'Toutes' ? ' all' : '') + '" viewBox="' + m.viewBox + '" aria-hidden="true" focusable="false">' + Object.keys(m.paths).map(function (k) {
      return '<path d="' + m.paths[k] + '"' + (S.region === k ? ' class="on"' : '') + ' data-action="pickRegion"' + attr('v', k) + '></path>';
    }).join('') + '</svg>' + (S.region === 'OM' ? '<span class="region-map-om">Outre-mer</span>' : '');
  }
  function regionField() {
    return '<button type="button" class="region-field" data-action="openRegions" aria-haspopup="dialog" aria-label="Région : ' + esc(regionName(S.region)) + '. Choisir une autre région"><span>' + esc(regionName(S.region)) + '</span>' + I.down + '</button>';
  }
  function regionSheet(counts) {
    return '<div class="region-options">' + ['Toutes'].concat(Object.keys(REG)).map(function (k) {
      var on = S.region === k;
      return '<button type="button" class="region-option' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-action="pickRegion"' + attr('v', k) + '><span class="region-option-name">' + esc(regionName(k)) + '</span>' +
        (counts ? '<span class="region-option-count">' + (counts[k] || 0) + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }
  var locationResults = [], locationStatus = '', locationQuery = '', locationSearchId = 0, communes = null;
  function locationForm() {
    return '<section class="stack mt-m"><h2 class="h3">' + (isParent() ? 'Son lieu de vie' : 'Votre lieu de vie') + '</h2><p class="small m0">' + (S.location ? esc(S.location.label) : 'Ajoutez une commune pour classer les Prépas Talents par proximité.') + '</p>' +
      searchField('location-query','Commune ou code postal','Ex. : Lyon ou 69003',locationQuery) + (S.location ? '' : '<button type="button" class="btn outline" data-action="searchLocation">Rechercher la commune</button>') +
      '<p class="small m0" role="status">' + esc(locationStatus) + '</p>'+(locationResults.length?'<ul class="location-results" aria-label="Communes proposées">'+locationResults.map(function(c,i){return '<li><button type="button" class="location-option" data-action="selectLocation"'+attr('v',i)+'><span class="location-name">'+esc(c.name||c.label)+'</span>'+(c.postalCodes?'<span class="location-postcodes">'+esc(c.postalCodes.join(', '))+'</span>':'')+'</button></li>';}).join('')+'</ul>':'')+
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
        .map(function (c) { return { name:c[0],postalCodes:c[2].slice(),label: c[0] + ' (' + c[2].join(', ') + ')', code: c[1], lon: c[3], lat: c[4] }; });
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
  function rawJobCategories(j) { if(isContractJob(j))return ['CDD']; return j.cat==='V'?indicativeCategories(j):(j.categories&&j.categories.length?j.categories:[j.cat]); }
  /* Catégorie variable (déduite des offres d’emploi) : on ne garde que les catégories qui ont un concours rattaché ;
     les autres restent signalées sur la fiche (« aussi sur offre d’emploi »). */
  var catsMemo = {};
  function jobCategories(j) {
    var raw = rawJobCategories(j);
    if (j.cat !== 'V' || isContractJob(j)) return raw;
    if (catalogReady && catsMemo[j.id]) return catsMemo[j.id];
    var rc = jobRefs(j).map(function (c) { return c.cat; }), kept = raw.filter(function (c) { return rc.indexOf(c) > -1; }), out = kept.length ? kept : raw;
    if (catalogReady) catsMemo[j.id] = out;
    return out;
  }
  function extraJobCategories(j) { var shown = jobCategories(j); return rawJobCategories(j).filter(function (c) { return shown.indexOf(c) < 0; }); }
  function extraCatsNote(j) {
    var extra = extraJobCategories(j); if (!extra.length) return '';
    var names = extra.length === 1 ? 'catégorie ' + extra[0] : 'catégories ' + extra.slice(0, -1).join(', ') + ' et ' + extra[extra.length - 1];
    return '<p class="extra-cats"><span class="extra-cats-pills" aria-hidden="true">' + extra.map(function (c) { return '<span class="extra-cat">' + c + '</span>'; }).join('') + '</span>' +
      '<span>Postes aussi proposés en <b>' + names + '</b>, sur offre d’emploi (contrat, détachement ou promotion), sans concours dédié.</span></p>';
  }
  function jobRoutes(j) { var cats=rawJobCategories(j);return (j.routeIds||[]).map(function(id){return D.accessRoutes[id];}).filter(function(r){return r&&cats.indexOf(r.cat)>-1&&r.fp.split('').some(function(f){return j.fp.indexOf(f)>-1;});}); }
  function indicativeCategories(j) {
    if (j.cat !== 'V' || isContractJob(j)) return [displayCategory(j)];
    var order=['A+','A','B','C'], counts=j.categoryCounts || {};
    var observed=order.filter(function(c){return (j.categories||[]).indexOf(c)>-1;});
    var largest=Math.max.apply(null,observed.map(function(c){return Number(counts[c])||0;}));
    // Les catégories marginales des offres ne doivent pas masquer les catégories principales.
    if (largest>0) return observed.filter(function(c){return (Number(counts[c])||0)>=largest/2;});
    if (observed.length) return observed;
    var links=D.crosswalk.filter(function(l){return l.jobId===j.id&&l.status!=='rejeté';});
    var confirmed=links.filter(function(l){return l.status==='validé';});
    var routes=(confirmed.length?confirmed:links).map(function(l){return D.accessRoutes[l.routeId];}).filter(Boolean);
    return order.filter(function(c){return routes.some(function(r){return r.cat===c&&r.fp.split('').some(function(f){return j.fp.indexOf(f)>-1;});});});
  }
  function jobBadges(j, only) {
    if(j.cat!=='V'&&!only||isContractJob(j))return catBadge(displayCategory(j));
    var cats=jobCategories(j);
    /* Liste filtrée par catégorie : seules les catégories retenues apparaissent sur la card. */
    if(only){var kept=cats.filter(function(c){return only.indexOf(c)>-1;});if(kept.length)cats=kept;}
    if(cats.length===1)return catBadge(cats[0]);
    return cats.length?'<span class="job-categories" role="img" aria-label="Catégories indicatives '+esc(cats.join(', '))+', selon le corps et le poste">'+cats.map(function(c){return '<span class="cat sm '+catClass(c)+'" aria-hidden="true">'+c+'</span>';}).join('')+'</span>':catBadge('V');
  }
  /* Couleur d’une fiche : la catégorie la plus élevée du métier, ou les contractuels. */
  function themeCategory(j) {
    var cats=jobCategories(j);
    return ['A+','A','B','C','CDD'].filter(function(c){return cats.indexOf(c)>-1;})[0]||null;
  }
  function jobFits(j) { return isOpen(j)||jobCategories(j).some(function(c){return categoryFit(c)!=='';}); }
  /* Filtres à choix multiple. À partir de Bac+3, catégorie C et contractuels restent proposés mais ne sont pas cochés par défaut. */
  var ALL_CATS = ['A+', 'A', 'B', 'C', 'CDD'], ALL_FPS = ['E', 'T', 'H'];
  /* Catégories par défaut : celles du niveau d’études, restreintes par le défi choisi au profil (concours sélectif, voie rapide…). */
  var DEFIS = [
    ['selectif', 'Préparer un concours très sélectif', ['A+', 'A']],
    ['exigeante', 'S’investir dans une préparation exigeante', ['A+', 'A', 'B']],
    ['rapide', 'Trouver une voie d’accès assez rapide', ['B', 'C']],
    ['evoluer', 'Commencer puis évoluer progressivement', ['B', 'C']],
    ['sansconcours', 'Explorer aussi les recrutements sans concours', ['CDD']],
    ['nsp', 'Je ne sais pas encore', null]
  ];
  function defiCats() {
    var picks = (S.defis || []).filter(function (d) { return d !== 'nsp'; }), out = [];
    if (!picks.length) return null;
    DEFIS.forEach(function (d) { if (picks.indexOf(d[0]) > -1) d[2].forEach(function (c) { if (out.indexOf(c) < 0) out.push(c); }); });
    /* « Sans concours » seul ajoute les contractuels sans écarter les catégories du niveau. */
    if (out.length === 1 && out[0] === 'CDD') return null;
    return ALL_CATS.filter(function (c) { return out.indexOf(c) > -1; });
  }
  function levelCats() { return userRank() >= RANK['Bac+3'] ? ['A+', 'A', 'B'] : ALL_CATS.slice(); }
  function defaultCats() {
    var lv = levelCats(), dc = defiCats(), picks = S.defis || [];
    if (picks.indexOf('sansconcours') > -1 && lv.indexOf('CDD') < 0) lv = lv.concat('CDD');
    if (!dc) return lv;
    if (picks.indexOf('sansconcours') > -1 && dc.indexOf('CDD') < 0) dc = dc.concat('CDD');
    var both = lv.filter(function (c) { return dc.indexOf(c) > -1; });
    return both.length ? both : dc;
  }
  function selCats() { return S.metCats || defaultCats(); }
  function selFps() { return S.metFps || ALL_FPS.slice(); }
  function passesCats(j, cats) {
    if (isContractJob(j)) return cats.indexOf('CDD') > -1;
    var own = jobCategories(j).filter(function (c) { return ['A+', 'A', 'B', 'C'].indexOf(c) > -1; });
    /* Catégorie encore indéterminée : visible tant qu’aucune catégorie n’est écartée. */
    if (!own.length) return ['A+', 'A', 'B', 'C'].every(function (c) { return cats.indexOf(c) > -1; });
    return own.some(function (c) { return cats.indexOf(c) > -1; });
  }
  function passesLevelCategory(j) { return passesCats(j, defaultCats()); }
  function toggled(list, v, all) { var next = list.indexOf(v) > -1 ? list.filter(function (x) { return x !== v; }) : list.concat(v); return all.filter(function (x) { return next.indexOf(x) > -1; }); }

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
  /* Correspondance « parfaite » : un domaine choisi au sens strict (domaine, famille ou intitulé du métier), une ambition choisie
     et un niveau d’études compatible. Les autres métiers restent proposés, à la suite, comme pistes de découverte. */
  function matchesStrong(job, domains) { return domains.some(function (id) { return (job.strongInterests || job.interests || [job.domain]).indexOf(id) > -1; }); }
  var AMBITIONS = [
    ['exigeant', 'Viser les concours les plus exigeants', 'Grandes écoles du service public, concours très sélectifs'],
    ['diriger', 'Diriger une équipe', 'Encadrer, piloter un service ou un projet'],
    ['expert', 'Devenir expert d’un domaine', 'Analyser, conseiller, maîtriser un sujet en profondeur'],
    ['terrain', 'Agir sur le terrain', 'Intervenir, se déplacer, travailler au concret'],
    ['aider', 'Aider directement les personnes', 'Soigner, accompagner, éduquer, accueillir'],
    ['nsp', 'Je ne sais pas encore', '']
  ];
  var AMB_SHORT = { exigeant: 'concours exigeant', diriger: 'diriger', expert: 'expertise', terrain: 'terrain', aider: 'aider les personnes' };
  function ambitionNorm(t) { return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, ' ').toLowerCase(); }
  var AMB_RULES = {
    diriger: { name: /^(directeur|directrice|chef|cheffe|responsable|cadre|commissaire|commandant|capitaine|officier|administrateur|administratrice|manager|coordonnat|superviseu|encadrant)|\b(directeur|directrice|chef de |cheffe de |responsable d)/, text: /\b(encadr|manag|dirig|pilot(e|er|age) (une|l|des|d) ?(equipe|service|unite|structure|etablissement)|anim(e|er) (une|l|des) equipe)/, traits: ['manager'] },
    expert: { name: /(expert|experte|ingenieur|ingenieure|chercheu|charge d etudes|chargee d etudes|analyste|juriste|conseill|specialiste|inspect|audit|controleu|statisticien|economiste|architecte|medecin|pharmacien|veterinaire|scientifique|geomaticien|data|actuaire|biologiste|chimiste|archeolog|conservat|magistrat|redacteu)/, text: /\b(expertise|analys|etude(s)? (technique|juridique|economique|scientifique)|conseil(ler)? (technique|juridique)|recherche)/, traits: ['intellect', 'sciences', 'chiffres', 'droit'] },
    terrain: { name: /(agent|agente|technicien|technicienne|ouvrier|ouvriere|gardien|gardienne|surveillant|sapeur|pompier|policier|policiere|gendarme|douanier|douaniere|jardinier|jardiniere|conducteu|operat|patrouill|pilote|marin|garde|eclusier|bucheron|egoutier|chauffeur|mecanicien|electricien|plombier|maçon|macon|soigneur|guide|maitre-chien|demineu|plongeu|secouriste|ambulanc|brancardier)/, text: /\b(sur le terrain|intervention|interven(ir|tion)s?|patrouill|chantier|tournee|deplacement|en exterieur)/, traits: ['dehors', 'manuel', 'charges', 'uniforme', 'conduire', 'horaires', 'sport'] },
    aider: { name: /(infirmi|aide-soign|aide soign|educat|assistant(e)? (de service social|social|socio)|accompagn|animat|psycholog|auxiliaire|puericult|sage-femme|ergotherap|kinesither|orthophon|conseiller (d orientation|en insertion|principal d education)|mediat|aidant|accueil|professeur|enseignant|atsem)/, text: /\b(accompagn|soign|soins|aide aux|insertion|ecoute|protection de l enfance|personnes (agees|handicapees|vulnerables)|patients|eleves|usagers)/, traits: ['aider', 'vulnerables', 'enfants', 'accueil'], domains: ['Santé', 'Social', 'Enfance', 'Éducation'] }
  };
  var ambMemo = {};
  function jobAmbitions(j) {
    if (catalogReady && ambMemo[j.id]) return ambMemo[j.id];
    var name = ambitionNorm(j.name), text = ambitionNorm((j.activities || '') + ' ' + (j.desc || '')), traits = j.traits || [], out = [];
    var cats = jobCategories(j), refs = isContractJob(j) ? [] : jobRefs(j);
    if (cats.indexOf('A+') > -1 || refs.some(function (c) { return c.cat === 'A+' || (c.cat === 'A' && c.school); })) out.push('exigeant');
    Object.keys(AMB_RULES).forEach(function (k) {
      var r = AMB_RULES[k];
      if (r.name.test(name) || r.text.test(text) || r.traits.some(function (t) { return traits.indexOf(t) > -1; }) || (r.domains && r.domains.indexOf(j.domain) > -1)) out.push(k);
    });
    if (catalogReady) ambMemo[j.id] = out;
    return out;
  }
  function wantedAmbitions() { return (S.ambitions || []).filter(function (a) { return a !== 'nsp'; }); }
  function ambitionOk(j) { var w = wantedAmbitions(); if (!w.length) return true; var have = jobAmbitions(j); return w.some(function (a) { return have.indexOf(a) > -1; }); }
  function matchedAmbitions(j) { var have = jobAmbitions(j); return wantedAmbitions().filter(function (a) { return have.indexOf(a) > -1; }); }
  function jobFitsCriteria(j, doms) { return (!doms.length || matchesStrong(j, doms)) && ambitionOk(j); }
  function isPerfectJob(j, doms) { return passesLevelCategory(j) && jobFitsCriteria(j, doms); }
  function partialScore(j, doms) {
    return (doms.length && matchesStrong(j, doms) ? 4 : doms.length && matchesDomains(j, doms) ? 2 : 0) + (wantedAmbitions().length && ambitionOk(j) ? 3 : 0) + (passesLevelCategory(j) ? 1 : 0) + sharedTraits(j).length;
  }
  function myJobs() {
    var base = D.jobs.filter(function (j) { return isPerfectJob(j, S.domains); });
    return contractsLater(base.sort(function (a, b) { return score(b) - score(a); }));
  }
  /* Les quatre premières places reviennent aux métiers de catégorie A+, A, B ou C : les contractuels arrivent ensuite. */
  function contractsLater(list) {
    var head = list.filter(function (j) { return !isContractJob(j); }).slice(0, 4);
    return head.concat(list.filter(function (j) { return head.indexOf(j) === -1; }));
  }
  function activeDomains() { return S.metDomains === null ? S.domains.slice() : S.metDomains; }

  /* Prépas Talents qui préparent les concours d'une liste de métiers */
  function prepKeys(jobs) {
    var keys = [];
    jobs.forEach(function (j) {
      var preps = [j.prep].concat(jobRoutes(j).map(function (r) { return r.prep; }));
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
    return D.calendar.filter(function (c) { var dates=[c.date,c.written,c.oral].filter(Boolean);return dates.some(function(d){return d>=today;})||(!dates.length&&c.provisional); }).sort(calendarOrder);
  }
  function calendarOrder(a,b) {
    function voieRank(c) { var v=norm(c.voie||''); return /externe|1er concours|premier concours/.test(v)?0:/interne|2e concours|deuxieme concours/.test(v)?1:/troisieme|3e|3eme/.test(v)?2:3; }
    return voieRank(a)-voieRank(b)||(a.date||a.written||'9999').localeCompare(b.date||b.written||'9999')||a.name.localeCompare(b.name,'fr');
  }
  function examsFor(j, all) {
    return (all ? D.calendar : upcoming()).filter(function (c) {
      if (j.fp.indexOf(c.fp) === -1) return false;
      var category=calendarCategory(c,j);
      if(['A+','A','B','C'].indexOf(category)===-1||(j.cat==='V'?indicativeCategories(j):jobCategories(j)).indexOf(category)===-1)return false;
      return (c.routeIds || []).some(function(id){var r=D.accessRoutes[id];return (j.routeIds||[]).indexOf(id)>-1&&r&&r.cat===category&&r.fp.indexOf(c.fp)>-1;});
    }).sort(calendarOrder);
  }
  function calendarCategory(session,job) {
    if(session.cat!=='V')return session.cat;
    /* Session à catégorie variable : la catégorie de ses corps, quand elle est unique. */
    var cats=[];(session.routeIds||[]).forEach(function(id){var r=D.accessRoutes[id];if((!job||(job.routeIds||[]).indexOf(id)>-1)&&r&&r.fp.indexOf(session.fp)>-1&&['A+','A','B','C'].indexOf(r.cat)>-1&&cats.indexOf(r.cat)===-1)cats.push(r.cat);});
    return cats.length===1?cats[0]:session.cat;
  }
  /* Dates brutes (« 2026-10-17 » ou « 17-10-2026 ») écrites en toutes lettres ; les libellés rédigés restent tels quels. */
  function calDay(t) {
    t = String(t || '').trim(); var m = /^(\d{2})[-\/](\d{2})[-\/](\d{4})$/.exec(t);
    return m ? frDate(m[3] + '-' + m[2] + '-' + m[1]) : /^\d{4}-\d{2}-\d{2}$/.test(t) ? frDate(t) : t;
  }
  function calendarRows(list, limit, job) {
    if (!list.length) return '<p class="empty">Aucune session publiée pour cette sélection.</p>';
    return list.slice().sort(calendarOrder).slice(0, limit || 40).map(function (c) {
      /* Statut : pastille verte « Session publiée », pastille rouge « Inscriptions closes ». */
      var closed = c.date && c.date < todayISO();
      /* Inscriptions closes : seule la pastille rouge reste. */
      var status = '<span class="cal-status">' + (closed ? '<span class="status-pill status-closed">Inscriptions closes</span>' : c.provisional ? '<span class="status-pill status-plan">Calendrier prévisionnel</span>' : '<span class="status-pill status-ok">Session publiée</span>') + '</span>';
      return '<article class="prep"><div class="head cal-head"><h3 class="h3 no-icon">' + sig(c.name) + '</h3>' + catBadge(calendarCategory(c,job), 'sm') + '</div><p>' + esc(D.fps[c.fp] + ' · ' + c.voie) + '</p>' +
        (c.employer ? '<p class="small">Organisé par : '+esc(c.employer)+'</p>' : '') +
        (c.location ? '<p>' + esc(c.location) + '</p>' : '') +
        status + '<dl class="exam-dates"><dt>Ouverture</dt><dd>' + esc(calDay(c.openLabel || c.open) || 'Non publiée') + '</dd><dt>Clôture</dt><dd>' + esc(calDay(c.closeLabel || c.date) || 'Non publiée') + '</dd><dt>Écrits ou sélection</dt><dd>' + esc(calDay(c.writtenLabel) || 'Non publiés') + '</dd><dt>Oraux</dt><dd>' + esc(calDay(c.oralLabel) || 'Non publiés') + '</dd></dl>' +
        ext(c.url, 'Voir l’avis officiel', 'link-plain') + '<p class="small m0">Source : ' + esc(c.source) + ' · vérifiée le ' + esc(frDate(c.checked)) + '</p></article>';
    }).join('');
  }

  /* ---------- Écrans : introduction ---------- */
  var screens = {};
  var STEPS = 6;

  /* Prépa Talents : bandeau photo teinté de bleu avec le logo blanc, puis carte blanche au liseré bleu
     (coins biseautés en bas) : présentation, pointillés, puis la bourse. En titre de page (h1), le logo tient lieu de titre visible. */
  function talentsHero(extra) { return '<div class="talents-hero"><img class="talents-logo" src="assets/prepas-talents-logo.png" alt="Prépas Talents" width="360" height="173">' + (extra || '') + '</div>'; }
  function talentsFeature(title,body,heading,extraClass) {
    heading=heading||'h2';
    return '<section class="talents-card'+(extraClass?' '+extraClass:'')+'">'+talentsHero()+'<div class="talents-body"><'+heading+' class="no-icon'+(heading==='h1'?' sr-only':'')+'">'+title+'</'+heading+'>'+body +
      '<div class="talents-perf" aria-hidden="true"></div><p>L’entrée se fait sous conditions de ressources, les mêmes que pour une bourse sur critères sociaux, et de mérite : examen du dossier, puis entretien. Priorité aux candidats qui vivent et ont étudié dans un quartier prioritaire, une zone rurale ou en outre-mer.</p><p>Une fois admis, <b>une bourse Talents de ' + esc(D.talentsGrantLabel || '5 000 €') + ' par an</b> s’ajoute à la bourse sur critères sociaux.</p></div></section>';
  }

  screens.bienvenue = function () {
    return '<main class="screen intro-welcome"><section class="welcome-hero"><h1>Tous les métiers de la fonction publique, et le chemin pour y arriver</h1></section>' +
      '<ul class="welcome-checks">' + ['Avec ou sans concours, avec ou sans diplôme.','Trouvez les métiers qui vous ressemblent.','Les études et les prépas pour les atteindre.'].map(function(text){return '<li>'+I.check+'<span>'+text+'</span></li>';}).join('') + '</ul>' +
      '</main><div class="footer intro-footer"><a class="btn" href="#/versants">Commencer</a>' +
      (S.done ? '<a class="link-plain" href="#/accueil">Aller à mon parcours</a>' : '') + '</div>';
  };

  /* Comprendre la fonction publique : les 3 versants puis les 4 catégories. Contenus partagés par l’onboarding
     (un écran chacun, titre h1) et par la page du profil (une seule page, titres h2). */
  var FPS_INTRO = [
    { k: 'E', short: 'État', t: 'La fonction publique d’État', d: 'Elle fait tourner les services de l’État, partout en France.', ex: 'Ministères, préfectures, écoles et lycées, tribunaux, impôts, police, armées.', tint: 'tint-blue', dot: 'var(--blue)' },
    { k: 'T', short: 'Territoriale', t: 'La fonction publique territoriale', d: 'Elle travaille au plus près des habitant·es, dans leur ville, leur département, leur région.', ex: 'Mairies, intercommunalités, conseils départementaux et régionaux.', tint: 'tint-mint', dot: 'var(--mint)' },
    { k: 'H', short: 'Hospitalière', t: 'La fonction publique hospitalière', d: 'Elle soigne et accompagne, dans les établissements publics de santé.', ex: 'Hôpitaux publics, EHPAD publics, établissements sociaux et médico-sociaux.', tint: 'tint-cyan', dot: '#22C7E0' }
  ];
  function versantsBlocks(h, fold) {
    var fps = FPS_INTRO;
    return '<' + h + ' class="mt-m understand-title no-icon">3 fonctions publiques</' + h + '>' +
      '<p class="lead">Travailler dans le service public, c’est travailler pour l’un de ces trois employeurs.</p>' +
      '<div class="stack employer-list">' + fps.map(function (f) {
        /* Bloc replié : pictogramme et nom ; le détail s’ouvre au toucher. */
        return '<details class="intro-fold intro-employer-fold"><summary><span class="employer-icon" aria-hidden="true">' + ({E:I.government,T:I.city,H:I.hospital})[f.k] + '</span>' +
          '<' + fold + ' class="employer-title no-icon">' + esc(f.t) + '</' + fold + '><span class="details-toggle" aria-hidden="true">' + I.down + '</span></summary>' +
          '<div class="intro-fold-body"><p>' + esc(f.d) + '</p><p class="ex"><b>Par exemple :</b> ' + esc(f.ex) + '</p></div></details>';
      }).join('') + '</div>' +
      '<div class="callout tint-yellow"><span class="pin"></span><p>Bon à savoir : un même métier existe souvent dans les trois. Et au cours d’une carrière, on peut passer de l’une à l’autre.</p></div>';
  }
  var CATS_INTRO = [
    { id: 'A+', t: 'Les cadres supérieurs', d: 'Ils dirigent les grandes administrations et pilotent les politiques publiques.', dip: 'Bac+3 minimum, Bac+5 recommandé', mention: 'La très grande majorité des admis ont un bac+5.', ex: 'Administrateur·rice de l’État, directeur·rice d’hôpital, magistrat·e, commissaire', tint: 'tint-blue' },
    { id: 'A', t: 'Concevoir, élaborer, manager', d: 'Ils imaginent les projets, préparent les décisions et encadrent des équipes.', dip: 'Bac+3 minimum, Bac+5 recommandé', mention: 'La très grande majorité des admis ont un bac+5.', ex: 'Attaché·e, inspecteur·rice, professeur·e, infirmier·ère', tint: 'tint-mint' },
    { id: 'B', t: 'Appliquer, rédiger, gérer', d: 'Ils mettent en œuvre les décisions, suivent les dossiers et peuvent encadrer une petite équipe.', dip: 'Bac minimum', ex: 'Greffier·ère, technicien·ne, gardien·ne de la paix', tint: 'tint-cyan' },
    { id: 'C', t: 'Exécuter, accueillir, assurer', d: 'Ils font tourner le service au quotidien, sur le terrain et au contact du public.', dip: 'Brevet, CAP, BEP, ou sans diplôme', ex: 'Adjoint·e administratif·ve, agent·e technique, ATSEM', tint: 'tint-yellow' }
  ];
  /* Catégories A et A+ : le bac+3 suffit pour s’inscrire, mais la plupart des lauréats ont un bac+5. */
  function catMention(c) { return c.mention ? '<p class="cat-mention">' + I.info + '<span>' + esc(c.mention) + '</span></p>' : ''; }
  function categoriesBlocks(h, fold) {
    var cats = CATS_INTRO;
    return '<div class="category-heading mt-m"><' + h + ' class="understand-title no-icon">4 catégories</' + h + '><div class="row" aria-hidden="true">' + ['A+','A','B','C'].map(function(c){return '<span class="cat sm '+catClass(c)+'">'+c+'</span>';}).join('') + '</div></div>' +
      '<p class="lead">Chaque poste appartient à une catégorie. Elle dépend du niveau de responsabilité et du diplôme demandé pour y entrer.</p>' +
      '<div class="stack mt-s">' + cats.map(function (c) {
        return '<details class="intro-fold intro-category-fold ' + c.tint + '"><summary>' +
          '<span class="cat lg ' + catClass(c.id) + '" aria-hidden="true">' + c.id + '</span>' +
          '<span class="intro-fold-name"><' + fold + ' class="explain-t no-icon"><span class="sr-only">Catégorie ' + c.id + ' : </span>' + esc(c.t) + '</' + fold + '><span class="intro-fold-sub">Catégorie ' + c.id + ' · ' + esc(c.dip) + '</span></span><span class="details-toggle" aria-hidden="true">' + I.down + '</span></summary>' +
          '<div class="intro-fold-body"><p>' + esc(c.d) + '</p>' + catMention(c) + '<p class="ex"><b>Par exemple :</b> ' + esc(c.ex) + '</p>' + categoryFit(c.id) + '</div></details>';
      }).join('') + '</div>' +
      '<div class="callout tint-blue"><span class="pin"></span><p>Rien n’est figé : on peut changer de catégorie au cours de sa carrière, par concours interne ou par promotion.</p></div>';
  }

  /* Onboarding : bandeau photo teinté de bleu, puis un onglet par fonction publique. */
  var FP_ICONS = { E: 'government', T: 'city', H: 'hospital' };
  screens.versants = function () {
    return '<main class="screen intro-screen intro-tabs-screen">' +
      '<section class="intro-hero versants-hero"><div class="topbar">' + back('#/bienvenue', 'Retour') + '<span class="eyebrow">Comprendre 1 / 2</span></div>' +
        '<div class="intro-hero-text"><h1>3 fonctions publiques</h1><p class="lead">Travailler dans le service public, c’est travailler pour l’un de ces trois employeurs.</p></div></section>' +
      '<div class="fp-tabs" role="tablist" aria-label="Les trois fonctions publiques">' + FPS_INTRO.map(function (f, i) {
        return '<button type="button" class="fp-tab" role="tab" id="fp-tab-' + f.k + '" aria-controls="fp-panel-' + f.k + '" aria-selected="' + (i === 0) + '"' + attr('action', 'fpTab') + attr('v', f.k) + '><span class="fp-tab-icon" aria-hidden="true">' + I[FP_ICONS[f.k]] + '</span><span>' + esc(f.short) + '</span></button>';
      }).join('') + FP_INK + '</div><div class="fp-viewport"><div class="fp-track">' +
      FPS_INTRO.map(function (f, i) {
        return '<section class="fp-panel" role="tabpanel" id="fp-panel-' + f.k + '" data-k="' + f.k + '" aria-labelledby="fp-tab-' + f.k + '"' + (i ? ' hidden' : '') + '>' +
          '<h2 class="no-icon">' + esc(f.t) + '</h2><p>' + esc(f.d) + '</p><p><b>Par exemple :</b> ' + esc(f.ex) + '</p></section>';
      }).join('') + '</div></div>' +
      '<p class="fp-note">' + I.arrow + '<span>Bon à savoir : un même métier existe souvent dans les trois. Et au cours d’une carrière, on peut passer de l’une à l’autre.</span></p>' +
      '</main><div class="footer"><a class="btn" href="#/categories-intro">J’ai compris</a></div>';
  };
  var FP_INK = '<span class="fp-ink" aria-hidden="true"></span>';
  function selectFpTab(scope, k) {
    var index = 0;
    if (scope.querySelector && scope.querySelector('.info-dates')) { S.infoTab = k === 'Ap' ? 'A+' : k; save(); }
    scope.querySelectorAll('.fp-tab').forEach(function (t, i) { var on = t.getAttribute('data-v') === k; t.setAttribute('aria-selected', String(on)); if (on) index = i; });
    scope.querySelectorAll('.fp-panel').forEach(function (p) { p.hidden = p.getAttribute('data-k') !== k; });
    placeFpTabs(scope, index);
  }
  /* Carrousel des écrans d’introduction : la bande glisse sous l’onglet choisi et les contenus défilent à sa suite.
     La hauteur suit celle du contenu affiché. */
  function placeFpTabs(scope, index, drag) {
    var bar = scope.querySelector('.fp-tabs'), track = scope.querySelector('.fp-track');
    if (!bar || !track) return;
    var tabs = bar.querySelectorAll('.fp-tab');
    if (index == null) index = Math.max(0, [].map.call(tabs, function (t) { return t.getAttribute('aria-selected'); }).indexOf('true'));
    var tab = tabs[index], panel = track.children[index];
    track.style.transform = 'translateX(' + (drag ? 'calc(' + (-100 * index) + '% + ' + drag + 'px)' : (-100 * index) + '%') + ')';
    /* Onboarding : le curseur suit le contenu glissé au doigt. */
    if (drag && tab && bar.closest('.intro-tabs-screen, .info-dates')) {
      var vw = track.parentNode.offsetWidth || 1, step = tab.offsetWidth;
      bar.classList.add('ink-dragging');
      bar.style.setProperty('--ink-x', Math.max(tabs[0].offsetLeft, Math.min(tabs[tabs.length - 1].offsetLeft, tab.offsetLeft - drag * step / vw)) + 'px');
    }
    if (drag) return;
    if (typeof inkDrag === 'undefined' || !inkDrag) bar.classList.remove('ink-dragging');
    if (tab && tab.offsetWidth) {
      bar.style.setProperty('--ink-x', tab.offsetLeft + 'px');
      bar.style.setProperty('--ink-w', tab.offsetWidth + 'px');
      bar.style.setProperty('--ink-color', tab.style.getPropertyValue('--tab-color') || 'var(--brand)');
      bar.style.setProperty('--ink-tint', tab.style.getPropertyValue('--tab-tint') || 'var(--lilac)');
      bar.classList.add('inked');
    }
    if (panel && panel.offsetHeight) track.parentNode.style.height = panel.offsetHeight + 'px';
  }

  /* Onboarding : même gabarit que les fonctions publiques, un onglet par catégorie (pastille), soulignement à sa couleur. */
  screens['categories-intro'] = function () {
    return '<main class="screen category-screen intro-tabs-screen">' +
      '<section class="intro-hero categories-hero"><div class="topbar">' + back('#/versants', 'Retour') + '<span class="eyebrow">Comprendre 2 / 2</span></div>' +
        '<div class="intro-hero-text"><h1>4 catégories</h1><p class="lead">Chaque poste appartient à une catégorie. Elle dépend du niveau de responsabilité et du diplôme demandé pour y entrer.</p></div></section>' +
      '<div class="fp-tabs cat-tabs" role="tablist" aria-label="Les quatre catégories">' + CATS_INTRO.map(function (c, i) {
        var k = catClass(c.id).slice(4);
        return '<button type="button" class="fp-tab" role="tab" id="cat-tab-' + k + '" aria-controls="cat-panel-' + k + '" aria-selected="' + (i === 0) + '"' + attr('action', 'fpTab') + attr('v', k) + ' style="--tab-color:var(--cat-' + k.toLowerCase() + ');--tab-tint:var(--cat-' + k.toLowerCase() + '-tint)">' +
          '<span class="cat sm ' + catClass(c.id) + '" aria-hidden="true">' + c.id + '</span><span class="sr-only">Catégorie ' + c.id + '</span></button>';
      }).join('') + FP_INK + '</div><div class="fp-viewport"><div class="fp-track">' +
      CATS_INTRO.map(function (c, i) {
        var k = catClass(c.id).slice(4);
        return '<section class="fp-panel" role="tabpanel" id="cat-panel-' + k + '" data-k="' + k + '" aria-labelledby="cat-tab-' + k + '"' + (i ? ' hidden' : '') + '>' +
          '<div class="fp-panel-head"><h2 class="no-icon">' + esc(c.t) + '</h2><p class="fp-sub">Catégorie ' + c.id + '</p></div>' +
          '<p>' + esc(c.d) + '</p><p><b>Diplôme :</b> ' + esc(c.dip) + '</p>' + catMention(c) + '<p><b>Par exemple :</b> ' + esc(c.ex) + '</p>' + categoryFit(c.id) + '</section>';
      }).join('') + '</div></div>' +
      '<p class="fp-note">' + I.arrow + '<span>Rien n’est figé : on peut changer de catégorie au cours de sa carrière, par concours interne ou par promotion.</span></p>' +
      '</main><div class="footer"><button type="button" class="btn" data-action="startProfile">Démarrer mon profil</button></div>';
  };

  /* Depuis le profil : les deux écrans réunis sur une page, sans bouton d’action, avec un retour vers le profil. */
  screens.comprendre = function () {
    return '<main class="screen top-tight intro-screen category-screen understand-page">' + back('#/moi', 'Profil') +
      '<h1 class="sr-only">Comprendre la fonction publique</h1>' + versantsBlocks('h2', 'h3') + categoriesBlocks('h2', 'h3') + '</main>' + tabbar('moi');
  };

  /* ---------- Écrans : onboarding ---------- */

  screens['choix-profil'] = function () {
    if(familyEstablished())return screens.profil();
    var profiles = [['etu', 'Étudiant·e'], ['par', 'Parent'], ['rec', 'En reconversion']];
    return '<main class="screen profile-choice">' + back('#/categories-intro','Retour') +
      '<h1 class="mt-l">Vous êtes</h1><p class="lead">Le parcours s’adapte à votre profil.</p><div class="stack mt-s">' + profiles.map(function (p) {
        var on = S.profile === p[0];
        return '<button type="button" class="opt' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', 'profile') + attr('v', p[0]) + '><span>' + p[1] + '</span>' + (on ? I.check : '') + '</button>';
      }).join('') + '</div></main>';
  };
  screens.profil = function () {
    if(!S.profile)return screens['choix-profil']();
    if(isParent()&&!activeChild())return screens.famille();
    return '<form id="identity-form" class="profile-form"><main class="screen identity-screen"><div class="topbar">' + back(S.done?'#/moi':familyEstablished()?'#/accueil':'#/choix-profil','Retour') + '<span class="sr-only">Étape 1 / '+STEPS+'</span></div>'+progress(1,STEPS)+
      '<h1 class="mt-l" id="identity-title">'+(isParent()?'Le prénom de votre enfant':'Votre prénom')+'</h1>'+
      '<div class="name-entry"><input class="name-line" id="person-name" name="first-name" aria-labelledby="identity-title" aria-describedby="name-hint" required maxlength="50" enterkeyhint="done" autocomplete="'+(isParent()?'off':'given-name')+'" placeholder="Prénom ou pseudo" value="'+esc(S.name)+'"><button type="button" class="name-confirm" id="name-confirm" data-action="confirmName" aria-label="Valider le prénom"'+(S.name.trim()?'':' disabled')+'>'+I.check+'</button></div>'+
      '<p class="small m0" id="name-hint">'+(isParent()?'Le prénom ou pseudo qui identifiera son parcours.':'Le prénom ou pseudo affiché dans votre espace.')+'</p>'+
      '<p class="notice mt-m">'+I.lock+'<span>Vos réponses restent sur cet appareil. Rien n’est envoyé, aucun compte, aucun traceur. <a href="#/confidentialite">Données personnelles</a></span></p>'+
      '</main><div class="footer"><span class="small center" id="hint-continue"'+(nameReady()?' hidden':'')+'>Renseignez un prénom pour continuer.</span><button type="submit" class="btn" id="identity-continue"'+(nameReady()?'':' disabled')+'>'+profileSubmitLabel('Continuer')+'</button></div></form>';
  };

  /* Reconversion : deux questions qui ouvrent le concours interne et le 3e concours. */
  var RECO_QUESTIONS = [['agentPublic', 'Travaillez-vous déjà dans la fonction publique ?', 'Fonctionnaire ou contractuel : le concours interne vous est ouvert.'],
    ['experience', 'Avez-vous une expérience professionnelle, associative ou d’élu ?', 'Le 3e concours s’ouvre sans diplôme, avec quelques années d’expérience.']];
  function reconversionQuestions() {
    return RECO_QUESTIONS.map(function (q) {
      return '<section class="stack mt-m"><h2 class="h3 no-icon">' + esc(q[1]) + '</h2><p class="small m0">' + esc(q[2]) + '</p><div class="grid-2">' + ['Oui', 'Non'].map(function (v) {
        var on = S[q[0]] === v;
        return '<button type="button" class="opt sm center' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', q[0]) + attr('v', v) + '>' + v + '</button>';
      }).join('') + '</div></section>';
    }).join('');
  }
  screens.niveau = function () {
    if(!nameReady())return screens.profil();
    var list=S.profile==='rec'?D.levels.adult:D.levels.school;
    var title=isParent()?'Son niveau d’études':'Votre niveau d’études';
    return '<form id="study-form" class="profile-form"><main class="screen"><div class="topbar">'+back('#/profil','Retour')+'<span class="sr-only">Étape 2 / '+STEPS+'</span></div>'+progress(2,STEPS)+
      '<h1 class="mt-l">'+title+'</h1><p class="lead">'+(isParent()?'Choisissez son niveau actuel ou le dernier diplôme obtenu.':'Choisissez votre niveau actuel ou le dernier diplôme obtenu.')+'</p>'+
      '<div class="row mt-m" role="group" aria-label="'+title+'">'+list.map(function(l){return chip('level',l,l,S.level===l);}).join('')+'</div>'+(S.profile==='rec'?reconversionQuestions():'')+'</main>'+
      '<div class="footer"><span class="small center"'+(S.level?' hidden':'')+'>Choisissez un niveau pour continuer.</span><button type="submit" class="btn"'+(S.level?'':' disabled')+'>'+profileSubmitLabel('Continuer')+'</button></div></form>';
  };

  screens.interets = function () {
    var n = S.domains.length;
    return '<main class="screen">' +
      '<div class="topbar">' + back('#/niveau', 'Retour') + '<span class="sr-only">Étape 3 / ' + STEPS + '</span></div>' +
      progress(3, STEPS) +
      '<h1 class="mt-l">' + (isParent() ? 'Ce qui attire votre enfant' : 'Ce qui vous attire') + '</h1>' +
      '<p class="lead">Choisissez au moins un domaine pour continuer.</p>' +
      '<div class="grid-2 interest-grid mt-s">' + D.domains.map(function (d) {
        var on = S.domains.indexOf(d) > -1;
        return '<button type="button" class="interest-option' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', 'domain') + attr('v', d) + '><span class="interest-name">' + esc(domainLabel(d)) + '</span><span class="interest-check" aria-hidden="true">' + (on ? I.check : '') + '</span></button>';
      }).join('') + '</div></main>' +
      '<div class="footer">'+profileContinuation('#/ambition','Continuer',n>0)+'</div>';
  };

  /* Étape « Votre ambition » : deux choix au plus, ou « Je ne sais pas encore ». */
  screens.ambition = function () {
    return '<main class="screen">' +
      '<div class="topbar">' + back('#/interets', 'Retour') + '<span class="sr-only">Étape 4 / ' + STEPS + '</span></div>' +
      progress(4, STEPS) +
      '<h1 class="mt-l">' + (isParent() ? 'Son ambition' : 'Votre ambition') + '</h1>' +
      '<p class="lead">' + (isParent() ? 'Quel défi votre enfant est-il prêt à relever pour accéder à son métier ?' : 'Quel défi êtes-vous prêt·e à relever pour accéder à votre métier ?') + ' Trois choix au plus : vos réponses trient les catégories de concours proposées.</p>' +
      defiOptions() +
      '</main><div class="footer">' + profileContinuation('#/traits', 'Continuer', S.defis.length > 0) + (S.defis.length ? '' : skipStep('#/traits')) + '</div>';
  };
  function defiOptions() {
    return '<div class="stack mt-s ambition-options">' + DEFIS.map(function (d) {
      var on = S.defis.indexOf(d[0]) > -1;
      /* Sous le titre : les pastilles des catégories retenues (ou le pictogramme des contractuels). */
      var sub = d[2] ? (d[2][0] === 'CDD' ? '<span class="defi-cats"><span class="cat sm cat-CDD" aria-hidden="true">' + I.contract + '</span><span>Ajoute les emplois contractuels</span></span>'
        : '<span class="defi-cats" aria-label="Concours de catégorie ' + esc(d[2].join(', ')) + '"><span class="defi-label" aria-hidden="true">Concours</span>' + d[2].map(function (c) { return '<span class="cat sm ' + catClass(c) + '" aria-hidden="true">' + c + '</span>'; }).join('') + '</span>') : '';
      return '<button type="button" class="opt ambition-opt' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', 'defi') + attr('v', d[0]) + '><span class="ambition-copy"><span class="ambition-t">' + esc(d[1]) + '</span>' + sub + '</span>' + (on ? I.check : '') + '</button>';
    }).join('') + '</div>';
  }
  function ambitionOptions() {
    return '<div class="stack mt-s ambition-options">' + AMBITIONS.map(function (a) {
      var on = S.ambitions.indexOf(a[0]) > -1;
      return '<button type="button" class="opt ambition-opt' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', 'ambition') + attr('v', a[0]) + '><span class="ambition-copy"><span class="ambition-t">' + esc(a[1]) + '</span>' + (a[2] ? '<span class="ambition-d">' + esc(a[2]) + '</span>' : '') + '</span>' + (on ? I.check : '') + '</button>';
    }).join('') + '</div>';
  }
  screens.traits = function () {
    var n = S.traits.length;
    return '<main class="screen">' +
      '<div class="topbar">' + back('#/ambition', 'Retour') + '<span class="sr-only">Étape 5 / ' + STEPS + '</span></div>' +
      progress(5, STEPS) +
      '<h1 class="mt-l">' + (isParent() ? 'Ce qui lui ressemble' : 'Ce qui vous ressemble') + '</h1>' +
      '<p class="lead">Choisissez sans limite : il n’y a pas de mauvaise réponse.</p>' +
      D.traitGroups.map(function (g) {
        var title = isParent() ? g.title.replace('vous plaît', 'lui plaît').replace('Votre caractère', 'Son caractère') : g.title;
        return '<section class="stack mt-s" aria-label="' + esc(title) + '"><h2 class="h3">' + esc(title) + '</h2><div class="row">' +
          g.items.map(function (t) { return chip('trait', t[0], t[1], S.traits.indexOf(t[0]) > -1); }).join('') + '</div></section>';
      }).join('') +
      '</main><div class="footer">' +
      profileContinuation('#/situation','Continuer',n>0)+(n?'':skipStep('#/situation'))+'</div>';
  };

  screens.situation = function () {
    var q = isParent() ? 'Votre enfant est-il boursier·e ?' : 'Êtes-vous boursier·e ?';
    var budgets = budgetOptions(S.boursier);
    return '<main class="screen">' +
      '<div class="topbar">' + back('#/traits', 'Retour') + '<span class="sr-only">Étape 6 / ' + STEPS + '</span></div>' +
      progress(6, STEPS) +
      '<h1 class="mt-l">' + (isParent() ? 'Sa situation' : 'Votre situation') + '</h1>' +
      '<h2 class="h3 mt-s">' + q + '</h2>' +
      '<div class="grid-2">' + ['Oui', 'Non'].map(function (v) {
        var on = S.boursier === v;
        return '<button type="button" class="opt sm center' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', 'boursier') + attr('v', v) + '>' + v + '</button>';
      }).join('') + '</div>' +
      /* Les choix de budget dépendent de la réponse boursier·e : ils n’apparaissent qu’une fois celle-ci donnée. */
      (S.boursier ? '<h2 class="h3 mt-m">Budget pour se préparer</h2>' +
      '<div class="stack">' + budgets.map(function (b) {
        var on = S.budget === b;
        return '<button type="button" class="opt sm' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', 'budget') + attr('v', b) + '><span>' + b + '</span>' + (on ? I.check : '') + '</button>';
      }).join('') + '</div>' : '') +
      (S.boursier==='Oui'?talentsFeature('C’est quoi, une Prépa Talents ?',
      '<p>Une préparation <b>gratuite</b> aux concours de catégorie A, A+ et B, dans une université, un IEP (institut d’études politiques, c’est-à-dire un Sciences Po) ou une école du service public. Plus de 100 en France, outre-mer compris.</p>' +
      '<p>Au programme : cours, entraînements aux épreuves et un·e tuteur·rice qui vous suit toute l’année.</p>','h2',talentIntroAnimate?'talents-enter':''):'') +
      '</main><div class="footer">'+(profileNeedsValidation()?profileContinuation('#/accueil',''):(S.boursier&&S.budget?'<a class="btn" href="#/accueil" data-action="finish">':'<span class="small center">Répondez aux deux questions pour continuer.</span><button type="button" class="btn" disabled>')+'Voir '+(isParent()?'son parcours':'mon parcours')+(S.boursier&&S.budget?'</a>':'</button>'))+'</div>';
  };

  /* ---------- Tableau de bord ---------- */
  /* Le chiffre reste dans sa case : la taille diminue avec le nombre de chiffres. */
  function countSize(n) { var d=String(n).length; return d>=4?' digits-4':d===3?' digits-3':''; }
  /* Prénom de l’accueil : il s’anime une seule fois, à l’arrivée sur l’espace personnel. */
  function homeName(name) { return '<span class="home-name' + (nameAnimate ? ' home-name-enter' : '') + '">' + esc(name) + '</span>'; }
  function personalHome() {
    var jobs = myJobs(), concours = myConcours();
    return '<main class="screen pt personal-home">' +
      '<h1>' + (isParent() ? homeName(childName()) : (S.name ? 'Bonjour ' + homeName(S.name) : 'Votre avenir, à votre rythme')) + '</h1>' +
      (S.level || S.domains.length ? '<div class="home-profile-meta" role="group" aria-label="Niveau d’études et centres d’intérêt" tabindex="0">' +
      (S.level ? '<span class="study-level">' + I.graduation + '<span>' + esc(S.level) + '</span></span>' : '') +
      S.domains.map(function(d){return '<span class="home-interest">' + esc(domainLabel(d)) + '</span>';}).join('') + '</div>' : '') +
      '<p class="lead">Découvrez les métiers de la fonction publique et les concours qui ' + (isParent() ? 'lui' : 'vous') + ' correspondent.</p>' +
      (isParent() ? '<a class="link-plain" href="#/accueil">Tous les parcours de la famille</a>' : '') +
      '<div class="home-features mt-s"><a class="home-feature home-discover" href="#/metiers" data-action="discoverJobs"><span class="home-tile home-count' + countSize(jobs.length) + '">' + jobs.length + '</span><span class="home-feature-copy"><b>' + (isParent() ? 'Ses métiers à découvrir' : 'Vos métiers à découvrir') + '</b><span>sélectionnés pour ' + (isParent() ? 'votre enfant' : 'vous') + '.</span></span><span class="home-go">' + I.arrow + '</span></a>' +
      '<a class="home-feature home-concours" href="#/concours-liste" data-action="discoverConcours"><span class="home-tile home-count' + countSize(concours.length) + '">' + concours.length + '</span><span class="home-feature-copy"><b>' + (isParent() ? 'Ses concours' : 'Vos concours') + '</b><span>sélectionnés pour ' + (isParent() ? 'votre enfant' : 'vous') + '.</span></span><span class="home-go">' + I.arrow + '</span></a>' +
      '<a class="home-feature home-access" href="#/concours"><span class="home-tile home-tile-parcours">' + I.journey + '</span><span class="home-feature-copy"><b>Informations générales</b><span>Les concours, les fonctions publiques et les prépas</span></span><span class="home-go">' + I.arrow + '</span></a></div>' +
      '<div class="grid-2 home-shortcuts"><a href="#/favoris"><span class="home-tile home-count' + countSize(S.favorites.length) + '">' + S.favorites.length + '</span><span><b>' + (isParent() ? 'Ses favoris' : 'Vos favoris') + '</b></span></a><a href="#/interets"><span class="home-tile">' + I.pencil + '</span><span><b>' + (isParent() ? 'Son projet' : 'Votre projet') + '</b></span></a></div>' +
      '</main>' + tabbar('accueil');
  }
  screens.accueil = function () { return isParent() ? screens.famille() : personalHome(); };
  screens.enfant = function () { return personalHome(); };
  screens.famille = function () {
    var completed = S.children.filter(function (c) { return c.done; }).length;
    /* Même charte que le tableau de bord : une carte par enfant, raccourcis en tuiles. */
    return '<main class="screen pt personal-home family-home"><h1>Mon espace famille</h1>' +
      '<p class="lead">Accompagnez chaque enfant à son rythme, dans un seul espace.</p>' +
      (S.children.length ? '' : '<p class="body">Aucun profil enfant pour le moment. Ajoutez un profil pour commencer.</p>') +
      '<div class="home-features mt-s">' + S.children.map(function (c) {
        var name = c.name || 'Votre enfant';
        return '<button type="button" class="home-feature home-discover family-child" data-action="openChild"' + attr('v', c.id) + '><span class="home-tile home-count">' + esc(name.trim().charAt(0).toUpperCase() || '?') + '</span><span class="home-feature-copy"><b>' + esc(name) + '</b><span>' + esc(c.level || 'Niveau à renseigner') + ' · ' + (c.done ? 'Profil complété' : 'À compléter') + '</span></span><span class="home-go">' + I.arrow + '</span></button>';
      }).join('') + '</div>' +
      '<div class="grid-2 home-shortcuts"><a href="#/moi"><span class="home-tile home-count' + countSize(completed) + '">' + completed + '</span><span><b>Complété' + (completed > 1 ? 's' : '') + '</b> <span>sur ' + S.children.length + ' profil' + (S.children.length > 1 ? 's' : '') + '</span></span></a>' +
      '<a href="#/profil" data-action="addChild"><span class="home-tile">' + I.plus + '</span><span><b>Ajouter</b> <span>un enfant</span></span></a></div>' +
      (S.children.length?'':'<button type="button" class="btn danger" data-action="wipe">Effacer mes données</button>')+
      '<p class="small">Chaque enfant conserve ses choix, son lieu de vie et ses favoris. Les informations restent sur cet appareil.</p></main>' + tabbar('accueil');
  };
  function childSelector() {
    if (!isParent()||!S.children.length) return '';
    return '<div class="row scroller" role="group" aria-label="Choisir un enfant">' + S.children.map(function (c) {
      return chip('selectChild', c.id, c.name || 'Votre enfant', c.id === S.activeChild, 'blue');
    }).join('') + '</div>';
  }
  /* Un concours se met en favori sous la forme « concours:<clé> », à côté des identifiants de métiers. */
  function favItem(id) {
    if (String(id).indexOf('concours:') === 0) { var c = concoursByKey(id.slice(9)); return c ? { id: id, name: c.name, row: concoursRow(c) } : null; }
    var j = jobById(id); return j ? { id: id, name: j.name, row: jobRow(j) } : null;
  }
  screens.favoris = function () {
    var list = S.favorites.map(favItem).filter(Boolean);
    return '<main class="screen pt"><h1>' + (isParent() ? 'Ses favoris' : 'Vos favoris') + '</h1>' + childSelector() +
      (isParent() ? '<p class="small">La sélection de ' + esc(childName()) + '</p>' : '') +
      (list.length ? '<p class="small">Faites glisser une carte vers la gauche pour la retirer.</p>' : '') +
      '<div class="list job-cards fav-list">' + (list.length ? list.map(function (f) { return '<div class="swipe-item"><button type="button" class="swipe-delete" data-action="askUnfavorite"' + attr('v', f.id) + ' aria-label="Retirer ' + esc(f.name) + ' des favoris">' + I.trash + '<span>Retirer</span></button>' + f.row + '</div>'; }).join('') : '<p class="empty">Aucun métier enregistré. Ouvrez une fiche métier puis choisissez « Ajouter aux favoris ».</p>') + '</div><a class="btn outline" href="#/metiers">Explorer les métiers</a></main>' + tabbar('favoris');
  };

  /* ---------- Métiers ---------- */
  /* « Administrateur·rice de l’État » se trouve aussi en tapant « administrateur de l'etat » ou « administratrice ». */
  function searchNorm(s) { return norm(s).replace(/[·•.](?=[a-z])/g,'·').replace(/·[a-z]+(·[a-z]+)?/g,'').replace(/[^a-z0-9+]+/g,' ').trim(); }
  function searchWords(q) { return searchNorm(q||'').split(' ').filter(function(w){return w.length>1&&['de','du','des','la','le','les','et','en','d','l'].indexOf(w)===-1;}); }
  function searchText(j) { if(!j._search){var raw=j.name+' '+(j.sourceName||'')+' '+j.domain+' '+(j.rmfpDomain||'')+' '+(j.family||'')+' '+(j.aliases||[]).join(' ')+' '+(j.interests||[]).map(domainLabel).join(' ');j._search=' '+searchNorm(raw)+' '+feminineForms(raw)+' ';} return j._search; }
  /* Formes féminines reconstituées : administratrice, conseillère, administrative, contrôleuse, technicienne. */
  function feminineForms(raw) {
    return norm(raw).replace(/([a-z]+)·([a-z]+)(?:·[a-z]+)?/g,function(m,w,suf){
      if(suf==='rice')return w.replace(/eur$/,'rice');
      if(suf==='ere')return w.replace(/er$/,'ere');
      if(suf==='ve')return w.replace(/f$/,'ve');
      if(suf==='se')return w.replace(/r$/,'se');
      return w+suf;
    }).replace(/[^a-z0-9+]+/g,' ');
  }
  function matchesWords(text, words) { return words.every(function(w){return text.indexOf(w)>-1;}); }
  function filteredJobs() {
    var words = searchWords(S.q);
    /* Une recherche porte sur tous les métiers : les domaines présélectionnés ne masquent aucun résultat. */
    var doms = words.length ? [] : activeDomains(), cats = selCats(), fps = selFps();
    var list = D.jobs.filter(function (j) {
      if (!passesCats(j, cats)) return false;
      if (doms.length && !matchesDomains(j,doms)) return false;
      if (!j.fp.split('').some(function (f) { return fps.indexOf(f) > -1; })) return false;
      if (words.length && !matchesWords(searchText(j), words)) return false;
      return true;
    });
    list = list.slice().sort(function (a, b) {
      return score(b) - score(a) || (isOpen(a) ? 0 : 1) - (isOpen(b) ? 0 : 1) || a.lvl - b.lvl;
    });
    /* Une recherche garde l’ordre de pertinence : le métier cherché reste en tête, même contractuel. */
    return words.length ? list : contractsLater(list);
  }
  /* Explorer « Pour vous » : d’abord les métiers qui collent à tous les critères, puis tous les autres, des plus proches aux plus éloignés. */
  function explorerSplit() { return !searchWords(S.q).length && S.metMode !== 'all' && (activeDomains().length > 0 || wantedAmbitions().length > 0); }
  function splitJobs() {
    var doms = activeDomains(), cats = selCats(), fps = selFps();
    var base = D.jobs.filter(function (j) { return passesCats(j, cats) && j.fp.split('').some(function (f) { return fps.indexOf(f) > -1; }); });
    var perfect = base.filter(function (j) { return isPerfectJob(j, doms); }), others = base.filter(function (j) { return perfect.indexOf(j) < 0; });
    perfect = contractsLater(perfect.sort(function (a, b) { return score(b) - score(a) || (isOpen(a) ? 0 : 1) - (isOpen(b) ? 0 : 1); }));
    others = contractsLater(others.sort(function (a, b) { return partialScore(b, doms) - partialScore(a, doms) || score(b) - score(a); }));
    return { perfect: perfect, others: others };
  }
  /* Chaque card de métier ou de concours porte une petite flèche : elle s’ouvre. */
  function jobRow(j) {
      var ranked = userRank() !== null;
      var shared = sharedTraits(j);
      var badges = '';
      if (ranked && j.lvl !== null) {
        var compatible=isOpen(j)&&!j.qualification;
        badges += isOpen(j) ? '<span class="fit on">' + (compatible?'<span class="job-fit-check" aria-hidden="true">'+I.check+'</span>':'') + (j.qualification ? 'Diplôme spécifique requis' : 'Niveau d’études compatible<br>Conditions à vérifier') + '</span>' : '<span class="fit">' + esc(NEED[j.lvl] || 'Conditions à vérifier') + '</span>';
      }
      if (shared.length) badges += '<span class="fit like">' + (isParent() ? 'Ce qui lui ressemble' : 'Ce qui vous ressemble') + ' : ' + esc(shared.slice(0, 2).map(traitLabel).join(', ').toLowerCase()) + '</span>';
      var amb = matchedAmbitions(j);
      if (amb.length) badges += '<span class="fit like">' + (isParent() ? 'Son ambition' : 'Votre ambition') + ' : ' + esc(amb.map(function (a) { return AMB_SHORT[a]; }).join(', ')) + '</span>';
      badges += recoFits(isContractJob(j) ? [] : jobRefs(j));
      var rowCats = S.metCats || (defiCats() ? defaultCats() : null), shownCats = rowCats ? jobCategories(j).filter(function (c) { return rowCats.indexOf(c) > -1; }) : [];
      /* La catégorie affichée dans la liste (selon les filtres) est transmise à la fiche, qui s'ouvre sur elle. */
      return '<a class="list-row job-row job-' + catClass(shownCats.length ? shownCats[0] : displayCategory(j)) + '" href="#/metier/' + j.id + '"' + (shownCats.length ? attr('cat', shownCats[0]) : '') + '>' + jobBadges(j, shownCats.length ? rowCats : null) +
        '<div class="main"><span class="name">' + esc(j.name) + '</span><span class="meta">' + esc(j.domain + ' · ' + fpNames(j.fp).join(', ')) + '</span>' +
        (badges ? '<span class="fits">' + badges + '</span>' : '') + '</div>' + '<span class="row-chev" aria-hidden="true">' + I.chev + '</span></a>';
  }
  /* Concours du référentiel : mêmes filtres de catégorie, de versant et de recherche que les métiers. */
  function concoursKey(c) { return c.id.replace('É','E'); }
  function concoursByKey(k) { return D.concours.filter(function(c){return concoursKey(c)===k;})[0]||null; }
  function onConcoursPage() { return route().name === 'concours-liste'; }
  /* Les contractuels n’ont pas de concours : sans catégorie A+ à C cochée, toutes restent affichées. */
  function concoursCats() { var cats = selCats().filter(function (c) { return c !== 'CDD'; }); return cats.length ? cats : ['A+', 'A', 'B', 'C']; }
  function concoursOrder(a, b) { return ['A+','A','B','C'].indexOf(a.cat) - ['A+','A','B','C'].indexOf(b.cat) || a.name.localeCompare(b.name, 'fr'); }
  /* Un concours suit les domaines choisis à travers les métiers auxquels il mène. */
  function filteredConcours() {
    var words = searchWords(S.cq), doms = words.length ? [] : activeDomains(), cats = concoursCats(), fps = selFps();
    return D.concours.filter(function (c) {
      if (cats.indexOf(c.cat) === -1 || fps.indexOf(c.fp) === -1) return false;
      if (doms.length && !concoursJobs(c).some(function (j) { return matchesDomains(j, doms); })) return false;
      if (words.length && !matchesWords(concoursSearchText(c), words)) return false;
      return true;
    }).sort(concoursOrder);
  }
  function isPerfectConcours(c, doms) { return defaultCats().indexOf(c.cat) > -1 && concoursJobs(c).some(function (j) { return jobFitsCriteria(j, doms); }); }
  function myConcours() { return D.concours.filter(function (c) { return isPerfectConcours(c, S.domains); }); }
  function concoursPartial(c, doms) { return concoursJobs(c).reduce(function (m, j) { return Math.max(m, partialScore(j, doms)); }, 0); }
  function explorerSplitConcours() { return !searchWords(S.cq).length && S.metMode !== 'all' && (activeDomains().length > 0 || wantedAmbitions().length > 0); }
  function splitConcours() {
    var doms = activeDomains(), cats = concoursCats(), fps = selFps();
    var base = D.concours.filter(function (c) { return cats.indexOf(c.cat) > -1 && fps.indexOf(c.fp) > -1; });
    var perfect = base.filter(function (c) { return isPerfectConcours(c, doms); }).sort(concoursOrder);
    var others = base.filter(function (c) { return perfect.indexOf(c) < 0; }).sort(function (a, b) { return concoursPartial(b, doms) - concoursPartial(a, doms) || concoursOrder(a, b); });
    return { perfect: perfect, others: others };
  }
  /* Auto-complétion : métiers et concours dont le nom commence par la saisie d’abord, puis ceux qui la contiennent. */
  function concoursSearchText(c) { if (!c._search) { var raw = c.name + ' ' + c.metiers + ' ' + c.domain + ' ' + (c.school || ''); c._search = ' ' + searchNorm(raw) + ' ' + feminineForms(raw) + ' '; } return c._search; }
  function suggestions(q) {
    var words = searchWords(q), nq = searchNorm(q);
    if (!words.length || nq.length < 2) return [];
    function rank(name) { var n = searchNorm(name); return n.indexOf(nq) === 0 ? 0 : (' ' + n).indexOf(' ' + words[0]) > -1 ? 1 : 2; }
    var items = [], concours = onConcoursPage();
    if (!concours) D.jobs.forEach(function (j) { if (matchesWords(searchText(j), words)) items.push({ r: rank(j.name), label: j.name, href: '#/metier/' + j.id, kind: 'Métier', cats: jobCategories(j) }); });
    if (concours) D.concours.forEach(function (c) { if (matchesWords(concoursSearchText(c), words)) items.push({ r: rank(c.name), label: c.name, href: '#/concours-fiche/' + concoursKey(c), kind: 'Concours', cats: [c.cat] }); });
    return items.sort(function (a, b) { return a.r - b.r || a.label.length - b.label.length || a.label.localeCompare(b.label, 'fr'); }).slice(0, 6);
  }
  function suggestHtml(q) {
    return suggestions(q).map(function (it) {
      /* Plusieurs catégories possibles : une pastille par catégorie, jamais « Var. ». */
      return '<li><a class="suggest-item" href="' + it.href + '"><span class="suggest-cats">' + it.cats.map(function (c) { return catBadge(c, 'sm'); }).join('') + '</span><span class="suggest-label">' + esc(it.label) + '</span></a></li>';
    }).join('');
  }
  function updateSuggest(show) {
    var box = document.getElementById('q-suggest'), input = document.getElementById('q');
    if (!box || !input) return;
    var html = show ? suggestHtml(input.value) : '';
    box.innerHTML = html; box.hidden = !html;
    input.setAttribute('aria-expanded', String(!!html));
  }
  /* Ligne de concours, comme une ligne de métier : niveau d’études requis au regard du profil. */
  /* Reconversion : concours interne ou 3e concours ouverts selon les réponses du profil. */
  function recoFits(refs) {
    if (S.profile !== 'rec' || !refs.length) return '';
    var v = refs.map(function (c) { return c.voies || ''; }).join(' '), out = '';
    if (S.experience === 'Oui' && /troisi[eè]me|3e concours/i.test(v)) out += '<span class="fit on">3e concours possible<br>Conditions à vérifier</span>';
    if (S.agentPublic === 'Oui' && /intern/i.test(v)) out += '<span class="fit on">Concours interne possible<br>Conditions à vérifier</span>';
    return out;
  }
  function concoursRow(c) {
    var rank = userRank(), lvl = concoursLevel(c), fit = '';
    if (rank !== null) fit = '<span class="fits">' + (rank >= lvl ? '<span class="fit on"><span class="job-fit-check" aria-hidden="true">' + I.check + '</span>Niveau d’études compatible<br>Conditions à vérifier</span>' : '<span class="fit">' + esc(NEED[lvl] || 'Conditions à vérifier') + '</span>') + '</span>';
    return '<a class="list-row job-row concours-row job-' + catClass(c.cat) + '" href="#/concours-fiche/' + concoursKey(c) + '">' + catBadge(c.cat) + '<div class="main"><span class="name">' + sig(c.name) + '</span><span class="meta">' + esc(D.fps[c.fp] + (c.voies ? ' · ' + c.voies : '')) + '</span>' + fit + '</div><span class="row-chev" aria-hidden="true">' + I.chev + '</span></a>';
  }
  /* Après les correspondances : compteur jaune des autres pistes et bouton pour les afficher. */
  /* À l'ouverture des autres pistes : le compteur remonte sous la barre du haut, la liste démarre juste en dessous. */
  function anchorAlso() {
    /* Les cards hors écran ont une hauteur estimée : on recale après coup tant que le compteur n'est pas en place. */
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function go(smooth) {
      var el = document.querySelector('.also-block'); if (!el) return 0;
      var bar = document.querySelector('.context-bar'), top = bar ? bar.getBoundingClientRect().bottom : 0;
      var off = el.getBoundingClientRect().top - top - 16;
      if (Math.abs(off) > 3) window.scrollTo({ top: Math.max(0, window.scrollY + off), behavior: smooth && !reduce ? 'smooth' : 'auto' });
      return off;
    }
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      go(true);
      [450, 800, 1200].forEach(function (t) { setTimeout(function () { go(false); }, t); });
    }); });
  }
  function alsoBlock(n, one, many, open, action, label) {
    if (!n) return '';
    return '<div class="also-block"><div class="talents-counter also-counter"><span class="home-tile home-count' + countSize(n) + '">' + n + '</span><span class="talents-counter-copy"><b>' + (n > 1 ? many : one) + ' qui ' + (n > 1 ? 'peuvent' : 'peut') + ' aussi ' + (isParent() ? 'l’' : 'vous ') + 'intéresser</b></span></div>' +
      (open ? '' : '<button type="button" class="btn outline mt-s" data-action="' + action + '">' + esc(label) + '</button>') + '</div>';
  }
  function concoursRows() {
    if (explorerSplitConcours()) {
      /* Toutes les correspondances parfaites, puis les autres pistes par paquets de 60. */
      var sp = splitConcours(), np = sp.perfect.length, lim = S.concoursLimit || 60, others = sp.others.slice(0, lim);
      return '<p class="small">' + np + ' concours ' + (isParent() ? 'pour votre enfant' : 'pour vous') + '</p>' +
        (np ? '' : '<p class="empty">Aucun concours ne correspond à tous ' + (isParent() ? 'ses' : 'vos') + ' critères. Voici des pistes proches.</p>') +
        sp.perfect.map(concoursRow).join('') +
        alsoBlock(sp.others.length, 'concours', 'concours', S.showOthersConcours, 'showOthersConcours', 'Explorer d’autres concours') +
        (S.showOthersConcours ? others.map(concoursRow).join('') + (others.length < sp.others.length ? '<button type="button" class="btn outline mt-s" data-action="moreConcours">Afficher 60 concours de plus</button>' : '') : '');
    }
    var list = filteredConcours();
    if (!list.length) return '<p class="empty">Aucun concours avec ces filtres. <button type="button" class="text-btn" data-action="forYou">Revenir à ' + (isParent() ? 'ses' : 'vos') + ' choix</button></p>';
    return '<p class="small">' + list.length + ' concours</p>' + list.map(concoursRow).join('');
  }
  function jobRows() { return onConcoursPage() ? concoursRows() : jobRowsOnly(); }
  function jobRowsOnly() {
    if (explorerSplit()) {
      var sp = splitJobs(), np = sp.perfect.length, others = sp.others.slice(0, S.jobLimit || 60);
      return '<p class="small">' + np + ' métier' + (np > 1 ? 's' : '') + ' ' + (isParent() ? 'pour votre enfant' : 'pour vous') + '</p>' +
        (np ? '' : '<p class="empty">Aucun métier ne correspond à tous ' + (isParent() ? 'ses' : 'vos') + ' critères. Voici des pistes proches.</p>') +
        sp.perfect.map(jobRow).join('') +
        alsoBlock(sp.others.length, 'métier', 'métiers', S.showOthersJobs, 'showOthersJobs', 'Explorer d’autres métiers') +
        (S.showOthersJobs ? others.map(jobRow).join('') + (others.length < sp.others.length ? '<button type="button" class="btn outline mt-s" data-action="moreJobs">Afficher 60 métiers de plus</button>' : '') : '');
    }
    var list = filteredJobs();
    if (!list.length) return '<p class="empty">Aucun métier avec ces filtres. <button type="button" class="text-btn" data-action="forYou">Revenir à ' + (isParent() ? 'ses' : 'vos') + ' choix</button></p>';
    return '<p class="small">' + list.length + ' métier' + (list.length > 1 ? 's' : '') + ' · ' + Math.min(S.jobLimit, list.length) + ' affiché' + (Math.min(S.jobLimit,list.length)>1?'s':'') + '</p>' + list.slice(0, S.jobLimit).map(jobRow).join('') +
      (S.jobLimit < list.length ? '<button type="button" class="btn outline mt-s" data-action="moreJobs">Afficher 60 métiers de plus</button>' : '');
  }

  /* Chaque pastille de filtre ouvre la fenêtre des réglages. */
  function filterSummary() {
    var doms = activeDomains();
    var concours = onConcoursPage(), cats = concours ? concoursCats() : selCats(), fps = selFps();
    var names = cats.map(function (c) { return c === 'CDD' ? 'contractuels' : c; });
    var label = cats.length === (concours ? 4 : ALL_CATS.length) ? 'Toutes catégories' : names.length === 1 ? (cats[0] === 'CDD' ? 'Contractuels' : 'Catégorie ' + cats[0]) : names.slice(0, -1).join(', ') + ' et ' + names[names.length - 1];
    function pill(text, cls) { return '<button type="button" class="tag tag-btn' + (cls || '') + '" data-action="openFilters" aria-haspopup="dialog" aria-label="' + esc(text) + ' : modifier les filtres">' + esc(text) + '</button>'; }
    return pill(doms.length ? doms.length + ' domaine' + (doms.length > 1 ? 's' : '') : 'Tous les domaines') +
      pill(label, cats.length === 1 ? ' fill ' + catClass(cats[0]) : '') + pill(fps.length === 3 ? '3 versants' : fps.map(function (f) { return D.fps[f]; }).join(', '));
  }
  function resultsLabel() {
    if (onConcoursPage() && explorerSplitConcours()) { var pc = splitConcours().perfect.length; return pc ? pc + ' concours pour ' + (isParent() ? 'votre enfant' : 'vous') : 'les résultats'; }
    if (!onConcoursPage() && explorerSplit()) { var pj = splitJobs().perfect.length; return pj ? pj + ' métier' + (pj > 1 ? 's' : '') + ' pour ' + (isParent() ? 'votre enfant' : 'vous') : 'les résultats'; }
    if (onConcoursPage()) { var c = filteredConcours().length; return c ? c + ' concours' : 'les résultats'; }
    var n = filteredJobs().length;
    return n ? n + ' métier' + (n > 1 ? 's' : '') : 'les résultats';
  }
  function jobFilters() {
    var doms = activeDomains();
    var order = S.domains.concat(D.domains.filter(function (d) {return S.domains.indexOf(d) === -1;}));
    return '<section class="stack"><h3>Votre sélection</h3><div class="row">' +
      chip('forYou', '', isParent() ? 'Pour votre enfant' : 'Pour vous', S.metMode === 'mine') + chip('allDomains', '', 'Tous les domaines', S.metMode === 'all') + '</div></section>' +
      '<section class="stack mt-m"><h3>Catégories</h3><p class="small m0">Choisissez une ou plusieurs catégories.</p><div class="row" role="group" aria-label="Catégories">' + (onConcoursPage() ? ['A+', 'A', 'B', 'C'] : ALL_CATS).map(function(c){return chip('metCat',c,c,selCats().indexOf(c)>-1);}).join('') + '</div></section>' +
      '<section class="stack mt-m"><h3>Versants</h3><div class="row" role="group" aria-label="Versants">' + ALL_FPS.map(function(f){return chip('metFp',f,D.fps[f],selFps().indexOf(f)>-1);}).join('') + '</div></section>' +
      '<section class="stack mt-m"><h3>Domaines</h3><div class="row" role="group" aria-label="Domaines">' + order.map(function(d){return chip('metDomain',d,domainLabel(d),doms.indexOf(d)>-1);}).join('') + '</div></section>' +
      '<div class="sheet-actions"><button type="button" class="btn" data-ui="close">Afficher ' + resultsLabel() + '</button></div>';
  }
  screens.metiers = function () {
    S.explore = 'metiers';
    return '<main class="screen pt">' +
      '<div class="title-row"><h1>Explorer</h1><button id="filters-open" type="button" class="icon-btn' + (showFilterNotice ? ' pulse' : '') + '" data-action="openFilters" aria-label="Régler les filtres métiers">' + I.settings + '</button></div>' + childSelector() + exploreSwitch('metiers') +
      (showFilterNotice ? '<div class="top-notice" role="status"><span>Filtrez les métiers par catégorie<span aria-hidden="true"> →</span><span class="sr-only"> avec le bouton des réglages</span></span></div>' : '') +
      '<div class="row filter-summary" aria-label="Filtres actifs">' + filterSummary() + '</div>' +
      '<div class="search-wrap">' + searchField('q','Rechercher un métier','Rechercher un métier',S.q) +
      '<ul class="suggest" id="q-suggest" aria-label="Suggestions" hidden></ul></div>' +
      '<div class="list" id="jobs">' + jobRowsOnly() + '</div></main>' + tabbar('metiers');
  };
  /* Page Concours : même présentation et mêmes filtres que la page Métiers. */
  screens['concours-liste'] = function () {
    S.explore = 'concours';
    return '<main class="screen pt">' +
      '<div class="title-row"><h1>Explorer</h1><button id="filters-open" type="button" class="icon-btn" data-action="openFilters" aria-label="Régler les filtres concours">' + I.settings + '</button></div>' + childSelector() + exploreSwitch('concours') +
      '<div class="row filter-summary" aria-label="Filtres actifs">' + filterSummary() + '</div>' +
      '<div class="search-wrap">' + searchField('q','Rechercher un concours','Rechercher un concours',S.cq) +
      '<ul class="suggest" id="q-suggest" aria-label="Suggestions" hidden></ul></div>' +
      '<div class="list" id="jobs">' + concoursRows() + '</div></main>' + tabbar('concours-liste');
  };
  function jobDetails(id) {
    var j=D.jobs.find(function(x){return x.id===id;}); if(!j)return '';
    /* Description : une ligne de la source par paragraphe, avec un espace entre chacune. */
    return '<div class="source-desc">' + String(j.desc || '').split(/\r?\n+/).map(function (line) { return line.trim() ? '<p class="body">' + esc(line.trim()) + '</p>' : ''; }).join('') + '</div><dl class="profile"><dt>Diplôme</dt><dd>' + esc(j.lvl===null?'Selon le corps et le poste':DIP[j.lvl]) + '</dd><dt>Accès</dt><dd>' + esc(j.access) + '</dd>' +
      (j.qualification ? '<dt>Diplôme spécifique</dt><dd>' + esc(j.qualification) + '</dd>' : '') +
      (j.rmfpCode ? '<dt>Domaine et famille</dt><dd>' + esc(j.rmfpDomain + ' · ' + j.family) + '</dd>' + (j.categories.length ? (j.categorySource ? '<dt>Catégories indicatives</dt><dd>' + esc(j.categories.join(', ')) + ' · renseignées par l’équipe Y-Seck, à vérifier selon le corps ou le cadre d’emplois.</dd>' : '<dt>Catégories observées</dt><dd>' + esc(j.categories.join(', ')) + ' · selon les offres CSP, à vérifier pour chaque poste.' + (extraJobCategories(j).length ? ' Par concours : ' + esc(jobCategories(j).join(', ')) + ' ; ' + esc(extraJobCategories(j).join(', ')) + ' sur offre d’emploi.' : '') + '</dd>') : '') : '') + '</dl>' +
      ['activities','conditions','knowledge','skills','qualities'].map(function(key){return j[key]?'<details class="source-detail"><summary><span>' + ({activities:'Les activités',conditions:'Conditions d’exercice et d’accès',knowledge:'Les connaissances',skills:'Les savoir-faire',qualities:'Les savoir-être'})[key] + '</span><span class="details-toggle" aria-hidden="true">'+I.down+'</span></summary><div class="source-paragraphs">' + j[key].split(/\r?\n+/).map(function(line){return line.trim();}).filter(Boolean).map(function(line){return '<p>'+esc(line)+'</p>';}).join('') + '</div></details>':'';}).join('') +
      (!j.rmfpCode && j.source ? ext(j.source,'Source des conditions d’accès','link-plain mt-s') : '');
  }
  /* ---------- Parcours conseillé : frise façon plan de métro ---------- */
  /* Filières indicatives par domaine : spécialités au lycée, diplômes Bac+2, Bac+3 et Bac+5, voie professionnelle. */
  var STUDY = {
    Administration: { lycee:'Bac général (SES, HGGSP) ou STMG', sup2:'BTS ou BUT (gestion, carrières juridiques)', lic:'Licence de droit, AES, économie ou science politique', master:'Master d’administration publique, IEP ou IPAG', pro:'CAP ou bac pro AGORA (gestion administrative)' },
    Finances: { lycee:'Bac général (maths, SES) ou STMG', sup2:'BTS ou BUT (gestion, GEA)', lic:'Licence d’économie, de gestion ou de droit', master:'Master finances publiques, IEP ou IPAG', pro:'Bac pro AGORA' },
    Justice: { lycee:'Bac général (HGGSP, SES, HLP)', sup2:'BUT carrières juridiques ou BTS', lic:'Licence de droit', master:'Master de droit, puis préparation en IEJ', pro:'CAP ou bac pro (accueil, sécurité)' },
    Sécurité: { lycee:'Bac général, technologique ou professionnel', sup2:'BTS ou BUT', lic:'Licence de droit ou de sciences criminelles', master:'Master de droit ou de sécurité, ou IEP', pro:'CAP ou bac pro métiers de la sécurité' },
    Défense: { lycee:'Bac général, technologique ou professionnel', sup2:'BTS ou BUT', lic:'Licence (droit, sciences, langues)', master:'Master ou école d’ingénieur·es', pro:'CAP ou bac pro' },
    Santé: { lycee:'Bac général (SVT, physique-chimie) ou ST2S', sup2:'Diplôme d’État paramédical (aide-soignant·e, auxiliaire de puériculture)', lic:'Diplôme d’État en 3 ans (IFSI ou école paramédicale)', master:'Master de santé publique ou études de santé', pro:'CAP AEPE ou bac pro ASSP' },
    Social: { lycee:'Bac général ou ST2S', sup2:'BTS ou diplôme d’État de moniteur·rice-éducateur·rice', lic:'Diplôme d’État du travail social en 3 ans', master:'Master d’intervention sociale ou CAFDES', pro:'CAP AEPE ou bac pro ASSP' },
    Éducation: { lycee:'Bac général', sup2:'BUT carrières sociales', lic:'Licence dans la discipline enseignée', master:'Master MEEF (INSPÉ)', pro:'CAP AEPE' },
    Environnement: { lycee:'Bac général (SVT, maths), STAV ou STI2D', sup2:'BTS ou BUT (gestion de l’eau, forêt, génie civil)', lic:'Licence ou licence pro en environnement', master:'Master en environnement ou école d’ingénieur·es', pro:'CAP ou bac pro aménagements paysagers' },
    Transports: { lycee:'Bac général (maths, physique) ou STI2D', sup2:'BTS ou BUT (génie civil, logistique)', lic:'Licence pro ou licence de sciences', master:'École d’ingénieur·es ou master', pro:'CAP ou bac pro (conduite, logistique, maintenance)' },
    Numérique: { lycee:'Bac général (NSI, maths) ou STI2D', sup2:'BTS SIO ou BUT informatique', lic:'Licence ou BUT informatique', master:'Master informatique ou école d’ingénieur·es', pro:'Bac pro CIEL' },
    Culture: { lycee:'Bac général (HLP, HGGSP, arts)', sup2:'BTS ou BUT (métiers du livre, information-communication)', lic:'Licence d’histoire, d’histoire de l’art ou de lettres', master:'Master patrimoine, archives ou bibliothèques', pro:'CAP ou bac pro' },
    Recherche: { lycee:'Bac général (spécialités scientifiques ou humanités)', sup2:'BTS ou BUT (analyses de laboratoire, mesures physiques)', lic:'Licence dans la discipline', master:'Master de recherche', pro:'Bac pro laboratoire' },
    Sport: { lycee:'Bac général ou technologique', sup2:'BPJEPS ou BTS', lic:'Licence STAPS', master:'Master STAPS', pro:'CAP ou bac pro' }
  };
  var SCHOOL_CLASSES = ['6e', '5e', '4e', '3e', 'Seconde', 'Première', 'Terminale'];
  function targetLevel(j, cat) {
    if (typeof j.lvl === 'number') return j.lvl;
    var levels = jobRoutes(j).filter(function (r) { return r.cat === cat && typeof r.lvl === 'number'; }).map(function (r) { return r.lvl; });
    if (levels.length) return Math.min.apply(null, levels);
    return { 'A+': 5, A: 4, B: 2, C: 1 }[cat] !== undefined ? { 'A+': 5, A: 4, B: 2, C: 1 }[cat] : 3;
  }
  function buildParcours(j) {
    var cat = themeCategory(j) || 'B', contract = isContractJob(j), L = targetLevel(j, cat);
    var f = STUDY[j.domain] || STUDY.Administration, stops = [];
    function stop(zone, label, detail, rank, extra) { stops.push(Object.assign({ zone: zone, label: label, detail: detail || '', rank: rank }, extra || {})); }
    var steps = (j.steps || []).map(function (s) { return { exam: s.charAt(0) === '*', text: s.replace(/^\*/, '') }; });
    var specific = !j.rmfpCode && steps.length ? steps : null;
    var first = specific && !specific[0].exam ? specific[0].text : '';
    var generic = /^obtenir (le bac|une licence|un master|un doctorat)$/i.test(first);

    stop('Collège', '6e', 'Découvrir les métiers avec le parcours Avenir', null, { key: '6e' });
    stop('Collège', '5e', '', null, { key: '5e' });
    stop('Collège', '4e', '', null, { key: '4e' });
    stop('Collège', '3e', 'Diplôme national du brevet', 1, { key: '3e', links: [{ kind: 'stage', label: 'Stage d’observation de 3e · 1 semaine' }] });
    if (L <= 1) {
      stop('Lycée', 'Lycée professionnel', f.pro, 1, { key: 'pro', links: [{ kind: 'stage', label: 'Périodes de formation en entreprise' }] });
    } else {
      stop('Lycée', 'Seconde', 'Seconde générale et technologique', null, { key: 'Seconde', links: [{ kind: 'stage', label: 'Stage de seconde · 2 semaines en juin' }] });
      stop('Lycée', 'Première', 'Choisir ses spécialités', null, { key: 'Première' });
      stop('Lycée', 'Terminale', f.lycee, 2, { key: 'Terminale' });
    }
    var sup = [];
    if (L === 2 && !contract && cat === 'B') sup.push([f.sup2, 'Conseillé : certains concours B demandent un Bac+2', 3]);
    if (L === 3) sup.push([f.sup2, '2 à 3 ans après le bac', 3]);
    if (L >= 4) sup.push([f.lic, '3 ans après le bac', 4]);
    if (L >= 5) sup.push([f.master, '2 ans après la licence', 5]);
    if (L >= 6) sup.push(['Doctorat', '3 ans de recherche après le master', 6]);
    sup.forEach(function (s) { stop('Études supérieures', s[0], s[1], s[2]); });
    if (first && !generic) {
      var last = stops[stops.length - 1];
      if (last.zone === 'Études supérieures') last.detail = first; else stop('Études supérieures', first, '', L);
    }
    var after = specific ? specific.slice(first ? 1 : 0) : [];
    var others = jobCategories(j).filter(function (c) { return c !== cat && ['A+','A','B','C'].indexOf(c) > -1; });
    if (contract) {
      (after.length ? after : [{ text: 'Candidature sur une offre d’emploi' }]).forEach(function (s) { stop('Recrutement', s.text, '', null); });
    } else {
      stop('Concours', 'Préparer le concours', L >= 4 ? 'Prépa Talents, IPAG, CPAG ou préparation à distance' : 'Annales, préparation du CNED ou du CNFPT', null,
        { links: others.length ? [{ kind: 'corresp', label: 'Correspondance : catégorie ' + others.join(', ') }] : [] });
      var exam = after.filter(function (s) { return s.exam; })[0];
      stop('Concours', exam ? exam.text : 'Concours de catégorie ' + cat, fpNames(j.fp).join(', '), null);
      after.filter(function (s) { return !s.exam && after.indexOf(s) > after.indexOf(exam); }).forEach(function (s) { stop('Concours', s.text, '', null); });
    }
    stop(contract ? 'Recrutement' : 'Concours', j.name, contract ? 'Emploi contractuel' : catLabel(cat), null, { terminus: true });

    /* Point de départ selon le niveau : collège entier, lycée, ou études supérieures. */
    var level = S.level, rank = userRank(), cls = SCHOOL_CLASSES.indexOf(level);
    if (cls > -1) {
      if (cls >= 4) stops = stops.filter(function (s) { return s.zone !== 'Collège'; });
      var here = stops.findIndex(function (s) { return s.key === level; });
      if (here < 0) here = stops.findIndex(function (s) { return s.zone === 'Lycée'; });
      stops.forEach(function (s, i) { s.done = i < here; s.here = i === here; });
    } else if (level && level !== 'Sans diplôme' && rank !== null) {
      var keep = ['Brevet', 'CAP / BEP'].indexOf(level) > -1 ? ['Lycée'] : [];
      stops = stops.filter(function (s) { return s.zone !== 'Collège' && (s.zone !== 'Lycée' || keep.length) && !(s.zone === 'Études supérieures' && s.rank !== null && s.rank <= rank); });
      stops.unshift({ zone: keep.length ? 'Lycée' : 'Études supérieures', label: 'Votre niveau : ' + level, detail: rank >= L ? 'Niveau de diplôme suffisant pour ce métier' : '', here: true });
    }
    return { cat: cat, stops: stops };
  }
  /* Évoluer : suite des concours internes et promotions documentés, à partir du concours principal. */
  function careerLadder(j, ref) {
    var c=ref||jobRef(j);if(!c||!c.next||!c.next.length)return null;
    var rungs=[[j.name,ref?ref.cat:themeCategory(j)||c.cat]],seen={};
    while(c&&c.next&&c.next.length&&!seen[c.id]&&rungs.length<7){
      seen[c.id]=true;var p=c.next[0],to=D.concoursById[p.to];
      rungs.push([p.voie.split(/[,;]/)[0]]);rungs.push([p.toName,p.toCat,rungHref(p.toName)||(to?'#/concours-fiche/'+concoursKey(to):'')]);
      c=to;
    }
    return rungs;
  }
  /* Évoluer : une étape mène à la fiche du métier du même nom, sinon à la fiche du concours qui y donne accès. */
  var jobsByName=null;
  function rungHref(name) {
    if(!jobsByName){jobsByName={};D.jobs.forEach(function(x){jobsByName[norm(x.name)]=x.id;});}
    var id=jobsByName[norm(name)];return id?'#/metier/'+id:'';
  }
  /* Une étape par niveau (collège, lycée, après le bac, concours), puis le métier. */
  function parcoursSteps(j, refOverride) {
    var stops=buildParcours(j).stops, groups=[], ref=refOverride||jobRef(j);
    stops.forEach(function(st){var g=groups[groups.length-1];if(st.terminus){groups.push({zone:'Métier',stops:[st],terminus:true});return;}if(!g||g.zone!==st.zone)groups.push(g={zone:st.zone,stops:[]});g.stops.push(st);});
    return groups.map(function(g){
      var st=g.stops, links=[], here=st.some(function(x){return x.here;}), title, text=[];
      st.forEach(function(x){(x.links||[]).forEach(function(l){links.push(l);});});
      var real=st.filter(function(x){return !x.done;});
      if(g.terminus){title=st[0].label;text.push(st[0].detail);}
      else if(g.zone==='Collège'){title='Pour commencer';text.push((real[0]&&real[0].key!=='6e'?'De la '+real[0].label+' à la 3e':'De la 6e à la 3e')+', jusqu’au diplôme national du brevet.');}
      else if(g.zone==='Lycée'){var pro=st.some(function(x){return x.key==='pro';}),bac=st.filter(function(x){return x.key==='Terminale'||x.key==='pro';})[0],mine=st.filter(function(x){return /^Votre niveau/.test(x.label);})[0];
        title=mine?mine.label:pro?'En voie professionnelle':'En voie générale ou technologique';text.push(bac?bac.detail:'');if(!pro&&!mine)text.push('Spécialités choisies en première.');}
      else{var first=st[0];title=first.label;text.push(first.detail&&!/[.!?]$/.test(first.detail)?first.detail+'.':first.detail);st.slice(1).forEach(function(x){text.push((g.zone==='Concours'||g.zone==='Recrutement'?'':'Puis ')+x.label+(x.detail?' : '+x.detail:'')+'.');});}
      var step={zone:g.zone==='Études supérieures'?'Après le bac':g.zone,title:title,text:text.filter(Boolean).join(' '),links:links,here:here,terminus:!!g.terminus};
      if(ref&&g.zone==='Concours')step.also=jobRefs(j).filter(function(c){return c!==ref&&c.cat===ref.cat;});
      return ref?refineStep(step,g,ref):step;
    });
  }
  /* Le référentiel précise collège, lycée, études et concours ; les conseils restent facultatifs. */
  function refineStep(step,g,c) {
    var dot=function(t){return t&&!/[.!?]$/.test(t)?t+'.':t;};
    var mine=g.stops.filter(function(x){return /^Votre niveau/.test(x.label);})[0];
    if(g.zone==='Collège'){step.text=dot('Priorités : '+c.college.replace(/\.$/,''))+(c.collegeOption?' '+dot('Au choix : '+c.collegeOption):'');}
    else if(g.zone==='Lycée'&&!mine){
      var pro=g.stops.some(function(x){return x.key==='pro';});
      step.title=pro?'En voie professionnelle':'Au lycée';
      step.text=pro?dot(c.lyceePro):[c.lyceeGeneral&&dot('Voie générale, spécialités conseillées (jamais obligatoires) : '+c.lyceeGeneral),c.lyceeTechno&&dot('Voie technologique : '+c.lyceeTechno),c.lyceePro&&dot('Voie professionnelle : '+c.lyceePro),c.optionSeconde&&dot('Option en seconde : '+c.optionSeconde)].filter(Boolean).join(' ');
    }
    else if(g.zone==='Études supérieures'&&mine&&c.studies){
      step.text=[dot('Études conseillées : '+c.studies),c.l3&&dot('3e année : '+c.l3)].filter(Boolean).join(' ');
    }
    else if(g.zone==='Études supérieures'&&!mine&&c.studies){
      step.title=c.studies;
      step.text=[c.l1&&dot('1re année : '+c.l1),c.l2&&dot('2e année : '+c.l2),c.l3&&dot('3e année : '+c.l3)].filter(Boolean).join(' ');
    }
    else if(g.zone==='Concours'){
      step.title=c.name;
      step.text=[c.voies&&dot('Voies : '+c.voies),c.condition&&dot('Condition : '+c.condition),c.prepa&&dot('Préparation : '+c.prepa)].filter(Boolean).join(' ');
    }
    return step;
  }
  function parcoursSection(j, refOverride, sharedView) {
    var steps=parcoursSteps(j, refOverride);
    return '<section class="parcours stack mt-m job-section" aria-labelledby="parcours-title"><h2 id="parcours-title" class="section-heading">' + I.studyMap + '<span>Quelles études choisir</span></h2>' + '<p class="parcours-intro">Voici un parcours conseillé, d’autres parcours sont également possibles pour arriver au même métier.</p>' +
      '<div class="parcours-card"><ol class="parcours-line">' + steps.map(function (s, i) {
        var mark=i===0?'start':s.terminus?'end':'mid';
        return '<li class="parcours-step '+mark+(s.here?' here':'')+'"'+(s.here?' aria-current="step"':'')+'><span class="parcours-mark" aria-hidden="true">'+(mark==='start'?'<svg viewBox="0 0 12 13"><path fill-rule="evenodd" d="M6 0a5 5 0 0 1 5 5c0 3.2-3.4 6.5-4.6 7.6a.6.6 0 0 1-.8 0C4.4 11.5 1 8.2 1 5a5 5 0 0 1 5-5zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>':'')+'</span><div class="parcours-txt">' +
          (s.here?'<span class="parcours-here">'+(isParent()?'Ici aujourd’hui':'Vous êtes ici')+'</span>':'')+'<span class="parcours-head"><span class="parcours-zone">'+esc(s.zone)+'</span><b>' + sig(s.title) + '</b></span>' + (s.text ? '<p>' + sig(s.text) + '</p>' : '') +
          (s.links.length ? '<span class="parcours-links">' + s.links.map(function (l) { return '<span class="parcours-link ' + l.kind + '">' + esc(l.label) + '</span>'; }).join('') + '</span>' : '') +
          (s.also && s.also.length ? '<div class="parcours-also"><span>Aussi possible :</span>' + s.also.map(function (c) { return '<a href="#/concours-fiche/' + concoursKey(c) + '">' + sig(c.name) + '</a>'; }).join('') + '</div>' : '') + '</div></li>';
      }).join('') + '</ol><p class="parcours-note">Parcours conseillé ' + (sharedView ? 'du collège au métier' : isParent() ? 'pour ' + esc(childName()) : 'depuis votre niveau') + ', à titre indicatif : les conditions exactes figurent dans l’avis du concours.</p></div></section>';
  }
  /* Blocs communs à la fiche complète et à la fiche partagée. */
  function jobIntro(j, match) {
    return '<div class="row job-meta" role="group" aria-label="Catégorie et centres d’intérêt" tabindex="0"><span class="job-hero-cat">' + jobBadges(j) + '</span>' + (j.cat==='V'?'<span class="tag">Selon le poste</span>':'') +
      (j.interests || [j.domain]).map(function (d) { return '<span class="tag">' + esc(domainLabel(d)) + '</span>'; }).join('') + '</div>' +
      '<h1>' + esc(j.name) + '</h1>' + (match || '') +
      '<p class="body">' + esc(j.desc.length>300?j.desc.slice(0,297).replace(/\s+\S*$/,'')+'…':j.desc) + '</p>';
  }
  function jobConcours(j, dates) {
    if (isContractJob(j)) return '';
    var cats=D.categories.filter(function(c){return jobCategories(j).indexOf(c.id)>-1;}), note=recruitmentNote(j);
    return '<section class="stack mt-m job-section" aria-labelledby="concours-title"><h2 id="concours-title" class="section-heading">' + I.calendar + '<span>Concours et dates</span></h2>' +
      (note && !jobRoutes(j).length ? note : note + (cats.length?'<div class="stack">' + cats.slice().reverse().sort(function(a,b){return ['A+','A','B','C'].indexOf(a.id)-['A+','A','B','C'].indexOf(b.id);}).map(function(c){return preparationCategoryCard(c,j);}).join('') + '</div>':'<p class="body">La catégorie et le corps d’accès à ce métier restent à préciser selon le poste. Consultez les conditions de l’offre de recrutement.</p>')) +
      (dates.length?'<a class="btn btn-bare" href="#/calendrier/'+j.id+'">'+I.calendar+'<span>Toutes les dates des concours ('+dates.length+')</span></a>':'') + '</section>';
  }
  function jobLadder(j, ref, extra) {
    var ladder = careerLadder(j, ref) || j.ladder;
    if (!ladder) {
      if (j.cat === 'C') ladder = [[j.name, 'C'], ['concours interne ou promotion'], ['Poste de catégorie B', 'B']];
      else if (j.cat === 'B') ladder = [[j.name, 'B'], ['concours interne ou promotion'], ['Poste de catégorie A', 'A']];
      else if (j.cat === 'A') ladder = [[j.name, 'A'], ['expérience et concours interne'], ['Encadrement supérieur', 'A+']];
      else if (j.cat === 'A+') ladder = [[j.name, 'A+'], ['expérience'], ['Emplois de direction', 'A+']];
      else if (j.rmfpCode) ladder = [[j.name, 'Métier'], ['formation, expérience et mobilité'], ['Évolution selon le corps et l’employeur', 'Selon le poste']];
      else ladder = [[j.name, 'Contrat'], ['concours interne selon les conditions'], ['Fonctionnaire titulaire', 'A, B ou C']];
    }
    return '<section class="stack mt-m job-section"><h2 class="section-heading">' + I.growth + '<span>Évoluer</span></h2><div class="ladder">' + ladder.map(function (r) {
        if (r.length === 1) return '<div class="via">↓ ' + esc(r[0]) + '</div>';
        var categories=String(r[1]).split(/\s*(?:,|\/|\bou\b)\s*/);
        var known=categories.length&&categories.every(function(c){return ['A+','A','B','C','CDD'].indexOf(c)>-1;});
        var href = r[0] === j.name ? '' : r[2] || rungHref(r[0]), tag = href ? 'a' : 'div';
        return '<' + tag + ' class="rung' + (href ? ' rung-link' : '') + '"' + (href ? ' href="' + href + '"' : '') + '><span>' + esc(r[0]) + '</span>'+(known?'<span class="rung-categories">'+categories.map(function(c){return catBadge(c,'sm');}).join('<span class="sr-only">ou </span>')+'</span>':'<small>'+esc(r[1])+'</small>')+(href ? I.chev : '')+'</' + tag + '>';
      }).join('') + '</div>' + (extra || '') + '</section>';
  }

  /* ---------- Fiche partagée : version courte, lisible sans profil ---------- */
  /* Partage d’un métier (fiche courte lisible sans profil) ou d’un concours (« concours:<clé> »). */
  function shareTarget(id) {
    if (String(id).indexOf('concours:') === 0) {
      var c = concoursByKey(id.slice(9)); if (!c) return null;
      return { name: c.name, url: location.origin + location.pathname + '#/concours-fiche/' + concoursKey(c), message: 'Je pense que ce concours de la fonction publique peut t’intéresser : ' + c.name + '. Dates, épreuves et études, tout est sur la fiche Y-Seck :' };
    }
    var j = jobById(id); if (!j) return null;
    return { name: j.name, url: location.origin + location.pathname + '#/fiche/' + j.id, message: 'Je pense que ce métier de la fonction publique peut t’intéresser : ' + j.name + '. Études, concours et évolution, tout est sur la fiche Y-Seck :' };
  }
  /* Le message accompagne toujours le lien : certaines applications ignorent le champ « url » seul. */
  function shareJob(id, trigger) {
    var t = shareTarget(id); if (!t) return;
    var full = t.message + '\n' + t.url;
    if (navigator.share) { navigator.share({ title: t.name + ' · Y-Seck', text: full }).catch(function () { /* partage annulé */ }); return; }
    UI.open('share', 'Partager', '<p class="body">Le message et le lien s’ouvrent sur n’importe quel smartphone.</p>' +
      '<textarea class="share-url" rows="4" readonly aria-label="Message à envoyer">' + esc(full) + '</textarea>' +
      '<div class="sheet-actions"><button type="button" class="btn" data-action="copyShare"' + attr('v', full) + '>Copier le message</button>' +
      '<a class="btn outline" href="mailto:?subject=' + encodeURIComponent(t.name + ' · Y-Seck') + '&body=' + encodeURIComponent(full) + '">Envoyer par e-mail</a></div>', trigger);
  }
  screens.fiche = function (id) {
    var j = jobById(id);
    if (!j) return screens[S.done ? 'accueil' : 'bienvenue']();
    var exam = !isContractJob(j) && (jobRoutes(j).length || D.categories.some(function (c) { return jobCategories(j).indexOf(c.id) > -1; }));
    return '<main class="screen job-page shared-job">' + jobIntro(j) +
      parcoursSection(j, null, true) + jobConcours(j, isContractJob(j) ? [] : examsFor(j)) + jobLadder(j) +
      /* Qui a déjà un profil sur cet appareil voit aussi la fiche partagée, avec un accès à la fiche complète. */
      (S.done ? '' : '<a class="btn theme mt-m" href="#/bienvenue">' + (exam ? 'Créer un compte pour préparer le concours' : 'Créer un compte pour continuer') + '</a>') +
      '</main><div class="footer share-footer">' + (S.done ? '<a class="btn" href="#/metier/' + j.id + '">Voir la fiche complète</a>' : '<a class="btn" href="#/bienvenue">Créer mon profil</a>') + '</div>';
  };

  /* ---------- Concours : catégories dépliables ---------- */
  /* ---------- Informations générales : trois axes, les concours, les fonctions publiques, les prépas ---------- */
  var INFO_AXES = [
    ['concours', 'Les concours', 'Catégories, voies d’accès, conditions et lieux des épreuves', 'exam'],
    ['fonctions', 'Les fonctions publiques', 'État, territoriale, hospitalière : trois employeurs', 'government'],
    ['prepas', 'Les prépas', 'Études conseillées, aides, prépas gratuites ou à frais d’inscription', 'book']
  ];
  function infoFold(icon, title, sub, body) {
    return '<details class="intro-fold intro-employer-fold"><summary><span class="employer-icon" aria-hidden="true">' + icon + '</span>' +
      '<span class="intro-fold-name"><h3 class="employer-title no-icon">' + esc(title) + '</h3>' + (sub ? '<span class="intro-fold-sub">' + esc(sub) + '</span>' : '') + '</span>' +
      '<span class="details-toggle" aria-hidden="true">' + I.down + '</span></summary><div class="intro-fold-body">' + body + '</div></details>';
  }
  /* Les concours : 1. les catégories (rôle, diplôme, exemples et lieux des épreuves dans un même bloc), 2. les voies d’accès,
     3. les conditions communes, 4. toutes les dates, filtrables par catégorie. */
  /* Dates des concours : un onglet par catégorie, les sessions défilent latéralement comme les écrans d’introduction. */
  function infoDates() {
    var cur = CAL_CATS.indexOf(S.infoTab) > -1 ? S.infoTab : 'A+', all = upcoming().slice().sort(calendarOrder), lim = S.infoLimits || {};
    return '<div class="info-dates"><div class="fp-tabs cat-tabs" role="tablist" aria-label="Dates par catégorie">' + CAL_CATS.map(function (c) {
        var k = catClass(c).slice(4);
        return '<button type="button" class="fp-tab" role="tab" id="date-tab-' + k + '" aria-controls="date-panel-' + k + '" aria-selected="' + (c === cur) + '"' + attr('action', 'fpTab') + attr('v', k) + ' style="--tab-color:var(--cat-' + k.toLowerCase() + ');--tab-tint:var(--cat-' + k.toLowerCase() + '-tint)">' +
          '<span class="cat sm ' + catClass(c) + '" aria-hidden="true">' + c + '</span><span class="sr-only">Catégorie ' + c + '</span></button>';
      }).join('') + FP_INK + '</div><div class="fp-viewport"><div class="fp-track">' + CAL_CATS.map(function (c) {
        var k = catClass(c).slice(4), list = all.filter(function (x) { return calendarCategory(x, null) === c; }), n = lim[c] || 20;
        return '<section class="fp-panel" role="tabpanel" id="date-panel-' + k + '" data-k="' + k + '" aria-labelledby="date-tab-' + k + '"' + (c === cur ? '' : ' hidden') + '>' +
          '<p class="small m0">' + list.length + ' session' + (list.length > 1 ? 's' : '') + ' à venir · catégorie ' + c + '</p>' +
          '<div class="stack calendar-list">' + calendarRows(list, n, null) + '</div>' +
          (list.length > n ? '<button type="button" class="btn outline" data-action="moreInfoDates"' + attr('v', c) + '>Afficher 20 sessions de plus</button>' : '') + '</section>';
      }).join('') + '</div></div></div>';
  }
  function infoConcours() {
    var voies = VOIES.filter(function (v) { return !/titres?/i.test(v[1]); });
    var cats = CATS_INTRO.map(function (c) {
      var dc = D.categories.filter(function (x) { return x.id === c.id; })[0];
      var where = dc && D.exam[c.id] ? '<p class="ex info-where"><b>Où passer les épreuves</b></p>' + ['E', 'T', 'H'].map(function (f) {
        var e = D.exam[c.id][f];
        return '<p class="info-where-fp"><b>' + esc(D.fps[f]) + '</b> · ' + sig(e.org) + '<br>Métropole : ' + esc(e.metro) + '<br>Outre-mer : ' + esc(e.om) + '</p>';
      }).join('') : '';
      return '<details class="intro-fold intro-category-fold ' + c.tint + '"><summary><span class="cat lg ' + catClass(c.id) + '" aria-hidden="true">' + c.id + '</span>' +
        '<span class="intro-fold-name"><h3 class="explain-t no-icon"><span class="sr-only">Catégorie ' + c.id + ' : </span>' + esc(c.t) + '</h3><span class="intro-fold-sub">Catégorie ' + c.id + ' · ' + esc(c.dip) + '</span><span class="intro-fold-desc">' + esc(c.d) + '</span></span>' +
        '<span class="details-toggle" aria-hidden="true">' + I.down + '</span></summary>' +
        '<div class="intro-fold-body">' + catMention(c) + '<p class="ex"><b>Par exemple :</b> ' + esc(c.ex) + '</p>' + where + '</div></details>';
    }).join('');
    return '<h2 class="mt-m understand-title no-icon info-big">4 catégories</h2><p class="lead">Le niveau de responsabilité, le diplôme demandé et où passer les épreuves.</p>' +
      '<div class="stack employer-list">' + cats + '</div>' +
      '<div class="callout tint-blue"><span class="pin"></span><p>Rien n’est figé : on peut changer de catégorie au cours de sa carrière, par concours interne ou par promotion. Les villes exactes figurent dans chaque avis de concours.</p></div>' +
      '<h2 class="mt-m understand-title no-icon">Les voies d’accès</h2><p class="lead">Un même concours s’ouvre souvent par plusieurs voies, selon votre parcours.</p>' +
      '<div class="stack employer-list">' + voies.map(function (v) { return infoFold(I.walk, v[1], '', '<p>' + esc(v[2]) + '</p>'); }).join('') + '</div>' +
      '<h2 class="mt-m understand-title no-icon">Pour toutes et tous</h2><p class="lead">Les conditions communes à tous les concours.</p>' +
      '<div class="checks">' + D.conditions.map(function (k) { return '<div>' + I.check + '<span>' + esc(k) + '</span></div>'; }).join('') + '</div>' +
      '<a class="btn outline mt-s" href="#/handicap">Handicap : accès et aménagements</a>' +
      '<h2 class="mt-l understand-title no-icon info-big" id="info-dates">Dates des concours</h2>' +
      infoDates();
  }
  screens.concours = function () {
    return '<main class="screen top-tight intro-screen category-screen understand-page info-page">' + back('#/accueil', 'Accueil') +
      '<h1 class="mt-m understand-title">Informations générales</h1><p class="lead">Tout ce qu’il faut savoir avant de choisir un métier ou un concours, en trois parties.</p>' +
      '<div class="stack employer-list">' + INFO_AXES.map(function (x, n) {
        return '<a class="intro-fold info-axis" href="#/infos/' + x[0] + '"><span class="employer-icon" aria-hidden="true">' + I[x[3]] + '</span>' +
          '<span class="intro-fold-name"><span class="employer-title">' + esc(x[1]) + '</span><span class="intro-fold-sub">' + esc(x[2]) + '</span></span><span class="row-chev" aria-hidden="true">' + I.chev + '</span></a>';
      }).join('') + '</div></main>' + tabbar('accueil');
  };
  screens.infos = function (axis) {
    var x = INFO_AXES.filter(function (a) { return a[0] === axis; })[0];
    if (!x) return screens.concours();
    /* Fonctions publiques : les trois blocs restent ouverts, sans bouton pour les refermer. */
    var body = axis === 'fonctions' ? versantsBlocks('h2', 'h3').replace('<h2 class="mt-m understand-title no-icon">3 fonctions publiques</h2>', '')
        .replace(/<details class="intro-fold intro-employer-fold"><summary>/g, '<div class="intro-fold intro-employer-fold info-open"><div class="info-open-head">')
        .replace(/<span class="details-toggle" aria-hidden="true">[\s\S]*?<\/span><\/summary>/g, '</div>').replace(/<\/details>/g, '</div>')
      : axis === 'prepas' ? '<p class="lead">Les études qui mènent aux concours, puis les aides et les prépas, gratuites ou au prix d’une inscription à l’université.</p>' +
        '<a class="btn outline" href="#/etudes">Quelles études choisir ?</a>' + preparationContent()
      : infoConcours();
    return '<main class="screen top-tight intro-screen category-screen understand-page info-page">' + back('#/concours', 'Informations générales') +
      '<h1 class="' + (axis === 'concours' ? 'sr-only' : 'mt-m understand-title') + '">' + esc(x[1]) + '</h1>' + body + '</main>' + tabbar('accueil');
  };

  /* ---------- Référentiel des concours ---------- */
  function routeRef(r, f) { var refs=(r&&r.refs)||[]; return refs.filter(function(c){return !f||c.fp===f;})[0]||(f?null:refs[0])||null; }
  /* Concours principal d’un métier : celui de la catégorie la plus élevée, dans un versant du métier. */
  /* Concours d’un métier : par catégorie, puis le versant filtré s’il est seul, sinon État, territoriale, hospitalière. */
  function jobRefs(j) {
    var order=['A+','A','B','C'],fps=selFps(),pref=fps.length===1?fps[0]:null,out=[];
    jobRoutes(j).forEach(function(r){j.fp.split('').forEach(function(f){var c=routeRef(r,f);if(c&&out.indexOf(c)===-1)out.push(c);});});
    function versant(c){return c.fp===pref?-1:['E','T','H'].indexOf(c.fp);}
    return out.sort(function(a,b){return order.indexOf(a.cat)-order.indexOf(b.cat)||versant(a)-versant(b);});
  }
  function jobRef(j) { var cat=themeCategory(j); var refs=jobRefs(j); return refs.filter(function(c){return c.cat===cat;})[0]||refs[0]||null; }
  var SIGLE_RE=null;
  /* Les sigles sont écrits en toutes lettres à leur première apparition : « Institut national du service public (INSP) ». */
  var EXTRA_SIGLES=[['IRA','Institut régional d’administration'],['ENM','École nationale de la magistrature'],['CNG','Centre national de gestion'],['CNFPT','Centre national de la fonction publique territoriale'],
    ['CDG','Centre de gestion'],['ENAP','École nationale d’administration pénitentiaire'],['ENSP','École nationale supérieure de la police'],['ENSV','École nationale des services vétérinaires'],
    ['ITRF','Ingénieurs et personnels techniques de recherche et de formation'],['BAP','Branche d’activité professionnelle'],['RAEP','Reconnaissance des acquis de l’expérience professionnelle'],
    ['QCM','questionnaire à choix multiples'],['QRC','questions à réponse courte'],['CPGE','Classe préparatoire aux grandes écoles'],['DUT','Diplôme universitaire de technologie'],
    ['DEAES','Diplôme d’État d’accompagnant éducatif et social'],['CAP','Certificat d’aptitude professionnelle'],['CRPE','Concours de recrutement de professeurs des écoles'],
    ['CAPES','Certificat d’aptitude au professorat de l’enseignement du second degré'],['INET','Institut national des études territoriales'],['DH','Directeur d’hôpital'],['SCORE','Système de consultation des résultats et des épreuves']];
  function sig(text) {
    if(!SIGLE_RE){
      var known={};D.sigles.forEach(function(x){known[x.id]=1;});
      EXTRA_SIGLES.forEach(function(x){if(!known[x[0]])D.sigles.push({id:x[0],label:x[1]});});
      SIGLE_RE=new RegExp('(^|[^\\wÀ-ÿ])('+D.sigles.map(function(x){return x.id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}).join('|')+')(?![\\wÀ-ÿ])','g');
    }
    var labels={};D.sigles.forEach(function(x){labels[x.id]=x.label;});
    var plain=norm(text),done={};
    return esc(text).replace(SIGLE_RE,function(m,pre,id,at,all){
      var label=labels[id];
      /* Déjà développé dans le texte, ou déjà entre parenthèses après son intitulé : le sigle reste seul. */
      if(done[id]||!label||plain.indexOf(norm(label))>-1||pre==='('){done[id]=1;return m;}
      done[id]=1;
      /* Nom commun (QCM, QRC) : majuscule seulement en début de phrase. */
      var before=all.slice(0,at+pre.length);
      if(/^[a-zà-ÿ]/.test(label)&&/(^|[.!?])$/.test(before.replace(/\s+$/,'')))label=label.charAt(0).toUpperCase()+label.slice(1);
      return pre+esc(label)+' ('+id+')';
    });
  }
  function fpTags(fp) {
    var labels={E:'Fonction publique de l’État',T:'Fonction publique territoriale',H:'Fonction publique hospitalière'},icons={E:I.government,T:I.city,H:I.hospital};
    return '<span class="preparation-fps">'+fp.split('').filter(function(f){return labels[f];}).map(function(f){return '<span class="preparation-fp">'+icons[f]+'<span>'+labels[f]+'</span></span>';}).join('')+'</span>';
  }
  function preparationCategoryCard(c, job, onlyRoutes) {
    var panelId = 'prep-' + job.id + '-' + catClass(c.id);
    var routes=jobRoutes(job).filter(function(r){return r.cat===c.id&&(!onlyRoutes||onlyRoutes.indexOf(r.id)>-1);});
    var fps = job.fp.split('').filter(function(f){return D.fps[f]&&(!routes.length||routes.some(function(r){return r.fp.indexOf(f)>-1;}));});
    if(onlyRoutes&&onlyRoutes.fp)fps=fps.filter(function(f){return f===onlyRoutes.fp;});
    var exams=[];
    fps.forEach(function(f){var m=routes.filter(function(r){return r.fp.indexOf(f)>-1;});if(m.length)m.forEach(function(r){exams.push({r:r,f:f,e:(r.examInfo||{})[f]||{}});});else exams.push({f:f});});
    /* Un seul concours : la fiche est dépliée. Plusieurs : seules les informations de base restent visibles. */
    var count=exams.length;
    var state=expandedPrepCategories[job.id]||{};
    var open = Object.prototype.hasOwnProperty.call(state,c.id) ? state[c.id] : count===1;
    var titles=[];exams.forEach(function(x){if(x.e&&x.e.cardTitle&&titles.indexOf(x.e.cardTitle)===-1)titles.push(x.e.cardTitle);});
    var title=titles.length===1?titles[0]:'Concours de catégorie '+c.id;
    return '<div class="catcard-wrap preparation-card prep-' + catClass(c.id) + (open?' open':'') + '"><button type="button" class="catcard" aria-expanded="' + open + '" aria-controls="' + panelId + '" data-action="openPrepCat"' + attr('v',c.id) + attr('job',job.id) + '>' + catBadge(c.id,'lg') +
      '<span class="txt"><b>'+sig(title)+'</b><span class="sr-only">Catégorie ' + c.id + '</span>'+fpTags(fps.join(''))+preparationLevel(c,job,routes)+(count>1&&!open?'<span class="prep-count">'+count+' concours possibles · toucher pour afficher le détail</span>':'')+'</span>' + (open?'':I.down) + '</button>' +
      (open?'<div class="cat-panel" id="' + panelId + '">' + exams.map(function(x){return examBlock(x,job);}).join('') +
      '<button type="button" class="preparation-collapse" data-action="openPrepCat"'+attr('v',c.id)+attr('job',job.id)+' aria-expanded="true" aria-controls="'+panelId+'" aria-label="Réduire les informations du concours">'+I.down+'</button></div>':'') + '</div>';
  }
  function examRef(c) {
    if(!c)return '';
    return '<div class="exam-ref"><dl>'+(c.voies?'<dt>Voies d’accès</dt><dd>'+sig(c.voies)+'</dd>':'')+(c.condition?'<dt>Conditions de diplôme</dt><dd>'+sig(c.condition)+'</dd>':'')+
      (c.epreuves?'<dt>Épreuves</dt><dd>'+sig(c.epreuves)+'</dd>':'')+'</dl>'+
      (c.sessions.length?'<ul class="exam-sessions">'+c.sessions.map(function(x){return '<li><b>Session '+esc(x.session)+'</b> '+sig(x.text)+'</li>';}).join('')+'</ul>':'')+
      (c.vigilance?'<p class="exam-vigilance">'+I.info+'<span>'+sig(c.vigilance)+'</span></p>':'')+'</div>';
  }
  /* Un concours : bandeau, organisateur, calendrier de la prochaine session, lieux et sources. */
  function examBlock(x, job) {
    if(!x.r)return '<div class="exam" data-fp="'+x.f+'"><p class="exam-missing">Le corps ou cadre d’emplois doit être précisé dans l’offre pour identifier le concours et son organisateur ('+esc(D.fps[x.f])+').</p></div>';
    var r=x.r,e=x.e,f=x.f,name=e.name||r.name;
    var sessions=upcoming().filter(function(c){return c.fp===f&&(c.routeIds||[]).indexOf(r.id)>-1&&(job.routeIds||[]).indexOf(r.id)>-1;}).sort(calendarOrder);
    var next=sessions[0];
    var links=e.officialLinks&&e.officialLinks.length?e.officialLinks:[{url:e.source||r.source,label:'Voir l’avis officiel'}];
    return '<section class="exam exam-route" data-fp="'+f+'"><h4>'+sig((/^concours\b/i.test(name)?'':'Concours : ')+name)+'</h4>' +
      '<dl class="exam-org"><dt>Organisé par :</dt><dd>'+sig(e.org||'Structure à confirmer dans l’avis du concours')+'</dd></dl>' + examRef(routeRef(r,f)) +
      (next?'<div class="exam-cal"><h5>'+I.calendar+'<span>'+(next.provisional?'Calendrier prévisionnel':'Calendrier')+' · '+esc(next.voie)+' :</span></h5><dl class="exam-dates"><dt>Ouverture</dt><dd>'+esc(next.openLabel||next.open||'Non publiée')+'</dd><dt>Clôture</dt><dd>'+esc(next.closeLabel||next.date||'Non publiée')+'</dd><dt>Écrits ou sélection</dt><dd>'+esc(next.writtenLabel||'Non publiés')+'</dd><dt>Oraux</dt><dd>'+esc(next.oralLabel||'Non publiés')+'</dd></dl>' +
        (sessions.length>1?'<a class="link-plain" href="#/calendrier/'+job.id+'">Voir les '+sessions.length+' sessions de ce concours</a>':'')+'</div>'
        :'<div class="exam-cal"><h5>'+I.calendar+'<span>Calendrier :</span></h5><p>Aucune session publiée pour le moment : consulter l’avis officiel.</p></div>') +
      '<div class="exam-places"><h5>'+I.pin+'<span>Lieux des épreuves</span></h5><b>En métropole</b><p>'+esc(e.metro||'Lieux non précisés : consulter l’avis du concours.')+'</p><b>En outre-mer</b><p>'+esc(e.om||'Centre non confirmé : consulter l’avis du concours.')+'</p></div>' +
      '<p class="exam-source">Source : '+esc(next?next.source+' · vérifiée le '+next.checked:(e.checked?'vérifiée le '+e.checked:'site officiel de l’organisateur'))+'</p>' +
      '<div class="official-exam-links">'+(next&&next.url?ext(next.url,'Voir l’avis officiel','link-plain'):'')+links.map(function(l){return ext(l.url,l.label,'link-plain');}).join('')+'</div></section>';
  }
  function preparationLevel(category,job,routes) {
    var levels=[],complete=routes.length>0;
    routes.forEach(function(r){if(typeof r.lvl==='number'&&DIP[r.lvl]!==undefined){if(levels.indexOf(r.lvl)===-1)levels.push(r.lvl);}else complete=false;});
    var minimum=complete&&levels.length===1?levels[0]:(job.cat===category.id&&typeof job.lvl==='number'?job.lvl:null);
    var qualifications=routes.map(function(r){var sourceJob=jobById(r.id);return r.qualification||(sourceJob&&sourceJob.qualification)||(/sur titres?/.test(norm(r.access))?'selon le concours':null);});
    var qualification=job.qualification||(qualifications.some(Boolean)?(qualifications.every(function(q){return q&&q===qualifications[0];})?qualifications[0]:'selon le concours'):null);
    var compatible=!qualification&&minimum!==null&&userRank()!==null&&userRank()>=minimum;
    var label=qualification?'Diplôme requis : '+qualification:compatible?'Niveau d’étude compatible':minimum===null?'Niveau requis selon le concours':minimum===0?'Aucun diplôme requis':'Niveau '+DIP[minimum]+' requis';
    return '<span class="category-fit preparation-level'+(compatible?'':' warn')+'">'+(compatible?I.check:I.info)+'<span>'+esc(label)+'</span></span>';
  }
  /* Se préparer : chaque concours du métier, avec épreuves, annales, préparations et études conseillées. */
  /* Métiers sans concours de la fonction publique : la vraie modalité de recrutement, sourcée. */
  /* Métiers des armées : la note reste à côté des concours des écoles militaires (l’engagement en est l’autre voie). */
  function recruitmentNote(j) {
    if(!j.recruitment||jobRoutes(j).some(function(r){return !r.military;}))return '';
    return '<div class="ref-tip recruitment-note"><b>Comment on est recruté</b><p>'+sig(j.recruitment.text)+'</p>'+ext(j.recruitment.url,j.recruitment.label,'link-plain')+'</div>';
  }
  /* Préparations conseillées complétées pour les concours administratifs :
     IEP pour les catégories A+ et A, IPAG et CPAG pour les catégories A et B, dans les trois versants. */
  var ADMIN_DOMAINS = ['Administration, droit, politiques publiques', 'Économie, finances, contrôle'];
  function isAdminConcours(c) { return ADMIN_DOMAINS.indexOf(c.domain) > -1 || /établissement sanitaire, social/i.test(c.name); }
  function prepaText(c) {
    var t = c.prepa || '', adds = [];
    if (isAdminConcours(c)) {
      if ((c.cat === 'A+' || c.cat === 'A') && !/\bIEP\b|instituts? d’études politiques/i.test(t)) adds.push('IEP');
      if ((c.cat === 'A' || c.cat === 'B') && !/\bIPAG\b/.test(t)) adds.push('IPAG');
      if ((c.cat === 'A' || c.cat === 'B') && !/\bCPAG\b/.test(t)) adds.push('CPAG');
    }
    return t + (adds.length ? (t ? ' ; ' : '') + adds.join(', ') : '');
  }
  function concoursPrep(job, focus) {
    var refs=focus?[focus]:jobRefs(job);
    if(!refs.length)return recruitmentNote(job)?'<section class="stack mt-m" id="concours-ref"><h2 class="section-heading">'+I.calendar+'<span>Le recrutement</span></h2>'+recruitmentNote(job)+'</section>':'';
    /* Se préparer : pour chaque concours, seulement la préparation conseillée et la page officielle. */
    return '<section class="stack mt-m" id="concours-ref"><h2 class="section-heading">'+I.target+'<span>Le concours</span></h2>'+refs.slice(0,6).map(function(c,i){
      return '<details class="ref-card" style="--ref-tint:var(--cat-'+catClass(c.cat).slice(4).toLowerCase()+'-tint)"'+(refs.length===1||i===0?' open':'')+'><summary>'+catBadge(c.cat,'sm')+'<span class="ref-name"><b>'+sig(c.name)+'</b><span>'+esc(D.fps[c.fp])+(c.voies?' · '+sig(c.voies):'')+'</span></span><span class="details-toggle" aria-hidden="true">'+I.down+'</span></summary><div class="ref-body">'+
        '<h3 class="no-icon">Préparation conseillée</h3><p>'+(prepaText(c)?sig(prepaText(c)):'Pas de préparation particulière identifiée : consulter la page officielle du concours.')+'</p>'+
        ext(c.source,'Page officielle du concours','link-plain')+'</div></details>';
    }).join('')+'<p class="small m0">Informations indicatives, vérifiées le 18 octobre 2026 : l’avis de chaque session fait référence.</p></section>';
  }
  /* Stages de 3e et de seconde : conseils pour les élèves, sans promettre d’accueil. */
  function stagesPrep(job) {
    var cls=SCHOOL_CLASSES.indexOf(S.level);
    if(cls<0||cls>4||!D.stagesAdvice.length)return '';
    var level=cls<=3?'Troisième':'Seconde';
    var DOMAINS={Justice:'Justice',Sécurité:'Sécurité',Renseignement:'Sécurité',Défense:'Sécurité',Santé:'Santé',Environnement:'Environnement',Architecture:'Environnement',Numérique:'Numérique',Diplomatie:'Diplomatie'};
    var keys=(job.interests||[job.domain]).map(function(d){return DOMAINS[d];}).filter(Boolean);
    var general=D.stagesAdvice.filter(function(a){return norm(a.level).indexOf(norm(level))===0&&/tous metiers/.test(norm(a.domain));})[0];
    var themed=D.stagesAdvice.filter(function(a){return keys.some(function(k){return norm(a.domain).indexOf(norm(k))>-1;});})[0];
    var search=D.stagesAdvice.filter(function(a){return /rechercher/.test(norm(a.domain));})[0];
    var noNetwork=D.stagesAdvice.filter(function(a){return /sans reseau/.test(norm(a.domain));})[0];
    return '<section class="stack mt-m" id="stages"><h2 class="section-heading">'+I.route+'<span>Stage de '+(level==='Troisième'?'3e':'seconde')+'</span></h2>'+
      [general,themed].filter(Boolean).map(function(a){return '<div class="ref-tip stage-tip"><b>'+esc(a.device)+'</b><p>'+esc(a.advice)+'</p><p class="small stage-where">'+I.pin+'<span><span class="sr-only">Où : </span>'+esc(a.places)+'</span></p></div>';}).join('')+
      (noNetwork?'<p class="small">'+esc(noNetwork.advice)+'</p>':'')+(search?ext(search.source,'Chercher un stage sur 1 élève 1 stage','link-plain'):'')+'</section>';
  }
  /* ---------- Fiche concours : frise façon itinéraire de transport, du point de départ au concours ---------- */
  /* Position sur la frise en années depuis l’entrée en 6e : le bac tombe à 7, la licence à 10. */
  var TRIP_POS = { '6e': 0, '5e': 1, '4e': 2, '3e': 3, 'Seconde': 4, 'Première': 5, 'Terminale': 6, 'Sans diplôme': 4, 'Brevet': 4, 'CAP / BEP': 5, 'Bac': 7, 'Bac+1 / +2': 8, 'Bac+2': 9, 'Bac+3': 10, 'Bac+5': 12, 'Doctorat': 15 };
  var TRIP_AFTER_BAC = [0, 0, 0, 2, 3, 5, 8];
  I.journey = '<svg class="journey-icon" viewBox="0 0 200 844" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M100 2a72 72 0 0 1 72 72c0 46-50 86-72 108-22-22-72-62-72-108A72 72 0 0 1 100 2zm0 38a34 34 0 1 0 0 68 34 34 0 1 0 0-68z"/><g transform="translate(-6.6 202.6) scale(9)" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.4" cy="3.6" r="1.9" fill="currentColor" stroke="none"/><path d="M12.6 7.6 11.4 13.2M12.4 8.4l-2.9 2-.8 2.6M12.6 8.6l2.2 2 2.6.9M11.4 13.2l2.5 3.2.2 4.2M11.4 13.2l-1.5 3.7-2.6 3.6"/></g><circle cx="100" cy="448" r="11"/><circle cx="100" cy="537" r="11"/><circle cx="100" cy="627" r="11"/><circle cx="100" cy="762" r="68"/></svg>';
  I.walk = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13.4" cy="3.6" r="1.9" fill="currentColor" stroke="none"/><path d="M12.6 7.6 11.4 13.2M12.4 8.4l-2.9 2-.8 2.6M12.6 8.6l2.2 2 2.6.9M11.4 13.2l2.5 3.2.2 4.2M11.4 13.2l-1.5 3.7-2.6 3.6"/></svg>';
  function concoursJobs(c) {
    if (!c._jobs) c._jobs = D.jobs.filter(function (j) { return (j.routeIds || []).some(function (id) { return c.routeIds.indexOf(id) > -1; }) && jobCategories(j).indexOf(c.cat) > -1 && j.fp.indexOf(c.fp) > -1; });
    return c._jobs;
  }
  /* Sessions d’un concours au calendrier : à venir, ou toutes. */
  function concoursSessions(c, all) {
    return (all ? D.calendar : upcoming()).filter(function (x) { return x.fp === c.fp && (x.routeIds || []).some(function (id) { return c.routeIds.indexOf(id) > -1; }); }).sort(calendarOrder);
  }
  function concoursLevel(c) {
    if (typeof c.lvl === 'number') return c.lvl;
    var levels = c.routeIds.map(function (id) { var r = D.accessRoutes[id]; return r && typeof r.lvl === 'number' ? r.lvl : null; }).filter(function (l) { return l !== null; });
    return levels.length ? Math.min.apply(null, levels) : { 'A+': 5, A: 4, B: 2, C: 1 }[c.cat];
  }
  function yearsLabel(n) { return n + (n > 1 ? ' ans' : ' an'); }
  /* Étapes restantes depuis le niveau de l’utilisateur (ou depuis la 6e sans profil) jusqu’au diplôme du concours. */
  function concoursTrip(c, level) {
    var lvl = concoursLevel(c), pro = lvl <= 1, end = pro ? 6 : 7 + TRIP_AFTER_BAC[lvl];
    var start = level && TRIP_POS[level] !== undefined ? TRIP_POS[level] : 0, rank = level && RANK[level] !== undefined ? RANK[level] : null;
    if (rank !== null && rank >= lvl) end = start;
    else end = Math.max(end, start + 1);
    var phases = (pro ? [['college', 0, 4], ['pro', 4, 6]] : [['college', 0, 4], ['lycee', 4, 7], ['sup', 7, end]]).map(function (p) {
      var a = Math.max(p[1], start), b = Math.min(p[2], end);
      return b > a ? { kind: p[0], from: a, to: b, years: b - a } : null;
    }).filter(Boolean);
    return { lvl: lvl, phases: phases };
  }
  /* Stage d’observation conseillé (3e ou seconde) : dispositif national, puis la piste propre au concours. */
  function tripStage(c, level) {
    var general = D.stagesAdvice.filter(function (a) { return norm(a.level).indexOf(norm(level)) === 0 && /tous metiers/.test(norm(a.domain)); })[0];
    var where = String(c.stage || '').split(/\.?\s+Pour la 3e ou la seconde/)[0];
    return [general && general.device.split(' ; ')[0], where].filter(Boolean).map(function (t) { return t.replace(/\.$/, ''); }).join('. ');
  }
  /* Une zone de la frise : seulement ce qui est conseillé pour ce concours (options, spécialités, stages, prépa). */
  function tripPhase(c, p, lvl, prepa) {
    var qa = [], meta = '';
    var search = D.stagesAdvice.filter(function (a) { return /rechercher/.test(norm(a.domain)); })[0];
    var link = search ? ext(search.source, 'Chercher un stage sur 1 élève 1 stage', 'link-plain') : '';
    if (p.kind === 'college') {
      meta = 'jusqu’au brevet';
      qa = [['Options conseillées ?', c.collegeOption], ['Stage de 3e ?', tripStage(c, 'Troisième'), link]];
    }
    if (p.kind === 'pro') { meta = 'CAP en 2 ans ou bac pro en 3 ans'; qa = [['Quelle formation ?', c.lyceePro]]; }
    if (p.kind === 'lycee') {
      meta = 'jusqu’au bac';
      qa = [['Quelles spécialités ?', c.lyceeGeneral && c.lyceeGeneral + ' (conseillées, jamais obligatoires)']];
      if (p.from === 4) qa.push(['Option en seconde ?', c.optionSeconde], ['Stage de seconde ?', tripStage(c, 'Seconde'), link]);
      qa.push(['Option en terminale ?', c.optionTerminale]);
    }
    if (p.kind === 'sup') { meta = 'jusqu’à un ' + DIP[lvl]; qa = [['Quelles études ?', c.studies], ['Comment se préparer ?', prepa]]; }
    /* Catégories A et A+ : niveau minimum et niveau recommandé, à la place de la durée. */
    var levelNote = p.kind === 'sup' && (c.cat === 'A' || c.cat === 'A+') && lvl >= 4 ? (lvl >= 6 ? ['Doctorat exigé'] : lvl >= 5 ? ['Bac+5 minimum'] : ['Bac+3 minimum', 'Bac+5 recommandé']) : null;
    var sep = '<span aria-hidden="true"> | </span><span class="sr-only">, </span>';
    return '<p class="trip-meta">' + (levelNote ? levelNote.map(esc).join(sep) : yearsLabel(p.years) + sep + esc(meta)) + '</p>' +
      qa.filter(function (x) { return x[1]; }).map(function (x) { return tripFold(x[0], tripAnswer(x[1]) + (x[2] || '')); }).join('');
  }
  /* Réponse d’une rubrique dépliée : chaque partie annoncée par un intitulé (« Externe : », « Admissibilité : »…)
     reçoit ce titre, mis en forme comme « En métropole » dans « Lieux et sources ». */
  var TRIP_LABEL = /^(?:concours|externe|interne|troisi[eè]me|3e|premi(?:er|ère)|deuxi[eè]me|seconde?|admissibilit[eé]|admission|[ée]preuves?|voies?|session|[àa] partir|sur titres|talents|sp[ée]cial|pour les?|cadre|option|[ée]crits?|oraux|oral|phase|recrutement|pr[ée]s[ée]lection|s[ée]lection|tests?|candidats?|branche|sp[ée]cialit[ée]s?|lieutenant|caporal|agents?|fonctionnaires|docteurs?|titulaires?|sportifs|militaires?|[ée]l[èe]ves?|cpge|licence|master|bac|dipl[ôo]mes? requis)(?![A-Za-zÀ-ÖØ-öø-ÿ])/i;
  function capFirst(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; }
  function tripSegments(text) {
    var t = String(text || '').trim(), re = /(^|[.;]\s+)([A-ZÀ-ÖØ-Þa-zà-öø-ÿ0-9][^.;:]{0,95}?)\s?:\s/g, marks = [], m;
    while ((m = re.exec(t))) {
      var label = m[2].trim(), core = label.split(/,\s|\s\(/)[0];
      /* Un intitulé court, qui annonce une voie ou une phase (« Technicien externe », « 1re classe interne », « Admissibilité »). */
      if (core.split(/\s+/).length > 9 || !(TRIP_LABEL.test(core) || /(^|\s)(externes?|internes?|troisi[eè]me concours)(?![A-Za-zÀ-ÖØ-öø-ÿ])/i.test(core)) || (label.match(/\(/g) || []).length !== (label.match(/\)/g) || []).length) continue;
      marks.push({ start: m.index + m[1].length, label: label, from: re.lastIndex });
    }
    if (!marks.length) return t ? [{ label: '', text: t }] : [];
    var out = marks[0].start > 0 ? [{ label: '', text: t.slice(0, marks[0].start).trim() }] : [];
    marks.forEach(function (mk, i) {
      var body = t.slice(mk.from, i + 1 < marks.length ? marks[i + 1].start : t.length).trim().replace(/\s*[;,]$/, '').trim(), head = mk.label;
      /* « Admission, à Paris : … » ou « Admissibilité (écrits sur deux jours) : … » : le titre garde l’essentiel. */
      var cut = head.search(/,\s|\s\(/);
      if (cut > 0) { body = head.slice(cut).replace(/^,\s*/, '').replace(/^\s*\((.*)\)$/, '$1').trim() + ' : ' + body; head = head.slice(0, cut); }
      out.push({ label: capFirst(head), text: body });
    });
    return out;
  }
  function tripAnswer(text) {
    var dot = function (t) { return t && !/[.!?]$/.test(t) ? t + '.' : t; };
    return tripSegments(text).map(function (x) { return (x.label ? '<p class="trip-q">' + sig(x.label) + '</p>' : '') + '<p class="trip-a">' + sig(dot(capFirst(x.text))) + '</p>'; }).join('');
  }
  /* Chaque rubrique de la frise se déplie depuis son titre, comme « Lieux et sources ». */
  function tripFold(title, body) { return '<details class="trip-more"><summary><span>' + esc(title) + '</span>' + I.down + '</summary><div class="trip-fold">' + body + '</div></details>'; }
  /* Ce que recouvre chaque voie d’accès citée par le concours. */
  var VOIES = [
    [/extern/i, 'Concours externe', 'Ouvert à toute personne qui a le diplôme demandé, ou un niveau équivalent, sans expérience exigée dans la fonction publique.'],
    [/intern/i, 'Concours interne', 'Réservé aux personnes qui travaillent déjà dans la fonction publique, fonctionnaires ou contractuels, après quelques années de service.'],
    [/(^|[^\w+])3e\b|troisi[eè]me/i, '3e concours', 'Pour les personnes qui ont une expérience professionnelle dans le privé, un mandat d’élu local ou une responsabilité associative, pendant une durée fixée par le concours. Aucun diplôme n’est demandé.'],
    [/docteur/i, 'Voie des docteurs', 'Réservée aux titulaires d’un doctorat.'],
    [/sur titres?/i, 'Concours sur titres', 'Sélection sur dossier avec le diplôme ou la qualification demandés, souvent complétée par un entretien.']
  ];
  /* Voies citées par le concours qui n’ont aucune session à venir au calendrier. */
  var VOIE_KEYS = [[/extern/i, 'Concours externe'], [/intern/i, 'Concours interne'], [/(^|[^\w+])3e\b|troisi[eè]me/i, '3e concours']];
  function missingVoies(c, sessions) {
    var listed = VOIE_KEYS.filter(function (k) { return k[0].test(c.voies || ''); });
    /* Une session sans voie identifiable peut les couvrir toutes : on ne conclut rien. */
    if (!listed.length || sessions.some(function (x) { return !VOIE_KEYS.some(function (k) { return k[0].test(x.voie || ''); }); })) return [];
    return listed.filter(function (k) { return !sessions.some(function (x) { return k[0].test(x.voie || ''); }); }).map(function (k) { return k[1]; });
  }
  function voiesExplained(text) {
    var found = VOIES.filter(function (v) { return v[0].test(text || ''); });
    return found.length ? '<dl class="trip-voies">' + found.map(function (v) { return '<dt>' + esc(v[1]) + '</dt><dd>' + esc(v[2]) + '</dd>'; }).join('') + '</dl>' : '';
  }
  var TRIP_TITLES = { college: 'Collège', lycee: 'Lycée', pro: 'Lycée professionnel', sup: 'Études supérieures' };
  /* En-tête de frise : autant de points que la catégorie est élevée (C : 1, B : 2, A : 3, A+ : 4). */
  function tripSeps(cat) { return '<span class="trip-seps" aria-hidden="true">' + new Array(({ 'A+': 4, A: 3, B: 2 }[cat] || 1) + 1).join('<span class="trip-sep"></span>') + '</span>'; }
  function tripWho(level, testLevel) { return level ? (isParent() && !testLevel ? 'Niveau de ' + childName() : 'Mon niveau') : 'Entrée en 6e'; }
  var FP_FULL = { E: 'Fonction publique de l’État', T: 'Fonction publique territoriale', H: 'Fonction publique hospitalière' };
  var CAT_VARS = { 'A+': ['--cat-ap', '#3C05FF'], A: ['--cat-a', '#0051FF'], B: ['--cat-b', '#00707F'], C: ['--cat-c', '#18844A'] };
  function tripStop(cls, node, name, body, track, style) {
    return '<li class="trip-item ' + cls + '"' + (style ? ' style="' + style + '"' : '') + '><span class="trip-rail" aria-hidden="true">' + node + (track ? '<i class="trip-track ' + track + '"></i>' : '') + '</span><div class="trip-body">' +
      (name ? '<p class="trip-name">' + name + '</p>' : '') + body + '</div></li>';
  }
  /* Frise d’un concours : départ, études conseillées, concours (à sa couleur), puis l’arrivée. */
  /* Emplois supérieurs à la décision du gouvernement (ou de l’exécutif local) : nommés au fil de la carrière, jamais à la sortie de l’école. */
  var SENIOR_IDS = ['fpdir005', 'fpdir010', 'fpdir015', 'fpdir016', 'fpdir017', 'fpdir022', 'fpint001', 'fpint008', 'fpsec056'];
  var SENIOR_RE = /^(pr[ée]f[eè]te? ?\/|pr[ée]fet|sous-pr[ée]f|rect(rice|eur)|ambassad|directeur \/ directrice d.administration centrale|directrice \/ directeur d.administration centrale|secr[ée]taire g[ée]n[ée]rale? ?\/ ?g[ée]n[ée]rale? d.administration centrale)/i;
  function isSeniorAppointment(j) { return SENIOR_IDS.indexOf(j.id) > -1 || SENIOR_RE.test(j.name || ''); }
  function tripLine(c, level, who, end) {
    var trip = concoursTrip(c, level), first = trip.phases[0];
    var prepaInStudies = trip.phases.some(function (p) { return p.kind === 'sup'; });
    var dot = function (t) { return t && !/[.!?]$/.test(t) ? t + '.' : t; };
    var route = c.routeIds.map(function (id) { return D.accessRoutes[id]; }).filter(Boolean)[0], e = route && (route.examInfo || {})[c.fp] || {};
    var sessions = concoursSessions(c), allSessions = sessions.length ? sessions : concoursSessions(c, true), next = sessions[0];
    var datesHref = c.datesHref || '#/calendrier/concours/' + concoursKey(c);
    var unpublished = 'Dates non encore publiées. ' + ext(c.source, 'Consulter la page officielle.', 'trip-official');
    var missing = sessions.length ? missingVoies(c, sessions) : [];
    var expected = (D.calendarExpected || []).filter(function (x) { return x.concours === c.id; }).map(function (x) { return '<p class="trip-expected">' + esc(x.voie + ' : ' + x.expected) + '</p>'; }).join('');
    var missingNote = missing.length ? '<p class="trip-missing"><b>' + esc(missing.join(' et ')) + '</b><br>' + unpublished + '</p>' + expected : '';
    var stop = tripStop, catVar = CAT_VARS[c.cat], catStyle = catVar ? '--theme:var(' + catVar[0] + ');--trip-ink:' + catVar[1] : '';
    /* Question en gras, réponse à la ligne en noir. */
    var qa = function (q, a, more) { return a ? tripFold(q, tripAnswer(a) + (more || '')) : ''; };
    var short = function (iso) { var d = fmtDate(iso); return d.day + ' ' + d.month + ' ' + d.year; };
    /* Fiche métier : le concours obtenu (médaille) ouvre l’accès au poste, rejoint à pied en pointillés ; il ne le garantit pas. */
    var arrival = function () {
      return (end.admission ? stop('admit', '<span class="trip-pill">' + I.medal + '</span><span class="trip-walk">' + I.walk + '</span>', 'Obtention du concours' + catBadge(c.cat, 'sm'),
        (end.senior ? '<p class="trip-access"><b>Ce poste ne s’obtient pas à la sortie de l’école.</b> Il est confié au fil de la carrière, par nomination du gouvernement, à des cadres expérimentés, le plus souvent passés par une grande école du service public comme l’INSP.</p>'
          : '<p class="trip-access"><b>Le concours rend ce poste accessible, sans le garantir.</b> À la sortie de l’école, les postes sont attribués selon les besoins des administrations et les vœux des élèves, ou après un entretien avec l’employeur.</p>'), 'dots', catStyle) : '') +
        stop('end', '<span class="trip-pill">' + (end.icon || '') + '</span>', end.name, end.body, end.track || '', catStyle);
    };
    /* Départ : « Mon niveau » puis la pastille du niveau actuel, comme sur l’accueil. */
    /* Niveau suffisant : « Concours accessible » dans le même style que « Mon niveau », avec sa pastille. */
    var accessLine = '<p class="trip-sub trip-level">Concours accessible<span class="study-level access-now">' + I.check + '<span>Maintenant</span></span></p>';
    var head = stop('start', I.pin, 'Départ', '<p class="trip-sub' + (level ? ' trip-level' : '') + '">' + esc(who) + (level ? '<span class="study-level">' + I.graduation + '<span>' + esc(level) + '</span></span>' : '') + '</p>', '') +
      (first ? stop('leg', '<span class="trip-walk">' + I.walk + '</span>', '', '<p class="trip-lead">' + esc(TRIP_TITLES[first.kind]) + '</p>' + tripPhase(c, first, trip.lvl, prepaText(c)), 'line c-' + first.kind)
        /* Bac+3 face à un concours A+ ou A : accessible, mais la plupart des admis ont un Bac+5. */
        : stop('leg', '<span class="trip-walk">' + I.walk + '</span>', '', level === 'Bac+3' && (c.cat === 'A+' || c.cat === 'A')
          ? accessLine + '<p class="trip-meta">Pour information, la grande majorité des admis à ce concours ont un Bac+5 minimum.</p>'
          : accessLine, 'line c-none')) +
      trip.phases.slice(1).map(function (p) { return stop('mid', '<span class="trip-dot c-' + p.kind + '"></span>', esc(TRIP_TITLES[p.kind]), tripPhase(c, p, trip.lvl, prepaText(c)), 'line c-' + p.kind); }).join('');
    /* Métier recruté sans concours : l’étape du recrutement remplace celle du concours. */
    if (c.recruit) return head + stop('trip-exam', catBadge(c.cat), esc(c.recruit.title), c.recruit.body, 'line', catStyle) + arrival();
    return head +
      stop('trip-exam', catBadge(c.cat), esc(c.name),
        '<p class="trip-dir">' + I.arrow + '<span>' + esc(FP_FULL[c.fp] || D.fps[c.fp]) + '</span></p>' +
        tripFold('Prochaines sessions', sessions.length ? '<ul class="trip-sessions">' + sessions.slice(0, 3).map(function (x) {
          return '<li><span>' + esc(x.voie || 'Session') + (x.provisional ? ' · prévisionnel' : '') + '</span><span>' + (x.date ? (x.date < todayISO() ? 'inscriptions closes' : 'clôture ' + esc(short(x.date))) : esc(x.closeLabel || 'date à venir')) + '</span></li>';
        }).join('') + '</ul>' + (sessions.length > 3 ? '<a class="link-plain" href="' + datesHref + '">Voir les ' + sessions.length + ' sessions</a>' : '') + missingNote : '<p class="trip-a">' + unpublished + '</p>' + expected) +
        qa('Quelles voies ?', c.voies, voiesExplained(c.voies)) + qa('Quels diplômes ?', c.condition) + qa('Quelles épreuves ?', c.epreuves) + qa('Qui organise ?', e.org) + (prepaInStudies ? '' : qa('Comment se préparer ?', prepaText(c))) +
        (c.vigilance ? '<p class="trip-note">' + I.info + '<span>' + sig(dot(c.vigilance)) + '</span></p>' : '') +
        tripFold('Lieux et sources',
          '<p class="trip-q">En métropole</p><p class="trip-a">' + esc(e.metro || 'Lieux non précisés : consulter l’avis du concours.') + '</p>' +
          '<p class="trip-q">En outre-mer</p><p class="trip-a">' + esc(e.om || 'Centre non confirmé : consulter l’avis du concours.') + '</p>' +
          (c.annales ? ext(c.annales.url, 'Annales officielles du concours', 'link-plain') : '') + ext(c.source, 'Page officielle du concours', 'link-plain')) +
        /* Dates de la prochaine session, puis toutes les sessions du concours. */
        tripFold('Dates des épreuves',
          (next ? '<p class="trip-q">' + esc((next.provisional ? 'Calendrier prévisionnel' : 'Calendrier') + ' · ' + (next.voie || 'Session')) + '</p>' +
            '<dl class="trip-dates"><dt>Ouverture</dt><dd>' + esc(next.openLabel || next.open || 'Non publiée') + '</dd><dt>Clôture</dt><dd>' + esc(next.closeLabel || next.date || 'Non publiée') + '</dd>' +
            '<dt>Écrits ou sélection</dt><dd>' + esc(next.writtenLabel || 'Non publiés') + '</dd><dt>Oraux</dt><dd>' + esc(next.oralLabel || 'Non publiés') + '</dd></dl>'
            : '<p class="trip-a">' + unpublished + '</p>' + expected) + (next ? missingNote : '') +
          (allSessions.length ? '<a class="trip-all-dates" href="' + datesHref + '">Voir toutes les dates du concours</a>' : '')), 'line', catStyle) +
      arrival();
  }
  /* Un niveau dans l’adresse (#/concours-fiche/<clé>/<niveau>) permet de vérifier la frise sans modifier le profil. */
  /* Métiers liés : d’abord ceux de la seule catégorie du concours, puis, sous une légende, ceux qui relèvent aussi d’autres catégories. */
  function relatedJobs(c, jobs) {
    var only = jobs.filter(function (j) { var k = jobCategories(j); return k.length === 1 && k[0] === c.cat; });
    var others = jobs.filter(function (j) { return only.indexOf(j) < 0; });
    only = only.slice(0, 40); others = others.slice(0, Math.max(0, 40 - only.length));
    /* Petite flèche à droite de chaque métier lié, comme pour les évolutions : la carte s’ouvre. */
    var row = function (j) { return jobRow(j); };
    return (only.length ? '<div class="list job-cards">' + only.map(row).join('') + '</div>' : '') +
      (others.length ? '<p class="related-note">Ces métiers sont aussi accessibles par d’autres concours, d’une autre catégorie ou d’un autre versant de la fonction publique.</p>' +
        '<div class="list job-cards">' + others.map(row).join('') + '</div>' : '');
  }
  function concoursInfo(c) {
    var facts = [];
    if (c.school) facts.push(['École, formation', c.school]);
    if (c.organizer) facts.push(['Organisateur', c.organizer]);
    if (c.trainingMonths) facts.push(['Durée de la formation', String(c.trainingMonths).replace('.', ',') + ' mois' + (c.paidTraining && /^oui/i.test(c.paidTraining) ? ', rémunérée' : '')]);
    if (c.places) facts.push(['Postes', c.places]);
    if (c.evolution) facts.push(['Et après', c.evolution]);
    return '<div class="concours-info"><p class="eyebrow">' + catBadge(c.cat, 'sm') + ' ' + esc(D.fps[c.fp] || '') + '</p><h3 class="no-icon">' + sig(c.name) + '</h3>' +
      String(c.description).split(/\n+/).map(function (t) { return '<p class="body">' + sig(t.trim()) + '</p>'; }).join('') +
      /* Même lecture que les accordéons : un intitulé gris, puis le texte. */
      (facts.length ? '<div class="concours-facts">' + facts.map(function (f) { return '<p class="trip-q">' + esc(f[0]) + '</p><p class="trip-a">' + sig((function (t) { return /[.!?)]$/.test(t) && !/\)$/.test(t) ? t : t + '.'; })(capFirst(String(f[1]).trim()))) + '</p>'; }).join('') + '</div>' : '') +
      (c.source ? ext(c.source, 'Page officielle du concours', 'link-plain') : '') + '</div>';
  }
  screens['concours-fiche'] = function (key, testLevel) {
    var c = key && concoursByKey(key);
    if (!c) return screens['concours-liste']();
    var level = testLevel ? decodeURIComponent(testLevel) : (S.done ? S.level : null);
    var jobs = concoursJobs(c);
    var lead = jobs.filter(function (j) { return jobRef(j) === c; })[0] || jobs[0] || null;
    var prepLink = lead ? (isContractJob(lead) ? prepHref(lead) : '#/preparer/' + lead.id + '/' + concoursKey(c)) : '';
    var favKey = 'concours:' + concoursKey(c), fav = S.favorites.indexOf(favKey) > -1, visitor = !S.done;
    var line = tripLine(c, level, tripWho(level, testLevel), { name: 'Obtention du concours', icon: I.seal, track: 'dots', body: '<p class="trip-dir">' + catBadge(c.cat, 'sm') + I.arrow + '<span>' + esc(FP_FULL[c.fp] || D.fps[c.fp]) + '</span></p>' });
    return '<main class="screen top-tight job-page concours-page concours-trip">' + back('#/concours-liste', 'Concours') +
      '<div class="job-hero trip-head"><div class="trip-summary"><span class="trip-modes">' + I.walk + tripSeps(c.cat) + catBadge(c.cat) + '</span></div>' +
        '<h1>' + sig(c.name) + '</h1></div>' +
      (visitor ? '' : '<div class="job-actions">' +
        (c.description ? '<button type="button" class="job-action" data-action="concoursInfo"' + attr('v', concoursKey(c)) + ' aria-haspopup="dialog">' + I.info + '<span>Information</span></button>' : '') +
        '<button type="button" class="job-action" data-action="favorite"' + attr('v', favKey) + ' aria-pressed="' + fav + '" aria-label="' + (fav ? 'Retirer des favoris' : 'Ajouter aux favoris') + '">' + I.bookmark + '<span aria-hidden="true">Favori</span></button>' +
        '<button type="button" class="job-action" data-action="share"' + attr('v', favKey) + '>' + I.send + '<span>Partager</span></button>' +
      '</div>') +
      '<section class="trip-wrap" aria-label="Parcours jusqu’au concours"><ol class="trip">' + line + '</ol></section>' +
      /* Les pointillés de l’obtention du concours mènent jusqu’à la boussole des métiers liés. */
      '<section class="stack job-section trip-next"><h2 class="section-heading">' + I.compass + '<span>Métiers liés</span></h2>' + (jobs.length ? relatedJobs(c, jobs) : '<p class="body">Les métiers associés figurent dans l’avis du concours.</p>') + '</section>' +
      (visitor ? '<a class="btn theme mt-m" href="#/bienvenue">Créer un compte pour préparer le concours</a>' : lead ? '<a class="btn theme mt-m prep-cta" href="' + prepLink + '">' + I.book + 'Se préparer</a>' : '') +
      '<p class="small">Parcours conseillé, à titre indicatif : l’avis de chaque session fait référence.</p></main>' +
      /* Copie réduite, réservée à la vue : le vrai bouton reste celui de la page pour le clavier et les lecteurs d’écran. */
      (!visitor && lead ? '<a class="btn theme prep-float" href="' + prepLink + '" tabindex="-1" aria-hidden="true">' + I.book + 'Se préparer</a>' : '') +
      (visitor ? '<div class="footer share-footer"><a class="btn" href="#/bienvenue">Créer mon profil</a></div>' : tabbar('concours-liste'));
  };
  /* Ancienne adresse de la page test : même fiche. */
  screens['concours-test'] = function (key, level) { return screens['concours-fiche'](key, level); };
  /* Corps d’accès sans fiche au référentiel : un concours par versant, avec les études conseillées du domaine. */
  var COLLEGE_OPTION = 'Langues anciennes, théâtre, club scientifique, projet associatif ou débat si proposé : au choix ; jamais un prérequis général.';
  function studyFields(j, lvl) {
    var f = STUDY[j.domain] || STUDY.Administration, general = /Bac général \(([^)]*)\)/.exec(f.lycee);
    return { collegeOption: COLLEGE_OPTION, lyceeGeneral: general ? general[1] : f.lycee, lyceePro: f.pro, studies: lvl >= 5 ? f.master : lvl >= 4 ? f.lic : f.sup2 };
  }
  function routeConcours(j) {
    var out = [], fps = selFps(), pref = fps.length === 1 ? fps[0] : null;
    jobRoutes(j).forEach(function (r) {
      r.fp.split('').filter(function (f) { return j.fp.indexOf(f) > -1; }).forEach(function (f) {
        var e = (r.examInfo || {})[f] || {}, lvl = typeof r.lvl === 'number' ? r.lvl : targetLevel(j, r.cat), q = j.qualification || r.qualification;
        out.push(Object.assign({ id: 'route-' + r.id + '-' + f, routeIds: [r.id], cat: r.cat, fp: f, lvl: lvl, name: e.name || 'Concours : ' + r.name,
          voies: r.access && r.access !== 'Concours' ? r.access : '', condition: q ? 'Diplôme requis : ' + q : lvl === 0 ? 'Aucun diplôme requis' : 'Niveau ' + DIP[lvl] + ' requis',
          source: e.source || r.source, datesHref: '#/calendrier/' + j.id }, studyFields(j, lvl)));
      });
    });
    function versant(c) { return c.fp === pref ? -1 : ['E', 'T', 'H'].indexOf(c.fp); }
    return out.sort(function (a, b) { return ['A+', 'A', 'B', 'C'].indexOf(a.cat) - ['A+', 'A', 'B', 'C'].indexOf(b.cat) || versant(a) - versant(b); });
  }
  function recruitConcours(j) {
    /* Sans niveau connu, un métier A ou A+ passe quand même par les études supérieures : bac+3 minimum, bac+5 recommandé. */
    var contract = isContractJob(j), cat = contract ? 'CDD' : themeCategory(j) || 'CDD', lvl = typeof j.lvl === 'number' ? j.lvl : cat === 'A' || cat === 'A+' ? 4 : 2;
    var body = contract ? '<p class="trip-a">' + esc('Recruté·e sur CV et entretien, en CDD. Un CDI est possible après 6 ans.') + '</p>'
      : '<p class="trip-a">' + sig(j.recruitment ? j.recruitment.text : 'Recrutement selon l’employeur : consulter les offres.') + '</p>' + (j.recruitment ? ext(j.recruitment.url, j.recruitment.label, 'link-plain') : '');
    return Object.assign({ id: 'recruit-' + j.id, routeIds: [], cat: cat, fp: j.fp.charAt(0), lvl: lvl, recruit: { title: contract ? 'Recrutement sans concours' : 'Recrutement', body: body } }, studyFields(j, lvl));
  }
  /* Ancienne adresse de la page test : même fiche. */
  screens['metier-test'] = function (id, level) { return screens.metier(id, level); };
  /* Onglet de concours : sa frise et son « Évoluer » s’affichent, les autres se masquent. */
  function selectTripTab(scope, v) {
    scope.querySelectorAll('[data-tab]').forEach(function (panel) { panel.hidden = panel.getAttribute('data-tab') !== v; });
    scope.querySelectorAll('.trip-tab').forEach(function (tab) {
      var on = tab.getAttribute('data-v') === v; tab.setAttribute('aria-selected', String(on));
      var prep = on && tab.getAttribute('data-prep');
      if (prep) root.querySelectorAll('.prep-cta, .prep-float').forEach(function (a) { a.setAttribute('href', prep); });
    });
    /* La frise change de longueur : le bouton flottant se recale sans attendre un défilement. */
    schedulePrepFloat();
  }
  /* Fiche métier en frise : un onglet par concours possible ; Évoluer suit l’onglet choisi.
     Un niveau dans l’adresse (#/metier/<id>/<niveau>) permet de vérifier la frise sans modifier le profil. */
  screens.metier = function (id, testLevel) {
    var j = jobById(id);
    if (!j) return screens.metiers();
    var refs = isContractJob(j) ? [] : jobRefs(j);
    if (!refs.length && !isContractJob(j)) refs = routeConcours(j);
    if (!refs.length) refs = [recruitConcours(j)];
    var main = jobRef(j), sel = Math.max(0, refs.indexOf(main));
    /* « Se préparer » n’ouvre que le concours de l’onglet choisi. */
    var prepFor = function (c) { return !isContractJob(j) && c && c.id && concoursByKey(concoursKey(c)) ? '#/preparer/' + j.id + '/' + concoursKey(c) : prepHref(j); };
    var level = testLevel ? decodeURIComponent(testLevel) : S.level || null, who = tripWho(level, testLevel);
    var fpLabel = FP_FULL;
    var shared = sharedTraits(j), fav = S.favorites.indexOf(j.id) > -1;
    var label = function (c) { var twin = refs.some(function (o) { return o !== c && o.cat === c.cat && o.fp === c.fp; }); return twin ? c.name : D.fps[c.fp]; };
    /* Métier sur plusieurs catégories : on choisit d’abord la catégorie, puis le versant. */
    var cats = []; refs.forEach(function (c) { if (cats.indexOf(c.cat) === -1) cats.push(c.cat); });
    /* Catégorie choisie plus tôt sur cette fiche : elle reste sélectionnée si la page se redessine (favori, retour). */
    if (tripCatPick && tripCatPick.job === j.id && refs[sel].cat !== tripCatPick.cat) { var picked = refs.map(function (c) { return c.cat; }).indexOf(tripCatPick.cat); if (picked > -1) sel = picked; }
    var selCat = refs[sel].cat, multi = cats.length > 1;
    var catRow = multi ? '<div class="trip-cats" role="group" aria-label="Catégorie du concours">' + cats.map(function (k) {
      return '<button type="button" class="trip-cat" data-action="tripCat"' + attr('v', k) + ' aria-pressed="' + (k === selCat) + '">' + catBadge(k, 'sm') + '<span>Catégorie ' + esc(k) + '</span></button>';
    }).join('') + '</div>' : '';
    var tabs = refs.length > 1 ? '<div class="trip-tabs-wrap"><p class="trip-tabs-label">' + refs.length + ' concours possibles pour ce métier</p>' + catRow + '<div class="trip-tabs" role="tablist" aria-label="Concours possibles">' + refs.map(function (c, i) {
      return '<button type="button" class="trip-tab" role="tab" id="trip-tab-' + i + '" aria-controls="trip-panel-' + i + '" aria-selected="' + (i === sel) + '" data-action="tripTab"' + attr('v', i) + attr('cat', c.cat) + attr('prep', prepFor(c)) + (multi && c.cat !== selCat ? ' hidden' : '') + '>' + (multi ? '' : catBadge(c.cat, 'sm')) + '<span>' + esc(label(c)) + '</span></button>';
    }).join('') + '</div></div>' : '';
    tabs += extraCatsNote(j);
    var panels = refs.map(function (c, i) {
      return '<div class="trip-panel" id="trip-panel-' + i + '" role="tabpanel" aria-labelledby="trip-tab-' + i + '" data-tab="' + i + '"' + (i === sel ? '' : ' hidden') + '><ol class="trip">' +
        tripLine(c, level, who, { name: esc(j.name), icon: I.seal, admission: !c.recruit, senior: isSeniorAppointment(j), body: '<p class="trip-dir">' + catBadge(c.cat, 'sm') + I.arrow + '<span>' + esc(c.recruit ? j.fp.split('').map(function (f) { return fpLabel[f]; }).join(', ') : fpLabel[c.fp]) + '</span></p>' }) + '</ol></div>';
    }).join('');
    /* Évoluer : progression du concours choisi, puis celles des autres concours possibles. */
    var ladders = refs.map(function (c, i) {
      var others = refs.filter(function (o) { return o !== c && o.next && o.next.length && D.concoursById[o.next[0].to]; });
      var alt = others.length ? '<div class="ladder-alt"><p class="ladder-alt-title">Avec les autres concours</p>' + others.map(function (o) {
        var p = o.next[0], to = D.concoursById[p.to];
        return '<a class="ladder-alt-row" href="#/concours-fiche/' + concoursKey(to) + '">' + catBadge(p.toCat, 'sm') + '<span><b>' + esc(p.toName) + '</b><small>Après le concours ' + { E: 'de l’État', T: 'territorial', H: 'hospitalier' }[o.fp] + '</small></span><span class="row-chev" aria-hidden="true">' + I.chev + '</span></a>';
      }).join('') + '</div>' : '';
      return '<div data-tab="' + i + '"' + (i === sel ? '' : ' hidden') + '>' + jobLadder(j, c, alt) + '</div>';
    }).join('');
    var prepLabel = isContractJob(j) ? I.route + 'Entrer sans concours' : I.book + 'Se préparer';
    return '<main class="screen top-tight job-page concours-trip job-trip">' + back('#/metiers', 'Métiers') +
      '<div class="job-hero trip-head"><div class="trip-summary"><span class="trip-modes">' + I.walk + tripSeps(themeCategory(j)) + jobBadges(j) + '</span></div>' +
        '<h1>' + esc(j.name) + '</h1>' + (shared.length ? '<p class="job-match">' + (isParent() ? 'Lui ressemble' : 'Vous ressemble') + ' : ' + esc(shared.map(traitLabel).join(', ').toLowerCase()) + '</p>' : '') +
        '<p class="body">' + esc(j.desc.length > 300 ? j.desc.slice(0, 297).replace(/\s+\S*$/, '') + '…' : j.desc) + '</p></div>' +
      '<div class="job-actions">' +
        '<button type="button" class="job-action" data-action="jobDetails"' + attr('v', j.id) + ' aria-label="En savoir plus">' + I.info + '<span aria-hidden="true">En savoir +</span></button>' +
        '<button type="button" class="job-action" data-action="favorite"' + attr('v', j.id) + ' aria-pressed="' + fav + '" aria-label="' + (fav ? 'Retirer des favoris' : 'Ajouter aux favoris') + '">' + I.bookmark + '<span aria-hidden="true">Favori</span></button>' +
        '<button type="button" class="job-action" data-action="share"' + attr('v', j.id) + '>' + I.send + '<span>Partager</span></button>' +
      '</div>' +
      tabs + '<section class="trip-wrap" aria-label="Parcours jusqu’au métier">' + panels + '</section>' + (refs[0].recruit ? '' : recruitmentNote(j)) + ladders +
      '<a class="btn theme mt-m prep-cta" href="' + prepFor(refs[sel]) + '">' + prepLabel + '</a>' +
      ext('https://www.fonction-publique.gouv.fr/toutes-les-publications/repertoire-commun-des-metiers-de-la-fonction-publique', 'Consulter la source métier sur fonction-publique.gouv.fr', 'link-plain') + '</main>' +
      /* Comme sur la fiche concours : copie réduite qui flotte dès la fin de la frise, réservée à la vue. */
      '<a class="btn theme prep-float" href="' + prepFor(refs[sel]) + '" tabindex="-1" aria-hidden="true">' + prepLabel + '</a>' + tabbar('metiers');
  };
  screens.preparer = function(id, key) {
    var job=jobById(id);
    if(!job)return screens.metiers();
    if(isContractJob(job))return screens['sans-concours'](id);
    var focus=key&&concoursByKey(key)||null;
    var theme=focus?focus.cat:themeCategory(job);
    var fromJob=(visitedRoutes[visitedRoutes.length-2]||'').indexOf('#/metier/'+job.id)===0;
    return '<main class="screen top-tight prep-page">' + (focus&&!fromJob?back('#/concours-fiche/'+concoursKey(focus),'Concours'):back('#/metier/'+job.id,job.name)) + (theme?'<span class="prep-page-cat">'+catBadge(theme,'lg')+'</span>':'') + '<h1>Se préparer</h1><p class="sr-only">' + (focus?sig(focus.name):esc(job.name)) + '</p>' +
      concoursPrep(job, focus) + stagesPrep(job) + preparationContent(job, focus) + '</main>' + tabbar('metiers');
  };

  screens.calendrier = function (jobId, key) {
    var concours = jobId === 'concours' && concoursByKey(key);
    if (concours) {
      var all = concoursSessions(concours).length ? concoursSessions(concours) : concoursSessions(concours, true);
      return '<main class="screen top-tight">' + back('#/concours-fiche/' + concoursKey(concours), 'Concours') +
        '<span class="eyebrow">Calendrier</span><h1 class="sm">Dates des concours</h1><p class="body">' + sig(concours.name) + '</p>' +
        '<p class="small m0">' + all.length + ' session' + (all.length > 1 ? 's' : '') + ' · sources vérifiées le ' + esc(D.catalogChecked) + '. Certaines dates sont prévisionnelles ; l’avis de l’organisateur fait référence.</p>' +
        '<div class="stack calendar-list">' + calendarRows(all, 200, null) + '</div></main>' + tabbar('concours-liste');
    }
    var job = D.jobs.find(function (j) { return j.id === jobId; });
    /* Sur la page d’un métier, on arrive déjà filtré : ni recherche ni filtres, toutes ses sessions à venir (ou passées à défaut). */
    var base = job ? (examsFor(job, false).length ? examsFor(job, false) : examsFor(job, true)) : (S.calView === 'all' ? D.calendar : upcoming());
    var cats = calCats(), fps = calFps();
    var list = base.filter(function (c) {
      return job || (cats.length === 4 || cats.indexOf(calendarCategory(c, job)) > -1) && fps.indexOf(c.fp) > -1 && calMatches(c);
    }).slice().sort(calendarOrder);
    var note = '<p class="small cal-note">Sources vérifiées le ' + esc(frDate(D.catalogChecked)) + '. Certaines dates sont prévisionnelles : l’avis de l’organisateur fait référence.</p>';
    if (job) return '<main class="screen top-tight">' + back('#/preparer/' + job.id, 'Se préparer') +
      '<span class="eyebrow">Calendrier</span><h1 class="sm">Dates des concours</h1><p class="body">' + esc(job.name) + '</p>' +
      '<p class="small m0">' + list.length + ' session' + (list.length > 1 ? 's' : '') + ' · sources vérifiées le ' + esc(frDate(D.catalogChecked)) + '. Certaines dates sont prévisionnelles : l’avis de l’organisateur fait référence.</p>' +
      '<div class="stack calendar-list">' + calendarRows(list, S.calLimit, job) + '</div>' +
      (list.length > S.calLimit ? '<button type="button" class="btn outline" data-action="moreCalendar">Afficher 40 sessions de plus</button>' : '') +
      '</main>' + tabbar('metiers');
    /* Même présentation que l’Explorer : titre et réglages, pastilles grises des filtres, recherche avec suggestions, puis les cards. */
    return '<main class="screen pt calendar-screen">' + back('#/concours', 'Informations générales') +
      '<div class="title-row"><h1>Dates des concours</h1><button id="filters-open" type="button" class="icon-btn" data-action="openCalFilters" aria-label="Régler les filtres du calendrier">' + I.settings + '</button></div>' +
      '<div class="row filter-summary" aria-label="Filtres actifs">' + calSummary() + '</div>' +
      '<div class="search-wrap">' + searchField('cal-q', 'Rechercher un concours ou une ville', 'Rechercher un concours', S.calQ) +
      '<ul class="suggest" id="cal-suggest" aria-label="Suggestions" hidden></ul></div>' +
      '<div id="cal-results">' + calResults(list) + '</div>' + note + '</main>' + tabbar('concours');
  };
  /* ---------- Calendrier : filtres façon Explorer ---------- */
  var CAL_CATS = ['A+', 'A', 'B', 'C'];
  function calCats() { return Array.isArray(S.calCats) && S.calCats.length ? CAL_CATS.filter(function (c) { return S.calCats.indexOf(c) > -1; }) : CAL_CATS.slice(); }
  function calFps() { return Array.isArray(S.calFps) && S.calFps.length ? ALL_FPS.filter(function (f) { return S.calFps.indexOf(f) > -1; }) : ALL_FPS.slice(); }
  function calMatches(c) { return !S.calQ || norm(c.name + ' ' + (c.location || '') + ' ' + (c.employer || '')).indexOf(norm(S.calQ)) > -1; }
  function calList() {
    var cats = calCats(), fps = calFps();
    return (S.calView === 'all' ? D.calendar : upcoming()).filter(function (c) {
      return (cats.length === 4 || cats.indexOf(calendarCategory(c, null)) > -1) && fps.indexOf(c.fp) > -1 && calMatches(c);
    }).slice().sort(calendarOrder);
  }
  function calResults(list) {
    list = list || calList();
    return '<p class="small" role="status">' + list.length + ' session' + (list.length > 1 ? 's' : '') + (S.calView === 'all' ? '' : ' à venir') + '</p>' +
      '<div class="stack calendar-list">' + calendarRows(list, S.calLimit, null) + '</div>' +
      (list.length > S.calLimit ? '<button type="button" class="btn outline mt-s" data-action="moreCalendar">Afficher 40 sessions de plus</button>' : '');
  }
  function calSummary() {
    var cats = calCats(), fps = calFps();
    function pill(text, cls) { return '<button type="button" class="tag tag-btn' + (cls || '') + '" data-action="openCalFilters" aria-haspopup="dialog" aria-label="' + esc(text) + ' : modifier les filtres">' + esc(text) + '</button>'; }
    var catLabel = cats.length === 4 ? 'Toutes catégories' : cats.length === 1 ? 'Catégorie ' + cats[0] : cats.slice(0, -1).join(', ') + ' et ' + cats[cats.length - 1];
    return pill(S.calView === 'all' ? 'Toutes les sessions' : 'À venir') + pill(catLabel, cats.length === 1 ? ' fill ' + catClass(cats[0]) : '') +
      pill(fps.length === 3 ? '3 versants' : fps.map(function (f) { return D.fps[f]; }).join(', '));
  }
  function calFilters() {
    var n = calList().length;
    return '<section class="stack"><h3>Sessions</h3><div class="row" role="group" aria-label="Sessions">' + chip('calView', 'upcoming', 'À venir', S.calView !== 'all') + chip('calView', 'all', 'Toutes les sessions', S.calView === 'all') + '</div></section>' +
      '<section class="stack mt-m"><h3>Catégories</h3><p class="small m0">Choisissez une ou plusieurs catégories.</p><div class="row" role="group" aria-label="Catégories">' + CAL_CATS.map(function (c) { return chip('calCats', c, c, calCats().indexOf(c) > -1); }).join('') + '</div></section>' +
      '<section class="stack mt-m"><h3>Versants</h3><div class="row" role="group" aria-label="Versants">' + ALL_FPS.map(function (f) { return chip('calFps', f, D.fps[f], calFps().indexOf(f) > -1); }).join('') + '</div></section>' +
      '<div class="sheet-actions"><button type="button" class="btn" data-ui="close">Afficher ' + (n ? n + ' session' + (n > 1 ? 's' : '') : 'les résultats') + '</button></div>';
  }
  /* Suggestions : intitulés de concours et villes du calendrier qui contiennent la saisie. */
  function calSuggestHtml(q) {
    q = norm(q || '').trim(); if (q.length < 2) return '';
    var seen = {}, out = [];
    (S.calView === 'all' ? D.calendar : upcoming()).forEach(function (c) {
      [[c.name, calendarCategory(c, null)], [c.location, null]].forEach(function (x) {
        if (!x[0] || out.length >= 8) return;
        var label = String(x[0]).split(/\s*[;(]/)[0].trim(), k = norm(label);
        if (!label || seen[k] || k.indexOf(q) < 0) return;
        seen[k] = 1; out.push([label, x[1]]);
      });
    });
    return out.map(function (it) {
      return '<li><button type="button" class="suggest-item" data-action="calSuggest"' + attr('v', it[0]) + '><span class="suggest-cats">' + (it[1] ? catBadge(it[1], 'sm') : '<span class="suggest-pin" aria-hidden="true">' + I.pin + '</span>') + '</span><span class="suggest-label">' + esc(it[0]) + '</span></button></li>';
    }).join('');
  }
  function updateCalSuggest(show) {
    var box = document.getElementById('cal-suggest'), input = document.getElementById('cal-q');
    if (!box || !input) return;
    var html = show ? calSuggestHtml(input.value) : '';
    box.innerHTML = html; box.hidden = !html; input.setAttribute('aria-expanded', String(!!html));
  }
  function refreshCalendar() {
    var box = document.getElementById('cal-results'); if (box) box.innerHTML = UI.inclusive(calResults());
    var sum = root.querySelector('.calendar-screen .filter-summary'); if (sum) sum.innerHTML = UI.inclusive(calSummary());
  }

  screens.etudes = function (jobId) {
    var job=jobById(jobId);
    if(job) {
      var routes=jobRoutes(job);
      return '<main class="screen top-tight">'+back(prepHref(job),'Se préparer')+'<span class="eyebrow">Orientation</span><h1 class="sm">Quelles études choisir ?</h1><p class="body">'+esc(job.name)+'</p>' +
        '<h2 class="mt-m">Études et conditions d’accès</h2>'+
        '<div class="timeline">'+job.steps.map(function(step,i){return '<div class="tl"><div class="rail"><span class="node"></span>'+(i<job.steps.length-1?'<span class="bar"></span>':'')+'</div><div class="txt"><span>'+esc(step.replace(/^\*/,''))+'</span></div></div>';}).join('')+'</div>'+
        (routes.length?'<h2>Les voies d’accès de ce métier</h2><div class="stack">'+routes.map(function(r){return '<article class="prep"><h3>'+esc(r.name)+'</h3><p>'+esc(r.access+' · '+fpNames(r.fp).join(', '))+'</p>'+ext(r.source,'Consulter les conditions officielles','link-plain')+'</article>';}).join('')+'</div>':'')+
        '<a class="btn mt-m" href="'+prepHref(job)+'">Voir les prépas et les aides</a></main>'+tabbar('metiers');
    }

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

  screens['sans-concours'] = function (jobId) {
    var job=jobById(jobId);
    if(job&&isContractJob(job))return '<main class="screen top-tight">'+back('#/metier/'+job.id,'Métier')+'<span class="eyebrow">Emploi contractuel</span><h1 class="sm">Entrer sans concours</h1><p class="body">'+esc(job.name)+'</p><span class="tag fill cat-CDD contract-label">CDD</span><p class="lead">'+esc(job.access)+'</p><h2>Pour candidater</h2><div class="list steps">'+job.steps.map(function(step,i){return '<div class="list-row static"><span class="num">'+(i+1)+'</span><span class="step-txt">'+esc(step.replace(/^\*/,''))+'</span></div>';}).join('')+'</div><a class="btn outline" href="#/handicap/'+job.id+'">Handicap : accès et aménagements</a>'+ext(D.jobsUrl,'Consulter les offres d’emploi','link-plain')+'</main>'+tabbar('metiers');

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
  /* Organismes de préparation cités par le référentiel : périmètre et source, jamais de classement. */
  function prepaOrganisms(cats) {
    var list=D.prepaOrganisms.filter(function(o){return cats.some(function(c){return new RegExp('(^|[^A-Z+])'+c.replace('+','\\+')+'([^+]|$)').test(o.categories);});});
    if(!list.length)return '';
    return '<div class="ref-orgs"><h3 class="no-icon">Organismes de préparation</h3>'+list.map(function(o){return ext(o.url,o.name+' · '+o.scope,'link-plain');}).join('')+'<p class="small">Liste indicative, sans classement : les résultats publiés par chaque organisme ne sont pas comparables entre eux.</p></div>';
  }
  function preparationContent(job, focus) {
    var on = S.boursier === 'Oui';
    /* Boursier·e : gratuit ou tous budgets ; non boursier·e : frais d’inscription ou tous budgets. */
    var opts = on ? [['0', 'Gratuit'], ['2', 'Tous budgets']] : [['1', 'Frais d’inscription'], ['2', 'Tous budgets']];
    var b = S.prepBudget;
    if (b === null || !opts.some(function (o) { return o[0] === b; })) b = S.budget === 'Gratuit uniquement' || S.budget === 'Frais d’inscription uniquement' ? opts[0][0] : '2';
    var keys = prepKeys(job?[job]:myJobs());
    var nbT = D.talents.filter(function (t) { return talentMatches(t, keys).length; }).length;
    var cats=focus?[focus.cat]:job?jobCategories(job):myJobs().reduce(function(a,j){return a.concat(jobCategories(j));},[]);
    var administrative=!job||/administr|attache|greff|directeur|direction|conservat/.test(norm(job.name))||['Administration','Finances','Diplomatie','Justice','Renseignement','Communication','Citoyens','Inspection'].indexOf(job.domain)>-1;
    /* La préparation conseillée du concours compte aussi : un concours qui cite les IPAG/CPAG ou les IEP les affiche, quel que soit l’intitulé du métier. */
    var refText=(focus?[focus]:job?jobRefs(job):[]).map(prepaText).join(' ');
    var citesIpag=/\bIPAG\b|\bCPAG\b|préparation à l’administration générale/i.test(refText), citesIep=/\bIEP\b|instituts? d’études politiques/i.test(refText);
    var list = D.preps.filter(function (p) {
      if((b!=='2'&&prepBudget(p)!==parseInt(b,10))||p.talents&&!on)return false;
      if(!job)return true;
      if(p.id==='talents')return nbT>0&&cats.some(function(c){return ['A+','A','B'].indexOf(c)>-1;});
      if(p.id==='ipag')return administrative||citesIpag;
      if(p.id==='iep')return citesIep||administrative&&cats.some(function(c){return c==='A'||c==='A+';});
      return true;
    });
    return '<section class="stack mt-l" id="aides"><h2 class="section-heading no-icon">'+I.book+'Aides</h2>' +
      /* Deux blocs carrés côte à côte, à la couleur du concours : pictogramme en haut, intitulé en bas. */
      '<div class="aide-tiles"><a class="aide-tile" href="#/annales'+(job?'/'+job.id:'')+'"><span class="aide-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg></span><span class="aide-t">Annales et rapports de jury</span></a>' +
      '<a class="aide-tile" href="#/bibliographie'+(job?'/'+job.id:'')+'"><span class="aide-ico" aria-hidden="true">'+I.book+'</span><span class="aide-t">Recommandations bibliographiques</span></a></div></section><section class="stack mt-l" id="preparations"><h2 class="section-heading no-icon" id="prep-title" tabindex="-1">'+I.pin+'Prépas</h2>' +
      '<div class="explore-switch bourse-switch" role="group" aria-label="' + (isParent() ? 'Mon enfant est-il boursier ?' : 'Êtes-vous boursier ?') + '" data-on="' + (on ? 0 : 1) + '">' + [['Oui', 'Boursier·e'], ['Non', 'Non boursier·e']].map(function (o) {
        var pressed = (o[0] === 'Oui') === on;
        return '<button type="button" class="' + (pressed ? 'on' : '') + '" aria-pressed="' + pressed + '" data-action="toggleBoursier"' + attr('v', o[0]) + '>' + esc(o[1]) + '</button>';
      }).join('') + '</div>' +
      '<div class="row" role="group" aria-label="Budget">' + opts.map(function (o) { return chip('prepBudget', o[0], o[1], b === o[0], 'blue'); }).join('') + '</div>' +
      (list.length?'':'<p class="empty">Aucune préparation pour ce métier avec ce budget.</p>') + '<div class="stack">' + list.map(function (p) {
        var hi = p.talents && on;
        /* Prépas Talents : nombre de prépas pour le concours, conditions, filet pointillé, bourse, puis le bouton qui ouvre la liste. */
        if (hi) {
          var count = job || S.domains.length ? nbT : D.talents.length;
          return '<div class="prep hi talents-card">' + talentsHero('<span class="talents-pills"><span class="price talents-pill-alt">Recrutement sur dossier</span></span><span class="talents-hero-note">Sous condition de ressources et de mérite</span>') + '<div class="talents-body"><h2 class="sr-only">' + sig(p.t) + '</h2>' +
            '<p class="talents-count"><b>' + count + (count > 1 ? ' Prépas Talents' : ' Prépa Talents') + '</b></p>' +
            /* Conditions vérifiées sur service-public.gouv.fr (A19065) et la fiche d’admission de la DGAFP. */
            '<p>Gratuites. Accès sous conditions de ressources, les mêmes que pour une bourse sur critères sociaux, et de mérite : examen du dossier, puis entretien. Touchez le bouton pour voir les prépas identifiées' + (job ? ' pour ce concours' : S.domains.length ? ' pour ' + (isParent() ? 'ses' : 'vos') + ' choix' : '') + '.</p>' +
            '<div class="talents-perf" aria-hidden="true"></div>' +
            '<div class="talents-bourse"><b>' + (isParent() ? 'Votre enfant reçoit ' : 'Recevez ') + esc(D.talentsGrantLabel || '5 000 €') + ' / an</b><span>Bourse Talents ' + esc(D.talentsGrantYear || '2026-2027') + ', une fois admis en Prépa Talents, en plus de ' + (isParent() ? 'sa' : 'votre') + ' bourse sur critères sociaux. Versée en deux fois, sans démarche.</span></div>' +
            '<a class="btn theme talents-cta" href="#/prepa/' + p.id + (job?'/'+job.id:'') + '">Découvrir les prépas Talents</a></div></div>';
        }
        /* Préparations privées : simple information, sans lien vers une liste d’organismes. */
        if (p.id === 'privees') return '<div class="prep prep-static"><div class="prep-top"><span class="prep-ico" aria-hidden="true">' + I.book + '</span><span class="price price-neutral">' + esc(p.price) + '</span></div><h2 class="h3 no-icon">' + sig(p.t) + '</h2><p>' + esc(p.d) + '</p></div>';
        return '<a class="prep" href="#/prepa/' + p.id + (job?'/'+job.id:'') + '"><div class="prep-top"><span class="prep-ico" aria-hidden="true">' + I.book + '</span><span class="price">' + esc(prepPrice(p)) + '</span></div><h2 class="h3 no-icon">' + sig(p.t) + '</h2>' +
          '<p>' + esc(p.d) + '</p><span class="prep-foot"><span class="more">Voir le détail' + I.chev + '</span></span></a>';
      }).join('') + '</div>' +
      prepaOrganisms(cats) +
      '<a class="link-plain" href="#/handicap'+(job?'/'+job.id:'')+'">Handicap : prévoir les aménagements</a></section>';
   }
  screens.prepas = function () { return screens.concours(); };

  function talentsList(jobFilter) {
    var jobs = jobFilter ? [jobFilter] : myJobs();
    var keys = prepKeys(jobs);
    var everywhere = D.talents.map(function (t) { return { t: t, m: keys.length ? talentMatches(t, keys) : [] }; });
    /* Prépas par région (celles du concours, ou toutes) : nombres affichés dans la liste des régions. */
    var byRegion = { Toutes: 0 };
    everywhere.forEach(function (x) { if (S.talentsAll || !keys.length || x.m.length) { var k = regionOf(x.t.cp); byRegion[k] = (byRegion[k] || 0) + 1; byRegion.Toutes++; } });
    var all = everywhere.filter(function (x) { return inRegion(x.t.cp); });
    var matched = all.filter(function (x) { return x.m.length; }).sort(function (a, b) { return b.m.length - a.m.length; });
    var shown = (S.talentsAll || !keys.length) ? all : matched;
    if (S.location) shown.sort(function (a, b) {
      var da = distanceTo(a.t), db = distanceTo(b.t);
      return da === db ? a.t.name.localeCompare(b.t.name, 'fr') : da - db;
    });
    return { shown: shown, matched: matched.length, total: all.length, hasKeys: keys.length > 0, byRegion: byRegion };
  }

  /* Mini compteur, comme dans l’espace personnel : prépas du concours dans la région, et un lien vers toutes les prépas. */
  function talentsCounter(r, scope) {
    var mine = r.hasKeys && !S.talentsAll, n = mine ? r.matched : r.total;
    var link = !r.hasKeys || r.matched === r.total ? '' : S.talentsAll
      ? '<button type="button" class="text-btn talents-all"' + attr('action', 'talentsAll') + attr('v', 'mine') + '>Afficher seulement celles ' + esc(scope) + ' (' + r.matched + ')</button>'
      : '<button type="button" class="text-btn talents-all"' + attr('action', 'talentsAll') + attr('v', 'all') + '>Afficher les ' + r.total + '</button>';
    return '<div class="talents-counter"><span class="home-tile home-count' + countSize(n) + '">' + n + '</span><span class="talents-counter-copy"><b>' + (n > 1 ? 'Prépas Talents' : 'Prépa Talents') + '</b><span>' +
      esc((mine ? scope : 'au total') + (S.region === 'Toutes' ? ', dans toute la France' : ', ' + regionName(S.region))) + '</span></span></div>' + link;
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
        (/^IEP\b/.test(t.name) ? '<span class="meta">Institut d’études politiques (Sciences Po)</span>' : '') +
        '<span class="meta">' + esc(t.city + ' · ' + REG[reg]) + (t.online ? ' · en ligne' : '') + '</span>' +
        (S.location ? '<span class="meta">' + (t.online ? 'À distance' : (Number.isFinite(distance) ? 'Environ ' + Math.round(distance) + ' km à vol d’oiseau' : 'Distance indisponible')) + '</span>' : '') +
        '<span class="meta long">' + (x.m.length ? '<b class="ok">Prépare : </b>' : 'Concours : ') + esc(conc.slice(0, 3).join(', ')) + esc(extra) + '</span>' +
        '</div></div>';
    }).join('');
  }

  /* IPAG, CPAG et IEP : même présentation que les Prépas Talents (carte, compteur, tri par distance), avec les tarifs. */
  function schoolList(kind) {
    var all = D[kind] || [], byRegion = { Toutes: all.length };
    all.forEach(function (x) { var k = regionOf(x.dep); byRegion[k] = (byRegion[k] || 0) + 1; });
    var shown = all.filter(function (x) { return inRegion(x.dep); });
    if (S.location) shown = shown.slice().sort(function (a, b) { var da = distanceTo(a), db = distanceTo(b); return da === db ? a.name.localeCompare(b.name, 'fr') : da - db; });
    return { shown: shown, byRegion: byRegion };
  }
  function schoolRow(x) {
    var online = /en ligne|à distance/i.test(x.name + ' ' + (x.note || '')), distance = online ? Infinity : distanceTo(x), fees = x.fees || [];
    return '<div class="list-row static top"><span class="pin-ico" aria-hidden="true">' + I.pin + '</span><div class="main">' +
      '<span class="name sm">' + esc(x.name) + '</span>' +
      '<span class="meta">' + esc(x.city + ' · ' + REG[regionOf(x.dep)]) + (online ? ' · en ligne' : '') + '</span>' +
      (S.location ? '<span class="meta">' + (online ? 'À distance' : (Number.isFinite(distance) ? 'Environ ' + Math.round(distance) + ' km à vol d’oiseau' : 'Distance indisponible')) + '</span>' : '') +
      (x.note ? '<span class="meta long">' + esc(x.note) + '</span>' : '') +
      '<div class="school-fees">' + (fees.length
        ? '<p class="school-fees-title">Tarifs' + (x.feesYear ? ' ' + esc(x.feesYear) : '') + '</p><ul>' + fees.map(function (f) {
            return '<li><span>' + esc(f.offer) + '</span><b>' + esc(f.amount) + '</b>' + (f.note ? '<small>' + esc(f.note) + '</small>' : '') + '</li>';
          }).join('') + '</ul>' + (x.boursiers ? '<p class="school-fees-note">Boursiers et boursières : ' + esc(x.boursiers) + '</p>' : '')
        : '<p class="school-fees-note">Tarif non publié en ligne : à demander à l’établissement.</p>') +
      (x.feesSource ? ext(x.feesSource, 'Voir les tarifs sur le site', 'link-plain') : '') + '</div>' +
      '</div></div>';
  }
  /* Droits nationaux des universités : le socle des IPAG ; les boursiers en sont exonérés. */
  function uniFeesNote() {
    var u = D.uniFees; if (!u) return '';
    var parts = []; if (u.licence) parts.push('licence ' + u.licence + ' €'); if (u.master) parts.push('master ' + u.master + ' €');
    return '<div class="school-uni"><p><b>À l’université, en ' + esc(u.year) + ' :</b> ' + esc(parts.join(', ')) + ' par an' + (u.cvec ? ', plus ' + u.cvec + ' € de contribution vie étudiante (CVEC)' : '') + '.</p>' +
      '<p>Les boursiers et boursières sont exonérés de ces droits et de la CVEC. Certaines préparations aux concours ajoutent un tarif propre, indiqué pour chaque établissement.</p></div>';
  }
  screens.prepa = function (id, arg2) {
    var contextJob=jobById(arg2);
    var p = D.preps.filter(function (x) { return x.id === id; })[0];
    /* Préparations privées : pas de liste d’organismes payants pour l’instant (partenariats à venir), la page renvoie vers Se préparer. */
    if (!p || id==='privees' || (id==='talents' && S.boursier!=='Oui')) return contextJob?screens.preparer(contextJob.id):screens.prepas();
    var head = '<main class="screen top-tight">' + back(contextJob?prepHref(contextJob):'#/prepas',contextJob?'Se préparer':'Prépas') +
      '<h1 class="sm">' + sig(p.t) + '</h1>';
    var foot = '</main>' + tabbar(contextJob?'metiers':'prepas');

    if (id === 'talents') {
      var job = arg2 ? D.jobs.filter(function (j) { return j.id === arg2; })[0] : null;
      var r = talentsList(job);
      var scope = job ? 'pour ce concours' : (S.domains.length ? 'pour ' + (isParent() ? 'ses' : 'vos') + ' choix' : '');
      return '<main class="screen top-tight">'+back(contextJob?prepHref(contextJob):'#/concours',contextJob?'Se préparer':'Informations générales')+
        talentsFeature('Prépas Talents','<p>Préparations gratuites, avec tutorat, aux concours A, A+ et B. Elles ont lieu dans des universités, des écoles du service public et des IEP, les instituts d’études politiques (Sciences Po).</p>','h1','talents-flat') +
        '<section class="region-zone" aria-labelledby="region-title"><h2 class="region-title no-icon" id="region-title">Région</h2>' + regionMap() + regionField() +
        talentsCounter(r, scope || 'pour ' + (isParent() ? 'ses' : 'vos') + ' choix') + '</section>' +
        (r.shown.length ? '<div class="talents-order"><p>' + (S.location ? 'Affichage de la prépa la plus proche à la plus éloignée.' : 'Ajoutez votre localisation pour afficher les prépas de la plus proche à la plus éloignée.') + '</p>' +
          '<a class="talents-locate" href="#/moi" data-action="addLocation">' + (S.location ? 'Modifier ma localisation' : 'Ajouter ma localisation') + '</a></div>' : '') +
        '<div class="list" id="talents">' + talentsRows(r) + '</div>' +
        '<p class="small m0">Source : fonction-publique.gouv.fr, liste consultée le 15/10/2026.</p>' + foot;
    }
    if (id === 'ipag' || id === 'iep') {
      var sl = schoolList(id), what = id === 'ipag' ? ['IPAG ou CPAG', 'IPAG et CPAG'] : ['établissement', 'établissements'];
      return head +
        (id === 'ipag'
          ? '<p class="body">Rattachés aux universités (IPAG) ou aux IEP (CPAG). Ils préparent aux concours A+, A, B et C, et délivrent la licence et le master d’administration publique.</p>' +
            '<div class="checks"><div>' + I.check + '<span>Licence d’administration publique : accès avec un Bac+2</span></div><div>' + I.check + '<span>Master 1 avec un Bac+3, master 2 avec un Bac+4</span></div><div>' + I.check + '<span>Préparations aux concours, y compris internes</span></div></div>'
          : '<p class="body">Les Instituts d’études politiques et les universités délivrent des masters d’administration publique et préparent aux concours A et A+.</p>') +
        uniFeesNote() +
        '<section class="region-zone" aria-labelledby="region-title"><h2 class="region-title no-icon" id="region-title">Région</h2>' + regionMap() + regionField() +
        '<div class="talents-counter"><span class="home-tile home-count' + countSize(sl.shown.length) + '">' + sl.shown.length + '</span><span class="talents-counter-copy"><b>' + esc(sl.shown.length > 1 ? what[1] : what[0]) + '</b><span>' +
          esc(S.region === 'Toutes' ? 'Dans toute la France' : regionName(S.region)) + '</span></span></div></section>' +
        (sl.shown.length ? '<div class="talents-order"><p>' + (S.location ? 'Affichage du plus proche au plus éloigné.' : 'Ajoutez votre localisation pour afficher les établissements du plus proche au plus éloigné.') + '</p>' +
          '<a class="talents-locate" href="#/moi" data-action="addLocation">' + (S.location ? 'Modifier ma localisation' : 'Ajouter ma localisation') + '</a></div>' : '') +
        '<div class="list" id="schools">' + (sl.shown.length ? sl.shown.map(schoolRow).join('') : '<p class="empty">' + (id === 'ipag' ? 'Aucun IPAG ou CPAG dans cette région. Pensez à la formation à distance.' : 'Aucun établissement listé dans cette région.') + '</p>') + '</div>' +
        (id === 'ipag' ? ext(D.ipagUrl, 'Trouver un IPAG ou un CPAG') + ext(D.ipagDistanceUrl, 'Licence et master à distance (CNED et IPAG de Poitiers)', 'btn outline') : '') +
        '<p class="small m0">Tarifs relevés sur le site de chaque établissement' + (D.feesChecked ? ' le ' + esc(D.feesChecked) : '') + ' : l’établissement fait foi.</p>' + foot;
    }
  };

  var RESOURCE_KINDS = {annales:'Annales officielles',sujet:'Sujet',rapport:'Rapport de jury',copie:'Meilleure copie',entrainement:'Entraînement',annuaire:'Collection d’annales',bibliographie:'Bibliographie'};
  function studyMatches(r, job) {
    if(!job)return true;
    if(!r.categories.some(function(c){return jobCategories(job).indexOf(c)>-1;})||!r.fps.some(function(f){return job.fp.indexOf(f)>-1;}))return false;
    var routes=[job.id].concat(jobRoutes(job).map(function(r){return r.id;}));
    /* Une collection d’un ministère sans concours rattaché n’est pas une annale de ce métier ; les portails nationaux restent. */
    return r.routeIds.length?r.routeIds.some(function(id){return routes.indexOf(id)>-1;}):r.scope==='directory'&&r.sourceName!=='Annuaire DGAFP';
  }
  function studyResources(job, bibliography, applyFilters) {
    var q=norm(S.resQ);
    return D.studyResources.filter(function(r){
      if((r.kind==='bibliographie')!==!!bibliography||!studyMatches(r,job))return false;
      if(!applyFilters)return true;
      var cats=resCatsSel(),fps=resFpsSel();
      return (job||cats.length===4||r.categories.some(function(c){return cats.indexOf(c)>-1;}))&&
        (fps.length===3||r.fps.some(function(f){return fps.indexOf(f)>-1;}))&&
        (S.resKind==='Tous'||r.kind===S.resKind)&&
        (S.resYear==='Toutes'||r.year===S.resYear)&&
        (!q||norm(r.title+' '+r.concours+' '+r.sourceName+' '+r.year).indexOf(q)>-1);
    });
  }
  function resourceRows(list, directories) {
    return list.map(function(r){return '<a class="study-card external-link" href="'+esc(r.url)+'" target="_blank" rel="noopener"><div class="study-meta"><span class="tag">'+esc(RESOURCE_KINDS[r.kind])+'</span>'+(r.year?'<span class="tag">'+esc(r.year)+'</span>':'')+'</div><h3 class="no-icon">'+esc(r.title)+'</h3>'+(r.concours?'<p>'+esc(r.concours)+'</p>':'')+'<p class="small">'+esc(r.sourceName+' · '+r.fps.map(function(f){return D.fps[f];}).join(', '))+'</p>'+(r.note?'<p class="small">'+esc(r.note)+'</p>':'')+'<span class="study-open">'+(directories?'Consulter la source':'Consulter le document')+I.chev+'</span></a>';}).join('');
  }
  function studyResults(job, bibliography) {
    var all=studyResources(job,bibliography,true),docs=all.filter(function(r){return r.scope!=='directory'&&r.kind!=='annales';}),directories=all.filter(function(r){return r.scope==='directory'||r.kind==='annales';});
    /* Annales : les collections officielles du concours d’abord, puis les documents à l’unité. */
    if(!bibliography){
      directories.sort(function(a,b){return (b.kind==='annales')-(a.kind==='annales');});
      return '<p class="small" role="status">'+directories.length+' collection'+(directories.length>1?'s':'')+' officielle'+(directories.length>1?'s':'')+' · '+docs.length+' document'+(docs.length>1?'s':'')+'</p>'+
        (directories.length?'<h2 class="mt-s no-icon">Annales officielles du concours</h2><div class="study-list">'+resourceRows(directories,true)+'</div>':'')+
        '<h2 class="mt-m no-icon">Sujets, copies et rapports de jury</h2>'+
        (docs.length?'<div class="study-list">'+resourceRows(docs.slice(0,S.resLimit),false)+'</div>'+(docs.length>S.resLimit?'<button type="button" class="btn outline" data-action="moreResources">Afficher 40 documents de plus</button>':''):'<p class="empty">Aucun document à l’unité avec ces critères.</p>');
    }
    return '<p class="small" role="status">'+docs.length+' document'+(docs.length>1?'s':'')+' · '+directories.length+' source'+(directories.length>1?'s':'')+' documentaire'+(directories.length>1?'s':'')+'</p>'+
      (docs.length?'<div class="study-list">'+resourceRows(docs.slice(0,S.resLimit),false)+'</div>'+(docs.length>S.resLimit?'<button type="button" class="btn outline" data-action="moreResources">Afficher 40 documents de plus</button>':''):'<p class="empty">Aucun document indexé avec ces critères.</p><button type="button" class="text-btn" data-action="resetResources">Réinitialiser les filtres</button>')+
      (directories.length?'<h2 class="mt-m no-icon">Consulter les collections complètes</h2><div class="study-list">'+resourceRows(directories,true)+'</div>':'');
  }
  /* Annales et bibliographies des concours : plusieurs catégories et versants possibles, comme dans l’Explorer. */
  function resCatsSel(){return Array.isArray(S.resCats)&&S.resCats.length?CAL_CATS.filter(function(c){return S.resCats.indexOf(c)>-1;}):S.resCat&&S.resCat!=='Toutes'?[S.resCat]:CAL_CATS.slice();}
  function resFpsSel(){return Array.isArray(S.resFps)&&S.resFps.length?ALL_FPS.filter(function(f){return S.resFps.indexOf(f)>-1;}):S.resFp&&S.resFp!=='Tous'?[S.resFp]:ALL_FPS.slice();}
  function resYears(job,bibliography){var years=[];studyResources(job,bibliography,false).forEach(function(r){if(r.year&&years.indexOf(r.year)<0)years.push(r.year);});return years.sort().reverse();}
  function studyCount(job,bibliography){var all=studyResources(job,bibliography,true);return all.length;}
  function studyFilters(job,bibliography) {
    var fpsAll=job?ALL_FPS.filter(function(f){return job.fp.indexOf(f)>-1;}):ALL_FPS,n=studyCount(job,bibliography);
    return (job?'<p class="body">'+esc(job.name)+'</p><p class="small">'+esc(jobCategories(job).join(', ')+' · '+fpNames(job.fp).join(', '))+'</p>':
      '<section class="stack"><h3>Catégories</h3><p class="small m0">Choisissez une ou plusieurs catégories.</p><div class="row" role="group" aria-label="Catégories">'+CAL_CATS.map(function(c){return chip('resCats',c,c,resCatsSel().indexOf(c)>-1);}).join('')+'</div></section>')+
      (fpsAll.length>1?'<section class="stack mt-m"><h3>Versants</h3><div class="row" role="group" aria-label="Versants">'+fpsAll.map(function(f){return chip('resFps',f,D.fps[f],resFpsSel().indexOf(f)>-1);}).join('')+'</div></section>':'')+
      (!bibliography?'<section class="stack mt-m"><h3>Type de document</h3><div class="row" role="group" aria-label="Type de document">'+['Tous','sujet','rapport','copie','entrainement','annuaire'].map(function(k){return chip('resKind',k,k==='Tous'?'Tous les documents':RESOURCE_KINDS[k],S.resKind===k);}).join('')+'</div></section>':'')+
      '<section class="stack mt-m"><h3>Session ou année d’édition</h3><div class="row" role="group" aria-label="Session ou année d’édition">'+['Toutes'].concat(resYears(job,bibliography)).map(function(y){return chip('resYear',y,y==='Toutes'?'Toutes les années':y,S.resYear===y);}).join('')+'</div></section>'+
      '<button type="button" class="text-btn mt-m" data-action="resetResources">Réinitialiser les filtres</button><div class="sheet-actions"><button type="button" class="btn" data-ui="close">Afficher '+(n?n+' résultat'+(n>1?'s':''):'les résultats')+'</button></div>';
  }
  function studySummary(job,bibliography){
    var cats=job?jobCategories(job).filter(function(c){return CAL_CATS.indexOf(c)>-1;}):resCatsSel(),fps=resFpsSel().filter(function(f){return !job||job.fp.indexOf(f)>-1;});
    function pill(text,cls){return '<button type="button" class="tag tag-btn'+(cls||'')+'" data-action="resourceFilters" aria-haspopup="dialog" aria-label="'+esc(text)+' : modifier les filtres">'+esc(text)+'</button>';}
    var catLabel=!job&&cats.length===4?'Toutes catégories':cats.length===1?'Catégorie '+cats[0]:cats.slice(0,-1).join(', ')+' et '+cats[cats.length-1];
    return (cats.length?pill(catLabel,cats.length===1?' fill '+catClass(cats[0]):''):'')+pill(fps.length===3?'3 versants':fps.map(function(f){return D.fps[f];}).join(', '))+
      (!bibliography?pill(S.resKind==='Tous'?'Tous les documents':RESOURCE_KINDS[S.resKind]):'')+pill(S.resYear==='Toutes'?'Toutes les années':S.resYear);
  }
  function studyScreen(jobId,bibliography) {
    var job=jobById(jobId),title=bibliography?'Bibliographies des concours':'Annales et rapports de jury';
    if(job&&isContractJob(job))return screens['sans-concours'](job.id);
    /* Même présentation que l’Explorer : titre et réglages, pastilles grises des filtres, recherche, puis les cards. */
    return '<main class="screen pt study-screen">'+back(bibliography?'#/bibliographie'+(job?'/'+job.id:''):job?prepHref(job):'#/concours',bibliography?'Bibliographie':job?'Se préparer':'Informations générales')+
      '<div class="title-row"><h1>'+title+'</h1><button id="filters-open" type="button" class="icon-btn" data-action="resourceFilters" aria-haspopup="dialog" aria-label="Filtrer les ressources">'+I.settings+'</button></div>'+
      (job?'<p class="body m0">'+esc(job.name)+'</p>':'')+
      '<div class="row filter-summary" aria-label="Filtres actifs">'+studySummary(job,bibliography)+'</div>'+
      '<div class="search-wrap">'+searchField('res-q','Rechercher un concours ou un document',bibliography?'Rechercher un concours':'Concours, matière ou session',S.resQ)+'</div>'+
      '<div id="study-results">'+studyResults(job,bibliography)+'</div>'+
      '<p class="small mt-m">'+(bibliography?'Sélections de lecture et catalogues publiés par les organismes de concours et leurs bibliothèques.':'Sujets, copies et rapports publiés par les organisateurs. Les anciens sujets peuvent correspondre à des épreuves modifiées depuis : vérifiez le programme de la session préparée.')+'</p></main>'+tabbar(job?'metiers':'concours');
  }
  screens.annales=function(jobId){return studyScreen(jobId,false);};
  screens['ressources-biblio']=function(jobId){return studyScreen(jobId,true);};

  function bibliographyCategory(job) {
    if(job){var cats=jobCategories(job).filter(function(c){return ['A+','A','B','C'].indexOf(c)>-1;});return cats.indexOf(S.bookCategory)>-1?S.bookCategory:cats[0]||null;}
    return ['A+','A','B','C'].indexOf(S.bookCategory)>-1?S.bookCategory:'A';
  }
  /* Bibliographie : plusieurs catégories possibles ; sans choix, la catégorie du métier (ou A). */
  function bookCats(job) {
    var allowed = job ? jobCategories(job).filter(function (c) { return CAL_CATS.indexOf(c) > -1; }) : CAL_CATS;
    var picked = Array.isArray(S.bookCats) ? CAL_CATS.filter(function (c) { return S.bookCats.indexOf(c) > -1 && allowed.indexOf(c) > -1; }) : [];
    if (picked.length) return picked;
    var one = bibliographyCategory(job); return one ? [one] : [];
  }
  function categoryBooks(job) {
    var bcats=bookCats(job),category=bcats[0]||null,routeIds=job?[job.id].concat(jobRoutes(job).map(function(r){return r.id;})):[],available=D.books.filter(function(b){return bcats.some(function(category){return !b.categories?['A','A+'].indexOf(category)>-1:b.categories.indexOf(category)>-1;})&&(!b.fps||!b.fps.length||b.fps.some(function(f){return job?job.fp.indexOf(f)>-1:S.bookFp==='Tous'||S.bookFp===f;}))&&(!job||!b.routeIds||!b.routeIds.length||b.routeIds.some(function(id){return routeIds.indexOf(id)>-1;}));}),replaced={};
    if(bcats.indexOf('A+')<0)available.forEach(function(b){(b.replaces||[]).forEach(function(id){replaced[id]=true;});});
    // Les éditions de la sélection A sont prioritaires ; le fonds INSP reste intact pour A+.
    return available.filter(function(b){return !replaced[b.id];}).sort(function(a,b){return Number(b.id.indexOf('vp-book-')===0)-Number(a.id.indexOf('vp-book-')===0);});
  }
  function bookList(job) {
    var q=norm(S.bookQ),list=categoryBooks(job).filter(function(b){return (S.bookSubject==='Toutes'||b.subjects.indexOf(S.bookSubject)>-1)&&(!q||norm(b.title+' '+b.authors).indexOf(q)>-1);});
    return '<p class="small" role="status">' + list.length + ' ouvrage' + (list.length>1?'s':'') + '</p><div class="book-list">' + (list.length?list.map(function(b){
      var title=b.title.split(' : ')[0];
      var body=(b.coverUrl||b.cover?'<img src="' + esc(b.coverUrl||b.cover) + '" alt="Couverture de ' + esc(b.title) + '"' + (/^data:/.test(b.coverUrl||b.cover)?'':' loading="lazy"') + ' width="66" height="92">':'<span class="book-cover-placeholder" aria-hidden="true">'+I.book+'</span>')+'<div><h2 class="book-title">' + esc(title) + '</h2><p>' + esc(b.authors) + '</p></div>';
      /* La carte n’est pas cliquable : seul le titre mène à la notice de l’ouvrage. */
      if(b.url)body=body.replace('<h2 class="book-title">' + esc(title) + '</h2>','<h2 class="book-title"><a href="' + esc(b.url) + '" target="_blank" rel="noopener">' + esc(title) + '</a></h2>');
      return '<article class="book-card" title="' + esc(b.title) + '">' + body + '</article>';
    }).join(''):'<p class="empty">Aucun ouvrage avec ces critères.</p>') + '</div>';
  }
  function bookSubjects(job){var subjects=[];categoryBooks(job).forEach(function(b){b.subjects.forEach(function(t){if(subjects.indexOf(t)<0)subjects.push(t);});});return subjects;}
  function bookFilters(job) {
    var picked=bookCats(job),cats=job?jobCategories(job).filter(function(c){return CAL_CATS.indexOf(c)>-1;}):CAL_CATS,subjects=bookSubjects(job);
    var n=categoryBooks(job).filter(function(b){return S.bookSubject==='Toutes'||b.subjects.indexOf(S.bookSubject)>-1;}).length;
    return (cats.length>1?'<section class="stack"><h3>Catégories</h3><p class="small m0">Choisissez une ou plusieurs catégories.</p><div class="row" role="group" aria-label="Catégories des ouvrages">'+cats.map(function(c){return chip('bookCategory',c,c,picked.indexOf(c)>-1);}).join('')+'</div></section>':'')+
      (subjects.length?'<section class="stack mt-m"><h3>Thématique</h3><div class="row" role="group" aria-label="Thématique">'+['Toutes'].concat(subjects).map(function(t){return chip('bookSubject',t,t==='Toutes'?'Toutes les thématiques':t,S.bookSubject===t);}).join('')+'</div></section>':'')+
      '<div class="sheet-actions"><button type="button" class="btn" data-ui="close">Afficher '+(n?n+' ouvrage'+(n>1?'s':''):'les résultats')+'</button></div>';
  }
  screens.bibliographie = function (jobId) {
    var job=jobById(jobId);if(job&&isContractJob(job))return screens['sans-concours'](job.id);
    var bcats=bookCats(job),category=bcats[0]||null,subjects=bookSubjects(job),cats=job?jobCategories(job).filter(function(c){return CAL_CATS.indexOf(c)>-1;}):CAL_CATS;
    if(subjects.indexOf(S.bookSubject)<0)S.bookSubject='Toutes';
    var filterable=cats.length>1||subjects.length>0;
    function pill(text,cls){return filterable?'<button type="button" class="tag tag-btn'+(cls||'')+'" data-action="openBookFilters" aria-haspopup="dialog" aria-label="'+esc(text)+' : modifier les filtres">'+esc(text)+'</button>':'<span class="tag'+(cls||'')+'">'+esc(text)+'</span>';}
    /* Même présentation que l’Explorer : titre et réglages, pastilles grises, recherche, puis les ouvrages. */
    return '<main class="screen pt biblio-screen">' + back(job?prepHref(job):'#/concours/prepas',job?'Se préparer':'Informations générales') +
      '<div class="title-row"><h1>Bibliographie</h1>'+(filterable?'<button id="filters-open" type="button" class="icon-btn" data-action="openBookFilters" aria-haspopup="dialog" aria-label="Filtrer les ouvrages">'+I.settings+'</button>':'')+'</div>' +
      (job?'<p class="body m0">'+esc(job.name)+'</p>':'') +
      '<div class="row filter-summary" aria-label="Filtres actifs">'+pill(!bcats.length?'Catégorie à préciser':bcats.length===1?'Catégorie '+bcats[0]:bcats.slice(0,-1).join(', ')+' et '+bcats[bcats.length-1],bcats.length===1?' fill '+catClass(bcats[0]):'')+(subjects.length?pill(S.bookSubject==='Toutes'?'Toutes les thématiques':S.bookSubject):'')+'</div>' +
      (categoryBooks(job).length?'<div class="search-wrap">'+searchField('book-q','Rechercher un titre ou un auteur','Rechercher un titre ou un auteur',S.bookQ)+'</div>':'') +
      '<div id="books">' + (categoryBooks(job).length?bookList(job):'<p class="small">'+(category?'Les listes de titres et d’auteurs des concours de catégorie '+esc(category)+' figurent dans les bibliographies des organismes.':'Identifiez d’abord le corps et le concours correspondant à l’offre.')+'</p>') + '</div>' +
      '<a class="btn outline mt-m" href="#/ressources-biblio'+(job?'/'+job.id:'')+'">'+I.book+'Bibliographies des concours</a>' +
      '<p class="small mt-m">'+(bcats.indexOf('A')>-1?'Lectures générales : sélections INSP et Vie-publique. ':bcats.indexOf('A+')>-1?'Lectures générales : sélection de l’INSP. ':'')+'Ces lectures ne remplacent pas le programme du concours.</p>' + (bcats.some(function(c){return ['A','A+'].indexOf(c)>-1;})?ext(D.bookSource.url,'Consulter la sélection INSP','link-plain'):'') +
      (category==='A'?ext('https://www.vie-publique.fr/catalogue/293178-selection-douvrages-preparation-aux-concours-administratifs','Consulter la sélection Vie-publique','link-plain mt-s'):'') + '</main>' + tabbar(job?'metiers':'concours');
  };

  screens.handicap = function (jobId) {
    var job=jobById(jobId);
    return '<main class="screen top-tight">' + back(job?prepHref(job):'#/concours',job?(isContractJob(job)?'Entrer sans concours':'Se préparer'):'Concours') +
      '<span class="eyebrow">Être accompagné·e</span><h1 class="sm">Handicap : accès et aménagements</h1>' +
      '<div class="prose"><p>Vous pouvez demander des adaptations des épreuves. Il existe aussi une voie de recrutement spécifique, sous conditions.</p>' +
      '<h2>Adapter les épreuves</h2><p>Du temps supplémentaire, des pauses ou une aide humaine ou technique peuvent être prévus selon vos besoins.</p>' +
      '<p>Contactez le service qui organise le concours avant la date limite indiquée dans l’avis. Le certificat d’un médecin agréé doit être établi moins de six mois avant les épreuves.</p>' +
      '<h2>Un recrutement par contrat</h2><p>Certains bénéficiaires de l’obligation d’emploi peuvent être recrutés par un contrat spécifique en catégorie A, B ou C. Les conditions de diplôme restent à remplir.</p>' +
      '<p>Ce contrat peut conduire à une titularisation après évaluation des aptitudes. Elle n’est pas automatique.</p>' +
      '<h2>Préparer votre démarche</h2><p>Demandez les modalités au service recruteur ou à son référent handicap. Vous n’avez aucune information de santé à renseigner dans cette application.</p></div>' +
      ext('https://www.service-public.gouv.fr/particuliers/vosdroits/F430', 'Vérifier les démarches sur Service Public') +
      '<a class="btn outline" href="#/accessibilite">Adapter la lecture de l’application</a></main>' + tabbar(job?'metiers':'concours');
  };


  /* ---------- Profil et informations légales ---------- */
  var PROFILE_LABEL = { etu: 'Étudiant·e', par: 'Parent', rec: 'En reconversion' };

  var PROFILE_FIELDS = { profile: 'Profil', level: 'Niveau d’études', domains: 'Domaines', defis: 'Votre défi', agentPublic: 'Déjà dans la fonction publique', experience: 'Expérience', traits: 'Ce qui vous ressemble', boursier: 'Boursier·e', budget: 'Budget pour se préparer' };
  /* Fenêtre de modification : uniquement les options du point choisi. */
  function profileFieldContent(field) {
    var body = '';
    if (field === 'profile') body = '<div class="stack">' + [['etu', 'Étudiant·e'], ['par', 'Parent'], ['rec', 'En reconversion']].map(function (p) { var on = S.profile === p[0]; return '<button type="button" class="opt' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', 'profile') + attr('v', p[0]) + '><span>' + p[1] + '</span>' + (on ? I.check : '') + '</button>'; }).join('') + '</div>';
    if (field === 'level') body = '<div class="row">' + (S.profile === 'rec' ? D.levels.adult : D.levels.school).map(function (l) { return chip('level', l, l, S.level === l); }).join('') + '</div>';
    if (field === 'domains') body = '<div class="grid-2 interest-grid">' + D.domains.map(function (d) { var on = S.domains.indexOf(d) > -1; return '<button type="button" class="interest-option' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', 'domain') + attr('v', d) + '><span class="interest-name">' + esc(domainLabel(d)) + '</span><span class="interest-check" aria-hidden="true">' + (on ? I.check : '') + '</span></button>'; }).join('') + '</div>';
    if (field === 'traits') body = D.traitGroups.map(function (g) { return '<section class="stack mt-s"><h3 class="no-icon">' + esc(g.title) + '</h3><div class="row">' + g.items.map(function (t) { return chip('trait', t[0], t[1], S.traits.indexOf(t[0]) > -1); }).join('') + '</div></section>'; }).join('');
    if (field === 'ambitions') body = '<p class="small m0">Deux choix au plus.</p>' + ambitionOptions();
    if (field === 'defis') body = '<p class="small m0">Trois choix au plus. Vos réponses trient les catégories de concours proposées.</p>' + defiOptions();
    if (field === 'agentPublic' || field === 'experience') { var rq = RECO_QUESTIONS.filter(function (q) { return q[0] === field; })[0]; body = '<p class="body">' + esc(rq[1]) + '</p><p class="small">' + esc(rq[2]) + '</p><div class="grid-2">' + ['Oui', 'Non'].map(function (v) { var on = S[field] === v; return '<button type="button" class="opt sm center' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', field) + attr('v', v) + '>' + v + '</button>'; }).join('') + '</div>'; }
    if (field === 'boursier') body = '<div class="grid-2">' + ['Oui', 'Non'].map(function (v) { var on = S.boursier === v; return '<button type="button" class="opt sm center' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', 'boursier') + attr('v', v) + '>' + v + '</button>'; }).join('') + '</div>';
    if (field === 'budget') body = '<div class="stack">' + budgetOptions(S.boursier).map(function (b) { var on = S.budget === b; return '<button type="button" class="opt sm' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', 'budget') + attr('v', b) + '><span>' + b + '</span>' + (on ? I.check : '') + '</button>'; }).join('') + '</div>';
    return body + '<div class="sheet-actions"><button type="button" class="btn" data-ui="close">Fermer</button></div>';
  }
  screens.moi = function () {
    if(isParent()&&!activeChild())return '<main class="screen pt"><h1>Vos profils</h1><p class="body">Aucun profil enfant pour le moment.</p><button type="button" class="btn" data-action="addChild">Ajouter un profil</button><button type="button" class="danger-link" data-action="wipe">Effacer mes données</button></main>'+tabbar('moi');
    var rows = [
      ['Profil', S.profile ? PROFILE_LABEL[S.profile] : 'Non renseigné'],
      [isParent() ? 'Niveau de votre enfant' : 'Niveau', S.level || 'Non renseigné'],
      ['Domaines', S.domains.length ? S.domains.map(domainLabel).join(', ') : 'Tous'],
      [isParent() ? 'Son défi' : 'Votre défi', S.defis.length ? S.defis.map(function (d) { return (DEFIS.filter(function (x) { return x[0] === d; })[0] || ['', d])[1]; }).join(', ') : 'Non renseigné'],
      [isParent() ? 'Ce qui lui ressemble' : 'Ce qui vous ressemble', S.traits.length ? S.traits.map(traitLabel).join(', ') : 'Non renseigné'],
      ['Boursier·e', S.boursier || 'Non renseigné'],
      ['Budget', S.budget || 'Non renseigné']
    ].concat(S.profile === 'rec' ? [['Déjà dans la fonction publique', S.agentPublic || 'Non renseigné'], ['Expérience professionnelle, associative ou d’élu', S.experience || 'Non renseigné']] : []);
    var rowFields = ['profile', 'level', 'domains', 'defis', 'traits', 'boursier', 'budget', 'agentPublic', 'experience'];
    return '<main class="screen pt">' +
      (profileReturn ? back(profileReturn, 'Prépas Talents') : '') +
      '<h1>' + (isParent() ? 'Le profil de ' + esc(childName()) : 'Votre profil') + '</h1>' + childSelector() +
      '<p class="small m0">Touchez une ligne pour modifier votre réponse.</p>' +
      '<div class="list m0 profile-rows">' + rows.map(function (r, i) {
        return '<button type="button" class="list-row profile-row" data-action="editField"' + attr('v', rowFields[i]) + ' aria-haspopup="dialog"><span class="main"><span class="meta">' + esc(r[0]) + '</span><span class="name sm">' + esc(r[1]) + '</span></span>' + I.chev + '</button>';
      }).join('') + '</div>' +
      locationForm() +
      (isParent()?'<button type="button" class="danger-link" data-action="deleteChild">Effacer ce profil</button>':'<button type="button" class="danger-link" data-action="wipe">Effacer mes données</button>') +
      '<p class="notice">' + I.lock + '<span>Ces informations sont enregistrées uniquement dans ce navigateur. Elles ne sont envoyées à personne.</span></p>' +
      '<div class="list mt-m">' +
      '<a class="list-row" href="#/confidentialite"><div class="main"><span class="name">Données personnelles</span></div>' + I.chev + '</a>' +
      '<a class="list-row" href="#/accessibilite"><div class="main"><span class="name">Accessibilité et confort de lecture</span></div>' + I.chev + '</a>' +
      '<a class="list-row" href="#/mentions"><div class="main"><span class="name">Mentions légales</span></div>' + I.chev + '</a>' +
      '</div></main>' +
      /* Modifications en attente : bouton fixe au-dessus du menu, comme dans l’onboarding. */
      (profileNeedsValidation()?'<div class="footer profile-footer"><button type="button" class="btn" data-action="validateProfile">' + (profileReturn ? 'Terminer et revenir aux Prépas Talents' : 'Terminer les modifications') + '</button></div>':'') + tabbar('moi');
  };

  screens.confidentialite = function () {
    var L = D.legal;
    return '<main class="screen top-tight">' + back('#/moi', 'Profil') +
      '<span class="eyebrow">RGPD</span><h1 class="sm">Données personnelles</h1>' +
      '<div class="prose">' +
      '<p><strong>En bref : vos réponses restent sur votre appareil.</strong> Pas de compte, pas de cookie, pas de mesure d’audience, pas de publicité.</p>' +
      '<h2>Responsable du traitement</h2><p>' + esc(L.publisher) + '. Contact : ' + mail(L.contact) + '.</p>' +
      '<h2>Ce qui est enregistré</h2><ul>' +
      '<li>Le profil (étudiant·e, parent, reconversion) et le niveau d’étude.</li>' +
      '<li>Les domaines et les traits choisis (« Ce qui vous ressemble »), la situation de bourse et le budget indiqués.</li>' +
      '<li>Les réglages d’affichage (filtres, région, confort de lecture).</li>' +
      '<li>Le prénom ou pseudo, les profils enfants, la commune choisie et les métiers favoris.</li></ul>' +
      '<p>Aucune adresse e-mail ni adresse postale précise n’est demandée. Chaque enfant conserve un profil indépendant dans ce navigateur.</p>' +
      '<h2>Où et combien de temps</h2><p>Dans le stockage local de votre navigateur (localStorage), jamais sur un serveur. Ces données restent jusqu’à ce que vous les effaciez, depuis l’onglet Profil ou les réglages de votre navigateur.</p>' +
      '<h2>Pourquoi</h2><p>Uniquement pour adapter les contenus à votre situation. Ce stockage est nécessaire au service demandé : il ne demande pas de consentement.</p>' +
      '<h2>Hébergement</h2><p>L’application est hébergée par ' + esc(L.host) + '. Comme tout hébergeur, il peut enregistrer l’adresse IP des visiteur·ses dans ses journaux techniques, pour la sécurité du service.</p>' +
      '<h2>Liens externes</h2><p>Les liens vers des sites publics (calendrier des concours, offres d’emploi, cartes des prépas) ouvrent ces sites, qui ont leur propre politique de confidentialité.</p>' +
      '<h2>Vos droits</h2><p>Vous pouvez à tout moment consulter, modifier ou effacer vos données depuis l’onglet Profil. Pour toute question, écrivez à ' + mail(L.contact) + '. Vous pouvez aussi saisir la CNIL : ' + ext('https://www.cnil.fr/fr/plaintes', 'cnil.fr', '') + '.</p>' +
      '<p class="small">Mise à jour : ' + esc(L.updated) + '</p>' +
      '</div></main>' + tabbar('moi');
  };

  screens.accessibilite = function () {
    var L = D.legal;
    return '<main class="screen top-tight">' + back('#/moi', 'Profil') +
      '<span class="eyebrow">RGAA</span><h1 class="sm">Déclaration d’accessibilité</h1>' +
      '<section class="stack" aria-label="Confort de lecture"><h2>Confort de lecture</h2>' +
      '<div class="stack color-mode"><h3 class="no-icon">Apparence</h3><div class="row" role="group" aria-label="Apparence">' + [['auto','Comme l’appareil'],['light','Clair'],['dark','Sombre']].map(function(m){return chip('colorMode',m[0],m[1],(S.colorMode||'auto')===m[0]);}).join('') + '</div><p class="small m0">« Comme l’appareil » suit le mode clair ou sombre choisi dans les réglages du téléphone ou de l’ordinateur.</p></div>' +
      ['contrast', 'largeText', 'dysFont'].map(function (key, i) { return '<button type="button" class="switch-row" role="switch" aria-checked="' + !!S[key] + '" data-action="' + key + '"><span>' + ['Contraste renforcé', 'Texte agrandi', 'Police de lecture DYS'][i] + '</span><span class="switch" aria-hidden="true"></span></button>'; }).join('') + '</section>' +
      '<div class="prose">' +
      '<p>' + esc(L.publisher) + ' s’engage à rendre cette application accessible, conformément à l’article 47 de la loi n° 2005-102 du 11 février 2005.</p>' +
      '<h2>État de conformité</h2><p>La conformité RGAA reste à évaluer par un audit complet. Les vérifications réalisées ne permettent pas d’annoncer un taux de conformité.</p>' +
      '<h2>Ce qui est déjà pris en compte</h2><ul>' +
      '<li>Lien d’évitement, titres hiérarchisés et titre de page à chaque écran.</li>' +
      '<li>Navigation complète au clavier, focus visible et conservé après chaque choix.</li>' +
      '<li>État des choix annoncé aux lecteurs d’écran (boutons pressés, blocs dépliés, interrupteur, résultats des filtres).</li>' +
      '<li>Contrastes de texte d’au moins 4,5:1, zones cliquables d’au moins 44 px.</li>' +
      '<li>Informations jamais portées par la couleur seule, liens externes signalés.</li>' +
      '<li>Zoom et agrandissement du texte autorisés, animations réduites si demandé.</li></ul>' +
      '<h2>Établissement de cette déclaration</h2><p>Déclaration établie le ' + esc(L.updated) + ', sur la base d’une auto-évaluation. Technologies : HTML, CSS, JavaScript.</p>' +
      '<h2>Retour d’information et contact</h2><p>Si vous n’arrivez pas à accéder à un contenu ou à un service, écrivez à ' + mail(L.contact) + ' pour être orienté·e vers une alternative accessible.</p>' +
      '<h2>Voies de recours</h2><p>Si vous n’obtenez pas de réponse satisfaisante, vous pouvez saisir le Défenseur des droits : ' + ext('https://formulaire.defenseurdesdroits.fr/', 'formulaire en ligne', '') + ', ou par courrier gratuit, sans affranchissement : Défenseur des droits, Libre réponse 71120, 75342 Paris CEDEX 07.</p>' +
      '</div></main>' + tabbar('moi');
  };

  screens.mentions = function () {
    var L = D.legal;
    return '<main class="screen top-tight">' + back('#/moi', 'Profil') +
      '<span class="eyebrow">Informations</span><h1 class="sm">Mentions légales</h1>' +
      '<div class="prose">' +
      '<h2 class="no-icon">Éditeur</h2><p>' + esc(L.publisher) + '<br>' + mail(L.contact) + '</p><p>' + esc(L.design) + '<br>' + mail(L.designContact) + '</p>' +
      '<h2 class="no-icon">Direction de la publication</h2><p>' + esc(L.director) + '</p><p>' + esc(L.design) + '</p>' +
      '<h2 class="no-icon">Conception</h2><p>' + esc(L.publisher) + '</p><p>' + esc(L.design) + '</p>' +
      '<h2 class="no-icon">Hébergement</h2><p>' + esc(L.host) + ', ' + esc(L.hostAddress) + '</p>' +
      '<h2 class="no-icon">Sources</h2><p>Chaque session renvoie à son avis officiel. Les catégories observées dans les offres ne constituent pas une condition de diplôme.</p>' + (D.catalogSources || []).map(function (s) { return '<p>' + ext(s.url, s.name, 'link-plain') + '<span class="small">Vérifié le ' + esc(s.checked) + ' · ' + esc(s.note) + '</span></p>'; }).join('') +
      '<h2 class="no-icon">Polices de caractères</h2><p>Geologica et OpenDyslexic, sous licence SIL Open Font License, sont hébergées avec l’application.</p>' +
      '</div></main>' + tabbar('moi');
  };

  /* ---------- Routeur ---------- */
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/');
    return { name: parts[0] || (S.done ? 'accueil' : (S.introSeen ? (S.profile?'profil':'choix-profil') : 'bienvenue')), arg: parts[1], arg2: parts[2] };
  }

  var lastRoute = null;
  var booted = false;
  /* Fiche concours : dès qu’on arrive aux métiers liés, « Se préparer » flotte en petit au-dessus du menu ; quand le vrai
     bouton atteint cette place en fin de liste, la copie s’efface et lui grossit jusqu’à sa taille réelle.
     Fiche métier : même comportement, à partir de la fin de la frise. */
  var prepFloatFrame = null;
  function updatePrepFloat() {
    prepFloatFrame = null;
    var fl = root.querySelector('.prep-float'), real = root.querySelector('.prep-cta');
    var sec = root.querySelector('.trip-next'), frise = sec ? null : root.querySelector('.trip-wrap');
    if (!fl || !real || (!sec && !frise)) return;
    var bar = root.querySelector('.tabbar'), gap = (bar ? bar.offsetHeight : 0) + 12, limit = window.innerHeight - gap;
    fl.style.bottom = gap + 'px';
    var reached = real.getBoundingClientRect().bottom <= limit;
    var started = sec ? sec.getBoundingClientRect().top < limit : frise.getBoundingClientRect().bottom < limit;
    var wasShown = fl.classList.contains('show'), floating = started && !reached;
    fl.classList.toggle('show', floating);
    /* Le grand bouton reste invisible tant que le petit flotte : il n’apparaît qu’au moment où le petit s’efface. */
    real.classList.toggle('pending', floating);
    if (reached && wasShown) real.classList.add('grow');
    else if (!reached) real.classList.remove('grow');
  }
  function schedulePrepFloat() { if (!prepFloatFrame && root.querySelector('.prep-float')) prepFloatFrame = window.requestAnimationFrame ? requestAnimationFrame(updatePrepFloat) : setTimeout(updatePrepFloat, 16); }
  window.addEventListener('scroll', schedulePrepFloat, { passive: true });
  window.addEventListener('resize', schedulePrepFloat);
  /* Une rubrique de frise dépliée ou repliée déplace la fin de la frise. */
  document.addEventListener('toggle', schedulePrepFloat, true);
  /* Mode sombre : « auto » suit le réglage clair ou sombre de l’appareil, en direct. */
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function applyColorMode() {
    var mode = S.colorMode || 'auto', dark = mode === 'dark' || (mode === 'auto' && !!(darkQuery && darkQuery.matches));
    var html = document.documentElement;
    if (html.classList) html.classList.toggle('dark', dark && !S.contrast);
    var meta = document.querySelector && document.querySelector('meta[name="theme-color"]');
    if (meta && meta.setAttribute) meta.setAttribute('content', dark && !S.contrast ? '#000000' : '#2500BA');
  }
  if (darkQuery) { if (darkQuery.addEventListener) darkQuery.addEventListener('change', applyColorMode); else if (darkQuery.addListener) darkQuery.addListener(applyColorMode); }
  var showFilterNotice = false, hintTimer = null, editingField = null;
  /* Page à retrouver après « Terminer les modifications » quand on vient compléter son profil depuis une autre page
     (lieu de vie ajouté depuis les Prépas Talents) : l'usager ne perd pas le fil. Oubliée dès qu'on quitte le profil. */
  var profileReturn = null;
  /* Changement de catégorie sur une fiche métier : la page prend les couleurs de la nouvelle catégorie.
     La barre du haut est balayée une seule fois de gauche à droite ; le reste passe en fondu. */
  function switchTheme(cat) {
    var key = catClass(cat).slice(4), keys = ['Ap', 'A', 'B', 'C', 'CDD'];
    if (root.classList.contains('theme-' + key)) return;
    var bar = document.querySelector('.context-bar'), reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var oldColor = bar && !bar.hidden ? getComputedStyle(bar).backgroundColor : '';
    keys.forEach(function (k) { root.classList.toggle('theme-' + k, k === key); document.body.classList.toggle('theme-' + k, k === key); });
    var ctxCat = bar && bar.querySelector('.context-category');
    if (ctxCat) { ctxCat.className = 'cat context-category ' + catClass(cat); ctxCat.textContent = cat; ctxCat.setAttribute('aria-label', 'Catégorie ' + cat); }
    if (!bar || bar.hidden || reduce || !oldColor) return;
    var newColor = getComputedStyle(bar).backgroundColor;
    if (newColor === oldColor) return;
    var old = bar.querySelector('.theme-sweep'); if (old) old.remove();
    bar.style.backgroundColor = oldColor;
    var sweep = document.createElement('span'); sweep.className = 'theme-sweep'; sweep.setAttribute('aria-hidden', 'true'); sweep.style.setProperty('--sweep', newColor);
    bar.insertBefore(sweep, bar.firstChild);
    sweep.addEventListener('animationend', function () { bar.style.backgroundColor = ''; sweep.remove(); });
  }
  function startHintTimer() {
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { var n = root.querySelector('.top-notice'); if (n) n.classList.add('leave'); var b = root.querySelector('#filters-open'); if (b) b.classList.remove('pulse'); showFilterNotice = false; }, 5000);
  }
  /* Première visite des listes Métiers et Concours : une fenêtre centrale explique qu’on peut ouvrir chaque fiche. Une seule fois par liste. */
  var LIST_TIPS = {
    metiers: 'Appuyez sur un métier pour découvrir les études conseillées, les épreuves, les dates et comment s’y préparer.',
    'concours-liste': 'Appuyez sur un concours pour découvrir les études conseillées, les épreuves, les dates et comment s’y préparer.'
  };
  /* Main qui appuie, fournie par l’équipe (tracée en vecteur). */
  var TAP_ICON = '<svg viewBox="0 0 500 573" fill="currentColor" fill-rule="evenodd" aria-hidden="true"><path d="M267.8 566.5C247.3 562.6 226.2 551.0 198.3 528.1C165.8 501.5 144.4 472.4 136.8 444.2C133.5 432.1 133.8 414.1 137.3 403.3C142.5 387.9 155.0 372.9 168.6 365.8C172.1 364.0 175.0 362.3 175.0 362.0C175.0 361.7 162.6 323.4 147.4 277.0C117.2 184.7 117.0 183.8 119.9 169.8C127.6 133.0 173.0 119.8 199.7 146.6C208.1 154.9 209.4 157.9 223.9 203.0L236.4 241.6L245.0 237.2C252.9 233.2 254.5 232.7 262.7 232.3C275.1 231.5 285.7 234.4 295.2 241.2C296.6 242.2 297.6 241.7 301.5 238.1C311.0 229.3 326.1 224.9 339.6 227.0C351.4 228.8 365.4 237.1 371.2 245.9L372.8 248.2L377.3 245.1C390.8 235.9 409.6 234.5 424.8 241.7C432.1 245.1 442.0 254.6 445.7 261.7C449.1 268.0 487.1 384.7 489.8 396.9C492.2 407.7 492.1 433.5 489.7 445.0C481.5 483.2 457.4 514.7 424.7 530.0C415.4 534.3 330.9 562.2 318.0 565.2C306.5 567.8 278.7 568.6 267.8 566.5ZM311.0 535.0C326.4 531.6 409.8 503.4 416.9 499.3C440.0 485.6 454.2 464.8 459.5 436.7C461.4 426.9 461.4 412.6 459.6 404.0C458.1 396.8 420.5 280.1 418.4 275.8C412.2 263.6 392.0 266.3 387.9 279.8C386.5 284.5 386.4 283.7 391.4 300.5C394.6 311.2 394.2 315.5 389.8 320.6C384.3 326.8 374.8 327.4 368.4 321.8C365.3 319.1 364.2 316.3 356.9 293.6C352.4 279.8 347.7 266.8 346.3 264.7C339.7 254.3 323.5 255.1 318.0 266.1C315.0 271.9 315.5 275.6 322.0 295.9C329.4 319.0 329.6 322.3 324.1 328.2C320.6 332.0 319.8 332.4 314.2 332.8C309.2 333.2 307.5 332.8 304.7 331.1C300.3 328.4 299.9 327.6 289.6 296.3C280.0 267.4 278.7 265.2 270.6 263.1C262.1 261.0 252.5 266.9 250.1 275.7C249.0 279.6 249.4 281.3 256.0 301.7C259.8 313.7 263.0 324.6 263.0 326.0C263.0 327.4 262.0 330.6 260.8 333.0C255.5 343.2 241.9 343.7 234.9 334.0C233.9 332.6 221.6 295.9 207.5 252.5C193.4 209.1 181.1 172.2 180.2 170.6C175.8 163.0 163.7 160.9 156.4 166.5C152.8 169.3 149.1 175.8 149.0 179.5C149.0 180.6 165.7 232.8 186.0 295.4C213.2 379.0 223.0 410.6 223.0 414.0C223.0 426.5 208.7 433.3 198.6 425.7C195.6 423.3 194.6 421.3 190.0 407.5L184.8 392.0L182.1 393.4C178.0 395.6 170.1 404.5 167.8 409.8C157.9 431.8 174.9 467.0 210.1 497.7C228.7 513.9 248.6 527.5 259.8 531.9C266.5 534.4 270.0 535.3 282.0 537.4C286.6 538.2 302.4 536.9 311.0 535.0ZM39.5 179.5C16.7 177.1 13.3 176.1 9.9 170.7C8.3 168.2 8.0 166.2 8.3 161.6C8.6 156.2 9.0 155.4 12.8 151.9C17.9 147.1 19.2 147.1 51.8 150.4C70.1 152.2 74.5 153.0 76.7 154.6C86.0 161.6 85.6 175.0 76.0 180.1C71.6 182.5 66.7 182.4 39.5 179.5ZM86.3 114.2C83.5 112.7 57.3 81.9 51.5 73.3C46.5 66.1 49.1 56.3 57.0 52.2C67.0 47.2 70.8 49.5 89.6 72.5C107.3 94.2 108.0 95.2 108.0 101.1C108.0 112.1 95.7 119.5 86.3 114.2ZM217.0 109.2C209.6 105.5 206.6 95.4 210.9 88.4C212.6 85.6 248.3 55.5 252.8 53.1C256.1 51.3 264.1 51.8 267.4 53.9C273.5 57.9 275.9 66.7 272.8 73.5C271.5 76.4 235.6 106.6 230.3 109.3C226.2 111.5 221.4 111.4 217.0 109.2ZM149.3 84.0C142.1 79.7 141.8 76.8 144.9 44.5C147.3 20.1 147.8 18.3 152.7 14.0C155.6 11.4 156.8 11.0 162.2 11.0C167.9 11.0 168.5 11.2 172.1 14.8C174.2 16.9 176.2 19.8 176.5 21.2C177.6 25.4 172.4 75.4 170.5 79.0C168.2 83.4 163.5 86.0 157.5 86.0C154.3 86.0 151.3 85.3 149.3 84.0Z"/></svg>';
  function listTipDue(name) { return !!(LIST_TIPS[name] && S.done && !(S.tipSeen || {})[name]); }
  var tipDialog = null, tipTimer = null, tipPending = null;
  function armListTip() {
    clearTimeout(tipTimer);
    if (!tipPending) return;
    tipTimer = setTimeout(function () { if (route().name === tipPending && !document.querySelector('dialog[open]')) openListTip(tipPending); tipPending = null; }, 15000);
  }
  /* Chaque toucher ou défilement relance le délai : l’aide ne vient qu’à une personne qui reste sans agir. */
  ['pointerdown', 'scroll', 'keydown'].forEach(function (t) { window.addEventListener(t, function () { if (tipPending) armListTip(); }, { passive: true }); });
  function openListTip(name) {
    var tip = LIST_TIPS[name];
    S.tipSeen = S.tipSeen || {}; S.tipSeen[name] = true; save();
    if (!tipDialog) {
      tipDialog = document.createElement('dialog'); tipDialog.className = 'tip-pop'; tipDialog.setAttribute('aria-labelledby', 'tip-title'); tipDialog.setAttribute('tabindex', '-1');
      document.body.appendChild(tipDialog);
      tipDialog.addEventListener('click', function (e) { if (e.target.closest('[data-tip-close]')) tipDialog.close(); });
    }
    tipDialog.innerHTML = '<div class="tip-pop-icon" aria-hidden="true">' + TAP_ICON + '</div><h2 class="tip-pop-title" id="tip-title">' + esc(tip) + '</h2>' +
      '<button type="button" class="btn tip-pop-btn" data-tip-close>J’ai compris</button>';
    if (tipDialog.open) return;
    if (tipDialog.showModal) tipDialog.showModal(); else tipDialog.setAttribute('open', '');
    /* Le focus va sur la fenêtre elle-même : le bouton n’affiche son contour qu’à la navigation au clavier. */
    tipDialog.focus({ preventScroll: true });
  }
  /* Tous les switchs gardent leur position d’avant le rendu : le curseur (ou la pastille d’un interrupteur) glisse alors jusqu’à la nouvelle. */
  function switchStates() {
    var out = {};
    [].forEach.call(root.querySelectorAll('.explore-switch[data-on]'), function (el) { out['seg:' + el.getAttribute('aria-label')] = el.getAttribute('data-on'); });
    [].forEach.call(root.querySelectorAll('.switch-row[role="switch"]'), function (el) { out['sw:' + el.getAttribute('data-action')] = el.getAttribute('aria-checked'); });
    return out;
  }
  function animateSwitches(before) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var moved = [];
    [].forEach.call(root.querySelectorAll('.explore-switch[data-on]'), function (el) {
      var was = before['seg:' + el.getAttribute('aria-label')], now = el.getAttribute('data-on');
      if (was != null && was !== now) { el.setAttribute('data-on', was); moved.push([el, 'data-on', now]); }
    });
    [].forEach.call(root.querySelectorAll('.switch-row[role="switch"]'), function (el) {
      var was = before['sw:' + el.getAttribute('data-action')], now = el.getAttribute('aria-checked');
      if (was != null && was !== now) { el.setAttribute('aria-checked', was); moved.push([el, 'aria-checked', now]); }
    });
    if (!moved.length) return;
    void root.offsetWidth;
    moved.forEach(function (m) { m[0].classList.add('slide'); m[0].setAttribute(m[1], m[2]); });
  }
  /* Switch Métiers / Concours : le curseur glisse vers l’onglet touché. Le haut de l’écran (titre, switch, pastilles de filtres) reste en place ;
     la recherche et la liste coulissent dans le sens du mouvement : vers la gauche pour aller aux concours, vers la droite pour revenir aux métiers. */
  var exploreSlide = null, EXPLORE_MS = 340;
  function explorePane(main) {
    var pills = main.querySelector('.filter-summary'), out = [], on = false;
    [].slice.call(main.children).forEach(function (el) { if (on && !el.classList.contains('a11y-link')) out.push(el); if (el === pills) on = true; });
    return out;
  }
  function explorePaneIn(main, name) {
    var dir = exploreSlide; exploreSlide = null;
    if (name !== 'metiers' && name !== 'concours-liste') return;
    explorePane(main).forEach(function (el) { el.classList.add('explore-in-' + dir); });
    setTimeout(function () { explorePane(main).forEach(function (el) { el.classList.remove('explore-in-' + dir); }); }, EXPLORE_MS + 40);
  }
  /* Explorer : la fiche d'un métier sur plusieurs catégories s'ouvre sur la catégorie montrée dans la liste filtrée. */
  document.addEventListener('click', function (e) {
    var row = e.target.closest && e.target.closest('a.job-row[data-cat]');
    if (!row) return;
    var m = /#\/metier\/([^\/?#]+)/.exec(row.getAttribute('href') || '');
    if (m) tripCatPick = { job: m[1], cat: row.getAttribute('data-cat') };
  }, true);
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.explore-switch[role="tablist"] a');
    if (!a || a.classList.contains('on') || e.metaKey || e.ctrlKey || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var main = a.closest('main'); if (!main) return;
    e.preventDefault();
    var toConcours = a === a.parentNode.lastElementChild, pane = explorePane(main);
    if (pane.length) {
      /* Copie fixe de l’ancien contenu, qui sort pendant que le nouveau entre. */
      var top = pane[0].getBoundingClientRect().top, box = main.getBoundingClientRect();
      var ghost = document.createElement('div');
      ghost.className = 'explore-ghost ' + (toConcours ? 'out-left' : 'out-right');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.style.cssText = 'top:' + Math.max(0, top) + 'px;left:' + box.left + 'px;width:' + box.width + 'px;';
      var inner = document.createElement('div');
      inner.className = 'screen pt explore-ghost-inner';
      inner.style.marginTop = Math.min(0, top) + 'px';
      pane.forEach(function (el) { inner.appendChild(el.cloneNode(true)); });
      ghost.appendChild(inner);
      document.body.appendChild(ghost);
      setTimeout(function () { ghost.remove(); }, EXPLORE_MS + 40);
    }
    exploreSlide = toConcours ? 'right' : 'left';
    location.hash = a.getAttribute('href');
  }, true);
  function render() {
    document.documentElement.dataset.contrast = String(!!S.contrast);
    document.documentElement.dataset.colorMode = S.colorMode || 'auto';
    applyColorMode();
    document.documentElement.dataset.largeText = String(!!S.largeText);
    document.documentElement.dataset.dysFont = String(!!S.dysFont);
    var r = route();
    if (r.name === 'explorer') { r = { name: S.explore === 'concours' ? 'concours-liste' : 'metiers' }; history.replaceState(null, '', '#/' + r.name); }
    if (profileReturn && r.name !== 'moi') profileReturn = null;
    if (r.name === 'preparer') prepFocus = r.arg2 && concoursByKey(r.arg2) ? { job: r.arg, key: r.arg2 } : null;
    else if (prepFocus && PREP_PAGES.indexOf(r.name) < 0) prepFocus = null;
    if(['niveau','interets','ambition','traits','situation'].indexOf(r.name)>-1){
      var required=!S.profile?'choix-profil':!nameReady()?'profil':(!S.level&&r.name!=='niveau'?'niveau':null);
      if(required){r={name:required};history.replaceState(null,'','#/'+required);}
    }
    /* Fin de la création du profil : l’écran de chargement s’affiche toujours, même si le catalogue est déjà là. */
    if ((!catalogReady || profileFinished) && LIGHT_ROUTES.indexOf(r.name) < 0) { profileFinished = false; loadCatalog(); return; }
    var key = r.name + '/' + (r.arg || '') + '/' + (r.arg2 || '');
    var changed = key !== lastRoute;
    var hash=location.hash||'#/', slide=null, SLIDES=['metier','preparer','bibliographie'];
    if(changed){
      var previous=visitedRoutes[visitedRoutes.length-1];
      if(visitedRoutes.length>1&&visitedRoutes[visitedRoutes.length-2]===hash){visitedRoutes.pop();if(previous&&SLIDES.indexOf(previous.split('/')[1])>-1)slide='right';}
      else{visitedRoutes.push(hash);if(visitedRoutes.length>40)visitedRoutes.shift();if(jobSlideRequested&&SLIDES.indexOf(r.name)>-1)slide='left';}
    }
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)slide=null;
    var animateJob=!!slide;
    jobSlideRequested=false;
    lastRoute = key;
    if(changed&&['annales','ressources-biblio'].indexOf(r.name)>-1){S.resQ='';S.resCat=r.name==='ressources-biblio'?bibliographyCategory(jobById(r.arg)):'Toutes';S.resFp='Tous';S.resCats=null;S.resFps=null;S.resKind='Tous';S.resYear='Toutes';S.resLimit=40;}
    if(changed&&r.name==='calendrier'&&r.arg){S.calCat='Toutes';S.calFp='Tous';S.calQ='';S.calView='upcoming';S.calLimit=40;}
    if(changed&&r.name==='prepa'&&r.arg==='talents'&&r.arg2)S.talentsAll=false;
    /* La notification des réglages ne s’affiche qu’une fois, au premier passage sur Explorer. */
    showFilterNotice = changed && r.name === 'metiers' && !S.filterHintSeen;
    if (showFilterNotice) {
      S.filterHintSeen = true; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ }
      startHintTimer();
    }

    var a = document.activeElement;
    var focusSel = null;
    /* Sur écran tactile, redonner le focus à une liste déroulante la rouvre aussitôt (iPhone) : elle reste fermée après le choix. */
    if (!changed && a && root.contains(a) && !(a.tagName === 'SELECT' && root.classList.contains('touch-input'))) {
      if (a.id) focusSel = '#' + a.id;
      else if (a.getAttribute('data-action')) {
        focusSel = '[data-action="' + a.getAttribute('data-action') + '"]' + (a.getAttribute('data-v') !== null ? '[data-v="' + a.getAttribute('data-v').replace(/"/g, '\\"') + '"]' : '');
      }
    }

    var fn = screens[r.name] || screens[S.done ? 'accueil' : 'profil'];
    if(changed&&r.name==='situation'&&S.boursier==='Oui')talentIntroAnimate=true;
    if(changed&&(r.name==='accueil'||r.name==='enfant'))nameAnimate=true;
    var switchesBefore = switchStates();
    root.innerHTML = UI.inclusive(fn(r.arg, r.arg2));
    animateSwitches(switchesBefore);
    talentIntroAnimate=false; nameAnimate=false;
    var main = root.querySelector('main');
    root.classList.toggle('job-transition',animateJob);
    if (main) {
      main.id = 'contenu';
      if (exploreSlide) explorePaneIn(main, r.name);
      if(animateJob){
        var slideClass=slide==='right'?'slide-from-left':'job-slide-in';
        main.classList.add(slideClass);
        main.addEventListener('animationend',function(e){if(e.target===main){main.classList.remove(slideClass);root.classList.remove('job-transition');}});
      }
      if (['accessibilite', 'accueil', 'enfant', 'famille'].indexOf(r.name) < 0) main.insertAdjacentHTML('beforeend', '<a class="a11y-link" href="#/accessibilite">Confort de lecture et accessibilité</a>');
    }
    /* Arrivée sur le tableau de bord après le chargement du catalogue : chaque bloc apparaît du haut vers le bas, menu compris. */
    if (root.querySelector('.fp-track')) {
      placeFpTabs(root);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { placeFpTabs(root); });
    }
    /* Onboarding : chaque nouvel écran apparaît en fondu simple, sans mouvement, bouton du bas compris. */
    if (changed && main && ['bienvenue', 'versants', 'categories-intro', 'choix-profil', 'profil', 'niveau', 'interets', 'ambition', 'traits', 'situation'].indexOf(r.name) > -1) {
      var entering = [main].concat([].slice.call(root.querySelectorAll(':scope > .footer, :scope > form > .footer')));
      entering.forEach(function (el) { el.classList.add('enter-fade'); });
      setTimeout(function () { entering.forEach(function (el) { el.classList.remove('enter-fade'); }); }, 900);
    }
    if (dashboardEnter && main) {
      dashboardEnter = false;
      [].slice.call(main.children).concat([].slice.call(root.querySelectorAll(':scope > .tabbar'))).forEach(function (el, i) {
        el.classList.add('enter-up'); el.style.setProperty('--enter-i', i);
      });
    }
    var themedJob=['metier','metier-test','fiche','preparer','sans-concours','etudes','calendrier','annales','ressources-biblio','handicap'].indexOf(r.name)>-1&&r.arg&&jobById(r.arg);
    var theme=themedJob&&themeCategory(themedJob);
    if(themedJob&&prepFocus&&prepFocus.job===themedJob.id)theme=concoursByKey(prepFocus.key).cat;
    if(tripCatPick&&!(r.name==='metier'&&r.arg===tripCatPick.job))tripCatPick=null;
    if(themedJob&&tripCatPick&&tripCatPick.job===themedJob.id)theme=tripCatPick.cat;
    if((r.name==='concours-fiche'||r.name==='concours-test')&&r.arg){var shownConcours=concoursByKey(r.arg);if(shownConcours)theme=shownConcours.cat;}
    if(r.name==='calendrier'&&r.arg==='concours'&&r.arg2){var datedConcours=concoursByKey(r.arg2);if(datedConcours)theme=datedConcours.cat;}
    var themeKey=theme?catClass(theme).slice(4):null;
    ['Ap','A','B','C','CDD'].forEach(function(k){root.classList.toggle('theme-'+k,k===themeKey);if(document.body&&document.body.classList)document.body.classList.toggle('theme-'+k,k===themeKey);});
    var onboarding=['bienvenue','versants','categories-intro','choix-profil','profil','niveau','interets','ambition','traits','situation'].indexOf(r.name)>-1;
    root.classList.toggle('onboarding',onboarding);
    if(document.body&&document.body.classList){document.body.classList.toggle('themed',!!themeKey);}
    root.classList.toggle('themed',!!themeKey);
    var t = root.querySelector('h1');
    if (t) t.setAttribute('tabindex', '-1');
    document.title = (t ? t.textContent + ' · ' : '') + 'Y-Seck';
    var contextJob=(r.name==='metier'||r.name==='metier-test')&&D.jobs.find(function(j){return j.id===r.arg;});
    var contextCategories=contextJob?jobCategories(contextJob).filter(function(c){return ['A+','A','B','C','CDD'].indexOf(c)>-1;}):[];
    /* Barre du haut : seulement la catégorie choisie sur la fiche. */
    if(contextCategories.length>1&&theme&&contextCategories.indexOf(theme)>-1)contextCategories=[theme];
    UI.afterRender({root:root,noBar:['accueil','enfant','famille'].indexOf(r.name)>-1||r.name==='fiche'||((r.name==='concours-fiche'||r.name==='concours-test')&&!S.done),title:r.name==='metiers'?'Explorer les métiers':r.name==='concours-liste'?'Explorer les concours':(t?t.textContent:'Y-Seck'),topLevel:['accueil','enfant','famille','metiers','concours-liste','favoris','moi'].indexOf(r.name)>-1,profileField:r.name==='moi'&&editingField?profileFieldContent(editingField):'',profileFieldTitle:editingField?PROFILE_FIELDS[editingField]:'',isJobs:r.name==='metiers'||r.name==='concours-liste',category:contextCategories.length===1?{label:contextCategories[0],className:catClass(contextCategories[0])}:null,categories:contextCategories.length>1?contextCategories.map(function(c){return {label:c,className:catClass(c)};}):[],summary:r.name==='metiers'||r.name==='concours-liste'?filterSummary():'',filters:r.name==='metiers'||r.name==='concours-liste'?jobFilters():r.name==='calendrier'&&!r.arg?calFilters():r.name==='bibliographie'?bookFilters(jobById(r.arg)):'',filtersTitle:r.name==='concours-liste'?'Filtrer les concours':r.name==='calendrier'?'Filtrer les dates':r.name==='bibliographie'?'Filtrer les ouvrages':'Filtrer les métiers',resourceFilters:['annales','ressources-biblio'].indexOf(r.name)>-1?studyFilters(jobById(r.arg),r.name==='ressources-biblio'):'',changed:changed});
    lockHome(['accueil','enfant','famille'].indexOf(r.name)>-1);
    /* Arrivée sur une fiche métier ou concours : la barre du haut part du blanc (texte noir), puis la couleur de la catégorie la remplit de gauche à droite, en dégradé. */
    if (changed && (r.name === 'metier' || r.name === 'concours-fiche') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var ctxBar = document.querySelector('.context-bar');
      if (ctxBar) { ctxBar.classList.remove('bar-enter'); void ctxBar.offsetWidth; ctxBar.classList.add('bar-enter'); clearTimeout(ctxBar._enterT); ctxBar._enterT = setTimeout(function () { ctxBar.classList.remove('bar-enter'); }, 1400); }
    }

    /* Fenêtre d’aide : seulement après 15 secondes sans toucher l’écran sur la liste ; annulée si on la quitte. Ouvrir une fiche suffit à montrer qu’on a compris. */
    if (changed) {
      clearTimeout(tipTimer);
      if (tipPending && (r.name === 'metier' || r.name === 'concours-fiche')) { S.tipSeen = S.tipSeen || {}; S.tipSeen[tipPending] = true; save(); }
      tipPending = null;
      if (listTipDue(r.name)) { tipPending = r.name; armListTip(); }
    }
    if (changed) {
      if (t && booted) t.focus({ preventScroll: true });
      if (r.name === 'prepas' || (r.name === 'concours' && r.arg === 'prepas')) {
        var prep = document.getElementById('prep-title'); if (prep) { prep.scrollIntoView(); prep.focus({ preventScroll: true }); }
      }
    } else if (focusSel) {
      var el = root.querySelector(focusSel);
      if (el) el.focus({ preventScroll: true });
    }
    schedulePrepFloat();
  }

  /* Chargement du catalogue complet : écran d’attente animé, affiché au moins 2 secondes pour être lu, puis fondu vers l’écran demandé. */
  function loadCatalog() {
    if (catalogLoading) return;
    catalogLoading = true; lastRoute = null;
    root.classList.remove('onboarding', 'themed', 'job-transition');
    root.innerHTML = '<main class="screen loading-screen" id="contenu"><p class="loading-text" role="status">Identification des métiers et concours qui ' + (isParent() ? 'lui' : 'vous') + ' correspondent</p></main>';
    document.title = 'Chargement · Y-Seck';
    UI.afterRender({ root: root, noBar: true, title: 'Y-Seck', topLevel: true });
    var started = Date.now();
    (window.YSECK_CATALOG ? window.YSECK_CATALOG.loadAll() : Promise.resolve()).then(function () {
      jobsByName = null; SIGLE_RE = null;
      catalogReady = true;
      setTimeout(function () {
        var screen = root.querySelector('.loading-screen'); if (screen) screen.classList.add('leaving');
        setTimeout(function () { catalogLoading = false; dashboardEnter = LIGHT_ROUTES.indexOf(route().name) < 0; render(); }, 350);
      }, Math.max(0, 2000 - (Date.now() - started)));
    }).catch(function () {
      catalogLoading = false;
      root.innerHTML = '<main class="screen" id="contenu"><h1>Chargement interrompu</h1><p>Les métiers n’ont pas pu être chargés. Vérifiez votre connexion puis réessayez.</p><button type="button" class="btn" data-action="retryCatalog">Réessayer</button></main>';
    });
  }

  /* Raccourci sur le téléphone : proposé une seule fois, après un premier métier ou concours mis en favori.
     Android : le bouton déclenche l’installation du navigateur ; iPhone : les deux gestes de Safari. */
  function standaloneApp() { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator || {}).standalone === true; }
  function offerInstall(trigger) {
    var nav = window.navigator || {}, ua = nav.userAgent || '', ios = /iPhone|iPad|iPod/.test(ua) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
    var phone = ios || /Android/i.test(ua) || !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    if (S.installOffered || standaloneApp() || !phone) return;
    S.installOffered = true; save();
    setTimeout(function () { UI.open('install', 'Installer Y-Seck', installSheet(ios, /CriOS|FxiOS|EdgiOS/.test(ua)), trigger); }, 450);
  }
  /* Pictogrammes des étapes d’installation, fournis par l’équipe (tracés en vecteur). */
  var SHARE_ICON = '<svg viewBox="35 25 425 534" fill="currentColor" fill-rule="evenodd" aria-hidden="true"><path d="M91.5 555.0C64.4 549.3 47.1 532.9 39.8 506.0L37.5 497.5L37.5 367.5C37.5 220.4 36.9 231.5 45.7 213.1C53.8 196.2 67.6 185.5 88.5 179.8C95.8 177.8 99.5 177.6 132.9 177.2C173.3 176.8 175.3 177.0 182.0 182.7C195.2 194.0 192.9 214.4 177.5 222.9C174.9 224.3 169.5 224.6 139.5 225.0C106.9 225.5 104.2 225.7 100.0 227.6C93.2 230.7 87.4 237.6 86.1 244.1C85.3 247.9 85.0 284.2 85.2 369.5C85.5 489.1 85.5 489.5 87.6 494.0C90.3 499.7 94.3 503.7 100.0 506.4L104.5 508.5L247.0 508.5C404.7 508.5 393.8 509.0 401.6 501.8C410.1 494.0 409.5 504.2 409.5 367.0C409.5 232.0 410.0 240.9 402.6 233.5C395.1 226.0 393.1 225.7 354.5 225.1L320.5 224.5L315.9 221.8C302.5 213.9 300.3 194.4 311.7 183.9C318.5 177.6 318.6 177.5 352.5 177.2C395.9 176.7 407.0 178.3 424.2 187.2C442.1 196.5 453.5 214.2 457.0 238.5C457.8 244.3 458.0 279.3 457.7 366.0C457.3 507.4 457.3 506.2 447.8 524.3C440.6 537.9 425.7 548.8 407.0 554.3L399.5 556.4L250.0 556.7C106.5 556.9 100.1 556.8 91.5 555.0ZM235.4 379.1C232.5 377.4 229.1 374.3 227.4 371.8L224.5 367.5L224.0 234.8L223.5 102.1L201.0 125.5C186.8 140.4 177.0 149.7 174.4 151.0C159.0 158.6 140.3 145.1 142.3 127.8C142.6 125.2 143.6 121.8 144.4 120.3C147.1 115.0 232.3 31.9 237.9 29.1C244.0 25.9 250.5 26.3 257.9 30.2C266.7 35.0 347.2 114.2 350.6 121.5C357.9 137.0 346.9 153.0 329.2 153.0C321.0 153.0 319.1 151.5 294.6 126.0C282.7 113.6 272.5 103.4 272.0 103.2C271.4 103.0 270.9 150.5 270.8 235.3L270.5 367.8L267.5 372.2C260.6 382.0 246.0 385.2 235.4 379.1Z"/></svg>';
  var PLUS_ICON = '<svg viewBox="39 79 425 433" fill="currentColor" fill-rule="evenodd" aria-hidden="true"><path d="M96.6 508.4C68.8 502.4 52.6 487.8 44.3 461.3L41.5 452.5L41.5 296.5C41.5 120.2 40.8 135.6 49.6 117.2C59.0 97.6 75.9 86.4 101.7 82.5C113.3 80.7 377.8 80.3 395.3 82.0C430.1 85.4 451.3 102.5 459.2 133.5L461.5 142.5L461.5 296.0L461.5 449.5L459.3 458.0C453.7 479.1 443.1 492.9 425.9 501.4C407.5 510.5 418.4 510.0 250.5 509.9C124.9 509.8 102.5 509.6 96.6 508.4ZM395.9 460.4C402.3 458.5 408.1 453.5 411.2 447.2L413.5 442.5L413.8 384.0C413.9 351.8 413.7 285.0 413.3 235.4L412.5 145.4L410.0 141.6C407.0 137.2 400.1 132.4 394.6 130.9C388.6 129.2 111.2 129.6 105.6 131.2C99.6 133.0 91.7 141.2 90.2 147.2C89.3 150.7 89.0 188.5 89.0 295.8C89.0 457.8 88.5 446.5 96.5 454.5C104.3 462.4 93.6 461.9 250.6 461.9C374.6 462.0 391.2 461.8 395.9 460.4ZM246.6 405.9C241.2 404.6 236.1 400.5 233.9 395.6C232.2 391.8 232.0 388.4 232.0 353.2L232.0 315.0L193.5 315.0C157.6 315.0 154.7 314.9 151.2 313.1C144.3 309.6 141.0 303.8 141.0 295.4C141.0 287.4 144.2 282.1 151.2 278.6L156.4 276.0L194.2 276.0L231.9 276.0L232.2 236.7L232.5 197.4L234.9 193.8C244.0 180.6 263.3 182.5 269.5 197.2C270.8 200.4 271.0 206.9 271.0 238.5L271.0 276.0L308.8 276.0C346.0 276.0 346.6 276.0 351.0 278.2C353.4 279.5 356.8 282.2 358.4 284.3C362.8 289.8 362.9 300.5 358.8 306.7C353.4 314.9 352.7 315.0 309.2 315.0L271.1 315.0L270.8 354.3L270.5 393.6L267.7 397.8C263.3 404.5 254.7 407.8 246.6 405.9Z"/></svg>';
  var ADD_ICON = '<svg viewBox="13 12 476 324" fill="currentColor" fill-rule="evenodd" aria-hidden="true"><path d="M289.4 332.5C268.3 327.9 236.9 299.5 229.4 278.2C223.8 262.2 228.2 246.8 241.0 238.1C243.7 236.2 246.0 234.4 246.0 234.0C246.0 233.7 240.9 217.6 234.6 198.4L223.2 163.5L149.8 163.0C77.3 162.4 76.4 162.4 69.0 160.1C48.6 153.9 31.5 139.9 22.7 122.0C16.8 109.9 15.0 102.3 15.0 88.4C15.0 54.0 36.6 25.7 70.0 16.3C76.2 14.6 85.2 14.5 250.5 14.5C444.5 14.5 428.6 13.9 445.5 22.0C500.6 48.5 500.6 128.2 445.5 155.0C429.9 162.6 433.5 162.3 348.2 162.7C306.3 162.9 272.0 163.4 272.0 163.9C272.0 164.3 272.9 167.3 274.0 170.7L276.1 176.7L280.3 174.6C286.1 171.7 295.0 171.8 300.9 174.9L305.2 177.1L307.4 175.1C315.5 167.5 333.8 168.9 339.5 177.6L341.0 179.9L345.7 177.5C355.7 172.1 369.4 175.7 375.2 185.0C378.9 191.0 396.8 246.5 398.0 255.8C400.3 273.3 394.0 292.0 381.5 304.5C373.3 312.7 366.8 315.8 340.2 324.5C310.1 334.2 302.7 335.4 289.4 332.5ZM337.0 310.2C363.9 301.2 368.1 298.9 375.2 289.5C380.9 282.0 383.5 273.4 383.4 262.5C383.4 253.9 383.0 252.3 373.6 223.5C368.2 207.0 363.1 192.7 362.1 191.8C358.9 188.4 354.4 188.4 351.0 191.8C347.6 195.3 347.4 196.5 349.5 203.4C350.3 206.1 351.0 209.4 351.0 210.7C351.0 216.2 343.0 219.1 339.2 215.0C338.2 213.9 335.8 208.1 334.0 202.2C329.8 188.7 328.5 186.2 325.2 184.9C320.0 182.9 314.0 186.6 314.0 191.8C314.0 193.3 315.4 198.8 317.0 204.0C318.7 209.1 320.0 214.0 320.0 214.7C320.0 217.0 315.2 221.0 312.5 221.0C308.3 221.0 306.3 217.8 301.8 203.8C299.5 196.5 296.7 189.7 295.8 188.8C293.1 186.1 287.4 186.5 284.5 189.5C281.3 192.6 281.4 194.7 285.0 205.5C288.4 215.6 288.7 219.5 286.3 222.2C284.1 224.6 278.6 224.6 276.3 222.1C275.3 221.0 268.9 202.7 262.0 181.5C249.1 141.3 248.0 139.0 242.8 139.0C240.1 139.0 235.4 141.6 234.6 143.5C233.4 146.8 234.3 150.0 251.5 202.9C261.1 232.5 269.0 258.0 269.0 259.8C269.0 265.1 264.1 268.1 259.3 265.8C257.0 264.7 256.0 263.0 254.1 256.8C252.7 252.5 251.2 249.0 250.7 249.0C248.6 249.0 243.1 255.9 242.0 259.8C238.4 273.4 252.3 293.9 276.4 310.4C286.2 317.3 292.2 319.1 303.0 318.7C311.8 318.4 314.3 317.8 337.0 310.2ZM178.2 127.1L181.5 124.2L181.8 99.1L182.1 74.0L177.5 74.0L173.0 74.0L173.0 97.4C173.0 123.1 172.8 123.8 167.1 122.7C164.4 122.1 164.1 122.4 163.5 125.2C162.6 129.0 163.9 130.0 170.2 130.0C174.1 130.0 175.6 129.4 178.2 127.1ZM223.1 110.5C241.2 98.5 231.3 71.4 209.5 73.2C187.9 75.0 184.1 105.3 204.5 112.9C209.5 114.7 218.6 113.6 223.1 110.5ZM264.4 111.5C268.9 109.1 269.0 109.1 269.0 111.1C269.0 112.8 269.5 113.1 272.8 112.8L276.5 112.5L276.8 93.2L277.0 74.0L272.5 74.0L268.0 74.0L268.0 86.0C268.0 98.8 266.9 102.9 263.1 105.0C260.0 106.6 255.5 106.2 252.6 103.9C250.0 101.9 250.0 101.8 250.0 87.9L250.0 74.0L245.5 74.0L241.0 74.0L241.0 88.9C241.0 102.6 241.2 104.0 243.3 107.1C247.9 114.0 256.3 115.8 264.4 111.5ZM312.1 112.3C312.6 111.8 312.7 110.0 312.4 108.3C311.8 105.4 311.6 105.2 308.1 105.7C301.9 106.5 301.0 104.8 301.0 91.9L301.0 81.0L306.5 81.0L312.0 81.0L312.0 77.5L312.0 74.0L306.5 74.0L301.0 74.0L301.0 68.5L301.0 63.0L296.5 63.0L292.0 63.0L292.0 68.5L292.0 74.0L288.0 74.0C284.1 74.0 284.0 74.1 284.0 77.5C284.0 80.9 284.1 81.0 287.9 81.0L291.8 81.0L292.1 93.9C292.5 106.1 292.6 107.0 295.0 109.5C296.4 111.0 298.4 112.6 299.5 113.1C301.9 114.2 310.8 113.6 312.1 112.3ZM347.6 112.5C355.1 110.2 355.5 109.8 353.6 106.2L352.0 103.1L347.7 105.0C338.3 109.3 327.0 105.1 327.0 97.3C327.0 95.0 327.0 95.0 342.5 95.0L358.0 95.0L358.0 91.8C357.8 81.1 349.9 73.1 339.4 73.0C327.1 73.0 318.7 81.2 318.6 93.5C318.4 108.5 331.8 117.3 347.6 112.5ZM126.0 106.5L128.2 100.0L140.0 100.0L151.8 100.0L154.2 106.2L156.6 112.5L161.3 112.8C164.1 113.0 166.0 112.7 166.0 112.1C166.0 111.5 161.2 99.1 155.4 84.5L144.8 58.0L140.1 58.0L135.3 58.0L126.5 80.8C121.6 93.3 116.8 105.6 115.8 108.2L114.0 113.0L118.9 113.0L123.8 113.0L126.0 106.5ZM375.0 100.6C375.0 85.2 376.2 82.9 385.1 82.0L390.5 81.5L390.8 77.2L391.1 73.0L387.5 73.0C383.0 73.0 377.5 75.2 376.1 77.7C375.2 79.3 375.1 79.2 375.0 76.8C375.0 74.2 374.7 74.0 370.5 74.0L366.0 74.0L366.0 92.8C366.0 103.2 366.3 112.0 366.7 112.3C367.0 112.7 369.1 113.0 371.2 113.0L375.0 113.0L375.0 100.6ZM204.8 104.3C197.3 99.6 197.8 85.7 205.6 82.2C216.6 77.1 226.6 86.3 223.1 98.1C221.0 105.1 211.4 108.3 204.8 104.3ZM131.0 91.7C131.0 90.2 139.9 69.0 140.3 69.6C140.6 70.1 142.5 74.8 144.5 80.0C146.5 85.2 148.4 90.1 148.7 90.8C149.1 91.7 147.0 92.0 140.1 92.0C135.1 92.0 131.0 91.9 131.0 91.7ZM327.0 88.5C327.0 86.5 330.3 82.2 332.5 81.2C335.8 79.7 343.0 79.7 345.1 81.3C346.9 82.6 349.0 86.3 349.0 87.9C349.0 88.6 345.1 89.0 338.0 89.0C331.9 89.0 327.0 88.8 327.0 88.5ZM182.7 64.1C184.1 61.1 182.9 58.4 179.6 56.8C174.5 54.5 169.9 61.0 173.6 65.1C176.1 67.9 181.1 67.3 182.7 64.1Z"/></svg>';
  var MENU_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="12" cy="19" r="2.2"/></svg>';
  function installSheet(ios, otherIosBrowser) {
    var intro = '<div class="install-offer"><img class="install-icon" src="assets/icons/icon-192.png" alt="" width="64" height="64"><p class="body">Ajouter Y-Seck à l’écran d’accueil de votre smartphone.</p></div>';
    if (window.YSECK_INSTALL) return intro + '<div class="sheet-actions"><button type="button" class="btn" data-action="installApp">Installer le raccourci</button><button type="button" class="btn outline" data-ui="close">Plus tard</button></div>';
    /* Étapes numérotées reliées par un trait, chacune avec son pictogramme au-dessus du texte. */
    var steps = ios
      ? [[SHARE_ICON, 'share', 'Touchez le bouton partager' + (otherIosBrowser ? ', à côté de l’adresse' : '')], [PLUS_ICON, 'plus', 'Choisissez « Sur l’écran d’accueil »'], [ADD_ICON, 'add', 'Touchez « Ajouter » : l’icône Y-Seck apparaît avec vos applications']]
      : [[MENU_ICON, 'menu', 'Ouvrez le menu de votre navigateur'], [PLUS_ICON, 'plus', 'Choisissez « Ajouter à l’écran d’accueil » ou « Installer l’application »'], [ADD_ICON, 'add', 'Confirmez : l’icône Y-Seck apparaît avec vos applications']];
    return intro + '<ol class="install-steps">' + steps.map(function (t, k) {
      return '<li><span class="install-num" aria-hidden="true">' + (k + 1) + '</span><span class="install-ico install-ico-' + t[1] + '">' + t[0] + '</span><p>' + t[2] + '</p></li>';
    }).join('') + '</ol><div class="sheet-actions"><button type="button" class="btn" data-ui="close">J’ai compris</button></div>';
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

  /* Le glissement tactile laisse le navigateur défiler ; seul un tap bref sélectionne une carte. */
  root.addEventListener('pointerdown',function(e){
    interestGesture=null;
    var touch=e.pointerType==='touch'||e.pointerType==='pen',card=e.target.closest('.interest-option');
    root.classList.toggle('touch-input',touch);
    if(touch&&card)interestGesture={id:e.pointerId,x:e.clientX,y:e.clientY,start:Date.now(),down:true,moved:false,ended:0};
  },{passive:true});
  window.addEventListener('pointermove',function(e){
    var g=interestGesture;if(g&&g.down&&g.id===e.pointerId&&Math.hypot(e.clientX-g.x,e.clientY-g.y)>10)g.moved=true;
  },{passive:true});
  window.addEventListener('pointerup',function(e){
    var g=interestGesture;if(!g||g.id!==e.pointerId)return;
    g.down=false;g.ended=Date.now();if(Math.hypot(e.clientX-g.x,e.clientY-g.y)>10||g.ended-g.start>700)g.moved=true;
  },{passive:true});
  window.addEventListener('pointercancel',function(e){var g=interestGesture;if(g&&g.id===e.pointerId){g.down=false;g.moved=true;g.ended=Date.now();}},{passive:true});
  window.addEventListener('scroll',function(){if(interestGesture&&interestGesture.down)interestGesture.moved=true;},{passive:true});

  /* Écrans d’introduction : glisser le contenu vers la gauche ou la droite passe à l’onglet voisin, le contenu suit le doigt. */
  var fpSwipe=null;
  root.addEventListener('pointerdown',function(e){
    var view=e.target.closest('.fp-viewport');
    if(!view||e.button>0)return;
    var scope=view.closest('main')||root,tabs=[].slice.call(scope.querySelectorAll('.fp-tab'));
    fpSwipe={id:e.pointerId,scope:scope,view:view,tabs:tabs,index:Math.max(0,tabs.map(function(t){return t.getAttribute('aria-selected');}).indexOf('true')),x:e.clientX,y:e.clientY,dx:0,active:false};
  },{passive:true});
  window.addEventListener('pointermove',function(e){
    var g=fpSwipe;if(!g||g.id!==e.pointerId)return;
    var dx=e.clientX-g.x,dy=e.clientY-g.y;
    if(!g.active){if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){fpSwipe=null;return;}if(Math.abs(dx)<8)return;g.active=true;g.view.classList.add('dragging');}
    var edge=(g.index===0&&dx>0)||(g.index===g.tabs.length-1&&dx<0);
    g.dx=edge?dx/3:dx;placeFpTabs(g.scope,g.index,g.dx||0.01);
  },{passive:true});
  function endFpSwipe(e,cancel){
    var g=fpSwipe;if(!g||g.id!==e.pointerId)return;fpSwipe=null;if(!g.active)return;
    g.view.classList.remove('dragging');
    var to=g.index+(!cancel&&g.dx<-50?1:!cancel&&g.dx>50?-1:0);
    to=Math.max(0,Math.min(g.tabs.length-1,to));
    selectFpTab(g.scope,g.tabs[to].getAttribute('data-v'));
  }
  window.addEventListener('pointerup',function(e){endFpSwipe(e,false);},{passive:true});
  window.addEventListener('pointercancel',function(e){endFpSwipe(e,true);},{passive:true});
  window.addEventListener('resize',function(){if(root.querySelector('.fp-track'))placeFpTabs(root);});

  /* Onboarding : le curseur des onglets coulisse au doigt, il se cale sur l'onglet le plus proche au relâcher. */
  var inkDrag=null,inkClick=0;
  root.addEventListener('pointerdown',function(e){
    var bar=e.target.closest(':is(.intro-tabs-screen, .info-dates) .fp-tabs');
    if(!bar||e.button>0)return;
    var tabs=[].slice.call(bar.querySelectorAll('.fp-tab')),cur=Math.max(0,tabs.map(function(t){return t.getAttribute('aria-selected');}).indexOf('true'));
    inkDrag={id:e.pointerId,bar:bar,tabs:tabs,x:e.clientX,y:e.clientY,start:tabs[cur].offsetLeft,ink:tabs[cur].offsetLeft,active:false};
  },{passive:true});
  window.addEventListener('pointermove',function(e){
    var g=inkDrag;if(!g||g.id!==e.pointerId)return;
    var dx=e.clientX-g.x,dy=e.clientY-g.y;
    if(!g.active){if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){inkDrag=null;return;}if(Math.abs(dx)<6)return;g.active=true;g.bar.classList.add('ink-dragging');}
    var first=g.tabs[0].offsetLeft,last=g.tabs[g.tabs.length-1].offsetLeft;
    g.ink=Math.max(first,Math.min(last,g.start+dx));g.bar.style.setProperty('--ink-x',g.ink+'px');
  },{passive:true});
  function endInkDrag(e){
    var g=inkDrag;if(!g||g.id!==e.pointerId)return;inkDrag=null;if(!g.active)return;
    inkClick=Date.now();g.bar.classList.remove('ink-dragging');
    var best=0,dist=1e9;g.tabs.forEach(function(t,i){var d=Math.abs(t.offsetLeft-g.ink);if(d<dist){dist=d;best=i;}});
    selectFpTab(g.bar.closest('main')||root,g.tabs[best].getAttribute('data-v'));
  }
  window.addEventListener('pointerup',endInkDrag,{passive:true});
  window.addEventListener('pointercancel',endInkDrag,{passive:true});
  root.addEventListener('click',function(e){if(Date.now()-inkClick<400&&e.target.closest&&e.target.closest(':is(.intro-tabs-screen, .info-dates) .fp-tabs')){e.preventDefault();e.stopPropagation();}},true);

  /* Favoris : glisser une carte vers la gauche dévoile « Retirer » ; un glissement long demande directement la confirmation. */
  var swipe=null,swipeClick=0,SWIPE_OPEN=96;
  function closeSwipes(except){root.querySelectorAll('.swipe-item.open').forEach(function(it){if(it!==except)it.classList.remove('open');});}
  root.addEventListener('pointerdown',function(e){
    var card=e.target.closest('.swipe-item > .job-row');
    if(!card||e.button>0){if(!e.target.closest('.swipe-item'))closeSwipes();return;}
    var item=card.parentNode;
    swipe={id:e.pointerId,item:item,card:card,x:e.clientX,y:e.clientY,base:item.classList.contains('open')?-SWIPE_OPEN:0,tx:0,active:false};
  },{passive:true});
  window.addEventListener('pointermove',function(e){
    var g=swipe;if(!g||g.id!==e.pointerId)return;
    var dx=e.clientX-g.x,dy=e.clientY-g.y;
    if(!g.active){if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){swipe=null;return;}if(Math.abs(dx)<8||Math.abs(dx)<Math.abs(dy))return;g.active=true;closeSwipes(g.item);g.item.classList.add('swiping');}
    g.tx=Math.max(-220,Math.min(0,g.base+dx));g.card.style.transform='translateX('+g.tx+'px)';var dl=g.item.querySelector('.swipe-delete');if(dl){dl.style.width=Math.max(128,36-g.tx)+'px';dl.classList.toggle('armed',g.tx<-170);}
  },{passive:true});
  function endSwipe(e,cancel){
    var g=swipe;if(!g||g.id!==e.pointerId)return;swipe=null;if(!g.active)return;
    swipeClick=Date.now();g.item.classList.remove('swiping');g.card.style.transform='';var dl0=g.item.querySelector('.swipe-delete');if(dl0){dl0.style.width='';dl0.classList.remove('armed');}
    var open=!cancel&&g.tx<-SWIPE_OPEN/2;g.item.classList.toggle('open',open);
    if(!cancel&&g.tx<-170){var del=g.item.querySelector('.swipe-delete');if(del)del.click();}
  }
  root.addEventListener('dragstart',function(e){if(e.target.closest&&e.target.closest('.swipe-item'))e.preventDefault();});
  window.addEventListener('pointerup',function(e){endSwipe(e,false);},{passive:true});
  window.addEventListener('pointercancel',function(e){endSwipe(e,true);},{passive:true});
  document.addEventListener('click',function(e){
    var card=e.target.closest&&e.target.closest('.swipe-item > .job-row');
    if(!card)return;
    if(Date.now()-swipeClick<400){e.preventDefault();e.stopPropagation();return;}
    if(card.parentNode.classList.contains('open')){e.preventDefault();e.stopPropagation();card.parentNode.classList.remove('open');}
  },true);

  document.addEventListener('click', function (e) {
    var jobLink=e.target.closest('a[href^="#/metier/"],a[href^="#/preparer/"],a[href^="#/bibliographie"]');
    if(jobLink&&!e.defaultPrevented&&e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&jobLink.getAttribute('href')!==location.hash)jobSlideRequested=true;
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var a = el.getAttribute('data-action');
    if(a==='domain'&&e.detail!==0&&interestGesture){
      var gesture=interestGesture;interestGesture=null;
      if((gesture.down||Date.now()-gesture.ended<750)&&(gesture.down||gesture.moved)){e.preventDefault();return;}
    }
    var v = el.getAttribute('data-v');
    var i, next;
    switch (a) {
      case 'tripTab': selectTripTab(el.closest('main') || document, v); break;
      case 'retryCatalog': loadCatalog(); break;
      case 'fpTab': selectFpTab(el.closest('main') || document, v); break;
      case 'tripCat': var catMain = el.closest('main') || document, firstTab = null;
        catMain.querySelectorAll('.trip-cat').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)); });
        catMain.querySelectorAll('.trip-tab').forEach(function (t) { var on = t.getAttribute('data-cat') === v; t.hidden = !on; if (on && !firstTab) firstTab = t; });
        if (firstTab) selectTripTab(catMain, firstTab.getAttribute('data-v'));
        tripCatPick = { job: route().arg, cat: v }; switchTheme(v); break;
      case 'openPrepCat': var prepJob=el.getAttribute('data-job'); (expandedPrepCategories[prepJob]||(expandedPrepCategories[prepJob]={}))[v]=el.getAttribute('aria-expanded')!=='true'; render(); break;
      case 'openFilters': UI.open('filters',onConcoursPage()?'Filtrer les concours':'Filtrer les métiers',jobFilters(),el); break;
      case 'jobDetails': UI.open('details','Plus de détails',jobDetails(v),el); break;
      case 'confirmName': confirmName(true); break;
      case 'validateProfile': validateProfile(); break;
      case 'moreJobDates': expandedDatesJob=expandedDatesJob===v?null:v; render(); break;
      case 'profile':
        if (familyEstablished() && v !== 'par') break;
        if (S.profile !== v) {
          syncPerson(); S.profile = v;
          if (v === 'par') { ensureFamily(); usePerson(activeChild()); }
          else usePerson(S.personalProfiles[v] || blankPerson());
        }
        if(v==='par'&&!activeChild()){ensureFamily();usePerson(activeChild());}
        save();
        if(editingField&&S.done&&UI.current()==='profile-field'){UI.close();editingField=null;render();break;}
        navigate('#/profil'); break;
      case 'addChild': {
        syncPerson();
        var child = Object.assign(blankPerson(), { id: 'enfant-' + Date.now().toString(36) });
        S.children.push(child); S.activeChild = child.id; usePerson(child); save();
        navigate('#/profil'); break;
      }
      case 'openChild': case 'selectChild': {
        syncPerson(); var selected = S.children.find(function (c) { return c.id === v; });
        if (!selected) break;
        S.activeChild = selected.id; usePerson(selected); save();
        if (a === 'openChild') location.hash = selected.done ? '#/enfant' : '#/profil'; else render();
        break;
      }
      case 'editField': editingField = v; UI.open('profile-field', PROFILE_FIELDS[v], profileFieldContent(v), el); break;
      case 'askUnfavorite': { var fj = favItem(v); UI.open('confirm', 'Retirer des favoris ?', '<p class="body">' + esc(fj ? fj.name : 'Ce métier') + ' ne fera plus partie de ' + (isParent() ? 'ses' : 'vos') + ' favoris.</p><div class="sheet-actions"><button type="button" class="btn danger-solid" data-action="unfavorite"' + attr('v', v) + '>Retirer des favoris</button><button type="button" class="btn outline" data-ui="close">Annuler</button></div>', el); break; }
      case 'unfavorite': { UI.close(); set({ favorites: S.favorites.filter(function (id) { return id !== v; }) }); announce((String(v).indexOf('concours:') === 0 ? 'Concours' : 'Métier') + ' retiré des favoris'); break; }
      case 'share': e.preventDefault(); shareJob(v, el); break;
      case 'concoursInfo': { var infoC = concoursByKey(v); if (infoC) UI.open('concours-info', 'Information', concoursInfo(infoC), el); break; }
      case 'copyShare': {
        var input = document.querySelector('.share-url');
        var done = function () { announce('Message copié'); el.textContent = 'Message copié'; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, function () { if (input) { input.select(); document.execCommand('copy'); done(); } });
        else if (input) { input.select(); document.execCommand('copy'); done(); }
        break;
      }
      case 'submitSearch': submitSearch(v); break;
      case 'favorite': {
        next = S.favorites.slice(); i = next.indexOf(v);
        if (i > -1) next.splice(i, 1); else next.push(v);
        var what = String(v).indexOf('concours:') === 0 ? 'Concours' : 'Métier';
        set({ favorites: next }); announce(what + (i > -1 ? ' retiré des favoris' : ' ajouté aux favoris'));
        if (i < 0) offerInstall(el);
        break;
      }
      case 'installApp': {
        var installEvent = window.YSECK_INSTALL;
        if (!installEvent) { UI.close(); break; }
        installEvent.prompt();
        installEvent.userChoice.then(function (choice) { window.YSECK_INSTALL = null; UI.close(); announce(choice.outcome === 'accepted' ? 'Raccourci ajouté à l’écran d’accueil' : 'Installation annulée'); });
        break;
      }
      case 'colorMode': set({ colorMode: v }); announce(v==='dark'?'Mode sombre activé':v==='light'?'Mode clair activé':'L’apparence suit celle de l’appareil'); break;
      case 'level': set({ level: v }); break;
      case 'domain':
        i = S.domains.indexOf(v); next = S.domains.slice();
        if (i > -1) next.splice(i, 1); else next.push(v);
        set({ domains: next, metDomains: null, metMode: 'mine', jobLimit: 60 }); break;
      case 'clearDomains': set({domains:[],metDomains:null,metMode:'mine',jobLimit:60}); announce('Les domaines sélectionnés ont été effacés.'); break;
      case 'ambition': {
        var amb = S.ambitions.slice(), ai = amb.indexOf(v);
        if (v === 'nsp') amb = ai > -1 ? [] : ['nsp'];
        else if (ai > -1) amb.splice(ai, 1);
        else { amb = amb.filter(function (x) { return x !== 'nsp'; }); if (amb.length >= 2) { announce('Deux choix au plus : retirez-en un pour en ajouter un autre.'); break; } amb.push(v); }
        set({ ambitions: amb, jobLimit: 60 }); break;
      }
      case 'defi': {
        var df = S.defis.slice(), di = df.indexOf(v);
        if (v === 'nsp') df = di > -1 ? [] : ['nsp'];
        else if (di > -1) df.splice(di, 1);
        else { df = df.filter(function (x) { return x !== 'nsp'; }); if (df.length >= 3) { announce('Trois choix au plus : retirez-en un pour en ajouter un autre.'); break; } df.push(v); }
        set({ defis: df, metCats: null, jobLimit: 60 }); break;
      }
      case 'agentPublic': case 'experience': { var rp = {}; rp[a] = S[a] === v ? null : v; set(rp); break; }
      case 'showOthersJobs': set({ showOthersJobs: true }); anchorAlso(); break;
      case 'showOthersConcours': set({ showOthersConcours: true }); anchorAlso(); break;
      case 'moreConcours': set({ concoursLimit: (S.concoursLimit || 60) + 60 }); break;
      case 'trait':
        i = S.traits.indexOf(v); next = S.traits.slice();
        if (i > -1) next.splice(i, 1); else next.push(v);
        set({ traits: next }); break;
      case 'boursier': talentIntroAnimate=v==='Oui'&&S.boursier!=='Oui'; set({ boursier: v, budget: budgetFor(v, S.budget), prepBudget: null }); break;
      case 'budget': set({ budget: v, prepBudget: null }); break;
      case 'go': location.hash = '#/' + v; break;
      case 'startProfile': S.introSeen = true; save(); navigate(familyEstablished()?'#/profil':'#/choix-profil'); break;
      case 'finish': e.preventDefault(); if(!identityReady()){navigate(nameReady()?'#/niveau':'#/profil');announce(nameReady()?'Choisissez un niveau pour continuer.':'Renseignez un prénom pour continuer.');break;} S.done = true; markValidated();profileSnapshot=profileSignature();save(); profileFinished = true; navigate('#/accueil'); break;
      case 'clearSearch': {
        e.preventDefault(); clearTimeout(searchTimer);
        if(v==='q'){if(onConcoursPage())S.cq='';else{S.q='';S.jobLimit=60;}}
        else if(v==='cal-q'){S.calQ='';S.calLimit=40;updateCalSuggest(false);}
        else if(v==='book-q')S.bookQ='';
        else if(v==='res-q'){S.resQ='';S.resLimit=40;}
        else if(v==='location-query'){locationQuery='';locationResults=[];locationStatus='';locationSearchId++;}
        else break;
        save(); render();
        var searchInput=document.getElementById(v);if(searchInput)searchInput.focus({preventScroll:true});
        announce('Recherche effacée. La liste complète pour vos filtres est affichée.'); break;
      }
      case 'metDomain':
        next = activeDomains().slice(); i = next.indexOf(v);
        if (i > -1) next.splice(i, 1); else next.push(v);
        set({ metDomains: next, metMode: 'custom', jobLimit: 60 }); countAnnounce(); break;
      case 'discoverJobs': e.preventDefault(); clearTimeout(searchTimer); Object.assign(S,{metDomains:null,metMode:'mine',metCats:null,metFps:null,q:'',jobLimit:60}); save(); navigate('#/metiers'); break;
      case 'discoverConcours': e.preventDefault(); clearTimeout(searchTimer); Object.assign(S,{metDomains:null,metMode:'mine',metCats:null,metFps:null,cq:''}); save(); navigate('#/concours-liste'); break;
      case 'forYou': set({ metDomains: null, metMode: 'mine', metCats: null, metFps: null, q: '', jobLimit: 60 }); countAnnounce(); break;
      case 'allDomains': set({ metDomains: [], metMode: 'all', jobLimit: 60 }); countAnnounce(); break;
      case 'moreJobs': set({ jobLimit: S.jobLimit + 60 }); break;
      case 'metCat': { var nc = toggled(selCats(), v, ALL_CATS); if (!nc.length) { announce('Gardez au moins une catégorie.'); break; } set({ metCats: nc, jobLimit: 60 }); countAnnounce(); break; }
      case 'metFp': { var nf = toggled(selFps(), v, ALL_FPS); if (!nf.length) { announce('Gardez au moins un versant.'); break; } set({ metFps: nf, jobLimit: 60 }); countAnnounce(); break; }
      case 'calCat': set({ calCat: v }); countAnnounce(); break;
      case 'calFp': set({ calFp: v, calLimit: 40 }); break;
      case 'moreInfoDates': S.infoLimits = Object.assign({}, S.infoLimits); S.infoLimits[v] = (S.infoLimits[v] || 20) + 20; save(); render(); break;
      case 'openCalFilters': UI.open('filters', 'Filtrer les dates', calFilters(), el); break;
      case 'calView': S.calView = v; S.calLimit = 40; save(); render(); break;
      case 'calCats': { var cc = toggled(calCats(), v, CAL_CATS); if (!cc.length) { announce('Gardez au moins une catégorie.'); break; } S.calCats = cc; S.calLimit = 40; save(); render(); break; }
      case 'calFps': { var cf = toggled(calFps(), v, ALL_FPS); if (!cf.length) { announce('Gardez au moins un versant.'); break; } S.calFps = cf; S.calLimit = 40; save(); render(); break; }
      case 'calSuggest': { S.calQ = v; S.calLimit = 40; save(); var ci = document.getElementById('cal-q'); if (ci) { ci.value = v; ci.blur(); var cg = ci.closest('.search').querySelector('.search-go'); if (cg) cg.classList.add('ready'); var cx = ci.closest('.search').querySelector('.search-clear'); if (cx) cx.hidden = false; } updateCalSuggest(false); refreshCalendar(); countAnnounce('.calendar-list .prep'); break; }
      case 'moreCalendar': set({ calLimit: S.calLimit + 40 }); break;
      case 'addLocation': {
        e.preventDefault(); profileReturn = location.hash; navigate('#/moi');
        var where = document.getElementById('location-query');
        if (where) { where.closest('section').scrollIntoView({ block: 'start' }); where.focus({ preventScroll: true }); }
        break;
      }
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
      case 'bookCategory': { if(CAL_CATS.indexOf(v)<0)break; var bj=jobById(route().arg),ballowed=bj?jobCategories(bj).filter(function(c){return CAL_CATS.indexOf(c)>-1;}):CAL_CATS,bc=toggled(bookCats(bj),v,ballowed); if(!bc.length){announce('Gardez au moins une catégorie.');break;} set({bookCats:bc,bookCategory:bc[0],bookSubject:'Toutes'}); break; }
      case 'resourceFilters': UI.open('resource-filters','Filtrer les ressources',studyFilters(jobById(route().arg),route().name==='ressources-biblio'),el); break;
      case 'resCat': case 'resFp': var resChange={resLimit:40}; resChange[a]=v; set(resChange); break;
      case 'resCats': { var rc = toggled(resCatsSel(), v, CAL_CATS); if (!rc.length) { announce('Gardez au moins une catégorie.'); break; } set({ resCats: rc, resCat: 'Toutes', resLimit: 40 }); break; }
      case 'resFps': { var rjob = jobById(route().arg), rall = rjob ? ALL_FPS.filter(function (f) { return rjob.fp.indexOf(f) > -1; }) : ALL_FPS, rf = toggled(resFpsSel().filter(function (f) { return rall.indexOf(f) > -1; }), v, rall); if (!rf.length) { announce('Gardez au moins un versant.'); break; } set({ resFps: rf.length === rall.length ? null : rf, resFp: 'Tous', resLimit: 40 }); break; }
      case 'resKind': set({ resKind: v, resLimit: 40 }); break;
      case 'resYear': set({ resYear: v, resLimit: 40 }); break;
      case 'bookSubject': set({ bookSubject: v }); break;
      case 'openBookFilters': UI.open('filters', 'Filtrer les ouvrages', bookFilters(jobById(route().arg)), el); break;
      case 'moreResources': set({resLimit:S.resLimit+40}); break;
      case 'resetResources': set({resCat:'Toutes',resFp:'Tous',resCats:null,resFps:null,resKind:'Tous',resYear:'Toutes',resQ:'',resLimit:40}); break;
      case 'talentsAll': set({ talentsAll: v === 'all' }); countAnnounce('#talents .list-row'); break;
      case 'openRegions': { var regionRoute = route(), regionJob = regionRoute.name === 'prepa' && regionRoute.arg2 ? jobById(regionRoute.arg2) : null;
        UI.open('regions', 'Choisir une région', regionSheet(regionRoute.name === 'prepa' && regionRoute.arg === 'talents' ? talentsList(regionJob).byRegion : regionRoute.name === 'prepa' && (regionRoute.arg === 'ipag' || regionRoute.arg === 'iep') ? schoolList(regionRoute.arg).byRegion : null), el); break; }
      case 'pickRegion': if (UI.current() === 'regions') UI.close(); set({ region: v }); countAnnounce('#talents .list-row, #schools .list-row'); break;
      case 'toggleBoursier': var becomesBoursier=v?v==='Oui':S.boursier!=='Oui'; if(becomesBoursier===(S.boursier==='Oui'))break; set(becomesBoursier?{ boursier: 'Oui', budget: budgetFor('Oui', S.budget), prepBudget: null }:{ boursier: 'Non', budget: budgetFor('Non', S.budget), prepBudget: null }); break;
      case 'alert': set({ alert: !S.alert }); announce(S.alert ? 'Alerte activée' : 'Alerte désactivée'); break;
      case 'deleteChild': {
        var removed=activeChild();
        if(!isParent()||!removed||!window.confirm('Effacer le profil de '+(removed.name||'votre enfant')+' et ses choix enregistrés sur cet appareil ? Les autres profils seront conservés.'))break;
        S.children=S.children.filter(function(child){return child.id!==removed.id;});
        S.activeChild=S.children.length?S.children[0].id:null;
        usePerson(activeChild()||blankPerson());
        /* Dernier enfant effacé : retour au tout premier écran pour choisir à nouveau étudiant·e, parent ou reconversion. */
        if(!S.children.length){S.profile=null;S.introSeen=false;save();navigate('#/bienvenue');announce('Le profil enfant a été effacé.');break;}
        save();navigate('#/accueil');announce('Le profil enfant a été effacé.');break;
      }
      case 'wipe':
        if (window.confirm('Effacer toutes vos réponses de cet appareil ?')) {
          try { localStorage.removeItem(KEY); } catch (err) { /* rien à effacer */ }
          S = Object.assign({}, defaults, { domains: [], traits: [], favorites: [], children: [], personalProfiles: {} });
          profileSnapshot=profileSignature();
          announce('Vos données ont été effacées');
          navigate('#/bienvenue');
        }
        break;
    }
  });

  document.addEventListener('change',function(e){
    if(e.target.id==='resource-kind')set({resKind:e.target.value,resLimit:40});
    if(e.target.id==='resource-year')set({resYear:e.target.value,resLimit:40});
  });

  root.addEventListener('change', function (e) {
    if (e.target.id === 'book-subject') { set({bookSubject:e.target.value}); return; }
    if (e.target.id === 'region') { set({ region: e.target.value }); countAnnounce('.screen .list .list-row'); }
  });

  var searchTimer = null;
  root.addEventListener('input', function (e) {
    if(e.target.matches('.search input')){var clear=e.target.closest('.search').querySelector('.search-clear');if(clear)clear.hidden=!e.target.value;var go=e.target.closest('.search').querySelector('.search-go');if(go)go.classList.toggle('ready',!!e.target.value);}
    if(e.target.id==='location-query'){locationQuery=e.target.value;locationSearchId++;return;}
    if(e.target.id==='res-q'){S.resQ=e.target.value;S.resLimit=40;save();document.getElementById('study-results').innerHTML=studyResults(jobById(route().arg),route().name==='ressources-biblio');return;}
    if (e.target.id === 'book-q') { S.bookQ=e.target.value;save();document.getElementById('books').innerHTML=bookList(jobById(route().arg));return; }
    if (e.target.id === 'cal-q') {
      S.calQ = e.target.value; S.calLimit = 40; save();
      updateCalSuggest(true); refreshCalendar(); return;
    }
    if (e.target.id === 'person-name') {
      S.name = e.target.value; save();
      var continueButton=document.getElementById('identity-continue'),hint=document.getElementById('hint-continue'),confirmButton=document.getElementById('name-confirm');
      if(continueButton){continueButton.disabled=!nameReady();continueButton.textContent=profileSubmitLabel('Continuer');}if(hint)hint.hidden=nameReady();if(confirmButton)confirmButton.disabled=!S.name.trim();return;
    }
    if (e.target.id !== 'q') return;
    if (onConcoursPage()) S.cq = e.target.value; else { S.q = e.target.value; S.jobLimit = 60; }
    save();
    updateSuggest(true);
    var box = document.getElementById('jobs');
    if (box) box.innerHTML = jobRows();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { countAnnounce('#jobs .list-row'); }, 600);
  });

  /* Saisie du prénom : l’écran se resserre pour que titre et champ restent au-dessus du clavier. */
  root.addEventListener('focusin',function(e){
    if(e.target.id!=='person-name')return;
    var screen=e.target.closest('.identity-screen');if(screen)screen.classList.add('typing');
    setTimeout(function(){window.scrollTo(0,0);var sc=document.scrollingElement;if(sc)sc.scrollTop=0;},60);
  });
  root.addEventListener('focusout',function(e){
    if(e.target.id!=='person-name')return;
    var screen=e.target.closest('.identity-screen');if(screen)screen.classList.remove('typing');
  });
  root.addEventListener('focusin',function(e){ if(e.target.id==='q'&&e.target.value)updateSuggest(true); });
  root.addEventListener('focusout',function(e){ if(e.target.id==='cal-q')setTimeout(function(){var a=document.activeElement;if(!a||!a.closest||!a.closest('#cal-suggest'))updateCalSuggest(false);},180); });
  root.addEventListener('focusout',function(e){ if(e.target.id==='q')setTimeout(function(){var a=document.activeElement;if(!a||!a.closest||!a.closest('#q-suggest'))updateSuggest(false);},180); });
  root.addEventListener('keydown',function(e){
    if(e.target.id==='q'&&e.key==='Escape'){updateSuggest(false);return;}
    if(e.target.id==='q'&&e.key==='ArrowDown'){var first=document.querySelector('#q-suggest a');if(first){e.preventDefault();first.focus();}return;}
    if(e.target.closest&&e.target.closest('#q-suggest')&&(e.key==='ArrowDown'||e.key==='ArrowUp')){var items=[].slice.call(document.querySelectorAll('#q-suggest a')),i=items.indexOf(e.target);e.preventDefault();if(e.key==='ArrowDown'&&items[i+1])items[i+1].focus();else if(e.key==='ArrowUp')(items[i-1]||document.getElementById('q')).focus();return;}
  });
  root.addEventListener('keydown',function(e){
    if(e.target.id==='person-name'&&e.key==='Enter'&&!e.isComposing&&e.keyCode!==229){e.preventDefault();confirmName();}
    if(e.target.type==='search'&&e.key==='Enter'&&!e.isComposing&&e.keyCode!==229){e.preventDefault();submitSearch(e.target.id);}
  });
  root.addEventListener('submit',function(e){
    if(e.target.id==='identity-form'){e.preventDefault();confirmName(true);return;}
    if(e.target.id!=='study-form')return;
    e.preventDefault();if(!identityReady())return;
    if(profileNeedsValidation()){validateProfile();return;}save();navigate('#/interets');
  });

  UI.init();
  render();
  booted = true;
})();
