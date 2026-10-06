const fs=require('node:fs');
const {createDB}=require('./vector-class-db.cjs');
const policy=require('../../shared/multiplayer/rechten-online-policy.cjs');
async function createStageDB(){
 const {db,rpc,ids}=await createDB();
 await db.exec('create role service_role');
 await db.exec('create table public.axioma_games(id text primary key,title text,theme text,game_type text,progress_type text,teacher_visible boolean,active boolean,sort_order integer,metadata jsonb,updated_at timestamptz)');
 for(const file of ['20260929235623_rechten_class_server_grading.sql','20260930003138_vector_kahoot_server.sql','20260930163951_algebra_class_battle.sql','20261001060102_bewerkingen_trainer.sql','20261006201006_lesson_stage.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
 await db.exec('alter table public.axioma_profiles add column class_code text;create table axioma_private.game_invitations(id uuid primary key,sender_id uuid,recipient_id uuid,status text,expires_at timestamptz)');
 await db.exec(fs.readFileSync('supabase_clay_groups.sql','utf8'));await db.exec(fs.readFileSync('supabase_clay_mixed_questions.sql','utf8'));
 await db.exec(fs.readFileSync('supabase/migrations/20261006202818_lesson_live_follow.sql','utf8'));
 let queue=Promise.resolve();
 function lesson(user,action,data={}){const task=queue.catch(()=>{}).then(()=>db.transaction(async tx=>{await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[ids[user]||'']);await tx.exec('set local role authenticated');return(await tx.query('select public.axioma_lesson_stage($1,$2::jsonb) result',[action,JSON.stringify(data)])).rows[0].result;}));queue=task;return task;}
 const worker=(action,data)=>db.transaction(async tx=>{await tx.exec('set local role service_role');return(await tx.query('select public.axioma_rechten_class_worker($1,$2) result',[action,JSON.stringify(data)])).rows[0].result;});
 const {createHandler}=await import('../../supabase/functions/rechten-class/handler.js');
 const handler=createHandler({url:'https://stage.test',anonKey:'anon',serviceKey:'server',policy,fetcher:async(url,opts)=>{
  const user=opts.headers.Authorization.slice(7);if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify(ids[user]?{id:ids[user]}:{}),{status:ids[user]?200:401});
  const {p_action:action,p_data:data}=JSON.parse(opts.body);try{return new Response(JSON.stringify(url.endsWith('_worker')?await worker(action,data):await rpc(user,action,data,'axioma_game_class')));}catch(e){return new Response(JSON.stringify({message:e.message}),{status:400});}
 }});
 async function battle(user,action,data={}){const response=await handler(new Request('https://stage.test',{method:'POST',headers:{Authorization:'Bearer '+user},body:JSON.stringify({action,data})}));const result=await response.json();if(!response.ok)throw Error(result.error);return result;}
 return {db,ids,lesson,battle};
}
module.exports={createStageDB};
