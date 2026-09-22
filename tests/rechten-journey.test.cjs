const {test}=require('node:test'),assert=require('node:assert/strict');
const J=require('../games/rechten/trainer/journey-core.js'),W=require('../games/rechten/trainer/wave-core.js');
function fixture(){return {version:704,xp:123,total:80,access:[...W.order],review:[],session:{answered:0},skills:Object.fromEntries(W.order.map(k=>[k,{intro:true,seen:8,strength:.8,recent:[true,true,true,true],lastSeen:0,refreshDue:null}]))}}
test('all skills are grouped without introducing new prerequisites or removing access',()=>{
 const s=fixture(),before=structuredClone(s);assert(J.begin(s,'bridge','discover','run',W.unlock(s),W.ready));
 assert.deepEqual(s.skills,before.skills);assert.equal(s.xp,123);assert.deepEqual(s.access,before.access);
 assert.deepEqual(J.regions[0].places.flatMap(p=>p.skills),J.skills);assert.deepEqual([...J.allSkills].sort(),[...W.order].sort());assert.equal(new Set(J.allSkills).size,27);assert.equal(J.places.length,14);
 const old=W.migrate(s);assert.deepEqual(old.journey,s.journey);
 const fresh=fixture();fresh.access=['point'];Object.values(fresh.skills).forEach(v=>{v.intro=false;v.seen=0;v.strength=0;v.recent=[]});
 assert(!J.begin(fresh,'bridge','discover','bad',W.unlock(fresh),W.ready));assert(!J.begin(fresh,'bridge','challenge','bad',W.unlock(fresh),W.ready));
 assert(J.begin(fresh,'tower','discover','good',W.unlock(fresh),W.ready));assert.equal(J.choice(fresh,['point']).intro,true);
});
test('global overdue work is guaranteed a slot, even outside the chosen area',()=>{
 const s=fixture();J.begin(s,'bridge','discover','run',W.order,W.ready);
 s.session.answered=1;s.review=[{id:'r',kind:'repair',skill:'equation_from_context',due:60,difficulty:1,misses:2}];s.skills.ab.refreshDue=40;
 assert.deepEqual(J.choice(s,W.order),{skill:'ab',kind:'refresh',reviewId:null,scaffold:false});
 s.skills.ab.refreshDue=100;assert.equal(J.choice(s,W.order).skill,'equation_from_context');assert.equal(J.choice(s,W.order).reviewId,'r');
 s.session.answered=2;assert(['point','point_plot','delta','slope'].includes(J.choice(s,W.order).skill));
 s.session.answered=6;assert.equal(J.choice(s,W.order),null,'ordinary global planner still gets slots');
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
 const s=fixture();J.data(s).visits.bridge=2;
 s.review=[{id:'r',kind:'repair',skill:'slope_from_two_points',due:0}];
 let rec=J.recommend(s,W.order,W.ready,W.order);assert.equal(rec.place.id,'bridge');assert.equal(rec.kind,'review');
 const status=J.status(s,J.places.find(p=>p.id==='bridge'),W.order,()=> 'herstel');assert(status.completed);assert(status.review);assert(!status.strong);
 assert(J.begin(s,'tower','discover','active',W.order,W.ready));rec=J.recommend(s,W.order,W.ready,W.order);assert.equal(rec.kind,'resume');assert.equal(rec.place.id,'tower');
 s.journey.active=null;s.review=[];s.skills.equation_from_context.intro=false;
 rec=J.recommend(s,W.order,W.ready,W.order);assert.equal(rec.skill,'equation_from_context');assert.equal(rec.place.region,'representations');
 s.skills.equation_from_context.intro=true;rec=J.recommend(s,W.order,W.ready,W.order);assert.equal(rec.kind,'maintain');
});
test('all fourteen stops start available content, keep earlier reviews and reject unimplemented tests',()=>{
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
