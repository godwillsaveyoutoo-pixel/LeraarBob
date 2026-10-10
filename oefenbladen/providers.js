/* Paper-only adapters. Load question/render engines, never a game controller or progress store. */
(()=>{
'use strict';
const base=new URL('../',document.currentScript.src),loaded=new Map(),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sources=[...['hellingrug','grenspas','formulewerf','signaalstad'].map(topic=>({id:'rechtenwereld:'+topic,theme:'rechten',topic,title:topic[0].toUpperCase()+topic.slice(1),group:'Rechtenwereld'})),...['equations','systems'].map(topic=>({id:'algebra-trainer:'+topic,theme:'algebra',topic,title:topic==='systems'?'Stelsels':'Vergelijkingen',group:'Algebrawereld'})),...['machten','wortels','wetenschappelijk'].map(topic=>({id:'bewerkingen-trainer:operations',theme:'getallen',topic,title:{machten:'Machten',wortels:'Vierkantswortels',wetenschappelijk:'Wetenschappelijke notatie'}[topic],group:'Getallenwereld'}))].map(s=>({...s,key:s.id+'|'+s.topic}));
const seed=()=>crypto.getRandomValues(new Uint32Array(1))[0]||1,copy=v=>JSON.parse(JSON.stringify(v));
async function scripts(paths){for(const path of paths){if(!loaded.has(path))loaded.set(path,new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL(path,base).href;script.onload=resolve;script.onerror=()=>{loaded.delete(path);script.remove();reject(Error('De opgaven konden niet laden. Probeer opnieuw.'));};document.head.append(script);}));await loaded.get(path);}}
const select=(id,label,options,value)=>({id,label,type:'select',options:options.map(o=>Array.isArray(o)?{id:String(o[0]),label:o[1]}:o),value:String(value??options[0]?.id??options[0]?.[0])});
const checks=(id,label,options)=>({id,label,type:'checks',options:options.map(o=>({...o,id:String(o.id)})),value:options.map(o=>String(o.id))});
const number=(id,label,value,min,max)=>({id,label,type:'number',value,min,max});
const chunks=(a,n)=>Array.from({length:Math.ceil(a.length/n)},(_,i)=>a.slice(i*n,i*n+n));
const math=tex=>katex.renderToString(tex,{throwOnError:false,displayMode:true});
function requireCount(value,min,max){const n=Number(value);if(!Number.isInteger(n)||n<min||n>max)throw Error(`Kies ${min}–${max} opgaven.`);return n;}
function selected(values,options){const list=options.filter(o=>values?.includes(o.id));if(!list.length)throw Error('Kies minstens één vraagvorm.');return list;}
async function algebra(s){
 await scripts(['shared/vendor/katex/katex.min.js',...['core','world-core','fraction-core','learning-core','journey-core','journey-paper'].map(p=>'games/algebra-trainer/'+p+'.js')]);
 if(s.topic==='systems')await scripts(['games/algebra-trainer/stelsels/core.js','games/algebra-trainer/stelsels/paper.js']);
 const systems=s.topic==='systems',levels=systems?AlgebraWorld.world('systems').topics:AlgebraJourney.stops;
 return {fields:[select('level','Onderdeel',levels.map(t=>({id:t.id,label:t.title})),levels[0].id),number('count','Aantal opgaven',systems?5:6,systems?1:6,systems?15:18),...(systems?[select('difficulty','Moeilijkheid',[['beginner','Beginner'],['basis','Basis'],['advanced','Verdieping']],'beginner'),select('method','Uitwerking in de sleutel',[['graphic','Grafisch'],['substitution','Substitutie'],['combination','Combinatie']],'graphic')]:[])],
 async generate(c,previous){
  const level=levels.find(t=>t.id===c.level);if(!level)throw Error('Kies een onderdeel.');
  const count=requireCount(c.count,systems?1:6,systems?15:18);
  if(systems){
   if(!['beginner','basis','advanced'].includes(c.difficulty)||!['graphic','substitution','combination'].includes(c.method))throw Error('Kies een niveau en uitwerkingsmethode.');
   const C=StelselsCore,seen=new Set(),exercises=[],old=new Set((previous?.data.exercises||[]).map(e=>JSON.stringify(e.start)));
   for(let i=0;i<count;i++){
    const kind=['none','infinite'].includes(level.skill)?level.skill:i%5===4?'none':'unique';let ex;
    for(let attempt=0;attempt<1000;attempt++){const next=C.generate(seed(),c.difficulty,kind),key=JSON.stringify(next.start);if(!seen.has(key)&&!old.has(key)){ex=next;seen.add(key);break;}}
    if(!ex)throw Error('Er kon geen nieuwe reeks worden gemaakt. Probeer opnieuw.');exercises.push(ex);
   }
   const pages=await StelselsPaper.build(exercises,c.method,true),html=kind=>'<div id="pages">'+pages.filter(p=>p.kind===kind).map((p,i)=>`<img class="paper-page" src="${p.url}" alt="${kind==='key'?'Verbetersleutel':'Oefenblad'}, pagina ${i+1}" width="${p.width}" height="${p.height}">`).join('')+'</div>';
   return {sourceId:s.id,title:level.title+' · '+count+' oefeningen',theme:s.theme,topic:s.topic,code:exercises[0].seed.toString(36).toUpperCase(),questionsHTML:html('questions'),keyHTML:html('key'),styles:['games/algebra-trainer/stelsels/style.css'],config:{levelId:level.id,method:c.method,level:c.difficulty,count},data:{exercises:copy(exercises)}};
  }
  if(count%6)throw Error('Een volledige vergelijkingenreeks telt 6, 12 of 18 opgaven.');
  let tasks=[],runs=[];for(let i=0;i<count/6;i++){const run=AlgebraJourney.freshMission(level.id,i?runs.at(-1):null,seed());runs.push(run);tasks.push(...run.tasks);}
  const header=key=>`<div class="sheetHeader"><div><h2>${key?'Verbetersleutel':'Vergelijkingen'} · ${esc(level.title)}</h2><p>${key?'De antwoorden horen bij deze opdrachten. Andere geldige oplosroutes zijn mogelijk.':'Lees elke opdracht. Schrijf je uitwerking en controle op.'}</p></div><div class="sheetMeta">Naam: __________________<br>Klas: ______ Datum: ______</div></div>`;
  const html=key=>'<div class="previewStack">'+chunks(tasks,3).map((items,p)=>`<section class="paperPage missionPaper">${header(key)}<div class="${key?'missionAnswers':'missionQuestions'}">${items.map((t,i)=>{const q=AlgebraJourneyPaper.question(t),a=key?AlgebraJourneyPaper.answer(t):null;return `<article><h3>${p*3+i+1}. ${esc(key?t.stage:q.prompt)}</h3>${key?a.lines.map(math).join('')+'<p>'+esc(a.note)+'</p>':math(q.math)+(q.extra?'<p>'+esc(q.extra)+'</p>':'')+'<div class="writeLines"><span></span><span></span><span></span></div>'}</article>`;}).join('')}</div><div class="pageFoot">leraarBob · ${key?'Sleutel':'Opgaven'} ${p+1}/${Math.ceil(tasks.length/3)}</div></section>`).join('')+'</div>';
  return {sourceId:s.id,title:level.title+' · '+count+' oefeningen',theme:s.theme,topic:s.topic,code:runs[0].seed.toString(36).toUpperCase(),questionsHTML:html(false),keyHTML:html(true),styles:['shared/vendor/katex/katex.min.css','games/algebra-trainer/style.css','games/algebra-trainer/journey.css'],config:{level:level.id,count},data:copy({tasks,seeds:runs.map(r=>r.seed),version:runs[0].version})};
 }};
}
async function numbers(s){
 await scripts(['shared/vendor/katex/katex.min.js','games/bewerkingen-trainer/core.js']);const inlineMath=tex=>katex.renderToString(tex,{throwOnError:false,strict:'ignore'}),C=BewerkingenCore,skills=C.SKILLS.filter(k=>k.group===s.topic);
 return {fields:[checks('skills','Vraagvormen',skills.map(k=>({id:k.id,label:k.title||k.label}))),select('difficulty','Niveau',[['0','Basis'],['1','Gemengd'],['2','Uitdaging']],'1'),number('count','Aantal opgaven',10,1,30)],async generate(c){
  const items=selected(c.skills,skills),count=requireCount(c.count,items.length,30),level=Number(c.difficulty);if(![0,1,2].includes(level))throw Error('Kies een niveau.');
  const tasks=Array.from({length:count},(_,i)=>{const id=items[i%items.length].id;return C.generate(id,seed(),level,i%4,id==='scientific'?C.SCIENTIFIC_VERSION:1);});
  const html=key=>'<div id="sheetHost">'+chunks(tasks,key?3:4).map((list,p)=>`<article class="paper"><span class="eyebrow">LERAARBOB · GETALLENWERELD</span><h1>${key?'Uitwerkingen':'Werk de opdrachten uit.'}</h1>${key?'':'<p>Naam: ____________________ &nbsp; Klas: __________</p>'}<ol start="${p*(key?3:4)+1}">${list.map(t=>`<li>${t.instruction?'<p class="sheet-instruction">'+esc(t.instruction)+'</p>':''}<div class="question">${inlineMath(t.tex)}</div>${key?'<div class="steps">'+t.steps.map(st=>'<div class="step">'+inlineMath(st)+'</div>').join('')+'</div>':(t.condition?'<div class="sheet-condition">'+esc(t.condition)+'</div>':'')+'<div class="answer-space"></div>'}</li>`).join('')}</ol></article>`).join('')+'</div>';
  return {sourceId:s.id,title:s.title+' · '+count+' oefeningen',theme:s.theme,topic:s.topic,code:tasks[0].seed.toString(36).toUpperCase(),questionsHTML:html(false),keyHTML:html(true),styles:['shared/vendor/katex/katex.min.css','games/bewerkingen-trainer/style.css','oefenbladen/paper.css'],config:{selected:items.map(k=>k.id),level,count,source:'generated'},data:copy({tasks})};
 }};
}
async function rights(s){
 const dir='games/rechten/rechtenwereld/';await scripts(['games/rechten/core/transfer-workbench-core.js','games/rechten/core/transfer-core.js','games/rechten/core/wave-core.js','shared/worksheet-layout.js','shared/worksheet-render.js',...['semantic-math-core','grens-core','lines-core','hills-core','formula-core','derive-core'].map(p=>dir+p+'.js'),...(s.topic==='signaalstad'?[dir+'worksheets/formulewerf-core.js',dir+'worksheets/formulewerf-view.js']:[]),dir+'worksheets/'+s.topic+'-core.js',dir+'worksheets/'+s.topic+'-view.js']);
 const name=s.title,C=window[name+'Worksheet'],V=window[name+'WorksheetView'];
 return {fields:[checks('types','Leerdoelen',C.types),select('mode','Opbouw',Object.entries(C.modes),'progressive'),number('count','Aantal opgaven',Math.max(8,C.types.length),1,24)],async generate(c){
  selected(c.types,C.types);const doc=C.generate({types:c.types,mode:c.mode,count:requireCount(c.count,c.types.length,24),seed:seed()});
  return {sourceId:s.id,title:s.title+' · '+doc.tasks.length+' oefeningen',theme:s.theme,topic:s.topic,code:doc.code,questionsHTML:V.render(doc).html,keyHTML:V.render(doc,'key').html,styles:['shared/worksheet-layout.css',dir+'worksheets/worksheets.css'],config:copy(doc.config),data:copy(doc)};
 }};
}
window.LeraarBobWorksheetProviders=Object.freeze({sources:Object.freeze(sources),load:s=>s.theme==='algebra'?algebra(s):s.theme==='getallen'?numbers(s):rights(s)});
})();
