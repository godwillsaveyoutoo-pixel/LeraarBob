/* Archiving is separate from each subject's questions, progress and print flow. */
(()=>{
'use strict';
const script=document.currentScript;
if(script?.src&&!document.querySelector('link[data-worksheet-save-style]')){
 const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('worksheet-save.css',script.src).href;css.dataset.worksheetSaveStyle='';document.head.append(css);
}
function mount({host,getSnapshot,isValid=()=>true}){
 if(!host||typeof getSnapshot!=='function')throw Error('Een oefenbladvoorbeeld is nodig.');
 const group=document.createElement('div');group.className='worksheet-save-controls screen-only';
 const button=document.createElement('button');button.type='button';button.dataset.worksheetSave='';button.textContent='Bewaar reeks';button.disabled=true;
 const status=document.createElement('p');status.dataset.worksheetSaveStatus='';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 group.append(button,status);host.append(group);
 const library=()=>window.LeraarBobWorksheetLibrary;
 let owner=null,busy=false,serial=0;
 const ready=Promise.resolve().then(()=>{
  if(!library())throw Error('Bewaren kon niet laden. Herlaad deze pagina en probeer opnieuw.');
  return library().ready();
 }).then(scope=>{owner=scope;refresh();return scope;}).catch(error=>{status.textContent=error.message;return null;});
 function refresh(){button.disabled=busy||!owner||library()?.captureScope()!==owner||!isValid();}
 function invalidate(){serial++;busy=false;status.textContent='';delete status.dataset.savedId;refresh();}
 async function save(auto=false){
  const run=++serial;busy=true;button.disabled=true;status.textContent='Reeks bewaren…';
  try{
   if(!isValid())throw Error('Maak eerst een geldige reeks.');
   // Capture before awaiting storage: a following generation must not replace this series.
   const snapshotResult=getSnapshot();
   await ready;
   if(!owner||library()?.captureScope()!==owner)throw Error('Je account is gewijzigd. Open het oefenblad opnieuw voordat je het bewaart.');
   const expectedScope=owner,snapshot=await snapshotResult;
   if(library().captureScope()!==expectedScope)throw Error('Je account is gewijzigd. Open het oefenblad opnieuw voordat je het bewaart.');
   const entry=await library().save(snapshot,{expectedScope});
   if(run!==serial||library().captureScope()!==expectedScope)return null;
   status.textContent='Bewaard in Mijn oefenbladen · op dit toestel';status.dataset.savedId=entry.id;
   group.dispatchEvent(new CustomEvent('worksheet:saved',{bubbles:true,detail:{id:entry.id,automatic:!!auto}}));
   return entry;
  }catch(error){if(run===serial){delete status.dataset.savedId;status.textContent='Niet bewaard: '+error.message+' Je kunt de reeks nog afdrukken of als PDF opslaan.';}return null;}
  finally{if(run===serial){busy=false;refresh();}}
 }
 button.onclick=()=>save();
 window.AxiomaAuth?.onChange?.(detail=>{queueMicrotask(()=>{refresh();if(detail.pending||library()?.captureScope()!==owner){serial++;busy=false;refresh();status.textContent='Account gewijzigd. Open het oefenblad opnieuw om voor dit account te bewaren.';}});});
 return Object.freeze({save,invalidate,refresh,button,status});
}
window.LeraarBobWorksheetSave=Object.freeze({mount});
})();
