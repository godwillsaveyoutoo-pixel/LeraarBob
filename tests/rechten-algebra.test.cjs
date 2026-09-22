const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../games/rechten/trainer/wave-core.js'),{solve,nextAnswer}=require('./rechten-algebra-helpers.cjs');
const task=(skill,difficulty=2,variant=0,seed=1)=>({skill,difficulty,params:C.generate(skill,{difficulty,variant,seed})});
// Separate BigInt fraction arithmetic verifies generated statements and every transformed line.
const rat=q=>[BigInt(q.n),BigInt(q.d)],plus=([a,b],[c,d])=>[a*d+b*c,b*d],times=([a,b],[c,d])=>[a*c,b*d],same=([a,b],[c,d])=>a*d===c*b;
const value=(e,x,y)=>plus(plus(times(rat(e.x),rat(x)),times(rat(e.y),rat(y))),rat(e.c));
function checkModel(t,w){const p=t.params;if(t.skill==='rewrite_linear_equation')for(let i=-3;i<=3;i++){
 const x=p.model.kind==='vertical'?p.model.c:C.q(i),y=p.model.kind==='vertical'?C.q(i):C.add(C.mul(p.model.a,x),p.model.b);
 for(const e of [p.equation,...w.history.map(h=>h.equation).filter(Boolean),w.equation])assert(same(value(e.left,x,y),value(e.right,x,y)));
 }else if(t.skill==='input_from_output'&&p.solution)assert(same(plus(times(rat(p.model.a),rat(p.solution)),rat(p.model.b)),rat(p.target)));
 else if(t.skill==='point_on_line')assert(same(plus(times(rat(p.model.a),rat(p.P.x)),rat(p.model.b)),rat(p.value)));
}
test('1800 controlled algebra tasks; exact model, all stages, both operation orders and mastery coverage',()=>{
 let count=0;for(const skill of C.algebraSkills){const st={};for(let difficulty=0;difficulty<3;difficulty++)for(let seed=1;seed<=200;seed++){
  const t=task(skill,difficulty,seed%12,seed),w=solve(C,t),alternate=solve(C,t,true);checkModel(t,w);checkModel(t,alternate);assert(w.done&&alternate.done);assert.equal(w.errors.length,0);C.evidence(st,t,count++,true);
 }assert(C.mastered(st,skill),'coverage '+skill)}assert.equal(count,1800);
});
test('audit equations permit elimination first or division first with exact fractions',()=>{
 for(const [left,right,a,b] of [[C.expr(2,1),C.expr(0,0,7),-2,7],[C.expr(0,3),C.expr(6,0,-9),2,-3],[C.expr(2,-4),C.expr(0,0,8),C.q(1,2),-2]]){
  const t={skill:'rewrite_linear_equation',params:{equation:{left,right},model:{kind:'affine',a:C.q(a),b:C.q(b)}}};
  for(const first of [false,true]){const w=solve(C,t,first);assert(C.isolated(w.equation,'y'));assert(C.eq(w.equation.right.x,a));assert(C.eq(w.equation.right.c,b));assert(C.equivalent(t.params.equation,w.equation))}
 }
});
test('zero division, zero multiplication, non-equivalent and unfinished rules rejected without losing work',()=>{
 const t=task('rewrite_linear_equation'),w=C.fresh(t),e=C.algebraEquation(t,w),before=JSON.stringify(e);
 for(const op of [{kind:'divide',value:C.q(0)},{kind:'multiply',value:C.q(0)},{kind:'add',term:'x',value:C.q(0)},{kind:'divide',value:{n:1,d:0}},{kind:'finish'}]){assert(!C.submit(t,w,op).ok);assert.equal(JSON.stringify(C.algebraEquation(t,w)),before);assert.equal(w.index,0)}
 const bad=structuredClone(e);bad.left.c=C.add(bad.left.c,1);assert(!C.equivalent(e,bad));
 const collapsed={left:C.expr(),right:C.expr()};assert(!C.equivalent(e,collapsed));assert(!C.equivalent(collapsed,e));
 assert(C.submit(t,w,nextAnswer(C,t,w)).ok);const restored=JSON.parse(JSON.stringify(w));C.undo(restored);assert.equal(JSON.stringify(C.algebraEquation(t,restored)),before);assert(restored.errors.length>0);
});
test('missing x audit cases and constant no/all solutions require substitution and verification',()=>{
 for(const [a,b,target,solution,kind] of [[2,1,7,3,null],[0,4,4,null,'all'],[0,4,5,null,'none']]){
  const t={skill:'input_from_output',params:{model:{kind:'affine',a:C.q(a),b:C.q(b)},target:C.q(target),solution:solution===null?null:C.q(solution)}},w=solve(C,t);
  if(kind){assert.equal(w.values.constantSolutions,kind);assert(C.eq(w.values.constantVerify,b))}else{assert(C.eq(w.equation.right.c,solution));assert(C.eq(w.values.verifyInput,target))}
  const fresh=C.fresh(t);assert(!C.submit(t,fresh,'input').ok);assert.equal(fresh.index,0);
 }
});
test('point decision requires computed output, preserves it on wrong verdict, detects off-line distance',()=>{
 for(const y of [5,6]){const t={skill:'point_on_line',params:{model:{kind:'affine',a:C.q(2),b:C.q(-3)},P:{x:C.q(4),y:C.q(y)},value:C.q(5)}},w=C.fresh(t);
 assert(!C.submit(t,w,'y').ok);assert(C.submit(t,w,'x').ok);assert(!C.submit(t,w,'on').ok);assert(!C.submit(t,w,C.q(6)).ok);assert(C.submit(t,w,C.q(5)).ok);
 assert(!C.submit(t,w,y===5?'off':'on').ok);assert(C.eq(w.values.pointValue,5));assert(C.submit(t,w,y===5?'on':'off').ok);assert(w.done);
 }
});
test('704 migration is pure, retains old access and pending work, does not invent new scores',()=>{
 const old={version:702,catalogVersion:2,xp:19,skills:{ab:{seen:5,strength:.8},future:{opaque:true}},review:[{skill:'zero',kind:'repair'}],access:['equation_from_two_points','fx'],waveDraft:{id:'prior',work:{entry:['-3','2'],index:4}}},copy=structuredClone(old),up=C.migrate(old);
 assert.deepEqual(old,copy);assert.equal(up.version,704);assert.equal(up.catalogVersion,4);assert.deepEqual(up.waveDraft,old.waveDraft);assert.deepEqual(up.skills,old.skills);assert(!up.skills.rewrite_linear_equation);assert(up.access.includes('equation_from_two_points'));assert.deepEqual(C.migrate(up),up);
 assert.deepEqual(C.requirements.intercept_from_point,['equation_from_ab']);assert.deepEqual(C.requirements.input_from_output,['fx','rewrite_linear_equation']);
});
