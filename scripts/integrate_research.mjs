// Intégration des recherches du 22 octobre 2026 (data/research/2026-10-22/out) dans le catalogue :
// concours existants complétés, nouveaux concours (écoles du service public), corps, liens métier / corps,
// organisation des concours, calendrier et sigles. Relançable sans doublon : les fichiers produits sont régénérés
// à partir des parts existantes (les sorties de ce script sont exclues de la lecture) et les mises à jour en place
// sont déterministes. Usage : node scripts/integrate_research.mjs
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const CHECKED = '2026-10-22', TODAY = '2026-10-22';
const RESEARCH = 'data/research/2026-10-22/out/';
const OUT = {
  concours: 'catalogue/ref-concours-04.json', routes: 'catalogue/ref-routes-02.json', links: 'catalogue/ref-links-09.json',
  exam: 'catalogue/ref-exam-details-02.json', sigles: 'catalogue/ref-glossaire-02.json', calendar: 'catalogue/calendar-research-2026-10-22.json'
};
const EXISTING_CONCOURS = ['catalogue/ref-concours-01.json', 'catalogue/ref-concours-02.json', 'catalogue/ref-concours-03.json'];
const read = p => JSON.parse(fs.readFileSync(new URL(p, root), 'utf8'));
const writeCompact = (p, obj) => fs.writeFileSync(new URL('data/' + p, root), JSON.stringify(obj) + '\n');
const writeIndented = (p, obj) => fs.writeFileSync(new URL('data/' + p, root), JSON.stringify(obj, null, 1) + '\n');
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
const jobsById = {}; (base.legacyJobs || []).concat(base.rmfp || []).filter(j => j.active !== false).forEach(j => { jobsById[j.id] = j; });

/* ---------- Recherches : fichier vérifié (tâche A) quand il existe ---------- */
const LOTS = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'N1', 'N2', 'N3', 'N4', 'N5'];
const research = [];
for (const lot of LOTS) {
  const verified = fs.existsSync(new URL(RESEARCH + lot + '.verified.json', root));
  for (const r of read(RESEARCH + lot + (verified ? '.verified.json' : '.json'))) research.push(Object.assign(r, { _lot: lot, _verified: verified }));
}
const byRef = {}; research.forEach(r => { byRef[r.ref] = r; });

