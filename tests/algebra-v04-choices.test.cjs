const assert=require('node:assert/strict'),C=require('../games/algebra-trainer/core.js'),W=require('../games/algebra-trainer/workbench-core.js'),J=require('../games/algebra-trainer/journey-core.js'),L=require('../games/algebra-trainer/learning-core.js'),T=require('../games/algebra-trainer/touch-core.js'),katex=require('../shared/vendor/katex/katex.min.js');
const has=(choices,op,value)=>choices.some(s=>s.op===op&&C.exprSig(s.operand)===C.exprSig(C.N(value)));
let choicesChecked=0,replaysChecked=0;
for(const type of C.TYPES)for(let seed=1;seed<=10;seed++){
 const ex=C.generateSeeded(type.id,{allowFractions:true,allowDecimals:true,allowNegative:true},0,seed);
 for(const eq of ex.states.slice(0,-1)){
  const choices=W.contextOperations(ex,eq);assert.ok(choices.length<=6);
  const scalar=[...C.topTerms(eq.l),...C.topTerms(eq.r)].filter(C.containsVar).map(C.outerScalar).find(q=>q&&!q.isZero()&&!q.eq(1));
  if(scalar){assert.ok(has(choices,'/',scalar));assert.ok(has(choices,'*',C.reciprocal(scalar)));}
  for(const s of choices){const after=C.applyEquation(eq,s.op,s.operand);assert.ok(L.evaluate(after.l,ex.solution).eq(L.evaluate(after.r,ex.solution)));}
  choicesChecked++;
 }
}
// A pupil can introduce fractions even when the generator is set to integers.
const policy={allowFractions:false,allowDecimals:false,allowNegative:false};
for(const coefficient of [C.R(1,3),C.R(-1,3),C.R(2,3),C.R(3),C.R(-3),C.R(1,2),C.R(1,10)]){
 for(const side of ['l','r']){
  const variable=C.Mul(C.N(coefficient),C.V()),eq=side==='l'?C.EQ(variable,C.N(4)):C.EQ(C.N(4),variable),ex={start:eq,states:[eq],steps:[],policy};
  const choices=W.contextOperations(ex,eq);assert.ok(has(choices,'/',coefficient));assert.ok(has(choices,'*',C.reciprocal(coefficient)));
  assert.equal(C.eqSig(C.applyEquation(eq,'/',C.N(coefficient))),C.eqSig(C.applyEquation(eq,'*',C.N(C.reciprocal(coefficient)))));
 }
}
for(const stop of J.stops)for(let seed=1;seed<=30;seed++){
 const old=J.mission(stop.id,seed),saved=JSON.stringify(old),fresh=J.freshMission(stop.id,old,seed),signatures=new Set(old.tasks.map(J.questionSignature));
 assert.equal(JSON.stringify(old),saved);assert.deepEqual(fresh.tasks.map(t=>[t.kind,t.ex.type,t.guided]),old.tasks.map(t=>[t.kind,t.ex.type,t.guided]));
 assert.ok(fresh.tasks.every(t=>!signatures.has(J.questionSignature(t))));assert.equal(new Set(fresh.tasks.map(J.questionSignature)).size,fresh.tasks.length);assert.ok(fresh.results.every(r=>!r.done));
 for(const t of fresh.tasks)assert.ok(L.evaluate(t.ex.start.l,t.ex.solution).eq(L.evaluate(t.ex.start.r,t.ex.solution)),stop.id+' generated solution');replaysChecked++;
}
for(const type of C.TYPES){const old=L.mission(type.id,91),fresh=J.freshMission('eq-'+type.id,old,91),signatures=new Set(old.tasks.map(J.questionSignature));assert.ok(fresh.tasks.every(t=>!signatures.has(J.questionSignature(t))),type.id+' legacy replay');}

