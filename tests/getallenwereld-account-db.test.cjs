const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createDB}=require('./helpers/rechten-progress-db.cjs');
test('Getallenwereld catalog and real save RPC keep students and Bewerkingentrainer separate',async()=>{
 const {db,save,as}=await createDB();try{
 await db.exec("alter table public.axioma_games add column title text,add column theme text,add column game_type text,add column teacher_visible boolean,add column sort_order integer,add column metadata jsonb default '{}',add column updated_at timestamptz;");
 const migration=fs.readdirSync('supabase/migrations').find(f=>f.endsWith('_getallenwereld_catalog.sql'));
 const sql=fs.readFileSync(path.join('supabase/migrations',migration),'utf8');await db.exec(sql);await db.exec(sql);
 const game=(await db.query("select * from public.axioma_games where id='getallenwereld'")).rows[0];assert.equal(game.game_type,'learn');assert.equal(game.metadata.progress_total,15);assert.equal(game.teacher_visible,true);
 await db.exec("insert into public.axioma_games(id,active,progress_type) values('bewerkingen-trainer',true,'levels');");
 const original={storage:{'leraarbob.bewerkingen.v1':'{"solved":["power-power"]}'},completed:['power-power'],total:16};
 const gw={storage:{'leraarbob.getallenwereld.v1':'{"getallenwereld":{"completed":["power-power"]}}'},completed:['power-power'],total:15};
 assert.equal((await save('alex',original,0,'bewerkingen-trainer')).status,'saved');assert.equal((await save('alex',gw,0,'getallenwereld')).status,'saved');assert.equal((await save('sam',{completed:[],total:15},0,'getallenwereld')).status,'saved');
 const a=await as('alex',"select game_id,state from public.axioma_game_progress order by game_id");assert.equal(a.length,2);assert.deepEqual(a.find(r=>r.game_id==='bewerkingen-trainer').state,original);assert.deepEqual(a.find(r=>r.game_id==='getallenwereld').state,gw);
 const s=await as('sam',"select game_id,state from public.axioma_game_progress");assert.equal(s.length,1);assert.deepEqual(s[0].state.completed,[]);assert.equal((await save('alex',gw,0,'getallenwereld')).status,'conflict');await assert.rejects(save('teacher',gw,0,'getallenwereld'),/leerling|profile|profiel|account/i);
 }finally{await db.close();}
});
