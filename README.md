# Y-Seck — orientation dans le service public

Application mobile en HTML, CSS et JavaScript. La charte existante est conservée : DM Sans, bleu #000091 et pastilles menthe, cyan et jaune.

## Lancer la preview

```sh
python3 -m http.server 8000
```

Ouvrir http://localhost:8000. Un serveur est nécessaire à la recherche locale de communes.

## Parcours

- Questionnaire initial en quatre étapes, puis accueil personnel étudiant ou espace famille avec plusieurs profils enfants indépendants.
- 1 069 métiers RMFP et 65 fiches d’accès existantes. Les domaines renseignés sont présélectionnés ; le bouton « Pour vous » ou « Pour votre enfant » les rétablit.
- Filtres par domaine, catégorie et versant ; à partir de Bac+5, seules les fiches associées à une catégorie B, A ou A+ sont affichées. Une catégorie variable ne constitue pas une condition de diplôme.
- Fiches métiers, activités et compétences du répertoire, voies d’accès sourcées, dates de concours et favoris par profil.
- Espace commun « Concours et prépas », bibliographie INSP, annales enseignantes, parcours d’études, voies sans concours et informations handicap.
- Prépas Talents triées par distance à la commune renseignée, parmi les résultats du filtre choisi. Distances indicatives à vol d’oiseau entre centres de communes ; formations à distance en dernier.
- Contraste renforcé, texte agrandi et police OpenDyslexic facultatifs. La conformité RGAA reste à évaluer par un audit complet.

## Base éditoriale et maintenance

`data/catalogue.json` est l’index de la base de référence, répartie dans `data/catalogue/`. `js/catalog-data.js` charge ces données pour le navigateur. Le répertoire RMFP décrit des fonctions, pas une équivalence unique avec un grade ou un concours. Les correspondances portent donc un statut `proposé`, `validé` ou `rejeté`. Les fonctions sans correspondance documentée restent consultables, avec un renvoi aux portails officiels.

Le classeur interne comporte dix onglets : Pilotage, Metiers, Contenus, CorpsGrades, Correspondances, Concours, Preparations, Ouvrages, Sources et Reglages. Il contient uniquement des données éditoriales publiques, aucun profil utilisateur.

L’onglet Ouvrages permet d’actualiser les titres, auteur·rice·s, thématiques et notices. Les couvertures extraites du PDF sont conservées par identifiant ; une URL HTTPS peut les remplacer. L’import des anciens classeurs sans cet onglet conserve la bibliographie.

### Importer un classeur

Avec Python 3 et les dépendances de `scripts/requirements.txt` :

```sh
python3 scripts/import_workbook.py /chemin/Y-Seck_base_interne.xlsx --check
python3 scripts/import_workbook.py /chemin/Y-Seck_base_interne.xlsx
```

Le contrôle vérifie les identifiants, les références, les catégories, les sources et les dates. Les lignes absentes sont conservées ; pour masquer un métier, utiliser `Actif = FALSE`, et pour écarter un rapprochement, `rejeté`. Un lien validé n’est pas rétrogradé par une ancienne copie du classeur. Une copie plus ancienne qu’un avis déjà actualisé est refusée. L’import crée une sauvegarde locale sous `work/backups/`.

### Actualiser les calendriers officiels

```sh
python3 scripts/update_calendars.py --check
python3 scripts/update_calendars.py
```

Le premier appel contrôle la collecte ; le second actualise SCORE et ARS. Les identifiants, correspondances manuelles et anciens avis sont conservés. Les nouveaux avis sont rattachés aux corps connus quand une règle correspond. Les rapprochements métiers supplémentaires restent à vérifier. Le calendrier territorial 2027 du CNFPT est prévisionnel et reste une source à actualiser séparément.

Après une actualisation automatique, réexporter un nouveau classeur avant de reprendre les modifications dans Excel. Le script `scripts/export_workbook.mjs` utilise le runtime tableur fourni dans Codex (`@oai/artifact-tool`) :

```sh
node scripts/export_workbook.mjs /chemin/Y-Seck_base_interne.xlsx
```

Pour la mise en ligne, vérifier la preview puis publier le dossier `data/` complet. Le classeur interne n’est pas publié avec le site.

## Sources et limites

- Répertoire commun des métiers de la fonction publique, version 1 fournie, avec intitulés inclusifs et contenu source conservé.
- Offres Choisir le service public : catégories agrégées par intitulé exact, sans déduction automatique du diplôme ou d’une équivalence statutaire.
- SCORE : 178 avis ; ARS : 468 avis ; CNFPT : 8 concours et examens prévisionnels 2027. Photographie vérifiée le 16 octobre 2026 ; les avis des organisateurs font référence.
- Prépas Talents, IPAG/CPAG, Onisep, Devenir enseignant, INSP et Service-Public : liens accessibles dans les écrans et les sources.
- La bibliographie INSP concerne ses concours d’entrée ; certaines thématiques peuvent aider à préparer d’autres concours A selon leur programme.
- Le jeu public de communes de l’API Découpage administratif est fourni localement dans `data/communes.json`. La recherche n’envoie aucune commune saisie à une API externe.

## Données personnelles

Aucun compte ni mesure d’audience. Pseudo, réponses, profils enfants, commune et favoris restent dans le stockage du navigateur. L’effacement est disponible dans le profil. Les polices DM Sans et OpenDyslexic sont hébergées dans le dépôt sous licence OFL.

Les coordonnées de l’éditeur et du contact restent à compléter dans les réglages avant une diffusion officielle.