let palettesChecked=0,verificationChoices=0,answerPositions=new Set();
for(const stop of J.stops)for(let seed=1;seed<=60;seed++)for(const t of J.mission(stop.id,seed).tasks){
 if(['predict','repair','expand','build'].includes(t.kind)){
  const options=T.palette(t),required=t.kind==='build'?[C.N(t.expectedNumber)]:[...C.topTerms(L.expandEquation(t.expected).l),...C.topTerms(L.expandEquation(t.expected).r)];
  assert.ok(options.length>=3&&options.length<=6);assert.equal(new Set(options.map(o=>o.key)).size,options.length);
  for(const term of required){const key=C.exprSig(term);assert.ok(options.some(o=>o.key===key));answerPositions.add(options.findIndex(o=>o.key===key));}
  assert.ok(options.some(o=>!required.some(r=>C.exprSig(r)===o.key)),'Must offer a real mathematical alternative');
  options.forEach(o=>katex.renderToString(o.tex,{throwOnError:true}));palettesChecked++;
 }else if(t.kind==='verify'){
  for(const side of ['left','right'])if(C.containsVar(t.ex.start[side==='left'?'l':'r'])){
   const value=L.evaluate(t.ex.start[side==='left'?'l':'r'],t.proposed),options=T.valueChoices(t,side);assert.ok(options.some(o=>o.expr.q.eq(value)));assert.ok(options.some(o=>!o.expr.q.eq(value)));assert.ok(options.length<=6);verificationChoices++;
  }
  T.verifyDemo(t.ex,t.proposed).forEach(f=>katex.renderToString(f.tex,{throwOnError:true,strict:'ignore',trust:ctx=>ctx.command===String.fromCharCode(92)+'htmlClass'}));
  for(const s of T.numericStages(t.ex,t.proposed)){assert.ok(L.evaluate(s.left,C.R(0)).eq(L.evaluate(t.ex.start.l,t.proposed)));assert.ok(L.evaluate(s.right,C.R(0)).eq(L.evaluate(t.ex.start.r,t.proposed)));}
 }
}
assert.ok(answerPositions.size>=4,'Correct terms cannot always occupy the same positions');
const start=C.EQ(C.Add(C.Mul(C.N(-7),C.V()),C.N(2)),C.N(-19)),operation={op:'-',operand:C.N(2)},task={id:'bob-negative-example',kind:'predict',ex:{start,policy:{}},operation,expected:C.applyEquation(start,operation.op,operation.operand)};
const tiles=T.palette(task).map(o=>o.tex);for(const term of ['-7x','7x','-21','-17'])assert.ok(tiles.includes(term),term+' useful block');
assert.equal(T.blockTex([C.Mul(C.N(-7),C.V()),C.N(2)],{}),'-7x + 2');assert.equal(T.blockTex([C.N(3),C.N(-3)],{}),'3 - 3','Do not simplify the pupil construction');
const partial=T.history(task,{input:'3+-3=',blocks:{lhs:[C.N(3),C.N(-3)],rhs:[]}});assert.equal(partial.at(-1).tex,'3 - 3 = \\square');assert.match(partial.at(-1).caption,/nog niet goedgekeurd/);
const proof={start:L.parseEquation('-2x+6=20'),policy:{allowNegative:true}},frames=T.verifyDemo(proof,C.R(-6));
assert.ok(frames.some(f=>f.tex.includes('12 + 6')),'Show multiplication before adding the constant');assert.ok(frames.at(-1).tex.includes('18 \\ne 20'));
const decimal={start:L.parseEquation('2x+1=4'),policy:{allowDecimals:true,allowFractions:false}};assert.ok(T.verifyDemo(decimal,C.R(3,2))[1].tex.includes('1{,}5'),'Respect the decimal policy in substitutions');
for(const i of [4,5]){const answers=new Set();for(let seed=1;seed<=20;seed++){const t=J.mission('route-check',seed).tasks[i];answers.add(L.evaluate(t.ex.start.l,t.proposed).eq(L.evaluate(t.ex.start.r,t.proposed)));}assert.equal(answers.size,2,'The task position must not reveal whether the proposed value works');}
console.log(JSON.stringify({ok:true,choicesChecked,replaysChecked,palettesChecked,verificationChoices,answerPositions:[...answerPositions]}));
