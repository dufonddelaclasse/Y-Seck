// Intégration des recherches du 22 octobre 2026 sur les fiches métiers sans concours (data/research/2026-10-22-metiers/out) :
// nouveaux concours et corps, liens métier / corps, organisation des concours, calendrier, et explication précise du
// recrutement des métiers qui s’exercent sans concours (lien officiel direct, jamais un site généraliste).
// Relançable sans doublon : les sorties de ce script sont exclues de la lecture. Usage : node scripts/integrate_metiers.mjs
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const CHECKED = '2026-10-22', TODAY = '2026-10-22';
const RESEARCH = 'data/research/2026-10-22-metiers/';
const OUT = {
  concours: 'catalogue/ref-concours-05.json', routes: 'catalogue/ref-routes-03.json', exam: 'catalogue/ref-exam-details-03.json',
  links: 'catalogue/ref-links-10.json', calendar: 'catalogue/calendar-metiers-2026-10-22.json', jobs: 'catalogue/job-recruitment-01.json'
};
const read = p => JSON.parse(fs.readFileSync(new URL(p, root), 'utf8'));
const write = (p, obj, indent) => fs.writeFileSync(new URL('data/' + p, root), JSON.stringify(obj, null, indent) + '\n');
const log = [];
const note = s => { log.push(s); };

/* ---------- Catalogue existant (sans les sorties de ce script) ---------- */
const manifest = read('data/catalogue.json');
const outParts = Object.values(OUT);
const base = {};
for (const part of manifest.parts) {
  if (outParts.includes(part)) continue;
  for (const [k, v] of Object.entries(read('data/' + part))) { if (Array.isArray(v)) (base[k] ||= []).push(...v); else base[k] = v; }
}
const routesById = {}; base.routes.forEach(r => { routesById[r.id] = r; });
const concoursById = {}; base.concours.forEach(c => { concoursById[c.id] = c; });
const jobsById = {}; (base.legacyJobs || []).concat(base.rmfp || []).filter(j => j.active !== false).forEach(j => { jobsById[j.id] = j; });
const auditFix = {}; (base.jobCorrections || []).forEach(f => { auditFix[f.id] = Object.assign(auditFix[f.id] || {}, f); });
/* Catégories et versant affichés par l’application (après l’audit). */
const jobCats = j => (auditFix[j.id] && auditFix[j.id].categories) || (j.categories && j.categories.length ? j.categories : [j.cat]);
const jobFp = j => (auditFix[j.id] && auditFix[j.id].fp) || j.fp;

/* ---------- Recherches ---------- */
const exists = p => fs.existsSync(new URL(p, root));
/* S3 d’abord : ses concours, publiés les premiers (É-105 à É-108), gardent leur numéro. */
const LOTS = ['S3', 'S1', 'S2'].filter(lot => exists(RESEARCH + 'out/' + lot + '.json') || (note('Lot ' + lot + ' non encore livré.'), false));
const lots = {}, research = { concours: [], jobs: [], noConcours: [] };
for (const lot of LOTS) {
  lots[lot] = read(RESEARCH + 'lots/lot-' + lot + '.json').map(j => j.id);
  const verified = exists(RESEARCH + 'out/' + lot + '.verified.json');
  const out = read(RESEARCH + 'out/' + lot + (verified ? '.verified.json' : '.json'));
  for (const k of Object.keys(research)) (out[k] || []).forEach(x => research[k].push(Object.assign(x, { _lot: lot })));
}

/* Textes affichés : apostrophe typographique, jamais de tiret cadratin. */
function clean(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/([A-Za-zÀ-ÿ])'([A-Za-zÀ-ÿ])/g, '$1’$2').replace(/\s+—\s+/g, ', ').replace(/—/g, ',').trim();
}
const hasValue = v => v !== null && v !== undefined && String(v).trim() !== '';
const GENERIC = /choisirleservicepublic|fonction-publique\.gouv\.fr\/?$|service-public\.fr\/?$|onisep\.fr\/?$/;
const isOfficialLink = u => /^https:\/\//.test(u || '') && !/calendrier-general-concours/.test(u) && !GENERIC.test(u);

