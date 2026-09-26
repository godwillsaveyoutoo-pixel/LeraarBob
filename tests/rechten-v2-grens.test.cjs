'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const G=require('../games/rechten/trainer-v2/grens-core.js'),R=require('../games/rechten/trainer-v2/mission-runtime.js'),W=require('../games/rechten/trainer/wave-core.js'),M=require('../games/rechten/trainer-v2/semantic-math-core.js'),A=require('../games/rechten/trainer-v2/content/area-maps.js'),V=require('../games/rechten/trainer-v2/components/grens-view.js'),S=require('../games/rechten/trainer-v2/components/shell-view.js');
const answer=t=>String(t.options.findIndex(q=>W.eq(q,t.root)));
function solve(s){const m=R.active(s);if(m.phase==='grens-chart')for(const [k,v]of Object.entries(G.expectedChart(m.task)))s=R.edit(s,k,v);else if(m.phase==='grens-inequality')s=R.edit(s,'inequality',M.intervalExpected(m.task).symbol);else s=R.edit(s,'answer',answer(m.task));s=R.commit(s);assert(R.active(s).feedback.result.ok);return R.advance(s)}
test('all five sequences have exact roots, four unique choices, both slopes, signed/fractional boundaries and varied replay',()=>{
 for(const skill of G.skills){const slopes=new Set(),roots=[];for(let run=1;run<=4;run++)for(let i=0;i<G.count;i++){
  const t=G.makeTask(skill,i,run);assert(W.eq(M.at(t.model,t.root),0));assert.equal(t.options.length,4);assert.equal(new Set(t.options.map(W.text)).size,4);assert.equal(t.options.filter(q=>W.eq(q,t.root)).length,1);assert(G.check(t,{answer:answer(t)},'grens-zero').ok);assert(!G.check(t,{answer:String((Number(answer(t))+1)%4)},'grens-zero').ok);assert.equal(G.check(t,{},'grens-zero').kind,'interaction_error');assert.equal(G.check(t,{answer:'100'},'grens-zero').kind,'interaction_error');
  assert.notDeepEqual(t.root,G.makeTask(skill,i,run+1).root);slopes.add(Math.sign(t.model.a.n));roots.push(t.root);
 }assert.equal(slopes.size,2);assert(roots.some(q=>!q.n));assert(roots.some(q=>q.n<0));assert(roots.some(q=>q.d>1));}
});
test('strict inequalities exclude the zero, follow the slope, and distinguish positive from negative',()=>{
 for(const skill of ['positive','negative'])for(let i=0;i<G.count;i++){
  const t=G.makeTask(skill,i),want=M.intervalExpected(t).symbol;
  for(const response of ['<','=','>'])assert.equal(G.check(t,{inequality:response},'grens-inequality').ok,response===want);
  const probe=W.add(t.root,want==='>'?1:-1),value=M.at(t.model,probe);assert.equal(value.n>0,skill==='positive');assert.equal(G.check(t,{},'grens-inequality').kind,'interaction_error');
 }
});
test('charts require three explicit answers, match function signs, and retain correct cells on repair and undo',()=>{
 for(let i=0;i<G.count;i++){const t=G.makeTask('signchart',i),want=G.expectedChart(t);assert(G.check(t,want,'grens-chart').ok);assert.equal(want.chartZero,'0');assert.notEqual(want.chartLeft,want.chartRight);assert.equal(G.check(t,{},'grens-chart').kind,'interaction_error');}
 let s=R.start(R.initial(),'signchart');s=R.putSign(s,'-');assert.equal(R.active(s).values.chartSlot,'chartZero');s=R.putSign(s,'+');s=R.putSign(s,'+');s=R.advance(R.commit(s));assert.deepEqual(R.active(s).locks,{chartLeft:true,chartRight:true});assert.equal(R.active(s).values.chartSlot,'chartZero');s=R.putSign(s,'0');s=R.undo(s);assert.equal(R.active(s).values.chartZero,'+');assert.equal(R.active(s).values.chartLeft,'-');s=R.putSign(s,'0');assert(R.active(R.commit(s)).feedback.result.ok);
});
test('each stop resumes independently, only full sequences complete the matching stop, and replay preserves completion',()=>{
 let s=R.edit(R.start(R.initial(),'grenspas'),'root','2');const legacy=structuredClone(s.missions.grenspas);
 for(const skill of G.skills){s=R.start(s,skill);const before=structuredClone(s);s=solve(s);const m=R.active(s);assert.notEqual(A.statuses(s,'grenspas').nodes.find(n=>n.key===skill).state,'completed');const saved=structuredClone(m);s=R.start(R.start(s,'point'),skill);assert.deepEqual(R.active(s),saved);assert.deepEqual(JSON.parse(JSON.stringify(s)),s);assert.deepEqual(before.missions.grenspas,legacy);
  while(!R.active(s).completed)s=solve(s);assert.equal(A.statuses(s,'grenspas').nodes.find(n=>n.key===skill).state,'completed');s=R.start(s,skill,true);assert.equal(A.statuses(s,'grenspas').nodes.find(n=>n.key===skill).state,'completed');
 }assert.deepEqual(s.missions.grenspas,legacy);assert(s.events.every(e=>e.mastery===false));assert.equal(A.statuses(s,'grenspas').completed,5);
});
test('a correct root in a sign sequence does not complete zeroRead or the sign sequence',()=>{
 let s=solve(R.start(R.initial(),'positive'));assert.equal(R.active(s).phase,'grens-inequality');assert.equal(A.statuses(s,'grenspas').completed,0);assert.equal(R.active(s).locks.answer,true);s=R.edit(s,'inequality','=');s=R.advance(R.commit(s));assert.equal(R.active(s).phase,'grens-inequality');assert.equal(R.active(s).locks.answer,true);assert.equal(A.statuses(s,'grenspas').completed,0);
});
test('all five hints and a new example preserve progress and earlier missions',()=>{
 for(const skill of G.skills){let s=R.start(R.initial(),skill);for(let i=0;i<5;i++)s=R.hint(s);const before=R.active(s).task;s=R.newAfterExample(s);assert.equal(R.active(s).run,2);assert.notDeepEqual(R.active(s).task.root,before.root);assert.equal(R.active(s).hints,0);assert.equal(R.active(s).phase,G.firstPhase(skill));}
});
test('views reveal root labels only when given or checked, show both chart representations, and keep correct breadcrumbs',()=>{
 for(const skill of G.skills){let s=R.start(R.initial(),skill),m=R.active(s);assert.equal(V.graph(m).includes('class="grens-root-label"'),skill==='signchart');assert(!V.render(m,'').includes('is-correct'));assert(S.header(s,{mission:true}).includes(G.titles[skill].replace('>','&gt;').replace('<','&lt;')));if(skill!=='signchart'){s=R.commit(R.edit(s,'answer',answer(m.task)));assert(V.graph(R.active(s)).includes('class="grens-root-label"'));}}
 assert.equal(G.makeTask('signchart',0).representation,'graph');assert.equal(G.makeTask('signchart',1).representation,'formula');assert(V.formula(G.makeTask('zero',0)).includes('f(x) = x − 2'));
});

test('formula sign charts explain the coefficient of x in reminders, hints and repair feedback, including saved tasks',()=>{
 let s=solve(R.start(R.initial(),'signchart')),m=R.active(s);assert.equal(m.task.representation,'formula');
 const html=V.render(m,'');assert(html.includes('richtingscoëfficiënt a'));assert(html.includes('coëfficiënt van x'));assert(!html.includes('ligt de grafiek'));assert(!html.includes('grafiek boven'));
 const old={...m.task,hints:['Kijk naar de grafiek.']};assert(G.hintsFor(old)[0].includes('coëfficiënt van x'));assert(G.hintsFor(old)[1].includes('a = 1'));
 const result=G.check(m.task,{chartLeft:'+',chartZero:'0',chartRight:'+'},'grens-chart');assert(!result.ok);assert(result.message.includes('coëfficiënt van x'));assert(!result.message.includes('grafiek'));
});
