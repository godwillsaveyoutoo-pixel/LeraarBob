const test=require('node:test'),assert=require('node:assert/strict');
const Game=require('../games/algebra-trainer/battle-config.js'),Journey=require('../games/algebra-trainer/journey-core.js'),Policy=require('../shared/multiplayer/algebra-duo-policy.cjs');
const answer=t=>({value:t.solution.n+'/'+t.solution.d});
test('All seven equation routes and their mix use the original exact generator and grading, without archived systems',()=>{
 assert.equal(Policy.pool(null,null,'mixed').length,17);assert.deepEqual(Policy.pool(null,null,'systems'),[]);
 for(const stop of Journey.stops)for(const skill of Policy.pool(null,null,stop.id))for(let seed=0;seed<24;seed++){const spec={skill,seed,variant:seed%4};assert(Policy.grade(spec,answer(Game.generate(spec))));assert.equal(Policy.grade(spec,{correct:true}),false);}
 assert.equal(Policy.grade({skill:'S1',seed:0,variant:0},{x:'0',y:'0'}),false);
});
test('Online equations: role/class isolation, shared invite locks, readiness, five native rounds and safe retries',async()=>{
 const d=await require('./helpers/rechten-online-db.cjs').createDB();try{
  const logic=await require('./helpers/logica-battle-db.cjs').provider(d.db,d.ids,'duo'),p=await require('./helpers/algebra-duo-db.cjs').install(d.db,d.ids);
  await d.db.query("update public.axioma_profiles set class_code='OTHER' where user_id=$1",[d.ids.outsider]);
  for(const u of ['alex','sam','outsider'])await p.call(u,'lobby');
  await assert.rejects(p.call('teacher','lobby'),/leerling/);await assert.rejects(p.call('alex','invite',{target:d.ids.outsider,world:'mixed'}),/eigen klas/);
  await assert.rejects(p.call('alex','invite',{target:d.ids.sam,world:'systems'}));
  let s=await p.call('alex','invite',{target:d.ids.sam,world:'mixed'});const id=s.id;assert.equal(s.task,null);
  await assert.rejects(p.call('sam','invite',{target:d.ids.alex,world:'mixed'}),/bezet/);await assert.rejects(logic.call('sam','invite',{target:d.ids.alex,world:'mixed'}),/bezet/);
  await assert.rejects(p.call('alex','ready',{id}),/geaccepteerd/);await assert.rejects(p.call('outsider','state',{id}),/niet van jou/);
  await assert.rejects(p.raw('alex','authenticated','axioma_algebra_duo_worker','resolve',{id,a:true,b:false}),/permission/);
  await assert.rejects(d.db.transaction(async tx=>{await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[d.ids.sam]);await tx.exec('set local role authenticated');await tx.query("select public.axioma_social('accept',$1,null,$2,null)",[d.ids.sam,id]);}),/Open Online duo battle/);
  s=await p.call('sam','accept',{id});assert.equal(s.phase,'waiting');assert.equal(s.pool.length,17);
  for(let round=1;round<=5;round++){
   const action=round===1?'ready':'next';s=await p.call('alex',action,{id,round:round-1});assert.notEqual(s.phase,'countdown');s=await p.call('sam',action,{id,round:round-1});assert.equal(s.phase,'countdown');
   await d.db.query("update axioma_private.algebra_duels set started_at=clock_timestamp()-interval '1 second' where id=$1",[id]);s=await p.call('alex','state',{id});assert.equal(s.phase,'playing');assert(Policy.pool(null,null,'mixed').includes(s.task.skill));
   const end=s.deadline;await p.call('alex','submit',{id,round,answer:answer(Game.generate(s.task))});s=await p.call('sam','state',{id});assert.equal(s.deadline,end,'Opponent keeps full time');
   await p.call('alex','submit',{id,round,answer:{value:'999'}});s=await p.call('sam','submit',{id,round,answer:{value:'WRONG',correct:true}});assert.equal(s.a.score,round);assert.equal(s.b.score,0);assert.equal(s.phase,round===5?'finished':'round_result');
  }
  assert.equal(s.reason,'completed');assert.equal(s.winner,d.ids.alex);assert.equal((await d.db.query('select count(*) n from axioma_private.algebra_duel_answers where match_id=$1',[id])).rows[0].n,10);
  const next=await p.call('sam','invite',{target:d.ids.alex,world:'route-fractions'});assert.equal((await p.call('alex','decline',{id:next.id})).phase,'finished');
  const cancelled=await p.call('alex','invite',{target:d.ids.sam,world:'route-two'});assert.equal((await p.call('alex','cancel',{id:cancelled.id})).phase,'finished');
 }finally{await d.db.close();}
});
