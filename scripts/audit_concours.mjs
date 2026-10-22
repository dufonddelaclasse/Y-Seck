import fs from 'node:fs'; import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('data/catalogue.json', root), 'utf8'));
const db = {};
for (const part of manifest.parts) { const data = JSON.parse(fs.readFileSync(new URL('data/' + part, root), 'utf8')); for (const [k,v] of Object.entries(data)) { if (Array.isArray(v)) (db[k] ||= []).push(...v); else db[k] = v; } }
const app = {addEventListener(){}, querySelector(){return null;}, querySelectorAll(){return [];}, classList:{toggle(){}}};
const context = { window:{PUBLIC_DATA:db, addEventListener(){}, scrollTo(){}}, location:{hash:'#/metiers'}, document:{getElementById(id){return id==='app'?app:null;}, addEventListener(){}, documentElement:{dataset:{}}, activeElement:null}, localStorage:{getItem(){return null;},setItem(){}}, matchMedia(){return {matches:false};}, setTimeout(){return 0;}, clearTimeout(){}, requestAnimationFrame(){}, Intl };
context.window = context.window; vm.createContext(context);
for (const f of ['js/data.js','js/catalog.js','js/ui.js']) vm.runInContext(fs.readFileSync(new URL(f,root),'utf8'),context);
context.window.YSECK_UI.afterRender=()=>{};
let src=fs.readFileSync(new URL('js/app.js',root),'utf8');
src=src.replace('  UI.init();\n  render();\n  booted = true;', '  window.tests={D,concoursSessions,concoursJobs,jobRefs,jobCategories,prepaText};');
vm.runInContext(src,context);
const {D,concoursSessions,concoursJobs,jobRefs}=context.window.tests;
const today=new Date().toISOString().slice(0,10);
console.log('CONCOURS', D.concours.length, '| calendrier', D.calendar.length, '| routes', Object.keys(D.accessRoutes).length, '| jobs', D.jobs.length);
const rows=[];
for (const c of D.concours) {
  const all=concoursSessions(c,true), up=all.filter(s=>[s.date,s.written,s.oral].filter(Boolean).some(d=>d>=today));
  const jobs=concoursJobs(c);
  rows.push([c.id,c.cat,c.fp,c.name.slice(0,60),all.length,up.length,jobs.length,(c.sessions||[]).length,c.next?'next':'',c.annales?'ann':'', (D.examDetails||[]).some(e=>c.routeIds.includes(e.routeId))?'exam':'']);
}
rows.sort((a,b)=>a[5]-b[5]||a[4]-b[4]);
console.log(['id','cat','fp','nom','sessions(toutes)','à venir','métiers liés','sessions champ','next','annales','examDetails'].join(' | '));
for (const r of rows) console.log(r.join(' | '));
// Écoles / concours cités dans les fiches métiers mais absents du catalogue concours
const names=D.concours.map(c=>[c.name,c.school,c.organizer].filter(Boolean).join(' ').toLowerCase()).join(' '); // école et organisateur comptent aussi
const schools=['ENM','magistrature','ENG','greffes','ENAP','ENPJJ','ENSP','ENSOP','EOGN','gendarmerie','ENFiP','douanes','ENCCRF','EHESP','INET','IRA','INSP','Enssib','INP','patrimoine','chartes','ENSAI','ENSAE','INSEE','ENTPE','météorologie','ENSG','EN3S','ENSOSP','ENAC','ENSM','INTEFP','ENSV','vétérinaire','Saint-Cyr','navale','Polytechnique','CRPE','CAPES','agrégation','ENSTA','Cour des comptes','Conseil d’État','Banque de France','ENSAP','pénitentiaire','police','sapeur','ingénieur des ponts','IGN','armées','commissaire des armées','santé des armées','officier','ENSEA','Mines','ENA'];
const hits={};
for (const j of D.jobs) { const text=[j.name,j.desc,(j.steps||[]).join(' '),j.prep,j.access,j.conditions].join(' '); for (const s of schools) if (new RegExp('\\b'+s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i').test(text)) (hits[s] ||= []).push(j.name.slice(0,45)); }
console.log('\nÉCOLES / CONCOURS cités dans les fiches métiers :');
for (const [s,l] of Object.entries(hits).sort((a,b)=>b[1].length-a[1].length)) console.log(s.padEnd(22), String(l.length).padStart(4), names.includes(s.toLowerCase())?'(présent dans les concours)':'ABSENT des concours', '|', l.slice(0,3).join(' ; '));
