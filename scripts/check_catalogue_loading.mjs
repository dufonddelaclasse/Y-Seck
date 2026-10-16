import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Les réponses arrivent dans le désordre : le catalogue doit garder l'ordre de son index.
const paths=Array.from({length:23},(_,i)=>'part-'+i+'.json');
let active=0,maximum=0,loaded=[];
let resolveComplete,rejectComplete;
const complete=new Promise((resolve,reject)=>{resolveComplete=resolve;rejectComplete=reject;});
const context={window:{},console:{error:rejectComplete},document:{
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
