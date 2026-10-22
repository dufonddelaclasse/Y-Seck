// Intégration des recherches du 22 octobre 2026 sur les corps affichés sans fiche concours (data/research/2026-10-22-corps/out) :
// une fiche concours par corps (C1 à C3), les corps qui sont le même qu’un concours existant y sont rattachés, et les fiches
// existantes reçoivent l’école, la durée et la rémunération de la formation trouvées (C4).
// Relançable sans doublon : les sorties de ce script sont exclues de la lecture. Usage : node scripts/integrate_corps.mjs
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const CHECKED = '2026-10-22', TODAY = '2026-10-22';
const RESEARCH = 'data/research/2026-10-22-corps/';
const OUT = {
  concours: 'catalogue/ref-concours-06.json', exam: 'catalogue/ref-exam-details-04.json', calendar: 'catalogue/calendar-corps-2026-10-22.json',
  fixes: 'catalogue/concours-corrections-01.json', jobs: 'catalogue/job-recruitment-02.json'
};
const read = p => JSON.parse(fs.readFileSync(new URL(p, root), 'utf8'));
const write = (p, obj, indent) => fs.writeFileSync(new URL('data/' + p, root), JSON.stringify(obj, null, indent) + '\n');
const exists = p => fs.existsSync(new URL(p, root));
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
const routeFix = {}; (base.routeCorrections || []).forEach(f => { routeFix[f.id] = f; });
const routeCat = id => (routeFix[id] && routeFix[id].cat) || routesById[id].cat;
const concoursById = {}; base.concours.forEach(c => { concoursById[c.id] = c; });
const examKeys = new Set((base.examDetails || []).map(e => e.routeId + '__' + e.fp));

/* ---------- Recherches ---------- */
const lots = {}, research = { concours: [], attach: [], noConcours: [], updates: [] };
/* C2 d’abord : ses fiches, publiées les premières, gardent leur numéro. */
for (const lot of ['C2', 'C4', 'C1', 'C3']) {
  const file = RESEARCH + 'out/' + lot + (exists(RESEARCH + 'out/' + lot + '.verified.json') ? '.verified.json' : '.json');
  if (!exists(file)) { note('Lot ' + lot + ' non encore livré.'); continue; }
  lots[lot] = read(RESEARCH + 'lots/lot-' + lot + '.json').map(x => x.routeId || x.id);
  const out = read(file);
  for (const k of Object.keys(research)) (out[k] || []).forEach(x => research[k].push(Object.assign(x, { _lot: lot })));
}

/* Textes affichés : apostrophe typographique, jamais de tiret cadratin. */
function clean(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/([A-Za-zÀ-ÿ])'([A-Za-zÀ-ÿ])/g, '$1’$2').replace(/\s+—\s+/g, ', ').replace(/—/g, ',').trim();
}
const hasValue = v => v !== null && v !== undefined && String(v).trim() !== '';
const GENERIC = /choisirleservicepublic|fonction-publique\.gouv\.fr\/?$|service-public\.fr\/?$|onisep\.fr\/?$|concours-territorial\.fr\/?$/;
const isOfficialLink = u => /^https:\/\//.test(u || '') && !GENERIC.test(u);
for (const r of research.concours) {
  if (!isOfficialLink(r.officialUrl)) r.officialUrl = (r.sources || []).find(isOfficialLink) || r.officialUrl;
  for (const s of r.sessions || []) if (!isOfficialLink(s.url)) s.url = r.officialUrl;
}

/* ---------- Parcours des nouvelles fiches ---------- */
/* Lycée, stage et vigilance repris d’un concours du même domaine (catégorie et versant les plus proches) ; études tirées de la
   condition du concours externe ; préparation et accès après le bac selon le type de recrutement. */
