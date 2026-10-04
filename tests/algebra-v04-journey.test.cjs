'use strict';
const assert=require('node:assert/strict');
const C=require('../games/algebra-trainer/core.js'),L=require('../games/algebra-trainer/learning-core.js'),W=require('../games/algebra-trainer/world-core.js'),J=require('../games/algebra-trainer/journey-core.js'),P=require('../games/algebra-trainer/journey-paper.js');
function expression(e){if(e.t==='num')return e.q.n+'/'+e.q.d;if(e.t==='var')return 'x';if(e.t==='add')return '('+e.terms.map(expression).join('+')+')';if(e.t==='mul')return '('+e.factors.map(expression).join('*')+')';if(e.t==='div')return '('+expression(e.n)+')/('+expression(e.d)+')';throw Error(e.t);}
const eq=e=>expression(e.l)+'='+expression(e.r),value=q=>q.n+'/'+q.d;
function answer(t){if(['predict','expand','repair'].includes(t.kind))return {input:eq(t.expected),location:t.location};if(t.kind==='build')return {input:value(t.expectedNumber)};if(t.kind==='verify'){const a=L.evaluate(t.ex.start.l,t.proposed),b=L.evaluate(t.ex.start.r,t.proposed);return {left:value(a),right:value(b),choice:a.eq(b)?'yes':'no'};}if(t.kind==='routes')return {choice:String(t.routes.findIndex((r,i)=>L.validate(t,{choice:String(i)}).ok))};}
let tasksChecked=0;
assert.deepEqual([...new Set(J.stops.flatMap(s=>s.skills))].sort(),C.TYPES.map(t=>t.id).sort());
assert.equal(J.worlds.length,5);assert.equal(J.stops.length,7);
for(const s of J.stops)for(let seed=1;seed<=100;seed++){
 const run=J.mission(s.id,seed);assert.equal(run.tasks.length,6);assert.equal(run.results.filter(r=>r.supported).length,2);assert.deepEqual(run, J.mission(s.id,seed));
 for(const t of run.tasks){
  const q=P.question(t),key=P.answer(t);assert.ok(q.math&&q.prompt&&key.lines.length);
  if(t.kind==='solve'){
   assert.ok(L.evaluate(t.ex.start.l,t.ex.solution).eq(L.evaluate(t.ex.start.r,t.ex.solution)));
   let current=t.ex.start;
   for(const step of t.ex.steps){const old=current;current=C.applyEquation(current,step.op,step.operand);assert.ok(L.evaluate(current.l,t.ex.solution).eq(L.evaluate(current.r,t.ex.solution)));assert.notEqual(C.eqSig(old),C.eqSig(current));}
   assert.ok(C.solvedEquation(current));
  }else{
   assert.ok(L.validate(t,answer(t)).ok, s.id+' '+seed+' '+t.kind);
   if(t.kind==='routes')assert.equal(L.validate(t,{choice:''}).ok,false);
   if(t.kind==='verify'){const a=answer(t);a.choice=a.choice==='yes'?'no':'yes';assert.equal(L.validate(t,a).ok,false);}
   if(t.kind==='predict')assert.equal(L.validate(t,{input:'x=999'}).ok,false);
   if(t.kind==='build')assert.equal(L.validate(t,{input:value(t.expectedNumber.add(C.R(1)))}).ok,false);
  }
  tasksChecked++;
 }
}
const r=J.mission('route-inverse',123),evidence=r.results.map(r=>({...r,done:true}));
assert.equal(J.record(null,r.skill,evidence.slice(1)).xp,0);
assert.equal(J.record(null,r.skill,evidence.map((e,i)=>({...e,done:!!i}))).xp,0);
const first=J.record(null,r.skill,evidence);assert.equal(first.xp,30);assert.equal(J.xp(first.progress),30);
assert.equal(J.record(first.progress,r.skill,evidence).xp,0);assert.equal(J.info(first.progress,r.skill).status,'Zelfstandig gelukt');
const aided=evidence.map(e=>({...e,supported:true}));assert.equal(J.info(J.record(null,r.skill,aided).progress,r.skill).status,'Geoefend');
assert.equal(J.info(J.record(first.progress,r.skill,aided).progress,r.skill).status,'Zelfstandig gelukt');
const errors=evidence.map(e=>({...e,errors:1}));assert.equal(J.independently(errors),false);
const partial={...r,results:r.results.map((e,i)=>({...e,done:i===0}))};assert.equal(J.info(null,r.skill,{[r.skill]:partial}).status,'Bezig');
assert.equal(J.info(null,r.skill,{[r.skill]:partial}).finished,false);
let old=W.normalize(null);for(const skill of J.stop(r.skill).skills)old=W.recordMission(old,'eq-'+skill,Array.from({length:5},()=>({done:true,supported:false}))).progress;
const oldBefore=JSON.stringify(old);assert.equal(J.info(null,r.skill,{},old).status,'Geoefend');assert.equal(J.record(null,r.skill,evidence,old).xp,0);assert.equal(JSON.stringify(old),oldBefore);
assert.equal(J.platform(null,old,null).completed.length,1);assert.equal(J.platform(null,old,null).total,13);
assert.deepEqual(J.worlds.filter(w=>w.ready).map(w=>w.id),['equations','systems']);
const serialized=JSON.parse(JSON.stringify(r),(k,v)=>v&&typeof v==='object'&&Object.keys(v).length===2&&Number.isSafeInteger(v.n)&&Number.isSafeInteger(v.d)?new C.Rat(v.n,v.d):v);
assert.equal(L.validate(serialized.tasks[1],answer(serialized.tasks[1])).ok,true);
const oldRun=L.mission('B1',99);oldRun.results[0].done=true;
assert.equal(J.info(null,'route-two',{'eq-B1':oldRun}).activeId,'eq-B1');assert.equal(J.info(null,'route-two',{'eq-B1':oldRun}).total,5);
const vm=require('node:vm'),fs=require('fs'),sandbox={window:{}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../js/catalog-progress.js'),'utf8'),sandbox);
const catalog=sandbox.window.LeraarBobCatalogProgress,game={id:'algebra-trainer'},saved={state:{storage:{'leraarbob.algebra.v1':JSON.stringify({chapterJourney:first.progress,journey:old}),'leraarbob.algebra.framework.v1':JSON.stringify({version:1,levels:Object.fromEntries(Array.from({length:68},(_,i)=>[i,{completed:true,started:true}]))})}}};
assert.equal(catalog.summarize(game,saved).completed,1);assert.equal(catalog.summarize(game,saved).max,13);assert.equal(catalog.earnedXP(game,saved),150);
console.log(JSON.stringify({ok:true,tasksChecked,seedsPerStop:100,checks:['all 17 types','deterministic missions','exact solutions and transitions','correct and incorrect typed answers','empty route rejected','task-specific answer keys','no partial completion','one-time XP','hints and errors distinct','previous progress preserved','13 playable stops','serialized mission revives']}));
