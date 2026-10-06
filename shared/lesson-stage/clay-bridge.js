/* Adapt the existing clay renderer to one teacher-controlled lesson activity. */
(()=>{
 const room=new URLSearchParams(location.search).get('lesson');if(window===window.top||!/^[a-f\d-]{36}$/i.test(room||''))return;
 document.documentElement.classList.add('lesson-clay');
 const tabId=crypto.randomUUID(),listeners=new Set();let account=null,data={sessions:[],current:null,member:null,members:[],connected:false},pending=false,timer,epoch=0,queue=Promise.resolve();
 const state=()=>({...data,account,pending,tabId});const emit=()=>listeners.forEach(fn=>fn(state()));
 async function request(action,args={}){const version=epoch;const task=queue.catch(()=>{}).then(async()=>{if(!account||version!==epoch)throw Error('Je account is niet meer aangemeld.');const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);try{const response=await AxiomaAuth.client().rpc('axioma_lesson_stage',{p_action:'clay_'+action,p_data:{id:room,tab:tabId,...args}}).abortSignal(controller.signal);if(response.error)throw response.error;if(version!==epoch)return state();data={...response.data.clay,connected:true,clockOffset:Date.parse(response.data.clay.server_time)-Date.now()};emit();return state();}catch(error){if(version===epoch){data.connected=false;emit();const notice=document.getElementById('groupMessage');if(notice)notice.textContent=error.message;}throw error;}finally{clearTimeout(timeout);}});queue=task;return task;}
 async function refresh(){clearTimeout(timer);const version=epoch;if(!account)return;try{await request('sync');}catch{}if(version===epoch)timer=setTimeout(refresh,1800);}
 async function answer({answer,eventId,version}){if(pending)throw Error('Je vorige schot wordt verwerkt.');pending=true;emit();try{return await request('answer',{answer,event:eventId,version});}finally{pending=false;emit();}}
 const deny=async()=>{throw Error('De leerkracht bedient deze activiteit vanuit de lessessie.');};
 const ready=AxiomaAuth.ready().then(async({account:a})=>{account=a;try{await request('join');}catch{}refresh();return state();});
 AxiomaAuth.onChange(({account:a,pending:loading})=>{if(loading||!account||account.id===a?.id)return;epoch++;clearTimeout(timer);account=null;data={sessions:[],current:null,member:null,members:[],connected:false};emit();});
 window.AxiomaGroups={ready:()=>ready,state,onChange:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},refresh,answer,create:deny,join:deny,start:deny,leave:deny,ranking:deny};
 addEventListener('pagehide',()=>{epoch++;clearTimeout(timer);});
})();
