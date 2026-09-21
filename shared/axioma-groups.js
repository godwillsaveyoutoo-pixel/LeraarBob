(() => {
  'use strict';
  if (!window.AxiomaSocial || window.AxiomaGroups) return;
  const gameURL = new URL('../games/rechten/kleiduiven/', document.currentScript.src);
  let account = null, epoch = 0, timer, queue = Promise.resolve(), pending = false;
  let data = {sessions:[],current:null,member:null,members:[],connected:false};
  const listeners = new Set(), routed = new Set();
  const state = () => ({...data, account, pending, tabId:AxiomaSocial.state().tabId});
  function emit() {
    for (const fn of listeners) { try { fn(state()); } catch(error) { console.error(error); } }
    window.dispatchEvent(new CustomEvent('axioma:groups',{detail:state()}));
  }
  function route() {
    const s=data.current,m=data.member;
    if (!s || !m || m.left_at || m.tab_id!==AxiomaSocial.state().tabId || !['waiting','running'].includes(s.status)) return;
    if (routed.has(s.id)) return;
    try { if(sessionStorage.getItem(`axioma-clay-opened:${s.id}`))return;sessionStorage.setItem(`axioma-clay-opened:${s.id}`,'1'); } catch {}
    routed.add(s.id);
    if (location.pathname===gameURL.pathname) return;
    const url=new URL(gameURL);url.searchParams.set('group',s.id);location.assign(url.href);
  }
  function request(action,args={}) {
    const version=epoch,id=account?.id;
    const task=queue.catch(()=>{}).then(async()=>{
      if (!id || version!==epoch) return null;
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
      try {
        const {data:result,error}=await AxiomaAuth.client().rpc('axioma_clay',{
          p_action:action,p_tab_id:AxiomaSocial.state().tabId,...args
        }).abortSignal(controller.signal);
        if(error)throw error;if(version!==epoch)return null;
        data={...result,clockOffset:Date.parse(result.server_time)-Date.now(),connected:true};emit();if(action!=='answer')route();return state();
      }catch(error){if(version===epoch){data={...data,connected:false};emit()}throw error}
      finally{clearTimeout(timeout)}
    });
    queue=task;return task;
  }
  async function refresh(){
    clearTimeout(timer);if(!account)return;const version=epoch;
    try{await request('sync')}catch{}
    if(version===epoch&&account)timer=setTimeout(refresh,document.hidden?10000:2500);
  }
  function authChanged({account:next}){
    if(next?.role==='unknown')next=null;if(next?.id===account?.id)return;
    epoch++;clearTimeout(timer);queue=Promise.resolve();pending=false;account=next||null;
    data={sessions:[],current:null,member:null,members:[],connected:false};emit();if(account)refresh();
  }
  async function act(action,args={}){
    if(pending)throw Error('Even wachten: je vorige actie wordt verwerkt.');
    if(!account)throw Error('Log eerst in om in groep te spelen.');
    pending=true;emit();
    try{return await request(action,args)}finally{pending=false;emit()}
  }
  const ready=(async()=>{
    await AxiomaSocial.ready();AxiomaAuth.onChange(authChanged);
    authChanged({account:await AxiomaAuth.getAccount()});return state();
  })();
  window.AxiomaGroups=Object.freeze({
    ready:()=>ready,state,refresh,
    onChange(fn){listeners.add(fn);return()=>listeners.delete(fn)},
    create:speed=>act('create',{p_speed:speed||5}),
    join:id=>act('join',{p_session_id:id}),
    start:()=>act('start',{p_session_id:data.current?.id}),
    leave:()=>act('leave',{p_session_id:data.current?.id}),
    answer:({sessionId,answer,eventId,version})=>act('answer',{p_session_id:sessionId,p_answer:answer,p_event_id:eventId,p_version:version}),
    ranking:speed=>request('ranking',{p_speed:speed||5})
  });
  window.dispatchEvent(new Event('axioma:groups-ready'));
  window.addEventListener('pagehide',()=>clearTimeout(timer));
  window.addEventListener('pageshow',e=>{if(e.persisted)refresh()});
  window.addEventListener('online',refresh);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
})();
