const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../shared/multiplayer/simulation.js'),G=require('../games/algebra-trainer/battle-config.js');
const deck=[{skill:'A1',seed:123,variant:0},{skill:'B1',seed:987,variant:1}];
test('virtual classroom uses real tasks, speed scoring, unanswered learners, reviewable results and final standings',()=>{
 let now=100000;const sim=S.create({game:G,deck,count:4,seconds:30,now:()=>now});
 assert.equal(sim.snapshot().phase,'lobby');assert.equal(sim.snapshot().members.length,4);assert.equal(sim.snapshot().code,'DEMO');
 sim.configure('virtual-0','none','normal');sim.configure('virtual-1','correct','fast');sim.configure('virtual-2','wrong','normal');sim.configure('virtual-3','correct','slow');
 sim.action('start');assert.deepEqual(sim.snapshot().spec,deck[0]);assert.deepEqual(G.generate(sim.snapshot().spec).solution,G.generate(deck[0]).solution);
 now+=5000;assert(sim.advance());assert.equal(sim.snapshot().members[1].points,1210);assert.equal(sim.snapshot().members[0].answered,false);
 now+=25000;sim.advance();let state=sim.snapshot();assert.equal(state.phase,'results');assert.equal(state.members[2].correct,false);assert.equal(state.members[3].points,1060);assert.equal(state.members[0].answered,false);
 sim.action('next');state=sim.snapshot();assert.equal(state.round,1);assert.equal(state.members[1].previous_points,1210);assert.equal(state.members[1].answered,false);
 sim.action('end_round');sim.action('next');assert.equal(sim.snapshot().phase,'finished');assert.equal(sim.snapshot().members[1].points,1210);assert.throws(()=>sim.action('start'));
});
test('teacher self-test validates actual answers, cannot answer twice and restores local rehearsal after reload',()=>{
 let now=100000;const sim=S.create({game:G,deck,count:2,seconds:60,now:()=>now});sim.action('start');sim.tryBoard();const t=G.generate(deck[0]);
 let state=sim.submit({value:t.solution.n+'/'+t.solution.d});assert.equal(state.members[0].correct,true);assert.equal(state.members[0].points,1250);assert.equal(state.trying,false);
 sim.submit({value:'12345'});assert.equal(sim.snapshot().members[0].points,1250);assert.throws(()=>sim.tryBoard());
 const saved=sim.serialize(),again=S.create({game:G,saved,now:()=>now});assert.deepEqual(again.serialize(),saved);now+=61000;again.advance();assert.equal(again.snapshot().phase,'results');
 again.action('next');again.tryBoard();state=again.submit({value:'12345'});assert.equal(state.members[0].correct,false);assert.equal(state.members[0].points,1250);again.action('close');assert.equal(again.snapshot().phase,'closed');
});
test('invalid or mismatched simulations never generate a session',()=>{
 assert.throws(()=>S.create({game:G,deck:[{skill:'invalid',seed:1,variant:0}]}));assert.throws(()=>S.create({game:G,saved:{game:'rechten',simulation:true}}));
 assert.notEqual(S.create({game:G,deck,now:()=>1}).snapshot().id,S.create({game:G,deck,now:()=>1}).snapshot().id,'restarting at the same instant creates a fresh rehearsal');
});
test('Wortelbouw keeps its existing 500 plus 500 scoring rule',()=>{let now=100000;const sim=S.create({game:{...G,id:'wortelbouw'},deck,count:1,seconds:30,now:()=>now});sim.configure('virtual-0','correct','fast');sim.action('start');now+=5000;sim.advance();assert.equal(sim.snapshot().members[0].points,920);});