/* Textes affichés : apostrophe typographique, et sigles ambigus écrits en toutes lettres. */
function clean(text, ref) {
  if (typeof text !== 'string') return text;
  let t = text.replace(/([A-Za-zÀ-ÿ])'([A-Za-zÀ-ÿ])/g, '$1’$2').replace(/\s+—\s+/g, ', ').replace(/—/g, ',');
  t = t.replace(/[Cc]oncours commun INP/g, 'concours commun des instituts nationaux polytechniques');
  /* ENM désigne la magistrature dans l’application : à Météo-France, c’est l’École nationale de la météorologie. */
  if (ref === 'NEW-itm' || ref === 'NEW-tsm') t = t.replace(/(^|[^(\wÀ-ÿ])(l’)?ENM(?![\wÀ-ÿ])/g, (m, pre, art) => pre + (art ? 'l’' : '') + 'École nationale de la météorologie');
  return t;
}
const hasValue = v => v !== null && v !== undefined && String(v).trim() !== '';
const isOfficialLink = u => /^https:\/\//.test(u || '') && !/calendrier-general-concours/.test(u);

/* ---------- B.1 : les 61 concours existants ---------- */
/* La catégorie du concours suit celle de son corps dans l’application, sinon ni métier lié ni calendrier :
   directeur des soins (dir-soins) et commissaire de police (commissaire) sont en A+. */
const CAT_FIXES = { 'H-050': 'A+', 'É-009': 'A+' };
const SOURCE_FIX = ['É-021', 'É-023', 'T-040', 'H-058'];
const SOURCE_FIX_IF_OFFICIAL = ['H-057', 'H-061'];
const existingFiles = EXISTING_CONCOURS.map(p => ({ path: p, data: read('data/' + p) }));
const existing = [].concat(...existingFiles.map(f => f.data.concours));
const concoursById = {}; existing.forEach(c => { concoursById[c.id] = c; });
let replaced = 0;
for (const c of existing) {
  const r = byRef[c.id];
  if (!r) { note('Sans recherche : ' + c.id); continue; }
  for (const k of ['description', 'school', 'organizer', 'trainingMonths', 'paidTraining', 'places', 'evolution']) if (hasValue(r[k])) c[k] = clean(r[k], r.ref);
  c.researchChecked = r._verified && r.checked ? r.checked : CHECKED;
  c.researchConfidence = r.confidence;
  c.researchNotes = r.notes || '';
  if (r.confidence === 'haute' || r.confidence === 'moyenne') {
    for (const k of ['voies', 'condition', 'epreuves', 'metiers']) {
      const v = clean(r[k], r.ref);
      /* Vérifiée sur les pages officielles (tâche A), la valeur fait foi ; sinon seulement si elle est plus précise. */
      if (hasValue(v) && v !== c[k] && (r._verified || v.length > String(c[k] || '').length)) { c[k] = v; replaced++; }
    }
  }
  if (!c.annales && hasValue(r.annalesUrl)) c.annales = { kind: 'Sujets et rapports de jury', years: '', url: r.annalesUrl, scope: c.name, caution: 'Vérifier la session et la voie.' };
  if (CAT_FIXES[c.id]) c.cat = CAT_FIXES[c.id];
  if (SOURCE_FIX.includes(c.id) && /^https:\/\//.test(r.officialUrl)) c.source = r.officialUrl;
  if (SOURCE_FIX_IF_OFFICIAL.includes(c.id) && r.officialUrl !== c.source && /ars\.sante\.fr|chu|hopital|ch-/i.test(r.officialUrl)) c.source = r.officialUrl;
}
note('Concours existants : ' + replaced + ' champs remplacés par une valeur de recherche plus précise.');

/* ---------- B.2 / B.3 : nouveaux concours et nouveaux corps ---------- */
/* Champs d’orientation copiés du concours donneur, puis adaptés au concours (o). */
const ORIENTATION = ['college', 'collegeOption', 'lyceeGeneral', 'lyceeTechno', 'lyceePro', 'lyceeWhy', 'stage', 'optionSeconde', 'optionTerminale', 'studies', 'l1', 'l2', 'l3', 'master', 'prepa', 'afterBac', 'vigilance'];
const ONE_STAGE = ' Pour la 3e ou la seconde : entretien métier ou stage uniquement si accueil possible.';
const SCI = { lyceeGeneral: 'Mathématiques ; Physique-chimie ; Numérique et sciences informatiques (NSI) ou Sciences de l’ingénieur (SI)', lyceeTechno: 'Sciences et technologies de l’industrie et du développement durable (STI2D)', optionTerminale: 'Mathématiques expertes en terminale si spécialité mathématiques conservée' };
const GEND_STAGE = 'Rencontrer une brigade de gendarmerie ou un centre d’information et de recrutement (CIR) ; préparation militaire gendarmerie possible dès 17 ans.' + ONE_STAGE;
const ARMY_STAGE = 'Rencontrer un centre d’information et de recrutement des forces armées (CIRFA) ; préparation militaire ou cadets de la Défense selon l’âge.' + ONE_STAGE;
const SPP_STAGE = 'Rencontrer une caserne de sapeurs-pompiers ; devenir jeune sapeur-pompier (JSP) ou sapeur-pompier volontaire.' + ONE_STAGE;
const HERITAGE = { lyceeGeneral: 'Histoire-géographie, géopolitique et sciences politiques (HGGSP) ; Humanités, littérature et philosophie (HLP) ; Arts (histoire des arts)', lyceeWhy: 'Histoire, histoire de l’art, langues, expression écrite', stage: 'Visiter un musée, un service d’archives ou un monument ; demander un entretien avec un conservateur.' + ONE_STAGE, l1: 'Histoire de l’art, archéologie ou histoire', l2: 'Spécialité : musées, archives, monuments historiques, archéologie ou patrimoine scientifique', l3: 'Culture générale, langues et préparation aux épreuves', master: 'Master d’histoire de l’art, d’archéologie ou d’archivistique conseillé ; diplôme de l’École du Louvre ou de l’École des chartes' };
const LIBRARY = { lyceeGeneral: 'Humanités, littérature et philosophie (HLP) ; Histoire-géographie, géopolitique et sciences politiques (HGGSP) ; toute spécialité selon intérêt', lyceeWhy: 'Culture générale, expression écrite, langues, numérique', stage: 'Rencontrer l’équipe d’une bibliothèque universitaire ou municipale.' + ONE_STAGE };
const DIPLO = { lyceeGeneral: 'Histoire-géographie, géopolitique et sciences politiques (HGGSP) ; Langues, littératures et cultures étrangères et régionales (LLCER) ; Sciences économiques et sociales (SES)', lyceeWhy: 'Langues étrangères, géopolitique, histoire, expression écrite' };
const VET = { lyceeGeneral: 'Sciences de la vie et de la Terre (SVT) ; Physique-chimie ; Mathématiques', lyceeTechno: 'Sciences et technologies de laboratoire (STL)', lyceeWhy: 'Biologie, chimie, sciences du vivant' };
const MILITARY_OFFICER = { stage: ARMY_STAGE, afterBac: 'Non : deux années de classe préparatoire, ou une licence pour le recrutement sur titres', l1: 'Classe préparatoire, première année', l2: 'Classe préparatoire, deuxième année et concours', l3: 'Recrutement sur titres possible après une licence', master: 'Non requis pour le concours sur épreuves', lyceeWhy: 'Condition physique, langues, mathématiques ou lettres selon la filière' };
const TEACH = { afterBac: 'Non : licence au moins' };

/* ref de recherche, versant et catégorie dans l’application, intitulé, corps (le premier porte l’organisation du concours),
   donneur des champs d’orientation, domaine, niveau du concours quand il diffère de celui du corps. */
const NEW = [
  { ref: 'NEW-enm', fp: 'E', cat: 'A+', name: 'Magistrat - Magistrate (concours de l’École nationale de la magistrature)', routes: ['magistrat'], donor: 'É-001', domain: 'Justice, droit, greffe',
    o: { prepa: 'Classes préparatoires intégrées (CPI) de l’ENM, instituts d’études judiciaires (IEJ) des facultés de droit, instituts d’études politiques (IEP), prépas Talents', studies: 'Licence puis master 1 de droit (bac+4 exigé pour le premier concours) ; IEP', l1: 'Introduction au droit, droit constitutionnel et méthodologie', l2: 'Droit civil, droit pénal et droit administratif', l3: 'Procédures civile et pénale, culture générale', master: 'Master 1 de droit au minimum ; master 2 de droit privé ou de sciences criminelles fréquent', afterBac: 'Non : bac+4 exigé pour le premier concours', lyceeWhy: 'Expression écrite, argumentation, culture générale, raisonnement juridique', stage: 'Assister à une audience publique au tribunal, ouverte à tous ; demander un entretien avec un magistrat ou un greffier.' + ONE_STAGE } },
  { ref: 'NEW-dsgj', fp: 'E', cat: 'A', name: 'Directeur - Directrice des services de greffe judiciaires', routes: ['dsg'], donor: 'É-012', domain: 'Justice, droit, greffe',
    o: { prepa: 'Instituts d’études judiciaires (IEJ), instituts de préparation à l’administration générale (IPAG), prépas Talents justice', studies: 'Licence de droit ou d’administration publique (bac+3)' } },
  { ref: 'NEW-cpip', fp: 'E', cat: 'A', name: 'Conseiller pénitentiaire - Conseillère pénitentiaire d’insertion et de probation (CPIP)', routes: ['cpip'], donor: 'É-012', domain: 'Justice, droit, greffe',
    o: { prepa: 'Licence de droit, de sciences sociales ou de psychologie ; prépas Talents justice ; IPAG', studies: 'Droit, sciences de l’éducation, psychologie, sociologie ou carrières sociales (bac+3)', lyceeTechno: 'Sciences et technologies de la santé et du social (ST2S) ou STMG' } },
  { ref: 'NEW-lieutenant-pen', fp: 'E', cat: 'A', name: 'Capitaine pénitentiaire', routes: ['capitaine-pen', 'corps-143f2d97d76a'], donor: 'É-012', domain: 'Justice, droit, greffe',
    o: { prepa: 'Licence de droit ou de sciences humaines ; prépas Talents justice ; préparation physique', studies: 'Droit, sciences humaines ou sécurité (bac+3)' } },
  { ref: 'NEW-educ-pjj', fp: 'E', cat: 'A', name: 'Éducateur - Éducatrice de la protection judiciaire de la jeunesse', routes: ['educ-pjj'], donor: 'É-012', domain: 'Justice, droit, greffe',
    o: { prepa: 'Licence de sciences de l’éducation, de psychologie ou de droit ; diplôme d’État d’éducateur spécialisé pour la voie sur titres ; prépas Talents justice', studies: 'Sciences de l’éducation, psychologie, sociologie, carrières sociales ou droit (bac+3)', lyceeTechno: 'Sciences et technologies de la santé et du social (ST2S)', lyceeWhy: 'Expression écrite et orale, psychologie, sociologie, droit des mineurs' } },
  { ref: 'NEW-dir-pjj', fp: 'E', cat: 'A', name: 'Directeur - Directrice des services de la protection judiciaire de la jeunesse', routes: ['dir-pjj'], donor: 'É-012', domain: 'Justice, droit, greffe',
    o: { prepa: 'IEJ, IPAG ou IEP ; prépas Talents justice', studies: 'Droit, sciences sociales ou administration publique (bac+3)' } },
  { ref: 'NEW-sog', fp: 'E', cat: 'B', name: 'Sous-officier - Sous-officière de gendarmerie', routes: ['sous-off-gend'], donor: 'É-016', domain: 'Sécurité, police, défense',
    o: { prepa: 'Préparation militaire gendarmerie ; classes préparatoires Talents de la gendarmerie ; entraînement physique ; réserve opérationnelle', studies: 'Bac exigé ; BUT carrières juridiques ou licence de droit utiles, jamais obligatoires', stage: GEND_STAGE, afterBac: 'Oui : le bac suffit pour le concours externe' } },
  { ref: 'NEW-eogn', fp: 'E', cat: 'A', name: 'Officier - Officière de gendarmerie (concours de l’EOGN)', routes: ['officier-gend', 'corps-f25b82f071a5', 'corps-1284fb947d8a'], donor: 'É-008', domain: 'Sécurité, police, défense',
    o: { prepa: 'Master de droit, IEP, école d’ingénieurs ou de commerce ; classes préparatoires Talents de la gendarmerie ; préparation physique ; réserve opérationnelle', studies: 'Master (bac+5) en droit, science politique, sciences, ingénierie ou gestion', master: 'Master ou diplôme d’ingénieur exigé pour le concours universitaire', afterBac: 'Non : bac+5 exigé pour le concours universitaire', stage: GEND_STAGE } },
  { ref: 'NEW-pts', fp: 'E', cat: 'B', name: 'Technicien - Technicienne de police technique et scientifique', routes: ['pts'], donor: 'É-019', domain: 'Sécurité, police, défense',
    o: { prepa: 'Bac général scientifique ou STL ; BUT génie biologique, chimie ou mesures physiques utiles', studies: 'Bac exigé ; BUT ou licence de biologie, de chimie ou de physique utiles', lyceeTechno: 'Sciences et technologies de laboratoire (STL)', lyceeWhy: 'Biologie, chimie, physique, rigueur et observation', stage: 'Rencontrer un policier lors d’une journée portes ouvertes ou d’un forum des métiers ; certains services ne peuvent accueillir des mineurs.' + ONE_STAGE, afterBac: 'Oui : le bac suffit pour le concours externe' } },
  { ref: 'NEW-inp', fp: 'E', cat: 'A+', name: 'Conservateur - Conservatrice du patrimoine de l’État (INP)', routes: ['conservateur'], donor: 'É-001', domain: 'Culture, bibliothèque, patrimoine',
    o: Object.assign({}, HERITAGE, { prepa: 'Préparations de l’École du Louvre, de l’INP (classe Talents) et des universités (masters d’histoire de l’art et d’archéologie)', studies: 'Histoire de l’art, archéologie, histoire, archivistique ou sciences (licence au moins, master conseillé)' }) },
  { ref: 'NEW-cons-terr-pat', fp: 'T', cat: 'A+', name: 'Conservateur territorial - Conservatrice territoriale du patrimoine', routes: ['conservateur'], donor: 'T-024', domain: 'Culture, bibliothèque, patrimoine',
    o: Object.assign({}, HERITAGE, { prepa: 'Préparations de l’École du Louvre, de l’INP (classe Talents) et des universités ; préparation du CNFPT pour les agents', studies: 'Histoire de l’art, archéologie, histoire, archivistique ou sciences (licence au moins, master conseillé)' }) },
  { ref: 'NEW-enssib', fp: 'E', cat: 'A+', name: 'Conservateur - Conservatrice des bibliothèques de l’État (Enssib)', routes: ['conservateur-bib-etat'], donor: 'É-001', domain: 'Culture, bibliothèque, patrimoine',
    o: Object.assign({}, LIBRARY, { prepa: 'Préparations universitaires aux concours des bibliothèques (centres régionaux de formation aux carrières des bibliothèques) ; préparation de l’Enssib', studies: 'Toute licence (lettres, histoire, sciences, droit) ; master conseillé' }) },
  { ref: 'NEW-biblio-etat', fp: 'E', cat: 'A', name: 'Bibliothécaire d’État', routes: ['bibliothecaire', 'corps-08e8a6d6b236'], donor: 'É-002', domain: 'Culture, bibliothèque, patrimoine',
    o: Object.assign({}, LIBRARY, { prepa: 'Centres régionaux de formation aux carrières des bibliothèques ; préparations universitaires', studies: 'Toute licence (bac+3) ; licence professionnelle métiers du livre ou master information et documentation utiles' }) },
  { ref: 'NEW-cons-terr-bib', fp: 'T', cat: 'A+', name: 'Conservateur territorial - Conservatrice territoriale des bibliothèques', routes: ['conservateur-bib'], donor: 'T-024', domain: 'Culture, bibliothèque, patrimoine',
    o: Object.assign({}, LIBRARY, { prepa: 'Préparations universitaires aux concours des bibliothèques ; préparation du CNFPT pour les agents', studies: 'Toute licence (lettres, histoire, sciences, droit) ; master conseillé' }) },
  { ref: 'NEW-attache-conservation', fp: 'T', cat: 'A', name: 'Attaché territorial - Attachée territoriale de conservation du patrimoine', routes: ['attache-conservation'], donor: 'T-026', domain: 'Culture, bibliothèque, patrimoine',
    o: Object.assign({}, HERITAGE, { prepa: 'Préparations du CNFPT et des universités ; École du Louvre', studies: 'Histoire de l’art, archéologie, archivistique ou histoire (licence au moins)', master: 'Selon spécialité : master d’histoire de l’art, d’archéologie ou d’archivistique utile' }) },
  { ref: 'NEW-ensai', fp: 'E', cat: 'A', name: 'Attaché statisticien - Attachée statisticienne de l’Insee (ENSAI)', routes: ['attache-insee'], donor: 'É-002', domain: 'Numérique, informatique',
    o: Object.assign({}, SCI, { lyceeGeneral: 'Mathématiques ; Sciences économiques et sociales (SES) ; Numérique et sciences informatiques (NSI)', prepa: 'Classes préparatoires scientifiques (MP, MPI, PC, PSI) pour l’option mathématiques ; licence d’économie ou de mathématiques appliquées pour l’option économie', studies: 'Mathématiques, statistique, économie ou informatique (classe préparatoire ou licence)', lyceeWhy: 'Mathématiques, statistiques, économie, informatique', l1: 'Mathématiques et probabilités', l2: 'Statistique et économie', l3: 'Analyse de données et programmation', master: 'Non requis : le diplôme de l’ENSAI est délivré à la sortie', stage: 'Rencontrer un service statistique (Insee, service statistique d’un ministère).' + ONE_STAGE }) },
  { ref: 'NEW-ensae', fp: 'E', cat: 'A+', name: 'Ingénieur - Ingénieure de la statistique, de l’économie et de la donnée (INSED)', routes: ['insed'], donor: 'É-001', domain: 'Numérique, informatique',
    o: Object.assign({}, SCI, { lyceeGeneral: 'Mathématiques ; Sciences économiques et sociales (SES) ; Numérique et sciences informatiques (NSI)', prepa: 'École polytechnique, écoles normales supérieures ou ENSAE (recrutement des élèves) ; master de statistique, d’économie ou de science des données pour les concours ouverts', studies: 'Mathématiques appliquées, statistique, économie ou science des données (master ou école d’ingénieurs)', lyceeWhy: 'Mathématiques, statistiques, économie, informatique', l1: 'Mathématiques et probabilités', l2: 'Statistique et économie', l3: 'Économétrie et science des données', master: 'Master ou diplôme d’ingénieur (bac+5)', afterBac: 'Non : bac+5 exigé', stage: 'Rencontrer un service statistique (Insee, service statistique d’un ministère).' + ONE_STAGE }) },
  { ref: 'NEW-insp-orient', fp: 'E', cat: 'A+', name: 'Administrateur - Administratrice de l’État, voie Orient de l’INSP', routes: ['admin-etat-orient'], donor: 'É-001', domain: 'Diplomatie et international',
    o: Object.assign({}, DIPLO, { prepa: 'Institut national des langues et civilisations orientales (Inalco) pour la langue ; IEP ; classes préparatoires Talents de l’INSP', studies: 'Langue rare (arabe, chinois, russe, persan, hindi...) à l’Inalco, science politique ou relations internationales (licence au moins)' }) },
  { ref: 'NEW-sae', fp: 'E', cat: 'A', name: 'Secrétaire des affaires étrangères (cadre général et cadre d’Orient)', routes: ['sae'], donor: 'É-002', domain: 'Diplomatie et international',
    o: Object.assign({}, DIPLO, { prepa: 'IEP ; Inalco pour le cadre d’Orient ; préparations universitaires aux concours des Affaires étrangères', studies: 'Science politique, droit, relations internationales ou langues (licence au moins)' }) },
  { ref: 'NEW-itpe', fp: 'E', cat: 'A', name: 'Ingénieur - Ingénieure des travaux publics de l’État (ENTPE)', routes: ['itpe'], donor: 'T-027', domain: 'Technique, urbanisme, infrastructures',
    o: { prepa: 'Classes préparatoires scientifiques (MP, PC, PSI, PT, TSI, ATS) ; BUT ou licence scientifique pour la voie sur titres', studies: 'Classe préparatoire scientifique, BUT génie civil ou licence de sciences' } },
  { ref: 'NEW-itm', fp: 'E', cat: 'A', name: 'Ingénieur - Ingénieure des travaux de la météorologie', routes: ['itm', 'corps-e3524ee43429'], donor: 'T-027', domain: 'Technique, urbanisme, infrastructures',
    o: { prepa: 'Classes préparatoires scientifiques (MP, PC, PSI) ; licence de physique ou de mathématiques pour le concours externe spécial', studies: 'Mathématiques, physique ou informatique (classe préparatoire ou licence scientifique)', lyceeWhy: 'Mathématiques, physique, informatique, géographie physique' } },
  { ref: 'NEW-tsm', fp: 'E', cat: 'B', name: 'Technicien supérieur - Technicienne supérieure de la météorologie', routes: ['tsm'], donor: 'É-019', domain: 'Technique, urbanisme, infrastructures',
    o: { prepa: 'Bac général à dominante scientifique ou STI2D ; préparation aux épreuves de mathématiques et de physique', studies: 'Bac exigé ; BTS ou BUT scientifique utiles', afterBac: 'Oui : le bac suffit pour le concours externe', lyceeWhy: 'Mathématiques, physique, informatique' } },
  { ref: 'NEW-itgce', fp: 'E', cat: 'A', name: 'Ingénieur - Ingénieure des sciences géographiques et du numérique (ISGN)', routes: ['isgn'], donor: 'T-027', domain: 'Technique, urbanisme, infrastructures',
    o: { prepa: 'Classes préparatoires scientifiques ; BUT, licence ou master de géomatique pour la voie sur titres', studies: 'Mathématiques, informatique, géographie ou géomatique', lyceeWhy: 'Mathématiques, informatique, géographie' } },
  { ref: 'NEW-icna', fp: 'E', cat: 'A', name: 'Ingénieur - Ingénieure du contrôle de la navigation aérienne (ICNA)', routes: ['icna'], donor: 'T-027', domain: 'Technique, urbanisme, infrastructures',
    o: { prepa: 'Classes préparatoires scientifiques (deux ans) ; L2 ou BUT scientifique', studies: 'Bac+2 scientifique : classe préparatoire, L2, BUT ou BTS', afterBac: 'Non : bac+2 scientifique exigé', lyceeWhy: 'Mathématiques, physique, anglais', master: 'Non requis' } },
  { ref: 'NEW-tseeac', fp: 'E', cat: 'B', name: 'Technicien supérieur - Technicienne supérieure des études et de l’exploitation de l’aviation civile (TSEEAC)', routes: ['tseeac'], donor: 'É-019', domain: 'Technique, urbanisme, infrastructures',
    o: { prepa: 'Bac général à dominante scientifique ou STI2D ; préparation aux épreuves de l’ENAC', studies: 'Bac exigé ; BTS ou BUT scientifique utiles', afterBac: 'Oui : le bac suffit pour le concours externe', lyceeWhy: 'Mathématiques, physique, anglais' } },
  { ref: 'NEW-ispv', fp: 'E', cat: 'A', name: 'Inspecteur - Inspectrice de santé publique vétérinaire (ISPV)', routes: ['ispv'], donor: 'É-001', domain: 'Santé, soins, prévention',
    o: Object.assign({}, VET, { prepa: 'Écoles nationales vétérinaires (Alfort, Lyon, Nantes, Toulouse), après une classe préparatoire BCPST ou le concours post-bac', studies: 'Diplôme d’État de docteur vétérinaire (six ans d’études au moins)', l1: 'Formation vétérinaire post-bac ou classe préparatoire BCPST', l2: 'Sciences vétérinaires', l3: 'Sciences vétérinaires et santé publique', master: 'Doctorat vétérinaire exigé pour le concours externe', afterBac: 'Non : diplôme de vétérinaire exigé', stage: 'Observer un vétérinaire ou une direction départementale de la protection des populations.' + ONE_STAGE }) },
  { ref: 'NEW-iae', fp: 'E', cat: 'A', lvl: 5, name: 'Ingénieur - Ingénieure de l’agriculture et de l’environnement (IAE)', routes: ['iae'], donor: 'T-027', domain: 'Technique, urbanisme, infrastructures',
    o: Object.assign({}, VET, { lyceeTechno: 'Sciences et technologies de l’agronomie et du vivant (STAV)', prepa: 'Écoles d’ingénieurs agronomes (Institut Agro, AgroParisTech) ; master en agronomie, environnement ou forêt pour le concours sur titres', studies: 'Agronomie, biologie, environnement ou forêt (bac+5 pour la voie sur titres)', lyceeWhy: 'Biologie, sciences de la Terre, chimie, mathématiques' }) },
  { ref: 'NEW-ipef', fp: 'E', cat: 'A+', name: 'Ingénieur - Ingénieure des ponts, des eaux et des forêts (IPEF)', routes: ['ipef'], donor: 'É-001', domain: 'Technique, urbanisme, infrastructures',
    o: Object.assign({}, SCI, { prepa: 'École polytechnique, écoles normales supérieures, AgroParisTech ou grandes écoles d’ingénieurs', studies: 'École d’ingénieurs ou école normale supérieure (bac+5)', lyceeWhy: 'Mathématiques, physique, sciences de la vie', l1: 'Classe préparatoire scientifique', l2: 'Classe préparatoire et concours des grandes écoles', l3: 'École d’ingénieurs', master: 'Diplôme d’ingénieur ou d’une école normale supérieure', afterBac: 'Non : grande école exigée' }) },
  { ref: 'NEW-enccrf', fp: 'E', cat: 'A', name: 'Inspecteur - Inspectrice de la concurrence, de la consommation et de la répression des fraudes', routes: ['dgccrf'], donor: 'É-002', domain: 'Économie, finances, contrôle',
    o: { prepa: 'IPAG, CPAG, licence de droit ou d’économie ; prépas Talents', studies: 'Droit, économie ou sciences (licence au moins)' } },
  { ref: 'NEW-spp', fp: 'T', cat: 'C', name: 'Sapeur-pompier professionnel - Sapeuse-pompière professionnelle', routes: ['spp'], donor: 'T-044', domain: 'Sécurité, police, défense',
    o: { prepa: 'Engagement comme sapeur-pompier volontaire ; jeunes sapeurs-pompiers (JSP) dès 11 ans ; préparation physique', studies: 'CAP ou BEP au moins ; bac professionnel Métiers de la sécurité utile', lyceePro: 'Baccalauréat professionnel Métiers de la sécurité', lyceeWhy: 'Condition physique, secourisme, sciences, travail en équipe', stage: SPP_STAGE, afterBac: 'Oui : un CAP ou un BEP suffit pour le concours externe' } },
  { ref: 'NEW-lieutenant-spp', fp: 'T', cat: 'B', name: 'Lieutenant - Lieutenante de sapeurs-pompiers professionnels', routes: ['lieutenant-spp'], donor: 'T-037', domain: 'Sécurité, police, défense',
    o: { prepa: 'Expérience de sapeur-pompier volontaire ; BUT hygiène, sécurité, environnement ; préparation physique', studies: 'Bac+2 (BUT, BTS ou L2), de préférence en sécurité, sciences ou techniques', stage: SPP_STAGE, afterBac: 'Non : bac+2 exigé pour le concours externe de 1re classe', lyceeWhy: 'Condition physique, sciences, secourisme, travail en équipe' } },
  { ref: 'NEW-capitaine-spp', fp: 'T', cat: 'A', name: 'Capitaine de sapeurs-pompiers professionnels', routes: ['capitaine-spp'], donor: 'T-032', domain: 'Sécurité, police, défense',
    o: { prepa: 'Licence ; expérience de sapeur-pompier volontaire ; préparation physique', studies: 'Licence en sciences, ingénierie, gestion des risques ou droit (bac+3)', stage: SPP_STAGE, lyceeWhy: 'Condition physique, sciences, secourisme, commandement' } },
  { ref: 'NEW-en3s', fp: 'E', cat: 'A+', name: 'Dirigeant - Dirigeante d’organisme de sécurité sociale (EN3S)', routes: ['en3s'], donor: 'É-002', domain: 'Administration, droit, politiques publiques',
    o: { prepa: 'IEP, IPAG, préparations de l’EN3S et prépas Talents', studies: 'Droit, économie, gestion ou science politique (licence au moins)', stage: 'Se renseigner auprès d’une caisse d’allocations familiales, d’une caisse primaire d’assurance maladie ou d’une Urssaf.' + ONE_STAGE } },
  { ref: 'NEW-saint-cyr', fp: 'E', cat: 'A', name: 'Officier - Officière de l’armée de Terre (concours de Saint-Cyr)', routes: ['officier-terre'], donor: 'É-008', domain: 'Sécurité, police, défense',
    o: Object.assign({}, MILITARY_OFFICER, { prepa: 'Classes préparatoires aux grandes écoles (lettres, sciences ou économie), notamment dans les lycées militaires et lycées de la Défense ; préparation militaire', studies: 'Classe préparatoire (deux ans) ou licence pour le recrutement sur titres' }) },
  { ref: 'NEW-navale', fp: 'E', cat: 'A', name: 'Officier - Officière de marine (concours de l’École navale)', routes: ['officier-marine'], donor: 'É-008', domain: 'Sécurité, police, défense',
    o: Object.assign({}, MILITARY_OFFICER, SCI, { lyceeWhy: 'Mathématiques, physique, anglais, natation et condition physique', prepa: 'Classes préparatoires scientifiques, notamment au lycée naval de Brest ; préparation militaire marine', studies: 'Classe préparatoire scientifique (deux ans) ou licence pour le recrutement sur titres' }) },
  { ref: 'NEW-air', fp: 'E', cat: 'A', name: 'Officier - Officière de l’armée de l’Air et de l’Espace (concours de l’École de l’air et de l’espace)', routes: ['officier-air'], donor: 'É-008', domain: 'Sécurité, police, défense',
    o: Object.assign({}, MILITARY_OFFICER, SCI, { lyceeWhy: 'Mathématiques, physique, anglais, condition physique', prepa: 'Classes préparatoires scientifiques, notamment au lycée militaire de l’air ; préparation militaire air', studies: 'Classe préparatoire scientifique (deux ans) ou licence pour le recrutement sur titres' }) },
  { ref: 'NEW-sous-officier-armees', fp: 'E', cat: 'B', name: 'Sous-officier - Sous-officière des armées', routes: ['sous-officier-armees'], donor: 'É-016', domain: 'Sécurité, police, défense',
    o: { prepa: 'Préparation militaire ; condition physique ; bac exigé', studies: 'Bac exigé (jusqu’à bac+3 dans la Marine) ; BTS ou BUT utiles selon la spécialité', stage: ARMY_STAGE, afterBac: 'Oui : recrutement sur dossier, tests et entretien après le bac', lyceeWhy: 'Condition physique, sciences ou techniques selon la spécialité, anglais' } },
  { ref: 'NEW-commissaire-armees', fp: 'E', cat: 'A', name: 'Commissaire des armées', routes: ['commissaire-armees'], donor: 'É-002', domain: 'Sécurité, police, défense',
    o: { prepa: 'IEP, licence ou master de droit, d’économie ou de gestion ; préparation physique', studies: 'Droit, économie, gestion ou science politique (licence au moins)', stage: ARMY_STAGE } },
  { ref: 'NEW-esa', fp: 'E', cat: 'A', lvl: 2, name: 'Médecin des armées (concours de l’École de santé des armées)', routes: ['medecin-armees'], donor: 'É-008', domain: 'Santé, soins, prévention',
    o: Object.assign({}, VET, { prepa: 'Préparation au concours après le bac (épreuves de sciences) ; condition physique', studies: 'Études de médecine à l’École de santé des armées et à l’université, à partir du bac', l1: 'Premier cycle des études de médecine', l2: 'Premier cycle des études de médecine', l3: 'Deuxième cycle des études de médecine', master: 'Doctorat en médecine à la fin du cursus', afterBac: 'Oui : concours ouvert l’année du bac', stage: ARMY_STAGE }) },
  { ref: 'NEW-agregation', fp: 'E', cat: 'A', lvl: 5, name: 'Professeur agrégé - Professeure agrégée (agrégation)', routes: ['corps-5ae8976bf71c'], donor: 'É-006', domain: 'Enseignement, éducation',
    o: Object.assign({}, TEACH, { prepa: 'Préparations universitaires à l’agrégation (master 2) ; écoles normales supérieures', studies: 'Master disciplinaire (bac+5)', master: 'Master 2, ou inscription en master 2, exigé pour le concours externe', afterBac: 'Non : master exigé' }) },
  { ref: 'NEW-caplp', fp: 'E', cat: 'A', name: 'Professeur - Professeure de lycée professionnel (CAPLP)', routes: ['plp'], donor: 'É-006', domain: 'Enseignement, éducation',
    o: Object.assign({}, TEACH, { prepa: 'Master MEEF en INSPE ; licence, ou expérience professionnelle pour certaines sections', studies: 'Licence disciplinaire ou professionnelle, puis master MEEF' }) },
  { ref: 'NEW-capeps', fp: 'E', cat: 'A', name: 'Professeur - Professeure d’éducation physique et sportive (CAPEPS)', routes: ['corps-109d430c82f0'], donor: 'É-006', domain: 'Enseignement, éducation',
    o: Object.assign({}, TEACH, { prepa: 'Licence STAPS (parcours éducation et motricité) puis master MEEF EPS', studies: 'Licence STAPS', lyceeGeneral: 'Éducation physique, pratiques et culture sportives (EPPCS) ; Sciences de la vie et de la Terre (SVT)', lyceeWhy: 'Sport, biologie, pédagogie' }) },
  { ref: 'NEW-psyen', fp: 'E', cat: 'A', name: 'Psychologue de l’Éducation nationale (PsyEN)', routes: ['psyen', 'corps-919c511897a5'], donor: 'É-006', domain: 'Enseignement, éducation',
    o: Object.assign({}, TEACH, { prepa: 'Licence puis master de psychologie (éducation, développement, conseil en orientation)', studies: 'Licence et master de psychologie', master: 'Master 2 de psychologie et titre de psychologue exigés à la titularisation', lyceeWhy: 'Sciences humaines, biologie, expression', afterBac: 'Non : licence de psychologie et master en cours' }) }
];

/* Nouveaux corps : un par école ou statut absent de l’application. military : métiers des armées, la note de recrutement reste affichée. */
const NEW_ROUTES = [
  { id: 'capitaine-pen', ref: 'NEW-lieutenant-pen', name: 'Capitaine pénitentiaire', cat: 'A', lvl: 4, fp: 'E', matchPattern: 'capitaine.*penitentiaire|officier.*penitentiaire|lieutenant.*penitentiaire|chef de detention', cardTitle: 'Concours de l’ENAP' },
  { id: 'dir-pjj', ref: 'NEW-dir-pjj', name: 'Directeur - Directrice des services de la protection judiciaire de la jeunesse', cat: 'A', lvl: 4, fp: 'E', matchPattern: 'directeur.*(pjj|protection judiciaire)', cardTitle: 'Concours de l’ENPJJ' },
  { id: 'officier-gend', ref: 'NEW-eogn', name: 'Officier - Officière de gendarmerie', cat: 'A', lvl: 5, fp: 'E', matchPattern: 'officier.*gendarmerie|commandant.*gendarmerie|gendarmerie.*(commandement|encadrement)', cardTitle: 'Concours de l’EOGN' },
  { id: 'pts', ref: 'NEW-pts', name: 'Technicien - Technicienne de police technique et scientifique', cat: 'B', lvl: 2, fp: 'E', matchPattern: 'police technique et scientifique|identite judiciaire|technicien.*scientifique.*police', cardTitle: 'Concours de la police scientifique' },
  { id: 'conservateur-bib-etat', ref: 'NEW-enssib', name: 'Conservateur - Conservatrice des bibliothèques', cat: 'A+', lvl: 4, fp: 'E', matchPattern: 'conservateur.*biblioth', cardTitle: 'Concours de l’Enssib' },
  { id: 'bibliothecaire', ref: 'NEW-biblio-etat', name: 'Bibliothécaire d’État', cat: 'A', lvl: 4, fp: 'E', matchPattern: '^bibliothecaire|biblio.caire\\b', cardTitle: 'Concours des bibliothèques' },
  { id: 'attache-conservation', ref: 'NEW-attache-conservation', name: 'Attaché territorial - Attachée territoriale de conservation du patrimoine', cat: 'A', lvl: 4, fp: 'T', matchPattern: 'attache.*conservation|archiviste|charge.*patrimoine|mediateur.*patrimoine', cardTitle: 'Concours des centres de gestion' },
  { id: 'attache-insee', ref: 'NEW-ensai', name: 'Attaché statisticien - Attachée statisticienne de l’Insee', cat: 'A', lvl: 4, fp: 'E', matchPattern: 'statisticien|charge d.etudes statistiques|analyste de donnees|data analyst', cardTitle: 'Concours de l’ENSAI' },
  { id: 'insed', ref: 'NEW-ensae', name: 'Ingénieur - Ingénieure de la statistique, de l’économie et de la donnée', cat: 'A+', lvl: 5, fp: 'E', matchPattern: 'administrateur.*insee|ingenieur.*statistique|data scientist|economiste', cardTitle: 'Concours de l’ENSAE' },
  { id: 'admin-etat-orient', ref: 'NEW-insp-orient', name: 'Administrateur - Administratrice de l’État, voie Orient', cat: 'A+', lvl: 5, fp: 'E', matchPattern: 'diplomat|affaires etrangeres|ambassad|consul|chancellerie|cooperation internationale|politique diplomatique', cardTitle: 'Concours de l’INSP, voie Orient' },
  { id: 'sae', ref: 'NEW-sae', name: 'Secrétaire des affaires étrangères', cat: 'A', lvl: 4, fp: 'E', matchPattern: 'diplomat|affaires etrangeres|ambassad|consul|chancellerie|cooperation internationale|politique diplomatique', cardTitle: 'Concours des Affaires étrangères' },
  { id: 'itm', ref: 'NEW-itm', name: 'Ingénieur - Ingénieure des travaux de la météorologie', cat: 'A', lvl: 4, fp: 'E', matchPattern: 'meteorolog|climatolog|previsionniste', cardTitle: 'Concours de Météo-France' },
  { id: 'tsm', ref: 'NEW-tsm', name: 'Technicien supérieur - Technicienne supérieure de la météorologie', cat: 'B', lvl: 2, fp: 'E', matchPattern: 'meteorolog|observateur meteo', cardTitle: 'Concours de Météo-France' },
  { id: 'isgn', ref: 'NEW-itgce', name: 'Ingénieur - Ingénieure des sciences géographiques et du numérique', cat: 'A', lvl: 4, fp: 'E', matchPattern: 'geograph|cartograph|geomati|topograph|geodes', cardTitle: 'Concours de l’IGN' },
  { id: 'icna', ref: 'NEW-icna', name: 'Ingénieur - Ingénieure du contrôle de la navigation aérienne', cat: 'A', lvl: 3, fp: 'E', matchPattern: 'controleur.*aerien|navigation aerienne|controle aerien', cardTitle: 'Concours de l’ENAC' },
  { id: 'tseeac', ref: 'NEW-tseeac', name: 'Technicien supérieur - Technicienne supérieure des études et de l’exploitation de l’aviation civile', cat: 'B', lvl: 2, fp: 'E', matchPattern: 'aviation civile|aeronautique|aeroport', cardTitle: 'Concours de l’ENAC' },
  { id: 'lieutenant-spp', ref: 'NEW-lieutenant-spp', name: 'Lieutenant - Lieutenante de sapeurs-pompiers professionnels', cat: 'B', lvl: 3, fp: 'T', matchPattern: 'lieutenant.*pompier|chef de centre|officier.*pompier', cardTitle: 'Concours de l’ENSOSP' },
  { id: 'capitaine-spp', ref: 'NEW-capitaine-spp', name: 'Capitaine de sapeurs-pompiers professionnels', cat: 'A', lvl: 4, fp: 'T', matchPattern: 'capitaine.*pompier|commandant.*pompier|chef de groupement', cardTitle: 'Concours de l’ENSOSP' },
  { id: 'en3s', ref: 'NEW-en3s', name: 'Dirigeant - Dirigeante d’organisme de sécurité sociale', cat: 'A+', lvl: 4, fp: 'E', matchPattern: 'securite sociale|caisse d.allocations|cpam|urssaf|protection sociale', cardTitle: 'Concours de l’EN3S' },
  { id: 'officier-terre', ref: 'NEW-saint-cyr', name: 'Officier - Officière de l’armée de Terre', cat: 'A', lvl: 4, fp: 'E', matchPattern: 'officier|commandant|chef de section', cardTitle: 'Concours de Saint-Cyr', military: true },
  { id: 'officier-marine', ref: 'NEW-navale', name: 'Officier - Officière de marine', cat: 'A', lvl: 4, fp: 'E', matchPattern: 'marine|navire|sous.marin|marin\\b', cardTitle: 'Concours de l’École navale', military: true },
  { id: 'officier-air', ref: 'NEW-air', name: 'Officier - Officière de l’armée de l’Air et de l’Espace', cat: 'A', lvl: 4, fp: 'E', matchPattern: 'pilote|aviateur|aeronef|armee de l.air', cardTitle: 'Concours de l’École de l’air et de l’espace', military: true },
  { id: 'sous-officier-armees', ref: 'NEW-sous-officier-armees', name: 'Sous-officier - Sous-officière des armées', cat: 'B', lvl: 2, fp: 'E', matchPattern: 'sous.officier|sergent|maistrance', cardTitle: 'Recrutement des sous-officiers', military: true },
  { id: 'commissaire-armees', ref: 'NEW-commissaire-armees', name: 'Commissaire des armées', cat: 'A', lvl: 4, fp: 'E', matchPattern: 'commissaire des armees|administration.*(defense|militaire)|soutien.*armees', cardTitle: 'Concours de l’École des commissaires des armées', military: true },
  { id: 'medecin-armees', ref: 'NEW-esa', name: 'Médecin des armées', cat: 'A', lvl: 5, fp: 'E', matchPattern: 'medecin.*armees|medecin militaire|sante des armees', cardTitle: 'Concours de l’École de santé des armées', military: true },
  { id: 'psyen', ref: 'NEW-psyen', name: 'Psychologue de l’Éducation nationale', cat: 'A', lvl: 5, fp: 'E', matchPattern: 'psychologue.*(education|scolaire)', cardTitle: 'Concours de l’Éducation nationale' },
  { id: 'plp', ref: 'NEW-caplp', name: 'Professeur - Professeure de lycée professionnel', cat: 'A', lvl: 4, fp: 'E', matchPattern: 'lycee professionnel|caplp', cardTitle: 'Concours de l’Éducation nationale' }
];

/* B.4 : liens métier / corps, choisis fiche par fiche après essai des expressions du plan sur les intitulés
   (trop larges ou vides seules : « officier » accroche la police, « pilote » la cybersécurité). Un métier déjà rattaché
   au corps équivalent (corps RMFP repris dans le concours) n’est pas rattaché une seconde fois. */
const LINKS = {
  'dir-pjj': ['fpjus002', 'fpjus003'],
  'officier-gend': ['fpsec001', 'fpsec004', 'fpsec005', 'fpsec007', 'fpsec009', 'fpsec010', 'fpsec011', 'fpsec012'],
  'pts': ['fpsec014', 'fpsec015'],
  'conservateur-bib-etat': ['fpdoc018'],
  'attache-conservation': ['fpdoc004', 'fpdoc019', 'fpdoc020', 'fpdoc021', 'fpcul005', 'fpcul010', 'fpcul012', 'fpcul016'],
  'attache-insee': ['fpctl036', 'fpctl038', 'fpctl039', 'fpctl046', 'fpctl014', 'fpnum034'],
  'insed': ['fpctl036'],
  'admin-etat-orient': ['fpint001', 'fpint002', 'fpint003', 'fpint004', 'fpint005', 'fpint006', 'fpint007', 'fpint008', 'fpint012', 'fpint013', 'fpint019', 'fpint028'],
  'sae': ['fpint003', 'fpint004', 'fpint005', 'fpint006', 'fpint007', 'fpint009', 'fpint011', 'fpint013', 'fpint014', 'fpint015', 'fpint017', 'fpint018', 'fpint019', 'fpint020', 'fpint021', 'fpint022', 'fpint023', 'fpint024', 'fpint025', 'fpint027', 'fpint028', 'fpint029', 'fpint030', 'fpint032', 'fpdir025'],
  'tsm': ['fpdef006', 'fpenv053', 'fpenv054'],
  'isgn': ['fpamt028', 'fpctl040'],
  'icna': ['fptra001', 'fptra003'],
  'tseeac': ['fptra040', 'fptra041', 'fpctl012', 'fpctl005'],
  'ispv': ['fpagr012', 'fpagr014', 'fpagr017', 'fpagr018'],
  'lieutenant-spp': ['fpsec039', 'fpsec040'],
  'capitaine-spp': ['fpsec038', 'fpsec039'],
  'officier-terre': ['fpdef002', 'fpdef003', 'fpdef008', 'fpdef009', 'fpdef010', 'fpdef012', 'fpdef018'],
  'officier-marine': ['fpdef004', 'fpdef011', 'fpdef014', 'fpdef021', 'fpdef030'],
  'officier-air': ['fpdef007', 'fpdef017', 'fpdef019', 'fpdef020'],
  'sous-officier-armees': ['fpdef002', 'fpdef003', 'fpdef004', 'fpdef007', 'fpdef008', 'fpdef009', 'fpdef010', 'fpdef011', 'fpdef012', 'fpdef013', 'fpdef014', 'fpdef015', 'fpdef016', 'fpdef017', 'fpdef019', 'fpdef020', 'fpdef021', 'fpdef030', 'fpdef031'],
  /* Enseignants du second degré : agrégation, CAPLP et CAPEPS ont chacun leur corps, pour ne pas mêler leurs dates à celles du CAPES. */
  'corps-5ae8976bf71c': ['capes', 'fpens002'],
  'corps-109d430c82f0': ['capes', 'fpens002'],
  'plp': ['capes', 'fpens002']
};
/* Concours sans métier lié, faute de fiche correspondante dans le répertoire des métiers (repris dans le test). */
const NO_JOB = {
  'NEW-en3s': 'Les organismes de sécurité sociale sont hors fonction publique : aucune fiche du répertoire.',
  'NEW-commissaire-armees': 'Le répertoire ne distingue pas les métiers d’administration et de soutien des armées.',
  'NEW-esa': 'Le répertoire ne contient pas de fiche de médecin militaire.'
};

/* Numérotation : après H-061, lettre selon le versant, dans l’ordre des lots N1 à N5. */
const created = [], idByRef = {};
let number = Math.max(...existing.map(c => Number(c.id.slice(2)))) + 1;
for (const r of research.filter(x => x.ref.startsWith('NEW-'))) {
  const spec = NEW.find(n => n.ref === r.ref);
  if (!spec) throw new Error('Concours de recherche sans correspondance : ' + r.ref);
  const id = (spec.fp === 'T' ? 'T' : spec.fp === 'H' ? 'H' : 'É') + '-' + String(number++).padStart(3, '0');
  idByRef[r.ref] = id;
  const donor = concoursById[spec.donor];
  const years = (r.sessions || []).map(s => s.session).filter(Boolean).sort();
  const c = { id, fp: spec.fp, cat: spec.cat, name: spec.name, routeIds: spec.routes.slice() };
  if (spec.lvl) c.lvl = spec.lvl;
  Object.assign(c, {
    voies: clean(r.voies, r.ref) || '', metiers: clean(r.metiers, r.ref) || '', domain: spec.domain,
    condition: clean(r.condition, r.ref) || '', epreuves: clean(r.epreuves, r.ref) || '',
    variations: 'Selon voie, spécialité et session ; vérifier le texte en vigueur',
    sessions: r.epreuves ? [{ session: years.includes('2027') || !years.length ? '2027' : years[years.length - 1], text: clean(r.epreuves, r.ref), caution: '', status: 'Recherche du 22 octobre 2026, à confirmer sur l’avis officiel', url: r.officialUrl }] : []
  });
  if (hasValue(r.annalesUrl)) c.annales = { kind: 'Sujets et rapports de jury', years: '', url: r.annalesUrl, scope: spec.name, caution: 'Vérifier la session et la voie.' };
  for (const k of ORIENTATION) c[k] = spec.o[k] !== undefined ? spec.o[k] : donor[k];
  for (const k of ['description', 'school', 'organizer', 'trainingMonths', 'paidTraining', 'places', 'evolution']) if (hasValue(r[k])) c[k] = clean(r[k], r.ref);
  Object.assign(c, { source: r.officialUrl, checked: r._verified && r.checked ? r.checked : CHECKED, next: [], researchChecked: r._verified && r.checked ? r.checked : CHECKED, researchConfidence: r.confidence, researchNotes: r.notes || '' });
  created.push(c);
}
const allConcours = existing.concat(created);
const concoursOfRef = ref => concoursById[ref] || created.find(c => c.id === idByRef[ref]);

const newRoutes = NEW_ROUTES.map(spec => {
  const r = byRef[spec.ref];
  if (routesById[spec.id]) throw new Error('Corps déjà présent : ' + spec.id);
  const route = { id: spec.id, name: spec.name, cat: spec.cat, lvl: spec.lvl, fp: spec.fp, cal: '', prep: '', source: r.officialUrl, access: 'Concours', matchPattern: spec.matchPattern, cardTitle: spec.cardTitle };
  if (spec.military) route.military = true;
  return route;
});
newRoutes.forEach(r => { routesById[r.id] = r; });
for (const c of created) for (const id of c.routeIds) if (!routesById[id]) throw new Error('Corps inconnu ' + id + ' pour ' + c.id);

/* Organisation des concours des nouveaux corps (organisateur, lieux, liens officiels directs). */
const examDetails = NEW_ROUTES.map(spec => {
  const r = byRef[spec.ref];
  const links = [r.officialUrl].concat(r.sources || []).filter(isOfficialLink);
  const url = links[0];
  if (!url) throw new Error('Aucun lien officiel direct pour ' + spec.id);
  return {
    id: spec.id + '__' + spec.fp, routeId: spec.id, fp: spec.fp, name: (spec.military && spec.cat === 'B' ? 'Recrutement : ' : 'Concours : ') + spec.name,
    org: clean(r.organizer, r.ref), metro: 'Lieux précisés dans l’avis de chaque session.', om: 'Centres d’outre-mer précisés dans l’avis lorsque le concours en ouvre.',
    source: url, checked: CHECKED, cardTitle: spec.cardTitle, officialLinks: [{ label: 'Page officielle du concours', url }]
  };
});

/* ---------- B.4 : liens ---------- */
const presentLinks = new Set(base.links.map(l => l.id));
const rejected = new Set(base.links.filter(l => l.status === 'rejeté').map(l => l.jobId + '|' + l.routeId));
const linkedNow = {}; base.links.forEach(l => { if (l.status !== 'rejeté' && !rejected.has(l.jobId + '|' + l.routeId)) (linkedNow[l.jobId] ||= new Set()).add(l.routeId); });
const routeConcours = id => created.find(c => c.routeIds.includes(id)) || allConcours.find(c => c.routeIds.includes(id));
const links = [];
const NOTE = 'Rapprochement proposé le 22 octobre 2026 à partir de l’intitulé du métier : vérifier le corps indiqué dans l’offre.';
for (const [routeId, jobIds] of Object.entries(LINKS)) {
  const route = routesById[routeId], c = routeConcours(routeId);
  if (!route || !c) throw new Error('Lien vers un corps inconnu : ' + routeId);
  for (const jobId of jobIds) {
    const job = jobsById[jobId], id = jobId + '__' + routeId;
    if (!job) { note('Métier absent, lien ignoré : ' + id); continue; }
    if (presentLinks.has(id) || rejected.has(jobId + '|' + routeId)) continue;
    const equivalent = c.routeIds.filter(x => x !== routeId).find(x => linkedNow[jobId] && linkedNow[jobId].has(x));
    if (equivalent) { note('Déjà rattaché au corps équivalent ' + equivalent + ' : ' + id); continue; }
    if (!route.fp.split('').some(f => job.fp.includes(f))) note('Versant différent, lien sans effet : ' + id);
    links.push({ id, jobId, routeId, status: 'proposé', source: route.source || c.source, note: NOTE });
  }
}

/* ---------- B.5 : calendrier ---------- */
const MONTHS = /\d{1,2}(er)?\s+(janv|févr|fevr|mars|avr|mai|juin|juil|août|aout|sept|oct|nov|déc|dec)/i;
const monthOnly = (iso, label) => !!iso && hasValue(label) && !MONTHS.test(label);
const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const orgSlug = r => { const m = String(r.organizer || '').match(/\(([A-Z][A-Za-z0-9-]{1,9})\)/) || String(r.school || '').match(/\(([A-Z][A-Za-z0-9-]{1,9})/); return m ? slug(m[1]) : slug(r.organizer).slice(0, 30).replace(/-$/, ''); };
const NOT_CONCOURS = /examens? professionnels?|tour extérieur|liste d.aptitude/i;
/* Une date que la page officielle dit prévisionnelle reste un calendrier prévisionnel. */
const TENTATIVE = /prévision|provisoire|à confirmer|indicati|sous réserve/i;
const ALL_VOIES = /^toutes les voies/i;
const baseCalendar = base.calendar.filter(x => !x.duplicateOf);
const sameVoie = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase() || ALL_VOIES.test(a || '') || ALL_VOIES.test(b || '');
const datesOf = x => [x.open, x.date || x.close, x.written, x.oral, x.results].filter(Boolean);
const isUpcoming = x => { const d = [x.date, x.written, x.oral].filter(Boolean); return d.some(v => v >= TODAY) || (!d.length && x.provisional); };
const sessionsOf = (c, list) => list.filter(x => x.fp === c.fp && (x.routeIds || []).some(id => c.routeIds.includes(id)));
const calendar = [], ids = new Set(baseCalendar.map(x => x.id));
let skippedDuplicates = 0, skippedPast = 0, skippedNotConcours = 0;
for (const r of research) {
  const c = concoursOfRef(r.ref);
  if (!c) continue;
  /* Corps du calendrier : ceux du concours, à sa catégorie et dans son versant. */
  const routeIds = c.routeIds.filter(id => routesById[id] && routesById[id].cat === c.cat && routesById[id].fp.includes(c.fp));
  if (!routeIds.length) { note('Aucun corps compatible pour le calendrier de ' + c.id); continue; }
  const sessions = (r.sessions || []).filter(s => { if (NOT_CONCOURS.test(s.voie || '')) { skippedNotConcours++; return false; } return true; });
  const future = s => !datesOf(s).length || datesOf(s).some(d => d >= TODAY);
  const keepPast = !sessions.some(future) && !sessionsOf(c, baseCalendar).length;
  for (const s of sessions) {
    if (!future(s) && !keepPast) { skippedPast++; continue; }
    const voie = clean(s.voie, r.ref) || 'Toutes les voies';
    const duplicate = baseCalendar.concat(calendar).some(x => x.fp === c.fp && (x.routeIds || []).some(id => routeIds.includes(id)) && sameVoie(x.voie, voie) &&
      (s.close ? x.date === s.close : (s.written && x.written === s.written)));
    if (duplicate) { skippedDuplicates++; continue; }
    const year = s.session || (datesOf(s)[0] || '').slice(0, 4) || '2027';
    let id = ('recherche-' + slug(c.id.replace('É', 'E')) + '-' + slug(voie) + '-' + year + '-' + orgSlug(r)).slice(0, 90).replace(/-$/, ''), n = 1;
    while (ids.has(id)) id = id.replace(/-\d+$/, '') + '-' + (++n);
    ids.add(id);
    const past = !future(s);
    const provisional = !past && (!!s.provisional || r.confidence === 'faible' || !datesOf(s).length || TENTATIVE.test([s.voie, s.openLabel, s.closeLabel, s.writtenLabel, s.oralLabel].join(' ')) || [['open', 'openLabel'], ['close', 'closeLabel'], ['written', 'writtenLabel'], ['oral', 'oralLabel']].some(([d, l]) => monthOnly(s[d], s[l])));
    calendar.push({
      id, name: c.name, rawName: c.name + ' · ' + voie + ' · session ' + year, cat: c.cat, fp: c.fp, voie, url: s.url || r.officialUrl,
      source: clean(r.organizer, r.ref) + ' ; recherche du 22 octobre 2026', checked: r._verified && r.checked ? r.checked : CHECKED,
      open: s.open || null, date: s.close || null, openLabel: clean(s.openLabel, r.ref) || '', closeLabel: clean(s.closeLabel, r.ref) || '',
      written: s.written || null, writtenLabel: clean(s.writtenLabel, r.ref) || '', oral: s.oral || null, oralLabel: clean(s.oralLabel, r.ref) || '',
      routeIds, provisional, employer: clean(s.employer || r.organizer, r.ref)
    });
  }
}
const expectedBase = new Set((base.calendarExpected || []).map(x => x.concours));
const calendarExpected = [];
for (const r of research) {
  const c = concoursOfRef(r.ref);
  if (!c || !hasValue(r.expected) || expectedBase.has(c.id)) continue;
  if (sessionsOf(c, baseCalendar.concat(calendar)).some(isUpcoming)) continue;
  calendarExpected.push({ concours: c.id, voie: 'Toutes les voies', expected: clean(r.expected, r.ref), url: r.officialUrl, checked: r._verified && r.checked ? r.checked : CHECKED });
}

/* ---------- B.6 : sigles ---------- */
const SIGLES = [
  ['ENM', 'École nationale de la magistrature'], ['ENG', 'École nationale des greffes'], ['ENAP', 'École nationale d’administration pénitentiaire'],
  ['ENPJJ', 'École nationale de protection judiciaire de la jeunesse'], ['EOGN', 'École des officiers de la gendarmerie nationale'],
  ['ENSOSP', 'École nationale supérieure des officiers de sapeurs-pompiers'], ['INP', 'Institut national du patrimoine'],
  ['Enssib', 'École nationale supérieure des sciences de l’information et des bibliothèques'], ['ENSAI', 'École nationale de la statistique et de l’analyse de l’information'],
  ['ENSAE', 'École nationale de la statistique et de l’administration économique'], ['INSED', 'Ingénieur de la statistique, de l’économie et de la donnée'],
  ['ENTPE', 'École nationale des travaux publics de l’État'], ['ENAC', 'École nationale de l’aviation civile'], ['ENSV', 'École nationale des services vétérinaires'],
  ['EN3S', 'École nationale supérieure de sécurité sociale'], ['ECA', 'École des commissaires des armées'], ['ESA', 'École de santé des armées'],
  ['CAPLP', 'Certificat d’aptitude au professorat de lycée professionnel'], ['CAPEPS', 'Certificat d’aptitude au professorat d’éducation physique et sportive'],
  ['PsyEN', 'Psychologue de l’Éducation nationale'], ['ISPV', 'Inspecteur de santé publique vétérinaire'], ['IPEF', 'Ingénieur des ponts, des eaux et des forêts'],
  ['IAE', 'Ingénieur de l’agriculture et de l’environnement'], ['ITPE', 'Ingénieur des travaux publics de l’État'], ['ICNA', 'Ingénieur du contrôle de la navigation aérienne'],
  ['TSEEAC', 'Technicien supérieur des études et de l’exploitation de l’aviation civile'], ['ISGN', 'Ingénieur des sciences géographiques et du numérique'],
  ['DGCCRF', 'Direction générale de la concurrence, de la consommation et de la répression des fraudes'],
  ['ENCCRF', 'École nationale de la concurrence, de la consommation et de la répression des fraudes'], ['CPIP', 'Conseiller pénitentiaire d’insertion et de probation'],
  ['SDIS', 'Service départemental d’incendie et de secours'], ['SOG', 'Sous-officier de gendarmerie'], ['Inalco', 'Institut national des langues et civilisations orientales'],
  ['INSPE', 'Institut national supérieur du professorat et de l’éducation'], ['MEEF', 'Métiers de l’enseignement, de l’éducation et de la formation'],
  ['STAPS', 'Sciences et techniques des activités physiques et sportives'], ['CIRFA', 'Centre d’information et de recrutement des forces armées'],
  ['IGN', 'Institut national de l’information géographique et forestière'], ['DGAC', 'Direction générale de l’aviation civile'], ['JDC', 'Journée défense et citoyenneté']
];
const knownSigles = new Set((base.sigles || []).map(x => x.id));
const sigles = SIGLES.filter(([id]) => !knownSigles.has(id)).map(([id, label]) => ({ id, label }));

/* ---------- Écriture ---------- */
for (const f of existingFiles) writeCompact(f.path, f.data);
writeCompact(OUT.concours, { concours: created });
writeCompact(OUT.routes, { routes: newRoutes });
writeCompact(OUT.links, { links });
writeCompact(OUT.exam, { examDetails });
writeCompact(OUT.sigles, { sigles });
writeIndented(OUT.calendar, { calendar, calendarExpected });
/* B.7 : manifeste, nouvelles parts avant audit-01. */
const parts = manifest.parts.filter(p => !outParts.includes(p));
const at = parts.indexOf('catalogue/audit-01.json');
parts.splice(at < 0 ? parts.length : at, 0, OUT.concours, OUT.routes, OUT.exam, OUT.links, OUT.sigles, OUT.calendar);
manifest.parts = parts;
fs.writeFileSync(new URL('data/catalogue.json', root), JSON.stringify(manifest, null, 2) + '\n');

console.log('Recherches lues :', research.length, '(' + research.filter(r => r._verified).length + ' vérifiées)');
console.log('Concours :', existing.length, 'existants complétés,', created.length, 'nouveaux (' + created[0].id + ' à ' + created[created.length - 1].id + ')');
console.log('Corps :', newRoutes.length, 'nouveaux ; organisation :', examDetails.length, '; liens :', links.length);
console.log('Calendrier :', calendar.length, 'sessions ajoutées,', skippedDuplicates, 'doublons ignorés,', skippedPast, 'sessions passées ignorées,', skippedNotConcours, 'examens professionnels ou tours extérieurs ignorés ;', calendarExpected.length, 'sessions attendues');
console.log('Sigles :', sigles.length, 'ajoutés');
console.log('Concours sans métier lié accepté :', Object.keys(NO_JOB).map(r => idByRef[r] + ' (' + r + ')').join(', '));
if (log.length) console.log(log.map(s => '  · ' + s).join('\n'));
