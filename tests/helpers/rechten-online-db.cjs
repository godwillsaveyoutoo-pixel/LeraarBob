const fs=require('node:fs'),path=require('node:path');
const {createDB:base}=require('./vector-class-db.cjs');
const policy=require('../../shared/multiplayer/rechten-online-policy.cjs');
async function createDB(){
 const {db,ids}=await base();
 await db.exec(`create role service_role;alter table public.axioma_profiles add column class_code text default 'TEST';create table public.axioma_game_progress(user_id uuid,game_id text,state jsonb,primary key(user_id,game_id));create table axioma_private.clay_members(user_id uuid,left_at timestamptz,seen_at timestamptz);`);
 const social=fs.readFileSync(path.resolve(__dirname,'../../supabase_platform_social.sql'),'utf8').split('create function axioma_private.can_join_naval')[0];await db.exec(social);
 await db.exec(fs.readFileSync(path.resolve(__dirname,'../../supabase/migrations/20260929235619_rechten_online_duo.sql'),'utf8'));
 let queue=Promise.resolve();
 function queryAs(user,role,name,action,data){const work=queue.catch(()=>{}).then(()=>db.transaction(async tx=>{
  await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[ids[user]||'']);await tx.exec('set local role '+role);
  return(await tx.query(`select public.${name}($1,$2::jsonb) as result`,[action,JSON.stringify(data)])).rows[0].result;
 }));queue=work;return work;}
 const raw=(user,action,data={})=>queryAs(user,'authenticated','axioma_rechten_duo',action,{tab_id:ids[user],...data});
 const worker=(user,action,data)=>queryAs(user,'service_role','axioma_rechten_duo_worker',action,{user_id:ids[user],...data});
 async function rpc(user,action,data={}){
  let s=await raw(user,action,data);
  if(s.id&&['waiting','resolving'].includes(s.phase)){
   const w=await worker(user,'work',{id:s.id});
   if(w.phase==='prepare')await worker(user,'prepare',{id:s.id,pool:policy.pool(w.a,w.b,w.world)});
   if(w.phase==='resolve')await worker(user,'resolve',{id:s.id,round:w.round,a:policy.grade(w.task,w.a),b:policy.grade(w.task,w.b)});
   s=await raw(user,'state',{id:s.id});
  }return s;
 }
 async function progress(user,skills){const missions={};const A=require('../../games/rechten/rechtenwereld/content/area-maps.js');for(const skill of skills)missions[skill]={world:Object.values(A.areas).find(w=>A.all(w).some(n=>n.key===skill)).id,completed:true};await db.query("insert into public.axioma_game_progress values($1,'rechten-trainer',$2) on conflict(user_id,game_id) do update set state=excluded.state",[ids[user],JSON.stringify({rechtenV2:{missions,events:[],settings:{}}})]);}
 async function start(skills=['slope']){const all=['delta','slope','slope_from_two_points','line_behavior','special_lines'];await progress('alex',all);await progress('sam',all);await raw('alex','lobby');await raw('sam','lobby');let s=await rpc('alex','invite',{target:ids.sam});s=await rpc('sam','accept',{id:s.id});await db.query('update axioma_private.rechten_duels set pool=$2 where id=$1',[s.id,JSON.stringify(skills)]);await rpc('alex','ready',{id:s.id});s=await rpc('sam','ready',{id:s.id});await db.query("update axioma_private.rechten_duels set started_at=clock_timestamp()-interval '1 second',deadline=clock_timestamp()+interval '75 seconds' where id=$1",[s.id]);return rpc('alex','state',{id:s.id});}
 return {db,ids,raw,worker,rpc,progress,start};
}
module.exports={createDB};
