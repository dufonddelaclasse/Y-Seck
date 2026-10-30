/* Contrôle du classement des métiers par domaine (data/catalogue/domain-tags-NN.json).
   Sans argument : chaque métier du catalogue a exactement une entrée, 1 ou 2 cœurs, des domaines connus ;
   affiche les effectifs « cœur » et « proche » par domaine.
   Avec un numéro (ex. node scripts/check_domain_tags.mjs 07) : contrôle ce seul paquet contre data/work/domain-corpus-07.json. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('data/catalogue.json', root), 'utf8'));
const meta = JSON.parse(fs.readFileSync(new URL('data/catalogue/metadata.json', root), 'utf8'));
const DOMAINS = meta.settings.interestOptions.map(o => o.id);
const known = new Set(DOMAINS);

function checkEntries(entries, ids, label) {
  const seen = new Map();
  for (const e of entries) {
    assert(e && typeof e.job === 'string', label + ' : entrée sans identifiant de métier.');
    assert(!seen.has(e.job), label + ' : ' + e.job + ' classé deux fois.');
    seen.set(e.job, e);
    assert(Array.isArray(e.coeur) && e.coeur.length >= 1 && e.coeur.length <= 2, label + ' : ' + e.job + ' doit avoir 1 ou 2 cœurs.');
    const near = e.proches || [];
    assert(Array.isArray(near) && near.length <= 4, label + ' : ' + e.job + ' a trop de domaines proches.');
    for (const d of e.coeur.concat(near)) assert(known.has(d), label + ' : domaine inconnu « ' + d + ' » pour ' + e.job + '.');
    assert(new Set(e.coeur).size === e.coeur.length, label + ' : cœur en double pour ' + e.job + '.');
    assert(near.every(d => !e.coeur.includes(d)), label + ' : ' + e.job + ' a un domaine à la fois cœur et proche.');
  }
  for (const id of ids) assert(seen.has(id), label + ' : métier non classé ' + id + '.');
  for (const id of seen.keys()) assert(ids.includes(id), label + ' : métier inconnu ' + id + '.');
  return seen;
}

const arg = process.argv[2];
if (arg) {
  const nn = String(arg).padStart(2, '0');
  const corpus = JSON.parse(fs.readFileSync(new URL('data/work/domain-corpus-' + nn + '.json', root), 'utf8'));
  const tags = JSON.parse(fs.readFileSync(new URL('data/catalogue/domain-tags-' + nn + '.json', root), 'utf8')).domainTags;
  checkEntries(tags, corpus.map(j => j.id), 'Paquet ' + nn);
  console.log('Paquet ' + nn + ' valide : ' + tags.length + ' métiers.');
  process.exit(0);
}

const db = {};
for (const part of manifest.parts) {
  const data = JSON.parse(fs.readFileSync(new URL('data/' + part, root), 'utf8'));
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) (db[key] ||= []).push(...value); else db[key] = value;
  }
}
const tagParts = manifest.parts.filter(p => /domain-tags-\d+\.json$/.test(p));
assert(tagParts.length > 0, 'Le manifeste doit lister les fichiers domain-tags.');
const context = { window: { PUBLIC_DATA: db } };
vm.createContext(context);
for (const file of ['js/data.js', 'js/catalog.js']) vm.runInContext(fs.readFileSync(new URL(file, root), 'utf8'), context);
const D = context.window.DATA;
const tags = db.domainTags || [];
checkEntries(tags, D.jobs.map(j => j.id), 'Catalogue');

/* Graphe des domaines proches : identifiants connus, pas de boucle sur soi. */
const graph = meta.settings.domainGraph || {};
for (const [d, g] of Object.entries(graph)) {
  assert(known.has(d), 'domainGraph : domaine inconnu ' + d);
  for (const p of g.proches || []) { assert(known.has(p), 'domainGraph : proche inconnu ' + p + ' pour ' + d); assert(p !== d, 'domainGraph : ' + d + ' proche de lui-même'); }
}

const core = {}, near = {};
for (const e of tags) { for (const d of e.coeur) core[d] = (core[d] || 0) + 1; for (const d of e.proches || []) near[d] = (near[d] || 0) + 1; }
for (const d of DOMAINS) {
  assert((core[d] || 0) > 0, 'Aucun métier au cœur du domaine ' + d);
  console.log(d.padEnd(15) + String(core[d] || 0).padStart(4) + ' cœur  ' + String(near[d] || 0).padStart(4) + ' proches');
}
/* Les métiers rangés dans le catalogue doivent porter les cercles calculés. */
assert(D.jobs.every(j => Array.isArray(j.coreDomains) && j.coreDomains.length >= 1), 'Chaque métier doit recevoir ses domaines cœur.');
console.log('Contrôle réussi : ' + tags.length + ' métiers classés par domaine.');
