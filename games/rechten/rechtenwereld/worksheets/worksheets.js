(()=>{
'use strict';
const C=HellingrugWorksheet,V=HellingrugWorksheetView,KEY='leraarbob.worksheets.hellingrug.v1';
const $=id=>document.getElementById(id),form=$('worksheetForm'),preview=$('worksheetPreview');
let doc,kind='questions',dirty=false;
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
 document.title=`Hellingrug ${doc.code} · ${kind==='key'?'verbetersleutel':'oefenblad'} · leraarBob`;
 fit();save();
}
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved){doc=C.restore(saved);kind=saved.kind==='key'?'key':'questions'}}catch{$('worksheetNotice').textContent='De vorige reeks kon niet worden hervat. Er staat een nieuw voorbeeld klaar.'}
doc||=C.generate({seed:seed()});syncForm();render();
form.addEventListener('change',()=>{dirty=true;$('worksheetNotice').textContent='Je keuzes zijn aangepast. Klik op ‘Maak een nieuwe reeks’ om ze te gebruiken.';$('printWorksheet').disabled=true});
form.addEventListener('submit',e=>{e.preventDefault();try{doc=C.generate({types:[...form.querySelectorAll('input:checked')].map(i=>i.value),mode:$('worksheetMode').value,count:Number($('worksheetCount').value),seed:seed()});dirty=false;kind='questions';$('printWorksheet').disabled=false;$('worksheetNotice').textContent='Nieuwe reeks klaar. Het voorbeeld en de sleutel horen bij dezelfde opgaven.';render()}catch(error){dirty=true;$('printWorksheet').disabled=true;$('worksheetNotice').textContent=error.message}});
$('showQuestions').onclick=()=>{kind='questions';render()};$('showKey').onclick=()=>{kind='key';render()};
$('printWorksheet').onclick=async()=>{if(dirty)return;await document.fonts.ready;window.print()};
new ResizeObserver(fit).observe(preview);addEventListener('afterprint',fit);
window.HellingrugWorksheetApp=Object.freeze({snapshot:()=>JSON.parse(JSON.stringify({doc,kind,dirty}))});
})();
