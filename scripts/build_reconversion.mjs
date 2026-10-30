// Base du profil « en reconversion », chargée dès l'onboarding (le catalogue complet arrive plus tard).
// Lit les fiches RMFP et les domaines des fiches, puis écrit data/catalogue/reconversion-01.json :
//  - 10 mots-clés par fiche, extraits des savoirs, des compétences et de l'intitulé ;
//  - les domaines cœur de chaque fiche (pour présélectionner les domaines sans l'écran des centres d'intérêt) ;
//  - les métiers du privé (intitulés et alias) qui relient le champ « Votre métier » aux fiches ;
//  - les passerelles strictes et leurs sources.
// Usage : node scripts/build_reconversion.mjs [--check]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAT = path.join(ROOT, 'data/catalogue');
const OUT = path.join(CAT, 'reconversion-01.json');
const CHECK = process.argv.includes('--check');
const CHECKED = '2026-10-31';

const readAll = (prefix, key) => fs.readdirSync(CAT).filter(f => f.startsWith(prefix)).sort()
  .flatMap(f => JSON.parse(fs.readFileSync(path.join(CAT, f), 'utf8'))[key] || []);
const jobs = readAll('rmfp-', 'rmfp');
const tags = Object.fromEntries(readAll('domain-tags-', 'domainTags').map(t => [t.job, t]));

