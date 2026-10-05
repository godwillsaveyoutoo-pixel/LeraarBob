// Real Algebra Edge handler + bundled exact policy + isolated PostgreSQL (PGlite).
const assert=require('node:assert/strict'),{createServer}=require('./helpers/algebra-class-db.cjs'),G=require('../games/algebra-trainer/battle-config.js'),S=require('../games/algebra-trainer/stelsels/core.js');
(async()=>{
 const policy=(await import('../supabase/functions/algebra-class/policy.js')).default;
 const {db,call,rpc,worker,handler,ids}=await createServer({policy});
 const deck=Array.from({length:5},(_,i)=>({skill:'S1',seed:i===4?4294967295:i*7123+51,variant:i%4}));
 const answer=t=>({x:S.text(t.solution.x),y:S.text(t.solution.y)});
 try{
  const raw=(body,bearer)=>handler(new Request('https://test.invalid',{method:'POST',headers:bearer?{Authorization:bearer}:{},body:JSON.stringify(body)}));
  assert.equal((await raw({action:'state',data:{}},null)).status,401);
  assert.equal((await raw({action:'create',data:{deck,seconds:180}},'Bearer invalid')).status,401);
  assert.equal((await raw({action:'grade',data:{}},'Bearer teacher')).status,400);
  assert.equal((await raw({action:'create',data:{deck,seconds:180,padding:'x'.repeat(26000)}},'Bearer teacher')).status,413);
  await assert.rejects(call('alex','create',{deck,seconds:180}),/leerkracht/);
  for(const seconds of [0,1,179,181,300])await assert.rejects(call('teacher','create',{deck,seconds}),/rondetijd/);
  for(const invalid of [{seed:4294967296},{seed:'51'},{variant:4},{variant:'0'},{skill:'S9'}])await assert.rejects(call('teacher','create',{deck:deck.map((d,i)=>i?d:{...d,...invalid}),seconds:180}),/opgave|vraag/);
  await assert.rejects(rpc('teacher','create',{game:'vectoren',deck:Array.from({length:5},(_,i)=>({skill:'props',seed:i,variant:0})),seconds:180},'axioma_game_class'),/rondetijd/);
  let state=await call('teacher','create',{deck,seconds:180}),id=state.id;
  assert.equal(state.game,'algebra');assert.equal(state.seconds,180);assert.equal(state.total,5);
  assert.equal((await call('teacher','create',{deck,seconds:120})).id,id,'Existing active room is resumed');
  await assert.rejects(call('teacher','join',{code:state.code}),/leerlingaccount/);
  await assert.rejects(rpc('alex','join',{game:'vectoren',code:state.code},'axioma_game_class'),/ander spel/);
  for(const user of ['alex','sam'])await call(user,'join',{code:state.code});
  await assert.rejects(call('alex','start',{id}),/leerkracht/);
  state=await call('teacher','start',{id});
  const bounds=(await db.query('select extract(epoch from deadline-started_at)::integer seconds,server_grading from axioma_private.vector_class_rooms where id=$1',[id])).rows[0];assert.deepEqual(bounds,{seconds:180,server_grading:true});
  const first=G.generate(state.spec),correct=answer(first);
  for(const invalid of [{x:correct.x},{x:2,y:correct.y},{x:'1'.repeat(41),y:correct.y}])await assert.rejects(call('alex','submit',{id,round:0,answer:invalid}),/x en y/);
  state=await call('alex','submit',{id,round:0,answer:{...correct,user_id:ids.sam,correct:false}});
  assert.equal(state.phase,'question');assert.equal(state.mine.correct,null);assert(!state.submissions);
  await call('alex','submit',{id,round:0,answer:{x:'999',y:'999',correct:true}});
  const stored=(await db.query('select answer from axioma_private.vector_class_answers where room_id=$1 and user_id=$2 and round=0',[id,ids.alex])).rows[0].answer;
  assert.equal(stored.x,correct.x);assert.equal(stored.y,correct.y);
  state=await call('sam','submit',{id,round:0,answer:{...correct,y:String(first.solution.y.n+1),correct:true}});
  assert.equal(state.phase,'results');assert.equal(state.members.find(m=>m.user_id===ids.sam).points,0);
  const points=state.members.find(m=>m.user_id===ids.alex).points;assert(points>=1000&&points<=1250);assert(!state.submissions);
  await assert.rejects(rpc('teacher','grade',{game:'algebra',id,round:0,grades:[{user_id:ids.sam,correct:true}]},'axioma_game_class'),/server/);
  await assert.rejects(worker('work',{id,user_id:ids.outsider}),/neemt niet deel/);
  state=await call('teacher','next',{id});
  await call('outsider','join',{code:state.code});await assert.rejects(call('outsider','submit',{id,round:1,answer:correct}),/volgende ronde/);
  const second=answer(G.generate(state.spec));await call('alex','submit',{id,round:1,answer:second});
  await db.query("update axioma_private.vector_class_rooms set deadline=clock_timestamp()-interval '1 second' where id=$1",[id]);
  await assert.rejects(call('sam','submit',{id,round:1,answer:second}),/tijd is voorbij/);
  state=await call('alex','submit',{id,round:1,answer:{x:'999',y:'999'}});
  assert.equal(state.phase,'results');assert.equal(state.mine.correct,true,'Existing accepted answer stays valid after deadline');
  assert.equal(state.members.find(m=>m.user_id===ids.sam).points,0);
  assert.equal((await db.query('select count(*)::integer count from axioma_private.vector_class_answers where room_id=$1 and round=1',[id])).rows[0].count,1);
  for(let round=2;round<5;round++){
   state=await call('teacher','next',{id});const task=G.generate(state.spec),a=answer(task);
   if(round===2){await assert.rejects(call('alex','end_round',{id}),/leerkracht/);state=await call('teacher','end_round',{id});assert.equal(state.phase,'results');continue;}
   for(const user of ['alex','sam','outsider'])state=await call(user,'submit',{id,round,answer:round===3&&user==='sam'?{x:'1/0',y:a.y}:round===4&&user==='outsider'?{}:a,skipped:round===4&&user==='outsider'});
   assert.equal(state.phase,'results');assert(!state.submissions);
  }
  state=await call('teacher','next',{id});assert.equal(state.phase,'finished');
  state=await call('teacher','create',{deck:deck.slice(0,3),seconds:180});assert.equal(state.total,3);id=state.id;
  await call('alex','join',{code:state.code});state=await call('teacher','start',{id});
  for(let round=0;round<3;round++){state=await call('alex','submit',{id,round,answer:answer(G.generate(state.spec))});assert.equal(state.phase,'results');state=await call('teacher','next',{id});}
  assert.equal(state.phase,'finished');
  const access=(await db.query("select has_function_privilege('authenticated','public.axioma_algebra_class_worker(text,jsonb)','execute') worker,has_function_privilege('anon','public.axioma_game_class(text,jsonb)','execute') anonymous,has_table_privilege('authenticated','axioma_private.vector_class_answers','select') answers")).rows[0];assert.deepEqual(access,{worker:false,anonymous:false,answers:false});
  console.log('PASS Stelsels 180s, native exact bundled grades, final x/y, five rounds, wrong/forged/skipped answers, auth/roles, bounds, protected data, late join, real deadlines and idempotent retries');
 }finally{await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
