/* A fresh correct submission may continue once. Resuming saved feedback,
   navigating away or opening help never starts a new countdown. */
(function(root,factory){if(typeof module==='object')module.exports=factory();else root.RechtenV2AnswerFlow=factory()})(globalThis,function(){
'use strict';
function active(s){return s.screen==='mission'?s.missions[s.active]:null}
function key(s){const m=active(s);return m?JSON.stringify([s.active,m.task.id,m.run,m.index,m.phase,m.attempt]):null}
function delay(s){const m=active(s);if(s.settings?.autoAdvance===false||!m?.skill||m.completed||!m.feedback?.result.ok)return 0;
 const words=String(m.feedback.result.message||'').trim().split(/\s+/).length;
 return Math.max(1800,Math.min(6000,1000+words*150));
}
function create({getState,canRun,advance,waiting,setTimer=setTimeout,clearTimer=clearTimeout}){
 let timer=null,generation=0;
 function stop(){generation++;if(timer!==null)clearTimer(timer);timer=null;waiting(false)}
 function start(){stop();const s=getState(),ms=delay(s),expected=key(s);if(!ms||!canRun())return;
  const ticket=generation;waiting(true,ms);
  timer=setTimer(()=>{if(ticket!==generation)return;timer=null;waiting(false);const current=getState();if(key(current)===expected&&delay(current)&&canRun())advance()},ms);
 }
 return Object.freeze({start,stop});
}
return Object.freeze({delay,create});
});