const ORIENTATION = ['college', 'collegeOption', 'lyceeGeneral', 'lyceeTechno', 'lyceePro', 'lyceeWhy', 'stage', 'optionSeconde', 'optionTerminale', 'studies', 'l1', 'l2', 'l3', 'master', 'prepa', 'afterBac', 'vigilance'];
const DIP = ['Sans diplôme', 'Brevet ou CAP', 'Bac', 'Bac+2', 'Bac+3', 'Bac+5', 'Doctorat'];
const RESEARCH_ROUTES = ['ie', 'ir', 'asi', 'atrf', 'chercheur'];
const DOMAIN_DONORS = { 'Santé': 'H-051', 'Technique': 'É-081', 'Culture': 'T-076', 'Enseignement': 'É-006', 'Animation': 'T-039', 'Sécurité': 'É-070', 'Économie': 'É-003', 'Administration': 'É-002', 'Solidarité': 'T-030', 'Justice': 'É-012' };
function donorFor(r, routeId) {
  if (RESEARCH_ROUTES.includes(routeId)) return concoursById['É-019'];
  const pool = base.concours.filter(c => (c.domain || '').split(/[ ,]/)[0] === String(r.domain || '').split(/[ ,]/)[0]);
  const score = c => (c.cat === r.cat ? 2 : 0) + (c.fp === r.fp ? 1 : 0);
  const best = pool.sort((a, b) => score(b) - score(a))[0];
  return best || concoursById[DOMAIN_DONORS[Object.keys(DOMAIN_DONORS).find(k => String(r.domain || '').startsWith(k))] || 'É-002'];
}
function studiesFrom(r) {
  const m = /(?:^|;\s*)Externe[^:]{0,40}:\s*([^;]+)/i.exec(r.condition || '') || /^[^:;]{0,40}:\s*([^;]+)/.exec(r.condition || '');
  if (!m) return null;
  const t = m[1].trim().replace(/\.$/, '');
  return t.charAt(0).toUpperCase() + t.slice(1);
}
function orientation(r, routeId, lvl) {
  const donor = donorFor(r, routeId), o = {};
  for (const k of ORIENTATION) o[k] = donor[k];
  delete o.l1; delete o.l2; delete o.l3; delete o.master;
  const titles = /sur titres/i.test((r.epreuves || '') + ' ' + (r.voies || '') + ' ' + r.name);
  o.studies = studiesFrom(r) || donor.studies;
  o.afterBac = lvl === null || lvl === undefined ? donor.afterBac : lvl <= 1 ? 'Oui : aucun diplôme exigé pour le concours externe' : lvl === 2 ? 'Oui : le bac suffit pour le concours externe' : 'Non : ' + DIP[lvl] + ' exigé pour le concours externe';
  if (RESEARCH_ROUTES.includes(routeId)) {
    o.stage = 'Visiter un laboratoire public lors de la Fête de la science ou d’une journée portes ouvertes. Pour la 3e ou la seconde : entretien métier ou stage uniquement si accueil possible.';
    o.prepa = routeId === 'chercheur' ? 'Doctorat et premières publications, souvent suivis d’un contrat postdoctoral ; candidature aux concours des organismes de recherche' : 'Préparations aux concours ITRF proposées par les universités ; fiches des emplois-types de la branche d’activité (Referens) ; épreuves sur dossier et entretien selon le poste';
  } else if (titles) o.prepa = 'Aucune préparation particulière : concours sur titres (examen du dossier, souvent suivi d’un entretien)';
  else o.prepa = 'Préparations aux concours de catégorie ' + r.cat + ' (universités, CNED, centres de préparation) ; annales et rapports de jury';
  return o;
}

