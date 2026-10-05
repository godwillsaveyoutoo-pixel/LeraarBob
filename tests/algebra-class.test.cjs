const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../games/algebra-trainer/core.js'),G=require('../games/algebra-trainer/battle-config.js'),P=require('../shared/multiplayer/algebra-class-policy.cjs'),S=require('../games/algebra-trainer/stelsels/core.js');
test('all 17 types produce reproducible questions and exact server grades under all number settings',()=>{for(const {id:skill}of G.skills.filter(s=>s.topicId==='equations'))for(let flags=0;flags<8;flags++)for(let seed=0;seed<12;seed++){const spec={skill,seed,variant:seed%4,fractions:!!(flags&1),decimals:!!(flags&2),negative:!!(flags&4)},a=G.generate(spec),b=G.generate(spec);assert.equal(C.eqSig(a.start),C.eqSig(b.start));assert(a.solution.eq(b.solution));const answer={value:a.solution.n+'/'+a.solution.d};assert(P.grade(spec,answer));assert(P.grade(spec,{value:(a.solution.n*2)+'/'+(a.solution.d*2)}));assert(!P.grade(spec,{value:(a.solution.n+a.solution.d)+'/'+a.solution.d,correct:true}));assert(!P.grade(spec,{correct:true}));assert(C.solvedEquation(a.states.at(-1)));}});
test('numbers support decimal commas and fractions, without unsafe or ambiguous values',()=>{for(const [input,n,d]of [['-0,5',-1,2],['+2',2,1],['−3/6',-1,2],['1/-2',-1,2],['0',0,1]])assert(G.parse(input).eq(new C.Rat(n,d)),input);for(const value of ['1/0','2abc','1e3','1.2.3','NaN','Infinity','90071992547409999999','',null,2])assert.equal(G.parse(value),null);assert(!P.grade({skill:'invalid',seed:1,variant:0},{value:'1'}));});
test('seeded generation does not replace global randomness or change solo generation',()=>{const before=Math.random;G.generate({skill:'E1',seed:99,variant:0});assert.equal(Math.random,before);assert(C.generateExercise('A1',{allowNegative:false,allowFractions:false,allowDecimals:false}).solution);});

test('simple system battles reuse exact native generation and grade both final coordinates',()=>{
 const before=Math.random;
 for(let seed=0;seed<200;seed++)for(let variant=0;variant<4;variant++){
  const spec={skill:'S1',seed,variant},task=G.generate(spec),again=G.generate({...spec,fractions:true,decimals:true,negative:false});
  assert.equal(S.systemTex(task.start),S.systemTex(again.start));assert.equal(task.solution.kind,'unique');
  assert.equal(task.level,'beginner');assert.equal(task.solution.x.d,1);assert.equal(task.solution.y.d,1);
  assert(Math.abs(task.solution.x.n)<=4&&Math.abs(task.solution.y.n)<=4);
  const native=S.generate((seed+Math.imul(variant,0x9e3779b9))>>>0,'beginner','unique');assert.equal(S.systemTex(task.start),S.systemTex(native.start));
  const answer={x:S.text(task.solution.x),y:S.text(task.solution.y)};
  assert(P.grade(spec,answer));assert(P.grade(spec,{x:task.solution.x.n*2+'/2',y:task.solution.y.n+'.0'}));
  assert(!P.grade(spec,{...answer,x:String(task.solution.x.n+1),correct:true}));assert(!P.grade(spec,{...answer,y:String(task.solution.y.n+1),correct:true}));
  for(const malformed of [{value:answer.x},{x:answer.x},{x:answer.x,y:'NaN'},{x:answer.x,y:2},{x:'1'.repeat(41),y:answer.y},{x:'1/0',y:answer.y},{correct:true}])assert(!P.grade(spec,malformed));
 }
 assert.equal(Math.random,before);
 assert.deepEqual(G.worlds.map(w=>w.id),['equations','systems']);assert.deepEqual(G.worlds[1].skills,['S1']);
 assert.deepEqual(G.presets,require('../games/algebra-trainer/journey-core.js').stops.map(t=>({id:t.id,label:t.title,skills:t.skills})));
});
test('system specification bounds match client and server generation',()=>{
 for(const seed of [0,4294967295])assert(G.generate({skill:'S1',seed,variant:3}).solution.kind==='unique');
 for(const seed of [-1,4294967296,1.5,'1',null])assert.throws(()=>G.generate({skill:'S1',seed,variant:0}));
 for(const variant of [-1,4,1.5,'1',null])assert.throws(()=>G.generate({skill:'S1',seed:1,variant}));
});
