/* Read presentation from the owning same-origin frame, without changing its state. */
(()=>{'use strict';
 const own=document.documentElement;
 const mode=()=>{try{return parent!==window?parent.document.documentElement.dataset.mode:localStorage.getItem('axioma-mode');}catch{return 'light';}};
 const sync=()=>{own.dataset.mode=mode()==='dark'?'dark':'light';};sync();
 try{if(parent!==window)new MutationObserver(sync).observe(parent.document.documentElement,{attributes:true,attributeFilter:['data-mode']});}catch{}
 addEventListener('storage',e=>{if(e.key==='axioma-mode')sync();});
})();
