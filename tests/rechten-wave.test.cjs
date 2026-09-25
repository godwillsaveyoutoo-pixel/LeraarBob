const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../games/rechten/trainer/wave-core.js');
const wave1=Object.keys(C.catalog).filter(k=>!C.constructionSkills.includes(k)&&!C.algebraSkills.includes(k)&&!C.transferSkills.includes(k));
const task=(skill,options={})=>({id:'test',skill,difficulty:options.difficulty||0,params:C.generate(skill,options)});
function answer(t,w,reverse=false){const stage=C.stages(t)[w.index];return stage==='ys'||stage==='xs'?(reverse?['A','B']:['B','A']):stage==='point'?'B':stage==='subY'?'y':stage==='subX'?'x':C.expected(t,w)}
function solve(t,reverse=false){const w=C.fresh(t);while(!w.done)assert(C.submit(t,w,answer(t,w,reverse)).ok,JSON.stringify({t,w}));return w}
test('exact fractions, decimal comma, signs, invalid division and vertical rendering',()=>{assert(C.eq(C.fromNumber(2/3),C.q(2,3)));assert.deepEqual(C.parse('-1,25'),C.q(-5,4));assert(C.eq(C.q(6,-4),C.q(-3,2)));assert(C.eq(C.add(C.q(1,3),C.q(2,3)),1));assert.throws(()=>C.div(1,0));for(const s of ['','1/0','NaN','-','1,'])assert.equal(C.parse(s),null);assert.match(C.html(C.q(-13,7)),/−<span class="frac"><span>13/);assert.equal(C.formula(C.q(0),C.q(4)),'y = 4')});
test('3600 controlled tasks: exact model, bounded points, every step, both directions',()=>{let count=0;const coverage={};for(const skill of wave1){coverage[skill]=new Set();for(let difficulty=0;difficulty<3;difficulty++)for(let seed=1;seed<=200;seed++){const t=task(skill,{difficulty,variant:seed%12,seed}),p=t.params,m=p.model;coverage[skill].add(p.variant);for(const P of [p.A,p.B]){assert(Math.abs(C.num(P.x))<=5);assert(Math.abs(C.num(P.y))<=5);if(m.kind==='affine'){
 // Independent integer cross multiplication: y = a*x + b.
 assert.equal(P.y.n*m.a.d*P.x.d*m.b.d,(m.a.n*P.x.n*m.b.d+m.b.n*m.a.d*P.x.d)*P.y.d);
 }else if(m.kind==='vertical')assert(C.eq(P.x,m.c))}solve(t,false);solve(t,true);count++}}
 assert.equal(count,3600);for(const key of ['slope_from_two_points','special_lines','equation_from_two_points'])for(const variant of ['horizontal','vertical','identical'])assert(coverage[key].has(variant),key+' '+variant);
 for(const key of wave1.filter(k=>k!=='special_lines'))for(const variant of ['positive','negative','positive-fraction','negative-fraction','horizontal'])assert(coverage[key].has(variant),key+' '+variant);
});
test('audit examples accept both orders, reject mixed order by point identity',()=>{const q=C.q,A={x:q(2),y:q(3)},B={x:q(6),y:q(11)},t={skill:'slope_from_two_points',params:{A,B,model:C.model(A,B)}};assert(C.eq(t.params.model.a,2));solve(t);solve(t,true);const w=C.fresh(t);C.submit(t,w,['B','A']);assert.equal(C.submit(t,w,['A','B']).code,'wave.direction');assert.equal(w.index,1);C.submit(t,w,['B','A']);assert.equal(w.index,2);
 const horizontal={...t,params:{A:{x:q(-2),y:q(4)},B:{x:q(5),y:q(4)}}};horizontal.params.model=C.model(horizontal.params.A,horizontal.params.B);solve(horizontal,true);
});
test('special lines: horizontal, vertical and identical have different conclusions',()=>{const q=C.q;for(const [A,B,kind] of [[[-2,4],[5,4],'affine'],[[3,-2],[3,5],'vertical'],[[3,-2],[3,-2],'identical']]){const p={A:{x:q(A[0]),y:q(A[1])},B:{x:q(B[0]),y:q(B[1])}};p.model=C.model(p.A,p.B);assert.equal(p.model.kind,kind);const w=solve({skill:'special_lines',params:p});if(kind==='vertical'){assert.equal(w.values.axis,'x');assert.equal(w.values.function,'geen functie');assert(C.eq(w.values.constant,3))}if(kind==='affine'){assert.equal(w.values.property,'a0');assert.equal(w.values.function,'functie')}if(kind==='identical')assert.equal(w.steps.length,1)}});
test('b error retains a and selected point; repair, undo and JSON roundtrip preserve diagnosis',()=>{const t=task('equation_from_two_points',{difficulty:2,variant:3,seed:5}),w=C.fresh(t);while(C.stages(t)[w.index]!=='b')C.submit(t,w,answer(t,w));const before=structuredClone(w.values);assert.equal(C.submit(t,w,C.add(t.params.model.b,1)).code,'wave.b');assert.deepEqual(w.values,before);const restored=JSON.parse(JSON.stringify(w));while(!restored.done)assert(C.submit(t,restored,answer(t,restored)).ok);assert(restored.errors.includes('wave.b'));const index=restored.index;C.undo(restored);assert.equal(restored.index,index-1);assert(C.eq(restored.values.a,t.params.model.a));assert.deepEqual(C.stages(t).slice(-2),['verifyA','verifyB'])});
const skill=()=>({intro:false,seen:0,correct:0,strength:0,recent:[]});
const state=()=>({version:704,skills:Object.fromEntries(C.order.map(k=>[k,skill()])),review:[],access:[]});
test('pure migration preserves historical data, unknown IDs, reviews, XP and old access',()=>{const s=state();s.version=700;s.xp=97;s.telemetry=[{skill:'ab',ok:true}];s.review=[{skill:'future',kind:'repair',due:8}];s.skills.ab={...skill(),intro:true,seen:8,strength:.8};s.skills.future={custom:7};const before=structuredClone(s),m=C.migrate(s);assert.deepEqual(s,before);assert.deepEqual(m.skills,s.skills);assert.equal(m.xp,97);assert.deepEqual(m.review,s.review);assert.deepEqual(m.telemetry,s.telemetry);assert(m.access.includes('fx'));assert(m.access.includes('ab'));assert(m.access.includes('delta'));assert.equal(m.version,704);assert.deepEqual(C.migrate(m),m)});
test('all 26 skills reachable; unlocks permanent; no deferred prerequisite',()=>{const s=state();assert.deepEqual(C.unlock(s),['point']);for(const k of C.order){assert(C.unlock(s).includes(k),'reachable '+k);Object.assign(s.skills[k],{intro:true,seen:4,strength:.5,recent:[true,true,true,true]})}assert.equal(C.unlock(s).length,26);for(const v of Object.values(s.skills))v.strength=0;assert.equal(C.unlock(s).length,26);assert(!C.requirements.intercept_from_point.includes('rewrite_linear_equation'));assert(!Object.values(C.requirements).flat().includes('information_sufficiency'))});
test('mastery needs variant coverage and later different independent tasks, assisted repair supplies none',()=>{const st=skill(),t=task('line_behavior');C.evidence(st,t,0,false);assert(!st.coverage);C.evidence(st,t,0,true);assert(!C.mastered(st,t.skill));for(const [i,variant] of [0,1,4].entries())C.evidence(st,task('line_behavior',{variant,seed:i+3}),i+4,true);assert(C.mastered(st,t.skill))});
test('short slope route and point substitution lead to a complete formula',()=>{
 for(const skill of ['slope_from_two_points','equation_from_two_points']){
  const t=task(skill,{difficulty:1,variant:1});assert.deepEqual(C.stages(t).slice(0,3),['ys','xs','a']);assert(!C.stages(t).includes('dy'));assert(!C.stages(t).includes('dx'));
 }
 for(const skill of ['intercept_from_point','equation_from_point_slope']){
  const t=task(skill,{difficulty:1,variant:1});assert.deepEqual(C.stages(t),['subA','subPoint','ax','b','formulaA','formulaB']);assert(C.stages(t).includes('formulaA'));assert(C.stages(t).includes('formulaB'));
 }
});
test('b uses equivalent operations on both members and restores the previous equation on undo',()=>{
 for(const seed of [1,2,3,4,5,6]){
  const t=task('intercept_from_point',{difficulty:2,variant:3,seed}),w=C.fresh(t);
  while(C.stages(t)[w.index]!=='b')assert(C.submit(t,w,answer(t,w)).ok);
  const before=structuredClone(C.pointEquation(t,w));
  assert.equal(C.submit(t,w,{kind:'divide',value:C.q(0)}).ok,false);assert.deepEqual(C.pointEquation(t,w),before);
  const value=before.left.c;
  if(!value.n){assert(C.isolated(before,'y'));continue}
  const r=C.submit(t,w,{kind:'subtract',term:'c',value});assert(r.ok);assert(C.equivalent(before,C.pointEquation(t,w)));assert(C.eq(w.values.b,t.params.model.b));assert.equal(C.stages(t)[w.index],'formulaA');
  C.undo(w);assert.equal(C.stages(t)[w.index],'b');assert.deepEqual(C.pointEquation(t,w),before);assert.equal(w.values.b,undefined);
 }
});
test('old drafts keep their actual stage, completed work and error evidence',()=>{
 const t=task('equation_from_two_points',{difficulty:1,variant:1}),w=C.fresh(t);delete w.routeVersion;
 w.index=4;w.values={ys:['B','A'],xs:['B','A'],dy:C.q(2),dx:C.q(1)};w.errors=['wave.direction'];w.history=[{index:2,values:{ys:['B','A'],xs:['B','A']}}];t.work=w;
 C.resumeWork(t);assert.equal(C.stages(t)[w.index],'a');assert.deepEqual(w.errors,['wave.direction']);assert.deepEqual(w.values.dy,C.q(2));C.undo(w);assert.equal(C.stages(t)[w.index],'a');
 const b=task('intercept_from_point');b.work={...C.fresh(b),index:3};delete b.work.routeVersion;C.resumeWork(b);assert.equal(C.stages(b)[b.work.index],'b');
});

