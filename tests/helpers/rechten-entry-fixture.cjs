'use strict';
// Local PostgreSQL and existing Edge handlers. All identities are synthetic.
const fs=require('node:fs'),path=require('node:path');
const {createDB}=require('./rechten-online-db.cjs'),{createStageDB}=require('./lesson-stage-db.cjs');
const engine=require('../../shared/multiplayer/rechten-learn-engine.cjs');
async function createFixture(){
 const learn=await createDB(),classroom=await createStageDB(),numbers=await require('./numbers-session-db.cjs').server(),root=path.resolve(__dirname,'../..');
 for(const file of ['20260929235628_rechten_samen_leren.sql','20260929235633_rechten_learn_invitations.sql','20260930161209_rechten_learn_full_route.sql'])await learn.db.exec(fs.readFileSync(path.join(root,'supabase/migrations',file),'utf8'));
 await classroom.db.exec(fs.readFileSync(path.join(root,'supabase/migrations/20261005132202_central_class_battle_hub.sql'),'utf8'));await classroom.db.exec("update public.axioma_profiles set class_code='TEST'");
 for(const user of ['alex','sam','outsider'])await learn.progress(user,engine.skills);
 await learn.db.exec(fs.readFileSync(path.join(root,'supabase/migrations/20261011070545_os_worksheet_cloud_archive.sql'),'utf8'));
 const tasks=await require('./os-tasks-db.cjs').install(classroom.db,classroom.ids);
 const clay=await require('./clay-os-db.cjs').install(classroom.db,classroom.ids);
 let queue=Promise.resolve();const calls=[],gameProgress=new Map();
 function as(user,role,sql,args){const work=queue.catch(()=>{}).then(()=>learn.db.transaction(async tx=>{await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[learn.ids[user]||'']);await tx.exec('set local role '+role);return(await tx.query(sql,args)).rows[0]?.result;}));queue=work;return work;}
 const {createHandler}=await import('../../supabase/functions/rechten-learn/handler.js');
 const handler=createHandler({url:'https://entry.test',anonKey:'fake-anon',serviceKey:'fake-service',engine,fetcher:async(url,options)=>{
  const token=options.headers.Authorization.slice(7);if(url.endsWith('/user'))return new Response(JSON.stringify(learn.ids[token]?{id:learn.ids[token]}:{}),{status:learn.ids[token]?200:401});
  if(token!=='fake-service')throw Error('Unexpected fixture token');const a=JSON.parse(options.body);
  try{return new Response(JSON.stringify(await as(null,'service_role','select public.axioma_rechten_learn_worker($1,$2) result',[a.p_action,JSON.stringify(a.p_data)])));}catch(e){return new Response(JSON.stringify({message:e.message}),{status:400});}
 }});
 async function invoke(user,provider,input){
  if(!Object.hasOwn(learn.ids,user))throw Error('Unknown synthetic user');calls.push({user,provider,action:input.action||input.p_action});
  try{
   let data;
   if(provider==='rechten-learn'){const response=await handler(new Request('https://entry.test',{method:'POST',headers:{Authorization:'Bearer '+user},body:JSON.stringify(input)}));data=await response.json();if(!response.ok)throw Error(data.error);}
   else if(provider==='rechten-duo'){const work=queue.catch(()=>{}).then(()=>learn.rpc(user,input.action,input.data||{}));queue=work;data=await work;}
   else if(provider==='axioma_os_tasks')data=await tasks.rpc(user,input.p_action,input.p_data);
   else if(provider==='task-activity')data=await tasks.activity(user,input.action,input.data);
   else if(provider==='numbers-session')data=await numbers.call(user,input.action,input.data||{});
   else if(provider==='rechten-class')data=await classroom.battle(user,input.action,input.data);
   else if(provider==='axioma_social')data=await as(user,'authenticated','select public.axioma_social($1,$2,$3,$4,$5) result',[input.p_action,input.p_tab_id,input.p_target_id||null,input.p_invite_id||null,input.p_match_id||null]);
   else if(provider==='axioma_class_battle_hub')data=await classroom.db.transaction(async tx=>{await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[classroom.ids[user]]);await tx.exec('set local role authenticated');return(await tx.query('select public.axioma_class_battle_hub($1,$2) result',[input.p_action,JSON.stringify(input.p_data||{})])).rows[0].result;});
   else if(provider==='axioma_worksheet_archive')data=await as(user,'authenticated','select public.axioma_worksheet_archive($1,$2::jsonb) result',[input.p_action,JSON.stringify(input.p_data||{})]);
   else if(provider==='axioma_clay_os')data=await clay.rpc(user,input);
   else if(provider==='axioma_clay_results')data=await clay.results(user,input.p_class_code);
   else if(provider==='axioma_clay_v2')data={sessions:[],current:null,member:null,members:[],server_time:new Date().toISOString()};
   else if(provider==='axioma_save_game_progress_for_account'){
    if(input.p_user_id!==learn.ids[user])throw Error('Account mismatch');
    const key=user+':'+input.p_game_id,previous=gameProgress.get(key);
    if((previous?.revision||0)!==input.p_revision)data={status:'conflict',revision:previous?.revision||0,state:previous?.state||{}};
    else{const row={user_id:learn.ids[user],game_id:input.p_game_id,revision:(previous?.revision||0)+1,state:structuredClone(input.p_state),updated_at:new Date().toISOString()};gameProgress.set(key,row);data={status:'saved',...row};}
   }
   else if(provider==='fixture-progress-read'){
    if(input.user_id&&input.user_id!==learn.ids[user])throw Error('Account mismatch');
    const rows=[...gameProgress.values()].filter(r=>r.user_id===learn.ids[user]&&(!input.game_id||r.game_id===input.game_id));data=input.single?rows[0]||null:rows;
   }
   else if(provider.includes('progress'))data={status:'saved',revision:1,state:input.p_state||{}};
   else data=[];
   return {data,error:null};
  }catch(e){return {data:null,error:{message:e.message}};}
 }
 function authScript(defaultUser='alex',launcher=false){return `(()=>{
  const q=new URLSearchParams(location.search),valid=['alex','sam','outsider','teacher'];
  const requested=q.get('previewUser');if(valid.includes(requested))sessionStorage.setItem('rechten-entry-preview-user',requested);
  let user=${launcher?'sessionStorage.getItem("rechten-entry-preview-user")||'+JSON.stringify(defaultUser):JSON.stringify(defaultUser)};
  const ids=${JSON.stringify(learn.ids)},listeners=new Set(),makeAccount=user=>({id:ids[user],role:user==='teacher'?'teacher':'student',alias:user==='teacher'?'Proefleerkracht':'Proef '+user,class_code:'TEST'});let account=makeAccount(user);
  const api=(name,input)=>fetch('/entry-fixture-api/'+name,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user,input})}).then(r=>r.json());
  const empty=table=>{const filters={};return {select(){return this},eq(k,v){filters[k]=v;return this},order(){return this},abortSignal(){return this},maybeSingle:()=>table==='axioma_game_progress'?api('fixture-progress-read',{...filters,single:true}):Promise.resolve({data:null,error:null}),then(resolve,reject){return (table==='axioma_game_progress'?api('fixture-progress-read',filters):Promise.resolve({data:[],error:null})).then(resolve,reject);}};};
  // Local browser transport only. Native naval messages stay intact, with no
  // production Realtime endpoint; shared-context tabs exchange over BroadcastChannel.
  function previewChannel(topic){const bus=new BroadcastChannel('entry-fixture:'+topic),handlers=[],peers={};let value=null,beat;
    const fire=(type,event,data)=>handlers.filter(h=>h.type===type&&(!h.filter.event||h.filter.event===event)).forEach(h=>h.fn(data));
    const ch={on(type,filter,fn){handlers.push({type,filter,fn});return ch;},subscribe(fn){setTimeout(()=>fn('SUBSCRIBED'),0);return ch;},async track(v){value=v;peers[account.id]=[v];bus.postMessage({kind:'presence',id:account.id,value:v});fire('presence','sync',{});if(!beat)beat=setInterval(()=>{if(value)bus.postMessage({kind:'presence',id:account.id,value});},500);return 'ok';},presenceState:()=>peers,async send(v){bus.postMessage({kind:'broadcast',...v});return 'ok';},close(){clearInterval(beat);bus.close();}};
    bus.onmessage=({data})=>{if(data.kind==='presence'){peers[data.id]=[data.value];fire('presence','sync',{});}else fire('broadcast',data.event,{payload:data.payload});};return ch;
  }
  window.AxiomaAuth={CLASSES:['TEST'],ready:async()=>({account,pending:false}),getAccount:async()=>account,getSnapshot:()=>({account,pending:false}),getSession:async()=>account?{user:{id:account.id}}:null,onChange:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},_previewSwitch:next=>{if(!valid.includes(next))throw Error("Unknown fixture user");user=next;account=makeAccount(user);sessionStorage.setItem("rechten-entry-preview-user",user);listeners.forEach(fn=>fn({account,pending:false}));},configured:()=>true,client:()=>({from:empty,channel:previewChannel,removeChannel:async ch=>ch.close(),functions:{invoke:(name,{body})=>api(name,body)},rpc:(name,input)=>{const request=api(name,input||{});request.abortSignal=()=>request;return request;}})};
  ${launcher?`if(location.pathname.endsWith('/os/')&&q.has('entry')){const mode=q.get('entry'),appId=q.get('app')||'rechtenwereld';let attempts=0;const launch=()=>{if(window.LeraarBobDesktop?.state().accountId===account.id){if(appId==='rechtenwereld'&&mode==='classroom'&&account.role==='student'){LeraarBobDesktop.showView({kind:'live'});[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Klas Battle')?.click();}else LeraarBobDesktop.openApp(appId,mode);}else if(attempts++<200)setTimeout(launch,50);};setTimeout(launch,0);}`:''}
 })();`;}
 return {learn,classroom,numbers,ids:learn.ids,calls,invoke,authScript,close:async()=>{await learn.db.close();await classroom.db.close();await numbers.db.close();}};
}
module.exports={createFixture};
