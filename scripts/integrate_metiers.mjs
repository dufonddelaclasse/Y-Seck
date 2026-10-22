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
const LOTS = ['S1', 'S2', 'S3'];
const lots = {}, research = { concours: [], jobs: [], noConcours: [] };
for (const lot of LOTS) {
  lots[lot] = read(RESEARCH + 'lots/lot-' + lot + '.json').map(j => j.id);
  const verified = fs.existsSync(new URL(RESEARCH + 'out/' + lot + '.verified.json', root));
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
const SPEC = {};

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
  if (route.lvl) c.lvl = route.lvl;
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
    id: route.id + '__' + route.fp, routeId: route.id, fp: route.fp, name: (route.military ? 'Recrutement : ' : 'Concours : ') + route.name,
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
  if (!routesById[routeId].military) correction(jobId).recruitment = null;
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
