/* Exporte les métiers par paquets de 60 pour le classement par domaine (cœur / proches).
   Sortie : data/work/domain-corpus-NN.json (dossier ignoré par git, matière de travail). */
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('data/catalogue.json', root), 'utf8'));
const db = {};
for (const part of manifest.parts) {
  const data = JSON.parse(fs.readFileSync(new URL('data/' + part, root), 'utf8'));
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) (db[key] ||= []).push(...value); else db[key] = value;
  }
}
const context = { window: { PUBLIC_DATA: db } };
vm.createContext(context);
for (const file of ['js/data.js', 'js/catalog.js']) vm.runInContext(fs.readFileSync(new URL(file, root), 'utf8'), context);
const D = context.window.DATA;

const cut = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n) + '…' : t; };
const rows = D.jobs.map(j => ({
  id: j.id,
  name: j.name,
  rmfpDomain: j.rmfpDomain || null,
  family: j.family || null,
  domain: j.domain || null,
  legacy: !j.rmfpDomain,
  strongInterests: j.strongInterests,
  categories: j.categories || (j.cat ? [j.cat] : []),
  desc: cut(j.desc, 300),
  activities: cut(j.activities, 400)
}));

const out = new URL('data/work/', root);
fs.mkdirSync(out, { recursive: true });
const size = 60;
let n = 0;
for (let i = 0; i < rows.length; i += size) {
  n++;
  const name = 'domain-corpus-' + String(n).padStart(2, '0') + '.json';
  fs.writeFileSync(new URL(name, out), JSON.stringify(rows.slice(i, i + size), null, 1));
}
console.log(rows.length + ' métiers exportés en ' + n + ' paquets dans data/work/.');
