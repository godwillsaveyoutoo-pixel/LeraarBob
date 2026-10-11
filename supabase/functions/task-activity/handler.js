// Authenticated answers use the original native validator, never a client score.
export function createHandler({url,anonKey,serviceKey,policy,fetcher=fetch}){
 const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
 const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 async function worker(action,data){const r=await fetcher(url+'/rest/v1/rpc/axioma_os_task_worker',{method:'POST',headers:{apikey:serviceKey,Authorization:'Bearer '+serviceKey,'Content-Type':'application/json'},body:JSON.stringify({p_action:action,p_data:data})});const x=await r.json();if(!r.ok)throw Error(x.message||'Bewaren lukt momenteel niet.');return x;}
 return async req=>{
  if(req.method==='OPTIONS')return new Response(null,{headers});if(req.method!=='POST')return reply({error:'Alleen POST.'},405);
  try{
   const raw=await req.text();if(raw.length>40000)return reply({error:'Antwoord te groot.'},413);
   const {action,data={}}=JSON.parse(raw),bearer=req.headers.get('Authorization');
   if(!bearer?.startsWith('Bearer '))return reply({error:'Log eerst in.'},401);
   const auth=await fetcher(url+'/auth/v1/user',{headers:{apikey:anonKey,Authorization:bearer}});if(!auth.ok)return reply({error:'Log opnieuw in.'},401);const user=await auth.json();if(!user.id)return reply({error:'Log opnieuw in.'},401);
   if(!['question','answer'].includes(action))return reply({error:'Onbekende toetsactie.'},400);
   const safe={id:data.id,part:data.part,user:user.id,event:data.event},work=await worker('work',safe);
   if(work.receipt)return reply(work.receipt);if(action==='question')return reply(work);
   if(!Number.isInteger(data.index)||data.index!==work.spec.index)throw Error('Deze vraag is elders gewijzigd. Heropen je onderdeel.');
   return reply(await worker('commit',{...safe,index:data.index,answer:data.answer,correct:policy.grade(work.spec,data.answer)}));
  }catch(e){return reply({error:e instanceof SyntaxError?'Ongeldig antwoord.':e.message},400);}
 };
}
