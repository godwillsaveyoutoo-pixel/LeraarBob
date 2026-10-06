const assert=require('node:assert/strict');const {createStageDB}=require('./helpers/lesson-stage-db.cjs');const {deck}=require('../lessons/rechten-arbeid/lesson.js');
(async()=>{const {db,lesson,battle,ids}=await createStageDB();try{
 await assert.rejects(lesson('alex','create',{deck}),/leerkracht/);const s=await lesson('teacher','create',{deck}),id=s.room;
 let r=await battle('teacher','state',{id});assert.equal(r.total,20);assert.equal(r.phase,'lobby');assert.equal((await lesson('teacher','create',{deck})).room,id);
 await assert.rejects(lesson('outsider','state',{id}),/niet deel/);await battle('alex','join',{code:r.code});await battle('sam','join',{code:r.code});
 await assert.rejects(lesson('alex','open_poll',{id}),/leerkracht/);
 const poll={id,poll:'eigen-werk',question:'Zelf gemaakt?',options:['Ja','Neen'],anonymous:true};await lesson('teacher','open_poll',poll);
 await assert.rejects(lesson('alex','vote',{id,poll:poll.poll,choice:4}),/Ongeldige keuze/);await assert.rejects(lesson('teacher','vote',{id,poll:poll.poll,choice:0}),/stemt niet/);await assert.rejects(lesson('alex','vote',{id,poll:'stale',choice:0}),/niet actief/);
 await lesson('alex','vote',{id,poll:poll.poll,choice:0});await lesson('alex','vote',{id,poll:poll.poll,choice:1});await lesson('sam','vote',{id,poll:poll.poll,choice:1});
 assert.equal((await lesson('teacher','state',{id})).poll.counts,null);assert.equal((await lesson('alex','state',{id})).poll.voted,true);
 let state=await lesson('teacher','close_poll',{id});assert.deepEqual(state.poll.counts,[1,1]);assert.equal(state.poll.named,null);
 assert.equal((await db.query('select count(*)::int n from axioma_private.lesson_named_answers')).rows[0].n,0);
 await lesson('teacher','open_poll',poll);assert.equal((await lesson('teacher','state',{id})).poll.closed,true);
 await lesson('teacher','open_poll',{...poll,poll:'named',anonymous:false});await lesson('alex','vote',{id,poll:'named',choice:1});state=await lesson('teacher','close_poll',{id});assert.equal(state.poll.named[0].alias,'alex');assert.equal((await lesson('alex','state',{id})).poll.named,null);
 assert.deepEqual(state.history.find(p=>p.id==='eigen-werk').counts,[1,1]);await assert.rejects(lesson('sam','vote',{id,poll:'named',choice:0}),/gesloten/);
 await lesson('teacher','mode',{id,mode:'battle'});r=await battle('teacher','start',{id});
 await assert.rejects(lesson('alex','end_round',{id}),/leerkracht/);await assert.rejects(lesson('teacher','open_poll',poll),/battlevraag/);
 for(let i=0;i<20;i++){
  assert.equal(r.round,i);let answer={steps:[]};if(i===0){const G=require('../games/rechten/rechtenwereld/battle-config.js'),R=require('../games/rechten/rechtenwereld/mission-runtime.js'),{fill}=require('./helpers/rechten-question-fixtures.cjs'),m=R.active(fill(G.generate(r.spec)));answer={steps:[{phase:m.phase,values:m.values}]};}
  await battle('alex','submit',{id,round:i,answer,skipped:i!==0});await lesson('teacher','end_round',{id});r=await battle('teacher','state',{id});assert.equal(r.phase,'results');r=await battle('teacher','next',{id});
 }
 assert.equal(r.phase,'finished');state=await lesson('teacher','state',{id});assert.equal(state.summary.reduce((a,x)=>a+x.opportunities,0),40);assert.equal(state.summary.reduce((a,x)=>a+x.answered,0),20);assert.equal(state.summary.reduce((a,x)=>a+x.correct,0),1);
 const perms=(await db.query("select has_function_privilege('anon','public.axioma_lesson_stage(text,jsonb)','execute') anon,has_table_privilege('authenticated','axioma_private.lesson_receipts','select') receipts,has_table_privilege('authenticated','axioma_private.lesson_named_answers','select') answers")).rows[0];assert.deepEqual(perms,{anon:false,receipts:false,answers:false});
 console.log('PASS existing rooms + 20 native rounds, host/member isolation, anonymous aggregates, duplicate/revisit, named opt-in, early close, real skill totals, missing answers, private tables');
}finally{await db.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
