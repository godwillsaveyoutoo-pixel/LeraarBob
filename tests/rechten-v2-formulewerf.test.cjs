'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const A=require('../games/rechten/trainer-v2/content/area-maps.js'),S=require('../games/rechten/trainer-v2/components/shell-view.js'),R=require('../games/rechten/trainer-v2/mission-runtime.js');
const skills=require('../games/rechten/trainer-v2/content/skills.json').skills;
const order=['equation_from_ab','graph_from_equation','equation_from_graph','rewrite_linear_equation','intercept_from_point','equation_from_point_slope','equation_from_two_points','equation_from_table','equation_from_context'];
const legacy=(available=[],complete=[])=>({version:704,access:available,skills:Object.fromEntries(complete.map(id=>[id,{intro:true,seen:5,strength:.8,recent:[true,true,true,true]}])),review:[],xp:456});
test('Formulewerf has the exact A 1–4 / B 5–9 sequence and context alone is the culmination',()=>{
 const a=A.get('formulewerf');assert.deepEqual(a.zones.map(z=>z.name),['Voorschrift en grafiek','Zelf een voorschrift bepalen']);assert.deepEqual(a.zones.map(z=>z.id),['bouwen','omzetten']);assert.deepEqual(a.zones.map(z=>z.nodes.length),[4,5]);
 assert.deepEqual(A.all(a).map(n=>n.id),order);assert.deepEqual(A.all(a).map(n=>n.number),[1,2,3,4,5,6,7,8,9]);assert.deepEqual(A.all(a).filter(n=>n.culmination).map(n=>n.id),['equation_from_context']);
 const n=A.all(a)[3];assert.equal(n.name,'Schrijf de vergelijking in de vorm y = ax + b');assert(n.label.includes('y = ax + b'));
 assert.deepEqual([...new Set(Object.values(A.areas).flatMap(A.all).map(n=>n.id))].sort(),skills.map(n=>n.id).sort());
});
test('the graph entry contract explicitly forbids hidden advanced requirements; the basic stop is playable',()=>{
 const n=A.all(A.get('formulewerf'))[2];assert.deepEqual(n.entryPolicy,{difficultyLayers:[0,1],readableSlope:true,visibleIntercept:true,requiresInterceptFromArbitraryPoint:false,requiresExtendedTwoPointCalculation:false});assert(n.playable);assert(Object.isFrozen(n.entryPolicy));
});
test('Formulewerf recommendations are available and follow route order, never a locked fallback',()=>{
 const state=R.initial();assert.equal(A.statuses(state,'formulewerf').recommended.id,order[0]);
 for(let index=0;index<8;index++){
  const raw=legacy(order.slice(0,8),order.slice(0,index)),before=JSON.stringify(raw);const result=A.statuses(state,'formulewerf',raw);assert.equal(result.recommended.id,order[index]);assert.equal(result.nodes.find(n=>n.recommended).state,'current');assert.equal(JSON.stringify(raw),before);
 }
 const none=A.statuses(state,'formulewerf',legacy());assert.equal(none.recommended.id,order[0]);assert(none.nodes.slice(0,7).every(n=>n.playable));assert(none.nodes.slice(7).every(n=>n.state==='locked'));
 const html=S.area(A.locationState(state,'area',{area:'formulewerf'}),{legacy:legacy()});assert(html.includes('data-formula-skill="equation_from_ab"'));assert(html.includes('aria-current="step"'));
 // Context remains paused in the original catalog. Repetition uses an available completed stop.
 const done=A.statuses(state,'formulewerf',legacy(order,order.slice(0,8)));assert.equal(done.recommended.id,order[0]);assert.equal(done.nodes.at(-1).state,'locked');
 const raw=legacy([order[0],order[6]]);assert.equal(A.statuses(state,'formulewerf',raw).recommended.id,order[0]);
});
test('the zone footer points to the available next stop across A/B and never highlights a locked local stop',()=>{
 const b=A.locationState(R.initial(),'area',{area:'formulewerf',zone:'omzetten'});let html=S.area(b,{});assert(!html.includes('aria-current="step"'));assert(html.includes('Naar werkplaats A'));
 const a=A.locationState(R.initial(),'area',{area:'formulewerf',zone:'bouwen'}),raw=legacy(order.slice(0,8),order.slice(0,4));html=S.area(a,{legacy:raw});assert(!html.includes('aria-current="step"'));assert(html.includes('Naar werkplaats B'));assert(S.area(b,{legacy:raw}).includes('Oefen halte 5'));
});
test('moved stops retain their ID, old bookmarks and saved selections resolve to the new zone without changing evidence',()=>{
 const oldZones={equation_from_ab:'bouwen',intercept_from_point:'bouwen',equation_from_point_slope:'bouwen',equation_from_two_points:'bouwen',graph_from_equation:'omzetten',equation_from_graph:'omzetten',equation_from_table:'omzetten',equation_from_context:'omzetten',rewrite_linear_equation:'omzetten'};
 const base=R.edit(R.start(R.initial(),'grenspas'),'root','3');base.events.push({skill:'sign',correct:false});
 for(const [id,zone] of Object.entries(oldZones)){
  const expected=order.indexOf(id)<4?'bouwen':'omzetten';const next=A.fromHash(base,`#formulewerf/${zone}/halte/${id}`);assert.equal(A.selection(next).zone.id,expected);assert.equal(A.selection(next).stop.id,id);assert.equal(A.hash(next),`#formulewerf/${expected}/halte/${id}`);assert.deepEqual(next.events,base.events);assert.deepEqual(next.missions,base.missions);
  const saved=structuredClone(base);saved.screen='world';saved.settings.shell={area:'formulewerf',zone,stop:id};const snapshot=JSON.stringify(saved);assert.equal(A.selection(saved).zone.id,expected);assert.equal(A.selection(saved).stop.id,id);assert.equal(JSON.stringify(saved),snapshot);
 }
});
test('other routes, initial world/header, original validators, skills, scheduler, storage and art are preserved',()=>{
 const manifest=require('../docs/rechten-v2/formulewerf/PRESERVED.json'),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
 // Puntenbaai now adds exercises; the original validators/storage remain byte-identical.
 const extended=new Set(['games/rechten/trainer-v2/mission-runtime.js','games/rechten/trainer-v2/app-shell.js','games/rechten/trainer-v2/index.html','games/rechten/trainer-v2/README.md']);
 for(const [file,expected] of Object.entries(manifest.files).filter(([file])=>!extended.has(file)))assert.equal(hash(fs.readFileSync(file)),expected,file);
 const other=JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(A.areas).filter(([id])=>id!=='formulewerf'))));for(const id of ['puntenbaai','hellingrug'])for(const n of other[id].zones[0].nodes)delete n.playable;for(const n of other.grenspas.zones[0].nodes)if(n.key!=='positive')delete n.playable;assert.equal(hash(JSON.stringify(other)),manifest.otherAreas);
 for(const [id,expected] of Object.entries(manifest.views).filter(([id])=>!['puntenbaai','hellingrug','grenspas'].includes(id)))assert.equal(hash(S.area(A.locationState(R.initial(),'area',{area:id}),{})),expected,id);
 assert.equal(hash(S.header(R.initial())),manifest.header);assert.equal(hash(S.world(R.initial(),{})),manifest.world);
});
