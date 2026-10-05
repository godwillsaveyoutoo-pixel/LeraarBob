/* Seven short equation missions. Old topic records are read, never overwritten. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'),require('./learning-core.js'),require('./world-core.js'),require('./fraction-core.js'));else root.AlgebraJourney=factory(root.AlgebraCore,root.AlgebraLearning,root.AlgebraWorld,root.AlgebraFractions)})(globalThis,(C,L,W,F)=>{
'use strict';
const stops=[
 {id:'route-inverse',title:'Eén bewerking',short:'Eén bewerking',skills:['A2','A3','A1','A4'],example:'x + 4 = 9',goal:'Maak optellen, aftrekken, vermenigvuldigen en delen ongedaan.',recipe:[['A2',0],['A3',2],['A1',3],['A4',3],['A2','verify'],['A3',4]]},
 {id:'route-two',title:'Twee stappen',short:'Twee stappen',skills:['B1','B2'],example:'3x + 6 = 18',goal:'Werk de losse term weg en maak daarna de factor ongedaan.',recipe:[['B1',0],['B2',1],['B1',2],['B2',3],['B1',3],['B2',4]]},
 {id:'route-sign',title:'Negatieve x-term',short:'Negatieve x-term',skills:['B3'],example:'10 − 2x = 4',goal:'Behoud het minteken en deel door de juiste factor.',recipe:[['B3',0],['B3',1],['B3',2],['B3',3],['B3',3],['B3',4]]},
 {id:'route-both',title:'x aan beide leden',short:'Beide leden',skills:['E3','E2'],example:'3x = x + 8',goal:'Verzamel de x-termen aan het lid dat jij kiest.',recipe:[['E3',0],['E2',1],['E3',2],['E2',3],['E3',3],['E2',4]]},
 {id:'route-brackets',title:'Haakjes',short:'Haakjes',skills:['C1','C2','D1','D3'],example:'2(3x − 1) + 4 = 14',goal:'Herken de groep en houd rekening met elke term binnen en buiten de haakjes.',recipe:[['C1',0],['C2',1],['D1',2],['D3',3],['D1',3],['C2',4]]},
 {id:'route-fractions',title:'Breuken',short:'Breuken',skills:['B4','B5','D2'],example:'x / 3 + 1 / 2 = 5 / 6',goal:'Maak losse breuken gelijknamig of werk alle noemers weg.',recipe:[['B4',0],['B5',1],['D2',2],['B4',3],['D2',3],['B5',4]]},
 {id:'route-check',title:'Routes en controle',short:'Routes & controle',skills:['E1'],example:'4x + 6 = 2x + 10',goal:'Kies een doelgerichte route en controleer de oplossing in beide leden.',recipe:[['E1',0],['E1',1],['E1',2],['E1',3],['E1','verify'],['E1','verify']]}
];
const systems=W.world('systems').topics;
const worlds=[
 {id:'letters',title:'Letters begrijpen',scene:'letters',ready:false,goal:'Van een letter als onbekende naar een uitdrukking met betekenis.'},
 {id:'expressions',title:'Rekenen met letters',scene:'expressions',ready:false,goal:'Gelijksoortige termen, distributiviteit, machten en wortels.'},
 {id:'equations',title:'Vergelijkingen',scene:'equations',ready:true,stops,goal:'Maak x vrij. Kies, schrijf, los op en controleer.'},
 {id:'formulas',title:'Formules',scene:'formulas',ready:false,goal:'Vul waarden in en vorm een formule om.'},
 {id:'systems',title:'Stelsels',scene:'systems',ready:true,stops:systems,goal:'Twee vergelijkingen, één gezamenlijke oplossing.'}
];
const stop=id=>stops.find(s=>s.id===id),world=id=>worlds.find(w=>w.id===id);
function worldFor(id){if(world(id))return id;const old=W.world(id)||W.world(W.topic(id)?.world);return old?.engine==='systems'?'systems':'equations';}
function mission(id,seed=Date.now(),options={}){
 const s=stop(id);if(!s)throw Error('Onbekende halte.');
 const tasks=s.recipe.map(([skill,index],i)=>{
  const sub=L.mission(skill,(seed+i*104729)>>>0);
  const t={...(s.id==='route-fractions'&&i===0?F.task(seed,options.intro):sub.tasks[index==='verify'?4:index]),id:id+':'+seed+':'+i};
  if(index==='verify'){
   t.kind='verify';t.proposed=t.ex.solution.add(C.R(i===4?(seed&1):1-(seed&1)));delete t.display;
   t.prompt='Is deze x-waarde een oplossing? Vul haar in en vergelijk links en rechts.';
   t.goal='Controleer een oplossing door exact in te vullen.';
  }
  t.guided=i<2;t.stage=i<2?(i?'Begeleid oefenen':'Ontdek'):({predict:'Bouw zelf',solve:'Los zelf op',verify:'Test een x-waarde',build:'Bouw zelf',expand:'Werk zelf uit',repair:'Herstel zelf',routes:'Kies je route',fractions:'Kies je aanpak'})[t.kind];
  if(s.id==='route-fractions'&&i===4){t.ex=C.generateSeeded('D2',{allowFractions:true,allowDecimals:false,allowNegative:false},i,(seed+i*104729)>>>0);}
  if(t.kind==='solve'){
   const states=[t.ex.start],steps=[];
   for(const st of t.ex.steps){if(C.solvedEquation(states.at(-1)))break;const after=C.applyEquation(states.at(-1),st.op,st.operand);if(C.eqSig(after)!==C.eqSig(states.at(-1))){steps.push(st);states.push(after);}}
   t.ex={...t.ex,steps,states};
  }
  return t;
 });
 return {version:2,routeVersion:id==='route-fractions'?2:1,skill:id,seed,index:0,tasks,results:tasks.map(t=>({kind:t.kind,goal:t.goal,done:false,supported:t.guided,errors:0,hints:0,input:'',left:'',right:'',choice:''})),completed:false,work:{}};
}
// A new round excludes the previous round's actual displayed equations.
// Resuming an unfinished run does not call this factory.
function questionSignature(t){return t.display||C.eqSig(t.ex.start);}
function freshMission(id,previous,seed=Date.now()){
 const route=stop(id),topic=W.topic(id);if(!route&&(!topic||topic.engine!=='equations'))throw Error('Onbekende halte.');
 const old=new Set((previous?.tasks||[]).map(questionSignature));
 for(let i=0;i<256;i++){
  const nextSeed=(seed+i*104729)>>>0,run=route?mission(id,nextSeed,{intro:!previous}):L.mission(topic.skill,nextSeed);
  const questions=run.tasks.map(questionSignature);
  if(new Set(questions).size===questions.length&&questions.every(q=>!old.has(q)))return run;
 }
 throw Error('Er kon geen nieuwe reeks worden gemaakt. Probeer opnieuw.');
}
const cleanEvidence=e=>({kind:String(e.kind||'solve'),goal:String(e.goal||'').slice(0,180),done:e.done===true,supported:!!e.supported,errors:Math.max(0,Number(e.errors)||0),hints:Math.max(0,Number(e.hints)||0)});
function normalize(raw){const out={version:1,stops:{}};for(const s of stops){const r=raw?.stops?.[s.id];if(!r)continue;const evidence=Array.isArray(r.evidence)?r.evidence.slice(0,6).map(cleanEvidence):[];const finished=evidence.length===6&&evidence.every(e=>e.done);out.stops[s.id]={evidence,finished,independent:finished&&(r.independent===true||independently(evidence)),rewarded:finished&&r.rewarded===true,xp:finished&&r.rewarded===true&&r.xp===30?30:0};}return out;}
function independently(evidence){return evidence.filter(r=>r.done&&!r.supported&&!r.errors&&!r.hints).length>=3&&evidence.some(r=>r.kind==='solve'&&r.done&&!r.supported&&!r.errors&&!r.hints);}
function info(progress,id,runs={},oldJourney=null,oldSolved=[]){
 const s=stop(id),p=normalize(progress).stops[id];if(!s)return null;
 const old=W.normalize(oldJourney),legacy=s.skills.every(k=>old.topics['eq-'+k]?.finished===true);
 const earlier=s.skills.some(k=>oldSolved.includes(k)||W.complete(old,'eq-'+k));
 const oldId=s.skills.map(k=>'eq-'+k).find(k=>runs[k]&&!runs[k].completed);
 const activeId=runs[id]&&!runs[id].completed?id:oldId||id,run=runs[activeId],started=!!run&&!run.completed,done=run?.results?.filter(r=>r.done).length||0;
 const finished=!!p?.finished||legacy,independent=!!p?.independent;
 return {finished,independent,started,done,earlier,activeId,total:run?.tasks?.length||6,status:started?'Bezig':independent?'Zelfstandig gelukt':finished?'Geoefend':earlier?'Eerder geoefend':'Nog te oefenen'};
}
function record(progress,id,evidence,oldJourney){
 const next=normalize(progress),s=stop(id);
 if(!s||!Array.isArray(evidence)||evidence.length!==6||evidence.some(r=>!r.done))return {progress:next,xp:0};
 const prev=next.stops[id],old=W.normalize(oldJourney),already=!!prev?.rewarded||s.skills.some(k=>old.topics['eq-'+k]?.rewarded);
 const independent=independently(evidence)||!!prev?.independent;
 next.stops[id]={evidence:evidence.map(cleanEvidence),finished:true,independent,rewarded:true,xp:prev?.rewarded?prev.xp:already?0:30};
 return {progress:next,xp:already?0:30};
}
function xp(progress){return Object.values(normalize(progress).stops).reduce((n,s)=>n+s.xp,0);}
function platform(progress,oldJourney,systemsJourney){
 const completed=stops.filter(s=>info(progress,s.id,{},oldJourney).finished).map(s=>s.id);
 const sys=W.normalize(systemsJourney);for(const s of systems)if(sys.topics[s.id]?.finished)completed.push(s.id);
 return {completed,total:stops.length+systems.length};
}
function next(progress,runs,oldJourney,oldSolved=[]){return stops.find(s=>!info(progress,s.id,runs,oldJourney,oldSolved).finished)||stops.find(s=>!info(progress,s.id,runs,oldJourney,oldSolved).independent)||null;}
return Object.freeze({stops,worlds,stop,world,worldFor,mission,freshMission,questionSignature,normalize,info,record,xp,platform,next,independently});
});
