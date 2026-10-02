'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const V=require('../games/rechten/rechtenwereld/values-core.js'),R=require('../games/rechten/rechtenwereld/mission-runtime.js'),W=require('../games/rechten/core/wave-core.js'),XP=require('../games/rechten/rechtenwereld/xp.js');
const A=require('../games/rechten/rechtenwereld/content/area-maps.js'),S=require('../games/rechten/rechtenwereld/components/shell-view.js'),View=require('../games/rechten/rechtenwereld/components/values-view.js'),Learn=require('../games/rechten/rechtenwereld/learn-config.js');
const response=(t,phase)=>Object.fromEntries(V.fields(t,phase).map(name=>[name,W.text(V.expected(t,name))]));
function fill(s){for(const[k,v]of Object.entries(response(R.active(s).task,R.active(s).phase)))s=R.edit(s,k,v);return s}
function solve(s){s=R.commit(fill(s));assert(R.active(s).feedback.result.ok);return XP.update(R.advance(s))}
test('substitute x before calculating, retain the substitution, and resume older calculations without resetting work',()=>{
 let s=R.start(R.initial(),'fx');assert.equal(R.active(s).phase,'fx-substitute');
 s=R.advance(R.commit(R.edit(s,'answer','7')));assert.equal(R.active(s).phase,'fx-substitute');assert.equal(R.active(s).errors,0);
 s=R.advance(R.commit(R.edit(s,'substitution','-3')));assert.equal(R.active(s).phase,'fx-substitute');assert.equal(R.active(s).index,0);
 s=solve(s);assert.equal(R.active(s).phase,'fx-calculate');assert.equal(R.active(s).locks.substitution,true);assert.equal(s.platformXp,0);
 s=R.edit(s,'substitution','99');assert.equal(R.active(s).values.substitution,'3');const before=structuredClone(R.active(s));s=R.start(R.start(JSON.parse(JSON.stringify(s)),'table'),'fx');assert.deepEqual(R.active(s),before);
 let legacy=R.start(R.initial(),'fx');legacy.missions.fx.phase='fx-calculate';legacy=R.edit(legacy,'product','6');const old=structuredClone(R.active(legacy));legacy=R.start(legacy,'fx');assert.deepEqual(R.active(legacy),old);legacy=solve(legacy);assert.equal(R.active(legacy).index,1);assert.equal(R.active(legacy).phase,'fx-substitute');assert.equal(legacy.platformXp,5);
});
test('exact function and table arithmetic agrees with an independent rational oracle, including signs, zero and halves',()=>{
 const variants=new Set(),signs=new Set();
 for(const skill of V.skills)for(let run=1;run<=12;run++)for(let index=0;index<6;index++){
  const t=V.makeTask(skill,index,run),a=t.model.a,b=t.model.b;variants.add(t.variant);assert.equal(t.family_id,'F4');assert.equal(t.inputs[t.givenColumn].n,0);assert.equal(t.inputs.length,5);
  const inputs=skill==='fx'?[t.x]:t.inputs;
  for(const x of inputs){
   const n=BigInt(a.n)*BigInt(x.n)*BigInt(b.d)+BigInt(b.n)*BigInt(a.d)*BigInt(x.d),d=BigInt(a.d)*BigInt(x.d)*BigInt(b.d),actual=V.output(t,x);
   assert.equal(BigInt(actual.n)*d,n*BigInt(actual.d));signs.add(Math.sign(x.n));
  }
  for(const phase of skill==='fx'?['fx-substitute','fx-calculate']:['table-fill']){const correct=response(t,phase);assert(V.check(t,correct,phase).ok);assert(!V.check(t,{},phase).ok);
  for(const field of V.fields(t,phase)){
   const q=V.expected(t,field);assert(V.check(t,{...correct,[field]:(q.n*2)+'/'+(q.d*2)},phase).ok);
   if(q.d===2)assert(V.check(t,{...correct,[field]:String(q.n/q.d).replace('.',',')},phase).ok);
   const bad=V.check(t,{...correct,[field]:W.text(W.add(q,1))},phase);assert(!bad.ok);assert.equal(bad.keep[field],false);
  }
  }assert.deepEqual(JSON.parse(JSON.stringify(t)),t);
 }
 assert.deepEqual([...variants].sort(),['constant','negative','negative-fraction','positive','positive-fraction']);assert.deepEqual([...signs].sort(),[-1,0,1]);
 const xs=V.makeTask('table',1).inputs.map(W.num);assert(xs.some((x,i)=>i&&x-xs[i-1]!==1));
});
test('each correct arithmetic component or cell survives mistakes, incomplete input and undo without premature XP',()=>{
 for(const skill of V.skills){let s=R.start(R.initial(),skill);if(skill==='fx')s=solve(s);const t=R.active(s).task,phase=R.active(s).phase,names=V.fields(t,phase),correct=response(t,phase);s=fill(s);s=R.edit(s,names.at(-1),'99');s=R.advance(R.commit(s));
  for(const name of names.slice(0,-1)){assert.equal(R.active(s).locks[name],true);assert.equal(R.active(R.edit(s,name,'999')).values[name],correct[name]);}
  assert(!R.active(s).locks[names.at(-1)]);assert.equal(s.platformXp||0,0);assert.equal(R.active(s).index,0);
  s=R.edit(s,names.at(-1),correct[names.at(-1)]);s=R.undo(s);assert.equal(R.active(s).values[names.at(-1)],'99');s=solve(s);assert.equal(s.platformXp,5);
  let missing=R.start(R.initial(),skill);if(skill==='fx')missing=solve(missing);missing=R.edit(missing,names[0],correct[names[0]]);missing=R.advance(R.commit(missing));assert.equal(R.active(missing).errors,0);assert.equal(R.active(missing).locks[names[0]],true);
 }
 const t=V.makeTask('fx');assert.equal(V.check(t,{product:'6',answer:'6'},'fx-calculate').code,'fx.output');assert.equal(V.check(t,{product:'7',answer:'7'},'fx-calculate').code,'fx.product');
});
test('both six-task rounds resume independently and complete their own map stop with idempotent XP',()=>{
 let s=R.edit(R.start(R.initial(),'intercept'),'x','0'),other=structuredClone(s.missions.intercept);
 for(const skill of V.skills){s=R.start(s,skill);s=fill(s);const original=structuredClone(R.active(s));s=R.start(R.start(s,'ab'),skill);assert.deepEqual(R.active(s),original);
  while(!R.active(s).completed)s=solve(JSON.parse(JSON.stringify(s)));assert.equal(R.active(s).completion.length,6);assert.equal(A.statuses(s,'signaalstad').nodes.find(n=>n.key===skill).state,'completed');
  const xp=s.platformXp;s=R.start(s,skill,true);while(!R.active(s).completed)s=solve(s);assert.equal(s.platformXp,xp);
 }
 assert.equal(s.platformXp,110);assert.deepEqual(s.missions.intercept,other);assert(s.events.every(e=>!e.mastery));
 assert.equal(A.statuses(s,'signaalstad').playableTotal,7);assert(!Learn.skills.some(s=>V.skills.includes(s.id)));
});
test('number keyboard never computes an answer and edits only the selected unlocked field',()=>{
 let m=R.active(solve(R.start(R.initial(),'fx')));assert.deepEqual(V.enter(m,'minus'),{name:'product',value:'-'});m.values.product='-3';assert.deepEqual(V.enter(m,'/'),{name:'product',value:'-3/'});assert.equal(V.enter(m,'='),null);
 m.locks.product=true;assert.equal(V.enter(m,'1').name,'answer');m.values.answer='1/2';assert.equal(V.enter(m,'back').value,'1/');assert.equal(V.enter(m,'clear').value,'');m.feedback={};assert.equal(V.enter(m,'1'),null);
 m=R.active(R.start(R.initial(),'table'));m.values.valueField='cell4';assert.equal(V.enter(m,'7').name,'cell4');m.values.valueField='cell2';assert.equal(V.enter(m,'7').name,'cell0');
});
test('map and views offer empty open answers, labeled controls and no output plot before a commit',()=>{
 for(const skill of V.skills){const s=R.start(R.initial(),skill),m=R.active(s),before=JSON.stringify(m),html=View.render(m,S.header(s,{mission:true}));
  assert(html.includes('Level '+(skill==='fx'?3:4)));assert(html.includes('Opgave 1 / 6'));assert(html.includes('f(x) ='));assert(html.includes('data-value-key="minus"'));assert(!html.includes('data-choice'));assert(!html.includes('math-graph'));
  for(const name of V.fields(m.task,m.phase))assert.match(html,new RegExp('name="'+name+'"[^>]*value=""'));assert.equal(JSON.stringify(m),before);assert(S.header(s,{mission:true}).includes(skill==='fx'?'Functiewaarde f(x)':'Tabel aanvullen'));
  const area=S.area(A.locationState(s,'area',{area:'signaalstad'}));assert.match(area,new RegExp('data-node="'+skill+'"[^>]*data-start="signaalstad" data-formula-skill="'+skill+'"'));
  for(let i=0;i<5;i++)Object.assign(s,R.hint(s));const example=R.newAfterExample(s);assert.equal(R.active(example).run,2);assert.notDeepEqual(R.active(example).task.model.b,m.task.model.b);
 }
});
