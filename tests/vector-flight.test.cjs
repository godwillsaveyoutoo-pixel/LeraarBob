const test=require('node:test'),assert=require('node:assert/strict');
const {TaskGenerator:G,VectorMath:M}=require('../games/vectoren/vector-core.js');
const {model}=require('../games/vectoren/vector-flight.js');
test('equal-duration flight paths preserve the factor, sense and reference length for every thrust variant',()=>{
 for(const skill of ['opposite','scalar'])for(let seed=1;seed<=40;seed++)for(let variant=0;variant<4;variant++)for(let level=0;level<3;level++){
  const task=G.generate(skill,{seed,variant,level}),flight=model(task),[a,b]=flight.routes;
  assert(M.vectorEquals(b.v,M.scale(a.v,flight.factor)));
  assert.equal(M.length(b.v),Math.abs(flight.factor)*M.length(a.v));
  assert.equal(flight.factor===0,M.isZero(b.v));
  if(task.choicePositions){const i=task.options.findIndex(v=>M.vectorEquals(v,task.target));assert.deepEqual(b.start,task.choicePositions[i]);}
  else assert.deepEqual(b.start,task.start);
 }
 assert.equal(model(G.generate('headtail')),null);
});
