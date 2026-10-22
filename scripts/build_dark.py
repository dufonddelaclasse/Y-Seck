"""Générer css/dark.css, le mode sombre, à partir de css/style.css.
Usage : python3 scripts/build_dark.py [--check]

Chaque règle qui fixe une couleur claire (fond, bordure, ombre) ou une encre foncée est reprise
sous html.dark avec sa couleur transposée : fonds neutres assombris, teintes de catégorie
assombries en gardant leur nuance, encres éclaircies. Les couleurs pleines (boutons, pastilles)
restent identiques. Les règles du mode contraste renforcé sont ignorées : il reste clair.
Les retouches manuelles de MANUAL sont ajoutées à la fin. À relancer après chaque modification
de css/style.css (scripts/check_dark.mjs vérifie que le fichier est à jour).
"""
import argparse, colorsys, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC, OUT = ROOT / 'css/style.css', ROOT / 'css/dark.css'
PREFIX = 'html.dark'

BG_PROPS = {'background', 'background-color', 'border', 'border-color', 'border-top', 'border-bottom', 'border-left', 'border-right',
            'border-top-color', 'border-bottom-color', 'outline', 'outline-color', 'box-shadow', 'fill', 'stroke'}
INK_PROPS = {'color', 'text-decoration-color', 'caret-color'}
VAR_BG = re.compile(r'tint|bg|surface|soft|line|lilac|sun|panel|card|deep-bg|fit-tint')
VAR_INK = re.compile(r'^--(ink|ink-2|muted|fit-ink|blue|accent|accent-hover|blue-hover)$')
# Texte dans la couleur pleine d’une catégorie : remplacé par sa version claire, lisible sur fond sombre.
INK_VARS = {'--theme-btn': '--theme-ink', '--theme': '--theme-ink', '--theme-deep': '--theme-ink', '--cat-ap': '--cat-ap-ink', '--cat-a': '--cat-a-ink',
            '--cat-b': '--cat-b-ink', '--cat-c': '--cat-c-ink', '--cat-ap-deep': '--cat-ap-ink', '--cat-a-deep': '--cat-a-ink', '--cat-b-deep': '--cat-b-ink',
            '--cat-c-deep': '--cat-c-ink', '--accent': '--blue', '--accent-hover': '--blue'}
THEME_INK = re.compile(r'var\((' + '|'.join(sorted(map(re.escape, INK_VARS), key=len, reverse=True)) + r')(?![\w-])')
COLOR = re.compile(r'#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)')

def parse_color(tok):
    if tok.startswith('#'):
        h = tok[1:]
        if len(h) in (3, 4): h = ''.join(c * 2 for c in h)
        r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
        a = int(h[6:8], 16) / 255 if len(h) == 8 else 1
        return r, g, b, a
    nums = [float(x) for x in re.findall(r'[\d.]+', tok)]
    if len(nums) < 3: return None
    return nums[0] / 255, nums[1] / 255, nums[2] / 255, nums[3] if len(nums) > 3 else 1

def fmt(r, g, b, a):
    rgb = '#%02X%02X%02X' % tuple(round(max(0, min(1, x)) * 255) for x in (r, g, b))
    return rgb if a >= 1 else 'rgba(%d,%d,%d,%s)' % (round(r * 255), round(g * 255), round(b * 255), ('%.2f' % a).rstrip('0').rstrip('.'))

def dark_bg(tok):
    """Fond ou trait clair → fond sombre ; les couleurs pleines restent."""
    c = parse_color(tok)
    if not c: return tok
    r, g, b, a = c
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    if l < .5 and s >= .15: return tok
    if max(r, g, b) - min(r, g, b) < .06 or l > .97:
        if l < .35: nl = .3                   # pastille noire : gris foncé, son texte blanc reste lisible
        elif l >= .985: nl = .16              # surface blanche
        elif l >= .935: nl = .085             # fond général
        else: nl = min(.42, .14 + (.935 - l) * 1.1)  # gris de cartes et traits
        return fmt(*colorsys.hls_to_rgb(h, nl, min(s, .08)), a)
    if l >= .78: return fmt(*colorsys.hls_to_rgb(h, .2 + (1 - l) * .35, min(s, .45)), a)
    return tok

def dark_ink(tok):
    """Encre foncée → encre claire ; le blanc et les couleurs vives restent."""
    c = parse_color(tok)
    if not c: return tok
    r, g, b, a = c
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    if l >= .6: return tok
    if max(r, g, b) - min(r, g, b) < .06: return fmt(*colorsys.hls_to_rgb(h, .96 - l * .55, s), a)
    return fmt(*colorsys.hls_to_rgb(h, max(.74, 1 - l), min(1, s)), a)

