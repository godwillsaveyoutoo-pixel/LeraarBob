'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../games/rechten/rechtenwereld/content/area-maps.js');
const S=require('../games/rechten/rechtenwereld/components/shell-view.js');
const R=require('../games/rechten/rechtenwereld/mission-runtime.js');
const fixtures=require('./helpers/rechten-question-fixtures.cjs').fixtures(),complete=fixtures.filter(r=>r.m.completed);
function finished(areas){const s=R.initial();for(const {m} of complete)if(areas.includes(m.world))s.missions[m.skill]=structuredClone(m);return s;}

test('fresh learners may skip optional Puntenbaai, start in Hellingrug, and see later worlds locked',()=>{
 const s=R.initial(),before=JSON.stringify(s),r=A.recommendation(s),bay=A.statuses(s,'puntenbaai'),hill=A.statuses(s,'hellingrug');
 assert.equal(r.id,'hellingrug');assert.equal(r.node.key,'delta');assert.equal(r.resume,false);
 assert(bay.priorKnowledge);assert(bay.unlocked);assert(hill.unlocked);assert.equal(bay.completed,0);assert.equal(S.journeyProgress(s).completed,0);
 for(const id of ['grenspas','formulewerf','signaalstad'])assert.equal(A.statuses(s,id).unlocked,false,id);
 const world=S.world(s);assert(world.includes('place-puntenbaai is-prior'));assert(world.includes('place-hellingrug is-current'));
 assert(world.includes('place-grenspas is-locked'));assert(world.includes('eerst Hellingrug afronden'));
 assert(world.includes('place-formulewerf is-locked'));assert(world.includes('eerst Grenspas afronden'));
 assert(world.includes('place-signaalstad is-locked'));assert(world.includes('eerst Formulewerf afronden'));
 const area=S.area(A.locationState(s,'area',{area:'puntenbaai'}));assert(area.includes('Naar Hellingrug'));assert(!area.includes('skill-check'));
 assert.equal(JSON.stringify(s),before);
});

test('worlds unlock in sequence while every released level inside an unlocked world stays freely selectable',()=>{
 const legacy={version:704,skills:{},review:[],access:[]},before=JSON.stringify(legacy);
 let s=R.initial();
 let hill=A.statuses(s,'hellingrug',legacy),grens=A.statuses(s,'grenspas',legacy);
 assert(hill.nodes.filter(n=>n.playable).every(n=>n.state!=='locked'));
 assert(grens.nodes.filter(n=>n.playable).every(n=>n.state==='locked'));
 let html=S.area(A.locationState(s,'area',{area:'grenspas'}),{legacy});
 assert.equal((html.match(/data-state="locked"/g)||[]).length,5);assert(!html.includes('data-start="grenspas"'));assert(html.includes('Eerst Hellingrug afronden'));

 s=finished(['hellingrug']);grens=A.statuses(s,'grenspas',legacy);assert(grens.unlocked);assert.equal(A.statuses(s,'formulewerf',legacy).unlocked,false);
 html=S.area(A.locationState(s,'area',{area:'grenspas'}),{legacy});assert((html.match(/data-start="grenspas"/g)||[]).length>=5);assert(!html.includes('data-state="locked"'));

 s=finished(['hellingrug','grenspas']);const formula=A.statuses(s,'formulewerf',legacy);assert(formula.unlocked);assert.equal(A.statuses(s,'signaalstad',legacy).unlocked,false);
 html=S.area(A.locationState(s,'area',{area:'formulewerf',zone:'bouwen'}),{legacy});assert((html.match(/data-start="formulewerf"/g)||[]).length>=4);
 html=S.area(A.locationState(s,'area',{area:'formulewerf',zone:'omzetten'}),{legacy});assert((html.match(/data-start="formulewerf"/g)||[]).length>=4);assert(html.includes('data-state="soon"'));

 s=finished(['hellingrug','grenspas','formulewerf']);const signal=A.statuses(s,'signaalstad',legacy);assert(signal.unlocked);assert.equal(signal.nodes.filter(n=>n.playable).length,1);assert.equal(signal.nodes.find(n=>n.playable).state,'current');assert(signal.nodes.filter(n=>!n.playable).every(n=>n.state==='soon'));
 assert.equal(JSON.stringify(legacy),before);
});

test('route advances through required worlds and ends without requiring optional prior knowledge or future exercises',()=>{
 assert.equal(A.recommendation(finished(['hellingrug'])).id,'grenspas');
 assert.equal(A.recommendation(finished(['hellingrug','grenspas'])).id,'formulewerf');
 assert.equal(A.recommendation(finished(['hellingrug','grenspas','formulewerf'])).node.key,'graph_from_table');
 const s=finished(['hellingrug','grenspas','formulewerf','signaalstad']),r=A.recommendation(s);
 assert.equal(r.node,null);assert.equal(A.statuses(s,'puntenbaai').completed,0);
 const f=A.statuses(s,'formulewerf');assert(f.complete);assert.equal(f.playableCompleted,8);assert.equal(f.recommended,null);assert(f.nodes.slice(8).every(n=>n.state==='soon'));
 const p=S.journeyProgress(s);assert.equal(p.completed,19);assert.equal(p.total,21);assert(S.world(s).includes('Vrij oefenen'));
});

test('existing later-world work is grandfathered and resumes exactly instead of being stranded',()=>{
 let s=R.start(R.initial(),'equation_from_two_points');let r=A.recommendation(s);
 assert(A.unlocked(s,'formulewerf'));assert.equal(r.id,'formulewerf');assert.equal(r.zone,'omzetten');assert.equal(r.node.key,s.active);assert(r.resume);
 assert.equal(A.statuses(s,'formulewerf').recommended.key,s.active);
 assert.equal(A.statuses(s,'formulewerf').nodes.find(n=>n.key===s.active).state,'started');
 s=finished(['formulewerf']);s.active='equation_from_two_points';
 s.missions[s.active]=structuredClone(fixtures.find(r=>r.m.skill===s.active&&r.m.index===5&&r.m.phase==='derive-formula'&&r.label.endsWith('/selected')).m);
 s=R.advance(R.commit(s));s=R.start(s,'equation_from_two_points',true);
 r=A.recommendation(s);assert(r.resume);assert.equal(r.node.key,s.active);assert.equal(r.node.state,'completed');
 const html=S.world(s),cta=html.match(/<button[^>]*id="start-recommended"[^>]*>/)[0];
 assert(cta.includes('data-formula-skill="equation_from_two_points"'));assert(!cta.includes('data-screen="area"'));
 assert.equal(S.journeyProgress(s).completed,8);
});

test('completed levels retain their numbers and prior knowledge only gains a check after it is actually completed',()=>{
 const fresh=S.world(R.initial());assert(!fresh.match(/place-puntenbaai[\s\S]*?island-check/));
 const s=finished(['puntenbaai']),html=S.area(A.locationState(s,'area',{area:'puntenbaai'}));
 for(const number of [1,2])assert(html.includes('<span class="stop-number">'+number+'</span><span class="skill-check"'));
 assert.equal((html.match(/class="level-state">Afgerond/g)||[]).length,2);
 const book=S.book(s);assert.equal((book.match(/class="journey-check"/g)||[]).length,2);
 const world=S.world(s);assert(world.includes('Voorkennis · 2 / 2 afgerond'));assert(world.includes('aria-valuenow="2"'));
});
