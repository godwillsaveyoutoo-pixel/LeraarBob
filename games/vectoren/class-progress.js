/* Show the same account's actual solo XP; classroom points are a separate score. */
(()=>{'use strict';
 const key='axioma-vectorentrainer-v020',badge=document.createElement('output');
 badge.hidden=true;badge.dataset.platformProgress='xp';let epoch=0,account=null;
 const owner=a=>a?a.role+':'+a.id:'guest';
 const cacheKey=()=>`axioma:progress:v2:${encodeURIComponent(window.AXIOMA_CONFIG?.url||'offline')}:${owner(account)}:vectoren-trainer`;
 const get=k=>{try{return localStorage.getItem(k)}catch{return null}};
 const parse=v=>{try{return JSON.parse(v||'null')}catch{return null}};
 function show(state){const xp=Number(state?.xp);if(!Number.isFinite(xp)||xp<0)return;badge.dataset.value=String(Math.floor(xp));badge.textContent=Math.floor(xp)+' XP';if(!badge.isConnected)document.querySelector('header')?.append(badge);}
 async function change(detail){const turn=++epoch;badge.remove();account=detail?.account||null;if(detail?.pending||account?.role==='teacher')return;
  const local=parse(get(cacheKey()));const saved=parse(local?.state?.storage?.[key]);if(saved?.progress)show(saved.progress);else if(saved)show(saved);
  if(!account){const guest=parse(get(key));if(guest)show(guest.progress||guest);return;}
  try{const remote=await AxiomaProgress.load('vectoren-trainer',account.id);if(turn!==epoch)return;const data=parse(remote.state?.storage?.[key]);if(local?.dirty)return;show(data?.progress||data||{xp:0});}catch{/* A missing connection must not become a fictitious zero score. */}
 }
 AxiomaAuth.onChange(change);const initial=epoch;AxiomaAuth.ready().then(v=>{if(epoch===initial)change(v)}).catch(()=>{});
 addEventListener('online',()=>change({account}));
})();
