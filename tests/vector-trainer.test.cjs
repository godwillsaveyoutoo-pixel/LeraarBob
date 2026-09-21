const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../games/vectoren/vector-core.js'),M=C.VectorMath,V=C.TaskValidator,G=C.TaskGenerator,S=C.TrainerScheduler;
const p=M.point,v=M.vec,s=(start,x,y,role='vector')=>M.stroke(start,M.endPointFromVector(start,v(x,y)),role);
const origin=p(0,0),u=v(2,1),w=v(-1,2);
function sumTask(policy='headtail'){return {interaction:'sketch',policy,start:origin,target:M.add(u,w),parts:[u,w]}}
function solution(t){
 if(t.interaction==='number')return {values:[String(t.target.dx),String(t.target.dy)]};
 if(t.interaction==='point')return {point:t.targetPoint};
 if(t.policy==='decompose'){const [d,e]=t.dirs,k=M.cross(t.target,e)/M.cross(d,e),l=M.cross(d,t.target)/M.cross(d,e);return {strokes:[M.stroke(t.start,M.endPointFromVector(t.start,M.scale(d,k))),M.stroke(t.start,M.endPointFromVector(t.start,M.scale(e,l)))]}}
 if(t.policy==='commute'){const out=[];for(const [start,parts] of [[t.start,t.parts],[t.secondStart,[...t.parts].reverse()]]){const a=M.endPointFromVector(start,parts[0]),b=M.endPointFromVector(a,parts[1]);out.push(M.stroke(start,a),M.stroke(a,b))}return {strokes:out}}
 const end=M.endPointFromVector(t.start,t.target);
 if(t.policy==='parallelogram')return {strokes:[...t.parts.map(x=>M.stroke(M.endPointFromVector(t.start,x),end)),M.stroke(t.start,end,'result')]};
 if(['headtail','ordered'].includes(t.policy)){const mid=M.endPointFromVector(t.start,t.parts[0]);return {strokes:[M.stroke(t.start,mid),M.stroke(mid,end),M.stroke(t.start,end,'result')]}}
 return {strokes:[M.stroke(t.start,end)]};
}
test('A/B: translated equal vector and negative half-vector use model coordinates',()=>{
 const t={interaction:'sketch',policy:'free',start:p(-2,1),target:v(-2,1),source:v(4,-2),factor:-.5};
 assert.equal(V.validate(t,{strokes:[s(t.start,-2,1)]}).ok,true);
 assert.equal(V.validate(t,{strokes:[s(p(0,0),-2,1)]}).code,'start');
 assert(M.vectorEquals(M.scale(v(4,-2),-.5),v(-2,1)));
 assert(M.vectorEquals(M.vectorFromPoints(p(-2,1),p(3,4)),v(5,3)));
});
test('C/D/E/F: head-tail allows both orders and out-of-order drawing; diagnoses disconnected copies and wrong resultant',()=>{
 const t=sumTask(),end=p(1,3),a=[s(origin,2,1),s(p(2,1),-1,2),M.stroke(origin,end,'result')],b=[s(origin,-1,2),s(p(-1,2),2,1),M.stroke(origin,end,'result')];
 assert(V.validate(t,{strokes:a}).ok);assert(V.validate(t,{strokes:b}).ok);assert(V.validate(t,{strokes:[a[1],a[0],a[2]]}).ok);
 assert.equal(V.validate(t,{strokes:[a[0],s(p(4,4),-1,2),a[2]]}).code,'headtail');
 assert.equal(V.validate(t,{strokes:[a[0],a[1],s(origin,2,3,'result')]}).code,'resultant');
 const result=V.validate(sumTask('ordered'),{strokes:b});assert.equal(result.RESULT_OK,true);assert.equal(result.METHOD_OK,false);assert.equal(result.code,'order');
});
test('G: parallelogram distinguishes correct diagonal from complete method',()=>{
 const t=sumTask('parallelogram'),diag=s(origin,1,3,'result'),incomplete=V.validate(t,{strokes:[diag]});
 assert.equal(V.validate(t,{strokes:[s(origin,1,3)]}).RESULT_OK,true);
 assert.equal(incomplete.RESULT_OK,true);assert.equal(incomplete.METHOD_OK,false);assert.equal(incomplete.code,'parallelogram');
 assert(V.validate(t,{strokes:[s(p(2,1),-1,2),s(p(-1,2),2,1),diag]}).ok);
});
test('H: decomposition accepts free components, swapped directions, negative and zero components',()=>{
 const t={interaction:'sketch',policy:'decompose',start:origin,target:v(1,3),dirs:[v(1,1),v(-1,1)]};
 assert(V.validate(t,{strokes:[s(p(4,-2),-1,1),s(p(-3,1),2,2)]}).ok);
 assert(V.validate({...t,target:v(2,2)},{strokes:[s(origin,0,0),s(origin,2,2)]}).ok);
 assert.equal(V.validate(t,{strokes:[s(origin,1,0),s(origin,0,3)]}).code,'component-direction');
});
test('I/J/K/L/M: B-A, x/y, signed numbers, fractions, sums and basis coefficients',()=>{
 const t={interaction:'number',target:v(5,3),skill:'ab'};
 assert(V.validate(t,{values:['5','3']}).ok);assert.equal(V.validate(t,{values:['-5','-3']}).code,'ba');assert.equal(V.validate(t,{values:['3','5']}).code,'xy');
 assert(V.validate({interaction:'number',target:M.add(v(3,-2),v(-1,4))},{values:['2','2']}).ok);
 assert(V.validate({interaction:'number',target:v(-.5,1.5)},{values:['−1/2','1,5']}).ok);
 assert(V.validate({interaction:'number',target:v(3,4)},{values:['3','4']}).ok);
 for(const input of ['', '-', '1/0','1//2','1e3','NaN'])assert(Number.isNaN(C.parseNumber(input)));
});
test('N: 2a-b accepts direct result or equivalent intermediary constructions without a fixed order',()=>{
 const t={interaction:'sketch',policy:'free',start:origin,target:v(5,0),acceptChain:true,refs:[{v:u},{v:w}]};
 const routes=[[s(origin,2,1),s(p(2,1),2,1),s(p(4,2),1,-2)],[s(origin,4,2),s(p(4,2),1,-2)],[s(origin,1,-2),s(p(1,-2),4,2)]];
 for(const steps of routes){assert(V.validate(t,{strokes:[...steps,s(origin,5,0,'result')]}).ok);assert(V.validate(t,{strokes:steps}).ok)}
});
test('all generated families/levels accept a mathematical solution and keep all required points on the board',()=>{
 for(const sk of G.skills)for(let level=0;level<3;level++)for(let seed=1;seed<35;seed++){
  const t=G.generate(sk.id,{seed,level,variant:seed%8}),a=solution(t),r=V.validate(t,a);assert(r.ok,`${sk.id} L${level} seed${seed}: ${JSON.stringify(r)}`);
  if(t.representation==='symbolic')continue;const pts=[...(a.strokes||[]).flatMap(l=>[l.start,l.end]),a.point].filter(Boolean);
  for(const q of pts){assert(q.x>=t.bounds.minX&&q.x<=t.bounds.maxX&&q.y>=t.bounds.minY&&q.y<=t.bounds.maxY,sk.id+' bounds');assert(Number.isInteger(q.x));assert(Number.isInteger(q.y))}
 }
});
test('scheduler gates prerequisites, mixes skills, delays repair, needs fresh independent evidence and survives malformed storage',()=>{
 const state=S.freshState();assert.deepEqual(S.unlocked(state),['props']);
 const task=G.generate('props');state.skills.props.intro=true;
 S.record(state,task,{clean:false,code:'direction',now:100});assert.equal(state.repairs[0].due,3);assert.notEqual(S.choose(state).mode,'repair');
 for(let i=0;i<2;i++)S.record(state,G.generate('props',{seed:i+2,variant:i+1,level:1}),{clean:true,now:200});
 assert(S.unlocked(state).includes('equal'));assert.equal(S.choose(state).mode,'repair');assert.notEqual(S.phase(state,'props'),'solid');
 const repair=G.generate('props',{seed:4,level:1,repair:'direction'});S.record(state,repair,{clean:true});assert.equal(state.repairs[0].stage,1);assert.equal(state.repairs[0].due,state.total+6);
 const normalized=S.sanitize({version:2,total:'oops',skills:{props:{strength:Infinity,seen:-5,recent:['x',true]}},repairs:[{skill:'inexistent',code:'x'}]});assert.equal(normalized.total,0);assert.equal(normalized.skills.props.strength,0);assert.deepEqual(normalized.repairs,[]);
});
module.exports={solution};
