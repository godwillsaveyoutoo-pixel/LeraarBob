const {test}=require('node:test'),assert=require('node:assert/strict');
const J=require('../games/rechten/trainer/journey-core.js'),W=require('../games/rechten/trainer/wave-core.js');
function fixture(){return {version:704,xp:123,total:80,access:[...W.order],review:[],session:{answered:0},skills:Object.fromEntries(W.order.map(k=>[k,{intro:true,seen:8,strength:.8,recent:[true,true,true,true],lastSeen:0,refreshDue:null}]))}}
test('all skills are grouped without introducing new prerequisites or removing access',()=>{
 const s=fixture(),before=structuredClone(s);assert(J.begin(s,'bridge','discover','run',W.unlock(s),W.ready));
 assert.deepEqual(s.skills,before.skills);assert.equal(s.xp,123);assert.deepEqual(s.access,before.access);
 assert.deepEqual(J.regions[0].places.flatMap(p=>p.skills),J.skills);assert.deepEqual([...J.allSkills].sort(),[...W.order].sort());assert.equal(new Set(J.allSkills).size,26);assert.equal(J.places.length,13);
 const old=W.migrate(s);assert.deepEqual(old.journey,s.journey);
 const fresh=fixture();fresh.access=['point'];Object.values(fresh.skills).forEach(v=>{v.intro=false;v.seen=0;v.strength=0;v.recent=[]});
 assert(!J.begin(fresh,'bridge','discover','bad',W.unlock(fresh),W.ready));assert(!J.begin(fresh,'bridge','challenge','bad',W.unlock(fresh),W.ready));
 assert(J.begin(fresh,'tower','discover','good',W.unlock(fresh),W.ready));assert.equal(J.choice(fresh,['point']).intro,true);
});
test('global overdue work is guaranteed a slot, even outside the chosen area',()=>{
 const s=fixture();J.begin(s,'bridge','discover','run',W.order,W.ready);
 s.session.answered=1;s.review=[{id:'r',kind:'repair',skill:'equation_from_table',due:60,difficulty:1,misses:2}];s.skills.ab.refreshDue=40;
 assert.deepEqual(J.choice(s,W.order),{skill:'ab',kind:'refresh',reviewId:null,scaffold:false});
 s.skills.ab.refreshDue=100;assert.equal(J.choice(s,W.order).skill,'equation_from_table');assert.equal(J.choice(s,W.order).reviewId,'r');
 s.session.answered=2;assert(['point','point_plot','delta','slope'].includes(J.choice(s,W.order).skill));
 s.session.answered=6;assert.equal(J.choice(s,W.order).skill,'slope_from_two_points','remaining slots stay at the selected stop');
});
test('challenge covers all five objectives, uses a negative fraction and ignores assisted successes',()=>{
 const s=fixture();J.begin(s,'bridge','challenge','exam',W.order,W.ready);
 const actual=[];
 for(const [i,ix] of [0,2,4,7,10].entries()){
  s.session.answered=ix;const c=J.choice(s,W.order);actual.push(c.skill);
  if(c.skill==='slope_from_two_points'){const p=W.generate(c.skill,{...c,seed:25});assert.equal(p.variant,'negative-fraction')}
  const t=J.tag(s,{id:i,skill:c.skill,journeyHelp:i===1},c.objective);
  assert(J.result(s,t,true));assert(!J.result(s,t,true),'same primary attempt processed once');
 }
 assert.deepEqual(actual,J.skills);assert.equal(Object.keys(s.journey.proof).length,4);
 assert.equal(s.xp,123,'the world never awards XP');
 J.finish(s);assert.equal(s.journey.last.passed,false);assert.equal(s.journey.visits.bridge,1);J.finish(s);assert.equal(s.journey.visits.bridge,1);
 s.session.answered=0;assert(J.begin(s,'bridge','challenge','retry',W.order,W.ready));assert.deepEqual(s.journey.active.targets,['point_plot']);
 const t=J.tag(s,{id:'new',skill:'point_plot'},true);J.result(s,t,true);J.finish(s);assert.equal(s.journey.last.passed,true);
});
test('active rounds and missing preparation cannot be bypassed; completion is separate from evidence',()=>{
 const s=fixture();s.session.answered=3;assert(!J.begin(s,'tower','discover','bad',W.order,W.ready));s.session.answered=0;
 s.review=[{kind:'repair',skill:'delta',due:999}];assert(J.missing(s,W.ready).includes('delta'));assert(!J.begin(s,'bridge','challenge','bad',W.order,W.ready));
 assert(J.begin(s,'tower','discover','ok',W.order,W.ready));assert(!J.begin(s,'trail','discover','bad',W.order,W.ready));
 const t=J.tag(s,{id:'wrong',skill:'point'});J.result(s,t,false);J.finish(s);assert.equal(s.journey.visits.tower,1);assert.deepEqual(s.journey.proof,{});
 const old={id:'late',skill:'point',journey:{id:'ok',objective:true}};assert(!J.result(s,old,true));
});
test('recommendations explain the next action and preserve completed stars during review',()=>{
 const s=fixture();J.data(s).visits.bridge=2;s.journey.chapter='points';
 s.review=[{id:'r',kind:'repair',skill:'slope_from_two_points',due:0}];
 let rec=J.recommend(s,W.order,W.ready,W.order);assert.equal(rec.place.id,'bridge');assert.equal(rec.kind,'review');
 const status=J.status(s,J.places.find(p=>p.id==='bridge'),W.order,()=> 'herstel');assert(status.completed);assert(status.review);assert(!status.strong);
 assert(J.begin(s,'tower','discover','active',W.order,W.ready));rec=J.recommend(s,W.order,W.ready,W.order);assert.equal(rec.kind,'resume');assert.equal(rec.place.id,'tower');
 s.journey.active=null;s.review=[];s.skills.equation_from_table.intro=false;
 rec=J.recommend(s,W.order,W.ready,W.order);assert.equal(rec.skill,'equation_from_table');assert.equal(rec.place.region,'equations');
 s.skills.equation_from_table.intro=true;rec=J.recommend(s,W.order,W.ready,W.order);assert.equal(rec.kind,'maintain');
});
test('all thirteen stops start available content, keep earlier reviews and reject unimplemented tests',()=>{
 for(const p of J.places){const s=fixture();assert(J.begin(s,p.id,'discover','round',W.order,W.ready));const c=J.choice(s,W.order);assert(p.skills.includes(c.skill));assert.equal(s.journey.region,p.region);s.session.answered=1;s.review=[{id:'old',skill:'point',due:0,kind:'repair'}];assert.equal(J.choice(s,W.order).reviewId,'old')}
 const s=fixture();assert(!J.begin(s,'formula-context','challenge','invalid',W.order,W.ready));assert(!J.begin(s,'tower','other','invalid',W.order,W.ready));
});
test('existing journey drafts and proof survive additions; mixed rounds do not invent place completion',()=>{
 const s=fixture();s.journey={version:1,selected:'bridge',visits:{tower:2},proof:{point:true},active:{id:'old',place:'bridge',mode:'discover',targets:['point'],results:[],draft:{id:'draft',answer:2}},last:null};
 const before=structuredClone(s.journey);J.data(s);assert.deepEqual(s.journey.active,before.active);assert.deepEqual(s.journey.proof,before.proof);assert.deepEqual(s.journey.visits,before.visits);
 J.finish(s,W.order);assert.deepEqual(s.journey.last.newSkills,[],'old rounds do not invent newly unlocked skills');
 s.session.answered=0;assert(J.begin(s,'trail','camp','mixed',['point'],W.ready));J.result(s,J.tag(s,{id:1,skill:'point'}),true);J.finish(s,['point','point_plot']);assert.equal(s.journey.visits.trail,undefined);assert.deepEqual(s.journey.last.newSkills,['point_plot']);
});
test('an available next skill advances the route while earlier repair remains scheduled',()=>{
 const s=fixture();s.access=['point','point_plot'];
 for(const v of Object.values(s.skills))Object.assign(v,{intro:false,seen:0,strength:0,recent:[]});
 Object.assign(s.skills.point,{intro:true,seen:10,strength:.8,recent:[true,true,true,true]});
 Object.assign(s.skills.point_plot,{intro:true,seen:2,strength:.5,recent:[true,true]});
 s.review=[{id:'old-point',skill:'point',kind:'repair',due:0,stage:0,misses:1}];
 J.data(s).visits.tower=1;const before=structuredClone(s);
 const available=W.unlock(s);assert(!available.includes('delta'),'preparation is not bypassed');
 const rec=J.recommend(s,available,W.ready,W.order);assert.equal(rec.skill,'point_plot');assert.equal(rec.kind,'learn');
 assert(J.begin(s,rec.place.id,'discover','next-round',available,W.ready));
 assert.equal(J.choice(s,available,W.ready).skill,'point_plot','the promised next skill is actually served');
 s.session.answered=1;assert.equal(J.choice(s,available,W.ready).reviewId,'old-point','old repair is included in the new round');
 assert.equal(s.journey.visits.tower,1);assert.equal(s.xp,before.xp);assert.deepEqual(s.review,before.review);
 Object.assign(s.skills.point_plot,{intro:false,seen:0});s.journey.active=null;
 assert.equal(J.recommend(s,available,W.ready,W.order).skill,'point_plot','a new introduction also precedes an old repair recommendation');
});

