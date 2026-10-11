// Native Edge handlers and SQL for the remaining shared classroom providers.
async function create(db,ids){
 const handlers={};
 for(const name of ['vector','bewerkingen']){
  const {createHandler}=await import('../../supabase/functions/'+name+'-class/handler.js');
  handlers[name+'-class']=createHandler({url:'https://fixture.test',anonKey:'anon',serviceKey:'service',policy:require('../../shared/multiplayer/'+name+'-class-policy.cjs'),fetcher:async(url,options)=>{
   const token=options.headers.Authorization.slice(7);if(url.endsWith('/user'))return new Response(JSON.stringify({id:ids[token]}),{status:ids[token]?200:401});
   const func=url.split('/').pop(),args=JSON.parse(options.body);if(!['axioma_game_class','axioma_vector_class_worker','axioma_bewerkingen_class_worker'].includes(func))throw Error('Unexpected function');
   try{const data=await raw(token,func,args.p_action,args.p_data);return new Response(JSON.stringify(data));}catch(e){return new Response(JSON.stringify({message:e.message}),{status:400});}
  }});
 }
 async function raw(user,name,action,data){return db.transaction(async tx=>{await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[ids[user]||'']);await tx.exec('set local role '+(user==='service'?'service_role':'authenticated'));return(await tx.query('select public.'+name+'($1,$2) result',[action,JSON.stringify(data)])).rows[0].result;});}
 async function call(user,provider,input){if(provider==='axioma_game_class')return raw(user,provider,input.p_action,input.p_data);const r=await handlers[provider](new Request('https://fixture.test',{method:'POST',headers:{Authorization:'Bearer '+user},body:JSON.stringify(input)}));const data=await r.json();if(!r.ok)throw Error(data.error);return data;}
 return {call};
}
module.exports={create};
