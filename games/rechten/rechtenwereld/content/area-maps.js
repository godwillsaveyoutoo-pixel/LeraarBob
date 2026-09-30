/* Presentation catalog. IDs mirror skills.json; this module never awards mastery. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../../core/wave-core.js'));else root.RechtenV2Areas=factory(root.RechtenWave)})(globalThis,function(W){
'use strict';
const node=(id,name,label,x,y,extra={})=>({key:id,id,name,label,x,y,...extra});
// Coordinates are percentages of the untrimmed 1536 × 1024 island art.
// Keep markers on its clearings; responsive label placement belongs in area-maps.css.
const areas={
 puntenbaai:{name:'Puntenbaai',caption:'Coördinaten en punten',intro:'Vind je plek. Zet je eerste punt.',art:'puntenbaai',zones:[{id:'route',name:'Rond de baai',nodes:[
  node('point','Coördinaten aflezen','Coördinaten<br>aflezen',30,48,{playable:true}),
  node('point_plot','Punt plaatsen','Punt<br>plaatsen',70,32,{playable:true})
 ]}]},
 hellingrug:{name:'Hellingrug',caption:'Richting en helling',intro:'Van basisverschil tot bergtop.',art:'hellingrug',zones:[{id:'route',name:'De klimroute',nodes:[
  node('delta','Δx en Δy','Δx en Δy',18,64,{playable:true}),
  node('slope','Helling uit Δy / Δx','Helling uit<br>Δy / Δx',35,49,{playable:true}),
  node('slope_from_two_points','Helling uit twee punten','Helling uit<br>twee punten',54,33,{playable:true}),
  node('line_behavior','Stijgend, dalend of constant','Stijgend, dalend<br>of constant',75,41,{playable:true}),
  node('special_lines','Bijzondere rechten','Bijzondere<br>rechten',90,19,{playable:true})
 ]}]},
 signaalstad:{name:'Signaalstad',caption:'Functies, grafieken en tabellen',intro:'Volg het signaal. Lees en controleer.',art:'signaalstad',zones:[{id:'route',name:'Het signaalnetwerk',nodes:[
  node('intercept','y-afsnede b aflezen','y-afsnede b<br>aflezen',18,30),
  node('ab','a en b herkennen','a en b<br>herkennen',39,30),
  node('fx','Functiewaarde f(x)','Bereken<br>f(x)',60,30),
  node('table','Tabel aanvullen','Tabel<br>aanvullen',81,30),
  node('input_from_output','Welke x hoort bij deze functiewaarde?','Welke x bij<br>deze f(x)?',73,61),
  node('point_on_line','Ligt dit punt op de rechte?','Punt op<br>de rechte?',50,61),
  node('graph_from_table','Rechte tekenen uit een tabel','Rechte tekenen<br>uit tabel',27,61,{playable:true})
 ]}]},
 formulewerf:{name:'Formulewerf',caption:'Voorschriften en representaties',intro:'Van de basisvorm naar zelf afleiden.',art:'formulewerf',zones:[{id:'bouwen',badge:'A',name:'Voorschrift en grafiek',intro:'Gebruik en herken de basisvorm y = ax + b. Daarna leid je zelf voorschriften af in werkplaats B.',nodes:[
  node('equation_from_ab','Voorschrift uit a en b','Voorschrift<br>uit a en b',26,31,{playable:true}),
  node('graph_from_equation','Rechte uit voorschrift','Rechte uit<br>voorschrift',75,40,{playable:true}),
  node('equation_from_graph','Voorschrift uit grafiek','Voorschrift<br>uit grafiek',68,66,{playable:true,entryPolicy:Object.freeze({difficultyLayers:Object.freeze([0,1]),readableSlope:true,visibleIntercept:true,requiresInterceptFromArbitraryPoint:false,requiresExtendedTwoPointCalculation:false})}),
  node('rewrite_linear_equation','Schrijf de vergelijking in de vorm y = ax + b','Vergelijking<br>herschrijven',33,66,{playable:true})
 ]},{id:'omzetten',badge:'B',name:'Zelf een voorschrift bepalen',intro:'Van de basisvorm naar zelf afleiden: eerst de parameters, daarna een volledig voorschrift en een context.',nodes:[
  node('intercept_from_point','b uit helling en punt','b uit a<br>en punt',26,31,{playable:true}),
  node('equation_from_point_slope','Voorschrift uit helling en punt','Voorschrift uit<br>helling en punt',50,25,{playable:true}),
  node('equation_from_two_points','Voorschrift uit twee punten','Voorschrift uit<br>twee punten',75,40,{playable:true}),
  node('equation_from_table','Voorschrift uit tabel','Voorschrift<br>uit tabel',68,66,{playable:true}),
  node('equation_from_context','Voorschrift uit context','Voorschrift<br>uit context',31,66,{culmination:true})
 ]}]},
 grenspas:{name:'Grenspas',caption:'Nulwaarden en tekens',intro:'Vind de grens. Ontdek het juiste gebied.',art:'grenspas',zones:[{id:'route',name:'De grensroute',nodes:[
  node('zeroRead','Nulwaarde aflezen','Nulwaarde<br>aflezen',21,26,{playable:true}),
  node('zero','Nulwaarde berekenen','Nulwaarde<br>berekenen',24,64,{playable:true}),
  node('sign','Wanneer is f(x) > 0?','Wanneer is<br>f(x) &gt; 0?',49,45,{key:'positive',variant:'positive',playable:true}),
  node('sign','Wanneer is f(x) < 0?','Wanneer is<br>f(x) &lt; 0?',74,26,{key:'negative',variant:'negative',playable:true}),
  node('signchart','Tekenschema','Tekenschema',83,66,{playable:true})
 ]}]}
};
for(const a of Object.values(areas)){let i=0;for(const z of a.zones){for(const n of z.nodes){n.number=++i;Object.freeze(n)}Object.freeze(z.nodes);Object.freeze(z)}Object.freeze(a.zones);Object.freeze(a)}Object.freeze(areas);
const canonical=id=>id==='puntbaai'?'puntenbaai':id;
const has=id=>Object.hasOwn(areas,canonical(id));
const get=id=>has(id)?areas[canonical(id)]:areas.grenspas;
const all=a=>a.zones.flatMap(z=>z.nodes);
function selection(state){const shell=state.settings?.shell||{},id=has(shell.area)?canonical(shell.area):'grenspas',area=get(id),zone=(id==='formulewerf'&&area.zones.find(z=>z.nodes.some(n=>n.key===shell.stop)))||area.zones.find(z=>z.id===shell.zone)||area.zones[0],stop=zone.nodes.find(n=>n.key===shell.stop);return {id,area,zone,stop}}
function positiveDone(state){const m=state.missions?.grenspas;return !!m?.completed||!!m?.completion?.some(c=>c.variant===0||c.variant===1)||!!state.events?.some(e=>e.skill==='sign'&&e.correct&&((e.variant===0&&e.attemptId?.startsWith('symbol:'))||(e.variant===1&&e.phase==='transfer')))}
function statuses(state,id,legacy,account){
 const a=get(id),nodes=all(a),raw=legacy?.state||legacy;
 let s=null;
 if(raw?.skills){s=W.migrate(raw);s.review||=[];s.skills||={};}
 const pointsDone=n=>id==='puntenbaai'&&(!!state.missions?.[n.id]?.completed||!!state.events?.some(e=>e.skill===n.id&&e.correct&&e.taskId?.startsWith('rechten-v2:puntenbaai:')&&/:5:run\d+$/.test(e.taskId)));
 const hillDone=n=>id==='hellingrug'&&n.playable&&(!!state.missions?.[n.id]?.completed||!!state.events?.some(e=>e.skill===n.id&&e.correct&&e.taskId?.startsWith('rechten-v2:hellingrug:')&&(n.id==='line_behavior'?/:8:run\d+$/:/:5:run\d+$/).test(e.taskId)&&e.attemptId?.startsWith(({delta:'hill-dy:',slope:'hill-rate:',slope_from_two_points:'hill-calculate:',line_behavior:'line-behavior:',special_lines:'line-special:'})[n.id])));
 const grensDone=n=>id==='grenspas'&&(!!state.missions?.[n.key]?.completed||!!state.events?.some(e=>e.correct&&e.taskId?.startsWith('rechten-v2:grenspas:'+n.key+':')&&/:5:run\d+$/.test(e.taskId)&&e.attemptId?.startsWith(n.id==='sign'?'grens-inequality:':n.id==='signchart'?'grens-chart:':'grens-zero:')));
 const formulaDone=n=>(id==='formulewerf'||id==='signaalstad'&&n.id==='graph_from_table')&&n.playable&&(!!state.missions?.[n.id]?.completed||!!state.events?.some(e=>e.correct&&e.skill===n.id&&e.taskId?.startsWith('rechten-v2:'+id+':'+n.id+':')&&/:5:run\d+$/.test(e.taskId)&&e.attemptId?.startsWith(({graph_from_table:'formula-plot:',equation_from_ab:'formula-build:',graph_from_equation:'formula-plot:',equation_from_graph:'formula-read:',rewrite_linear_equation:'formula-rewrite:',intercept_from_point:'derive-intercept:',equation_from_point_slope:'derive-formula:',equation_from_two_points:'derive-formula:',equation_from_table:'derive-formula:'})[n.id])));
 const completed=n=>formulaDone(n)||grensDone(n)||hillDone(n)||pointsDone(n)|| (n.key==='positive'?positiveDone(state)||!!(s&&W.ready(s,n.id)):n.id==='zeroRead'?!!state.events?.some(e=>e.skill==='zeroRead'&&e.correct&&!e.taskId?.startsWith('rechten-v2:grenspas:'))||!!(s&&W.ready(s,n.id)):!!(s&&W.ready(s,n.id)));
 const released=n=>!!n.playable;
 const open=unlocked(state,id,legacy,account);
 const available=n=>open&&released(n);
 const started=n=>{const m=state.missions?.[n.key];return !!m&&m.world===id&&!m.completed};
 const recommended=nodes.find(n=>available(n)&&!completed(n)&&started(n)&&n.key===state.active)||nodes.find(n=>available(n)&&!completed(n)&&started(n))||nodes.find(n=>available(n)&&!completed(n))||null;
 const playableTotal=nodes.filter(released).length,playableCompleted=nodes.filter(n=>released(n)&&completed(n)).length;
 return {recommended,completed:nodes.filter(completed).length,total:nodes.length,playableTotal,playableCompleted,complete:playableTotal>0&&playableTotal===playableCompleted,priorKnowledge:id==='puntenbaai',unlocked:open,prerequisite:prerequisite[id]||null,nodes:nodes.map(n=>({...n,started:started(n),recommended:n===recommended,state:completed(n)?'completed':!released(n)?'soon':!open?'locked':started(n)?'started':n===recommended?'current':'available'}))};
}
// Puntenbaai is optional prior knowledge. Hellingrug is the first required world;
// each later world opens only after the previous required world is complete.
// Existing work in a later world is grandfathered so an older save is never stranded.
const routeOrder=Object.freeze(['hellingrug','grenspas','formulewerf','signaalstad']);
const prerequisite=Object.freeze({grenspas:'hellingrug',formulewerf:'grenspas',signaalstad:'formulewerf'});
function legacyTouched(id,legacy){
 const raw=legacy?.state||legacy;if(!raw)return false;
 const ids=new Set(all(get(id)).filter(n=>n.playable).map(n=>n.id));
 if(Array.isArray(raw.access)&&raw.access.some(skill=>ids.has(skill)))return true;
 if(!raw.skills)return false;
 const migrated=W.migrate(raw);migrated.review||=[];migrated.skills||={};
 return all(get(id)).some(n=>n.playable&&W.ready(migrated,n.id));
}
function touched(state,id,legacy){
 return Object.values(state.missions||{}).some(m=>m?.world===id)||
  (state.events||[]).some(e=>String(e?.taskId||'').startsWith('rechten-v2:'+id+':'))||legacyTouched(id,legacy);
}
function unlocked(state,id,legacy,account){
 if(account?.role==='teacher')return true;
 id=canonical(id);
 if(id==='puntenbaai'||id==='hellingrug'||!prerequisite[id])return true;
 if(touched(state,id,legacy))return true;
 return statuses(state,prerequisite[id],legacy).complete;
}
function recommendation(state,legacy,account){
 const active=state.missions?.[state.active];
 const result=(id,node,resume=false)=>({id,node,resume,zone:get(id).zones.find(z=>z.nodes.some(n=>n.key===node?.key))?.id||get(id).zones[0].id});
 if(active&&!active.completed&&unlocked(state,active.world,legacy,account)){const summary=statuses(state,active.world,legacy,account),node=summary.nodes.find(n=>n.key===state.active&&n.playable&&n.state!=='locked');if(node)return result(active.world,node,true)}
 for(const id of routeOrder){const summary=statuses(state,id,legacy,account);if(summary.unlocked&&summary.recommended)return result(id,summary.recommended,summary.nodes.find(n=>n.key===summary.recommended.key).started)}
 return result('hellingrug',null);
}

function locationState(source,screen,{area,zone,stop}={}){
 const next=JSON.parse(JSON.stringify(source)),old=selection(source),id=has(area)?canonical(area):old.id,a=get(id),z=(screen==='stop'&&id==='formulewerf'&&a.zones.find(z=>z.nodes.some(n=>n.key===stop)))||a.zones.find(z=>z.id===(zone||(!area||id===old.id?old.zone.id:null)))||a.zones[0];
 next.settings.shell={...next.settings.shell,area:['area','stop'].includes(screen)?id:null,zone:z.id,stop:screen==='stop'&&z.nodes.some(n=>n.key===stop)?stop:null};
 next.screen=['area','stop'].includes(screen)?'world':screen;return next;
}
function hash(state){const {id,zone,stop}=selection(state);if(state.screen==='world'&&state.settings?.shell?.area)return '#'+id+(get(id).zones.length>1?'/'+zone.id:'')+(stop?'/halte/'+stop.key:'');return {world:'#wereld',mission:'#oefenen',book:'#voortgang',profile:'#profiel'}[state.screen]||'#wereld'}
function fromHash(source,hash){const parts=hash.replace(/^#/,'').split('/'),id=canonical(parts[0]);if(has(id)){const a=get(id),zone=a.zones.find(z=>z.id===parts[1])||a.zones[0],stop=parts[parts.indexOf('halte')+1];return locationState(source,parts.includes('halte')&&(id==='formulewerf'?all(a):zone.nodes).some(n=>n.key===stop)?'stop':'area',{area:id,zone:zone.id,stop})}const screen={'wereld':'world','voortgang':'book','profiel':'profile'}[parts[0]];return screen?locationState(source,screen):locationState(source,'world')}
return Object.freeze({areas,get,all,selection,statuses,routeOrder,prerequisite,unlocked,recommendation,locationState,hash,fromHash});
});
