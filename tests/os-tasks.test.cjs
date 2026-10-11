const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const {createStageDB}=require('./helpers/lesson-stage-db.cjs'),{install}=require('./helpers/os-tasks-db.cjs');
const Game=require('../games/rechten/rechtenwereld/battle-config.js'),R=require('../games/rechten/rechtenwereld/mission-runtime.js');
test('Assignments: publication, fixed content, enrollment, native answers, resume, final submission, review and permissions',async()=>{
 const {db,ids}=await createStageDB();try{
 const api=await install(db,ids),id=randomUUID();const parts=[{kind:'glass',points:10},{kind:'clay',points:5,count:1,speed:8},{kind:'rights',points:10,count:1,skills:['point']}];
 await assert.rejects(api.rpc('alex','create',{id,title:'Fake',parts}),/leerkracht/);
 let x=await api.rpc('teacher','create',{id,title:'Rechtentoets',parts});assert.equal(x.task.status,'draft');assert.equal((await api.rpc('teacher','list')).tasks.length,1);assert.equal((await api.rpc('alex','list')).tasks.length,0);
 await assert.rejects(api.rpc('teacher','create',{id:randomUUID(),title:'Missing points',parts:[{kind:'glass'}]}),/onderdelen/);
 x=await api.rpc('teacher','publish',{id,revision:0,students:[ids.alex]});assert.equal(x.submissions.length,1);
 await assert.rejects(api.rpc('teacher','update',{id,revision:1,title:'Changed',parts}),/uitgedeeld/);
 await assert.rejects(api.rpc('outsider','get',{id}),/toegewezen/);
 x=await api.rpc('alex','get',{id});assert.equal(x.work.status,'working');

 x=await api.rpc('alex','glass_save',{id,part:0,revision:0,draft:{mode:'design',free:{lines:[{type:'vertical',x:1}]}},done:true});assert.equal(x.work.revision,1);
 await assert.rejects(api.rpc('alex','glass_save',{id,part:0,revision:0,draft:{},done:true}),/elders/);
 await api.rpc('alex','clay_start',{id,part:1});
 await assert.rejects(api.rpc('alex','clay_answer',{id,part:1,index:0,event:randomUUID(),answer:1}),/Wacht/);
 await db.query("update axioma_private.os_task_work set parts=jsonb_set(parts,'{1,next_at}',to_jsonb((clock_timestamp()-interval '1 second')::text)) where task_id=$1",[id]);
 const q=(await db.query("select axioma_private.clay_question_v2(md5($1||':1')::uuid,0) q",[id])).rows[0].q,event=randomUUID();
 x=await api.rpc('alex','clay_answer',{id,part:1,index:0,event,answer:q.n/q.d});assert.equal(x.work.parts[1].done,true);assert.equal(x.work.parts[1].answers[0].correct,undefined);
 const revision=x.work.revision;x=await api.rpc('alex','clay_answer',{id,part:1,index:0,event,answer:q.n/q.d});assert.equal(x.work.revision,revision);
 const {spec}=await api.activity('alex','question',{id,part:2});const state=Game.generate(spec),m=R.active(state);
 const answer={steps:[{phase:m.phase,values:{...m.values,answer:m.task.answer}}]};
 // Deliberately incorrect answer must be stored and server graded; the client cannot send a score.
 const ev=randomUUID();x=await api.activity('alex','answer',{id,part:2,index:0,event:ev,answer:{steps:[]},correct:true,user:ids.teacher});assert.equal(x.work.parts[2].done,true);
 const rev=x.work.revision;x=await api.activity('alex','answer',{id,part:2,index:0,event:ev,answer:{steps:[]}});assert.equal(x.work.revision,rev);
 const teach=await api.rpc('teacher','get',{id});assert.equal(teach.submissions[0].parts[2].answers[0].correct,false);assert.equal(teach.submissions[0].parts[1].answers[0].correct,true);
 x=await api.rpc('alex','submit',{id});assert.equal(x.work.status,'submitted');assert.deepEqual(x.work.grades,[1,1,0]);assert.equal(x.work.result.total,2);const submitted=x.work.submitted_at;
 assert.equal((await api.rpc('alex','submit',{id})).work.submitted_at,submitted);
 await assert.rejects(api.rpc('alex','glass_save',{id,part:0,revision:x.work.revision,draft:{}}),/niet meer/);
 await assert.rejects(api.rpc('alex','review',{id,student:ids.alex,grades:[10,5,10]}),/leerkracht/);
 await assert.rejects(api.rpc('teacher','review',{id,student:ids.alex,revision:x.work.revision,grades:[11,5,0]}),/correcte|bereik/);
 await api.rpc('teacher','review',{id,student:ids.alex,revision:x.work.revision,grades:[1,1,0],feedback:'Mooi raam.'});x=await api.rpc('alex','get',{id});assert.equal(x.work.status,'reviewed');assert.deepEqual(x.work.grades,[1,1,0]);assert.equal(x.work.parts[2].answers[0].correct,false);
 const grants=(await db.query("select has_table_privilege('authenticated','axioma_private.os_task_work','UPDATE') tab,has_function_privilege('authenticated','public.axioma_os_task_worker(text,jsonb)','EXECUTE') worker,has_function_privilege('anon','public.axioma_os_tasks(text,jsonb)','EXECUTE') anon")).rows[0];assert.deepEqual(grants,{tab:false,worker:false,anon:false});
 }finally{await db.close();}
});

