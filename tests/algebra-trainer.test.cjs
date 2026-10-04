const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../games/algebra-trainer/core.js');
const {R}=C;const W=require('../games/algebra-trainer/workbench-core.js');
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

test('contextknoppen bieden tegengestelde bewerkingen en eerst delen zonder oplossingsroute af te dwingen',()=>{
 const {N,V,Add,Mul,EQ}=C;
 const ex=routeFixture(EQ(Add(Mul(N(4),V()),N(6)),Add(Mul(N(2),V()),N(10))));
 const choices=W.contextOperations(ex,ex.start);
 assert.equal(choices.length,6);
 for(const [op,operand] of [['+',Mul(N(2),V())],['-',Mul(N(2),V())],['+',N(6)],['-',N(6)],['/',N(4)],['*',N(R(1,4))]]){
  assert(choices.some(s=>s.op===op&&C.exprSig(s.operand)===C.exprSig(operand)));
 }
 const divided=C.applyEquation(ex.start,'/',N(4));
 assert(W.contextOperations(ex,divided).some(s=>s.op==='-'&&C.exprSig(s.operand)===C.exprSig(N(R(3,2)))), 'actuele breuk blijft direct bereikbaar');
});

test('contextkeuzes bewaren voor alle 17 vormen de exacte oplossing en sluiten nul uit',()=>{
 for(const t of C.TYPES)for(let bits=0;bits<8;bits++)for(let i=0;i<3;i++){
  const ex=C.generateSeeded(t.id,{allowFractions:!!(bits&1),allowDecimals:!!(bits&2),allowNegative:!!(bits&4)},i,912+i);
  for(const eq of ex.states.slice(0,-1)){
   const choices=W.contextOperations(ex,eq);assert(choices.length>0&&choices.length<=6);
   assert.equal(new Set(choices.map(s=>s.op+C.exprSig(s.operand))).size,choices.length);
   for(const s of choices){const after=C.applyEquation(eq,s.op,s.operand);assert(value(after.l,ex.solution).eq(value(after.r,ex.solution)),t.id+' equivalente keuze');}
  }
 }
});

test('controle beschrijft de actuele vergelijking, ook met x rechts, zonder werk te veranderen',()=>{
 const {N,V,Add,Mul,Div,EQ}=C;
 const examples=[
  [EQ(Add(Mul(N(4),V()),N(6)),Add(Mul(N(2),V()),N(10))),'beide kanten'],
  [EQ(Add(Mul(N(4),V()),N(6)),N(14)),'iets bij'],
  [EQ(Mul(N(4),V()),N(8)),'product'],
  [EQ(Div(V(),N(4)),N(2)),'breuk'],
  [EQ(Mul(N(4),Add(V(),N(3))),N(28)),'product']
 ];
 for(const [eq,text] of examples)for(const current of [eq,EQ(eq.r,eq.l)]){
  const before=JSON.stringify(current),checked=W.checkProgress(current);
  assert.equal(checked.solved,false);assert(checked.message.includes(text));assert.equal(JSON.stringify(current),before);
 }
 for(const type of C.TYPES)for(const policy of [{allowFractions:false,allowDecimals:false,allowNegative:false},{allowFractions:true,allowDecimals:true,allowNegative:true}]){
  const ex=C.generateSeeded(type.id,policy,0,9721);
  for(const eq of ex.states){const checked=W.checkProgress(eq);assert.equal(checked.solved,C.solvedEquation(eq),type.id);}
  assert.equal(W.checkProgress(ex.states.at(-1)).message,'Juist. x staat vrij.');
 }
});

