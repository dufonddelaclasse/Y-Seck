# Brief de recherche : fiches concours des corps affichés sans fiche (application Y-Seck)

Y-Seck aide des jeunes (collège, lycée, études supérieures) et des adultes en reconversion à découvrir les métiers et les concours de la fonction publique française (État, territoriale, hospitalière). Chaque fiche métier montre le ou les concours qui y mènent. Pour 57 corps (ou cadres d’emplois) reliés à des fiches métiers, l’application n’a pas de fiche concours : elle affiche une carte « Concours : nom du corps » avec seulement le versant, le niveau requis et un lien, sans description, sans dates ni épreuves. 157 fiches métiers n’affichent que ce type de carte (exemple : « Ingénieur - Ingénieure d’études », 44 fiches).

Ta mission (lots C1 à C3) : pour chaque corps de ton lot, trouver sur les sites officiels le concours (ou recrutement statutaire) qui y donne accès et produire une fiche structurée et sourcée. Trois cas possibles :
1. Le corps a son propre concours : fiche complète (`concours`).
2. Le corps est en réalité le même qu’un concours déjà présent dans l’application (doublon d’intitulé, affectation locale ou nationale d’un même corps, grade d’un même cadre d’emplois) : ne crée rien, indique le ou les concours existants (`attach`).
3. Aucun concours n’existe vraiment pour ce corps (recrutement par détachement, liste d’aptitude, emploi fonctionnel…) : explication précise et lien officiel direct (`noConcours`).

## Accès et méthode
- L’accès web est complet : WebSearch, WebFetch (s’il échoue, `curl -sL -A "Mozilla/5.0"` via Bash). Si un site bloque les robots (Légifrance, education.gouv.fr, interieur.gouv.fr), passe par une autre source officielle (données ouvertes du Journal officiel, site de l’école, du ministère, d’une université, du CNRS ou de l’Inserm, du CNG, d’un centre de gestion, d’une ARS, concours-fph.ars.sante.fr, calendrier de fonction-publique.gouv.fr).
- Sources finales : sites officiels uniquement. Jamais choisirleservicepublic.gouv.fr ni une page d’accueil générale comme lien d’une fiche. Les sites privés de préparation peuvent orienter, jamais servir de source.
- Budget : 6 à 10 lectures de pages par corps. N’invente jamais une date, un chiffre ni un corps : `null` et explication dans `notes`.
- Fichiers de référence (à lire d’abord) : `reference-concours.json` (les 126 concours de l’application, avec leurs `routeIds`) et `reference-routes.json` (tous les corps, avec `hasConcours`).
- Le lot (`lots/lot-<Cx>.json`) donne pour chaque corps : `routeId`, intitulé, catégorie, versants, niveau (`lvl` : 0 sans diplôme, 2 bac, 3 bac+2, 4 bac+3, 5 bac+5, 6 doctorat, ou null), lien actuel, nombre de fiches métiers reliées et jusqu’à 12 de ces fiches (les premières n’ont pas d’autre concours).

## Repères utiles
- Corps de l’enseignement supérieur et de la recherche (ingénieur d’études, ingénieur de recherche, assistant ingénieur, technicien et adjoint technique de recherche et de formation, ITRF) : concours organisés par les universités et le ministère par branche d’activité professionnelle (BAP), et concours propres des organismes de recherche (CNRS, Inserm, INRAE…). Donne le calendrier national de la session 2027 si publié, sinon la période habituelle.
- Corps hospitaliers (ingénieur hospitalier, sage-femme, kinésithérapeute, orthophoniste, préparateur en pharmacie, technicien de laboratoire…) : concours sur titres organisés par chaque établissement ; donne un ou deux avis réellement ouverts trouvés sur concours-fph.ars.sante.fr ou le site d’un hôpital, en précisant l’établissement dans `voie`.
- Cadres d’emplois territoriaux : concours des centres de gestion ou du CNFPT, calendrier national sur concours-territorial.fr (page du concours, pas l’accueil).

## Règles de cohérence
- Un concours par corps et par versant. La catégorie du concours est celle du corps (`cat` du lot) et son versant l’un des versants du corps, sinon il ne s’affichera pas.
- Militaires : versant E, statut militaire précisé dans la description.

