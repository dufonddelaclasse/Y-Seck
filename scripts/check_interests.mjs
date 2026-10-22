import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('data/catalogue.json',root),'utf8'));
const db={};
for(const part of manifest.parts){
  const data=JSON.parse(fs.readFileSync(new URL('data/'+part,root),'utf8'));
  for(const [key,value] of Object.entries(data)){
    if(Array.isArray(value))(db[key]||=[]).push(...value);else db[key]=value;
  }
}
const context={window:{PUBLIC_DATA:db}};
vm.createContext(context);
for(const file of ['js/data.js','js/catalog.js'])vm.runInContext(fs.readFileSync(new URL(file,root),'utf8'),context);
const data=context.window.DATA;
assert.equal(new Set(data.domains).size,37,'Les 37 choix doivent être distincts.');
assert.equal(data.jobs.length,db.legacyJobs.concat(db.rmfp).filter(job=>job.active!==false).length);
assert(data.jobs.every(job=>job.interests.includes(job.domain)),'Les domaines principaux doivent rester compatibles.');
assert(data.jobs.find(job=>job.id==='chancellerie').interests.includes('Diplomatie'));
assert(!data.jobs.find(job=>job.id==='ctrl-fip').interests.includes('Mer'));
for(const id of data.domains){
  const matches=data.jobs.filter(job=>job.interests.includes(id));
  assert(matches.length>0,'Aucun métier associé à '+id);
  console.log(data.domainLabels[id]+': '+matches.length);
}
assert.equal(data.crosswalk.length,db.links.length,'Les correspondances métier / corps doivent être conservées.');
console.log('Contrôle réussi : domaines, métiers et correspondances conservés.');