test('Task retries, competing answers, drafts and invalid configuration cannot overwrite durable work',async()=>{
 const {db,ids}=await createStageDB();try{const api=await install(db,ids),id=randomUUID(),parts=[{kind:'rights',points:10,count:2,skills:['point']}];
 await api.rpc('teacher','create',{id,title:'Tweede proef',parts});
 for(const students of [null,[],undefined])await assert.rejects(api.rpc('teacher','publish',{id,revision:0,students}),/Kies/);
 await api.rpc('teacher','publish',{id,revision:0,students:[ids.alex]});const {spec}=await api.activity('alex','question',{id,part:0});const m=R.active(Game.generate(spec));const answer={steps:[{phase:m.phase,values:{answer:m.task.options.findIndex(o=>JSON.stringify(o)===JSON.stringify(m.task.target))}}]};
 // Native answer values use the option index, never a generated score.
 assert.equal(require('../shared/multiplayer/rechten-online-policy.cjs').grade(spec,answer),true);
 await api.rpc('alex','rights_draft',{id,part:0,index:0,draft:answer});assert.deepEqual((await api.rpc('alex','get',{id})).work.parts[0].draft,answer);
 const event=randomUUID(),data={id,part:0,index:0,event,answer};const retries=await Promise.all([api.activity('alex','answer',data),api.activity('alex','answer',data)]);assert(retries.every(x=>x.work.parts[0].answers.length===1));
 const before=(await api.rpc('alex','get',{id})).work.revision;await api.rpc('alex','rights_draft',{id,part:0,index:0,draft:{steps:[]}});assert.equal((await api.rpc('alex','get',{id})).work.revision,before);
 const attempts=await Promise.allSettled([api.activity('alex','answer',{id,part:0,index:1,event:randomUUID(),answer:{steps:[]}}),api.activity('alex','answer',{id,part:0,index:1,event:randomUUID(),answer:{steps:[]}})]);assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1);let w=(await api.rpc('teacher','get',{id})).submissions[0];assert.equal(w.parts[0].answers.length,2);assert.equal(w.parts[0].answers[0].correct,true);
 await api.rpc('alex','submit',{id});w=(await api.rpc('alex','get',{id})).work;for(const grades of [null,undefined,[null]])await assert.rejects(api.rpc('teacher','review',{id,student:ids.alex,revision:w.revision,grades}),/punten|bereik|correcte/i);
 await assert.rejects(api.activity('outsider','question',{id,part:0}),/toegewezen/);await assert.rejects(api.activity('invalid','question',{id,part:0}),/Log/);
 }finally{await db.close();}
});