function routeFixture(start,policy={allowFractions:false,allowDecimals:false,allowNegative:false}){
 return {start,policy,states:[start],steps:[]};
}
function choose(ex,eq,op,operand){
 assert(C.candidateOperands(ex,eq,op).some(v=>C.exprSig(v)===C.exprSig(operand)),
  `Ontbrekende keuze ${op} ${C.latexExpr(operand,ex.policy)} bij ${C.latexEq(eq,ex.policy)}`);
 return C.applyEquation(eq,op,operand);
}
test('eerst delen blijft oplosbaar met afgeleide breuken, ook bij een gehele-getallenreeks',()=>{
 const {N,V,Add,Mul,EQ}=C;
 const ex=routeFixture(EQ(Add(Mul(N(4),V()),N(6)),Add(Mul(N(2),V()),N(10))));
 for(const removeLeft of [false,true]){
  let eq=choose(ex,ex.start,'/',N(4));
  eq=choose(ex,eq,'-',N(R(3,2)));
  eq=choose(ex,eq,'-',removeLeft?V():Mul(N(R(1,2)),V()));
  if(removeLeft)eq=choose(ex,eq,'-',N(1));
  eq=choose(ex,eq,'/',N(removeLeft?R(-1,2):R(1,2)));
  assert(C.solvedEquation(eq));assert(value(eq.l,R(2)).eq(value(eq.r,R(2))));
 }
});
test('delen biedt actuele coëfficiënten aan, ook als beide leden meerdere termen hebben',()=>{
 const {N,V,Add,Mul,EQ}=C;
 const ex=routeFixture(EQ(Add(Mul(N(4),V()),N(6)),Add(Mul(N(2),V()),N(10))));
 const eq=C.applyEquation(ex.start,'+',Mul(N(13),V()));
 choose(ex,eq,'/',N(17));choose(ex,eq,'/',N(15));
});
test('vermenigvuldigen na eerst delen werkt op elke term van beide leden',()=>{
 const {N,V,Add,Mul,EQ}=C;
 const ex=routeFixture(EQ(Add(Mul(N(4),V()),N(6)),Add(Mul(N(2),V()),N(10))));
 const divided=choose(ex,ex.start,'/',N(4));
 const restored=choose(ex,divided,'*',N(4));
 assert.equal(C.eqSig(restored),C.eqSig(ex.start));
});
test('noodzakelijke actuele termen worden niet afgekapt na acht keuzeknoppen',()=>{
 const {N,V,Add,Mul,EQ}=C;
 // Distinct grouped terms can occur after valid operations on parenthesised equations.
 const terms=Array.from({length:10},(_,i)=>Mul(N(i+2),Add(V(),N(i+1))));
 const ex=routeFixture(EQ(Add(...terms),N(123)));
 const options=C.candidateOperands(ex,ex.start,'-');
 for(const term of [...terms,N(123)])assert(options.some(v=>C.exprSig(v)===C.exprSig(term)));
});
test('vergelijkingen met x aan beide kanten blijven oplosbaar na eerst delen en eerst constanten wegwerken',()=>{
 const random=Math.random;let seed=75119;
 Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 try{for(const type of ['E1','E2','E3'])for(let bits=0;bits<8;bits++)for(let i=0;i<100;i++){
  const policy={allowFractions:!!(bits&1),allowDecimals:!!(bits&2),allowNegative:!!(bits&4)};
  const ex=C.generateExercise(type,policy,i);
  // Choose a divisor that is actually offered; its fractions were not
  // necessarily present in the original exercise or the standard solution.
  const divisor=C.candidateOperands(ex,ex.start,'/').find(v=>!v.q.eq(1));
  let eq=choose(ex,ex.start,'/',divisor);
  const constant=C.topTerms(eq.l).find(C.isNum);
  if(constant&&!constant.q.isZero())eq=choose(ex,eq,constant.q.n<0?'+':'-',C.N(constant.q.abs()));
  const variable=C.topTerms(eq.r).find(t=>C.containsVar(t));
  if(variable){const sign=C.splitSign(variable);eq=choose(ex,eq,sign.neg?'+':'-',sign.abs)}
  if(!C.solvedEquation(eq))eq=choose(ex,eq,'/',C.N(C.outerScalar(eq.l)));
  assert(C.solvedEquation(eq),type+' alternative route must finish');
  const solution=eq.l.t==='var'?eq.r.q:eq.l.q;
  assert(solution.eq(ex.solution),type+' same exact solution');
  assert(value(ex.start.l,solution).eq(value(ex.start.r,solution)));
 }}finally{Math.random=random;}
});
