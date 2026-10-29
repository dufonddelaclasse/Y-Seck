/* Données du POC.
   Sources : fonction-publique.gouv.fr (calendrier, Prépas Talents, IPAG-CPAG, recrutements sans concours),
   cned.fr (centres de gestion d'outre-mer), répertoires métiers (RMFP, CNFPT, santé) pour les intitulés.
   Consultées le 15/10/2026. À brancher plus tard sur des sources maintenues. */

(function () {
  /* ---------- Traits : « Votre façon de travailler » ---------- */
  var traitGroups = [
    { title: 'Avec qui', items: [
      ['equipe', 'En équipe'], ['seul', 'Plutôt seul·e'], ['enfants', 'Avec des enfants'],
      ['vulnerables', 'Avec des personnes vulnérables'], ['accueil', 'Au contact du public'], ['manager', 'Diriger une équipe']] },
    { title: 'Où', items: [
      ['dehors', 'Dehors'], ['dedans', 'À l’intérieur'], ['teletravail', 'En télétravail, en partie'],
      ['mobilite', 'En bougeant, en voyageant'], ['conduire', 'En conduisant']] },
    { title: 'Comment', items: [
      ['manuel', 'Travail manuel'], ['intellect', 'Travail intellectuel'], ['charges', 'Effort physique, port de charges'],
      ['horaires', 'Horaires décalés, de nuit'], ['uniforme', 'En uniforme, avec des règles'], ['sport', 'En faisant du sport']] },
    { title: 'Ce qui vous plaît', items: [
      ['creer', 'Créer'], ['cuisine', 'Cuisiner'], ['numerique', 'Le numérique'], ['chiffres', 'Les chiffres'],
      ['ecrire', 'Écrire, rédiger'], ['droit', 'Le droit, les règles'], ['sciences', 'Les sciences'],
      ['nature', 'La nature, les animaux'], ['langues', 'Les langues'], ['aider', 'Aider les autres']] },
    { title: 'Votre caractère', items: [
      ['organise', 'Organisé·e'], ['meticuleux', 'Méticuleux·se'], ['public_parler', 'À l’aise pour parler en public'],
      ['reserve', 'Plutôt réservé·e'], ['sangfroid', 'Sang-froid'], ['souplesse', 'Souple, adaptable'],
      ['pragmatique', 'Pragmatique'], ['agile', 'Agile, touche-à-tout']] }
  ];

  /* ---------- Métiers ----------
     fp : E (État), T (territoriale), H (hospitalière)
     cat : A+, A, B, C, X (contrat)
     lvl : diplôme demandé, 0 sans diplôme, 1 brevet ou CAP, 2 bac, 3 bac+2, 4 bac+3, 5 bac+5, 6 doctorat
     steps : une étape commençant par « * » est l'étape du concours (lien « Prochaines dates »)
     prep : libellé du concours tel qu'il apparaît dans la liste des Prépas Talents
     cal : mot-clé pour le calendrier officiel */
  function J(o) { return o; }
  var jobs = [
    /* Justice */
    J({ id: 'greffier', name: 'Greffier·ère', domain: 'Justice', fp: 'E', cat: 'B', lvl: 2, access: 'Concours',
      desc: 'Garant·e de la procédure au tribunal. Assiste les magistrat·es, rédige et authentifie les actes.',
      steps: ['Obtenir le bac', '*Réussir le concours externe', 'Formation à l’École nationale des greffes (Dijon)'],
      traits: ['equipe', 'dedans', 'droit', 'ecrire', 'organise', 'meticuleux', 'accueil'], prep: 'Greffier', cal: 'greffier',
      ladder: [['Greffier·ère', 'B'], ['avancement'], ['Greffier·ère principal·e', 'B'], ['concours interne'], ['Directeur·rice des services de greffe', 'A']] }),
    J({ id: 'cpip', name: 'Conseiller·ère pénitentiaire d’insertion et de probation', domain: 'Justice', fp: 'E', cat: 'A', lvl: 4, access: 'Concours',
      desc: 'Accompagne les personnes condamnées, en prison ou en milieu ouvert, pour préparer leur réinsertion.',
      steps: ['Obtenir une licence', '*Réussir le concours externe', 'Formation à l’ENAP (Agen)'],
      traits: ['aider', 'vulnerables', 'ecrire', 'droit', 'sangfroid', 'equipe'], prep: 'Conseiller pénitentiaire', cal: 'pénitentiaire' }),
    J({ id: 'dsg', name: 'Directeur·rice des services de greffe', domain: 'Justice', fp: 'E', cat: 'A', lvl: 4, access: 'Concours',
      desc: 'Dirige les greffes d’une juridiction : équipes, budget, organisation.',
      steps: ['Obtenir une licence', '*Réussir le concours externe', 'Formation à l’École nationale des greffes'],
      traits: ['manager', 'organise', 'droit', 'chiffres'], prep: 'Directeur des services de greffe', cal: 'greffe' }),
    J({ id: 'educ-pjj', name: 'Éducateur·rice de la protection judiciaire de la jeunesse', domain: 'Justice', fp: 'E', cat: 'A', lvl: 4, access: 'Concours',
      desc: 'Accompagne des mineur·es suivi·es par la justice, en foyer ou en milieu ouvert.',
      steps: ['Obtenir une licence', '*Réussir le concours externe', 'Formation à l’ENPJJ (Roubaix)'],
      traits: ['enfants', 'vulnerables', 'aider', 'equipe', 'sangfroid', 'horaires'], prep: 'Éducateur de la protection judiciaire', cal: 'protection judiciaire' }),
    J({ id: 'magistrat', name: 'Magistrat·e', domain: 'Justice', fp: 'E', cat: 'A+', lvl: 5, access: 'Concours',
      desc: 'Juge ou procureur·e : tranche les litiges, conduit l’action pénale.',
      steps: ['Obtenir un master 1 (Bac+4) en droit le plus souvent', '*Réussir le concours de l’ENM', 'Formation à l’École nationale de la magistrature (Bordeaux)'],
      traits: ['droit', 'ecrire', 'intellect', 'public_parler', 'sangfroid'], prep: 'Magistrat', cal: 'magistrat' }),

    /* Administration */
    J({ id: 'adjoint-adm', name: 'Adjoint·e administratif·ve', domain: 'Administration', fp: 'ETH', cat: 'C', lvl: 0, access: 'Avec ou sans concours',
      desc: 'Accueil, courrier, dossiers : le premier maillon de tous les services publics.',
      steps: ['Selon le poste : sans diplôme, brevet ou CAP / BEP', '*Concours, ou recrutement direct sur dossier et entretien', 'Prise de poste'],
      traits: ['accueil', 'organise', 'dedans', 'meticuleux', 'equipe'], cal: 'adjoint administratif' }),
    J({ id: 'sa', name: 'Secrétaire administratif·ve', domain: 'Administration', fp: 'E', cat: 'B', lvl: 2, access: 'Concours',
      desc: 'Gère des dossiers, un budget, des marchés. Un rôle clé entre les équipes et l’encadrement.',
      steps: ['Obtenir le bac', '*Réussir le concours externe', 'Prise de poste et formation'],
      traits: ['organise', 'ecrire', 'meticuleux', 'teletravail', 'dedans'], prep: 'Secrétaire administratif', cal: 'secrétaire administratif' }),
    J({ id: 'redacteur', name: 'Rédacteur·rice territorial·e', domain: 'Administration', fp: 'T', cat: 'B', lvl: 2, access: 'Concours',
      desc: 'Gère les dossiers d’une commune, d’un département ou d’une région : marchés, RH, finances.',
      steps: ['Obtenir le bac', '*Réussir le concours (organisé par les centres de gestion)', 'Recrutement par une collectivité'],
      traits: ['organise', 'ecrire', 'droit', 'accueil'], prep: 'Rédacteur territorial', cal: 'rédacteur' }),
    J({ id: 'attache', name: 'Attaché·e d’administration de l’État', domain: 'Administration', fp: 'E', cat: 'A', lvl: 4, access: 'Concours ou contrat',
      desc: 'Pilote des projets, encadre une équipe, conseille la hiérarchie. Dans tous les ministères.',
      steps: ['Obtenir une licence', '*Réussir le concours des IRA', 'Un an de formation rémunérée en IRA (Bastia, Lille, Lyon, Metz ou Nantes)'],
      traits: ['organise', 'ecrire', 'manager', 'intellect', 'teletravail'], prep: 'Attaché d’administration de l’État', cal: 'attaché' }),
    J({ id: 'attache-terr', name: 'Attaché·e territorial·e', domain: 'Administration', fp: 'T', cat: 'A', lvl: 4, access: 'Concours',
      desc: 'Cadre d’une collectivité : pilote des politiques locales, des projets, des équipes.',
      steps: ['Obtenir une licence', '*Réussir le concours (centres de gestion)', 'Recrutement par une collectivité'],
      traits: ['manager', 'organise', 'ecrire', 'public_parler', 'pragmatique'], prep: 'Attaché territorial', cal: 'attaché territorial' }),
    J({ id: 'aah', name: 'Attaché·e d’administration hospitalière', domain: 'Santé', fp: 'H', cat: 'A', lvl: 4, access: 'Concours',
      desc: 'Gère les finances, les achats ou les ressources humaines d’un hôpital.',
      steps: ['Obtenir une licence', '*Réussir le concours', 'Formation à l’EHESP (Rennes)'],
      traits: ['organise', 'chiffres', 'manager', 'dedans'], prep: 'Attaché d’administration hospitalière', cal: 'administration hospitalière' }),
    J({ id: 'admin-etat', name: 'Administrateur·rice de l’État', domain: 'Administration', fp: 'E', cat: 'A+', lvl: 4, access: 'Concours (INSP)',
      desc: 'Haute fonction publique : conçoit et dirige les politiques publiques, en France ou à l’étranger.',
      steps: ['Obtenir une licence (souvent un master en pratique)', '*Réussir le concours de l’INSP (externe ou Talents)', 'Formation à l’INSP (Strasbourg)'],
      traits: ['manager', 'intellect', 'ecrire', 'public_parler', 'mobilite'], prep: 'Administrateur de l’État', cal: 'INSP' }),
    J({ id: 'admin-terr', name: 'Administrateur·rice territorial·e', domain: 'Administration', fp: 'T', cat: 'A+', lvl: 4, access: 'Concours (INET)',
      desc: 'Dirige les services d’une grande collectivité : région, département, métropole.',
      steps: ['Obtenir une licence (souvent un master en pratique)', '*Réussir le concours du CNFPT', 'Formation de 18 mois à l’INET (Strasbourg)'],
      traits: ['manager', 'intellect', 'public_parler', 'pragmatique'], prep: 'Administrateur territorial', cal: 'administrateur territorial' }),
    J({ id: 'chancellerie', name: 'Secrétaire de chancellerie', domain: 'Administration', fp: 'E', cat: 'B', lvl: 2, access: 'Concours',
      desc: 'Travaille dans les ambassades et consulats : visas, état civil, gestion. Mobilité à l’étranger.',
      steps: ['Obtenir le bac', '*Réussir le concours du ministère des Affaires étrangères', 'Affectations en France et à l’étranger'],
      traits: ['langues', 'mobilite', 'organise', 'accueil'], prep: 'Secrétaire de chancellerie', cal: 'chancellerie' }),

    /* Finances */
    J({ id: 'ctrl-fip', name: 'Contrôleur·se des finances publiques', domain: 'Finances', fp: 'E', cat: 'B', lvl: 2, access: 'Concours',
      desc: 'Impôts des particuliers et des entreprises, contrôle, conseil. Partout en France.',
      steps: ['Obtenir le bac', '*Réussir le concours externe', 'Formation à l’École nationale des finances publiques'],
      traits: ['chiffres', 'meticuleux', 'droit', 'accueil'], prep: 'Contrôleur des finances publiques', cal: 'contrôleurs des finances publiques' }),
    J({ id: 'insp-fip', name: 'Inspecteur·rice des finances publiques', domain: 'Finances', fp: 'E', cat: 'A', lvl: 4, access: 'Concours',
      desc: 'Contrôle fiscal, expertise, encadrement d’équipe.',
      steps: ['Obtenir une licence', '*Réussir le concours externe', 'Formation à l’École nationale des finances publiques'],
      traits: ['chiffres', 'droit', 'intellect', 'manager'], prep: 'Inspecteur des finances publiques', cal: 'inspecteur des finances publiques' }),
    J({ id: 'ctrl-douane', name: 'Contrôleur·se des douanes', domain: 'Finances', fp: 'E', cat: 'B', lvl: 2, access: 'Concours',
      desc: 'Contrôle des marchandises et des personnes aux frontières, dans les ports et aéroports.',
      steps: ['Obtenir le bac', '*Réussir le concours externe', 'Formation à l’École nationale des douanes'],
      traits: ['dehors', 'uniforme', 'horaires', 'mobilite', 'sangfroid'], prep: 'Contrôleur de la DGDDI', cal: 'douanes' }),
    J({ id: 'dgccrf', name: 'Inspecteur·rice de la concurrence et des fraudes (DGCCRF)', domain: 'Finances', fp: 'E', cat: 'A', lvl: 4, access: 'Concours',
      desc: 'Contrôle la sécurité des produits et les pratiques commerciales, protège les consommateur·rices.',
      steps: ['Obtenir une licence', '*Réussir le concours externe', 'Formation à l’ENCCRF (Montpellier)'],
      traits: ['droit', 'meticuleux', 'dehors', 'sciences'], prep: 'Inspecteur de la DGCCRF', cal: 'DGCCRF' }),

    /* Sécurité */
    J({ id: 'gpx', name: 'Gardien·ne de la paix', domain: 'Sécurité', fp: 'E', cat: 'B', lvl: 2, access: 'Concours',
      desc: 'Police nationale : sécurité publique, enquête, secours, sur le terrain.',
      steps: ['Obtenir le bac', '*Réussir le concours', 'Formation en école de police'],
      traits: ['equipe', 'dehors', 'uniforme', 'sangfroid', 'horaires', 'sport', 'conduire'], prep: 'Gardien de la paix', cal: 'gardien de la paix' }),
    J({ id: 'pol-adj', name: 'Policier·ère adjoint·e', domain: 'Sécurité', fp: 'E', cat: 'X', lvl: 0, access: 'Contrat · 18 à 30 ans',
      desc: 'Seconde les policier·ères sur le terrain. Une porte d’entrée avant le concours.',
      steps: ['Avoir entre 18 et 30 ans', 'Tests de sélection', 'Formation, puis contrat'],
      traits: ['equipe', 'dehors', 'uniforme', 'sport', 'accueil'] }),
    J({ id: 'officier-police', name: 'Officier·ère de police', domain: 'Sécurité', fp: 'E', cat: 'A', lvl: 4, access: 'Concours',
      desc: 'Encadre des équipes de police et dirige des enquêtes judiciaires.',
      steps: ['Obtenir une licence', '*Réussir le concours', 'Formation à l’ENSP (Cannes-Écluse)'],
      traits: ['manager', 'sangfroid', 'droit', 'uniforme', 'horaires'], prep: 'Officier de police', cal: 'officier de police' }),
    J({ id: 'commissaire', name: 'Commissaire de police', domain: 'Sécurité', fp: 'E', cat: 'A+', lvl: 5, access: 'Concours',
      desc: 'Dirige un commissariat ou un service de police.',
      steps: ['Obtenir un master', '*Réussir le concours (externe ou Talents)', 'Formation à l’ENSP (Saint-Cyr-au-Mont-d’Or)'],
      traits: ['manager', 'sangfroid', 'droit', 'public_parler', 'uniforme'], prep: 'Commissaire de police', cal: 'commissaire de police' }),
    J({ id: 'sous-off-gend', name: 'Sous-officier·ère de gendarmerie', domain: 'Sécurité', fp: 'E', cat: 'B', lvl: 2, access: 'Concours',
      desc: 'Gendarmerie nationale : sécurité, enquêtes et secours, souvent en zone rurale.',
      steps: ['Obtenir le bac', '*Réussir le concours', 'Formation en école de gendarmerie'],
      traits: ['uniforme', 'sport', 'dehors', 'equipe', 'conduire', 'horaires'], prep: 'Sous-officier de gendarmerie', cal: 'gendarmerie' }),
    J({ id: 'police-mun', name: 'Policier·ère municipal·e', domain: 'Sécurité', fp: 'T', cat: 'C', lvl: 1, access: 'Concours',
      desc: 'Assure la tranquillité publique d’une commune, au contact des habitant·es.',
      steps: ['Obtenir un CAP ou un BEP', '*Réussir le concours (centres de gestion)', 'Formation initiale au CNFPT'],
      traits: ['dehors', 'uniforme', 'accueil', 'sangfroid', 'conduire', 'horaires'], prep: 'police municipale', cal: 'police municipale' }),
    J({ id: 'spp', name: 'Sapeur·se-pompier·ère professionnel·le', domain: 'Sécurité', fp: 'T', cat: 'C', lvl: 0, access: 'Concours et épreuves sportives',
      desc: 'Secours aux personnes, incendies, accidents : intervient 24 h sur 24.',
      steps: ['Être en bonne condition physique (souvent pompier volontaire avant)', '*Réussir le concours et les épreuves sportives', 'Formation en service départemental d’incendie et de secours'],
      traits: ['sport', 'sangfroid', 'equipe', 'dehors', 'horaires', 'uniforme', 'aider', 'conduire'], prep: 'sapeur-pompier', cal: 'sapeur' }),

    /* Défense */
    J({ id: 'tsef', name: 'Technicien·ne supérieur·e d’études et de fabrications', domain: 'Défense', fp: 'E', cat: 'B', lvl: 3, access: 'Concours',
      desc: 'Études techniques et suivi de fabrication pour le ministère des Armées.',
      steps: ['Obtenir un Bac+2 technique', '*Réussir le concours externe', 'Prise de poste'],
      traits: ['sciences', 'manuel', 'meticuleux', 'chiffres'], cal: 'techniciens supérieurs d’études' }),
    J({ id: 'militaire', name: 'Militaire du rang', domain: 'Défense', fp: 'E', cat: 'X', lvl: 0, access: 'Contrat · sélection',
      desc: 'Armée de Terre, Marine ou Air et Espace : un premier contrat, avec formation et évolution possible.',
      steps: ['Tests de sélection (médicaux, sportifs, psychotechniques)', 'Formation initiale', 'Premier contrat, renouvelable'],
      traits: ['sport', 'uniforme', 'equipe', 'dehors', 'mobilite', 'charges'] }),

    /* Numérique */
    J({ id: 'tech-si', name: 'Technicien·ne des systèmes d’information', domain: 'Numérique', fp: 'ET', cat: 'B', lvl: 2, access: 'Concours',
      desc: 'Réseaux, postes de travail, assistance : fait tourner l’informatique d’un service.',
      steps: ['Obtenir le bac (un Bac+2 aide)', '*Réussir le concours externe', 'Prise de poste'],
      traits: ['numerique', 'manuel', 'pragmatique', 'accueil'], cal: 'systèmes d’information' }),
    J({ id: 'dev', name: 'Développeur·se', domain: 'Numérique', fp: 'ETH', cat: 'X', lvl: 4, access: 'Contrat',
      desc: 'Construit les services numériques publics. Recrutement sur CV, souvent sans concours.',
      steps: ['Diplôme ou expérience en développement', 'Candidature sur CV et entretien', 'Contrat, CDI possible ensuite'],
      traits: ['numerique', 'intellect', 'teletravail', 'seul', 'creer'] }),
    J({ id: 'data', name: 'Data scientist, chef·fe de projet numérique', domain: 'Numérique', fp: 'ETH', cat: 'X', lvl: 5, access: 'Contrat',
      desc: 'Exploite les données publiques et pilote des projets numériques pour l’État et les collectivités.',
      steps: ['Master en informatique, statistique ou école d’ingénieur·es', 'Candidature sur CV et entretien', 'Contrat, CDI possible ensuite'],
      traits: ['numerique', 'chiffres', 'intellect', 'teletravail', 'sciences'] }),

    /* Environnement, transports, technique */
    J({ id: 'tech-env', name: 'Technicien·ne de l’environnement', domain: 'Environnement', fp: 'E', cat: 'B', lvl: 2, access: 'Concours',
      desc: 'Protège la faune, la flore et l’eau sur le terrain, dans les parcs ou à l’OFB.',
      steps: ['Obtenir le bac', '*Réussir le concours', 'Formation puis prise de poste'],
      traits: ['dehors', 'nature', 'conduire', 'sciences', 'seul'], cal: 'environnement' }),
    J({ id: 'tsdd', name: 'Technicien·ne supérieur·e du développement durable', domain: 'Transports', fp: 'E', cat: 'B', lvl: 2, access: 'Concours',
      desc: 'Routes, risques naturels, bâtiments durables : suit des chantiers et des contrôles.',
      steps: ['Obtenir le bac', '*Réussir le concours', 'Formation puis prise de poste'],
      traits: ['dehors', 'sciences', 'chiffres', 'conduire'], prep: 'développement durable', cal: 'développement durable' }),
    J({ id: 'ipef', name: 'Ingénieur·e des ponts, des eaux et des forêts', domain: 'Environnement', fp: 'E', cat: 'A+', lvl: 5, access: 'Concours',
      desc: 'Pilote les politiques d’aménagement, d’agriculture et d’environnement.',
      steps: ['École d’ingénieur·es ou master scientifique', '*Concours d’entrée', 'Formation complémentaire'],
      traits: ['sciences', 'intellect', 'manager', 'nature'] }),
    J({ id: 'espaces-verts', name: 'Agent·e des espaces verts', domain: 'Environnement', fp: 'T', cat: 'C', lvl: 0, access: 'Avec ou sans concours',
      desc: 'Entretient les parcs, jardins et arbres d’une commune.',
      steps: ['Sans diplôme, ou CAP en aménagement paysager', '*Recrutement direct ou concours d’adjoint·e technique', 'Prise de poste'],
      traits: ['dehors', 'manuel', 'nature', 'charges', 'equipe'] }),
    J({ id: 'ingenieur-terr', name: 'Ingénieur·e territorial·e', domain: 'Transports', fp: 'T', cat: 'A', lvl: 5, access: 'Concours',
      desc: 'Voirie, bâtiments, eau, numérique : conçoit et pilote les projets techniques d’une collectivité.',
      steps: ['Diplôme d’ingénieur·e ou master scientifique', '*Réussir le concours (centres de gestion)', 'Recrutement par une collectivité'],
      traits: ['sciences', 'manager', 'chiffres', 'dehors'], cal: 'ingénieur territorial' }),
    J({ id: 'tech-terr', name: 'Technicien·ne territorial·e', domain: 'Transports', fp: 'T', cat: 'B', lvl: 2, access: 'Concours',
      desc: 'Suit les chantiers de voirie, de bâtiments ou de réseaux d’une collectivité.',
      steps: ['Obtenir le bac (un Bac+2 technique aide)', '*Réussir le concours (centres de gestion)', 'Recrutement par une collectivité'],
      traits: ['dehors', 'sciences', 'conduire', 'manuel', 'pragmatique'], cal: 'technicien territorial' }),
    J({ id: 'collecte', name: 'Conducteur·rice de poids lourd, agent·e de collecte', domain: 'Transports', fp: 'T', cat: 'C', lvl: 0, access: 'Avec ou sans concours',
      desc: 'Collecte des déchets, transports de matériel pour une commune ou une intercommunalité.',
      steps: ['Permis adapté (C)', '*Recrutement direct ou concours d’adjoint·e technique', 'Prise de poste'],
      traits: ['conduire', 'dehors', 'charges', 'horaires', 'equipe'] }),

    /* Éducation */
    J({ id: 'pe', name: 'Professeur·e des écoles', domain: 'Éducation', fp: 'E', cat: 'A', lvl: 4, access: 'Concours (CRPE)',
      desc: 'Enseigne toutes les matières en maternelle et en élémentaire.',
      steps: ['Licence : depuis 2026, le concours se passe en fin de L3', '*Réussir le CRPE', 'Deux ans de formation rémunérée'],
      traits: ['enfants', 'public_parler', 'creer', 'organise', 'souplesse'], prep: 'Professeur des écoles', cal: 'professeur des écoles' }),
    J({ id: 'capes', name: 'Professeur·e de collège et lycée', domain: 'Éducation', fp: 'E', cat: 'A', lvl: 4, access: 'Concours (CAPES, CAPLP)',
      desc: 'Enseigne une discipline au collège ou au lycée.',
      steps: ['Licence dans la discipline : concours en fin de L3 depuis 2026', '*Réussir le CAPES ou le CAPLP', 'Deux ans de formation rémunérée'],
      traits: ['public_parler', 'intellect', 'enfants', 'ecrire'], cal: 'CAPES' }),
    J({ id: 'cpe', name: 'Conseiller·ère principal·e d’éducation', domain: 'Éducation', fp: 'E', cat: 'A', lvl: 4, access: 'Concours',
      desc: 'Responsable de la vie scolaire d’un collège ou d’un lycée.',
      steps: ['Licence ou master selon la session (réforme en cours)', '*Réussir le concours de CPE', 'Formation rémunérée'],
      traits: ['enfants', 'manager', 'sangfroid', 'organise', 'accueil'], cal: 'conseiller principal d’éducation' }),
    J({ id: 'aesh', name: 'Accompagnant·e d’élèves en situation de handicap (AESH)', domain: 'Éducation', fp: 'E', cat: 'X', lvl: 0, access: 'Contrat',
      desc: 'Aide un ou plusieurs élèves en situation de handicap pendant le temps scolaire.',
      steps: ['Diplôme du social, bac ou expérience auprès de personnes handicapées', 'Candidature auprès du rectorat', 'Contrat, CDI possible ensuite'],
      traits: ['enfants', 'vulnerables', 'aider', 'souplesse'] }),
    J({ id: 'atsem', name: 'Agent·e spécialisé·e des écoles maternelles (ATSEM)', domain: 'Éducation', fp: 'T', cat: 'C', lvl: 1, access: 'Concours',
      desc: 'Aide l’enseignant·e et prend soin des enfants en maternelle.',
      steps: ['CAP Accompagnant éducatif petite enfance', '*Réussir le concours (centres de gestion)', 'Recrutement par une commune'],
      traits: ['enfants', 'aider', 'equipe', 'manuel', 'souplesse'], cal: 'ATSEM' }),
    J({ id: 'cuisine', name: 'Cuisinier·ère en restauration collective', domain: 'Éducation', fp: 'TH', cat: 'C', lvl: 1, access: 'Avec ou sans concours',
      desc: 'Prépare les repas des cantines scolaires, des crèches ou de l’hôpital.',
      steps: ['CAP cuisine conseillé', '*Recrutement direct ou concours d’adjoint·e technique', 'Prise de poste'],
      traits: ['cuisine', 'manuel', 'equipe', 'organise', 'horaires'] }),

    /* Santé */
    J({ id: 'ide', name: 'Infirmier·ère', domain: 'Santé', fp: 'HT', cat: 'A', lvl: 4, access: 'Recrutement sur titre',
      desc: 'Soins à l’hôpital public. Recruté·e avec le diplôme d’État infirmier.',
      steps: ['Obtenir le bac', 'Diplôme d’État infirmier en 3 ans', '*Candidature à l’hôpital (concours sur titre)'],
      traits: ['aider', 'vulnerables', 'equipe', 'horaires', 'sangfroid'] }),
    J({ id: 'as', name: 'Aide-soignant·e', domain: 'Santé', fp: 'H', cat: 'B', lvl: 1, access: 'Recrutement sur titre',
      desc: 'Soins du quotidien et accompagnement des patient·es à l’hôpital public.',
      steps: ['Formation au diplôme d’État d’aide-soignant·e', 'Candidature à l’hôpital', 'Prise de poste'],
      traits: ['aider', 'vulnerables', 'equipe', 'horaires', 'manuel', 'charges'] }),
    J({ id: 'auxpuer', name: 'Auxiliaire de puériculture', domain: 'Santé', fp: 'HT', cat: 'B', lvl: 1, access: 'Recrutement sur titre',
      desc: 'Prend soin des bébés et des jeunes enfants, à la maternité, en pédiatrie ou en crèche.',
      steps: ['Formation au diplôme d’État d’auxiliaire de puériculture', 'Candidature à l’hôpital ou à la commune', 'Prise de poste'],
      traits: ['enfants', 'aider', 'equipe', 'horaires'] }),
    J({ id: 'ash', name: 'Agent·e des services hospitaliers', domain: 'Santé', fp: 'H', cat: 'C', lvl: 0, access: 'Recrutement direct',
      desc: 'Hygiène et confort des patient·es : un premier pas à l’hôpital, sans diplôme.',
      steps: ['Sans diplôme', 'Candidature directe à l’hôpital', 'Formation possible vers aide-soignant·e'],
      traits: ['aider', 'manuel', 'equipe', 'horaires', 'charges'] }),
    J({ id: 'manip', name: 'Manipulateur·rice en électroradiologie médicale', domain: 'Santé', fp: 'H', cat: 'A', lvl: 4, access: 'Recrutement sur titre',
      desc: 'Réalise les radios, scanners et IRM, et accompagne les patient·es pendant l’examen.',
      steps: ['Obtenir le bac', 'Diplôme en 3 ans (DE ou DTS)', 'Candidature à l’hôpital'],
      traits: ['sciences', 'numerique', 'aider', 'meticuleux'] }),
    J({ id: 'ama', name: 'Assistant·e médico-administratif·ve', domain: 'Santé', fp: 'H', cat: 'B', lvl: 2, access: 'Concours',
      desc: 'Secrétariat médical : accueil des patient·es, dossiers, rendez-vous.',
      steps: ['Obtenir le bac', '*Réussir le concours de l’établissement', 'Prise de poste'],
      traits: ['organise', 'accueil', 'ecrire', 'numerique', 'dedans'], prep: 'Secrétaire médical' }),
    J({ id: 'psy', name: 'Psychologue', domain: 'Santé', fp: 'HTE', cat: 'A', lvl: 5, access: 'Concours sur titre ou contrat',
      desc: 'Accompagne patient·es et familles à l’hôpital, en collectivité ou à l’Éducation nationale.',
      steps: ['Master de psychologie', '*Concours sur titre ou recrutement direct', 'Prise de poste'],
      traits: ['aider', 'vulnerables', 'intellect', 'seul'] }),
    J({ id: 'dh', name: 'Directeur·rice d’hôpital', domain: 'Santé', fp: 'H', cat: 'A+', lvl: 4, access: 'Concours (CNG)',
      desc: 'Dirige un hôpital ou l’une de ses grandes directions : finances, RH, soins.',
      steps: ['Obtenir une licence (souvent un master en pratique)', '*Réussir le concours du CNG (externe ou Talents)', 'Formation à l’EHESP (Rennes)'],
      traits: ['manager', 'chiffres', 'public_parler', 'sangfroid'], prep: 'Directeur d’hôpital', cal: 'directeur d’hôpital' }),
    J({ id: 'd3s', name: 'Directeur·rice d’établissement sanitaire, social et médico-social (D3S)', domain: 'Social', fp: 'H', cat: 'A+', lvl: 4, access: 'Concours (CNG)',
      desc: 'Dirige un EHPAD, un foyer ou un établissement pour personnes handicapées.',
      steps: ['Obtenir une licence', '*Réussir le concours du CNG', 'Formation à l’EHESP (Rennes)'],
      traits: ['manager', 'vulnerables', 'organise', 'aider'], prep: 'Directeur d’établissement sanitaire', cal: 'D3S' }),

    /* Social */
    J({ id: 'ass', name: 'Assistant·e de service social', domain: 'Social', fp: 'ETH', cat: 'A', lvl: 4, access: 'Concours sur titre',
      desc: 'Accompagne les personnes et les familles en difficulté.',
      steps: ['Obtenir le bac', 'Diplôme d’État d’assistant·e de service social', '*Concours sur titre ou recrutement'],
      traits: ['aider', 'vulnerables', 'ecrire', 'accueil', 'seul'] }),
    J({ id: 'educ', name: 'Éducateur·rice spécialisé·e', domain: 'Social', fp: 'TH', cat: 'A', lvl: 4, access: 'Concours sur titre',
      desc: 'Accompagne enfants, jeunes et adultes en difficulté, dans les collectivités.',
      steps: ['Obtenir le bac', 'Diplôme d’État d’éducateur·rice spécialisé·e', '*Concours sur titre ou recrutement'],
      traits: ['aider', 'vulnerables', 'enfants', 'equipe', 'horaires'] }),
    J({ id: 'animateur', name: 'Animateur·rice territorial·e', domain: 'Social', fp: 'T', cat: 'B', lvl: 2, access: 'Concours',
      desc: 'Conçoit des activités pour les jeunes ou les habitant·es : centres de loisirs, maisons de quartier.',
      steps: ['Obtenir le bac (le BPJEPS aide)', '*Réussir le concours (centres de gestion)', 'Recrutement par une collectivité'],
      traits: ['enfants', 'creer', 'public_parler', 'equipe', 'souplesse'], cal: 'animateur' }),
    J({ id: 'agent-social', name: 'Agent·e social·e', domain: 'Social', fp: 'T', cat: 'C', lvl: 0, access: 'Recrutement direct',
      desc: 'Aide à domicile ou en établissement des personnes âgées ou handicapées.',
      steps: ['Sans diplôme, ou CAP du secteur', '*Recrutement direct par la collectivité', 'Prise de poste'],
      traits: ['aider', 'vulnerables', 'manuel', 'souplesse'] }),
    J({ id: 'insp-travail', name: 'Inspecteur·rice du travail', domain: 'Social', fp: 'E', cat: 'A', lvl: 4, access: 'Concours',
      desc: 'Contrôle l’application du droit du travail dans les entreprises.',
      steps: ['Obtenir une licence', '*Réussir le concours', 'Formation à l’INTEFP (Marcy-l’Étoile)'],
      traits: ['droit', 'dehors', 'public_parler', 'sangfroid', 'mobilite'], prep: 'Inspecteur du travail', cal: 'inspecteur du travail' }),

    /* Culture */
    J({ id: 'acp', name: 'Assistant·e de conservation du patrimoine', domain: 'Culture', fp: 'T', cat: 'B', lvl: 2, access: 'Concours',
      desc: 'Musées, bibliothèques, archives : conserve et fait découvrir les collections.',
      steps: ['Obtenir le bac', '*Réussir le concours', 'Prise de poste en collectivité'],
      traits: ['creer', 'accueil', 'meticuleux', 'dedans'], cal: 'conservation du patrimoine' }),
    J({ id: 'magasinier', name: 'Magasinier·ère des bibliothèques', domain: 'Culture', fp: 'E', cat: 'C', lvl: 0, access: 'Avec ou sans concours',
      desc: 'Range, prête et entretient les collections des bibliothèques universitaires.',
      steps: ['Sans condition de diplôme', '*Recrutement sans concours sur dossier et entretien, ou concours', 'Prise de poste'],
      traits: ['organise', 'meticuleux', 'charges', 'dedans', 'accueil'] }),
    J({ id: 'conservateur', name: 'Conservateur·rice du patrimoine', domain: 'Culture', fp: 'ET', cat: 'A+', lvl: 4, access: 'Concours (INP)',
      desc: 'Dirige un musée, des archives ou un service patrimonial.',
      steps: ['Obtenir une licence (souvent un master en pratique)', '*Réussir le concours de l’INP', 'Formation à l’Institut national du patrimoine (Paris)'],
      traits: ['intellect', 'creer', 'ecrire', 'meticuleux', 'manager'], prep: 'Conservateur du patrimoine', cal: 'conservateur' }),

    /* Sport */
    J({ id: 'etaps', name: 'Éducateur·rice des activités physiques et sportives', domain: 'Sport', fp: 'T', cat: 'B', lvl: 2, access: 'Concours',
      desc: 'Encadre le sport dans une commune : écoles, clubs, piscines, quartiers.',
      steps: ['Diplôme du sport (BPJEPS, STAPS)', '*Réussir le concours', 'Prise de poste en collectivité'],
      traits: ['sport', 'enfants', 'dehors', 'public_parler', 'equipe'], cal: 'activités physiques' }),

    /* Recherche */
    J({ id: 'atrf', name: 'Adjoint·e technique de recherche et de formation', domain: 'Recherche', fp: 'E', cat: 'C', lvl: 0, access: 'Avec ou sans concours',
      desc: 'Prépare le matériel des laboratoires et des salles de cours dans les universités.',
      steps: ['Sans condition de diplôme pour le recrutement sans concours', '*Recrutement sans concours ou concours', 'Prise de poste'],
      traits: ['manuel', 'sciences', 'meticuleux', 'equipe'] }),
    J({ id: 'trf', name: 'Technicien·ne de recherche et de formation', domain: 'Recherche', fp: 'E', cat: 'B', lvl: 2, access: 'Concours',
      desc: 'Réalise des expériences et des analyses dans les laboratoires publics.',
      steps: ['Obtenir le bac (un Bac+2 scientifique aide)', '*Réussir le concours', 'Prise de poste'],
      traits: ['sciences', 'manuel', 'meticuleux', 'numerique'] }),
    J({ id: 'ie', name: 'Ingénieur·e d’études', domain: 'Recherche', fp: 'E', cat: 'A', lvl: 4, access: 'Concours ou contrat',
      desc: 'Appuie les équipes de recherche dans les universités et les laboratoires publics.',
      steps: ['Obtenir une licence ou un master', '*Concours ou contrat', 'Prise de poste en laboratoire'],
      traits: ['sciences', 'intellect', 'numerique', 'chiffres'] }),
    J({ id: 'chercheur', name: 'Chercheur·se', domain: 'Recherche', fp: 'E', cat: 'A+', lvl: 6, access: 'Concours sur dossier',
      desc: 'Fait avancer la connaissance au CNRS, à l’Inserm ou dans un autre organisme public.',
      steps: ['Obtenir un doctorat', '*Concours sur dossier et audition', 'Prise de poste en laboratoire'],
      traits: ['sciences', 'intellect', 'langues', 'mobilite', 'seul', 'ecrire'] })
  ];

  /* ---------- Prépas Talents (106) ----------
     Source : fonction-publique.gouv.fr/cartographie-prepas-talents, consultée le 15/10/2026.
     [établissement, ville, code postal, concours préparés] */
  var talents = [
    ["École nationale de la protection judiciaire de la jeunesse (concours directeur)", "Roubaix", "59052", "Directeur des services de la protection judiciaire de la jeunesse"],
    ["École des hautes études en santé publique (EHESP)", "Rennes", "35043", "Attaché d'administration hospitalière;Directeur d'établissement sanitaire, social et médico-social;Directeur d'hôpital;Inspecteur de l'action sanitaire et sociale"],
    ["Institut national du travail, de l'emploi et de la formation professionnelle", "Marcy-l'Étoile", "69280", "Inspecteur du travail"],
    ["IEP de Rennes", "Rennes", "35700", "Administrateur de l'Assemblée nationale;Administrateur de l'État;Administrateur du Sénat;Administrateur territorial;Cadre de la Banque de France;Chef des services pénitentiaires;Commissaire aux armées;Commissaire de police;Conseiller des tribunaux administratifs;Directeur des services pénitentiaires;Directeur pénitentiaire d'insertion et de probation;Inspecteur des finances publiques;Magistrat de chambre régionale des comptes"],
    ["Université de Strasbourg", "Strasbourg", "67082", "Attaché d'administration hospitalière;Attaché d'administration de l'État;Attaché territorial;Conseiller pénitentiaire d'insertion et de probation;Conservateur de bibliothèque;Contrôleur de la DGCCRF;Contrôleur de la DGDDI;Contrôleur de l'INSEE;Contrôleur des finances publiques;Directeur des services de la protection judiciaire de la jeunesse;Directeur d'établissement sanitaire, social et médico-social;Directeur d'hôpital;Éducateur de la protection judiciaire de la jeunesse;Greffier des services judiciaires;Inspecteur de l'action sanitaire et sociale;Inspecteur de la DGCCRF;Inspecteur de la DGDDI;Inspecteur des finances publiques;Inspecteur du travail;Officier de police;Officier du corps technique et administratif de la gendarmerie;Rédacteur territorial;Secrétaire administratif;Secrétaire de chancellerie"],
    ["École nationale des greffes", "Dijon", "21071", "Directeur des services de greffe judiciaires;Greffier des services judiciaires"],
    ["IRA de Lille (antenne IPAG Lille)", "Lille", "59024", "Attaché d'administration de l'État"],
    ["IRA de Lille (antenne Amiens)", "Amiens", "80025", "Attaché d'administration de l'État"],
    ["IRA de Lille (antenne Nanterre)", "Nanterre", "92001", "Attaché d'administration de l'État"],
    ["IRA de Lille (antenne Rouen)", "Évreux", "27000", "Attaché d'administration de l'État"],
    ["CEFIL INSEE", "Libourne", "33500", "Contrôleur de l'INSEE"],
    ["École nationale des douanes de Tourcoing", "Tourcoing", "59203", "Inspecteur des douanes"],
    ["École nationale supérieure de la police (ENSP)", "Saint-Cyr-au-Mont-d'Or", "69450", "Commissaire de police;Officier de police"],
    ["IRA de Nantes (antenne Brest)", "Brest", "29238", "Attaché d'administration de l'État;Attaché territorial;Inspecteur des finances publiques"],
    ["Université des Antilles (Guadeloupe)", "Pointe-à-Pitre", "97110", "Administrateur territorial;Attaché d'administration de l'État"],
    ["IRA de Nantes (antenne Limoges)", "Limoges", "87000", "Attaché d'administration de l'État;Attaché territorial;Inspecteur des finances publiques"],
    ["Université des Antilles (Martinique)", "Schœlcher", "97233", "Administrateur territorial;Attaché d'administration de l'État"],
    ["IRA de Nantes", "Nantes", "44312", "Attaché d'administration de l'État;Attaché territorial;Inspecteur des finances publiques"],
    ["Université Jean Monnet", "Saint-Étienne", "42023", "Administrateur de l'État;Administrateur territorial;Attaché d'administration de l'État;Attaché territorial;Chef des services pénitentiaires;Conseiller pénitentiaire d'insertion et de probation;Directeur des services pénitentiaires;Directeur d'établissement sanitaire, social et médico-social;Directeur d'hôpital;Directeur pénitentiaire d'insertion et de probation;Concours d'accès à l'EN3S"],
    ["IRA de Bastia", "Bastia", "20200", "Attaché d'administration de l'État"],
    ["IRA de Bastia (antenne Aix)", "Aix-en-Provence", "13625", "Attaché d'administration de l'État"],
    ["IRA de Bastia (antenne Bordeaux)", "Pessac", "33600", "Attaché d'administration de l'État"],
    ["IRA de Bastia (antenne Montpellier)", "Montpellier", "34960", "Attaché d'administration de l'État"],
    ["Région de gendarmerie des Hauts-de-France", "Amiens", "80000", "Officier de gendarmerie;Officier du corps technique et administratif de la gendarmerie"],
    ["Région de gendarmerie Auvergne-Rhône-Alpes", "Clermont-Ferrand", "63000", "Officier de gendarmerie;Officier du corps technique et administratif de la gendarmerie;Sous-officier de gendarmerie"],
    ["Région de gendarmerie d'Occitanie", "Montpellier", "34070", "Officier de gendarmerie;Officier du corps technique et administratif de la gendarmerie"],
    ["École nationale de la protection judiciaire de la jeunesse (concours éducateur)", "Roubaix", "59052", "Éducateur de la protection judiciaire de la jeunesse"],
    ["IPAG de Rennes", "Rennes", "35700", "Assistant à la Banque de France;Conseiller pénitentiaire d'insertion et de probation;Contrôleur de la DGCCRF;Contrôleur de la DGDDI;Contrôleur de l'INSEE;Contrôleur des finances publiques;Éducateur de la protection judiciaire de la jeunesse;Gardien de la paix;Greffier des services judiciaires;Lieutenant de sapeur-pompier;Rédacteur territorial;Secrétaire administratif;Secrétaire de chancellerie;Secrétaire médical;Sous-officier de gendarmerie"],
    ["Université Paris 1 Panthéon-Sorbonne", "Paris", "75013", "Administrateur de l'Assemblée nationale;Administrateur de l'État;Administrateur des affaires maritimes;Administrateur du Sénat;Administrateur territorial;Cadre de la Banque de France;Commissaire de police;Conseiller des tribunaux administratifs;Directeur d'établissement sanitaire, social et médico-social;Directeur d'hôpital;Magistrat de chambre régionale des comptes;Secrétaire des affaires étrangères"],
    ["Université de Lille (IPAG)", "Lille", "59024", "Capitaine pénitentiaire;Conseiller pénitentiaire d'insertion et de probation;Directeur des services pénitentiaires;Directeur pénitentiaire d'insertion et de probation"],
    ["École des officiers de la gendarmerie nationale", "Paris", "75007", "Officier de gendarmerie;Officier du corps technique et administratif de la gendarmerie"],
    ["IRA de Lyon (antenne CPAG Lyon)", "Lyon", "69365", "Administrateur de l'État;Attaché d'administration de l'État"],
    ["IRA de Lyon (antenne Lyon 3, carrières publiques)", "Lyon", "69008", "Inspecteur des finances publiques"],
    ["IRA de Lyon (antenne Lyon 3, douanes)", "Lyon", "69008", "Inspecteur de la DGDDI"],
    ["IRA de Lyon (antenne Lyon 3, magistrats administratifs)", "Lyon", "69008", "Conseiller des tribunaux administratifs;Magistrat de chambre régionale des comptes"],
    ["IRA de Lyon (antenne UCLY)", "Lyon", "69002", "Administrateur de l'État;Administrateur territorial;Attaché d'administration de l'État"],
    ["IRA de Lyon", "Villeurbanne", "69616", "Attaché d'administration de l'État"],
    ["INSP (antenne Nantes)", "Nantes", "44312", "Administrateur de l'Assemblée nationale;Administrateur de l'État;Administrateur des affaires maritimes;Administrateur du Sénat;Administrateur territorial;Cadre de la Banque de France;Directeur d'hôpital;Inspecteur des finances publiques;Secrétaire des affaires étrangères"],
    ["INSP Strasbourg", "Strasbourg", "67000", "Administrateur de l'État;Administrateur de l'Assemblée nationale;Administrateur des affaires maritimes;Administrateur du Sénat;Administrateur territorial;Cadre de la Banque de France;Directeur d'hôpital;Inspecteur des finances publiques;Secrétaire des affaires étrangères"],
    ["IRA de Lille (antenne Valenciennes)", "Valenciennes", "59313", "Attaché d'administration de l'État"],
    ["IRA de Nantes (antenne Rennes)", "Rennes", "35700", "Attaché d'administration de l'État;Attaché territorial;Inspecteur des finances publiques"],
    ["IRA de Bastia (antenne Toulouse)", "Toulouse", "31065", "Attaché d'administration de l'État"],
    ["IRA de Metz (antenne Créteil)", "Créteil", "94040", "Attaché d'administration de l'État;Attaché territorial;Inspecteur de la DGDDI;Inspecteur des finances publiques"],
    ["Université de Perpignan (DU INET)", "Perpignan", "66860", "Administrateur territorial;Attaché territorial"],
    ["Université de Perpignan (DU INSP)", "Perpignan", "66860", "Administrateur de l'État;Attaché d'administration de l'État"],
    ["INSP (antenne Paris)", "Paris", "75006", "Administrateur de l'Assemblée nationale;Administrateur de l'État;Administrateur des affaires maritimes;Administrateur du Sénat;Administrateur territorial;Cadre de la Banque de France;Directeur d'hôpital;Inspecteur des finances publiques;Secrétaire des affaires étrangères"],
    ["Aix-Marseille Université (ENM)", "Marseille", "13001", "Magistrat"],
    ["Université de La Réunion (licence d'administration publique)", "Saint-Denis", "97490", "Attaché d'administration de l'État;Attaché d'administration hospitalière;Attaché territorial;Capitaine de sapeur-pompier;Contrôleur de la DGDDI;Contrôleur des finances publiques;Directeur des services de greffe judiciaires;Directeur des services pénitentiaires;Greffier des services judiciaires;Inspecteur de la DGCCRF;Inspecteur de la DGDDI;Inspecteur des finances publiques;Lieutenant de sapeur-pompier;Lieutenant pénitentiaire;Officier du corps technique et administratif de la gendarmerie;Rédacteur territorial;Secrétaire administratif;Sous-officier de gendarmerie"],
    ["Université de La Réunion (master d'administration publique)", "Saint-Denis", "97490", "Administrateur de l'État;Administrateur territorial;Attaché d'administration de l'État;Attaché d'administration hospitalière;Attaché territorial;Inspecteur de la DGCCRF;Inspecteur de la DGDDI;Inspecteur des finances publiques"],
    ["IEP de Grenoble", "Saint-Martin-d'Hères", "38400", "Administrateur de l'État;Attaché d'administration de l'État;Commissaire de police;Directeur d'établissement sanitaire, social et médico-social;Directeur d'hôpital;Inspecteur de la DGCCRF;Inspecteur de la DGDDI;Inspecteur des finances publiques;Magistrat;Officier de police"],
    ["IEP d'Aix-en-Provence", "Aix-en-Provence", "13625", "Administrateur de l'État (INSP);Administrateur territorial (INET);Concours de l'EN3S;Directeur d'hôpital;Directeur d'établissement sanitaire, social et médico-social;Cadre de la Banque de France;Secrétaire des affaires étrangères;Concours des assemblées;Magistrat administratif;Magistrat financier"],
    ["IPAG de Nanterre (Bercy)", "Nanterre", "92001", "Contrôleur des finances publiques;Contrôleur de la DGCCRF;Contrôleur de la DGDDI;Inspecteur des finances publiques;Inspecteur de la DGCCRF;Inspecteur de la DGDDI"],
    ["Université de Montpellier (DGFiP)", "Montpellier", "34064", "Contrôleur des finances publiques;Inspecteur des finances publiques"],
    ["École nationale de la magistrature (antenne Besançon)", "Besançon", "25000", "Magistrat"],
    ["École nationale de la magistrature (antenne Bordeaux)", "Bordeaux", "33080", "Magistrat"],
    ["École nationale de la magistrature (antenne Douai)", "Douai", "59500", "Magistrat"],
    ["École nationale de la magistrature (antenne Limoges)", "Limoges", "87000", "Magistrat"],
    ["École nationale de la magistrature (antenne Lyon)", "Lyon", "69008", "Magistrat"],
    ["École nationale de la magistrature (antenne Orléans)", "Orléans", "45100", "Magistrat"],
    ["École nationale de la magistrature (antenne Pointe-à-Pitre)", "Pointe-à-Pitre", "97110", "Magistrat"],
    ["IEP de Bordeaux (Prépa Talents ESPOIR)", "Pessac", "33600", "Administrateur des affaires maritimes;Attaché d'administration de l'État;Attaché d'administration hospitalière;Attaché territorial;Commissaire aux armées;Commissaire de police;Conseiller pénitentiaire d'insertion et de probation;Conservateur de bibliothèque;Directeur d'établissement sanitaire, social et médico-social;Directeur des services pénitentiaires;Directeur d'hôpital;Inspecteur de l'action sanitaire et sociale;Inspecteur des finances publiques;Magistrat"],
    ["IEP de Bordeaux (ESPOIR, objectif INSP)", "Pessac", "33600", "Administrateur de l'Assemblée nationale;Administrateur de l'État;Administrateur du Sénat;Administrateur territorial;Conseiller des tribunaux administratifs;Magistrat de chambre régionale des comptes"],
    ["Aix-Marseille Université (IMPGT)", "Aix-en-Provence", "13621", "Attaché d'administration de l'État (IRA);Attaché territorial;Inspecteur des finances publiques;Officier sapeur-pompier"],
    ["IPAG de Nanterre (inspecteur du travail)", "Nanterre", "92001", "Inspecteur du travail"],
    ["Université Paris-Panthéon-Assas (master 2 concours A+)", "Paris", "75015", "Administrateur de l'Assemblée nationale;Administrateur de la Ville de Paris;Administrateur de l'État;Administrateur du Sénat;Administrateur territorial;Cadre de la Banque de France;Directeur d'hôpital"],
    ["ENSP (antenne Cannes-Écluse)", "Cannes-Écluse", "77130", "Officier de police"],
    ["CVRH Arras-Valenciennes (site de Valenciennes)", "Valenciennes", "59300", "Technicien supérieur principal du développement durable"],
    ["Université Toulouse Capitole", "Toulouse", "31000", "Administrateur de l'État;Administrateur territorial;Attaché d'administration de l'État;Directeur d'établissement sanitaire, social et médico-social;Directeur d'hôpital"],
    ["Université Paris-Panthéon-Assas (concours de police)", "Paris", "75005", "Commissaire de police;Officier de police"],
    ["IEP de Toulouse (antenne Tarbes)", "Tarbes", "65000", "Inspecteur de la DGCCRF;Inspecteur de la DGDDI;Inspecteur des finances publiques"],
    ["IEP de Lille", "Lille", "59000", "Administrateur de l'Assemblée nationale;Administrateur de l'État;Administrateur du Sénat;Administrateur des affaires maritimes;Administrateur territorial;Attaché d'administration de l'État;Attaché d'administration hospitalière;Attaché territorial;Cadre de la Banque de France;Commissaire aux armées;Conseiller des tribunaux administratifs;Conservateur de bibliothèque;Directeur des services pénitentiaires;Directeur d'établissement sanitaire, social et médico-social;Directeur d'hôpital;Inspecteur de la jeunesse et des sports;Inspecteur des finances publiques;Inspecteur de l'action sanitaire et sociale;Inspecteur de la DGCCRF;Inspecteur de la DGDDI;Inspecteur du travail;Magistrat;Magistrat de chambre régionale des comptes;Officier de police;Officier du corps technique et administratif de la gendarmerie"],
    ["École nationale de la concurrence, de la consommation et de la répression des fraudes", "Montpellier", "34935", "Inspecteur de la DGCCRF"],
    ["École nationale des finances publiques (Clermont-Ferrand)", "Clermont-Ferrand", "63033", "Inspecteur des finances publiques"],
    ["École nationale des finances publiques (Lyon)", "Lyon", "69001", "Contrôleur des finances publiques"],
    ["École nationale des finances publiques (Nevers)", "Nevers", "58000", "Contrôleur des finances publiques"],
    ["École nationale des finances publiques (Noisiel)", "Noisiel", "77186", "Inspecteur des finances publiques"],
    ["École nationale des finances publiques (Noisy-le-Grand)", "Noisy-le-Grand", "93160", "Contrôleur des finances publiques"],
    ["INFOMA", "Corbas", "69960", "Technicien spécialité vétérinaire et alimentaire"],
    ["Institut national du patrimoine", "Paris", "75002", "Conservateur du patrimoine;Conservateur territorial du patrimoine"],
    ["Université polytechnique Hauts-de-France", "Valenciennes", "59300", "Attaché d'administration de l'État;Contrôleur de la DGCCRF;Contrôleur de la DGDDI;Contrôleur des finances publiques"],
    ["Centre universitaire de Mayotte", "Dembéni", "97660", "Professeur des écoles;Attaché d'administration de l'État (IRA);Inspecteur des finances publiques;Attaché territorial;Directeur des services de greffe judiciaires;Directeur des services de la protection judiciaire de la jeunesse;Rédacteur territorial;Contrôleur des finances publiques;Greffier"],
    ["École nationale d'administration pénitentiaire", "Agen", "47916", "Capitaine pénitentiaire;Conseiller pénitentiaire d'insertion et de probation;Directeur pénitentiaire d'insertion et de probation;Directeur des services pénitentiaires"],
    ["Université Versailles Saint-Quentin (formation en ligne)", "Guyancourt", "78047", "Administrateur des affaires maritimes;Attaché d'administration de l'État;Commissaire aux armées;Commissaire de police;Conseiller pénitentiaire d'insertion et de probation;Directeur des services de greffe judiciaires;Directeur des services pénitentiaires;Directeur des services de la protection judiciaire de la jeunesse;Directeur pénitentiaire d'insertion et de probation;Greffier des services judiciaires;Magistrat;Officier de police;Officier du corps technique et administratif de la gendarmerie"],
    ["Université Clermont Auvergne (finances publiques)", "Clermont-Ferrand", "63002", "Inspecteur des finances publiques"],
    ["CNAM Paris", "Paris", "75003", "Administrateur de l'État (INSP);Administrateur territorial (INET);Attaché d'administration de l'État (IRA);Administrateur de l'Assemblée nationale;Administrateur du Sénat;Cadre de la Banque de France"],
    ["Université de Haute-Alsace", "Mulhouse", "68093", "Administrateur de l'État;Administrateur territorial;Attaché d'administration hospitalière;Contrôleur de la DGDDI;Contrôleur des finances publiques;Inspecteur de la DGDDI;Inspecteur des finances publiques;Inspecteur du travail;Secrétaire administratif"],
    ["Université d'Orléans", "Orléans", "45100", "Administrateur de l'État;Administrateur territorial;Attaché d'administration de l'État;Attaché territorial;Directeur d'établissement sanitaire, social et médico-social;Directeur d'hôpital"],
    ["Université d'Orléans (antenne Châteauroux)", "Châteauroux", "36000", "Attaché territorial;Rédacteur territorial"],
    ["Sciences Po Paris", "Paris", "75007", "Administrateur de l'État;Administrateur territorial;Cadre de la Banque de France;Directeur d'hôpital;Concours de l'EN3S;Secrétaire des affaires étrangères"],
    ["Université d'Orléans (campus de Bourges)", "Bourges", "18000", "Attaché d'administration hospitalière;Attaché territorial (sanitaire et social);Inspecteur de l'action sanitaire et sociale;Inspecteur du travail;Directeur d'établissement sanitaire, social et médico-social;Directeur d'hôpital"],
    ["Université de Bordeaux", "Bordeaux", "33000", "Administrateur de l'État;Administrateur territorial;Attaché d'administration de l'État;Attaché territorial;Commissaire aux armées;Conseiller des tribunaux administratifs;Inspecteur des finances publiques;Magistrat de chambre régionale des comptes"],
    ["IEP de Saint-Germain-en-Laye (formation en ligne)", "Saint-Germain-en-Laye", "78100", "Attaché d'administration de l'État;Commissaire aux armées;Commissaire de police;Conseiller pénitentiaire d'insertion et de probation;Directeur des services de la protection judiciaire de la jeunesse;Directeur des services de greffe judiciaires;Directeur des services pénitentiaires;Directeur pénitentiaire d'insertion et de probation;Greffier des services judiciaires;Magistrat;Officier de police;Officier du corps technique et administratif de la gendarmerie"],
    ["Aix-Marseille Université (IPEP)", "Marseille", "13001", "Attaché d'administration de l'État;Attaché d'administration hospitalière;Attaché territorial;Inspecteur de la DGCCRF;Inspecteur de la DGDDI;Inspecteur des finances publiques"],
    ["Université Paul-Valéry Montpellier 3", "Montpellier", "34090", "Administrateur de l'État;Administrateur territorial;Attaché d'administration hospitalière;Attaché territorial;Chef des services pénitentiaires;Commissaire de police;Conseiller d'éducation populaire et de jeunesse;Conseiller pénitentiaire d'insertion et de probation;Directeur des services pénitentiaires;Directeur d'établissement sanitaire, social et médico-social;Directeur d'hôpital;Directeur pénitentiaire d'insertion et de probation;Inspecteur de l'action sanitaire et sociale;Inspecteur de la jeunesse et des sports"],
    ["Université de Poitiers (IPAG)", "Poitiers", "86073", "Brigadier de police;Commissaire de police;Conseiller pénitentiaire d'insertion et de probation;Contrôleur de la DGDDI;Directeur de police municipale;Directeur des services de greffe judiciaires;Directeur des services de la protection judiciaire de la jeunesse;Directeur des services pénitentiaires;Directeur pénitentiaire d'insertion et de probation;Éducateur de la protection judiciaire de la jeunesse;Greffier des services judiciaires;Inspecteur de la DGDDI;Lieutenant pénitentiaire;Officier de police;Officier du corps technique et administratif de la gendarmerie;Sous-officier de gendarmerie"],
    ["Université d'Évry (concours B)", "Évry-Courcouronnes", "91000", "Contrôleur de la DGCCRF;Contrôleur de la DGDDI;Contrôleur des finances publiques;Contrôleur du travail;Greffier des services judiciaires;Rédacteur territorial"],
    ["Université Paris Dauphine-PSL", "Paris", "75775", "Administrateur de l'État;Administrateur territorial;Directeur d'hôpital;Directeur d'établissement sanitaire, social et médico-social;Cadre de la Banque de France;Attaché d'administration;Inspecteur des finances publiques;Concours parlementaires;Commissaire aux armées"],
    ["Université d'Évry (concours A)", "Évry-Courcouronnes", "91000", "Administrateur de l'État;Administrateur territorial;Attaché territorial;Cadre de la Banque de France;Directeur d'hôpital"],
    ["École nationale de la magistrature (antenne Paris)", "Paris", "75004", "Magistrat"],
    ["IEP de Toulouse", "Toulouse", "31065", "Administrateur de l'État;Administrateur territorial;Inspecteur des douanes;Inspecteur de la DGCCRF;Inspecteur des finances publiques;Attaché d'administration de l'État (IRA)"],
    ["IRA de Metz (IPAG de Nancy)", "Nancy", "54052", "Attaché d'administration de l'État;Inspecteur des finances publiques;Inspecteur des douanes;Attaché territorial"],
    ["IRA de Metz", "Metz", "57045", "Attaché d'administration de l'État;Inspecteur des finances publiques;Inspecteur des douanes;Attaché territorial"],
    ["IRA de Metz (antenne Nancy)", "Nancy", "54011", "Attaché d'administration de l'État;Inspecteur des finances publiques;Inspecteur des douanes;Attaché territorial"],
    ["IRA de Metz (antenne Paris-Est Fontainebleau)", "Fontainebleau", "77300", "Attaché d'administration de l'État;Inspecteur des finances publiques;Inspecteur des douanes;Attaché territorial"],
    ["IRA de Metz (antenne Strasbourg)", "Strasbourg", "67082", "Attaché d'administration de l'État;Inspecteur des finances publiques;Inspecteur des douanes;Attaché territorial"],
    ["Université Clermont Auvergne (services publics sociaux)", "Clermont-Ferrand", "63002", "Attaché d'administration hospitalière;Attaché territorial (sanitaire et social);Directeur d'établissement sanitaire, social et médico-social;Inspecteur de l'action sanitaire et sociale"]
  ].map(function (t) { return { name: t[0], city: t[1], cp: t[2], concours: t[3].split(';'), online: /en ligne/.test(t[0]) }; });

  /* ---------- IPAG et CPAG (27), source : ipag-cpag.fr ---------- */
  var ipag = [
    ['CPAG d’Aix-en-Provence', 'Aix-en-Provence', '13'], ['CPAG de Bordeaux', 'Bordeaux', '33'], ['CPAG de Grenoble', 'Grenoble', '38'],
    ['CPAG de Lyon', 'Lyon', '69'], ['CPAG de Toulouse', 'Toulouse', '31'], ['IMDA de Caen', 'Caen', '14'],
    ['IPAG d’Amiens', 'Amiens', '80'], ['IPAG de Besançon', 'Besançon', '25'], ['IPAG de Brest', 'Brest', '29'],
    ['IPAG de Clermont-Ferrand', 'Clermont-Ferrand', '63'], ['IPAG de Dijon', 'Dijon', '21'], ['IEP de Fontainebleau (UPEC)', 'Fontainebleau', '77'],
    ['IPAG de Lille', 'Lille', '59'], ['IPAG de Limoges', 'Limoges', '87'], ['IPAG de Montpellier', 'Montpellier', '34'],
    ['IPAG de Nancy', 'Nancy', '54'], ['IPAG de Nanterre', 'Nanterre', '92'], ['IPAG de Nantes', 'Nantes', '44'],
    ['IPAG de Paris', 'Paris', '75'], ['IPAG de Poitiers (CIMP)', 'Poitiers', '86'], ['IPAG de Reims', 'Reims', '51'],
    ['IPAG de Rennes', 'Rennes', '35'], ['IPAG de Rouen', 'Rouen', '76'], ['IPAG de Strasbourg', 'Strasbourg', '67'],
    ['IPAG de Valenciennes', 'Valenciennes', '59'], ['IPAG des Antilles-Guyane', 'Antilles-Guyane', '971'],
    ['i-EPrépa (IEP de Saint-Germain-en-Laye, en ligne)', 'Saint-Germain-en-Laye', '78']
  ].map(function (t) { return { name: t[0], city: t[1], dep: t[2] }; });

  /* ---------- IEP et masters d'administration publique ---------- */
  var iep = [
    { name: 'Sciences Po Paris', city: 'Paris', dep: '75', note: 'Prépa Talents : INSP, INET, directeur d’hôpital, Banque de France' },
    { name: 'Sciences Po Aix', city: 'Aix-en-Provence', dep: '13', note: 'CPAG, Prépa Talents A+ (INSP, INET, EHESP, magistratures)' },
    { name: 'Sciences Po Bordeaux', city: 'Pessac', dep: '33', note: 'CPAG, Prépas Talents ESPOIR (A et A+)' },
    { name: 'Sciences Po Grenoble', city: 'Saint-Martin-d’Hères', dep: '38', note: 'CPAG, Prépa Talents A et A+' },
    { name: 'Sciences Po Lille', city: 'Lille', dep: '59', note: 'Prépa Talents A et A+, très large' },
    { name: 'Sciences Po Lyon', city: 'Lyon', dep: '69', note: 'CPAG de Lyon, Prépa Talents INSP et IRA' },
    { name: 'Sciences Po Rennes', city: 'Rennes', dep: '35', note: 'Prépa Talents A+ (INSP, INET, police, pénitentiaire)' },
    { name: 'Sciences Po Saint-Germain-en-Laye', city: 'Saint-Germain-en-Laye', dep: '78', note: 'i-EPrépa, préparation en ligne' },
    { name: 'Sciences Po Strasbourg', city: 'Strasbourg', dep: '67', note: 'Master et préparation aux concours' },
    { name: 'Sciences Po Toulouse', city: 'Toulouse', dep: '31', note: 'CPAG, Prépa Talents (à Toulouse et Tarbes)' },
    { name: 'IEP de Fontainebleau (UPEC)', city: 'Fontainebleau', dep: '77', note: 'Préparation aux concours administratifs' },
    { name: 'Université des Antilles', city: 'Pointe-à-Pitre et Schœlcher', dep: '971', note: 'Prépa Talents INET et IRA' },
    { name: 'Université de La Réunion', city: 'Saint-Denis', dep: '974', note: 'Master d’administration publique, Prépa Talents' },
    { name: 'Centre universitaire de Mayotte', city: 'Dembéni', dep: '976', note: 'Prépa Talents (IRA, finances publiques, greffe)' }
  ];

  /* ---------- Préparations privées et payantes (liste non exhaustive) ---------- */
  var privees = [
    { name: 'CNED', mode: 'À distance', note: 'Organisme public. Préparations payantes à de nombreux concours A, B et C. L’inscription au CNED ne vaut pas inscription au concours.', tags: 'A B C' },
    { name: 'ISP (Institut supérieur de préparation)', mode: 'Paris et à distance', note: 'Préparations privées aux concours administratifs et judiciaires.', tags: 'A+ A' },
    { name: 'Ipesup', mode: 'Paris', note: 'Préparations privées aux concours de la haute fonction publique et aux IRA.', tags: 'A+ A' },
    { name: 'Studi', mode: 'À distance', note: 'Préparations en ligne à des concours A, B et C.', tags: 'A B C' }
  ];

  /* ---------- Catégories ---------- */
  var categories = [
    { id: 'A+', dip: 'Bac+3 minimum, Bac+5 recommandé', role: 'Diriger, encadrer au plus haut niveau', ex: 'Administrateur·rice de l’État, directeur·rice d’hôpital, magistrat·e, commissaire', tint: 'tint-blue',
      note: 'La très grande majorité des admis ont un bac+5. Concours nationaux, suivis d’une école (INSP, INET, EHESP, ENM, ENSP, INP). Des concours Talents sont réservés aux élèves des Prépas Talents.' },
    { id: 'A', dip: 'Bac+3 minimum, Bac+5 recommandé', role: 'Concevoir, encadrer, décider', ex: 'Attaché·e, inspecteur·rice, professeur·e, infirmier·ère', tint: 'tint-mint',
      note: 'La très grande majorité des admis ont un bac+5. Certains corps l’exigent (ingénieur·es, psychologues).' },
    { id: 'B', dip: 'Bac minimum', role: 'Appliquer, rédiger, gérer', ex: 'Greffier·ère, contrôleur·se, technicien·ne, gardien·ne de la paix', tint: 'tint-cyan',
      note: 'Certains concours B demandent un Bac+2.' },
    { id: 'C', dip: 'Brevet, CAP, BEP ou sans diplôme', role: 'Exécuter, accueillir, assurer', ex: 'Adjoint·e administratif·ve, agent·e technique, ATSEM', tint: 'tint-yellow',
      note: 'Le brevet suffit pour certains concours. Beaucoup de premiers postes C se décrochent sans concours.' }
  ];

  /* ---------- Où passer les épreuves, par catégorie et par versant ---------- */
  var DOM = 'Guadeloupe, Martinique, Guyane, La Réunion, Mayotte';
  var exam = {
    'A+': {
      E: { org: 'Concours nationaux : INSP, ENM, ENSP (police), INP (patrimoine)', metro: 'Épreuves écrites dans plusieurs centres, oraux surtout à Paris ou dans l’école', om: 'Centres d’écrits en outre-mer selon les concours (' + DOM + ') : voir l’avis de concours' },
      T: { org: 'CNFPT (administrateur·rice, ingénieur·e en chef, conservateur·rice)', metro: 'Épreuves organisées par le CNFPT, formation à l’INET (Strasbourg)', om: 'Centres d’écrits outre-mer possibles : voir l’avis de concours' },
      H: { org: 'Centre national de gestion (CNG)', metro: 'Directeur·rice d’hôpital, D3S, directeur·rice des soins. Formation à l’EHESP (Rennes)', om: 'Centres d’écrits outre-mer possibles : voir l’avis de concours' }
    },
    'A': {
      E: { org: 'Ministères et écoles (IRA, ENFiP, ENG, ENAP…)', metro: 'Écrits dans les grandes villes, souvent un centre par académie ou région', om: 'Centres d’écrits fréquents en ' + DOM },
      T: { org: 'Centres de gestion (CDG), un par département, coordonnés par région', metro: 'Le CDG coordonnateur de votre région organise le concours', om: 'CDG de ' + DOM },
      H: { org: 'Hôpitaux et Agences régionales de santé', metro: 'Souvent sur titre, dans l’établissement qui recrute', om: 'Centres hospitaliers et ARS d’outre-mer' }
    },
    'B': {
      E: { org: 'Ministères (finances, intérieur, justice…)', metro: 'Centres d’écrits dans de nombreuses villes', om: 'Centres d’écrits fréquents en ' + DOM },
      T: { org: 'Centres de gestion (CDG)', metro: 'Le CDG coordonnateur de votre région', om: 'CDG de ' + DOM },
      H: { org: 'Hôpitaux, groupements hospitaliers', metro: 'Concours ou recrutement sur titre dans l’établissement', om: 'Centres hospitaliers d’outre-mer' }
    },
    'C': {
      E: { org: 'Ministères, préfectures, rectorats', metro: 'Concours ou recrutement sans concours, souvent local', om: 'Préfectures et services de l’État en outre-mer' },
      T: { org: 'Centres de gestion, ou recrutement direct par la commune', metro: 'Premier grade C souvent sans concours', om: 'CDG de ' + DOM },
      H: { org: 'Hôpitaux', metro: 'Recrutement direct, sur dossier et entretien', om: 'Centres hospitaliers d’outre-mer' }
    }
  };

  window.DATA = {
    domains: ['Santé', 'Sécurité', 'Justice', 'Éducation', 'Environnement', 'Numérique', 'Administration', 'Culture', 'Social', 'Défense', 'Finances', 'Transports', 'Sport', 'Recherche'],
    levels: {
      school: ['6e', '5e', '4e', '3e', 'Seconde', 'Première', 'Terminale', 'Bac', 'Bac+1 / +2', 'Bac+3', 'Bac+5'],
      adult: ['Sans diplôme', 'Brevet', 'CAP / BEP', 'Bac', 'Bac+2', 'Bac+3', 'Bac+5']
    },
    fps: { E: 'État', T: 'Territoriale', H: 'Hospitalière' },
    traitGroups: traitGroups,
    jobs: jobs,
    talents: talents,
    ipag: ipag,
    iep: iep,
    privees: privees,
    categories: categories,
    exam: exam,
    conditions: [
      'Nationalité française ou européenne, selon les postes',
      'Jouir de ses droits civiques',
      'Casier judiciaire compatible avec le poste',
      'Pas de limite d’âge, sauf exceptions'
    ],

    /* Source : calendrier général des concours de la fonction publique d'État, consulté le 15/10/2026 */
    calendar: [
      { date: '2026-11-17', name: 'Contrôleur·se des finances publiques', meta: 'Externe · Finances', cat: 'B', job: 'ctrl-fip' },
      { date: '2026-11-19', name: 'Inspecteur·rice principal·e de la DGCCRF', meta: 'Interne · Finances', cat: 'A' },
      { date: '2026-11-25', name: 'Professeur·e certifié·e, CAPES (Guyane)', meta: 'Interne · Éducation nationale', cat: 'A' },
      { date: '2026-12-08', name: 'Technicien·ne supérieur·e d’études et de fabrications', meta: 'Externe et interne · Défense', cat: 'B', job: 'tsef' },
      { date: '2026-12-11', name: 'Colonel·le de sapeur·ses-pompier·ères professionnel·les', meta: 'Interne · Sécurité civile', cat: 'A' },
      { date: '2027-01-18', name: 'Gardien·ne de la paix', meta: 'Interne · Intérieur', cat: 'B', job: 'gpx' }
    ],
    calendarUrl: 'https://www.fonction-publique.gouv.fr/devenir-agent-public/calendrier-general-concours',

    noExam: [
      { t: 'Contractuel·le', d: 'Recruté·e sur CV et entretien, en CDD. Un CDI est possible après 6 ans.', bg: 'bg-mint' },
      { t: 'PACTE', d: 'De 16 à 28 ans, peu ou pas diplômé·e : un poste de catégorie C avec formation, puis titularisation.', bg: 'bg-cyan' },
      { t: 'Apprentissage', d: 'Un diplôme en alternance, payé, dans un service public.', bg: 'bg-yellow' },
      { t: 'Recrutement sans concours', d: 'Premiers grades de catégorie C : lettre et CV, sélection sur dossier, puis entretien. Exemples : adjoint·e administratif·ve, magasinier·ère des bibliothèques, adjoint·e technique de recherche.', bg: 'cat-X' }
    ],
    noExamUrl: 'https://www.fonction-publique.gouv.fr/devenir-agent-public/les-avis-de-recrutement-sans-concours',
    jobsUrl: 'https://choisirleservicepublic.gouv.fr',

    /* budget : 0 = gratuit, 1 = moins de 1 000 €, 2 = plus */
    preps: [
      { id: 'talents', t: 'Prépas Talents', price: 'Gratuit', budget: 0, talents: true, d: '106 prépas en France et outre-mer. Sur dossier et entretien, sous conditions de ressources.' },
      { id: 'ipag', t: 'IPAG et CPAG', price: 'Frais d’inscription', budget: 1, d: '27 instituts dédiés aux concours administratifs, licence et master d’administration publique.' },
      { id: 'iep', t: 'IEP et masters d’administration publique', price: 'Frais d’inscription', budget: 1, d: 'Sciences Po et universités, en métropole et outre-mer.' },
      { id: 'privees', t: 'Préparations privées', price: 'Payant', budget: 2, d: 'Des organismes privés proposent aussi des préparations, en ligne ou en présentiel. Nous avons fait le choix de mettre en avant les solutions gratuites ou au prix d’une inscription à l’université.' }
    ],
    talentsMapUrl: 'https://www.fonction-publique.gouv.fr/cartographie-prepas-talents',
    ipagUrl: 'https://www.ipag-cpag.fr',
    ipagDistanceUrl: 'https://www.ipag-cpag.fr/Les-formations-a-distance-Licence-Master.html',

    legal: {
      publisher: 'Yacine Seck',
      contact: 'yacineseckdore@gmail.com',
      director: 'Yacine Seck',
      design: 'Roche Conseil',
      designContact: 'alexis.afonso@rocheconseil.fr',
      host: 'GitHub, Inc. (GitHub Pages)',
      hostAddress: '88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis',
      updated: '15 octobre 2026'
    }
  };
})();

