const test=require('node:test'),assert=require('node:assert/strict');
const Game=require('../games/logicawereld/battle-config.js'),Policy=require('../shared/multiplayer/logica-battle-policy.cjs');
const {correctAnswer}=require('./helpers/logica-ui.cjs'),{provider}=require('./helpers/logica-battle-db.cjs');
test('All 90 native tasks grade through the battle provider; malformed specs cannot select arbitrary content',()=>{
 const reached=new Set();for(const skill of Game.skills)for(let seed=0;seed<5;seed++){
  const spec={skill:skill.id,seed,variant:0},t=Game.generate(spec);reached.add(t.id);
  assert.equal(Policy.grade(spec,{value:correctAnswer(t)}),true,t.id);assert.equal(Policy.grade(spec,{correct:true}),false,t.id);
 }
 assert.equal(reached.size,90);
 for(const spec of [{skill:'L99',seed:0,variant:0},{skill:'L01',seed:-1,variant:0},{skill:'L01',seed:4294967296,variant:0},{skill:'L01',seed:0,variant:4}])assert.equal(Policy.grade(spec,{}),false);
});
test('Class: trusted teacher creates a 20-round mix; native grades, immutable submissions, final rankings and worker isolation',async()=>{
 const c=await require('./helpers/lesson-stage-db.cjs').createStageDB();
 try{
  const p=await provider(c.db,c.ids,'class'),deck=Array.from({length:20},(_,i)=>({skill:Game.skills[i%18].id,seed:i,variant:0}));
  await assert.rejects(p.call('alex','create',{deck,seconds:180}),/leerkracht/);
  await assert.rejects(p.call('teacher','create',{deck:[...deck.slice(1),{skill:'S1',seed:0,variant:0}],seconds:180}),/vraag/);
  let s=await p.call('teacher','create',{deck,seconds:180,server_grading:false});const id=s.id;
  for(const user of ['alex','sam'])await p.call(user,'join',{code:s.code});
  await assert.rejects(p.call('outsider','state',{id}),/deel|sessie|battle/);
  await assert.rejects(p.raw('alex','authenticated','axioma_logica_class_worker','resolve',{id,grades:[]}),/permission/);
  s=await p.call('teacher','start',{id});
  for(let i=0;i<20;i++){
   assert.equal(s.spec.skill,deck[i].skill);
   const answer={value:correctAnswer(Game.generate(s.spec)),correct:false};
   let a=await p.call('alex','submit',{id,round:i,answer});assert(!a.submissions);
   await p.call('alex','submit',{id,round:i,answer:{correct:true}});
   await p.call('sam','submit',{id,round:i,answer:{correct:true,value:'INVALID'}});
   s=await p.call('teacher','state',{id});assert.equal(s.phase,'results');
   s=await p.call('teacher','next',{id});
  }
  assert.equal(s.phase,'finished');
  const rows=(await c.db.query('select user_id,count(*) filter(where correct) correct,sum(points) points from axioma_private.vector_class_answers where room_id=$1 group by user_id',[id])).rows;
  assert.equal(Number(rows.find(r=>r.user_id===c.ids.alex).correct),20);assert.equal(Number(rows.find(r=>r.user_id===c.ids.sam).points),0);
 }finally{await c.db.close();}
});
test('Duo: alias invitation, crossed requests, accept/ready barrier, all rounds, retry safety and server grading',async()=>{
 const d=await require('./helpers/rechten-online-db.cjs').createDB();
 try{
  const p=await provider(d.db,d.ids,'duo');
  await d.db.query("update public.axioma_profiles set class_code='OTHER' where user_id=$1",[d.ids.outsider]);
  for(const u of ['alex','sam','outsider'])await p.call(u,'lobby');
  await assert.rejects(p.call('teacher','lobby'),/leerling/);
  await assert.rejects(p.call('alex','invite',{target:d.ids.outsider,world:'mixed'}),/eigen klas/);
  let s=await p.call('alex','invite',{target:d.ids.sam,world:'mixed'});const id=s.id;
  assert.equal(s.phase,'invite');assert.equal(s.task,null);
  await assert.rejects(p.call('sam','invite',{target:d.ids.alex,world:'mixed'}),/bezet/);
  await assert.rejects(p.call('alex','ready',{id}),/geaccepteerd/);
  await assert.rejects(p.call('outsider','state',{id}),/niet van jou/);
  await assert.rejects(p.raw('alex','authenticated','axioma_logica_duo_worker','resolve',{id,a:true,b:false}),/permission/);
  s=await p.call('sam','accept',{id});assert.equal(s.phase,'waiting');assert.equal(s.pool.length,18);
  for(let round=1;round<=5;round++){
   const action=round===1?'ready':'next';await p.call('alex',action,{id,round:round-1});
   s=await p.call('sam',action,{id,round:round-1});assert.equal(s.phase,'countdown');
   await d.db.query("update axioma_private.logica_duels set started_at=clock_timestamp()-interval '1 second' where id=$1",[id]);
   s=await p.call('alex','state',{id});assert.equal(s.phase,'playing');
   await p.call('alex','submit',{id,round,answer:{value:correctAnswer(Game.generate(s.task))}});
   await p.call('alex','submit',{id,round,answer:{value:'WRONG'}});
   s=await p.call('sam','submit',{id,round,answer:{value:'WRONG',correct:true}});
   assert.equal(s.a.score,round);assert.equal(s.b.score,0);assert.equal(s.phase,round===5?'finished':'round_result');
  }
  assert.equal(s.reason,'completed');assert.equal(s.winner,d.ids.alex);
  assert.equal((await d.db.query('select count(*) n from axioma_private.logica_duel_answers where match_id=$1',[id])).rows[0].n,10);
  const another=await p.call('sam','invite',{target:d.ids.alex,world:'signaalplein'});
  assert.equal((await p.call('alex','decline',{id:another.id})).phase,'finished');
  const cancelled=await p.call('alex','invite',{target:d.ids.sam,world:'testlab'});
  assert.equal((await p.call('alex','cancel',{id:cancelled.id})).phase,'finished');
 }finally{await d.db.close();}
});
