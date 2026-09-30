// Any authenticated participant can finish grading; the teacher tab is not required.
export function createHandler({url,anonKey,serviceKey,policy,fetcher=fetch}){
 const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 async function rpc(name,action,data,bearer,key){const r=await fetcher(`${url}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:key,Authorization:bearer,'Content-Type':'application/json'},body:JSON.stringify({p_action:action,p_data:data})});const body=await r.json();if(!r.ok)throw Error(body.message||'De klasbattle is tijdelijk niet bereikbaar.');return body;}
 return async req=>{
  if(req.method==='OPTIONS')return new Response(null,{headers});
  if(req.method!=='POST')return reply({error:'Alleen POST.'},405);
  const bearer=req.headers.get('Authorization')||'';if(!bearer.startsWith('Bearer '))return reply({error:'Log eerst in.'},401);
  try{
   if(Number(req.headers.get('content-length'))>25000)return reply({error:'Verzoek te groot.'},413);
   const raw=await req.text();if(raw.length>25000)return reply({error:'Verzoek te groot.'},413);const body=JSON.parse(raw);
   if(!['create','join','state','start','next','submit','end_round','close','leave'].includes(body.action))return reply({error:'Ongeldige klasactie.'},400);
   const auth=await fetcher(`${url}/auth/v1/user`,{headers:{apikey:anonKey,Authorization:bearer}});if(!auth.ok)return reply({error:'Log opnieuw in.'},401);
   const user=await auth.json();if(!user.id)return reply({error:'Log opnieuw in.'},401);
   let state=await rpc('axioma_game_class',body.action,{...body.data,game:'vectoren',...(body.action==='create'?{server_grading:true}:{})},bearer,anonKey);
   if(state.phase==='grading'){
    const data={id:state.id,user_id:user.id},trusted=`Bearer ${serviceKey}`;
    const work=await rpc('axioma_vector_class_worker','work',data,trusted,serviceKey);
    if(work.phase==='grading')await rpc('axioma_vector_class_worker','resolve',{...data,round:work.round,grades:work.submissions.map(s=>({user_id:s.user_id,correct:!s.skipped&&policy.grade(work.task,s.answer)}))},trusted,serviceKey);
    state=await rpc('axioma_game_class','state',{id:state.id,game:'vectoren'},bearer,anonKey);
   }
   delete state.submissions;return reply(state);
  }catch(e){return reply({error:e instanceof SyntaxError?'Ongeldig verzoek.':e.message},400);}
 };
}
