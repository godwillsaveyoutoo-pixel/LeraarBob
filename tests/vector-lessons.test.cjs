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
  if(t.policy==='decompose')for(const step of l.steps)assert(step.strokes.every(s=>!M.isZero(s)),'decomposition examples use two actual arrows');
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
test('help menu topics use readable text without combining or mathematical glyphs',()=>{
 const labels=G.skills.map(L.topicLabel);
 assert.equal(new Set(labels).size,G.skills.length);
 for(const label of labels)assert(!/[\p{M}\p{So}\u2070-\u209f\uFFFD]/u.test(label),label);
 assert.match(L.topicLabel(G.skills.find(s=>s.id==='commute')),/Volgorde/);
});
test('worked constructions satisfy their tasks, including oblique components and reversed routes',()=>{
 for(const sk of G.skills)for(const seed of [5,51,512])for(let level=0;level<3;level++)for(let variant=0;variant<8;variant++){
  const t=G.generate(sk.id,{seed,level,variant}),last=L.build(t).steps.at(-1);
  if(t.interaction!=='sketch')continue;
  // Ontbinden illustrates both v at P and its translated copy: submit one of each component.
  const strokes=t.skill==='decompose'?last.strokes.filter(s=>M.samePoint(s.start,t.start)):last.strokes;
  const verdict=C.TaskValidator.validate(t,{strokes});
  assert(verdict.ok,`${sk.id}/${seed}/${level}/${variant}: ${JSON.stringify(verdict)}`);
 }
});
test('route examples distinguish the displacement vector from endpoint coordinates at every level',()=>{
 for(const seed of [5,51,512])for(let level=0;level<3;level++)for(let variant=0;variant<4;variant++){
  const t=G.generate('route',{seed,level,variant}),steps=L.build(t).steps,last=steps.at(-1),r=last.strokes.find(s=>s.role==='result');
  const [a,b,c]=t.operands,displacement=M.sum([M.scale(a,2),M.scale(b,3),...(c?[M.scale(c,-1)]:[])]),start=t.routeStart||t.start,end=M.endPointFromVector(start,displacement);
  assert(M.samePoint(r.start,start));assert(M.vectorEquals(r,displacement));assert(M.samePoint(r.end,end));
  assert(last.calculation.endsWith(`= (${C.format(end.x)}, ${C.format(end.y)})`));
  for(let i=1;i<steps.length;i++)assert(steps[i].strokes.length-steps[i-1].strokes.length<=1,'one new route arrow per step');
 }
});
test('commutativity teaches each route separately and compares equal vectors at different points',()=>{
 const t=G.generate('commute',{seed:512,level:0,variant:1}),steps=L.build(t).steps;
 assert.deepEqual(steps.map(s=>s.strokes.length),[0,1,2,3,4,5,6]);
 const results=steps.at(-1).strokes.filter(s=>s.role==='result');
 assert.equal(results.length,2);assert(M.vectorEquals(...results));assert(!M.samePoint(results[0].end,results[1].end));
 assert.equal(steps.at(-1).calculation,'u + v = v + u');
});
