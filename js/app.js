(function () {
  'use strict';

  var D = window.DATA;
  var root = document.getElementById('app');
  var KEY = 'ofp-state-v1';

  /* ---------- État ---------- */
  var defaults = {
    profile: null, level: null, domains: [], boursier: null, budget: null, done: false,
    metDomain: 'Tous', metCat: 'Toutes', q: '', calCat: 'Toutes', track: 'Administratif',
    prepBudget: null, alert: false
  };
  var S = load();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      return Object.assign({}, defaults, raw ? JSON.parse(raw) : {});
    } catch (e) { return Object.assign({}, defaults); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ }
  }
  function set(patch) { Object.assign(S, patch); save(); render(); }

  /* ---------- Outils ---------- */
  var I = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    check: '<svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>'
  };

  var MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  function fmtDate(iso) {
    var p = iso.split('-');
    return { day: String(parseInt(p[2], 10)), month: MONTHS[parseInt(p[1], 10) - 1], year: p[0] };
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function attr(name, val) { return ' data-' + name + '="' + esc(val) + '"'; }
  function isParent() { return S.profile === 'par'; }
  function catLabel(c) { return c === 'X' ? 'Contrat' : 'Catégorie ' + c; }
  function catShort(c) { return c === 'X' ? '<span style="font-size:11px">CDD</span>' : c; }
  function norm(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

  function back(href, label) { return '<a class="back" href="' + href + '">' + I.back + esc(label) + '</a>'; }
  function progress(n) {
    var out = '<div class="progress" aria-label="Étape ' + n + ' sur 3">';
    for (var i = 1; i <= 3; i++) out += '<span class="' + (i <= n ? 'on' : '') + '"></span>';
    return out + '</div>';
  }
  function tabbar(active) {
    var tabs = [['accueil', 'Accueil', I.home], ['metiers', 'Métiers', I.grid], ['concours', 'Concours', I.layers], ['prepas', 'Prépas', I.book], ['profil', 'Profil', I.user]];
    return '<nav class="tabbar" aria-label="Navigation principale">' + tabs.map(function (t) {
      var on = t[0] === active;
      return '<a href="#/' + t[0] + '" class="' + (on ? 'on' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + t[2] + t[1] + '</a>';
    }).join('') + '</nav>';
  }

  /* Ce que le niveau permet de viser */
  function reachable() {
    var l = S.level;
    var college = ['6e', '5e', '4e', '3e'];
    if (!l) return 'A, B ou C selon votre diplôme.';
    if (college.indexOf(l) > -1) return 'Avec le brevet : certains concours C. Avec le bac : B.';
    if (l === 'Sans diplôme') return 'Catégorie C sans concours, PACTE ou contrat.';
    if (l === 'Brevet' || l === 'CAP / BEP') return 'Catégorie C dès maintenant. B avec le bac.';
    if (l === 'Seconde' || l === 'Première' || l === 'Terminale') return 'Avec le bac : B et C. Avec une licence : A.';
    if (l === 'Bac+1 / +2' || l === 'Bac' || l === 'Bac+2') return 'B et C dès maintenant. A avec une licence.';
    return 'A, B et C : tout vous est ouvert.';
  }
  function matchingJobs() {
    if (!S.domains.length) return D.jobs;
    return D.jobs.filter(function (j) { return S.domains.indexOf(j.domain) > -1; });
  }
  function upcoming() {
    var today = new Date().toISOString().slice(0, 10);
    return D.calendar.filter(function (c) { return c.date >= today; });
  }

  /* ---------- Écrans ---------- */
  var screens = {};

  screens.profil = function () {
    var profiles = [['etu', 'Étudiant·e'], ['par', 'Parent'], ['rec', 'En reconversion']];
    var html = '<main class="screen">' +
      '<div class="topbar"><span class="eyebrow">Étape 1 / 3</span>' +
      (S.done ? '<a class="link-plain" href="#/accueil">Fermer</a>' : '<a class="link-plain" href="#/accueil" data-action="skip">Passer</a>') + '</div>' +
      progress(1) +
      '<h1 class="mt-l">Vous êtes</h1><p class="lead">Le parcours s’adapte à votre profil.</p>' +
      '<div class="stack mt-s">' + profiles.map(function (p) {
        var on = S.profile === p[0];
        return '<button type="button" class="opt' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', 'profile') + attr('v', p[0]) + '><span>' + p[1] + '</span>' + (on ? I.check : '') + '</button>';
      }).join('') + '</div>';

    if (S.profile) {
      var list = S.profile === 'rec' ? D.levels.adult : D.levels.school;
      var title = isParent() ? 'Le niveau d’étude de votre enfant' : 'Votre niveau d’étude';
      html += '<section class="stack mt-m" style="border-top:1px solid var(--line);padding-top:22px" aria-label="' + esc(title) + '">' +
        '<h2>' + title + '</h2><div class="row">' + list.map(function (l) {
          var on = S.level === l;
          return '<button type="button" class="chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', 'level') + attr('v', l) + '>' + esc(l) + '</button>';
        }).join('') + '</div></section>';
    }
    html += '</main><div class="footer"><button type="button" class="btn" data-action="go" data-v="interets"' + (S.profile && S.level ? '' : ' disabled') + '>Continuer</button></div>';
    return html;
  };

  screens.interets = function () {
    var n = S.domains.length;
    var count = n === 0 ? 'Aucun choix : on vous montre tout.' : (n === 1 ? '1 domaine choisi' : n + ' domaines choisis');
    return '<main class="screen">' +
      '<div class="topbar">' + back('#/profil', 'Retour') + '<span class="eyebrow">Étape 2 / 3</span></div>' +
      progress(2) +
      '<h1 class="mt-l">' + (isParent() ? 'Ce qui attire votre enfant' : 'Ce qui vous attire') + '</h1>' +
      '<p class="lead">Choisissez autant de domaines que vous voulez.</p>' +
      '<div class="grid-2 mt-s">' + D.domains.map(function (d) {
        var on = S.domains.indexOf(d) > -1;
        return '<button type="button" class="chip wide' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', 'domain') + attr('v', d) + '><span>' + esc(d) + '</span>' + (on ? I.check : '') + '</button>';
      }).join('') + '</div></main>' +
      '<div class="footer"><span class="small" style="text-align:center">' + count + '</span>' +
      '<a class="btn" href="#/situation">Continuer</a></div>';
  };

  screens.situation = function () {
    var q = isParent() ? 'Votre enfant est-il boursier·e ?' : 'Êtes-vous boursier·e ?';
    var budgets = ['Gratuit uniquement', 'Moins de 1 000 €', 'Plus de 1 000 €', 'Je ne sais pas'];
    return '<main class="screen">' +
      '<div class="topbar">' + back('#/interets', 'Retour') + '<span class="eyebrow">Étape 3 / 3</span></div>' +
      progress(3) +
      '<h1 class="mt-l">' + (isParent() ? 'Sa situation' : 'Votre situation') + '</h1>' +
      '<h3 class="mt-s">' + q + '</h3>' +
      '<div class="grid-2">' + ['Oui', 'Non'].map(function (v) {
        var on = S.boursier === v;
        return '<button type="button" class="opt sm' + (on ? ' on' : '') + '" style="justify-content:center" aria-pressed="' + on + '"' + attr('action', 'boursier') + attr('v', v) + '>' + v + '</button>';
      }).join('') + '</div>' +
      '<h3 class="mt-m">Budget pour se préparer</h3>' +
      '<div class="stack">' + budgets.map(function (b) {
        var on = S.budget === b;
        return '<button type="button" class="opt sm' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', 'budget') + attr('v', b) + '><span>' + b + '</span>' + (on ? I.check : '') + '</button>';
      }).join('') + '</div>' +
      (S.boursier === 'Oui' ? '<div class="callout tint-yellow mt-s"><span class="pin red"></span><p>Les Prépas Talents sont gratuites. En plus, 5 000 € par an de bourse.</p></div>' : '') +
      '</main><div class="footer"><button type="button" class="btn" data-action="finish">Voir ' + (isParent() ? 'son parcours' : 'mon parcours') + '</button></div>';
  };

  screens.accueil = function () {
    var jobs = matchingJobs();
    var next = upcoming()[0];
    var sub = [S.level, S.domains.slice(0, 3).join(', ') + (S.domains.length > 3 ? '…' : '')].filter(Boolean).join(' · ');
    var aides = S.boursier === 'Oui' ? 'Boursier·e : Prépa Talents gratuite + 5 000 € par an.' : 'Des prépas gratuites ou à petit prix existent.';
    var cards = [
      ['#/metiers', 'tint-mint', 'var(--mint)', isParent() ? 'Ses métiers' : 'Vos métiers', jobs.length + ' métiers qui collent aux choix, en A, B et C.'],
      ['#/concours', 'tint-cyan', '#22C7E0', isParent() ? 'Ses concours' : 'Vos concours', reachable()],
      ['#/prepas', 'tint-yellow', '#FFC800', 'Les aides', aides]
    ];
    return '<main class="screen" style="padding-top:32px">' +
      '<span class="eyebrow">Tableau de bord</span>' +
      '<h1>' + (isParent() ? 'Le parcours de votre enfant' : 'Votre parcours') + '</h1>' +
      (sub ? '<p class="lead" style="font-size:15px">' + esc(sub) + '</p>' : '') +
      '<div class="stack mt-s">' + cards.map(function (c) {
        return '<a class="card ' + c[1] + '" href="' + c[0] + '"><div style="flex:1;display:flex;flex-direction:column;gap:6px">' +
          '<span class="t"><span class="dot" style="background:' + c[2] + '"></span>' + c[3] + '</span><span class="d">' + esc(c[4]) + '</span></div>' +
          '<span class="go">' + I.arrow + '</span></a>';
      }).join('') + '</div>' +
      '<div class="list mt-s">' +
      '<a class="list-row" href="#/calendrier"><div class="main"><span class="name">Calendrier des concours</span><span class="meta">' +
      (next ? 'Prochaine clôture : ' + fmtDate(next.date).day + ' ' + fmtDate(next.date).month + ' ' + fmtDate(next.date).year : 'Voir les dates') + '</span></div>' + I.chev + '</a>' +
      '<a class="list-row" href="#/etudes"><div class="main"><span class="name">Quelles études choisir ?</span><span class="meta">Du brevet au master</span></div>' + I.chev + '</a>' +
      '<a class="list-row" href="#/sans-concours"><div class="main"><span class="name">Entrer sans concours</span><span class="meta">Contrat, PACTE, apprentissage</span></div>' + I.chev + '</a>' +
      '</div></main>' + tabbar('accueil');
  };

  function jobRows() {
    var q = norm(S.q || '');
    var list = D.jobs.filter(function (j) {
      if (S.metDomain !== 'Tous' && j.domain !== S.metDomain) return false;
      if (S.metCat !== 'Toutes' && j.cat !== S.metCat) return false;
      if (q && norm(j.name + ' ' + j.domain).indexOf(q) === -1) return false;
      return true;
    });
    if (!list.length) return '<p class="empty">Aucun métier avec ces filtres.</p>';
    return list.map(function (j) {
      return '<a class="list-row" href="#/metier/' + j.id + '"><span class="cat cat-' + j.cat + '" aria-label="' + catLabel(j.cat) + '">' + catShort(j.cat) + '</span>' +
        '<div class="main"><span class="name">' + esc(j.name) + '</span><span class="meta">' + esc(j.access + ' · ' + j.dip) + '</span></div>' + I.chev + '</a>';
    }).join('');
  }

  screens.metiers = function () {
    var withJobs = D.domains.filter(function (d) { return D.jobs.some(function (j) { return j.domain === d; }); });
    var mine = S.domains.filter(function (d) { return withJobs.indexOf(d) > -1; });
    var others = withJobs.filter(function (d) { return mine.indexOf(d) === -1; });
    var doms = ['Tous'].concat(mine, others);
    return '<main class="screen" style="padding-top:32px">' +
      '<span class="eyebrow">Explorer</span><h1>Métiers</h1>' +
      '<label class="search">' + I.search + '<span class="sr-only">Rechercher un métier</span>' +
      '<input type="search" id="q" placeholder="Rechercher un métier" value="' + esc(S.q || '') + '" autocomplete="off"></label>' +
      '<div class="row" style="flex-wrap:nowrap;overflow-x:auto;padding-bottom:2px;margin-right:-24px;padding-right:24px">' + doms.map(function (d) {
        var on = S.metDomain === d;
        return '<button type="button" class="chip blue' + (on ? ' on' : '') + '" style="flex:none" aria-pressed="' + on + '"' + attr('action', 'metDomain') + attr('v', d) + '>' + esc(d === 'Tous' ? 'Tous les domaines' : d) + '</button>';
      }).join('') + '</div>' +
      '<div class="row">' + ['Toutes', 'A', 'B', 'C'].map(function (c) {
        var on = S.metCat === c;
        return '<button type="button" class="chip' + (on ? ' on' : '') + '" style="min-width:52px;justify-content:center" aria-pressed="' + on + '"' + attr('action', 'metCat') + attr('v', c) + '>' + (c === 'Toutes' ? 'A, B, C' : c) + '</button>';
      }).join('') + '</div>' +
      '<div class="list" id="jobs">' + jobRows() + '</div></main>' + tabbar('metiers');
  };

  screens.metier = function (id) {
    var j = D.jobs.filter(function (x) { return x.id === id; })[0];
    if (!j) return screens.metiers();
    var tint = { A: 'tint-mint', B: 'tint-cyan', C: 'tint-yellow', X: 'tint-cyan' };
    var ladder = j.ladder;
    if (!ladder) {
      if (j.cat === 'C') ladder = [[j.name, 'C'], ['concours interne ou promotion'], ['Poste de catégorie B', 'B']];
      else if (j.cat === 'B') ladder = [[j.name, 'B'], ['concours interne ou promotion'], ['Poste de catégorie A', 'A']];
      else if (j.cat === 'A') ladder = [[j.name, 'A'], ['expérience et concours interne'], ['Encadrement supérieur', 'A+']];
      else ladder = [[j.name, 'Contrat'], ['concours interne après quelques années'], ['Fonctionnaire titulaire', 'A, B ou C']];
    }
    return '<main class="screen top-tight">' + back('#/metiers', 'Métiers') +
      '<div class="row"><span class="tag fill cat-' + j.cat + '">' + catLabel(j.cat) + '</span><span class="tag">' + esc(j.domain) + '</span></div>' +
      '<h1 class="sm">' + esc(j.name) + '</h1><p class="body">' + esc(j.desc) + '</p>' +
      '<span class="eyebrow mt-m">Pour y accéder</span>' +
      '<div class="list steps">' + j.steps.map(function (s, i) {
        return '<div class="list-row static"><span class="num">' + (i + 1) + '</span><span style="font-size:15px;font-weight:500">' + esc(s) + '</span></div>';
      }).join('') + '</div>' +
      '<span class="eyebrow mt-m">Évoluer</span><div class="ladder">' + ladder.map(function (r) {
        if (r.length === 1) return '<div class="via">↓ ' + esc(r[0]) + '</div>';
        var t = r[1] === 'A' || r[1] === 'A+' ? 'tint-mint' : (r[1] === 'C' ? 'tint-yellow' : tint[j.cat]);
        return '<div class="rung ' + t + '"><span>' + esc(r[0]) + '</span><small>' + esc(r[1]) + '</small></div>';
      }).join('') + '</div>' +
      '<a class="btn mt-m" href="#/prepas">Se préparer</a></main>' + tabbar('metiers');
  };

  screens.concours = function () {
    return '<main class="screen" style="padding-top:32px">' +
      '<span class="eyebrow">Concours</span><h1>3 catégories</h1><p class="lead" style="font-size:15px">Votre diplôme décide où vous entrez.</p>' +
      '<div class="stack mt-s">' + D.categories.map(function (c) {
        return '<div class="catcard ' + c.tint + '"><span class="cat lg cat-' + c.id + '">' + c.id + '</span><div class="txt"><b>' + esc(c.dip) + '</b><span class="role">' + esc(c.role) + '</span><span class="ex">' + esc(c.ex) + '</span></div></div>';
      }).join('') + '</div>' +
      '<span class="eyebrow mt-m">Pour toutes et tous</span>' +
      '<div class="checks">' + D.conditions.map(function (k) { return '<div>' + I.check + '<span>' + esc(k) + '</span></div>'; }).join('') + '</div>' +
      '<div class="grid-2 mt-m"><a class="btn outline" href="#/calendrier">Calendrier</a><a class="btn outline" href="#/etudes">Quelles études ?</a></div>' +
      '<a class="btn outline" href="#/sans-concours">Entrer sans concours</a>' +
      '</main>' + tabbar('concours');
  };

  screens.calendrier = function () {
    var list = upcoming().filter(function (c) { return S.calCat === 'Toutes' || c.cat === S.calCat; });
    return '<main class="screen top-tight">' + back('#/concours', 'Concours') +
      '<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px"><div class="stack" style="gap:4px"><span class="eyebrow">Calendrier</span><h1 class="sm">Inscriptions ouvertes</h1></div>' +
      '<button type="button" class="icon-btn' + (S.alert ? ' on' : '') + '" data-action="alert" aria-pressed="' + S.alert + '" aria-label="M’alerter des nouveaux concours">' + I.bell + '</button></div>' +
      (S.alert ? '<p class="small" style="margin:0">Alerte activée : vous serez prévenu·e des nouvelles ouvertures.</p>' : '') +
      '<div class="row">' + ['Toutes', 'A', 'B', 'C'].map(function (c) {
        var on = S.calCat === c;
        return '<button type="button" class="chip blue' + (on ? ' on' : '') + '" style="min-width:52px;justify-content:center" aria-pressed="' + on + '"' + attr('action', 'calCat') + attr('v', c) + '>' + c + '</button>';
      }).join('') + '</div>' +
      '<span class="small">Date limite d’inscription</span>' +
      '<div class="list">' + (list.length ? list.map(function (c) {
        var d = fmtDate(c.date);
        return '<div class="list-row static"><div class="date"><b>' + d.day + '</b><span>' + d.month + '</span></div>' +
          '<div class="main"><span class="name" style="font-size:15px">' + esc(c.name) + '</span><span class="meta" style="font-size:12px">' + esc(c.meta) + '</span></div>' +
          '<span class="cat sm cat-' + c.cat + '">' + c.cat + '</span></div>';
      }).join('') : '<p class="empty">Aucun concours de cette catégorie dans les prochaines clôtures.</p>') + '</div>' +
      '<span class="small">Source : calendrier général des concours de la fonction publique d’État.</span>' +
      '<a class="btn mt-s" href="' + D.calendarUrl + '" target="_blank" rel="noopener">Voir tous les concours</a>' +
      '</main>' + tabbar('concours');
  };

  screens.etudes = function () {
    var cfg = D.tracks[S.track] || D.tracks.Administratif;
    return '<main class="screen top-tight">' + back('#/concours', 'Concours') +
      '<span class="eyebrow">Orientation</span><h1 class="sm">Quelles études choisir ?</h1>' +
      '<div class="row">' + Object.keys(D.tracks).map(function (t) {
        var on = S.track === t;
        return '<button type="button" class="chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '"' + attr('action', 'track') + attr('v', t) + '>' + esc(t) + '</button>';
      }).join('') + '</div>' +
      '<div class="timeline">' + cfg.steps.map(function (s, i) {
        var last = i === cfg.steps.length - 1;
        return '<div class="tl' + (last ? ' last' : '') + '"><div class="rail"><span class="node"></span>' + (last ? '' : '<span class="bar"></span>') + '</div>' +
          '<div class="txt"><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></div></div>';
      }).join('') + '</div>' +
      '<div class="callout tint-cyan"><span class="pin"></span><p>' + esc(cfg.tip) + '</p></div>' +
      '<a class="btn mt-s" href="#/prepas">Trouver une prépa</a></main>' + tabbar('concours');
  };

  screens['sans-concours'] = function () {
    return '<main class="screen top-tight">' + back('#/accueil', 'Accueil') +
      '<span class="eyebrow">Autres voies</span><h1 class="sm">Sans concours, c’est possible</h1>' +
      '<p class="lead" style="font-size:15px">4 portes d’entrée dans le service public.</p>' +
      '<div class="list">' + D.noExam.map(function (w, i) {
        return '<div class="list-row static" style="align-items:flex-start;padding:16px 0"><span class="cat sm ' + w.bg + '">' + (i + 1) + '</span>' +
          '<div class="main" style="gap:4px"><span class="name">' + esc(w.t) + '</span><span class="meta" style="font-size:14px;line-height:1.4;color:var(--ink-2)">' + esc(w.d) + '</span></div></div>';
      }).join('') + '</div>' +
      '<a class="btn mt-s" href="' + D.jobsUrl + '" target="_blank" rel="noopener">Voir les offres d’emploi</a></main>' + tabbar('accueil');
  };

  screens.prepas = function () {
    var opts = [['0', 'Gratuit'], ['1', 'Moins de 1 000 €'], ['2', 'Tous budgets']];
    var b = S.prepBudget;
    if (b === null) b = S.budget === 'Gratuit uniquement' ? '0' : (S.budget === 'Moins de 1 000 €' ? '1' : '2');
    var on = S.boursier === 'Oui';
    var list = D.preps.filter(function (p) { return p.budget <= parseInt(b, 10); });
    return '<main class="screen" style="padding-top:32px">' +
      '<span class="eyebrow">Se préparer</span><h1>Prépas</h1>' +
      '<div class="row">' + opts.map(function (o) {
        var sel = b === o[0];
        return '<button type="button" class="chip blue' + (sel ? ' on' : '') + '" aria-pressed="' + sel + '"' + attr('action', 'prepBudget') + attr('v', o[0]) + '>' + o[1] + '</button>';
      }).join('') + '</div>' +
      '<button type="button" class="switch-row" role="switch" aria-checked="' + on + '" data-action="toggleBoursier"><span>' + (isParent() ? 'Mon enfant est boursier·e' : 'Je suis boursier·e') + '</span><span class="switch" aria-hidden="true"></span></button>' +
      '<div class="stack">' + list.map(function (p) {
        var hi = p.talents && on;
        return '<div class="prep' + (hi ? ' hi' : '') + '"><div class="head"><h3 style="font-size:16px">' + esc(p.t) + '</h3><span class="price">' + esc(p.price) + '</span></div><p>' + esc(p.d) + '</p></div>';
      }).join('') + '</div>' +
      '<div class="bourse"><div><b>5 000 € / an</b><span>Bourse Talents 2026-2027, pour les élèves des Prépas Talents.</span></div><span class="dot" style="width:12px;height:12px;border-radius:999px;background:#FFC800;flex:none"></span></div>' +
      '<a class="btn mt-s" href="' + D.prepsMapUrl + '" target="_blank" rel="noopener">Voir la carte des prépas</a></main>' + tabbar('prepas');
  };

  /* ---------- Routeur ---------- */
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/');
    return { name: parts[0] || (S.done ? 'accueil' : 'profil'), arg: parts[1] };
  }

  function render() {
    var r = route();
    var fn = screens[r.name] || screens[S.done ? 'accueil' : 'profil'];
    root.innerHTML = fn(r.arg);
    var t = root.querySelector('h1');
    document.title = (t ? t.textContent + ' · ' : '') + 'Orientation fonction publique';
  }

  window.addEventListener('hashchange', function () { render(); window.scrollTo(0, 0); });

  root.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var a = el.getAttribute('data-action');
    var v = el.getAttribute('data-v');
    switch (a) {
      case 'profile': set({ profile: v, level: S.profile === v ? S.level : null }); break;
      case 'level': set({ level: v }); break;
      case 'domain': {
        var i = S.domains.indexOf(v);
        var next = S.domains.slice();
        if (i > -1) next.splice(i, 1); else next.push(v);
        set({ domains: next }); break;
      }
      case 'boursier': set({ boursier: v }); break;
      case 'budget': set({ budget: v, prepBudget: null }); break;
      case 'go': location.hash = '#/' + v; break;
      case 'finish': S.done = true; save(); location.hash = '#/accueil'; break;
      case 'skip': S.done = true; save(); break;
      case 'metDomain': set({ metDomain: v }); break;
      case 'metCat': set({ metCat: v }); break;
      case 'calCat': set({ calCat: v }); break;
      case 'track': set({ track: v }); break;
      case 'prepBudget': set({ prepBudget: v }); break;
      case 'toggleBoursier': set({ boursier: S.boursier === 'Oui' ? 'Non' : 'Oui' }); break;
      case 'alert': set({ alert: !S.alert }); break;
    }
  });

  /* Recherche : on ne re-rend que la liste pour garder le focus */
  root.addEventListener('input', function (e) {
    if (e.target.id !== 'q') return;
    S.q = e.target.value; save();
    var box = document.getElementById('jobs');
    if (box) box.innerHTML = jobRows();
  });

  render();
})();
