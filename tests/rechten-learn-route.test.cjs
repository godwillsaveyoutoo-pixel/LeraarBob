const {test}=require('node:test'),assert=require('node:assert/strict');
const G=require('../games/rechten/rechtenwereld/learn-config.js'),C=require('../games/rechten/rechtenwereld/learn-catalog.js'),R=require('../games/rechten/rechtenwereld/mission-runtime.js');
const {fill}=require('./helpers/rechten-question-fixtures.cjs');
function solve(spec){let state=G.generate(spec);const steps=[];while(true){state=fill(state);const m=R.active(state);steps.push({phase:m.phase,values:structuredClone(m.values)});if(!G.nextPhase(state))break;state=G.nextInput(state);assert(steps.length<8);}return {steps};}
module.exports={solve};
test('catalog matches every released map node and all six questions are solvable',()=>{
 assert.equal(G.skills.length,21);assert.deepEqual(C.worlds,G.worlds);assert.deepEqual(C.skills,G.skills);
 for(const {id} of G.skills)for(const seed of [1,19,812723])for(let variant=0;variant<6;variant++){
  const spec={skill:id,seed,variant},answer=solve(spec);assert(G.validate(G.generate(spec),answer).ok,JSON.stringify(spec));
  for(let i=1;i<=answer.steps.length;i++){const part={steps:answer.steps.slice(0,i)},restored=G.restore(spec,part);assert.equal(R.active(restored.state).phase,part.steps.at(-1).phase);assert.deepEqual(R.active(restored.state).values,part.steps.at(-1).values);assert.equal(restored.history.length,i-1);assert.equal(R.active(restored.state).feedback,null);}
  assert(!G.validate(G.generate(spec),{steps:[]}).ok);if(answer.steps.length>1)assert(!G.validate(G.generate(spec),{steps:answer.steps.slice(1)}).ok);
 }
});
test('incomplete steps cannot advance; semantically wrong work remains an ungraded proposal',()=>{
 const spec={skill:'equation_from_two_points',seed:19,variant:1};let state=G.generate(spec);
 assert.throws(()=>G.nextInput(state));state=fill(state);state=R.edit(state,'y1','A.x');const next=G.nextInput(state);assert.equal(R.active(next).values.y1,'A.x');assert.equal(R.active(next).feedback,null);assert.equal(R.active(next).phase,'derive-slope');
 const good=solve(spec),bad=structuredClone(good);bad.steps[0].values.y1='A.x';assert(!G.validate(G.generate(spec),bad).ok,'later corrected values do not erase an incorrect first step');
});

test('a six-question behavior series includes falling, rising and constant lines in all representations',()=>{const tasks=Array.from({length:6},(_,variant)=>R.active(G.generate({skill:'line_behavior',seed:19,variant})).task);assert.deepEqual(tasks.map(t=>Math.sign(t.model.a.n)),[-1,-1,1,1,0,0]);assert.deepEqual(new Set(tasks.map(t=>t.representation)),new Set(['graph','slope','points']));});
