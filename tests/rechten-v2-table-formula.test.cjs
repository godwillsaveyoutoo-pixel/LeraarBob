const {test}=require('node:test'),assert=require('node:assert/strict');
const R=require('../games/rechten/rechtenwereld/mission-runtime.js'),D=require('../games/rechten/rechtenwereld/derive-core.js'),W=require('../games/rechten/core/wave-core.js'),V=require('../games/rechten/rechtenwereld/components/derive-view.js'),A=require('../games/rechten/rechtenwereld/content/area-maps.js');
const skill='equation_from_table';
function put(s,values){for(const [k,v]of Object.entries(values))s=D.slots(R.active(s).phase).includes(k)?R.putDeriveToken(s,k,v):R.edit(s,k,v);return s}
function next(s){const checked=R.commit(s);assert(R.active(checked).feedback.result.ok,JSON.stringify(R.active(checked).feedback));return R.advance(checked)}
const coord={y1:'B.y',y0:'A.y',x1:'B.x',x0:'A.x'};
test('all table pairs and both substitution points give the same exact formula for six tasks and three replays',()=>{
 for(let run=1;run<=3;run++)for(let index=0;index<D.count;index++)for(const pair of [[0,1],[0,2],[1,2],[2,0],[2,1],[1,0]])for(const use of ['A','B']){
  let s=R.start(R.initial(),skill);Object.assign(R.active(s),{task:D.makeTask(skill,index,run),index,run});
  for(const i of pair)s=R.selectTableColumn(s,i);
  const m=R.active(s),t=D.workTask(m.task,m.values);for(const p of t.table)assert(W.onLine(p,t.model));
  assert(W.eq(W.div(W.sub(t.points.B.y,t.points.A.y),W.sub(t.points.B.x,t.points.A.x)),t.model.a));
  s=next(put(s,coord));assert(R.active(s).locks.tableColumns);
  s=next(put(s,{a:W.text(t.model.a)}));s=R.selectDerivePoint(s,use);
  s=next(put(s,{subY:use+'.y',subA:'a',subX:use+'.x'}));
  s=next(put(s,{product:W.text(W.mul(t.model.a,t.points[use].x))}));s=next(put(s,{b:W.text(t.model.b)}));
  const response=put(s,{answerFactor:W.text(t.model.a),answerSign:'+',answerConstant:W.text(t.model.b)});
  const correct=R.commit(response);assert(R.active(correct).feedback.result.ok);const html=V.render(R.active(correct),'');assert(html.includes('alle kolommen uit de tabel'));assert(html.includes('f(x)'));
  s=R.advance(correct);assert.equal(R.active(s).completed,index===5);assert(s.events.every(e=>e.representation==='table'&&e.skill===skill));
 }
});
test('selection is explicit, reversible, limited to two, and changing a column invalidates partial work',()=>{
 let s=R.start(R.initial(),skill);const untouched=structuredClone(s);assert.equal(R.active(R.commit(s)).feedback.result.kind,'interaction_error');assert.deepEqual(D.tokens(R.active(s).task,{},'derive-fill'),[]);
 for(const invalid of [-1,3,1.5,NaN])assert.deepEqual(R.selectTableColumn(s,invalid),s);
 s=R.selectTableColumn(s,2);assert.deepEqual(R.active(s).values.tableColumns,[2]);s=R.selectTableColumn(s,0);s=put(s,coord);
 const before=structuredClone(s);s=R.selectTableColumn(s,1);assert.deepEqual(R.active(s).values.tableColumns,[0,1]);assert.equal(R.active(s).values.y1,undefined);
 s=R.undo(s);assert.deepEqual(R.active(s).values,R.active(before).values);
 s=R.selectTableColumn(s,0);assert.deepEqual(R.active(s).values.tableColumns,[2]);assert.equal(R.active(R.commit(s)).feedback.result.kind,'interaction_error');
 assert.deepEqual(untouched,R.start(R.initial(),skill));
});
test('repair retains correct numerator until columns change; checked points cannot change and reload preserves selection',()=>{
 let s=R.start(R.initial(),skill);s=R.selectTableColumn(R.selectTableColumn(s,2),0);
 s=R.advance(R.commit(put(s,{...coord,x1:'A.x',x0:'B.x'})));assert(R.active(s).locks.y1);
 s=R.selectTableColumn(s,1);assert(!R.active(s).locks.y1);s=next(put(s,coord));assert.deepEqual(R.selectTableColumn(s,2),s);
 const saved=JSON.parse(JSON.stringify(s));assert.deepEqual(R.start(saved,skill),s);
 s=next(put(s,{a:W.text(R.active(s).task.model.a)}));assert.equal(R.active(s).phase,'derive-substitute');
 assert.deepEqual(D.workTask(R.active(s).task,R.active(s).values).points,{A:R.active(s).task.table[0],B:R.active(s).task.table[1]});
});
test('table stop is playable and final recorded evidence survives a replay without fabricating completion',()=>{
 let s=R.start(R.initial(),skill);assert.equal(A.statuses(s,'formulewerf').nodes.find(n=>n.id===skill).state,'started');
 assert.equal(A.statuses(s,'formulewerf').playableTotal,8);
 const html=V.render(R.active(s),'');assert(html.includes('Gegeven tabel'));assert(html.includes('Kies twee kolommen'));assert(!html.includes('derive-found'));
 // Actual final event, using a non-adjacent pair.
 R.active(s).task=D.makeTask(skill,5);R.active(s).index=5;s=R.selectTableColumn(R.selectTableColumn(s,0),2);s=next(put(s,coord));
 const t=R.active(s).task;s=next(put(s,{a:W.text(t.model.a)}));s=next(put(s,{subY:'A.y',subA:'a',subX:'A.x'}));s=next(put(s,{product:W.text(W.mul(t.model.a,t.table[0].x))}));s=next(put(s,{b:W.text(t.model.b)}));s=next(put(s,{answerFactor:W.text(t.model.a),answerSign:'+',answerConstant:W.text(t.model.b)}));
 s=R.start(s,skill,true);assert.equal(A.statuses(s,'formulewerf').nodes.find(n=>n.id===skill).state,'completed');
});
