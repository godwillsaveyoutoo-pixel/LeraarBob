const fs=require('node:fs');
const policy=require('../../shared/multiplayer/logica-battle-policy.cjs');
async function provider(db,ids,kind){
 const classMode=kind==='class';
 for(const file of classMode?['20261005171003_algebra_systems_class_battle.sql','20261011142721_logica_class_battle.sql']:['20261011142724_logica_duo_battle.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
 let queue=Promise.resolve();
 function raw(user,role,name,action,data){
  const job=queue.catch(()=>{}).then(()=>db.transaction(async tx=>{
   await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[ids[user]||'']);await tx.exec('set local role '+role);
   return(await tx.query(`select public.${name}($1,$2::jsonb) result`,[action,JSON.stringify(data)])).rows[0].result;
  }));queue=job;return job;
 }
 const {createHandler}=await import(classMode?'../../supabase/functions/algebra-class/handler.js':'../../supabase/functions/rechten-duo/handler.js');
 const config=classMode?{game:'logicawereld',worker:'axioma_logica_class_worker'}:{rpcName:'axioma_logica_duo',worker:'axioma_logica_duo_worker'};
 const settings={url:'https://logica.test',anonKey:'anon',serviceKey:'service',policy,...config,fetcher:async(url,options)=>{
  const user=options.headers.Authorization.slice(7);
  if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify(ids[user]?{id:ids[user]}:{}),{status:ids[user]?200:401});
  const name=url.split('/').pop(),args=JSON.parse(options.body);
  try{return new Response(JSON.stringify(await raw(user,user==='service'?'service_role':'authenticated',name,args.p_action,args.p_data)));}catch(e){return new Response(JSON.stringify({message:e.message}),{status:400});}
 }};
 const handler=createHandler(settings);
 async function call(user,action,data={}){const response=await handler(new Request('https://logica.test',{method:'POST',headers:{Authorization:'Bearer '+user},body:JSON.stringify({action,data:{tab_id:ids[user],...data}})}));const result=await response.json();if(!response.ok)throw Error(result.error);return result;}
 const algebraHandler=classMode?createHandler({...settings,game:'algebra',worker:'axioma_algebra_class_worker',policy:require('../../shared/multiplayer/algebra-class-policy.cjs')}):null;
 async function algebraCall(user,action,data={}){const response=await algebraHandler(new Request('https://logica.test',{method:'POST',headers:{Authorization:'Bearer '+user},body:JSON.stringify({action,data})}));const result=await response.json();if(!response.ok)throw Error(result.error);return result;}
 return {call,raw,handler,algebraCall};
}
module.exports={provider};
