# Brief de recherche : concours de la fonction publique (application Y-Seck)

Y-Seck est une application web qui aide des jeunes (collège, lycée, études supérieures) et des adultes en reconversion à découvrir les métiers et les concours de la fonction publique française (État, territoriale, hospitalière). Chaque concours y a une fiche : frise des étapes, conditions, épreuves, dates des prochaines sessions, métiers accessibles. Nous ajoutons un bouton « Information » qui affichera une description du concours.

Ta mission : pour chaque concours de ton lot (fichier JSON indiqué dans ta consigne), lire les pages officielles et chercher sur le web, puis produire une fiche structurée et sourcée.

## Méthode
1. Ouvre d'abord `officialUrl` et les `sessionLinks` du lot (WebFetch). Puis cherche sur le web (WebSearch, mode "standard" d'abord, "extended" si le résultat est mince ou daté) : « <nom du concours> 2027 inscription », « <nom> arrêté d'ouverture 2027 », « <nom> calendrier 2026 2027 », « <nom> épreuves conditions ».
2. Sources à privilégier : sites officiels (gouv.fr, écoles de service public, CNFPT, centres de gestion, concours-territorial.fr, CNG, ARS, concours-fph.ars.sante.fr, Legifrance pour les arrêtés). Les sites privés de préparation ne servent qu'à orienter la recherche, jamais comme source finale d'une date.
3. Reste dans un budget raisonnable : au plus 6 à 8 lectures de pages par concours. Si une information est introuvable, mets `null` et explique dans `notes`. N'invente jamais une date ni un chiffre.
4. Dates : au format ISO `AAAA-MM-JJ`. Si la source ne donne qu'un mois (« écrits en mars 2027 »), mets le premier jour du mois en ISO et garde le libellé exact dans le champ `...Label`, avec `"provisional": true`.
5. Les sessions recherchées : celles encore ouvertes ou à venir en 2026, et celles de 2027. Une entrée par voie (externe, interne, troisième concours…) quand les dates diffèrent ; sinon une seule entrée avec `"voie": "Toutes les voies"`.
6. Description : 3 à 6 phrases en français simple, pour un lecteur de 15 à 25 ans. Dis ce qu'est le concours, à quoi il donne accès (corps, école de formation, lieu, durée et statut pendant la formation, rémunération pendant la formation si tu la trouves), ce qu'on fait ensuite. Pas de jargon non expliqué, pas de tiret cadratin « — », pas de liste à puces.
7. Dissocie bien le concours (une épreuve de recrutement vers un corps ou une école) des métiers (ce qu'on exerce ensuite). Le champ `metiers` liste les fonctions exercées après le concours.
8. Réponds en français. Fichier de sortie : écris le JSON complet (un tableau d'objets, un par concours du lot, dans l'ordre du lot) avec l'outil Write au chemin indiqué dans ta consigne. Vérifie que le JSON est valide (`node -e "JSON.parse(require('fs').readFileSync('<chemin>','utf8'))"`).
9. Ton message final tient en 5 lignes au maximum : chemin du fichier, nombre de fiches, nombre de concours avec au moins une date 2026/2027 trouvée, références avec `confidence` faible, et un point notable éventuel. Ne recopie pas le contenu du fichier dans ta réponse.

## Schéma d'une fiche (tous les champs présents ; `null` quand inconnu)
```json
{
  "ref": "É-001",
  "name": "Intitulé officiel court, au masculin puis au féminin quand il existe (ex. « Inspecteur - Inspectrice des douanes »)",
  "school": "École ou organisme de formation après le concours, avec sigle et ville (ex. « École nationale de la magistrature (ENM), Bordeaux »), ou null",
  "organizer": "Organisateur du concours (ministère, CNFPT, centre de gestion, CNG, établissement…)",
  "cat": "A+ | A | B | C",
  "fp": "E | T | H  (État, territoriale, hospitalière ; pour les militaires et les organismes hors fonction publique, mets E et précise dans notes)",
  "description": "3 à 6 phrases (voir méthode, point 6).",
  "voies": "Voies d'accès, séparées par des virgules (ex. « Externe, interne, troisième concours »).",
  "condition": "Conditions d'accès résumées : diplôme ou niveau, âge, nationalité, expérience par voie si différent. Une ou deux phrases.",
  "epreuves": "Épreuves d'admissibilité puis d'admission, résumées en une ou deux phrases.",
  "metiers": "Métiers ou fonctions exercés après le concours, séparés par « ; ».",
  "domain": "Domaine principal (ex. Justice, Sécurité, Santé, Administration, Culture, Environnement, Transports, Défense, Éducation, Finances, Diplomatie, Numérique, Social).",
  "officialUrl": "Page officielle de référence du concours.",
  "trainingMonths": 24,
  "paidTraining": "Oui, rémunéré en tant qu'élève fonctionnaire | Non | null",
  "places": "Nombre de postes offerts à la dernière session connue, avec l'année (ex. « 120 postes en 2026 »), ou null",
  "sessions": [
    {
      "session": "2027",
      "voie": "Concours externe",
      "open": "2026-12-01", "openLabel": "1er décembre 2026",
      "close": "2027-01-15", "closeLabel": "15 janvier 2027 à 17h",
      "written": "2027-03-10", "writtenLabel": "10 et 11 mars 2027",
      "oral": "2027-06-01", "oralLabel": "juin 2027",
      "results": "2027-07-05", "resultsLabel": "5 juillet 2027",
      "url": "URL exacte de la page où ces dates figurent",
      "provisional": false,
      "employer": "Organisateur"
    }
  ],
  "expected": "Si aucune date n'est publiée : période habituelle attendue et sur quelle base (ex. « Inscriptions attendues en février 2027, comme chaque année selon le calendrier du CNFPT »), sinon null",
  "annalesUrl": "URL des sujets ou rapports de jury, ou null",
  "evolution": "Vers quel corps ou concours on peut évoluer ensuite (ex. « Concours interne de directeur des services de greffe après 4 ans »), ou null",
  "checked": "2026-10-21",
  "sources": ["URL 1", "URL 2"],
  "confidence": "haute | moyenne | faible",
  "notes": "Doutes, écarts entre sources, réformes en cours, précisions utiles."
}
```

Pour les lots de nouveaux concours (`ref` commençant par `NEW-`), les champs `hints` du lot donnent le nom pressenti, l'école et les questions à trancher ; vérifie l'intitulé exact du corps, la catégorie et le versant.
