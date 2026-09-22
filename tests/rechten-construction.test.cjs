const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../games/rechten/trainer/wave-core.js');
const task=(skill,options={})=>({id:skill+'-'+options.seed,skill,difficulty:options.difficulty||0,params:C.generate(skill,options)});
const point=(x,y)=>({x:C.q(x),y:C.q(y)});
function points(t){const out=[];for(let x=-5;x<=5;x++)for(let y=-5;y<=5;y++){
 const m=t.params.model;
 // Independent cross multiplication, not the validator's onLine helper.
 if(y*m.a.d*m.b.d===m.a.n*x*m.b.d+m.b.n*m.a.d)out.push(point(x,y));
}return out}
function solution(t){if(t.skill==='point_plot')return t.params.target;if(t.skill==='equation_from_ab')return {...t.params.model,variable:'x',sign:'+'};const ps=points(t);if(t.difficulty===0)return [point(0,C.num(t.params.model.b)),ps.find(p=>!C.eq(p.x,0))];return ps.slice(0,2)}
test('1800 controlled construction tasks: all levels, exact targets and complete variant coverage',()=>{
 const coverage={};let n=0;
 for(const skill of C.constructionSkills){coverage[skill]=new Set();for(let difficulty=0;difficulty<3;difficulty++)for(let seed=1;seed<=200;seed++){
  const t=task(skill,{difficulty,variant:seed%12,seed}),w=C.fresh(t);coverage[skill].add(t.params.variant);
  assert(C.submit(t,w,solution(t)).ok);assert(w.done);assert.equal(w.steps.length,1);assert(!C.submit(t,w,solution(t)).ok);
  if(skill==='point_plot'){for(const axis of ['x','y']){const ticks=C.div(t.params.target[axis],t.params[axis==='x'?'scaleX':'scaleY']);assert.equal(ticks.d,1);assert(Math.abs(ticks.n)<=5)}}
  else assert(points(t).length>=2,'constructible in view');n++;
 }}assert.equal(n,1800);
 for(const variant of ['positive','signed','axis','scale'])assert(coverage.point_plot.has(variant),variant);
 for(const skill of C.constructionSkills.filter(k=>k!=='point_plot'))for(const variant of ['positive','negative','positive-fraction','negative-fraction','horizontal'])assert(coverage[skill].has(variant),skill+variant);
});
test('every visible valid point pair accepted; identical and off-line pairs rejected',()=>{
 let checked=0;for(let variant=0;variant<12;variant++)for(let seed=1;seed<=5;seed++){
 const t=task('graph_from_equation',{difficulty:2,variant,seed}),ps=points(t);
 for(let a=0;a<ps.length;a++)for(let b=a+1;b<ps.length;b++){assert(C.check(t,C.fresh(t),[ps[a],ps[b]]).ok);assert(C.check(t,C.fresh(t),[ps[b],ps[a]]).ok);checked+=2}
 assert.equal(C.check(t,C.fresh(t),[ps[0],ps[0]]).code,'wave.graph.identical');
 const wrong={...ps[1],y:C.add(ps[1].y,1)};const r=C.check(t,C.fresh(t),[ps[0],wrong]);assert(!r.ok);assert.equal(r.point,1);
 }assert(checked>500);
 const t={skill:'graph_from_equation',difficulty:2,params:{model:{a:C.q(-1,2),b:C.q(3)}}};assert(C.check(t,C.fresh(t),[point(-2,4),point(0,3)]).ok);assert(C.check(t,C.fresh(t),[point(0,3),point(2,2)]).ok);
});
test('formula construction accepts equivalent fractions and signed constants, preserves submitted terms',()=>{
 const t={skill:'equation_from_ab',params:{model:{a:C.q(-1),b:C.q(-2)}}},w=C.fresh(t);
 const value={a:C.q(-2,2),variable:'x',sign:'−',b:C.q(4,2)},before=structuredClone(value);assert(C.submit(t,w,value).ok);assert.deepEqual(value,before);
 assert(C.check(t,C.fresh(t),{a:C.q(-1),variable:'x',sign:'+',b:C.q(-2)}).ok);
 const wrong={...value,b:C.q(3)};assert.equal(C.check(t,C.fresh(t),wrong).code,'wave.formula.intercept');assert(C.eq(wrong.a,-1));
 assert.equal(C.check(t,C.fresh(t),{...value,variable:null}).code,'wave.formula.incomplete');
 const horizontal={skill:t.skill,params:{model:{a:C.q(0),b:C.q(0)}}};assert(C.check(horizontal,C.fresh(horizontal),{a:C.q(0),variable:'x',sign:'+',b:C.q(0)}).ok);
});
test('point feedback identifies swap or only the wrong axis and honours independent axis scales',()=>{
 const t={skill:'point_plot',params:{target:point(-2,3),scaleX:C.q(2),scaleY:C.q(1,2)}};
 assert.equal(C.check(t,C.fresh(t),point(3,-2)).code,'wave.point.swapped');assert.equal(C.check(t,C.fresh(t),point(-2,2)).code,'wave.point.y');assert.equal(C.check(t,C.fresh(t),point(1,3)).code,'wave.point.x');
 assert.deepEqual(C.gridPoint(t,{x:-1,y:4}),{x:C.q(-2),y:C.q(2)});
});
test('v701 migration keeps existing access, draft, unknown fields and zero new mastery',()=>{
 const skill={intro:true,seen:4,strength:.5,recent:[true,true,true,true]},old={version:701,catalogVersion:1,skills:{point:skill,ab:skill,future:{custom:42}},review:[],access:['point','slope_from_two_points'],waveDraft:{id:'untouched',work:{index:4,values:{a:C.q(-3,2)}}},xp:123};
 const before=structuredClone(old),up=C.migrate(old);assert.deepEqual(old,before);assert.equal(up.version,702);assert.equal(up.catalogVersion,2);assert.deepEqual(up.waveDraft,old.waveDraft);assert.deepEqual(up.skills,old.skills);assert.equal(up.xp,123);assert(up.access.includes('delta'));assert(up.access.includes('intercept_from_point'));assert(up.access.includes('slope_from_two_points'));assert(!up.skills.point_plot);assert.deepEqual(C.migrate(up),up);
});
test('guided graph construction diagnoses the intercept without imposing a fixed second point',()=>{
 const t={skill:'graph_from_equation',difficulty:0,params:{model:{a:C.q(1),b:C.q(2)}}};
 assert.equal(C.check(t,C.fresh(t),[point(1,3),point(2,4)]).code,'wave.graph.intercept');assert(C.check(t,C.fresh(t),[point(0,2),point(-2,0)]).ok);
});
