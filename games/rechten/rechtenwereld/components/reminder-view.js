/* The same lesson reminder stays available when the worksheet becomes compact. */
(function(root){
'use strict';
function attach(app){
 const mission=app.querySelector('.boundary-mission'),source=mission?.querySelector('.boundary-workspace aside');
 if(!source||!mission)return;
 const button=document.createElement('button');button.type='button';button.className='reminder-open';button.id='open-reminder';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','reminder-dialog');button.innerHTML=RechtenV2Shell.icon('light',20)+'<span>Herinnering</span>';mission.append(button);
 const dialog=document.createElement('dialog');dialog.id='reminder-dialog';dialog.className='reminder-dialog';dialog.setAttribute('aria-labelledby','reminder-title');
 const content=source.cloneNode(true);content.className='reminder-content';content.querySelector('h2').id='reminder-title';
 const close=document.createElement('button');close.type='button';close.className='reminder-close';close.innerHTML=RechtenV2Shell.icon('close',20)+'<span>Terug naar oefening</span>';
 dialog.append(close,content);mission.append(dialog);
 button.addEventListener('click',()=>{dialog.showModal();close.focus({preventScroll:true})});
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const items=[...dialog.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),[tabindex="0"]')].filter(el=>el.getClientRects().length),first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
 dialog.addEventListener('close',()=>button.focus({preventScroll:true}));
}
root.RechtenV2Reminder={attach};
})(globalThis);