test('all formula construction is last and earlier learning does not depend on it',()=>{
 assert.equal(J.regions.at(-1).id,'equations');
 for(const k of W.order.filter(k=>k.startsWith('equation_from_')||k==='intercept_from_point'))assert(J.regions.at(-1).places.some(p=>p.skills.includes(k)),k);
 const formulas=W.order.filter(k=>k.startsWith('equation_from_')||k==='intercept_from_point');
 assert(W.order.indexOf('signchart')<Math.min(...formulas.map(k=>W.order.indexOf(k))));
 for(const k of W.order.slice(0,W.order.indexOf('equation_from_ab')))assert(!(W.requirements[k]||[]).some(d=>formulas.includes(d)),k);
 const s=fixture();s.skills.signchart={intro:false,seen:0,strength:0,recent:[]};s.access=[];
 assert(!W.unlock(s).includes('equation_from_ab'));
 s.access=['equation_from_ab'];assert(W.unlock(s).includes('equation_from_ab'),'existing access stays available');
 s.journey={version:1,selected:'formula-data',region:'representations',visits:{'formula-data':3},proof:{},active:{place:'formula-data',draft:{id:'saved'}}};
 J.data(s);assert.equal(s.journey.region,'equations');assert.equal(s.journey.visits['formula-data'],3);assert.equal(s.journey.active.draft.id,'saved');
});

