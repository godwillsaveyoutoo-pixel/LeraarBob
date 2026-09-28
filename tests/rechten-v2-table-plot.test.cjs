'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const F=require('../games/rechten/rechtenwereld/formula-core.js'),R=require('../games/rechten/rechtenwereld/mission-runtime.js'),W=require('../games/rechten/core/wave-core.js'),A=require('../games/rechten/rechtenwereld/content/area-maps.js'),V=require('../games/rechten/rechtenwereld/components/formula-view.js'),S=require('../games/rechten/rechtenwereld/components/shell-view.js');
const numeric=p=>({x:W.num(p.x),y:W.num(p.y)}),skill='graph_from_table';
test('six varied tables: every pair draws the same exact line, including replays, fractions and horizontal lines',()=>{
 const variants=new Set();for(let run=1;run<=4;run++)for(let i=0;i<6;i++){
  const t=F.makeTask(skill,i,run);variants.add(t.variant);assert.equal(t.world,'signaalstad');assert.equal(t.family_id,'F5');assert.deepEqual(t.given_representations,['table']);assert.equal(t.table.length,3);assert.equal(new Set(t.table.map(p=>W.text(p.x))).size,3);
  for(const p of t.table){assert(F.validPoint(t,numeric(p)));assert(W.onLine(p,t.model))}
  for(let a=0;a<3;a++)for(let b=0;b<3;b++)assert.equal(F.check(t,{plotA:numeric(t.table[a]),plotB:numeric(t.table[b])},'formula-plot').ok,a!==b);
  // Other correct points are accepted too: the requested answer is a line.
  assert(F.check(t,{plotA:{x:0,y:W.num(t.model.b)},plotB:{x:1,y:W.num(W.add(t.model.a,t.model.b))}},'formula-plot').ok);
 }
 assert.equal(variants.size,5);
});
test('missing points, a wrong column pair and invalid grid input cannot complete; repair retains the correct point',()=>{
 let s=R.start(R.initial(),skill),t=R.active(s).task;
 assert.equal(R.active(R.commit(s)).feedback.result.kind,'interaction_error');
 s=R.placeLinePoint(s,'A',numeric(t.table[0]));s=R.placeLinePoint(s,'B',{x:-4,y:2});
 s=R.advance(R.commit(s));assert.deepEqual(R.active(s).locks,{plotA:true});assert(R.active(s).errors);
 s=R.clearLinePoints(s);assert.deepEqual(R.active(s).values.plotA,numeric(t.table[0]));assert.equal(R.active(s).values.plotB,undefined);
 s=R.placeLinePoint(s,'B',{x:.25,y:1.25});assert.equal(R.active(s).values.plotB,undefined);
 s=R.placeLinePoint(s,'B',numeric(t.table[1]));const draft=structuredClone(s);s=R.undo(s);assert.equal(R.active(s).values.plotB,undefined);s=R.placeLinePoint(s,'B',numeric(t.table[1]));assert.deepEqual(s,draft);
 assert(R.active(R.commit(JSON.parse(JSON.stringify(s)))).feedback.result.ok);
});
test('only the six completed table drawings finish Signaalstad level 7, and replay retains that evidence',()=>{
 let s=R.start(R.initial(),skill);const status=()=>A.statuses(s,'signaalstad').nodes.find(n=>n.id===skill);
 assert.equal(R.active(s).world,'signaalstad');assert(status().playable);assert(!S.world(s).includes('place-signaalstad is-soon'));
 for(let i=0;i<6;i++){
  assert.notEqual(status().state,'completed');const t=R.active(s).task;s=R.placeLinePoint(s,'A',numeric(t.table[0]));s=R.placeLinePoint(s,'B',numeric(t.table[2]));s=R.commit(s);assert(R.active(s).feedback.result.ok);s=R.advance(s);
 }
 assert.equal(status().state,'completed');assert.equal(s.events.length,6);assert(s.events.every(e=>e.skill===skill&&e.representation==='table'&&e.mastery===false));
 assert.equal(S.journeyProgress(s).completed,1);assert.equal(A.statuses(s,'formulewerf').completed,0);
 s=R.start(JSON.parse(JSON.stringify(s)),skill,true);assert.equal(status().state,'completed');assert(!R.active(s).completed);assert.equal(R.active(s).run,2);
 const area=S.area(A.locationState(s,'area',{area:'signaalstad'}));assert(area.includes('data-formula-skill="graph_from_table"'));
});
test('initial view shows only the source table, a blank graph and Signaalstad navigation',()=>{
 const s=R.start(R.initial(),skill),html=V.render(R.active(s),S.header(s,{mission:true}));
 assert(html.includes('Gegeven tabel'));assert(html.includes('Plaats twee punten uit de tabel'));assert(html.includes('Signaalstad'));assert(html.includes('data-world="signaalstad"'));assert(html.includes('data-line-picker'));assert(html.includes('data-area="signaalstad"'));
 assert(!html.includes('class="formula-model'));assert(!html.includes('line-pin pin-'));assert(!html.includes('a = 1'));assert(!html.includes('y = x + 1'));assert(!html.includes('Formulewerf'));
});
