import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Les réponses arrivent dans le désordre : le catalogue doit garder l'ordre de son index.
const paths=Array.from({length:23},(_,i)=>'part-'+i+'.json');
let active=0,maximum=0,loaded=[];
let resolveComplete,rejectComplete;
const complete=new Promise((resolve,reject)=>{resolveComplete=resolve;rejectComplete=reject;});
const context={window:{},localStorage:{getItem(){return JSON.stringify({done:true});}},console:{error:rejectComplete},document:{
  getElementById(){return {};},createElement(){return {};},
  body:{appendChild(script){loaded.push(script.src);script.onload();if(script.src.includes('app.js'))resolveComplete();}}
},fetch:async path=>{
  if(path==='data/catalogue.json')return {ok:true,json:async()=>({parts:paths})};
  const i=paths.indexOf(path.replace('data/',''));assert(i>=0);
  active++;maximum=Math.max(maximum,active);
  await new Promise(resolve=>setTimeout(resolve,(23-i)%4));active--;
  return {ok:true,json:async()=>({items:[i],label:'part-'+i})};
}};
vm.runInNewContext(fs.readFileSync(new URL('../js/catalog-data.js',import.meta.url),'utf8'),context);
await complete;
assert(maximum>1&&maximum<=6,'Les lectures doivent rester parallèles et limitées.');
assert.deepEqual(Array.from(context.window.PUBLIC_DATA.items),paths.map((_,i)=>i));
assert.equal(context.window.PUBLIC_DATA.label,'part-22');
assert.equal(loaded.length,2);
assert(loaded[0].includes('catalog.js')&&loaded[1].includes('app.js'));
console.log('Chargement vérifié : ordre de fusion conservé, six lectures simultanées maximum.');

// Premier passage, sans profil terminé : seuls les réglages de l’onboarding sont lus, puis tout le catalogue à la fin du profil.
const parts=['catalogue/metadata.json','catalogue/rmfp-01.json','catalogue/routes-01.json'];
const read=[],scripts=[];let appLoaded;const appReady=new Promise(resolve=>{appLoaded=resolve;});
const light={window:{},localStorage:{getItem(){return null;}},console:{error(e){throw e;}},document:{
  getElementById(){return {};},createElement(){return {};},
  body:{appendChild(script){scripts.push(script.src);script.onload();if(script.src.includes('app.js'))appLoaded();}}
},fetch:async path=>{
  if(path==='data/catalogue.json')return {ok:true,json:async()=>({parts})};
  read.push(path);
  return {ok:true,json:async()=>(path.includes('metadata')?{settings:{domains:['Santé']}}:{rmfp:[{id:path}]})};
}};
vm.runInNewContext(fs.readFileSync(new URL('../js/catalog-data.js',import.meta.url),'utf8'),light);
await appReady;
assert.deepEqual(read,['data/catalogue/metadata.json'],'Sans profil, seuls les réglages de l’onboarding sont lus.');
assert.equal(light.window.YSECK_CATALOG.full,false);
assert.deepEqual(Array.from(light.window.PUBLIC_DATA.rmfp),[],'Le catalogue des métiers attend la fin du profil.');
await light.window.YSECK_CATALOG.loadAll();
assert.equal(light.window.YSECK_CATALOG.full,true);
assert.equal(read.length,1+parts.length,'Fin du profil : tout le catalogue est lu.');
assert.equal(light.window.PUBLIC_DATA.rmfp.length,2);
assert(scripts.filter(src=>src.includes('catalog.js')).length===2,'Les données sont préparées une seconde fois avec le catalogue complet.');
console.log('Premier passage vérifié : onboarding seul, puis catalogue complet à la fin du profil.');
