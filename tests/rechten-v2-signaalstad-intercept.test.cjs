const {test}=require('node:test'),assert=require('node:assert/strict');
const R=require('../games/rechten/rechtenwereld/mission-runtime.js'),F=require('../games/rechten/rechtenwereld/formula-core.js'),W=require('../games/rechten/core/wave-core.js');
const A=require('../games/rechten/rechtenwereld/content/area-maps.js'),S=require('../games/rechten/rechtenwereld/components/shell-view.js'),V=require('../games/rechten/rechtenwereld/components/formula-view.js'),XP=require('../games/rechten/rechtenwereld/xp.js');
test('level 1 asks only for the integer height on the y-axis, across varied lines and replays',()=>{
 const heights=new Set(),directions=new Set();
 for(let run=1;run<=3;run++)for(let index=0;index<F.count;index++){
  const t=F.makeTask('intercept',index,run);assert.equal(t.world,'signaalstad');assert.equal(t.family_id,'F3');assert.deepEqual(t.given_representations,['graph']);assert.equal(t.parameterStep,1);assert.equal(t.gridStep,1);assert.equal(t.model.b.d,1);assert(Math.abs(W.num(t.model.b))<5);
  heights.add(Math.sign(t.model.b.n));directions.add(Math.sign(t.model.a.n));
  assert.equal(F.check(t,{},'formula-read').kind,'interaction_error');assert(!F.check(t,{b:W.text(W.add(t.model.b,1))},'formula-read').ok);
  assert(F.check(t,{b:W.text(t.model.b)},'formula-read').ok);assert(F.check(t,{b:(t.model.b.n*2)+'/2'},'formula-read').ok);
 }
 assert.deepEqual([...heights].sort(),[-1,0,1]);assert.deepEqual([...directions].sort(),[-1,0,1]);
 const m=R.active(R.start(R.initial(),'intercept')),html=V.render(m,'');assert(html.includes('Waar snijdt de rechte de y-as?'));assert(html.includes('name="b"'));assert(!html.includes('name="a"'));assert(!html.includes('f(x) ='));assert(!html.includes('value="2"'));
 const header=S.header(R.start(R.initial(),'intercept'),{mission:true});assert(header.includes('Signaalstad'));assert(header.includes('Snijpunt met de y-as'));
});
test('repair, pause, reload and completion preserve the other missions and award real exercise XP once',()=>{
 let s=R.start(R.initial(),'point');s=R.edit(s,'answer','1');const other=structuredClone(s.missions.point);s=R.start(s,'intercept');
 let bad=R.commit(R.edit(s,'b','99'));assert(!R.active(bad).feedback.result.ok);s=R.advance(bad);assert.equal(R.active(s).errors,1);
 const before=structuredClone(R.active(s));s=R.start(R.start(s,'point'),'intercept');assert.deepEqual(R.active(s),before);s=JSON.parse(JSON.stringify(s));
 while(!R.active(s).completed){s=R.commit(R.edit(s,'b',W.text(R.active(s).task.model.b)));assert(R.active(s).feedback.result.ok);s=XP.update(R.advance(s));}
 assert.equal(s.platformXp,55);assert.equal(s.events.filter(e=>e.correct).length,6);assert(s.events.every(e=>!e.mastery));assert.deepEqual(s.missions.point,other);
 const summary=A.statuses(s,'signaalstad');assert.equal(summary.nodes.find(n=>n.id==='intercept').state,'completed');assert.equal(summary.nodes.find(n=>n.id==='ab').state,'current');assert.equal(summary.playableTotal,3);
 s=R.start(s,'intercept',true);while(!R.active(s).completed)s=XP.update(R.advance(R.commit(R.edit(s,'b',W.text(R.active(s).task.model.b)))));assert.equal(s.platformXp,55,'replaying does not double XP');
 assert.equal(A.statuses(s,'signaalstad').nodes.find(n=>n.id==='intercept').state,'completed');
});
