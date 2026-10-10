const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../games/bewerkingen-trainer/core.js'),{server,ids}=require('./helpers/numbers-session-db.cjs');
const migration=fs.readFileSync('supabase/migrations/20261009202541_numbers_scientific_generator_versions.sql','utf8');
const config={skills:['scientific'],level:2,count:1,seconds:180,generatorVersion:2};
const answer=state=>C.generate(state.spec.skill,state.spec.seed,state.spec.level,state.spec.variant,state.spec.generatorVersion??1).answer;
const send=(state,value)=>({id:state.id,round:state.round,request_id:crypto.randomUUID(),value,generatorVersion:2});

test('new scientific questions work through the real SQL/Edge in all four online workforms and all three levels',async()=>{
 const {db,call}=await server();try{
  assert.deepEqual((await call('alex','summary',{generatorVersion:2})).generatorVersions,[1,2]);
  for(const audience of ['duo','class'])for(const activity of ['learn','battle'])for(const level of [0,1,2]){
   const host=audience==='class'?'teacher':'alex';let s=await call(host,'create',{...config,audience,activity,level});
   assert.equal(s.generatorVersion,2,'the lobby already advertises the required generator');
   if(audience==='class')await call('alex','join',{code:s.code,generatorVersion:2});
   await call('sam','join',{code:s.code,generatorVersion:2});
   s=await call(host,'start',{id:s.id,generatorVersion:2});assert.equal(s.spec.generatorVersion,2);
   const value=answer(s);
   let a=await call('alex','submit',send(s,value));
   assert.equal(a.mine.attempts,1);if(activity==='learn'){assert.equal(a.mine.correct,true);assert.equal(a.mine.xp,10);}else assert.equal(a.mine.correct,undefined);
   const request=send(s,value);let b=await call('sam','submit',request);assert.equal(b.mine.correct,true);assert.equal(b.mine.xp,10);
   b=await call('sam','submit',request);assert.equal(b.mine.attempts,1);assert.equal(b.mine.xp,10,'replaying the request cannot credit more XP');
   if(activity==='learn'&&audience==='class')await call(host,'end',{id:s.id,generatorVersion:2});
   if(activity==='learn'&&audience==='duo'){await call('alex','approve',{id:s.id,generatorVersion:2});await call('sam','approve',{id:s.id,generatorVersion:2});}
   s=await call(host,'next',{id:s.id,generatorVersion:2});assert.equal(s.phase,'finished');
  }
 }finally{await db.close();}
});

test('old clients cannot join, render, pace or answer v2 rooms, and rejection creates no member, attempt or XP',async()=>{
 const {db,call,rpc}=await server();try{
  let s=await call('alex','create',{...config,audience:'duo',activity:'learn'});
  await assert.rejects(call('sam','join',{code:s.code}),/Vernieuw Getallenwereld/);
  await assert.rejects(rpc('sam','join',{code:s.code}),/Vernieuw Getallenwereld/,'the public RPC itself guards enrollment');
  assert.equal((await db.query('select count(*) count from axioma_private.numbers_members where room_id=$1 and user_id=$2',[s.id,ids.sam])).rows[0].count,0);
  await call('sam','join',{code:s.code,generatorVersion:2});
  await assert.rejects(call('alex','start',{id:s.id}),/Vernieuw Getallenwereld/);
  s=await call('alex','start',{id:s.id,generatorVersion:2});
  await assert.rejects(call('sam','state',{id:s.id}),/Vernieuw Getallenwereld/);
  await assert.rejects(call('sam','submit',{...send(s,answer(s)),generatorVersion:undefined,client_generator_version:2}),/Vernieuw Getallenwereld/,'untrusted raw SQL-capability fields are overwritten by the handler');
  assert.equal((await db.query('select count(*) count from axioma_private.numbers_answers where room_id=$1',[s.id])).rows[0].count,0);
  await assert.rejects(call('outsider','state',{id:s.id,generatorVersion:2}),/Je neemt niet deel/);
  const legacy=C.generate(s.spec.skill,s.spec.seed,s.spec.level,s.spec.variant).answer;
  assert.notEqual(legacy,answer(s));let result=await call('sam','submit',send(s,legacy));assert.equal(result.mine.correct,false);assert.equal(result.mine.xp,0);
  result=await call('sam','submit',send(s,answer(s)));assert.equal(result.mine.correct,true);assert.equal(result.mine.xp,5);
  const replay=await call('sam','state',{id:s.id,generatorVersion:2});assert.deepEqual(replay.spec,s.spec);assert.equal(replay.mine.value,answer(s));
  await call('sam','leave',{id:s.id});
  await call('alex','close',{id:s.id});
  const rights=(await db.query("select has_function_privilege('service_role','public.axioma_numbers_session(uuid,text,jsonb)','execute') service,has_function_privilege('authenticated','public.axioma_numbers_session(uuid,text,jsonb)','execute') member,has_function_privilege('anon','public.axioma_numbers_session(uuid,text,jsonb)','execute') guest,has_function_privilege('service_role','axioma_private.numbers_session_v1(uuid,text,jsonb)','execute') bypass")).rows[0];
  assert.deepEqual(rights,{service:true,member:false,guest:false,bypass:false});
 }finally{await db.close();}
});

