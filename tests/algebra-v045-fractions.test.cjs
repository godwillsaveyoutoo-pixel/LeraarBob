'use strict';
const assert=require('node:assert/strict'),F=require('../games/algebra-trainer/fraction-core.js'),C=require('../games/algebra-trainer/core.js'),L=require('../games/algebra-trainer/learning-core.js'),J=require('../games/algebra-trainer/journey-core.js'),P=require('../games/algebra-trainer/journey-paper.js');
let checked=0;
function equivalent(eq,t){const ast=F.equation(eq);assert.ok(L.evaluate(ast.l,t.ex.solution).eq(L.evaluate(ast.r,t.ex.solution)));}
function completeBuild(t,r,build){const s=F.init(t,r);s.build=build;s.phase='build';s.blocks=F.copy(build.target);assert.equal(L.validate(t,r).ok,true);equivalent(build.target,t);return F.commit(s);}
for(let seed=1;seed<=300;seed++)for(const route of ['common','clear'])for(const multiple of [1,2]){
 const t=F.task(seed),r={};assert.deepEqual(t,F.task(seed));equivalent(t.fractions,t);
 const s=F.init(t,r),n=F.common(s.current)*multiple;
 assert.ok(F.numberCheck(s.current,n).ok);assert.ok(!F.numberCheck(s.current,1).ok);
 const build=F.prepare(s,route,n);s.phase='build';s.build=build;s.blocks=F.copy(build.target);
 for(const side of ['lhs','rhs']){s.field=side;const keys=F.palette(s).map(F.key);for(const term of build.target[side])assert.ok(keys.includes(F.key(term)),'Every required term must be touch-accessible');}
 if(route==='common'){
  assert.ok([...build.target.lhs,...build.target.rhs].every(t=>t.d===n));
  const correct=F.copy(s.blocks);s.blocks.lhs[0]={...s.blocks.lhs[0],n:s.blocks.lhs[0].n+1};assert.equal(L.validate(t,r).ok,false);s.blocks=correct;
 }
 completeBuild(t,r,build);
 if(route==='common')completeBuild(t,r,F.prepare(s,'clear',n));
 let count=0;
 while(!F.solved(s.current)&&count++<6){completeBuild(t,r,F.prepareOperation(s,F.operationChoices(s.current)[0]));}
 assert.ok(F.solved(s.current));assert.equal(s.current.rhs[0].n/s.current.rhs[0].d,t.ex.solution.value());checked++;
}
const t=F.task(731,true),r={},s=F.init(t,r);assert.equal(t.display,'\\frac{x}{3} + \\frac{1}{2} = \\frac{5}{6}');
s.phase='build';s.build=F.prepare(s,'common',6);s.blocks=F.copy(s.build.target);
// Equal numerical value alone is insufficient when practising common denominators.
s.blocks.lhs[1]=F.token(1,2);assert.equal(L.validate(t,r).ok,false);assert.match(L.validate(t,r).message,/noemer 6/);
s.build=F.prepare(s,'clear',6);s.blocks=F.copy(s.build.target);s.blocks.rhs=F.copy(t.fractions.rhs);assert.match(L.validate(t,r).message,/bleef onveranderd/);
s.blocks=F.copy(s.build.target);s.signs.lhs='+';assert.equal(L.validate(t,r).incomplete,true);s.signs={};
for(const route of ['common','clear']){s.route=route;delete s.build;const demo=F.demo(t,s,813);assert.notEqual(demo.timeline[0].tex,t.display);assert.match(demo.timeline[0].caption,route==='common'?/gelijknamig/:/noemers/);assert.equal(demo.total,1);}
const intro=J.freshMission('route-fractions',null,123);assert.equal(intro.tasks[0].display,t.display);assert.equal(intro.tasks.length,6);assert.ok(P.answer(intro.tasks[0]).lines.length>3);
const next=J.freshMission('route-fractions',intro,123);const old=new Set(intro.tasks.map(J.questionSignature));assert.ok(next.tasks.every(t=>!old.has(J.questionSignature(t))));
// Existing saved missions retain their original questions and state.
assert.equal(J.info(null,'route-fractions',{'route-fractions':intro}).started,true);
console.log(JSON.stringify({ok:true,completedRoutes:checked,checks:['Exact equality throughout both paths','Larger common multiples accepted','Visible common denominators required','Every required term available','Forgotten right term diagnosed','Matching different-number help','New rounds and old saves preserved']}));
