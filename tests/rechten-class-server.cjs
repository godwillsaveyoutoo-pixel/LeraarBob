const fs=require('node:fs'),assert=require('node:assert/strict');
const {createDB}=require('./helpers/vector-class-db.cjs');
const policy=require('../shared/multiplayer/rechten-online-policy.cjs');
const Game=require('../games/rechten/rechtenwereld/battle-config.js'),R=require('../games/rechten/rechtenwereld/mission-runtime.js'),W=require('../games/rechten/core/wave-core.js');
(async()=>{const {db,rpc,ids}=await createDB();try{
 await db.exec('create role service_role');await db.exec(fs.readFileSync('supabase/migrations/20260929235623_rechten_class_server_grading.sql','utf8'));
 const {createHandler}=await import('../supabase/functions/rechten-class/handler.js');
 const worker=async(action,data)=>db.transaction(async tx=>{await tx.exec('set local role service_role');return(await tx.query('select public.axioma_rechten_class_worker($1,$2) result',[action,JSON.stringify(data)])).rows[0].result;});
 const handler=createHandler({url:'https://test.invalid',anonKey:'anon',serviceKey:'server',policy,fetcher:async(url,opts)=>{
  const user=opts.headers.Authorization.slice(7);if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify(ids[user]?{id:ids[user]}:{}),{status:ids[user]?200:401});
  const {p_action:action,p_data:data}=JSON.parse(opts.body);
  try{const result=url.endsWith('_worker')?(assert.equal(user,'server'),await worker(action,data)):await rpc(user,action,data,'axioma_game_class');return new Response(JSON.stringify(result));}catch(e){return new Response(JSON.stringify({message:e.message}),{status:400});}
 }});
 const call=async(user,action,data={})=>{const res=await handler(new Request('https://test.invalid',{method:'POST',headers:{Authorization:'Bearer '+user},body:JSON.stringify({action,data})}));const body=await res.json();if(!res.ok)throw Error(body.error);return body;};
 const deck=Array.from({length:5},(_,variant)=>({skill:'slope',seed:17,variant:variant%4}));
 let s=await call('teacher','create',{deck,seconds:60});await call('alex','join',{code:s.code});await call('sam','join',{code:s.code});s=await call('teacher','start',{id:s.id});
 const m=R.active(Game.generate(s.spec)),answer={steps:[{phase:m.phase,values:{rateChoice:String(m.task.options.a.findIndex(q=>W.eq(q,m.task.model.a)))}}]};
 await call('alex','submit',{id:s.id,round:0,answer});s=await call('sam','submit',{id:s.id,round:0,answer:{correct:true}});
 assert.equal(s.phase,'results');assert.equal(s.members.find(m=>m.user_id===ids.alex).correct,true);assert.equal(s.members.find(m=>m.user_id===ids.sam).points,0);assert(s.members.find(m=>m.user_id===ids.alex).points>=1000);assert(s.members.find(m=>m.user_id===ids.alex).points<=1250);assert(!s.submissions);
 const score=s.members[0].points;s=await call('alex','submit',{id:s.id,round:0,answer});assert.equal(s.members[0].points,score);
 await assert.rejects(call('teacher','grade',{id:s.id,round:0,grades:[]}),/server/);
 await assert.rejects(worker('work',{id:s.id,user_id:ids.outsider}),/neemt niet deel/);
 await call('teacher','next',{id:s.id});await db.query("update axioma_private.vector_class_rooms set deadline=clock_timestamp()-interval '1 second' where id=$1",[s.id]);s=await call('alex','state',{id:s.id});assert.equal(s.phase,'results');assert.equal(s.members[0].points,score);
 await call('outsider','join',{code:s.code});s=await call('teacher','state',{id:s.id});assert.equal(s.phase,'results');assert.equal(s.members.find(m=>m.user_id===ids.outsider).eligible_from_round,2);
 const permissions=await db.query("select has_function_privilege('authenticated','public.axioma_rechten_class_worker(text,jsonb)','execute') worker,has_function_privilege('authenticated','axioma_private.vector_class_legacy(text,jsonb)','execute') legacy");assert.deepEqual(permissions.rows[0],{worker:false,legacy:false});

 let v=await rpc('teacher','create',{game:'vectoren',seconds:60,deck:deck.map(t=>({...t,skill:'props'}))},'axioma_game_class');await rpc('alex','join',{game:'vectoren',code:v.code},'axioma_game_class');await rpc('teacher','start',{game:'vectoren',id:v.id},'axioma_game_class');await rpc('alex','submit',{game:'vectoren',id:v.id,round:0,answer:{}},'axioma_game_class');v=await rpc('teacher','grade',{game:'vectoren',id:v.id,round:0,grades:[{user_id:ids.alex,correct:true}]},'axioma_game_class');assert.equal(v.phase,'results');assert(v.members[0].points>=500);
 console.log('PASS server class grading without teacher poll, complete/timeout, authentic validator, duplicate submit, score weights, late join, restore, no client grading, membership and function privileges');
}finally{await db.close();}})().catch(e=>{console.error(e);process.exitCode=1});
