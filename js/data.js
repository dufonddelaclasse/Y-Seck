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
    { id: 'A+', dip: 'Bac+3 minimum, souvent Bac+5', role: 'Diriger, encadrer au plus haut niveau', ex: 'Administrateur·rice de l’État, directeur·rice d’hôpital, magistrat·e, commissaire', tint: 'tint-blue',
      note: 'Concours nationaux, suivis d’une école (INSP, INET, EHESP, ENM, ENSP, INP). Des concours Talents sont réservés aux élèves des Prépas Talents.' },
    { id: 'A', dip: 'Bac+3 minimum', role: 'Concevoir, encadrer, décider', ex: 'Attaché·e, inspecteur·rice, professeur·e, infirmier·ère', tint: 'tint-mint',
      note: 'Certains corps demandent un Bac+5 (ingénieur·es, psychologues).' },
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
      { id: 'privees', t: 'Préparations privées', price: 'Payant', budget: 2, d: 'À distance ou en présentiel. Tarifs très variables : comparez.' }
    ],
    talentsMapUrl: 'https://www.fonction-publique.gouv.fr/cartographie-prepas-talents',
    ipagUrl: 'https://www.ipag-cpag.fr',
    ipagDistanceUrl: 'https://www.ipag-cpag.fr/Les-formations-a-distance-Licence-Master.html',

    legal: {
      publisher: 'Yacine Seck',
      contact: 'yacineseckdore@gmail.com',
      director: 'Yacine Seck',
      design: 'Roche Conseil',
      host: 'GitHub, Inc. (GitHub Pages)',
      hostAddress: '88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis',
      updated: '15 octobre 2026'
    }
  };
})();
