# Brief de recherche : concours des fiches métiers qui n’en ont pas (application Y-Seck)

Y-Seck aide des jeunes (collège, lycée, études supérieures) et des adultes en reconversion à découvrir les métiers et les concours de la fonction publique française (État, territoriale, hospitalière). Chaque fiche métier doit montrer le ou les concours qui y mènent. 57 fiches n’en affichent aucun : elles portent seulement une note générale, parfois fausse ou vague (« Corps ou recrutement spécifique, absent pour l’instant de l’application »), avec un lien vers choisirleservicepublic.gouv.fr que nous voulons supprimer.

Ta mission : pour chaque métier de ton lot, trouver sur les sites officiels le ou les concours (ou recrutements statutaires) qui y mènent réellement, et produire une fiche structurée et sourcée par concours. Quand un métier ne s’exerce vraiment que sur contrat ou par engagement, sans aucun concours, le dire avec une explication précise et un lien officiel direct.

## Accès et méthode
- L’accès web est complet : WebSearch, WebFetch (s’il échoue, utilise `curl -sL -A "Mozilla/5.0"` via Bash). Certains sites bloquent les robots (Légifrance, education.gouv.fr, economie.gouv.fr) : passe alors par une autre source officielle (Journal officiel reproduit, site de l’école, du ministère, du CNG, du CNFPT, d’un centre de gestion, d’une ARS, concours-fph.ars.sante.fr).
- Sources finales : sites officiels uniquement (gouv.fr, écoles, CNFPT, centres de gestion, CNG, ARS, établissements publics). Les sites privés de préparation peuvent orienter la recherche, jamais servir de source d’une date ou d’une condition.
- Budget : 6 à 10 lectures de pages par concours. N’invente jamais une date, un chiffre ni un corps : `null` et explication dans `notes`.
- Fichiers de référence (lis-les avant de créer un concours) :
  - `reference-concours.json` : les 104 concours déjà dans l’application. Si un concours existant convient, ne le recrée pas : indique-le dans `existingConcours` du métier (voir plus bas).
  - `reference-routes.json` : les corps (routes) déjà connus, avec leur catégorie (`cat`), leur versant (`fp` : E, T, H) et leur niveau (`lvl` : 0 sans diplôme, 2 bac, 3 bac+2, 4 bac+3, 5 bac+5, 6 doctorat). Réutilise un corps existant quand c’est le bon (même corps, même catégorie, même versant).
- Le lot (`lots/lot-<Sx>.json`) donne pour chaque métier : id, intitulé, domaine, famille, catégories et versants affichés par l’application, description, activités et la note actuelle.

## Règles de cohérence (importantes)
- La catégorie du concours doit être l’une des catégories affichées pour le métier (`categories` du lot) et son versant l’un des versants du métier (`versants`), sinon le concours ne s’affichera pas sur la fiche. Si le vrai corps est d’une autre catégorie que celles du lot, signale-le dans `notes` et propose quand même le concours.
- Un concours par corps et par versant. Un même concours peut servir plusieurs métiers (liste `jobs`).
- Militaires : versant E ; précise le statut militaire dans la description. Hors fonction publique (Assurance maladie, EPIC sur contrat de droit privé) : ne crée pas de concours de la fonction publique ; utilise `noConcours`.

## Fichier de sortie : `out/<Sx>.json`
Un objet JSON avec deux tableaux :

```json
{
  "concours": [
    {
      "ref": "NEW2-identifiant-court",
      "jobs": ["fpmed028", "fpmed036"],
      "route": { "existing": "id-de-route" },
      "name": "Intitulé du corps ou du concours, au masculin puis au féminin (ex. « Praticien - Praticienne hospitalier »)",
      "school": "École ou formation après le concours (avec sigle et ville), ou null",
      "organizer": "Organisateur (CNG, CNFPT, centre de gestion, ministère, établissement…)",
      "cat": "A+ | A | B | C",
      "fp": "E | T | H",
      "description": "3 à 6 phrases en français simple pour un lecteur de 15 à 25 ans : ce qu’est le concours, à quoi il donne accès, la formation ou le stage, le statut et la rémunération pendant la formation si connus, ce qu’on fait ensuite. Pas de jargon non expliqué, pas de tiret cadratin, pas de liste.",
      "voies": "Voies d’accès séparées par des virgules.",
      "condition": "Conditions par voie, chaque voie annoncée par son intitulé suivi de « : » (ex. « Externe : … ; Interne : … »).",
      "epreuves": "Épreuves, chaque phase annoncée par son intitulé suivi de « : » (ex. « Admissibilité : … Admission : … »), ou « Concours sur titres : … » quand il n’y a que l’examen du dossier.",
      "metiers": "Métiers ou fonctions exercés ensuite, séparés par « ; ».",
      "domain": "Domaine principal (Santé, Culture, Enseignement, Justice, Sécurité, Défense, Transports…).",
      "officialUrl": "Page officielle la plus directe du concours ou du recrutement.",
      "trainingMonths": 12,
      "paidTraining": "Oui, rémunéré … | Non | null",
      "places": "Postes de la dernière session connue avec l’année, ou null",
      "sessions": [
        { "session": "2027", "voie": "Concours externe", "open": "AAAA-MM-JJ", "openLabel": "…", "close": "AAAA-MM-JJ", "closeLabel": "…",
          "written": "AAAA-MM-JJ", "writtenLabel": "…", "oral": "AAAA-MM-JJ", "oralLabel": "…", "results": null, "resultsLabel": "",
          "url": "page exacte des dates", "provisional": false, "employer": "Organisateur" }
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
  "jobs": [
    { "jobId": "fpmed028", "existingConcours": ["H-047"], "explanation": null }
  ],
  "noConcours": [
    { "jobId": "fpens034", "text": "Explication précise en une ou deux phrases du vrai mode de recrutement (contrat, engagement, recrutement direct…), sans renvoyer vers un site généraliste.", "url": "https://page-officielle-directe", "label": "Libellé du lien" }
  ]
}
```

- `route` : `{ "existing": "id" }` si un corps de `reference-routes.json` convient, sinon `{ "new": { "id": "identifiant-court", "name": "Intitulé masculin - féminin", "cat": "A", "lvl": 4, "fp": "H" } }`.
- `jobs` (tableau de premier niveau) : une ligne par métier du lot qui doit afficher un concours déjà présent dans l’application (`existingConcours`, ids de `reference-concours.json`). Les métiers rattachés à un nouveau concours sont déjà listés dans son `jobs`.
- Chaque métier du lot doit apparaître soit dans au moins un `concours[].jobs`, soit dans `jobs[].existingConcours`, soit dans `noConcours`.
- Dates au format ISO ; si seul le mois est connu, premier jour du mois et `provisional: true`. Une date n’est `provisional: false` que si elle est lue sur une page ou un texte officiel. Sessions recherchées : celles encore ouvertes ou à venir en 2026, et celles de 2027. Pour un concours sur titres organisé par chaque établissement (hôpitaux), donne un ou deux avis réellement ouverts trouvés sur concours-fph.ars.sante.fr ou le site d’un établissement, en précisant l’établissement dans `voie`.
- Écris le JSON avec l’outil Write, puis vérifie qu’il est valide : `node -e "JSON.parse(require('fs').readFileSync('<chemin>','utf8'))"`.
- Réponds en 5 lignes au maximum : chemin du fichier, nombre de concours créés, nombre de métiers rattachés à un concours (nouveau ou existant), nombre de métiers sans concours et pourquoi, point notable.
