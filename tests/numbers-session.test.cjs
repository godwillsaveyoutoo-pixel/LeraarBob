const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../games/bewerkingen-trainer/core.js');
const {server,ids}=require('./helpers/numbers-session-db.cjs');
const config={activity:'learn',audience:'class',skills:[C.SKILLS[0].id],level:1,count:2,seconds:180};
const solution=s=>C.generate(s.spec.skill,s.spec.seed,s.spec.level,s.spec.variant).answer;
test('Klaslearn: identity, own drafts, retry, once-only XP, late join, teacher pacing, reports',async()=>{
 const {db,call}=await server();try{
 await assert.rejects(call('alex','create',config),/leerkracht/);
 let s=await call('teacher','create',config);
 await assert.rejects(call('outsider','state',{id:s.id}),/deel/);
 await call('alex','join',{code:s.code});s=await call('teacher','start',{id:s.id});
 let a=await call('alex','submit',{id:s.id,round:0,request_id:crypto.randomUUID(),value:'999999',correct:true});assert.equal(a.mine.correct,false);assert.equal(a.phase,'question');
 const request={id:s.id,round:0,request_id:crypto.randomUUID(),value:solution(s)};
 a=await call('alex','submit',request);assert.equal(a.mine.correct,true);assert.equal(a.mine.xp,5);assert.equal(a.mine.attempts,2);
 a=await call('alex','submit',request);assert.equal(a.mine.xp,5);assert.equal(a.mine.attempts,2);
 let b=await call('sam','join',{code:s.code});assert.equal(b.members.find(x=>x.id===ids.sam).eligible,0);assert.equal(b.mine,null);assert.equal(b.members.find(x=>x.id===ids.alex).correct,null);assert(!JSON.stringify(b).includes('999999'));
 await assert.rejects(call('alex','end',{id:s.id}),/organisator/);
 s=await call('teacher','end',{id:s.id});s=await call('teacher','next',{id:s.id});assert.equal(s.round,1);
 a=await call('alex','state',{id:s.id});assert.equal(a.mine,null);
 a=await call('alex','submit',{id:s.id,round:1,request_id:crypto.randomUUID(),value:solution(s)});assert.equal(a.mine.xp,10);
 const report=await call('teacher','report');assert.equal(report.rows.find(x=>x.user_id===ids.alex).xp,15);
 const perms=(await db.query("select has_function_privilege('authenticated','public.axioma_numbers_session(uuid,text,jsonb)','execute') member,has_function_privilege('anon','public.axioma_numbers_session(uuid,text,jsonb)','execute') guest")).rows[0];assert.deepEqual(perms,{member:false,guest:false});
 }finally{await db.close();}
});
test('online duo: capacity, trusted battle answers, hidden correctness, server deadline, finish',async()=>{
 const {db,call}=await server();try{
 let s=await call('alex','create',{...config,activity:'battle',audience:'duo',count:1});
 await assert.rejects(call('alex','start',{id:s.id}),/tweede/);
 await call('sam','join',{code:s.code});await assert.rejects(call('outsider','join',{code:s.code}),/compleet/);
 s=await call('alex','start',{id:s.id});const a=await call('alex','submit',{id:s.id,round:0,request_id:crypto.randomUUID(),value:solution(s)});assert.equal(a.mine.correct,undefined);assert.equal(a.phase,'question');
 await db.query("update axioma_private.numbers_rooms set deadline=now()-interval '1 second' where id=$1",[s.id]);
 s=await call('sam','submit',{id:s.id,round:0,request_id:crypto.randomUUID(),value:solution(s)});assert.equal(s.phase,'review');assert.equal(s.mine,null);
 s=await call('alex','next',{id:s.id});assert.equal(s.phase,'finished');assert.equal(s.members.find(x=>x.id===ids.alex).xp,10);
 }finally{await db.close();}
});
module.exports={server,config,solution};
test('Duo Learn requires both own solutions and a separate discussion confirmation',async()=>{
 const {db,call}=await server();try{
 let s=await call('alex','create',{...config,activity:'learn',audience:'duo',count:1});await call('sam','join',{code:s.code});s=await call('alex','start',{id:s.id});
 const value=solution(s);await call('alex','submit',{id:s.id,round:0,value,request_id:crypto.randomUUID()});
 s=await call('sam','submit',{id:s.id,round:0,value,request_id:crypto.randomUUID()});assert.equal(s.phase,'review');assert.equal(s.mine.xp,10);
 await assert.rejects(call('alex','next',{id:s.id}),/Bespreek/);await call('alex','approve',{id:s.id});await assert.rejects(call('alex','next',{id:s.id}),/Bespreek/);await call('sam','approve',{id:s.id});s=await call('alex','next',{id:s.id});assert.equal(s.phase,'finished');
 }finally{await db.close()}
});
test('period reports include recorded solo evidence; other classes remain private',async()=>{
 const {db,call}=await server();try{
 await db.query("update public.axioma_profiles set class_code='4B' where user_id=$1",[ids.outsider]);
 const saved={storage:{'leraarbob.bewerkingen.v1':JSON.stringify({practiceXP:10,history:[{xp:10,correct:true,attempts:0,activeSeconds:45,at:new Date().toISOString()},{xp:10,correct:true,at:'2000-01-01'},{xp:100000000,correct:true,at:'bad'}]})}};
 await db.query('insert into public.axioma_game_progress values($1,$2,$3)',[ids.alex,'bewerkingen-trainer',JSON.stringify(saved)]);
 let r=await call('alex','report',{class:'4B'});assert(!r.rows.some(x=>x.user_id===ids.outsider));assert.equal(r.rows.find(x=>x.mine).xp,10);assert.equal(r.rows.find(x=>x.mine).active_seconds,45);
 r=await call('teacher','report',{class:'3A'});assert.equal(r.rows.find(x=>x.user_id===ids.alex).correct,1);
 }finally{await db.close()}
});
test('a pupil hosting a duo cannot inspect the opponent answer during a battle',async()=>{
 const {db,call}=await server();try{
 let s=await call('alex','create',{...config,activity:'battle',audience:'duo'});await call('sam','join',{code:s.code});s=await call('alex','start',{id:s.id});await call('sam','submit',{id:s.id,round:0,request_id:crypto.randomUUID(),value:solution(s)});
 s=await call('alex','state',{id:s.id});const rival=s.members.find(m=>m.id===ids.sam);assert.equal(rival.answer,null);assert.equal(rival.correct,null);assert.equal(rival.points,0);
 }finally{await db.close()}
});

