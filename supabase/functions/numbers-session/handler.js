export function createHandler({url,anonKey,serviceKey,core,fetcher=fetch}) {
 const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 return async req=>{
  if(req.method==='OPTIONS')return new Response(null,{headers});
  if(req.method!=='POST')return reply({error:'Alleen POST.'},405);
  try {
   const bearer=req.headers.get('Authorization')||'';
   if(!bearer.startsWith('Bearer '))return reply({error:'Meld je aan.'},401);
   const raw=await req.text();if(raw.length>12000)return reply({error:'Verzoek te groot.'},413);
   const {action,data={}}=JSON.parse(raw);
   if(!['create','join','state','start','next','end','close','leave','pulse','submit','report','approve','summary','overview'].includes(action))throw Error('Onbekende sessieactie.');
   const auth=await fetcher(url+'/auth/v1/user',{headers:{apikey:anonKey,Authorization:bearer}});
   if(!auth.ok)return reply({error:'Meld je opnieuw aan.'},401);
   const user=await auth.json();if(!user.id)return reply({error:'Meld je opnieuw aan.'},401);
   async function rpc(name,payload){
    const res=await fetcher(url+'/rest/v1/rpc/axioma_numbers_session',{method:'POST',headers:{apikey:serviceKey,Authorization:'Bearer '+serviceKey,'Content-Type':'application/json'},body:JSON.stringify({p_actor:user.id,p_action:name,p_data:payload})});
    const body=await res.json();if(!res.ok)throw Error(body.message||'Sessie tijdelijk niet bereikbaar.');return body;
   }
   let payload=data;
   if(action==='create'){
    const skills=[...new Set(data.skills||[])];
    if(!skills.length||skills.some(id=>!core.SKILLS.some(s=>s.id===id)))throw Error('Kies minstens één geldige vraagvorm.');
    const level=Number(data.level),count=Math.max(skills.length,Number(data.count));
    if(![0,1,2].includes(level)||!Number.isInteger(count)||count<1||count>30)throw Error('Controleer niveau en aantal.');
    const deck=Array.from({length:count},(_,i)=>({skill:skills[i%skills.length],seed:crypto.getRandomValues(new Uint32Array(1))[0],level,variant:i%4}));
    payload={activity:data.activity,audience:data.audience,participate:data.participate===true,seconds:Number(data.seconds)||180,deck};
   }
   if(action==='submit'){
    const work=await rpc('work',{id:data.id});
    if(!work.open)return reply(await rpc('state',{id:data.id}));
    if(work.round!==data.round)throw Error('De volgende opgave is al begonnen.');
    const task=core.generate(work.spec.skill,work.spec.seed,work.spec.level,work.spec.variant);
    const value=String(data.value||'').slice(0,180),result=core.check(task,value);
    const state=await rpc('answer',{id:data.id,round:data.round,request_id:data.request_id,value,correct:result.ok,assisted:data.assisted===true});
    if(state.activity==='learn'&&state.round===data.round)state.feedback=result.message;
    return reply(state);
   }
   return reply(await rpc(action,payload));
  }catch(e){return reply({error:e instanceof SyntaxError?'Ongeldig verzoek.':e.message},400);}
 };
}
