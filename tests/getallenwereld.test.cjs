'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),L=require('../games/getallenwereld/lessons.js'),C=require('../games/bewerkingen-trainer/core.js');
test('15 lesson routes make reproducible, exact exercises and accept every canonical stage',()=>{
 assert.equal(L.STOPS.length,15);assert.deepEqual(L.THEMES.map(t=>t.stops.length),[8,7]);
 for(const stop of L.STOPS)for(let seed=1;seed<=30;seed++)for(let index=0;index<6;index++){
  const task=L.make(stop.id,seed,index,2);assert.deepEqual(task,L.make(stop.id,seed,index,2));assert(task.choices.some(c=>c.id===task.correct));
  for(let stage=0;stage<task.stages.length;stage++){
   const values=task.stages[stage].slots.map(s=>String(s.answer));assert(L.checkStage(task,stage,values).ok,stop.id+' '+task.expression+' stage '+stage);
   assert(!L.checkStage(task,stage,values.map(()=>'' )).ok);assert(!L.checkStage(task,stage,values.map(()=> '9999999')).ok);
  }
  assert.equal(C.signature(C.parse(task.expression).value),C.signature(C.parse(task.answer).value),task.expression);
 }
});
test('Getallenwereld has its own catalog identity, save key and real completed count without converted XP',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync('shared/axioma-game-adapters.js','utf8'),context);vm.runInNewContext(fs.readFileSync('js/catalog-progress.js','utf8'),context);
 const game=JSON.parse(fs.readFileSync('games.json','utf8')).find(g=>g.id==='getallenwereld');assert(game.featured);assert.equal(game.progressTotal,15);assert.deepEqual(Array.from(context.window.AxiomaGameAdapters.getallenwereld.keys),['leraarbob.getallenwereld.v1']);
 const entries=Object.fromEntries(L.STOPS.map((s,i)=>[s.id,{done:i<2?['1:0','1:1','1:2','1:3','1:4','1:5']:[],independent:i===0?['1:0','1:1','1:2','1:3','1:4','1:5']:[]} ]));
 const saved={state:{storage:{'leraarbob.getallenwereld.v1':JSON.stringify({version:1,entries,mission:null}),'leraarbob.bewerkingen.v1':JSON.stringify({solved:['power-product']})}}};
 const summary=context.window.LeraarBobCatalogProgress.summarize(game,saved);assert.equal(summary.completed,2);assert.equal(summary.max,15);assert.match(summary.detail,/1 zelfstandig/);assert.equal(context.window.LeraarBobCatalogProgress.earnedXP(game,saved),null);
 const html=fs.readFileSync('games/getallenwereld/index.html','utf8');assert.match(html,/data-game-id="getallenwereld"/);assert.doesNotMatch(html,/AXIOMA_STANDALONE|data-game-id="bewerkingen-trainer"/);const registry=require('../shared/game-registry.js')(JSON.parse(fs.readFileSync('games.json','utf8')),{baseURL:'https://example.test/LeraarBob/'}),battle=registry.modes('getallenwereld').find(m=>m.id==='classroom');assert.equal(battle.isReference,false);assert.equal(battle.providerGameId,'getallenwereld');assert.equal(battle.providerId,'bewerkingen');assert.equal(new URL(registry.destination('getallenwereld','classroom',{hub:true})).searchParams.get('game'),'getallenwereld');assert.equal(registry.game('bewerkingen-trainer').parentId,'getallenwereld');
 const app=fs.readFileSync('games/getallenwereld/app.js','utf8');assert.doesNotMatch(app,/legacyMap|solved\.add|leraarbob\.bewerkingen\.v1/);
});
