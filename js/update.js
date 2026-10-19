/* Une nouvelle version est proposée sans interrompre le parcours ni la saisie. */
(function () {
  'use strict';
  var currentVersion = '20261019-19';
  var latestVersion = null, dismissedVersion = null, notice = null;
  var lastCheck = null, checking = false;
  var onboarding = ['bienvenue', 'versants', 'categories-intro', 'choix-profil', 'profil', 'niveau', 'interets', 'traits', 'situation'];

  function newer(version) {
    if (typeof version !== 'string' || !/^\d{8}-\d+$/.test(version)) return false;
    var next = version.split('-'), current = currentVersion.split('-');
    return Number(next[0]) > Number(current[0]) || (next[0] === current[0] && Number(next[1]) > Number(current[1]));
  }
  function safeToOffer() {
    var route = window.location.hash.replace(/^#\/?/, '').split('/')[0];
    if (!route || onboarding.indexOf(route) !== -1 || document.visibilityState !== 'visible') return false;
    if (document.querySelector('dialog[open]')) return false;
    var active = document.activeElement;
    return !active || (!/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName) && !active.isContentEditable);
  }
  function showNotice() {
    var visible = latestVersion && latestVersion !== dismissedVersion && safeToOffer();
    if (!notice && visible) {
      notice = document.createElement('aside');
      notice.className = 'update-notice';
      notice.setAttribute('role', 'status');
      notice.setAttribute('aria-label', 'Mise à jour disponible');
      var message = document.createElement('span');
      message.className = 'update-notice-copy';
      message.textContent = 'Une nouvelle version est disponible.';
      var refresh = document.createElement('button');
      refresh.type = 'button'; refresh.className = 'update-notice-action';
      refresh.textContent = 'Actualiser';
      refresh.addEventListener('click', function () {
        if (!safeToOffer() || !latestVersion) return;
        var url = new URL(window.location.href);
        url.searchParams.set('v', latestVersion);
        window.location.replace(url.href);
      });
      var dismiss = document.createElement('button');
      dismiss.type = 'button'; dismiss.className = 'update-notice-dismiss';
      dismiss.textContent = 'Plus tard';
      dismiss.addEventListener('click', function () { dismissedVersion = latestVersion; showNotice(); });
      notice.appendChild(message); notice.appendChild(refresh); notice.appendChild(dismiss);
      document.body.appendChild(notice);
    }
    if (notice) notice.hidden = !visible;
  }
  function check(force) {
    if (checking || (!force && lastCheck !== null && Date.now() - lastCheck < 60000)) return;
    checking = true; lastCheck = Date.now();
    fetch(new URL('version.json', document.baseURI).href, { cache: 'no-store' })
      .then(function (response) { if (!response.ok) throw new Error('Version indisponible'); return response.json(); })
      .then(function (data) { if (newer(data.version)) latestVersion = data.version; })
      .catch(function () { /* Hors connexion, le parcours courant reste disponible. */ })
      .then(function () { checking = false; showNotice(); });
  }
  function start() {
    window.addEventListener('hashchange', function () { showNotice(); check(false); });
    window.addEventListener('pageshow', function () { check(true); });
    document.addEventListener('visibilitychange', function () {
      showNotice(); if (document.visibilityState === 'visible') check(true);
    });
    document.addEventListener('focusin', showNotice);
    document.addEventListener('focusout', function () { setTimeout(showNotice, 0); });
    new MutationObserver(showNotice).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
    check(true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
