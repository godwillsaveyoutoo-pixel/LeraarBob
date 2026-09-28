const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('../games/wortelbouw/geometry.js'),P=require('../games/wortelbouw/progress.js'),routes=require('./fixtures/wortelbouw-routes.cjs');
function build(g,r){g.commit({type:'start',k:r.start});for(const [mode,k,edgeIndex,flip]of r.steps)for(const a of [{type:'triangle',owner:g.state.active,mode,k,edgeIndex,flip},{type:'helper'},{type:'result'},{type:'reveal'}])g.commit(a)}
test('completed puzzles, best steps and construction survive replay, undo and reset',()=>{
 const p=P.fresh(),g=new G.Game();build(g,routes[0]);P.record(p,g,'2026-09-21');assert.deepEqual(P.completed(p),['length-2']);
 const saved=P.read(JSON.parse(JSON.stringify(p))).progress,restored=P.replay(saved.current,saved.levels[saved.current].actions);
 assert.deepEqual(restored.state,g.state);restored.undo();assert.equal(restored.state.phase,'result');P.record(saved,restored);assert.equal(P.completed(saved).length,1);
 restored.reset();P.record(saved,restored);assert.equal(P.completed(saved).length,1);assert.equal(saved.levels['length-2'].bestSteps,1);
});
test('partially built squares and both sqrt6 routes survive reload and stable IDs',()=>{
 const index=G.levels.findIndex(l=>l.compareRoutes),g=new G.Game(index),p=P.fresh();build(g,routes[index]);P.record(p,g);
 assert.equal(P.completed(p).length,0);assert.equal(p.levels[P.ids[index]].routes.length,1);
 let restored=P.replay(P.ids[index],p.levels[P.ids[index]].actions);assert.equal(restored.state.phase,'routeDone');restored.commit({type:'nextRoute'});
 const other=routes[index].other;restored.commit({type:'start',k:other.start});restored.commit({type:'triangle',owner:'s0',mode:'sum',k:1,edgeIndex:0,flip:false});P.record(p,restored);
 restored=P.replay(P.ids[index],p.levels[P.ids[index]].actions);assert.equal(restored.state.phase,'helper');assert.equal(restored.state.solutions.length,1);restored.undo();assert.equal(restored.state.phase,'choose');
 const complete=new G.Game(index);build(complete,routes[index]);complete.commit({type:'nextRoute'});build(complete,other);P.record(p,complete);assert.equal(p.levels[P.ids[index]].bestSteps,4);assert.equal(P.completed(p).length,1);
});
test('invalid drafts never become executable state; known completed summaries are retained',()=>{
 const bad={version:1,current:'length-2',levels:{'length-2':{completed:true,actions:[{type:'start',k:99}]},'made-up':{completed:true}}};
 const restored=P.read(bad);assert(restored.recovered);assert.equal(restored.progress.levels['length-2'].actions,undefined);assert.deepEqual(P.completed(restored.progress),['length-2']);
 assert.deepEqual(P.completed(P.read(null,['length-5','unknown']).progress),['length-5']);
 const p=P.fresh();for(const id of P.ids)p.levels[id]={completed:true};assert.equal(P.completed(p).length,14);
});

test('found methods remain counted across restarting a puzzle',()=>{
 const index=G.levels.findIndex(l=>l.compareRoutes),p=P.fresh(),g=new G.Game(index);build(g,routes[index]);P.record(p,g);g.reset();build(g,routes[index].other);P.record(p,g);
 assert.equal(p.levels[P.ids[index]].routes.length,2);assert.equal(P.completed(p).length,1);assert.equal(p.levels[P.ids[index]].bestSteps,4);
 assert.equal(P.completed(P.read(JSON.parse(JSON.stringify(p))).progress).length,1);
});
