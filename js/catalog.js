(function () {
  'use strict';
  var D = window.DATA, P = window.PUBLIC_DATA;
  Object.assign(D, P.settings || {});
  /* Titres au masculin puis au féminin : « Administrateur - Administratrice ». */
  var GENDER_PLAIN = {
    'Commandant d\'unité de combat': 'Commandant - Commandante d’unité de combat', 'Démineur': 'Démineur - Démineuse', 'Sapeur-Sauveteur': 'Sapeur-sauveteur - Sapeuse-sauveteuse', 'Maçon': 'Maçon - Maçonne',
    'Comptable public': 'Comptable public - Comptable publique', 'Interprète - traductrice / traducteur': 'Interprète-traducteur - Interprète-traductrice',
    'Médecin - Cheffe / Chef de SDIS': 'Médecin-chef - Médecin-cheffe de SDIS',
    'Secrétaire Générale / Général de Région Académique - Secrétaire Générale / Général d’Académie': 'Secrétaire général - Secrétaire générale de région académique ou d’académie'
  };
  function femWord(w, suf) {
    if (suf === 'rice') return w.replace(/eur$/, 'rice');
    if (suf === 'trice') return w.replace(/teur$/, 'trice');
    if (suf === 'ère' || suf === 'ere') return w.replace(/er$/, 'ère');
    if (suf === 'ière') return w.replace(/ier$/, 'ière');
    if (suf === 've') return w.replace(/f$/, 've');
    if (suf === 'se') return w.replace(/r$/, 'se');
    if (suf === 'euse') return w.replace(/eur$/, 'euse');
    return w + suf;
  }
  var DOTTED = /([A-Za-zÀ-ÖØ-öø-ÿ]+)·([a-zà-öø-ÿ]+)(?:·[a-zà-öø-ÿ]+)?/g;
  function mascOf(t) { return t.replace(DOTTED, '$1'); }
  function femOf(t) { return t.replace(DOTTED, function (m, w, suf) { return femWord(w, suf); }); }
  function stem(w) { return String(w || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().slice(0, 3); }
  function isLink(t) { return /^(de|du|des|d[’']\S*|en|à|au|aux|pour|et|ou|sur|dans|chez|par|avec|-|–|—|:|\(.*)$/i.test(t); }
  function genderedTitle(name) {
    var raw = String(name || '').replace(/\s+$/, '').replace(/police municipal·e/g, 'police municipale'), prefix = '';
    if (GENDER_PLAIN[raw]) return GENDER_PLAIN[raw];
    var pm = raw.match(/^(Concours\s*:\s*)(.+)$/); if (pm) { prefix = pm[1]; raw = pm[2]; }
    var out = raw;
    var sl = raw.match(/^(.+?) \/ (.+)$/), left = sl ? sl[1].split(' ') : [], right = sl ? sl[2].split(' ') : [];
    /* « Féminin / Masculin complément », avec parfois un mot commun devant (« Cadre commerciale / commercial »). */
    var k = left.findIndex(function (w) { return stem(w) === stem(right[0]); });
    if (sl && k > -1 && left.slice(0, k).join(' ').indexOf('-') === -1) {
      var lead = left.slice(0, k).join(' '), fem = left.slice(k), n = fem.length, masc = right.slice(0, n).join(' '), comp = right.slice(n).join(' ');
      lead = lead ? lead + ' ' : '';
      out = masc === fem.join(' ') ? sl[2] : lead + masc + ' - ' + lead + fem.join(' ') + (comp ? ' ' + comp : '');
    } else if (/^Ingénieur(?![e·]| - )/.test(raw)) {
      out = raw.replace(/^Ingénieur/, 'Ingénieur - Ingénieure');
    } else if (/[A-Za-zÀ-ÖØ-öø-ÿ]·[a-zà-öø-ÿ]/.test(raw)) {
      var tokens = raw.split(' '), i = 1;
      while (i < tokens.length && !isLink(tokens[i])) i++;
      var head = tokens.slice(0, i).join(' '), rest = tokens.slice(i).join(' ');
      if (mascOf(head) !== head && mascOf(rest) === rest) out = mascOf(head) + ' - ' + femOf(head) + (rest ? ' ' + rest : '');
      else out = mascOf(raw) + ' - ' + femOf(raw);
    } else {
      var inl = raw.match(/^(.*?)(\S+)\/(\S+)(.*)$/);
      if (inl && stem(inl[2]) === stem(inl[3]) && inl[2] !== inl[3]) {
        var restWords = inl[4];
        var cut = restWords.search(/ (de|du|des|d[’']|en|à|au|aux|pour)\b/);
        var tail = cut > -1 ? restWords.slice(cut) : '', mid = cut > -1 ? restWords.slice(0, cut) : restWords;
        out = inl[1] + inl[3] + mid + ' - ' + inl[1] + inl[2] + mid + tail;
      }
    }
    return prefix + out;
  }
  /* Métiers, corps et sessions : intitulé masculin puis féminin, sans point médian. */
  (P.legacyJobs || []).concat(P.rmfp || []).forEach(function (j) {
    j.name = genderedTitle(j.name);
    (j.ladder || []).forEach(function (r) { if (r.length > 1) r[0] = genderedTitle(r[0]); });
  });
  (P.routes || []).forEach(function (r) { r.name = genderedTitle(r.name); });
  (P.examDetails || []).forEach(function (e) { if (e.name) e.name = genderedTitle(e.name); });
  (P.calendar || []).forEach(function (c) { if (c.name) c.name = genderedTitle(c.name); });
  D.jobs = (P.legacyJobs || D.jobs).filter(function (j) { return j.active !== false; });
  Object.assign(D, P.otherPreps || {});
  /* Un rapprochement rejeté (base ou corrections d’audit) l’emporte toujours sur un rapprochement proposé. */
  var rejectedLinks = {}, linksByJob = {};
  P.links.forEach(function (l) { if (l.status === 'rejeté') rejectedLinks[l.jobId + '|' + l.routeId] = true; });
  P.links.forEach(function (l) { if (l.status !== 'rejeté' && !rejectedLinks[l.jobId + '|' + l.routeId]) { var list = linksByJob[l.jobId] || (linksByJob[l.jobId] = []); if (list.indexOf(l.routeId) === -1) list.push(l.routeId); } });
  function linkedRoutes(id) { return (linksByJob[id] || []).slice(); }
  /* Audit : catégories et versants rectifiés des métiers, catégories statutaires des corps. */
  var jobFix = {}; (P.jobCorrections || []).forEach(function (f) { jobFix[f.id] = f; });
  (P.rmfp || []).concat(P.legacyJobs || []).forEach(function (j) {
    var f = jobFix[j.id]; if (!f) return;
    if (f.categories) { j.categories = f.categories.slice(); delete j.categoryCounts; j.cat = f.categories.length === 1 ? f.categories[0] : 'V'; j.categorySource = 'audit'; }
    if (f.fp) j.fp = f.fp;
    if (f.recruitment) j.recruitment = f.recruitment;
  });
  var routeFix = {}; (P.routeCorrections || []).forEach(function (f) { routeFix[f.id] = f; });
  P.routes.forEach(function (r) { if (routeFix[r.id]) r.cat = routeFix[r.id].cat; });
  var byRoute = {};
  P.routes.forEach(function (r) { byRoute[r.id] = r; });
  (P.examDetails || []).forEach(function(e){var r=byRoute[e.routeId];if(r)(r.examInfo||(r.examInfo={}))[e.fp]=e;});
  D.accessRoutes = byRoute;
  /* Référentiel des concours : chaque corps reçoit les concours qui y mènent, par versant. */
  D.concours = P.concours || []; D.sigles = P.sigles || []; D.stagesAdvice = P.stagesAdvice || []; D.prepaOrganisms = P.prepaOrganisms || [];
  D.concoursById = {};
  D.concours.forEach(function (c) { D.concoursById[c.id] = c; c.routeIds.forEach(function (id) { var r = byRoute[id]; if (r) (r.refs || (r.refs = [])).push(c); }); });
  D.crosswalk = P.links;
  D.catalogChecked = P.checked;
  D.catalogSources = P.sources;
  D.rmfpCount = P.rmfp.length;
  D.talents = P.talents.map(function (t) { return Object.assign({}, t, { coords: t.coords || P.talentsGeo[t.city] || null }); });
  D.jobs.forEach(function (j) {
    var r = byRoute[j.id];
    j.routeIds = linkedRoutes(j.id);
    j.source = j.source || (r ? r.source : D.jobsUrl);
  });
  P.rmfp.forEach(function (j) {
    j.routeIds = linkedRoutes(j.id);
    j.steps = j.steps && j.steps.length ? j.steps : ['Repérer les corps ou cadres d’emplois et les diplômes correspondant au poste', '*Consulter les concours et les recrutements de l’employeur', 'Vérifier les conditions et candidater auprès du service recruteur'];
    if (j.traits && j.traits.length) return;
    j.traits = [];
    var text = (j.activities + ' ' + j.skills).toLowerCase();
    [['accueil', /accueill/], ['manager', /manager|encadrer une équipe/], ['ecrire', /rédiger/], ['chiffres', /calcul|statistiq|comptab/], ['equipe', /travailler en équipe/], ['organise', /organiser|planifier/]].forEach(function (p) {
      if (p[1].test(text)) j.traits.push(p[0]);
    });
  });
  D.jobs = D.jobs.concat(P.rmfp.filter(function (j) { return j.active !== false; }));
  /* Les centres d’intérêt complètent le domaine principal sans modifier les liens métier / corps. */
  D.domainOptions = D.interestOptions || D.domains.map(function(id){return {id:id,label:id};});
  D.domainLabels = {};
  function normalize(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,' ').toLowerCase();}
  var interests = D.domainOptions.map(function(option){
    D.domainLabels[option.id]=option.label;
    return {option:option,namePattern:option.namePattern?new RegExp(option.namePattern):null};
  });
  D.domains = D.domainOptions.map(function(option){return option.id;});
  D.jobs.forEach(function(job){
    var name=normalize(job.name);
    job.interests=interests.filter(function(rule){var option=rule.option;return option.id===job.domain||
      (option.rmfpDomains||[]).indexOf(job.rmfpDomain)>-1||(option.families||[]).indexOf(job.family)>-1||
      (rule.namePattern&&rule.namePattern.test(name));}).map(function(rule){return rule.option.id;});
  });
  D.calendar = P.calendar.filter(function(c){return !c.duplicateOf;});
  /* Prochaines sessions attendues, quand les dates ne sont pas encore publiées (recherche du 19 octobre 2026). */
  D.calendarExpected = P.calendarExpected || [];
  D.books = P.books || []; D.bookSource = P.bookSource;
  D.studyResources = P.studyResources || [];
  /* Une collection d’annales citée par plusieurs concours du référentiel est rattachée à chacun. */
  D.concours.forEach(function (c) {
    if (!c.annales) return;
    D.studyResources.forEach(function (r) {
      if (r.url !== c.annales.url) return;
      c.routeIds.forEach(function (id) { if (r.routeIds.indexOf(id) === -1) r.routeIds.push(id); });
      if (r.categories.indexOf(c.cat) === -1) r.categories.push(c.cat);
      if (r.fps.indexOf(c.fp) === -1) r.fps.push(c.fp);
    });
  });
  D.examPortals = { E: D.calendarUrl, H: 'https://www.concours-fph.ars.sante.fr/', T: 'https://www.concours-territorial.fr/' };
  D.teacherResources = D.teacherResources || 'https://www.devenirenseignant.gouv.fr/ressources';
})();
