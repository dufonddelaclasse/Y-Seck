#!/usr/bin/env python3
"""Page de test « Gris » : l’appli en mode clair, fond en niveaux de gris (mêmes luminosités, saturation retirée)
et jaune des pastilles remplacé par le jaune de référence. Génère test-gris.html (copie d’index.html) qui charge
css/test-gris.css après les feuilles de l’appli. L’appli en ligne ne change pas.
    python3 scripts/build_test_gris.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FORCE_LIGHT = """<script>/* Test : mode clair imposé, sans toucher au réglage enregistré. */
(function(){var h=document.documentElement;function off(){if(h.classList.contains('dark'))h.classList.remove('dark');}off();
if(window.MutationObserver)new MutationObserver(off).observe(h,{attributes:true,attributeFilter:['class']});
var m=document.querySelector('meta[name="theme-color"]');if(m&&window.MutationObserver){var fix=function(){if(m.getAttribute('content')==='#000000')m.setAttribute('content','#F6F6F6');};new MutationObserver(fix).observe(m,{attributes:true});}})();</script>"""


def main():
    index = (ROOT / 'index.html').read_text(encoding='utf-8')
    v = re.search(r'css/dark\.css\?v=([\w-]+)', index).group(1)
    page = index.replace('<link rel="stylesheet" href="css/dark.css?v=' + v + '">',
                         '<link rel="stylesheet" href="css/dark.css?v=' + v + '">\n  <link rel="stylesheet" href="css/test-gris.css?v=' + v + '-g1">')
    page = re.sub(r"<script>\(function\(\)\{try\{var m=\(JSON.parse.*?</script>", '', page, flags=re.S)
    page = page.replace('<title>Y-Seck</title>', '<title>Y-Seck · test Gris</title>\n  <meta name="robots" content="noindex">')
    page = page.replace('<div class="app" id="app"></div>', '<div class="app" id="app"></div>\n  <span class="test-badge" aria-hidden="true">Test Gris</span>')
    page = page.replace('</body>', '  ' + FORCE_LIGHT + '\n</body>')
    (ROOT / 'test-gris.html').write_text(page, encoding='utf-8')
    print('test-gris.html généré (feuille : css/test-gris.css).')


if __name__ == '__main__':
    main()
