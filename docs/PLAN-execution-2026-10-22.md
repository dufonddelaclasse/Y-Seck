# Plan d'exécution : concours, écoles du service public, calendrier, Explorer

Rédigé le 22 octobre 2026 pour la session d'exécution. Tout ce qui est écrit ici a été vérifié dans le code et les données du dépôt `dufonddelaclasse/Y-Seck` (branche `main`, version `20261019-145`, commit `ef29232`).

## 0. Règles de travail du projet (à respecter à chaque tâche)

- Travailler directement sur `main`, c'est la seule branche active. Publication = `git push origin main` (GitHub Pages sert `main`).
- Avant chaque publication : `python3 scripts/build_dark.py` (régénère `css/dark.css` depuis `css/style.css` ; les retouches manuelles sont dans le bloc `MANUAL` de `scripts/build_dark.py`), puis les 7 tests :
  `for t in scripts/check_*.mjs; do node $t >/dev/null 2>&1 || echo "ECHEC $t"; done`
  Ne jamais publier si un test échoue.
- Bump de version à chaque changement : `sed -i 's/20261019-145/20261019-146/g' index.html js/catalog-data.js js/update.js version.json` (adapter les numéros).
- Messages de commit en français, sans tiret cadratin (jamais dans les réponses ni dans les textes de l'app). Terminer chaque message de commit par les deux lignes d'attribution fournies par l'environnement (Co-Authored-By et Claude-Session).
- Répondre à l'utilisateur en français, avec les captures d'écran utiles (Playwright est disponible : `require('/opt/node22/lib/node_modules/playwright')`, serveur local `python3 -m http.server 8000` lancé depuis le dépôt, état du profil dans `localStorage['ofp-state-v1']`).
- Ne jamais afficher dans l'app les notes internes ou éditoriales des données (`notes`, `confidence`, `status`, `caution`...).

Modèle de script Playwright (à adapter) :
```js
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch({args:['--hide-scrollbars']});
  const p = await b.newPage({viewport:{width:393,height:852}, deviceScaleFactor:2, isMobile:true, hasTouch:true});
  await p.goto('http://localhost:8000/');
  await p.evaluate(()=>{localStorage.clear();localStorage.setItem('ofp-state-v1',JSON.stringify({profile:'etu',name:'Alexis',level:'Bac+3',domains:[],traits:['equipe'],done:true,filterHintSeen:true,colorMode:'light',introSeen:true}));});
  await p.goto('http://localhost:8000/index.html#/concours-fiche/E-001'); await p.waitForTimeout(3500);
  await p.screenshot({path:'/tmp/claude-0/.../scratchpad/capture.png'});
  await b.close();
})();
```

## 1. Où en est le projet

### Fait et publié (v145)
- Onglet **Explorer** : les listes Métiers et Concours partagent un seul onglet, avec une bascule en pilule sous le titre (`exploreSwitch` dans `js/app.js`, styles `.explore-switch`). Les routes `#/metiers` et `#/concours-liste` restent valides ; `#/explorer` renvoie vers la dernière liste consultée (`S.explore`).
- Bouton **Information** sur la fiche concours, à gauche de Favori (`data-action="concoursInfo"`, feuille `concoursInfo(c)` dans `js/app.js`). Il ne s'affiche que si `c.description` existe : aujourd'hui aucun concours n'a de description, donc le bouton est invisible tant que la tâche B n'est pas faite.
- Onboarding : 14 centres d'intérêt et 20 traits ajoutés dans `data/catalogue/metadata.json` (`settings.interestOptions`, `settings.traitGroups`), règles d'affectation dans `js/catalog.js` (`TRAIT_RULES`, `ADDED_TRAITS`, `textPattern`). Tests mis à jour (`check_interests.mjs` attend 37 domaines).

### Recherches livrées
Dossier `data/research/2026-10-22/` :
- `BRIEF.md` : consigne et schéma de sortie donnés aux agents de recherche.
- `lots/lot-E1..E6.json` : les 61 concours existants (avec liens officiels tirés du fichier Excel de l'utilisateur) ; `lots/lot-N1..N5.json` : 43 nouveaux concours pressentis (écoles du service public).
- `out/E1..E6.json` : 61 fiches de recherche (toutes livrées) ; `out/N1..N4.json` : 33 nouveaux concours livrés. **`out/N5.json` (armées, agrégation, CAPLP, CAPEPS, PsyEN) a été relancé** : s'il n'est pas là, relancer un agent avec `BRIEF.md` + `lots/lot-N5.json`, sortie attendue au même schéma.
- `reference-routes.json`, `reference-legacy-jobs.json`, `reference-concours.json` : extraits des données actuelles (routes = corps, 182 ; métiers historiques, 65 ; concours, 61).
- `Y-Seck-liens-references-concours.xlsx` et `liens-references.json` : le fichier Excel de l'utilisateur (export des liens de l'app, 7 feuilles).

Chaque fiche de recherche suit le schéma du brief : `ref`, `name`, `school`, `organizer`, `cat`, `fp`, `description`, `voies`, `condition`, `epreuves`, `metiers`, `domain`, `officialUrl`, `trainingMonths`, `paidTraining`, `places`, `sessions[]` (avec `open/close/written/oral/results` en ISO, leurs libellés, `url`, `provisional`, `employer`, `voie`, `session`), `expected`, `annalesUrl`, `evolution`, `checked`, `sources`, `confidence` (haute / moyenne / faible), `notes`.

### Limite connue : réseau
La politique réseau de l'environnement refuse les connexions aux sites officiels (`fonction-publique.gouv.fr`, `enm.justice.fr`, `cnfpt.fr`, `concours-territorial.fr`, `legifrance.gouv.fr`, `insp.gouv.fr`, `cng.sante.fr`, `concours-fph.ars.sante.fr`, etc. : réponse 403 au CONNECT). Les agents ont travaillé à partir des extraits du moteur de recherche (WebSearch), avec un quota partagé qui s'épuise vite. Conséquences :
- les descriptions sont exploitables ;
- les dates sont fiables quand `confidence` vaut « haute » ou « moyenne » et que la source est officielle, à marquer `provisional` sinon ;
- les épreuves et conditions détaillées sont parfois « de mémoire » : voir `notes`.
Pour lever la limite : menu de l'environnement cloud (barre de titre de la session, puis Modifier), accès réseau plus large ou domaines ci-dessus ajoutés aux domaines autorisés (case des gestionnaires de paquets cochée). Documentation : https://code.claude.com/docs/en/cloud-environments#network-access.

### Outils disponibles
- `node scripts/audit_concours.mjs` : pour chaque concours, nombre de sessions au calendrier, sessions à venir, métiers liés, champs renseignés ; puis la liste des écoles citées dans les fiches métiers et absentes du moteur des concours. À relancer après chaque intégration : l'objectif est zéro concours sans métier lié et zéro école citée absente.
- `scripts/export_workbook.mjs` : export Excel des données (c'est lui qui a produit le fichier de liens de l'utilisateur). À régénérer en fin de chantier pour lui fournir la version à jour.
- `scripts/check_*.mjs` : les 7 tests (harnais `vm` qui charge `js/data.js`, `js/catalog.js`, `js/ui.js`, `js/app.js` avec le catalogue complet et expose `window.tests`).

## 2. Comment l'application relie concours, corps, métiers et calendrier (indispensable avant d'écrire des données)

- **Concours** (`data/catalogue/ref-concours-0x.json`, clé `concours`) : `id` (ex. `É-001`, `T-024`, `H-047` ; l'URL utilise `concoursKey` qui remplace « É » par « E »), `fp` (E, T ou H), `cat` (A+, A, B, C), `name`, `routeIds` (liste d'ids de routes), `voies`, `metiers`, `domain`, `condition`, `epreuves`, `variations`, `sessions` (résumés d'épreuves par session, pas des dates), `annales`, `next` (évolutions vers un autre concours), les champs d'orientation (`college`, `collegeOption`, `lyceeGeneral`, `lyceeTechno`, `lyceePro`, `lyceeWhy`, `stage`, `optionSeconde`, `optionTerminale`, `studies`, `l1`, `l2`, `l3`, `master`, `prepa`, `afterBac`, `vigilance`), `source`, `checked`.
- **Routes = corps** (`routes-01.json`, `ref-routes-01.json`, clé `routes`) : `id`, `name`, `cat`, `lvl` (0 = sans diplôme ... 2 = bac, 3 = bac+2, 4 = bac+3, 5 = bac+5, 6 = doctorat), `fp` (chaîne de lettres, ex. `ET`), `cal`, `prep`, `source`, `access`, `matchPattern` (regex sur le nom normalisé du métier, utilisée par les audits, pas par l'app), `cardTitle`.
- **Liens métier / corps** (`links-0x.json`, `ref-links-0x.json`, `audit-01.json`, clé `links`) : `{id: jobId + '__' + routeId, jobId, routeId, status: 'validé' | 'proposé' | 'rejeté', source, note}`. Un lien « rejeté » l'emporte toujours. `js/catalog.js` en déduit `job.routeIds`.
- **Métiers liés à un concours** : `concoursJobs(c)` = métiers dont `routeIds` croise `c.routeIds`, dont `jobCategories(j)` contient `c.cat` et dont `j.fp` contient `c.fp`. Donc **la catégorie du concours doit être celle de la route utilisée par les métiers**, sinon aucun métier ne s'affiche (exemple : la route `conservateur` est en `A+` dans l'app ; un concours INP qui la référence doit être en `A+`).
- **Concours d'un métier** (section « Le concours » de la fiche métier et de « Se préparer ») : `jobRefs(j)` via `route.refs`, rempli automatiquement par `js/catalog.js` à partir de `concours.routeIds`. Ajouter un concours qui référence une route existante suffit pour qu'il apparaisse sur les fiches métiers correspondantes (« inversement » demandé par l'utilisateur).
- **Calendrier** (`calendar-0x.json`, `calendar-official-2027.json`, `calendar-research-2027.json`, clé `calendar`) : une entrée par session et par voie. `concoursSessions(c)` = entrées dont `fp === c.fp` et dont `routeIds` croise `c.routeIds`. `upcoming()` garde les entrées dont l'une des dates `date` (clôture des inscriptions), `written` ou `oral` est >= aujourd'hui, ou sans date avec `provisional: true`. Exemple d'entrée :
```json
{"id":"recherche-e-001-troisieme-concours-2027-institut-national-du-service-p","name":"INSP voie générale","rawName":"INSP voie générale · Troisième concours · session 2027","cat":"A+","fp":"E","voie":"Troisième concours","url":"https://www.insp.gouv.fr/...","source":"INSP – page Troisième concours ; calendrier général fonction-publique.gouv.fr","checked":"2026-10-19","open":"2026-08-04","date":"2026-09-22","openLabel":"4 août 2026","closeLabel":"22 septembre 2026","written":"2027-03-16","writtenLabel":"Semaine du 15 mars 2027","oral":null,"oralLabel":"Entre mai et mi-juillet 2027","routeIds":["admin-etat"],"provisional":false,"employer":"Institut national du service public (INSP)"}
```
  Le champ `calendarExpected` (même fichier) porte les sessions attendues sans date publiée : `{"concours":"É-002","voie":"Toutes les voies","expected":"Inscriptions attendues début 2027 ...","url":"...","checked":"2026-10-19"}`.
- **Sigles** (`ref-glossaire-01.json`, clé `sigles` : `{id, label}`) : `sig()` les explique au premier affichage. Ajouter les nouveaux sigles (ENM, ENG, ENAP, ENPJJ, EOGN, ENSOSP, INP, Enssib, ENSAI, ENSAE, INSED, ENTPE, ENAC, ENSV, EN3S, ECA, ESA, CAPLP, CAPEPS, PsyEN, ISPV, IPEF, IAE, ITPE, ICNA, TSEEAC, ISGN, DGCCRF, ENCCRF, CPIP, SDIS, SOG...).
- **Manifeste** : tout nouveau fichier de `data/catalogue/` doit être ajouté dans `data/catalogue.json` (`parts`), sinon il n'est pas chargé. Le chargement fusionne les tableaux de même clé.
- **Champs affichés par la frise et la fiche concours** : `voies`, `condition`, `epreuves`, `prepa`, `studies`, `l3`, `vigilance`, `sessions` (résumés), `next`, le calendrier (`concoursSessions`). Le bouton Information affiche : `description` (paragraphes séparés par des sauts de ligne), `school`, `organizer`, `trainingMonths` + `paidTraining`, `places`, `evolution`, `metiers`, `source`.

## 3. Tâche A (recommandée) : passe de vérification sur les pages officielles

Condition : l'utilisateur a ouvert l'accès réseau (voir §1). Vérifier avec `curl -s -o /dev/null -w "%{http_code}" https://www.fonction-publique.gouv.fr/` (200 attendu).

1. Lancer un agent par lot (`general-purpose`, en arrière-plan) avec la consigne : lire `BRIEF.md`, le lot et la sortie existante `out/<lot>.json` ; pour chaque fiche dont `confidence` n'est pas « haute », ouvrir `officialUrl` et les `sessions[].url`, corriger les dates, épreuves, conditions, postes ; écrire `out/<lot>.verified.json` au même schéma avec `checked` à la date du jour ; répondre en 5 lignes.
2. Dans la tâche B, lire `*.verified.json` quand il existe, sinon `*.json`.

Si le réseau reste fermé, passer directement à la tâche B en gardant `provisional: true` sur toute date de confiance « faible » et en reportant `notes` dans un champ `researchNotes` **non affiché**.

## 4. Tâche B : script d'intégration `scripts/integrate_research.mjs`

Écrire un script Node idempotent (relançable sans doublon) qui lit `data/research/2026-10-22/out/*.json` et produit ou met à jour les fichiers ci-dessous. Le lancer, puis `node scripts/audit_concours.mjs` et les 7 tests.

### B.1 Les 61 concours existants (mise à jour en place de `ref-concours-01/02/03.json`)
Pour chaque fiche `E*.json` (clé `ref` = id du concours) :
- Ajouter : `description`, `school`, `organizer`, `trainingMonths`, `paidTraining`, `places`, `evolution`, `researchChecked: "2026-10-22"`, `researchConfidence`, `researchNotes` (jamais affiché).
- Remplacer `voies`, `condition`, `epreuves`, `metiers` par la valeur de recherche seulement si `confidence` vaut « haute » ou « moyenne », que la valeur n'est pas nulle et qu'elle est plus longue (plus précise) que la valeur actuelle. Sinon garder l'existant.
- `annales` : si absent et `annalesUrl` renseigné, créer `{kind: "Sujets et rapports de jury", years: "", url, scope: name, caution: "Vérifier la session et la voie."}`.
- `source` : remplacer uniquement pour les concours dont la source actuelle est erronée (signalé par les agents) : `É-021` (pointait vers l'AP-HP), `É-023` (AP-HP), `T-040` (AP-HP), `H-058` (Onisep), `H-057` et `H-061` si la recherche donne une page officielle d'établissement ou d'ARS.
- Ne pas toucher aux champs d'orientation ni à `next`.

### B.2 Les nouveaux concours (`ref-concours-04.json`, clé `concours`)
Un objet par fiche `N*.json`, au schéma complet des concours existants. Numérotation : continuer après `H-061`, lettre selon le versant (`É-062`, `É-063`... pour l'État, `T-0xx` pour la territoriale), dans l'ordre des lots N1 à N5. Table des correspondances (ref de recherche, versant/catégorie **dans l'app**, routeIds, concours « donneur » pour copier les champs d'orientation, liens à créer) :

| ref | fp / cat | routeIds | donneur orientation | liens métiers (regex sur nom normalisé, sans accent, minuscules) |
|---|---|---|---|---|
| NEW-enm | E / A+ | `magistrat` (existe, 9 liens) | É-001 | aucun nouveau lien nécessaire |
| NEW-dsgj | E / A | `dsg` (existe, 18 liens) | É-012 | aucun |
| NEW-cpip | E / A | `cpip` (existe, 3 liens) | É-012 | aucun |
| NEW-lieutenant-pen (renommé « capitaine pénitentiaire », cat A d'après la recherche) | E / A | nouvelle route `capitaine-pen` (A, E, lvl 4) | É-012 | `capitaine.*penitentiaire|officier.*penitentiaire|lieutenant.*penitentiaire|chef de detention` |
| NEW-educ-pjj | E / A | `educ-pjj` (existe, 1 lien) | É-012 | compléter : `educateur.*(pjj|protection judiciaire)` |
| NEW-dir-pjj | E / A | nouvelle route `dir-pjj` (A, E, 4) | É-012 | `directeur.*(pjj|protection judiciaire)` |
| NEW-sog | E / B | `sous-off-gend` (existe, 25 liens) | É-016 | aucun |
| NEW-eogn | E / A | nouvelle route `officier-gend` (A, E, 4) | É-008 | `officier.*gendarmerie|commandant.*gendarmerie|gendarmerie.*(commandement|encadrement)` |
| NEW-pts | E / B | nouvelle route `pts` (B, E, 2) | É-019 | `police technique et scientifique|identite judiciaire|technicien.*scientifique.*police` |
| NEW-inp | E / A+ | `conservateur` (existe, A+, fp ET, 6 liens) | É-001 | aucun |
| NEW-cons-terr-pat | T / A+ | `conservateur` | T-024 | aucun |
| NEW-enssib | E / A+ | nouvelle route `conservateur-bib-etat` (A+, E, 4) | É-001 | `conservateur.*biblioth` |
| NEW-biblio-etat | E / A | nouvelle route `bibliothecaire` (A, E, 4) | É-002 | `^bibliothecaire|biblioth.caire\b` |
| NEW-cons-terr-bib | T / A+ | `conservateur-bib` (existe, 2 liens) | T-024 | aucun |
| NEW-attache-conservation | T / A | nouvelle route `attache-conservation` (A, T, 4) | T-026 | `attache.*conservation|archiviste|charge.*patrimoine|mediateur.*patrimoine` |
| NEW-ensai | E / A | nouvelle route `attache-insee` (A, E, 4) | É-002 | `statisticien|charge d.etudes statistiques|analyste de donnees|data analyst` |
| NEW-ensae (devenu INSED, décret 2025-822) | E / A+ | nouvelle route `insed` (A+, E, 5) | É-001 | `administrateur.*insee|ingenieur.*statistique|data scientist|economiste` |
| NEW-insp-orient | E / A+ | nouvelle route `admin-etat-orient` (A+, E, 5) | É-001 | `diplomat|affaires etrangeres|ambassad|consul|chancellerie|cooperation internationale|politique diplomatique` et les fiches RMFP de `rmfpDomain` « International » (familles « Politique diplomatique », « Consulaire », « Coopération internationale ») |
| NEW-sae | E / A | nouvelle route `sae` (A, E, 4) | É-002 | même regex que ci-dessus, catégorie A |
| NEW-itpe | E / A | `itpe` (existe, 185 liens) | T-027 | aucun |
| NEW-itm | E / A | nouvelle route `itm` (A, E, 4) | T-027 | `meteorolog|climatolog|previsionniste` |
| NEW-tsm | E / B | nouvelle route `tsm` (B, E, 2) | É-019 | `meteorolog|observateur meteo` |
| NEW-itgce (devenu ISGN, décret 2024-462) | E / A | nouvelle route `isgn` (A, E, 4) | T-027 | `geograph|cartograph|geomati|topograph|geodes` |
| NEW-icna | E / A | nouvelle route `icna` (A, E, 4) | T-027 | `controleur.*aerien|navigation aerienne|controle aerien` |
| NEW-tseeac | E / B | nouvelle route `tseeac` (B, E, 2) | É-019 | `aviation civile|aeronautique|aeroport` |
| NEW-ispv | E / A+ | nouvelle route `ispv` (A+, E, 5) | É-001 | `veterinaire|sante publique veterinaire|securite sanitaire.*aliment` |
| NEW-iae | E / A | nouvelle route `iae` (A, E, 4) | T-027 | `ingenieur.*(agricult|agronom|forest|environnement|\beau\b)` |
| NEW-ipef | E / A+ | `ipef` (existe, 7 liens) | É-001 | aucun |
| NEW-enccrf | E / A | `dgccrf` (existe, 1 lien) | É-002 | compléter : `concurrence|consommation|repression des fraudes|dgccrf` |
| NEW-spp | T / C | `spp` (existe, 1 lien) | T-044 | compléter : `sapeur|pompier` |
| NEW-lieutenant-spp | T / B | nouvelle route `lieutenant-spp` (B, T, 2) | T-037 | `lieutenant.*pompier|chef de centre|officier.*pompier` |
| NEW-capitaine-spp | T / A | nouvelle route `capitaine-spp` (A, T, 4) | T-032 | `capitaine.*pompier|commandant.*pompier|chef de groupement` |
| NEW-en3s | E / A+ (hors fonction publique, le dire dans la description) | nouvelle route `en3s` (A+, E, 5) | É-002 | `securite sociale|caisse d.allocations|cpam|urssaf|protection sociale` |
| NEW-saint-cyr, NEW-navale, NEW-air | E / A (statut militaire, à dire) | nouvelles routes `officier-terre`, `officier-marine`, `officier-air` (A, E, 4) | É-008 | regarder les 31 fiches RMFP de domaine « Défense » (famille « Opérations des forces armées ») et les métiers historiques « Militaire du rang », « Pilote d'hélicoptère des forces armées », « Commandant d'unité de combat » ; regex indicatives : `officier|commandant|chef de section` (terre), `marine|navire|sous.marin|marin\b` (marine), `pilote|aviateur|aeronef|armee de l.air` (air) |
| NEW-sous-officier-armees | E / B | nouvelle route `sous-officier-armees` (B, E, 2) | É-016 | `sous.officier|sergent|maistrance|major` |
| NEW-commissaire-armees | E / A | nouvelle route `commissaire-armees` (A, E, 4) | É-002 | `commissaire des armees|administration.*(defense|militaire)|soutien.*armees` |
| NEW-esa | E / A | nouvelle route `medecin-armees` (A, E, 5) | É-008 | `medecin.*armees|medecin militaire|sante des armees` |
| NEW-agregation, NEW-caplp, NEW-capeps | E / A | `capes` (existe, 16 liens ; son `matchPattern` couvre CAPES, CAPET, CAPLP, CAPEPS) | É-006 | vérifier qu'un métier « Professeur d'EPS » ou « Professeur de lycée professionnel » existe ; sinon s'appuyer sur « Professeur de collège et lycée » |
| NEW-psyen | E / A | nouvelle route `psyen` (A, E, 5) | É-006 | `psychologue.*(education|scolaire)|orientation` |

Champs d'orientation : copier ceux du concours donneur (`college` ... `vigilance`, `studies`, `l1` à `l3`, `master`, `prepa`, `afterBac`), puis adapter `prepa` et `studies` quand la recherche donne mieux (`school`, `description`). `variations` : « Selon voie, spécialité et session ; vérifier le texte en vigueur ». `sessions` (résumés d'épreuves) : une entrée `{session: "2027" ou "2026", text: epreuves, caution: "", status: "Recherche du 22 octobre 2026, à confirmer sur l'avis officiel", url: officialUrl}`. `checked: "2026-10-22"`, `source: officialUrl`.

### B.3 Nouvelles routes (`ref-routes-02.json`, clé `routes`)
Pour chaque « nouvelle route » du tableau : `{id, name (masculin puis féminin, sans point médian, ex. "Capitaine pénitentiaire"), cat, lvl, fp, cal: "", prep: "", source: officialUrl, access: "Concours", matchPattern, cardTitle: "Concours de ..."}`.

### B.4 Nouveaux liens métier / corps (`ref-links-09.json`, clé `links`)
Pour chaque nouvelle route (et pour les routes existantes à compléter), parcourir `D.jobs` (via le harnais `vm` des tests, après `js/catalog.js`) avec la regex sur le nom normalisé (`normalize` de `js/catalog.js` : NFD sans accents, apostrophes remplacées par un espace, minuscules) et les critères `rmfpDomain` / `family` indiqués. Créer `{id: jobId + '__' + routeId, jobId, routeId, status: "proposé", source: officialUrl, note: "Rapprochement proposé le 22 octobre 2026 à partir de l'intitulé du métier : vérifier le corps indiqué dans l'offre."}`. Ne jamais recréer un lien déjà présent ni un lien « rejeté ». Vérifier à la main les 5 premiers métiers de chaque route (`node -e` ou script) : une regex trop large (ex. `officier`) accroche des métiers étrangers au corps ; dans ce cas la resserrer.

### B.5 Calendrier (`calendar-research-2026-10-22.json`, clés `calendar` et `calendarExpected`)
Pour chaque `sessions[]` de chaque fiche (existante ou nouvelle) :
- `id` : `recherche-<clé concours en minuscules>-<voie en slug>-<session>-<slug de l'organisateur>` (ex. `recherche-e-062-premier-concours-2027-enm`), unique.
- `name` = nom du concours, `rawName` = `name + ' · ' + voie + ' · session ' + session`, `cat`, `fp`, `voie` (« Concours externe », « Concours interne », « Troisième concours », « Toutes les voies »...), `url` (= `sessions[].url`), `source` (= organisateur + « recherche du 22 octobre 2026 »), `checked: "2026-10-22"`, `open`, `date` (= `close`), `openLabel`, `closeLabel`, `written`, `writtenLabel`, `oral`, `oralLabel`, `routeIds` (= ceux du concours), `provisional` (true si la fiche le dit, ou si `confidence` est « faible », ou si une date n'est connue qu'au mois), `employer`.
- Dédoublonnage : ignorer une session si le calendrier existant (après fusion de toutes les parts) contient déjà une entrée avec le même `fp`, une route commune, la même `voie` (comparaison insensible à la casse) et la même date de clôture `date` (ou, à défaut, le même `written`).
- Ignorer les sessions entièrement passées (toutes les dates < 2026-10-22) sauf si le concours n'a aucune autre session : les garder alors avec `provisional: false` (elles servent de repère « inscriptions closes » dans la frise).
- `calendarExpected` : une entrée par fiche dont `expected` est renseigné et qui n'a aucune session à venir : `{concours: id, voie: "Toutes les voies", expected, url: officialUrl, checked: "2026-10-22"}`.

### B.6 Sigles (`ref-glossaire-02.json`, clé `sigles`)
Ajouter les sigles listés au §2, avec leur libellé complet, sans doublon avec `ref-glossaire-01.json`.

### B.7 Manifeste et vérifications
- Ajouter `catalogue/ref-concours-04.json`, `catalogue/ref-routes-02.json`, `catalogue/ref-links-09.json`, `catalogue/ref-glossaire-02.json`, `catalogue/calendar-research-2026-10-22.json` à `data/catalogue.json` (`parts`), avant `catalogue/audit-01.json`.
- `node scripts/audit_concours.mjs` : chaque concours doit avoir au moins un métier lié ; les 19 concours initialement sans date doivent avoir au moins une session ou une entrée `calendarExpected` ; la liste « ABSENT des concours » doit se réduire aux cas sans objet (« Cour des comptes », « Mines », « navale » si non traités).
- Ajouter dans `scripts/check_preparation.mjs` : `D.concours.length >= 94` ; `D.concours.every(c => c.description)` ; le métier `magistrat` a un concours dont le nom contient « magistrature » dans `jobRefs` ; un concours dont le nom contient « Orient » existe ; `screens['concours-fiche']('E-001')` contient `data-action="concoursInfo"` ; `concoursJobs` non vide pour chaque nouveau concours (lister les exceptions acceptées dans le test avec leur raison).
- Les 7 tests passent. Relancer `node scripts/check_catalogue_loading.mjs` en particulier (il contrôle l'ordre de fusion des parts).

## 5. Tâche C : contrôle visuel et finitions d'interface

1. Fiche concours (`#/concours-fiche/E-001`, puis un nouveau, ex. ENM) : le bouton Information s'affiche à gauche de Favori ; la feuille présente la description, l'école, la durée de formation, les postes, les métiers, le lien officiel ; vérifier en clair et en foncé (`colorMode:'dark'` dans l'état). Les styles sont `.concours-info` et `.concours-facts` dans `css/style.css` ; `css/dark.css` se régénère avec `build_dark.py`.
2. Fiche métier `#/metier/magistrat` : la section « Le concours » doit proposer l'ENM ; « Se préparer » (`#/preparer/magistrat`) aussi.
3. Liste Explorer, bascule Concours : les nouveaux concours apparaissent avec leur pastille de catégorie et le résumé « Versant · Voies » ; la recherche (`concoursSearchText` = nom + métiers + domaine) les trouve (tester « ENM », « pompier », « gendarmerie », « Orient »).
4. Accueil : le compteur « Vos concours » augmente selon le profil (catégories par défaut `A+, A, B` dès Bac+3).
5. Frise des nouveaux concours : `concoursLevel` se calcule depuis `lvl` des routes ; vérifier qu'un concours B (sous-officier de gendarmerie) affiche bien « Bac » comme diplôme d'arrivée, un A+ « Bac+5 ».
6. Onboarding : capture des écrans « Ce qui vous attire » (37 tuiles) et « Ce qui vous ressemble » (55 puces) pour validation de l'utilisateur ; si trop long, proposer de replier les groupes.

## 6. Tâche D : livraison

1. Bump de version, `build_dark.py`, 7 tests, commit (message en français décrivant : nouveaux concours, dates, descriptions, liens), push `main`.
2. Régénérer l'export Excel avec `scripts/export_workbook.mjs` (lire son en-tête pour les arguments) et l'envoyer à l'utilisateur (SendUserFile) : il contient les liens de référence de tous les concours, nouveaux compris.
3. Sauvegarde zip comme les précédentes (`site/` = `git archive HEAD`, `Y-Seck-historique-complet.bundle` = `git bundle create ... HEAD main audit/fiabilisation-catalogue-2026-10 claude/inspiring-dirac-dd6k3x`, `LISEZMOI.txt`), dans le scratchpad, envoyée à l'utilisateur.
4. Compte rendu à l'utilisateur, en français, sans tiret cadratin : nombre de concours (61 + nouveaux), nombre de sessions ajoutées, concours restés sans date (avec la raison : concours sur titres par établissement, périodicité bisannuelle, arrêté non paru), points marqués « à vérifier » et proposition de passe de vérification quand le réseau sera ouvert.

## 7. Décisions déjà prises (ne pas rouvrir)

- Un concours par école et par corps ; l'école figure dans `school` et dans la description, le corps dans le nom du concours.
- INSP voie Orient = troisième voie du concours INSP (arrêté du 29 avril 2022), scolarité INSP puis affectation au ministère des Affaires étrangères ; route dédiée `admin-etat-orient` pour que les métiers liés soient diplomatiques (et non les 36 métiers de la voie générale).
- Le concours de lieutenant pénitentiaire n'existe plus : fiche « Capitaine pénitentiaire » en catégorie A.
- ITGCE renommé « Ingénieur des sciences géographiques et du numérique » (ISGN) ; administrateur de l'INSEE remplacé par « Ingénieur de la statistique, de l'économie et de la donnée » (INSED).
- Militaires (Saint-Cyr, École navale, École de l'air, sous-officiers, commissaires, médecins des armées) : versant `E`, catégorie A ou B selon le niveau, description précisant le statut militaire ; recrutement sur dossier et tests quand ce n'est pas un concours (sous-officiers).
- EN3S : versant `E`, description précisant que les organismes de sécurité sociale sont hors fonction publique.
- Attaché territorial de conservation : aucune session 2026/2027 (périodicité triennale) : `calendarExpected` seulement.
- Concours hospitaliers sur titres par établissement (H-051, H-053, H-057, H-059, H-060, H-061) : pas de session nationale ; garder le texte `expected` et les sessions d'établissement déjà au calendrier.
- Les champs de recherche `confidence`, `notes`, `sources` ne sont jamais affichés dans l'app.
