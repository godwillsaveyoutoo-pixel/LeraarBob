const fs=require('node:fs');
const policy=require('../../shared/multiplayer/algebra-duo-policy.cjs');
async function install(db,ids){
 await db.exec(fs.readFileSync('supabase/migrations/20261011192023_algebra_duo_battle.sql','utf8'));
 let queue=Promise.resolve();
 function raw(user,role,name,action,data){const job=queue.catch(()=>{}).then(()=>db.transaction(async tx=>{await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[ids[user]||'']);await tx.exec('set local role '+role);return(await tx.query(`select public.${name}($1,$2::jsonb) result`,[action,JSON.stringify(data)])).rows[0].result;}));queue=job;return job;}
 const {createHandler}=await import('../../supabase/functions/rechten-duo/handler.js');
 const handler=createHandler({url:'https://algebra.test',anonKey:'anon',serviceKey:'service',policy,rpcName:'axioma_algebra_duo',worker:'axioma_algebra_duo_worker',fetcher:async(url,options)=>{
  const user=options.headers.Authorization.slice(7);if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify(ids[user]?{id:ids[user]}:{}),{status:ids[user]?200:401});
  const args=JSON.parse(options.body);try{return new Response(JSON.stringify(await raw(user,user==='service'?'service_role':'authenticated',url.split('/').pop(),args.p_action,args.p_data)));}catch(e){return new Response(JSON.stringify({message:e.message}),{status:400});}
 }});
 async function call(user,action,data={}){const r=await handler(new Request('https://algebra.test',{method:'POST',headers:{Authorization:'Bearer '+user},body:JSON.stringify({action,data:{tab_id:ids[user],...data}})}));const result=await r.json();if(!r.ok)throw Error(result.error);return result;}
 return {call,raw,handler};
}
module.exports={install};
