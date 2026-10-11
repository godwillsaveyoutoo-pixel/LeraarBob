'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{createFixture}=require('./helpers/rechten-entry-fixture.cjs'),{seed}=require('./helpers/battle-report-fixture.cjs');
test('All battle stores provide durable own-only results and safe terminal reports',async()=>{
 const f=await createFixture();try{
  const rooms=await seed(f);
  for(const room of rooms){
   const input={p_provider:room.provider,p_id:room.id};const response=await f.invoke('alex','axioma_class_battle_report',input);assert.equal(response.error,null,JSON.stringify(response));const r=response.data;assert.equal(r.alias,'alex');assert.equal(r.game,room.game);assert.equal(r.id,room.id);
   assert(!JSON.stringify(r).includes(f.ids.sam));
   if(room.provider==='class'){assert.deepEqual(r.items.map(x=>x.status),['correct','incorrect','ungraded','unanswered','not-started']);assert.equal(r.items.reduce((s,x)=>s+x.points,0),870);}
   if(room.provider==='numbers'){assert.deepEqual(r.items.map(x=>x.status),['correct','incorrect','unanswered']);assert.equal(r.items[0].xp,10);}
   if(room.provider==='clay'){assert.equal(r.correct,6);assert.equal(r.xp,10);assert.equal(r.winner,false);}
   const other=await f.invoke('outsider','axioma_class_battle_report',input);assert(other.error);const teacher=await f.invoke('teacher','axioma_class_battle_report',input);assert(teacher.error,'An observing teacher cannot download a pupil report as their own');
   const list=(await f.invoke('alex','axioma_class_battle_report',{p_provider:room.provider})).data;assert(list.some(x=>x.id===room.id));
  }
  const ownSam=await f.invoke('sam','axioma_class_battle_report',{p_provider:'class',p_id:rooms[0].id});assert.equal(ownSam.data.alias,'sam');assert.equal(ownSam.data.items[0].points,999);
  await f.classroom.db.query("update axioma_private.vector_class_rooms set phase='question' where id=$1",[rooms[0].id]);assert((await f.invoke('alex','axioma_class_battle_report',{p_provider:'class',p_id:rooms[0].id})).error);
  for(const db of [f.classroom.db,f.numbers.db]){
   const p=await db.query("select has_function_privilege('anon','public.axioma_class_battle_report(text,uuid)','EXECUTE') anon,has_function_privilege('authenticated','public.axioma_class_battle_report(text,uuid)','EXECUTE') member");assert.equal(p.rows[0].anon,false);assert.equal(p.rows[0].member,true);
   await assert.rejects(db.transaction(async tx=>{await tx.exec('set local role authenticated');await tx.query('select public.axioma_class_battle_report($1,$2)',['class',rooms[1].id]);}),/Meld je aan/);
   const priv=await db.query("select has_table_privilege('authenticated','axioma_private.vector_class_answers','SELECT') allowed");assert.equal(priv.rows[0].allowed,false);
  }
 }finally{await f.close();}
});
