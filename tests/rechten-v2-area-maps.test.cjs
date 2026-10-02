'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../games/rechten/rechtenwereld/content/area-maps.js'),S=require('../games/rechten/rechtenwereld/components/shell-view.js'),R=require('../games/rechten/rechtenwereld/mission-runtime.js'),W=require('../games/rechten/core/wave-core.js');
const catalog=require('../games/rechten/rechtenwereld/content/skills.json').skills;
const frozen=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(frozen);Object.freeze(v)}return v};
test('all 27 original skills occur once, with precisely two separate sign variants and no merged skills',()=>{
 const nodes=Object.values(A.areas).flatMap(A.all);assert.equal(nodes.length,28);assert.deepEqual([...new Set(nodes.map(n=>n.id))].sort(),catalog.map(s=>s.id).sort());
 assert.deepEqual(nodes.filter(n=>n.id==='sign').map(n=>n.variant),['positive','negative']);assert.deepEqual(nodes.filter(n=>n.playable).map(n=>n.key),['point','point_plot','delta','slope','slope_from_two_points','line_behavior','special_lines','intercept','ab','fx','table','graph_from_table','equation_from_ab','graph_from_equation','equation_from_graph','rewrite_linear_equation','intercept_from_point','equation_from_point_slope','equation_from_two_points','equation_from_table','zeroRead','zero','positive','negative','signchart']);
 assert.deepEqual(Object.values(A.areas).map(a=>A.all(a).length),[2,5,7,9,5]);assert.deepEqual(A.get('formulewerf').zones.map(z=>z.nodes.length),[4,5]);
});
test('all area/zone/stop URLs roundtrip; visiting any placeholder preserves exercise, evidence and settings',()=>{
 const initial=R.edit(R.start(R.initial(),'grenspas'),'root','3');initial.events.push({skill:'zeroRead',correct:false});initial.settings.reducedMotion=true;frozen(initial);
 for(const [id,a] of Object.entries(A.areas))for(const z of a.zones)for(const n of z.nodes){
  const state=A.locationState(initial,'stop',{area:id,zone:z.id,stop:n.key}),restored=A.fromHash(initial,A.hash(state));
  assert.deepEqual(restored,state);assert.deepEqual(state.missions,initial.missions);assert.deepEqual(state.events,initial.events);assert(state.settings.reducedMotion);assert.equal(S.route(state),'stop');
  const returned=A.locationState(state,'area');assert.equal(A.selection(returned).id,id);assert.equal(A.selection(returned).zone.id,z.id);assert.equal(S.route(returned),'area');assert.equal(A.hash(A.locationState(state,'world')),'#wereld');
 }
 assert.equal(A.hash(A.fromHash(initial,'#puntbaai')),'#puntenbaai');assert.equal(A.hash(A.fromHash(initial,'#formulewerf/not-a-zone/halte/not-a-skill')),'#formulewerf/bouwen');for(const hash of ['#unknown','#constructor','#__proto__'])assert.equal(A.hash(A.fromHash(initial,hash)),'#wereld');
});
test('unreleased previews never award completion; historical readiness is read only',()=>{
 const legacy={version:704,skills:{point:{intro:true,seen:5,strength:.8,recent:[true,true,true,true]}},review:[],xp:123,untouched:'preserved'};frozen(legacy);const state=frozen(R.initial()),before=JSON.stringify(legacy);
 const bay=A.statuses(state,'puntenbaai',legacy);assert.equal(bay.nodes[0].state,'completed');assert.equal(bay.nodes[1].state,'current');assert.equal(bay.recommended.id,'point_plot');
 const hill=A.statuses(state,'hellingrug',legacy);assert(hill.nodes.filter(n=>!n.playable).every(n=>n.state==='soon'));assert(hill.nodes.filter(n=>n.playable).every(n=>n.state!=='soon'));
 let preview=A.locationState(state,'stop',{area:'signaalstad',stop:'input_from_output'});assert(S.stop(preview,{legacy}).includes('Komt later'));preview=A.locationState(preview,'area');assert.deepEqual(A.statuses(preview,'signaalstad',legacy),A.statuses(state,'signaalstad',legacy));assert.equal(JSON.stringify(legacy),before);
 const mastered={version:704,skills:Object.fromEntries(catalog.map(n=>[n.id,{intro:true,seen:5,strength:.8,recent:[true,true,true,true]}])),review:[]};
 for(const [id,a] of Object.entries(A.areas))for(const n of A.statuses(state,id,mastered).nodes)assert.equal(n.state==='completed',W.ready(mastered,n.id));
});
test('a partial sign step never completes either sign stop; positive completion cannot complete the negative variant',()=>{
 const state=R.start(R.initial(),'grenspas');state.events.push({skill:'sign',correct:true,variant:0,attemptId:'interval:2',phase:'execute'});assert.equal(A.statuses(state,'grenspas').nodes.find(n=>n.key==='positive').state,'available');
 state.events.push({skill:'sign',correct:true,variant:0,attemptId:'symbol:3',phase:'execute'});const status=A.statuses(state,'grenspas');assert.equal(status.nodes.find(n=>n.key==='positive').state,'completed');assert.equal(status.nodes.find(n=>n.key==='negative').state,'available');
});
test('verified teacher view opens playable worlds without awarding mastery or changing student gates',()=>{
 const state=frozen(R.initial()),before=JSON.stringify(state),teacher={id:'test-teacher',role:'teacher'};
 for(const id of Object.keys(A.areas)){
  const summary=A.statuses(state,id,null,teacher);assert(summary.unlocked);assert.equal(summary.playableCompleted,0);
  assert(summary.nodes.filter(n=>n.playable).every(n=>n.state!=='locked'));assert(summary.nodes.filter(n=>!n.playable).every(n=>n.state==='soon'));
 }
 assert(!A.unlocked(state,'formulewerf',null,{role:'student'}));assert(!A.unlocked(state,'formulewerf'));
 assert.equal(JSON.stringify(state),before);
 const map=S.world(state,{account:teacher});assert(!map.includes('Vergrendeld · eerst'));
});
