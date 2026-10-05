const fs=require('node:fs');
const {createDB,ids}=require('./vector-class-db.cjs');
const nativePolicy=require('../../shared/multiplayer/algebra-class-policy.cjs');
async function createServer({policy=nativePolicy}={}){
 const {db,rpc}=await createDB();await db.exec('create role service_role');
 for(const file of ['20260929235623_rechten_class_server_grading.sql','20260930003138_vector_kahoot_server.sql','20260930163951_algebra_class_battle.sql','20261005161648_algebra_systems_class_battle.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
 const {createHandler}=await import('../../supabase/functions/algebra-class/handler.js');
 const worker=(action,data)=>db.transaction(async tx=>{await tx.exec('set local role service_role');return(await tx.query('select public.axioma_algebra_class_worker($1,$2) result',[action,JSON.stringify(data)])).rows[0].result;});
 const handler=createHandler({url:'https://test.invalid',anonKey:'anon',serviceKey:'server',policy,fetcher:async(url,opts)=>{
  const user=opts.headers.Authorization.slice(7);
  if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify(ids[user]?{id:ids[user]}:{}),{status:ids[user]?200:401});
  const {p_action:action,p_data:data}=JSON.parse(opts.body);
  try{if(url.endsWith('_worker')&&user!=='server')throw Error('service role only');const result=url.endsWith('_worker')?await worker(action,data):await rpc(user,action,data,'axioma_game_class');return new Response(JSON.stringify(result));}catch(e){return new Response(JSON.stringify({message:e.message}),{status:400});}
 }});
 let queue=Promise.resolve();
 const call=(user,action,data={})=>{const task=queue.catch(()=>{}).then(async()=>{const res=await handler(new Request('https://test.invalid',{method:'POST',headers:{Authorization:'Bearer '+user},body:JSON.stringify({action,data})}));const body=await res.json();if(!res.ok)throw Error(body.error);return body;});queue=task;return task;};
 return{db,rpc,call,worker,handler,ids};
}
module.exports={createServer};
