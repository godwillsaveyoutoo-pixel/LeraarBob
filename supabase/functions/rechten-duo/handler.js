// Native fetch keeps the worker dependency-free. All clocks and scores live in SQL.
export function createHandler({url,anonKey,serviceKey,policy,fetcher=fetch}){
 const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 async function rpc(name,action,data,bearer,key){
  const r=await fetcher(`${url}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:key,Authorization:bearer,'Content-Type':'application/json'},body:JSON.stringify({p_action:action,p_data:data})});
  const body=await r.json();if(!r.ok)throw Error(body.message||'De battle is tijdelijk niet bereikbaar.');return body;
 }
 return async req=>{
  if(req.method==='OPTIONS')return new Response(null,{headers});
  if(req.method!=='POST')return reply({error:'Alleen POST.'},405);
  const bearer=req.headers.get('Authorization')||'';
  if(!bearer.startsWith('Bearer '))return reply({error:'Log eerst in.'},401);
  try{
   if(Number(req.headers.get('content-length'))>20000)return reply({error:'Antwoord te groot.'},413);
   const text=await req.text();if(text.length>20000)return reply({error:'Antwoord te groot.'},413);
   const body=JSON.parse(text);
   const auth=await fetcher(`${url}/auth/v1/user`,{headers:{apikey:anonKey,Authorization:bearer}});
   if(!auth.ok)return reply({error:'Log opnieuw in.'},401);
   const user=await auth.json();if(!user.id)return reply({error:'Log opnieuw in.'},401);
   let state=await rpc('axioma_rechten_duo',body.action,body.data||{},bearer,anonKey);
   if(state.id&&['waiting','resolving'].includes(state.phase)){
    const data={id:state.id,user_id:user.id};
    const work=await rpc('axioma_rechten_duo_worker','work',data,`Bearer ${serviceKey}`,serviceKey);
    if(work.phase==='prepare')await rpc('axioma_rechten_duo_worker','prepare',{...data,pool:policy.pool(work.a,work.b,work.world)},`Bearer ${serviceKey}`,serviceKey);
    if(work.phase==='resolve')await rpc('axioma_rechten_duo_worker','resolve',{...data,round:work.round,a:policy.grade(work.task,work.a),b:policy.grade(work.task,work.b)},`Bearer ${serviceKey}`,serviceKey);
    state=await rpc('axioma_rechten_duo','state',{id:state.id},bearer,anonKey);
   }
   return reply(state);
  }catch(e){return reply({error:e instanceof SyntaxError?'Ongeldig verzoek.':e.message},400);}
 };
}
