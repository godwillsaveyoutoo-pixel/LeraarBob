/* A shared, touch-first mathematical answer: select the part, then its value. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('./core.js'));else root.SmartAnswer=factory(root.BewerkingenCore);})(globalThis,C=>{
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function model(task){
 const slots=[],powers=[...task.expression.matchAll(/\^\(?(-?\d+)/g)].map(m=>Number(m[1]));
 function slot(value,kind){
  value=String(value);const id='s'+slots.length,n=Number(value);let options;
  if(kind==='sign')options=['+','-'];
  else if(kind==='mantissa')options=[n,n*10,n/10,Math.floor(n)||1].map(v=>String(Number(v.toPrecision(8))));
  else{
   const candidates=kind==='exponent'&&powers.length>1?[powers[0]+powers[1],powers[0]*powers[1],powers[0]-powers[1],powers[1]-powers[0],powers[0],powers[1]]:kind==='exponent'?[Math.abs(n),-n,n+1,n-1]:kind==='radicand'?[n*n,Math.floor(Math.sqrt(n)),n+1,n-1]:[n+1,n-1,n*2,Math.abs(n),-n];
   options=[value,...candidates.map(String)].filter(v=>Number.isFinite(Number(v))&&Math.abs(Number(v))<=1000000000&&(kind!=='denominator'||Number(v)!==0));
   for(let i=2;new Set(options).size<5;i++)options.push(String(n+i));
  }
  options=[...new Set(options)].slice(0,5).sort((a,b)=>Number(a)-Number(b));
  const label=({exponent:'Exponent',mantissa:'Voorgetal',radicand:'Onder de wortel',numerator:'Teller',denominator:'Noemer',sign:'Teken',number:'Getal',factor:'Factor'})[kind]||'Getal';
  slots.push({id,value,kind,label,options});return{type:'slot',id};
 }
 function build(a,kind='number'){
  if(a.type==='number')return slot(C.plain(a.value),kind);
  if(a.type==='letter')return{type:'letter',value:a.letter};
  if(a.type==='sign')return{type:'sign',sign:slot(C.signature(a.value)===C.signature(a.args[0].value)?'+':'-','sign'),child:build(a.args[0],kind)};
  if(a.type==='^')return{type:'power',base:build(a.args[0],kind),exponent:slot(a.exponent,'exponent')};
  if(a.type==='root')return{type:'root',child:build(a.args[0],'radicand')};
  if(a.type==='/')return{type:'fraction',top:build(a.args[0],'numerator'),bottom:build(a.args[1],'denominator')};
  return{type:'binary',operator:a.type,choice:['+','-'].includes(a.type)?slot(a.type,'sign'):null,left:build(a.args[0],kind),right:build(a.args[1],kind)};
 }
 let tree;if(task.skill==='scientific'){const match=task.answer.match(/^([\d.]+)\*10\^\((-?\d+)\)$/);tree={type:'scientific',mantissa:slot(match[1],'mantissa'),exponent:slot(match[2],'exponent')};}
 else tree=build(C.parse(task.answer),task.skill==='square-factor'?'factor':'number');
 if(!slots.length){slots.push({id:'s0',value:task.answer,kind:'expression',label:'Vorm',options:[task.answer,task.answer+'^2','1/('+task.answer+')','1','0']});tree={type:'slot',id:'s0'};}
 function expression(values){
  if(slots.some(s=>values[s.id]===undefined))return '';
  function walk(t){if(t.type==='slot')return String(values[t.id]);if(t.type==='letter')return t.value;
   if(t.type==='scientific')return walk(t.mantissa)+'*10^('+walk(t.exponent)+')';
   if(t.type==='sign')return (walk(t.sign)==='-'?'-':'')+'('+walk(t.child)+')';
   if(t.type==='power')return '('+walk(t.base)+')^('+walk(t.exponent)+')';
   if(t.type==='root')return 'sqrt('+walk(t.child)+')';
   if(t.type==='fraction')return '('+walk(t.top)+')/('+walk(t.bottom)+')';
   return '('+walk(t.left)+')'+(t.choice?walk(t.choice):t.operator)+'('+walk(t.right)+')';
  }return walk(tree);
 }
 return{tree,slots,expression};
}
function mount(host,task,{state={},value='',disabled=false,onChange=()=>{}}={}){
 const m=model(task),values={},draft=state?.task===task.id?state.values||{}:{};
 for(const s of m.slots)if(s.options.includes(String(draft[s.id])))values[s.id]=String(draft[s.id]);
 let active=m.slots.some(s=>s.id===state.active)?state.active:m.slots[0].id;
 let legacy=value&&!Object.keys(values).length?value:'';
 const api={setDisabled(v){if(disabled!==!!v){disabled=!!v;paint();}},snapshot:()=>({task:task.id,values:{...values},active}),value:()=>m.expression(values)||legacy};
 function text(v){return v.replaceAll('-','−').replace('.',',')}
 function draw(t){
  if(t.type==='slot'){const s=m.slots.find(s=>s.id===t.id),v=values[t.id];return `<button type="button" class="smart-slot ${t.id===active?'active':''}" data-smart-slot="${t.id}" aria-label="${esc(s.label)}: ${v===undefined?'kies':esc(text(v))}" aria-expanded="${!disabled&&t.id===active}" ${disabled?'disabled':''}>${v===undefined?'?':display(s,v)}</button>`;}
  if(t.type==='letter')return `<i>${t.value}</i>`;
  if(t.type==='scientific')return `<span class="smart-scientific">${draw(t.mantissa)}<span>·</span><span class="smart-power"><span>10</span><sup>${draw(t.exponent)}</sup></span></span>`;
  if(t.type==='sign')return draw(t.sign)+draw(t.child);
  if(t.type==='power')return `<span class="smart-power">${draw(t.base)}<sup>${draw(t.exponent)}</sup></span>`;
  if(t.type==='root')return `<span class="smart-root"><span aria-hidden="true">√</span><span class="smart-radicand">${draw(t.child)}</span></span>`;
  if(t.type==='fraction')return `<span class="smart-fraction"><span>${draw(t.top)}</span><span>${draw(t.bottom)}</span></span>`;
  return draw(t.left)+(t.choice?draw(t.choice):'<span class="smart-times">·</span>')+draw(t.right);
 }
 function display(s,v){return s.kind==='expression'&&globalThis.katex?globalThis.katex.renderToString(C.tex(v),{throwOnError:false}):esc(text(v));}
 function paint(){const s=m.slots.find(s=>s.id===active);
  host.classList.add('smart-answer');host.innerHTML=`<div class="smart-formula" aria-label="Stel je antwoord samen">${draw(m.tree)}</div>${legacy?`<div class="smart-saved">Bewaard antwoord: ${esc(legacy)}</div>`:''}${disabled?'':`<div class="smart-choice-label">${esc(s.label)}</div><div class="smart-choices" role="group" aria-label="Kies ${esc(s.label.toLowerCase())}">${s.options.map(v=>`<button type="button" data-smart-value="${esc(v)}" aria-pressed="${values[active]===v}">${display(s,v)}</button>`).join('')}</div>`}`;
 }
 host.onclick=e=>{const b=e.target.closest('button');if(!b||disabled)return;
  if(b.dataset.smartSlot){active=b.dataset.smartSlot;paint();host.querySelector('[data-smart-value]')?.focus({preventScroll:true});}
  if(b.dataset.smartValue!==undefined){values[active]=b.dataset.smartValue;legacy='';const next=m.slots.find(s=>values[s.id]===undefined);if(next)active=next.id;paint();onChange(api.snapshot(),api.value());host.querySelector(`[data-smart-slot="${active}"]`)?.focus({preventScroll:true});}
 };
 paint();return api;
}
return Object.freeze({model,mount});
});