test('an updated Edge on an unmigrated database safely creates and grades version 1 for a version 2 client',async()=>{
 const {db,call}=await server({generatorVersions:false});try{
  const cap=await call('alex','summary',{generatorVersion:2});assert.deepEqual(cap.generatorVersions,[1]);
  let s=await call('alex','create',{...config,audience:'duo',activity:'learn'});await call('sam','join',{code:s.code,generatorVersion:2});s=await call('alex','start',{id:s.id,generatorVersion:2});
  assert(!Object.hasOwn(s.spec,'generatorVersion'));const value=answer(s),result=await call('sam','submit',send(s,value));assert.equal(result.mine.correct,true);assert.equal(result.mine.xp,10);
 }finally{await db.close();}
});

test('migration preserves a live historical room, old cached RPC callers, saved learner evidence and catalog settings',async()=>{
 const {db,call,rpc}=await server({generatorVersions:false});try{
  let before=await call('teacher','create',{...config,generatorVersion:undefined,activity:'learn',audience:'class'});await call('alex','join',{code:before.code});before=await call('teacher','start',{id:before.id});
  const first=await call('alex','submit',send(before,answer(before)));assert.equal(first.mine.xp,10);
  // Prime the old public SQL delegate's cached plan before its callee is renamed.
  await rpc('teacher','state',{id:before.id});
  await db.exec("create table public.axioma_games(id text primary key,title text,theme text,game_type text,progress_type text,teacher_visible boolean,active boolean,sort_order integer,metadata jsonb,updated_at timestamptz);");
  await db.query("insert into public.axioma_games values('getallenwereld','My title','Getallen','learn','levels',true,false,69,$1,now())",[JSON.stringify({progress_total:15,href:'games/getallenwereld/',future:'kept'})]);
  const progress={completed:['machten-product','wortels-vereenvoudigen'],total:15,storage:{'leraarbob.getallenwereld.v1':JSON.stringify({version:1,entries:{old:{done:['1:0']}},future:'kept'})}};
  await db.query('insert into public.axioma_game_progress values($1,$2,$3)',[ids.alex,'getallenwereld',JSON.stringify(progress)]);
  const room=(await db.query('select deck from axioma_private.numbers_rooms where id=$1',[before.id])).rows[0];
  await db.exec(migration);
  assert.deepEqual((await db.query('select deck from axioma_private.numbers_rooms where id=$1',[before.id])).rows[0],room);
  const after=await call('alex','state',{id:before.id,generatorVersion:2});assert.deepEqual(after.spec,before.spec);assert.equal(after.generatorVersion,1);assert.equal(after.mine.xp,10);assert.equal(after.mine.value,answer(before));
  const metadata=(await db.query("select title,active,metadata from public.axioma_games where id='getallenwereld'")).rows[0];assert.equal(metadata.title,'My title');assert.equal(metadata.active,false);assert.deepEqual(metadata.metadata,{progress_total:19,href:'games/getallenwereld/',future:'kept'});
  assert.deepEqual((await db.query('select state from public.axioma_game_progress where user_id=$1',[ids.alex])).rows[0].state,progress);
  // An old Edge/client still creates legacy rooms after the SQL guard is added.
  const old=await call('alex','create',{...config,generatorVersion:undefined,activity:'learn',audience:'duo'});assert.equal(old.generatorVersion,1);await call('sam','join',{code:old.code});
  const newer=await call('teacher','create',{...config,activity:'learn',audience:'class'});await assert.rejects(rpc('outsider','join',{code:newer.code}),/Vernieuw Getallenwereld/);
  assert.equal((await db.query('select count(*) count from axioma_private.numbers_members where room_id=$1',[newer.id])).rows[0].count,0,'public cached delegate cannot bypass the new prejoin guard');
 }finally{await db.close();}
});

test('the generated Edge arithmetic reproduces both browser versions exactly',async()=>{
 const worker=(await import('../supabase/functions/numbers-session/core.js')).default;
 assert.equal(worker.SCIENTIFIC_VERSION,C.SCIENTIFIC_VERSION);
 for(const version of [1,2])for(const level of [0,1,2])for(let seed=0;seed<100;seed++)for(const variant of [0,1,2,3]){
  const task=C.generate('scientific',seed,level,variant,version),serverTask=worker.generate('scientific',seed,level,variant,version);assert.deepEqual(serverTask,task);assert(worker.check(serverTask,task.answer).ok);
 }
});

test('a partially updated Edge with an old arithmetic bundle cannot create or misgrade version 2',async()=>{
 const stale={...C,SCIENTIFIC_VERSION:undefined,generate:(skill,seed,level,variant)=>C.generate(skill,seed,level,variant)};
 const {db,call,rpc}=await server({core:stale});try{
  assert.deepEqual((await call('alex','summary',{generatorVersion:2})).generatorVersions,[1]);
  let old=await call('alex','create',{...config,audience:'duo',activity:'learn'});assert.equal(old.generatorVersion,1);
  // Reproduce a room made by the complete new release before its Edge bundle
  // was accidentally rolled back. The server must refuse to grade that room.
  let s=await rpc('teacher','create',{activity:'learn',audience:'class',seconds:180,client_generator_version:2,deck:[{skill:'scientific',seed:37,level:2,variant:0,generatorVersion:2}]});
  await call('alex','join',{code:s.code,generatorVersion:2});s=await call('teacher','start',{id:s.id,generatorVersion:2});
  await assert.rejects(call('alex','submit',send(s,answer(s))),/bijgewerkte Getallenwereld/);
  assert.equal((await db.query('select count(*) count from axioma_private.numbers_answers where room_id=$1',[s.id])).rows[0].count,0);
 }finally{await db.close();}
});
