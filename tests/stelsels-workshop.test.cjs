const test=require('node:test'),assert=require('node:assert/strict'),C=require('../games/algebra-trainer/stelsels/core.js');
function same(a,b){assert.equal(a.kind,b.kind);if(a.kind==='unique'){assert(a.x.eq(b.x));assert(a.y.eq(b.y))}}
test('generated systems and every key step preserve exact solutions across levels and methods',()=>{for(const level of ['beginner','basis','advanced'])for(const kind of ['unique','none','infinite'])for(let seed=0;seed<100;seed++){const ex=C.generate(seed,level,kind);assert.equal(ex.solution.kind,kind);assert.deepEqual(C.generate(seed,level,kind),ex);for(const method of ['substitution','combination']){const steps=C.canonical(ex,method);assert(steps.length>1);for(const step of steps)same(C.solution(step.system),ex.solution);if(kind==='unique')assert(C.solved(steps.at(-1).system));else assert(steps.at(-1).system.some(e=>{const r=C.reduced(e);return r.x.isZero()&&r.y.isZero()}))}for(const eq of ex.start){const pts=C.graphPoints(eq);assert(pts[0]&&pts[1]);assert(!pts[0].x.eq(pts[1].x)||!pts[0].y.eq(pts[1].y));for(const p of pts)assert(C.containsPoint(eq,p.x,p.y))}}});
test('alternative operations, both retained equations and substitution in either direction',()=>{const ex=C.generate(92,'basis'),s=ex.start;for(const row of [0,1])for(const op of ['+','-','*','/']){const after=C.operate(s,row,op,C.R(3,2),'+-'.includes(op)?'y':'c');same(C.solution(after),ex.solution);assert.deepEqual(after[1-row],s[1-row])}for(const target of [0,1])for(const op of ['+','-']){const after=C.combine(s,C.R(-2),C.R(3),op,target);same(C.solution(after),ex.solution);assert.deepEqual(after[1-target],s[1-target])}assert.throws(()=>C.operate(s,0,'/',C.R(0)));assert.throws(()=>C.combine(s,C.R(0),C.R(1),'+',0));assert.throws(()=>C.substitute(s,0));});
test('safe exact number input and snapshot recovery',()=>{assert(C.parse('0,5').eq(C.R(1,2)));assert(C.parse('-3/2').eq(C.R(-3,2)));for(const s of ['','1/0','Infinity','1e8','<script>','2x'])assert.throws(()=>C.parse(s));const ex=C.generate(41,'advanced');assert.deepEqual(C.revive(JSON.stringify(ex)),ex)});

test('the written operation accepts negative variables and preserves the exact operation on both sides',()=>{
 const system=[C.equation(C.expr(1,1),C.expr(0,0,5)),C.equation(C.expr(2,-1),C.expr(0,0,1))];
 for(const [input,op,value,term,command]of [
  ['-y','-',1,'y','-y'],['y','-',1,'y','-y'],['−y','-',1,'y','-y'],['+x','+',1,'x','+x'],
  ['-1/2y','-',C.R(1,2),'y','-1/2y'],['+3x','+',3,'x','+3x'],['÷2','/',2,'c','÷2'],['×-2','*',-2,'c','×-2'],['+-2x','-',2,'x','-2x'],['-1/-2y','+',C.R(1,2),'y','+1/2y']
 ]){
  const parsed=C.parseOperation(input);assert.equal(parsed.op,op,input);assert(parsed.value.eq(C.R(value)),input);assert.equal(parsed.term,term,input);assert.equal(parsed.command,command,input);
  assert.equal(C.systemTex(C.operate(system,0,parsed.op,parsed.value,parsed.term)),C.systemTex(C.operate(system,0,op,C.R(value),term)),input);
 }
 const isolated=C.operate(system,0,...(()=>{const p=C.parseOperation('-y');return[p.op,p.value,p.term]})());assert.equal(C.isolated(isolated[0]).variable,'x');assert.equal(C.eqText(isolated[0]),'x = −y + 5');assert.equal(C.eqText(isolated[1]),C.eqText(system[1]));
 for(const bad of ['÷y','×x','x+y','2xy','-','+','÷','sin(x)','1/0y','1.2.3x'])assert.throws(()=>C.parseOperation(bad),undefined,bad);
 assert.equal(C.operationText('-',C.R(-1),'y'),'+y','old minus a negative unit term becomes an explicit plus');
 assert.equal(C.operationText('-',C.R(-2),'x'),'+2x');assert.equal(C.operationText('+',C.R(-1),'x'),'-x');assert(C.parse('−2').eq(C.R(-2)));
});
