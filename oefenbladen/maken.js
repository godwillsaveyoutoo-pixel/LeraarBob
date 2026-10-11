/* Central composer: account-scoped archive, independent of all live game state. */
(async()=>{
'use strict';const $=id=>document.getElementById(id),P=LeraarBobWorksheetProviders,L=LeraarBobWorksheetLibrary,base=new URL('../',location.href),params=new URLSearchParams(location.search);
let source,provider,snapshot=null,owner=null,busy=false,turn=0;
if(window!==parent){document.body.classList.add('embedded');document.querySelector('body>header').hidden=true;}
try{document.documentElement.dataset.mode=parent!==window?parent.document.documentElement.dataset.mode:localStorage.getItem('axioma-mode')||'light';}catch{}
const allowed=()=>!!owner&&L.captureScope()===owner;
const archive=LeraarBobWorksheetSave.mount({host:$('saveControls'),getSnapshot:()=>{if(!snapshot)throw Error('Maak eerst een reeks.');return snapshot;},isValid:()=>allowed()&&!!snapshot&&!busy});
const option=(id,label)=>{const el=document.createElement('option');el.value=id;el.textContent=label;return el;};
for(const group of [...new Set(P.sources.map(s=>s.group))]){const el=document.createElement('optgroup');el.label=group;for(const s of P.sources.filter(s=>s.group===group))el.append(option(s.key,s.title));$('source').append(el);}
function controls(){const disabled=!allowed()||busy||!provider;$('source').disabled=!allowed()||busy;$('makerFields').disabled=disabled;$('generateWorksheet').disabled=disabled;$('printWorksheet').disabled=!allowed()||busy||!snapshot;$('includeKey').disabled=!allowed()||busy||!snapshot;archive.refresh();}
function values(){const c={};for(const f of provider.fields){const el=$('field-'+f.id);c[f.id]=f.type==='checks'?[...el.querySelectorAll('input:checked')].map(i=>i.value):el.value;}return c;}
function renderFields(){
 $('makerFields').replaceChildren();for(const f of provider.fields){
  const label=document.createElement(f.type==='checks'?'fieldset':'label');label.className=f.type==='checks'?'choices':'field';
  if(f.type==='checks'){label.id='field-'+f.id;const legend=document.createElement('legend');legend.textContent=f.label;label.append(legend);for(const o of f.options){const row=document.createElement('label'),input=document.createElement('input'),text=document.createElement('span');row.className='check';input.type='checkbox';input.value=o.id;input.checked=f.value.includes(o.id);text.textContent=o.label;if(o.example){const small=document.createElement('small');small.textContent=o.example;text.append(small);}row.append(input,text);label.append(row);}}
  else{label.append(document.createTextNode(f.label));const input=document.createElement(f.type==='select'?'select':'input');input.id='field-'+f.id;input.name=f.id;if(f.type==='select')input.append(...f.options.map(o=>option(o.id,o.label)));else{input.type='number';input.min=f.min;input.max=f.max;input.step=source.topic==='equations'?6:1;}input.value=f.value;label.append(input);}
  $('makerFields').append(label);
 }
 const skills=params.get('skills')?.split(',');if(skills&&source.theme==='getallen'){const valid=provider.fields.find(f=>f.id==='skills').options.map(o=>o.id);if(skills.some(id=>valid.includes(id)))$('field-skills').querySelectorAll('input').forEach(i=>i.checked=skills.includes(i.value));}
 const level=params.get('level');if(level&&provider.fields.find(f=>f.id==='level')?.options?.some(o=>o.id===level))$('field-level').value=level;
 if(source.topic==='systems'){$('field-level').onchange=()=>{const skill=$('field-level').value.slice(4);$('field-method').value=['graphic','substitution','combination'].includes(skill)?skill:'substitution';};$('field-level').onchange();}
}
function folderURL(){const u=new URL('os/',base);u.searchParams.set('place','worksheets');u.searchParams.set('worksheetTheme',source.theme);u.searchParams.set('worksheetTopic',source.topic);return u;}
async function collection(){const expected=turn,scope=owner;$('savedSeries').replaceChildren();try{const records=await L.list();if(expected!==turn||scope!==owner||!allowed())return;const own=records.filter(r=>r.sourceId===source.id&&r.topic===source.topic).slice(0,5);for(const record of own){const a=document.createElement('a');a.className='saved-series';a.dataset.savedSeries=record.id;a.href=new URL('os/worksheet.html?id='+encodeURIComponent(record.id),base);a.textContent=record.title+' · '+new Date(record.createdAt).toLocaleDateString('nl-BE');$('savedSeries').append(a);}if(!own.length)$('savedSeries').textContent='Nog geen reeksen over dit onderwerp.';}catch(e){if(expected===turn)$('savedSeries').textContent=e.message;}}
async function choose(){
 const current=++turn;source=P.sources.find(s=>s.key===$('source').value);provider=null;snapshot=null;archive.invalidate();$('worksheetDocument').srcdoc='';$('worksheetDocument').hidden=true;$('emptyPreview').hidden=false;$('documentTitle').textContent='Je oefenblad verschijnt hier';$('makerTitle').textContent=source.title;$('openFolder').href=folderURL();$('makerStatus').textContent='Opgaven laden…';controls();
 const url=new URL(location.href);url.searchParams.set('source',source.id);url.searchParams.set('topic',source.topic);history.replaceState(null,'',url);
 try{const next=await P.load(source);if(current!==turn||!allowed())return;provider=next;renderFields();$('makerStatus').textContent='';controls();await collection();}catch(e){if(current===turn)$('makerStatus').textContent=e.message;}
}
function show(){if(!snapshot||!allowed())return;$('worksheetDocument').hidden=false;$('emptyPreview').hidden=true;$('documentTitle').textContent=snapshot.title;$('worksheetDocument').srcdoc=L.render(snapshot,{key:$('includeKey').checked,baseURL:base.href});}
function fit(){const frame=$('worksheetDocument'),doc=frame.contentDocument;if(!doc?.body||!allowed())return;const available=Math.max(100,frame.clientWidth-32);doc.querySelectorAll('.worksheet-page,.paperPage,.paper,.paper-page').forEach(page=>{let wrap=page.parentElement;if(!wrap.classList.contains('archive-fit')){wrap=doc.createElement('div');wrap.className='archive-fit';page.before(wrap);wrap.append(page);}page.style.width='210mm';page.style.maxWidth='none';page.style.margin='0';page.style.transform='none';const w=page.offsetWidth,h=page.offsetHeight,scale=Math.min(1,available/w);page.style.transformOrigin='top left';page.style.transform=`scale(${scale})`;wrap.style.width=w*scale+'px';wrap.style.height=h*scale+'px';});}
new ResizeObserver(fit).observe($('worksheetDocument'));$('worksheetDocument').onload=()=>{fit();$('worksheetDocument').contentDocument?.fonts?.ready.then(fit);for(const img of $('worksheetDocument').contentDocument?.images||[])img.addEventListener('load',fit,{once:true});};
$('source').onchange=()=>{const next=P.sources.find(s=>s.key===$('source').value);if(parent!==window&&next){const url=new URL('oefenbladen/maken.html',base);url.searchParams.set('source',next.id);url.searchParams.set('topic',next.topic);const event=new CustomEvent('leraarbob:worksheet-route',{cancelable:true,detail:{href:url.href}});document.dispatchEvent(event);if(event.defaultPrevented){$('source').value=source.key;return;}}choose();};$('includeKey').onchange=show;
$('makerForm').onchange=e=>{if(e.target.id!=='source'&&snapshot)$('makerStatus').textContent='Keuzes aangepast. Het voorbeeld blijft je vorige reeks; genereer een nieuwe reeks om deze keuzes te gebruiken.';};
$('makerForm').onsubmit=async e=>{
 e.preventDefault();if(!allowed()||busy||!provider)return;const current=turn,scope=owner,active=provider;busy=true;controls();$('makerStatus').textContent='Opgaven en verbetersleutel maken…';
 try{const next=await active.generate(values(),snapshot);if(current!==turn||scope!==owner||!allowed())return;snapshot=next;busy=false;archive.invalidate();show();controls();$('makerStatus').textContent='';await archive.save(true);if(current===turn&&allowed())await collection();}
 catch(error){if(current===turn&&allowed())$('makerStatus').textContent=error.message;}
 finally{if(current===turn){busy=false;controls();}}
};
$('printWorksheet').onclick=()=>{if(allowed()&&snapshot){$('worksheetDocument').contentWindow.focus();$('worksheetDocument').contentWindow.print();}};
document.addEventListener('worksheet:saved',()=>collection());
document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||parent===window)return;try{if(!parent.LeraarBobDesktop)return;const event=new CustomEvent('leraarbob:worksheet-route',{cancelable:true,detail:{href:a.href}});document.dispatchEvent(event);if(event.defaultPrevented)e.preventDefault();}catch{}});
try{
 owner=await L.ready();window.AxiomaAuth?.onChange?.(detail=>{const next=detail.account?.id?'account:'+detail.account.id:'guest';if(owner&&(detail.pending||next!==owner)){owner=null;turn++;snapshot=null;provider=null;busy=false;archive.invalidate();$('worksheetDocument').srcdoc='';$('worksheetDocument').hidden=true;$('savedSeries').replaceChildren();$('makerFields').replaceChildren();$('makerStatus').textContent='Account gewijzigd. Open je eigen oefenbladmap opnieuw.';controls();}});
 const found=P.sources.find(s=>s.id===params.get('source')&&(!params.get('topic')||s.topic===params.get('topic')))||P.sources[0];$('source').value=found.key;await choose();
}catch(e){$('makerStatus').textContent=e.message;controls();}
window.LeraarBobWorksheetMaker=Object.freeze({worksheetSnapshot:()=>{if(!allowed()||!snapshot)throw Error('Maak eerst een reeks.');return copy(snapshot);},state:()=>({source:source?.id,topic:source?.topic,busy,ready:!!provider&&allowed()})});
function copy(value){return JSON.parse(JSON.stringify(value));}
})();
