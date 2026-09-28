'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../games/rechten/rechtenwereld/content/area-maps.js');
const S=require('../games/rechten/rechtenwereld/components/shell-view.js');
const R=require('../games/rechten/rechtenwereld/mission-runtime.js');
const fixtures=require('./helpers/rechten-question-fixtures.cjs').fixtures(),complete=fixtures.filter(r=>r.m.completed);
function finished(areas){const s=R.initial();for(const {m} of complete)if(areas.includes(m.world))s.missions[m.skill]=structuredClone(m);return s;}
test('fresh guests start at world two; prior knowledge never invents earned progress',()=>{
 const s=R.initial(),before=JSON.stringify(s),r=A.recommendation(s),bay=A.statuses(s,'puntenbaai');
 assert.equal(r.id,'hellingrug');assert.equal(r.node.key,'delta');assert.equal(r.resume,false);
 assert(bay.priorKnowledge);assert.equal(bay.completed,0);assert.equal(S.journeyProgress(s).completed,0);
 const world=S.world(s);assert(world.includes('is-prior'));assert(world.includes('Voorkennis · vrij herhalen'));assert(world.includes('Naar Hellingrug'));
 const area=S.area(A.locationState(s,'area',{area:'puntenbaai'}));assert(area.includes('Naar Hellingrug'));assert(!area.includes('skill-check'));
 assert.equal(JSON.stringify(s),before);
});
test('all 21 released levels are freely selectable; all seven future levels are previews, never a next step',()=>{
 const s=R.initial(),legacy={version:704,skills:{},review:[],access:[]},before=JSON.stringify(legacy);let available=0,future=0;
 for(const id of Object.keys(A.areas)){
  const summary=A.statuses(s,id,legacy);assert(!summary.recommended||summary.recommended.playable);
  for(const z of A.get(id).zones){const html=S.area(A.locationState(s,'area',{area:id,zone:z.id}),{legacy});assert(!html.includes('is-locked'));assert(!html.includes('vergrendeld'));
   for(const n of z.nodes){const button=html.match(new RegExp('<button[^>]*data-node="'+n.key+'"[^>]*>'))?.[0];assert(button,n.key);assert(!button.includes('disabled'));if(n.playable){available++;assert(button.includes('data-start='));}else{future++;assert(button.includes('data-screen="stop"'));assert.equal(summary.nodes.find(x=>x.key===n.key).state,'soon');}}
  }
 }
 assert.equal(available,21);assert.equal(future,7);assert.equal(JSON.stringify(legacy),before);
});
test('route advances through released content and ends without requiring optional or future exercises',()=>{
 assert.equal(A.recommendation(finished(['hellingrug'])).id,'grenspas');
 assert.equal(A.recommendation(finished(['hellingrug','grenspas'])).id,'formulewerf');
 assert.equal(A.recommendation(finished(['hellingrug','grenspas','formulewerf'])).node.key,'graph_from_table');
 const s=finished(['hellingrug','grenspas','formulewerf','signaalstad']),r=A.recommendation(s);
 assert.equal(r.node,null);assert.equal(A.statuses(s,'puntenbaai').completed,0);
 const f=A.statuses(s,'formulewerf');assert(f.complete);assert.equal(f.playableCompleted,8);assert.equal(f.recommended,null);assert(f.nodes.slice(8).every(n=>n.state==='soon'));
 const p=S.journeyProgress(s);assert.equal(p.completed,19);assert.equal(p.total,21);assert(S.world(s).includes('Vrij oefenen'));
});
test('a freely chosen later exercise resumes exactly, including a completed level being repeated',()=>{
 let s=R.start(R.initial(),'equation_from_two_points');let r=A.recommendation(s);
 assert.equal(r.id,'formulewerf');assert.equal(r.zone,'omzetten');assert.equal(r.node.key,s.active);assert(r.resume);
 assert.equal(A.statuses(s,'formulewerf').recommended.key,s.active);
 assert.equal(A.statuses(s,'formulewerf').nodes.find(n=>n.key===s.active).state,'started');
 s=finished(['formulewerf']);s.active='equation_from_two_points';
 s.missions[s.active]=structuredClone(fixtures.find(r=>r.m.skill===s.active&&r.m.index===5&&r.m.phase==='derive-formula'&&r.label.endsWith('/selected')).m);
 s=R.advance(R.commit(s));s=R.start(s,'equation_from_two_points',true);
 // Completed history is retained by the runtime when starting a new round.
 r=A.recommendation(s);assert(r.resume);assert.equal(r.node.key,s.active);assert.equal(r.node.state,'completed');
 const html=S.world(s),cta=html.match(/<button[^>]*id="start-recommended"[^>]*>/)[0];
 assert(cta.includes('data-formula-skill="equation_from_two_points"'));assert(!cta.includes('data-screen="area"'));
 assert.equal(S.journeyProgress(s).completed,8);
});
test('completed levels retain their numbers and gain an explicit check and text on map and journal',()=>{
 const s=finished(['puntenbaai']),html=S.area(A.locationState(s,'area',{area:'puntenbaai'}));
 for(const number of [1,2])assert(html.includes('<span class="stop-number">'+number+'</span><span class="skill-check"'));
 assert.equal((html.match(/class="level-state">Afgerond/g)||[]).length,2);
 const book=S.book(s);assert.equal((book.match(/class="journey-check"/g)||[]).length,2);
 const world=S.world(s);assert(world.includes('2 / 2 afgerond'));assert(world.includes('aria-valuenow="2"'));
});
