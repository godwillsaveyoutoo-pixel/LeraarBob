/* The existing classroom owns identity, membership, codes, grading and scores. */
(()=>{
 function create(onState,onError){let account=null,id=null,room=null,lesson=null,timer,epoch=0,queue=Promise.resolve(),disconnected=false;
  const key=()=>`lesson-stage-room:${account?.id}`;
  function save(){try{if(id)localStorage.setItem(key(),id);}catch{}}
  async function request(kind,action,data={}){const version=epoch;
   const work=queue.catch(()=>{}).then(async()=>{if(!account||version!==epoch)throw Error('Meld je aan met je leraarBob-account.');const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
    try{const client=AxiomaAuth.client();const response=await(kind==='battle'?client.functions.invoke('rechten-class',{body:{action,data:{id,...data}},signal:controller.signal}):client.rpc('axioma_lesson_stage',{p_action:action,p_data:{id,...data}}).abortSignal(controller.signal));
     if(response.error){let detail;try{detail=await response.error.context?.json();}catch{}const message=detail?.error||response.error.message;if(response.error.code==='PGRST202'||/could not find.*function/i.test(message||''))throw Error('De online lesmodus is nog niet geactiveerd. Het lesverhaal en je PDF’s blijven beschikbaar.');throw Error(message);}if(response.data?.error)throw Error(response.data.error);if(version!==epoch)return null;
     if(kind==='read')return response.data;
     if(kind==='battle'){room={...response.data,clockOffset:Date.parse(response.data.server_time)-Date.now()};id=room.id;save();}else{lesson=response.data;if(lesson.room){id=lesson.room;save();}}
     onState({account,id,room,lesson});return response.data;
    }finally{clearTimeout(timeout);}
   });queue=work;return work;
  }
  async function refresh(){clearTimeout(timer);const version=epoch;if(!id||!account)return;try{await request('battle','state');await request('lesson','state');if(disconnected&&version===epoch){disconnected=false;onError('');}}catch(e){if(version===epoch){disconnected=true;onError(e);}}if(version===epoch)timer=setTimeout(refresh,1800);}
  function identity({account:a,pending}){if(pending||account?.id===a?.id)return;epoch++;clearTimeout(timer);account=a;room=null;lesson=null;id=null;try{id=account&&localStorage.getItem(key());}catch{}onState({account,id,room,lesson});if(id)refresh();}
  AxiomaAuth.onChange(identity);AxiomaAuth.ready().then(identity).catch(onError);addEventListener('online',refresh);
  return {get state(){return {account,id,room,lesson}},async create(deck){const s=await request('lesson','create',{deck,seconds:120});id=s.room;save();await refresh();return s;},async join(code){await request('battle','join',{code});await refresh();},battle:(action,data)=>request('battle',action,data),act:(action,data)=>request('lesson',action,data),inspect:(action,data)=>request('read',action,data),refresh};
 }
 window.LessonLive={create};
})();