function beginner(){
 const s=fixture();s.access=['point'];
 for(const v of Object.values(s.skills))Object.assign(v,{intro:false,seen:0,strength:0,recent:[]});
 return s;
}
function prepare(s,keys){for(const k of keys)Object.assign(s.skills[k],{intro:true,seen:8,strength:.8,recent:[true,true,true,true]})}

test('chapter 1 to chapter 2 does not bounce back when old and current repairs appear',()=>{
 const s=beginner();J.data(s);prepare(s,J.skills);
 const access=W.unlock(s);let rec=J.recommend(s,access,W.ready,W.order);
 assert.equal(rec.place.region,'properties');assert.equal(s.journey.chapter,'properties');
 assert(J.begin(s,rec.place.id,'discover','chapter-2',access,W.ready));
 Object.assign(s.skills.line_behavior,{intro:true,seen:2,strength:.3,recent:[true,false]});
 s.review=[{id:'old',kind:'repair',skill:'point',due:0},{id:'current',kind:'repair',skill:'line_behavior',due:99}];
 s.session.answered=1;assert.equal(J.choice(s,W.unlock(s),W.ready).reviewId,'old');
 const before=structuredClone({xp:s.xp,skills:s.skills,review:s.review});
 J.finish(s,access);s.session.answered=0;
 rec=J.recommend(s,W.unlock(s),W.ready,W.order);
 assert.equal(rec.place.region,'properties');assert.equal(rec.skill,'line_behavior');assert.equal(rec.kind,'review');
 const loaded=JSON.parse(JSON.stringify(s));
 assert.equal(J.recommend(loaded,W.unlock(loaded),W.ready,W.order).place.region,'properties');
 assert.deepEqual({xp:s.xp,skills:s.skills,review:s.review},before,'navigation does not alter learning evidence');
 // Explicitly revisiting a previous stop still does not erase the chapter bookmark.
 assert(J.begin(s,'tower','discover','revisit',W.unlock(s),W.ready));J.finish(s);
 assert.equal(J.recommend(s,W.unlock(s),W.ready,W.order).place.region,'properties');
});

