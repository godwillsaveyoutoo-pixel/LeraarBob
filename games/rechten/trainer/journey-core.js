/* A small world preference layer. Mathematics, mastery and XP belong to the trainer. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.RechtenJourney=api})(globalThis,()=>{
'use strict';
const skills=['point','point_plot','delta','slope','slope_from_two_points'];
const places=[
 {id:'tower',name:'Uitkijktoren',skills:['point','point_plot'],type:'Ontdekking',story:'Breng de vallei in kaart. Lees coördinaten en plaats herkenningspunten.',icon:'M18 48V18h24v30M15 18l15-12 15 12M25 48V35h10v13M25 23h10v7'},
 {id:'trail',name:'Meetpad',skills:['delta','slope'],type:'Onderzoek',story:'Vergelijk routes: hoeveel ga je opzij en hoeveel omhoog of omlaag?',icon:'M8 46h18V32h16V18h10M8 46l44-28M14 40v-9m0 0-4 5m4-5 4 5'},
 {id:'bridge',name:'Verbindingsbrug',skills:['slope_from_two_points'],type:'Constructie',story:'Verbind twee meetpunten. Gebruik hun verschillen om de helling te bepalen.',icon:'M5 42h50M10 42V22m40 20V22M10 25q20 24 40 0M20 33v9m10-6v6m10-9v9'}
];
function data(state){
 if(!state.journey||state.journey.version!==1)state.journey={version:1,selected:'tower',visits:{},proof:{},active:null,last:null};
 return state.journey;
}
function available(place,unlocked){return place.skills.some(k=>unlocked.includes(k))}
function missing(state,ready){return skills.filter(k=>!ready(state,k))}
function begin(state,place,mode,id,unlocked,ready){
 const j=data(state);
 if(j.active||state.session.answered!==0)return false;
 if(mode==='challenge'&&missing(state,ready).length)return false;
 if(mode!=='challenge'&&mode!=='camp'&&!places.some(p=>p.id===place&&available(p,unlocked)))return false;
 const targets=skills.filter(k=>!j.proof[k]);
 j.active={id,place,mode,results:[],targets:targets.length?targets:[...skills],draft:null};
 j.selected=places.some(p=>p.id===place)?place:j.selected;j.last=null;return true;
}
function choice(state,unlocked){
 const j=data(state),a=j.active;if(!a)return null;
 const ix=state.session.answered;
 // Explicit independent coverage; a retake concentrates on missing evidence.
 const slot=[0,2,4,7,10].indexOf(ix);
 if(a.mode==='challenge'&&slot!==-1){const skill=a.targets[slot%a.targets.length];return {skill,kind:'challenge',difficulty:1,objective:true,...(skill==='slope_from_two_points'?{variant:3}:skill==='point_plot'?{variant:3}:{})}}
 // Guaranteed service moments, including review from outside this area.
 if([1,4,7,9].includes(ix)){
  const due=state.review.filter(r=>unlocked.includes(r.skill)&&r.due<=state.total);
  for(const k of unlocked)if(state.skills[k].refreshDue!=null&&state.skills[k].refreshDue<=state.total&&!state.review.some(r=>r.kind==='repair'&&r.skill===k))due.push({skill:k,kind:'refresh',due:state.skills[k].refreshDue});
  due.sort((a,b)=>a.due-b.due);
  if(due.length){const r=due[0];return {skill:r.skill,kind:r.kind,reviewId:r.id||null,...(r.difficulty!=null?{difficulty:r.difficulty}:{}),scaffold:r.misses>=2}}
 }
 const place=places.find(p=>p.id===a.place);
 if(a.mode==='discover'&&[0,3,5,8,10].includes(ix)){
  const pool=place.skills.filter(k=>unlocked.includes(k));
  const skill=pool.find(k=>!state.skills[k].intro)||pool.sort((a,b)=>state.skills[a].strength-state.skills[b].strength||state.skills[a].lastSeen-state.skills[b].lastSeen)[0];
  if(skill)return {skill,kind:'learning-edge',intro:!state.skills[skill].intro};
 }
 if(ix===2&&a.mode!=='challenge'){
  const earlier=skills.slice(0,Math.max(1,skills.indexOf(place?.skills[0]))).filter(k=>unlocked.includes(k)&&state.skills[k].intro);
  earlier.sort((a,b)=>state.skills[a].lastSeen-state.skills[b].lastSeen);
  if(earlier.length)return {skill:earlier[0],kind:'journey-recall'};
 }
 return null; // Ordinary global planner still controls the remaining questions.
}
function tag(state,task,objective=false){const a=data(state).active;if(a)task.journey={id:a.id,objective};return task}
function result(state,task,ok){
 const j=data(state),a=j.active;
 if(!task.journey)return true;
 if(!a||a.id!==task.journey.id||a.results.some(r=>r.id===task.id))return false;
 const independent=!!ok&&!task.journeyHelp&&!task.scaffold&&!task.work?.help&&!task.work?.errors?.length;
 a.results.push({id:task.id,skill:task.skill,ok:!!ok,independent});
 task.journeyRecorded=true;task.journeyCorrect=!!ok;
 if(a.mode==='challenge'&&task.journey.objective&&independent)j.proof[task.skill]=true;
 return true;
}
function finish(state){
 const j=data(state),a=j.active;if(!a)return;
 j.visits[a.place]=(j.visits[a.place]||0)+1;
 j.last={place:a.place,mode:a.mode,answered:a.results.length,independent:a.results.filter(r=>r.independent).length,passed:skills.every(k=>j.proof[k])};
 j.active=null;
}
return {skills,places,data,available,missing,begin,choice,tag,result,finish};
});