/* Carte des régions de métropole (page Prépas Talents) : tracés IGN Admin Express (Licence ouverte), simplifiés
   d’après france-geojson (Grégoire David), projetés et arrondis au dixième dans un cadre de 300 de large. */
window.DATA.regionMap = {"viewBox":"0 0 300 289","paths":{"IDF":"M157.4,59.8L158.3,59.0L160.8,60.4L161.5,59.5L162.8,60.1L166.8,59.6L167.3,58.7L169.2,59.2L169.2,61.7L171.3,64.0L172.0,63.7L172.6,64.9L173.3,64.5L173.6,65.9L175.7,66.6L173.9,69.4L175.4,70.0L174.8,72.2L177.2,73.5L175.3,75.0L175.2,76.2L174.1,76.2L174.7,77.1L173.7,77.7L174.3,80.3L166.8,81.2L165.9,85.8L162.1,88.1L161.7,87.0L159.8,88.2L154.7,87.9L156.0,86.2L154.0,84.2L153.6,82.4L152.0,82.0L151.4,82.8L149.5,81.7L148.5,82.9L144.8,83.4L144.9,80.1L143.8,79.7L143.7,78.3L142.7,78.9L141.3,77.9L141.0,75.5L137.2,72.2L136.7,71.1L137.7,69.7L134.0,60.8L137.3,59.9L139.3,55.3L140.3,57.0L143.0,57.3L146.9,56.0L150.5,57.6L151.7,56.6L157.4,59.8Z","CVL":"M163.2,106.2L164.4,108.6L163.3,112.2L165.5,114.0L166.3,119.9L167.3,121.2L167.0,126.9L166.4,127.8L165.0,127.6L160.9,130.1L160.0,129.3L158.1,132.0L157.0,131.9L157.8,135.1L156.3,136.0L152.5,136.3L151.1,139.0L147.2,139.3L144.9,138.4L141.6,138.7L141.2,138.0L140.2,138.1L139.8,139.9L138.9,139.1L138.1,140.0L136.0,139.8L135.6,138.8L133.4,141.2L132.2,139.6L129.4,140.6L128.5,140.1L129.2,138.7L128.0,138.1L127.9,136.6L123.2,133.8L123.4,130.8L118.8,124.6L118.6,122.5L116.0,121.7L116.7,123.0L111.1,123.8L110.5,120.1L108.7,120.2L108.1,118.3L106.0,118.0L105.5,116.9L106.0,113.3L108.2,110.4L109.1,103.6L112.2,104.8L111.9,103.1L113.6,103.3L117.0,101.4L116.3,100.5L120.3,96.7L119.9,95.2L121.7,93.7L120.8,89.8L121.7,89.8L121.9,88.0L123.1,87.5L120.7,86.2L121.4,85.6L120.1,82.4L123.8,80.0L124.2,76.4L121.8,74.6L121.1,72.0L122.4,70.7L127.3,69.5L127.4,68.5L131.4,69.3L132.6,68.4L132.3,67.1L134.2,66.0L134.3,64.0L135.9,64.5L136.8,66.5L136.7,68.4L137.7,69.7L136.7,71.1L137.2,72.2L141.0,75.5L141.3,77.9L142.7,78.9L143.7,78.3L143.8,79.7L144.9,80.1L144.8,83.4L148.5,82.9L149.5,81.7L151.4,82.8L152.0,82.0L153.6,82.4L154.0,84.2L155.7,85.2L155.7,87.3L154.7,87.9L155.4,88.2L159.8,88.2L161.7,87.0L162.1,88.1L164.5,87.1L166.4,88.0L168.4,92.8L165.9,95.1L166.3,98.3L162.9,99.1L162.7,100.1L164.9,102.5L165.3,104.8L162.9,105.3L163.2,106.2Z","BFC":"M178.7,129.2L177.6,129.2L178.0,130.0L177.1,130.2L177.0,131.3L175.1,132.1L174.7,130.3L172.9,131.1L171.3,130.2L169.8,131.3L166.4,127.8L167.3,121.2L166.3,119.9L165.5,114.0L163.3,112.2L164.4,108.6L162.7,105.7L165.3,104.8L164.9,102.5L162.7,100.1L162.9,99.1L166.3,98.3L165.9,95.1L168.4,92.8L166.4,88.0L164.5,87.1L166.7,83.9L166.1,82.8L166.8,81.2L173.3,80.9L173.6,80.1L174.5,81.2L176.0,81.0L178.6,84.4L177.6,86.3L178.9,86.5L179.5,87.8L180.9,86.9L180.9,88.0L183.6,91.5L183.2,92.4L184.2,92.0L184.2,93.8L188.5,94.1L189.7,93.2L190.5,93.6L190.5,92.8L192.3,94.2L192.6,93.1L197.7,92.8L197.2,91.9L198.2,91.1L202.4,91.7L202.3,92.9L204.0,93.7L203.2,94.5L203.8,95.1L204.7,94.3L206.6,97.3L205.0,98.6L206.1,100.0L205.9,101.0L207.3,100.6L209.3,102.5L210.4,101.5L211.9,104.6L212.8,103.7L214.0,104.1L215.0,101.7L217.6,101.7L218.3,100.7L218.9,101.7L220.8,101.3L221.0,97.2L222.0,97.2L222.3,96.2L223.2,96.5L225.9,92.6L226.2,93.8L228.0,91.8L229.9,91.2L230.6,93.4L232.0,94.0L234.7,93.1L236.9,95.2L239.6,93.7L244.5,97.2L244.8,98.3L248.4,100.3L247.7,103.3L249.4,104.1L250.3,106.8L247.3,107.1L247.6,108.3L245.2,111.1L247.9,110.6L248.9,111.5L246.5,113.2L246.7,114.5L242.3,118.5L241.5,120.6L236.0,123.9L236.6,128.0L229.4,134.4L230.4,135.3L228.9,138.4L224.7,143.5L221.5,143.8L221.3,142.3L220.0,141.4L217.8,143.5L216.4,143.6L216.3,141.9L214.4,141.0L214.4,140.2L212.8,139.2L213.1,138.2L211.1,137.6L210.8,136.4L207.9,137.1L205.4,136.2L202.2,146.3L201.2,146.2L201.3,144.5L200.2,143.8L200.7,143.0L199.6,142.5L198.9,143.6L197.7,142.7L196.6,143.6L194.6,142.7L194.2,145.0L192.0,146.9L190.5,145.7L185.9,146.3L185.7,145.5L184.0,145.1L184.5,142.7L186.0,142.0L186.2,137.7L181.0,135.5L178.7,129.2Z","NOR":"M81.5,51.6L82.4,50.6L85.2,50.4L87.5,51.5L95.9,52.2L99.8,53.8L102.5,53.3L107.1,50.2L111.4,49.1L106.9,48.4L105.8,47.1L108.3,41.2L116.1,36.9L127.0,34.3L132.7,30.5L134.3,30.5L134.1,31.2L138.8,34.8L140.9,39.6L139.0,41.5L140.3,41.9L139.4,42.9L140.2,46.2L139.6,47.1L141.0,47.2L139.5,50.0L141.0,54.8L139.4,54.3L137.3,59.9L134.3,60.3L135.1,63.9L134.0,64.4L134.2,66.0L132.3,67.1L132.6,68.4L130.4,69.4L127.4,68.5L127.3,69.5L122.4,70.7L121.1,72.0L121.8,74.6L124.2,76.4L124.0,78.8L123.0,80.9L120.1,82.4L121.4,85.6L120.0,86.6L117.8,84.1L115.4,84.5L114.4,82.8L112.7,82.6L112.2,79.3L110.6,77.7L107.9,78.1L105.7,80.6L103.3,80.6L103.4,78.5L101.5,78.4L101.5,76.2L100.2,75.2L99.1,75.6L98.9,76.9L94.1,76.9L91.1,78.7L90.8,77.5L88.9,79.0L86.8,77.0L84.8,76.6L83.9,77.4L79.7,75.8L78.4,76.1L76.1,78.4L73.9,77.4L72.3,73.3L74.2,73.5L75.9,72.6L72.5,70.1L71.6,67.0L72.8,64.2L71.5,59.8L71.9,55.2L71.0,55.8L69.4,52.5L67.4,51.1L65.8,46.1L66.7,43.8L64.6,42.1L64.7,40.6L71.2,42.9L75.3,41.2L78.5,41.5L79.3,44.1L77.9,44.8L77.7,46.1L80.5,50.0L80.3,50.9L81.5,51.6Z","HDF":"M187.2,50.1L187.0,51.5L183.5,50.1L183.1,51.3L179.0,52.9L179.3,56.0L181.1,57.5L178.5,57.7L178.9,59.8L177.8,61.2L179.7,61.7L175.2,67.0L173.6,65.9L173.3,64.5L172.6,64.9L169.2,61.7L169.5,60.4L168.6,59.0L167.3,58.7L165.3,60.0L161.5,59.5L160.8,60.4L158.3,59.0L157.4,59.8L155.4,59.0L151.7,56.6L150.5,57.6L146.9,56.0L143.0,57.3L140.1,56.8L139.4,54.3L141.0,54.8L141.3,54.1L139.5,50.0L141.0,47.2L139.6,47.1L140.2,46.2L139.4,42.9L140.3,41.9L139.0,41.5L140.9,39.6L138.8,34.8L134.1,31.2L134.3,30.5L132.7,30.5L135.4,26.4L138.9,27.0L135.9,24.0L136.1,22.0L138.0,21.9L136.2,20.6L136.9,16.4L137.5,16.5L136.7,15.4L136.3,11.6L137.2,9.7L136.8,6.4L140.8,4.0L156.5,0.0L158.3,4.2L157.4,5.0L158.3,8.2L160.0,8.2L162.0,11.1L163.7,11.7L166.2,9.4L168.9,9.1L171.1,11.5L171.7,16.7L173.5,17.8L175.5,16.5L176.4,16.8L175.9,17.6L178.2,17.6L179.4,18.9L179.3,21.4L180.3,23.4L181.1,22.0L184.4,22.6L186.8,21.8L188.8,24.3L190.5,24.3L188.8,28.4L190.3,28.4L190.9,30.0L189.0,31.8L189.1,33.0L191.0,33.7L190.7,34.9L191.5,35.3L190.5,38.9L191.3,39.7L188.2,43.5L186.9,43.9L187.8,45.2L187.2,50.1Z","GE":"M191.0,33.7L196.7,34.0L200.1,32.5L200.2,30.4L201.8,28.3L204.2,27.9L202.4,33.3L204.4,35.1L203.8,38.6L206.7,38.4L210.1,41.6L212.2,41.4L213.5,42.7L213.1,43.9L215.5,44.5L216.3,47.4L222.6,45.4L224.5,47.3L226.6,47.6L226.8,48.8L232.4,47.0L238.5,49.7L238.8,51.9L241.9,55.6L242.3,57.3L244.2,57.7L244.3,55.9L246.3,55.6L248.3,56.5L248.7,58.8L249.7,58.0L253.4,58.7L256.7,56.7L257.7,57.1L258.5,59.3L260.6,60.6L263.9,60.2L265.4,61.2L266.8,60.5L270.0,62.5L272.6,62.9L270.1,67.8L267.5,69.5L264.1,74.3L262.9,82.0L259.4,88.4L259.3,91.1L260.4,92.8L259.0,95.5L258.1,100.8L259.7,104.0L258.0,105.5L257.6,107.4L256.5,106.9L256.8,107.6L255.4,108.9L251.1,108.5L251.4,107.1L250.3,106.8L249.4,104.1L247.7,103.3L248.6,101.7L247.9,99.7L244.8,98.3L244.5,97.2L239.6,93.7L236.9,95.2L234.7,93.1L232.0,94.0L230.6,93.4L229.9,91.2L228.0,91.8L226.2,93.8L225.9,92.6L223.2,96.5L222.3,96.2L222.0,97.2L221.0,97.2L220.8,101.3L218.9,101.7L218.3,100.7L217.6,101.7L215.0,101.7L214.0,104.1L212.8,103.7L211.9,104.6L210.4,101.5L209.3,102.5L207.3,100.6L205.9,101.0L206.1,100.0L205.0,98.6L206.6,97.3L204.7,94.3L203.8,95.1L203.2,94.5L204.0,93.7L202.3,92.9L202.4,91.7L198.2,91.1L197.2,91.9L197.7,92.8L192.6,93.1L192.3,94.2L190.5,92.8L190.5,93.6L189.7,93.2L188.5,94.1L184.2,93.8L184.2,92.0L183.2,92.4L183.6,91.5L180.9,88.0L180.9,86.9L179.5,87.8L178.9,86.5L177.6,86.3L178.4,83.9L176.0,81.0L174.5,81.2L173.8,79.3L173.7,77.7L174.7,77.1L174.1,76.2L175.2,76.2L175.3,75.0L177.2,73.5L174.8,72.2L175.4,70.0L173.9,69.4L175.7,67.4L176.6,64.8L179.7,61.7L177.8,61.2L178.9,59.8L178.5,57.7L181.1,57.5L179.3,56.0L179.0,52.9L183.1,51.3L183.5,50.1L187.0,51.5L187.8,45.2L186.9,43.9L188.2,43.5L191.3,39.7L190.5,38.9L191.5,35.3L190.7,34.9L191.0,33.7Z","PDL":"M54.1,108.4L54.8,107.5L57.1,107.9L58.1,106.4L60.3,107.0L60.3,106.2L61.5,105.8L62.0,102.3L66.3,100.7L70.5,100.6L71.3,99.0L74.4,97.7L74.4,96.9L78.9,98.6L80.8,93.0L83.5,92.1L81.9,84.2L83.0,82.2L82.3,79.1L82.7,76.6L83.9,77.4L84.8,76.6L86.8,77.0L88.9,79.0L90.8,77.5L91.1,78.7L94.1,76.9L98.9,76.9L99.1,75.6L100.2,75.2L101.5,76.2L101.5,78.4L103.4,78.5L103.5,80.7L105.7,80.6L107.9,78.1L110.6,77.7L112.2,79.3L112.7,82.6L114.4,82.8L115.4,84.5L117.8,84.1L119.2,86.1L123.1,87.5L121.9,88.0L121.7,89.8L120.8,89.8L121.7,93.7L119.9,95.2L120.3,96.7L116.3,100.5L117.0,101.4L113.6,103.3L111.9,103.1L112.2,104.8L109.1,103.6L108.2,110.4L106.0,113.3L105.5,116.9L104.2,117.0L103.5,119.0L102.7,118.7L101.8,120.1L100.8,119.7L101.3,118.7L100.6,118.5L96.2,119.6L94.3,119.3L93.0,119.9L91.8,121.9L88.3,121.6L86.2,122.5L87.5,123.7L87.4,125.2L89.9,127.1L89.5,128.7L91.9,133.0L91.3,139.1L91.7,139.9L91.9,139.2L93.4,140.0L91.2,142.1L89.1,142.5L87.2,141.4L85.3,142.2L84.7,141.9L85.4,140.6L84.7,140.6L81.3,142.3L79.8,142.1L79.7,143.6L76.9,141.3L74.4,141.3L73.7,139.7L67.3,136.8L66.4,133.4L60.6,127.2L60.3,125.0L63.9,120.9L62.4,118.9L58.9,117.8L60.1,116.8L59.7,113.4L57.3,114.7L55.9,113.5L54.5,114.0L53.0,113.3L53.2,112.0L52.1,110.6L54.3,109.1L54.1,108.4ZM57.3,130.4L56.6,131.0L55.3,129.9L57.3,130.4ZM59.4,123.2L57.3,122.1L57.8,120.9L60.3,123.2L60.1,124.5L59.4,123.2Z","BRE":"M29.6,72.3L31.1,72.0L31.8,69.7L31.2,68.5L32.3,67.3L34.2,68.2L38.5,66.2L38.9,67.1L41.1,66.1L41.3,67.3L42.8,67.5L42.1,68.5L44.5,69.5L44.2,70.5L46.6,72.6L46.7,74.3L48.8,75.4L49.2,76.9L53.9,72.6L57.1,71.9L56.6,73.5L58.1,72.8L59.9,74.8L61.0,74.0L60.6,73.2L62.0,72.9L64.6,75.9L63.0,72.6L65.7,71.2L66.8,71.7L66.1,72.7L66.7,73.6L72.3,73.3L73.9,77.4L75.2,78.2L76.9,77.9L78.4,76.1L82.5,76.8L83.0,82.2L81.9,84.2L83.5,92.1L80.8,93.0L78.9,98.6L74.4,96.9L74.4,97.7L71.3,99.0L70.5,100.6L66.3,100.7L62.0,102.3L61.5,105.8L60.3,106.2L60.3,107.0L58.1,106.4L57.1,107.9L54.8,107.5L53.7,108.5L53.2,107.2L54.5,107.0L54.0,106.5L50.2,105.7L49.6,107.0L47.2,107.3L44.9,105.1L47.9,105.8L48.9,104.6L48.1,102.8L45.2,104.4L40.5,104.8L41.1,107.4L40.4,107.6L40.2,104.5L38.7,102.7L40.4,100.7L39.8,99.8L38.6,102.5L35.9,100.0L33.8,101.0L32.4,99.2L32.3,96.5L32.0,99.0L28.0,97.7L26.7,98.3L23.0,94.8L23.0,96.3L19.2,96.5L19.0,95.7L18.8,97.9L15.2,98.0L15.4,96.2L13.9,93.1L11.5,91.6L8.3,91.1L7.9,90.1L16.7,88.8L16.4,86.2L13.1,84.9L11.2,87.0L11.4,84.8L10.2,84.2L11.3,81.9L11.6,83.5L18.0,83.1L15.1,81.7L13.5,82.2L13.9,80.1L10.1,81.9L8.7,81.4L6.8,82.2L6.3,79.7L7.6,75.4L15.4,71.8L18.0,72.7L18.8,71.5L21.4,71.4L22.9,70.3L23.6,72.5L24.6,72.2L25.7,73.3L25.6,71.5L26.2,71.1L29.6,71.3L29.6,72.3ZM0.0,79.0L0.8,77.6L1.3,78.1L0.0,79.0ZM34.4,103.3L32.7,102.7L34.3,102.6L34.4,103.3ZM39.1,110.8L41.8,112.5L41.5,113.2L38.5,113.0L37.7,110.7L39.1,110.8Z","NA":"M133.4,141.2L135.6,138.8L136.0,139.8L138.1,140.0L138.9,139.1L139.8,139.9L140.2,138.1L141.2,138.0L141.6,138.7L144.9,138.4L147.2,139.3L151.1,139.0L151.9,141.7L153.4,141.7L154.0,143.0L155.2,143.1L156.8,146.4L156.6,149.1L157.8,152.4L155.4,155.6L153.3,156.7L156.0,160.2L155.9,162.2L154.8,163.6L155.9,164.8L155.3,168.8L156.0,169.8L152.6,169.3L152.5,171.5L149.2,175.2L148.8,178.9L147.3,179.6L148.1,181.7L144.1,182.6L143.5,181.9L140.7,183.6L137.7,180.3L135.9,179.9L133.2,181.1L133.9,185.0L131.0,187.3L131.3,189.0L127.9,191.1L128.0,192.0L126.3,194.2L124.5,194.8L126.2,199.8L124.5,200.4L122.8,199.7L122.2,201.9L123.9,202.9L122.9,205.2L122.0,205.3L122.2,207.3L120.7,206.7L118.3,210.3L116.2,208.8L113.8,209.4L112.2,210.9L110.5,211.3L109.0,210.5L107.8,211.8L106.0,211.6L105.6,214.1L104.0,213.1L104.4,212.3L103.7,211.6L99.6,214.1L100.4,214.6L100.5,216.7L99.8,216.8L100.4,218.9L99.4,219.7L98.7,222.5L99.4,223.4L102.4,223.5L103.6,225.6L103.0,228.0L103.5,228.6L104.1,227.6L104.6,228.3L104.3,229.7L105.0,230.5L103.5,231.9L104.1,232.8L102.9,234.2L103.0,235.6L102.0,235.5L100.5,237.5L100.3,239.6L98.5,240.7L97.8,245.7L96.4,246.8L94.0,246.0L93.1,247.5L89.6,244.1L89.0,241.8L85.1,242.2L81.6,240.2L78.5,239.5L77.6,238.8L78.2,237.3L76.9,238.1L76.7,240.0L74.9,239.5L74.3,238.1L75.5,237.1L76.1,233.3L73.6,232.1L71.5,233.3L71.2,231.9L69.0,232.0L67.8,229.7L71.7,227.9L74.5,222.4L77.5,207.2L78.7,194.8L79.8,192.0L80.6,191.3L83.6,191.7L80.6,188.0L78.6,192.2L80.7,167.3L82.7,164.6L83.1,166.1L88.0,170.9L90.4,178.9L92.0,180.8L92.3,180.0L90.8,177.5L89.4,170.3L88.0,167.6L83.8,163.1L79.1,160.3L79.0,158.0L81.3,157.3L80.8,155.6L81.9,155.3L82.6,153.0L81.9,151.8L82.9,151.2L81.3,147.7L79.4,146.6L81.7,143.7L81.3,142.3L85.4,140.6L84.7,141.9L85.3,142.2L87.2,141.4L89.6,142.5L93.4,140.0L91.9,139.2L91.7,139.9L91.3,139.1L91.9,133.0L89.5,128.7L89.9,127.1L87.4,125.2L87.5,123.7L86.2,122.5L88.3,121.6L91.8,121.9L93.0,119.9L94.3,119.3L96.2,119.6L100.6,118.5L101.3,118.7L100.8,119.7L101.8,120.1L102.7,118.7L103.5,119.0L104.8,116.5L106.0,118.0L108.1,118.3L108.7,120.2L110.5,120.1L111.1,123.8L116.7,123.0L116.0,121.7L118.6,122.5L118.8,124.6L123.4,130.8L123.2,133.8L127.9,136.6L128.0,138.1L129.2,138.7L128.5,140.1L131.1,140.5L132.2,139.6L133.4,141.2ZM74.1,145.3L75.3,144.7L75.2,145.4L78.0,146.0L78.3,147.1L73.1,145.5L72.5,144.5L73.9,144.0L73.5,144.9L74.1,145.3ZM78.8,156.1L76.0,152.8L75.5,150.1L79.1,152.1L80.1,154.9L79.2,157.4L78.8,156.1Z","OCC":"M141.0,253.5L139.7,253.0L140.0,252.4L136.1,251.1L134.7,251.2L133.9,252.7L132.2,249.3L128.2,249.5L127.1,247.6L124.1,246.6L123.3,247.1L118.9,245.0L117.6,247.3L118.1,250.1L113.3,250.1L111.8,249.1L110.4,250.5L109.7,249.3L108.0,248.7L103.2,250.0L101.1,246.9L98.0,245.3L98.5,240.7L100.3,239.6L100.5,237.5L102.0,235.5L103.0,235.6L102.9,234.2L104.1,232.8L103.5,231.9L105.0,230.5L104.3,229.7L104.6,228.3L104.1,227.6L103.5,228.6L103.0,228.0L103.6,225.6L102.4,223.5L99.4,223.4L98.7,222.5L99.4,219.7L100.4,218.9L99.8,216.8L100.5,216.7L100.4,214.6L99.6,214.1L103.7,211.6L104.4,212.3L104.0,213.1L105.6,214.1L106.0,211.6L107.8,211.8L109.0,210.5L110.5,211.3L112.2,210.9L113.8,209.4L116.2,208.8L118.3,210.3L120.7,206.7L122.2,207.3L122.0,205.3L122.9,205.2L123.9,202.9L122.2,201.9L122.8,199.7L124.5,200.4L126.2,199.8L124.5,194.8L126.3,194.2L128.0,192.0L127.9,191.1L131.3,189.0L131.0,187.3L133.9,185.0L133.2,181.1L135.9,179.9L138.2,180.5L140.7,183.6L143.5,181.9L144.1,182.6L146.6,182.0L147.2,185.1L148.7,186.9L148.3,189.6L149.6,192.7L149.6,191.9L151.3,191.2L152.8,192.0L155.2,191.7L156.8,189.5L157.7,186.0L160.3,183.2L161.2,183.8L161.1,185.6L162.9,185.0L165.4,191.9L166.8,187.1L168.7,184.2L169.5,185.4L170.6,184.6L170.8,183.3L171.6,183.5L173.2,182.1L174.1,182.6L175.6,187.0L177.8,186.5L178.0,185.0L179.2,185.0L179.5,186.4L181.0,186.1L183.4,188.9L184.1,192.7L187.7,199.0L187.3,201.6L188.8,201.0L191.5,203.2L193.1,201.0L194.2,200.7L194.4,202.5L195.1,202.5L195.6,200.9L196.5,201.0L199.3,202.6L200.7,204.7L200.7,208.0L202.4,209.1L203.5,211.5L199.4,215.0L199.1,220.3L196.2,220.0L195.0,222.4L196.0,222.7L195.5,223.5L191.2,226.0L191.0,227.1L188.9,226.3L189.1,225.0L188.3,224.3L185.6,224.8L179.3,229.2L176.2,232.7L174.6,232.2L172.8,232.8L169.4,235.9L166.7,242.0L166.5,250.4L166.8,254.2L168.6,255.3L169.4,257.7L167.5,258.0L166.6,256.5L164.7,256.3L162.5,257.0L161.7,258.2L159.1,258.6L159.1,260.5L157.2,260.0L156.4,260.7L150.6,257.6L145.8,260.0L144.0,257.1L139.8,256.0L139.9,254.2L141.0,253.5ZM102.3,233.6L101.5,232.7L102.1,231.6L102.3,233.6ZM102.3,230.2L103.1,230.5L102.9,231.7L102.2,231.5L102.3,230.2Z","ARA":"M202.2,146.3L205.4,136.2L207.9,137.1L210.8,136.4L211.1,137.6L213.1,138.2L212.8,139.2L214.4,140.2L214.4,141.0L216.3,141.9L216.4,143.6L217.8,143.5L220.0,141.4L221.3,142.3L221.5,143.8L224.1,143.7L228.5,139.1L229.2,139.3L230.6,140.6L229.3,143.0L229.7,144.0L226.7,145.1L226.3,147.6L229.8,147.3L232.8,145.1L233.5,143.9L232.0,143.3L233.4,140.6L235.2,141.4L237.7,139.5L242.0,139.4L243.7,140.2L242.9,140.9L244.9,143.1L243.5,147.4L245.6,147.9L245.0,150.0L246.6,150.0L248.4,152.9L247.5,155.4L243.9,156.4L243.7,159.7L246.3,162.0L247.6,162.2L247.6,166.3L251.4,169.2L250.0,171.5L250.4,173.6L249.0,175.0L246.9,175.1L245.5,177.2L242.9,176.5L240.1,178.0L237.6,178.1L237.1,179.6L234.6,179.2L233.9,177.8L231.9,178.1L231.3,180.9L233.8,181.3L234.4,185.6L229.8,185.4L228.3,186.8L227.8,186.1L226.7,186.7L226.1,187.1L226.8,187.8L223.6,189.0L222.9,191.6L219.8,191.7L218.9,194.9L220.3,196.1L219.1,197.2L216.5,196.4L216.2,197.7L216.9,198.0L215.3,198.4L215.6,200.1L216.8,201.0L219.3,201.2L219.6,202.6L220.5,202.9L219.9,206.1L220.6,206.7L218.5,205.5L217.8,207.1L216.0,207.5L214.0,204.7L209.9,204.2L210.2,201.9L208.8,202.7L208.0,201.9L203.2,204.3L201.8,201.4L199.6,201.2L199.5,203.0L196.5,201.0L195.6,200.9L195.4,202.2L194.4,202.5L194.2,200.7L192.2,201.7L191.5,203.2L188.8,201.0L187.3,201.6L187.7,199.0L184.1,192.7L183.0,188.2L181.0,186.1L179.5,186.4L178.6,184.9L177.8,186.5L175.6,187.0L174.1,182.6L173.2,182.1L171.6,183.5L170.8,183.3L170.6,184.6L169.5,185.4L168.7,184.2L168.0,184.7L165.4,191.9L162.9,185.0L161.1,185.6L161.2,183.8L160.3,183.2L157.7,186.0L156.8,189.5L155.2,191.7L152.8,192.0L152.0,191.1L150.0,191.6L149.6,192.7L148.8,192.1L148.7,186.9L147.2,185.1L146.6,182.0L148.1,181.7L147.3,179.6L148.8,178.9L149.2,175.2L152.5,171.5L152.6,169.3L156.0,169.8L155.3,168.8L155.9,164.8L154.8,163.6L155.9,162.2L156.0,160.2L153.3,156.7L155.4,155.6L157.8,152.4L156.6,149.1L156.8,146.4L155.2,143.1L154.0,143.0L153.4,141.7L151.9,141.7L151.2,138.0L152.9,136.1L156.3,136.0L157.8,135.1L157.0,131.9L158.1,132.0L160.0,129.3L160.9,130.1L165.0,127.6L166.4,127.8L169.8,131.3L171.3,130.2L172.9,131.1L174.7,130.3L175.1,132.1L177.0,131.3L177.1,130.2L178.0,130.0L177.6,129.2L178.7,129.2L181.0,135.5L186.2,137.7L186.0,142.0L184.5,142.7L184.0,145.1L186.9,146.5L190.5,145.7L192.0,146.9L194.2,145.0L194.6,142.7L196.6,143.6L197.7,142.7L198.9,143.6L199.6,142.5L200.7,143.0L200.2,143.8L201.3,144.5L201.2,146.2L202.2,146.3Z","PACA":"M246.6,191.6L246.2,194.0L244.6,195.3L246.3,198.0L245.4,198.5L245.3,200.3L247.8,204.0L250.9,204.9L253.4,206.9L254.6,206.7L255.0,207.6L261.6,205.9L261.3,207.1L262.2,209.1L261.0,211.8L257.8,215.2L258.5,217.4L257.4,218.5L252.6,220.3L251.9,221.6L250.9,221.4L250.1,224.2L247.1,224.6L245.4,228.1L242.2,228.8L241.7,230.6L239.1,232.6L241.4,232.9L239.9,236.1L238.6,235.2L237.3,236.3L235.5,236.4L234.7,238.2L231.4,237.4L230.5,238.2L230.4,240.0L229.6,239.7L229.7,238.5L227.8,238.5L225.5,237.2L225.5,238.3L223.7,239.4L223.4,237.7L220.1,235.3L219.0,236.0L217.6,234.5L213.7,234.5L214.3,233.5L213.3,230.2L207.5,231.0L205.3,227.9L203.9,228.8L204.2,230.1L203.3,231.0L198.2,230.1L198.2,228.0L196.8,227.3L191.0,227.1L191.2,226.0L195.5,223.5L196.0,222.7L195.0,222.4L196.2,220.0L199.1,220.3L199.4,215.0L203.5,211.5L202.4,209.1L200.7,208.0L201.0,205.5L199.6,203.5L199.6,201.2L202.7,202.0L203.2,204.3L208.0,201.9L208.8,202.7L210.2,201.9L209.9,204.2L214.0,204.7L216.0,207.5L217.8,207.1L218.5,205.5L220.6,206.7L219.9,206.1L220.5,202.9L219.6,202.6L219.3,201.2L216.8,201.0L215.6,200.1L215.3,198.4L216.9,198.0L216.2,197.7L216.5,196.4L219.1,197.2L220.3,196.1L218.9,194.9L219.8,191.7L222.9,191.6L223.6,189.0L226.8,187.8L226.1,187.1L226.7,186.7L227.8,186.1L228.3,186.8L229.8,185.4L234.4,185.6L233.8,181.3L231.3,180.9L232.5,177.5L236.4,179.8L237.6,178.1L239.8,177.7L240.9,180.7L242.4,180.8L242.5,184.1L244.8,185.7L247.8,186.1L247.6,187.6L249.2,190.8L247.3,190.6L246.6,191.6ZM235.3,241.1L235.0,240.5L235.8,240.4L235.3,241.1ZM232.2,240.2L231.4,241.3L230.5,240.8L232.2,240.2ZM204.5,200.2L205.0,198.9L206.5,198.5L207.8,200.2L206.3,202.2L204.5,202.0L204.5,200.2Z","COR":"M296.8,274.8L296.5,280.7L294.4,282.3L294.6,283.0L296.0,282.6L293.1,287.2L293.7,288.2L293.0,289.4L290.4,288.5L290.5,287.2L289.4,286.4L286.2,285.4L284.0,282.8L286.8,279.9L282.1,278.1L283.0,277.3L282.6,276.6L284.1,275.7L284.1,272.9L280.6,273.6L280.3,272.0L283.2,268.8L279.9,266.0L279.6,263.6L282.2,262.3L280.7,260.2L279.4,260.3L280.5,258.2L281.5,258.2L281.7,255.3L283.6,253.6L284.2,254.0L284.6,252.8L288.8,251.6L291.1,248.8L293.1,248.7L294.5,250.5L295.1,249.8L295.9,240.6L298.0,241.3L298.6,247.0L297.7,250.6L299.3,253.8L300.0,262.2L299.8,267.5L297.0,271.9L296.8,274.8Z"}};