/* ---------- Catégories statutaires rectifiées ---------- */
/* Décret n° 2022-54 du 24 janvier 2022 : techniciens de laboratoire médical et préparateurs en pharmacie hospitalière en catégorie A. */
const CAT_FIXES = { 'corps-0e034401a009': 'A', 'corps-fe7341cee5b3': 'A' };
const routeCorrections = Object.entries(CAT_FIXES).map(([id, cat]) => ({ id, cat }));
for (const [id, cat] of Object.entries(CAT_FIXES)) { if (!routesById[id]) throw new Error('Corps inconnu : ' + id); routeFix[id] = { id, cat }; }
for (const r of research.concours) if (r.route && CAT_FIXES[r.route.existing]) r.cat = CAT_FIXES[r.route.existing];
/* Les fiches métiers reliées à ces corps affichent aussi la catégorie A. */
const jobsById = {}; (base.legacyJobs || []).concat(base.rmfp || []).filter(j => j.active !== false).forEach(j => { jobsById[j.id] = j; });
const jobFix = {}; (base.jobCorrections || []).forEach(f => { jobFix[f.id] = Object.assign(jobFix[f.id] || {}, f); });
const jobCats = j => (jobFix[j.id] && jobFix[j.id].categories) || (j.categories && j.categories.length ? j.categories : [j.cat]);
const rejectedLinks = new Set(base.links.filter(l => l.status === 'rejeté').map(l => l.jobId + '|' + l.routeId));
const jobCorrections = [];
for (const [routeId, cat] of Object.entries(CAT_FIXES)) {
  for (const l of base.links) {
    if (l.routeId !== routeId || l.status === 'rejeté' || rejectedLinks.has(l.jobId + '|' + routeId) || !jobsById[l.jobId]) continue;
    const cats = jobCats(jobsById[l.jobId]).filter(c => c !== 'V');
    if (cats.includes(cat) || jobCorrections.some(f => f.id === l.jobId)) continue;
    jobCorrections.push({ id: l.jobId, categories: cats.concat(cat) });
    note('Catégorie ' + cat + ' ajoutée à ' + l.jobId + ' (corps ' + routeId + ')');
  }
}

/* ---------- Corps rattachés à un concours existant ---------- */
const fixes = {};
const fix = id => fixes[id] || (fixes[id] = { id });
for (const a of research.attach) {
  if (!routesById[a.routeId]) throw new Error('Corps inconnu : ' + a.routeId);
  for (const cid of a.concours || []) {
    const c = concoursById[cid];
    if (!c) throw new Error('Concours inconnu ' + cid + ' pour ' + a.routeId);
    if (routeCat(a.routeId) !== c.cat || !routesById[a.routeId].fp.includes(c.fp)) note('Rattachement ' + a.routeId + ' (' + routeCat(a.routeId) + ' ' + routesById[a.routeId].fp + ') à ' + cid + ' (' + c.cat + ' ' + c.fp + ') : catégorie ou versant différent');
    (fix(cid).addRouteIds ||= []).push(a.routeId);
  }
}

/* ---------- Nouvelles fiches ---------- */
let number = Math.max(...base.concours.map(c => Number(c.id.slice(2)))) + 1;
const created = [], concoursOfRef = {};
for (const r of research.concours) {
  const routeId = r.route && r.route.existing;
  const route = routesById[routeId];
  if (!route) throw new Error('Corps inconnu pour ' + r.ref + ' : ' + routeId);
  if (routeCat(routeId) !== r.cat || !route.fp.includes(r.fp)) note('Fiche ' + r.ref + ' (' + r.cat + ' ' + r.fp + ') sur le corps ' + routeId + ' (' + routeCat(routeId) + ' ' + route.fp + ')');
  if (!isOfficialLink(r.officialUrl)) throw new Error('Lien officiel direct manquant pour ' + r.ref);
  const id = (r.fp === 'T' ? 'T' : r.fp === 'H' ? 'H' : 'É') + '-' + String(number++).padStart(3, '0');
  const lvl = typeof r.lvl === 'number' ? r.lvl : typeof route.lvl === 'number' ? route.lvl : null;
  const years = (r.sessions || []).map(s => s.session).filter(Boolean).sort();
  const c = { id, fp: r.fp, cat: r.cat, name: clean(r.name), routeIds: [routeId] };
  if (lvl !== null) c.lvl = lvl;
  Object.assign(c, {
    voies: clean(r.voies) || '', metiers: clean(r.metiers) || '', domain: clean(r.domain) || '', condition: clean(r.condition) || '', epreuves: clean(r.epreuves) || '',
    variations: 'Selon voie, spécialité et session ; vérifier le texte en vigueur',
    sessions: r.epreuves ? [{ session: years.includes('2027') || !years.length ? '2027' : years[years.length - 1], text: clean(r.epreuves), caution: '', status: 'Recherche du 22 octobre 2026, à confirmer sur l’avis officiel', url: r.officialUrl }] : []
  });
  if (isOfficialLink(r.annalesUrl)) c.annales = { kind: 'Sujets et rapports de jury', years: '', url: r.annalesUrl, scope: c.name, caution: 'Vérifier la session et la voie.' };
  Object.assign(c, orientation(r, routeId, lvl));
  for (const k of ['description', 'school', 'organizer', 'trainingMonths', 'paidTraining', 'places', 'evolution']) if (hasValue(r[k])) c[k] = clean(r[k]);
  Object.assign(c, { source: r.officialUrl, checked: r.checked || CHECKED, next: [], researchChecked: r.checked || CHECKED, researchConfidence: r.confidence, researchNotes: r.notes || '' });
  created.push(c); concoursOfRef[r.ref] = c;
}