const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[’']/g, ' ').replace(/[^a-z0-9+]+/g, ' ').trim();
const STOP = new Set('de du des la le les l d et en a au aux pour sur dans par avec un une ou son sa ses leur leurs relatif relatifs relative relatives domaine domaines activite activites'.split(' '));

// Formulations génériques présentes dans presque toutes les fiches : elles ne disent rien du métier.
const GENERIC = [
  'travailler en equipe', 'savoir travailler en equipe', 'communiquer', 'environnement et reseaux professionnels', 'environnement professionnel',
  'anglais', 'langue anglaise', 'autre langue etrangere', 'rendre compte', 'rediger', 'analyser', 'controler', 'assurer une veille',
  'travailler en reseau', 'ministere et ses reseaux', 'ethique et deontologie professionnelles', 'cadre legal et deontologique', 'qualite',
  'utiliser les logiciels specifiques', 'connaitre son environnement professionnel', 'tests', 'developpement durable', 'manager',
  'gerer des situations professionnelles stressantes', 'animer une equipe', 'transmettre des connaissances', 'reglementation', 'organisation',
  'techniques de communication', 'outils bureautiques', 'bureautique', 'connaissance de la politique publique', 'enjeux', 'acteurs', 'methodologie',
  'cadre reglementaire', 'cadre juridique', 'droit public', 'institutions', 'fonctionnement de l administration', 'connaissances generales',
  'environnement institutionnel', 'politiques publiques', 'principes', 'notions', 'regles', 'procedures', 'outils', 'techniques', 'missions'
];
// Mots d'intitulé trop généraux pour servir seuls de mot-clé.
const TITLE_STOP = new Set('responsable charge chargee agent agente chef cheffe adjoint adjointe assistant assistante directeur directrice conseiller conseillere gestionnaire public publique publics cadre specialiste referent referente expert experte mission service services technicien technicienne ingenieur ingenieure coordonnateur coordinatrice coordinateur operateur operatrice superieur superieure general generale principal principale charges national nationale departemental departementale regional regionale territorial territoriale controleur controleuse inspecteur inspectrice animateur animatrice'.split(' '));
const KEEP_VERBS = new Set(['negocier', 'conseiller', 'manager']);
const GENERIC_WORDS = new Set('organisation textes droit service services stocks public publique securite qualite risques outils domaine medicaux politique gestion communication environnement administration reglementation partenaires acteurs usagers moyens projet projets dispositifs procedures methodes donnees enjeux fonctionnement typologie attentes pratiques savoirs calendriers relation relations processus etudes labels points gestes ministerielles faune especes habitats conception investigation menaces'.split(' '));
const isGeneric = n => GENERIC.some(g => n === g || n.startsWith(g + ' ')) || /^(connaissance|connaissances|notions?|maitrise|savoir|capacite)\b/.test(n);

function cleanPiece(raw) {
  let s = String(raw).replace(/\([^)]*\)/g, ' ').replace(/[()«»"]/g, ' ').replace(/\bnotamment\b/gi, ' ').replace(/\s+/g, ' ').trim()
    .replace(/^(connaissances?|notions?|maîtrise|maitrise|bonne connaissance|savoirs?)\s+(de la |de l’|de l'|des |du |de |d’|d')/i, '')
    .replace(/^(o |• |à la |à l’|à l'|à |aux |au |un |une |la |le |les |l’|l'|des |du |de |d’|d'|ou |et )+/i, '').replace(/[.:;,\-–\s]+$/, '')
    .replace(/\s+(et|ou|de|du|des|la|le|les|en|à|au|aux|pour|par|sur)$/i, '').trim();
  if (!s) return null;
  const n = norm(s).replace(/^(l|la|le|les|d|de|du|des|un|une) /, ''), words = n.split(' ').filter(Boolean);
  if (words.length < 1 || words.length > 4 || n.length < 3 || n.length > 34) return null;
  if (words.every(w => STOP.has(w))) return null;
  if (STOP.has(words[words.length - 1]) || words[0] === 'commun' || words[0] === 'carte') return null;
  if (isGeneric(n)) return null;
  // Débuts de phrase coupés (« sa maintenance », « un arbitrage », « ses performances ») : écartés.
  if (/^(sa|son|ses|leur|leurs|un|une|ce|cet|cette|ces|tout|tous|toute|toutes|autres?|points?|proprietes|assimiles|associes)$/.test(words[0])) return null;
  // Verbe conjugué en tête (« réalise des opérations », « applique des standards ») : écarté.
  if (/^(realise|applique|participe|developpe|assure|gere|contribue|met|elabore|concoit|veille|organise|anime|suit|redige|controle|pilote|propose|accompagne|joue|prend|fait|definit|identifie|mene|conduit|coordonne|effectue|traite|utilise|communique)$/.test(words[0])) return null;
  // Forme conjuguée isolée (« communique », « utilise ») : écartée.
  if (words.length === 1 && /(ique|ise|ue|ent)$/.test(n) && !/(logistique|informatique|mecanique|electrique|technique|juridique|statistique|thermique|hydraulique)$/.test(n)) return null;
  // Fragment verbal isolé (« lire », « réaliser », « définir les failles ») : écarté.
  if (/^[a-z]+(er|ir|re)$/.test(words[0]) && !KEEP_VERBS.has(words[0])) return null;
  if (words.length === 1 && (TITLE_STOP.has(n) || GENERIC_WORDS.has(n))) return null;
  // Minuscule en tête, sauf sigle (SIG, BTP, RH…).
  s = s.replace(/^(l’|l')/i, '');
  const label = /^[A-Z0-9]{2,}\b/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1);
  return { n, label };
}
function piecesOf(text) {
  return String(text || '').split(/\n/).flatMap(line => {
    const l = line.replace(/^[\s•\-–]+/, '').trim();
    if (!l || /:\s*$/.test(l)) return [];
    return l.split(/\s*[,;\/]\s*|\s+et\s+|\s*:\s*/).map(cleanPiece).filter(Boolean);
  });
}
// Activités : « Tenir la comptabilité générale de l'établissement » → « comptabilité générale ».
const LEAD_VERB = /^(\S+(er|ir|re|oir)|mettre en (œuvre|oeuvre|place)|faire|prendre en charge|participer à|contribuer à|veiller à)\s+/i;
function activityPieces(text) {
  return String(text || '').split(/\n/).flatMap(line => {
    let l = line.replace(/^[\s•\-–]+/, '').replace(/\([^)]*\)/g, ' ').trim();
    if (!l || /:\s*$/.test(l)) return [];
    for (let i = 0; i < 3 && LEAD_VERB.test(l); i++) l = l.replace(LEAD_VERB, '').replace(/^(et|ou)\s+/i, '');
    l = l.split(/\s*[,;:]\s*|\s+(?:et|ou|afin|dans|selon|avec|pour|auprès|en lien|en fonction)\s+/i)[0];
    const head = l.split(/\s+/).slice(0, 4).join(' ');
    const p = cleanPiece(head);
    return p ? [p] : [];
  });
}
const masc = name => {
  const t = String(name || '').replace(/([A-Za-zÀ-ÿ]+)·[a-zà-ÿ]+(·[a-zà-ÿ]+)?/g, '$1');
  const m = t.match(/^(.+?)\s+\/\s+(.+)$/);
  if (!m) return t.trim();
  // « Cadre commerciale / commercial » : le mot commun de tête est repris devant la forme masculine.
  const left = m[1].split(' '), right = m[2].split(' ');
  return (left.length > 1 && right.length === 1 && /^[a-zà-ÿ]/.test(right[0]) && !/-$/.test(left[0]) ? left.slice(0, -1).concat(right) : right).join(' ').trim();
};
function titlePieces(j) {
  const t = masc(j.name).replace(/\([^)]*\)/g, ' ');
  const out = [];
  const whole = cleanPiece(t);
  if (whole && whole.n.split(' ').length <= 3) out.push(whole);
  norm(t).split(' ').filter(w => w.length >= 5 && !STOP.has(w) && !TITLE_STOP.has(w)).forEach(w => {
    const orig = t.split(/[^A-Za-zÀ-ÿ0-9+]+/).find(x => norm(x) === w) || w;
    out.push({ n: w, label: orig.charAt(0).toLowerCase() + orig.slice(1) });
  });
  return out;
}

// Fréquence documentaire : un mot-clé repris par plus de 60 fiches ne discrimine plus rien.
const df = new Map();
const perJob = jobs.map(j => {
  const cand = [...titlePieces(j).map(p => ({ ...p, title: true })), ...piecesOf(j.knowledge), ...piecesOf(j.skills), ...activityPieces(j.activities).filter(p => p.n.split(' ').length >= 2).map(p => ({ ...p, late: true }))];
  const seen = new Set(), list = [];
  for (const c of cand) { if (!seen.has(c.n)) { seen.add(c.n); list.push(c); } }
  list.forEach(c => df.set(c.n, (df.get(c.n) || 0) + 1));
  return list;
});
const labels = new Map(); // forme normalisée → libellé affiché le plus fréquent
perJob.flat().forEach(c => { const m = labels.get(c.n) || {}; m[c.label] = (m[c.label] || 0) + 1; labels.set(c.n, m); });
const labelOf = n => Object.entries(labels.get(n)).sort((a, b) => b[1] - a[1])[0][0];

const keywordIndex = new Map(), keywords = [];
function kwId(n) { if (!keywordIndex.has(n)) { keywordIndex.set(n, keywords.length); keywords.push(labelOf(n)); } return keywordIndex.get(n); }

const outJobs = jobs.map((j, i) => {
  const ranked = perJob[i].filter(c => df.get(c.n) <= 60)
    .map((c, order) => ({ ...c, score: (c.title ? 100 : 0) + (df.get(c.n) >= 2 && df.get(c.n) <= 25 ? 20 : 0) - order - (c.late ? 60 : 0) }))
    .sort((a, b) => b.score - a.score);
  const chosen = [];
  for (const c of ranked) {
    // Doublons et simples pluriels seulement : « économie du développement » reste à côté de « développement ».
    if (chosen.some(x => x.n === c.n || x.n === c.n + 's' || c.n === x.n + 's' || x.n === c.n + 'x' || c.n === x.n + 'x')) continue;
    chosen.push(c); if (chosen.length === 10) break;
  }
  const t = tags[j.id] || {};
  return [j.id, String(j.name).trim(), (t.coeur || [j.domain]).filter(Boolean), chosen.map(c => kwId(c.n))];
});

// Métiers du privé : intitulés courants et alias, termes de recherche dans les fiches, passerelle éventuelle.
// « q » : formes normalisées cherchées dans l'intitulé et les mots-clés des fiches RMFP.
const PROFESSIONS = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/reconversion-professions.json"), "utf8")).professions;

// Passerelles strictes : sources ouvertes le 30 octobre 2026.
const PASSERELLES = {
  'enm-pro': { title: 'Concours professionnel de la magistrature', text: 'Pour les avocat·es justifiant de 10 ans d’exercice (7 ans pour les autres juristes) et âgé·es de moins de 57 ans. Formation rémunérée de 12 mois à l’ENM.', concours: true, url: 'https://www.justice.gouv.fr/node/20008', source: 'Ministère de la Justice' },
  'cnph': { title: 'Concours national de praticien hospitalier', text: 'Ouvert aux médecins, pharmacien·nes et chirurgien·nes-dentistes, par spécialité, organisé chaque année par le CNG. Sans concours : praticien contractuel, de 1 à 3 ans renouvelables.', concours: true, url: 'https://www.cng.sante.fr/', source: 'Centre national de gestion' },
  'titres-fph': { title: 'Recrutement sur titres à l’hôpital public', text: 'Votre diplôme d’État suffit : chaque hôpital recrute sur dossier, parfois avec un entretien, sans épreuves écrites.', concours: false, url: 'https://www.fonction-publique.gouv.fr/devenir-agent-public/les-recrutements-sans-concours', source: 'DGAFP' },
  'titres-social': { title: 'Concours sur titres, filière sociale', text: 'Avec votre diplôme d’État, l’accès se fait sur dossier et entretien dans les hôpitaux, les collectivités et l’État, sans épreuves écrites lourdes.', concours: false, url: 'https://www.concours-territorial.fr/', source: 'Centres de gestion' },
  'emplois-reserves': { title: 'Emplois réservés aux anciens militaires', text: 'Tous les corps de catégorie B et C des trois fonctions publiques, sans concours, après entretien. Sans limite d’âge. Pour les militaires en activité : détachement puis intégration.', concours: false, url: 'https://www.fonction-publique.gouv.fr/devenir-agent-public/les-emplois-reserves', source: 'DGAFP' }
};

// Contrôle : chaque métier du privé doit retrouver au moins une fiche par ses termes.
const nameText = jobs.map(j => ' ' + norm(j.name) + ' ');
const jobText = outJobs.map(j => ' ' + norm(j[1]) + ' ' + j[3].map(k => norm(keywords[k])).join(' ') + ' ');
const professions = PROFESSIONS.map(([t, a, q, p]) => {
  // Poids fort sur l'intitulé de la fiche, faible sur ses mots-clés ; on garde les fiches proches du meilleur score.
  const scored = outJobs.map((j, i) => ({ i, score: q.reduce((s, term) => s + (nameText[i].includes(' ' + term) ? 5 : jobText[i].includes(' ' + term) ? 1 : 0), 0) }))
    .filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  const top = scored.length ? scored[0].score : 0;
  const hits = scored.filter(x => x.score >= Math.max(1, top * 0.5)).slice(0, 10).map(x => x.i);
  return { t, a: a.map(norm), q, p, jobs: hits };
});
const orphan = professions.filter(p => !p.jobs.length).map(p => p.t);

// Mots-clés proposés avant toute saisie : les plus partagés parmi des domaines variés.
const kwDf = new Map();
outJobs.forEach(j => j[3].forEach(k => kwDf.set(k, (kwDf.get(k) || 0) + 1)));
// Une entrée par grand secteur du privé, pour qu'un champ vide propose déjà des pistes parlantes.
const FREQUENT = ['accueil', 'comptabilite', 'maintenance', 'soins', 'vente', 'informatique', 'ressources humaines', 'logistique', 'communication', 'batiment', 'animation', 'juridique', 'cuisine', 'espaces verts', 'achats', 'enseignement'];
const frequent = FREQUENT.map(f => keywordIndex.get(f) ?? [...keywordIndex.keys()].filter(n => n === f || n.startsWith(f + ' ')).sort((a, b) => (kwDf.get(keywordIndex.get(b)) || 0) - (kwDf.get(keywordIndex.get(a)) || 0)).map(n => keywordIndex.get(n))[0])
  .filter(k => k !== undefined).slice(0, 12);

const data = { reconversion: { version: 1, checked: CHECKED, keywords, jobs: outJobs, professions, frequent, passerelles: PASSERELLES } };
const short = outJobs.filter(j => j[3].length < 10).length;
console.log(`${outJobs.length} fiches · ${keywords.length} mots-clés distincts · ${short} fiches avec moins de 10 mots-clés · ${professions.length} métiers du privé · orphelins : ${orphan.length ? orphan.join(', ') : 'aucun'}`);
console.log('Mots-clés fréquents :', frequent.map(k => keywords[k]).join(', '));
if (CHECK) process.exit(orphan.length ? 1 : 0);
fs.writeFileSync(OUT, JSON.stringify(data));
console.log('Écrit', path.relative(ROOT, OUT), (fs.statSync(OUT).size / 1024).toFixed(0) + ' Ko');
