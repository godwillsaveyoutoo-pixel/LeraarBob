const assert=require('node:assert/strict');
const {createServer}=require('./helpers/vector-kahoot-db.cjs');
const C=require('../games/vectoren/vector-core.js'),policy=require('../shared/multiplayer/vector-class-policy.cjs');
const {solution}=require('./vector-trainer.test.cjs');
(async()=>{
 for(const skill of C.TaskGenerator.skills)for(let seed=1;seed<=40;seed++)for(let variant=0;variant<4;variant++){
  const spec={skill:skill.id,seed,variant},task=C.TaskGenerator.generate(skill.id,{...spec,level:1});
  assert(policy.grade(spec,solution(task)),skill.id+' '+seed+' '+variant);
  assert.equal(policy.grade(spec,{correct:true}),false);
 }
 const {db,call,rpc,worker,ids}=await createServer();try{
  const spec={skill:'equal',seed:17,variant:0},task=C.TaskGenerator.generate(spec.skill,{...spec,level:1}),answer=solution(task);
  let s=await call('teacher','create',{deck:Array(5).fill(spec),seconds:60});const id=s.id;
  await assert.rejects(call('outsider','state',{id}),/deel|sessie/);
  await call('alex','join',{code:s.code});await call('sam','join',{code:s.code});s=await call('teacher','start',{id});
  await assert.rejects(call('alex','end_round',{id}),/leerkracht/);
  s=await call('alex','submit',{id,round:0,answer});assert.equal(s.phase,'question');assert.equal(s.mine.correct,null);assert(!s.submissions);assert.equal(s.mine.points,0);
  s=await call('sam','submit',{id,round:0,answer:{correct:true}});assert.equal(s.phase,'results');assert.equal(s.members.find(p=>p.user_id===ids.alex).correct,true);assert(s.members[0].points>=1000&&s.members[0].points<=1250);assert.equal(s.members[1].points,0);assert(!s.submissions);
  const points=s.members[0].points;s=await call('alex','submit',{id,round:0,answer});assert.equal(s.members[0].points,points);
  await assert.rejects(rpc('teacher','grade',{id,round:0,grades:[]}),/server/);
  await assert.rejects(worker('work',{id,user_id:ids.outsider}),/deel/);
  await call('teacher','next',{id});await call('outsider','join',{code:s.code});s=await call('teacher','end_round',{id});assert.equal(s.phase,'results');assert.equal(s.members.find(m=>m.user_id===ids.outsider).eligible_from_round,2);
  await call('teacher','next',{id});await db.query("update axioma_private.vector_class_rooms set deadline=clock_timestamp()-interval '1 second' where id=$1",[id]);s=await call('alex','state',{id});assert.equal(s.phase,'results');assert.equal(s.members[0].points,points);
  const permissions=(await db.query("select has_function_privilege('authenticated','public.axioma_vector_class_worker(text,jsonb)','execute') worker,has_function_privilege('anon','public.axioma_vector_class_worker(text,jsonb)','execute') anon")).rows[0];assert.deepEqual(permissions,{worker:false,anon:false});
  const forged=C.VectorMath.stroke({x:0,y:0},{x:1,y:0});forged.dx=123;assert.equal(policy.normalize({strokes:[forged]}).strokes[0].dx,1);
  assert.equal(policy.grade(spec,{strokes:[{start:{x:NaN,y:0},end:{x:1,y:2}}]}),false);
  await call('teacher','close',{id});assert.equal((await call('alex','state',{id})).phase,'closed');
  console.log('PASS 3,840 generated server solutions, no premature verdict, no teacher dependency, deadline, manual closure, duplicate score, late join, normalized geometry and permissions');
 }finally{await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
