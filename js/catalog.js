(function () {
  'use strict';
  var D = window.DATA, P = window.PUBLIC_DATA;
  Object.assign(D, P.settings || {});
  D.jobs = (P.legacyJobs || D.jobs).filter(function (j) { return j.active !== false; });
  Object.assign(D, P.otherPreps || {});
  var byRoute = {};
  P.routes.forEach(function (r) { byRoute[r.id] = r; });
  D.accessRoutes = byRoute;
  D.crosswalk = P.links;
  D.catalogChecked = P.checked;
  D.catalogSources = P.sources;
  D.rmfpCount = P.rmfp.length;
  D.talents = P.talents.map(function (t) { return Object.assign({}, t, { coords: t.coords || P.talentsGeo[t.city] || null }); });
  D.jobs.forEach(function (j) {
    var r = byRoute[j.id];
    j.routeIds = P.links.filter(function (l) { return l.jobId === j.id && l.status !== 'rejeté'; }).map(function (l) { return l.routeId; });
    j.source = j.source || (r ? r.source : D.jobsUrl);
  });
  P.rmfp.forEach(function (j) {
    j.routeIds = P.links.filter(function (l) { return l.jobId === j.id && l.status !== 'rejeté'; }).map(function (l) { return l.routeId; });
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
  D.calendar = P.calendar;
  D.books = P.books || []; D.bookSource = P.bookSource;
  D.studyResources = P.studyResources || [];
  D.examPortals = { E: D.calendarUrl, H: 'https://www.concours-fph.ars.sante.fr/', T: 'https://www.concours-territorial.fr/' };
  D.teacherResources = D.teacherResources || 'https://www.devenirenseignant.gouv.fr/ressources';
})();
