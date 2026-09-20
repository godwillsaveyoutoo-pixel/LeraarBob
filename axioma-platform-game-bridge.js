/* leraarBob simple game bridge — include once in the platform shell. */
(()=>{
  'use strict';
  const IDS=['pythagoras','stelsels','algebra-smederij','taartenwinkel','kubusbouw','verfwinkel','data-check','signal-lab','gravity-maze'];
  const read=id=>{try{return JSON.parse(localStorage.getItem(`axioma:game:${id}:progress`)||'null')}catch(_){return null}};
  const all=()=>Object.fromEntries(IDS.map(id=>[id,read(id)]));
  function store(p){
    if(!p||p.type!=='axioma:game-progress'||!IDS.includes(p.gameId))return;
    try{localStorage.setItem(`axioma:game:${p.gameId}:progress`,JSON.stringify(p));if(p.complete)localStorage.setItem(`axioma:game:${p.gameId}:complete`,'1')}catch(_){}
    window.dispatchEvent(new CustomEvent('axioma:platform-game-progress',{detail:p}));
  }
  addEventListener('message',e=>{
    const d=e.data;
    if(d?.type==='axioma:game-progress')store(d);
    if(d?.type==='axioma:navigate-home'){
      // The shell stays the authority for navigation; games only request home.
      if(location.pathname.endsWith('/index.html')||location.pathname.endsWith('/')) window.dispatchEvent(new Event('axioma:home-request'));
      else location.href='./index.html';
    }
  });
  window.AxiomaGameProgress={ids:IDS,read,all,store};
})();
