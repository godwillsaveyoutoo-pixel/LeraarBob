const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../teacher/trainer-details.js'),V=require('../games/vectoren/vector-core.js'),R=require('../games/reele-getallen/real-core.js');
const wrap=(key,progress,draft=null)=>({updated_at:'2026-09-21T10:00:00Z',state:{storage:{[key]:JSON.stringify({progress,draft})}}});
const vector=p=>wrap('axioma-vectorentrainer-v020',p),real=(p,d)=>wrap('axioma-real-numbers-v1',p,d);

test('teacher skill labels and mastery use the same definitions as the trainers',()=>{
 const p=R.Progress.fresh();p.skills.rootcalc={...p.skills.rootcalc,seen:6,clean:5,reviewClean:1,recent:[true,true,true],signatures:['a','b','c'],representations:['square','cube']};
 const d=D.read('reele-getallen-trainer',real(p));assert.equal(d.skillCount,12);assert.equal(d.solid,1);assert.equal(d.skills.find(s=>s.id==='rootcalc').status,'Stevig');
 assert.equal(d.skills.find(s=>s.id==='rootsimplify').status,'Klaar om te starten');
 assert.equal(d.skills.find(s=>s.id==='rootcalc').strength,null,'no invented percentage for the real-number model');
});
test('activities preserve actual outcomes, dates and error diagnoses without treating skips as wrong answers',()=>{
 for(const [core,fresh,generate,record,id,key] of [[V,V.TrainerScheduler.freshState,V.TaskGenerator.generate,V.TrainerScheduler.record,'vectoren-trainer','axioma-vectorentrainer-v020'],[R,R.Progress.fresh,R.generate,R.Progress.record,'reele-getallen-trainer','axioma-real-numbers-v1']]){
  const p=fresh(),skill=id==='vectoren-trainer'?'props':'fraction',t=generate(skill);
  record(p,t,{clean:true,solved:true,now:1000});record(p,t,{clean:false,solved:true,code:'help',now:2000});record(p,t,{clean:false,solved:false,code:'practice',now:3000});
  const d=D.read(id,wrap(key,p));assert.equal(d.total,3);assert.equal(d.independent,1);assert.equal(d.activities[0].label,'Overgeslagen');assert.equal(d.activities[1].label,'Opgelost na hulp of verbetering');assert.equal(d.activities[2].at,1000);assert.equal(d.activities[1].error.label,'Uitleg geraadpleegd');
  assert.equal(d.skills.find(s=>s.id===skill).recent.filter(Boolean).length,1);
  for(let i=0;i<35;i++)record(p,t,{clean:true,solved:true,now:4000+i});
  const restored=D.read(id,wrap(key,p));assert.equal(restored.activities.length,30);assert(restored.historyIncomplete);assert.equal(restored.activities[0].seq,p.total);
 }
});
test('planned review uses exercise counts and shows whether prerequisites still block it',()=>{
 const p=V.TrainerScheduler.freshState();p.total=10;p.repairs=[{skill:'props',code:'xy',due:12,stage:1},{skill:'decompose',code:'component-sum',due:8,stage:0}];
 const d=D.read('vectoren-trainer',vector(p));assert.equal(d.attention[0].label,'Componenten verwisseld');assert.equal(d.attention[0].review,'Na nog 2 opgaven');assert.match(d.attention[0].stage,/latere controle/);assert.equal(d.attention[1].review,'Na de voorafgaande vaardigheden');
 p.repairs[0].due=9;assert.equal(D.read('vectoren-trainer',vector(p)).attention[0].review,'Beschikbaar voor herhaling');
});
test('old saves show summaries and recent skills, never a fabricated dated event history',()=>{
 const p=R.Progress.fresh();delete p.activity;p.total=4;p.skills.fraction.seen=3;p.skills.fraction.last=3;p.skills.compare.seen=1;p.skills.compare.last=4;
 const d=D.read('reele-getallen-trainer',real(p));assert.equal(d.activities.length,0);assert.equal(d.recentSkills[0].id,'compare');assert.equal(d.recentSkills[0].lastAt,null);assert(d.historyIncomplete);
 const bad=real(p);bad.state.storage['axioma-real-numbers-v1']='{bad';assert.equal(D.read('reele-getallen-trainer',bad).available,false);assert.equal(D.read('vectoren-trainer',null).available,false);assert.equal(D.read('other-game',null),null);
});
test('unfinished errors appear immediately, but completed or invalid input drafts are not new errors',()=>{
 const p=R.Progress.fresh(),draft={skill:'rootcalc',phase:'feedback',dirty:true,errorCode:'root-real'};
 let d=D.read('reele-getallen-trainer',real(p,draft));assert.equal(d.attention[0].label,'Reële wortelwaarde verkeerd beoordeeld');assert.equal(d.current.status,'Bezig met verbeteren of hulp');
 draft.phase='done';assert.equal(D.read('reele-getallen-trainer',real(p,draft)).attention.length,0);
 draft.phase='feedback';draft.errorCode='input';assert.equal(D.read('reele-getallen-trainer',real(p,draft)).attention.length,0);
});
test('malformed activity is bounded and filtered on restore',()=>{
 for(const [fresh,sanitize] of [[V.TrainerScheduler.freshState,V.TrainerScheduler.sanitize],[R.Progress.fresh,R.Progress.sanitize]]){
  const p=fresh(),skill=Object.keys(p.skills)[0];p.activity=[null,{skill:'not-a-skill',outcome:'independent'},{skill,outcome:'wrong'},{skill,outcome:'supported',at:Infinity,xp:999,code:'x'.repeat(100)}];
  const restored=sanitize(p);assert.equal(restored.activity.length,1);assert.equal(restored.activity[0].at,0);assert.equal(restored.activity[0].xp,18);assert.equal(restored.activity[0].code.length,40);
 }
});