/* ---------- Orientation des nouveaux concours ---------- */
/* Champs du parcours (collège, lycée, études, préparation) copiés d’un concours proche, puis adaptés (o). */
const ORIENTATION = ['college', 'collegeOption', 'lyceeGeneral', 'lyceeTechno', 'lyceePro', 'lyceeWhy', 'stage', 'optionSeconde', 'optionTerminale', 'studies', 'l1', 'l2', 'l3', 'master', 'prepa', 'afterBac', 'vigilance'];
const ARMY_STAGE = 'Rencontrer un centre d’information et de recrutement des forces armées (CIRFA) ; préparation militaire ou cadets de la Défense selon l’âge. Pour la 3e ou la seconde : entretien métier ou stage uniquement si accueil possible.';
/* Parcours des concours de médecins et de pharmaciens (doctorat exigé). */
const MED = { lyceeGeneral: 'Sciences de la vie et de la Terre (SVT) ; Physique-chimie ; Mathématiques', lyceeTechno: 'Sciences et technologies de laboratoire (STL), accès plus difficile aux études de santé', lyceePro: 'Bac général conseillé : les études de santé demandent de solides bases scientifiques', lyceeWhy: 'Biologie, chimie, sciences du vivant, relations humaines', stage: 'Demander à rencontrer un médecin ou un pharmacien d’un hôpital public ou d’un service de santé publique. Pour la 3e ou la seconde : entretien métier ou stage uniquement si accueil possible.', optionSeconde: 'Biotechnologies ou Santé et social en seconde, selon offre', optionTerminale: 'Mathématiques complémentaires en terminale si mathématiques non conservées en spécialité', studies: 'Études de médecine à l’université : 9 à 12 ans avec l’internat, jusqu’au doctorat', l1: 'Première année d’accès aux études de santé (PASS ou L.AS)', l2: 'Premier cycle des études de médecine', l3: 'Fin du premier cycle, puis deuxième cycle', master: 'Deuxième cycle, internat de spécialité et thèse de doctorat en médecine', afterBac: 'Non : doctorat en médecine exigé' };
const PHARMA = Object.assign({}, MED, { stage: 'Demander à rencontrer un pharmacien d’un hôpital public ou d’une agence régionale de santé (ARS). Pour la 3e ou la seconde : entretien métier ou stage uniquement si accueil possible.', studies: 'Études de pharmacie à l’université : 6 ans jusqu’au doctorat, souvent suivis de l’internat (DES)', l2: 'Premier cycle des études de pharmacie', master: 'Deuxième et troisième cycles de pharmacie, thèse de doctorat', afterBac: 'Non : doctorat en pharmacie exigé' });
/* Parcours des enseignements artistiques (conservatoires, écoles d’art). */
const ARTS = { lyceeGeneral: 'Arts (musique, danse, théâtre ou arts plastiques) ; Humanités, littérature et philosophie (HLP)', lyceeTechno: 'Sciences et technologies du théâtre, de la musique et de la danse (S2TMD)', lyceePro: 'Bacs professionnels des métiers d’art, selon la discipline', lyceeWhy: 'Pratique artistique intensive, culture artistique, pédagogie', stage: 'Observer un conservatoire ou une école d’art municipale. Pour la 3e ou la seconde : entretien métier ou stage uniquement si accueil possible.', optionSeconde: 'Option arts (musique, danse, théâtre, arts plastiques) en seconde, selon offre', optionTerminale: 'Option arts en terminale, selon offre', l1: 'Pôle supérieur, conservatoire national supérieur ou école supérieure d’art, première année', l2: 'Deuxième année : pratique, pédagogie et culture artistique', l3: 'Diplôme national supérieur professionnel ou diplôme national d’art (DNA)' };
const RECEPTION = { prepa: 'Aucune préparation : concours sur titres dans chaque hôpital (examen du dossier, parfois un entretien)', master: 'Non requis' };
const SPEC = {
  /* S1 : santé. */
  'NEW2-orthoptiste-fph': { donor: 'H-051', domain: 'Santé, soins, prévention', cardTitle: 'Concours sur titres des hôpitaux',
    o: Object.assign({ lyceeWhy: 'Sciences de la vie, physique (optique), mathématiques', studies: 'Certificat de capacité d’orthoptiste : 3 ans à l’université, accès par Parcoursup', l1: 'Orthoptie, première année : sciences de la vision', l2: 'Orthoptie, deuxième année : bilans, rééducation et stages', l3: 'Orthoptie, troisième année : stages cliniques et certificat de capacité', afterBac: 'Oui : certificat de capacité d’orthoptiste en 3 ans après le bac' }, RECEPTION) },
  'NEW2-pedicure-podologue-fph': { donor: 'H-051', domain: 'Santé, soins, prévention', cardTitle: 'Concours sur titres des hôpitaux',
    o: Object.assign({ lyceeWhy: 'Sciences de la vie, anatomie, relations humaines', studies: 'Diplôme d’État de pédicure-podologue : 3 ans en institut de formation, accès par Parcoursup', l1: 'Pédicurie-podologie, première année : sciences biomédicales', l2: 'Pédicurie-podologie, deuxième année : soins, appareillage et stages', l3: 'Pédicurie-podologie, troisième année : stages cliniques et diplôme d’État', afterBac: 'Oui : diplôme d’État de pédicure-podologue en 3 ans après le bac' }, RECEPTION) },
  'NEW2-praticien-hospitalier-cnph': { donor: 'É-100', domain: 'Santé, soins, prévention', cardTitle: 'Concours national de praticien hospitalier',
    o: Object.assign({}, MED, { studies: 'Études de médecine, de pharmacie ou d’odontologie à l’université, puis internat de spécialité', prepa: 'Aucune préparation particulière : le concours se passe après l’internat, sur dossier et entretien', afterBac: 'Non : doctorat en médecine, en pharmacie ou en odontologie exigé' }) },
  'NEW2-medecin-pharmacien-spp': { donor: 'É-100', domain: 'Santé, soins, prévention', cardTitle: 'Concours de médecin et pharmacien de sapeurs-pompiers',
    o: Object.assign({}, MED, { stage: 'Rencontrer le service de santé et de secours médical d’un service départemental d’incendie et de secours (SDIS) ; devenir jeune sapeur-pompier. Pour la 3e ou la seconde : entretien métier ou stage uniquement si accueil possible.', studies: 'Études de médecine ou de pharmacie à l’université, jusqu’au doctorat', prepa: 'Aucune préparation particulière : concours sur titres avec entretien ; être sapeur-pompier volontaire aide à connaître le métier', afterBac: 'Non : diplôme de docteur en médecine ou en pharmacie exigé' }) },
  'NEW2-medecin-territorial': { donor: 'É-100', domain: 'Santé, soins, prévention', cardTitle: 'Concours de médecin territorial',
    o: Object.assign({}, MED, { stage: 'Rencontrer un médecin de protection maternelle et infantile (PMI) ou de santé publique d’un département ou d’une ville. Pour la 3e ou la seconde : entretien métier ou stage uniquement si accueil possible.', prepa: 'Aucune préparation particulière : concours sur titres avec entretien, organisé par les centres de gestion' }) },
  'NEW2-misp': { donor: 'É-100', domain: 'Santé, soins, prévention', cardTitle: 'Concours de médecin inspecteur de santé publique',
    o: Object.assign({}, MED, { stage: 'Rencontrer une agence régionale de santé (ARS). Pour la 3e ou la seconde : entretien métier ou stage uniquement si accueil possible.', master: 'Doctorat en médecine, avec une formation en santé publique (spécialité ou master)', prepa: 'Aucune préparation particulière : concours après le doctorat, puis formation à l’École des hautes études en santé publique (EHESP)' }) },
  'NEW2-phisp': { donor: 'É-100', domain: 'Santé, soins, prévention', cardTitle: 'Concours de pharmacien inspecteur de santé publique',
    o: Object.assign({}, PHARMA, { prepa: 'Aucune préparation particulière : concours après le doctorat en pharmacie, puis formation à l’École des hautes études en santé publique (EHESP)' }) },
  'NEW2-medecin-education-nationale': { donor: 'É-100', domain: 'Santé, soins, prévention', lvl: 6, cardTitle: 'Concours de médecin de l’Éducation nationale',
    o: Object.assign({}, MED, { stage: 'Rencontrer l’infirmière ou le médecin scolaire de son établissement. Pour la 3e ou la seconde : entretien métier ou stage uniquement si accueil possible.', prepa: 'Aucune préparation particulière : concours sur titres et épreuve, puis formation à l’École des hautes études en santé publique (EHESP)' }) },
  'NEW2-tsss-pse': { donor: 'H-056', domain: 'Santé, soins, prévention', cardTitle: 'Concours de technicien sanitaire et de sécurité sanitaire',
    o: { lyceeGeneral: 'Sciences de la vie et de la Terre (SVT) ; Physique-chimie ; Mathématiques', lyceeTechno: 'Sciences et technologies de laboratoire (STL) ; Sciences et technologies de l’agronomie et du vivant (STAV)', lyceeWhy: 'Biologie, chimie, environnement, santé publique', stage: 'Observer le service santé-environnement d’une agence régionale de santé (ARS) ou le service d’hygiène d’une ville. Pour la 3e ou la seconde : entretien métier ou stage uniquement si accueil possible.', studies: 'BTS ou BUT en hygiène, sécurité et environnement, génie biologique ou métiers de l’eau (bac+2)', l1: 'BTS ou BUT, première année', l2: 'BTS ou BUT, deuxième année et concours', l3: 'Licence professionnelle utile, non exigée', master: 'Non requis', prepa: 'Préparations aux concours de catégorie B ; formation de 12 semaines à l’EHESP après le concours', afterBac: 'Oui : bac+2 exigé (BTS, BUT)' } },
  /* S2 : culture, enseignement, justice. */
  'NEW2-prof-tech-pjj': { donor: 'É-066', domain: 'Justice, droit, greffe', cardTitle: 'Concours de professeur technique de la PJJ',
    o: { studies: 'Licence (bac+3) dans la spécialité enseignée, ou cinq ans d’expérience de cadre', prepa: 'Préparations aux concours de la Justice, prépas Talents justice ; formation ensuite à l’École nationale de protection judiciaire de la jeunesse (ENPJJ)', afterBac: 'Non : licence exigée pour le concours externe' } },
  'NEW2-attache-dgse': { donor: 'É-002', domain: 'Sécurité, police, défense', cardTitle: 'Concours d’attaché de la DGSE',
    o: { lyceeGeneral: 'Langues, littératures et cultures étrangères et régionales (LLCER) ; Histoire-géographie, géopolitique et sciences politiques (HGGSP) ; Sciences économiques et sociales (SES)', lyceeWhy: 'Langues rares, géopolitique, analyse, discrétion', stage: 'Les services de renseignement n’accueillent pas de collégiens : découvrir leurs métiers lors d’un forum ou de la Journée défense et citoyenneté (JDC). Pour la 3e ou la seconde : entretien métier ou stage uniquement si accueil possible.', studies: 'Licence (bac+3) : langues et civilisations étrangères, droit, science politique, économie ou sciences', prepa: 'Licence ou master de langues orientales (Inalco), instituts d’études politiques (IEP), préparations aux concours administratifs', afterBac: 'Non : licence exigée, et habilitation de sécurité' } },
  'NEW2-plpa-maritime': { donor: 'É-102', domain: 'Enseignement, éducation', cardTitle: 'Concours de professeur de lycée professionnel agricole',
    o: { lyceePro: 'Bac professionnel maritime (conduite et gestion des entreprises maritimes, électromécanicien marine), puis BTS maritime', lyceeWhy: 'Navigation, mécanique navale, sécurité en mer, pédagogie', stage: 'Observer un lycée professionnel maritime. Pour la 3e ou la seconde : entretien métier ou stage uniquement si accueil possible.', studies: 'Licence, ou BTS maritime avec cinq ans de pratique professionnelle (navigation, pêche, mécanique navale)', prepa: 'Licence ou expérience professionnelle maritime ; formation des lauréats avec l’École nationale supérieure de formation de l’enseignement agricole (ENSFEA)', afterBac: 'Non : licence, ou BTS et cinq ans d’expérience professionnelle' } },
  'NEW2-dpcsr': { donor: 'É-002', domain: 'Sécurité, police, défense', cardTitle: 'Concours de délégué au permis de conduire',
    o: { lyceeWhy: 'Droit, sécurité routière, pédagogie, expression orale', stage: 'Observer une auto-école ou une action de prévention routière d’une préfecture. Pour la 3e ou la seconde : entretien métier ou stage uniquement si accueil possible.', studies: 'Licence (bac+3), souvent en droit, administration publique ou sciences ; permis de conduire exigé', prepa: 'Préparations aux concours administratifs de catégorie A (IPAG, CPAG) ; formation ensuite à l’Institut national de sécurité routière et de recherches (INSERR)', afterBac: 'Non : licence exigée et permis de conduire' } },
  'NEW2-pea-terr': { donor: 'T-076', domain: 'Culture, bibliothèque, patrimoine', cardTitle: 'Concours de professeur territorial d’enseignement artistique',
    o: Object.assign({}, ARTS, { studies: 'Conservatoire puis pôle supérieur ou conservatoire national supérieur, jusqu’au certificat d’aptitude (CA) ; école supérieure d’art en arts plastiques', master: 'Certificat d’aptitude aux fonctions de professeur (musique, danse, théâtre) ou bac+3 à bac+5 en arts plastiques', prepa: 'Pratique en conservatoire dès l’enfance ; certificat d’aptitude préparé dans les conservatoires nationaux supérieurs (CNSMD) et les pôles supérieurs', afterBac: 'Non : certificat d’aptitude exigé en musique, danse et théâtre ; bac+3 en arts plastiques' }) },
  'NEW2-atea': { donor: 'T-076', domain: 'Culture, bibliothèque, patrimoine', cardTitle: 'Concours d’assistant territorial d’enseignement artistique',
    o: Object.assign({}, ARTS, { studies: 'Conservatoire puis diplôme d’État de professeur de musique, de danse ou de théâtre (DE), ou diplôme de musicien intervenant (DUMI)', l3: 'Diplôme d’État (DE) ou DUMI', master: 'Non requis', prepa: 'Pratique en conservatoire dès l’enfance ; diplôme d’État préparé dans les pôles supérieurs et les centres de formation des enseignants de la musique et de la danse (CEFEDEM)', afterBac: 'Non : diplôme d’État de la discipline exigé (obligatoire en danse)' }) },
  'NEW2-deea': { donor: 'T-076', domain: 'Culture, bibliothèque, patrimoine', cardTitle: 'Concours de directeur d’établissement d’enseignement artistique',
    o: Object.assign({}, ARTS, { studies: 'Certificat d’aptitude aux fonctions de directeur de conservatoire, après une carrière d’enseignant artistique ; bac+3 en arts plastiques', master: 'Certificat d’aptitude aux fonctions de directeur (musique, danse, théâtre) ou diplôme d’école supérieure d’art', prepa: 'Expérience de professeur en conservatoire, puis certificat d’aptitude de directeur', afterBac: 'Non : certificat d’aptitude de directeur ou bac+3 en arts plastiques' }) },
  'NEW2-mcf': { donor: 'É-101', domain: 'Enseignement, éducation', cardTitle: 'Recrutement des maîtres de conférences',
    o: { stage: 'Assister à une conférence ouverte ou à la Fête de la science dans une université. Pour la 3e ou la seconde : entretien métier ou stage uniquement si accueil possible.', studies: 'Master puis doctorat (trois ans de thèse) dans la discipline enseignée', l3: 'Licence dans la discipline', master: 'Master, puis doctorat exigé', prepa: 'Doctorat, enseignement pendant la thèse et premières publications ; qualification par le Conseil national des universités (CNU)', afterBac: 'Non : doctorat exigé (bac+8)' } },
  'NEW2-musicien-garde-rep': { donor: 'É-068', domain: 'Culture, bibliothèque, patrimoine', military: true, cardTitle: 'Audition de la Garde républicaine',
    o: { lyceeGeneral: ARTS.lyceeGeneral, lyceeTechno: ARTS.lyceeTechno, lyceeWhy: 'Pratique instrumentale ou vocale intensive, condition physique', optionSeconde: ARTS.optionSeconde, optionTerminale: ARTS.optionTerminale, studies: 'Conservatoire jusqu’au diplôme d’études musicales (DEM) ou prix de conservatoire, souvent pôle supérieur', prepa: 'Pratique intensive en conservatoire ; audition devant un jury de la Garde républicaine', afterBac: 'Oui : recrutement sur audition dès que le niveau musical demandé est atteint' } },
  /* S3 : défense et sécurité civile. */
  'NEW2-ieta': { donor: 'É-097', domain: 'Sécurité, police, défense', military: true, cardTitle: 'Concours Mines-Télécom (statut IETA)',
    o: { lyceeWhy: 'Mathématiques, physique, informatique, anglais', studies: 'Classe préparatoire scientifique (MP, MPI, PC, PSI ou PT), deux ans', l1: 'Classe préparatoire scientifique, première année', l2: 'Classe préparatoire, deuxième année et concours Mines-Télécom', l3: 'Concours externe sur titres possible après un diplôme scientifique', master: 'Non requis pour la voie du concours Mines-Télécom', prepa: 'Classes préparatoires scientifiques, notamment dans les lycées de la Défense ; préparation militaire', afterBac: 'Non : deux années de classe préparatoire scientifique' } },
  'NEW2-ingenieur-armement': { donor: 'É-089', domain: 'Sécurité, police, défense', military: true, cardTitle: 'Corps des ingénieurs de l’armement',
    o: { stage: ARMY_STAGE, lyceeWhy: 'Mathématiques, physique, informatique, anglais', studies: 'Classe préparatoire scientifique puis École polytechnique ; doctorat ou diplôme d’ingénieur pour le concours sur titres', l1: 'Classe préparatoire scientifique, première année', l2: 'Classe préparatoire, deuxième année et concours de l’École polytechnique', l3: 'École polytechnique', master: 'Fin de l’École polytechnique, choix du corps selon le classement', prepa: 'Classes préparatoires scientifiques (MP, PC, PSI) ; concours de l’École polytechnique', afterBac: 'Non : classe préparatoire puis École polytechnique, ou bac+5 pour le concours sur titres' } },
  'NEW2-icd': { donor: 'É-081', domain: 'Sécurité, police, défense', cardTitle: 'Concours d’ingénieur civil de la défense',
    o: { stage: ARMY_STAGE, studies: 'Diplôme d’ingénieur ou master scientifique (bac+5) dans l’une des spécialités ouvertes', l1: 'Licence scientifique ou classe préparatoire, première année', l2: 'Licence scientifique ou classe préparatoire, deuxième année', l3: 'Licence ou première année d’école d’ingénieurs', master: 'Master ou diplôme d’ingénieur exigé (bac+5)', prepa: 'Aucune préparation particulière : sélection sur dossier puis entretien ; écoles d’ingénieurs et masters scientifiques', afterBac: 'Non : bac+5 exigé pour le concours externe' } },
  'NEW2-aam': { donor: 'É-096', domain: 'Sécurité, police, défense', military: true, cardTitle: 'Concours des affaires maritimes',
    o: { lyceeGeneral: 'Histoire-géographie, géopolitique et sciences politiques (HGGSP) ; Sciences économiques et sociales (SES) ; Mathématiques', lyceeTechno: 'Sciences et technologies du management et de la gestion (STMG)', lyceeWhy: 'Droit, économie, culture maritime, anglais, condition physique', studies: 'Licence de droit, d’économie, de science politique ou de sciences (bac+3)', l1: 'Licence, première année', l2: 'Licence, deuxième année', l3: 'Licence et préparation du concours', master: 'Utile mais non exigé : la licence suffit pour le concours externe', prepa: 'Instituts d’études politiques (IEP), préparations universitaires aux concours administratifs ; préparation physique', afterBac: 'Non : licence exigée pour le concours externe' } }
};
/* Inspecteur de l’enseignement agricole : emploi pourvu par sélection et détachement, sans concours. */
const NOT_CONCOURS_REFS = {
  'NEW2-iea': { jobId: 'fpens028', text: 'Il n’existe pas de concours d’inspecteur de l’enseignement agricole : c’est un emploi d’encadrement pourvu par sélection sur dossier et entretien, puis détachement. Il est ouvert aux fonctionnaires de catégorie A expérimentés, souvent d’anciens professeurs ou directeurs de l’enseignement agricole ; les appels à candidatures paraissent au Bulletin officiel du ministère de l’Agriculture.', url: 'https://info.agriculture.gouv.fr/boagri/instruction-2026-43/telechargement', label: 'Ministère de l’Agriculture : appel à candidatures pour l’inspection de l’enseignement agricole' }
};
research.concours = research.concours.filter(r => { const n = NOT_CONCOURS_REFS[r.ref]; if (n) research.noConcours.push(Object.assign({ _lot: r._lot }, n)); return !n; });
/* Rattachements écartés : la fiche du pharmacien hospitalier n’est pas celle de l’inspection de l’État (PHISP). */
const SKIP_JOBS = { 'NEW2-phisp': ['fpmed028'] };
for (const r of research.concours) if (SKIP_JOBS[r.ref]) r.jobs = (r.jobs || []).filter(id => !SKIP_JOBS[r.ref].includes(id));
/* Métiers sans concours : texte et lien officiel direct quand la recherche ne proposait qu’une offre d’emploi temporaire. */
const NO_FIXES = {
  fpsan019: { text: 'Les médecins de contrôle et d’aptitude de la police nationale ne forment pas un corps et ne passent pas de concours : après le diplôme d’État de docteur en médecine, le service médical statutaire de la police nationale les recrute comme médecins contractuels, sur des postes publiés au fil des besoins par le ministère de l’Intérieur.', url: 'https://www.fonction-publique.gouv.fr/devenir-agent-public/les-cas-de-recours-aux-agents-contractuels-au-sein-de-la-fonction-publique-de-letat', label: 'Le recrutement d’agents contractuels dans la fonction publique de l’État' }
};
for (const n of research.noConcours) if (NO_FIXES[n.jobId]) Object.assign(n, NO_FIXES[n.jobId]);
/* Liens remplacés : jamais choisirleservicepublic.gouv.fr, la page du ministère et l’avis au Journal officiel à la place. */
const URL_FIXES = {
  'NEW2-icd': { officialUrl: 'https://www.defense.gouv.fr/dga/nous-rejoindre/profil-ingenieur', sessions: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053586453' }
};
for (const r of research.concours) {
  const fix = URL_FIXES[r.ref] || {};
  if (fix.officialUrl) r.officialUrl = fix.officialUrl;
  else if (!isOfficialLink(r.officialUrl)) r.officialUrl = (r.sources || []).find(isOfficialLink) || r.officialUrl;
  for (const ses of r.sessions || []) if (!isOfficialLink(ses.url)) ses.url = fix.sessions || r.officialUrl;
}

/* ---------- Nouveaux corps ---------- */
const newRoutes = [], routeOfRef = {};
for (const r of research.concours) {
  if (!r.route) throw new Error('Concours sans corps : ' + r.ref);
  if (r.route.existing) {
    const route = routesById[r.route.existing];
    if (!route) throw new Error('Corps inconnu ' + r.route.existing + ' pour ' + r.ref);
    if (route.cat !== r.cat || !route.fp.includes(r.fp)) note('Corps ' + route.id + ' (' + route.cat + ' ' + route.fp + ') pour un concours ' + r.cat + ' ' + r.fp + ' : ' + r.ref);
    routeOfRef[r.ref] = route.id;
    continue;
  }
  const n = r.route.new, spec = SPEC[r.ref] || {};
  if (routesById[n.id]) throw new Error('Corps déjà présent : ' + n.id + ' (' + r.ref + ')');
  const route = { id: n.id, name: clean(n.name), cat: n.cat, lvl: n.lvl, fp: n.fp, cal: '', prep: '', source: r.officialUrl, access: 'Concours' };
  if (spec.cardTitle) route.cardTitle = spec.cardTitle;
  if (spec.military) route.military = true;
  newRoutes.push(route); routesById[route.id] = route; routeOfRef[r.ref] = route.id;
}

/* ---------- Nouveaux concours ---------- */
let number = Math.max(...base.concours.map(c => Number(c.id.slice(2)))) + 1;
const created = [], concoursOfRef = {};
for (const r of research.concours) {
  const spec = SPEC[r.ref];
  if (!spec) throw new Error('Concours de recherche sans orientation : ' + r.ref);
  const route = routesById[routeOfRef[r.ref]], donor = concoursById[spec.donor];
  if (!donor) throw new Error('Concours donneur inconnu ' + spec.donor + ' pour ' + r.ref);
  const id = (r.fp === 'T' ? 'T' : r.fp === 'H' ? 'H' : 'É') + '-' + String(number++).padStart(3, '0');
  const years = (r.sessions || []).map(s => s.session).filter(Boolean).sort();
  const c = { id, fp: r.fp, cat: r.cat, name: clean(spec.name || r.name), routeIds: [route.id] };
  if (spec.lvl || route.lvl) c.lvl = spec.lvl || route.lvl;
  Object.assign(c, {
    voies: clean(r.voies) || '', metiers: clean(r.metiers) || '', domain: spec.domain || clean(r.domain),
    condition: clean(r.condition) || '', epreuves: clean(r.epreuves) || '',
    variations: 'Selon voie, spécialité et session ; vérifier le texte en vigueur',
    sessions: r.epreuves ? [{ session: years.includes('2027') || !years.length ? '2027' : years[years.length - 1], text: clean(r.epreuves), caution: '', status: 'Recherche du 22 octobre 2026, à confirmer sur l’avis officiel', url: r.officialUrl }] : []
  });
  if (isOfficialLink(r.annalesUrl)) c.annales = { kind: 'Sujets et rapports de jury', years: '', url: r.annalesUrl, scope: c.name, caution: 'Vérifier la session et la voie.' };
  for (const k of ORIENTATION) c[k] = spec.o && spec.o[k] !== undefined ? spec.o[k] : donor[k];
  for (const k of ['description', 'school', 'organizer', 'trainingMonths', 'paidTraining', 'places', 'evolution']) if (hasValue(r[k])) c[k] = clean(r[k]);
  if (!isOfficialLink(r.officialUrl)) throw new Error('Lien officiel direct manquant pour ' + r.ref);
  Object.assign(c, { source: r.officialUrl, checked: r.checked || CHECKED, next: [], researchChecked: r.checked || CHECKED, researchConfidence: r.confidence, researchNotes: r.notes || '' });
  created.push(c); concoursOfRef[r.ref] = c;
}
const allConcours = base.concours.concat(created);

/* Organisation des concours des nouveaux corps. */
const examDetails = newRoutes.map(route => {
  const r = research.concours.find(x => routeOfRef[x.ref] === route.id);
  const url = [r.officialUrl].concat(r.sources || []).find(isOfficialLink);
  return {
    id: route.id + '__' + route.fp, routeId: route.id, fp: route.fp, name: (route.military && route.cat === 'B' ? 'Recrutement : ' : 'Concours : ') + route.name,
    org: clean(r.organizer), metro: 'Lieux précisés dans l’avis de chaque session.', om: 'Centres d’outre-mer précisés dans l’avis lorsque le concours en ouvre.',
    source: url, checked: CHECKED, cardTitle: route.cardTitle, officialLinks: [{ label: 'Page officielle du concours', url }]
  };
});

/* ---------- Liens métier / corps et catégories des métiers ---------- */
const rejected = new Set(base.links.filter(l => l.status === 'rejeté').map(l => l.jobId + '|' + l.routeId));
const present = new Set(base.links.map(l => l.id));
const links = [], corrections = {}, linkedJobs = new Set();
const NOTE = 'Rattachement vérifié le 22 octobre 2026 sur la page officielle du concours.';
function correction(jobId) { return corrections[jobId] || (corrections[jobId] = { id: jobId }); }
function link(jobId, c, why) {
  const job = jobsById[jobId];
  if (!job) { note('Métier absent : ' + jobId + ' (' + why + ')'); return; }
  /* Le concours ne s’affiche que si sa catégorie et son versant sont ceux du métier : on les ajoute au besoin. */
  const cats = jobCats(job);
  if (!cats.includes(c.cat)) { correction(jobId).categories = cats.filter(x => x !== 'V').concat(c.cat); note('Catégorie ' + c.cat + ' ajoutée à ' + jobId + ' (' + c.id + ')'); }
  const fp = jobFp(job);
  if (!fp.includes(c.fp)) { correction(jobId).fp = ['E', 'T', 'H'].filter(f => fp.includes(f) || f === c.fp).join(''); note('Versant ' + c.fp + ' ajouté à ' + jobId + ' (' + c.id + ')'); }
  const routeId = c.routeIds.find(id => routesById[id] && routesById[id].cat === c.cat && routesById[id].fp.includes(c.fp)) || c.routeIds[0];
  const id = jobId + '__' + routeId;
  if (rejected.has(jobId + '|' + routeId)) { note('Lien rejeté par l’audit, ignoré : ' + id); return; }
  linkedJobs.add(jobId);
  /* L’ancienne note générale disparaît : la fiche affiche désormais le concours. */
  correction(jobId).recruitment = null;
  if (present.has(id) || links.some(l => l.id === id)) return;
  links.push({ id, jobId, routeId, status: 'proposé', source: c.source || routesById[routeId].source, note: NOTE });
}
for (const r of research.concours) for (const jobId of r.jobs || []) link(jobId, concoursOfRef[r.ref], r.ref);
for (const j of research.jobs) for (const cid of j.existingConcours || []) {
  const c = concoursById[cid] || created.find(x => x.id === cid);
  if (!c) throw new Error('Concours existant inconnu ' + cid + ' pour ' + j.jobId);
  link(j.jobId, c, cid);
}
/* Métiers sans concours : explication précise et lien officiel direct. */
for (const n of research.noConcours) {
  if (!jobsById[n.jobId]) { note('Métier absent : ' + n.jobId); continue; }
  if (!isOfficialLink(n.url)) throw new Error('Lien généraliste ou absent pour ' + n.jobId + ' : ' + n.url);
  if (linkedJobs.has(n.jobId)) { note('Métier à la fois rattaché et sans concours, explication ignorée : ' + n.jobId); continue; }
  correction(n.jobId).recruitment = { text: clean(n.text), url: n.url, label: clean(n.label) || 'Page officielle du recrutement' };
}
/* Notes générales devenues inutiles (le métier affiche déjà un concours) : retirées, jamais de lien vers choisirleservicepublic. */
const linkedBefore = new Set(base.links.filter(l => l.status !== 'rejeté').map(l => l.jobId));
for (const [id, f] of Object.entries(auditFix)) {
  if (f.recruitment && GENERIC.test(f.recruitment.url) && !corrections[id]) {
    if (!linkedBefore.has(id)) throw new Error('Note générale sans concours ni explication : ' + id);
    correction(id).recruitment = null;
  }
}
/* Chaque métier des lots trouve un concours ou une explication. */
for (const [lot, ids] of Object.entries(lots)) for (const id of ids) {
  if (!linkedJobs.has(id) && !(corrections[id] && corrections[id].recruitment)) note('Métier sans résultat (' + lot + ') : ' + id);
}

/* ---------- Calendrier ---------- */
const MONTHS = /\d{1,2}(er)?\s+(janv|févr|fevr|mars|avr|mai|juin|juil|août|aout|sept|oct|nov|déc|dec)/i;
const monthOnly = (iso, label) => !!iso && hasValue(label) && !MONTHS.test(label);
const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const orgSlug = r => { const m = String(r.organizer || '').match(/\(([A-Z][A-Za-z0-9-]{1,9})\)/) || String(r.school || '').match(/\(([A-Z][A-Za-z0-9-]{1,9})/); return m ? slug(m[1]) : slug(r.organizer).slice(0, 30).replace(/-$/, ''); };
const TENTATIVE = /prévision|provisoire|à confirmer|indicati|sous réserve/i;
const ALL_VOIES = /^toutes les voies/i;
const baseCalendar = base.calendar.filter(x => !x.duplicateOf);
const sameVoie = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase() || ALL_VOIES.test(a || '') || ALL_VOIES.test(b || '');
const datesOf = x => [x.open, x.date || x.close, x.written, x.oral, x.results].filter(Boolean);
const isUpcoming = x => { const d = [x.date, x.written, x.oral].filter(Boolean); return d.some(v => v >= TODAY) || (!d.length && x.provisional); };
const sessionsOf = (c, list) => list.filter(x => x.fp === c.fp && (x.routeIds || []).some(id => c.routeIds.includes(id)));
const calendar = [], ids = new Set(baseCalendar.map(x => x.id));
let skippedDuplicates = 0, skippedPast = 0;
for (const r of research.concours) {
  const c = concoursOfRef[r.ref];
  const routeIds = c.routeIds.filter(id => routesById[id].cat === c.cat && routesById[id].fp.includes(c.fp));
  if (!routeIds.length) { note('Aucun corps compatible pour le calendrier de ' + c.id); continue; }
  const future = s => !datesOf(s).length || datesOf(s).some(d => d >= TODAY);
  const keepPast = !(r.sessions || []).some(future) && !sessionsOf(c, baseCalendar).length;
  for (const s of r.sessions || []) {
    if (!future(s) && !keepPast) { skippedPast++; continue; }
    const voie = clean(s.voie) || 'Toutes les voies';
    const duplicate = baseCalendar.concat(calendar).some(x => x.fp === c.fp && (x.routeIds || []).some(id => routeIds.includes(id)) && sameVoie(x.voie, voie) &&
      (s.close ? x.date === s.close : (s.written && x.written === s.written)));
    if (duplicate) { skippedDuplicates++; continue; }
    const year = s.session || (datesOf(s)[0] || '').slice(0, 4) || '2027';
    let id = ('metier-' + slug(c.id.replace('É', 'E')) + '-' + slug(voie) + '-' + year + '-' + orgSlug(r)).slice(0, 90).replace(/-$/, ''), n = 1;
    while (ids.has(id)) id = id.replace(/-\d+$/, '') + '-' + (++n);
    ids.add(id);
    const past = !future(s);
    const provisional = !past && (!!s.provisional || r.confidence === 'faible' || !datesOf(s).length || TENTATIVE.test([s.voie, s.openLabel, s.closeLabel, s.writtenLabel, s.oralLabel].join(' ')) || [['open', 'openLabel'], ['close', 'closeLabel'], ['written', 'writtenLabel'], ['oral', 'oralLabel']].some(([d, l]) => monthOnly(s[d], s[l])));
    calendar.push({
      id, name: c.name, rawName: c.name + ' · ' + voie + ' · session ' + year, cat: c.cat, fp: c.fp, voie, url: isOfficialLink(s.url) ? s.url : r.officialUrl,
      source: clean(r.organizer) + ' ; recherche du 22 octobre 2026', checked: r.checked || CHECKED,
      open: s.open || null, date: s.close || null, openLabel: clean(s.openLabel) || '', closeLabel: clean(s.closeLabel) || '',
      written: s.written || null, writtenLabel: clean(s.writtenLabel) || '', oral: s.oral || null, oralLabel: clean(s.oralLabel) || '',
      routeIds, provisional, employer: clean(s.employer || r.organizer)
    });
  }
}
const calendarExpected = [];
for (const r of research.concours) {
  const c = concoursOfRef[r.ref];
  if (!hasValue(r.expected) || sessionsOf(c, baseCalendar.concat(calendar)).some(isUpcoming)) continue;
  calendarExpected.push({ concours: c.id, voie: 'Toutes les voies', expected: clean(r.expected), url: r.officialUrl, checked: r.checked || CHECKED });
}

/* ---------- Écriture ---------- */
write(OUT.concours, { concours: created });
write(OUT.routes, { routes: newRoutes });
write(OUT.exam, { examDetails });
write(OUT.links, { links });
write(OUT.calendar, { calendar, calendarExpected }, 1);
write(OUT.jobs, { jobCorrections: Object.values(corrections) });
/* Manifeste : concours, corps et liens avant audit-01 ; explications du recrutement après lui (elles complètent l’audit). */
const parts = manifest.parts.filter(p => !outParts.includes(p));
const at = parts.indexOf('catalogue/audit-01.json');
parts.splice(at < 0 ? parts.length : at, 0, OUT.concours, OUT.routes, OUT.exam, OUT.links, OUT.calendar);
parts.splice(parts.indexOf('catalogue/audit-01.json') + 1, 0, OUT.jobs);
manifest.parts = parts;
fs.writeFileSync(new URL('data/catalogue.json', root), JSON.stringify(manifest, null, 2) + '\n');

console.log('Recherches lues :', research.concours.length, 'concours,', research.jobs.length, 'métiers vers des concours existants,', research.noConcours.length, 'métiers sans concours');
console.log('Concours :', created.length, 'nouveaux' + (created.length ? ' (' + created[0].id + ' à ' + created[created.length - 1].id + ')' : '') + ' ; corps :', newRoutes.length, '; liens :', links.length);
console.log('Métiers rattachés :', linkedJobs.size, '; explications :', Object.values(corrections).filter(c => c.recruitment).length, '; catégories ou versants ajoutés :', Object.values(corrections).filter(c => c.categories || c.fp).length);
console.log('Calendrier :', calendar.length, 'sessions,', skippedDuplicates, 'doublons,', skippedPast, 'passées ignorées ;', calendarExpected.length, 'sessions attendues');
if (log.length) console.log(log.map(s => '  · ' + s).join('\n'));
