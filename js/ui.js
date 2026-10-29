/* Panneaux, confirmation des liens et rappel de contexte au défilement. */
(function () {
  'use strict';
  var icons = {}, paths = {
    settings: '<path d="M3 8.8h2.6M10.6 8.8H21M3 15.2h10.6M18.6 15.2H21"/><circle cx="8.1" cy="8.8" r="2.5"/><circle cx="16.1" cy="15.2" r="2.5"/>',
    heart: '<path d="M12 20S3 14.6 3 8.5a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1C21 14.6 12 20 12 20z"/>',
    bookmark: '<path d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v15L12 16l-6.5 4V5A1.5 1.5 0 0 1 7 3.5z"/>',
    home: '<path d="M3.5 10.5 11 4a1.5 1.5 0 0 1 2 0l7.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-7H9v7H5A1.5 1.5 0 0 1 3.5 19z"/>',
    compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    graduation: '<path d="m2 9 10-5 10 5-10 5zM6 11v6c4 3 8 3 12 0v-6M22 9v7"/>',
    government: '<path d="m3 8 9-5 9 5zM4 21h16M5 18h14M6 10v6m4-6v6m4-6v6m4-6v6"/>',
    city: '<path d="M3 21h18M4 21V10l5-4 5 4v11M14 21V6h6v15M7 13h4m-4 4h4M17 9h.01M17 13h.01M17 17h.01"/>',
    hospital: '<path d="M4 21V6h16v15M9 21v-5h6v5M12 3v8m-4-4h8M7 13h.01M17 13h.01"/>',
    back: '<path d="m14.5 5-7 7 7 7"/>',
    book: '<path d="M12 5.5C9 3.5 5.5 3.5 3 4.5v15c3-1 6-.5 9 1 3-1.5 6-2 9-1v-15c-2.5-1-6-1-9 1zm0 0v15"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M8 3v5m8-5v5M4 11h16m-11 4h.01M12 15h.01M15 15h.01M9 18h.01M12 18h.01"/>',
    route: '<circle cx="6" cy="5" r="2"/><circle cx="18" cy="19" r="2"/><path d="M6 7v6a3 3 0 0 0 3 3h6a3 3 0 0 0 0-6h-3"/>',
    growth: '<path d="M4 19h16M6 15l5-5 4 3 5-7m-5 0h5v5"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v6m0-10h.01"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21c0-8 14-8 14 0"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>'
  };
  /* Parcours : épingle de départ, étapes en pointillés et point d’arrivée (pictogramme fourni). */
  icons.parcours = '<svg class="parcours-icon" viewBox="0 0 12 48" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M6 0a5 5 0 0 1 5 5c0 3.2-3.4 6.5-4.6 7.6a.6.6 0 0 1-.8 0C4.4 11.5 1 8.2 1 5a5 5 0 0 1 5-5zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/><circle cx="6" cy="16" r="1.1"/><circle cx="6" cy="21" r="1.1"/><circle cx="6" cy="26.5" r="1.9"/><circle cx="6" cy="32" r="1.1"/><circle cx="6" cy="37" r="1.1"/><circle cx="6" cy="44" r="4"/></svg>';
  icons.pencil = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15.5 4.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/><path d="M13.5 6.5l3 3"/></svg>';
  /* Contractuels : document plié, trait épais comme sur la maquette. */
  icons.contract = '<svg class="contract-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h9.5A1.5 1.5 0 0 1 20 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5V8z"/><path d="M9 3v5H4"/><path d="M8 11.5h8M8 14.5h8M8 17.5h4"/></svg>';
  Object.keys(paths).forEach(function (k) { icons[k] = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[k] + '</svg>'; });
  var dialog, toolbar, cfg, kind = null, alwaysBar = false, returnTo, pendingUrl = '', contextHeading, scrollFrame, contextH = 0;
  /* Appelée à chaque défilement et redimensionnement (Chrome sur iPhone redimensionne la page quand ses barres se rétractent) :
     rien n’est réécrit tant que rien ne change, pour ne pas relancer le calcul des styles de toute la page. */
  function updateContext(){
    var hidden=!alwaysBar&&(!contextHeading||window.scrollY<=0||contextHeading.getBoundingClientRect().top>=0);
    if(toolbar.hidden!==hidden)toolbar.hidden=hidden;
    /* Hauteur réelle de la barre : les blocs collants de la page se placent juste en dessous. */
    var h=hidden?0:toolbar.offsetHeight;
    if(h&&h!==contextH){contextH=h;document.documentElement.style.setProperty('--context-h',h+'px');}
  }
  function scheduleContext(){
    if(scrollFrame)return;
    scrollFrame=requestAnimationFrame(function(){scrollFrame=null;updateContext();});
  }
  var historySession='yseck-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),historyPosition=0;
  function tagHistory(){history.replaceState(Object.assign({},history.state,{yseckNavigation:{session:historySession,index:historyPosition,url:location.href}}),'',location.href);}
  function syncHistory(){
    var mark=history.state&&history.state.yseckNavigation;
    if(mark&&mark.session===historySession&&mark.url===location.href)historyPosition=mark.index;
    else {historyPosition++;tagHistory();}
  }
  function goBack(){
    if(historyPosition>0){history.back();return;}
    var link=cfg&&cfg.root.querySelector('a.back[href]');
    location.hash=link?link.getAttribute('href'):(location.hash==='#/accueil'?'#/profil':'#/accueil');
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function(c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function headingIcon(text) {
    if (/domaine|catégor/i.test(text)) return icons.compass;
    if (/sélection|préférence|façon|caractère/i.test(text)) return icons.settings;
    if (/versant|lieu/i.test(text)) return icons.home;
    if (/accéder|parcours|étape|démarche/i.test(text)) return icons.route;
    if (/évoluer|perspectives/i.test(text)) return icons.growth;
    if (/date|calendrier|session/i.test(text)) return icons.calendar;
    if (/favori/i.test(text)) return icons.heart;
    if (/prépa|préparer|bibliogra|ressource|étude/i.test(text)) return icons.book;
    if (/profil|famille|enfant/i.test(text)) return icons.user;
    return icons.info;
  }
  function decorate(scope) {
    scope.querySelectorAll('h2:not(.sheet-title):not(.book-title):not(.no-icon), h3:not(.book-title):not(.no-icon)').forEach(function (h) {
      if (h.querySelector('svg')) return;
      h.classList.add('section-heading'); h.insertAdjacentHTML('afterbegin', headingIcon(h.textContent));
    });
  }
  function content(title, html) {
    var active = document.activeElement, action = active && active.dataset.action, value = active && active.dataset.v;
    var scroll = dialog.querySelector('.sheet-content') ? dialog.querySelector('.sheet-content').scrollTop : 0;
    dialog.innerHTML = '<div class="sheet-shell"><div class="sheet-handle" aria-hidden="true"></div><header class="sheet-head"><h2 class="sheet-title" id="sheet-title">' + esc(title) + '</h2><button type="button" class="icon-btn" data-ui="close" aria-label="Fermer le panneau">' + icons.close + '</button></header><div class="sheet-content">' + html + '</div></div>';
    decorate(dialog); dialog.querySelector('.sheet-content').scrollTop = scroll;
    if (action) {
      var el = Array.from(dialog.querySelectorAll('[data-action]')).find(function (e) { return e.dataset.action === action && e.dataset.v === value; });
      if (el) el.focus({preventScroll:true});
    }
  }
  /* Écriture inclusive affichée avec une barre oblique : « Administrateur/rice ». */
  /* Typographie française : espace insécable avant « : ; ? ! » et à l’intérieur des guillemets, pour que la ponctuation ne passe jamais seule à la ligne. */
  function inclusive(text) { return String(text).replace(/([A-Za-zÀ-ÖØ-öø-ÿ])·(?=[a-zà-öø-ÿ])/g, '$1/').replace(/ ([:;?!»])/g, '\u00a0$1').replace(/« /g, '«\u00a0'); }
  function open(type, title, html, trigger) {
    title = inclusive(title); html = inclusive(html);
    if (!dialog) return;
    if (dialog.open) close();
    kind = type; returnTo = trigger || document.activeElement;
    content(title, html); document.documentElement.classList.add('has-sheet'); dialog.showModal();
    dialog.querySelector('[data-ui="close"]').focus({preventScroll:true});
  }
  function close() { if (dialog && dialog.open) dialog.close(); kind = null; document.documentElement.classList.remove('has-sheet'); }
  function init() {
    tagHistory();
    dialog = document.createElement('dialog'); dialog.className = 'sheet'; dialog.setAttribute('aria-labelledby','sheet-title'); document.body.appendChild(dialog);
    toolbar = document.createElement('header'); toolbar.className = 'context-bar'; toolbar.hidden = true; document.body.appendChild(toolbar);
    window.addEventListener('scroll',scheduleContext,{passive:true});
    window.addEventListener('resize',scheduleContext);
    dialog.addEventListener('close', function () {
      if (dialog.open) return;
      kind = null; pendingUrl = ''; document.documentElement.classList.remove('has-sheet');
      var target = returnTo && returnTo.isConnected ? returnTo : document.getElementById('filters-open');
      if (target) target.focus({preventScroll:true});
    });
    dialog.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ui]');
      if (b && b.dataset.ui === 'close') close();
      if (b && b.dataset.ui === 'continue') { var url = pendingUrl; close(); window.open(url, '_blank', 'noopener,noreferrer'); }
      if (e.target === dialog) { var r=dialog.getBoundingClientRect(); if (e.clientY<r.top || e.clientX<r.left || e.clientX>r.right || e.clientY>r.bottom) close(); }
    });
    toolbar.addEventListener('click',function(e) {
      if(e.target.closest('[data-ui="back"]'))goBack();
      if (e.target.closest('[data-ui="top"]')) {window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});var h=document.querySelector('main h1');if(h)h.focus({preventScroll:true});}
    });
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]'); if (!a || e.defaultPrevented) return;
      var u; try {u=new URL(a.href,location.href);}catch(err){return;}
      if (!/^https?:$/.test(u.protocol) || u.origin === location.origin) return;
      e.preventDefault();
      open('external','Site externe','<p class="body">Vous allez être redirigé vers un site externe.</p><p class="small external-host">' + esc(u.hostname) + '</p><div class="sheet-actions"><button class="btn" type="button" data-ui="continue">Continuer</button><button class="btn outline" type="button" data-ui="close">Annuler</button></div>',a);
      pendingUrl=u.href;
    });
  }
  function afterRender(options) {
    cfg=options; if(options.changed){syncHistory();if(kind)close();} decorate(options.root);
    options.root.querySelectorAll('a[href]').forEach(function(a){try{var u=new URL(a.href,location.href);if(/^https?:$/.test(u.protocol)&&u.origin!==location.origin){a.classList.add('external-link');if(/(^|\.)gouv\.fr$/.test(u.hostname)||u.hostname==='service-public.fr')a.classList.add('government-link');}}catch(err){/* lien local */}});
    /* Pages de premier niveau : titre seul, sans flèche de retour. */
    toolbar.classList.toggle('top-level', !!options.topLevel);
    toolbar.innerHTML = (options.topLevel ? '' : '<button class="icon-btn context-back" type="button" data-ui="back" aria-label="Retour à l’écran précédent">'+icons.back+'</button>') + '<button class="context-title" type="button" data-ui="top" aria-label="Revenir au début : ' + esc(options.title) + '">' + esc(options.title) + '</button>' + (options.switchHtml ? '<div class="context-switch">' + options.switchHtml + '</div>' : '') + (options.category ? '<span class="cat context-category '+esc(options.category.className)+'" aria-label="'+(options.category.label==='CDD'?'Emploi contractuel':'Catégorie '+esc(options.category.label))+'">'+(options.category.label==='CDD'?icons.contract:esc(options.category.label))+'</span>' : (options.categories||[]).length?'<span class="context-categories" aria-label="Catégories selon le poste">'+options.categories.map(function(c){return '<span class="cat sm '+esc(c.className)+'">'+esc(c.label)+'</span>';}).join('')+'</span>':'') + (options.isJobs ? '<button class="icon-btn" type="button" data-action="openFilters" aria-label="Régler les filtres">' + icons.settings + '</button><div class="context-summary">' + options.summary + '</div>' : '');
    contextHeading=options.noBar?null:options.root.querySelector('h1');
    /* Sous-pages : la barre reste affichée avec le titre de la page actuelle et remplace le lien de retour. */
    alwaysBar=!options.noBar&&!options.topLevel&&!options.root.classList.contains('onboarding')&&!!options.root.querySelector('.screen > a.back, .topbar > a.back');
    if(document.body&&document.body.classList)document.body.classList.toggle('has-bar',alwaysBar);
    updateContext();
    if(kind==='filters')content(options.filtersTitle||'Filtrer les métiers',options.filters);
    if(kind==='profile-field'&&options.profileField)content(options.profileFieldTitle,options.profileField);
    if(kind==='resource-filters')content('Filtrer les ressources',options.resourceFilters);
  }
  /* Pas de zoom dans l’app : Safari sur iPhone ignore « user-scalable=no », le pincement à deux doigts est donc bloqué ici.
     Le confort de lecture (grands caractères) reste proposé dans l’app. */
  ['gesturestart', 'gesturechange'].forEach(function (type) { document.addEventListener(type, function (e) { e.preventDefault(); }, { passive: false }); });
  document.addEventListener('touchmove', function (e) { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
  window.YSECK_UI = {icons:icons,inclusive:inclusive,init:init,afterRender:afterRender,open:open,close:close,current:function(){return kind;}};
})();
