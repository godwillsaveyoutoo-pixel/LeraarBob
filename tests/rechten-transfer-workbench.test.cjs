const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../games/rechten/trainer/wave-core.js'),J=require('../games/rechten/trainer/journey-core.js'),{solve}=require('./rechten-transfer-helpers.cjs');
const task=(skill='equation_from_table',difficulty=2,variant=0,seed=1)=>({skill,difficulty,params:C.generate(skill,{difficulty,variant,seed})});
const advance=(t,target)=>{const w=t.work=C.fresh(t);while(C.stages(t)[w.index]!==target&&!w.done)assert(C.submit(t,w,C.expected(t,w)).ok);return w};
test('1800 new tasks have consistent tables, solvable routes and reachable graph coefficients',()=>{
 for(const skill of C.activeTransferSkills)for(let d=0;d<3;d++)for(let seed=0;seed<200;seed++){
  const t=task(skill,d,seed%12,seed),p=t.params;assert.equal(p.transferVersion,2);
  if(skill!=='equation_from_graph'){assert.equal(new Set(p.rows.map(P=>C.text(P.x))).size,p.rows.length);for(const P of p.rows)assert(C.onLine(P,p.model));}
  else for(const k of ['a','b'])assert(C.transferWorkbench.coefficientValues(k).some(v=>C.eq(v,p.model[k])));
  const w=solve(C,t);assert(w.done);assert.deepEqual(w.errors,[]);
  if(skill==='equation_from_table'){assert(C.eq(w.values.a,p.model.a));assert(C.eq(w.values.b,p.model.b));assert.equal(C.stages(t).includes('tableB'),p.rows.some(P=>!P.x.n));}
 }
});
test('slope fraction accepts either order of any two columns, but rejects mismatched axes and columns',()=>{
 for(let a=0;a<3;a++)for(let b=0;b<3;b++)if(a!==b){const t=task(),w=advance(t,'slopeFraction'),v={ys:[{column:a,axis:'y'},{column:b,axis:'y'}],xs:[{column:a,axis:'x'},{column:b,axis:'x'}]};assert(C.check(t,w,v).ok);v.xs.reverse();assert.equal(C.check(t,w,v).code,'wave.transfer.fractionOrder');v.xs[0].axis='y';assert.equal(C.check(t,w,v).code,'wave.transfer.fractionAxes');}
});
test('no-intercept route retains a while selecting one point, solving b and undoing',()=>{
 const t=task('equation_from_table',2,3),w=advance(t,'pointX');assert(!C.stages(t).includes('tableB'));assert(C.submit(t,w,{column:2,axis:'x'}).ok);assert(!C.submit(t,w,{column:1,axis:'y'}).ok);assert(C.submit(t,w,{column:2,axis:'y'}).ok);assert(C.submit(t,w,C.expected(t,w)).ok);
 const before=structuredClone(w),e=C.transferWorkbench.equation(t,w);assert(C.submit(t,w,C.expected(t,w)).ok);assert.equal(C.stages(t)[w.index],'installB');assert(C.eq(w.values.b,t.params.model.b));C.undo(w);assert.equal(w.index,before.index);assert.deepEqual(C.transferWorkbench.equation(t,w),e);assert(C.eq(w.values.a,t.params.model.a));
 const restored=JSON.parse(JSON.stringify(w));while(!restored.done)assert(C.submit(t,restored,C.expected(t,restored)).ok);assert(C.eq(restored.values.b,t.params.model.b));
});
test('draw two arbitrary visible line points; wrong or repeated points stay editable',()=>{
 const t=task('graph_from_table',0,0),w=t.work=C.fresh(t),points=[];for(let x=-5;x<=5;x++)for(let y=-5;y<=5;y++){const p=C.gridPoint(t,{x,y});if(C.onLine(p,t.params.model))points.push(p)}
 assert(C.check(t,w,[points[0],points.at(-1)]).ok);assert(!C.submit(t,w,[points[0],points[0]]).ok);assert.equal(w.index,0);assert(!w.done);assert(!C.submit(t,w,[points[0],{x:C.q(0),y:C.q(100)}]).ok);assert(C.submit(t,w,[points[0],points.at(-1)]).ok);assert(w.done);
});
test('graph checks only complete a/b combinations, retaining correct coefficients on repair',()=>{
 const t=task('equation_from_graph'),w=t.work=C.fresh(t),m=t.params.model;
 assert.equal(C.submit(t,w,{a:C.add(m.a,1),b:m.b}).code,'wave.transfer.graphA');assert.equal(C.submit(t,w,{a:m.a,b:C.add(m.b,1)}).code,'wave.transfer.graphB');assert.equal(w.index,0);assert(C.submit(t,w,{a:m.a,b:m.b}).ok);assert(w.done);
});
test('context stays out of active routes and historical progress survives migration',()=>{
 assert(!C.order.includes('equation_from_context'));assert(!J.allSkills.includes('equation_from_context'));
 const s={skills:{equation_from_context:{seen:5,strength:.7}},access:['equation_from_context','point'],review:[{skill:'equation_from_context',kind:'repair',due:0}],journey:{version:1,selected:'formula-context',proof:{equation_from_context:true},visits:{'formula-context':2},active:{id:'old',place:'formula-context',targets:['equation_from_context'],draft:{skill:'equation_from_context'},results:[]}}};
 const old=structuredClone(s);assert(!C.unlock(s).includes('equation_from_context'));J.data(s);assert.deepEqual(s.skills,old.skills);assert.deepEqual(s.review,old.review);assert.deepEqual(s.journey.proof,old.journey.proof);assert.deepEqual(s.journey.visits,old.journey.visits);assert.equal(s.journey.active.place,'formula-data');assert.equal(s.journey.active.draft,null);
});
