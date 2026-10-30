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

- La logique de niveau et de défi (`defaultCats`, `passesLevelCategory`) : elle s'applique après les cercles, comme aujourd'hui.
- Les traits (« Ce qui vous ressemble ») : ils restent un critère de tri, pas de sélection.
- Les 37 domaines proposés à l'onboarding : on ne touche pas à la liste, seulement à ce qui s'y rattache.
- Le compteur jaune, le bouton « Explorer d'autres métiers », les « Afficher 60 de plus » : inchangés.

## 7. Points à arbitrer avec Alexis si besoin

- Gendarmerie et sapeurs-pompiers militaires : cœur Sécurité ou cœur Défense ? Proposition : Sécurité, avec Défense en proche.
- Faut-il montrer, sur chaque card de la liste « peuvent aussi vous intéresser », pourquoi le métier est proposé (« proche de Défense ») ? Pas prévu dans ce plan, facile à ajouter ensuite via `partialScore`.
- Le seuil de 60 métiers cœur par domaine est une cible, pas une règle : si Santé en garde 80 parce que ce sont bien 80 métiers de soin, c'est juste.
