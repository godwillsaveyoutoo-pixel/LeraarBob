/* Shared A4 document frame; each subject provides its own paper questions and key. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('./worksheet-layout.js'));else root.LeraarBobWorksheetRender=factory(root.LeraarBobWorksheetLayout)})(globalThis,L=>{
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(doc,kind='questions',subject){
 const {title,types,modes,graph,student,answer}=subject;
 if(!['questions','key'].includes(kind))throw Error('Onbekend document');
 const key=kind==='key';
 const items=doc.tasks.map(t=>({...t,height:key?(t.keyHeight??(!t.graph?64:t.height)):t.height})),pages=L.paginate(items);
 return {count:pages.length,html:pages.map((rows,i)=>`<section class="worksheet-page" aria-label="${key?'Verbetersleutel':'Oefenblad'} pagina ${i+1}"><header class="sheet-heading"><div><span class="sheet-brand">leraarBob · Rechtenwereld</span><h2>${esc(title)}${key?' · verbetersleutel':''}</h2></div><div class="sheet-identity">${key?`Reeks ${esc(doc.code)}<br>${esc(modes[doc.config.mode])}`:'Naam: ___________________<br>Klas: ______ &nbsp; Datum: __________'}</div></header><div class="sheet-content">${rows.map(row=>`<div class="worksheet-row" style="height:${row.height}mm">${row.items.map(t=>`<article class="worksheet-question span-${t.span}" data-question="${t.number}" data-skill="${t.skill}"><h3><span class="question-number">${t.number}</span>${esc(types.find(c=>c.id===t.type).label)}${!key&&t.guided?'<small>Met tussenstappen</small>':''}</h3><div class="question-body${t.graph?' has-graph':''}">${t.graph?graph(t,key):''}<div class="question-work">${key?answer(t):student(t)}</div></div></article>`).join('')}</div>`).join('')}</div><footer class="sheet-footer"><span>${key?'Verbetersleutel':'Oefenblad'} · ${esc(doc.code)} · ${esc(modes[doc.config.mode])}</span><span>${i+1} / ${pages.length}</span></footer></section>`).join('')};
}
return Object.freeze({render});
});
