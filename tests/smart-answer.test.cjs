const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../games/bewerkingen-trainer/core.js'),S=require('../games/bewerkingen-trainer/smart-answer.js');
test('all sixteen question forms can be answered with meaningful choices, no keyboard',()=>{
 for(const skill of C.SKILLS)for(const level of[0,1,2])for(let seed=1;seed<=30;seed++)for(const variant of[0,1,2,3]){
  const task=C.generate(skill.id,seed,level,variant),m=S.model(task),values=Object.fromEntries(m.slots.map(s=>[s.id,s.value]));
  for(const s of m.slots){assert(s.options.includes(s.value),task.id+' missing correct choice '+s.value);assert(s.options.length>=2);}
  const value=m.expression(values);assert(C.check(task,value).ok,task.id+' '+value+' expected '+task.answer+' '+C.check(task,value).message);
  assert.equal(m.expression({}),'');
 }
});
