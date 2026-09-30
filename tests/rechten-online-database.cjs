const assert=require('node:assert/strict');const {createDB}=require('./helpers/rechten-online-db.cjs');
const Game=require('../games/rechten/rechtenwereld/battle-config.js'),R=require('../games/rechten/rechtenwereld/mission-runtime.js'),W=require('../games/rechten/core/wave-core.js');
const policy=require('../shared/multiplayer/rechten-online-policy.cjs');
function correct(spec){const m=R.active(Game.generate(spec));return {steps:[{phase:m.phase,values:{rateChoice:String(m.task.options.a.findIndex(a=>W.eq(a,m.task.model.a)))}}]};}
(async()=>{const {db,ids,raw,rpc,worker,start,progress}=await createDB();try{
 const moveTime=(id,sql)=>db.query('update axioma_private.rechten_duels set '+sql+' where id=$1',[id]);
 const play=async s=>{await rpc('alex','next',{id:s.id,round:s.round});s=await rpc('sam','next',{id:s.id,round:s.round});assert.equal(s.phase,'countdown');await moveTime(s.id,"started_at=clock_timestamp()-interval '1 second',deadline=clock_timestamp()+interval '75 seconds'");return rpc('alex','state',{id:s.id})};
 let s=await start();assert.equal(s.phase,'playing');assert.deepEqual((await rpc('sam','state',{id:s.id})).task,s.task);
 await assert.rejects(raw('outsider','state',{id:s.id}),/niet van jou/);await assert.rejects(raw('teacher','lobby'),/leerling/);
 await assert.rejects(raw('alex','submit',{id:s.id,answer:{correct:true}}),/Ronde ontbreekt/);
 s=await rpc('alex','submit',{id:s.id,round:1,answer:{correct:true,steps:[]}});assert.equal(s.a.confirmed,true);assert.equal(s.a.correct,null);assert(!JSON.stringify(s).includes('steps'));
 assert(Date.parse(s.deadline)-Date.parse(s.server_time)<=20001);
 await rpc('alex','submit',{id:s.id,round:1,answer:correct(s.task)});
 s=await rpc('sam','submit',{id:s.id,round:1,answer:{correct:true}});assert.equal(s.phase,'round_result');assert.equal(s.a.correct,false);assert.equal(s.b.correct,false);assert.equal(s.a.score,0);
 // Round 2: first wrong, second correct.
 s=await play(s);await rpc('alex','submit',{id:s.id,round:s.round,answer:{}});s=await rpc('sam','submit',{id:s.id,round:s.round,answer:correct(s.task)});assert.equal(s.b.score,1);assert.equal(s.winner,ids.sam);
 // Round 3: both correct, first arrival wins outside the 300ms margin.
 s=await play(s);await rpc('alex','submit',{id:s.id,round:s.round,answer:correct(s.task)});
 await db.query("update axioma_private.rechten_duel_answers set received_at=received_at-interval '1 second' where match_id=$1 and round=$2",[s.id,s.round]);
 s=await rpc('sam','submit',{id:s.id,round:s.round,answer:correct(s.task)});assert.equal(s.a.score,1);assert.equal(s.a.correct,true);assert.equal(s.b.correct,true);
 // Resolver replays cannot add points.
 await worker('alex','resolve',{id:s.id,round:s.round,a:true,b:false});assert.deepEqual((await rpc('alex','state',{id:s.id})).a,s.a);
 // Round 4: real timeout, no submissions. Read/state drives resolution after reconnect.
 s=await play(s);await moveTime(s.id,"deadline=clock_timestamp()-interval '1 second'");s=await rpc('sam','state',{id:s.id});assert.equal(s.phase,'round_result');assert.equal(s.a.score,1);assert.equal(s.b.score,1);
 // Round 5: practically simultaneous correct answers remain tied.
 s=await play(s);await raw('alex','submit',{id:s.id,round:s.round,answer:correct(s.task)});await raw('sam','submit',{id:s.id,round:s.round,answer:correct(s.task)});
 await db.query('update axioma_private.rechten_duel_answers set received_at=now() where match_id=$1 and round=$2',[s.id,s.round]);s=await rpc('alex','state',{id:s.id});assert.equal(s.phase,'round_result');assert.equal(s.round,5);assert.equal(s.winner,null);
 // Sudden death goes on until a clear winner, with exactly one final result.
 s=await play(s);assert.equal(s.round,6);await rpc('alex','submit',{id:s.id,round:s.round,answer:correct(s.task)});s=await rpc('sam','submit',{id:s.id,round:s.round,answer:{correct:true}});assert.equal(s.phase,'finished');assert.equal(s.winner,ids.alex);assert.equal(s.a.score,2);assert.equal(s.b.score,1);
 for(let i=0;i<3;i++){s=await rpc('sam','submit',{id:s.id,round:s.round,answer:correct(s.task)});assert.equal(s.a.score,2);assert.equal(s.b.score,1);}
 assert.equal((await db.query('select count(*) n from axioma_private.rechten_duels where id=$1',[s.id])).rows[0].n,1);
 // Accepted invite is idempotent; tabs bind to the account, confirmed work survives reload.
 s=await start();await rpc('sam','accept',{id:s.id});await rpc('alex','submit',{id:s.id,round:1,answer:correct(s.task)});
 const reloaded=await raw('alex','state',{id:s.id,tab_id:ids.outsider});assert(reloaded.a.confirmed);assert.equal(reloaded.a.correct,null);
 await moveTime(s.id,"deadline=clock_timestamp()-interval '1 second'");s=await rpc('sam','state',{id:s.id});assert.equal(s.a.score,1);assert.equal(s.b.score,0);await rpc('alex','leave',{id:s.id});
 // No unknown subject fallback when there is no common completed content.
 await progress('alex',['delta']);await progress('sam',['slope']);await raw('alex','lobby');await raw('sam','lobby');assert.deepEqual((await raw('alex','lobby')).players,[]);await assert.rejects(rpc('alex','invite',{target:ids.sam}),/wereld af/);
 // Privacy across classes and teacher roles.
 await db.query("update public.axioma_profiles set class_code='OTHER' where user_id=$1",[ids.outsider]);await raw('outsider','lobby');assert(!(await raw('alex','lobby')).players.some(p=>p.id===ids.outsider));await assert.rejects(raw('alex','invite',{target:ids.outsider}),/eigen klas/);await assert.rejects(raw('alex','invite',{target:ids.alex}),/andere leerling/);
 // SQL rights: no anonymous RPC, no client grading, no direct answers.
 const access=await db.query("select has_function_privilege('authenticated','public.axioma_rechten_duo_worker(text,jsonb)','execute') worker,has_function_privilege('anon','public.axioma_rechten_duo(text,jsonb)','execute') anon,has_table_privilege('authenticated','axioma_private.rechten_duel_answers','select') answers");assert.deepEqual(access.rows[0],{worker:false,anon:false,answers:false});
 const empty={missions:{},events:[]},known={missions:{slope:{world:'hellingrug',completed:true},zero:{world:'grenspas',completed:true}},events:[]};assert.deepEqual(policy.pool(empty,known),[]);assert.deepEqual(policy.pool(known,{...known,missions:{slope:known.missions.slope}}),[]);
 console.log('PASS invite/accept, same seed, private responses, 20s cap, five rounds, both correct, wrong/right, both wrong, timeout, 300ms photo finish, sudden death, reconnect, duplicate submit/resolve, class isolation, mastery intersection, forged correctness and SQL permissions');
}finally{await db.close();}})().catch(e=>{console.error(e);process.exitCode=1});
