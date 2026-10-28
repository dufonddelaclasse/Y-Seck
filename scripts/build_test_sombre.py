#!/usr/bin/env python3
"""Page de test « Sombre » : l’appli en mode sombre uniquement, sur fond noir, aux couleurs de catégories du mode clair.

Génère test-sombre.html (copie d’index.html) qui charge, en plus de style.css et dark.css, css/test-sombre.css.
L’appli en ligne (index.html) et ses feuilles ne changent pas. Relancer après une modification d’index.html :
    python3 scripts/build_test_sombre.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

FORCE_DARK = """<script>/* Test : mode sombre imposé, sans toucher au réglage enregistré de l’appli. */
(function(){var h=document.documentElement;function on(){if(!h.classList.contains('dark'))h.classList.add('dark');}on();
if(window.MutationObserver)new MutationObserver(on).observe(h,{attributes:true,attributeFilter:['class']});
var m=document.querySelector('meta[name="theme-color"]');if(m){var fix=function(){if(m.getAttribute('content')!=='#000000')m.setAttribute('content','#000000');};fix();if(window.MutationObserver)new MutationObserver(fix).observe(m,{attributes:true});}})();</script>"""


def main():
    index = (ROOT / 'index.html').read_text(encoding='utf-8')
    v = re.search(r'css/dark\.css\?v=([\w-]+)', index).group(1)
    page = index.replace('<link rel="stylesheet" href="css/dark.css?v=' + v + '">',
                         '<link rel="stylesheet" href="css/dark.css?v=' + v + '">\n  <link rel="stylesheet" href="css/test-sombre.css?v=' + v + '">')
    page = page.replace('<meta name="theme-color" content="#2500BA">', '<meta name="theme-color" content="#000000">')
    page = page.replace('<title>Y-Seck</title>', '<title>Y-Seck · test Sombre</title>\n  <meta name="robots" content="noindex">')
    page = page.replace('<div class="app" id="app"></div>', '<div class="app" id="app"></div>\n  <span class="test-badge" aria-hidden="true">Test Sombre</span>')
    page = page.replace('</body>', '  ' + FORCE_DARK + '\n</body>')
    (ROOT / 'test-sombre.html').write_text(page, encoding='utf-8')
    print('test-sombre.html généré (feuille : css/test-sombre.css).')


if __name__ == '__main__':
    main()