/* Organisation du concours quand le corps n’en a pas encore pour ce versant. */
const examDetails = [];
for (const r of research.concours) {
  const c = concoursOfRef[r.ref], route = routesById[c.routeIds[0]], key = route.id + '__' + c.fp;
  if (examKeys.has(key) || examDetails.some(e => e.id === key)) continue;
  examDetails.push({ id: key, routeId: route.id, fp: c.fp, name: 'Concours : ' + clean(r.name), org: clean(r.organizer), metro: 'Lieux précisés dans l’avis de chaque session.',
    om: 'Centres d’outre-mer précisés dans l’avis lorsque le concours en ouvre.', source: r.officialUrl, checked: CHECKED, officialLinks: [{ label: 'Page officielle du concours', url: r.officialUrl }] });
}

/* ---------- Champs complétés des fiches existantes (C4) ---------- */
for (const u of research.updates) {
  if (!concoursById[u.id]) throw new Error('Concours inconnu (C4) : ' + u.id);
  for (const k of ['school', 'trainingMonths', 'paidTraining']) {
    if (!(k in u) || !hasValue(u[k]) || hasValue(concoursById[u.id][k])) continue;
    fix(u.id)[k] = k === 'trainingMonths' ? Number(u[k]) : clean(u[k]);
  }
}

/* ---------- Corps sans concours ---------- */
for (const n of research.noConcours) note('Corps sans concours, à traiter : ' + n.routeId + ' ' + (n.text || '').slice(0, 80));

/* Chaque corps des lots C1 à C3 trouve une fiche, un rattachement ou une explication. */
for (const [lot, ids] of Object.entries(lots)) {
  if (lot === 'C4') continue;
  for (const id of ids) if (!research.concours.some(r => r.route && r.route.existing === id) && !research.attach.some(a => a.routeId === id) && !research.noConcours.some(n => n.routeId === id)) note('Corps sans résultat (' + lot + ') : ' + id);
}

