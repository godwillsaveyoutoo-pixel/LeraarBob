const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../games/vectoren/vector-core.js'),L=require('../games/vectoren/vector-lessons.js'),M=C.VectorMath,S=C.TrainerScheduler,G=C.TaskGenerator;
test('XP distinguishes independent, corrected and skipped answers, and survives older saves',()=>{
 const p=S.freshState(),t=G.generate('free',{level:2});
 assert.equal(S.record(p,t,{clean:true}),14);
 assert.equal(S.record(p,t,{clean:false,solved:true,code:'opposite'}),5);
 assert.equal(S.record(p,t,{clean:false,solved:false}),0);
 assert.equal(p.xp,19);assert.equal(S.sanitize(JSON.parse(JSON.stringify(p))).xp,19);
 assert.equal(S.sanitize({version:2,total:12,skills:{}}).xp,0);
 assert.equal(S.sanitize({...p,xp:-1}).xp,0);assert.equal(S.sanitize({...p,xp:Infinity}).xp,0);
 const repair=G.generate('free',{level:1,repair:'opposite'});
 assert.equal(S.record(p,repair,{clean:true}),15);assert.equal(S.record(p,repair,{clean:true}),18);assert.equal(p.xp,52);
});
test('every family supplies concrete progressive steps for every task representation',()=>{
 let n=0;
 for(const sk of G.skills)for(let level=0;level<3;level++)for(let variant=0;variant<8;variant++){
  const t=G.generate(sk.id,{level,variant,seed:51}),l=L.build(t);n++;
  assert(l.steps.length>=2,sk.id);assert(l.steps.every(s=>s.title&&s.text),sk.id);
  assert(!/undefined|NaN/.test(JSON.stringify(l)),sk.id);
  assert.equal(l.steps[0].strokes.length,0,sk.id+' starts with givens');
  for(const step of l.steps)for(const stroke of step.strokes)assert(M.vectorEquals(stroke,M.vectorFromPoints(stroke.start,stroke.end)),sk.id+' drawn geometry');
  if(t.interaction==='point')assert.deepEqual(l.steps.at(-1).point,t.targetPoint,sk.id+' example endpoint');
  if(t.interaction==='number')assert(l.conclusion.includes(C.coord(t.target))||sk.id==='route'||sk.id==='fourth',sk.id+' numerical conclusion');
 }
 assert.equal(n,576);
});
test('worked arithmetic explains the actual task numbers and handles signs',()=>{
 const t=G.generate('ab',{level:2,seed:5,variant:1}),{A,B}=t.inputPoints;
 assert(L.build(t).conclusion.includes(`${C.format(B.x)} − (${C.format(A.x)})`));
 const unknown=G.generate('unknown',{level:2,seed:4,variant:2});assert(L.build(unknown).conclusion.startsWith('b = '));
 for(const sk of ['scalar','difference','combination','decompose']){
  const l=L.build(G.generate(sk,{level:0,seed:51,variant:1}));assert(!l.steps.some(s=>/\(−?\d+,/.test(s.calculation)),'geometry comes before coordinate notation: '+sk);
 }
});
