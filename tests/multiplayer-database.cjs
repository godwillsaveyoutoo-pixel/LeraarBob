const assert=require('node:assert/strict'),{createDB}=require('./helpers/vector-class-db.cjs');
(async()=>{const {db,rpc}=await createDB();const call=(user,action,data)=>rpc(user,action,data,'axioma_game_class');try{
 const sessions=[];
 for(const [game,skill] of [['vectoren','opposite'],['rechten','point_plot'],['wortelbouw','build_2']]){
  const deck=Array.from({length:5},(_,i)=>({skill,seed:17+i,variant:i%4}));const room=await call('teacher','create',{game,deck,seconds:90});sessions.push(room);assert.equal(room.game,game);
  await assert.rejects(call('alex','create',{game,deck,seconds:90}),/leerkracht/);
  await assert.rejects(call('alex','join',{game:game==='rechten'?'wortelbouw':'rechten',code:room.code}),/ander spel/);
  let s=await call('alex','join',{game,code:room.code});assert.equal(s.members.length,1);await call('teacher','start',{game,id:room.id});
  await assert.rejects(call('alex','grade',{game,id:room.id,round:0,grades:[]}),/leerkracht/);
  await assert.rejects(call('sam','state',{game,id:room.id}),/niet deel/);
  s=await call('alex','submit',{game,id:room.id,round:0,answer:{test:true}});assert.equal(s.phase,'grading');
  s=await call('teacher','grade',{game,id:room.id,round:0,grades:[{user_id:s.members[0].user_id,correct:true}]});assert.equal(s.phase,'results');assert(s.members[0].points>=500);assert.equal(s.submissions,null);
 }
 assert.equal(new Set(sessions.map(s=>s.id)).size,3);
 await assert.rejects(rpc('alex','state',{id:sessions[1].id}),/ander spel/);
 const access=await db.query("select has_function_privilege('anon','public.axioma_game_class(text,jsonb)','execute') as anon,has_table_privilege('authenticated','axioma_private.vector_class_answers','select') as direct");assert.deepEqual(access.rows[0],{anon:false,direct:false});
 console.log('PASS three isolated games, role restrictions, no cross-game join, participant privacy, grading and no direct data access');
}finally{await db.close();}})().catch(e=>{console.error(e);process.exitCode=1});