def strip_comments(css):
    return re.sub(r'/\*.*?\*/', '', css, flags=re.S)

def blocks(css):
    """(sélecteur, corps) au premier niveau ; les @media conservent leurs règles internes."""
    i, n = 0, len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0: return
        head = css[i:j].strip()
        depth, k = 1, j + 1
        while depth and k < n:
            depth += {'{': 1, '}': -1}.get(css[k], 0); k += 1
        yield head, css[j + 1:k - 1]
        i = k

def declarations(body):
    for part in body.split(';'):
        if ':' in part:
            p, v = part.split(':', 1)
            yield p.strip(), v.strip()

def prefix(selector):
    """Même spécificité que la règle d’origine : le fichier, chargé après, l’emporte à égalité."""
    out = []
    for sel in split_selectors(selector):
        sel = sel.strip()
        if 'data-contrast' in sel: return None
        if sel.startswith(':root'): out.append(':root:where(.dark)' + sel[5:])
        elif sel.startswith('html'): out.append('html:where(.dark)' + sel[4:])
        else: out.append(':where(html.dark) ' + sel)
    return ', '.join(out)

def split_selectors(sel):
    parts, depth, cur = [], 0, ''
    for ch in sel:
        depth += {'(': 1, ')': -1}.get(ch, 0)
        if ch == ',' and depth == 0: parts.append(cur); cur = ''
        else: cur += ch
    return parts + [cur]

def convert(head, body):
    """Toutes les déclarations de couleur sont reprises, transposées ou non, pour garder l’ordre de la cascade."""
    decls, changed = [], False
    for p, v in declarations(body):
        if p.startswith('--'):
            fn = dark_ink if VAR_INK.match(p) else dark_bg if VAR_BG.search(p) else None
            if not fn or not COLOR.search(v): continue
        elif p in INK_PROPS: fn = dark_ink
        elif p in BG_PROPS: fn = dark_bg
        else: continue
        nv = COLOR.sub(lambda m: fn(m.group(0)), v)
        if p in INK_PROPS or p in ('fill', 'stroke', 'text-decoration-color'):
            nv = THEME_INK.sub(lambda m: 'var(' + INK_VARS[m.group(1)], nv)
        changed |= nv != v
        decls.append(p + ':' + nv)
    if not decls or not changed and not any(d.split(':')[0] in BG_PROPS | INK_PROPS for d in decls): return None
    sel = prefix(head)
    return sel and sel + ' { ' + '; '.join(decls) + '; }'

def build():
    css = strip_comments(SRC.read_text())
    out = []
    for head, body in blocks(css):
        if head.startswith('@media'):
            if 'prefers-contrast' in head or 'print' in head: continue
            inner = [r for r in (convert(h, b) for h, b in blocks(body) if not h.startswith('@')) if r]
            if inner: out.append(head + ' {\n' + '\n'.join('  ' + r for r in inner) + '\n}')
        elif head.startswith('@'): continue
        else:
            r = convert(head, body)
            if r: out.append(r)
    return ('/* Mode sombre : fichier généré par scripts/build_dark.py à partir de css/style.css. Ne pas modifier à la main. */\n'
            + PREFIX + ' { color-scheme:dark; }\n' + '\n'.join(out) + '\n\n/* Retouches */\n' + MANUAL.strip() + '\n')

