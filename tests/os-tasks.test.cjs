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
 await assert.rejects(api.rpc('alex','submit',{id}),/elk onderdeel/);
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
 x=await api.rpc('alex','submit',{id});assert.equal(x.work.status,'submitted');const submitted=x.work.submitted_at;
 assert.equal((await api.rpc('alex','submit',{id})).work.submitted_at,submitted);
 await assert.rejects(api.rpc('alex','glass_save',{id,part:0,revision:x.work.revision,draft:{}}),/niet meer/);
 await assert.rejects(api.rpc('alex','review',{id,student:ids.alex,grades:[10,5,10]}),/leerkracht/);
 await assert.rejects(api.rpc('teacher','review',{id,student:ids.alex,revision:x.work.revision,grades:[11,5,0]}),/bereik/);
 await api.rpc('teacher','review',{id,student:ids.alex,revision:x.work.revision,grades:[8,5,0],feedback:'Mooi raam.'});x=await api.rpc('alex','get',{id});assert.equal(x.work.status,'reviewed');assert.deepEqual(x.work.grades,[8,5,0]);assert.equal(x.work.parts[2].answers[0].correct,false);
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
 await api.rpc('alex','submit',{id});w=(await api.rpc('alex','get',{id})).work;for(const grades of [null,undefined,[null]])await assert.rejects(api.rpc('teacher','review',{id,student:ids.alex,revision:w.revision,grades}),/punten|bereik/i);
 await assert.rejects(api.activity('outsider','question',{id,part:0}),/toegewezen/);await assert.rejects(api.activity('invalid','question',{id,part:0}),/Log/);
 }finally{await db.close();}
});
