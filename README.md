# Y-Seck — orientation dans le service public

Application mobile en HTML, CSS et JavaScript : DM Sans, bleu #000091 pour la navigation, pastilles de catégories bleu vif, bleu, vert et jaune, et fonds en dégradé radial.

## Lancer la preview

```sh
python3 -m http.server 8000
```

Ouvrir http://localhost:8000. Un serveur est nécessaire à la recherche locale de communes.

## Parcours

- Choix du profil, puis questionnaire en cinq étapes : prénom ou pseudo obligatoire, niveau d’études sur l’écran suivant, centres d’intérêt, préférences de travail, situation. Un retour permet de corriger le choix initial du profil ; l’ajout d’un enfant dans une famille existante commence directement par son prénom.
- Accueil personnel étudiant ou espace famille avec plusieurs profils enfants indépendants.
- Après modification d’un profil complété, « Valider les modifications » permet de revenir directement à l’accueil. Chaque enfant conserve sa validation en attente ; la suppression d’un enfant préserve les autres profils et laisse un espace famille vide si c’était le dernier.
- 1 069 métiers RMFP et 65 fiches d’accès existantes. Les domaines renseignés sont présélectionnés ; le bouton « Pour vous » ou « Pour votre enfant » les rétablit.
- Filtres par domaine, catégorie et versant ; à partir de Bac+5, seules les fiches associées à une catégorie B, A ou A+ sont affichées. Une catégorie variable ne constitue pas une condition de diplôme.
- 23 centres d’intérêt, dont diplomatie, renseignement, mer, architecture et protection animale. Les thèmes transversaux s’appuient sur les domaines, familles et intitulés RMFP ; les domaines principaux et les correspondances statutaires sont conservés. `node scripts/check_interests.mjs` contrôle la couverture de chaque thème.
- Fiches métiers, activités et compétences du répertoire, voies d’accès sourcées, dates de concours et favoris par profil.
- Pages « Se préparer » adaptées au métier : catégories retenues, versants, dates disponibles, études, aides documentaires et prépas. Les métiers à catégorie variable ont aussi leur page personnelle ; les catégories encore indéterminées restent explicitement à préciser. Les emplois contractuels identifiés portent la pastille CDD et leur propre parcours sans concours. La navigation principale comporte Accueil, Métiers, Favoris et Profil.
- Prépas Talents triées par distance à la commune renseignée, parmi les résultats du filtre choisi. Distances indicatives à vol d’oiseau entre centres de communes ; formations à distance en dernier.
- Les mises à jour sont signalées au retour dans un ancien onglet. Le bouton « Actualiser » renouvelle le document et conserve la fiche consultée et les réponses enregistrées ; aucune actualisation automatique pendant le parcours ou la saisie.
- Contraste renforcé, texte agrandi et police OpenDyslexic facultatifs. La conformité RGAA reste à évaluer par un audit complet.

## Base éditoriale et maintenance

`data/catalogue.json` est l’index de la base de référence, répartie dans `data/catalogue/`. `js/catalog-data.js` charge ces données pour le navigateur. Le répertoire RMFP décrit des fonctions, pas une équivalence unique avec un grade ou un concours. Les correspondances portent donc un statut `proposé`, `validé` ou `rejeté`. Les fonctions sans correspondance documentée restent consultables, avec un renvoi aux portails officiels.

Le classeur interne comporte douze onglets : Pilotage, Metiers, Contenus, CorpsGrades, Epreuves, Correspondances, Concours, Preparations, Ouvrages, Ressources, Sources et Reglages. Il contient uniquement des données éditoriales publiques, aucun profil utilisateur.

L’onglet Epreuves conserve le nom du concours, sa structure organisatrice, les lieux en métropole et en outre-mer, avec la source et la date de vérification, pour chaque corps et versant. Le titre du bloc et les liens directs aux écoles ou administrations organisatrices sont modifiables ; chaque lien s’écrit `libellé | URL`, un par ligne. Les cinq IRA, l’INSP et l’INET ont leurs propres liens officiels. Une ville de formation ou une localisation d’emploi n’est pas un centre d’épreuves. Une information non publiée reste explicitement à confirmer dans l’avis. Les lieux renseignés pour 2026 ne valent pas confirmation pour une autre session.

