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
html.dark .app .prep:not(.prep-static):not(.talents-card):not(.talents-feature) { background:#292929 !important; }
html.dark .app .prep.prep-static { background:#292929 !important; }
html.dark .talents-body, html.dark .app .prep.hi.talents-card .talents-body { border:0 !important; }
html.dark .talents-card .talents-bourse span { color:#BCBCC2 !important; }
/* Switch boursier / non boursier : fond noir, choix actif dans la couleur de la catégorie. */
html.dark .explore-switch, html.dark .bourse-switch { background:#000 !important; }
html.dark .bourse-switch button.on { color:#FFF !important; }
html.dark .explore-switch.bourse-switch[data-on]::before { background:var(--theme-btn, var(--brand)); }

/* Encadrés d'information : bloc noir en mode sombre, plutôt que des teintes délavées (jaune olive, vert, cyan). */
html.dark :is(.school-uni, .school-fees, .bourse, .filter-hint, .todo, .callout, .trip-access, .ref-tip:not(.stage-tip), .intro-employer) { background:#000 !important; border-color:#000 !important; color:var(--ink) !important; }
html.dark :is(.school-uni, .bourse, .filter-hint, .todo, .callout, .trip-access, .ref-tip:not(.stage-tip), .intro-employer) :is(p, b, span, li, small) { color:inherit; }
/* Carte Prépas Talents : le corps passe en noir, le texte en clair. */
html.dark .talents-body, html.dark .app .prep.hi.talents-card .talents-body { background:#292929 !important; }
html.dark .talents-card :is(h1, h2, b, .talents-count, .talents-count b, .talents-bourse b) { color:#F2F2F2 !important; }
html.dark .talents-card p, html.dark .app .prep.hi.talents-card p { color:#D6D6DB !important; }

/* Cartes des régions : régions bien visibles sur le fond sombre, frontières de la couleur du bloc. */
:where(html.dark) .region-map path { fill:#4A4A55; stroke:#292929; stroke-width:1.6; }
:where(html.dark) .region-map path:hover { fill:#5A5A66; }
:where(html.dark) .region-map.all path { fill:#5C50C2; }
:where(html.dark) .region-map path.on, :where(html.dark) .region-map path.on:hover { fill:var(--brand); }

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
html.dark .tabbar a.on::before { background:#FFF; }
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
html.dark .talents-card .talents-hero .price { background:#FFF !important; color:#1129AD !important; }
html.dark .app .prep.hi.talents-card .talents-hero .price { background:#E0FA6E !important; color:#141414 !important; }
/* Prénom de l’accueil et écran de chargement : vague partant du texte clair, passant par le vert anis puis le lavande, sans bleu sombre peu lisible sur fond sombre. */
html.dark { --name-sweep:linear-gradient(180deg, var(--ink) 0%, var(--ink) 25%, #E8F2C6 27%, #E4F69E 29.5%, #E0FA6E 32%, #E0FA6E 34%, #D9EA97 36.5%, #D2D8C8 38.5%, #CCC5FA 40.5%, #BFB6FE 43%, #B3A6FF 45.5%, #A898FE 48%, #9E8CFB 50.5%, #917DF4 53%, #8C78F0 55%, #917DF4 57.5%, #9E8CFB 60%, #B3A6FF 63%, #CCC5FA 66.5%, #E1DFEF 70%, #E7E6EB 72.5%, var(--ink) 75%, var(--ink) 100%); }
html.dark .home-tile { background:#E0FA6E !important; color:#141414 !important; }
html.dark .prep .price { background:#E0FA6E !important; color:#141414 !important; }
html.dark .app.themed .prep .prep-ico { color:var(--lt); }
/* Prénom et écran de chargement : le dégradé reste découpé dans le texte. */
html.dark :is(.personal-home .home-name-enter, .screen.loading-screen .loading-text) { -webkit-background-clip:text; background-clip:text; }
html.dark .talents-perf { background-image:radial-gradient(circle, #DEDEDE 1.3px, transparent 1.8px) !important; }
html.dark .app .prep.hi.talents-card .talents-perf { background-image:radial-gradient(circle, #DEDEDE 1px, transparent 1.4px) !important; }
html.dark .ref-tip.stage-tip { background:transparent !important; border-color:var(--theme, var(--blue)) !important; }
html.dark .ref-tip.stage-tip .stage-where svg { color:var(--theme, var(--blue)) !important; }
html.dark .talents-counter { border:0 !important; background:none !important; }
/* ---------- Direction sombre : fond noir, blocs anthracite, pastilles cerclées de blanc ou pleines à texte noir,
   couleurs de catégories du mode clair. ---------- */
/* ---------- Palette ---------- */
html.dark {
  --bg:#000; --surface:#1C1C1E; --card-bg:#1C1C1E; --card-line:transparent; --soft:#2A2A2D;
  --ink:#FFFFFF; --ink-2:#E6E6E6; --muted:#A8A8AD; --line:#2C2C2F; --line-2:#3A3A3E;
  /* Couleurs de catégories et teintes : valeurs du mode clair. */
  --cat-ap:#3C05FF; --cat-a:#0051FF; --cat-b:#0096AD; --cat-c:#FF804A;
  --cat-ap-tint:#DDC7FF; --cat-a-tint:#BEF1FD; --cat-b-tint:#CCFFED; --cat-c-tint:#FFE8D9; --cat-cdd-tint:#F1F1EE;
  --lime:#E0FA6E; --pill-on:#E0FA6E;
}
html.dark .app.theme-Ap { --theme-tint:#DDC7FF; --pill-on:#DDC7FF; }
html.dark .app.theme-A { --theme-tint:#BEF1FD; --pill-on:#BEF1FD; }
html.dark .app.theme-B { --theme-tint:#CCFFED; --pill-on:#CCFFED; }
html.dark .app.theme-C { --theme-tint:#FFE8D9; --pill-on:#FFE8D9; }

/* ---------- Fond noir partout ---------- */
html.dark, html.dark body, html.dark .app, html.dark .app main, html.dark .footer { background:#000 !important; }
html.dark body::before { display:none !important; }
html.dark body:not(.themed) .context-bar:not([style*="background"]) { background:rgba(0,0,0,.94); border-bottom-color:#1C1C1E; }
html.dark #app .job-page .job-hero, html.dark #app .job-page .trip-head, html.dark #app .job-actions, html.dark #app .job-page .job-actions { background:#000 !important; border-color:#1C1C1E !important; }
html.dark .tabbar { background:#000 !important; border-top-color:#1C1C1E !important; }

/* ---------- Blocs : anthracite, sans contour ---------- */
html.dark #app :is(.prep, .prep.prep-static, .list-row.job-row, .rung, .ladder-alt-row, .study-card, .book-card, .home-feature.home-access, .home-shortcuts a, .ref-panel, .callout, .card, .school-row, .region-zone) { background:#1C1C1E !important; border-color:transparent !important; box-shadow:none !important; }
html.dark #app .job-page:not(.concours-page) .rung { border:1.5px solid #FFF !important; background:transparent !important; }

/* Blocs aux couleurs de la catégorie (carte du concours, encadré du métier) : teinte claire, texte noir. */
html.dark #app .ref-card { background:var(--ref-tint, #1C1C1E) !important; border:0 !important; }
html.dark #app .ref-card, html.dark #app .ref-card :is(h3, p, b, span, summary, a, .meta, small) { color:#000 !important; }
html.dark #app .ref-card :is(svg) { color:#000; }
/* « Vous ressemble » : encadré arrondi sans fond, bordure couleur de la catégorie, texte blanc. */
html.dark #app .job-page .job-match { display:block; margin:14px 0 0; padding:12px 16px; border:1.5px solid var(--theme, #FFF) !important; border-radius:18px; background:transparent !important; color:#FFF !important; }
html.dark #app .job-page .job-match * { color:#FFF !important; }

/* ---------- Pastilles neutres : contour blanc, texte blanc ---------- */
html.dark #app :is(.tag, .tag-btn, .home-profile-meta .tag, .job-page .job-meta .tag, .study-meta .tag, .fit.like, .filter-summary .tag) { background:transparent !important; border:1.5px solid #FFF !important; color:#FFF !important; }
html.dark #app :is(.tag, .tag-btn) svg { color:#FFF !important; }
html.dark #app button.chip:not(.on):not(.category-choice), html.dark #app .prep-page button.chip:not(.on) { background:transparent !important; border:1.5px solid #FFF !important; color:#FFF !important; }
html.dark #app .btn.outline, html.dark #app .prep-page .btn.outline { background:transparent !important; border:1.5px solid #FFF !important; color:#FFF !important; }
html.dark #app .btn.outline svg { color:#FFF !important; }

/* ---------- Pastilles pleines : couleur de catégorie (ou vert vif hors catégorie), texte noir ---------- */
html.dark #app button.chip.on:not(.category-choice), html.dark #app .prep-page button.chip.on { background:var(--pill-on) !important; border:1.5px solid var(--pill-on) !important; color:#000 !important; }
html.dark #app .fit.on { background:#2C2C2F !important; color:#C8FFB2 !important; border:1.5px solid #C8FFB2 !important; }
html.dark #app .fit:not(.on):not(.like) { background:transparent !important; border:1.5px solid #FFF !important; color:#FFF !important; }
html.dark #app .job-row .fit .job-fit-check { background:#C8FFB2; color:#000; }
html.dark #app .prep .price { color:#000 !important; }
html.dark #app .prep .price.price-neutral { background:#FFF !important; color:#000 !important; }

/* Bouton principal : plein, texte noir. */
html.dark #app .btn:not(.outline):not(.white) { background:var(--pill-on) !important; border-color:var(--pill-on) !important; color:#000 !important; }
html.dark #app .btn:not(.outline):not(.white) svg { color:#000 !important; }
html.dark #app .btn.prep-float { box-shadow:0 8px 24px rgba(0,0,0,.6); }

/* Switch boursier : rail anthracite, curseur coloré, texte noir sur le curseur. */
html.dark #app .explore-switch, html.dark #app .bourse-switch { background:#1C1C1E !important; }
html.dark #app .explore-switch[data-on]::before, html.dark #app .explore-switch.bourse-switch[data-on]::before { background-color:var(--pill-on) !important; background-image:none !important; }
html.dark #app .explore-switch[data-on] :is(a, button) { color:#FFF !important; }
html.dark #app .explore-switch[data-on] :is(a.on, button.on, a[aria-selected="true"]) { color:#000 !important; }

/* ---------- Pastilles de catégorie : couleurs du mode clair ; texte noir quand la couleur le permet ---------- */
html.dark #app .cat, html.dark #app .cat * { color:#FFF !important; }

/* ---------- Espace perso ---------- */
html.dark #app .personal-home .home-concours, html.dark #app .personal-home .home-concours:hover { background:#DDC7FF !important; }
html.dark #app .personal-home .home-concours :is(.home-feature-copy b, .home-feature-copy > span, .home-count) { color:#000 !important; }
html.dark #app .home-shortcuts a, html.dark #app .home-feature.home-access { color:#FFF !important; }
html.dark #app .personal-home .home-feature .home-go { border:0; }

/* Pastille de catégorie dans un bloc de couleur : lettre blanche. */
html.dark #app .ref-card .cat, html.dark #app .ref-card .cat * { color:#FFF !important; }

/* Fiche métier : la zone de la frise (sous En savoir +, Favori, Partager) en gris foncé ; le haut reste noir. */
html.dark #app main.job-page:not(.concours-page) { background:#1C1C1E !important; }
html.dark #app main.job-page :is(.job-hero, .trip-head, .job-actions) { background:#000 !important; }
html.dark #app main.job-page .job-hero { box-shadow:0 -120px 0 #000; }
html.dark #app main.job-page:not(.concours-page) :is(.ladder-alt-row, .list-row.job-row, .prep, .callout, .card) { background:#2C2C2F !important; }
html.dark #app main.job-page:not(.concours-page) .a11y-link { background:transparent; }

/* Titres de section (Le concours, Aides, Prépas, Évoluer…) : blancs, pictogramme compris, plus de violet clair. */
html.dark #app :is(h1, h2, h3, .section-heading, .trip-h) { color:#FFF !important; }
html.dark #app :is(h1, h2, h3, .section-heading) > svg, html.dark #app .section-heading svg { color:#FFF !important; }
html.dark #app .ref-card :is(h2, h3) { color:#000 !important; }

/* Barre du haut aux couleurs de la catégorie : elle reste en couleur, texte et pictogrammes blancs. */
html.dark body.themed .context-bar { background:var(--theme) !important; border-bottom-color:transparent !important; }
html.dark body.themed .context-bar :is(.context-title, .icon-btn, .icon-btn svg) { color:#FFF !important; }
html.dark body.themed .context-bar .cat { box-shadow:0 0 0 2px #FFF !important; }
/* Accordéons du parcours : petits blocs anthracite (un cran plus clair sur la frise grise des fiches métiers). */
html.dark #app .trip-more { background:#1C1C1E !important; }
html.dark #app main.job-page:not(.concours-page) .trip-more { background:#2C2C2F !important; }
/* Encadré « Le concours rend ce poste accessible… » : même couleur que les accordéons. */
html.dark #app .trip-access { background:#1C1C1E !important; }
html.dark #app main.job-page:not(.concours-page) .trip-access { background:#2C2C2F !important; }
/* Boutons principaux des pages d’une catégorie (Se préparer…) : couleur la plus saturée de la catégorie, texte blanc. */
html.dark #app.themed .btn:not(.outline):not(.white), html.dark #app.themed .btn.theme { background:var(--theme) !important; border-color:var(--theme) !important; color:#FFF !important; }
html.dark #app.themed .btn:not(.outline):not(.white) svg { color:#FFF !important; }
/* Bouton des filtres : pictogramme blanc. */
html.dark .icon-btn[data-action$="ilters"], html.dark .icon-btn[data-action$="ilters"] svg { color:#FFF !important; }
/* Arrivée sur une fiche métier (sombre) : barre noire, puis la couleur de la catégorie descend du haut vers le bas. */
html.dark body.themed .context-bar.bar-enter { background:#000 !important; }
html.dark body.themed .context-bar.bar-enter :is(.context-title, .icon-btn, .icon-btn svg) { animation:none; }
/* Choix en cards (profil, ambition, boursier, budget, reconversion, domaines) : encadrés anthracite, textes blancs, plus d’air.
   Sélection : card blanche, texte noir. */
html.dark #app :is(.opt, .interest-option), html.dark .sheet :is(.opt, .interest-option) { border:0 !important; border-radius:20px !important; background:#1C1C1E !important; color:#FFF !important; box-shadow:none !important; }
html.dark #app .opt:not(.sm), html.dark .sheet .opt:not(.sm) { padding:18px 20px !important; }
html.dark #app .opt.ambition-opt { min-height:72px; }
html.dark #app :is(.opt, .interest-option) :is(span, svg, .ambition-t, .interest-name), html.dark .sheet :is(.opt, .interest-option) :is(span, svg, .ambition-t, .interest-name) { color:#FFF !important; }
html.dark #app .opt .ambition-d, html.dark .sheet .opt .ambition-d { color:#A8A8AD !important; opacity:1; }
html.dark #app :is(.opt, .interest-option).on, html.dark .sheet :is(.opt, .interest-option).on { background:#FFF !important; color:#000 !important; }
html.dark #app :is(.opt, .interest-option).on :is(span, svg, .ambition-t, .interest-name), html.dark .sheet :is(.opt, .interest-option).on :is(span, svg, .ambition-t, .interest-name) { color:#000 !important; }
html.dark #app :is(.opt, .interest-option).on .ambition-d, html.dark .sheet .opt.on .ambition-d { color:#55555C !important; }
/* Onboarding : choix cerclés de blanc sans fond ; la sélection prend le fond blanc et le texte noir. */
html.dark #app.onboarding :is(.opt, .interest-option):not(.on) { background:transparent !important; border:1.5px solid #FFF !important; }
html.dark #app.onboarding :is(.opt, .interest-option).on { border:1.5px solid #FFF !important; }
html.dark #app .opt .defi-cats .cat, html.dark #app .opt .defi-cats .cat *, html.dark .sheet .opt .defi-cats .cat, html.dark .sheet .opt .defi-cats .cat * { color:#FFF !important; }
html.dark #app .opt:not(.on) .defi-cats > span:not(.cat) { color:#A8A8AD !important; }
/* Pastilles de choix (pages et fenêtres) : sélectionnées en blanc plein, texte noir ; sélectionnables cerclées de blanc, texte blanc. */
html.dark :is(#app, .sheet) button.chip:not(.category-choice):not(.on) { background:transparent !important; border:1.5px solid #FFF !important; color:#FFF !important; box-shadow:none !important; }
html.dark :is(#app, .sheet) button.chip.on:not(.category-choice), html.dark :is(#app, .sheet) button.chip.on:not(.category-choice):hover { background:#FFF !important; border:1.5px solid #FFF !important; color:#000 !important; box-shadow:none !important; }
html.dark :is(#app, .sheet) button.chip.on:not(.category-choice) :is(svg, span) { color:#000 !important; }
html.dark :is(#app, .sheet) button.chip:not(.category-choice):not(.on) :is(svg, span) { color:#FFF !important; }
/* Coche de « Niveau d’études compatible » : pastille verte, coche noire bien visible. */
html.dark #app .fit .job-fit-check, html.dark #app .fit .job-fit-check svg { background:#C8FFB2 !important; color:#000 !important; }
html.dark #app .fit .job-fit-check svg { background:none !important; stroke:#000 !important; }
/* Catégories des fiches métier : active en blanc plein (texte noir), sélectionnable cerclée de blanc. */
html.dark #app .trip-cat { background:transparent !important; color:#8E8E93 !important; box-shadow:inset 0 0 0 1.5px #5A5A60 !important; }
html.dark #app .trip-cat > span:not(.cat) { color:#8E8E93 !important; }
/* Pastille de la catégorie non choisie : grisée ; sa couleur revient à la sélection. */
html.dark #app .trip-cat:not([aria-pressed="true"]) .cat { background:#3A3A3E !important; color:#8E8E93 !important; }
html.dark #app .trip-cat[aria-pressed="true"] { background:#FFF !important; color:#000 !important; box-shadow:none !important; }
html.dark #app .trip-cat[aria-pressed="true"] > span:not(.cat) { color:#000 !important; }
/* Versants des fiches métier : choisi en gris plein, texte blanc ; les autres cerclés de gris, texte gris, sans fond. */
html.dark #app .trip-tab:not([hidden]) { background:transparent !important; color:#8E8E93 !important; box-shadow:inset 0 0 0 1.5px #5A5A60 !important; }
html.dark #app .trip-tab > span { color:inherit !important; }
html.dark #app .trip-tab[aria-selected="true"] { background:#4A4A50 !important; color:#FFF !important; box-shadow:none !important; }
/* Informations générales : entrées au gris des cards ; encadrés « Rien n’est figé » et « Bon à savoir » sans fond. */
html.dark #app .info-axis, html.dark #app .info-page .intro-employer-fold { background:#1C1C1E !important; }
html.dark #app .info-page .intro-employer-fold.info-open { background:transparent !important; }
html.dark #app .info-page .intro-employer-fold.info-open + .intro-employer-fold.info-open { border-top:1px solid #333336 !important; }
html.dark #app .info-page .callout { background:transparent !important; }
html.dark #app .status-ok { background:#173D22; color:#9FE8B4; }
html.dark #app .status-closed { background:#4A1818; color:#FFB3B3; }
html.dark #app .status-plan { background:#2C2C2F; color:#C2C2C6; }
/* Fiche métier : la zone de la frise en dégradé, gris foncé sous la barre d’actions vers presque noir en bas. */
/* Fiche métier : zone de la frise en dégradé de gris. */

/* Écrans de l’appli (hors fiches métier et concours) : même dégradé que la frise des fiches métier. */
/* Fond de tous les écrans, fiches comprises : dégradé figé (calque fixe), comme le gris du mode clair. */
html.dark { background:#0A0A0B !important; }
html.dark body, html.dark .app, html.dark #app main, html.dark #app main.job-page:not(.concours-page), html.dark #app main.job-page.concours-page { background:transparent !important; }
html.dark body::before { display:block !important; content:''; position:fixed; top:0; left:0; right:0; bottom:0; height:auto; z-index:-1; background:linear-gradient(180deg, #171719 0%, #121214 70%, #0A0A0B 100%) !important; pointer-events:none; }
html.dark .footer { background:#0A0A0B !important; }
/* « Concours accessible · Maintenant » : contour vert, texte et coche verts, sans fond. */
html.dark #app .study-level.access-now { background:transparent !important; border:1.5px solid #C8FFB2 !important; color:#C8FFB2 !important; }
html.dark #app .study-level.access-now :is(span, svg) { color:#C8FFB2 !important; }
/* Traits de séparation légers en sombre. */
html.dark { --hair: rgba(255,255,255,.1); }
/* Popup « Votre défi » en sombre : mêmes coins arrondis, cartes anthracite. */
html.dark #app .sheet-content .opt.ambition-opt, html.dark .sheet-content .opt.ambition-opt { min-height:0; border-radius:22px !important; }
/* Switch Métiers / Concours en sombre : flux violet du bloc métiers, texte actif en blanc. */
html.dark #app .explore-switch[role="tablist"][data-on]::before { background-color:transparent !important; background-image:var(--discover-flow) !important; background-size:200% 100% !important; background-repeat:repeat-x !important; animation:discover-flow 7s linear infinite; }
html.dark #app .explore-switch[role="tablist"][data-on] :is(a.on, button.on, a[aria-selected="true"]) { color:#FFF !important; }
@media (prefers-reduced-motion:reduce) { html.dark #app .explore-switch[role="tablist"][data-on]::before { animation:none; background:var(--brand) !important; } }
html.dark #app .explore-switch[role="tablist"][data-on="1"]::before { background:#DDC7FF !important; animation:none; }
html.dark #app .explore-switch[role="tablist"][data-on="1"] :is(a.on, button.on, a[aria-selected="true"]) { color:#161616 !important; text-shadow:none; }
/* Onboarding : switch des onglets en sombre. */
html.dark #app .intro-tabs-screen .fp-tabs { background:#1C1C1E !important; border:0 !important; }
html.dark #app .intro-tabs-screen .fp-tab { color:#C2C2C6 !important; }
html.dark #app .intro-tabs-screen .fp-tab[aria-selected="true"] { color:#FFF !important; }
html.dark #app .intro-tabs-screen .fp-tabs .fp-ink { background-color:transparent !important; background-image:var(--discover-flow) !important; background-size:200% 100% !important; background-repeat:repeat-x !important; animation:discover-flow 7s linear infinite; }
/* 4 catégories : curseur de la teinte douce de la catégorie, aussi en sombre. */
html.dark #app .intro-tabs-screen .cat-tabs .fp-ink { background:var(--ink-tint) !important; animation:none !important; }
html.dark #app .intro-tabs-screen .cat-tabs .fp-tab[aria-selected="true"] .cat.sm { box-shadow:none !important; }
/* Dates des concours : switch comme l’onboarding, aussi en sombre. */
html.dark #app .info-dates .fp-tabs { background:#1C1C1E !important; border:0 !important; }
html.dark #app .info-dates .fp-tab { color:#C2C2C6 !important; }
html.dark #app .info-dates .fp-tab[aria-selected="true"] { color:#FFF !important; }
html.dark #app .info-dates .fp-tabs .fp-ink { background-color:transparent !important; background-image:var(--discover-flow) !important; background-size:200% 100% !important; background-repeat:repeat-x !important; }
html.dark #app .info-dates .cat-tabs .fp-ink { background:var(--ink-tint) !important; animation:none !important; }
html.dark #app .info-dates .cat-tabs .fp-tab[aria-selected="true"] .cat.sm { box-shadow:none !important; }
@media (prefers-reduced-motion:reduce) { html.dark #app :is(.intro-tabs-screen, .info-dates) .fp-tabs .fp-ink, html.dark #app .explore-switch[role="tablist"][data-on]::before { animation:none !important; background-image:none !important; background-color:var(--brand) !important; } }
/* Pages non liées à un concours : boutons en blanc en sombre (miroir du noir en clair). */
html.dark #app:not(.themed):not(.onboarding) .screen .btn:not(.outline):not(.white):not(.danger):not(.danger-solid):not(.theme):not(.fav):not(.btn-bare):not([disabled]) { background:#FFF !important; border-color:#FFF !important; color:#000 !important; }
html.dark #app:not(.themed):not(.onboarding) .screen .btn:not(.outline):not(.white):not(.danger):not(.danger-solid):not(.theme):not(.fav):not(.btn-bare):not([disabled]) svg { color:#000 !important; }
html.dark #app:not(.themed):not(.onboarding) .screen :is(.btn.outline, .btn.white, .btn.btn-bare), html.dark #app:not(.themed):not(.onboarding) .screen :is(.btn.outline, .btn.white, .btn.btn-bare) svg { color:#FFF !important; }
html.dark #app:not(.themed):not(.onboarding) .bourse-switch[data-on]::before { background:#FFF !important; }
html.dark #app:not(.themed):not(.onboarding) .bourse-switch button.on { color:#000 !important; }
/* Fenêtre de mise à jour en sombre : noir et blanc uniquement. */
html.dark body .update-notice { background:#000 !important; color:#FFF !important; border:1px solid #2C2C2E !important; box-shadow:none !important; }
html.dark body .update-notice .update-notice-copy b { color:#FFF !important; }
html.dark body .update-notice .update-notice-copy .update-notice-detail { color:#A8A8AD !important; }
html.dark body .update-notice .update-notice-action { border:0 !important; background:#FFF !important; color:#000 !important; }
html.dark body .update-notice .update-notice-dismiss { border:0 !important; background:#2C2C2E !important; color:#FFF !important; }
"""

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--check', action='store_true')
    css = build()
    if ap.parse_args().check:
        sys.exit(0 if OUT.exists() and OUT.read_text() == css else 'css/dark.css n’est pas à jour : python3 scripts/build_dark.py')
    OUT.write_text(css)
    print(f"css/dark.css : {css.count('.dark')} sélecteurs, {len(css)//1024} Ko")
