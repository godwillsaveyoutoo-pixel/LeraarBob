/* Touch choices for the existing lesson stages; grading remains in lessons.js. */
(function(root,factory){if(typeof module==='object')module.exports=factory();else root.GuidedAnswer=factory();})(globalThis,()=>{
'use strict';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function choices(task,index,slotIndex,values=[]){
 const stage=task.stages[index],slot=stage.slots[slotIndex];
 if(slotIndex===0&&stage.squareChoices)return stage.squareChoices.map(String);
 let answer=Number(slot.answer);
 if(stage.accept==='square-factor'&&slotIndex===1){const f=Number(values[0]),n=Number(task.expression);if(f>1&&Number.isInteger(Math.sqrt(f))&&n%f===0)answer=n/f;}
 const powers=[...task.expression.matchAll(/\^\(?(-?\d+)/g)].map(m=>Number(m[1]));
 const numbers=(task.expression.match(/-?\d+/g)||[]).map(Number);
 let alternatives;
 if(/Exponent/i.test(slot.label)&&powers.length>1)alternatives=[powers[0]+powers[1],powers[0]*powers[1],powers[0]-powers[1],-answer,answer-1,answer+1];
 else if(/wortel|factor/i.test(slot.label))alternatives=[answer*answer,Math.floor(Math.sqrt(Math.abs(answer))),...numbers,answer*2,answer-1,answer+1];
 else alternatives=[-answer,...numbers,answer*2,answer-1,answer+1];
 const options=[...new Set([answer,...alternatives].filter(n=>Number.isSafeInteger(n)&&Math.abs(n)<10000000&&(!/noemer/i.test(slot.label)||n!==0)))].slice(0,5);
 for(let delta=2;options.length<5;delta++)if(!options.includes(answer+delta)&&(!/noemer/i.test(slot.label)||answer+delta!==0))options.push(answer+delta);
 return options.sort((a,b)=>a-b).map(String);
}
// Small renderer for our fixed lesson templates. Unknown commands fail explicitly,
// so a new curriculum template cannot silently lose its mathematical structure.
function formula(template,slot){
 if(template.startsWith('\\begin{aligned}'))return '<span class="guided-aligned">'+template.replace(/^\\begin\{aligned\}|\\end\{aligned\}$/g,'').split('\\\\').map(line=>'<span>'+formula(line.replaceAll('&',''),slot)+'</span>').join('')+'</span>';
 let i=0;
 function group(){if(template[i]!=='{')return atom();i++;const out=sequence('}');if(template[i++]!=='}')throw Error('Unclosed lesson template');return out;}
 function atom(){
  const marker=template.slice(i).match(/^\[\[(\d+)\]\]/);if(marker){i+=marker[0].length;return slot(Number(marker[1]));}
  if(template[i]==='{')return group();
  if(template[i]==='\\'){
   const command=template.slice(i).match(/^\\([a-zA-Z]+|.)/)[1];i+=command.length+1;
   if(command==='frac'){const top=group(),bottom=group();return '<span class="smart-fraction"><span>'+top+'</span><span>'+bottom+'</span></span>';}
   if(command==='sqrt')return '<span class="smart-root"><span aria-hidden="true">√</span><span class="smart-radicand">'+group()+'</span></span>';
   if(command==='underbrace'){const content=group();if(template[i++]!=='_')throw Error('Missing lesson brace label');return '<span class="guided-underbrace"><span>'+content+'</span><small>'+group()+'</small></span>';}
   if(command==='text'){const start=++i,end=template.indexOf('}',start);i=end+1;return '<small>'+esc(template.slice(start,end))+'</small>';}
   if(['left','right'].includes(command))return '';
   if(['cdot','times'].includes(command))return '<span class="smart-times">·</span>';
   if([',','quad',';','!'].includes(command))return '';
   throw Error('Unsupported lesson template: '+command);
  }
  const hit=template.slice(i).match(/^\d+/);if(hit){i+=hit[0].length;return '<span>'+hit[0]+'</span>';}
  const char=template[i++];return /[a-z]/.test(char)?'<i>'+char+'</i>':char===' '?'':'<span>'+esc(char==='-'?'−':char)+'</span>';
 }
 function sequence(end){let out='';while(i<template.length&&template[i]!==end){let part=atom();if(template[i]==='^'){i++;part='<span class="smart-power"><span>'+part+'</span><sup>'+group()+'</sup></span>';}out+=part;}return out;}
 return sequence();
}
function render(task,index,values,active){
 const stage=task.stages[index],slot=stage.slots[active];
 return '<div class="smart-answer guided-answer"><div class="smart-formula" aria-label="Bouw deze stap">'+formula(stage.template,i=>'<button type="button" class="smart-slot '+(i===active?'active':'')+'" data-slot="'+i+'" aria-expanded="'+(i===active)+'" aria-controls="guidedChoices" aria-label="'+esc(stage.slots[i].label)+': '+esc(values[i]||'kies')+'">'+esc((values[i]||'?').replace('-','−'))+'</button>')+'</div><div class="smart-choice-label">'+esc(slot.label)+'</div><div class="smart-choices" id="guidedChoices" role="group" aria-label="Kies '+esc(slot.label.toLowerCase())+'">'+choices(task,index,active,values).map(value=>'<button type="button" data-choice="'+value+'" aria-pressed="'+(values[active]===value)+'">'+esc(value.replace('-','−'))+'</button>').join('')+'</div></div>';
}
return Object.freeze({choices,formula,render});
});