test('a newly unlocked chapter waits while the current chapter still needs preparation',()=>{
 const s=beginner();J.data(s);prepare(s,J.skills);
 const access=W.unlock(s);assert(access.includes('line_behavior'));
 s.review=[{kind:'repair',skill:'point',due:0}];
 const rec=J.recommend(s,access,W.ready,W.order);
 assert.equal(rec.place.region,'points');assert.equal(s.journey.chapter,'points');
 s.review=[];J.data(s).last={place:'bridge',mode:'discover'};
 const next=J.recommend(s,W.unlock(s),W.ready,W.order);
 assert.equal(next.place.region,'properties');assert(next.transition);assert.match(next.reason,/hoofdstuk 2/);
});

test('every discovery slot stays local except scheduled review and introduced recall',()=>{
 for(const p of J.places){
  const s=fixture();assert(J.begin(s,p.id,'discover','local',W.order,W.ready));
  // Available future introductions must not leak through filler questions.
  const outside=J.allSkills.find(k=>!p.skills.includes(k));s.skills[outside].intro=false;
  for(let i=0;i<12;i++){
   s.session.answered=i;const task=J.choice(s,W.order,W.ready);assert(task,`${p.id} slot ${i}`);
   if(task.kind==='journey-recall')assert(s.skills[task.skill].intro);
   else assert(p.skills.includes(task.skill),`${p.id} leaked ${task.skill} at ${i}`);
  }
 }
});

test('all chapters remain reachable with their actual prerequisites',()=>{
 const s=beginner();J.data(s);const chapters=[];
 for(let i=0;i<40;i++){
  const rec=J.recommend(s,W.unlock(s),W.ready,W.order);
  chapters.push(rec.place.region);assert(rec.skill);assert(s.access.includes(rec.skill));
  if(rec.kind==='maintain')break;
  prepare(s,[rec.skill]);
 }
 assert.deepEqual([...new Set(chapters)],J.regions.map(r=>r.id));
 assert.deepEqual(J.allSkills.filter(k=>!W.ready(s,k)),[],'no dependency dead end inside a chapter');
 assert(chapters.every((id,i)=>!i||J.regions.findIndex(r=>r.id===id)>=J.regions.findIndex(r=>r.id===chapters[i-1])));
});

test('old saves recover the reached chapter without treating a map preview as progress',()=>{
 const s=beginner();s.journey={version:1,selected:'formula-data',region:'equations',visits:{},proof:{}};
 assert.equal(J.data(s).chapter,'points');
 delete s.journey.chapter;prepare(s,['point','line_behavior']);
 s.journey.last={place:'tower',mode:'discover'};s.journey.visits={tower:2};
 assert.equal(J.data(s).chapter,'properties','old review result does not hide actual chapter-2 learning');
 assert.equal(s.journey.selected,'formula-data');assert.deepEqual(s.journey.visits,{tower:2});
});

test('review after the final chapter stays anchored while servicing earlier errors',()=>{
 const s=fixture();J.data(s).chapter='equations';
 s.review=[{id:'earlier',skill:'point',kind:'repair',due:0}];
 const rec=J.recommend(s,W.unlock(s),W.ready,W.order);
 assert.equal(rec.place.region,'equations');
 assert(J.begin(s,rec.place.id,'discover','maintenance',W.unlock(s),W.ready));
 s.session.answered=1;assert.equal(J.choice(s,W.unlock(s),W.ready).reviewId,'earlier');
 assert.equal(s.journey.chapter,'equations');
});
