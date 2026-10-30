# Plan d'action : recentrer les métiers et concours proposés par domaine

Rédigé le 30 octobre 2026 pour une session d'exécution (Opus). Tout ce qui suit a été vérifié dans le code et les données du dépôt `dufonddelaclasse/Y-Seck` (branche `main`, version `20261029-322`).

## 0. Le problème à résoudre

Quel que soit le profil (6e, lycée, Bac+5, reconversion, parent), cocher un ou deux secteurs renvoie beaucoup trop de métiers. Le 6e est juste le cas le plus visible parce qu'aucun filtre de niveau ne vient réduire la liste. Le recentrage doit valoir pour toutes les recherches et tous les profils : le domaine se classe une fois pour toutes par métier, indépendamment du niveau, du défi ou du mode parent. Exemples mesurés aujourd'hui (correspondances dites « parfaites », avant le filtre de niveau) :

| Domaine coché | Métiers « pour vous » |
|---|---|
| Administration | 207 |
| Environnement | 168 |
| Technique | 130 |
| Transports | 129 |
| Recherche | 123 |
| Santé | 90 |
| Sécurité | 88 |
| Inspection | 74 |
| Culture, Urbanisme | 65 |
| Défense | 33 |

Et le tri à deux niveaux prévu (« pour vous », puis « peuvent aussi vous intéresser ») ne joue plus : pour 36 domaines sur 37, les listes `strongInterests` et `interests` sont identiques (seul « Langues » diffère : 3 contre 22). La seconde liste n'est donc plus « ce qui s'en rapproche », c'est « tout le reste ».

Cause : un métier est rattaché à un domaine dès que son `rmfpDomain` ou sa `family` RMFP correspond, ou que son intitulé matche un `namePattern`. Or un domaine RMFP regroupe tout ce qui s'exerce dans le secteur, y compris les fonctions transverses (« Agent de confection textiles et cuir » est en Défense ; les 119 métiers du domaine RMFP « Recherche » tombent tous dans « Recherche »).

Objectif : ne compter et n'afficher en premier que les métiers dont l'objet même est le secteur choisi, puis proposer les autres en pistes, classés par proximité, derrière le compteur jaune et le bouton « Explorer d'autres métiers / concours » déjà en place.

## 1. Sauvegarde et retour arrière

Déjà fait le 30 octobre, avant toute modification :
- branche `sauvegarde/avant-recentrage-domaines` poussée sur GitHub (commit `71af1ce`) ;
- tag local `avant-recentrage-domaines` (le push des tags est refusé par le proxy, la branche suffit).

Pour revenir en arrière complètement : `git checkout main && git reset --hard sauvegarde/avant-recentrage-domaines && git push --force-with-lease`, puis bump de version.

À prévoir en plus dans le code : un interrupteur unique `STRICT_DOMAINS` (constante en tête de `js/catalog.js`, valeur `true`). À `false`, l'app retombe exactement sur le calcul actuel. Ainsi Alexis peut comparer les deux comportements en un seul changement de ligne, sans toucher aux données.

## 2. Règles de travail du projet (inchangées)

