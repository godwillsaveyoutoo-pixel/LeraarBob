const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../games/algebra-trainer/core.js'),L=require('../games/algebra-trainer/learning-core.js'),W=require('../games/algebra-trainer/world-core.js');
const text=eq=>C.fallbackText(C.latexEq(eq,{}));
test('six areas cover the 17 existing equation forms with explicit learning goals',()=>{
 const areas=W.worlds.filter(w=>w.engine==='equations');assert.equal(areas.length,6);
 assert.deepEqual(areas.flatMap(w=>w.topics.map(t=>t.skill)).sort(),C.TYPES.map(t=>t.id).sort());
 for(const t of C.TYPES){assert(L.goals[t.id]);const run=L.mission(t.id,556);assert.equal(run.tasks.length,5);assert.equal(run.tasks[0].kind,'solve');assert.equal(run.tasks[3].kind,'solve');assert.equal(run.tasks[2].kind,'predict');assert(run.tasks.some(t=>!['solve','predict'].includes(t.kind)));assert(!run.tasks[2].guided);assert(!run.results[2].input);}
});
test('prediction checks members, not just the solution set',()=>{
 const task=L.mission('B1',88).tasks[2];assert(L.validate(task,{input:'3x=12'}).ok);assert(L.validate(task,{input:'12=3*x'}).ok);assert(!L.validate(task,{input:'x=4'}).ok);assert(!L.validate(task,{input:'3x=18'}).ok);
 assert(L.sameExpr(L.parseExpression('(3x+6)/2'),L.parseExpression('1,5x+3')));
 assert(!L.sameExpr(L.parseExpression('x/2+3'),L.parseExpression('(x+3)/2')));
 assert.throws(()=>L.parseExpression('x/0'));assert.throws(()=>L.parseExpression('x*x'));assert.throws(()=>L.parseExpression('x/x'));assert.throws(()=>L.parseExpression('alert(1)'));
});
test('distributivity is produced and errors are located, not inferred from a solution',()=>{
 const repair=L.mission('C2',81).tasks[1],expanded=L.mission('D1',81).tasks[4];
 // Generate plain expressions from exact coefficients for independent answer construction.
 const plain=eq=>[eq.l,eq.r].map(e=>{const q=L.affine(e);return `${q.a.n}/${q.a.d}x+(${q.b.n}/${q.b.d})`}).join('=');
 assert(!L.validate(repair,{input:plain(repair.expected),location:'both'}).ok);
 assert(L.validate(repair,{input:plain(repair.expected),location:'group'}).ok);
 assert(!L.validate(expanded,{input:plain(expanded.ex.start).replace('=', '=1+')} ).ok);
 assert(L.validate(expanded,{input:plain(expanded.expected)}).ok);
 assert(!L.validate(expanded,{input:C.fallbackText(C.latexEq(expanded.ex.start,{}))}).ok);
});
test('both routes remain mathematically valid; strategic goals are separate',()=>{
 const task=L.mission('E1',44).tasks[1];for(const route of task.routes){const after=C.applyEquation(task.ex.start,route.op,route.operand);assert(L.evaluate(after.l,C.R(2)).eq(L.evaluate(after.r,C.R(2))));}
 assert(!L.validate(task,{choice:'0'}).ok);assert(L.validate(task,{choice:'1'}).ok);
});
test('each production answer validates exactly across varied generated missions',()=>{
 const plain=e=>{const q=L.affine(e);return `${q.a.n}/${q.a.d}x+(${q.b.n}/${q.b.d})`};
 for(const t of C.TYPES)for(let seed=0;seed<40;seed++)for(const task of L.mission(t.id,seed*1121).tasks){
  if(task.expected)assert(L.validate(task,{input:plain(task.expected.l)+'='+plain(task.expected.r),location:'group'}).ok,t.id);
  if(task.kind==='routes')assert(task.routes.some((_,i)=>L.validate(task,{choice:String(i)}).ok),t.id);
  if(task.kind==='verify'){const left=L.evaluate(task.ex.start.l,task.proposed),right=L.evaluate(task.ex.start.r,task.proposed);assert(L.validate(task,{left:`${left.n}/${left.d}`,right:`${right.n}/${right.d}`,choice:left.eq(right)?'yes':'no'}).ok);}
 }
});
test('five completed tasks award once; earlier practice is not a new mission',()=>{
 let p=W.record(null,'eq-A2','one').progress;assert(!p.topics['eq-A2'].finished);assert.equal(W.xp(p),0);
 const evidence=L.mission('A2',14).results;assert.equal(W.recordMission(p,'eq-A2',evidence).xp,0);
 evidence.forEach(r=>r.done=true);const reward=W.recordMission(p,'eq-A2',evidence);assert.equal(reward.xp,30);assert(reward.progress.topics['eq-A2'].finished);assert(W.unlocked(reward.progress,'eq-A3'));assert.equal(W.recordMission(reward.progress,'eq-A2',evidence).xp,0);
 const restored=W.normalize(JSON.parse(JSON.stringify(reward.progress)));assert.equal(restored.topics['eq-A2'].evidence.filter(e=>!e.supported).length,3);
 assert.deepEqual(W.platformProgress(restored),{completed:['eq-A2'],total:23});
 const old={topics:{'eq-A2':{answers:['a','b','c'],rewarded:true}}};assert(!W.normalize(old).topics['eq-A2'].finished);assert.equal(W.recordMission(old,'eq-A2',evidence).xp,0);assert.equal(W.xp(W.recordMission(old,'eq-A2',evidence).progress),30);
});
