const assert=require('node:assert/strict'),{createServer}=require('./helpers/algebra-class-db.cjs'),G=require('../games/algebra-trainer/battle-config.js');
(async()=>{const {db,call,rpc,worker,ids}=await createServer();try{
const deck=Array.from({length:20},(_,i)=>({skill:G.skills[i%17].id,seed:i*121+19,variant:i%4,fractions:true,negative:true}));
await assert.rejects(call('alex','create',{deck,seconds:120}),/leerkracht/);await assert.rejects(call('invalid','create',{deck,seconds:120}),/in/);
let s=await call('teacher','create',{deck,seconds:120});const id=s.id;assert.equal(s.game,'algebra');assert.equal(s.total,20);assert((await db.query('select server_grading from axioma_private.vector_class_rooms where id=$1',[id])).rows[0].server_grading);
await assert.rejects(rpc('alex','join',{game:'vectoren',code:s.code},'axioma_game_class'),/ander spel/);
for(const name of ['alex','sam'])await call(name,'join',{code:s.code});await assert.rejects(call('alex','start',{id}),/leerkracht/);s=await call('teacher','start',{id});
const task=G.generate(s.spec),answer={value:task.solution.n+'/'+task.solution.d};s=await call('alex','submit',{id,round:0,answer});assert.equal(s.phase,'question');assert.equal(s.mine.correct,null);assert(!s.submissions);
s=await call('sam','submit',{id,round:0,answer:{correct:true,value:'999'}});assert.equal(s.phase,'results');assert.equal(s.members.find(m=>m.user_id===ids.sam).points,0);const points=s.members.find(m=>m.user_id===ids.alex).points;assert(points>=1000&&points<=1250);assert(!s.submissions);
assert.equal((await call('alex','submit',{id,round:0,answer:{value:'999'}})).mine.points,points);
await assert.rejects(rpc('teacher','grade',{game:'algebra',id,round:0,grades:[]},'axioma_game_class'),/server/);await assert.rejects(worker('work',{id,user_id:ids.outsider}),/neemt niet deel/);
s=await call('teacher','next',{id});await call('outsider','join',{code:s.code});await assert.rejects(call('outsider','submit',{id,round:1,answer}),/volgende/);await assert.rejects(call('alex','end_round',{id}),/leerkracht/);s=await call('teacher','end_round',{id});assert.equal(s.phase,'results');
for(let i=2;i<20;i++){s=await call('teacher','next',{id});const t=G.generate(s.spec);for(const name of ['alex','sam','outsider'])s=await call(name,'submit',{id,round:i,answer:{value:t.solution.n+'/'+t.solution.d}});assert.equal(s.phase,'results');}
s=await call('teacher','next',{id});assert.equal(s.phase,'finished');
const access=(await db.query("select has_function_privilege('authenticated','public.axioma_algebra_class_worker(text,jsonb)','execute') worker,has_table_privilege('authenticated','axioma_private.vector_class_answers','select') answers")).rows[0];assert.deepEqual(access,{worker:false,answers:false});
console.log('PASS 20-round Algebra lifecycle, all 17 forms, server grades, identity/roles, isolation, late arrival, deadlines, idempotent retries and protected data');
}finally{await db.close();}})().catch(e=>{console.error(e);process.exitCode=1});