- Travailler sur `main`, publication = `git push origin main` (GitHub Pages). Une autre session peut pousser en parallèle : `git pull --rebase` avant chaque push, ne jamais réutiliser un numéro de version déjà publié.
- Avant chaque publication : `python3 scripts/build_dark.py` (les règles propres au sombre vont dans le bloc `MANUAL` de ce script, jamais dans `css/style.css` qui est remappé), puis `for t in scripts/check_*.mjs; do node $t >/dev/null 2>&1 || echo "ECHEC $t"; done`. Ne jamais publier si un test échoue.
- Bump de version dans `index.html`, `js/catalog-data.js`, `js/update.js`, `version.json` (`sed -i 's/20261029-322/20261029-323/g' …`, adapter).
- Commits en français, jamais de tiret cadratin (ni dans les réponses, ni dans l'app), vouvoiement dans les textes de l'app. Terminer chaque message de commit par les lignes d'attribution fournies par l'environnement.
- Captures Playwright dans le scratchpad, jamais dans le dépôt. Serveur : `(setsid python3 -m http.server 8765 >/dev/null 2>&1 &)`, puis `pkill -f "http[.]server 8765"` (le code de sortie 144 est normal). Profil de test dans `localStorage['ofp-state-v1']`, par exemple `{profile:'etu',name:'Léa',introSeen:true,done:true,level:'6e',domains:['Défense'],defis:['nsp'],filterHintSeen:true,tipSeen:{metiers:1,'concours-liste':1}}`.

## 3. Où est le code concerné

- `js/catalog.js` lignes 150 à 167 : calcul de `job.interests` et `job.strongInterests` à partir de `D.domainOptions` (= `settings.interestOptions` de `data/catalogue/metadata.json`, 37 domaines avec `rmfpDomains`, `families`, `namePattern`, `textPattern`).
- `js/app.js` :
  - `matchesStrong`, `matchesDomains`, `jobFitsCriteria`, `isPerfectJob`, `partialScore`, `score` (lignes 505 à 560) ;
  - `splitJobs` (ligne 970) et `splitConcours` / `isPerfectConcours` / `concoursPartial` (lignes 1014 à 1030) : c'est là que se fait la coupure « pour vous » / « peuvent aussi vous intéresser » ;
  - `myJobs` / `myConcours` : les compteurs de l'espace perso ;
  - `alsoBlock`, `S.showOthersJobs`, `S.showOthersConcours` : l'affichage du compteur jaune et du bouton, déjà en place, à conserver tel quel.
- Données : 1 134 métiers (`D.jobs` = 65 métiers historiques `legacyJobs` + 1 069 fiches RMFP `rmfp-*.json`, 201 couples domaine RMFP / famille), 177 concours. Un concours n'a pas de domaine propre : il hérite des métiers qu'il dessert (`concoursJobs`).
- Champs utiles par métier : `name`, `desc`, `activities`, `skills`, `knowledge`, `rmfpDomain`, `family`, `domain` (domaine app historique), `traits`, `fp`, `categories`.

## 4. Principe retenu : trois cercles par domaine

Pour chaque métier et chaque domaine, une relation à trois niveaux, stockée dans les données (pas recalculée à la volée par des regex) :

1. **Cœur** : l'objet du métier est le secteur. Pilote de chasse, combattant, artilleur pour Défense ; gardien de la paix, commissaire, policier municipal pour Sécurité. Un métier a 1 cœur, 2 au plus (un médecin militaire : Santé et Défense).
2. **Proche** : métier exercé dans le secteur ou à son service, mais dont la compétence est transverse ou voisine : spécialiste radioprotection ou agent de confection textile à la Défense, renseignement pour Sécurité, secours pour Sécurité, Secours pour Défense.
3. **Lointain** : simple mention dans le texte (un graphiste qui traite de sujets de défense). Ne compte jamais.

Seul le cercle 1 fait une correspondance « parfaite » et entre dans les compteurs. Le cercle 2 remplit « peuvent aussi vous intéresser », classé avant le cercle 3 et avant tout le reste.

Une hiérarchie entre domaines complète le dispositif, pour que le cercle 2 soit cohérent même quand le tagueur a hésité. À écrire dans `metadata.json`, clé `settings.domainGraph`, sous la forme `{ "Défense": { "proches": ["Sécurité", "Renseignement", "Mer", "Secours"] }, "Sécurité": { "proches": ["Défense", "Renseignement", "Secours", "Justice", "Citoyens"] }, "Arts": { "proches": ["Culture", "Communication"] }, … }`. Un métier cœur d'un domaine « proche » du domaine coché est automatiquement cercle 2.

## 5. Étapes

### Étape 1 : exporter le corpus à analyser (script, 30 min)

Créer `scripts/export_domain_corpus.mjs` qui charge le catalogue comme `scripts/check_series.mjs` le fait (manifeste `data/catalogue.json`, puis `js/data.js` et `js/catalog.js` dans un `vm`), et écrit `data/work/domain-corpus-NN.json` par paquets de 60 métiers : `{ id, name, rmfpDomain, family, domain, strongInterests (actuel), desc (300 car.), activities (400 car.) }`. 1 134 métiers donnent 19 paquets. Le dossier `data/work/` est ajouté au `.gitignore` : c'est de la matière de travail, pas de la donnée publiée.

### Étape 2 : classer chaque métier (Opus, c'est le gros du travail)

Lire chaque paquet et produire `data/catalogue/domain-tags-NN.json` au format :

```json
{ "domainTags": [
  { "job": "fpdef012", "coeur": ["Défense"], "proches": ["Mer", "Technique"] },
  { "job": "chancellerie", "coeur": ["Diplomatie"], "proches": ["Administration", "Langues"] }
] }
```

Règles de classement à appliquer, dans l'ordre :
- Le cœur se décide sur l'intitulé et la première phrase de la description : « que fait-on ? » et non « où le fait-on ? ». Un juriste du ministère des Armées est cœur Justice, proche Défense.
- 1 cœur par défaut, 2 au maximum, jamais 0. En cas de doute entre deux domaines, le plus précis l'emporte (Secours avant Sécurité, Arts avant Culture, Donnees avant Numérique, Urbanisme avant Architecture).
- Les fonctions transverses (RH, Finances, Communication, Administration, Logistique, Numérique, Donnees, Inspection) sont cœur de leur fonction et proche du secteur d'exercice. C'est ce qui vide « Administration » de ses 207 métiers hétéroclites et sort le graphiste de Défense.
- Les 119 métiers du domaine RMFP « Recherche » : cœur Recherche seulement pour les chercheurs, ingénieurs de recherche et doctorants ; les gestionnaires, techniciens et administratifs de la recherche sont cœur de leur fonction, proche Recherche.
- « Environnement » (168 aujourd'hui) : séparer Environnement (biodiversité, eau, pollution, climat), EspacesVerts, Agriculture, Urbanisme, Technique, Transports selon l'objet réel.
- Ne pas s'appuyer sur `strongInterests` actuel autrement que comme indice : il est trop large, c'est la raison du chantier.
- Les 65 métiers historiques (`rmfpDomain` vide) ont un `domain` choisi à la main, fiable : le garder en cœur, ajouter les proches.
- Les métiers contractuels (`isContractJob`) se classent comme les autres.

Tenir un compteur par domaine au fil de l'eau. Le classement ne dépend d'aucun profil : c'est une propriété du métier. Cible indicative, tous niveaux confondus (donc pour le cas le plus large) : aucun domaine au-delà de 60 métiers cœur, et aucun en dessous de 5 (sinon fusionner la notion dans un domaine voisin via le graphe, pas en gonflant le cœur).

Valider les 19 fichiers avec un petit script `scripts/check_domain_tags.mjs` (nouveau test, même gabarit que les autres) : chaque métier a exactement une entrée, 1 ou 2 cœurs, des identifiants de domaine connus, et le tableau des effectifs par domaine est imprimé.

### Étape 3 : brancher les données dans le catalogue (code, 1 h)

Dans `js/catalog.js` :
- ajouter `domain-tags-NN.json` au manifeste `data/catalogue.json` (clé `domainTags`, fusionnée comme les autres tableaux) ;
- en tête du fichier : `var STRICT_DOMAINS = true;` ;
- après le calcul actuel de `interests` / `strongInterests`, si `STRICT_DOMAINS` et qu'une entrée existe pour le métier : `job.coreDomains = tag.coeur`, `job.nearDomains = tag.proches ∪ cœurs des domaines proches selon domainGraph`, `job.strongInterests = job.coreDomains`, `job.interests = coreDomains ∪ nearDomains ∪ interests textuels actuels`. Un métier sans entrée garde le calcul actuel (et le test de l'étape 2 doit empêcher ce cas).

Dans `js/app.js` :
- `partialScore` : remplacer les deux paliers actuels (4 si strict, 2 si texte) par trois : cœur 6 (n'arrive pas dans « autres », par construction), proche 4, lointain 2, puis le reste. Ainsi la liste « peuvent aussi vous intéresser » commence par le cercle 2.
- `alsoBlock` : ne rien changer d'apparence. Le compteur jaune compte désormais cercle 2 + cercle 3 + reste, comme aujourd'hui il compte « tout le reste ».
- Les concours suivent automatiquement par `concoursJobs` : un concours est « parfait » si l'un de ses métiers est cœur du domaine coché, « proche » sinon selon le meilleur `partialScore` de ses métiers. Vérifier que `concoursPartial` reprend bien les nouveaux paliers.
- Espace perso : `myJobs` / `myConcours` utilisent déjà `isPerfectJob` / `isPerfectConcours`, les chiffres se recentrent donc sans autre changement.
- Onboarding et profil : rien à changer, le choix des domaines reste le même.

### Étape 3 bis : ordonner les résultats selon le défi (hiérarchie des catégories)

Aujourd'hui le défi ne fait que filtrer (`defiCats` : « sélectif » garde A+ et A, « rapide » et « évoluer » gardent B et C, croisés avec le niveau par `defaultCats`). À l'intérieur d'une liste, l'ordre ne tient pas compte de la catégorie : `splitJobs` trie par `score` (domaine puis traits). Il faut que la hiérarchie des catégories suive le défi, dans « pour vous » comme dans « peuvent aussi vous intéresser », et pour tous les profils.

Règle à coder dans `js/app.js`, fonction nouvelle `catOrder()` qui renvoie l'ordre de préférence des catégories :
- défi `selectif` : A+, A, B, C, CDD (les hautes fonctions d'abord) ;
- défi `exigeante` : A, A+, B, C, CDD ;
- défi `rapide` : C, B, A, A+, CDD (la voie la plus courte d'abord) ;
- défi `evoluer` : B, C, A, A+, CDD ;
- défi `sansconcours` combiné à un autre : l'ordre de l'autre défi, les CDD remontent juste après les catégories retenues ;
- plusieurs défis cochés : on garde l'ordre du premier dans la liste `DEFIS` (le plus ambitieux prime), les catégories des autres défis suivent ;
- sans défi (`nsp` ou rien) : l'ordre du niveau, du plus proche de l'utilisateur au plus lointain. Avec un Bac+3 ou plus : A, A+, B, C ; en dessous : C, B, A, A+ ; sans niveau renseigné : B, C, A, A+.

Appliquer `catOrder()` comme premier critère de tri, avant `score`, dans :
- `splitJobs` (listes `perfect` et `others`) et `myJobs` ;
- `splitConcours` et `myConcours` (la catégorie d'un concours est `c.cat`) ;
- la catégorie d'un métier à plusieurs catégories est la meilleure selon `catOrder()` parmi `jobCategories(j)`, et c'est aussi celle que la card affiche en premier (voir `shownCats` dans `jobRow`, qui suit déjà les filtres : lui faire suivre aussi cet ordre).

Dans « peuvent aussi vous intéresser », le tri devient : cercle (proche avant lointain avant reste), puis `catOrder()`, puis `score`. Ainsi, avec « rapide », un collégien voit d'abord les métiers B et C de son domaine, puis les B et C des domaines proches, et les A+ en toute fin. Avec « sélectif », l'inverse.

`contractsLater` (les quatre premières places aux métiers sous concours) reste en vigueur sauf si le défi `sansconcours` est le seul coché.

À vérifier à l'étape 4 : 6e + Défense + « rapide » (C et B en tête), Bac+5 + Administration + « sélectif » (A+ en tête : administrateur de l'État avant attaché), Bac+3 + Santé sans défi (A puis A+ puis B), et le même profil après changement de défi dans « Votre défi » du profil (l'ordre doit se mettre à jour sans recharger).

### Étape 4 : vérifier (Playwright + tests, 45 min)

- Rejouer les profils type et noter les chiffres avant / après, pour couvrir tous les cas : 6e + Défense ; 3e + Sécurité + Santé ; Terminale + Administration ; Bac+3 + Numérique avec le défi « sélectif » ; Bac+5 + Recherche ; reconversion (agent public, Bac+2) + Finances ; parent d'un lycéen + Environnement ; profil sans domaine coché (la liste complète doit rester accessible). Avant, tous niveaux confondus : 33, 88+90, 207, 55, 123, 38, 168.
- Vérifier qu'aucun domaine ne tombe à 0 ni ne dépasse ~60 avant filtre de niveau, et que le filtre de niveau et le défi continuent de s'appliquer par-dessus pour chaque profil.
- Vérifier que les concours se recentrent de la même façon (`#/concours-liste`) et que le bouton « Explorer d'autres concours » révèle bien la suite classée cercle 2 d'abord.
- Vérifier la recherche libre : elle ne passe pas par les cercles (`explorerSplit` est faux dès qu'il y a des mots cherchés), elle doit continuer à tout trouver.
- Vérifier le mode parent (textes « pour votre enfant »), le mode sombre et le mode clair sur l'Explorer : rien ne doit avoir bougé visuellement.
- Mettre à jour les assertions de `scripts/check_*.mjs` qui compteraient des métiers par domaine, si elles existent (grep `strongInterests`, `myJobs`, `splitJobs` dans `scripts/`).

### Étape 5 : publier et consigner

- Un commit pour l'export et les tags, un commit pour le branchement, un commit pour la vérification. Bump de version à chaque commit publié.
- Ajouter dans ce fichier un tableau « avant / après » par domaine, pour qu'Alexis puisse juger sur des chiffres.
- Rappeler dans le message final : la branche de sauvegarde, l'interrupteur `STRICT_DOMAINS`, et les domaines où le classement a demandé un arbitrage (par exemple où placer les métiers de la gendarmerie : Sécurité en cœur, Défense en proche).

## 6. Ce qui ne change pas

- La logique de niveau et de défi comme filtre (`defaultCats`, `passesLevelCategory`) : elle s'applique après les cercles, comme aujourd'hui. Le défi gagne en plus un rôle d'ordre (étape 3 bis).
- Les traits (« Ce qui vous ressemble ») : ils restent un critère de tri, pas de sélection.
- Les 37 domaines proposés à l'onboarding : on ne touche pas à la liste, seulement à ce qui s'y rattache.
- Le compteur jaune, le bouton « Explorer d'autres métiers », les « Afficher 60 de plus » : inchangés.

## 7. Points à arbitrer avec Alexis si besoin

- Gendarmerie et sapeurs-pompiers militaires : cœur Sécurité ou cœur Défense ? Proposition : Sécurité, avec Défense en proche.
- Faut-il montrer, sur chaque card de la liste « peuvent aussi vous intéresser », pourquoi le métier est proposé (« proche de Défense ») ? Pas prévu dans ce plan, facile à ajouter ensuite via `partialScore`.
- Le seuil de 60 métiers cœur par domaine est une cible, pas une règle : si Santé en garde 80 parce que ce sont bien 80 métiers de soin, c'est juste.

## 8. Résultat (exécuté le 30 octobre 2026)

### Métiers et concours « pour vous », avant / après

| Profil | Métiers avant | Métiers après | Concours avant | Concours après |
|---|---|---|---|---|
| 6e + Défense | 33 | 27 | 14 | 8 |
| 6e + Défense + « rapide » | 29 | 25 | 6 | 2 |
| 3e + Sécurité + Santé | 178 | 131 | 74 | 49 |
| Terminale + Administration | 207 | 79 | 40 | 16 |
| Bac+3 + Numérique + « sélectif » | 48 | 51 | 9 | 3 |
| Bac+3 + Santé | 84 | 77 | 35 | 31 |
| Bac+5 + Recherche | 120 | 82 | 7 | 8 |
| Bac+5 + Administration + « sélectif » | 161 | 61 | 21 | 9 |
| Reconversion Bac+2 + Finances | 38 | 43 | 18 | 9 |
| Parent (Première) + Environnement | 168 | 49 | 29 | 6 |
| 6e + Arts | 9 | 13 | 26 | 6 |
| Sans domaine coché | 1 134 | 1 134 | 174 | 174 |

Les domaines qui montent légèrement (Numérique, Finances, Arts) récupèrent des métiers qui leur appartiennent vraiment et qui étaient rangés ailleurs (informaticiens de la recherche, contrôleurs financiers, ateliers graphiques).

### Métiers au cœur de chaque domaine (tous niveaux confondus)

Avant (rattachement large) puis après (cœur seul) : Administration 207 → 79, Environnement 168 → 49, Technique 130 → 92, Transports 129 → 41, Recherche 123 → 84, Santé 90 → 83, Sécurité 88 → 50, Inspection 74 → 50, Culture 65 → 23, Urbanisme 65 → 30, Numérique 55 → 58, Justice 51 → 57, Défense 33 → 27.

Restent au-delà de 60 : Technique (92 : ateliers, maintenance, ouvriers du bâtiment, propreté), Recherche (84 : ingénieurs et techniciens qui font eux-mêmes de la science), Santé (83 : soignants et paramédicaux), Administration (79 : direction, pilotage, gestion administrative générale). Ce sont bien des métiers de ces domaines.

### Ce qui a été fait

- `scripts/export_domain_corpus.mjs` : export du corpus (data/work/, ignoré par git).
- `data/catalogue/domain-tags-01.json` à `-19.json` : 1 134 métiers classés à la main, cœur (1 ou 2) et proches (0 à 4). Guide de classement : data/work/GUIDE-classement.md (non publié).
- `data/catalogue/metadata.json` : `settings.domainGraph`, les domaines voisins (rendu symétrique au chargement).
- `js/catalog.js` : interrupteur `STRICT_DOMAINS` ; chaque métier reçoit `coreDomains`, `nearDomains`, `graphDomains`, `textInterests`.
- `js/app.js` :
  - `domainTier` (6 cœur, 4 proche, 3 voisin, 2 simple mention) ;
  - `partialScore` ;
  - `concoursCore` et `concoursTier` : un concours est « pour vous » si le domaine est celui de son métier historique principal ou d'au moins un quart de ses métiers ;
  - `catOrder` et le tri par catégorie selon le défi ;
  - catégorie mise en avant sur les cards et transmise à la fiche.
- `scripts/check_domain_tags.mjs` : nouveau test (chaque métier classé une fois, 1 ou 2 cœurs, domaines connus, effectifs imprimés).

### Retour arrière

- Partiel, sans toucher aux données : `var STRICT_DOMAINS = false;` en tête de `js/catalog.js` (vérifié : mêmes compteurs qu'avant sur tous les profils types).
- Complet : la branche `sauvegarde/avant-recentrage-domaines` sur GitHub.

### Arbitrages pris pendant le classement

- Gendarmerie : Sécurité en cœur, Défense en proche.
- Pompiers et sécurité civile : Secours en cœur, Sécurité en proche.
- Surveillants pénitentiaires : Justice + Sécurité.
- Éducateurs PJJ et CPIP : Justice + Social.
- Fonctions de soutien aux armées : cœur de leur fonction, Défense en proche. C'est le cas de la confection textile, du fauconnier, de la radioprotection et de la météo.
- Secrétaire médical et gestionnaires de scolarité : Administration en cœur, le secteur en proche.
- Déchets : Environnement en cœur. Eau potable et assainissement côté ouvrages : Technique en cœur.
- Prévention des risques professionnels : RH en cœur, Santé et Sécurité en proches.
- Anomalies de données repérées dans les fiches source :
  - fpenv023 a un titre qui évoque la montagne, mais sa fiche parle de bâtiment ;
  - fpmed045 (infirmier perfusionniste) a la description du puériculteur.

## 9. Ajustement du 30 octobre (soir) : proches comptés, pistes resserrées

Demande d'Alexis : les métiers proches doivent s'afficher directement et être comptés ; « peuvent aussi vous intéresser » ne doit garder que des métiers liés de plus loin, pas une tonne.

Hiérarchie appliquée :
1. Cœur : compté « pour vous », en tête.
2. Proche principal (le premier proche de chaque métier) : compté « pour vous », sous l'intertitre « N métiers aussi en lien avec … ». Administration n'est pas comptée comme proche, car elle figure dans presque tous les métiers publics. Réglage : `COUNTED_NEAR` et `UNCOUNTED_NEAR` dans `js/catalog.js`.
3. Proches secondaires, puis métiers au cœur d'un domaine voisin du domaine coché (graphe orienté `settings.domainGraph`) : « peuvent aussi vous intéresser », plafonnés à 60 métiers et 30 concours.
4. Le reste (simple mention, sans lien) n'est plus proposé dans ces listes. La recherche et le filtre restent ouverts sur tout le catalogue.

Résultat (métiers pour vous + pistes) : 6e + Défense 42 + 60 ; 3e + Sécurité + Santé 225 + 60 ; Terminale + Administration 79 + 60 ; Bac+3 + Numérique sélectif 70 + 46 ; Bac+3 + Santé 115 + 60 ; Bac+5 + Recherche 139 + 60 ; Bac+5 + Administration sélectif 61 + 60 ; Reconversion Bac+2 + Finances 72 + 60 ; Parent + Environnement 87 + 60 ; 6e + Arts 23 + 43.

## 10. Tri resserré (30 octobre, 19 h)

Constat d'Alexis : l'IPEF et le concours de chargé de recherche remontaient dans « peuvent aussi vous intéresser » pour un profil Éducation, Arts, Communication, Culture.

- Concours : le cercle se juge désormais sur l'ensemble des métiers du concours, jamais sur un seul (`concoursFar` : un domaine doit revenir chez au moins un quart de ses métiers). Avant, un seul directeur sur 6 suffisait à faire remonter l'IPEF.
- Graphe : Éducation n'a plus Recherche comme voisin (Enfance et Sport seulement).
- Métiers : le proche principal n'est compté « pour vous » que s'il est un domaine voisin du cœur du métier. Archiviste (Documentation, proche Culture) est compté. Imprimeur (Technique, proche Arts) et médecin scolaire (Santé, proche Éducation) passent dans les pistes.

Résultat, métiers pour vous + pistes, puis concours :

| Profil | Métiers | Concours |
|---|---|---|
| 6e + Défense | 35 + 60 | 10 + 26 |
| 3e + Sécurité + Santé | 180 + 60 | 53 + 30 |
| Terminale + Administration | 79 + 60 | 16 + 30 |
| Bac+3 + Santé | 91 + 60 | 32 + 22 |
| Bac+5 + Recherche | 102 + 60 | 11 + 30 |
| Parent + Environnement | 72 + 60 | 7 + 15 |
| 6e + Arts | 17 + 49 | 6 + 11 |
| Bac+5 + Éducation, Arts, Communication, Culture | 95 + 60 | 36 + 14 |
