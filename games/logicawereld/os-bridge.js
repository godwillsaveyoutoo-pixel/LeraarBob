/* Only the existing desktop/auth own identities, roles and live capabilities. */
(function(root){
 'use strict';
 const gameId='logicawereld';
 function host(){try{return root.parent!==root&&root.parent.location.origin===root.location.origin&&root.parent.LeraarBobDesktop?root.parent:null;}catch{return null;}}
 function auth(){return host()?.AxiomaAuth||root.AxiomaAuth||null;}
 function context(){const h=host();if(!h)return {embedded:false,role:'guest',modes:[],accountId:null};const state=h.LeraarBobDesktop.state();return {embedded:true,role:state.role||'guest',accountId:state.accountId||null,modes:h.LeraarBobGameRegistry?.modes(gameId,{role:state.role||'guest'})||[]};}
 function sessionModes(){const c=context();return c.modes.filter(m=>['online','learn','classlearn','classroom','teacher','live'].includes(m.id)).filter(m=>!['classlearn','classroom','teacher','live'].includes(m.id)||c.role==='teacher');}
 function openMode(id,stop){const h=host(),m=sessionModes().find(m=>m.id===id);if(!h||!m)return false;return h.LeraarBobDesktop.openApp(gameId,id,{topicId:'halte-'+(stop+1)})!==false;}
 function openModes(stop,opener){const h=host();if(!h)return false;h.LeraarBobDesktop.openModes(gameId,{topicId:'halte-'+(stop+1),opener});return true;}
 function openWorksheet(stop,replace=false){
  const district=root.LogicContent.stops[stop]?.district||0,topic='gebied-'+(district+1),url=new URL('../../oefenbladen/maken.html',root.location.href);
  url.searchParams.set('source',gameId+':'+topic);url.searchParams.set('topic',topic);url.searchParams.set('level','halte-'+(stop+1));
  if(host()&&!replace){const event=new CustomEvent('leraarbob:worksheet-route',{cancelable:true,detail:{href:url.href}});document.dispatchEvent(event);if(event.defaultPrevented)return true;}
  // Legacy direct paper URLs open the central composer, never a game menu.
  root.location[replace?'replace':'assign'](url.href);return true;
 }
 root.LogicaOS=Object.freeze({context,auth,sessionModes,openMode,openModes,openWorksheet});
})(window);
