const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),C=require('../../games/bewerkingen-trainer/core.js');
const {createDB,ids}=require('./vector-class-db.cjs');
async function server(){
 const {db}=await createDB();await db.exec("create table public.axioma_game_progress(user_id uuid,game_id text,state jsonb);create role service_role;grant usage on schema axioma_private to service_role;alter table public.axioma_profiles add column class_code text default '3A';");
 await db.exec(fs.readFileSync('supabase/migrations/20261005202025_numbers_learn_battle.sql','utf8'));
 const rpc=(user,action,data)=>db.transaction(async tx=>{await tx.exec('set local role service_role');return(await tx.query('select public.axioma_numbers_session($1,$2,$3) result',[ids[user],action,JSON.stringify(data)])).rows[0].result;});
 const {createHandler}=await import('../../supabase/functions/numbers-session/handler.js');
 const handler=createHandler({url:'https://test.invalid',anonKey:'anon',serviceKey:'server',core:C,fetcher:async(url,opts)=>{
  if(url.endsWith('/auth/v1/user')){const id=ids[opts.headers.Authorization.slice(7)];return new Response(JSON.stringify({id}),{status:id?200:401});}
  const b=JSON.parse(opts.body),user=Object.keys(ids).find(k=>ids[k]===b.p_actor);
  try{return new Response(JSON.stringify(await rpc(user,b.p_action,b.p_data)));}catch(e){return new Response(JSON.stringify({message:e.message}),{status:400});}
 }});
 const call=async(user,action,data={})=>{const r=await handler(new Request('https://test.invalid',{method:'POST',headers:{Authorization:'Bearer '+user},body:JSON.stringify({action,data})}));const b=await r.json();if(!r.ok)throw Error(b.error);return b;};
 return{db,call,rpc};
}

module.exports={server,ids};
