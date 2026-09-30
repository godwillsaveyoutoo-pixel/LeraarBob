/* Reward complete exercises once. A replay can improve 5 XP to 10 XP.
   This is personal progress, not an authoritative competitive leaderboard. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.RechtenV2XP=api;})(globalThis,()=>{
 'use strict';
 const key=id=>String(id||'').replace(/:run\d+$/,'').replace(/^(rechten-v2:[^:]+:[^:]+):\d+:(\d+)$/,'$1:$2');
 const points=supported=>supported?5:10;
 function update(source){
  const s=JSON.parse(JSON.stringify(source));
  if(s.xpLedger?.version!==1){
   const old=Math.max(0,Number(s.platformXp)||0),awards={};
   // Already displayed XP is never removed or awarded a second time.
   if(old)for(const e of s.events||[])if(e.correct&&e.taskId){const k=key(e.taskId);awards[k]=Math.max(awards[k]||0,points(e.independent===false));}
   s.xpLedger={version:1,total:old,awards};
  }
  const ledger=s.xpLedger;
  function award(id,supported){if(!id)return;const k=key(id),value=points(supported),previous=ledger.awards[k]||0;if(value>previous){ledger.total+=value-previous;ledger.awards[k]=value;}}
  for(const m of Object.values(s.missions||{})){
   for(const done of m.completion||[])award(done.taskId,done.supported!==false);
   if(m.feedback?.result?.ok&&m.feedback.next==='next-task')award(m.task?.id,m.hints>0||m.errors>0||m.task?.mode==='discover');
  }
  s.platformXp=ledger.total;
  return s;
 }
 return Object.freeze({update,key});
});
