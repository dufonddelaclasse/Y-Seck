#!/usr/bin/env python3
"""Page de test « Noir » : même appli, couleur générique noire et fond en dégradé de gris.

Génère, sans toucher à l’appli en ligne :
  - css/test-noir.css et css/test-noir-dark.css (copies de style.css et dark.css aux couleurs du test) ;
  - test-noir.html (copie d’index.html qui charge ces feuilles).
Les couleurs des catégories (A+, A, B, C) ne changent pas : ce sont elles qui portent la couleur, comme dans les exemples.
Relancer après chaque modification de style.css ou dark.css : python3 scripts/build_test_noir.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Clair : le bleu-violet générique devient noir, ses teintes deviennent des gris.
LIGHT = {
    '#2500BA': '#141414', '#2B04CC': '#141414', '#2B00BA': '#141414', '#000091': '#141414',
    '#3A16E0': '#2E2E32', '#1212FF': '#2E2E32',
    '#E3E3FD': '#E6E6E6', '#ECECFE': '#ECECEC', '#F5F5FE': '#F4F4F4', '#F0F3FF': '#F1F1F1',
    '#EEEAFF': '#EFEFEF', '#DAD1FF': '#E2E2E2', '#D4D1FF': '#DCDCDC', '#BDB7FF': '#CFCFCF',
    '#D8D2F2': '#DADADA',
    # Fond : du gris très clair en haut au gris moyen en bas.
    '#F6F7F2': '#F5F5F5', '#E3E1EF': '#D9D9DB',
}
# Sombre : le violet clair générique devient un gris très clair, ses teintes des gris foncés.
DARK = {
    '#8F7BFF': '#EDEDED', '#957AFF': '#EDEDED', '#7A7AFF': '#EDEDED', '#9A86F3': '#D6D6D6', '#B3A6FF': '#D6D6D6',
    '#271E4F': '#2A2A2A', '#2B2056': '#303030',
}
RGBA = {'rgba(43,4,204,': 'rgba(20,20,20,', 'rgba(37,0,186,': 'rgba(20,20,20,'}

OVERRIDES_LIGHT = """
/* ---------- Test « Noir » : réglages finaux ---------- */
:root { --brand:#141414; --blue:#141414; --blue-hover:#2E2E32; --accent:#141414; --accent-hover:#2E2E32; --accent-tint:#EDEDED;
  --lilac:#E2E2E2; --lilac-soft:#EFEFEF; --card-line:#DADADA; --theme-btn:#141414; }
html { background:#D9D9DB; }
body::before { background:linear-gradient(180deg, #F5F5F5 0, #E4E4E6 420px, #D9D9DB 860px) !important; }
.footer { background:#D9D9DB; }
.context-bar { background:#F5F5F5; }
:root { --discover-flow:linear-gradient(90deg,#141414 0%,#262628 30%,#4A4A4E 50%,#262628 70%,#141414 100%);
  --name-sweep:linear-gradient(180deg, var(--ink) 0%, var(--ink) 25%, #4A4A4E 33%, #9A9AA0 41%, #E0FA6E 50%, #9A9AA0 59%, #4A4A4E 67%, var(--ink) 75%, var(--ink) 100%); }
.personal-home .home-concours, .personal-home .home-concours:hover { background:#E4E4E6; }
.test-badge { position:fixed; z-index:20; right:10px; bottom:calc(86px + env(safe-area-inset-bottom, 0px)); padding:6px 10px; border-radius:999px; background:#E0FA6E; color:#141414; font:500 .75rem/1 inherit; pointer-events:none; }
"""
OVERRIDES_DARK = """
/* ---------- Test « Noir » : réglages finaux (mode nuit) ---------- */
:root:where(.dark), html.dark { --brand:#EDEDED; --blue:#EDEDED; --blue-hover:#D6D6D6; --accent:#EDEDED; --accent-hover:#D6D6D6; --accent-tint:#2A2A2A; --lilac:#303030; --lilac-soft:#2A2A2A; }
html.dark { --discover-flow:linear-gradient(90deg,#000 0%,#1E1E20 30%,#3A3A3E 50%,#1E1E20 70%,#000 100%); }
html.dark .personal-home .home-concours, html.dark .personal-home .home-concours:hover { background:#2E2E31; color:#F2F2F2; }
html.dark .personal-home .home-concours :is(.home-feature-copy b, .home-feature-copy > span, .home-count) { color:#F2F2F2; }
html.dark .btn:not(.outline), html.dark .explore-switch a.on, html.dark .explore-switch[data-on] a[aria-selected="true"] { color:#141414; }
"""


def swap(text, table):
    for k, v in table.items():
        text = re.sub(re.escape(k), v, text, flags=re.I)
    for k, v in RGBA.items():
        text = text.replace(k, v)
    return text


def main():
    style = (ROOT / 'css/style.css').read_text(encoding='utf-8')
    dark = (ROOT / 'css/dark.css').read_text(encoding='utf-8')
    (ROOT / 'css/test-noir.css').write_text('/* Généré par scripts/build_test_noir.py : ne pas modifier à la main. */\n' + swap(style, LIGHT) + OVERRIDES_LIGHT, encoding='utf-8')
    (ROOT / 'css/test-noir-dark.css').write_text('/* Généré par scripts/build_test_noir.py : ne pas modifier à la main. */\n' + swap(swap(dark, LIGHT), DARK) + OVERRIDES_DARK, encoding='utf-8')
    index = (ROOT / 'index.html').read_text(encoding='utf-8')
    page = re.sub(r'css/style\.css\?v=([\w-]+)', r'css/test-noir.css?v=\1', index)
    page = re.sub(r'css/dark\.css\?v=([\w-]+)', r'css/test-noir-dark.css?v=\1', page)
    page = page.replace('<meta name="theme-color" content="#2500BA">', '<meta name="theme-color" content="#F5F5F5">')
    page = page.replace('<title>Y-Seck</title>', '<title>Y-Seck · test Noir</title>\n  <meta name="robots" content="noindex">')
    page = page.replace('<div class="app" id="app"></div>', '<div class="app" id="app"></div>\n  <span class="test-badge" aria-hidden="true">Test Noir</span>')
    # La barre d’état suit la couleur du test (l’appli y remet le bleu générique à chaque rendu).
    page = page.replace('</body>', '''  <script>(function(){var m=document.querySelector('meta[name="theme-color"]');if(!m||!window.MutationObserver)return;function fix(){if(/^#2500BA$/i.test(m.getAttribute('content')))m.setAttribute('content','#F5F5F5');}fix();new MutationObserver(fix).observe(m,{attributes:true});})();</script>
</body>''')
    (ROOT / 'test-noir.html').write_text(page, encoding='utf-8')
    print('test-noir.html, css/test-noir.css et css/test-noir-dark.css générés.')


if __name__ == '__main__':
    main()
