(async()=>{
  'use strict';
  const $=id=>document.getElementById(id),library=window.LeraarBobWorksheetLibrary;
  let entry,owner;
  if(window!==window.parent)document.querySelector('body>header').hidden=true;
  function show(){if(owner&&entry&&library.captureScope()===owner)$('worksheetDocument').srcdoc=library.render(entry,{key:$('includeKey').checked,baseURL:new URL('../',location.href).href});}
  function fitPages(){
    if(!owner||!entry)return;const frame=$('worksheetDocument'),inner=frame.contentDocument;if(!inner?.body)return;
    const available=Math.max(100,frame.clientWidth-32);
    inner.querySelectorAll('.worksheet-page,.paperPage,.paper,.paper-page').forEach(page=>{
      if(page.parentElement.closest('.archive-fit')&&page.parentElement.className!=='archive-fit')return;
      let wrapper=page.parentElement;if(!wrapper.classList.contains('archive-fit')){wrapper=inner.createElement('div');wrapper.className='archive-fit';page.before(wrapper);wrapper.append(page);}
      page.style.width='210mm';page.style.maxWidth='none';page.style.margin='0';page.style.transform='none';
      const width=page.offsetWidth,height=page.offsetHeight,scale=Math.min(1,available/width);
      page.style.transformOrigin='top left';page.style.transform=`scale(${scale})`;wrapper.style.width=(width*scale)+'px';wrapper.style.height=(height*scale)+'px';
    });
  }
  $('worksheetDocument').addEventListener('load',()=>{fitPages();$('worksheetDocument').contentDocument?.fonts?.ready.then(fitPages);for(const image of $('worksheetDocument').contentDocument?.images||[])image.addEventListener('load',fitPages,{once:true});});
  new ResizeObserver(fitPages).observe($('worksheetDocument'));
  function download(value,name,type){const url=URL.createObjectURL(new Blob([value],{type})),link=document.createElement('a');link.href=url;link.download=name.replace(/[^a-z0-9_.-]/gi,'-');link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
  async function action(button,handler){button.disabled=true;try{if(!owner||!entry||library.captureScope()!==owner)throw Error('Je account is gewijzigd. Open de reeks opnieuw vanuit Mijn oefenbladen.');await handler();}catch(error){$('worksheetStatus').textContent=error.message;}finally{button.disabled=!owner||!entry||library.captureScope()!==owner;}}
  $('includeKey').onchange=show;
  $('printWorksheet').onclick=()=>action($('printWorksheet'),()=>{$('worksheetDocument').contentWindow.focus();$('worksheetDocument').contentWindow.print();});
  $('downloadBackup').onclick=()=>action($('downloadBackup'),()=>download(library.exportJSON(entry),'leraarbob-reeks-'+(entry.code||entry.id)+'.json','application/json'));
  $('downloadWorksheet').onclick=()=>action($('downloadWorksheet'),async()=>{const expectedOwner=owner,value=entry,html=await library.exportHTML(value,{baseURL:new URL('../',location.href).href});if(!owner||!entry||owner!==expectedOwner||entry!==value||library.captureScope()!==expectedOwner)throw Error('Je account is gewijzigd. Open de reeks opnieuw.');download(html,'leraarbob-oefenblad-'+(value.code||value.id)+'.html','text/html');});
  try{
    owner=await library.ready();
    window.AxiomaAuth?.onChange?.(detail=>{
      if(!owner)return;const next=detail.account?.id?'account:'+detail.account.id:'guest';
      if(detail.pending||next!==owner){owner=null;entry=null;$('worksheetDocument').srcdoc='';$('worksheetDocument').hidden=true;$('worksheetTitle').textContent='Account gewijzigd';$('worksheetInfo').textContent='Open je eigen reeks opnieuw vanuit Mijn oefenbladen.';$('worksheetStatus').textContent='';for(const id of ['includeKey','printWorksheet','downloadWorksheet','downloadBackup'])$(id).disabled=true;}
    });
    const loaded=await library.get(new URLSearchParams(location.search).get('id'));
    if(!owner||library.captureScope()!==owner)throw Error('Je account is gewijzigd. Open je eigen reeks opnieuw vanuit Mijn oefenbladen.');
    entry=loaded;
    if(!entry)throw Error('Deze reeks staat niet in de oefenbladmap van dit account op dit toestel.');
    $('worksheetTitle').textContent=entry.title;$('worksheetInfo').textContent=`${entry.code?entry.code+' · ':''}Bewaard op ${new Date(entry.createdAt).toLocaleDateString('nl-BE')} · op dit toestel`;
    show();for(const id of ['printWorksheet','downloadWorksheet','downloadBackup'])$(id).disabled=false;
    $('worksheetDocument').addEventListener('load',()=>{if(owner)$('worksheetStatus').textContent='';});
  }catch(error){$('worksheetStatus').textContent=error.message;$('worksheetDocument').hidden=true;}
})();
