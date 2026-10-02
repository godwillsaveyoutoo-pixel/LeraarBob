'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const B=require('../games/rechten/rechtenwereld/ab-core.js'),R=require('../games/rechten/rechtenwereld/mission-runtime.js'),W=require('../games/rechten/core/wave-core.js');
const A=require('../games/rechten/rechtenwereld/content/area-maps.js'),S=require('../games/rechten/rechtenwereld/components/shell-view.js'),V=require('../games/rechten/rechtenwereld/components/ab-view.js'),XP=require('../games/rechten/rechtenwereld/xp.js');
const str=q=>String(q.n/q.d),rule=t=>({factor:str(t.model.a),variable:'x',operator:t.model.b.n<0?'−':'+',constant:String(Math.abs(t.model.b.n)/t.model.b.d)});
function fill(s){const m=R.active(s),v=m.phase==='ab-intercept'?{b:str(m.task.model.b)}:m.phase==='ab-slope'?{a:str(m.task.model.a)}:rule(m.task);for(const[k,value]of Object.entries(v))s=R.edit(s,k,value);return s}
function solve(s){const checked=R.commit(fill(s));assert(R.active(checked).feedback.result.ok);return XP.update(R.advance(checked))}
test('six readable graph cases retain exact intercept and unit-step measurements, including halves and zero',()=>{
 const variants=new Set();for(let run=1;run<=12;run++)for(let index=0;index<B.count;index++){
  const t=B.makeTask('ab',index,run),b=t.model.b,a=t.model.a;variants.add(t.variant);
  // Independent rational oracle: the difference between y(1) and y(0) is a.
  const y1={n:BigInt(a.n)*BigInt(b.d)+BigInt(b.n)*BigInt(a.d),d:BigInt(a.d)*BigInt(b.d)};
  const diff={n:y1.n*BigInt(b.d)-BigInt(b.n)*y1.d,d:y1.d*BigInt(b.d)};
  assert.equal(diff.n*BigInt(a.d),BigInt(a.n)*diff.d);assert(Math.abs(Number(y1.n)/Number(y1.d))<5);assert(Math.abs(b.n/b.d)<5);
  assert.equal(t.family_id,'F3');assert.deepEqual(t.given_representations,['graph']);assert.deepEqual(JSON.parse(JSON.stringify(t)),t);
  const values={b:(b.n*2)+'/'+(b.d*2),a:(a.n*2)+'/'+(a.d*2),...rule(t)};
  for(const phase of B.phases){assert.equal(B.check(t,{},phase).kind,'interaction_error');assert(B.check(t,values,phase).ok)}
  assert(!B.check(t,{...values,a:String(a.n/a.d+1)},'ab-slope').ok);assert(!B.check(t,{...values,b:String(b.n/b.d+1)},'ab-intercept').ok);
  for(const token of Object.values(rule(t)))assert(t.tokens.includes(W.parse(token)?W.text(W.parse(token)):token));
 }
 assert.deepEqual([...variants].sort(),['horizontal','negative','negative-fraction','positive','positive-fraction']);
 assert(B.check(B.makeTask('ab',4),{b:'-1',a:'0,5'},'ab-slope').ok);
});
test('wrong or missing work cannot advance; correct measurements and rule tiles survive repair and undo',()=>{
 let s=R.start(R.initial(),'ab');s=R.advance(R.commit(s));assert.equal(R.active(s).errors,0);assert.equal(R.active(s).phase,'ab-intercept');
 s=R.advance(R.commit(R.edit(s,'b','99')));assert.equal(R.active(s).errors,1);assert.equal(R.active(s).phase,'ab-intercept');
 s=solve(s);assert.equal(R.active(s).phase,'ab-slope');assert.equal(R.active(s).locks.b,true);assert.deepEqual(R.edit(s,'b','99'),s);assert.equal(s.platformXp,0,'a measurement is not a completed exercise');
 s=R.edit(s,'a','3');s=R.undo(s);assert.equal(R.active(s).values.a,undefined);assert.equal(R.active(s).values.b,'1');s=solve(s);assert.equal(R.active(s).locks.a,true);assert.equal(s.platformXp,0);
 s=fill(s);s=R.edit(s,'constant','4');s=R.advance(R.commit(s));assert.equal(R.active(s).locks.factor,true);assert.equal(R.active(s).locks.variable,true);assert(!R.active(s).locks.constant);assert.equal(R.active(s).values.a,'2');assert.equal(R.active(s).values.b,'1');
 s=solve(s);assert.equal(R.active(s).index,1);assert.equal(s.platformXp,5);assert.equal(R.active(s).phase,'ab-intercept');assert.deepEqual(R.active(s).values,{});
});
test('touch/keyboard selections build a signed unit step without changing saved measurements',()=>{
 let s=solve(R.start(R.initial(),'ab'));const m=R.active(s),before=JSON.stringify(m);
 assert.deepEqual(B.selection(m,3),{name:'a',value:'2'});assert.deepEqual(B.selection(m,0),{name:'a',value:'−1'});assert.deepEqual(B.adjust(m,-1),{name:'a',value:'−1'});assert.equal(B.selection(m,Infinity),null);assert.equal(JSON.stringify(m),before);
 s.missions.ab.task=B.makeTask('ab',4);s.missions.ab.values.b='-1';assert.deepEqual(B.selection(R.active(s),-.5),{name:'a',value:'1/2'});assert.deepEqual(B.adjust(R.active(s),1),{name:'a',value:'1/2'});
});
test('all 18 stages complete level 2 once, resume/replay safely, and leave other missions and old signal investigations intact',()=>{
 let s=R.edit(R.start(R.initial(),'intercept'),'b','3');s=R.start(s,'signaalstad');const other=structuredClone(s.missions);s=R.start(s,'ab');const initial=structuredClone(R.active(s));s=R.start(R.start(s,'point'),'ab');assert.deepEqual(R.active(s),initial);
 while(!R.active(s).completed){s=JSON.parse(JSON.stringify(s));s=solve(s)}assert.equal(R.active(s).completion.length,6);assert.equal(s.events.length,18);assert.equal(s.platformXp,55);assert(s.events.every(e=>e.skill==='ab'&&e.representation==='graph'&&e.mastery===false));
 for(const[key,value]of Object.entries(other))assert.deepEqual(s.missions[key],value);
 const summary=A.statuses(s,'signaalstad');assert.equal(summary.playableTotal,5);assert.equal(summary.nodes.find(n=>n.id==='ab').state,'completed');
 s=R.start(s,'ab',true);assert.equal(A.statuses(s,'signaalstad').nodes.find(n=>n.id==='ab').state,'completed');while(!R.active(s).completed)s=solve(s);assert.equal(s.platformXp,55);
 const fresh=R.start(R.initial(),'ab');for(let i=0;i<5;i++)Object.assign(fresh,R.hint(fresh));const helped=R.newAfterExample(fresh);assert.equal(R.active(helped).run,2);assert.equal(R.active(helped).hints,0);assert.notDeepEqual(R.active(helped).task.model.b,initial.task.model.b);
});
test('level 2 is playable in the real map, with no measurements or constructed rule supplied before the learner acts',()=>{
 const s=R.start(R.initial(),'ab'),m=R.active(s),before=JSON.stringify(m),html=V.render(m,S.header(s,{mission:true}));assert(html.includes('Level 2'));assert(html.includes('Opgave 1 / 6'));assert(html.includes('data-ab-picker'));assert(!html.includes('class="ab-pin '));assert(!html.includes('Δy = 2'));assert(!html.includes('data-formula-token'));assert(!html.includes('value="1"'));assert.equal(JSON.stringify(m),before);
 const area=S.area(A.locationState(s,'area',{area:'signaalstad'}));assert.match(area,/data-node="ab"[^>]*data-start="signaalstad" data-formula-skill="ab"/);assert(S.header(s,{mission:true}).includes('a en b herkennen'));
});
