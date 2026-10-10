const test=require('node:test'),assert=require('node:assert/strict');
const L=require('../games/logicawereld/logic.js'),C=require('../games/logicawereld/content.js');
const signature=e=>L.cases(L.variables(e)).map(env=>L.value(e,env)?1:0).join('');
test('Independent reference truth tables, including false-premise implication and false/false equivalence',()=>{
 for(const [formula,expected] of Object.entries({'p∧q':'1000','p∨q':'1110','p⇒q':'1011','p⇔q':'1001','¬(p∧q)':'0111','¬(p∨q)':'0001','¬p∧q':'0010','p∧¬q':'0100','¬p∨q':'1011','¬(p⇒q)':'0100','(p∨q)∧¬r':'01010100'}))assert.equal(signature(formula),expected,formula);
});
test('Classical identities are exhaustive, one matching row is insufficient',()=>{
 for(const [a,b] of [['¬(p∨q)','¬p∧¬q'],['¬(p∧q)','¬p∨¬q'],['p⇒q','¬q⇒¬p'],['p⇔q','(p⇒q)∧(q⇒p)'],['(p∧q)∨p','p'],['(p∨q)∧p','p']])assert.equal(L.equivalent(a,b),true);
 assert.equal(L.equivalent('p⇒q','q⇒p'),false);assert.equal(L.equivalent('¬(p∨q)','¬p∨q'),false);
 assert.equal(L.classify('p∨¬p'),'altijd');assert.equal(L.classify('p∧¬p'),'nooit');assert.equal(L.classify('p⇔q'),'soms');
});
test('Invalid formula text and missing facts never silently evaluate',()=>{
 for(const expr of ['','p+q','(p∧q','p q','p∧','¬','x'])assert.throws(()=>L.parse(expr),expr);
 assert.throws(()=>L.value('p∧q',{p:true}),/ontbreekt/);
});
const builderAnswers=[];for(const left of ['p','q'])for(const right of ['p','q'])for(const op of ['∧','∨','⇒','⇔'])for(const leftNot of [false,true])for(const rightNot of [false,true])for(const outerNot of [false,true])builderAnswers.push({left,right,op,leftNot,rightNot,outerNot});
function candidateAnswers(t){if(t.type==='choice'||t.type==='multi'){if(t.type==='choice')return t.options.map(o=>o.id);return Array.from({length:2**t.options.length},(_,mask)=>t.options.filter((_,i)=>mask&(1<<i)).map(o=>o.id));}if(t.type==='predict')return [true,false];if(t.type==='build')return builderAnswers;if(t.type==='circuit'){const out=[];for(const a of ['PASS','NOT'])for(const b of ['PASS','NOT'])for(const c of t.allowDerived?['AND','OR','NAND','NOR']:['AND','OR'])out.push([a,b,c]);return out;}if(t.type==='table')return [L.cases(t.vars||L.variables(t.columns.map(c=>c.expr).join(''))).map(e=>t.columns.map(c=>L.value(c.expr,e)))];if(t.type==='difference')return L.cases([...new Set([...L.variables(t.expr),...L.variables(t.other)])]);if(t.type==='counter')return t.domain;if(t.type==='classify')return ['altijd','soms','nooit'];if(t.type==='puzzle')return t.candidates.map(c=>c.id);throw Error(t.type);}
test('All 90 core tasks and 4 optional tasks are reachable and have a valid answer',()=>{
 assert.equal(C.stops.length,18);assert.equal(C.stops.flatMap(s=>s.tasks).length,90);assert.equal(C.bonus.length,4);assert.equal(new Set(C.tasks.map(t=>t.id)).size,C.tasks.length);
 const districtStops=C.districts.flatMap(d=>d.stops);assert.equal(new Set(districtStops).size,18);
 for(const t of C.tasks){assert.ok(t.prompt&&t.explanation&&t.hint,t.id);assert.ok(candidateAnswers(t).some(a=>L.validate(t,a).correct),t.id+' is unsolvable');}
 for(const s of C.stops)assert.ok(s.tasks.some(t=>t.transfer),s.name+' needs transfer');
});
test('Every task rejects at least one incorrect answer; incomplete tables are rejected',()=>{
 for(const t of C.tasks){let candidates=candidateAnswers(t);if(t.type==='table'){const flipped=structuredClone(candidates[0]);flipped[0][0]=!flipped[0][0];candidates.push(flipped);assert.equal(L.validate(t,[]).correct,false,t.id);}assert.ok(candidates.some(a=>!L.validate(t,a).correct),t.id+' accepts everything');}
});
test('Counterexamples accept every valid alternative and diagnose the real failure',()=>{
 const t=C.tasks.find(t=>t.id==='L13-1');for(const n of [4,12])assert.equal(L.validate(t,n).correct,true);
 assert.equal(L.validate(t,2).category,'premise');assert.equal(L.validate(t,8).category,'conclusion');
 assert.equal(L.validate(C.tasks.find(t=>t.id==='L17-2'),2).correct,true);
});
test('Formula constructions accept semantic alternatives but respect the requested De Morgan form',()=>{
 const t=C.tasks.find(t=>t.id==='L06-4');const a={left:'p',right:'q',op:'∨',leftNot:true,rightNot:true,outerNot:false};assert.equal(L.validate(t,a).correct,true);
 const dm=C.tasks.find(t=>t.id==='L10-1');assert.equal(L.validate(dm,{left:'p',right:'q',op:'∨',leftNot:false,rightNot:false,outerNot:true}).correct,false);
});
test('Module puzzle has exactly one valid candidate; invalid-inference counterexample preserves both premises',()=>{
 const t=C.tasks.find(t=>t.type==='puzzle');assert.deepEqual(t.candidates.filter(c=>L.validate(t,c.id).correct).map(c=>c.id),['ilias']);
 const env={p:false,q:false,r:false};for(const premise of ['p⇒¬q','q⇒r'])assert.equal(L.value(premise,env),true);assert.equal(L.value('¬r⇒p',env),false);
});
test('Evidence distinguishes first correctness, later success, hints and distinct transfer tasks',()=>{
 const t=C.tasks[0],start=L.newRecord(t);let r=L.attempt(start,'x',{correct:false,category:'meaning'});r=L.attempt(r,t.correct,{correct:true});assert.deepEqual(L.stats([r]),{total:1,firstCorrect:0,eventuallyCorrect:1,wrongAttempts:1,hints:0});assert.equal(r.firstAnswer,'x');assert.equal(L.attempt(r,'x',{correct:false}).attempts,2);
 const hinted=L.newRecord(t);hinted.hints=1;assert.equal(L.attempt(hinted,t.correct,{correct:true}).firstCorrect,false);
 const good=id=>({taskId:id,firstCorrect:true,hints:0,transfer:id==='c'});assert.equal(L.mastered([good('a'),good('a'),good('c')]),false);assert.equal(L.mastered([good('a'),good('b'),good('c')]),true);
});
test('Output not correctness colors and no keyboard are structural contracts',()=>{
 const fs=require('node:fs'),html=fs.readFileSync(require('node:path').join(__dirname,'../games/logicawereld/index.html'),'utf8'),app=fs.readFileSync(require('node:path').join(__dirname,'../games/logicawereld/app.js'),'utf8');
 assert.ok(!/<input|<textarea/i.test(html+app));assert.ok(app.includes("screen==='review'"));assert.ok(html.includes('data-platform-progress="levels"'));assert.ok(html.includes('../../shared/axioma-auth.js'));assert.ok(!app.includes('.rpc('),'No invented server provider');
});
module.exports={candidateAnswers};