test('Guided glass evidence, duplicate lines, save retries and partial submission use one point per correct item',async()=>{
 const {db,ids}=await createStageDB();try{
  const api=await install(db,ids),id=randomUUID(),C=require('../games/rechten/rechtenwereld/glasatelier/core.js');
  await api.rpc('teacher','create',{id,title:'Gedeeltelijk is ook werk',parts:[{kind:'glass',points:10},{kind:'clay',points:5,count:10,speed:5},{kind:'rights',points:10,count:10,skills:['point']}]});
  await api.rpc('teacher','publish',{id,revision:0,students:[ids.alex,ids.sam]});
  const draft=C.initial();draft.pattern='zonneroos';const d=draft.drafts.zonneroos;d.count=6;d.done=true;
  d.history=C.PATTERNS.find(p=>p.id==='zonneroos').lines.map((l,count)=>({count,points:[{x:0,y:l.b},{x:1,y:l.a+l.b}]}));
  const packet={id,part:0,revision:0,draft,done:true,event:randomUUID()};let x=await api.rpc('alex','glass_save',packet);
  assert.equal(x.work.parts[0].done,true);assert.equal(x.work.parts[0].saved_lines,6);
  const revision=x.work.revision;assert.equal((await api.rpc('alex','glass_save',packet)).work.revision,revision,'lost acknowledgement retry is idempotent');
  // Neither a forged total nor pending draft answers count as a scored answer.
  await api.rpc('alex','rights_draft',{id,part:2,index:0,draft:{correct:true,score:10}});
  x=await api.rpc('alex','submit',{id,grades:[100,100,100],score:300});assert.deepEqual(x.work.grades,[6,0,0]);assert.equal(x.work.result.total,6);assert.equal(x.work.result.maximum,26);assert.equal(x.work.result.parts[2].items.filter(x=>x.answered).length,0);
  assert.deepEqual((await api.rpc('alex','submit',{id})).work.result,x.work.result);assert.deepEqual((await api.rpc('alex','get',{id})).work.result,x.work.result);
  const empty=await api.rpc('sam','submit',{id});assert.equal(empty.work.result.total,0);assert.deepEqual(empty.work.grades,[0,0,0]);
  const score=async draft=>(await db.query('select axioma_private.os_task_glass_result($1::jsonb) r',[JSON.stringify(draft)])).rows[0].r;
  for(const pattern of C.PATTERNS){const sample=C.initial();sample.pattern=pattern.id;const dd=sample.drafts[pattern.id];dd.count=pattern.lines.length;dd.accepted=pattern.lines.map((l,count)=>{const pts=[];for(let x=-4;x<=4&&pts.length<2;x++)for(let y=-4;y<=4&&pts.length<2;y++)if(Math.abs(C.signed(l,{x,y}))<1e-9)pts.push({x,y});return {count,points:pts};});assert.equal((await score(sample)).score,pattern.lines.length,pattern.id);}
  const forged=C.initial();forged.drafts.zonneroos.count=6;assert.equal((await score(forged)).score,0,'count alone is not mathematical evidence');
  forged.drafts.zonneroos.history=[{count:0,points:[{x:0,y:0},{x:0,y:0}]},{count:1,points:[{x:0,y:0},{x:2,y:2}]}];assert.equal((await score(forged)).score,0,'same points and incorrect lines do not count');
  assert.equal((await score({mode:'design',free:{lines:[{type:'function',a:1,b:0},{type:'function',a:1,b:0},{type:'vertical',x:2},{type:'function',a:0,b:200},{type:'function',a:'x',b:0}]}})).score,2,'only distinct valid lines intersecting the glass count');
  // The current native restore path migrates old history to durable accepted evidence.
  const restored=C.restore(draft);restored.drafts.zonneroos.history=[];assert.equal((await score(restored)).score,6);
  // Undo drops evidence for the removed line; reloading cannot resurrect its point.
  restored.drafts.zonneroos.history=[{count:5,points:[null,null]}];C.undo(restored.drafts.zonneroos);assert.equal((await score(C.restore(restored))).score,5);
 }finally{await db.close();}
});

test('A partly played series counts hits and native correct answers, never misses, late shots or unfinished drafts',async()=>{
 const {db,ids}=await createStageDB();try{
  const api=await install(db,ids),id=randomUUID(),parts=[{kind:'clay',points:5,count:5,speed:3},{kind:'rights',points:10,count:3,skills:['point']}];
  await api.rpc('teacher','create',{id,title:'Deels gemaakt',parts});await api.rpc('teacher','publish',{id,revision:0,students:[ids.alex]});await api.rpc('alex','clay_start',{id,part:0});
  for(let i=0;i<3;i++){
   await db.query("update axioma_private.os_task_work set parts=jsonb_set(parts,'{0,next_at}',to_jsonb((clock_timestamp()-make_interval(secs=>$2))::text)) where task_id=$1",[id,i===1?5:1]);
   const q=(await db.query("select axioma_private.clay_question_v2(md5($1||':0')::uuid,$2) q",[id,i])).rows[0].q;
   const wrong=q.choices.find(v=>Math.abs(v.n/v.d-q.n/q.d)>1e-8);
   await api.rpc('alex','clay_answer',{id,part:0,index:i,event:randomUUID(),answer:i===2?wrong.n/wrong.d:q.n/q.d,correct:true,score:999});
  }
  const {spec}=await api.activity('alex','question',{id,part:1}),m=R.active(Game.generate(spec));
  await api.activity('alex','answer',{id,part:1,index:0,event:randomUUID(),answer:{steps:[{phase:m.phase,values:{answer:m.task.options.findIndex(o=>JSON.stringify(o)===JSON.stringify(m.task.target))}}]}});
  await api.rpc('alex','rights_draft',{id,part:1,index:1,draft:{correct:true}});
  const x=await api.rpc('alex','submit',{id});assert.deepEqual(x.work.grades,[1,1]);assert.equal(x.work.result.total,2);assert.equal(x.work.result.maximum,8);assert(x.work.result.parts.every(p=>!p.done));assert.equal(x.work.result.parts[0].items.filter(x=>x.correct).length,1);assert.equal(x.work.result.parts[0].items.filter(x=>!x.answered).length,2);assert.equal(x.work.result.parts[1].items.filter(x=>!x.answered).length,2);
 }finally{await db.close();}
});