/* ---------- Calendrier ---------- */
const MONTHS = /\d{1,2}(er)?\s+(janv|févr|fevr|mars|avr|mai|juin|juil|août|aout|sept|oct|nov|déc|dec)/i;
const monthOnly = (iso, label) => !!iso && hasValue(label) && !MONTHS.test(label);
const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const TENTATIVE = /prévision|provisoire|à confirmer|indicati|sous réserve/i;
const datesOf = x => [x.open, x.date || x.close, x.written, x.oral, x.results].filter(Boolean);
const isUpcoming = x => { const d = [x.date, x.written, x.oral].filter(Boolean); return d.some(v => v >= TODAY) || (!d.length && x.provisional); };
const calendar = [], ids = new Set(base.calendar.map(x => x.id));
let skippedPast = 0;
for (const r of research.concours) {
  const c = concoursOfRef[r.ref];
  const future = s => !datesOf(s).length || datesOf(s).some(d => d >= TODAY);
  const keepPast = !(r.sessions || []).some(future);
  for (const s of r.sessions || []) {
    if (!future(s) && !keepPast) { skippedPast++; continue; }
    const voie = clean(s.voie) || 'Toutes les voies', year = s.session || (datesOf(s)[0] || '').slice(0, 4) || '2027';
    let id = ('corps-' + slug(c.id.replace('É', 'E')) + '-' + slug(voie) + '-' + year).slice(0, 90).replace(/-$/, ''), n = 1;
    while (ids.has(id)) id = id.replace(/-\d+$/, '') + '-' + (++n);
    ids.add(id);
    const past = !future(s);
    const provisional = !past && (!!s.provisional || r.confidence === 'faible' || !datesOf(s).length || TENTATIVE.test([s.voie, s.openLabel, s.closeLabel, s.writtenLabel, s.oralLabel].join(' ')) || [['open', 'openLabel'], ['close', 'closeLabel'], ['written', 'writtenLabel'], ['oral', 'oralLabel']].some(([d, l]) => monthOnly(s[d], s[l])));
    calendar.push({
      id, name: c.name, rawName: c.name + ' · ' + voie + ' · session ' + year, cat: c.cat, fp: c.fp, voie, url: s.url || r.officialUrl,
      source: clean(r.organizer) + ' ; recherche du 22 octobre 2026', checked: r.checked || CHECKED,
      open: s.open || null, date: s.close || null, openLabel: clean(s.openLabel) || '', closeLabel: clean(s.closeLabel) || '',
      written: s.written || null, writtenLabel: clean(s.writtenLabel) || '', oral: s.oral || null, oralLabel: clean(s.oralLabel) || '',
      routeIds: c.routeIds.slice(), provisional, employer: clean(s.employer || r.organizer)
    });
  }
}
const calendarExpected = [];
for (const r of research.concours) {
  const c = concoursOfRef[r.ref];
  if (!hasValue(r.expected) || calendar.some(x => x.routeIds.includes(c.routeIds[0]) && x.fp === c.fp && isUpcoming(x))) continue;
  calendarExpected.push({ concours: c.id, voie: 'Toutes les voies', expected: clean(r.expected), url: r.officialUrl, checked: r.checked || CHECKED });
}

/* ---------- Écriture ---------- */
write(OUT.concours, { concours: created });
write(OUT.exam, { examDetails });
write(OUT.calendar, { calendar, calendarExpected }, 1);
write(OUT.fixes, { concoursCorrections: Object.values(fixes), routeCorrections });
write(OUT.jobs, { jobCorrections });
const parts = manifest.parts.filter(p => !outParts.includes(p));
const at = parts.indexOf('catalogue/audit-01.json');
parts.splice(at < 0 ? parts.length : at, 0, OUT.concours, OUT.exam, OUT.calendar, OUT.fixes);
parts.push(OUT.jobs);
manifest.parts = parts;
fs.writeFileSync(new URL('data/catalogue.json', root), JSON.stringify(manifest, null, 2) + '\n');

console.log('Recherches lues :', research.concours.length, 'fiches,', research.attach.length, 'rattachements,', research.noConcours.length, 'corps sans concours,', research.updates.length, 'fiches à compléter');
console.log('Concours :', created.length, 'nouveaux' + (created.length ? ' (' + created[0].id + ' à ' + created[created.length - 1].id + ')' : '') + ' ; organisation :', examDetails.length);
console.log('Corrections :', Object.values(fixes).filter(f => f.addRouteIds).length, 'concours reçoivent un corps ;', Object.values(fixes).reduce((a, f) => a + ['school', 'trainingMonths', 'paidTraining'].filter(k => k in f).length, 0), 'champs complétés');
console.log('Calendrier :', calendar.length, 'sessions,', skippedPast, 'passées ignorées ;', calendarExpected.length, 'sessions attendues');
if (log.length) console.log(log.map(s => '  · ' + s).join('\n'));
