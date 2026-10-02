'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const A=require('../games/rechten/rechtenwereld/content/area-maps.js'),S=require('../games/rechten/rechtenwereld/components/shell-view.js'),R=require('../games/rechten/rechtenwereld/mission-runtime.js');
const skills=require('../games/rechten/rechtenwereld/content/skills.json').skills;
const order=['equation_from_ab','graph_from_equation','equation_from_graph','rewrite_linear_equation','intercept_from_point','equation_from_point_slope','equation_from_two_points','equation_from_table','equation_from_context'];
const legacy=(available=[],complete=[])=>({version:704,access:available,skills:Object.fromEntries(complete.map(id=>[id,{intro:true,seen:5,strength:.8,recent:[true,true,true,true]}])),review:[],xp:456});
test('Formulewerf has the exact A 1–4 / B 5–9 sequence and context alone is the culmination',()=>{
 const a=A.get('formulewerf');assert.deepEqual(a.zones.map(z=>z.name),['Voorschrift en grafiek','Zelf een voorschrift bepalen']);assert.deepEqual(a.zones.map(z=>z.id),['bouwen','omzetten']);assert.deepEqual(a.zones.map(z=>z.nodes.length),[4,5]);
 assert.deepEqual(A.all(a).map(n=>n.id),order);assert.deepEqual(A.all(a).map(n=>n.number),[1,2,3,4,5,6,7,8,9]);assert.deepEqual(A.all(a).filter(n=>n.culmination).map(n=>n.id),['equation_from_context']);
 const n=A.all(a)[3];assert.equal(n.name,'Schrijf de vergelijking in de vorm y = ax + b');assert.equal(n.label,'Vergelijking<br>herschrijven');
 assert.deepEqual([...new Set(Object.values(A.areas).flatMap(A.all).map(n=>n.id))].sort(),skills.map(n=>n.id).sort());
});
test('the graph entry contract explicitly forbids hidden advanced requirements; the basic stop is playable',()=>{
 const n=A.all(A.get('formulewerf'))[2];assert.deepEqual(n.entryPolicy,{difficultyLayers:[0,1],readableSlope:true,visibleIntercept:true,requiresInterceptFromArbitraryPoint:false,requiresExtendedTwoPointCalculation:false});assert(n.playable);assert(Object.isFrozen(n.entryPolicy));
});
test('Formulewerf stays locked until Grenspas is complete, then recommendations follow route order',()=>{
 const state=R.initial(),fresh=A.statuses(state,'formulewerf');assert.equal(fresh.unlocked,false);assert.equal(fresh.recommended,null);assert(fresh.nodes.slice(0,8).every(n=>n.state==='locked'));assert.equal(fresh.nodes.at(-1).state,'soon');
 for(let index=0;index<8;index++){
  const raw=legacy(order.slice(0,8),order.slice(0,index)),before=JSON.stringify(raw);const result=A.statuses(state,'formulewerf',raw);assert(result.unlocked);assert.equal(result.recommended.id,order[index]);assert.equal(result.nodes.find(n=>n.recommended).state,'current');assert.equal(JSON.stringify(raw),before);
 }
 const open=A.statuses(state,'formulewerf',legacy(order.slice(0,8)));assert.equal(open.recommended.id,order[0]);assert(open.nodes.slice(0,8).every(n=>n.playable&&n.state!=='locked'));assert(open.nodes.slice(8).every(n=>n.state==='soon'));
 const html=S.area(A.locationState(state,'area',{area:'formulewerf'}),{legacy:legacy(order.slice(0,8))});assert(html.includes('data-formula-skill="equation_from_ab"'));assert(html.includes('aria-current="step"'));
 // Finishing released content never recommends an unreleased or already completed level.
 const done=A.statuses(state,'formulewerf',legacy(order,order.slice(0,8)));assert.equal(done.recommended,null);assert(done.complete);assert.equal(done.nodes.at(-1).state,'soon');
 const raw=legacy([order[0],order[6]]);assert.equal(A.statuses(state,'formulewerf',raw).recommended.id,order[0]);
});
test('the zone footer respects the world lock and points across A/B once Formulewerf is open',()=>{
 const b=A.locationState(R.initial(),'area',{area:'formulewerf',zone:'omzetten'});let html=S.area(b,{});assert(html.includes('Eerst Grenspas afronden'));assert(!html.includes('data-formula-skill='));
 const opened=legacy(order.slice(0,8));html=S.area(b,{legacy:opened});assert(!html.includes('aria-current="step"'));assert(html.includes('Naar werkplaats A'));
 const a=A.locationState(R.initial(),'area',{area:'formulewerf',zone:'bouwen'}),raw=legacy(order.slice(0,8),order.slice(0,4));html=S.area(a,{legacy:raw});assert(!html.includes('aria-current="step"'));assert(html.includes('Naar werkplaats B'));assert(S.area(b,{legacy:raw}).includes('Oefen level 5'));
});
test('moved stops retain their ID, old bookmarks and saved selections resolve to the new zone without changing evidence',()=>{
 const oldZones={equation_from_ab:'bouwen',intercept_from_point:'bouwen',equation_from_point_slope:'bouwen',equation_from_two_points:'bouwen',graph_from_equation:'omzetten',equation_from_graph:'omzetten',equation_from_table:'omzetten',equation_from_context:'omzetten',rewrite_linear_equation:'omzetten'};
 const base=R.edit(R.start(R.initial(),'grenspas'),'root','3');base.events.push({skill:'sign',correct:false});
 for(const [id,zone] of Object.entries(oldZones)){
  const expected=order.indexOf(id)<4?'bouwen':'omzetten';const next=A.fromHash(base,`#formulewerf/${zone}/halte/${id}`);assert.equal(A.selection(next).zone.id,expected);assert.equal(A.selection(next).stop.id,id);assert.equal(A.hash(next),`#formulewerf/${expected}/halte/${id}`);assert.deepEqual(next.events,base.events);assert.deepEqual(next.missions,base.missions);
  const saved=structuredClone(base);saved.screen='world';saved.settings.shell={area:'formulewerf',zone,stop:id};const snapshot=JSON.stringify(saved);assert.equal(A.selection(saved).zone.id,expected);assert.equal(A.selection(saved).stop.id,id);assert.equal(JSON.stringify(saved),snapshot);
 }
});
test('map preserves destinations, accessible locks, home navigation and actual progress',()=>{
 for(const id of Object.keys(A.areas)){
  const html=S.area(A.locationState(R.initial(),'area',{area:id}),{}),summary=A.statuses(R.initial(),id);
  for(const n of A.get(id).zones[0].nodes)assert(html.includes(`data-node="${n.key}"`));
  if(summary.unlocked)assert(!html.includes('data-state="locked"'));
  else {assert(html.includes('data-state="locked"'));assert(!html.includes(`data-start="${id}"`));assert(html.includes('disabled aria-disabled="true"'));}
 }
 const header=S.header(R.initial());assert(header.includes('href="../../../" class="atlas-brand"'));assert(header.includes('data-fullscreen'));assert(!header.includes('data-area="grenspas"'));
 for(const target of ['learn.html','online.html','battle.html','classroom.html'])assert(header.includes(`href="${target}"`));
 assert.match(header,/data-platform-progress="xp" data-value="0"/);
 const world=S.world(R.initial(),{});
 for(const place of S.places)assert(world.includes(`data-world-node="${place.id}"`));
 assert.equal((world.match(/data-world-node=/g)||[]).length,5);
 assert.match(world,/id="start-recommended"[^>]*data-zone="route">/);assert(world.includes('data-screen="book"'));assert(world.includes('aria-valuemax="23"'));
});
