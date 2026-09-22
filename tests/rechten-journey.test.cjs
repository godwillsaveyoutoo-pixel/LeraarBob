const {test}=require('node:test'),assert=require('node:assert/strict');
const J=require('../games/rechten/trainer/journey-core.js'),W=require('../games/rechten/trainer/wave-core.js');
function fixture(){return {version:704,xp:123,total:80,access:[...W.order],review:[],session:{answered:0},skills:Object.fromEntries(W.order.map(k=>[k,{intro:true,seen:8,strength:.8,recent:[true,true,true,true],lastSeen:0,refreshDue:null}]))}}
test('five skills are grouped without introducing new prerequisites or removing access',()=>{
 const s=fixture(),before=structuredClone(s);assert(J.begin(s,'bridge','discover','run',W.unlock(s),W.ready));
 assert.deepEqual(s.skills,before.skills);assert.equal(s.xp,123);assert.deepEqual(s.access,before.access);
 assert.deepEqual(J.places.flatMap(p=>p.skills),J.skills);
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
