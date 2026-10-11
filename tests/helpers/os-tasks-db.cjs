const fs=require('node:fs'),path=require('node:path');
async function install(db,ids){
 await db.exec(fs.readFileSync(path.resolve(__dirname,'../../supabase/migrations/20261011121227_os_composite_tasks.sql'),'utf8'));
 let queue=Promise.resolve();
 function query(user,role,name,action,data){const p=queue.catch(()=>{}).then(()=>db.transaction(async tx=>{await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[ids[user]||'']);await tx.exec('set local role '+role);return(await tx.query('select public.'+name+'($1,$2::jsonb) result',[action,JSON.stringify(data||{})])).rows[0].result;}));queue=p;return p;}
 const rpc=(user,action,data)=>query(user,'authenticated','axioma_os_tasks',action,data);
 const worker=(action,data)=>query(null,'service_role','axioma_os_task_worker',action,data);
 const {createHandler}=await import('../../supabase/functions/task-activity/handler.js');
 const handler=createHandler({url:'https://tasks.test',anonKey:'anon',serviceKey:'trusted',policy:require('../../shared/multiplayer/rechten-online-policy.cjs'),fetcher:async(url,opts)=>{
  const who=opts.headers.Authorization.slice(7);if(url.endsWith('/user'))return new Response(JSON.stringify(ids[who]?{id:ids[who]}:{}),{status:ids[who]?200:401});
  if(who!=='trusted')throw Error('Worker token');const q=JSON.parse(opts.body);try{return new Response(JSON.stringify(await worker(q.p_action,q.p_data)));}catch(e){return new Response(JSON.stringify({message:e.message}),{status:400});}
 }});
 async function activity(user,action,data){const r=await handler(new Request('https://tasks.test',{method:'POST',headers:{Authorization:'Bearer '+user},body:JSON.stringify({action,data})}));const x=await r.json();if(!r.ok)throw Error(x.error);return x;}
 return {rpc,activity,worker};
}
module.exports={install};
