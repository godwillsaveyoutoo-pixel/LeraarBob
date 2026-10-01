const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('../games/bewerkingen-trainer/battle-config.js'),{createServer}=require('./helpers/bewerkingen-class-db.cjs');
test('classroom lifecycle uses trusted exact grades, protected workers and separate game rooms',async()=>{
 const {db,call,rpc,ids}=await createServer();try{
 const deck=Array.from({length:20},(_,i)=>({skill:G.skills[i%G.skills.length].id,seed:i+41,variant:i%4,level:i%3}));
 await assert.rejects(call('alex','create',{deck,seconds:60}));
 let room=await call('teacher','create',{deck,seconds:60});assert.equal(room.game,'bewerkingen');assert.equal(room.total,20);
 await call('alex','join',{code:room.code});await call('sam','join',{code:room.code});await assert.rejects(call('outsider','state',{id:room.id}));
 room=await call('teacher','start',{id:room.id});assert.equal(room.phase,'question');const task=G.generate(room.spec);
 await call('alex','submit',{id:room.id,round:0,answer:{value:task.answer,correct:false}});
 room=await call('sam','submit',{id:room.id,round:0,answer:{value:'99999',correct:true}});assert.equal(room.phase,'results');assert.equal(room.members.find(m=>m.user_id===ids.alex).correct,true);assert.equal(room.members.find(m=>m.user_id===ids.sam).correct,false);
 const points=room.members.find(m=>m.user_id===ids.alex).points;
 await call('alex','submit',{id:room.id,round:0,answer:{value:task.answer}});room=await call('teacher','state',{id:room.id});assert.equal(room.members.find(m=>m.user_id===ids.alex).points,points);
 room=await call('teacher','next',{id:room.id});assert.equal(room.round,1);assert.equal((await call('alex','state',{id:room.id})).round,1);
 await assert.rejects(rpc('alex','grade',{id:room.id,round:1,grades:[]},'axioma_game_class'));
 room=await call('teacher','end_round',{id:room.id});assert.equal(room.phase,'results');
 const perms=(await db.query("select has_function_privilege('authenticated','public.axioma_bewerkingen_class_worker(text,jsonb)','execute') member,has_function_privilege('anon','public.axioma_bewerkingen_class_worker(text,jsonb)','execute') guest")).rows[0];assert.deepEqual(perms,{member:false,guest:false});
 await assert.rejects(rpc('teacher','state',{id:room.id,game:'algebra'},'axioma_game_class'));
 room=await call('teacher','close',{id:room.id});assert.equal(room.phase,'closed');
 const algebra=await rpc('teacher','create',{game:'algebra',seconds:60,deck:Array.from({length:5},(_,i)=>({skill:'A1',seed:i,variant:i%4,level:1}))},'axioma_game_class');assert.equal(algebra.game,'algebra');
 await assert.rejects(call('alex','join',{code:algebra.code}));
 const registered=(await db.query("select metadata->>'progress_total' total from public.axioma_games where id='bewerkingen-trainer'")).rows[0];assert.equal(registered.total,'16');
 }finally{await db.close();}
});
