const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../games/algebra-trainer/core.js');
const {R}=C;
function value(e,x){switch(e.t){case 'num':return R(e.q.n,e.q.d);case 'var':return x;case 'add':return e.terms.reduce((s,t)=>s.add(value(t,x)),R(0));case 'mul':return e.factors.reduce((s,t)=>s.mul(value(t,x)),R(1));case 'div':return value(e.n,x).div(value(e.d,x));default:throw Error('node')}}
test('17 oefenvormen blijven exact equivalent en de afdruksleutel eindigt bij dezelfde oplossing',()=>{
 const random=Math.random;let seed=982731;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 try{for(const type of C.TYPES)for(let policy=0;policy<8;policy++)for(let i=0;i<200;i++){
  const p={allowFractions:!!(policy&1),allowDecimals:!!(policy&2),allowNegative:!!(policy&4)},ex=C.generateExercise(type.id,p,i);
  assert(C.operandRepresentable(ex.start.l,p,false)&&C.operandRepresentable(ex.start.r,p,false),type.id+' getalsoorten');
  let eq=ex.start;
  for(const step of ex.steps){const options=C.candidateOperands(ex,eq,step.op);assert(options.some(o=>C.exprSig(o)===C.exprSig(C.simplify(step.operand))),type.id+' standaardstap moet bereikbaar blijven');eq=C.applyEquation(eq,step.op,step.operand)}
  assert(C.solvedEquation(eq),type.id);const x=eq.l.t==='var'?eq.r.q:eq.l.q;
  assert(value(ex.start.l,x).eq(value(ex.start.r,x)),type.id+' oorspronkelijke gelijkheid');
  assert.equal(C.eqSig(eq),C.eqSig(ex.states.at(-1)));assert(ex.solution.eq(x),type.id+' oplossingsmetadata');
 }}finally{Math.random=random;}
});
test('breuken blijven exact en delen door nul of onveilige integergroei wordt afgewezen',()=>{
 assert(R(1,3).add(R(1,6)).eq(R(1,2)));assert(R(-2,-4).eq(R(1,2)));
 assert.throws(()=>R(1).div(R(0)),/nul/);assert.throws(()=>R(Number.MAX_SAFE_INTEGER+1),/breuk/);
});
