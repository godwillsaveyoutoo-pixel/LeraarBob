/* Data-only sequences; adapters own effects, never the sequence cursor. */
(function(root,factory){if(typeof module==='object')module.exports=factory();else root.LessonStage=factory();})(globalThis,()=>{
 'use strict';
 const types=Object.freeze(['scene','text','draw','animate','audio','pause','poll','liveJoin','pdf','exercise','game','battle','results']);
 const pathsValid=paths=>Array.isArray(paths)&&paths.length>0&&paths.every(path=>Array.isArray(path)&&path.length>=2&&path.every(point=>Array.isArray(point)&&point.length===2&&point.every(Number.isFinite)));
 function validate(lesson){
  if(!lesson?.id||lesson.version!==1||!Array.isArray(lesson.steps)||!lesson.steps.length)throw Error('Ongeldige les.');
  const ids=new Set();for(const step of lesson.steps){if(!step.id||ids.has(step.id)||!Array.isArray(step.events)||!step.events.length)throw Error('Elke stap heeft een unieke id en events nodig.');ids.add(step.id);
   for(const e of step.events){if(!types.includes(e.type))throw Error('Onbekend event: '+e.type);if(e.at!=null&&(!Number.isFinite(e.at)||e.at<0))throw Error('Ongeldige timing.');
    if(e.type==='text'&&typeof e.text!=='string')throw Error('Een tekstevent heeft tekst nodig.');
    if(e.duration!=null&&(!Number.isFinite(e.duration)||e.duration<=0))throw Error('Duur moet positief zijn.');
    if(e.type==='pause'&&!Number.isFinite(e.duration))throw Error('Een pauze heeft een duur nodig.');
    if(e.type==='scene'&&typeof e.art!=='string')throw Error('Een scène heeft een tekening nodig.');
    if(e.type==='poll'&&(!e.id||typeof e.question!=='string'||!e.question.trim()||!Array.isArray(e.options)||e.options.length<2||e.options.length>6||e.options.some(o=>typeof o!=='string'||!o.trim())||typeof e.anonymous!=='boolean'))throw Error('Een poll heeft een id, vraag, 2–6 keuzes en privacykeuze nodig.');
    if(e.type==='pdf'&&typeof e.slot!=='string')throw Error('Een document heeft een slot nodig.');
    if(['exercise','game'].includes(e.type)&&typeof e.src!=='string')throw Error('Een module heeft een bron nodig.');
    if(e.type==='results'&&(!['poll','battle'].includes(e.source)||e.source==='poll'&&!e.poll))throw Error('Een uitslag heeft een bron nodig.');
    if(e.type==='draw'&&e.paths&&!pathsValid(e.paths))throw Error('Ongeldig tekenpad.');
    if(e.type==='animate'&&e.action==='morph'){if(!pathsValid(e.from)||!pathsValid(e.to)||e.from.length!==e.to.length||e.from.some((path,i)=>path.length!==e.to[i].length))throw Error('Morph-paden moeten overeenkomen.');}
   }}
  return lesson;
 }
 function create({lesson,adapters,storage,onChange=()=>{},onError=()=>{}}){
  validate(lesson);const key='lesson-stage:'+lesson.id+':v'+lesson.version;let index=0,controller,run=0;
  try{const saved=JSON.parse(storage?.getItem(key)||'null');if(saved){const id=saved.step||lesson.previousStepIds?.[saved.index],found=lesson.steps.findIndex(s=>s.id===id);if(found>=0)index=found;else if(Number.isInteger(saved.index))index=Math.max(0,Math.min(lesson.steps.length-1,saved.index));}}catch{}
  function show(next=index){controller?.abort();controller=new AbortController();const signal=controller.signal,token=++run;index=Math.max(0,Math.min(lesson.steps.length-1,next));
   const step=lesson.steps[index];try{storage?.setItem(key,JSON.stringify({index,step:step.id}));}catch{}onChange({index,step,total:lesson.steps.length});
   for(const e of step.events){const execute=()=>{if(signal.aborted||token!==run)return;Promise.resolve().then(()=>{if(signal.aborted)return;return adapters[e.type]?.(e,{signal,step,index,replay:token});}).catch(err=>{if(!signal.aborted)onError(err);});};if(e.at){const timer=setTimeout(execute,e.at);signal.addEventListener('abort',()=>clearTimeout(timer),{once:true});}else execute();}
   return step;
  }
  return {show,next:()=>show(index+1),previous:()=>show(index-1),restart:()=>show(),skip:()=>show(index+1),go:id=>{const i=lesson.steps.findIndex(s=>s.id===id);if(i<0)throw Error('Onbekende stap');return show(i)},get index(){return index},get step(){return lesson.steps[index]},destroy:()=>controller?.abort()};
 }
 return {types,validate,create};
});