Une date affichée sur une fiche métier doit partager le corps, le versant et la catégorie du métier. Une session reste à venir tant qu’une date d’inscription ou d’épreuve publiée n’est pas passée, même si les candidatures sont closes. Les concours externes sont affichés avant les autres voies, puis par date de clôture. Le rapprochement INSP ne reconnaît pas le début du mot « inspecteur ». Les conservateurs du patrimoine, les conservateurs des bibliothèques et la magistrature administrative ont des voies distinctes. Les doublons identifiés sont conservés dans la base avec `duplicateOf`, puis exclus du calendrier affiché.

Pour les métiers à catégorie variable, les pastilles montrent les catégories observées dont le nombre d’offres atteint au moins la moitié de la catégorie la plus représentée. Sans effectifs, les catégories observées sont conservées ; à défaut, les correspondances de corps validées sont utilisées, puis les pistes proposées, comme indications à confirmer. Une seule catégorie utilise la taille normale ; plusieurs utilisent de petites pastilles. Les catégories retenues servent aussi au filtrage, aux concours, à l’orientation et aux ressources personnalisées. Les catégories marginales restent consultables dans les détails. La catégorie source et le statut contractuel ne sont pas modifiés. L’export crée aussi un classeur séparé des métiers encore indéterminés, à compléter par l’équipe.

L’onglet Ouvrages permet d’actualiser les titres, auteur·rice·s, thématiques et notices. Les couvertures extraites du PDF sont conservées par identifiant ; une URL HTTPS peut les remplacer. L’import des anciens classeurs sans cet onglet conserve la bibliographie.

Les colonnes Catégories, Versants et Corps IDs limitent les ouvrages aux concours concernés. La sélection Vie-publique ajoutée en octobre 2026 reste réservée à A ; elle ne complète pas A+. Les éditions déjà présentes sont regroupées dans la vue A sans supprimer leur notice INSP d’origine.

L’onglet Ressources contient les sujets, rapports, meilleures copies, entraînements, bibliographies et annuaires officiels. Chaque lien conserve son identifiant, sa session lorsqu’elle est publiée, sa page source, son organisme et ses Corps IDs. `document` désigne une référence individuelle ; `directory` donne accès à une collection complète. Les liens aux concours réutilisent les identifiants de CorpsGrades, indépendamment des correspondances métier/grade existantes. Les anciennes copies sans onglet Ressources conservent l’index courant.

Les sources comprennent l’annuaire DGAFP et les ministères, l’INSP, l’ENM, la gendarmerie, les CDG Auvergne-Rhône-Alpes, le CNFPT/INET, le CNG, l’EHESP et l’AP-HP. L’index couvre les catégories A+, A, B, C et les trois versants ; il ne constitue pas une copie exhaustive des archives de tous les organisateurs. Les annuaires restent accessibles pour les autres sessions et spécialités. Une absence de sujet indexé ne signifie pas qu’aucun concours ou document n’existe ; certains recrutements sur titres ne comportent pas de sujet écrit. Les bibliographies sont indicatives et leur édition doit être rapprochée du programme en vigueur.

`node scripts/check_preparation.mjs` contrôle les parcours métiers, la séparation CDD/VAR, les catégories et versants des ressources, les filtres et la séparation des bibliographies A/A+.

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
- SCORE : 178 avis ; ARS : 468 avis ; CNFPT : 8 concours et examens prévisionnels 2027, complétés par les voies séparées et les 8 concours INSP 2027. Les sites des écoles et administrations ont été consultés le 17 octobre 2026 ; les avis des organisateurs font référence.
- Prépas Talents, IPAG/CPAG, Onisep, Devenir enseignant, INSP et Service-Public : liens accessibles dans les écrans et les sources.
- La bibliographie INSP concerne ses concours d’entrée ; certaines thématiques peuvent aider à préparer d’autres concours A selon leur programme.
- Le jeu public de communes de l’API Découpage administratif est fourni localement dans `data/communes.json`. La recherche n’envoie aucune commune saisie à une API externe.

## Données personnelles

Aucun compte ni mesure d’audience. Pseudo, réponses, profils enfants, commune et favoris restent dans le stockage du navigateur. L’effacement est disponible dans le profil. Les polices DM Sans et OpenDyslexic sont hébergées dans le dépôt sous licence OFL.

Les coordonnées de l’éditeur et du contact restent à compléter dans les réglages avant une diffusion officielle.