test('a departed duo member cannot reclaim an occupied second seat',async()=>{
 const {db,call}=await server();try{
 const s=await call('alex','create',{...config,audience:'duo'});
 await call('sam','join',{code:s.code});await call('sam','leave',{id:s.id});
 await call('outsider','join',{code:s.code});await assert.rejects(call('sam','join',{code:s.code}),/compleet/);
 const state=await call('alex','state',{id:s.id});assert.equal(state.members.filter(m=>!m.left).length,2);
 }finally{await db.close()}
});

test('central overview lists only owned or joined sessions and never leaks live grading',async()=>{
 const {db,call}=await server();try{
 let s=await call('alex','create',{...config,activity:'battle',audience:'duo'});await call('sam','join',{code:s.code});s=await call('alex','start',{id:s.id});await call('sam','submit',{id:s.id,round:0,value:solution(s),request_id:crypto.randomUUID()});
 assert.equal((await call('outsider','overview')).rooms.length,0);
 const own=(await call('alex','overview')).rooms[0];assert.equal(own.provider,'numbers');assert.equal(own.active,true);assert.equal(own.correct,0);assert.equal(own.points,0);
 assert.equal((await call('sam','overview')).rooms[0].points,0,'Current battle grading remains private until the round ends');
 }finally{await db.close()}
});