MANUAL = """
html.dark { --brand:#8F7BFF; --blue:#A493FF; --accent:#7C66FF; --accent-hover:#9785FF; --theme-btn:var(--brand); --red:#FF6B6B; --surface:#1E1E22; }
html.dark, html.dark body { background:var(--bg); color:var(--ink); }
html.dark body::before { display:none; }
html.dark .app, html.dark .footer { background:var(--bg); }
html.dark .btn:not(.outline):not(.danger):not(.fav) { background:#5B3DF5; border-color:#5B3DF5; color:#FFF; }
html.dark .btn.danger-solid { background:#D0202E; border-color:#D0202E; }
html.dark .home-discover, html.dark .home-discover:hover, html.dark .top-notice { background:#3B21C9; }
html.dark .home-discover .home-go { background:#FFF; color:#3B21C9; }
html.dark img:not([src$=".svg"]) { filter:brightness(.92); }
html.dark .book-card img { background:#2A2A2F; }
html.dark ::placeholder { color:#8A8A92; }
html.dark { --choice:#6347FF; --choice-ink:#B3A6FF; --sun:#FFD499; --sun-soft:#FFD499; --yellow:#FFD499; }
html.dark :is(.fit,.parcours-zone,.parcours-link.stage,.category-fit.warn) { background:var(--sun) !important; color:#262626 !important; }
html.dark :is(.ref-tip,.todo,.bourse,.filter-hint) { background:#000 !important; color:#FFF !important; border-color:#000 !important; }
html.dark :is(.ref-tip,.todo,.bourse,.filter-hint) :is(b,p,span,small,li) { color:#FFF !important; }
html.dark :is(.ref-tip,.bourse) .small { color:#C8C8CE !important; }
html.dark .ref-tip a, html.dark .ref-tip .link-plain { color:#FFF !important; }
html.dark .home-tile svg, html.dark .home-tile b, html.dark .home-tile span { color:#141414; }
html.dark .tabbar a, html.dark .tabbar a svg { color:#8C8C93; }
html.dark .tabbar a.on, html.dark .tabbar a.on svg { color:#FFF; }
html.dark .category-fit.warn svg, html.dark :is(.fit,.parcours-zone,.parcours-link.stage) svg { color:#262626 !important; }
html.dark .prep-page button.chip:not(.category-choice) { --choice-ink:var(--theme-ink); }
html.dark :is(.exam-cal,.exam-places) h5 svg { color:currentColor; }
html.dark .tabbar a.on::before { background:var(--brand); }
html.dark .explore-switch { background:#2E2E33; }
html.dark .explore-switch a { color:#C2C2C6; }
html.dark .explore-switch a.on { background:var(--brand); color:#161616; }
/* Bandeau de mise à jour : fond noir à 100 % (le générateur éclaircirait le noir de style.css). */
html.dark body .update-notice { background:#000 !important; }
html.dark .sheet-content button.chip.category-choice[data-action="metCat"]:not(.on)::after { background-color:#8E8E93; box-shadow:0 0 0 2px #292929; }
html.dark .job-row .fits .fit, html.dark .job-row .fit { background:#2E2E33 !important; border:0 !important; box-shadow:none !important; color:#E2E2E6 !important; }
html.dark .job-row .fit * { color:#E2E2E6 !important; }
html.dark .app.theme-Ap, html.dark body.theme-Ap { --lt:#DDC7FF; } html.dark .app.theme-A, html.dark body.theme-A { --lt:#BEF1FD; }
html.dark .app.theme-B, html.dark body.theme-B { --lt:#CCFFED; } html.dark .app.theme-C, html.dark body.theme-C { --lt:#FFE8D9; } html.dark .app.theme-CDD, html.dark body.theme-CDD { --lt:#E2E2E6; }
html.dark :is(.catcard-wrap.tint-blue,.preparation-card.prep-cat-Ap,.intro-category-fold.tint-blue) { --cc:#DDC7FF; }
html.dark :is(.catcard-wrap.tint-mint,.preparation-card.prep-cat-A,.intro-category-fold.tint-mint) { --cc:#BEF1FD; }
html.dark :is(.catcard-wrap.tint-cyan,.preparation-card.prep-cat-B,.intro-category-fold.tint-cyan) { --cc:#CCFFED; }
html.dark :is(.catcard-wrap.tint-yellow,.preparation-card.prep-cat-C,.intro-category-fold.tint-yellow) { --cc:#FFE8D9; }
html.dark :is(.catcard-wrap,.intro-category-fold) { background:transparent !important; border:1.5px solid var(--cc,#5A5A60) !important; box-shadow:none !important; }
html.dark .catcard-wrap :is(.catcard,.catcard-panel,.explain) { background:transparent !important; }
html.dark .job-page .job-match { background:none !important; box-shadow:none !important; color:var(--theme-ink) !important; }
html.dark .job-page .rung { background:transparent !important; border:1.5px solid var(--lt,#5A5A60) !important; }
html.dark .category-fit:not(.warn) { background:transparent !important; box-shadow:inset 0 0 0 1px #C9F2A6 !important; color:#E2E2E6 !important; }
html.dark .category-fit:not(.warn) svg { color:#C9F2A6 !important; }
html.dark :is(.pin-ico,.employer-icon) { background:transparent !important; }
html.dark .app.themed .btn.theme, html.dark .app.themed .btn.theme:hover { background:var(--theme-btn) !important; border-color:var(--theme-btn) !important; color:#FFF !important; }
html.dark .app.themed .btn.theme svg { color:#FFF !important; }
html.dark .app.themed :is(.section-heading svg,.job-action svg,.btn-bare svg,.exam-cal h5 svg,.exam-places h5 svg) { color:var(--lt) !important; }
html.dark .job-row .fit.like { background:transparent !important; box-shadow:inset 0 0 0 1px #5A5A60 !important; }
html.dark :is(.personal-home .study-level,.trip .study-level,.home-interest,.tag.tag-btn,.job-page .job-meta .tag) { background:#45454A !important; border:0 !important; color:#E2E2E6 !important; }
html.dark :is(.personal-home .study-level,.trip .study-level,.home-interest) svg { color:#D4D4D8 !important; }
html.dark :is(#jobs .job-row,.job-cards .job-row,.home-access,.home-shortcuts a,.profile-row,.prep:not(.talents-card),.study-card,.book-card,.family-card,.ref-card,.parcours-card,.concours-page .job-section .ref-panel) { background:#161616 !important; }
html.dark { --theme-ink:#B3A6FF; --cat-ap-ink:#B9A8FF; --cat-a-ink:#9BA6FF; --cat-b-ink:#6FD6D6; --cat-c-ink:#FFA982; }
html.dark .app.theme-Ap, html.dark body.theme-Ap { --theme-ink:#B9A8FF; } html.dark .app.theme-A, html.dark body.theme-A { --theme-ink:#9BA6FF; } html.dark .app.theme-B, html.dark body.theme-B { --theme-ink:#6FD6D6; }
html.dark .app.theme-C, html.dark body.theme-C { --theme-ink:#FFA982; } html.dark .app.theme-CDD, html.dark body.theme-CDD { --theme-ink:#E2E2E6; }
html.dark .app.theme-Ap { --theme-deep:#B9A8FF; } html.dark .app.theme-A { --theme-deep:#9BA6FF; } html.dark .app.theme-B { --theme-deep:#6FD6D6; }
html.dark .app.theme-C { --theme-deep:#FFA982; } html.dark .app.theme-CDD { --theme-deep:#E2E2E6; }
html.dark .app.themed .eyebrow, html.dark .app.themed .section-heading { color:var(--theme-deep); }
html.dark .personal-home .home-concours, html.dark .personal-home .home-concours:hover { background:#DCD3FF; color:#161616; }
html.dark .personal-home .home-concours :is(.home-feature-copy b, .home-feature-copy > span, .home-count) { color:#161616; }
html.dark .personal-home .home-concours .home-go { background:#FFF; color:#161616; }
/* Ovale d’arrivée clair en mode sombre : le pictogramme passe en sombre. */
html.dark .trip-pill svg { color:#161616; }
/* Prépa Talents : la carte reste blanche, avec son logo et un texte sombre. */
html.dark .talents-card, html.dark .talents-card :is(h1,h2,p,b,.more,.chev) { color:#161616 !important; }
html.dark .talents-card .talents-hero .price { background:#FFF !important; color:#1129AD !important; }
/* Prénom de l’accueil et écran de chargement : vague partant du texte clair, passant par le vert anis puis le lavande, sans bleu sombre peu lisible sur fond sombre. */
html.dark { --name-sweep:linear-gradient(180deg, var(--ink) 0%, var(--ink) 25%, #E8F2C6 27%, #E4F69E 29.5%, #E0FA6E 32%, #E0FA6E 34%, #D9EA97 36.5%, #D2D8C8 38.5%, #CCC5FA 40.5%, #BFB6FE 43%, #B3A6FF 45.5%, #A898FE 48%, #9E8CFB 50.5%, #917DF4 53%, #8C78F0 55%, #917DF4 57.5%, #9E8CFB 60%, #B3A6FF 63%, #CCC5FA 66.5%, #E1DFEF 70%, #E7E6EB 72.5%, var(--ink) 75%, var(--ink) 100%); }
html.dark .talents-body { background:#FFF; }
html.dark .home-tile { background:#E0FA6E !important; color:#141414 !important; }
html.dark .prep .price { background:#E0FA6E !important; color:#141414 !important; }
html.dark .app.themed .prep .prep-ico { color:var(--lt); }
/* Prénom et écran de chargement : le dégradé reste découpé dans le texte. */
html.dark :is(.personal-home .home-name-enter, .screen.loading-screen .loading-text) { -webkit-background-clip:text; background-clip:text; }
html.dark .talents-perf { background-image:radial-gradient(circle, #DEDEDE 1.3px, transparent 1.8px) !important; }
"""

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--check', action='store_true')
    css = build()
    if ap.parse_args().check:
        sys.exit(0 if OUT.exists() and OUT.read_text() == css else 'css/dark.css n’est pas à jour : python3 scripts/build_dark.py')
    OUT.write_text(css)
    print(f"css/dark.css : {css.count('.dark')} sélecteurs, {len(css)//1024} Ko")
