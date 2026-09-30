export function createHandler({url,anonKey,serviceKey,engine,fetcher=fetch}){
 const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
 const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 async function rpc(action,data){const r=await fetcher(url+'/rest/v1/rpc/axioma_rechten_learn_worker',{method:'POST',headers:{apikey:serviceKey,Authorization:'Bearer '+serviceKey,'Content-Type':'application/json'},body:JSON.stringify({p_action:action,p_data:data})});const body=await r.json();if(!r.ok)throw Error(body.message||'Verbinding onderbroken.');return body;}
 return async req=>{
  if(req.method==='OPTIONS')return new Response(null,{headers});if(req.method!=='POST')return reply({error:'Alleen POST.'},405);
  try{
   const bearer=req.headers.get('Authorization')||'';if(!bearer.startsWith('Bearer '))return reply({error:'Meld je eerst aan.'},401);
   const raw=await req.text();if(raw.length>20000)return reply({error:'Voorstel te groot.'},413);
   const {action,data={}}=JSON.parse(raw);
   const auth=await fetcher(url+'/auth/v1/user',{headers:{apikey:anonKey,Authorization:bearer}});if(!auth.ok)return reply({error:'Meld je opnieuw aan.'},401);
   const user=await auth.json();if(!user.id)return reply({error:'Meld je opnieuw aan.'},401);
   const params={...data,user_id:user.id};
   if(['catalog','invite','decline','cancel'].includes(action))return reply(await rpc(action,params));
   let board=await rpc(['create','join','accept'].includes(action)?action:'read',params);
   if(!['create','join','accept','state'].includes(action)){
    if(!/^[a-f0-9-]{36}$/i.test(data.request||''))throw Error('Verzoeknummer ontbreekt.');
    if(board.last_request!==data.request){
     if(data.version!==board.version)return reply({...engine.project(board,user.id),stale:true});
     const changed=engine.change(board,user.id,action,data);
     const saved=await rpc('commit',{...params,version:board.version,data:changed});
     if(saved.conflict)return reply({...engine.project(await rpc('read',params),user.id),stale:true});board=saved;
    }
   }
   return reply(engine.project(board,user.id));
  }catch(e){return reply({error:e instanceof SyntaxError?'Ongeldig verzoek.':e.message},400);}
 };
}
