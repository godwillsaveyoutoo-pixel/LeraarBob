/* Shared presentation preference; never part of learner progress or a game score. */
(function(){
'use strict';
if(document.querySelector('script[src$="leraarbob-topbar.js"]'))return;
const header=document.querySelector('[data-collapsible-topbar]');
if(!header||window!==window.top)return;
const KEY='leraarbob-topbar-collapsed',body=document.body;
if(!header.id)header.id='collapsibleTopbar';
body.classList.add('has-collapsible-topbar');
const collapse=document.createElement('button'),restore=document.createElement('button');
collapse.type=restore.type='button';collapse.className='topbar-collapse';restore.className='topbar-restore';
collapse.textContent='⌃';restore.innerHTML='<span aria-hidden="true">⌄</span><span class="topbar-restore-label"> Menu</span>';
collapse.title='Bovenbalk inklappen';restore.title='Bovenbalk uitklappen';
collapse.setAttribute('aria-label',collapse.title);restore.setAttribute('aria-label',restore.title);
const triggers=[...document.querySelectorAll('[data-collapse-topbar]')];
for(const button of [collapse,restore,...triggers])button.setAttribute('aria-controls',header.id);
(header.querySelector('.header-actions')||header).append(collapse);body.append(restore);
function apply(collapsed,focus=false){
 document.dispatchEvent(new CustomEvent('topbar:change',{detail:{collapsed}}));
 header.hidden=collapsed;header.inert=collapsed;body.classList.toggle('topbar-collapsed',collapsed);
 for(const button of [collapse,restore,...triggers])button.setAttribute('aria-expanded',String(!collapsed));restore.hidden=!collapsed;
 if(focus){const target=collapsed?restore:collapse.getClientRects().length?collapse:header.querySelector('#menuBtn,button,a');target?.focus({preventScroll:true});}
}
function set(collapsed){try{localStorage.setItem(KEY,String(collapsed));}catch{}apply(collapsed,true);}
collapse.onclick=()=>set(true);restore.onclick=()=>set(false);
for(const button of triggers)button.addEventListener('click',()=>set(true));
addEventListener('storage',event=>{if(event.key===KEY)apply(event.newValue==='true');});
let saved=false;try{saved=localStorage.getItem(KEY)==='true';}catch{}apply(saved);
})();
