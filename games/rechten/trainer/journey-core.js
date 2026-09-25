/* A small world preference layer. Mathematics, mastery and XP belong to the trainer. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.RechtenJourney=api})(globalThis,()=>{
'use strict';
const skills=['point','point_plot','delta','slope','slope_from_two_points'];
const regions=[
 {
  "id": "points",
  "name": "Punten en helling",
  "tag": "coördinaten, verschillen en helling",
  "at": [
   18,
   68
  ],
  "icon": "tower",
  "goal": "Lees en plaats punten. Gebruik verschillen om een helling te bepalen.",
  "places": [
   {
    "name": "Coördinaten lezen en plaatsen",
    "skills": [
     "point",
     "point_plot"
    ],
    "id": "tower",
    "region": "points",
    "story": "Lees de x- en y-coördinaat en plaats een punt in het assenstelsel.",
    "type": "Leerdoel",
    "icon": "M18 48V18h24v30M15 18l15-12 15 12M25 48V35h10v13M25 23h10v7"
   },
   {
    "name": "Verschillen en helling",
    "skills": [
     "delta",
     "slope"
    ],
    "id": "trail",
    "region": "points",
    "story": "Bepaal Δx en Δy en verbind hun verhouding met de helling.",
    "type": "Leerdoel",
    "icon": "M8 46h18V32h16V18h10M8 46l44-28"
   },
   {
    "name": "Helling uit twee punten",
    "skills": [
     "slope_from_two_points"
    ],
    "id": "bridge",
    "region": "points",
    "story": "Bereken de helling uit twee punten. Gebruik één consistente aftrekvolgorde.",
    "type": "Leerdoel",
    "icon": "M5 42h50M10 42V22m40 20V22M10 25q20 24 40 0M20 33v9m10-6v6m10-9v9"
   }
  ]
 },
 {
  "id": "properties",
  "name": "Eigenschappen van rechten",
  "tag": "richting, bijzondere rechten, a en b",
  "at": [
   35,
   25
  ],
  "icon": "trail",
  "goal": "Verbind het gedrag van een rechte met haar helling en herken a en b.",
  "places": [
   {
    "name": "Stijgen, dalen en bijzondere rechten",
    "skills": [
     "line_behavior",
     "special_lines"
    ],
    "id": "behavior",
    "region": "properties",
    "story": "Onderscheid stijgend, dalend, horizontaal, verticaal en twee identieke punten.",
    "type": "Leerdoel",
    "icon": "M18 48V18h24v30M15 18l15-12 15 12M25 48V35h10v13M25 23h10v7"
   },
   {
    "name": "a en b herkennen",
    "skills": [
     "intercept",
     "ab"
    ],
    "id": "parameters",
    "region": "properties",
    "story": "Herken het snijpunt met de y-as en de betekenis van a en b.",
    "type": "Leerdoel",
    "icon": "M8 46h18V32h16V18h10M8 46l44-28"
   }
  ]
 },
 {
  "id": "representations",
  "name": "Tabellen, grafieken en toepassingen",
  "tag": "rekenen, tekenen en gegevens gebruiken",
  "at": [
   51,
   68
  ],
  "icon": "house",
  "goal": "Wissel tussen waarden, tabellen, grafieken en situaties.",
  "places": [
   {
    "name": "Waarden berekenen en tabellen invullen",
    "skills": [
     "fx",
     "table",
     "input_from_output"
    ],
    "id": "values",
    "region": "representations",
    "story": "Bereken functiewaarden, vul een tabel in en zoek een invoer bij een gegeven uitvoer.",
    "type": "Leerdoel",
    "icon": "M18 48V18h24v30M15 18l15-12 15 12M25 48V35h10v13M25 23h10v7"
   },
   {
    "name": "Grafieken tekenen en punten controleren",
    "skills": [
     "graph_from_equation",
     "graph_from_table",
     "point_on_line"
    ],
    "id": "draw-graphs",
    "region": "representations",
    "story": "Teken een grafiek uit een voorschrift of tabel en controleer of een punt op de rechte ligt.",
    "type": "Leerdoel",
    "icon": "M8 46h18V32h16V18h10M8 46l44-28"
   },
   {
    "name": "Vergelijking herleiden",
    "skills": [
     "rewrite_linear_equation"
    ],
    "id": "rewrite",
    "region": "representations",
    "story": "Herleid een vergelijking door termen te verplaatsen en beide leden te delen.",
    "type": "Leerdoel",
    "icon": "M5 42h50M10 42V22m40 20V22M10 25q20 24 40 0M20 33v9m10-6v6m10-9v9"
   }
  ]
 },
 {
  "id": "zeros",
  "name": "Nulwaarden en tekens",
  "tag": "nul, positief en negatief",
  "at": [
   72,
   25
  ],
  "icon": "flag",
  "goal": "Bepaal waar de functiewaarde nul, positief of negatief is.",
  "places": [
   {
    "name": "Nulwaarde bepalen",
    "skills": [
     "zeroRead",
     "zero"
    ],
    "id": "zeros",
    "region": "zeros",
    "story": "Lees of bereken voor welke x de functiewaarde nul is.",
    "type": "Leerdoel",
    "icon": "M18 48V18h24v30M15 18l15-12 15 12M25 48V35h10v13M25 23h10v7"
   },
   {
    "name": "Teken en tekenschema",
    "skills": [
     "sign",
     "signchart"
    ],
    "id": "signs",
    "region": "zeros",
    "story": "Onderzoek positieve en negatieve functiewaarden en stel een tekenschema op.",
    "type": "Leerdoel",
    "icon": "M8 46h18V32h16V18h10M8 46l44-28"
   }
  ]
 },
 {
  "id": "equations",
  "name": "Voorschriften opstellen",
  "tag": "uit a en b, een punt, twee punten, tabel of grafiek",
  "at": [
   82,
   72
  ],
  "icon": "scale",
  "goal": "Stel een voorschrift op uit de beschikbare gegevens en controleer het.",
  "places": [
   {
    "name": "Voorschrift uit a en b",
    "skills": [
     "equation_from_ab"
    ],
    "id": "formula-ab",
    "region": "equations",
    "story": "Stel y = ax + b op met een gegeven a en b.",
    "type": "Leerdoel",
    "icon": "M18 48V18h24v30M15 18l15-12 15 12M25 48V35h10v13M25 23h10v7"
   },
   {
    "name": "Voorschrift uit punten",
    "skills": [
     "intercept_from_point",
     "equation_from_point_slope",
     "equation_from_two_points"
    ],
    "id": "formula-points",
    "region": "equations",
    "story": "Vul a en een punt in, werk de vergelijking zelf uit en stel het functievoorschrift op.",
    "type": "Leerdoel",
    "icon": "M8 46h18V32h16V18h10M8 46l44-28"
   },
   {
    "name": "Voorschrift uit tabel of grafiek",
    "skills": [
     "equation_from_table",
     "equation_from_graph"
    ],
    "id": "formula-data",
    "region": "equations",
    "story": "Bepaal a en b uit een tabel of grafiek en controleer de gegevens.",
    "type": "Leerdoel",
    "icon": "M5 42h50M10 42V22m40 20V22M10 25q20 24 40 0M20 33v9m10-6v6m10-9v9"
   },
   {
    "name": "Voorschrift uit een situatie",
    "skills": [
     "equation_from_context"
    ],
    "id": "formula-context",
    "region": "equations",
    "story": "Vertaal startwaarde en verandering naar een voorschrift. Controleer eenheden en domein.",
    "type": "Leerdoel",
    "icon": "M18 48V18h24v30M15 18l15-12 15 12M25 48V35h10v13M25 23h10v7"
   }
  ]
 }
];
// Context exercises are paused; historical proof and visit records stay intact.
for(const region of regions)region.places=region.places.filter(p=>p.id!=='formula-context');
const places=regions.flatMap(r=>r.places);
const allSkills=places.flatMap(p=>p.skills);
function data(state){
 if(!state.journey||state.journey.version!==1)state.journey={version:1,selected:'tower',visits:{},proof:{},active:null,last:null};
 const j=state.journey;
 if(j.selected==='formula-context')j.selected='formula-data';
 if(j.active?.place==='formula-context'){j.active.place='formula-data';j.active.targets=['equation_from_table','equation_from_graph'];j.active.draft=null;}
 j.visits ||= {};j.proof ||= {};
 if(j.layoutVersion!==2){j.region=places.find(p=>p.id===j.selected)?.region||j.region;j.layoutVersion=2;}
 if(!regions.some(r=>r.id===j.region))j.region=places.find(p=>p.id===j.selected)?.region||'points';
 if(!['atlas','area'].includes(j.view))j.view='atlas';
 // A chapter bookmark is navigation history, never an additional mastery score.
 // Migrate actual learning/visits; merely previewing a future map is not progress.
 if(!regions.some(r=>r.id===j.chapter)){
  const reached=regions.filter(r=>r.places.some(p=>j.visits[p.id]||j.active?.place===p.id||j.last?.place===p.id||p.skills.some(k=>state.skills[k]?.intro||state.skills[k]?.seen>0)));
  j.chapter=(reached.at(-1)||regions[0]).id;
 }
 return j;
}
function available(place,unlocked){return place.skills.some(k=>unlocked.includes(k))}
function missing(state,ready){return skills.filter(k=>!ready(state,k))}
function begin(state,place,mode,id,unlocked,ready){
 const j=data(state);
 if(j.active||state.session.answered!==0)return false;
 if(!['discover','camp','challenge'].includes(mode))return false;
 if(mode==='challenge'&&(missing(state,ready).length||!regions[0].places.some(p=>p.id===place)))return false;
 if(mode!=='challenge'&&mode!=='camp'&&!places.some(p=>p.id===place&&available(p,unlocked)))return false;
 const targets=skills.filter(k=>!j.proof[k]);
 j.active={id,place,mode,results:[],accessBefore:[...unlocked],targets:targets.length?targets:[...skills],draft:null};
 const destination=places.find(p=>p.id===place);
 if(mode==='discover'&&destination&&regions.findIndex(r=>r.id===destination.region)>regions.findIndex(r=>r.id===j.chapter))j.chapter=destination.region;
 j.selected=places.some(p=>p.id===place)?place:j.selected;j.last=null;j.region=places.find(p=>p.id===j.selected)?.region||'points';j.view='area';return true;
}
function learningSkill(state,pool,ready){
 // Keep moving within available content; scheduled reviews have their own slots.
 return pool.find(k=>!state.skills[k].intro)||pool.find(k=>!ready(state,k)&&!state.review.some(r=>r.skill===k&&r.kind==='repair'));
}
function choice(state,unlocked,ready=()=>true){
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
  const pool=(place?.skills||[]).filter(k=>unlocked.includes(k));
  const skill=learningSkill(state,pool,ready)||pool.sort((a,b)=>state.skills[a].strength-state.skills[b].strength||state.skills[a].lastSeen-state.skills[b].lastSeen)[0];
  if(skill)return {skill,kind:'learning-edge',intro:!state.skills[skill].intro};
 }
 if(ix===2&&a.mode!=='challenge'){
  const earlier=skills.slice(0,Math.max(1,skills.indexOf(place?.skills[0]))).filter(k=>unlocked.includes(k)&&state.skills[k].intro);
  earlier.sort((a,b)=>state.skills[a].lastSeen-state.skills[b].lastSeen);
  if(earlier.length)return {skill:earlier[0],kind:'journey-recall'};
 }
 if(a.mode==='camp')return null; // Keep historical mixed rounds compatible.
 // Fill the remaining slots locally. The global planner used to introduce
 // later chapters here, even while the learner was still at this stop.
 const local=(a.mode==='challenge'?skills:place?.skills||[]).filter(k=>unlocked.includes(k));
 const skill=learningSkill(state,local,ready)||[...local].sort((a,b)=>state.skills[a].lastSeen-state.skills[b].lastSeen||state.skills[a].strength-state.skills[b].strength)[0];
 if(skill)return {skill,kind:'practice',intro:!state.skills[skill].intro};
 return null; // Legacy mixed rounds can still use the global planner.
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
function finish(state,unlocked=[]){
 const j=data(state),a=j.active;if(!a)return;
 if(a.mode!=='camp')j.visits[a.place]=(j.visits[a.place]||0)+1;
 j.last={place:a.place,mode:a.mode,answered:a.results.length,independent:a.results.filter(r=>r.independent).length,passed:skills.every(k=>j.proof[k]),newSkills:a.accessBefore?unlocked.filter(k=>!a.accessBefore.includes(k)):[],practice:[...new Set(a.results.filter(r=>!r.independent).map(r=>r.skill))],independentSkills:[...new Set(a.results.filter(r=>r.independent).map(r=>r.skill))]};
 j.active=null;
}
// Presentation is derived from learning state, never from a second mastery score.
function due(state,unlocked){
 const items=(state.review||[]).filter(r=>unlocked.includes(r.skill)&&r.due<=state.total).map(r=>({...r}));
 for(const k of unlocked){const at=state.skills[k]?.refreshDue;if(at!=null&&at<=state.total&&!items.some(r=>r.skill===k))items.push({skill:k,kind:'refresh',due:at})}
 return items.sort((a,b)=>(a.kind==='repair'?0:1)-(b.kind==='repair'?0:1)||a.due-b.due);
}
function recommend(state,unlocked,ready,order=allSkills){
 const j=data(state),active=j.active;
 if(active)return {place:places.find(p=>p.id===active.place)||places[0],kind:'resume',reason:'Je hebt nog een ronde open. Je antwoorden blijven bewaard.'};
 let index=regions.findIndex(r=>r.id===j.chapter);
 const prepared=r=>r.places.every(p=>p.skills.every(k=>ready(state,k)));
 // Passing a chapter is one-way: a later repair never undoes that passage.
 while(index<regions.length-1&&prepared(regions[index])&&regions[index+1].places.some(p=>available(p,unlocked)))index++;
 const chapter=regions[index];j.chapter=chapter.id;
 const pool=order.filter(k=>unlocked.includes(k)&&chapter.places.some(p=>p.skills.includes(k)));
 const review=due(state,unlocked).find(r=>pool.includes(r.skill));
 let skill=learningSkill(state,pool,ready),kind='learn';
 // Stay in an unfinished chapter even when its current skill needs repair.
 if(!skill){skill=pool.find(k=>!ready(state,k));if(skill)kind='review'}
 if(!skill&&review){skill=review.skill;kind='review'}
 if(!skill){kind='maintain';skill=[...pool].sort((a,b)=>(state.skills[a]?.lastSeen??-999)-(state.skills[b]?.lastSeen??-999))[0]}
 const place=places.find(p=>p.skills.includes(skill))||chapter.places.find(p=>available(p,unlocked))||places[0];
 const previous=places.find(p=>p.id===j.last?.place),target=regions.findIndex(r=>r.id===place.region);
 const transition=previous&&regions.findIndex(r=>r.id===previous.region)<target;
 const reason=transition?`Verder naar hoofdstuk ${target+1}: ${regions[target].name}. Eerdere leerstof herhalen we tussendoor.`:kind==='review'?`Herhaling in hoofdstuk ${target+1}. Je behaalde voortgang blijft behouden.`:kind==='maintain'?'Je oefent nieuwe varianten. Eerdere leerstof herhalen we tussendoor.':`Je werkt verder in hoofdstuk ${target+1}. Herhaling uit eerdere hoofdstukken komt tussendoor; je blijft op deze plek in je reis.`;
 return {place,skill,kind,reason,transition:!!transition};
}

function status(state,place,unlocked,phase){
 const introduced=place.skills.some(k=>state.skills[k]?.intro),review=due(state,unlocked).some(r=>place.skills.includes(r.skill));
 return {open:available(place,unlocked),completed:!!state.journey?.visits?.[place.id],strong:place.skills.every(k=>phase(k)==='stevig'),introduced,review};
}
return {skills,allSkills,regions,places,data,available,missing,begin,choice,tag,result,finish,due,recommend,status};
});
