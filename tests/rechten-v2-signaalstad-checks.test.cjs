'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const K=require('../games/rechten/rechtenwereld/checks-core.js'),R=require('../games/rechten/rechtenwereld/mission-runtime.js'),W=require('../games/rechten/core/wave-core.js'),XP=require('../games/rechten/rechtenwereld/xp.js');
const A=require('../games/rechten/rechtenwereld/content/area-maps.js'),S=require('../games/rechten/rechtenwereld/components/shell-view.js'),View=require('../games/rechten/rechtenwereld/components/checks-view.js'),Learn=require('../games/rechten/rechtenwereld/learn-config.js');
const text=q=>typeof q==='string'?q:W.text(q);
function fill(s){const m=R.active(s);for(const name of K.fields(m.task,m.phase))s=R.edit(s,name,text(K.expected(m.task,name)));return s}
function solve(s){s=XP.update(R.commit(fill(s)));assert(R.active(s).feedback.result.ok);return XP.update(R.advance(s))}
const eq=(a,b)=>BigInt(a.n)*BigInt(b.d)===BigInt(b.n)*BigInt(a.d);
const value=(m,x)=>({n:BigInt(m.a.n)*BigInt(x.n)*BigInt(m.b.d)+BigInt(m.b.n)*BigInt(m.a.d)*BigInt(x.d),d:BigInt(m.a.d)*BigInt(x.d)*BigInt(m.b.d)});
const oracleEqual=(a,b)=>a.n*BigInt(b.d)===BigInt(b.n)*a.d;
test('inverse and membership tasks agree with an independent rational oracle, including impossible, constant and nearby off-line cases',()=>{
 const inverseVariants=new Set(),pointVariants=new Set();
 for(const skill of K.skills)for(let run=1;run<=15;run++)for(let i=0;i<K.count;i++){
  const t=K.makeTask(skill,i,run);assert.equal(t.family_id,'F4');assert.deepEqual(JSON.parse(JSON.stringify(t)),t);
  if(skill==='input_from_output'){
   inverseVariants.add(t.variant);
   if(t.model.a.n){assert(oracleEqual(value(t.model,t.solution),t.target));const r=K.expected(t,'residual');assert.equal(BigInt(r.n)*BigInt(t.target.d)*BigInt(t.model.b.d),(BigInt(t.target.n)*BigInt(t.model.b.d)-BigInt(t.model.b.n)*BigInt(t.target.d))*BigInt(r.d));}
   else{assert.equal(t.solution,null);assert.equal(K.expected(t,'solutions'),eq(t.model.b,t.target)?'all':'none');assert(!K.phases(t).includes('input-solve'));}
  }else{pointVariants.add(t.variant);assert.equal(K.expected(t,'verdict'),oracleEqual(value(t.model,t.point.x),t.point.y)?'on':'off');assert(oracleEqual(value(t.model,t.point.x),K.expected(t,'answer')));}
  for(const phase of K.phases(t)){
   const response=Object.fromEntries(K.fields(t,phase).map(name=>[name,text(K.expected(t,name))]));assert(K.check(t,response,phase).ok);assert.equal(K.check(t,{},phase).kind,'interaction_error');
   for(const name of K.fields(t,phase)){const want=K.expected(t,name),wrong=typeof want==='string'?({on:'off',off:'on',all:'none',none:'all'})[want]:W.text(W.add(want,1));const bad=K.check(t,{...response,[name]:wrong},phase);assert(!bad.ok);assert.equal(bad.keep[name],false);
    if(typeof want!=='string'){assert(K.check(t,{...response,[name]:`${want.n*2}/${want.d*2}`},phase).ok);assert.equal(K.check(t,{...response,[name]:'1/0'},phase).kind,'interaction_error');}
   }
  }
  assert.equal(K.check(t,{},'made-up-phase').kind,'interaction_error');
 }
 assert.deepEqual([...inverseVariants].sort(),['all','fraction','integer','negative','none']);assert.deepEqual([...pointVariants].sort(),['constant-off','constant-on','off','on']);
 const nearby=K.makeTask('point_on_line',3);assert(eq(W.sub(nearby.point.y,K.expected(nearby,'answer')),W.q(1,2)));assert.equal(K.expected(nearby,'verdict'),'off');
});
test('every inverse step is required and locked; verification, constant conclusions and membership are necessary for XP',()=>{
 for(const skill of K.skills){let s=R.start(R.initial(),skill),guard=0;
  while(!R.active(s).completed){assert(++guard<50);const m=structuredClone(R.active(s)),xp=s.platformXp||0;s=XP.update(R.commit(fill(s)));assert(R.active(s).feedback.result.ok);
   if(R.active(s).feedback.next!=='next-task')assert.equal(s.platformXp,xp);
   const before=structuredClone(R.active(s));s=XP.update(R.commit(s));assert.deepEqual(R.active(s),before,'repeated commit cannot change a checked step');s=XP.update(R.advance(s));
   if(!R.active(s).completed&&R.active(s).index===m.index){for(const name of K.fields(m.task,m.phase)){assert(R.active(s).locks[name]);assert.deepEqual(R.active(R.edit(s,name,'999')).values[name],R.active(s).values[name]);}assert.equal(s.platformXp,xp);}
  }
  assert.equal(s.platformXp,55);assert.equal(R.active(s).completion.length,6);assert(s.events.every(e=>!e.mastery));assert.equal(A.statuses(s,'signaalstad').nodes.find(n=>n.id===skill).state,'completed');
  const saved=structuredClone(R.active(s));s=R.start(R.start(JSON.parse(JSON.stringify(s)),'fx'),skill);assert.deepEqual(R.active(s),saved);
  s=R.start(s,skill,true);while(!R.active(s).completed)s=solve(s);assert.equal(s.platformXp,55,'replay awards each task only once');
 }
});
test('repair keeps a correct product and constant value; missing input and undo do not erase prior steps',()=>{
 let s=solve(R.start(R.initial(),'point_on_line'));assert.equal(R.active(s).phase,'point-calculate');const t=R.active(s).task;
 s=R.edit(R.edit(s,'product',text(K.expected(t,'product'))),'answer','99');s=R.advance(R.commit(s));assert(R.active(s).locks.product);assert(R.active(s).locks.substitution);assert.equal(s.platformXp||0,0);
 s=R.edit(s,'answer',text(K.expected(t,'answer')));s=R.undo(s);assert.equal(R.active(s).values.answer,'99');s=solve(s);assert.equal(R.active(s).phase,'point-verdict');assert.equal(s.platformXp,0);
 s=XP.update(R.commit(R.edit(s,'verdict','off')));assert(!R.active(s).feedback.result.ok);assert.equal(s.platformXp,0);s=solve(R.advance(s));assert.equal(s.platformXp,5);
 s=R.start(R.initial(),'input_from_output');for(let i=0;i<4;i++)while(R.active(s).index===i)s=solve(s);s=solve(s);assert.equal(R.active(s).phase,'input-constant');
 s=R.advance(R.commit(R.edit(s,'constantValue','3')));assert.equal(R.active(s).errors,0);assert(R.active(s).locks.constantValue);s=R.advance(R.commit(R.edit(s,'solutions','none')));assert.equal(R.active(s).values.constantValue,'3');assert(R.active(s).locks.constantValue);s=solve(s);assert.equal(R.active(s).index,5);
});
test('new rounds and hints preserve other missions, select only numeric unlocked inputs and never divide a constant by zero',()=>{
 let s=R.edit(R.start(R.initial(),'table'),'cell0','-3'),other=structuredClone(R.active(s));
 for(const skill of K.skills){s=R.start(s,skill);const m=R.active(s);assert(K.enter(m,'minus'));const before=structuredClone(m);s=R.start(R.start(s,'ab'),skill);assert.deepEqual(R.active(s),before);
  for(let i=0;i<5;i++)s=R.hint(s);s=R.newAfterExample(s);assert.equal(R.active(s).run,2);assert.notDeepEqual(R.active(s).task.model.b,before.task.model.b);assert.deepEqual(s.missions.table,other);
 }
 let p=solve(solve(R.start(R.initial(),'point_on_line')));assert.equal(R.active(p).phase,'point-verdict');assert.equal(K.selected(R.active(p)),null);assert.equal(K.enter(R.active(p),'9'),null);
});
test('views require calculation before a verdict, use the shared keyboard and expose both map stops without enabling unsupported multiplayer',()=>{
 for(const skill of K.skills){let s=R.start(R.initial(),skill),m=R.active(s),html=View.render(m,S.header(s,{mission:true}));assert(html.includes('Level '+(skill==='input_from_output'?5:6)));assert(html.includes('f(x) ='));assert(S.header(s,{mission:true}).includes('data-area="signaalstad"'));assert(html.includes('data-value-key="minus"'));assert(!html.includes('data-choice="verdict"'));
  for(const name of K.numericFields(m.task,m.phase))assert.match(html,new RegExp('name="'+name+'"[^>]*value=""'));assert(!Learn.skills.some(n=>n.id===skill));
  const area=S.area(A.locationState(s,'area',{area:'signaalstad'}));assert.match(area,new RegExp('data-node="'+skill+'"[^>]*data-start="signaalstad" data-formula-skill="'+skill+'"'));assert.equal(A.statuses(s,'signaalstad').playableTotal,7);
 }
 let s=solve(solve(R.start(R.initial(),'point_on_line')));const html=View.render(R.active(s),'');assert(html.includes('data-choice="verdict"'));assert(html.includes('Jouw berekening'));assert(html.includes('y-coördinaat van P'));
});