test('version 2 point drafts resume on the compact worksheet without losing answers',()=>{
 for(const skill of ['intercept_from_point','equation_from_point_slope']){
  for(const [index,stage] of [[0,'subA'],[1,'subPoint'],[2,'subPoint'],[3,'ax'],[4,'b'],[5,'formulaA'],[6,'formulaB'],[7,'formulaB']]){
   const t=task(skill),values={subA:t.params.model.a,subY:'y',subX:'x'};
   t.work={...C.fresh(t),routeVersion:2,index,values,errors:['wave.b'],history:[{index:3,values:structuredClone(values)}]};
   C.resumeWork(t);assert.equal(C.stages(t)[t.work.index],stage);assert.deepEqual(t.work.values,values);assert.deepEqual(t.work.errors,['wave.b']);
   C.undo(t.work);assert.equal(C.stages(t)[t.work.index],'ax');
  }
  const t=task(skill);t.work={...C.fresh(t),routeVersion:2,index:8,done:true};C.resumeWork(t);assert(t.work.done);assert.equal(t.work.index,C.stages(t).length);
 }
});

test('dragging arithmetic keeps multiplication, transposition and addition separate, including undo and resume',()=>{
 for(const skill of ['intercept_from_point','equation_from_point_slope','equation_from_two_points'])for(let variant=0;variant<10;variant++){
  const t=task(skill,{difficulty:2,variant,seed:4}),w=C.fresh(t);
  while(C.stages(t)[w.index]!=='ax')assert(C.submit(t,w,answer(t,w)).ok);
  const chosen=t.params[w.values.point],a=t.params.model.a;
  assert.equal(w.values.ax,undefined);assert.equal(w.values.b,undefined);
  assert(C.submit(t,w,C.mul(a,chosen.x)).ok);assert.equal(C.stages(t)[w.index],'b');
  assert.equal(C.submit(t,w,{kind:'combineConstants'}).ok,false);
  assert(C.submit(t,w,{kind:'moveConstant'}).ok);assert.equal(C.stages(t)[w.index],'b');assert.equal(w.values.b,undefined);
  t.work=JSON.parse(JSON.stringify(w));C.resumeWork(t);assert(t.work.bArithmetic.moved);
  C.undo(t.work);assert(!t.work.bArithmetic);assert.equal(C.stages(t)[t.work.index],'b');
  assert(C.submit(t,t.work,{kind:'moveConstant'}).ok);assert(C.submit(t,t.work,{kind:'combineConstants'}).ok);
  assert(C.eq(t.work.values.b,C.sub(chosen.y,C.mul(a,chosen.x))));assert.equal(C.stages(t)[t.work.index],'formulaA');
  C.undo(t.work);assert.equal(t.work.values.b,undefined);assert(t.work.bArithmetic.moved);
 }
});
test('version 3 drafts preserve their mathematics and selected point on the new worksheet',()=>{
 for(const [skill,oldIndex,next] of [['equation_from_point_slope',1,'subPoint'],['equation_from_point_slope',3,'b'],['equation_from_two_points',4,'point'],['equation_from_two_points',7,'ax']]){
  const t=task(skill);t.work={...C.fresh(t),routeVersion:3,index:oldIndex,values:{point:'B',a:t.params.model.a},history:[]};
  C.resumeWork(t);assert.equal(C.stages(t)[t.work.index],next);assert.equal(t.work.values.point,'B');
 }
});
