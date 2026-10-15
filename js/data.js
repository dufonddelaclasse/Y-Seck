/* Données de démonstration du POC.
   À brancher plus tard sur une source maintenue (fiches métiers, calendrier officiel). */

window.DATA = {
  domains: ['Santé', 'Sécurité', 'Justice', 'Éducation', 'Environnement', 'Numérique', 'Administration', 'Culture', 'Social', 'Défense', 'Finances', 'Transports', 'Sport', 'Recherche'],

  levels: {
    school: ['6e', '5e', '4e', '3e', 'Seconde', 'Première', 'Terminale', 'Bac+1 / +2', 'Bac+3', 'Bac+5'],
    adult: ['Sans diplôme', 'Brevet', 'CAP / BEP', 'Bac', 'Bac+2', 'Bac+3', 'Bac+5']
  },

  categories: [
    { id: 'A', dip: 'Bac+3 minimum', role: 'Concevoir, encadrer, décider', ex: 'Attaché·e, inspecteur·rice, commissaire', tint: 'tint-mint' },
    { id: 'B', dip: 'Bac minimum', role: 'Appliquer, rédiger, gérer', ex: 'Greffier·ère, contrôleur·se, technicien·ne', tint: 'tint-cyan' },
    { id: 'C', dip: 'Brevet, CAP, BEP ou sans diplôme', role: 'Exécuter, accueillir, assurer', ex: 'Le brevet suffit pour certains concours. Adjoint·e administratif·ve, agent·e technique', tint: 'tint-yellow' }
  ],

  conditions: [
    'Nationalité française ou européenne, selon les postes',
    'Jouir de ses droits civiques',
    'Casier judiciaire compatible avec le poste',
    'Pas de limite d’âge, sauf exceptions'
  ],

  /* access : comment on entre ; dip : diplôme demandé ; cat : A, B, C ou X (contrat) */
  jobs: [
    { id: 'greffier', name: 'Greffier·ère', domain: 'Justice', cat: 'B', dip: 'Bac', access: 'Concours',
      desc: 'Garant·e de la procédure au tribunal. Assiste les magistrat·es, rédige et authentifie les actes.',
      steps: ['Obtenir le bac', 'Réussir le concours externe', 'Formation à l’École nationale des greffes'],
      ladder: [['Greffier·ère', 'B'], ['avancement'], ['Greffier·ère principal·e', 'B'], ['concours interne'], ['Directeur·rice des services de greffe', 'A']] },
    { id: 'cpip', name: 'Conseiller·ère pénitentiaire d’insertion et de probation', domain: 'Justice', cat: 'A', dip: 'Bac+3', access: 'Concours',
      desc: 'Accompagne les personnes condamnées, en prison ou en milieu ouvert, pour préparer leur réinsertion.',
      steps: ['Obtenir une licence', 'Réussir le concours externe', 'Formation à l’École nationale d’administration pénitentiaire'] },
    { id: 'dsg', name: 'Directeur·rice des services de greffe', domain: 'Justice', cat: 'A', dip: 'Bac+3', access: 'Concours',
      desc: 'Dirige les greffes d’une juridiction : équipes, budget, organisation.',
      steps: ['Obtenir une licence', 'Réussir le concours externe', 'Formation à l’École nationale des greffes'] },
    { id: 'adjoint-adm', name: 'Adjoint·e administratif·ve', domain: 'Administration', cat: 'C', dip: 'Sans diplôme à CAP / BEP', access: 'Avec ou sans concours',
      desc: 'Accueil, courrier, dossiers : le premier maillon de tous les services publics.',
      steps: ['Selon le poste : sans diplôme, brevet ou CAP / BEP', 'Concours, ou recrutement direct sur dossier', 'Prise de poste'] },
    { id: 'attache', name: 'Attaché·e d’administration', domain: 'Administration', cat: 'A', dip: 'Bac+3', access: 'Concours ou contrat',
      desc: 'Pilote des projets, encadre une équipe, conseille la hiérarchie. Dans tous les ministères.',
      steps: ['Obtenir une licence', 'Réussir le concours des IRA', 'Un an de formation en IRA, rémunérée'] },
    { id: 'sa', name: 'Secrétaire administratif·ve', domain: 'Administration', cat: 'B', dip: 'Bac', access: 'Concours',
      desc: 'Gère des dossiers, un budget, des marchés. Un rôle clé entre les équipes et l’encadrement.',
      steps: ['Obtenir le bac', 'Réussir le concours externe', 'Prise de poste et formation'] },
    { id: 'ctrl-fip', name: 'Contrôleur·se des finances publiques', domain: 'Finances', cat: 'B', dip: 'Bac', access: 'Concours',
      desc: 'Impôts des particuliers et des entreprises, contrôle, conseil. Partout en France.',
      steps: ['Obtenir le bac', 'Réussir le concours externe', 'Formation à l’École nationale des finances publiques'] },
    { id: 'insp-fip', name: 'Inspecteur·rice des finances publiques', domain: 'Finances', cat: 'A', dip: 'Bac+3', access: 'Concours',
      desc: 'Contrôle fiscal, expertise, encadrement d’équipe.',
      steps: ['Obtenir une licence', 'Réussir le concours externe', 'Formation à l’École nationale des finances publiques'] },
    { id: 'gpx', name: 'Gardien·ne de la paix', domain: 'Sécurité', cat: 'B', dip: 'Bac', access: 'Concours',
      desc: 'Police nationale : sécurité publique, enquête, secours, sur le terrain.',
      steps: ['Obtenir le bac', 'Réussir le concours', 'Formation en école de police'] },
    { id: 'pol-adj', name: 'Policier·ère adjoint·e', domain: 'Sécurité', cat: 'X', dip: 'Sans diplôme', access: 'Contrat · 18 à 30 ans',
      desc: 'Seconde les policier·ères sur le terrain. Une porte d’entrée avant le concours.',
      steps: ['Avoir entre 18 et 30 ans', 'Tests de sélection', 'Formation, puis contrat'] },
    { id: 'tech-si', name: 'Technicien·ne des systèmes d’information', domain: 'Numérique', cat: 'B', dip: 'Bac', access: 'Concours',
      desc: 'Réseaux, postes de travail, assistance : fait tourner l’informatique d’un service.',
      steps: ['Obtenir le bac', 'Réussir le concours externe', 'Prise de poste'] },
    { id: 'dev', name: 'Développeur·se', domain: 'Numérique', cat: 'X', dip: 'Bac+3 à Bac+5', access: 'Contrat',
      desc: 'Construit les services numériques publics. Recrutement sur CV, souvent sans concours.',
      steps: ['Diplôme ou expérience en développement', 'Candidature sur CV et entretien', 'Contrat, CDI possible ensuite'] },
    { id: 'tech-env', name: 'Technicien·ne de l’environnement', domain: 'Environnement', cat: 'B', dip: 'Bac', access: 'Concours',
      desc: 'Protège la faune, la flore et l’eau sur le terrain, dans les parcs ou à l’OFB.',
      steps: ['Obtenir le bac', 'Réussir le concours', 'Formation puis prise de poste'] },
    { id: 'ide', name: 'Infirmier·ère', domain: 'Santé', cat: 'A', dip: 'Diplôme d’État', access: 'Recrutement sur titre',
      desc: 'Soins à l’hôpital public. Recruté·e avec le diplôme d’État infirmier.',
      steps: ['Obtenir le bac', 'Diplôme d’État infirmier en 3 ans', 'Candidature à l’hôpital'] },
    { id: 'as', name: 'Aide-soignant·e', domain: 'Santé', cat: 'B', dip: 'Diplôme d’État', access: 'Recrutement sur titre',
      desc: 'Soins du quotidien et accompagnement des patient·es à l’hôpital public.',
      steps: ['Formation au diplôme d’État d’aide-soignant·e', 'Candidature à l’hôpital', 'Prise de poste'] },
    { id: 'ass', name: 'Assistant·e de service social', domain: 'Social', cat: 'A', dip: 'Diplôme d’État', access: 'Concours sur titre',
      desc: 'Accompagne les personnes et les familles en difficulté.',
      steps: ['Obtenir le bac', 'Diplôme d’État d’assistant·e de service social', 'Concours sur titre ou recrutement'] },
    { id: 'educ', name: 'Éducateur·rice spécialisé·e', domain: 'Social', cat: 'A', dip: 'Diplôme d’État', access: 'Concours sur titre',
      desc: 'Accompagne enfants, jeunes et adultes en difficulté, dans les collectivités.',
      steps: ['Obtenir le bac', 'Diplôme d’État d’éducateur·rice spécialisé·e', 'Concours sur titre ou recrutement'] },
    { id: 'tsef', name: 'Technicien·ne supérieur·e d’études et de fabrications', domain: 'Défense', cat: 'B', dip: 'Bac+2', access: 'Concours',
      desc: 'Études techniques et suivi de fabrication pour le ministère des Armées.',
      steps: ['Obtenir un Bac+2 technique', 'Réussir le concours externe', 'Prise de poste'] },
    { id: 'acp', name: 'Assistant·e de conservation du patrimoine', domain: 'Culture', cat: 'B', dip: 'Bac', access: 'Concours',
      desc: 'Musées, bibliothèques, archives : conserve et fait découvrir les collections.',
      steps: ['Obtenir le bac', 'Réussir le concours', 'Prise de poste en collectivité'] },
    { id: 'etaps', name: 'Éducateur·rice des activités physiques et sportives', domain: 'Sport', cat: 'B', dip: 'Diplôme du sport', access: 'Concours',
      desc: 'Encadre le sport dans une commune : écoles, clubs, piscines, quartiers.',
      steps: ['Diplôme du sport (BPJEPS, STAPS)', 'Réussir le concours', 'Prise de poste en collectivité'] },
    { id: 'ie', name: 'Ingénieur·e d’études', domain: 'Recherche', cat: 'A', dip: 'Bac+3', access: 'Concours ou contrat',
      desc: 'Appuie les équipes de recherche dans les universités et les laboratoires publics.',
      steps: ['Obtenir une licence ou un master', 'Concours ou contrat', 'Prise de poste en laboratoire'] }
  ],

  /* Source : calendrier général des concours de la fonction publique d'État (fonction-publique.gouv.fr), consulté le 15/10/2026 */
  calendar: [
    { date: '2026-11-17', name: 'Contrôleur·se des finances publiques', meta: 'Externe · Finances', cat: 'B' },
    { date: '2026-11-19', name: 'Inspecteur·rice principal·e de la DGCCRF', meta: 'Interne · Finances', cat: 'A' },
    { date: '2026-12-08', name: 'Technicien·ne supérieur·e d’études et de fabrications', meta: 'Externe · Défense', cat: 'B' },
    { date: '2026-12-11', name: 'Colonel·le de sapeur·ses-pompier·ères professionnel·les', meta: 'Interne · Sécurité civile', cat: 'A' },
    { date: '2027-01-18', name: 'Gardien·ne de la paix', meta: 'Interne · Intérieur', cat: 'B' }
  ],
  calendarUrl: 'https://www.fonction-publique.gouv.fr/devenir-agent-public/calendrier-general-concours',

  tracks: {
    'Administratif': { tip: 'Les IPAG et CPAG sont les instituts des universités dédiés aux concours administratifs.', steps: [
      ['Bac général ou techno', 'Toutes les spécialités ouvrent la voie'],
      ['Licence', 'Droit, AES, économie, science politique'],
      ['Master ou IPAG', 'Administration publique, droit public'],
      ['Concours de catégorie A', 'IRA, attaché·e territorial·e, INSP']] },
    'Technique': { tip: 'Un BTS ou un BUT suffit pour viser la catégorie B technique.', steps: [
      ['Bac général, techno ou pro', 'Sciences, industrie, numérique'],
      ['BTS ou BUT', 'Informatique, génie civil, électronique'],
      ['Concours de catégorie B', 'Technicien·ne'],
      ['Évoluer en catégorie A', 'Ingénieur·e, par concours interne']] },
    'Social': { tip: 'Les diplômes d’État du social se préparent en 3 ans, après le bac.', steps: [
      ['Bac', 'Toutes séries'],
      ['Diplôme d’État en 3 ans', 'Assistant·e de service social, éducateur·rice spécialisé·e'],
      ['Concours ou recrutement', 'Catégorie A, État ou collectivités']] },
    'Dès le brevet': { tip: 'Le brevet suffit pour certains concours de catégorie C. Ensuite, on progresse par concours interne.', steps: [
      ['Brevet', 'Diplôme national du brevet'],
      ['CAP ou BEP', 'Utile pour certains concours, pas obligatoire partout'],
      ['Concours de catégorie C', 'Adjoint·e administratif·ve ou technique'],
      ['Évoluer en catégorie B', 'Par concours interne ou promotion']] }
  },

  noExam: [
    { t: 'Contractuel·le', d: 'Recruté·e sur CV et entretien, en CDD. Un CDI est possible après 6 ans.', bg: 'bg-mint' },
    { t: 'PACTE', d: 'De 16 à 28 ans, peu ou pas diplômé·e : un poste de catégorie C avec formation, puis titularisation.', bg: 'bg-cyan' },
    { t: 'Apprentissage', d: 'Un diplôme en alternance, payé, dans un service public.', bg: 'bg-yellow' },
    { t: 'Catégorie C sans concours', d: 'Certains premiers postes se décrochent sur dossier et entretien.', bg: 'cat-X' }
  ],
  jobsUrl: 'https://choisirleservicepublic.gouv.fr',

  /* budget : 0 = gratuit, 1 = moins de 1 000 €, 2 = plus */
  preps: [
    { t: 'Prépa Talents', price: 'Gratuit', budget: 0, talents: true, d: 'Concours A et B, tutorat renforcé. Sur dossier et entretien, sous conditions de ressources.' },
    { t: 'IPAG / CPAG', price: 'Frais d’université', budget: 1, d: 'Préparation aux concours administratifs, à l’université.' },
    { t: 'Master administration publique', price: 'Frais d’université', budget: 1, d: 'Diplôme et préparation aux concours de catégorie A.' },
    { t: 'Préparation privée', price: 'Payant', budget: 2, d: 'Tarifs très variables : comparez avant de vous engager.' }
  ],
  prepsMapUrl: 'https://www.fonction-publique.gouv.fr/devenir-agent-public/les-prepas-talents-pres-de-chez-vous'
};