## Fichier de sortie : `out/<Cx>.json`
```json
{
  "concours": [
    {
      "ref": "CORPS-identifiant-court",
      "route": { "existing": "routeId du lot" },
      "lvl": 4,
      "jobs": ["fprch017"],
      "name": "Intitulé du concours, au masculin puis au féminin (ex. « Ingénieur - Ingénieure d’études »)",
      "school": "École ou formation après le concours, ou null s’il n’y en a pas",
      "organizer": "Organisateur",
      "cat": "A+ | A | B | C",
      "fp": "E | T | H",
      "description": "3 à 6 phrases en français simple pour un lecteur de 15 à 25 ans : ce qu’est le concours, à quoi il donne accès, la formation éventuelle, le statut, ce qu’on fait ensuite. Pas de jargon non expliqué, pas de tiret cadratin, pas de liste.",
      "voies": "Voies d’accès séparées par des virgules.",
      "condition": "Conditions par voie, chaque voie annoncée par son intitulé suivi de « : » (ex. « Externe : … ; Interne : … »).",
      "epreuves": "Épreuves, chaque phase annoncée par son intitulé suivi de « : » (ex. « Admissibilité : … Admission : … »), ou « Concours sur titres : … ».",
      "metiers": "Métiers ou fonctions exercés ensuite, séparés par « ; ».",
      "domain": "Domaine principal (Recherche, Santé, Technique, Enseignement, Culture…).",
      "officialUrl": "Page officielle la plus directe du concours.",
      "trainingMonths": null,
      "paidTraining": "Oui, rémunéré … | Non | null",
      "places": "Postes de la dernière session connue avec l’année, ou null",
      "sessions": [
        { "session": "2027", "voie": "Concours externe", "open": "AAAA-MM-JJ", "openLabel": "…", "close": "AAAA-MM-JJ", "closeLabel": "…",
          "written": "AAAA-MM-JJ", "writtenLabel": "…", "oral": "AAAA-MM-JJ", "oralLabel": "…", "url": "page exacte des dates", "provisional": false, "employer": "Organisateur" }
      ],
      "expected": "Période habituelle attendue si aucune date n’est publiée, sur quelle base ; sinon null",
      "annalesUrl": "URL officielle des sujets ou rapports de jury, ou null",
      "evolution": "Évolution possible ensuite, ou null",
      "checked": "2026-10-22",
      "sources": ["URL réellement consultées"],
      "confidence": "haute | moyenne | faible",
      "notes": "Doutes, écarts, précisions (jamais affiché dans l’application)."
    }
  ],
  "attach": [
    { "routeId": "corps-78bc2eb29931", "concours": ["É-017"], "explanation": "Même corps que le concours existant : …" }
  ],
  "noConcours": [
    { "routeId": "…", "text": "Explication précise en une ou deux phrases du vrai mode d’accès, sans renvoyer vers un site généraliste.", "url": "https://page-officielle-directe", "label": "Libellé du lien" }
  ]
}
```
- `jobs` : fiches du lot qui doivent afficher ce concours (elles sont déjà reliées au corps : ne liste que celles qui correspondent vraiment à ce concours ; laisse vide si toutes conviennent).
- Chaque corps du lot doit apparaître une fois : dans `concours` (par son `route.existing`), dans `attach` ou dans `noConcours`.
- Dates au format ISO ; si seul le mois est connu, premier jour du mois et `provisional: true`. Une date n’est `provisional: false` que si elle est lue sur une page ou un texte officiel. Sessions recherchées : encore ouvertes ou à venir en 2026, et 2027.
- Écris le JSON avec l’outil Write, puis vérifie qu’il est valide : `node -e "JSON.parse(require('fs').readFileSync('<chemin>','utf8'))"`.
- Réponds en 5 lignes au maximum : chemin du fichier, nombre de fiches créées, nombre de corps rattachés à un concours existant, nombre sans concours et pourquoi, point notable.

## Lot C4 : compléter les fiches existantes
Pour chaque concours de `lots/lot-C4.json`, complète uniquement les champs listés dans `missing` :
- `school` : école ou formation suivie après le concours (avec sigle et ville), ou `null` s’il n’y en a pas (prise de poste directe), en le disant dans `notes`.
- `trainingMonths` : durée de cette formation en mois (nombre), ou `null`.
- `paidTraining` : « Oui, rémunéré en tant que … (montant si publié) », « Non » ou `null`.

Sortie `out/C4.json` : `{ "updates": [ { "id": "É-014", "school": …, "trainingMonths": …, "paidTraining": …, "sources": ["…"], "confidence": "haute | moyenne | faible", "notes": "…" } ] }` (ne mets que les champs de `missing`, plus `sources`, `confidence` et `notes`). Mêmes règles de sources : officielles uniquement, jamais de valeur inventée.
