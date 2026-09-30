(()=>{
'use strict';
const subjects={signaalstad:{title:'Signaalstad',intro:'Van een tabel naar punten en een rechte. Oefen het al uitgewerkte onderdeel van deze wereld.',core:SignaalstadWorksheet,view:SignaalstadWorksheetView},hellingrug:{title:'Hellingrug',intro:'Van veranderingen aflezen naar zelf de helling bepalen.',core:HellingrugWorksheet,view:HellingrugWorksheetView},grenspas:{title:'Grenspas',intro:'Van de nulwaarde naar tekens en x-gebieden.',core:GrenspasWorksheet,view:GrenspasWorksheetView},formulewerf:{title:'Formulewerf',intro:'Van a en b naar zelf voorschriften bepalen en rechten tekenen.',core:FormulewerfWorksheet,view:FormulewerfWorksheetView}};
const requested=new URLSearchParams(location.search).get('world'),world=Object.hasOwn(subjects,requested)?requested:'hellingrug';
const {title,core:C,view:V}=subjects[world],KEY=`leraarbob.worksheets.${world}.v1`;
const $=id=>document.getElementById(id),form=$('worksheetForm'),preview=$('worksheetPreview');
let doc,kind='questions',dirty=false;
$('worksheetWorld').value=world;
$('worksheetWorld').onchange=()=>{const url=new URL(location.href);url.searchParams.set('world',$('worksheetWorld').value);location.assign(url)};
for(const id of ['worksheetWorldLink','worksheetMenuBack']){$(id).href='index.html#'+world;$(id).textContent=id==='worksheetMenuBack'?'Terug naar '+title:title;}
$('worksheetPlayLink').href='play.html?world='+world;
const intro=document.querySelector('.worksheet-intro');intro.querySelector('h1').textContent=title;intro.querySelector('p').textContent=subjects[world].intro;intro.querySelector('.back-link').href='index.html#'+world;intro.querySelector('.back-link').textContent='← Naar '+title;

$('worksheetTypes').innerHTML=C.types.map(t=>`<label class="worksheet-type"><input type="checkbox" value="${t.id}" checked><span><strong>${t.label}</strong><small>${t.example}</small></span></label>`).join('');
const seed=()=>{const values=new Uint32Array(1);crypto.getRandomValues(values);return values[0]||1};
function save(){try{localStorage.setItem(KEY,JSON.stringify({version:C.VERSION,config:doc.config,kind}))}catch{$('worksheetNotice').textContent='Je kunt dit blad gebruiken. Bewaren op dit toestel is niet beschikbaar.'}}
function syncForm(){for(const input of form.querySelectorAll('[type=checkbox]'))input.checked=doc.config.types.includes(input.value);$('worksheetMode').value=doc.config.mode;$('worksheetCount').value=String(doc.config.count)}
function fit(){for(const wrapper of preview.children){const sheet=wrapper.firstElementChild,scale=Math.min(1,(preview.clientWidth-2*parseFloat(getComputedStyle(preview).paddingLeft))/sheet.offsetWidth);sheet.style.transform=`scale(${scale})`;wrapper.style.width=sheet.offsetWidth*scale+'px';wrapper.style.height=sheet.offsetHeight*scale+'px'}}
function render(){
 const questions=V.render(doc),key=V.render(doc,'key'),selected=kind==='key'?key:questions;
 const template=document.createElement('template');template.innerHTML=selected.html;
 preview.replaceChildren(...[...template.content.children].map(sheet=>{const wrapper=document.createElement('div');wrapper.className='page-wrapper';wrapper.append(sheet);return wrapper}));
 $('worksheetSummary').textContent=`${doc.tasks.length} oefeningen · ${questions.count} pagina${questions.count===1?'':'’s'} + ${key.count} pagina${key.count===1?'':'’s'} sleutel`;
 $('worksheetCode').textContent=`Reeks ${doc.code} · ${C.modes[doc.config.mode]}`;
 $('showQuestions').setAttribute('aria-pressed',String(kind==='questions'));$('showKey').setAttribute('aria-pressed',String(kind==='key'));
 $('printWorksheet').textContent=kind==='key'?'Sleutel: PDF / afdrukken':'Oefenblad: PDF / afdrukken';
 document.title=`${title} ${doc.code} · ${kind==='key'?'verbetersleutel':'oefenblad'} · leraarBob`;
 fit();save();
}
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved){doc=C.restore(saved);kind=saved.kind==='key'?'key':'questions'}}catch{$('worksheetNotice').textContent='De vorige reeks kon niet worden hervat. Er staat een nieuw voorbeeld klaar.'}
doc||=C.generate({seed:seed()});syncForm();render();
form.addEventListener('change',event=>{if(event.target.id==='worksheetWorld')return;dirty=true;$('worksheetNotice').textContent='Je keuzes zijn aangepast. Klik op ‘Maak een nieuwe reeks’ om ze te gebruiken.';$('printWorksheet').disabled=true});
form.addEventListener('submit',e=>{e.preventDefault();try{doc=C.generate({types:[...form.querySelectorAll('input:checked')].map(i=>i.value),mode:$('worksheetMode').value,count:Number($('worksheetCount').value),seed:seed()});dirty=false;kind='questions';$('printWorksheet').disabled=false;$('worksheetNotice').textContent='Nieuwe reeks klaar. Het voorbeeld en de sleutel horen bij dezelfde opgaven.';render()}catch(error){dirty=true;$('printWorksheet').disabled=true;$('worksheetNotice').textContent=error.message}});
$('showQuestions').onclick=()=>{kind='questions';render()};$('showKey').onclick=()=>{kind='key';render()};
$('printWorksheet').onclick=async()=>{if(dirty)return;await document.fonts.ready;window.print()};
new ResizeObserver(fit).observe(preview);addEventListener('afterprint',fit);
window.RechtenWorksheetApp=Object.freeze({snapshot:()=>JSON.parse(JSON.stringify({doc,kind,dirty}))});
window[title+'WorksheetApp']=window.RechtenWorksheetApp;
})();
